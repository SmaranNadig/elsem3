"""
sku_mode_manager.py - Manages SKU strategy mode assignments

Handles loading, saving, and updating strategy modes for individual SKUs.
"""

import json
import os
from typing import Dict, Optional
from datetime import datetime
from strategy_modes import StrategyMode


class SKUModeManager:
    """Manages strategy mode assignments for SKUs"""
    
    def __init__(self, storage_path: str = "data/sku_mode_storage.json"):
        self.storage_path = storage_path
        self.default_mode = StrategyMode.BALANCED
        self._mode_map: Dict[str, str] = {}
        self._load()
    
    def _load(self):
        """Load mode mappings from storage"""
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'r') as f:
                    data = json.load(f)
                    self._mode_map = {k: v for k, v in data.items() if not k.startswith('_')}
                    self.default_mode = data.get('_default_mode', StrategyMode.BALANCED)
            except Exception as e:
                print(f"[WARNING] Failed to load SKU modes: {e}")
                self._mode_map = {}
        else:
            self._mode_map = {}
    
    def _save(self):
        """Save mode mappings to storage"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            
            data = {
                **self._mode_map,
                "_default_mode": self.default_mode,
                "_last_updated": datetime.now().isoformat(),
                "_comment": "SKU Strategy Mode Storage - Maps SKU IDs to their selected strategy mode"
            }
            
            with open(self.storage_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[ERROR] Failed to save SKU modes: {e}")
    
    def get_mode(self, sku_id: str) -> str:
        """Get strategy mode for a SKU"""
        return self._mode_map.get(sku_id, self.default_mode)
    
    def set_mode(self, sku_id: str, mode: str) -> bool:
        """Set strategy mode for a SKU"""
        if mode not in [m.value for m in StrategyMode]:
            print(f"[ERROR] Invalid mode: {mode}")
            return False
        
        self._mode_map[sku_id] = mode
        self._save()
        return True
    
    def bulk_set_modes(self, updates: Dict[str, str]) -> Dict[str, bool]:
        """Set modes for multiple SKUs at once"""
        results = {}
        for sku_id, mode in updates.items():
            results[sku_id] = self.set_mode(sku_id, mode)
        return results
    
    def get_all_modes(self) -> Dict[str, str]:
        """Get all SKU mode mappings"""
        return self._mode_map.copy()
    
    def get_skus_by_mode(self, mode: str) -> list:
        """Get all SKUs using a specific mode"""
        return [sku_id for sku_id, m in self._mode_map.items() if m == mode]
    
    def reset_mode(self, sku_id: str) -> bool:
        """Reset SKU to default mode"""
        if sku_id in self._mode_map:
            del self._mode_map[sku_id]
            self._save()
            return True
        return False
    
    def set_default_mode(self, mode: str) -> bool:
        """Set the default mode for new SKUs"""
        if mode not in [m.value for m in StrategyMode]:
            return False
        self.default_mode = mode
        self._save()
        return True


# Global instance
sku_mode_manager = SKUModeManager()
