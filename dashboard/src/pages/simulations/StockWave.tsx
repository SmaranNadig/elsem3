import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, ShieldCheck, AlertTriangle } from 'lucide-react';

const StockWave: React.FC = () => {
    const [stockLevel, setStockLevel] = useState(50); // % filled
    const [risk, setRisk] = useState('SAFE');

    useEffect(() => {
        // Fetch real data to determine wave height/color
        const fetchData = async () => {
            try {
                const response = await fetch('/api/chat/analysis');
                const result = await response.json();
                const products = result.products || [];

                // Calculate stock health
                const totalStock = products.reduce((acc: number, p: any) => acc + p.current_stock, 0);
                const criticalCount = products.filter((p: any) => p.risk_level === 'CRITICAL').length;

                // Set level based on some arbitrary max (e.g. 10000 items)
                const level = Math.min(Math.max((totalStock / 10000) * 100, 20), 90);
                setStockLevel(level);

                if (criticalCount > 5) setRisk('CRITICAL');
                else if (criticalCount > 0) setRisk('WARNING');
                else setRisk('SAFE');

            } catch (err) {
                console.error("Failed to load data", err);
            }
        };
        fetchData();
    }, []);

    // Controls
    const [isStorm, setIsStorm] = useState(false);

    const triggerPanic = () => {
        setStockLevel(15);
        setRisk('CRITICAL');
        setIsStorm(true);
    };

    const injectLiquidity = () => {
        setStockLevel(85);
        setRisk('SAFE');
        setIsStorm(false);
    };

    // Wave Animation Params
    const waveVariants = {
        animate: (i: number) => ({
            d: [
                `M0 ${100 - stockLevel} Q 25 ${90 - stockLevel}, 50 ${100 - stockLevel} T 100 ${100 - stockLevel} V 100 H 0 Z`,
                `M0 ${100 - stockLevel} Q 25 ${110 - stockLevel}, 50 ${100 - stockLevel} T 100 ${100 - stockLevel} V 100 H 0 Z`,
                `M0 ${100 - stockLevel} Q 25 ${90 - stockLevel}, 50 ${100 - stockLevel} T 100 ${100 - stockLevel} V 100 H 0 Z`
            ],
            transition: {
                duration: isStorm ? 1 + i * 0.5 : 5 + i,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        })
    };

    return (
        <div className="min-h-screen bg-[#000] text-white overflow-hidden relative font-sans">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10">
                <Link to="/simulations" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white backdrop-blur-md">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="text-right z-20">
                    <h1 className="text-5xl font-bold uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600">
                        Liquid Assets
                    </h1>
                    <div className="flex items-center justify-end gap-2 mt-2">
                        <span className={`h-2 w-2 rounded-full ${risk === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-blue-500 shadow-[0_0_10px_blue]'} animate-pulse`} />
                        <p className="font-mono text-gray-400 text-sm">STOCK LEVEL: {Math.round(stockLevel)}%</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4 z-30">
                <button
                    onClick={() => setIsStorm(!isStorm)}
                    className={`px-6 py-3 rounded-full font-bold uppercase transition-all flex items-center gap-2 ${isStorm ? 'bg-indigo-600 text-white shadow-[0_0_20px_indigo]' : 'bg-white/10 text-white backdrop-blur-md'}`}
                >
                    <Droplets className="w-4 h-4" />
                    {isStorm ? 'Calm Waters' : 'Storm Mode'}
                </button>
                <button
                    onClick={triggerPanic}
                    className="px-6 py-3 bg-red-600 rounded-full text-white font-bold uppercase hover:bg-red-700 transition-colors shadow-lg"
                >
                    Panic Sell
                </button>
                <button
                    onClick={injectLiquidity}
                    className="px-6 py-3 bg-green-600 rounded-full text-white font-bold uppercase hover:bg-green-700 transition-colors shadow-lg"
                >
                    Inject Liquidity
                </button>
            </div>

            {/* Main Visual */}
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-center overflow-hidden">
                {/* Background Text */}
                <h1 className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[20vw] font-bold select-none pointer-events-none transition-colors duration-500 ${isStorm ? 'text-red-900/10' : 'text-[#ffffff03]'}`}>
                    {risk === 'CRITICAL' ? 'CRASH' : 'FLUID'}
                </h1>

                {/* Waves */}
                <svg className="w-full h-full absolute inset-0 preserve-3d" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="waveGradient1" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={risk === 'CRITICAL' ? '#ef4444' : '#60a5fa'} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={risk === 'CRITICAL' ? '#7f1d1d' : '#1e3a8a'} stopOpacity="0.9" />
                        </linearGradient>
                        <linearGradient id="waveGradient2" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={risk === 'CRITICAL' ? '#f87171' : '#93c5fd'} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={risk === 'CRITICAL' ? '#991b1b' : '#1e40af'} stopOpacity="0.6" />
                        </linearGradient>
                    </defs>

                    {/* Back Wave */}
                    <motion.path
                        custom={2}
                        variants={waveVariants}
                        animate="animate"
                        fill="url(#waveGradient2)"
                        d={`M0 ${100 - stockLevel} Q 50 ${110 - stockLevel}, 100 ${100 - stockLevel} V 100 H 0 Z`}
                        style={{ filter: 'blur(5px)' }}
                    />

                    {/* Front Wave */}
                    <motion.path
                        custom={0}
                        variants={waveVariants}
                        animate="animate"
                        fill="url(#waveGradient1)"
                        d={`M0 ${100 - stockLevel} Q 50 ${90 - stockLevel}, 100 ${100 - stockLevel} V 100 H 0 Z`}
                        className="drop-shadow-[0_-20px_40px_rgba(59,130,246,0.3)]"
                    />
                </svg>
            </div>

            {/* Bubble Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-white/20 backdrop-blur-sm"
                        style={{
                            width: Math.random() * 20 + 10,
                            height: Math.random() * 20 + 10,
                            left: `${Math.random() * 100}%`,
                            bottom: '0%'
                        }}
                        animate={{
                            y: [0, -window.innerHeight],
                            opacity: [0, 0.5, 0],
                            x: Math.random() * 100 - 50
                        }}
                        transition={{
                            duration: Math.random() * 10 + 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            {/* Info Cards */}
            <div className="absolute bottom-20 left-10 space-y-4">
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-64 hover:bg-white/10 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Droplets className="w-5 h-5 text-blue-400" />
                        <h3 className="font-bold">Liquidity</h3>
                    </div>
                    <p className="text-2xl font-bold">High</p>
                    <p className="text-xs text-gray-400">Inventory Turnover is stable.</p>
                </motion.div>

                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-64 hover:bg-white/10 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        {risk === 'CRITICAL' ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <ShieldCheck className="w-5 h-5 text-green-400" />}
                        <h3 className="font-bold">Risk Status</h3>
                    </div>
                    <p className={`text-2xl font-bold ${risk === 'CRITICAL' ? 'text-red-400' : 'text-green-400'}`}>
                        {risk}
                    </p>
                    <p className="text-xs text-gray-400">
                        {risk === 'CRITICAL' ? 'Immediate action required.' : 'No major anomalies.'}
                    </p>
                </motion.div>
            </div>
        </div>
    );
};
export default StockWave;
