import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProductSalesPage from './pages/ProductSalesPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ChatPage from './pages/ChatPage';
import WorkflowsPage from './pages/WorkflowsPage';
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
                <Route path="/workflows" element={<WorkflowsPage />} />
            </Routes>
        </Router>
    );
}

export default App


