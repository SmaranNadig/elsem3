import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
            <div className="min-h-screen bg-black p-8">
                <div className="max-w-[1800px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-gray-900 border border-white/10 h-64 animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !products.length) {
        return (
            <div className="min-h-screen bg-black p-8 flex items-center justify-center">
                <div className="text-white text-xl uppercase tracking-widest border border-white p-6">
                    ⚠️ {error || 'No products available'}
                </div>
            </div>
        );
    }

    const handleProductClick = (productName: string) => {
        navigate(`/product/${encodeURIComponent(productName)}`);
    };

    return (
        <div className="min-h-screen bg-black p-8 font-mono">
            <div className="max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="mb-12 border-b border-white pb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 uppercase tracking-widest text-xs"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Dashboard</span>
                    </button>
                    <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tighter uppercase">
                        Product Index
                    </h1>
                    <p className="text-gray-500 text-lg uppercase tracking-widest">
                        Catalogue & Performance Data
                    </p>
                </div>

                {/* Product Grid - Minimal List Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.map((product, index) => (
                        <div
                            key={index}
                            onClick={() => handleProductClick(product.name)}
                            className="group cursor-pointer bg-black border border-white/20 p-6 hover:bg-white hover:text-black transition-colors duration-300"
                        >
                            {/* Rank Badge */}
                            <div className="flex items-center justify-between mb-8">
                                <span className="font-mono text-xs uppercase tracking-widest opacity-50">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                            </div>

                            {/* Product Name */}
                            <h3 className="text-xl font-bold mb-8 line-clamp-2 leading-tight min-h-[3.5rem]">
                                {product.name}
                            </h3>

                            {/* Metrics - Minimal */}
                            <div className="space-y-4 border-t border-current pt-4 opacity-80 group-hover:opacity-100">
                                <div className="flex items-center justify-between text-xs uppercase tracking-widest">
                                    <span>Revenue</span>
                                    <span className="font-bold">
                                        ${product.total_sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs uppercase tracking-widest">
                                    <span>Qty</span>
                                    <span className="font-bold">
                                        {product.total_quantity.toLocaleString()}
                                    </span>
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
