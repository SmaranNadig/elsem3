import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#1D1D1F] text-white selection:bg-brand-blue selection:text-white overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <header className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-grain">
                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h1 className="text-6xl md:text-9xl font-bold uppercase tracking-tighter mb-6 leading-[0.9] text-glow">
                            Master Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-purple-400 text-glow-blue">Commerce</span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-light"
                    >
                        AI-driven insights for the modern merchant. Predict trends, optimize stock, and automize ads with precision.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Link to="/dashboard">
                            <button className="px-10 py-5 bg-brand-blue rounded-full text-white font-bold text-sm uppercase tracking-widest button-glow hover:scale-105 transition-transform duration-300 flex items-center gap-3 mx-auto">
                                Launch Dashboard
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* Abstract Visual - Grainy Card Stack */}
                <motion.div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] pointer-events-none"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 50 }}
                    transition={{ duration: 1, delay: 0.6 }}
                >
                    <div className="relative w-full h-full">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[300px] bg-[#2A2A2C] rounded-t-3xl border-t border-l border-r border-white/10 shadow-2xl bg-grain" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[250px] bg-[#3B3B3D] rounded-t-3xl border-t border-l border-r border-white/10 shadow-2xl translate-y-8 bg-grain z-10" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100%] h-[350px] bg-gradient-to-b from-[#1D1D1F] to-transparent z-20" />
                    </div>
                </motion.div>
            </header>

        </div>
    );
};

export default LandingPage;
