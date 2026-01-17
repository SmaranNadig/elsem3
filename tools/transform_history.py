import pandas as pd
import os

# Paths
PATHS = [
    r"c:\Users\nadig\OneDrive\Desktop\eltesting\data\synthetic dataset\seasonal_sales_history.csv",
]
MASTER_PATH = r"c:\Users\nadig\OneDrive\Desktop\eltesting\data\synthetic dataset\sku_master.csv"

def transform_history():
    print("[INFO] Loading master dataset...")
    df_master = pd.read_csv(MASTER_PATH)
    name_map = dict(zip(df_master['sku_id'].astype(str), df_master['product_name']))
    
    for path in PATHS:
        if not os.path.exists(path):
            print(f"[SKIP] File not found: {path}")
            continue
            
        print(f"[INFO] Transforming: {path}")
        df_history = pd.read_csv(path)
        
        # Ensure sku_id in history is string for matching
        df_history['sku_id'] = df_history['sku_id'].astype(str)
        
        print(f"  - Adding product names for {len(df_history)} rows...")
        df_history['product_name'] = df_history['sku_id'].map(name_map)
        
        print("  - Processing date components...")
        df_history['date'] = pd.to_datetime(df_history['date'])
        df_history['month'] = df_history['date'].dt.month
        df_history['day_of_week'] = df_history['date'].dt.day_name()
        df_history['is_weekend'] = df_history['date'].dt.dayofweek.apply(lambda x: 1 if x >= 5 else 0)
        
        # Reorder columns as requested
        cols = ['sku_id', 'product_name', 'date', 'units_sold', 'month', 'day_of_week', 'is_weekend']
        df_history = df_history[cols]
        
        # Convert date back to string format
        df_history['date'] = df_history['date'].dt.strftime('%Y-%m-%d')
        
        df_history.to_csv(path, index=False)
        print(f"[SUCCESS] Updated {path}")


if __name__ == "__main__":
    transform_history()
