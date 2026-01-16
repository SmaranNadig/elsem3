import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { MetricsSummary, SKURecommendation } from '../types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface MetricsChartProps {
    metrics: MetricsSummary;
    recommendations: SKURecommendation[];
}

const MetricsChart: React.FC<MetricsChartProps> = ({ metrics, recommendations }) => {
    // Risk level distribution
    const riskData = {
        labels: ['Critical', 'Warning', 'Safe'],
        datasets: [
            {
                label: 'Risk Distribution',
                data: [
                    metrics.total_critical_risk,
                    metrics.total_warning_risk,
                    metrics.total_safe,
                ],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(16, 185, 129, 1)',
                ],
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    // Category wise profit/loss
    const categoryData = recommendations.reduce((acc: any, item) => {
        if (!acc[item.category]) {
            acc[item.category] = { profit: 0, loss: 0 };
        }
        if (item.profit_per_unit > 0) {
            acc[item.category].profit += item.profit_per_unit;
        } else {
            acc[item.category].loss += Math.abs(item.profit_per_unit);
        }
        return acc;
    }, {});

    const categoryChartData = {
        labels: Object.keys(categoryData),
        datasets: [
            {
                label: 'Profit',
                data: Object.values(categoryData).map((cat: any) => cat.profit),
                backgroundColor: '#10b981', // Emerald
                borderRadius: 4,
            },
            {
                label: 'Loss',
                data: Object.values(categoryData).map((cat: any) => cat.loss),
                backgroundColor: '#ef4444', // Red
                borderRadius: 4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    color: '#a1a1aa', // brand-muted
                    boxWidth: 8,
                    usePointStyle: true,
                    font: {
                        size: 10,
                        family: '"Instrument Sans", sans-serif',
                        weight: 600,
                    },
                },
            },
            tooltip: {
                backgroundColor: '#1D1D1F',
                titleColor: '#fff',
                bodyColor: '#a1a1aa',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                titleFont: { family: '"Instrument Sans", sans-serif', size: 12 },
                bodyFont: { family: '"Instrument Sans", sans-serif', size: 10 },
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#71717a',
                    font: { family: '"Instrument Sans", sans-serif', size: 10 },
                },
                grid: { display: false },
                border: { display: false },
            },
            y: {
                ticks: {
                    color: '#71717a',
                    font: { family: '"Instrument Sans", sans-serif', size: 10 },
                },
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                border: { display: false },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#a1a1aa',
                    boxWidth: 8,
                    usePointStyle: true,
                    font: {
                        size: 10,
                        family: '"Instrument Sans", sans-serif',
                        weight: 600,
                    },
                },
            },
            tooltip: {
                backgroundColor: '#1D1D1F',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
            }
        },
        cutout: '70%',
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Risk Distribution */}
            <div className="p-8 border-r border-white/5 fade-in">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-6">Risk Breakdown</h3>
                <div className="h-64 relative">
                    <Doughnut data={riskData} options={doughnutOptions} />
                    {/* Center Text Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-28 lg:pr-32">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-white">{metrics.total_critical_risk}</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-300">Critical</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Profit/Loss */}
            <div className="p-8 fade-in">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-6">Financial Performance</h3>
                <div className="h-64">
                    <Bar data={categoryChartData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

export default MetricsChart;
