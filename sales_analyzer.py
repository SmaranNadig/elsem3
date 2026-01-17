"""
sales_analyzer.py - Analyzes online retail data for sales trends
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List

class SalesAnalyzer:
    """Analyzes retail sales data and generates insights"""
    
    def __init__(self, excel_path: str = "online_retail_II.xlsx"):
        self.excel_path = excel_path
        self.df = None
        
    def load_data(self):
        """Load Excel data"""
        try:
            self.df = pd.read_excel(self.excel_path)
            print(f"[INFO] Loaded {len(self.df)} rows from {self.excel_path}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to load data: {e}")
            return False
    
    def get_monthly_sales(self) -> Dict:
        """Get product sales aggregated by month"""
        if self.df is None:
            if not self.load_data():
                return {"error": "Failed to load data"}
        
        # Convert InvoiceDate to datetime
        self.df['InvoiceDate'] = pd.to_datetime(self.df['InvoiceDate'])
        
        # Extract year-month
        self.df['YearMonth'] = self.df['InvoiceDate'].dt.to_period('M')
        
        # Calculate total sales (Quantity * Price)
        self.df['TotalSales'] = self.df['Quantity'] * self.df['Price']
        
        # Group by month and sum sales
        monthly_sales = self.df.groupby('YearMonth')['TotalSales'].sum().reset_index()
        monthly_sales['YearMonth'] = monthly_sales['YearMonth'].astype(str)
        
        # Also get quantity sold per month
        monthly_quantity = self.df.groupby('YearMonth')['Quantity'].sum().reset_index()
        
        return {
            "months": monthly_sales['YearMonth'].tolist(),
            "sales": monthly_sales['TotalSales'].round(2).tolist(),
            "quantities": monthly_quantity['Quantity'].tolist(),
            "total_revenue": float(monthly_sales['TotalSales'].sum()),
            "avg_monthly_revenue": float(monthly_sales['TotalSales'].mean())
        }
    
    def get_top_products_by_month(self, top_n: int = 10) -> Dict:
        """Get top selling products for each month"""
        if self.df is None:
            if not self.load_data():
                return {"error": "Failed to load data"}
        
        # Convert InvoiceDate to datetime
        self.df['InvoiceDate'] = pd.to_datetime(self.df['InvoiceDate'])
        self.df['YearMonth'] = self.df['InvoiceDate'].dt.to_period('M').astype(str)
        self.df['TotalSales'] = self.df['Quantity'] * self.df['Price']
        
        # Get top products by month
        result = {}
        for month in self.df['YearMonth'].unique():
            month_data = self.df[self.df['YearMonth'] == month]
            top_products = month_data.groupby('Description')['TotalSales'].sum().nlargest(top_n)
            result[month] = {
                "products": top_products.index.tolist(),
                "sales": top_products.values.tolist()
            }
        
        return result


    def get_product_sales_by_month(self, limit: int = 20) -> Dict:
        """Get sales data for individual products over time"""
        if self.df is None:
            if not self.load_data():
                return {"error": "Failed to load data"}
        
        # Convert InvoiceDate to datetime
        self.df['InvoiceDate'] = pd.to_datetime(self.df['InvoiceDate'])
        self.df['YearMonth'] = self.df['InvoiceDate'].dt.to_period('M').astype(str)
        self.df['TotalSales'] = self.df['Quantity'] * self.df['Price']
        
        # Get top products by total sales
        top_products = self.df.groupby('Description')['TotalSales'].sum().nlargest(limit)
        
        # For each top product, get monthly sales
        products_data = []
        for product_name in top_products.index:
            if pd.isna(product_name) or product_name.strip() == '':
                continue
                
            product_df = self.df[self.df['Description'] == product_name]
            monthly_sales = product_df.groupby('YearMonth').agg({
                'TotalSales': 'sum',
                'Quantity': 'sum'
            }).reset_index()
            
            products_data.append({
                "product_name": product_name,
                "total_sales": float(top_products[product_name]),
                "months": monthly_sales['YearMonth'].tolist(),
                "sales": monthly_sales['TotalSales'].round(2).tolist(),
                "quantities": monthly_sales['Quantity'].tolist()
            })
        
        return {
            "products": products_data,
            "total_products": len(products_data)
        }


# Global instance
sales_analyzer = SalesAnalyzer()

