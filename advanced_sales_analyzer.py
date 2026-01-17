"""
advanced_sales_analyzer.py - Advanced analytics for individual products
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List
from scipy import stats

class AdvancedSalesAnalyzer:
    """Advanced analytics for product sales data"""
    
    def __init__(self, excel_path: str = "online_retail_II.xlsx"):
        self.excel_path = excel_path
        self.df = None
        
    def load_data(self):
        """Load Excel data"""
        try:
            self.df = pd.read_excel(self.excel_path)
            self.df['InvoiceDate'] = pd.to_datetime(self.df['InvoiceDate'])
            self.df['YearMonth'] = self.df['InvoiceDate'].dt.to_period('M').astype(str)
            self.df['TotalSales'] = self.df['Quantity'] * self.df['Price']
            print(f"[INFO] Loaded {len(self.df)} rows")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to load data: {e}")
            return False
    
    def get_product_list(self, limit: int = 50) -> Dict:
        """Get list of top products"""
        if self.df is None:
            if not self.load_data():
                return {"error": "Failed to load data"}
        
        # Get top products by total sales
        products = self.df.groupby('Description').agg({
            'TotalSales': 'sum',
            'Quantity': 'sum',
            'Invoice': 'nunique'
        }).nlargest(limit, 'TotalSales').reset_index()
        
        products_list = []
        for _, row in products.iterrows():
            if pd.isna(row['Description']) or row['Description'].strip() == '':
                continue
            products_list.append({
                "name": row['Description'],
                "total_sales": float(row['TotalSales']),
                "total_quantity": int(row['Quantity']),
                "total_orders": int(row['Invoice'])
            })
        
        return {"products": products_list}
    
    def get_product_analytics(self, product_name: str) -> Dict:
        """Get comprehensive analytics for a specific product"""
        if self.df is None:
            if not self.load_data():
                return {"error": "Failed to load data"}
        
        product_df = self.df[self.df['Description'] == product_name].copy()
        
        if len(product_df) == 0:
            return {"error": "Product not found"}
        
        # Monthly trends
        monthly = product_df.groupby('YearMonth').agg({
            'TotalSales': 'sum',
            'Quantity': 'sum',
            'Invoice': 'nunique',
            'Price': 'mean'
        }).reset_index()
        
        # Growth rate calculation
        monthly['growth_rate'] = monthly['TotalSales'].pct_change() * 100
        
        # Moving averages
        monthly['ma_3month'] = monthly['TotalSales'].rolling(window=3).mean()
        monthly['ma_6month'] = monthly['TotalSales'].rolling(window=6).mean()
        
        # Daily analysis
        daily = product_df.groupby(product_df['InvoiceDate'].dt.date).agg({
            'TotalSales': 'sum',
            'Quantity': 'sum'
        }).reset_index()
        daily.columns = ['date', 'sales', 'quantity']
        
        # Hour of day analysis
        product_df['hour'] = product_df['InvoiceDate'].dt.hour
        hourly = product_df.groupby('hour')['TotalSales'].sum().reset_index()
        
        # Day of week analysis
        product_df['day_of_week'] = product_df['InvoiceDate'].dt.day_name()
        day_of_week = product_df.groupby('day_of_week')['TotalSales'].sum().reset_index()
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_of_week['order'] = day_of_week['day_of_week'].map({day: i for i, day in enumerate(day_order)})
        day_of_week = day_of_week.sort_values('order')
        
        # Price vs Quantity correlation
        price_qty = product_df.groupby('Price')['Quantity'].sum().reset_index()
        
        # Country distribution
        country_sales = product_df.groupby('Country')['TotalSales'].sum().nlargest(10).reset_index()
        
        # Statistical summary
        stats_summary = {
            "mean_sales": float(monthly['TotalSales'].mean()),
            "median_sales": float(monthly['TotalSales'].median()),
            "std_sales": float(monthly['TotalSales'].std()),
            "min_sales": float(monthly['TotalSales'].min()),
            "max_sales": float(monthly['TotalSales'].max()),
            "avg_price": float(product_df['Price'].mean()),
            "total_revenue": float(product_df['TotalSales'].sum()),
            "total_quantity": int(product_df['Quantity'].sum()),
            "total_orders": int(product_df['Invoice'].nunique()),
            "avg_order_value": float(product_df['TotalSales'].sum() / product_df['Invoice'].nunique())
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
                "dates": [str(d) for d in daily['date'].tolist()],
                "sales": daily['sales'].round(2).tolist(),
                "quantities": daily['quantity'].tolist()
            },
            "hourly_pattern": {
                "hours": hourly['hour'].tolist(),
                "sales": hourly['TotalSales'].round(2).tolist()
            },
            "weekly_pattern": {
                "days": day_of_week['day_of_week'].tolist(),
                "sales": day_of_week['TotalSales'].round(2).tolist()
            },
            "price_quantity": {
                "prices": price_qty['Price'].round(2).tolist(),
                "quantities": price_qty['Quantity'].tolist()
            },
            "country_distribution": {
                "countries": country_sales['Country'].tolist(),
                "sales": country_sales['TotalSales'].round(2).tolist()
            },
            "statistics": stats_summary
        }


# Global instance
advanced_analyzer = AdvancedSalesAnalyzer()
