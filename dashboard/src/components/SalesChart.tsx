import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface SalesData {
    months: string[];
    sales: number[];
    quantities: number[];
    total_revenue: number;
    avg_monthly_revenue: number;
}

const SalesChart: React.FC = () => {
    const [salesData, setSalesData] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSalesData();
    }, []);

    const fetchSalesData = async () => {
        try {
            setLoading(true);
            const response = await api.getSalesData();
            setSalesData(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch sales data:', err);
            setError('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !salesData) {
        return (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="text-red-400">
                    <p className="text-lg font-semibold">⚠️ {error || 'No data available'}</p>
                </div>
            </div>
        );
    }

    // Transform data for recharts
    const chartData = salesData.months.map((month, index) => ({
        month: month,
        sales: Math.round(salesData.sales[index]),
        quantity: salesData.quantities[index]
    }));

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                    📊 Product Sales Analysis
                </h2>
                <div className="flex gap-6 text-sm">
                    <div>
                        <span className="text-gray-400">Total Revenue:</span>
                        <span className="text-emerald-400 font-semibold ml-2">
                            £{salesData.total_revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Avg. Monthly:</span>
                        <span className="text-blue-400 font-semibold ml-2">
                            £{salesData.avg_monthly_revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Period:</span>
                        <span className="text-purple-400 font-semibold ml-2">
                            {salesData.months.length} months
                        </span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        formatter={(value: number, name: string) => {
                            if (name === 'sales') {
                                return [`£${value.toLocaleString()}`, 'Revenue'];
                            }
                            return [value.toLocaleString(), 'Quantity'];
                        }}
                    />
                    <Legend
                        wrapperStyle={{ color: '#9CA3AF' }}
                        formatter={(value) => value === 'sales' ? 'Revenue (£)' : 'Quantity Sold'}
                    />
                    <Bar dataKey="sales" fill="#10B981" name="sales" />
                    <Bar dataKey="quantity" fill="#3B82F6" name="quantity" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesChart;
