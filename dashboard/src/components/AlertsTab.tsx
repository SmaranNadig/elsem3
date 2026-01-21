import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, ArrowRight, DollarSign, Package, Bell } from 'lucide-react';
import type { Alert } from '../types';
import { api } from '../services/api';

const AlertsTab: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionModal, setActionModal] = useState<{ alert: Alert, type: 'RESTOCK' | 'PRICE' } | null>(null);
    const [inputValue, setInputValue] = useState<number>(0);

    const fetchAlerts = async () => {
        try {
            const data = await api.getAlerts();
            setAlerts(data);
        } catch (err) {
            console.error("Failed to fetch alerts", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleDismiss = async (skuId: string) => {
        setProcessingId(skuId);
        try {
            await api.executeAction(skuId, 'DISMISS');
            setAlerts(prev => prev.filter(a => a.sku_id !== skuId));
        } catch (err) {
            console.error("Failed to dismiss alert", err);
        } finally {
            setProcessingId(null);
        }
    };

    const openActionModal = (alert: Alert) => {
        const isPrice = alert.recommended_action.includes("PRICE") || alert.recommended_action.includes("DISCOUNT");

        let type: 'RESTOCK' | 'PRICE' = 'RESTOCK';
        let initialValue = 0;

        if (isPrice) {
            type = 'PRICE';
            initialValue = alert.suggested_price || alert.selling_price;
        } else {
            // Default to restock if unclear, or specific logic
            type = 'RESTOCK';
            initialValue = alert.suggested_reorder || 50;
        }

        setActionModal({ alert, type });
        setInputValue(initialValue);
    };

    const confirmAction = async () => {
        if (!actionModal) return;

        setProcessingId(actionModal.alert.sku_id);
        const actionType = actionModal.type === 'RESTOCK' ? 'RESTOCK' : 'PRICE_CHANGE';

        try {
            await api.executeAction(
                actionModal.alert.sku_id,
                actionType,
                Number(inputValue),
                actionModal.type === 'PRICE' ? actionModal.alert.selling_price : undefined
            );
            // Remove from list upon success
            setAlerts(prev => prev.filter(a => a.sku_id !== actionModal.alert.sku_id));
            setActionModal(null);
        } catch (err) {
            console.error("Failed to execute action", err);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
    );

    if (alerts.length === 0) {
        return (
            <div className="text-center p-20 glass-card">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                    <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-2">System Optimal</h3>
                <p className="text-gray-300 text-sm font-light">No critical alerts requiring attention right now.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {alerts.map(alert => (
                <div key={alert.sku_id} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 fade-in group hover:border-brand-blue/20 transition-all duration-300">
                    <div className="flex items-start gap-5">
                        <div className={`p-3 rounded-full border ${alert.risk_level === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            alert.risk_level === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                'bg-brand-blue/10 border-brand-blue/20 text-brand-blue'
                            }`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-white text-base">{alert.product_name}</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 font-mono uppercase tracking-wider">
                                    {alert.sku_id.split('_').pop()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs mb-3">
                                <span className={`font-bold uppercase tracking-wider ${alert.risk_level === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>
                                    {alert.risk_level} Risk
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-300 font-medium uppercase tracking-wide">
                                    {alert.recommended_action.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-gray-300 font-mono">
                                <span className="flex items-center gap-2">
                                    <Package className="w-3 h-3" />
                                    Stock: <span className="text-white">{alert.current_stock}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" />
                                    Price: <span className="text-white">₹{alert.selling_price}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <Bell className="w-3 h-3" />
                                    Impact: <span className="text-purple-400">{alert.impact_score.toFixed(0)}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button
                            onClick={() => handleDismiss(alert.sku_id)}
                            disabled={!!processingId}
                            className="flex-1 md:flex-none px-4 py-2 border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={() => openActionModal(alert)}
                            disabled={!!processingId}
                            className="flex-1 md:flex-none px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,102,255,0.3)]"
                        >
                            {processingId === alert.sku_id ? (
                                <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
                            ) : (
                                <>
                                    Resolve
                                    <ArrowRight className="w-3 h-3" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ))}

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-[#000000]/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="glass-card max-w-md w-full p-8 animate-in zoom-in-95 duration-200 border-brand-blue/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-2">
                                    {actionModal.type === 'RESTOCK' ? 'Restock Inventory' : 'Adjust Price'}
                                </h3>
                                <p className="text-xs text-gray-300 uppercase tracking-wide">{actionModal.alert.product_name}</p>
                            </div>
                            <button onClick={() => setActionModal(null)} className="text-gray-300 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-8">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-3">
                                {actionModal.type === 'RESTOCK' ? 'Quantity to Order' : 'New Price (₹)'}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    {actionModal.type === 'RESTOCK' ? (
                                        <Package className="h-4 w-4 text-gray-300 group-focus-within:text-brand-blue transition-colors" />
                                    ) : (
                                        <DollarSign className="h-4 w-4 text-gray-300 group-focus-within:text-brand-blue transition-colors" />
                                    )}
                                </div>
                                <input
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(parseFloat(e.target.value))}
                                    className="block w-full pl-11 pr-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white font-mono placeholder-brand-muted focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                                />
                            </div>
                            <p className="mt-3 text-[10px] text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 bg-brand-muted rounded-full"></span>
                                {actionModal.type === 'RESTOCK'
                                    ? `Current Stock: ${actionModal.alert.current_stock}`
                                    : `Current Price: ₹${actionModal.alert.selling_price}`
                                }
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionModal(null)}
                                className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            >
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertsTab;
