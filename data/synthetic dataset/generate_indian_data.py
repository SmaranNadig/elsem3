import csv
import random
from datetime import datetime, timedelta

products = [
    {"sku_id": "SKU101", "name": "Skeleton science embroidery sweatshirt", "price": 1699, "category": "Sweatshirt", "seasonality": "winter"},
    {"sku_id": "SKU102", "name": "Kross Coord set", "price": 1699, "category": "Coord Set", "seasonality": "summer"},
    {"sku_id": "SKU103", "name": "Studio Coord Set", "price": 999, "category": "Coord Set", "seasonality": "summer"},
    {"sku_id": "SKU104", "name": "West Coast Coord Set", "price": 1599, "category": "Coord Set", "seasonality": "summer"},
    {"sku_id": "SKU105", "name": "calm trail look", "price": 1999, "category": "Lifestyle", "seasonality": "mid"},
    {"sku_id": "SKU106", "name": "arctic block tracksuit", "price": 2499, "category": "Tracksuit", "seasonality": "winter"},
    {"sku_id": "SKU107", "name": "varsity voyage coord set", "price": 1599, "category": "Coord Set", "seasonality": "summer"},
    {"sku_id": "SKU108", "name": "elevate scuba tracksuit", "price": 2499, "category": "Tracksuit", "seasonality": "winter"},
    {"sku_id": "SKU109", "name": "aeroslate coord set", "price": 1799, "category": "Coord Set", "seasonality": "summer"},
    {"sku_id": "SKU110", "name": "oversized justin coord set", "price": 1599, "category": "Coord Set", "seasonality": "mid"}
]

# 1. Generate sku_master.csv
sku_master_path = r'c:\Users\adity\OneDrive\Documents\GitHub\elsem3\data\synthetic dataset\sku_master.csv'
headers_master = ["sku_id", "category", "product_name", "selling_price", "cogs", "current_stock", "lead_time_days", "units_sold_last_30_days", "platform_fee_percent", "platform_fixed_fee", "shipping_cost_per_unit", "ad_spend_total_last_30_days"]

with open(sku_master_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers_master)
    writer.writeheader()
    for p in products:
        price = p["price"]
        cogs = round(price * random.uniform(0.4, 0.5), 2)
        stock = random.randint(50, 500)
        lead = random.randint(3, 10)
        sold_30 = random.randint(5, 40) # Reduced to match lower overall volume
        writer.writerow({
            "sku_id": p["sku_id"],
            "category": p["category"],
            "product_name": p["name"],
            "selling_price": price,
            "cogs": cogs,
            "current_stock": stock,
            "lead_time_days": lead,
            "units_sold_last_30_days": sold_30,
            "platform_fee_percent": 2.0,
            "platform_fixed_fee": 40.0,
            "shipping_cost_per_unit": 80.0,
            "ad_spend_total_last_30_days": round(random.uniform(500, 2000), 2)
        })

# 2. Generate and Sort seasonal_sales_history.csv
sales_history_path = r'c:\Users\adity\OneDrive\Documents\GitHub\elsem3\data\synthetic dataset\seasonal_sales_history.csv'
headers_sales = ["sku_id", "product_name", "date", "units_sold", "month", "day_of_week", "is_weekend"]

start_date = datetime(2022, 1, 1)
end_date = datetime(2023, 12, 31)

all_sales_data = []

# To target ~1500 orders over 730 days for 10 products:
# Average daily probability per product should be (~1500 / 10) / 730 ≈ 0.02 (2%)
# But we want spikes and seasonality, so we'll vary this.

curr = start_date
while curr <= end_date:
    month = curr.month
    day_name = curr.strftime('%A')
    is_weekend = 1 if curr.weekday() >= 5 else 0
    
    for p in products:
        # Base extremely low probability (sparse sales)
        base_prob = 0.1
        
        # Seasonality adjustments for India
        if p["seasonality"] == "winter":
            if month in [11, 12, 1, 2]: prob = 0.35
            elif month in [5, 6, 7, 8]: prob = 0.01
            else: prob = 0.05
        elif p["seasonality"] == "summer":
            if month in [3, 4, 5, 6]: prob = 0.35
            elif month in [11, 12, 1]: prob = 0.01
            else: prob = 0.05
        else: # mid/lifestyle
            prob = 0.15
            if month in [10, 11]: prob = 0.4 # Festive spike
        
        # Weekend and Festive prob boosts
        if is_weekend: prob = min(0.9, prob * 1.5)
        if month in [10, 11]: prob = min(0.95, prob * 2.0)
        
        # Decide if sale happens
        if random.random() < prob:
            # When it sells, it usually sells 1-3 units, but can spike
            base_qty = random.choices([1, 2, 3, 5, 10], weights=[0.6, 0.2, 0.1, 0.07, 0.03])[0]
            
            # Boost qty for peaks
            multiplier = 1.0
            if month in [10, 11]: multiplier = 2.0
            if p["seasonality"] == "winter" and month in [12, 1]: multiplier *= 1.5
            if p["seasonality"] == "summer" and month in [4, 5]: multiplier *= 1.5
            
            units = int(base_qty * multiplier)
            if units < 1: units = 1
            
            all_sales_data.append({
                "sku_id": p["sku_id"],
                "product_name": p["name"],
                "date": curr.strftime('%Y-%m-%d'),
                "units_sold": units,
                "month": month,
                "day_of_week": day_name,
                "is_weekend": is_weekend
            })
            
    curr += timedelta(days=1)

# Sort by date
all_sales_data.sort(key=lambda x: x['date'])

with open(sales_history_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers_sales)
    writer.writeheader()
    writer.writerows(all_sales_data)

print(f"Ultra-realistic data generation complete. Total orders: {len(all_sales_data)}")
