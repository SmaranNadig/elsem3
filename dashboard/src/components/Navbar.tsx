import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

const Navbar: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-5xl z-50">
            <div className="glass-card px-8 py-4 flex items-center justify-between border-brand-light/10 !rounded-full bg-[#1D1D1F]/80 backdrop-blur-xl">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center">
                        <span className="font-bold text-white">E</span>
                    </div>
                    <span className="font-bold text-lg text-white tracking-wide group-hover:text-glow transition-all">ECI</span>
                </Link>

                {/* Links */}
                <div className="flex items-center gap-8">
                    <Link to="/" className={`text-sm font-medium hover:text-white transition-colors uppercase tracking-widest ${location.pathname === '/' ? 'text-white' : 'text-gray-300'}`}>
                        Home
                    </Link>
                    <Link to="/features" className={`text-sm font-medium hover:text-white transition-colors uppercase tracking-widest hidden md:block ${location.pathname === '/features' ? 'text-white' : 'text-gray-300'}`}>
                        Features
                    </Link>
                    <Link to="/chat" className={`text-sm font-medium hover:text-white transition-colors uppercase tracking-widest hidden md:block ${location.pathname === '/chat' ? 'text-white' : 'text-gray-300'}`}>
                        Chat
                    </Link>
                    <Link to="/about" className={`text-sm font-medium hover:text-white transition-colors uppercase tracking-widest hidden md:block ${location.pathname === '/about' ? 'text-white' : 'text-gray-300'}`}>
                        About
                    </Link>
                </div>

                {/* CTA */}
                <Link to="/dashboard">
                    <button className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-full hover:bg-brand-blue hover:text-white transition-all duration-300 font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,102,255,0.4)]">
                        <LayoutDashboard className="w-4 h-4" />
                        Enter App
                    </button>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
