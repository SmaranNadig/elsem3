import csv
import random
from datetime import datetime, timedelta

products = [
    {"sku_id": "SKU101", "name": "Skeleton science embroidery sweatshirt", "platform": "META_ADS"},
    {"sku_id": "SKU106", "name": "arctic block tracksuit", "platform": "GOOGLE_ADS"},
    {"sku_id": "SKU102", "name": "Kross Coord set", "platform": "META_ADS"},
    {"sku_id": "SKU104", "name": "West Coast Coord Set", "platform": "GOOGLE_ADS"},
    {"sku_id": "SKU103", "name": "Studio Coord Set", "platform": "META_ADS"},
    {"sku_id": "SKU110", "name": "oversized justin coord set", "platform": "GOOGLE_ADS"}
]

# 1. Generate ad_campaigns.csv
ad_campaigns_path = r'c:\Users\adity\OneDrive\Documents\GitHub\elsem3\data\synthetic dataset\ad_campaigns.csv'
headers_camp = ["campaign_id", "sku_id", "platform", "campaign_name", "status", "daily_budget", "total_spend_30d", "impressions_30d", "clicks_30d", "conversions_30d", "cpc", "ctr", "conversion_rate", "roas", "revenue_30d", "start_date", "end_date"]

camp_ids = []
campaigns_data = []

for i, p in enumerate(products, 1):
    camp_id = f"CAM_{1000+i}"
    camp_ids.append(camp_id)
    budget = round(random.uniform(150, 200), 2)
    
    # Randomly calc some 30d stats
    clicks = random.randint(500, 1500)
    convs = int(clicks * random.uniform(0.01, 0.05))
    spend = budget * 30
    cpc = round(spend / clicks, 2)
    ctr = round(random.uniform(1.0, 5.0), 2)
    conv_rate = round((convs / clicks) * 100, 2)
    revenue = convs * random.uniform(1000, 2000)
    roas = round(revenue / spend, 2)
    
    campaigns_data.append({
        "campaign_id": camp_id,
        "sku_id": p["sku_id"],
        "platform": p["platform"],
        "campaign_name": f"{p['platform']}_{p['sku_id']}_{p['name'].replace(' ', '_')}",
        "status": "ACTIVE",
        "daily_budget": budget,
        "total_spend_30d": spend,
        "impressions_30d": clicks * 50,
        "clicks_30d": clicks,
        "conversions_30d": convs,
        "cpc": cpc,
        "ctr": ctr,
        "conversion_rate": conv_rate,
        "roas": roas,
        "revenue_30d": round(revenue, 2),
        "start_date": "2022-01-01",
        "end_date": ""
    })

with open(ad_campaigns_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers_camp)
    writer.writeheader()
    writer.writerows(campaigns_data)

# 2. Generate ad_daily_metrics.csv
ad_metrics_path = r'c:\Users\adity\OneDrive\Documents\GitHub\elsem3\data\synthetic dataset\ad_daily_metrics.csv'
headers_metrics = ["campaign_id", "date", "spend", "impressions", "clicks", "conversions", "cpc", "ctr", "conv_rate"]

start_date = datetime(2022, 1, 1)
end_date = datetime(2023, 12, 31)

metrics_data = []
curr = start_date
while curr <= end_date:
    for camp in campaigns_data:
        budget = camp["daily_budget"]
        spend = round(budget * random.uniform(0.8, 1.2), 2)
        clicks = random.randint(10, 30)
        convs = random.choices([0, 1, 2], weights=[0.8, 0.15, 0.05])[0]
        
        cpc = round(spend/clicks, 2) if clicks > 0 else 0
        ctr = round(random.uniform(1.0, 4.0), 2)
        conv_rate = round((convs/clicks)*100, 2) if clicks > 0 else 0
        
        metrics_data.append({
            "campaign_id": camp["campaign_id"],
            "date": curr.strftime('%Y-%m-%d'),
            "spend": spend,
            "impressions": clicks * 40,
            "clicks": clicks,
            "conversions": convs,
            "cpc": cpc,
            "ctr": ctr,
            "conv_rate": conv_rate
        })
    curr += timedelta(days=1)

with open(ad_metrics_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers_metrics)
    writer.writeheader()
    writer.writerows(metrics_data)

print("Ad campaign data generation complete.")
