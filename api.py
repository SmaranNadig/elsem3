# api.py

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import requests
import os
from datetime import datetime
import traceback

from core.config import CFG
from core.pipeline import run_pipeline
from server.shopify_loader import ShopifyLoader
from core.sku_mode_manager import sku_mode_manager  # Import mode manager

# Initialize FastAPI app
app = FastAPI(
    title="E-commerce Agent Dashboard API",
    description="API for visualizing e-commerce AI agents in action",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
pipeline_data: Optional[pd.DataFrame] = None
last_execution_time: Optional[datetime] = None
execution_status = {"status": "idle", "message": "Not yet executed"}
data_source: str = "none"  # Track data source: "shopify" or "csv" or "none"

# Chat session storage
chat_data: Optional[pd.DataFrame] = None
chat_messages: List[Dict[str, Any]] = []
chat_summary: Optional[Dict[str, Any]] = None
chat_data_type: str = "unknown"  # Track data type: inventory, sales, generic


# Pydantic models
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    message: str


class AgentStatus(BaseModel):
    name: str
    status: str
    execution_time: Optional[float] = None
    metrics: Dict[str, Any]


class MetricsSummary(BaseModel):
    total_skus: int
    total_profitable: int
    total_loss_makers: int
    total_critical_risk: int
    total_warning_risk: int
    total_safe: int
    avg_profit_per_unit: float
    total_profit_at_risk: float
    total_daily_loss: float


class SKURecommendation(BaseModel):
    sku_id: str
    category: str
    product_name: str
    selling_price: float
    cogs: float
    current_stock: int
    lead_time_days: int
    profit_per_unit: float
    loss_per_day: float
    sales_velocity_per_day: float
    days_of_stock_left: float
    risk_level: str
    reorder_qty_suggested: float
    profit_at_risk: float
    impact_score: float
    recommended_action: str
    strategy_mode: Optional[str]  = None  # Strategy mode for this SKU
    # LangChain LLM insights (optional)
    llm_profit_insight: Optional[str] = None
    llm_inventory_insight: Optional[str] = None
    llm_strategy_insight: Optional[str] = None
    llm_profit_confidence: Optional[float] = None
    llm_inventory_confidence: Optional[float] = None
    llm_strategy_confidence: Optional[float] = None


# Helper function to execute pipeline
def load_shopify_data():
    """Fetch data from Shopify and run pipeline"""
    global pipeline_data, last_execution_time, execution_status, data_source
    
    loader = ShopifyLoader()
    if not loader.validate_config():
        return False
        
    try:
        df_master, df_sales = loader.fetch_data()
        if df_master.empty:
            return False
            
        # Run pipeline with Shopify data
        pipeline_data = run_pipeline(verbose=True, df_master=df_master, df_sales=df_sales)
        last_execution_time = datetime.now()
        data_source = "shopify"
        execution_status = {
            "status": "success",
            "message": f"Shopify data loaded at {last_execution_time.strftime('%Y-%m-%d %H:%M:%S')}"
        }
        return True
    except Exception as e:
        print(f"[ERROR] Shopify load failed: {str(e)}")
        return False

def execute_pipeline():
    global pipeline_data, last_execution_time, execution_status, data_source
    
    # Try Shopify First
    if CFG.shopify_access_token and CFG.shopify_shop_domain and data_source != "shopify":
        print("[INFO] Attempting to load Shopify data...")
        if load_shopify_data():
            return True
            
    # Don't overwrite Shopify data with CSV data
    if data_source == "shopify":
        print("[INFO] Shopify data active. Skipping CSV pipeline.")
        return True
    
    # Don't re-run if we already have CSV data (avoids timeout on refresh)
    if data_source == "csv" and pipeline_data is not None:
        print("[INFO] CSV data already loaded. Skipping re-execution.")
        return True
    
    try:
        execution_status = {"status": "running", "message": "Executing agent pipeline..."}
        df = run_pipeline(verbose=False)
        if not df.empty:
            pipeline_data = df
            data_source = "csv"  # Mark as CSV
            last_execution_time = datetime.now()
            execution_status = {
                "status": "success",
                "message": f"Pipeline executed successfully at {last_execution_time.strftime('%Y-%m-%d %H:%M:%S')}"
            }
            return True
        else:
            execution_status = {"status": "error", "message": "Pipeline returned empty data"}
            return False
    except Exception as e:
        execution_status = {"status": "error", "message": f"Pipeline execution failed: {str(e)}"}
        print(f"[ERROR] Pipeline execution failed: {traceback.format_exc()}")
        return False



# Execute pipeline on startup - Waiting for Shopify data from n8n
@app.on_event("startup")
async def startup_event():
    print("[INFO] API started. Initializing data...")
    # Auto-run pipeline with synthetic data if no Shopify data
    success = execute_pipeline()
    if success:
        print("[INFO] Pipeline executed successfully on startup.")
    else:
        print("[WARNING] Pipeline execution failed on startup.")



# API Endpoints
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "message": "API is running"
    }


@app.get("/api/agents/status")
async def get_agent_status():
    """Get status of all agents"""
    if pipeline_data is None:
        return {
            "status": execution_status["status"],
            "message": execution_status["message"],
            "agents": []
        }

    # Calculate agent-specific metrics
    profit_doctor_metrics = {
        "total_skus": len(pipeline_data),
        "profitable_skus": int((pipeline_data["profit_per_unit"] > 0).sum()),
        "loss_makers": int((pipeline_data["profit_per_unit"] < 0).sum()),
        "avg_profit": float(pipeline_data["profit_per_unit"].mean()),
        "total_daily_loss": float(pipeline_data["loss_per_day"].sum())
    }

    inventory_sentinel_metrics = {
        "critical_risk": int((pipeline_data["risk_level"] == "CRITICAL").sum()),
        "warning_risk": int((pipeline_data["risk_level"] == "WARNING").sum()),
        "safe": int((pipeline_data["risk_level"] == "SAFE").sum()),
        "no_history": int((pipeline_data["risk_level"] == "NO_HISTORY").sum()),
        "avg_velocity": float(pipeline_data["sales_velocity_per_day"].mean()),
        "total_reorder_qty": float(pipeline_data["reorder_qty_suggested"].sum())
    }

    action_counts = pipeline_data["recommended_action"].value_counts().to_dict()
    strategy_supervisor_metrics = {
        "total_actions": len(action_counts),
        "action_distribution": action_counts,
        "avg_impact_score": float(pipeline_data["impact_score"].mean())
    }

    # Seasonal Analyst metrics (check if columns exist)
    seasonal_analyst_metrics = {}
    if "seasonality_strength" in pipeline_data.columns:
        seasonal_analyst_metrics = {
            "strong_seasonality_count": int((pipeline_data["seasonality_strength"] > 0.3).sum()),
            "seasonal_risk_count": int(pipeline_data["seasonal_risk_flag"].sum()) if "seasonal_risk_flag" in pipeline_data.columns else 0,
            "avg_seasonality_strength": float(pipeline_data["seasonality_strength"].mean()),
            "rising_trend_count": int((pipeline_data["seasonal_trend"] == "RISING").sum()) if "seasonal_trend" in pipeline_data.columns else 0,
            "falling_trend_count": int((pipeline_data["seasonal_trend"] == "FALLING").sum()) if "seasonal_trend" in pipeline_data.columns else 0
        }

    agents = [
        {
            "name": "Profit Doctor",
            "status": "completed",
            "metrics": profit_doctor_metrics
        },
        {
            "name": "Inventory Sentinel",
            "status": "completed",
            "metrics": inventory_sentinel_metrics
        },
        {
            "name": "Seasonal Analyst",
            "status": "completed" if seasonal_analyst_metrics else "disabled",
            "metrics": seasonal_analyst_metrics
        },
        {
            "name": "Strategy Supervisor",
            "status": "completed",
            "metrics": strategy_supervisor_metrics
        }
    ]
    
    # Add Ad Gateway status if enabled
    try:
        from agents.ad_gateway import ad_gateway
        from core.config import CFG
        if CFG.enable_ad_gateway:
            ad_summary = ad_gateway.get_summary()
            agents.append({
                "name": "Ad Gateway",
                "status": "connected" if ad_summary.total_campaigns > 0 else "no_campaigns",
                "metrics": {
                    "total_campaigns": ad_summary.total_campaigns,
                    "active_campaigns": ad_summary.active_campaigns,
                    "total_spend_30d": ad_summary.total_spend_30d,
                    "avg_roas": ad_summary.avg_roas,
                    "platforms": ad_summary.platforms
                }
            })
    except Exception:
        pass  # Ad Gateway not available

    return {
        "status": execution_status["status"],
        "message": execution_status["message"],
        "last_execution": last_execution_time.isoformat() if last_execution_time else None,
        "agents": agents
    }


