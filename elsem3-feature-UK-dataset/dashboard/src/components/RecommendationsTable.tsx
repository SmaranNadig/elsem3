import React, { useState } from 'react';
import { ArrowUpDown, AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { SKURecommendation } from '../types';
import ModeSelector from './ModeSelector';
import { api } from '../services/api';

interface RecommendationsTableProps {
    recommendations: SKURecommendation[];
    onRefresh?: () => void;
}

const RecommendationsTable: React.FC<RecommendationsTableProps> = ({ recommendations, onRefresh }) => {
    const [sortBy, setSortBy] = useState<keyof SKURecommendation>('impact_score');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const handleModeChange = async (skuId: string, newMode: string) => {
        try {
            await api.updateSKUMode(skuId, newMode);
            // Mode is saved! User needs to run pipeline to regenerate insights
            // Refresh is optional - it will just update the mode badge display
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error('Failed to update mode:', error);
            throw error;
        }
    };

    const handleSort = (field: keyof SKURecommendation) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const toggleRow = (skuId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(skuId)) {
            newExpanded.delete(skuId);
        } else {
            newExpanded.add(skuId);
        }
        setExpandedRows(newExpanded);
    };

    const sortedRecommendations = [...recommendations].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return sortOrder === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
    });

    const getRiskBadgeColor = (risk: string) => {
        switch (risk) {
            case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'WARNING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'SAFE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return 'bg-brand-muted/10 text-gray-300 border-brand-muted/20';
        }
    };

    const getActionBadgeColor = (action: string) => {
        if (action.includes('PAUSE') || action.includes('INCREASE_PRICE')) {
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        }
        if (action.includes('REORDER_IMMEDIATELY')) {
            return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        }
        if (action.includes('PLAN_REORDER')) {
            return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        }
        if (action.includes('DISCOUNT')) {
            return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        }
        return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
    };

    const hasLLMInsights = (rec: SKURecommendation) => {
        return !!(rec.llm_profit_insight || rec.llm_inventory_insight || rec.llm_strategy_insight);
    };

    const SortButton: React.FC<{ field: keyof SKURecommendation; label: string }> = ({ field, label }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center gap-1 hover:text-brand-light transition-colors uppercase tracking-wider text-[10px]"
        >
            {label}
            <ArrowUpDown className="w-3 h-3" />
        </button>
    );

    return (
        <div className="glass-card p-0 fade-in overflow-hidden border-brand-light/5">
            <div className="p-6 border-b border-white/5">
                <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-0 flex items-center gap-3">
                    <div className="p-2 bg-[#151516] rounded-full border border-white/5">
                        <AlertCircle className="w-4 h-4 text-brand-blue" />
                    </div>
                    Recs
                    {recommendations.some(hasLLMInsights) && (
                        <span className="ml-auto flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-purple-500/20">
                            <Sparkles className="w-3 h-3" />
                            AI Insights Active
                        </span>
                    )}
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5 bg-[#151516]/50">
                            <th className="w-8"></th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                <SortButton field="sku_id" label="SKU" />
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                <SortButton field="category" label="Category" />
                            </th>
                            <th className="text-right py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                <SortButton field="profit_per_unit" label="Profit/Unit" />
                            </th>
                            <th className="text-right py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                <SortButton field="current_stock" label="Stock" />
                            </th>
                            <th className="text-center py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                <SortButton field="risk_level" label="Risk" />
                            </th>
                            <th className="text-right py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                <SortButton field="impact_score" label="Impact" />
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                Action
                            </th>
                            <th className="text-center py-4 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                Strategy Mode
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRecommendations.map((rec, index) => (
                            <React.Fragment key={rec.sku_id}>
                                <tr
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    onClick={() => hasLLMInsights(rec) && toggleRow(rec.sku_id)}
                                >
                                    <td className="py-4 px-6">
                                        {hasLLMInsights(rec) && (
                                            <button className="text-gray-300 hover:text-brand-blue transition-colors">
                                                {expandedRows.has(rec.sku_id) ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-xs font-mono font-medium text-brand-blue">
                                        {rec.sku_id}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-white max-w-xs truncate font-medium">
                                        <div className="flex items-center gap-2">
                                            {rec.product_name}
                                            {hasLLMInsights(rec) && (
                                                <Sparkles className="w-3 h-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-xs text-gray-300 uppercase tracking-wide">
                                        {rec.category}
                                    </td>
                                    <td className={`py-4 px-6 text-sm text-right font-mono font-bold ${rec.profit_per_unit > 0 ? 'text-emerald-500' : 'text-red-500'
                                        }`}>
                                        ₹{rec.profit_per_unit.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-right text-white font-mono">
                                        {rec.current_stock}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getRiskBadgeColor(rec.risk_level)}`}>
                                            {rec.risk_level}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-right font-bold text-purple-500 font-mono">
                                        {rec.impact_score.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getActionBadgeColor(rec.recommended_action)}`}>
                                            {rec.recommended_action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-center">
                                            <ModeSelector
                                                skuId={rec.sku_id}
                                                currentMode={rec.strategy_mode || 'balanced'}
                                                onModeChange={handleModeChange}
                                            />
                                        </div>
                                    </td>
                                </tr>

                                {/* LLM Insights Expanded Row */}
                                {expandedRows.has(rec.sku_id) && hasLLMInsights(rec) && (
                                    <tr className="border-b border-white/5 bg-[#151516]/30">
                                        <td colSpan={10} className="py-6 px-8">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400">
                                                        AI Executive Summary
                                                    </h4>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                    {rec.llm_profit_insight && (
                                                        <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 rounded-2xl p-6">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Profit Analysis</h5>
                                                                {rec.llm_profit_confidence && (
                                                                    <span className="text-[10px] text-gray-300 ml-auto font-mono">
                                                                        {(rec.llm_profit_confidence * 100).toFixed(0)}% CONF
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-300 leading-relaxed font-light">
                                                                <ReactMarkdown
                                                                    components={{
                                                                        p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                                        strong: ({ node, ...props }) => <span className="font-bold text-white" {...props} />,
                                                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                                    }}
                                                                >
                                                                    {rec.llm_profit_insight}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {rec.llm_inventory_insight && (
                                                        <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-2xl p-6">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Inventory Strategy</h5>
                                                                {rec.llm_inventory_confidence && (
                                                                    <span className="text-[10px] text-gray-300 ml-auto font-mono">
                                                                        {(rec.llm_inventory_confidence * 100).toFixed(0)}% CONF
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-300 leading-relaxed font-light">
                                                                <ReactMarkdown
                                                                    components={{
                                                                        p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                                        strong: ({ node, ...props }) => <span className="font-bold text-white" {...props} />,
                                                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                                    }}
                                                                >
                                                                    {rec.llm_inventory_insight}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {rec.llm_strategy_insight && (
                                                        <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10 rounded-2xl p-6">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Strategic Rec</h5>
                                                                {rec.llm_strategy_confidence && (
                                                                    <span className="text-[10px] text-gray-300 ml-auto font-mono">
                                                                        {(rec.llm_strategy_confidence * 100).toFixed(0)}% CONF
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-300 leading-relaxed font-light">
                                                                <ReactMarkdown
                                                                    components={{
                                                                        p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                                        strong: ({ node, ...props }) => <span className="font-bold text-white" {...props} />,
                                                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                                    }}
                                                                >
                                                                    {rec.llm_strategy_insight}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-white/5 text-[10px] uppercase tracking-widest text-gray-300 flex items-center justify-between">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></span>
                                                        Generated by Agentic Workflow
                                                    </span>
                                                    <span>CONFIDENTIAL</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {recommendations.length === 0 && (
                <div className="text-center py-20 text-gray-300 uppercase tracking-widest text-xs">
                    No recommendations available
                </div>
            )}
        </div>
    );
};

export default RecommendationsTable;
