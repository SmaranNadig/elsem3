import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, BarChart2, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';

interface ProductData {
    [key: string]: any;
}

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<ProductData[]>([]);
    const [loading, setLoading] = useState(true);
    const [numericCols, setNumericCols] = useState<string[]>([]);
    const [categoryCol, setCategoryCol] = useState<string>('');
    const [dateCol, setDateCol] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/chat/analysis');
            if (response.ok) {
                const result = await response.json();
                const products = result.products || [];
                setData(products);
                analyzeColumns(products);
            }
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeColumns = (products: ProductData[]) => {
        if (products.length === 0) return;

        const firstItem = products[0];
        const numCols = Object.keys(firstItem).filter(key =>
            typeof firstItem[key] === 'number' &&
            !key.includes('id') &&
            !key.includes('code')
        );
        setNumericCols(numCols);

        // Find best category column (e.g., Product Name, Description, Country)
        const catCols = Object.keys(firstItem).filter(key =>
            typeof firstItem[key] === 'string' &&
            !key.includes('date') &&
            !key.includes('id')
        );
        setCategoryCol(catCols.find(c => c.includes('name') || c.includes('product')) || catCols[0] || 'index');

        // Find date column
        const dCol = Object.keys(firstItem).find(key =>
            key.toLowerCase().includes('date') ||
            key.toLowerCase().includes('time')
        );
        setDateCol(dCol || '');
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1D1D1F] border border-white/10 p-4 rounded-xl shadow-xl backdrop-blur-md">
                    <p className="text-gray-400 text-xs uppercase mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1D1D1F] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="min-h-screen bg-[#1D1D1F] flex flex-col items-center justify-center text-white">
                <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
                <Link to="/chat" className="px-6 py-3 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors">
                    Go to Chat & Upload CSV
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1D1D1F] text-white overflow-x-hidden bg-grain">
            <div className="container mx-auto px-6 pt-12 pb-20">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-12"
                >
                    <Link to="/chat" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-4xl font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                        Analytics Dashboard
                    </h1>
                    <div className="w-10" /> {/* Spacer */}
                </motion.div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {numericCols.slice(0, 4).map((col, idx) => {
                        const total = data.reduce((sum, item) => sum + (Number(item[col]) || 0), 0);
                        const avg = total / data.length;

                        return (
                            <motion.div
                                key={col}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                                        Total {col.replace(/_/g, ' ')}
                                    </span>
                                    <Activity className={`w-5 h-5 ${idx % 2 === 0 ? 'text-purple-400' : 'text-blue-400'}`} />
                                </div>
                                <h3 className="text-3xl font-bold mb-1">{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                                <p className="text-xs text-gray-500">Avg: {avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Main Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Bar Chart - Top Items */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-6 bg-white/5 border border-white/10 rounded-3xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <BarChart2 className="w-5 h-5 text-purple-400" />
                            <h3 className="text-xl font-bold uppercase">Top {categoryCol} by {numericCols[0]}</h3>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey={categoryCol}
                                        stroke="#6b7280"
                                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                                    <Bar dataKey={numericCols[0]} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Area Chart - Trends (if Date exists) or another Metric */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-6 bg-white/5 border border-white/10 rounded-3xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            {dateCol ? <Calendar className="w-5 h-5 text-blue-400" /> : <TrendingUp className="w-5 h-5 text-blue-400" />}
                            <h3 className="text-xl font-bold uppercase">{dateCol ? 'Trends Over Time' : `Distribution of ${numericCols[1] || numericCols[0]}`}</h3>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.slice(0, 20)}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey={dateCol || categoryCol}
                                        stroke="#6b7280"
                                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey={numericCols[1] || numericCols[0]}
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Scatter/Line Chart for Correlation */}
                    {numericCols.length >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="col-span-1 lg:col-span-2 p-6 bg-white/5 border border-white/10 rounded-3xl"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-xl font-bold uppercase">Correlation: {numericCols[0]} vs {numericCols[1]}</h3>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.slice(0, 50)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                        <XAxis dataKey={categoryCol} hide />
                                        <YAxis yAxisId="left" stroke="#8b5cf6" orientation="left" />
                                        <YAxis yAxisId="right" stroke="#3b82f6" orientation="right" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey={numericCols[0]} stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                        <Line yAxisId="right" type="monotone" dataKey={numericCols[1]} stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
