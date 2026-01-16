import React, { useState, useRef, useEffect } from 'react';
import { Upload, Send, MessageSquare, FileText, Trash2, Home, ChevronDown, ChevronUp, Table, Download, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface AnalysisSummary {
    total_products?: number;
    critical_risk?: number;
    warning_risk?: number;
    safe?: number;
    profitable?: number;
    loss_makers?: number;
    avg_profit?: number;
    top_issues?: Array<{
        sku_id: string;
        product_name: string;
        risk_level: string;
        recommended_action: string;
    }>;
}

interface ProductData {
    sku_id: string;
    product_name: string;
    selling_price: number;
    current_stock: number;
    profit_per_unit: number;
    risk_level: string;
    recommended_action: string;
    impact_score: number;
    date: string;
}

// Session storage key
const CHAT_SESSION_KEY = 'inventory_chat_messages';

const ChatPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>(() => {
        // Load from localStorage on init
        const saved = localStorage.getItem(CHAT_SESSION_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            } catch { }
        }
        return [{
            role: 'assistant',
            content: 'Hello! I\'m your inventory analysis assistant. Upload a CSV file to get started, then ask me questions about your data. 🎤 Use the mic button for voice input!',
            timestamp: new Date()
        }];
    });
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [summary, setSummary] = useState<AnalysisSummary | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [showDataTable, setShowDataTable] = useState(false);
    const [productData, setProductData] = useState<ProductData[]>([]);

    // Voice state
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(messages));
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check session status on mount
    useEffect(() => {
        checkStatus();
        initSpeechRecognition();
    }, []);

    const initSpeechRecognition = () => {
        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser. Try Chrome.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const speakText = (text: string) => {
        if (!voiceEnabled) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const checkStatus = async () => {
        try {
            const response = await fetch('/api/chat/status');
            const data = await response.json();
            setHasData(data.has_data);
            if (data.summary) {
                setSummary(data.summary);
            }
            if (data.has_data) {
                fetchProductData();
            }
        } catch (error) {
            console.error('Failed to check status:', error);
        }
    };

    const fetchProductData = async () => {
        try {
            const response = await fetch('/api/chat/analysis');
            if (response.ok) {
                const data = await response.json();
                setProductData(data.products || []);
            }
        } catch (error) {
            console.error('Failed to fetch product data:', error);
        }
    };

    const handleExportCSV = () => {
        window.open('/api/chat/export-csv', '_blank');
    };

    const handleFileUpload = async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: '⚠️ Please upload a CSV file.',
                timestamp: new Date()
            }]);
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/chat/upload-csv', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setHasData(true);
                setSummary(data.summary);
                fetchProductData();

                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `✅ ${data.message}\n\n📊 **Analysis Complete:**\n- Products: ${data.summary.total_products}\n- Critical: ${data.summary.critical_risk} | Warning: ${data.summary.warning_risk} | Safe: ${data.summary.safe}\n- Profitable: ${data.summary.profitable} | Loss-makers: ${data.summary.loss_makers}`,
                    timestamp: new Date()
                }]);

                if (voiceEnabled) {
                    speakText(`Loaded ${data.summary.total_products} products. ${data.summary.critical_risk} need immediate attention.`);
                }
            } else {
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `❌ Error: ${data.detail || 'Failed to upload file'}`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: '❌ Error uploading file. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');

        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        }]);

        setIsLoading(true);

        try {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            }]);

            // Auto-speak response if enabled
            if (voiceEnabled && data.response) {
                speakText(data.response.substring(0, 500)); // Limit to first 500 chars
            }

            if (data.summary) {
                setSummary(data.summary);
            }
            setHasData(data.has_data);

        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearSession = async () => {
        try {
            await fetch('/api/chat/clear', { method: 'POST' });
            setHasData(false);
            setSummary(null);
            setProductData([]);
            setShowDataTable(false);
            localStorage.removeItem(CHAT_SESSION_KEY);
            setMessages([{
                role: 'assistant',
                content: 'Session cleared. Upload a new CSV file to start fresh.',
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'text-red-400 bg-red-500/10';
            case 'WARNING': return 'text-yellow-400 bg-yellow-500/10';
            case 'SAFE': return 'text-green-400 bg-green-500/10';
            default: return 'text-gray-400 bg-gray-500/10';
        }
    };

    return (
        <div className="min-h-screen p-6 font-sans text-white bg-[#1D1D1F]">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <MessageSquare className="w-10 h-10 text-blue-500" />
                        <h1 className="text-4xl font-bold uppercase tracking-tight">
                            Inventory Chat
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Voice Toggle */}
                        <button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-xs font-bold uppercase ${voiceEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                            title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
                        >
                            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        {hasData && (
                            <button
                                onClick={handleClearSession}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full transition-colors text-xs font-bold uppercase"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear
                            </button>
                        )}
                        <a
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-full transition-colors text-xs font-bold uppercase"
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </a>
                    </div>
                </div>

                {/* Upload Zone */}
                {!hasData && (
                    <div
                        className={`mb-6 p-8 border-2 border-dashed rounded-2xl text-center transition-colors cursor-pointer ${dragActive
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/20 hover:border-white/40'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                <p className="text-gray-400">Analyzing your data...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <Upload className="w-12 h-12 text-gray-400" />
                                <div>
                                    <p className="text-lg font-semibold text-white">Drop your CSV file here</p>
                                    <p className="text-gray-400 text-sm">or click to browse</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Summary Card with Export */}
                {hasData && summary && (
                    <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                <span className="text-sm font-bold uppercase text-gray-400">Data Loaded</span>
                            </div>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-full transition-colors text-xs font-bold uppercase"
                            >
                                <Download className="w-3 h-3" />
                                Export CSV
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-white">{summary.total_products}</p>
                                <p className="text-xs text-gray-400 uppercase">Products</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-400">{summary.critical_risk}</p>
                                <p className="text-xs text-gray-400 uppercase">Critical</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-400">{summary.profitable}</p>
                                <p className="text-xs text-gray-400 uppercase">Profitable</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Table Dropdown */}
                {hasData && productData.length > 0 && (
                    <div className="mb-4">
                        <button
                            onClick={() => setShowDataTable(!showDataTable)}
                            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Table className="w-5 h-5 text-purple-400" />
                                <span className="text-sm font-bold uppercase text-gray-300">View Uploaded Data</span>
                                <span className="text-xs text-gray-500">({productData.length} products)</span>
                            </div>
                            {showDataTable ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {showDataTable && (
                            <div className="mt-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Date</th>
                                                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Product</th>
                                                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Price</th>
                                                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Stock</th>
                                                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Profit/Unit</th>
                                                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Risk</th>
                                                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {productData.map((product, idx) => (
                                                <tr key={idx} className="hover:bg-white/5">
                                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                                        {product.date || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-white font-medium truncate max-w-[200px]" title={product.product_name}>
                                                        {product.product_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300">${product.selling_price.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-gray-300">{product.current_stock}</td>
                                                    <td className={`px-4 py-3 ${product.profit_per_unit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        ${product.profit_per_unit.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRiskColor(product.risk_level)}`}>
                                                            {product.risk_level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[150px]" title={product.recommended_action}>
                                                        {product.recommended_action}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Chat Messages */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4">
                    <div className="h-96 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : msg.role === 'system'
                                            ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-100'
                                            : 'bg-white/10 text-gray-100'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                    {msg.role === 'assistant' && (
                                        <button
                                            onClick={() => speakText(msg.content)}
                                            className="mt-2 text-xs text-gray-400 hover:text-white flex items-center gap-1"
                                            title="Read aloud"
                                        >
                                            <Volume2 className="w-3 h-3" /> Listen
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 p-4 rounded-2xl">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {isSpeaking && (
                            <div className="flex justify-center">
                                <button
                                    onClick={stopSpeaking}
                                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-2"
                                >
                                    <VolumeX className="w-4 h-4" /> Stop Speaking
                                </button>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input with Voice */}
                    <div className="border-t border-white/10 p-4">
                        <div className="flex gap-3">
                            <button
                                onClick={toggleListening}
                                disabled={!hasData}
                                className={`px-4 py-3 rounded-full transition-colors flex items-center justify-center ${isListening
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50'
                                    }`}
                                title={isListening ? 'Stop listening' : 'Voice input'}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={hasData ? "Ask about your inventory data..." : "Upload a CSV file first..."}
                                disabled={!hasData || isLoading}
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!hasData || isLoading || !inputMessage.trim()}
                                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Suggested Questions */}
                {hasData && (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 uppercase mr-2">Try asking:</span>
                        {[
                            "Which products need restocking?",
                            "Show me loss-making products",
                            "What are the top issues?",
                            "How is my inventory health?"
                        ].map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => setInputMessage(q)}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
