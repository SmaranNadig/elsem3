import pandas as pd

df = pd.read_csv('data/agent_recommendations.csv')

print("=" * 100)
print("RISK ANALYSIS RESULTS - Using shopify_analysis.csv")
print("=" * 100)
print(f"\nTotal SKUs Analyzed: {len(df)}")
print(f"\nRisk Distribution:")
for level, count in df['risk_level'].value_counts().items():
    emoji = {"CRITICAL": "🔴", "WARNING": "⚠️", "SAFE": "✅", "NO_HISTORY": "❓"}.get(level, "")
    print(f"  {emoji} {level}: {count}")

print(f"\n\n{'='*100}")
print("DETAILED PRODUCT ANALYSIS")
print("=" * 100)

for idx, row in df.iterrows():
    profit = row['profit_per_unit']
    status = "🔴 LOSING MONEY!" if profit < 0 else ""
    print(f"\n{row['sku_id']} - {row['product_name']}")
    print(f"  Profit/Unit: ₹{profit:.2f} {status}")
    print(f"  Risk Level: {row['risk_level']}")
    print(f"  Action: {row['recommended_action']}")
    print(f"  Stock Days Left: {row['days_of_stock_left']:.1f}")
