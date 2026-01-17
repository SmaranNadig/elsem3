import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Globe, DollarSign } from 'lucide-react';

const SalesPulse: React.FC = () => {
    const [salesData, setSalesData] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [activePulses, setActivePulses] = useState<number[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/chat/analysis');
                const result = await response.json();
                const products = result.products || [];
                setSalesData(products);

                // Calculate revenue (simulate from products)
                const rev = products.reduce((acc: number, p: any) => acc + (p.selling_price * 10), 0); // Mock sales volume
                setTotalRevenue(rev);
            } catch (err) {
                console.error("Failed to load data", err);
            }
        };
        fetchData();
    }, []);

    // Generate random nodes for the network
    const nodes = useMemo(() => {
        return Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            x: 50 + Math.cos(i * (Math.PI * 2 / 8)) * 30, // Circle layout
            y: 50 + Math.sin(i * (Math.PI * 2 / 8)) * 30,
            delay: Math.random() * 2
        }));
    }, []);

    // Controls
    const [isSurge, setIsSurge] = useState(false);
    const [theme, setTheme] = useState<'cyber' | 'minimal'>('cyber');

    // Simulate pulsing based on mock sales activity
    useEffect(() => {
        const speed = isSurge ? 80 : 800; // 10x speed for surge

        const interval = setInterval(() => {
            const newPulse = Date.now();
            setActivePulses(prev => [...prev.slice(-20), newPulse]);
        }, speed);

        return () => clearInterval(interval);
    }, [isSurge]);

    const themeColors = {
        cyber: {
            bg: '#020205',
            line: '#0891b2',
            pulse: '#22d3ee',
            glow: 'rgba(34,211,238,0.5)',
            node: '#06b6d4',
            hubBorder: '#22d3ee'
        },
        minimal: {
            bg: '#ffffff',
            line: '#94a3b8',
            pulse: '#000000',
            glow: 'rgba(0,0,0,0.1)',
            node: '#475569',
            hubBorder: '#000000'
        }
    };

    const currentTheme = themeColors[theme];

    return (
        <div className="min-h-screen text-white overflow-hidden relative transition-colors duration-500"
            style={{ backgroundColor: currentTheme.bg }}>

            {/* Background Grid */}
            <div className={`absolute inset-0 bg-[linear-gradient(${theme === 'cyber' ? 'rgba(18,18,20,0.5)' : 'rgba(0,0,0,0.05)'}_1px,transparent_1px),linear-gradient(90deg,${theme === 'cyber' ? 'rgba(18,18,20,0.5)' : 'rgba(0,0,0,0.05)'}_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none`} />

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10">
                <Link to="/simulations" className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-full hover:bg-cyan-900/40 transition-colors text-cyan-400">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="text-right">
                    <h1 className={`text-4xl font-bold uppercase tracking-tighter ${theme === 'cyber' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 filter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-black'}`}>
                        Global Sales Pulse
                    </h1>
                    <p className="font-mono text-cyan-700">LIVE NETWORK ACTIVITY</p>
                </div>
            </div>

            {/* Main Network Viz */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[800px] h-[800px]">
                    {/* Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {nodes.map((node) => (
                            <g key={node.id}>
                                {/* Line to Center */}
                                <line
                                    x1="50%" y1="50%"
                                    x2={`${node.x}%`} y2={`${node.y}%`}
                                    stroke={currentTheme.line}
                                    strokeWidth="1"
                                    strokeOpacity="0.3"
                                />
                                {/* Pulsing Packet */}
                                {activePulses.map((pulseId) => (
                                    <motion.circle
                                        key={`${node.id}-${pulseId}`}
                                        r="3"
                                        fill={currentTheme.pulse}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{
                                            cx: ["50%", `${node.x}%`],
                                            cy: ["50%", `${node.y}%`],
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: isSurge ? 0.5 : 1.5,
                                            ease: "linear",
                                            delay: node.delay * 0.5
                                        }}
                                        filter="url(#glow)"
                                    />
                                ))}
                            </g>
                        ))}
                    </svg>

                    {/* Nodes */}
                    {nodes.map((node) => (
                        <motion.div
                            key={node.id}
                            className="absolute w-4 h-4 rounded-full z-10"
                            style={{
                                left: `${node.x}%`, top: `${node.y}%`,
                                backgroundColor: currentTheme.node,
                                boxShadow: theme === 'cyber' ? `0 0 15px ${currentTheme.glow}` : 'none'
                            }}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: node.delay }}
                        />
                    ))}

                    {/* Center Hub */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                        <motion.div
                            className="w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center relative"
                            style={{
                                borderColor: currentTheme.hubBorder,
                                backgroundColor: theme === 'cyber' ? '#000' : '#fff',
                                boxShadow: theme === 'cyber' ? `0 0 50px ${currentTheme.glow}` : 'none'
                            }}
                            animate={{ borderColor: theme === 'cyber' ? ['#22d3ee', '#3b82f6', '#22d3ee'] : '#000' }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <motion.div
                                className="absolute inset-[-10px] rounded-full border border-dashed"
                                style={{ borderColor: theme === 'cyber' ? 'rgba(34,211,238,0.5)' : 'rgba(0,0,0,0.1)' }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: isSurge ? 5 : 20, repeat: Infinity, ease: "linear" }}
                            />

                            <Globe className={`w-8 h-8 mb-1 ${theme === 'cyber' ? 'text-cyan-400' : 'text-black'}`} />
                            <span className={`text-xs font-bold tracking-widest ${theme === 'cyber' ? 'text-cyan-600' : 'text-gray-500'}`}>HQ HUB</span>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4">
                <button
                    onClick={() => setIsSurge(!isSurge)}
                    className={`px-6 py-3 rounded-full font-bold uppercase transition-all flex items-center gap-2 ${isSurge ? 'bg-red-500 text-white shadow-[0_0_20px_red]' : 'bg-white/10 text-white backdrop-blur-md'}`}
                >
                    <Zap className="w-4 h-4" />
                    {isSurge ? 'Traffic Surge!' : 'Normal Traffic'}
                </button>
                <button
                    onClick={() => setTheme(theme === 'cyber' ? 'minimal' : 'cyber')}
                    className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white font-bold uppercase hover:bg-white/20 transition-colors"
                >
                    Theme: {theme}
                </button>
            </div>

            {/* Stats Panel */}
            <div className={`absolute bottom-10 right-10 p-6 backdrop-blur-xl border rounded-2xl w-80 ${theme === 'cyber' ? 'bg-black/80 border-cyan-500/30' : 'bg-white/80 border-gray-200 shadow-xl'}`}>
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${theme === 'cyber' ? 'bg-cyan-500/10' : 'bg-gray-100'}`}>
                        <Zap className={`w-6 h-6 ${theme === 'cyber' ? 'text-cyan-400' : 'text-black'}`} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 uppercase tracking-wider">Network Load</p>
                        <p className={`text-2xl font-bold font-mono ${theme === 'cyber' ? 'text-white' : 'text-black'}`}>
                            {isSurge ? '142.8%' : '98.4%'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 uppercase tracking-wider">Projected Rev</p>
                        <p className="text-2xl font-bold font-mono text-white">
                            ${totalRevenue.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SalesPulse;