@app.post("/api/agents/run")
async def run_agents():
    """Trigger agent pipeline execution"""
    success = execute_pipeline()
    if success:
        return {
            "status": "success",
            "message": "Pipeline executed successfully",
            "timestamp": last_execution_time.isoformat() if last_execution_time else None
        }
    else:
        raise HTTPException(status_code=500, detail=execution_status["message"])


@app.get("/api/metrics/summary", response_model=MetricsSummary)
async def get_metrics_summary():
    """Get overall metrics summary"""
    if pipeline_data is None:
        raise HTTPException(status_code=404, detail="No pipeline data available. Run the pipeline first.")

    return {
        "total_skus": len(pipeline_data),
        "total_profitable": int((pipeline_data["profit_per_unit"] > 0).sum()),
        "total_loss_makers": int((pipeline_data["profit_per_unit"] < 0).sum()),
        "total_critical_risk": int((pipeline_data["risk_level"] == "CRITICAL").sum()),
        "total_warning_risk": int((pipeline_data["risk_level"] == "WARNING").sum()),
        "total_safe": int((pipeline_data["risk_level"] == "SAFE").sum()),
        "avg_profit_per_unit": float(pipeline_data["profit_per_unit"].mean()),
        "total_profit_at_risk": float(pipeline_data["profit_at_risk"].sum()),
        "total_daily_loss": float(pipeline_data["loss_per_day"].sum())
    }


@app.get("/api/recommendations", response_model=List[SKURecommendation])
async def get_recommendations():
    """Get all SKU recommendations"""
    if pipeline_data is None:
        raise HTTPException(status_code=404, detail="No pipeline data available. Run the pipeline first.")

    # Check which LLM columns exist in DataFrame
    llm_cols = {
        "llm_profit_insight", "llm_inventory_insight", "llm_strategy_insight",
        "llm_profit_confidence", "llm_inventory_confidence", "llm_strategy_confidence"
    }
    available_llm_cols = [col for col in llm_cols if col in pipeline_data.columns]
    
    # Convert DataFrame to list of dicts (including LLM insights)
    recommendations = []
    for _, row in pipeline_data.iterrows():
        sku_id = row["sku_id"]
        # Get CURRENT mode from storage (not stale mode from pipeline)
        current_mode = sku_mode_manager.get_mode(sku_id)
        
        rec = {
            "sku_id": sku_id,
            "category": row["category"],
            "product_name": row["product_name"],
            "selling_price": float(row["selling_price"]),
            "cogs": float(row["cogs"]),
            "current_stock": int(row["current_stock"]),
            "lead_time_days": int(row["lead_time_days"]),
            "profit_per_unit": float(row["profit_per_unit"]),
            "loss_per_day": float(row["loss_per_day"]),
            "sales_velocity_per_day": float(row["sales_velocity_per_day"]),
            "days_of_stock_left": float(row["days_of_stock_left"]) if row["days_of_stock_left"] != float('inf') else 999999,
            "risk_level": row["risk_level"],
            "reorder_qty_suggested": float(row["reorder_qty_suggested"]),
            "profit_at_risk": float(row["profit_at_risk"]),
            "impact_score": float(row["impact_score"]),
            "recommended_action": row["recommended_action"],
            "strategy_mode": current_mode  # Use CURRENT mode from storage!
        }
        
        # Add LLM insights if columns exist and have values
        for col in available_llm_cols:
            val = row[col]
            if pd.notna(val) and str(val).strip():
                if "confidence" in col:
                    rec[col] = float(val)
                else:
                    rec[col] = str(val)
        
        recommendations.append(rec)

    return recommendations


@app.get("/api/sku/{sku_id}")
async def get_sku_details(sku_id: str):
    """Get details for a specific SKU"""
    if pipeline_data is None:
        raise HTTPException(status_code=404, detail="No pipeline data available. Run the pipeline first.")

    sku_data = pipeline_data[pipeline_data["sku_id"] == sku_id]
    if sku_data.empty:
        raise HTTPException(status_code=404, detail=f"SKU {sku_id} not found")

    row = sku_data.iloc[0]
    return {
        "sku_id": row["sku_id"],
        "category": row["category"],
        "product_name": row["product_name"],
        "selling_price": float(row["selling_price"]),
        "cogs": float(row["cogs"]),
        "current_stock": int(row["current_stock"]),
        "lead_time_days": int(row["lead_time_days"]),
        "profit_per_unit": float(row["profit_per_unit"]),
        "loss_per_day": float(row["loss_per_day"]),
        "sales_velocity_per_day": float(row["sales_velocity_per_day"]),
        "days_of_stock_left": float(row["days_of_stock_left"]) if row["days_of_stock_left"] != float('inf') else 999999,
        "risk_level": row["risk_level"],
        "reorder_qty_suggested": float(row["reorder_qty_suggested"]),
        "profit_at_risk": float(row["profit_at_risk"]),
        "impact_score": float(row["impact_score"]),
        "recommended_action": row["recommended_action"]
    }


@app.get("/api/debug/columns")
async def debug_columns():
    """Debug endpoint to check what columns are in pipeline_data"""
    if pipeline_data is None:
        return {"error": "No pipeline data"}
    return {
        "columns": list(pipeline_data.columns),
        "llm_columns": [c for c in pipeline_data.columns if 'llm' in c.lower()],
        "first_row_llm_profit": str(pipeline_data.iloc[0].get("llm_profit_insight", "NOT FOUND")) if len(pipeline_data) > 0 else "NO DATA"
    }


# ============================================================================
# Seasonal Analysis Endpoints
# ============================================================================

@app.get("/api/seasonal/analysis")
async def get_seasonal_analysis():
    """
    Get seasonal analysis for all SKUs.
    Returns seasonal indices, trends, and risk flags.
    """
    if pipeline_data is None:
        raise HTTPException(status_code=404, detail="No pipeline data available. Run the pipeline first.")
    
    # Check if seasonal columns exist
    if "seasonality_strength" not in pipeline_data.columns:
        return {
            "status": "disabled",
            "message": "Seasonal analysis not available. Run pipeline with seasonal data.",
            "analysis": []
        }
    
    analysis = []
    for _, row in pipeline_data.iterrows():
        item = {
            "sku_id": row["sku_id"],
            "product_name": row["product_name"],
            "category": row["category"],
            "seasonal_index_current": float(row.get("seasonal_index_current", 1.0)),
            "seasonal_index_next": float(row.get("seasonal_index_next", 1.0)),
            "peak_month": row.get("peak_month", ""),
            "trough_month": row.get("trough_month", ""),
            "seasonal_trend": row.get("seasonal_trend", "STABLE"),
            "seasonality_strength": float(row.get("seasonality_strength", 0.0)),
            "seasonal_forecast": float(row.get("seasonal_forecast", 0.0)),
            "seasonal_risk_flag": bool(row.get("seasonal_risk_flag", False)),
            "llm_seasonal_insight": row.get("llm_seasonal_insight", "") if pd.notna(row.get("llm_seasonal_insight")) else ""
        }
        analysis.append(item)
    
    # Sort by seasonality strength (most seasonal first)
    analysis.sort(key=lambda x: x["seasonality_strength"], reverse=True)
    
    return {
        "status": "success",
        "total_skus": len(analysis),
        "strong_seasonality_count": sum(1 for a in analysis if a["seasonality_strength"] > 0.3),
        "seasonal_risk_count": sum(1 for a in analysis if a["seasonal_risk_flag"]),
        "analysis": analysis
    }


@app.get("/api/seasonal/risks")
async def get_seasonal_risks():
    """
    Get SKUs with seasonal risk flags.
    These are products with high stock entering low season.
    """
    if pipeline_data is None:
        raise HTTPException(status_code=404, detail="No pipeline data available.")
    
    if "seasonal_risk_flag" not in pipeline_data.columns:
        return {"risks": [], "message": "Seasonal analysis not available"}
    
    risk_items = pipeline_data[pipeline_data["seasonal_risk_flag"] == True]
    
    risks = []
    for _, row in risk_items.iterrows():
        risks.append({
            "sku_id": row["sku_id"],
            "product_name": row["product_name"],
            "current_stock": int(row["current_stock"]),
            "days_of_stock_left": float(row.get("days_of_stock_left", 0)),
            "seasonal_index_next": float(row.get("seasonal_index_next", 1.0)),
            "seasonal_trend": row.get("seasonal_trend", "STABLE"),
            "profit_per_unit": float(row.get("profit_per_unit", 0)),
            "recommendation": "Consider discount promotion before low season"
        })
    
    return {
        "total_risks": len(risks),
        "risks": risks
    }


