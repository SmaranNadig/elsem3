import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Activity, Bell, BarChart3 } from 'lucide-react';
import AgentStatusCard from './AgentStatusCard';
import MetricsChart from './MetricsChart';
import RecommendationsTable from './RecommendationsTable';
import AlertsTab from './AlertsTab';
import SeasonalTab from './SeasonalTab';
import AdsTab from './AdsTab';
import { api } from '../services/api';
import type { AgentStatusResponse, MetricsSummary, SKURecommendation } from '../types';

type Tab = 'overview' | 'alerts' | 'seasonal' | 'ads';

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [agentStatus, setAgentStatus] = useState<AgentStatusResponse | null>(null);
    const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
    const [recommendations, setRecommendations] = useState<SKURecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            setError(null);

            const [statusData, metricsData, recsData] = await Promise.all([
                api.getAgentStatus(),
                api.getMetricsSummary(),
                api.getRecommendations(),
            ]);

            setAgentStatus(statusData);
            setMetrics(metricsData);
            setRecommendations(recsData);
        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await api.runAgents();
            await fetchData(true);
        } catch (err: any) {
            setError(err.message || 'Failed to refresh data');
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-dark">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue mx-auto mb-4"></div>
                    <p className="text-gray-300 uppercase tracking-widest text-xs">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error && !metrics) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-dark">
                <div className="glass-card p-8 text-center max-w-md border-red-500/20">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">Error Loading Data</h3>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <button
                        onClick={() => fetchData()}
                        className="px-6 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-full transition-all uppercase text-xs font-bold tracking-wider"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 font-sans text-brand-light selection:bg-brand-blue selection:text-white bg-grain bg-[#1D1D1F]">
            <div className="max-w-[1400px] mx-auto relative z-10">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <h1 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter text-white text-glow">
                                Agent Dashboard
                            </h1>
                            {/* LangChain Indicator */}
                            {recommendations.some(r => r.llm_profit_insight || r.llm_inventory_insight || r.llm_strategy_insight) && (
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-brand-blue/10 border border-brand-blue/20 rounded-full">
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                                        Active
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <a href="/" className="flex items-center gap-2 px-4 py-2 bg-[#151516] hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 rounded-full transition-colors text-xs font-bold uppercase tracking-wider">
                                Home
                            </a>
                            <div className="flex p-1 bg-[#151516] rounded-full border border-white/5">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'overview'
                                        ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                        : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('alerts')}
                                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'alerts'
                                        ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                        : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Alerts
                                    {metrics && (metrics.total_critical_risk > 0 || metrics.total_loss_makers > 0) && (
                                        <span className="flex h-1.5 w-1.5 relative">
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('seasonal')}
                                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'seasonal'
                                        ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                        : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Seasonal
                                </button>
                                <button
                                    onClick={() => setActiveTab('ads')}
                                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'ads'
                                        ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                        : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Ads
                                </button>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-[#151516] hover:bg-white/10 text-white border border-white/5 rounded-full transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'overview' ? (
                    <div className="animate-in fade-in duration-500">
                        {/* Overview Cards */}
                        {metrics && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                <div className="glass-card p-8 fade-in hover:border-brand-blue/30 transition-colors duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total SKUs</span>
                                        <Activity className="w-5 h-5 text-brand-blue" />
                                    </div>
                                    <p className="text-5xl font-display font-bold text-white tracking-tighter">{metrics.total_skus}</p>
                                </div>

                                <div className="glass-card p-8 fade-in hover:border-emerald-500/30 transition-colors duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Profitable</span>
                                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <p className="text-5xl font-display font-bold text-emerald-500 tracking-tighter">{metrics.total_profitable}</p>
                                    <p className="text-xs text-gray-300 mt-2 font-mono">
                                        AVG: ₹{metrics.avg_profit_per_unit.toFixed(2)}
                                    </p>
                                </div>

                                <div className="glass-card p-8 fade-in hover:border-red-500/30 transition-colors duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loss Makers</span>
                                        <TrendingDown className="w-5 h-5 text-red-500" />
                                    </div>
                                    <p className="text-5xl font-display font-bold text-red-500 tracking-tighter">{metrics.total_loss_makers}</p>
                                    <p className="text-xs text-gray-300 mt-2 font-mono">
                                        LOSS: ₹{metrics.total_daily_loss.toFixed(2)}
                                    </p>
                                </div>

                                <div className="glass-card p-8 fade-in hover:border-orange-500/30 transition-colors duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Critical Risk</span>
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <p className="text-5xl font-display font-bold text-orange-500 tracking-tighter">{metrics.total_critical_risk}</p>
                                    <p className="text-xs text-gray-300 mt-2 font-mono">
                                        WARN: {metrics.total_warning_risk}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Agent Status Cards */}
                        {agentStatus && agentStatus.agents && (
                            <div className="mb-12">
                                <h2 className="text-xl font-bold uppercase tracking-widest text-gray-400 mb-6 pl-1">Agent Status</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {agentStatus.agents.map((agent) => (
                                        <AgentStatusCard key={agent.name} agent={agent} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Charts */}
                        {metrics && recommendations.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xl font-bold uppercase tracking-widest text-gray-400 mb-6 pl-1">Analytics</h2>
                                <div className="glass-card p-1">
                                    <MetricsChart metrics={metrics} recommendations={recommendations} />
                                </div>
                            </div>
                        )}

                        {/* Link to Product Sales Analysis */}
                        <div className="mb-12">
                            <h2 className="text-xl font-bold uppercase tracking-widest text-gray-400 mb-6 pl-1">Sales Analysis</h2>
                            <a href="/product-sales" className="block">
                                <div className="glass-card p-8 hover:bg-white/5 transition-colors cursor-pointer border-2 border-transparent hover:border-emerald-500/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-emerald-500/10 p-4 rounded-lg">
                                                <BarChart3 size={32} className="text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white mb-1">
                                                    📊 Individual Product Sales Analysis
                                                </h3>
                                                <p className="text-gray-400">
                                                    View detailed month-by-month sales trends for each product from retail dataset
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <span className="text-sm font-semibold uppercase">View Charts</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>

                        {/* Recommendations Table */}
                        {recommendations.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xl font-bold uppercase tracking-widest text-gray-400 mb-6 pl-1">Inventory Intelligence</h2>
                                <RecommendationsTable
                                    recommendations={recommendations}
                                    onRefresh={fetchData}
                                />
                            </div>
                        )}
                    </div>
                ) : activeTab === 'alerts' ? (
                    <div className="animate-in fade-in duration-500">
                        <AlertsTab />
                    </div>
                ) : activeTab === 'seasonal' ? (
                    <div className="animate-in fade-in duration-500">
                        <SeasonalTab />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <AdsTab />
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="fixed bottom-6 right-6 glass-card p-6 border-l-4 border-red-500 max-w-md shadow-2xl">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wider text-white mb-1">Error</p>
                                <p className="text-sm text-gray-300">{error}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
