import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Package, ShoppingCart, ChevronRight } from 'lucide-react';
import api from '../services/api';

interface Product {
    name: string;
    total_sales: number;
    total_quantity: number;
    total_orders: number;
}

const ProductSalesPage: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.getAnalyticsProducts(50);
            setProducts(response.data.products);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-gray-800 rounded-xl p-6 h-48 animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !products.length) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] p-8">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-red-400 text-xl">⚠️ {error || 'No products available'}</p>
                </div>
            </div>
        );
    }

    const handleProductClick = (productName: string) => {
        navigate(`/product/${encodeURIComponent(productName)}`);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Dashboard</span>
                    </button>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                        � Product Analytics
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Click any product to view comprehensive data science analysis with advanced visualizations
                    </p>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product, index) => (
                        <div
                            key={index}
                            onClick={() => handleProductClick(product.name)}
                            className="group cursor-pointer bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/10"
                        >
                            {/* Rank Badge */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                                    #{index + 1}
                                </div>
                                <ChevronRight className="text-gray-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" size={20} />
                            </div>

                            {/* Product Name */}
                            <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                                {product.name}
                            </h3>

                            {/* Metrics */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <TrendingUp size={16} />
                                        <span className="text-sm">Revenue</span>
                                    </div>
                                    <span className="text-emerald-400 font-bold">
                                        £{product.total_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Package size={16} />
                                        <span className="text-sm">Quantity</span>
                                    </div>
                                    <span className="text-blue-400 font-bold">
                                        {product.total_quantity.toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <ShoppingCart size={16} />
                                        <span className="text-sm">Orders</span>
                                    </div>
                                    <span className="text-purple-400 font-bold">
                                        {product.total_orders.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* View Analysis Button */}
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                                <div className="text-center text-sm text-gray-400 group-hover:text-emerald-400 transition-colors font-semibold">
                                    View Advanced Analytics →
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductSalesPage;
