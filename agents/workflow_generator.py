# workflow_generator.py - Dynamic Workflow Image Generation using Gemini
"""
Dynamic workflow generation using Google Gemini's image generation (Nano Banana).
Generates visual workflow diagrams based on analysis data and user prompts.
"""

import os
import base64
import requests
from datetime import datetime
from typing import Optional, Dict, Any
import json

# Load environment variables from .env file
from dotenv import load_dotenv

# Configuration
GEMINI_IMAGE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

# Workflow templates based on analysis results
WORKFLOW_TEMPLATES = {
    "restock": """A professional flowchart showing "CRITICAL RESTOCK WORKFLOW" for e-commerce.
Dark themed infographic with connected boxes:
1. RED box: "⚠️ CRITICAL: {product_name} - Stock: {stock} units"
2. BLUE box: "Calculate Reorder: {reorder_qty} units"
3. ORANGE box: "Lead Time: {lead_time} days"
4. GREEN success box: "Place Order Now"
5. PURPLE box: "Update Inventory System"
Modern flat design, arrows connecting boxes, business dashboard style.""",

    "pricing": """A professional flowchart showing "LOSS-MAKER PRICING STRATEGY" for e-commerce.
Dark themed infographic:
1. RED warning: "{product_name} - Profit: ${profit}/unit"
2. Decision diamond: "Can Reduce Costs?"
3. BLUE box: "Negotiate with Supplier" 
4. ORANGE box: "Bundle Strategy"
5. GREEN box: "Monitor for 30 Days"
Modern flat design, decision tree style, professional business dashboard.""",

    "seasonal": """A circular flowchart showing "SEASONAL STRATEGY" for {product_name}.
Dark themed cycle diagram:
1. BLUE: "Analyze Historical Sales"
2. ORANGE: "Peak Season: {peak_month}"
3. GREEN: "Pre-Season Stock Up"  
4. PURPLE: "Promotional Push"
5. RED: "Post-Season Clearance"
Center: "Optimize Cycle"
Modern design with seasonal icons.""",

    "overview": """A professional infographic showing inventory analysis summary.
Dark themed dashboard with 4 connected stages:
1. GREEN "PROFIT DOCTOR" box - {profitable} profitable, {loss_makers} loss-makers
2. BLUE "INVENTORY SENTINEL" box - {critical} critical, {warning} warnings
3. ORANGE "SEASONAL ANALYST" box - Trend analysis
4. PURPLE "STRATEGY SUPERVISOR" box - {total} products analyzed
Arrows connecting stages, output branches for CRITICAL/WARNING/SAFE.
Modern business dashboard aesthetic.""",

    "custom": """A professional workflow diagram for e-commerce inventory management.
Dark themed infographic showing: {custom_prompt}
Use modern flat design, colorful boxes, connecting arrows.
Professional business dashboard style with icons."""
}


