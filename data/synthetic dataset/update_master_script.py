import pandas as pd
import numpy as np

# Paths
sku_master_path = "data/synthetic dataset/sku_master.csv"
shopify_analysis_path = "data/synthetic dataset/shopify _analysis.csv"

def update_sku_master():
    # Load data
    df_master = pd.read_csv(sku_master_path)
    df_shopify = pd.read_csv(shopify_analysis_path)
    
    # Calculate 90-day sales from shopify analysis
    sales_90d = df_shopify.groupby("sku_id")["units_sold"].sum().to_dict()
    
    # Rename columns in master
    df_master = df_master.rename(columns={
        "units_sold_last_30_days": "units_sold_last_90_days",
        "ad_spend_total_last_30_days": "ad_spend_total_last_90_days"
    })
    
    # Update values
    for idx, row in df_master.iterrows():
        sku_id = row["sku_id"]
        
        # Update units sold (if in shopify analysis, else 0)
        units = sales_90d.get(sku_id, 0)
        df_master.at[idx, "units_sold_last_90_days"] = units
        
        # Update ad spend (scale old value by 3 for 3 months)
        old_ad_spend = row.get("ad_spend_total_last_30_days", 0) 
        # Wait, I already renamed it.
        # Let's get the original value before renaming if possible, or just use what's there.
        # Actually, df_master currently has 'ad_spend_total_last_90_days' which has the OLD 30-day values.
        df_master.at[idx, "ad_spend_total_last_90_days"] = row["ad_spend_total_last_90_days"] * 3
        
        # Update stock to be "realistic" based on demand
        # Set stock between 2x and 4x of 3-month demand, minimum 50
        realistic_stock = max(50, int(units * np.random.uniform(1.5, 3.0)))
        df_master.at[idx, "current_stock"] = realistic_stock
        
    # Save updated master
    df_master.to_csv(sku_master_path, index=False)
    print(f"[SUCCESS] Updated {sku_master_path} with 90-day data and realistic stock.")

if __name__ == "__main__":
    update_sku_master()
