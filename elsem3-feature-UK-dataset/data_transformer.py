"""
Data Transformer - Unified data format for Shopify and Kaggle data sources.

This module provides:
1. Common schema definition for pipeline input
2. Transformation functions for different data sources
3. Seasonal sales history simulation
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

# ============================================================================
# UNIFIED SCHEMA - Target format for all data sources
# ============================================================================

UNIFIED_SKU_COLUMNS = [
    'sku_id',                       # Unique product identifier
    'category',                     # Product category (Fast/Medium/Slow Moving)
    'product_name',                 # Product description
    'selling_price',                # Unit selling price
    'cogs',                         # Cost of goods sold (per unit)
    'current_stock',                # Current inventory level
    'lead_time_days',               # Days to restock
    'units_sold_last_30_days',      # Sales in last 30 days
    'platform_fee_percent',         # Platform fee (%)
    'platform_fixed_fee',           # Fixed platform fee per transaction
    'shipping_cost_per_unit',       # Shipping cost per unit
    'ad_spend_total_last_30_days',  # Ad spend in last 30 days
]

UNIFIED_SALES_COLUMNS = [
    'sku_id',       # Product identifier
    'date',         # Sale date (YYYY-MM-DD)
    'units_sold',   # Units sold on that day
]

# Seasonal indices (derived from retail patterns - similar to Kaggle data)
# These represent typical retail seasonality
SEASONAL_INDICES = {
    1: 0.85,   # January - post-holiday slump
    2: 0.80,   # February - slow
    3: 0.90,   # March - spring uptick
    4: 0.95,   # April
    5: 1.00,   # May
    6: 1.05,   # June - summer
    7: 1.00,   # July
    8: 0.95,   # August - back to school
    9: 1.10,   # September
    10: 1.15,  # October - pre-holiday
    11: 1.30,  # November - holiday sales
    12: 1.50,  # December - peak season
}

# Day of week indices (weekend boost for retail)
DOW_INDICES = {
    0: 0.90,  # Monday
    1: 0.95,  # Tuesday
    2: 1.00,  # Wednesday
    3: 1.05,  # Thursday
    4: 1.10,  # Friday
    5: 1.15,  # Saturday
    6: 1.00,  # Sunday
}


# ============================================================================
# SEASONAL SALES SIMULATION
# ============================================================================

def simulate_seasonal_sales(
    sku_id: str,
    daily_velocity: float,
    days: int = 90,
    end_date: Optional[datetime] = None
) -> pd.DataFrame:
    """
    Generate realistic seasonal sales history for a product.
    
    Args:
        sku_id: Product identifier
        daily_velocity: Average units sold per day
        days: Number of days of history to generate
        end_date: End date for the history (default: today)
    
    Returns:
        DataFrame with columns: sku_id, date, units_sold
    """
    if end_date is None:
        end_date = datetime.now()
    
    rows = []
    for i in range(days, 0, -1):
        date = end_date - timedelta(days=i)
        
        # Apply seasonal index
        month = date.month
        seasonal_multiplier = SEASONAL_INDICES.get(month, 1.0)
        
        # Apply day-of-week index
        dow = date.weekday()
        dow_multiplier = DOW_INDICES.get(dow, 1.0)
        
        # Random variation (±30%)
        random_variation = np.random.uniform(0.7, 1.3)
        
        # Calculate units sold
        units = daily_velocity * seasonal_multiplier * dow_multiplier * random_variation
        units = max(0, int(round(units)))
        
        if units > 0:  # Only add rows with sales
            rows.append({
                'sku_id': sku_id,
                'date': date.strftime('%Y-%m-%d'),
                'units_sold': units
            })
    
    return pd.DataFrame(rows)


def generate_sales_history_for_products(
    df_master: pd.DataFrame,
    days: int = 90
) -> pd.DataFrame:
    """
    Generate seasonal sales history for all products in master DataFrame.
    
    Args:
        df_master: SKU master DataFrame with 'sku_id' and 'units_sold_last_30_days'
        days: Number of days of history to generate
    
    Returns:
        DataFrame with sales history for all products
    """
    all_sales = []
    
    for _, row in df_master.iterrows():
        sku_id = str(row['sku_id'])
        
        # Calculate daily velocity from units_sold_last_30_days if available
        if 'units_sold_last_30_days' in row and row['units_sold_last_30_days'] > 0:
            daily_velocity = row['units_sold_last_30_days'] / 30
        elif 'current_stock' in row:
            # Estimate from stock level (assume stock covers ~30 days)
            daily_velocity = max(1, row['current_stock'] / 30)
        else:
            daily_velocity = 5  # Default fallback
        
        sales_df = simulate_seasonal_sales(sku_id, daily_velocity, days)
        all_sales.append(sales_df)
    
    if all_sales:
        return pd.concat(all_sales, ignore_index=True)
    return pd.DataFrame(columns=UNIFIED_SALES_COLUMNS)


# ============================================================================
# SHOPIFY DATA TRANSFORMATION
# ============================================================================

def transform_shopify_data(
    products: List[Dict],
    orders: Optional[List[Dict]] = None
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Transform Shopify product/order data to unified format.
    
    Args:
        products: List of Shopify product dictionaries
        orders: Optional list of Shopify order dictionaries
    
    Returns:
        Tuple of (df_master, df_sales) in unified format
    """
    sku_rows = []
    
    for product in products:
        product_id = product.get('id', 'unknown')
        product_title = product.get('title', 'Unknown Product')
        product_type = product.get('product_type', 'General')
        
        variants = product.get('variants', [])
        if not variants:
            continue
        
        for variant in variants:
            # Extract data from Shopify format
            selling_price = float(variant.get('price', 0))
            inventory_qty = int(variant.get('inventory_quantity', 0))
            sku = variant.get('sku') or f"SHOP-{product_id}-{variant.get('id', 'v')}"
            
            # Derive variant name
            variant_title = variant.get('title', '')
            full_name = product_title
            if variant_title and variant_title != 'Default Title':
                full_name = f"{product_title} - {variant_title}"
            
            # Estimate velocity from inventory (assume stock covers 30 days)
            estimated_velocity = max(1, inventory_qty / 30)
            units_30d = int(estimated_velocity * 30)
            
            # Categorize by velocity
            if estimated_velocity >= 10:
                category = "Fast Moving"
            elif estimated_velocity >= 3:
                category = "Medium Moving"
            else:
                category = "Slow Moving"
            
            sku_rows.append({
                'sku_id': sku,
                'category': category,
                'product_name': full_name,
                'selling_price': round(selling_price, 2),
                'cogs': round(selling_price * 0.6, 2),  # 40% margin assumption
                'current_stock': inventory_qty,
                'lead_time_days': 7,  # Default lead time
                'units_sold_last_30_days': units_30d,
                'platform_fee_percent': 2.0,
                'platform_fixed_fee': 0.30,
                'shipping_cost_per_unit': min(5.0, max(0.5, selling_price * 0.1)),
                'ad_spend_total_last_30_days': round(units_30d * selling_price * 0.05, 2),
            })
    
    df_master = pd.DataFrame(sku_rows, columns=UNIFIED_SKU_COLUMNS)
    
    # Generate simulated sales history
    df_sales = generate_sales_history_for_products(df_master, days=90)
    
    return df_master, df_sales


