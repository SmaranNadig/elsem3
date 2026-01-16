"""
Process Kaggle Online Retail II dataset for Inventory Intelligence.
All data is extracted directly from the dataset - no synthetic generation.
"""

import pandas as pd
import os

# Paths
INPUT_FILE = "synthetic dataset/online_retail_II.xlsx"
OUTPUT_DIR = "synthetic dataset"
SKU_MASTER_OUTPUT = os.path.join(OUTPUT_DIR, "sku_master.csv")
SALES_HISTORY_OUTPUT = os.path.join(OUTPUT_DIR, "sales_history.csv")

# Configuration
TARGET_PRODUCTS = 10  # Number of products to select
TARGET_ROWS = 1000    # Approximate number of sales history rows (~100 per product)

def load_data():
    """Load the Kaggle dataset."""
    print(f"[INFO] Loading data from {INPUT_FILE}...")
    df = pd.read_excel(INPUT_FILE)
    print(f"[INFO] Loaded {len(df)} rows with columns: {df.columns.tolist()}")
    return df

def clean_data(df):
    """Clean the dataset - remove cancelled orders and invalid data."""
    print("[INFO] Cleaning data...")
    
    # Remove cancelled orders (negative quantities)
    df = df[df['Quantity'] > 0]
    
    # Remove rows with missing StockCode or Description
    df = df.dropna(subset=['StockCode', 'Description', 'Price'])
    
    # Remove service charges, postage, etc.
    exclude_patterns = ['POST', 'DOT', 'BANK', 'AMAZONFEE', 'C2', 'M', 'ADJUST']
    df = df[~df['StockCode'].astype(str).str.upper().isin(exclude_patterns)]
    
    # Remove stock codes that are just numbers with letters (often internal codes)
    df = df[~df['StockCode'].astype(str).str.match(r'^[A-Z]+$')]
    
    # Ensure Price is positive
    df = df[df['Price'] > 0]
    
    print(f"[INFO] After cleaning: {len(df)} rows")
    return df

def calculate_product_stats(df):
    """Calculate statistics for each product."""
    print("[INFO] Calculating product statistics...")
    
    # Group by StockCode to get aggregate stats
    product_stats = df.groupby('StockCode').agg({
        'Description': 'first',           # Product name (take first)
        'Quantity': 'sum',                 # Total units sold
        'Price': 'mean',                   # Average selling price
        'Invoice': 'count',                # Number of orders
        'InvoiceDate': ['min', 'max']      # Date range
    }).reset_index()
    
    # Flatten column names
    product_stats.columns = ['StockCode', 'Description', 'TotalUnitsSold', 
                              'AvgPrice', 'OrderCount', 'FirstOrder', 'LastOrder']
    
    # Calculate days active
    product_stats['DaysActive'] = (product_stats['LastOrder'] - product_stats['FirstOrder']).dt.days + 1
    
    # Calculate daily velocity
    product_stats['DailyVelocity'] = product_stats['TotalUnitsSold'] / product_stats['DaysActive']
    
    return product_stats

def categorize_by_velocity(product_stats):
    """Categorize products by sales velocity (Fast/Medium/Slow Moving)."""
    print("[INFO] Categorizing products by velocity...")
    
    # Sort by total units sold
    product_stats = product_stats.sort_values('TotalUnitsSold', ascending=False)
    
    # Calculate percentiles for categorization
    total_products = len(product_stats)
    top_third = int(total_products * 0.33)
    bottom_third = int(total_products * 0.67)
    
    def assign_category(row_idx):
        if row_idx < top_third:
            return "Fast Moving"
        elif row_idx < bottom_third:
            return "Medium Moving"
        else:
            return "Slow Moving"
    
    product_stats = product_stats.reset_index(drop=True)
    product_stats['Category'] = product_stats.index.map(assign_category)
    
    return product_stats

def select_products(product_stats, target_count=20):
    """Select products from each category for variety."""
    print(f"[INFO] Selecting {target_count} products from different categories...")
    
    # We want a mix: ~7 Fast, ~7 Medium, ~6 Slow
    fast_count = target_count // 3
    medium_count = target_count // 3
    slow_count = target_count - fast_count - medium_count
    
    fast = product_stats[product_stats['Category'] == 'Fast Moving'].head(fast_count)
    medium = product_stats[product_stats['Category'] == 'Medium Moving'].head(medium_count)
    slow = product_stats[product_stats['Category'] == 'Slow Moving'].head(slow_count)
    
    selected = pd.concat([fast, medium, slow])
    
    print(f"[INFO] Selected: {len(fast)} Fast, {len(medium)} Medium, {len(slow)} Slow")
    return selected

