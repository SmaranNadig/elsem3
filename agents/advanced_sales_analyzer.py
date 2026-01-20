"""
advanced_sales_analyzer.py - Advanced analytics for individual products
"""


import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List
import os

class AdvancedSalesAnalyzer:
    """Advanced analytics for product sales data using synthetic seasonal data"""
    
    def __init__(self):
        self.history_path = "data/synthetic dataset/seasonal_sales_history.csv"
        self.master_path = "data/synthetic dataset/sku_master.csv"
        self.df = None
        self.master_df = None
        
    def load_data(self):
        """Load synthetic data files"""
        try:
            # Load sales history
            if not os.path.exists(self.history_path):
                print(f"[ERROR] History file not found: {self.history_path}")
                return False
                
            self.df = pd.read_csv(self.history_path)
            self.df['date'] = pd.to_datetime(self.df['date'])
            self.df['YearMonth'] = self.df['date'].dt.to_period('M').astype(str)
            
            # Load master for prices
            if os.path.exists(self.master_path):
                self.master_df = pd.read_csv(self.master_path)
                # Merge price info
                # Create a mapping of sku_id/product_name to price
                # We'll try to merge on sku_id, fallback to product_name
                
                # Check consistency
                price_map = {}
                if 'sku_id' in self.master_df.columns and 'selling_price' in self.master_df.columns:
                     price_map = dict(zip(self.master_df['sku_id'], self.master_df['selling_price']))
                
                # Apply price to history
                # If history has sku_id use it, else match name
                if 'sku_id' in self.df.columns:
                    self.df['Price'] = self.df['sku_id'].map(price_map).fillna(0.0)
                else:
                    self.df['Price'] = 0.0
            else:
                self.df['Price'] = 0.0
                
            # Calculate Total Sales
            self.df['TotalSales'] = self.df['units_sold'] * self.df['Price']
            
            print(f"[INFO] Loaded {len(self.df)} sales history rows")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to load data: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_product_list(self, limit: int = 50) -> Dict:
        """Get list of top products"""
        if self.df is None:
            if not self.load_data():
                return {"error": "Failed to load data"}
        
        # Group by Product Name
        # 'units_sold' is Quantity
        products = self.df.groupby('product_name').agg({
            'TotalSales': 'sum',
            'units_sold': 'sum',
            'date': 'count' # using count of days as proxy for orders/frequency
        }).reset_index()
        
        products = products.nlargest(limit, 'TotalSales')
        
        products_list = []
        for _, row in products.iterrows():
            if pd.isna(row['product_name']) or row['product_name'].strip() == '':
                continue
            products_list.append({
                "name": row['product_name'],
                "total_sales": float(row['TotalSales']),
                "total_quantity": int(row['units_sold']),
                "total_orders": int(row['date']) # Proxy: number of days with sales
            })
        
        return {"products": products_list}
    
    def get_product_analytics(self, product_name: str) -> Dict:
        """Get comprehensive analytics for a specific product"""
        if self.df is None:
            if not self.load_data():
                return {"error": "Failed to load data"}
        
        product_df = self.df[self.df['product_name'] == product_name].copy()
        
        if len(product_df) == 0:
            return {"error": "Product not found"}
        
        # Monthly trends
        monthly = product_df.groupby('YearMonth').agg({
            'TotalSales': 'sum',
            'units_sold': 'sum',
            'date': 'count',
            'Price': 'mean'
        }).rename(columns={'date': 'Invoice', 'units_sold': 'Quantity'}).reset_index()
        
        # Growth rate calculation
        monthly['growth_rate'] = monthly['TotalSales'].pct_change() * 100
        
        # Moving averages
        monthly['ma_3month'] = monthly['TotalSales'].rolling(window=3).mean()
        monthly['ma_6month'] = monthly['TotalSales'].rolling(window=6).mean()
        
        # Daily analysis
        daily = product_df.groupby('date').agg({
            'TotalSales': 'sum',
            'units_sold': 'sum'
        }).rename(columns={'units_sold': 'quantity'}).reset_index()
        daily['date'] = daily['date'].dt.strftime('%Y-%m-%d')
        
        # Hour of day analysis (Not available in daily data, mock it or return empty)
        hourly_data = {"hours": [], "sales": []}
        
        # Day of week analysis
        if 'day_of_week' in product_df.columns:
            day_of_week = product_df.groupby('day_of_week')['TotalSales'].sum().reset_index()
            day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            day_of_week['order'] = day_of_week['day_of_week'].map({day: i for i, day in enumerate(day_order)})
            day_of_week = day_of_week.sort_values('order')
        else:
             day_of_week = pd.DataFrame(columns=['day_of_week', 'TotalSales'])

        # Price vs Quantity correlation (Price is constant usually in master, so this might be flat)
        price_qty = product_df.groupby('Price')['units_sold'].sum().reset_index().rename(columns={'units_sold': 'Quantity'})
        
        # Country distribution (Not available, return empty)
        country_data = {"countries": ["Global"], "sales": [float(product_df['TotalSales'].sum())]}
        
        # Statistical summary
        stats_summary = {
            "mean_sales": float(monthly['TotalSales'].mean()),
            "median_sales": float(monthly['TotalSales'].median()),
            "std_sales": float(monthly['TotalSales'].std()) if len(monthly) > 1 else 0.0,
            "min_sales": float(monthly['TotalSales'].min()),
            "max_sales": float(monthly['TotalSales'].max()),
            "avg_price": float(product_df['Price'].mean()),
            "total_revenue": float(product_df['TotalSales'].sum()),
            "total_quantity": int(product_df['units_sold'].sum()),
            "total_orders": int(len(product_df)), # Count of active days
            "avg_order_value": float(product_df['TotalSales'].mean()) # Avg daily sales
        }
        
        return {
            "product_name": product_name,
            "monthly_trends": {
                "months": monthly['YearMonth'].tolist(),
                "sales": monthly['TotalSales'].round(2).tolist(),
                "quantities": monthly['Quantity'].tolist(),
                "orders": monthly['Invoice'].tolist(),
                "avg_price": monthly['Price'].round(2).tolist(),
                "growth_rate": monthly['growth_rate'].fillna(0).round(2).tolist(),
                "ma_3month": monthly['ma_3month'].fillna(0).round(2).tolist(),
                "ma_6month": monthly['ma_6month'].fillna(0).round(2).tolist()
            },
            "daily_sales": {
                "dates": daily['date'].tolist(),
                "sales": daily['TotalSales'].round(2).tolist(),
                "quantities": daily['quantity'].tolist()
            },
            "hourly_pattern": hourly_data,
            "weekly_pattern": {
                "days": day_of_week['day_of_week'].tolist() if not day_of_week.empty else [],
                "sales": day_of_week['TotalSales'].round(2).tolist() if not day_of_week.empty else []
            },
            "price_quantity": {
                "prices": price_qty['Price'].round(2).tolist(),
                "quantities": price_qty['Quantity'].tolist()
            },
            "country_distribution": country_data,
            "statistics": stats_summary
        }


# Global instance
advanced_analyzer = AdvancedSalesAnalyzer()

