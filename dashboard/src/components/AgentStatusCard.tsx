import React from 'react';
import { Activity, TrendingUp, CheckCircle } from 'lucide-react';
import type { Agent } from '../types';

interface AgentStatusCardProps {
    agent: Agent;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ agent }) => {
    const getAgentIcon = (name: string) => {
        if (name.includes('Profit')) return TrendingUp;
        if (name.includes('Inventory')) return Activity;
        return CheckCircle;
    };

    const Icon = getAgentIcon(agent.name);

    // Extract key metrics based on agent type
    const renderMetrics = () => {
        if (agent.name === 'Profit Doctor') {
            return (
                <>
                    <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform duration-300">
                        <span className="text-gray-300 text-[10px] uppercase tracking-widest font-bold">Profitable SKUs</span>
                        <span className="text-emerald-500 font-bold font-mono">{agent.metrics.profitable_skus || 0}</span>
                    </div>
                    <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform duration-300 delay-75">
                        <span className="text-gray-300 text-[10px] uppercase tracking-widest font-bold">Loss Makers</span>
                        <span className="text-red-500 font-bold font-mono">{agent.metrics.loss_makers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform duration-300 delay-100">
                        <span className="text-gray-300 text-[10px] uppercase tracking-widest font-bold">Avg Profit</span>
                        <span className={`font-bold font-mono ${(agent.metrics.avg_profit || 0) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            ₹{(agent.metrics.avg_profit || 0).toFixed(2)}
                        </span>
                    </div>
                </>
            );
        } else if (agent.name === 'Inventory Sentinel') {
            return (
                <>
                    <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform duration-300">
                        <span className="text-gray-300 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Critical Risk
                        </span>
                        <span className="text-red-500 font-bold font-mono">{agent.metrics.critical_risk || 0}</span>
                    </div>
                    <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform duration-300 delay-75">
                        <span className="text-gray-300 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                            Warning
                        </span>
                        <span className="text-yellow-500 font-bold font-mono">{agent.metrics.warning_risk || 0}</span>
                    </div>
                    <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform duration-300 delay-100">
                        <span className="text-gray-300 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Safe
                        </span>
                        <span className="text-emerald-500 font-bold font-mono">{agent.metrics.safe || 0}</span>
                    </div>
                </>
            );
        } else if (agent.name === 'Strategy Supervisor') {
            const actionCount = Object.keys(agent.metrics.action_distribution || {}).length;
            return (
                <>
                    <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform duration-300">
                        <span className="text-gray-300 text-[10px] uppercase tracking-widest font-bold">Total Actions</span>
                        <span className="text-brand-blue font-bold font-mono">{actionCount}</span>
                    </div>
                    <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform duration-300 delay-75">
                        <span className="text-gray-300 text-[10px] uppercase tracking-widest font-bold">Avg Impact</span>
                        <span className="text-purple-500 font-bold font-mono">
                            {(agent.metrics.avg_impact_score || 0).toFixed(2)}
                        </span>
                    </div>
                </>
            );
        }
    };

    return (
        <div className="glass-card p-6 flex flex-col justify-between group hover:border-brand-blue/20 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-3">
                    <div className="p-2 bg-[#151516] rounded-full border border-white/5">
                        <Icon className="w-4 h-4 text-brand-blue" />
                    </div>
                    {agent.name}
                </h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${agent.status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                    }`}>
                    {agent.status}
                </span>
            </div>
            <div className="space-y-4">
                {renderMetrics()}
            </div>
        </div>
    );
};

export default AgentStatusCard;
