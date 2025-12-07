import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#4F46E5', // Indigo 600
                    foreground: '#FFFFFF'
                },
                secondary: {
                    DEFAULT: '#1E293B', // Slate 800
                    foreground: '#F8FAFC'
                },
                accent: {
                    DEFAULT: '#10B981', // Emerald 500
                    foreground: '#FFFFFF'
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
