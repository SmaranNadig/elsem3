from google.ads.googleads.client import GoogleAdsClient

# Load credentials (developer token, OAuth client ID/secret, refresh token) from yaml or env
googleads_client = GoogleAdsClient.load_from_storage(version="v22")  # or latest version:contentReference[oaicite:1]{index=1}

ga_service = googleads_client.get_service("GoogleAdsService")
customer_id = "1234567890"  # your Google Ads customer ID

# GAQL query: get daily metrics by campaign
query = """
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_7_DAYS
    ORDER BY segments.date
"""
stream = ga_service.search_stream(customer_id=customer_id, query=query)
for batch in stream:
    for row in batch.results:
        date = row.segments.date
        name = row.campaign.name
        impressions = row.metrics.impressions
        cost = row.metrics.cost_micros / 1e6  # cost_micros is in micros, divide by 1e6
        conversions = row.metrics.conversions
        print(f"{date}: Campaign '{name}' – Impr={impressions}, Spend=${cost:.2f}, Conversions={conversions}")
