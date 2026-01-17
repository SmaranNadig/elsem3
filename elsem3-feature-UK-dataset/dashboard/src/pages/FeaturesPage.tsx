import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Zap, BarChart2, ShoppingBag, Brain, Target, AlertTriangle, X } from 'lucide-react';
import Navbar from '../components/Navbar';

interface FeatureDetail {
    title: string;
    description: string;
    details: string[];
}

const FeaturesPage: React.FC = () => {
    const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#1D1D1F] text-white selection:bg-brand-blue selection:text-white bg-grain relative">
            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-20">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 text-glow">
                        Core <span className="text-brand-blue text-glow-blue">Capabilities</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Our platform combines advanced predictive modeling with autonomous execution. Click on any feature to learn more.
                    </p>
                </motion.div>

                {/* Predictive Intelligence Section */}
                <section className="mb-32">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <TrendingUp className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-4xl font-bold uppercase tracking-tight">Predictive Intelligence</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BarChart2 className="w-6 h-6 text-emerald-500" />}
                            title="Seasonal Forecasting"
                            description="Analyzes historical patterns to predict demand surges and quiet periods with 94% accuracy."
                            delay={0.1}
                            onClick={() => setSelectedFeature({
                                title: "Seasonal Forecasting",
                                description: "Our engine ingests years of historical sales data, combined with market trends and holiday calendars, to accuracy forecast demand.",
                                details: [
                                    "94% Accuracy Rate on 30-day horizons",
                                    "Automatic holiday & event detection",
                                    "Breakdown by SKU and Category"
                                ]
                            })}
                        />
                        <FeatureCard
                            icon={<Target className="w-6 h-6 text-emerald-500" />}
                            title="Trend Detection"
                            description="Identifies rising product categories before they peak, giving you the first-mover advantage."
                            delay={0.2}
                            onClick={() => setSelectedFeature({
                                title: "Trend Detection",
                                description: "Scans social signals and competitor listings to identify emerging micro-trends before they become mainstream.",
                                details: [
                                    "Social Sentiment Analysis",
                                    "Competitor Price Tracking",
                                    "Viral Product Identification"
                                ]
                            })}
                        />
                        <FeatureCard
                            icon={<ShoppingBag className="w-6 h-6 text-emerald-500" />}
                            title="Inventory Optimization"
                            description="Suggests precise reorder points to prevent stockouts during high-demand windows."
                            delay={0.3}
                            onClick={() => setSelectedFeature({
                                title: "Inventory Optimization",
                                description: "Balances holding costs against stockout risks to recommend the perfect reorder quantity and timing.",
                                details: [
                                    "Dynamic Safety Stock Calculation",
                                    "Lead Time Analysis",
                                    "Capital Efficiency Reporting"
                                ]
                            })}
                        />
                    </div>
                </section>

                {/* Autonomous Agents Section */}
                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <div className="p-3 rounded-full bg-purple-500/10 border border-purple-500/20">
                            <Brain className="w-8 h-8 text-purple-500" />
                        </div>
                        <h2 className="text-4xl font-bold uppercase tracking-tight">Autonomous Agents</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-purple-500" />}
                            title="Ad Campaign Manager"
                            description="Autonomously adjusts bid strategies and budget allocation across meta platforms in real-time."
                            delay={0.1}
                            onClick={() => setSelectedFeature({
                                title: "Ad Campaign Manager",
                                description: "A fully autonomous agent that manages your Meta and Google ads, optimizing for ROAS around the clock.",
                                details: [
                                    "Real-time Bid Adjustment",
                                    "Creative A/B Testing",
                                    "Audience Targeting Refinement"
                                ]
                            })}
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
                            title="Dynamic Pricing"
                            description="Adjusts SKU pricing based on competitor moves and demand elasticity to maximize margin."
                            delay={0.2}
                            onClick={() => setSelectedFeature({
                                title: "Dynamic Pricing",
                                description: "Monitors competitor pricing 24/7 and adjusts your prices to win the Buy Box while protecting margins.",
                                details: [
                                    "Competitor Monitoring",
                                    "Margin Protection Rules",
                                    "Elasticity Modeling"
                                ]
                            })}
                        />
                        <FeatureCard
                            icon={<AlertTriangle className="w-6 h-6 text-purple-500" />}
                            title="Risk Mitigation"
                            description="Detects and resolves listing issues, suppressions, and stock anomalies without human intervention."
                            delay={0.3}
                            onClick={() => setSelectedFeature({
                                title: "Risk Mitigation",
                                description: "Your 24/7 watchdog. Detects policy violations, listing suppressions, and inventory errors immediately.",
                                details: [
                                    "Listing Quality Checks",
                                    "Policy Violation Alerts",
                                    "Automated Ticket Creation"
                                ]
                            })}
                        />
                    </div>
                </section>
            </div>

            {/* Feature Detail Modal */}
            <AnimatePresence>
                {selectedFeature && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedFeature(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#1D1D1F] border border-white/10 rounded-3xl p-8 shadow-2xl bg-grain overflow-hidden"
                        >
                            <button
                                onClick={() => setSelectedFeature(null)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-6 h-6 text-brand-muted" />
                            </button>

                            <h3 className="text-3xl font-bold uppercase tracking-tight mb-4 text-glow">{selectedFeature.title}</h3>
                            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                                {selectedFeature.description}
                            </p>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-brand-blue">Key Capabilities</h4>
                                <ul className="space-y-3">
                                    {selectedFeature.details.map((detail, index) => (
                                        <li key={index} className="flex items-center gap-3 text-gray-200">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper Component for Feature Cards
const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, delay: number, onClick: () => void }> = ({ icon, title, description, delay, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            onClick={onClick}
            className="glass-card p-8 group hover:border-brand-blue/30 transition-all duration-300 cursor-pointer"
        >
            <div className="mb-6 bg-[#151516] w-12 h-12 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wider mb-4 group-hover:text-glow transition-all">{title}</h3>
            <p className="text-gray-300 leading-relaxed text-sm">
                {description}
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Learn More <Zap className="w-3 h-3" />
            </div>
        </motion.div>
    );
};

export default FeaturesPage;
