import pandas as pd
import numpy as np
import sys
import os

# Set up paths to allow importing api
sys.path.append(os.getcwd())

# Mock data
df = pd.DataFrame({
    'product_name': ['A', 'B', 'C'],
    'selling_price': [10, 20, 30],
    'current_stock': [100, 50, 0]
})

try:
    print("Testing analyze_inventory_data...")
    from api import analyze_inventory_data
    result = analyze_inventory_data(df)
    print("Success!")
    print(result['summary'])
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
