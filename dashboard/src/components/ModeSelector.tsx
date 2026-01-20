import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Mode {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
}

interface ModeSelectorProps {
    skuId: string;
    currentMode: string;
    onModeChange: (skuId: string, newMode: string) => Promise<void>;
    disabled?: boolean;
}

const MODE_COLORS: Record<string, string> = {
    profit_maximization: 'emerald',
    loss_reduction: 'blue',
    customer_satisfaction: 'purple',
    balanced: 'gray'
};

const ModeSelector: React.FC<ModeSelectorProps> = ({ skuId, currentMode, onModeChange, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [modes, setModes] = useState<Mode[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load available modes on first open
    const loadModes = async () => {
        if (loaded) return;

        try {
            const response = await fetch('/api/modes/available');
            const data = await response.json();
            setModes(data.modes);
            setLoaded(true);
        } catch (error) {
            console.error('Failed to load modes:', error);
        }
    };

    const handleModeSelect = async (modeId: string) => {
        if (modeId === currentMode || isUpdating) return;

        setIsUpdating(true);
        try {
            await onModeChange(skuId, modeId);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to update mode:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const currentModeData = modes.find(m => m.id === currentMode);
    const modeColor = MODE_COLORS[currentMode] || 'gray';

    return (
        <div className="relative">
            <button
                onClick={() => {
                    loadModes();
                    setIsOpen(!isOpen);
                }}
                disabled={disabled || isUpdating}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                    ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                    ${modeColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : ''}
                    ${modeColor === 'blue' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : ''}
                    ${modeColor === 'purple' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : ''}
                    ${modeColor === 'gray' ? 'bg-gray-500/10 text-gray-300 border border-gray-500/20' : ''}
                `}
            >
                {isUpdating ? (
                    <>
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-current"></div>
                        <span>Updating...</span>
                    </>
                ) : (
                    <>
                        <span>{currentModeData?.icon || '⚖️'}</span>
                        <span>{currentModeData?.name || 'Balanced'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            <AnimatePresence>
                {isOpen && !isUpdating && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full mt-2 right-0 z-50 w-72 bg-[#1D1D1F] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-2">
                                {modes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => handleModeSelect(mode.id)}
                                        className={`w-full text-left p-3 rounded-lg transition-all mb-1 last:mb-0
                                            ${mode.id === currentMode
                                                ? 'bg-white/10 border border-white/20'
                                                : 'hover:bg-white/5 border border-transparent'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{mode.icon}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-sm text-white">{mode.name}</span>
                                                    {mode.id === currentMode && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-brand-blue/20 text-brand-blue rounded-full">
                                                            ACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    {mode.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModeSelector;
