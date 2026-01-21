import React from 'react';
import { motion } from 'framer-motion';
import { Github, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#1D1D1F] text-white selection:bg-brand-blue selection:text-white bg-grain">
            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto text-center mb-20"
                >
                    <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-tighter mb-8 text-glow">
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-purple-500 text-glow-blue">Mission</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed">
                        We are building the operating system for autonomous commerce. Our goal is to replace reactive management with proactive intelligence.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="glass-card p-10"
                    >
                        <h2 className="text-2xl font-bold uppercase tracking-widest mb-6 text-brand-blue">The Problem</h2>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            E-commerce managers act <strong>too late</strong>. They notice items are out of stock after sales are lost. They adjust ads after budget is wasted. They spot trends after competitors have already capitalized.
                        </p>
                        <p className="text-gray-300 leading-relaxed">
                            Traditional tools provide data, but they don't provide <strong>action</strong>.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="glass-card p-10 border-brand-blue/20"
                    >
                        <h2 className="text-2xl font-bold uppercase tracking-widest mb-6 text-emerald-500">The Solution</h2>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            <strong>Agentic AI</strong> that lives inside your business logic. It doesn't just show you a chart; it reorders stock. It doesn't just warn you about ROAS; it creates new ad campaigns.
                        </p>
                        <p className="text-gray-300 leading-relaxed">
                            We bridge the gap between insight and execution.
                        </p>
                    </motion.div>
                </div>

                <div className="text-center">
                    <h3 className="text-xl font-bold uppercase tracking-widest mb-8 text-gray-400">Connect With Us</h3>
                    <div className="flex justify-center gap-8">
                        <a href="https://github.com/aditya-sridhar-git" target="_blank" rel="noopener noreferrer" className="p-4 rounded-full bg-[#151516] border border-white/5 hover:border-brand-blue hover:text-brand-blue transition-colors group">
                            <Github className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </a>
                        <a href="mailto:aditya.sridhar.126@gmail.com" className="p-4 rounded-full bg-[#151516] border border-white/5 hover:border-emerald-500 hover:text-emerald-500 transition-colors group">
                            <Mail className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
