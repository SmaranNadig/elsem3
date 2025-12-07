export function Header() {
    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Dashboard
            </h1>
            <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                    S
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Seller Account</span>
            </div>
        </header>
    );
}
