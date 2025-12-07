import Link from "next/link";
import { ArrowRight, BarChart2, Zap, ShieldCheck } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
            {/* Hero Section */}
            <section className="w-full flex-grow flex flex-col items-center justify-center py-24 px-4 text-center bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Smart Inventory Intelligence
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mb-10">
                    The all-in-one profit engine for modern sellers. Track ads, inventory, and AI-driven insights in one premium dashboard.
                </p>
                <Link
                    href="/dashboard"
                    className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-emerald-500 px-8 font-medium text-white transition-all duration-300 hover:bg-emerald-600 hover:w-56"
                >
                    <span className="mr-2">Enter Dashboard</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </section>

            {/* Features Grid Mockup */}
            <section className="w-full py-20 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50 dark:bg-slate-950">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                    <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mb-4">
                        <BarChart2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
                    <p className="text-slate-500">Consolidated views of your Shopify inventory and Ad spend across Google & Meta.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                    <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mb-4">
                        <Zap size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">AI Agent Insights</h3>
                    <p className="text-slate-500">5 Intelligent Agents analyzing your data to suggest profit-maximizing moves.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                    <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Secure & Reliable</h3>
                    <p className="text-slate-500">Encrypted credentials and robust uptime for your critical business data.</p>
                </div>
            </section>
        </main>
    );
}
