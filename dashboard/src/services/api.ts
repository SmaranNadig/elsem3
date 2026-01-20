// API client for backend communication

import axios from 'axios';
import type { AgentStatusResponse, MetricsSummary, SKURecommendation, Alert, StrategyMode } from '../types';

const API_BASE_URL = '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const api = {
    // Health check
    checkHealth: async () => {
        const response = await apiClient.get('/health');
        return response.data;
    },

    // Get agent status
    getAgentStatus: async (): Promise<AgentStatusResponse> => {
        const response = await apiClient.get('/agents/status');
        return response.data;
    },

    // Run agents
    runAgents: async () => {
        const response = await apiClient.post('/agents/run');
        return response.data;
    },

    // Get metrics summary
    getMetricsSummary: async (): Promise<MetricsSummary> => {
        const response = await apiClient.get('/metrics/summary');
        return response.data;
    },

    // Get recommendations
    getRecommendations: async (): Promise<SKURecommendation[]> => {
        const response = await apiClient.get('/recommendations');
        return response.data;
    },

    // Get SKU details
    getSKUDetails: async (skuId: string) => {
        const response = await apiClient.get(`/sku/${skuId}`);
        return response.data;
    },

    // Get Alerts
    getAlerts: async (): Promise<Alert[]> => {
        const response = await apiClient.get('/alerts');
        return response.data;
    },

    executeAction: async (skuId: string, actionType: string, value?: number, originalValue?: number) => {
        const response = await apiClient.post('/alerts/action', {
            sku_id: skuId,
            action_type: actionType,
            value: value,
            original_value: originalValue
        });
        return response.data;
    },

    // Seasonal Analysis
    getSeasonalAnalysis: async (): Promise<any> => {
        const response = await apiClient.get('/seasonal/analysis');
        return response.data;
    },

    // Ad Gateway
    getAdCampaigns: async (): Promise<any> => {
        const response = await apiClient.get('/ads/campaigns');
        return response.data;
    },

    getAdMetrics: async (): Promise<any> => {
        const response = await apiClient.get('/ads/metrics/summary');
        return response.data;
    },

    connectAdPlatform: async (credentials: any) => {
        const response = await apiClient.post('/ads/connect', credentials);
        return response.data;
    },

    createCampaign: async (data: any) => {
        const response = await apiClient.post('/ads/campaigns', data);
        return response.data;
    },

    toggleCampaign: async (campaignId: string, action: 'pause' | 'resume') => {
        const response = await apiClient.post(`/ads/campaigns/${campaignId}/${action}`);
        return response.data;
    },

    // Strategy Modes
    getAvailableModes: async (): Promise<{ modes: StrategyMode[], default_mode: string }> => {
        const response = await apiClient.get('/modes/available');
        return response.data;
    },

    getSKUMode: async (skuId: string) => {
        const response = await apiClient.get(`/sku/${skuId}/mode`);
        return response.data;
    },

    updateSKUMode: (skuId: string, mode: string) => {
        return apiClient.put(`/sku/${skuId}/mode`, { mode });
    },

    // Sales analytics
    getSalesData: () => {
        return apiClient.get('/sales/monthly');
    },

    getProductSales: (limit: number = 20) => {
        return apiClient.get(`/sales/products?limit=${limit}`);
    },

    // Advanced Analytics
    getAnalyticsProducts: (limit: number = 50) => {
        return apiClient.get(`/analytics/products?limit=${limit}`);
    },

    getProductAnalytics: (productName: string) => {
        return apiClient.get(`/analytics/product`, {
            params: { product_name: productName }
        });
    },

    bulkUpdateModes: async (updates: Record<string, string>) => {
        const response = await apiClient.post('/modes/bulk-update', { updates });
        return response.data;
    },

    getModeDistribution: async () => {
        const response = await apiClient.get('/modes/distribution');
        return response.data;
    },

    // Chat API
    getChatStatus: async () => {
        const response = await apiClient.get('/chat/status');
        return response.data;
    },

    uploadChatCSV: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/chat/upload-csv', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    sendChatMessage: async (message: string) => {
        const response = await apiClient.post('/chat/message', { message });
        return response.data;
    },

    clearChatSession: async () => {
        const response = await apiClient.post('/chat/clear');
        return response.data;
    },

    getChatAnalysis: async () => {
        const response = await apiClient.get('/chat/analysis');
        return response.data;
    }
};

export default api;
