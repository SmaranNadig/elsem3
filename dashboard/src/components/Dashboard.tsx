import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart3, ArrowRight } from 'lucide-react';
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
        <div className="min-h-screen p-6 font-mono bg-black text-white">
            <div className="max-w-[1800px] mx-auto relative z-10">
                {/* Header */}
                <div className="mb-24">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white pb-8">
                        <div className="flex items-center gap-4">
                            <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-tighter text-white">
                                Agent Dashboard
                            </h1>
                            {/* LangChain Indicator */}
                            {recommendations.some(r => r.llm_profit_insight || r.llm_inventory_insight || r.llm_strategy_insight) && (
                                <div className="flex items-center gap-2 px-4 py-1 border border-white rounded-full">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                                        AI Active
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="/" className="px-6 py-2 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-colors text-xs font-bold uppercase tracking-widest">
                                Home
                            </a>
                            <div className="flex border border-white p-1 gap-1">
                                {['overview', 'alerts', 'seasonal', 'ads'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as Tab)}
                                        className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                            ? 'bg-white text-black'
                                            : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {tab === 'alerts' ? (
                                            <span className="flex items-center gap-2">
                                                Alerts
                                                {metrics && (metrics.total_critical_risk > 0 || metrics.total_loss_makers > 0) && (
                                                    <span className="flex h-1.5 w-1.5 relative">
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            tab
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 border border-white text-white hover:bg-white hover:text-black transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    {activeTab === 'overview' ? (
                        <div className="animate-in fade-in duration-500">
                            {/* Overview Cards */}
                            {metrics && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
                                    <div className="border border-white/20 p-8 hover:border-white transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total SKUs</span>
                                            <Activity className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-6xl font-bold text-white tracking-tighter">{metrics.total_skus}</p>
                                    </div>

                                    <div className="border border-white/20 p-8 hover:border-white transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Profitable</span>
                                            <TrendingUp className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-6xl font-bold text-white tracking-tighter">{metrics.total_profitable}</p>
                                        <p className="text-xs text-gray-400 mt-2 font-mono uppercase tracking-widest">
                                            AVG: ${metrics.avg_profit_per_unit.toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="border border-white/20 p-8 hover:border-white transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Loss Makers</span>
                                            <TrendingDown className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-6xl font-bold text-white tracking-tighter">{metrics.total_loss_makers}</p>
                                        <p className="text-xs text-gray-400 mt-2 font-mono uppercase tracking-widest">
                                            LOSS: ${metrics.total_daily_loss.toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="border border-white/20 p-8 hover:border-white transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Critical Risk</span>
                                            <AlertTriangle className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-6xl font-bold text-white tracking-tighter">{metrics.total_critical_risk}</p>
                                        <p className="text-xs text-gray-400 mt-2 font-mono uppercase tracking-widest">
                                            WARN: {metrics.total_warning_risk}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Agent Status Cards */}
                            {agentStatus && agentStatus.agents && (
                                <div className="mb-24">
                                    <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-8 border-b border-white/20 pb-4">Agent Status</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {agentStatus.agents.map((agent) => (
                                            <AgentStatusCard key={agent.name} agent={agent} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Charts */}
                            {metrics && recommendations.length > 0 && (
                                <div className="mb-24">
                                    <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-8 border-b border-white/20 pb-4">Analytics</h2>
                                    <div className="border border-white/20 p-1">
                                        <MetricsChart metrics={metrics} recommendations={recommendations} />
                                    </div>
                                </div>
                            )}

                            {/* Link to Product Sales Analysis */}
                            <div className="mb-24">
                                <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-8 border-b border-white/20 pb-4">Sales Analysis</h2>
                                <a href="/product-sales" className="block group">
                                    <div className="border border-white/20 p-8 hover:bg-white hover:text-black transition-all cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-8">
                                                <div className="border border-current p-4">
                                                    <BarChart3 size={32} />
                                                </div>
                                                <div>
                                                    <h3 className="text-4xl font-bold mb-2 uppercase tracking-tight">
                                                        Product Index
                                                    </h3>
                                                    <p className="text-sm uppercase tracking-widest opacity-60">
                                                        View detailed month-by-month sales trends
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-bold uppercase tracking-widest">View Charts</span>
                                                <ArrowRight className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>

                            {/* Recommendations Table */}
                            {recommendations.length > 0 && (
                                <div className="mb-24">
                                    <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-8 border-b border-white/20 pb-4">Inventory Intelligence</h2>
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
                        <div className="fixed bottom-6 right-6 bg-black border border-white p-6 max-w-md shadow-none z-50">
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-wider text-white mb-1">Error</p>
                                    <p className="text-sm text-gray-400">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
