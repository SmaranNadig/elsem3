import pandas as pd
s = pd.read_csv('data/synthetic dataset/seasonal_sales_history.csv')
s['month_year'] = pd.to_datetime(s['date']).dt.to_period('M')
counts = s.groupby('product_name')['month_year'].nunique()
for name, count in counts.items():
    print(f"{name}: {count} months")
