import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, Home, RefreshCw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import mermaid from 'mermaid';

interface AnalysisData {
    total_products?: number;
    critical_risk?: number;
    warning_risk?: number;
    safe?: number;
    profitable?: number;
    loss_makers?: number;
    top_issues?: Array<{
        sku_id: string;
        product_name: string;
        risk_level: string;
        recommended_action: string;
        current_stock?: number;
        profit_per_unit?: number;
    }>;
}

interface WorkflowDiagram {
    id: string;
    title: string;
    description: string;
    mermaidCode: string;
    category: 'pipeline' | 'action' | 'strategy';
}

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#fff',
        primaryBorderColor: '#818cf8',
        lineColor: '#94a3b8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
        background: '#1D1D1F',
        mainBkg: '#1e293b',
        nodeBorder: '#475569',
        clusterBkg: '#1e293b',
        clusterBorder: '#475569',
        titleColor: '#fff',
        edgeLabelBackground: '#1e293b'
    }
});

const WorkflowsPage: React.FC = () => {
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [workflows, setWorkflows] = useState<WorkflowDiagram[]>([]);
    const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>('pipeline');
    const [isLoading, setIsLoading] = useState(true);

    // Refs for mermaid containers
    const diagramRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        loadAnalysisData();
    }, []);

    useEffect(() => {
        if (workflows.length > 0) {
            renderDiagrams();
        }
    }, [workflows, expandedWorkflow]);

    const loadAnalysisData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/chat/analysis');
            if (response.ok) {
                const data = await response.json();
                setAnalysisData({
                    total_products: data.summary?.total_products || 0,
                    critical_risk: data.summary?.critical_risk || 0,
                    warning_risk: data.summary?.warning_risk || 0,
                    safe: data.summary?.safe || 0,
                    profitable: data.summary?.profitable || 0,
                    loss_makers: data.summary?.loss_makers || 0,
                    top_issues: data.products?.filter((p: any) => p.risk_level === 'CRITICAL').slice(0, 5) || []
                });
                generateWorkflows(data);
            } else {
                generateWorkflows(null);
            }
        } catch (error) {
            console.error('Failed to load analysis:', error);
            generateWorkflows(null);
        } finally {
            setIsLoading(false);
        }
    };

    const generateWorkflows = (data: any) => {
        const summary = data?.summary || {
            total_products: 25,
            critical_risk: 3,
            warning_risk: 8,
            safe: 14,
            profitable: 18,
            loss_makers: 7
        };

        const topIssues = data?.products?.filter((p: any) => p.risk_level === 'CRITICAL').slice(0, 3) || [
            { product_name: 'Sample Product A', current_stock: 5, recommended_action: 'RESTOCK' },
            { product_name: 'Sample Product B', current_stock: 2, recommended_action: 'URGENT RESTOCK' }
        ];

        // Helper to clean product names for mermaid (remove special chars)
        const cleanName = (name: string) => (name || 'Product').substring(0, 15).replace(/[^a-zA-Z0-9 ]/g, '');

        const generatedWorkflows: WorkflowDiagram[] = [
            {
                id: 'pipeline',
                title: 'Analysis Pipeline Overview',
                description: `Processing ${summary.total_products} products through 4 AI agents`,
                category: 'pipeline',
                mermaidCode: `flowchart TD
    subgraph INPUT[DATA INPUT]
        A[${summary.total_products} Products Uploaded]
    end
    
    subgraph AGENTS[AI ANALYSIS PIPELINE]
        B[PROFIT DOCTOR<br/>Analyzing margins<br/>${summary.profitable} profitable<br/>${summary.loss_makers} loss-makers]
        C[INVENTORY SENTINEL<br/>Assessing risk levels<br/>${summary.critical_risk} critical<br/>${summary.warning_risk} warnings]
        D[SEASONAL ANALYST<br/>Detecting patterns<br/>Trend analysis]
        E[STRATEGY SUPERVISOR<br/>Ranking priorities<br/>Generating actions]
    end
    
    subgraph OUTPUT[RECOMMENDATIONS]
        F[CRITICAL<br/>${summary.critical_risk} items]
        G[WARNING<br/>${summary.warning_risk} items]
        H[SAFE<br/>${summary.safe} items]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    
    style A fill:#3b82f6,stroke:#60a5fa,color:#fff
    style B fill:#22c55e,stroke:#4ade80,color:#fff
    style C fill:#3b82f6,stroke:#60a5fa,color:#fff
    style D fill:#f97316,stroke:#fb923c,color:#fff
    style E fill:#a855f7,stroke:#c084fc,color:#fff
    style F fill:#ef4444,stroke:#f87171,color:#fff
    style G fill:#eab308,stroke:#facc15,color:#000
    style H fill:#22c55e,stroke:#4ade80,color:#fff`
            },
            {
                id: 'restock',
                title: 'Critical Restock Workflow',
                description: `${summary.critical_risk} products need immediate attention`,
                category: 'action',
                mermaidCode: `flowchart TD
    START[CRITICAL STOCK ALERT<br/>${summary.critical_risk} products below threshold]
    
    P0[${cleanName(topIssues[0]?.product_name)}<br/>Stock: ${topIssues[0]?.current_stock || 0}]
    ${topIssues.length > 1 ? `P1[${cleanName(topIssues[1]?.product_name)}<br/>Stock: ${topIssues[1]?.current_stock || 0}]` : ''}
    
    CHECK{Check Lead Time}
    FAST[Lead Time OK<br/>Less than 7 days]
    SLOW[Lead Time Long<br/>More than 7 days]
    
    ORDER[Place Order Now]
    ALT[Find Alternative Supplier]
    
    UPDATE[Update Inventory System]
    DONE[Restock Complete]
    
    START --> P0
    ${topIssues.length > 1 ? 'START --> P1' : ''}
    
    P0 --> CHECK
    ${topIssues.length > 1 ? 'P1 --> CHECK' : ''}
    
    CHECK -->|Fast| FAST
    CHECK -->|Slow| SLOW
    FAST --> ORDER
    SLOW --> ALT
    ALT --> ORDER
    ORDER --> UPDATE
    UPDATE --> DONE
    
    style START fill:#ef4444,stroke:#f87171,color:#fff
    style P0 fill:#fbbf24,stroke:#f59e0b,color:#000
    ${topIssues.length > 1 ? 'style P1 fill:#fbbf24,stroke:#f59e0b,color:#000' : ''}
    style CHECK fill:#f97316,stroke:#fb923c,color:#fff
    style FAST fill:#22c55e,stroke:#4ade80,color:#fff
    style SLOW fill:#eab308,stroke:#facc15,color:#000
    style ORDER fill:#3b82f6,stroke:#60a5fa,color:#fff
    style ALT fill:#a855f7,stroke:#c084fc,color:#fff
    style UPDATE fill:#6366f1,stroke:#818cf8,color:#fff
    style DONE fill:#22c55e,stroke:#4ade80,color:#fff`
            },
            {
                id: 'pricing',
                title: 'Loss-Maker Recovery Strategy',
                description: `${summary.loss_makers} products with negative profit margins`,
                category: 'strategy',
                mermaidCode: `flowchart TD
    START[LOSS-MAKING PRODUCTS<br/>${summary.loss_makers} items with negative margin]
    
    ANALYZE[Analyze Root Cause]
    
    COST{High COGS?}
    PRICE{Price Too Low?}
    
    NEGOTIATE[Negotiate with Supplier]
    BUNDLE[Create Bundle Deal]
    INCREASE[Increase Price 10-15%]
    
    MONITOR[Monitor 30 Days]
    
    PROFITABLE[Now Profitable]
    DISCONTINUE[Consider Discontinuing]
    
    START --> ANALYZE
    ANALYZE --> COST
    COST -->|Yes| NEGOTIATE
    COST -->|No| PRICE
    PRICE -->|Yes| INCREASE
    PRICE -->|No| BUNDLE
    
    NEGOTIATE --> MONITOR
    INCREASE --> MONITOR
    BUNDLE --> MONITOR
    
    MONITOR -->|Improved| PROFITABLE
    MONITOR -->|Still Loss| DISCONTINUE
    
    style START fill:#ef4444,stroke:#f87171,color:#fff
    style ANALYZE fill:#3b82f6,stroke:#60a5fa,color:#fff
    style COST fill:#f97316,stroke:#fb923c,color:#fff
    style PRICE fill:#f97316,stroke:#fb923c,color:#fff
    style NEGOTIATE fill:#a855f7,stroke:#c084fc,color:#fff
    style BUNDLE fill:#6366f1,stroke:#818cf8,color:#fff
    style INCREASE fill:#22c55e,stroke:#4ade80,color:#fff
    style MONITOR fill:#eab308,stroke:#facc15,color:#000
    style PROFITABLE fill:#22c55e,stroke:#4ade80,color:#fff
    style DISCONTINUE fill:#ef4444,stroke:#f87171,color:#fff`
            },
            {
                id: 'seasonal',
                title: 'Seasonal Optimization Cycle',
                description: 'Continuous inventory optimization throughout the year',
                category: 'strategy',
                mermaidCode: `flowchart TD
    subgraph CYCLE[SEASONAL OPTIMIZATION CYCLE]
        A[Analyze Historical Sales]
        B[Identify Peak Season]
        C[Pre-Season Stocking]
        D[Promotional Push]
        E[Post-Season Clearance]
    end
    
    CENTER((OPTIMIZE))
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> A
    
    CENTER --> A
    CENTER --> B
    CENTER --> C
    CENTER --> D
    CENTER --> E
    
    style A fill:#3b82f6,stroke:#60a5fa,color:#fff
    style B fill:#f97316,stroke:#fb923c,color:#fff
    style C fill:#22c55e,stroke:#4ade80,color:#fff
    style D fill:#a855f7,stroke:#c084fc,color:#fff
    style E fill:#ef4444,stroke:#f87171,color:#fff
    style CENTER fill:#6366f1,stroke:#818cf8,color:#fff`
            }
        ];

        setWorkflows(generatedWorkflows);
    };

    const renderDiagrams = async () => {
        for (const workflow of workflows) {
            const container = diagramRefs.current[workflow.id];
            if (container && expandedWorkflow === workflow.id) {
                try {
                    container.innerHTML = '';
                    const { svg } = await mermaid.render(`mermaid-${workflow.id}-${Date.now()}`, workflow.mermaidCode);
                    container.innerHTML = svg;
                } catch (error) {
                    console.error(`Failed to render ${workflow.id}:`, error);
                    container.innerHTML = `<div class="text-red-400 p-4">Failed to render diagram. Check console for details.</div>`;
                }
            }
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'pipeline': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'action': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'strategy': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="min-h-screen p-6 font-sans text-white bg-[#1D1D1F]">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <GitBranch className="w-10 h-10 text-purple-500" />
                        <div>
                            <h1 className="text-4xl font-bold uppercase tracking-tight">
                                Workflows
                            </h1>
                            <p className="text-gray-400 text-sm">Dynamic workflows based on your inventory analysis</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadAnalysisData}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full transition-colors text-xs font-bold uppercase"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <a
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-full transition-colors text-xs font-bold uppercase"
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </a>
                    </div>
                </div>

                {/* Info Banner */}
                {analysisData && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <span className="font-bold text-purple-300">Workflows Generated from Your Data</span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center text-sm">
                            <div><span className="text-2xl font-bold text-white">{analysisData.total_products}</span><br /><span className="text-gray-400">Products</span></div>
                            <div><span className="text-2xl font-bold text-red-400">{analysisData.critical_risk}</span><br /><span className="text-gray-400">Critical</span></div>
                            <div><span className="text-2xl font-bold text-yellow-400">{analysisData.warning_risk}</span><br /><span className="text-gray-400">Warning</span></div>
                            <div><span className="text-2xl font-bold text-green-400">{analysisData.safe}</span><br /><span className="text-gray-400">Safe</span></div>
                            <div><span className="text-2xl font-bold text-green-400">{analysisData.profitable}</span><br /><span className="text-gray-400">Profitable</span></div>
                            <div><span className="text-2xl font-bold text-red-400">{analysisData.loss_makers}</span><br /><span className="text-gray-400">Loss-makers</span></div>
                        </div>
                    </div>
                )}

                {/* Workflow Accordions */}
                <div className="space-y-4">
                    {workflows.map(workflow => (
                        <div key={workflow.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setExpandedWorkflow(expandedWorkflow === workflow.id ? null : workflow.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getCategoryColor(workflow.category)}`}>
                                        {workflow.category}
                                    </span>
                                    <div className="text-left">
                                        <h3 className="font-bold text-white">{workflow.title}</h3>
                                        <p className="text-sm text-gray-400">{workflow.description}</p>
                                    </div>
                                </div>
                                {expandedWorkflow === workflow.id ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {expandedWorkflow === workflow.id && (
                                <div className="border-t border-white/10 p-6 bg-[#0f0f10]">
                                    <div
                                        ref={el => diagramRefs.current[workflow.id] = el}
                                        className="mermaid-container flex justify-center items-center min-h-[300px] overflow-auto"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Tip */}
                <div className="mt-6 text-center text-gray-500 text-sm">
                    💡 Upload data in the <a href="/chat" className="text-purple-400 hover:underline">Chat</a> page to generate personalized workflows
                </div>
            </div>
        </div>
    );
};

export default WorkflowsPage;