def transform_inventory_bin_csv(filepath: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Transform Shopify inventory bin CSV export to unified format.
    
    Args:
        filepath: Path to the inventory bin CSV file
    
    Returns:
        Tuple of (df_master, df_sales) in unified format
    """
    df = pd.read_csv(filepath)
    
    sku_rows = []
    
    for _, row in df.iterrows():
        handle = str(row.get('Handle', ''))
        title = str(row.get('Title', 'Unknown Product'))
        sku = str(row.get('SKU', '')) or f"INV-{handle}"
        
        # Get stock level
        on_hand = int(row.get('On hand (current)', 0))
        available = int(row.get('Available (not editable)', on_hand))
        
        # Build variant description
        option_parts = []
        for i in range(1, 4):
            opt_name = row.get(f'Option{i} Name')
            opt_value = row.get(f'Option{i} Value')
            if pd.notna(opt_name) and pd.notna(opt_value):
                option_parts.append(f"{opt_value}")
        
        full_name = title
        if option_parts:
            full_name = f"{title} ({', '.join(option_parts)})"
        
        # Estimate price from title (or use default)
        # In real scenario, price would come from Shopify products API
        estimated_price = 15.0  # Default
        
        # Estimate velocity from stock
        estimated_velocity = max(1, on_hand / 30)
        units_30d = int(estimated_velocity * 30)
        
        # Categorize
        if estimated_velocity >= 10:
            category = "Fast Moving"
        elif estimated_velocity >= 3:
            category = "Medium Moving"
        else:
            category = "Slow Moving"
        
        sku_rows.append({
            'sku_id': sku if sku != 'nan' else f"INV-{handle}",
            'category': category,
            'product_name': full_name,
            'selling_price': estimated_price,
            'cogs': round(estimated_price * 0.6, 2),
            'current_stock': on_hand,
            'lead_time_days': 7,
            'units_sold_last_30_days': units_30d,
            'platform_fee_percent': 2.0,
            'platform_fixed_fee': 0.30,
            'shipping_cost_per_unit': 1.5,
            'ad_spend_total_last_30_days': round(units_30d * estimated_price * 0.05, 2),
        })
    
    df_master = pd.DataFrame(sku_rows, columns=UNIFIED_SKU_COLUMNS)
    df_sales = generate_sales_history_for_products(df_master, days=90)
    
    return df_master, df_sales


# ============================================================================
# KAGGLE DATA (already processed by process_kaggle_data.py)
# ============================================================================

def load_kaggle_data(
    sku_master_path: str = "synthetic dataset/sku_master.csv",
    sales_history_path: str = "synthetic dataset/sales_history.csv"
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load pre-processed Kaggle data in unified format.
    
    Returns:
        Tuple of (df_master, df_sales)
    """
    df_master = pd.read_csv(sku_master_path)
    df_sales = pd.read_csv(sales_history_path)
    
    # Ensure all required columns exist
    for col in UNIFIED_SKU_COLUMNS:
        if col not in df_master.columns:
            df_master[col] = 0
    
    return df_master[UNIFIED_SKU_COLUMNS], df_sales


# ============================================================================
# MAIN - Test transformations
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Data Transformer")
    print("=" * 60)
    
    # Test inventory bin transformation
    inv_bin_path = "synthetic dataset/inventory_bin_new_on_hand_template.csv"
    try:
        df_master, df_sales = transform_inventory_bin_csv(inv_bin_path)
        print(f"\n[Inventory Bin] Master: {len(df_master)} SKUs, Sales: {len(df_sales)} records")
        print(f"Columns: {df_master.columns.tolist()}")
        print(f"\nSample:\n{df_master.head().to_string()}")
    except Exception as e:
        print(f"[ERROR] Inventory bin: {e}")
    
    # Test Kaggle data loading
    try:
        df_master_k, df_sales_k = load_kaggle_data()
        print(f"\n[Kaggle] Master: {len(df_master_k)} SKUs, Sales: {len(df_sales_k)} records")
        print(f"Columns: {df_master_k.columns.tolist()}")
    except Exception as e:
        print(f"[ERROR] Kaggle: {e}")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Data transformer ready")
