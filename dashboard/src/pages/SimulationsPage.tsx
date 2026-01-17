import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Box, Activity, Waves } from 'lucide-react';

const SimulationsPage: React.FC = () => {
    const simulations = [
        {
            id: 'gravity',
            title: 'Inventory Gravity',
            description: 'Physics-based falling products simulation. Interact with your stock.',
            icon: Box,
            color: 'from-purple-500 to-indigo-500',
            link: '/simulations/gravity'
        },
        {
            id: 'pulse',
            title: 'Live Sales Pulse',
            description: 'Cyberpunk network visualization of your sales activity.',
            icon: Activity,
            color: 'from-emerald-400 to-cyan-500',
            link: '/simulations/pulse'
        },
        {
            id: 'wave',
            title: 'Stock Depletion Wave',
            description: 'Liquid metal wave representing inventory value.',
            icon: Waves,
            color: 'from-blue-500 to-sky-400',
            link: '/simulations/wave'
        }
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden bg-grain selection:bg-purple-500/30">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            <div className="container mx-auto px-6 py-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 flex items-center justify-between"
                >
                    <Link to="/chat" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="uppercase tracking-widest text-xs font-bold">Back to Chat</span>
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                        Simulations <span className="text-purple-500">Lab</span>
                    </h1>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {simulations.map((sim, index) => (
                        <Link key={sim.id} to={sim.link}>
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, y: -5 }}
                                className="group relative h-[400px] rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-500"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${sim.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                    <motion.div
                                        whileHover={{ rotate: 360, scale: 1.2 }}
                                        transition={{ duration: 0.8, type: "spring" }}
                                        className="mb-8 p-6 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/30 backdrop-blur-xl"
                                    >
                                        <sim.icon className="w-12 h-12 text-white" />
                                    </motion.div>

                                    <h3 className="text-3xl font-bold uppercase tracking-tight mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                                        {sim.title}
                                    </h3>
                                    <p className="text-gray-400 group-hover:text-gray-300 font-mono text-sm leading-relaxed max-w-xs">
                                        {sim.description}
                                    </p>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">Experimental</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-white">Launch &rarr;</span>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SimulationsPage;
