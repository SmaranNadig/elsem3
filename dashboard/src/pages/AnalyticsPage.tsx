import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import AgentStatusCard from '../components/AgentStatusCard';
import MetricsChart from '../components/MetricsChart';
import { api } from '../services/api';
import type { AgentStatusResponse, MetricsSummary, SKURecommendation } from '../types';

const AnalyticsPage: React.FC = () => {
    const [agentStatus, setAgentStatus] = useState<AgentStatusResponse | null>(null);
    const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
    const [recommendations, setRecommendations] = useState<SKURecommendation[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
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
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-[#1D1D1F] text-white selection:bg-brand-blue selection:text-white bg-grain">
            <div className="container mx-auto px-6 pt-32 pb-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-8">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Back to Home</span>
                    </Link>

                    <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-tighter mb-6 text-glow">
                        Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-purple-500 text-glow-blue">Dashboard</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl">
                        Real-time insights into your autonomous agents and predictive intelligence systems.
                    </p>
                </motion.div>

                {/* Overview Cards */}
                {metrics && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
                    >
                        <div className="glass-card p-8 hover:border-brand-blue/30 transition-colors duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total SKUs</span>
                                <Activity className="w-5 h-5 text-brand-blue" />
                            </div>
                            <p className="text-5xl font-display font-bold text-white tracking-tighter">{metrics.total_skus}</p>
                        </div>

                        <div className="glass-card p-8 hover:border-emerald-500/30 transition-colors duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Profitable</span>
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <p className="text-5xl font-display font-bold text-emerald-500 tracking-tighter">{metrics.total_profitable}</p>
                            <p className="text-xs text-gray-300 mt-2 font-mono">
                                AVG: ₹{metrics.avg_profit_per_unit.toFixed(2)}
                            </p>
                        </div>

                        <div className="glass-card p-8 hover:border-red-500/30 transition-colors duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loss Makers</span>
                                <TrendingDown className="w-5 h-5 text-red-500" />
                            </div>
                            <p className="text-5xl font-display font-bold text-red-500 tracking-tighter">{metrics.total_loss_makers}</p>
                            <p className="text-xs text-gray-300 mt-2 font-mono">
                                LOSS: ₹{metrics.total_daily_loss.toFixed(2)}
                            </p>
                        </div>

                        <div className="glass-card p-8 hover:border-orange-500/30 transition-colors duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Critical Risk</span>
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                            </div>
                            <p className="text-5xl font-display font-bold text-orange-500 tracking-tighter">{metrics.total_critical_risk}</p>
                            <p className="text-xs text-gray-300 mt-2 font-mono">
                                WARN: {metrics.total_warning_risk}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Agent Status Cards */}
                {agentStatus && agentStatus.agents && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mb-16"
                    >
                        <h2 className="text-4xl font-bold uppercase tracking-tight mb-8">
                            Autonomous <span className="text-purple-500">Agents</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {agentStatus.agents.map((agent, index) => (
                                <motion.div
                                    key={agent.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                                >
                                    <AgentStatusCard agent={agent} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Charts */}
                {metrics && recommendations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mb-16"
                    >
                        <h2 className="text-4xl font-bold uppercase tracking-tight mb-8">
                            Predictive <span className="text-emerald-500">Intelligence</span>
                        </h2>
                        <div className="glass-card p-1">
                            <MetricsChart metrics={metrics} recommendations={recommendations} />
                        </div>
                    </motion.div>
                )}

                {/* CTA to Full Dashboard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-center"
                >
                    <Link to="/dashboard">
                        <button className="px-12 py-6 bg-brand-blue rounded-full text-white font-bold text-lg uppercase tracking-widest hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(0,123,255,0.3)]">
                            View Full Dashboard
                        </button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
