"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Megaphone,
    Lightbulb,
    Settings,
    LogOut,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Package, label: "Inventory", href: "/dashboard/inventory" },
    { icon: Megaphone, label: "Ad Campaigns", href: "/dashboard/ads" },
    { icon: Lightbulb, label: "Agent Insights", href: "/dashboard/insights" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Menu size={24} />
            </button>

            <aside className={cn(
                "fixed left-0 top-0 h-screen bg-slate-950 text-slate-300 w-64 border-r border-slate-800 transition-transform duration-300 z-40 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                        Inventory AI
                    </h2>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-400 font-medium"
                                        : "hover:bg-slate-900 hover:text-white"
                                )}
                            >
                                <item.icon size={20} className={cn("transition-colors", isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-white")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-colors">
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
