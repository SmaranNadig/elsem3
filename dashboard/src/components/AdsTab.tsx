import React, { useState, useEffect } from 'react';
import { Megaphone, Play, Pause, BarChart2, Plus, DollarSign, Target } from 'lucide-react';
import { api } from '../services/api';
import type { AdMetricsSummary, AdCampaign } from '../types';

const AdsTab: React.FC = () => {
    const [metrics, setMetrics] = useState<AdMetricsSummary | null>(null);
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [metricsData, campaignsData] = await Promise.all([
                api.getAdMetrics(),
                api.getAdCampaigns()
            ]);
            setMetrics(metricsData);
            setCampaigns(campaignsData.campaigns || []); // API returns { total: n, campaigns: [] }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleCampaign = async (id: string, currentStatus: string) => {
        const action = currentStatus === 'ACTIVE' ? 'pause' : 'resume';
        try {
            await api.toggleCampaign(id, action);
            fetchData(); // Refresh list
        } catch (err) {
            console.error('Failed to toggle campaign', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
            </div>
        );
    }

    if (!metrics || campaigns.length === 0) {
        return (
            <div className="glass-card p-20 text-center">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-brand-blue/10 border border-brand-blue/20 mb-6">
                    <Megaphone className="w-8 h-8 text-brand-blue" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-2">No Active Campaigns</h3>
                <p className="text-gray-300 text-sm font-light mb-8">Connect an ad platform using the API to get started.</p>
                <button className="px-6 py-3 bg-brand-blue hover:bg-blue-600 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,102,255,0.3)]">
                    Connect Platform
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 flex flex-col justify-between group hover:border-brand-blue/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#151516] rounded-full border border-white/5">
                            <Target className="w-4 h-4 text-brand-blue" />
                        </div>
                        <h3 className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Active Campaigns</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white font-mono mt-4">{metrics.active_campaigns}</p>
                        <p className="text-[10px] text-gray-300 mt-2 font-medium uppercase tracking-wider">Total: {metrics.total_campaigns}</p>
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between group hover:border-brand-blue/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#151516] rounded-full border border-white/5">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h3 className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">90d Spend</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-emerald-500 font-mono mt-4">₹{metrics.total_spend_90d.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-300 mt-2 font-medium uppercase tracking-wider">Budget Utilization</p>
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between group hover:border-brand-blue/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#151516] rounded-full border border-white/5">
                            <BarChart2 className="w-4 h-4 text-purple-500" />
                        </div>
                        <h3 className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Avg ROAS</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-purple-500 font-mono mt-4">{metrics.avg_roas}x</p>
                        <p className="text-[10px] text-gray-300 mt-2 font-medium uppercase tracking-wider">Return on Spend</p>
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-center items-center group hover:border-brand-blue/20 transition-all duration-300">
                    <button className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue hover:bg-blue-600 text-white rounded-lg w-full transition-all shadow-[0_0_15px_rgba(0,102,255,0.2)] hover:shadow-[0_0_25px_rgba(0,102,255,0.4)]">
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">New Campaign</span>
                    </button>
                    <p className="text-[10px] text-gray-300 mt-4 font-medium uppercase tracking-wider text-center">
                        Launch new ad set
                    </p>
                </div>
            </div>

            {/* Campaign List */}
            <div className="glass-card overflow-hidden border-brand-light/5 p-0">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-0">Campaign Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#151516]/50">
                            <tr>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Campaign</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Platform</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider text-right">Daily Budget</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider text-right">ROAS</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider text-right">Spend (90d)</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {campaigns.map((c, index) => (
                                <tr key={c.campaign_id} className="hover:bg-white/[0.02] transition-colors" style={{ animationDelay: `${index * 50}ms` }}>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border
                                            ${c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-brand-muted/10 text-gray-300 border-brand-muted/20'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'ACTIVE' ? 'animate-pulse bg-emerald-500' : 'bg-brand-muted'}`}></span>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-medium text-white text-sm">{c.campaign_name}</td>
                                    <td className="py-4 px-6 text-gray-300 text-xs uppercase tracking-wide">{c.platform}</td>
                                    <td className="py-4 px-6 text-white font-mono text-sm text-right">₹{c.daily_budget}</td>
                                    <td className="py-4 px-6 text-right">
                                        <span className={`font-mono font-bold ${c.roas >= 4 ? 'text-emerald-500' : c.roas >= 2 ? 'text-brand-blue' : 'text-red-500'}`}>
                                            {c.roas}x
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-gray-300 font-mono text-sm text-right">₹{c.total_spend_90d.toLocaleString()}</td>
                                    <td className="py-4 px-6 text-center">
                                        <button
                                            onClick={() => toggleCampaign(c.campaign_id, c.status)}
                                            className="p-2 hover:bg-white/5 rounded-full text-gray-300 hover:text-white transition-all border border-transparent hover:border-white/10"
                                            title={c.status === 'ACTIVE' ? "Pause Campaign" : "Resume Campaign"}
                                        >
                                            {c.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </button>
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

export default AdsTab;
