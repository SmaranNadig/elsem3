import pandas as pd

# Paths
campaigns_path = "data/synthetic dataset/ad_campaigns.csv"

def update_ad_campaigns():
    df = pd.read_csv(campaigns_path)
    
    # Identify 30d columns
    cols_to_rename = {col: col.replace("_30d", "_90d") for col in df.columns if "_30d" in col}
    
    # Scale values by 3 (approx 90 days from 30 days)
    # We do this BEFORE renaming to identify them easily or just use the dict
    for col in cols_to_rename:
        if df[col].dtype in [np.float64, np.int64]:
            df[col] = df[col] * 3
            
    # Rename columns
    df = df.rename(columns=cols_to_rename)
    
    # Save
    df.to_csv(campaigns_path, index=False)
    print(f"[SUCCESS] Updated {campaigns_path} to 90-day metrics.")

if __name__ == "__main__":
    import numpy as np
    update_ad_campaigns()
