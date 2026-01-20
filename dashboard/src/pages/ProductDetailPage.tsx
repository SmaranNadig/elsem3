import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LineChart, Line, BarChart, Bar, ScatterChart, Scatter, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { ArrowLeft, TrendingUp, DollarSign, Package, ShoppingCart, Globe } from 'lucide-react';
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

    const hourlyData = data.hourly_pattern.hours.map((hour: number, i: number) => ({
        hour: `${hour}:00`,
        sales: data.hourly_pattern.sales[i]
    }));

    const weeklyData = data.weekly_pattern.days.map((day: string, i: number) => ({
        day,
        sales: data.weekly_pattern.sales[i]
    }));

    const countryData = data.country_distribution.countries.map((country: string, i: number) => ({
        country,
        sales: data.country_distribution.sales[i]
    }));

    const priceQtyData = data.price_quantity.prices.map((price: number, i: number) => ({
        price,
        quantity: data.price_quantity.quantities[i]
    }));

    const stats = data.statistics;

    return (
        <div className="min-h-screen bg-[#0a0a0b] p-8">
            <div className="max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/product-sales')}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Products</span>
                    </button>
                    <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                        {data.product_name}
                    </h1>
                    <p className="text-gray-400 text-lg">Comprehensive Data Science Analysis</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="text-emerald-400" size={24} />
                            <TrendingUp className="text-emerald-400" size={20} />
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold text-white">£{stats.total_revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <Package className="text-blue-400" size={24} />
                            <TrendingUp className="text-blue-400" size={20} />
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Total Quantity</p>
                        <p className="text-3xl font-bold text-white">{stats.total_quantity.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <ShoppingCart className="text-purple-400" size={24} />
                            <TrendingUp className="text-purple-400" size={20} />
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Total Orders</p>
                        <p className="text-3xl font-bold text-white">{stats.total_orders.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-900/20 to-orange-950/20 border border-orange-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <Globe className="text-orange-400" size={24} />
                            <TrendingUp className="text-orange-400" size={20} />
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Avg Order Value</p>
                        <p className="text-3xl font-bold text-white">£{stats.avg_order_value.toFixed(2)}</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Sales Trend with Moving Averages */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 col-span-2">
                        <h3 className="text-xl font-bold text-white mb-4">📈 Monthly Sales Trend & Moving Averages</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                                <YAxis stroke="#9CA3AF" tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value: any) => [`£${Number(value).toLocaleString()}`, '']}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="sales" stroke="#10B981" fill="url(#salesGradient)" strokeWidth={2} />
                                <Line type="monotone" dataKey="ma3" stroke="#3B82F6" strokeWidth={2} dot={false} name="3-Month MA" />
                                <Line type="monotone" dataKey="ma6" stroke="#8B5CF6" strokeWidth={2} dot={false} name="6-Month MA" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Growth Rate Analysis */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">📊 Month-over-Month Growth Rate</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                                <YAxis stroke="#9CA3AF" tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Growth']}
                                />
                                <Bar dataKey="growth" fill="#10B981" radius={[8, 8, 0, 0]}>
                                    {monthlyData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={Number(entry.growth) >= 0 ? '#10B981' : '#EF4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Day of Week Pattern */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">📅 Sales by Day of Week</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="day" stroke="#9CA3AF" angle={-20} textAnchor="end" height={70} />
                                <YAxis stroke="#9CA3AF" tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value: any) => [`£${Number(value).toLocaleString()}`, 'Sales']}
                                />
                                <Bar dataKey="sales" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Hour of Day Pattern */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">🕐 Sales by Hour of Day</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="hour" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value: any) => [`£${Number(value).toLocaleString()}`, 'Sales']}
                                />
                                <Line type="monotone" dataKey="sales" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Geographic Distribution */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">🌍 Top 10 Countries by Revenue</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={countryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis type="number" stroke="#9CA3AF" tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="country" stroke="#9CA3AF" width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value: any) => [`£${Number(value).toLocaleString()}`, 'Sales']}
                                />
                                <Bar dataKey="sales" fill="#F59E0B" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Price vs Quantity Correlation */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">💰 Price vs Quantity Sold</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="price" name="Price" stroke="#9CA3AF" tickFormatter={(v) => `£${v}`} />
                                <YAxis dataKey="quantity" name="Quantity" stroke="#9CA3AF" />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value: any, name: any) => [value, name === 'price' ? 'Price' : 'Quantity']}
                                />
                                <Scatter data={priceQtyData} fill="#EC4899" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Statistical Summary */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 col-span-2">
                        <h3 className="text-xl font-bold text-white mb-6">📊 Statistical Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Mean Sales</p>
                                <p className="text-2xl font-bold text-emerald-400">£{stats.mean_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Median Sales</p>
                                <p className="text-2xl font-bold text-blue-400">£{stats.median_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Std Deviation</p>
                                <p className="text-2xl font-bold text-purple-400">£{stats.std_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Avg Price</p>
                                <p className="text-2xl font-bold text-orange-400">£{stats.avg_price.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Min Sales</p>
                                <p className="text-2xl font-bold text-red-400">£{stats.min_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Max Sales</p>
                                <p className="text-2xl font-bold text-green-400">£{stats.max_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