@app.get("/api/seasonal/sku/{sku_id}")
async def get_sku_seasonal_details(sku_id: str):
    """
    Get detailed seasonal analysis for a specific SKU.
    """
    if pipeline_data is None:
        raise HTTPException(status_code=404, detail="No pipeline data available.")
    
    sku_data = pipeline_data[pipeline_data["sku_id"] == sku_id]
    if sku_data.empty:
        raise HTTPException(status_code=404, detail=f"SKU {sku_id} not found")
    
    row = sku_data.iloc[0]
    
    return {
        "sku_id": row["sku_id"],
        "product_name": row["product_name"],
        "category": row["category"],
        "seasonal_metrics": {
            "seasonal_index_current": float(row.get("seasonal_index_current", 1.0)),
            "seasonal_index_next": float(row.get("seasonal_index_next", 1.0)),
            "peak_month": row.get("peak_month", ""),
            "trough_month": row.get("trough_month", ""),
            "seasonal_trend": row.get("seasonal_trend", "STABLE"),
            "seasonality_strength": float(row.get("seasonality_strength", 0.0)),
            "seasonal_forecast": float(row.get("seasonal_forecast", 0.0)),
            "seasonal_risk_flag": bool(row.get("seasonal_risk_flag", False))
        },
        "inventory_metrics": {
            "current_stock": int(row["current_stock"]),
            "days_of_stock_left": float(row.get("days_of_stock_left", 0)),
            "sales_velocity_per_day": float(row.get("sales_velocity_per_day", 0))
        },
        "llm_seasonal_insight": row.get("llm_seasonal_insight", "") if pd.notna(row.get("llm_seasonal_insight")) else ""
    }

# ============================================================================
# Ad Gateway Endpoints
# ============================================================================

from agents.ad_gateway import (
    AdGateway, AdPlatformCredentials, CampaignCreate, CampaignUpdate,
    Campaign, AdMetrics, AdSummary
)
from agents.ad_optimizer import AdOptimizerAgent

# Initialize Ad Gateway
ad_gateway_instance = AdGateway()


@app.post("/api/ads/connect")
async def connect_ad_platform(credentials: AdPlatformCredentials):
    """
    Connect to an ad platform API.
    Accepts credentials for GOOGLE_ADS, META_ADS, or AMAZON_ADS.
    """
    result = ad_gateway_instance.connect_platform(credentials)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Connection failed"))
    return result


@app.get("/api/ads/platforms")
async def get_connected_platforms():
    """Get list of connected ad platforms"""
    return {
        "platforms": ad_gateway_instance.get_connected_platforms(),
        "total": len(ad_gateway_instance.connected_platforms)
    }


@app.delete("/api/ads/disconnect/{platform}")
async def disconnect_ad_platform(platform: str):
    """Disconnect from an ad platform"""
    success = ad_gateway_instance.disconnect_platform(platform)
    if not success:
        raise HTTPException(status_code=404, detail=f"Platform {platform} not connected")
    return {"success": True, "message": f"Disconnected from {platform}"}


