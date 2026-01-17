"""
strategy_modes.py - Strategy Mode Definitions and Configurations

Defines 3 strategy modes that affect how all agents analyze products:
1. Profit Maximization - Maximize margins and revenue
2. Loss Reduction - Minimize losses and protect margins
3. Balanced - Optimize across all factors
"""

from enum import Enum
from typing import Dict, Any
from dataclasses import dataclass


class StrategyMode(str, Enum):
    """Strategy mode enumeration"""
    PROFIT_MAX = "profit_maximization"
    LOSS_REDUCTION = "loss_reduction"
    BALANCED = "balanced"


@dataclass
class ModeConfig:
    """Configuration for a strategy mode"""
    id: str
    name: str
    icon: str
    description: str
    color: str
    
    # Profit Doctor thresholds
    min_margin_threshold: float
    low_margin_alert_threshold: float
    
    # Inventory Sentinel parameters
    safety_stock_multiplier: float
    risk_tolerance: str  # "low", "medium", "high"
    stockout_penalty_weight: float
    
    # Pricing parameters
    price_elasticity_weight: float
    competitive_pricing_weight: float
    
    # Ad Optimizer targets
    ad_roas_target: float
    ad_spend_aggressiveness: float
    
    # Seasonal Analyst parameters
    seasonal_forecast_conservatism: float
    seasonal_risk_threshold: float
    
    # Strategy Supervisor priorities
    action_priority_weights: Dict[str, float]


# Mode configurations
MODE_CONFIGS: Dict[str, ModeConfig] = {
    StrategyMode.PROFIT_MAX: ModeConfig(
        id="profit_maximization",
        name="Profit Maximization",
        icon="🎯",
        description="Maximize profit margins and revenue. Aggressive pricing, lower safety stock, high ROAS targets.",
        color="emerald",
        
        # Profit Doctor - Strict margin requirements
        min_margin_threshold=0.25,  # Flag margins below 25%
        low_margin_alert_threshold=0.30,  # Alert if below 30%
        
        # Inventory Sentinel - Lower safety stock, accept more risk
        safety_stock_multiplier=1.0,
        risk_tolerance="high",
        stockout_penalty_weight=0.5,
        
        # Pricing - Premium positioning
        price_elasticity_weight=0.8,
        competitive_pricing_weight=0.3,
        
        # Ad Optimizer - High ROAS requirement
        ad_roas_target=3.5,
        ad_spend_aggressiveness=0.7,
        
        # Seasonal Analyst - Aggressive forecasting
        seasonal_forecast_conservatism=0.3,
        seasonal_risk_threshold=0.7,
        
        # Strategy Supervisor - Prioritize margin improvement
        action_priority_weights={
            "INCREASE_PRICE": 1.0,
            "REDUCE_COST": 0.9,
            "OPTIMIZE_ADS": 0.8,
            "RESTOCK": 0.5,
            "DISCOUNT": 0.2
        }
    ),
    
    StrategyMode.LOSS_REDUCTION: ModeConfig(
        id="loss_reduction",
        name="Loss Reduction",
        icon="🛡️",
        description="Minimize losses and protect margins. Conservative pricing, high safety stock, defensive ad spending.",
        color="blue",
        
        # Profit Doctor - Flag any negative margin
        min_margin_threshold=0.10,  # Flag margins below 10%
        low_margin_alert_threshold=0.15,  # Alert if below 15%
        
        # Inventory Sentinel - High safety stock, minimize risk
        safety_stock_multiplier=1.5,
        risk_tolerance="low",
        stockout_penalty_weight=0.8,
        
        # Pricing - Cost-plus, conservative
        price_elasticity_weight=0.3,
        competitive_pricing_weight=0.5,
        
        # Ad Optimizer - Safe ROAS, proven campaigns
        ad_roas_target=2.0,
        ad_spend_aggressiveness=0.3,
        
        # Seasonal Analyst - Conservative forecasting
        seasonal_forecast_conservatism=0.8,
        seasonal_risk_threshold=0.4,
        
        # Strategy Supervisor - Prioritize loss prevention
        action_priority_weights={
            "REDUCE_COST": 1.0,
            "INCREASE_PRICE": 0.8,
            "PAUSE_LOSS_MAKERS": 0.9,
            "RESTOCK": 0.6,
            "DISCOUNT": 0.1
        }
    ),
    
    StrategyMode.BALANCED: ModeConfig(
        id="balanced",
        name="Balanced",
        icon="⚖️",
        description="Balance profit, risk, and customer satisfaction. Optimized approach across all factors.",
        color="gray",
        
        # Profit Doctor - Moderate margin requirements
        min_margin_threshold=0.15,  # Flag margins below 15%
        low_margin_alert_threshold=0.20,  # Alert if below 20%
        
        # Inventory Sentinel - Optimized safety stock
        safety_stock_multiplier=1.2,
        risk_tolerance="medium",
        stockout_penalty_weight=0.7,
        
        # Pricing - Dynamic, market-responsive
        price_elasticity_weight=0.6,
        competitive_pricing_weight=0.6,
        
        # Ad Optimizer - Balanced ROAS
        ad_roas_target=2.5,
        ad_spend_aggressiveness=0.5,
        
        # Seasonal Analyst - Balanced forecasting
        seasonal_forecast_conservatism=0.5,
        seasonal_risk_threshold=0.5,
        
        # Strategy Supervisor - Balanced priorities
        action_priority_weights={
            "OPTIMIZE_ADS": 0.8,
            "RESTOCK": 0.8,
            "INCREASE_PRICE": 0.7,
            "REDUCE_COST": 0.7,
            "DISCOUNT": 0.5
        }
    )
}


def get_mode_config(mode: str) -> ModeConfig:
    """Get configuration for a strategy mode"""
    if mode not in MODE_CONFIGS:
        return MODE_CONFIGS[StrategyMode.BALANCED]
    return MODE_CONFIGS[mode]


def get_all_modes() -> list:
    """Get list of all available modes"""
    return [
        {
            "id": config.id,
            "name": config.name,
            "icon": config.icon,
            "description": config.description,
            "color": config.color
        }
        for config in MODE_CONFIGS.values()
    ]


def get_mode_display_name(mode: str) -> str:
    """Get display name for a mode"""
    config = get_mode_config(mode)
    return f"{config.icon} {config.name}"
