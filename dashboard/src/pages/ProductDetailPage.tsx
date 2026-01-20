import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Line, BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { ArrowLeft, DollarSign, Package, ShoppingCart, Globe } from 'lucide-react';
import api from '../services/api';



const ProductDetailPage: React.FC = () => {
    const { productName } = useParams<{ productName: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (productName) {
            fetchProductData();
        }
    }, [productName]);

    const fetchProductData = async () => {
        try {
            setLoading(true);
            const response = await api.getProductAnalytics(productName!);
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch product data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!data || data.error) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] p-8">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-red-400 text-xl">⚠️ {data?.error || 'Failed to load product data'}</p>
                </div>
            </div>
        );
    }

    // Transform data for charts
    const monthlyData = data.monthly_trends.months.map((month: string, i: number) => ({
        month,
        sales: data.monthly_trends.sales[i],
        quantity: data.monthly_trends.quantities[i],
        orders: data.monthly_trends.orders[i],
        growth: data.monthly_trends.growth_rate[i],
        ma3: data.monthly_trends.ma_3month[i],
        ma6: data.monthly_trends.ma_6month[i]
    }));

    const weeklyData = data.weekly_pattern.days.map((day: string, i: number) => ({
        day,
        sales: data.weekly_pattern.sales[i]
    }));

    const stats = data.statistics;

    return (
        <div className="min-h-screen bg-black p-8 font-mono">
            <div className="max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="mb-12 border-b border-white pb-8">
                    <button
                        onClick={() => navigate('/product-sales')}
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 uppercase tracking-widest text-xs"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Index</span>
                    </button>
                    <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tighter uppercase">
                        {data.product_name}
                    </h1>
                    <p className="text-gray-500 text-lg uppercase tracking-widest">Analytics & Data Science</p>
                </div>

                {/* KPI Cards - Minimal Black/White */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
                    <div className="border-t border-white/20 pt-4">
                        <div className="flex items-center justify-between mb-2 text-gray-500 uppercase tracking-widest text-xs">
                            <span>Total Revenue</span>
                            <DollarSign size={16} />
                        </div>
                        <p className="text-4xl font-bold text-white mt-4">${stats.total_revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    </div>

                    <div className="border-t border-white/20 pt-4">
                        <div className="flex items-center justify-between mb-2 text-gray-500 uppercase tracking-widest text-xs">
                            <span>Total Quantity</span>
                            <Package size={16} />
                        </div>
                        <p className="text-4xl font-bold text-white mt-4">{stats.total_quantity.toLocaleString()}</p>
                    </div>

                    <div className="border-t border-white/20 pt-4">
                        <div className="flex items-center justify-between mb-2 text-gray-500 uppercase tracking-widest text-xs">
                            <span>Total Orders</span>
                            <ShoppingCart size={16} />
                        </div>
                        <p className="text-4xl font-bold text-white mt-4">{stats.total_orders.toLocaleString()}</p>
                    </div>

                    <div className="border-t border-white/20 pt-4">
                        <div className="flex items-center justify-between mb-2 text-gray-500 uppercase tracking-widest text-xs">
                            <span>Avg Order Value</span>
                            <Globe size={16} />
                        </div>
                        <p className="text-4xl font-bold text-white mt-4">${stats.avg_order_value.toFixed(2)}</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
                    {/* Monthly Sales Trend */}
                    <div className="col-span-2 border border-white/10 p-8">
                        <h3 className="text-2xl font-bold text-white mb-8 uppercase tracking-widest">Monthly Sales Trend</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="month" stroke="#666" tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#666" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Sales']}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#FFFFFF" fill="url(#salesGradient)" strokeWidth={1} />
                                <Line type="monotone" dataKey="ma3" stroke="#666" strokeDasharray="5 5" strokeWidth={1} dot={false} name="3M MA" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Growth Rate */}
                    <div className="border border-white/10 p-8">
                        <h3 className="text-xl font-bold text-white mb-8 uppercase tracking-widest">MoM Growth</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="month" stroke="#666" hide />
                                <YAxis stroke="#666" tickFormatter={(v) => `${v}%`} hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: '#333' }}
                                />
                                <Bar dataKey="growth" fill="#fff" maxBarSize={50}>
                                    {monthlyData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={Number(entry.growth) >= 0 ? '#FFFFFF' : '#333333'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Day of Week */}
                    <div className="border border-white/10 p-8">
                        <h3 className="text-xl font-bold text-white mb-8 uppercase tracking-widest">Weekly Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="day" stroke="#666" tickFormatter={(v) => v.substring(0, 3)} tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: '#333' }}
                                />
                                <Bar dataKey="sales" fill="#fff" maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stats Summary - Minimal Text */}
                    <div className="col-span-2 border-t border-white/20 pt-12">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Mean Sales</p>
                                <p className="text-2xl text-white font-bold">${stats.mean_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Median</p>
                                <p className="text-2xl text-white font-bold">${stats.median_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Std Dev</p>
                                <p className="text-2xl text-white font-bold">${stats.std_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Avg Price</p>
                                <p className="text-2xl text-white font-bold">${stats.avg_price.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Min Range</p>
                                <p className="text-2xl text-white font-bold">${stats.min_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Max Range</p>
                                <p className="text-2xl text-white font-bold">${stats.max_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