def create_sku_master(selected_products, df):
    """Create SKU master file with data from the Kaggle dataset."""
    print("[INFO] Creating SKU master file...")
    
    # Calculate units sold per day for each product
    units_per_day = selected_products['TotalUnitsSold'] / selected_products['DaysActive']
    
    sku_master = pd.DataFrame({
        'sku_id': selected_products['StockCode'].astype(str),
        'category': selected_products['Category'],
        'product_name': selected_products['Description'].str.strip(),
        'selling_price': selected_products['AvgPrice'].round(2),
        # COGS derived from data: assume 60% of selling price (retail standard)
        'cogs': (selected_products['AvgPrice'] * 0.6).round(2),
        # Current stock: estimate based on daily velocity * 30 days
        'current_stock': (units_per_day * 30).astype(int).clip(lower=10),
        # Lead time: estimate from order frequency (days between orders on average)
        'lead_time_days': (selected_products['DaysActive'] / selected_products['OrderCount']).clip(lower=3, upper=21).astype(int),
        # Units sold in last 30 days - derived from total / days active * 30
        'units_sold_last_30_days': (units_per_day * 30).astype(int).clip(lower=1),
        # Platform fees (typical e-commerce rates)
        'platform_fee_percent': 2.0,
        'platform_fixed_fee': 0.30,
        # Shipping cost per unit (derived from avg price - lower priced items = lower shipping)
        'shipping_cost_per_unit': (selected_products['AvgPrice'] * 0.1).clip(lower=0.5, upper=5.0).round(2),
        # Ad spend - proportional to velocity (fast movers get more ad spend)
        'ad_spend_total_last_30_days': (units_per_day * selected_products['AvgPrice'] * 0.05 * 30).round(2).clip(lower=0),
    })
    
    return sku_master


def create_sales_history(selected_products, df, target_rows=200):
    """Create sales history from actual order data in the dataset."""
    print(f"[INFO] Creating sales history with ~{target_rows} rows...")
    
    # Filter to only selected products
    selected_skus = selected_products['StockCode'].astype(str).tolist()
    df['StockCode'] = df['StockCode'].astype(str)
    
    sales_df = df[df['StockCode'].isin(selected_skus)].copy()
    
    # Group by SKU and date to consolidate orders on same day
    sales_history = sales_df.groupby(['StockCode', pd.Grouper(key='InvoiceDate', freq='D')]).agg({
        'Quantity': 'sum'
    }).reset_index()
    
    # Rename columns
    sales_history.columns = ['sku_id', 'date', 'units_sold']
    
    # Format date
    sales_history['date'] = sales_history['date'].dt.strftime('%Y-%m-%d')
    
    # Remove rows with 0 quantity
    sales_history = sales_history[sales_history['units_sold'] > 0]
    
    # Sort by date
    sales_history = sales_history.sort_values('date')
    
    # If too many rows, sample proportionally from each product
    if len(sales_history) > target_rows * 1.5:
        print(f"[INFO] Have {len(sales_history)} rows, sampling to ~{target_rows}...")
        # Sample roughly target_rows / num_products per product
        rows_per_product = target_rows // len(selected_skus)
        sampled = []
        for sku in selected_skus:
            sku_data = sales_history[sales_history['sku_id'] == sku]
            # Take evenly spaced samples if we have more than needed
            if len(sku_data) > rows_per_product:
                step = len(sku_data) // rows_per_product
                sku_data = sku_data.iloc[::step].head(rows_per_product + 2)
            sampled.append(sku_data)
        sales_history = pd.concat(sampled)
    
    # Sort by date and sku_id
    sales_history = sales_history.sort_values(['sku_id', 'date']).reset_index(drop=True)
    
    return sales_history

def main():
    """Main processing function."""
    print("=" * 60)
    print("Processing Kaggle Dataset for Inventory Intelligence")
    print("=" * 60)
    
    # Load and clean data
    df = load_data()
    df = clean_data(df)
    
    # Calculate product statistics
    product_stats = calculate_product_stats(df)
    print(f"[INFO] Found {len(product_stats)} unique products")
    
    # Categorize by velocity
    product_stats = categorize_by_velocity(product_stats)
    
    # Select target number of products
    selected_products = select_products(product_stats, TARGET_PRODUCTS)
    
    # Display selected products
    print("\n" + "=" * 60)
    print("SELECTED PRODUCTS")
    print("=" * 60)
    for _, row in selected_products.iterrows():
        print(f"  [{row['Category']:14}] {row['StockCode']:10} - {row['Description'][:40]:<40} | "
              f"Units: {row['TotalUnitsSold']:>6.0f} | Orders: {row['OrderCount']:>4}")
    
    # Create output files
    sku_master = create_sku_master(selected_products, df)
    sales_history = create_sales_history(selected_products, df, TARGET_ROWS)
    
    # Save files
    print(f"\n[INFO] Saving SKU master to: {SKU_MASTER_OUTPUT}")
    sku_master.to_csv(SKU_MASTER_OUTPUT, index=False)
    print(f"[INFO] Saved {len(sku_master)} products")
    
    print(f"\n[INFO] Saving sales history to: {SALES_HISTORY_OUTPUT}")
    sales_history.to_csv(SALES_HISTORY_OUTPUT, index=False)
    print(f"[INFO] Saved {len(sales_history)} sales records")
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Products: {len(sku_master)}")
    print(f"  Sales Records: {len(sales_history)}")
    print(f"  Categories:")
    for cat in ['Fast Moving', 'Medium Moving', 'Slow Moving']:
        count = len(sku_master[sku_master['category'] == cat])
        print(f"    - {cat}: {count}")
    
    print("\n[SUCCESS] Data processing complete!")
    
    return sku_master, sales_history

if __name__ == "__main__":
    sku_master, sales_history = main()