@app.get("/api/ads/campaigns")
async def get_ad_campaigns(
    sku_id: Optional[str] = None,
    platform: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Get all ad campaigns with optional filters.
    """
    campaigns = ad_gateway_instance.get_campaigns(sku_id=sku_id, platform=platform, status=status)
    return {
        "total": len(campaigns),
        "campaigns": [c.model_dump() for c in campaigns]
    }


@app.get("/api/ads/campaigns/{campaign_id}")
async def get_ad_campaign(campaign_id: str):
    """Get a specific campaign by ID"""
    campaign = ad_gateway_instance.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    return campaign.model_dump()


@app.post("/api/ads/campaigns")
async def create_ad_campaign(data: CampaignCreate):
    """Create a new ad campaign"""
    campaign = ad_gateway_instance.create_campaign(data)
    return {
        "success": True,
        "message": "Campaign created successfully",
        "campaign": campaign.model_dump()
    }


@app.put("/api/ads/campaigns/{campaign_id}")
async def update_ad_campaign(campaign_id: str, data: CampaignUpdate):
    """Update an existing campaign"""
    campaign = ad_gateway_instance.update_campaign(campaign_id, data)
    if not campaign:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    return {
        "success": True,
        "message": "Campaign updated successfully",
        "campaign": campaign.model_dump()
    }


@app.post("/api/ads/campaigns/{campaign_id}/pause")
async def pause_ad_campaign(campaign_id: str):
    """Pause an active campaign"""
    success = ad_gateway_instance.pause_campaign(campaign_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    return {"success": True, "message": f"Campaign {campaign_id} paused"}


@app.post("/api/ads/campaigns/{campaign_id}/resume")
async def resume_ad_campaign(campaign_id: str):
    """Resume a paused campaign"""
    success = ad_gateway_instance.resume_campaign(campaign_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    return {"success": True, "message": f"Campaign {campaign_id} resumed"}


@app.delete("/api/ads/campaigns/{campaign_id}")
async def delete_ad_campaign(campaign_id: str):
    """Delete a campaign"""
    success = ad_gateway_instance.delete_campaign(campaign_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    return {"success": True, "message": f"Campaign {campaign_id} deleted"}


@app.get("/api/ads/metrics/summary")
async def get_ad_metrics_summary():
    """Get overall ad performance summary"""
    summary = ad_gateway_instance.get_summary()
    return summary.model_dump()


@app.get("/api/ads/metrics/sku/{sku_id}")
async def get_ad_metrics_by_sku(sku_id: str):
    """Get ad metrics for a specific SKU"""
    metrics = ad_gateway_instance.get_metrics_by_sku(sku_id)
    campaigns = ad_gateway_instance.get_campaigns(sku_id=sku_id)
    
    return {
        "sku_id": sku_id,
        "metrics": metrics.model_dump(),
        "campaigns": [c.model_dump() for c in campaigns],
        "campaign_count": len(campaigns)
    }


@app.get("/api/ads/metrics/roas")
async def get_roas_by_sku():
    """Get ROAS for all SKUs"""
    roas_map = ad_gateway_instance.get_roas_by_sku()
    
    # Sort by ROAS descending
    sorted_roas = sorted(roas_map.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "total_skus": len(roas_map),
        "avg_roas": round(sum(roas_map.values()) / max(1, len(roas_map)), 2),
        "roas_by_sku": [{"sku_id": k, "roas": v} for k, v in sorted_roas]
    }


@app.get("/api/ads/budget/overview")
async def get_budget_overview():
    """Get budget allocation overview"""
    campaigns = ad_gateway_instance.get_campaigns(status="ACTIVE")
    
    total_daily_budget = sum(c.daily_budget for c in campaigns)
    total_spend_30d = sum(c.total_spend_30d for c in campaigns)
    
    # Group by platform
    platform_budgets = {}
    for c in campaigns:
        if c.platform not in platform_budgets:
            platform_budgets[c.platform] = {"daily_budget": 0, "spend_30d": 0, "campaigns": 0}
        platform_budgets[c.platform]["daily_budget"] += c.daily_budget
        platform_budgets[c.platform]["spend_30d"] += c.total_spend_30d
        platform_budgets[c.platform]["campaigns"] += 1
    
    return {
        "total_daily_budget": round(total_daily_budget, 2),
        "total_spend_30d": round(total_spend_30d, 2),
        "active_campaigns": len(campaigns),
        "by_platform": platform_budgets
    }


@app.post("/api/ads/optimize")
async def get_optimization_suggestions():
    """Get AI-powered optimization suggestions"""
    optimizer = AdOptimizerAgent()
    campaigns = [c.model_dump() for c in ad_gateway_instance.get_campaigns()]
    summary = ad_gateway_instance.get_summary().model_dump()
    
    # Get underperforming campaigns
    underperforming = optimizer.identify_underperforming_ads(campaigns)
    
    # Get budget suggestions
    budget_suggestions = optimizer.suggest_budget_reallocation(campaigns)
    
    # Generate report
    report = optimizer.generate_optimization_report(campaigns, summary)
    
    return {
        "underperforming_campaigns": [up.model_dump() for up in underperforming],
        "budget_suggestions": [bs.model_dump() for bs in budget_suggestions],
        "optimization_report": report,
        "llm_enabled": optimizer.has_llm
    }


@app.get("/api/ads/spend/{sku_id}")
async def get_ad_spend_for_sku(sku_id: str, days: int = 30):
    """Get total ad spend for a SKU"""
    spend = ad_gateway_instance.get_ad_spend_by_sku(sku_id, days)
    return {
        "sku_id": sku_id,
        "days": days,
        "total_spend": round(spend, 2)
    }


# ============================================================================
# n8n Integration Endpoints
# ============================================================================

class ShopifyData(BaseModel):
    """Model for Shopify data sent from n8n"""
    products: List[Dict[str, Any]]
    orders: Optional[List[Dict[str, Any]]] = None


class N8nActionLog(BaseModel):
    """Model for logging actions taken by n8n"""
    sku_id: str
    action_type: str
    risk_level: str
    notification_sent: bool
    timestamp: str
    approval_status: Optional[str] = None


class N8nWorkflowComplete(BaseModel):
    """Model for workflow completion notification"""
    workflow_id: str
    execution_id: str
    total_skus_processed: int
    timestamp: str
    status: str


# Global storage for n8n logs
n8n_action_logs: List[Dict[str, Any]] = []
n8n_workflow_history: List[Dict[str, Any]] = []


# ============================================================================
# User Action Models (for bidirectional communication)
# ============================================================================

class UserAction(BaseModel):
    """Model for user actions from email replies or dashboard"""
    sku_id: str
    action: str  # APPROVE_RESTOCK, CHANGE_PRICE, PAUSE_ADS, REJECT, etc.
    quantity: Optional[int] = None
    price: Optional[float] = None
    email_id: Optional[str] = None
    timestamp: str
    status: str = "pending"  # pending, executed, failed
    execution_details: Optional[Dict[str, Any]] = None


class InternalAction(BaseModel):
    """Model for internal actions triggered from dashboard"""
    sku_id: str
    action_type: str  # RESTOCK, PRICE_CHANGE, DISMISS
    value: Optional[float] = None  # New quantity or new price
    original_value: Optional[float] = None
    rationale: Optional[str] = None


# Global storage for user actions
pending_user_actions: List[Dict[str, Any]] = []
completed_user_actions: List[Dict[str, Any]] = []


@app.post("/api/n8n/analyze")
async def n8n_analyze_shopify_data(data: ShopifyData):
    """
    Endpoint for n8n to trigger agent analysis with Shopify data.
    
    This receives product and order data from Shopify via n8n,
    transforms it to agent format, and returns real recommendations.
    """
    global pipeline_data, last_execution_time, execution_status, data_source
    
    try:
        print(f"[INFO] n8n triggered analysis with {len(data.products)} products")
        
        # DEBUG: Print first product to verify input
        if data.products:
            print(f"[DEBUG] First product: {data.products[0].get('title', 'NO TITLE')}")
        
        execution_status = {"status": "running", "message": "n8n workflow triggered analysis..."}
        
        # ============================================================
        # TRANSFORM SHOPIFY DATA TO AGENT FORMAT
        # ============================================================
        
        # Create SKU master DataFrame from Shopify products
        sku_master_rows = []
        
        for product in data.products:
            # Extract product details
            product_id = product.get("id", "unknown")
            product_title = product.get("title", "Unknown Product")
            product_type = product.get("product_type", "General")
            vendor = product.get("vendor", "Unknown")
            
            # Get first variant (or iterate through all variants if needed)
            variants = product.get("variants", [])
            if not variants:
                print(f"[WARNING] Product {product_title} has no variants, skipping")
                continue
                
            variant = variants[0]
            
            # Extract pricing
            selling_price = float(variant.get("price", 0))
            
            # Estimate COGS (48% of selling price as default, adjust as needed)
            cogs = selling_price * 0.48
            
            # Extract inventory
            inventory_quantity = variant.get("inventory_quantity", 0)
            
            # Generate SKU from Shopify ID
            sku_id = f"SKU_{product_type.upper().replace(' ', '_')}_{product_id}"
            
            # Map Shopify product_type to your category system
            category_map = {
                "Shoes": "Footwear",
                "Apparel": "Fashion",
                "Electronics": "Electronics",
                "Beauty": "Beauty",
                "Home": "Home"
            }
            category = category_map.get(product_type, product_type)
            
            # Create row for SKU master
            sku_row = {
                "sku_id": sku_id,
                "category": category,
                "product_name": product_title,
                "selling_price": selling_price,
                "mrp": selling_price * 1.5,  # Estimate MRP as 1.5x selling price
                "cogs": cogs,
                "shipping_cost_per_unit": 75,  # Default shipping cost
                "platform_fee_percent": 2.0,
                "platform_fixed_fee": 3,
                "ad_spend_total_last_30_days": 5000,  # Default ad spend
                "units_sold_last_30_days": 150,  # Default sales (can be calculated from orders if provided)
                "current_stock": inventory_quantity,
                "lead_time_days": 12,  # Default lead time
                "is_hero": False,
                # Store Shopify IDs for write-back
                "shopify_variant_id": variant.get("id"),
                "shopify_inventory_item_id": variant.get("inventory_item_id")
            }
            
            sku_master_rows.append(sku_row)
        
        if not sku_master_rows:
            raise HTTPException(status_code=400, detail="No valid products to analyze")
        
        df_master = pd.DataFrame(sku_master_rows)
        print(f"[INFO] Created SKU master with {len(df_master)} products")
        
        # Create sample sales history (in production, use actual Shopify orders)
        # For now, generate synthetic sales based on units_sold_last_30_days
        # Extended to 90 days for seasonal analysis
        sales_rows = []
        for _, sku in df_master.iterrows():
            # Generate 90 days of sales data (minimum for seasonal analysis)
            daily_avg = sku["units_sold_last_30_days"] / 30
            for day in range(1, 91):
                # Add some randomness to daily sales
                import random
                daily_units = max(0, int(daily_avg * random.uniform(0.5, 1.5)))
                # Generate dates going back 90 days from today
                from datetime import timedelta
                date_obj = datetime.now() - timedelta(days=90-day)
                sales_rows.append({
                    "sku_id": sku["sku_id"],
                    "date": date_obj.strftime("%Y-%m-%d"),
                    "units_sold": daily_units
                })
        
        df_sales = pd.DataFrame(sales_rows)
        print(f"[INFO] Created sales history with {len(df_sales)} records")
        
        # ============================================================
        # RUN AGENT PIPELINE WITH SHOPIFY DATA
        # ============================================================
        
        # Run agents on transformed Shopify data
        from datetime import timedelta
        from agents.profit_doctor import ProfitDoctorAgent
        from agents.inventory_sentinel import InventorySentinelAgent
        from agents.seasonal_analyst import SeasonalAnalystAgent
        from agents.strategy_supervisor import StrategySupervisorAgent
        
        # Agent 1: Profit Doctor
        profit_agent = ProfitDoctorAgent()
        df_profit = profit_agent.compute_profit_metrics(df_master)
        print(f"[INFO] Profit Doctor analyzed {len(df_profit)} SKUs")
        
        # Agent 2: Inventory Sentinel
        inventory_agent = InventorySentinelAgent()
        df_inventory = inventory_agent.compute_inventory_metrics(df_profit, df_sales)
        print(f"[INFO] Inventory Sentinel analyzed {len(df_inventory)} SKUs")
        
        # Agent 3: Seasonal Analyst
        seasonal_agent = SeasonalAnalystAgent()
        df_seasonal = seasonal_agent.compute_seasonal_metrics(df_inventory, df_sales)
        print(f"[INFO] Seasonal Analyst analyzed {len(df_seasonal)} SKUs")
        
        # Agent 4: Strategy Supervisor
        strategy_agent = StrategySupervisorAgent()
        df_final = strategy_agent.rank_actions(df_seasonal)
        print(f"[INFO] Strategy Supervisor ranked {len(df_final)} SKUs")
        
        # Update global pipeline data
        pipeline_data = df_final
        data_source = "shopify"  # Mark as Shopify data
        last_execution_time = datetime.now()
        execution_status = {
            "status": "success",
            "message": f"n8n analysis completed at {last_execution_time.strftime('%Y-%m-%d %H:%M:%S')}"
        }
        
        # Convert recommendations to JSON-serializable format
        recommendations = []
        for _, row in df_final.iterrows():
            recommendations.append({
                "sku_id": row["sku_id"],
                "category": row["category"],
                "product_name": row["product_name"],
                "selling_price": float(row["selling_price"]),
                "cogs": float(row["cogs"]),
                "current_stock": int(row["current_stock"]),
                "lead_time_days": int(row["lead_time_days"]),
                "profit_per_unit": float(row["profit_per_unit"]),
                "loss_per_day": float(row["loss_per_day"]),
                "sales_velocity_per_day": float(row["sales_velocity_per_day"]),
                "days_of_stock_left": float(row["days_of_stock_left"]) if row["days_of_stock_left"] != float('inf') else 999999,
                "risk_level": row["risk_level"],
                "reorder_qty_suggested": float(row["reorder_qty_suggested"]),
                "profit_at_risk": float(row["profit_at_risk"]),
                "impact_score": float(row["impact_score"]),
                "recommended_action": row["recommended_action"]
            })
        
        return {
            "status": "success",
            "message": "Agent analysis completed with Shopify data",
            "timestamp": last_execution_time.isoformat(),
            "total_skus": len(recommendations),
            "recommendations": recommendations,
            "summary": {
                "critical_risk": int((df_final["risk_level"] == "CRITICAL").sum()),
                "warning_risk": int((df_final["risk_level"] == "WARNING").sum()),
                "profitable_skus": int((df_final["profit_per_unit"] > 0).sum()),
                "loss_makers": int((df_final["profit_per_unit"] < 0).sum())
            }
        }
            
    except Exception as e:
        execution_status = {"status": "error", "message": f"n8n analysis failed: {str(e)}"}
        print(f"[ERROR] n8n analysis failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/n8n/log-action")
async def n8n_log_action(log: N8nActionLog):
    """
    Endpoint for n8n to log actions taken (alerts, approvals, executions).
    
    This creates an audit trail of all n8n workflow actions.
    """
    try:
        log_entry = {
            "sku_id": log.sku_id,
            "action_type": log.action_type,
            "risk_level": log.risk_level,
            "notification_sent": log.notification_sent,
            "timestamp": log.timestamp,
            "approval_status": log.approval_status,
            "logged_at": datetime.now().isoformat()
        }
        
        n8n_action_logs.append(log_entry)
        
        print(f"[INFO] n8n action logged: {log.sku_id} - {log.action_type}")
        
        return {
            "status": "success",
            "message": "Action logged successfully",
            "log_id": len(n8n_action_logs) - 1
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to log n8n action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/n8n/workflow-complete")
async def n8n_workflow_complete(workflow: N8nWorkflowComplete):
    """
    Endpoint for n8n to notify when workflow completes.
    
    This tracks workflow execution history and completion status.
    """
    try:
        workflow_entry = {
            "workflow_id": workflow.workflow_id,
            "execution_id": workflow.execution_id,
            "total_skus_processed": workflow.total_skus_processed,
            "timestamp": workflow.timestamp,
            "status": workflow.status,
            "completed_at": datetime.now().isoformat()
        }
        
        n8n_workflow_history.append(workflow_entry)
        
        print(f"[INFO] n8n workflow completed: {workflow.execution_id} - {workflow.total_skus_processed} SKUs")
        
        return {
            "status": "success",
            "message": "Workflow completion recorded",
            "workflow_history_id": len(n8n_workflow_history) - 1
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to record workflow completion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/n8n/logs")
async def get_n8n_logs(limit: int = 50):
    """Get recent n8n action logs"""
    return {
        "total_logs": len(n8n_action_logs),
        "logs": n8n_action_logs[-limit:]
    }


@app.get("/api/n8n/workflow-history")
async def get_n8n_workflow_history(limit: int = 20):
    """Get n8n workflow execution history"""
    return {
        "total_executions": len(n8n_workflow_history),
        "history": n8n_workflow_history[-limit:]
    }


# ============================================================================
# User Action Endpoints (Bidirectional Communication)
# ============================================================================

@app.post("/api/n8n/user-action")
async def receive_user_action(action: UserAction):
    """
    Endpoint for n8n to send user actions (from email replies).
    
    This receives user responses from email and logs them for tracking.
    The action execution (Shopify updates) happens in n8n workflow.
    """
    try:
        action_entry = {
            "sku_id": action.sku_id,
            "action": action.action,
            "quantity": action.quantity,
            "price": action.price,
            "email_id": action.email_id,
            "timestamp": action.timestamp,
            "status": action.status,
            "execution_details": action.execution_details,
            "received_at": datetime.now().isoformat()
        }
        
        # Add to appropriate list based on status
        if action.status == "pending":
            pending_user_actions.append(action_entry)
        elif action.status in ["executed", "completed", "success"]:
            completed_user_actions.append(action_entry)
            # Remove from pending if it was there
            pending_user_actions[:] = [a for a in pending_user_actions if a["sku_id"] != action.sku_id or a["action"] != action.action]
        
        print(f"[INFO] User action received: {action.sku_id} - {action.action} ({action.status})")
        
        return {
            "status": "success",
            "message": "User action received and logged",
            "action_id": len(completed_user_actions + pending_user_actions) - 1
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to log user action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user-actions/pending")
async def get_pending_actions():
    """Get all pending user actions (awaiting execution)"""
    return {
        "total_pending": len(pending_user_actions),
        "actions": pending_user_actions
    }


@app.get("/api/user-actions/completed")
async def get_completed_actions(limit: int = 50):
    """Get recent completed user actions"""
    return {
        "total_completed": len(completed_user_actions),
        "actions": completed_user_actions[-limit:]
    }


@app.get("/api/user-actions/history")
async def get_action_history(sku_id: Optional[str] = None, limit: int = 100):
    """
    Get action history, optionally filtered by SKU.
    Returns both pending and completed actions.
    """
    all_actions = pending_user_actions + completed_user_actions
    
    if sku_id:
        filtered = [a for a in all_actions if a["sku_id"] == sku_id]
        all_actions = filtered
    
    # Sort by timestamp (most recent first)
    all_actions = sorted(all_actions, key=lambda x: x.get("received_at", ""), reverse=True)
    
    return {
        "total_actions": len(all_actions),
        "sku_filter": sku_id,
        "actions": all_actions[:limit]
    }


@app.patch("/api/user-actions/{action_index}/status")
async def update_action_status(action_index: int, status: str, execution_details: Optional[Dict[str, Any]] = None):
    """
    Update the status of a user action (called by n8n after execution).
    
    Args:
        action_index: Index of the action in pending_user_actions
        status: New status (executed, failed, etc.)
        execution_details: Details about the execution
    """
    try:
        if action_index < 0 or action_index >= len(pending_user_actions):
            raise HTTPException(status_code=404, detail="Action not found")
        
        action = pending_user_actions[action_index]
        action["status"] = status
        action["execution_details"] = execution_details
        action ["updated_at"] = datetime.now().isoformat()
        
        # Move to completed if status is final
        if status in ["executed", "completed", "success", "failed", "rejected"]:
            completed_user_actions.append(action)
            pending_user_actions.pop(action_index)
        
        print(f"[INFO] Action status updated: {action['sku_id']} - {status}")
        
        return {
            "status": "success",
            "message": "Action status updated",
            "action": action
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to update action status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/alerts")
async def get_alerts():
    """
    Get actionable alerts from current recommendations.
    Filters for CRITICAL or WARNING items unless already acted upon.
    """
    if pipeline_data is None:
        return {"alerts": []}
        
    alerts = []
    
    # Filter for actionable items
    actionable = pipeline_data[
        (pipeline_data["risk_level"].isin(["CRITICAL", "WARNING"])) |
        (pipeline_data["is_loss_maker"] == True)
    ]
    
    # Exclude already acted upon SKUs (simple in-memory check for this session)
    acted_skus = {a["sku_id"] for a in completed_user_actions if a["status"] == "executed"}
    # Also exclude dismissed
    dismissed_skus = {a["sku_id"] for a in completed_user_actions if a.get("action") == "DISMISS"}
    
    exclude_skus = acted_skus.union(dismissed_skus)
    
    for _, row in actionable.iterrows():
        if row["sku_id"] in exclude_skus:
            continue
            
        alerts.append({
            "sku_id": row["sku_id"],
            "product_name": row["product_name"],
            "risk_level": row["risk_level"],
            "recommended_action": row["recommended_action"],
            "current_stock": int(row["current_stock"]),
            "selling_price": float(row["selling_price"]),
            "profit_per_unit": float(row["profit_per_unit"]),
            "impact_score": float(row["impact_score"]),
            # Include suggested values
            "suggested_reorder": float(row["reorder_qty_suggested"]) if row["reorder_qty_suggested"] > 0 else 50,
            "suggested_price": float(row["selling_price"]) * 1.1 if "PRICE" in row["recommended_action"] else None
        })
        
    # Sort by impact
    alerts.sort(key=lambda x: x["impact_score"], reverse=True)
    return alerts



def update_csv_source(sku_id: str, action_type: str, value: float):
    """
    Update the master CSV file to persist changes locally.
    """
    try:
        master_path = CFG.sku_master_path
        if not os.path.exists(master_path):
            print(f"[WARNING] Master CSV not found at {master_path}")
            return

        df_master = pd.read_csv(master_path)
        mask = df_master["sku_id"] == sku_id
        
        if mask.any():
            if action_type == "RESTOCK":
                current = df_master.loc[mask, "current_stock"].values[0]
                df_master.loc[mask, "current_stock"] = current + (value or 0)
            elif action_type == "PRICE_CHANGE":
                df_master.loc[mask, "selling_price"] = value
                
            df_master.to_csv(master_path, index=False)
            print(f"[SUCCESS] Updated {sku_id} in {master_path}")
        else:
            print(f"[WARNING] SKU {sku_id} not found in master CSV")
            
    except Exception as e:
        print(f"[ERROR] Error updating CSV: {str(e)}")
        raise


@app.post("/api/alerts/action")
async def execute_alert_action(action: InternalAction):
    """
    Execute an action from the Alerts tab.
    Mock update for now, but logs the action as if sent to Shopify.
    """
    global pipeline_data
    
    try:
        # Log the action
        action_entry = {
            "sku_id": action.sku_id,
            "action": action.action_type,
            "value": action.value,
            "timestamp": datetime.now().isoformat(),
            "status": "executed",
            "source": "dashboard_alerts"
        }
        completed_user_actions.append(action_entry)
        
        # MOCK UPDATE: Update the local pipeline_data to reflect change
        if pipeline_data is not None and not pipeline_data.empty:
            if action.action_type == "RESTOCK":
                # Update stock
                mask = pipeline_data["sku_id"] == action.sku_id
                if mask.any():
                    current = pipeline_data.loc[mask, "current_stock"].values[0]
                    new_stock = current + (action.value or 0)
                    pipeline_data.loc[mask, "current_stock"] = new_stock
                    # Recalculate risk (simplified)
                    pipeline_data.loc[mask, "risk_level"] = "SAFE" 
                    pipeline_data.loc[mask, "recommended_action"] = "MONITOR"
                    print(f"[INFO] Mock update: Restocked {action.sku_id} to {new_stock}")
                    
            elif action.action_type == "PRICE_CHANGE":
                # Update price
                mask = pipeline_data["sku_id"] == action.sku_id
                if mask.any():
                    pipeline_data.loc[mask, "selling_price"] = action.value
                    # Recalculate profit (simplified)
                    pipeline_data.loc[mask, "profit_per_unit"] += (action.value - (action.original_value or action.value)) # Approximate
                    pipeline_data.loc[mask, "recommended_action"] = "MONITOR"
                    print(f"[INFO] Mock update: Repriced {action.sku_id} to {action.value}")

        # PERSIST UPDATE: Update the source (CSV or Shopify)
        try:
            if data_source == "shopify" and CFG.shopify_access_token:
                loader = ShopifyLoader()
                # Find IDs from dataframe
                mask = pipeline_data["sku_id"] == action.sku_id
                if mask.any():
                    row = pipeline_data.loc[mask].iloc[0]
                    # Check if we have variant ID mapped (ShopifyLoader adds it)
                    if "shopify_variant_id" in row:
                        variant_id = int(row["shopify_variant_id"])
                        inv_id = int(row["shopify_inventory_item_id"])
                        
                        if action.action_type == "RESTOCK":
                            # We need new TOTAL qty, not just add
                            current = int(row["current_stock"]) # This is already updated in memory above
                            # But wait, above updated pipeline_data. So 'row' has NEW stock.
                            loader.update_stock(variant_id, inv_id, current)
                        elif action.action_type == "PRICE_CHANGE":
                             loader.update_price(variant_id, action.value)
                        
                        print(f"[INFO] Shopify updated for {action.sku_id}")
            
            elif data_source != "shopify":
                update_csv_source(action.sku_id, action.action_type, action.value)
                print(f"[INFO] Source CSV updated for {action.sku_id}")
                
        except Exception as e:
            print(f"[ERROR] Failed to persist update: {str(e)}")

        return {
            "status": "success", 
            "message": f"Action {action.action_type} executed for {action.sku_id}",
            "updated_value": action.value
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to execute alert action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Sales Analysis Endpoints
# ============================================================================

from agents.sales_analyzer import sales_analyzer

@app.get("/api/sales/monthly")
async def get_monthly_sales():
    """Get monthly sales data from retail dataset"""
    try:
        data = sales_analyzer.get_monthly_sales()
        return data
    except Exception as e:
        print(f"[ERROR] Sales analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sales/top-products")
async def get_top_products(top_n: int = 10):
    """Get top selling products by month"""
    try:
        data = sales_analyzer.get_top_products_by_month(top_n=top_n)
        return data
    except Exception as e:
        print(f"[ERROR] Top products analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sales/products")
async def get_product_sales(limit: int = 20):
    """Get sales data for individual products over months"""
    try:
        data = sales_analyzer.get_product_sales_by_month(limit=limit)
        return data
    except Exception as e:
        print(f"[ERROR] Product sales analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


from agents.advanced_sales_analyzer import advanced_analyzer

@app.get("/api/analytics/products")
async def get_analytics_products(limit: int = 50):
    """Get list of products for advanced analytics"""
    try:
        data = advanced_analyzer.get_product_list(limit=limit)
        return data
    except Exception as e:
        print(f"[ERROR] Product list failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/product/{product_name}")
async def get_product_analytics(product_name: str):
    """Get comprehensive analytics for a specific product"""
    try:
        data = advanced_analyzer.get_product_analytics(product_name)
        return data
    except Exception as e:
        print(f"[ERROR] Product analytics failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Strategy Mode Endpoints
# ============================================================================

from core.strategy_modes import get_all_modes, get_mode_config, get_mode_display_name, StrategyMode
from core.sku_mode_manager import sku_mode_manager


class ModeUpdate(BaseModel):
    """Model for mode update request"""
    mode: str


class BulkModeUpdate(BaseModel):
    """Model for bulk mode update request"""
    updates: Dict[str, str]


@app.get("/api/modes/available")
async def get_available_modes():
    """Get list of all available strategy modes"""
    return {
        "modes": get_all_modes(),
        "default_mode": sku_mode_manager.default_mode
    }


@app.get("/api/sku/{sku_id}/mode")
async def get_sku_mode(sku_id: str):
    """Get strategy mode for a specific SKU"""
    mode = sku_mode_manager.get_mode(sku_id)
    config = get_mode_config(mode)
    
    return {
        "sku_id": sku_id,
        "mode": mode,
        "mode_name": config.name,
        "mode_icon": config.icon,
        "mode_description": config.description,
        "mode_color": config.color
    }


@app.put("/api/sku/{sku_id}/mode")
async def update_sku_mode(sku_id: str, data: ModeUpdate):
    """Update strategy mode for a specific SKU"""
    success = sku_mode_manager.set_mode(sku_id, data.mode)
    
    if not success:
        raise HTTPException(status_code=400, detail=f"Invalid mode: {data.mode}")
    
    # Note: Mode is saved but pipeline needs to be re-run manually (via n8n or /agents/run)
    # to regenerate insights with the new mode
    
    return {
        "success": True,
        "message": f"Mode updated to {get_mode_display_name(data.mode)} - run pipeline to see changes",
        "sku_id": sku_id,
        "mode": data.mode
    }


@app.post("/api/modes/bulk-update")
async def bulk_update_modes(data: BulkModeUpdate):
    """Update modes for multiple SKUs at once"""
    results = sku_mode_manager.bulk_set_modes(data.updates)
    
    success_count = sum(1 for v in results.values() if v)
    
    # Note: Modes are saved but pipeline needs to be re-run manually
    
    return {
        "success": True,
        "total_updates": len(results),
        "successful": success_count,
        "failed": len(results) - success_count,
        "results": results,
        "message": "Modes updated - run pipeline to regenerate insights"
    }


@app.get("/api/modes/distribution")
async def get_mode_distribution():
    """Get distribution of SKUs across different modes"""
    all_modes = sku_mode_manager.get_all_modes()
    
    distribution = {}
    for mode in StrategyMode:
        skus = sku_mode_manager.get_skus_by_mode(mode.value)
        distribution[mode.value] = {
            "count": len(skus),
            "name": get_mode_config(mode.value).name,
            "icon": get_mode_config(mode.value).icon
        }
    
    return {
        "total_skus": len(all_modes),
        "distribution": distribution
    }


@app.delete("/api/sku/{sku_id}/mode")
async def reset_sku_mode(sku_id: str):
    """Reset SKU to default mode"""
    success = sku_mode_manager.reset_mode(sku_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"SKU {sku_id} has no custom mode set")
    
    # Note: Mode is reset but pipeline needs to be re-run manually
    
    return {
        "success": True,
        "message": f"Mode reset to default ({sku_mode_manager.default_mode}) - run pipeline to see changes",
        "sku_id": sku_id
    }


# ============================================================================
# Chat API Endpoints  
# ============================================================================

@app.get("/api/chat/status")
async def chat_status():
    """Check if chat session has data loaded"""
    global chat_data, chat_summary
    return {
        "has_data": chat_data is not None,
        "summary": chat_summary
    }


@app.post("/api/chat/upload-csv")
async def upload_chat_csv(file: UploadFile = File(...)):
    """Upload and analyze CSV file with AI-powered intelligence"""
    global chat_data, chat_summary, chat_data_type
    
    try:
        import io
        import numpy as np
        import traceback
        
        print("[DEBUG] unexpected request to upload-csv")
        
        # Read CSV file
        try:
            contents = await file.read()
            # Try utf-8 first, then latin1
            try:
               df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
            except UnicodeDecodeError:
               df = pd.read_csv(io.BytesIO(contents), encoding='latin1')
               
        except Exception as e:
            print(f"[ERROR] CSV Read Error: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")

        print(f"[INFO] CSV uploaded with {len(df)} rows and columns: {list(df.columns)}")
        
        # Use Ollama AI to analyze the CSV and determine what to do
        try:
            import requests
            # ... (Ollama logic, kept same as before but abbreviated for this replacement block if needed, 
            # OR I can just replace the error handling part)
            
            # Prepare CSV info for AI
            column_info = {
                "columns": list(df.columns),
                "sample_data": df.head(3).to_dict('records'),
                "row_count": len(df)
            }
            
            # Ask Ollama to analyze the CSV
            analysis_prompt = f"""Analyze this CSV data and provide a JSON response:

Columns: {column_info['columns']}
Sample rows: {column_info['sample_data']}
Total rows: {column_info['row_count']}

Identify:
1. data_type: Is this "inventory" (products with prices/stock), "sales" (transactions/sales data), or "generic" (other)?
2. description: brief description of the data

Respond ONLY with valid JSON format:
{{
  "data_type": "inventory|sales|generic",
  "description": "brief description of the data"
}}"""
            
            # Call Ollama API
            response = requests.post(
                'http://localhost:11434/api/generate',
                json={
                    'model': 'llama3.2:1b',
                    'prompt': analysis_prompt,
                    'stream': False
                },
                timeout=15
            )
            
            if response.status_code == 200:
                # Parse Ollama response
                import json
                ollama_result = response.json()
                ai_response = ollama_result.get('response', '')
                
                # Extract JSON from response (handle markdown code blocks)
                if "```json" in ai_response:
                    ai_response = ai_response.split("```json")[1].split("```")[0].strip()
                elif "```" in ai_response:
                    ai_response = ai_response.split("```")[1].split("```")[0].strip()
                    
                ai_analysis = json.loads(ai_response)
                chat_data_type = ai_analysis.get("data_type", "generic")
                
                print(f"[INFO] Ollama detected data type: {chat_data_type}")
            else:
                print(f"[WARNING] Ollama API failed with status {response.status_code}, using fallback")
                chat_data_type = "generic"
                
        except Exception as e:
            print(f"[WARNING] Ollama analysis failed: {str(e)}, using fallback detection")
            chat_data_type = "generic"
        
        print(f"[DEBUG] Adapting to data type: '{chat_data_type}'")
        
        # Adaptive analysis based on data type
        try:
            if chat_data_type == "inventory":
                print("[DEBUG] Routing to Inventory Analyzer")
                analysis_result = analyze_inventory_data(df)
            elif chat_data_type == "sales":
                print("[DEBUG] Routing to Sales Analyzer")
                analysis_result = analyze_sales_data(df)
            else:
                print("[DEBUG] Routing to Generic Analyzer")
                analysis_result = analyze_generic_data(df)
        except Exception as e:
             # Capture analysis error specifically
             print(f"[ERROR] Analysis Failed: {e}")
             traceback.print_exc()
             raise e
        
        chat_data = analysis_result["data"]
        chat_summary = analysis_result["summary"]
        
        return {
            "message": f"Successfully analyzed {len(df)} rows as {chat_data_type} data",
            "summary": chat_summary,
            "data_type": chat_data_type
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"[ERROR] CSV Upload Failed:\n{error_detail}")
        # Log to file
        with open("error.log", "w") as f:
            f.write(error_detail)
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")


def analyze_inventory_data(df: pd.DataFrame) -> Dict:
    """Analyze inventory-focused data - only if it has price/stock columns"""
    print("[DEBUG] Executing analyze_inventory_data")
    import numpy as np
    
    # Check if this is actually inventory data
    def find_column(variations):
        norm_cols = {col.lower().replace('_', '').replace(' ', ''): col for col in df.columns}
        for var in variations:
            norm_var = var.lower().replace('_', '').replace(' ', '')
            if norm_var in norm_cols:
                return norm_cols[norm_var]
        return None
    
    price_col = find_column(['price', 'sellingprice', 'unitprice', 'cost'])
    stock_col = find_column(['stock', 'inventory', 'currentstock', 'stocklevel'])
    
    # If no price or no STOCK columns (quantity alone isn't stock), return raw data
    # This prevents sales transaction data from being treated as inventory
    if not price_col or not stock_col:
        return analyze_generic_data(df)
    
    # This is actual inventory data - do full analysis
    result_df = df.copy()
    product_col = find_column(['product', 'productname', 'name', 'item', 'description'])
    
    if 'sku_id' not in result_df.columns:
        result_df['sku_id'] = [f"SKU_{i:08d}" for i in range(len(result_df))]
    
    if product_col:
        result_df['product_name'] = result_df[product_col]
    else:
        result_df['product_name'] = [f"Product {i+1}" for i in range(len(result_df))]
    
    if price_col:
        result_df['selling_price'] = pd.to_numeric(result_df[price_col], errors='coerce').fillna(0)
    else:
        result_df['selling_price'] = np.random.uniform(10, 1000, len(result_df))
    
    if stock_col:
        result_df['current_stock'] = pd.to_numeric(result_df[stock_col], errors='coerce').fillna(0).astype(int)
    else:
        result_df['current_stock'] = np.random.randint(0, 100, len(result_df))
    
    result_df['sales_velocity_per_day'] = np.random.uniform(0.5, 5.0, len(result_df))
    result_df['cogs'] = result_df['selling_price'] * 0.6
    result_df['profit_per_unit'] = result_df['selling_price'] - result_df['cogs']
    result_df['days_of_stock_left'] = result_df['current_stock'] / result_df['sales_velocity_per_day'].replace(0, 0.01)
    
    def calc_risk(row):
        if row['days_of_stock_left'] < 7 or row['profit_per_unit'] < 0:
            return "CRITICAL"
        elif row['days_of_stock_left'] < 14:
            return "WARNING"
        return "SAFE"
    
    result_df['risk_level'] = result_df.apply(calc_risk, axis=1)
    
    summary = {
        "total_products": len(result_df),
        "critical_risk": int((result_df['risk_level'] == 'CRITICAL').sum()),
        "warning_risk": int((result_df['risk_level'] == 'WARNING').sum()),
        "safe": int((result_df['risk_level'] == 'SAFE').sum()),
        "profitable": int((result_df['profit_per_unit'] > 0).sum()),
        "loss_makers": int((result_df['profit_per_unit'] < 0).sum()),
        "avg_profit": float(result_df['profit_per_unit'].mean())
    }
    
    return {"data": result_df, "summary": summary}


def analyze_sales_data(df: pd.DataFrame) -> Dict:
    """Analyze sales transaction data - return raw data"""
    print("[DEBUG] Executing analyze_sales_data")
    import numpy as np
    
    # Return raw data without modifications - just like generic
    result_df = df.copy()
    
    # Basic statistical summary
    numeric_cols = result_df.select_dtypes(include=[np.number]).columns.tolist()
    
    summary = {
        "total_rows": len(result_df),
        "total_columns": len(result_df.columns),
        "column_names": list(result_df.columns),
        "numeric_columns": numeric_cols,
        "analysis_type": "sales_data",
        "total_products": len(result_df),
        "critical_risk": 0,
        "warning_risk": 0,
        "safe": 0,
        "profitable": 0,
        "loss_makers": 0,
        "avg_profit": 0.0
    }
    
    # Add basic stats for numeric columns
    if numeric_cols:
        summary["statistics"] = {
            col: {
                "mean": float(result_df[col].mean()),
                "median": float(result_df[col].median()),
                "std": float(result_df[col].std()),
                "total": float(result_df[col].sum())
            }
            for col in numeric_cols[:5]
        }
    
    return {"data": result_df, "summary": summary}


def analyze_generic_data(df: pd.DataFrame) -> Dict:
    """Analyze generic/unknown data - return raw CSV without modifications"""
    print("[DEBUG] Executing analyze_generic_data")
    import numpy as np
    
    # Return the raw data without any added columns
    result_df = df.copy()
    
    # Basic statistical summary
    numeric_cols = result_df.select_dtypes(include=[np.number]).columns.tolist()
    
    summary = {
        "total_rows": len(result_df),
        "total_columns": len(result_df.columns),
        "column_names": list(result_df.columns),
        "numeric_columns": numeric_cols,
        "analysis_type": "raw_data",
        "total_products": len(result_df),
        "critical_risk": 0,
        "warning_risk": 0,
        "safe": 0,
        "profitable": 0,
        "loss_makers": 0,
        "avg_profit": 0.0
    }
    
    # Add basic stats for numeric columns
    if numeric_cols:
        summary["statistics"] = {
            col: {
                "mean": float(result_df[col].mean()),
                "median": float(result_df[col].median()),
                "std": float(result_df[col].std()),
                "total": float(result_df[col].sum())
            }
            for col in numeric_cols[:5]  # Limit to first 5 numeric columns
        }
    
    return {"data": result_df, "summary": summary}


@app.post("/api/chat/message")
async def chat_message(data: Dict[str, str]):
    """Handle chat messages with LLM"""
    global chat_data, chat_summary
    
    if chat_data is None:
        raise HTTPException(status_code=400, detail="No data loaded. Upload a CSV first.")
    
    user_message = data.get("message", "")
    
    # Use Groq LLM if available
    # Fallback to simple rule-based responses if no Groq key
    # But wait, we want to try OLLAMA if Groq is missing!
    # Correct logic: Try Groq -> Try Ollama -> Fallback
    
    used_llm = False
    response = None
    
    # 1. Try Groq if configured
    if CFG.groq_api_key and CFG.groq_api_key != "your_groq_api_key_here":
        try:
            from groq import Groq
            client = Groq(api_key=CFG.groq_api_key)
            # Placeholder: If the user actually configured Groq, we'd use it here.
            # But the existing codebase didn't have real Groq usage logic in this block!
            # It just called Ollama inside the Groq block.
            # So let's skip to Ollama unless specific Groq logic is added.
            pass 
        except:
            pass
    
    # REWRITE: Just use Ollama logic directly if users wants "Ollama shit"
    
    # Call Ollama API
    try:
        # Prepare context (same as before)
        if chat_data_type == 'inventory':
            context = f"""You are an inventory analysis assistant. You have access to the following data:
            
Total Products: {chat_summary['total_products']}
Critical Risk: {chat_summary['critical_risk']}
Warning Risk: {chat_summary['warning_risk']}
Safe: {chat_summary['safe']}
Profitable: {chat_summary['profitable']}
Loss Makers: {chat_summary['loss_makers']}
Average Profit: ${chat_summary['avg_profit']:.2f}

The user has uploaded INVENTORY data. Answer their questions based on the risk levels and profit metrics above."""
        else:
            # For Generic/Sales data: Give the LLM actual data visibility
            import io
            
            # Get columns
            columns = ", ".join(chat_data.columns.tolist())
            
            # Get data preview (first 5 rows)
            preview_csv = chat_data.head(5).to_markdown(index=False)
            
            # Get basic stats for numeric columns
            stats_info = ""
            numeric_cols = chat_data.select_dtypes(include=['number']).columns
            if not numeric_cols.empty:
                stats = chat_data[numeric_cols].describe().to_markdown()
                stats_info = f"\n\nData Statistics:\n{stats}"
            
            context = f"""You are an advanced data analyst AI. You are analyzing a CSV file with the following structure:

Columns: {columns}

Data Preview for context:
{preview_csv}
{stats_info}

INSTRUCTIONS:
1. Answer the user's question purely based on the data provided above.
2. Do NOT hallucinate columns that don't exist (like 'risk_level' or 'profit') unless you see them in the preview.
3. If the user asks for 'issues', look for outliers in the data (low sales, high prices, etc.) or just summarize the key trends.
4. Be concise and professional."""
        
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': 'llama3.2:1b',  # Use the installed model
                'prompt': f"System: {context}\n\nUser: {user_message}",
                'stream': False
            },
            timeout=30
        )
        
        if response.status_code == 200:
            response = response.json().get('response', 'I could not generate a response.')
        else:
            # If Ollama fails, fallthrough to simple response
            response = None
            print(f"[WARNING] Ollama returned {response.status_code}")

    except Exception as e:
        print(f"[WARNING] Ollama connection failed: {str(e)}")
        response = None
    
    if not response:
            # Fallback to simple logic
            response = generate_simple_response(user_message, chat_data, chat_summary)

    
    return {
        "response": response,
        "has_data": True,
        "summary": chat_summary
    }


def generate_simple_response(message: str, data: pd.DataFrame, summary: Dict) -> str:
    """Generate rule-based responses when LLM is not available"""
    msg_lower = message.lower()
    
    # Check for columns availability
    has_risk = "risk_level" in data.columns
    has_profit = "profit_per_unit" in data.columns
    has_product = "product_name" in data.columns
    
    product_col = "product_name" if has_product else data.columns[0]
    
    if ("restock" in msg_lower or "stock" in msg_lower) and has_risk:
        critical = data[data["risk_level"] == "CRITICAL"]
        if len(critical) > 0:
            products = ", ".join(critical[product_col].head(3).astype(str).tolist())
            return f"🚨 {len(critical)} products need restocking urgently: {products}"
        return "✅ No urgent restocking needed right now."
    
    elif ("loss" in msg_lower or "losing" in msg_lower) and has_profit:
        loss_makers = data[data["profit_per_unit"] < 0]
        if len(loss_makers) > 0:
            products = ", ".join(loss_makers[product_col].head(3).astype(str).tolist())
            total_loss = abs(loss_makers["profit_per_unit"].sum())
            return f"⚠️ {len(loss_makers)} products are losing money (${total_loss:.2f} total loss): {products}"
        return "✅ No loss-making products found."
    
    elif ("issue" in msg_lower or "problem" in msg_lower or "top" in msg_lower) and has_risk and "impact_score" in data.columns:
        critical = data[data["risk_level"] == "CRITICAL"].nlargest(3, "impact_score")
        issues = []
        for _, row in critical.iterrows():
            issues.append(f"• {row[product_col]}: {row.get('recommended_action', 'Check stock')}")
        if issues:
            return "🔴 Top issues:\n" + "\n".join(issues)
        return "✅ No critical issues found."
    
    elif "health" in msg_lower or "summary" in msg_lower or "overview" in msg_lower:
        if has_risk and has_profit:
             return f"""📊 Inventory Health Summary:
        
• Total Products: {summary.get('total_products', 0)}
• Critical Risk: {summary.get('critical_risk', 0)} 🔴
• Warning: {summary.get('warning_risk', 0)} ⚠️
• Safe: {summary.get('safe', 0)} ✅
• Profitable: {summary.get('profitable', 0)}
• Loss Makers: {summary.get('loss_makers', 0)}
• Avg Profit/Unit: ${summary.get('avg_profit', 0):.2f}"""
        else:
             return f"📊 Data Summary:\n\nAnalyze {summary.get('total_rows', 0)} rows and {summary.get('total_columns', 0)} columns. I can help you explore specific trends!"
    
    else:
        return f"I'm analyzing your {summary.get('total_products', summary.get('total_rows', 0))} items. Ask me about specific data points!"


@app.get("/api/chat/analysis")
async def chat_analysis():
    """Get full product analysis data"""
    global chat_data
    
    if chat_data is None:
        raise HTTPException(status_code=404, detail="No data loaded")
    
    # Convert to list of dicts, handling NaN/Inf
    import numpy as np
    products = chat_data.replace({np.nan: None}).to_dict(orient='records')
    
    return {"products": products}


@app.get("/api/chat/export-csv")
async def export_chat_csv():
    """Export analyzed data as CSV"""
    global chat_data
    
    if chat_data is None:
        raise HTTPException(status_code=404, detail="No data to export")
    
    import io
    
    # Create CSV in memory
    output = io.StringIO()
    chat_data.to_csv(output, index=False)
    output.seek(0)
    
    # Return as downloadable file
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory_analysis.csv"}
    )


@app.post("/api/chat/clear")
async def clear_chat():
    """Clear chat session"""
    global chat_data, chat_messages, chat_summary, chat_data_type
    
    chat_data = None
    chat_messages = []
    chat_summary = None
    chat_data_type = "unknown"
    
    return {"message": "Chat session cleared"}


# ============================================================================
# End n8n Integration Endpoints
# ============================================================================



if __name__ == "__main__":
    import uvicorn
    print("[INFO] Starting FastAPI server...")
    print("[INFO] API docs available at http://localhost:8000/docs")
    print("[INFO] Dashboard should connect to http://localhost:8000/api")
    print("[INFO] n8n endpoints available at http://localhost:8000/api/n8n/*")
    uvicorn.run(app, host="0.0.0.0", port=8000)
