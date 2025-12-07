import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested for premium look
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Inventory Intelligence Engine",
    description: "Smart analytics and profit optimization for sellers.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn(inter.className, "antialiased")}>{children}</body>
        </html>
    );
}
