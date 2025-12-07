from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount

app_id = 'YOUR_APP_ID'
app_secret = 'YOUR_APP_SECRET'
access_token = 'YOUR_ACCESS_TOKEN'  # must include ads_read permission

FacebookAdsApi.init(app_id, app_secret, access_token)
account = AdAccount('act_<AD_ACCOUNT_ID>')  # prefix with "act_"

# Define fields and parameters for insights
fields = ['campaign_name','impressions','spend','actions']
params = {
    'date_preset': 'last_7d',    # last 7 days (or use 'time_range':{'since':'YYYY-MM-DD','until':'YYYY-MM-DD'})
    'time_increment': 1,        # daily breakdown
    'level': 'campaign'
}
insights = account.get_insights(fields=fields, params=params)
for entry in insights:
    date = entry.get('date_start')  # each entry has date_start/date_stop if time_increment used
    name = entry.get('campaign_name')
    impressions = entry.get('impressions')
    spend = entry.get('spend')
    conversions = None
    # Extract conversions from actions list if needed:
    for action in entry.get('actions', []):
        if action['action_type'] == 'offsite_conversion.fb_pixel_purchase':
            conversions = action['value']
    print(f"{date}: Campaign '{name}' – Impr={impressions}, Spend=${spend}, Purchases={conversions}")
