import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProductSalesPage from './pages/ProductSalesPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ChatPage from './pages/ChatPage';

import SimulationsPage from './pages/SimulationsPage';
import InventoryGravity from './pages/simulations/InventoryGravity';
import SalesPulse from './pages/simulations/SalesPulse';
import StockWave from './pages/simulations/StockWave';
import './index.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/product-sales" element={<ProductSalesPage />} />
                <Route path="/product/:productName" element={<ProductDetailPage />} />
                <Route path="/chat" element={<ChatPage />} />

                <Route path="/simulations" element={<SimulationsPage />} />
                <Route path="/simulations/gravity" element={<InventoryGravity />} />
                <Route path="/simulations/pulse" element={<SalesPulse />} />
                <Route path="/simulations/wave" element={<StockWave />} />
            </Routes >
        </Router >
    );
}

export default App


