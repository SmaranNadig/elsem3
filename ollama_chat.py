"""
Ollama Chat Module - LLM-powered CSV analysis chat.

Provides:
- CSV file parsing and transformation
- Ollama integration for chat
- Inventory insights generation
"""

import pandas as pd
import requests
import json
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import io

# Ollama configuration
OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"  # Faster 2GB model - alternatives: "gemma:2b", "tinyllama"


class OllamaChat:
    """Chat interface using Ollama for CSV inventory analysis."""
    
    def __init__(self, model: str = DEFAULT_MODEL):
        self.model = model
        self.session_data: Optional[pd.DataFrame] = None
        self.session_analysis: Optional[pd.DataFrame] = None
        self.session_summary: Dict[str, Any] = {}
        self.chat_history: List[Dict[str, str]] = []
        
    def check_ollama_available(self) -> bool:
        """Check if Ollama server is running."""
        try:
            response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def get_available_models(self) -> List[str]:
        """Get list of available Ollama models."""
        try:
            response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return [m["name"] for m in data.get("models", [])]
        except:
            pass
        return []
    
    def parse_csv(self, file_content: bytes, filename: str) -> Tuple[bool, str]:
        """
        Parse uploaded CSV file and detect column mappings.
        
        Returns:
            Tuple of (success, message)
        """
        try:
            # Try to read the CSV
            df = pd.read_csv(io.BytesIO(file_content))
            
            if df.empty:
                return False, "CSV file is empty"
            
            # Store raw data
            self.session_data = df
            
            # Detect and map columns
            df_transformed = self._transform_to_unified(df)
            
            if df_transformed is None:
                return False, "Could not detect required columns (need at least product name/SKU and some numeric data)"
            
            # Run pipeline analysis
            self._run_analysis(df_transformed)
            
            return True, f"Successfully loaded {len(df)} rows from {filename}"
            
        except Exception as e:
            return False, f"Error parsing CSV: {str(e)}"
    
    def _transform_to_unified(self, df: pd.DataFrame) -> Optional[pd.DataFrame]:
        """Transform any CSV to unified format by detecting columns."""
        
        # Column name mappings (lowercase)
        col_lower = {c.lower().strip(): c for c in df.columns}
        
        # Try to find key columns
        sku_col = None
        name_col = None
        price_col = None
        cost_col = None
        stock_col = None
        date_col = None
        
        # SKU/ID detection
        for pattern in ['sku', 'sku_id', 'stockcode', 'stock_code', 'product_id', 'id', 'handle']:
            if pattern in col_lower:
                sku_col = col_lower[pattern]
                break
        
        # Product name detection
        for pattern in ['product_name', 'productname', 'name', 'title', 'description', 'product', 'item']:
            if pattern in col_lower:
                name_col = col_lower[pattern]
                break
        
        # Price detection
        for pattern in ['selling_price', 'price', 'unit_price', 'unitprice', 'amount']:
            if pattern in col_lower:
                price_col = col_lower[pattern]
                break
        
        # Cost detection
        for pattern in ['cogs', 'cost', 'unit_cost', 'cost_price']:
            if pattern in col_lower:
                cost_col = col_lower[pattern]
                break
        
        # Stock detection
        for pattern in ['current_stock', 'stock', 'quantity', 'on hand (current)', 'on_hand', 'inventory', 'available']:
            if pattern in col_lower:
                stock_col = col_lower[pattern]
                break
        
        # Date detection
        for pattern in ['date', 'invoicedate', 'invoice_date', 'order_date', 'created_at', 'timestamp', 'created']:
            if pattern in col_lower:
                date_col = col_lower[pattern]
                break
        
        # Must have at least SKU or name and some data
        if not sku_col and not name_col:
            return None
        
        # Create unified DataFrame
        result = pd.DataFrame()
        
        if sku_col:
            result['sku_id'] = df[sku_col].astype(str)
        elif name_col:
            result['sku_id'] = df[name_col].astype(str).str[:20]  # Use name as SKU
        
        if name_col:
            result['product_name'] = df[name_col].astype(str)
        else:
            result['product_name'] = result['sku_id']
        
        # Numeric columns with defaults
        if price_col:
            result['selling_price'] = pd.to_numeric(df[price_col], errors='coerce').fillna(10.0)
        else:
            result['selling_price'] = 10.0
            
        if cost_col:
            result['cogs'] = pd.to_numeric(df[cost_col], errors='coerce').fillna(result['selling_price'] * 0.6)
        else:
            result['cogs'] = result['selling_price'] * 0.6
            
        if stock_col:
            result['current_stock'] = pd.to_numeric(df[stock_col], errors='coerce').fillna(50).astype(int)
        else:
            result['current_stock'] = 50
        
        # Add required columns with defaults
        result['category'] = 'General'
        result['lead_time_days'] = 7
        result['units_sold_last_30_days'] = (result['current_stock'] / 30 * 30).astype(int).clip(lower=1)
        result['platform_fee_percent'] = 2.0
        result['platform_fixed_fee'] = 0.30
        result['shipping_cost_per_unit'] = (result['selling_price'] * 0.1).clip(lower=0.5, upper=5.0)
        result['ad_spend_total_last_30_days'] = 0.0
        
        # Add date if found
        if date_col:
            result['date'] = pd.to_datetime(df[date_col], errors='coerce').dt.strftime('%Y-%m-%d')
        else:
            result['date'] = datetime.now().strftime('%Y-%m-%d')
        
        return result
    
    def _run_analysis(self, df_master: pd.DataFrame):
        """Run pipeline analysis on transformed data."""
        try:
            # Import pipeline components
            from profit_doctor import ProfitDoctorAgent
            from inventory_sentinel import InventorySentinelAgent
            from strategy_supervisor import StrategySupervisorAgent
            
            # Generate simple sales history
            sales_rows = []
            for _, row in df_master.iterrows():
                daily_avg = max(1, row['units_sold_last_30_days'] / 30)
                for day in range(30):
                    from datetime import timedelta
                    import random
                    date = datetime.now() - timedelta(days=30-day)
                    units = max(0, int(daily_avg * random.uniform(0.5, 1.5)))
                    if units > 0:
                        sales_rows.append({
                            'sku_id': row['sku_id'],
                            'date': date.strftime('%Y-%m-%d'),
                            'units_sold': units
                        })
            
            df_sales = pd.DataFrame(sales_rows)
            
            # Run agents
            profit_agent = ProfitDoctorAgent()
            df_profit = profit_agent.compute_profit_metrics(df_master)
            
            inventory_agent = InventorySentinelAgent()
            df_inventory = inventory_agent.compute_inventory_metrics(df_profit, df_sales)
            
            strategy_agent = StrategySupervisorAgent()
            df_final = strategy_agent.rank_actions(df_inventory)
            
            self.session_analysis = df_final
            
            # Generate summary
            self.session_summary = {
                'total_products': len(df_final),
                'critical_risk': int((df_final['risk_level'] == 'CRITICAL').sum()),
                'warning_risk': int((df_final['risk_level'] == 'WARNING').sum()),
                'safe': int((df_final['risk_level'] == 'SAFE').sum()),
                'profitable': int((df_final['profit_per_unit'] > 0).sum()),
                'loss_makers': int((df_final['profit_per_unit'] < 0).sum()),
                'avg_profit': float(df_final['profit_per_unit'].mean()),
                'top_issues': df_final.nlargest(3, 'impact_score')[['sku_id', 'product_name', 'risk_level', 'recommended_action']].to_dict('records')
            }
            
        except Exception as e:
            print(f"[ERROR] Analysis failed: {e}")
            self.session_analysis = df_master
            self.session_summary = {'error': str(e)}
    
    def chat(self, message: str) -> str:
        """
        Send a message to Ollama and get a response about the data.
        
        Args:
            message: User's question
            
        Returns:
            LLM response
        """
        if not self.check_ollama_available():
            return "Error: Ollama server is not running. Please start it with `ollama serve`."
        
        # Build context
        context = self._build_context()
        
        # Build prompt
        system_prompt = f"""You are an expert inventory analyst and e-commerce advisor. You provide detailed, data-driven insights to help merchants optimize their inventory and maximize profitability.

Your analysis style:
- Be specific and reference actual product names and numbers from the data
- Provide actionable recommendations with clear reasoning
- Prioritize issues by urgency and potential impact
- Use bullet points for clarity
- When discussing profits/losses, show the numbers
- Suggest specific quantities and timeframes when relevant

=== INVENTORY DATA CONTEXT ===
{context}
=== END CONTEXT ===

Answer the user's question thoroughly. If they ask for analysis, provide:
1. Key findings (what the data shows)
2. Risk assessment (what needs attention)
3. Specific recommendations (what to do next)
4. Priority actions (most urgent first)"""

        # Add to history
        self.chat_history.append({"role": "user", "content": message})
        
        # Call Ollama
        try:
            response = requests.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        *self.chat_history
                    ],
                    "stream": False
                },
                timeout=180  # Increased timeout for larger models
            )
            
            if response.status_code == 200:
                result = response.json()
                assistant_message = result.get("message", {}).get("content", "No response")
                self.chat_history.append({"role": "assistant", "content": assistant_message})
                return assistant_message
            else:
                return f"Error from Ollama: {response.text}"
                
        except requests.Timeout:
            return "Request timed out. Please try again."
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _build_context(self) -> str:
        """Build detailed context string from session data."""
        if not self.session_summary:
            return "No data loaded yet. Please upload a CSV file first."
        
        if 'error' in self.session_summary:
            return f"Data loaded but analysis failed: {self.session_summary['error']}"
        
        # Calculate additional metrics
        df = self.session_analysis
        total_stock_value = 0
        total_revenue_potential = 0
        high_risk_products = []
        profitable_products = []
        
        if df is not None and not df.empty:
            total_stock_value = (df['selling_price'] * df['current_stock']).sum()
            if 'profit_per_unit' in df.columns:
                profitable_products = df[df['profit_per_unit'] > 0][['product_name', 'profit_per_unit', 'current_stock']].head(5).to_dict('records')
            if 'risk_level' in df.columns:
                high_risk_products = df[df['risk_level'].isin(['CRITICAL', 'WARNING'])][['product_name', 'risk_level', 'current_stock', 'recommended_action']].head(5).to_dict('records')
        
        context = f"""
📊 INVENTORY OVERVIEW:
━━━━━━━━━━━━━━━━━━━━━━
• Total Products: {self.session_summary.get('total_products', 0)}
• Total Stock Value: ${total_stock_value:,.2f}
• Average Profit per Unit: ${self.session_summary.get('avg_profit', 0):.2f}

💰 PROFITABILITY BREAKDOWN:
━━━━━━━━━━━━━━━━━━━━━━
• Profitable Products: {self.session_summary.get('profitable', 0)} ({self.session_summary.get('profitable', 0) / max(1, self.session_summary.get('total_products', 1)) * 100:.0f}%)
• Loss-Making Products: {self.session_summary.get('loss_makers', 0)} ({self.session_summary.get('loss_makers', 0) / max(1, self.session_summary.get('total_products', 1)) * 100:.0f}%)

⚠️ RISK ASSESSMENT:
━━━━━━━━━━━━━━━━━━━━━━
• 🔴 CRITICAL: {self.session_summary.get('critical_risk', 0)} products need IMMEDIATE action
• 🟡 WARNING: {self.session_summary.get('warning_risk', 0)} products need monitoring
• 🟢 SAFE: {self.session_summary.get('safe', 0)} products are healthy

🚨 TOP PRIORITY ISSUES:
━━━━━━━━━━━━━━━━━━━━━━
"""
        for i, item in enumerate(self.session_summary.get('top_issues', []), 1):
            context += f"{i}. {item['product_name']}\n   Status: {item['risk_level']} → Action: {item['recommended_action']}\n"
        
        # Add high-risk products detail
        if high_risk_products:
            context += "\n📋 PRODUCTS REQUIRING ATTENTION:\n━━━━━━━━━━━━━━━━━━━━━━\n"
            for prod in high_risk_products:
                context += f"• {prod['product_name']} (Stock: {prod['current_stock']})\n  → {prod['recommended_action']}\n"
        
        # Add full product data
        if df is not None and not df.empty:
            cols = ['product_name', 'selling_price', 'current_stock', 'profit_per_unit', 'risk_level', 'recommended_action']
            available_cols = [c for c in cols if c in df.columns]
            if available_cols:
                context += f"\n📦 COMPLETE PRODUCT DATA:\n━━━━━━━━━━━━━━━━━━━━━━\n{df[available_cols].to_string()}\n"
        
        return context
    
    def get_session_status(self) -> Dict[str, Any]:
        """Get current session status."""
        return {
            "has_data": self.session_data is not None,
            "products_loaded": len(self.session_data) if self.session_data is not None else 0,
            "analysis_complete": self.session_analysis is not None,
            "summary": self.session_summary,
            "ollama_available": self.check_ollama_available(),
            "model": self.model
        }
    
    def clear_session(self):
        """Clear the current session."""
        self.session_data = None
        self.session_analysis = None
        self.session_summary = {}
        self.chat_history = []


# Global instance
chat_session = OllamaChat()


# Test
if __name__ == "__main__":
    chat = OllamaChat()
    print("Ollama available:", chat.check_ollama_available())
    print("Available models:", chat.get_available_models())
