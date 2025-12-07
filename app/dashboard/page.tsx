import { ArrowUpRight, ArrowDownRight, DollarSign, Layers, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data placeholders for now
const stats = [
    { label: "Total Revenue", value: "$45,231.89", trend: "+20.1%", trendUp: true, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Active Inventory", value: "2,345", trend: "+180 new", trendUp: true, icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Ad Spend", value: "$12,234.00", trend: "+19%", trendUp: false, icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" },
];

const agents = [
    { name: "Pricing Agent", action: "Optimizing prices for 45 SKUs based on competitor data.", time: "2 min ago" },
    { name: "Ad Manager", action: "Decreased bid on 'Summer Sale' campaign due to low CTR.", time: "15 min ago" },
    { name: "Inventory Watch", action: "Flagged low stock alert for 'Premium Widget A'.", time: "1 hour ago" },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                                <stat.icon size={24} />
                            </div>
                            <div className={cn("flex items-center gap-1 text-sm font-medium", stat.trendUp ? "text-emerald-500" : "text-rose-500")}>
                                {stat.trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {stat.trend}
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Chart Placeholder */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
                    <h3 className="text-lg font-bold mb-6">Revenue vs Spend</h3>
                    <div className="w-full h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <span className="text-slate-400">Chart Visualization Placeholder</span>
                    </div>
                </div>

                {/* Agent Feed */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Agent Actions
                    </h3>
                    <div className="space-y-6">
                        {agents.map((agent, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className="h-2 w-2 mt-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{agent.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{agent.action}</p>
                                    <span className="text-xs text-slate-400 mt-2 block">{agent.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
