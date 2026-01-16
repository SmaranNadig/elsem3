"""
Shopify Loader - Fetch and transform Shopify data to unified format.

Uses data_transformer for schema alignment and seasonal simulation.
"""

import requests
import pandas as pd
import time
from typing import Tuple, Optional, Dict, List
from datetime import datetime, timedelta
from config import CFG
from data_transformer import (
    transform_shopify_data,
    transform_inventory_bin_csv,
    generate_sales_history_for_products,
    UNIFIED_SKU_COLUMNS
)


class ShopifyLoader:
    """Load and transform Shopify data to unified pipeline format."""
    
    def __init__(self):
        self.shop_url = CFG.shopify_shop_domain
        self.access_token = CFG.shopify_access_token
        self.api_version = "2024-01"
        self.base_url = f"https://{self.shop_url}/admin/api/{self.api_version}"
        self.headers = {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json"
        }
        
    def _get_headers(self):
        return self.headers

    def validate_config(self):
        """Check if Shopify credentials are configured."""
        if not self.shop_url or "myshopify.com" not in self.shop_url:
            print("[ERROR] Invalid Shopify shop domain")
            return False
        if not self.access_token:
            print("[ERROR] Missing Shopify access token")
            return False
        return True

    def fetch_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Fetch products from Shopify and transform to unified format.
        
        Returns:
            Tuple of (df_master, df_sales) in unified format with simulated seasonal history
        """
        if not self.validate_config():
            return pd.DataFrame(), pd.DataFrame()
            
        print(f"[INFO] Fetching data from Shopify: {self.shop_url}")
        
        # Fetch Products
        products = self._fetch_all_resource("products")
        print(f"[INFO] Fetched {len(products)} products")
        
        if not products:
            return pd.DataFrame(), pd.DataFrame()
        
        # Transform to unified format (includes seasonal simulation)
        df_master, df_sales = transform_shopify_data(products)
        
        print(f"[INFO] Transformed to {len(df_master)} SKUs with {len(df_sales)} sales records")
        
        return df_master, df_sales

    def _fetch_all_resource(self, resource: str, params: Dict = None) -> List[Dict]:
        """Fetch all pages of a Shopify resource."""
        all_items = []
        url = f"{self.base_url}/{resource}.json"
        params = params or {}
        params["limit"] = 250
        
        while url:
            try:
                response = requests.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                data = response.json()
                
                items = data.get(resource, [])
                all_items.extend(items)
                
                # Pagination
                link_header = response.headers.get("Link")
                url = self._get_next_link(link_header)
                params = {}  # Params only needed for first request
                
                time.sleep(0.5)  # Rate limit friendly
            except Exception as e:
                print(f"[ERROR] Failed to fetch {resource}: {str(e)}")
                break
                
        return all_items

    def _get_next_link(self, link_header):
        """Parse next page link from Link header."""
        if not link_header:
            return None
        links = link_header.split(',')
        for link in links:
            if 'rel="next"' in link:
                return link.split(';')[0].strip('<> ')
        return None

    def update_stock(self, variant_id: int, inventory_item_id: int, new_qty: int):
        """Update inventory level in Shopify."""
        try:
            # Get Location
            loc_resp = requests.get(f"{self.base_url}/locations.json", headers=self.headers)
            loc_resp.raise_for_status()
            locations = loc_resp.json().get("locations", [])
            if not locations:
                raise Exception("No location found")
            location_id = locations[0]["id"]
            
            # Set Inventory
            time.sleep(0.5)
            payload = {
                "location_id": location_id,
                "inventory_item_id": inventory_item_id,
                "available": new_qty
            }
            resp = requests.post(f"{self.base_url}/inventory_levels/set.json", 
                               headers=self.headers, json=payload)
            resp.raise_for_status()
            print(f"[SUCCESS] Updated stock for item {inventory_item_id} to {new_qty}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to update stock: {str(e)}")
            raise

    def update_price(self, variant_id: int, new_price: float):
        """Update variant price in Shopify."""
        try:
            payload = {
                "variant": {
                    "id": variant_id,
                    "price": str(new_price)
                }
            }
            resp = requests.put(f"{self.base_url}/variants/{variant_id}.json", 
                              headers=self.headers, json=payload)
            resp.raise_for_status()
            print(f"[SUCCESS] Updated price for variant {variant_id} to {new_price}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to update price: {str(e)}")
            raise


def load_from_inventory_bin(filepath: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load data from Shopify inventory bin CSV export.
    
    Args:
        filepath: Path to the inventory bin CSV file
    
    Returns:
        Tuple of (df_master, df_sales) in unified format
    """
    return transform_inventory_bin_csv(filepath)


# Test
if __name__ == "__main__":
    print("=" * 60)
    print("Testing Shopify Loader")
    print("=" * 60)
    
    # Test inventory bin loading
    inv_bin_path = "synthetic dataset/inventory_bin_new_on_hand_template.csv"
    try:
        df_master, df_sales = load_from_inventory_bin(inv_bin_path)
        print(f"\n[Inventory Bin] Loaded {len(df_master)} SKUs, {len(df_sales)} sales records")
        print(f"\nSample SKUs:")
        print(df_master[['sku_id', 'product_name', 'category', 'selling_price', 'current_stock']].to_string())
    except Exception as e:
        print(f"[ERROR] {e}")
    
    print("\n" + "=" * 60)
