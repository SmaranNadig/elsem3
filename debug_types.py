import pandas as pd
m = pd.read_csv('data/synthetic dataset/sku_master.csv')
s = pd.read_csv('data/synthetic dataset/seasonal_sales_history.csv')
print(f"Master SKU type: {m['sku_id'].dtype}")
print(f"Sales SKU type: {s['sku_id'].dtype}")
print(f"First 5 Master IDs: {m['sku_id'].head().tolist()}")
print(f"First 5 Sales IDs: {s['sku_id'].head().tolist()}")

# Check if any match
master_id = str(m['sku_id'].iloc[0])
sales_ids = s['sku_id'].astype(str).unique()
print(f"Is {master_id} in Sales? {master_id in sales_ids}")
