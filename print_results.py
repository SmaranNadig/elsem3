import pandas as pd
df = pd.read_csv('seasonal_analysis_results.csv')
print("--- SEASONAL ANALYSIS RESULTS ---")
for _, row in df.iterrows():
    print(f"{row['product_name']}: Strength={row['seasonality_strength']}, NextIdx={row['seasonal_index_next']}")
