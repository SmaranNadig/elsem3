import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Sun, AlertTriangle, CloudRain } from 'lucide-react';
import { api } from '../services/api';
import type { SeasonalResponse, SeasonalAnalysis } from '../types';

const SeasonalTab: React.FC = () => {
    const [data, setData] = useState<SeasonalResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.getSeasonalAnalysis();
                setData(response);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch seasonal analysis');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-12 text-center border-red-500/20">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-6" />
                <h3 className="text-xl font-bold uppercase tracking-wider text-white mb-2">Error</h3>
                <p className="text-gray-300">{error}</p>
            </div>
        );
    }

    if (!data || data.status === 'disabled') {
        return (
            <div className="glass-card p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-bold uppercase tracking-wider text-white mb-2 ml-1">Seasonal Analysis Unavailable</h3>
                <p className="text-gray-300 font-light">Run the pipeline with sales history to generate seasonal insights.</p>
            </div>
        );
    }

    const { analysis, strong_seasonality_count, seasonal_risk_count } = data;

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex flex-col justify-between group hover:border-brand-blue/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#151516] rounded-full border border-white/5">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                        </div>
                        <h3 className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Strong Seasonality</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white font-mono mt-4">{strong_seasonality_count}</p>
                        <p className="text-[10px] text-gray-300 mt-2 font-medium uppercase tracking-wider">Products with {'>'}0.3 strength</p>
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between group hover:border-brand-blue/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#151516] rounded-full border border-white/5">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <h3 className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Seasonal Risks</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-amber-500 font-mono mt-4">{seasonal_risk_count}</p>
                        <p className="text-[10px] text-gray-300 mt-2 font-medium uppercase tracking-wider">High stock entering low season</p>
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between group hover:border-brand-blue/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#151516] rounded-full border border-white/5">
                            <Calendar className="w-4 h-4 text-brand-blue" />
                        </div>
                        <h3 className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Total Analyzed</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white font-mono mt-4">{data.total_skus}</p>
                        <p className="text-[10px] text-gray-300 mt-2 font-medium uppercase tracking-wider">SKUs in catalog</p>
                    </div>
                </div>
            </div>

            {/* Analysis List */}
            <div className="glass-card overflow-hidden border-brand-light/5 p-0">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-0">Seasonal Trends</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#151516]/50">
                            <tr>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Product</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Trend</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Strength</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Peak / Trough</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Next Index</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Insight</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {analysis.map((item: SeasonalAnalysis, index: number) => (
                                <tr key={item.sku_id} className="hover:bg-white/[0.02] transition-colors" style={{ animationDelay: `${index * 50}ms` }}>
                                    <td className="py-4 px-6">
                                        <div className="font-medium text-white text-sm">{item.product_name}</div>
                                        <div className="text-[10px] text-gray-300 uppercase tracking-wider mt-1">{item.category}</div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border
                                            ${item.seasonal_trend === 'RISING' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                item.seasonal_trend === 'FALLING' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    'bg-brand-muted/10 text-gray-300 border-brand-muted/20'}`}>
                                            {item.seasonal_trend === 'RISING' && <TrendingUp className="w-3 h-3" />}
                                            {item.seasonal_trend === 'FALLING' && <TrendingDown className="w-3 h-3" />}
                                            {item.seasonal_trend}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-1.5 bg-[#151516] rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={`h-full rounded-full ${item.seasonality_strength > 0.5 ? 'bg-purple-500' : 'bg-brand-blue'}`}
                                                    style={{ width: `${Math.min(item.seasonality_strength * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-gray-300">{item.seasonality_strength.toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-wide">
                                            <span className="text-emerald-500 flex items-center gap-2">
                                                <Sun className="w-3 h-3" /> {item.peak_month}
                                            </span>
                                            <span className="text-red-500 flex items-center gap-2">
                                                <CloudRain className="w-3 h-3" /> {item.trough_month}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`text-sm font-bold font-mono ${item.seasonal_index_next > 1.0 ? 'text-emerald-500' : 'text-gray-300'}`}>
                                            {item.seasonal_index_next.toFixed(2)}x
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        {item.llm_seasonal_insight ? (
                                            <div className="flex items-start gap-2 max-w-xs">
                                                <span className="text-xs text-gray-300 italic font-light leading-relaxed">"{item.llm_seasonal_insight}"</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SeasonalTab;
