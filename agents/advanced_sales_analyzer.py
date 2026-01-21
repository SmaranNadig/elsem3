"""
advanced_sales_analyzer.py - Advanced analytics for individual products
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List
import os

class AdvancedSalesAnalyzer:
    """Advanced analytics for product sales data using local SKU master and seasonal history"""
    
    def __init__(self):
        self.sku_master_path = "data/synthetic dataset/sku_master.csv"
        self.sales_history_path = "data/synthetic dataset/seasonal_sales_history.csv"
        self.df_master = None
        self.df_sales = None
        
    def load_data(self):
        """Load SKU Master and Sales History CSVs"""
        try:
            if os.path.exists(self.sku_master_path):
                self.df_master = pd.read_csv(self.sku_master_path)
            else:
                print(f"[ERROR] SKU Master not found at {self.sku_master_path}")
                return False

            if os.path.exists(self.sales_history_path):
                self.df_sales = pd.read_csv(self.sales_history_path)
                self.df_sales['date'] = pd.to_datetime(self.df_sales['date'])
                self.df_sales['YearMonth'] = self.df_sales['date'].dt.to_period('M').astype(str)
                # Compute total sales value if price is needed (might need merge with master for price)
                # For now, simplistic approach: merge price from master
                self.df_sales = self.df_sales.merge(
                    self.df_master[['sku_id', 'selling_price']], 
                    on='sku_id', 
                    how='left'
                )
                self.df_sales['TotalSales'] = self.df_sales['units_sold'] * self.df_sales['selling_price']
            else:
                print(f"[ERROR] Sales History not found at {self.sales_history_path}")
                return False

            print(f"[INFO] Analysis Data Loaded: {len(self.df_master)} products, {len(self.df_sales)} sales records")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to load analysis data: {e}")
            return False
    
    def get_product_list(self, limit: int = 50) -> Dict:
        """Get list of top products from SKU master"""
        if self.df_master is None or self.df_sales is None:
            if not self.load_data():
                return {"error": "Failed to load data"}
        
        # We can just return the master list, sorted by revenue (from sales history)
        sales_summary = self.df_sales.groupby('product_name').agg({
            'TotalSales': 'sum',
            'units_sold': 'sum',
            'date': 'count' # approximate orders/days with sales
        }).reset_index()
        
        # Merge with master to ensure we have all details
        merged = self.df_master.merge(sales_summary, on='product_name', how='left').fillna(0)
        
        # Sort by total sales
        top_products = merged.sort_values('TotalSales', ascending=False).head(limit)
        
        products_list = []
        for _, row in top_products.iterrows():
            products_list.append({
                "name": row['product_name'],
                "sku_id": row['sku_id'],
                "total_sales": float(row['TotalSales']),
                "total_quantity": int(row['units_sold']),
                "total_orders": int(row['date']), # using date count as proxy for distinct sales events
                "category": row['category']
            })
        
        return {"products": products_list}
    
    def get_product_analytics(self, product_name: str) -> Dict:
        """Get comprehensive analytics for a specific product"""
        if self.df_master is None or self.df_sales is None:
            if not self.load_data():
                return {"error": "Failed to load data"}
        
        # Get product master details
        product_master = self.df_master[self.df_master['product_name'] == product_name]
        if product_master.empty:
            return {"error": f"Product '{product_name}' not found in Master"}
        
        product_details = product_master.iloc[0]
        sku_id = product_details['sku_id']
        
        # Filter sales history
        product_df = self.df_sales[self.df_sales['sku_id'] == sku_id].copy()
        
        if len(product_df) == 0:
            return {"error": "No sales history found for this product"}
        
        # Aggregations
        monthly = product_df.groupby('YearMonth').agg({
            'TotalSales': 'sum',
            'units_sold': 'sum',
            'selling_price': 'mean'
        }).reset_index()
        
        # Growth Rate
        monthly['growth_rate'] = monthly['TotalSales'].pct_change() * 100
        
        # Moving Averages
        monthly['ma_3month'] = monthly['TotalSales'].rolling(window=3).mean().fillna(0)
        
        # Daily Pattern
        daily = product_df.groupby('date').agg({
            'TotalSales': 'sum',
            'units_sold': 'sum'
        }).reset_index()
        
        # Day of Week
        product_df['day_name'] = product_df['date'].dt.day_name()
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_of_week = product_df.groupby('day_name')['TotalSales'].sum().reindex(day_order).fillna(0).reset_index()

        stats_summary = {
            "current_stock": int(product_details['current_stock']),
            "selling_price": float(product_details['selling_price']),
            "profit_margin": float(product_details['selling_price'] - product_details['cogs']),
            "total_revenue": float(product_df['TotalSales'].sum()),
            "total_quantity": int(product_df['units_sold'].sum()),
            "mean_sales": float(monthly['TotalSales'].mean()),
            "median_sales": float(monthly['TotalSales'].median()),
            "std_sales": float(monthly['TotalSales'].std()) if len(monthly) > 1 else 0.0,
            "min_sales": float(monthly['TotalSales'].min()),
            "max_sales": float(monthly['TotalSales'].max()),
            "avg_price": float(product_details['selling_price']),
            "total_orders": int(product_df['date'].count()), # count of sales events
            "avg_order_value": float(product_df['TotalSales'].mean())
        }
        
        return {
            "product_name": product_name,
            "category": product_details['category'],
            "monthly_trends": {
                "months": monthly['YearMonth'].tolist(),
                "sales": monthly['TotalSales'].round(2).tolist(),
                "quantities": monthly['units_sold'].tolist(),
                "orders": monthly['units_sold'].tolist(), # Use quantities as proxy for orders if separate order ID not avail
                "avg_price": [float(product_details['selling_price'])] * len(monthly),
                "growth_rate": monthly['growth_rate'].fillna(0).round(2).tolist(),
                "ma_3month": monthly['ma_3month'].round(2).tolist(),
                "ma_6month": [0] * len(monthly) # Not enough history for 6 month usually
            },
            "daily_sales": {
                "dates": [d.strftime('%Y-%m-%d') for d in daily['date']],
                "sales": daily['TotalSales'].round(2).tolist()
            },
            "hourly_pattern": {
                "hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18], # Mock hours
                "sales": [0] * 10
            },
            "weekly_pattern": {
                "days": day_of_week['day_name'].tolist(),
                "sales": day_of_week['TotalSales'].round(2).tolist()
            },
            "country_distribution": {
                "countries": ["Domestic"],
                "sales": [float(product_df['TotalSales'].sum())]
            },
            "price_quantity": {
                "prices": [float(product_details['selling_price'])],
                "quantities": [int(product_df['units_sold'].sum())]
            },
             "statistics": stats_summary
        }

# Global instance
advanced_analyzer = AdvancedSalesAnalyzer()
