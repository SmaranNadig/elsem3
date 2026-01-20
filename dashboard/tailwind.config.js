/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                brand: {
                    dark: '#000000',
                    light: '#FFFFFF',
                    blue: '#FFFFFF', // Replaced blue with white for high contrast
                    card: '#000000',
                    muted: 'rgba(255, 255, 255, 0.6)',
                }
            },
            fontFamily: {
                sans: ['"Instrument Sans"', 'Inter', 'system-ui', 'sans-serif'],
                display: ['"Instrument Sans"', 'Inter', 'system-ui', 'sans-serif'],
            },
            letterSpacing: {
                tighter: '-0.04em',
                tight: '-0.02em',
                normal: '0',
                wide: '0.02em',
                wider: '0.04em',
                widest: '0.1em',
            },
        },
    },
    plugins: [],
}
