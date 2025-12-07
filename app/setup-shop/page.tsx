"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Store, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SetupShopPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [shopUrl, setShopUrl] = useState("");
    const [error, setError] = useState("");

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Simple validation for myshopify.com
        const cleanUrl = shopUrl.replace("https://", "").replace("http://", "").split("/")[0];
        if (!cleanUrl.includes("myshopify.com") && !cleanUrl.includes(".")) {
            // Just a basic check, real validation would be better
        }

        try {
            const res = await fetch("/api/shop/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shopifyDomain: cleanUrl }),
            });

            if (res.ok) {
                setStep(2); // Success step
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to connect shop");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black text-white px-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black -z-10"></div>

            <motion.div
                layout
                className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-8"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                        <Store size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Connect your Store</h1>
                        <p className="text-gray-400 text-sm">Step {step} of 2</p>
                    </div>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleConnect} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Shopify Store URL</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={shopUrl}
                                    onChange={(e) => setShopUrl(e.target.value)}
                                    className="w-full bg-black/40 border border-white/20 rounded-lg pl-4 pr-32 py-3 text-white focus:outline-none focus:border-purple-500 transition-all font-mono text-sm"
                                    placeholder="my-store.myshopify.com"
                                />
                                <div className="absolute right-3 top-3 text-gray-500 text-xs pointer-events-none">
                                    SHOPIFY API
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                We'll need to install our app on your store to sync inventory and ads data.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !shopUrl}
                            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Connect Store <ArrowRight size={18} /></>}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <CheckCircle2 size={32} />
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-2">Store Connected!</h2>
                        <p className="text-gray-400">Redirecting to your dashboard...</p>
                    </div>
                )}

            </motion.div>
        </div>
    );
}