class WorkflowGenerator:
    """Generates dynamic workflow images using Gemini API."""
    
    def __init__(self, api_key: str = None):
        # Always reload .env to get latest values
        load_dotenv(override=True)
        
        # Get API key - either passed in or from environment
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        
        # Debug log
        if self.api_key:
            print(f"[INFO] WorkflowGenerator: API key loaded (length: {len(self.api_key)})")
        else:
            print("[WARN] WorkflowGenerator: No GEMINI_API_KEY found in environment")
            
        self.output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dashboard", "public", "workflows", "generated")
        os.makedirs(self.output_dir, exist_ok=True)
    
    def _build_prompt(self, template_type: str, data: Dict[str, Any], custom_prompt: str = None) -> str:
        """Build image generation prompt from template and data."""
        
        if template_type == "custom" and custom_prompt:
            return WORKFLOW_TEMPLATES["custom"].format(custom_prompt=custom_prompt)
        
        template = WORKFLOW_TEMPLATES.get(template_type, WORKFLOW_TEMPLATES["overview"])
        
        # Extract data with defaults
        prompt_data = {
            "product_name": data.get("product_name", "Product"),
            "stock": data.get("current_stock", 0),
            "reorder_qty": data.get("reorder_qty_suggested", 100),
            "lead_time": data.get("lead_time_days", 7),
            "profit": data.get("profit_per_unit", 0),
            "peak_month": data.get("peak_month", "December"),
            "profitable": data.get("profitable", 0),
            "loss_makers": data.get("loss_makers", 0),
            "critical": data.get("critical_risk", 0),
            "warning": data.get("warning_risk", 0),
            "total": data.get("total_products", 0),
            "custom_prompt": custom_prompt or ""
        }
        
        try:
            return template.format(**prompt_data)
        except KeyError:
            return template
    
    def generate_workflow(
        self, 
        workflow_type: str,
        analysis_data: Dict[str, Any] = None,
        custom_prompt: str = None
    ) -> Dict[str, Any]:
        """
        Generate a workflow image using Gemini's image generation API.
        
        Args:
            workflow_type: One of 'restock', 'pricing', 'seasonal', 'overview', 'custom'
            analysis_data: Dictionary containing analysis results
            custom_prompt: Custom prompt for 'custom' workflow type
            
        Returns:
            Dictionary with 'success', 'image_path', 'prompt_used', etc.
        """
        
        if not self.api_key:
            return {
                "success": False,
                "error": "GEMINI_API_KEY not configured. Please set the environment variable.",
                "fallback": self._get_fallback_workflow(workflow_type)
            }
        
        data = analysis_data or {}
        prompt = self._build_prompt(workflow_type, data, custom_prompt)
        
        try:
            # Call Gemini API for image generation
            headers = {
                "Content-Type": "application/json"
            }
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": f"Generate an image: {prompt}"
                    }]
                }],
                "generationConfig": {
                    "responseModalities": ["image", "text"]
                }
            }
            
            print(f"[DEBUG] Calling Gemini API for workflow: {workflow_type}")
            
            response = requests.post(
                f"{GEMINI_IMAGE_API_URL}?key={self.api_key}",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            print(f"[DEBUG] Gemini API response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract image from response
                for part in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                    if "inlineData" in part:
                        image_data = part["inlineData"]["data"]
                        mime_type = part["inlineData"].get("mimeType", "image/png")
                        
                        # Save image
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"{workflow_type}_{timestamp}.png"
                        filepath = os.path.join(self.output_dir, filename)
                        
                        with open(filepath, "wb") as f:
                            f.write(base64.b64decode(image_data))
                        
                        print(f"[INFO] Workflow image saved to: {filepath}")
                        
                        return {
                            "success": True,
                            "image_path": f"/workflows/generated/{filename}",
                            "absolute_path": filepath,
                            "prompt_used": prompt,
                            "workflow_type": workflow_type,
                            "generated_at": datetime.now().isoformat()
                        }
                
                # No image in response - show what we got
                print(f"[WARN] No image in Gemini response. Response: {json.dumps(result, indent=2)[:500]}")
                
                return {
                    "success": False,
                    "error": "No image in response - Gemini may not support image generation with this model",
                    "fallback": self._get_fallback_workflow(workflow_type)
                }
            else:
                error_msg = f"API error {response.status_code}: {response.text[:200]}"
                print(f"[ERROR] {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "fallback": self._get_fallback_workflow(workflow_type)
                }
                
        except Exception as e:
            print(f"[ERROR] Exception in workflow generation: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "fallback": self._get_fallback_workflow(workflow_type)
            }
    
    def _get_fallback_workflow(self, workflow_type: str) -> str:
        """Return path to static fallback workflow image."""
        fallback_map = {
            "restock": "/workflows/restock.png",
            "pricing": "/workflows/pricing.png",
            "seasonal": "/workflows/seasonal.png",
            "overview": "/workflows/pipeline.png",
            "custom": "/workflows/pipeline.png"
        }
        return fallback_map.get(workflow_type, "/workflows/pipeline.png")
    
    def generate_from_analysis(self, session_analysis, session_summary: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a complete set of workflows based on analysis results.
        
        Returns dictionary of generated workflows.
        """
        workflows = {}
        
        # Generate overview workflow
        workflows["overview"] = self.generate_workflow("overview", session_summary)
        
        # If we have critical products, generate restock workflow for top one
        if session_analysis is not None and not session_analysis.empty:
            critical = session_analysis[session_analysis.get("risk_level") == "CRITICAL"]
            if not critical.empty:
                top_critical = critical.iloc[0].to_dict()
                workflows["restock"] = self.generate_workflow("restock", top_critical)
            
            # If we have loss-makers, generate pricing workflow
            loss_makers = session_analysis[session_analysis.get("profit_per_unit", 0) < 0]
            if not loss_makers.empty:
                top_loss = loss_makers.iloc[0].to_dict()
                workflows["pricing"] = self.generate_workflow("pricing", top_loss)
        
        return workflows


# Singleton instance
workflow_generator = WorkflowGenerator()


if __name__ == "__main__":
    # Test the generator
    test_data = {
        "product_name": "Widget Pro",
        "current_stock": 5,
        "reorder_qty_suggested": 100,
        "lead_time_days": 7,
        "profit_per_unit": -2.50,
        "total_products": 25,
        "critical_risk": 3,
        "warning_risk": 8,
        "profitable": 18,
        "loss_makers": 7
    }
    
    result = workflow_generator.generate_workflow("overview", test_data)
    print(json.dumps(result, indent=2))
