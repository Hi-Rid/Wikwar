"use client";

export function TopBar() {
    return (
        <header className="relative z-30 flex justify-between items-start w-full p-6 pointer-events-auto">
            {/* Profil Player */}
            <div className="flex items-center bg-bg-panel/90 border border-brand-orange/40 clip-chamfer p-2 pr-6 shadow-lg">
                <div className="relative w-14 h-14 bg-aura-red clip-chamfer flex items-center justify-center border-2 border-brand-orange mr-4">
                    <span className="font-display text-white text-2xl font-black">R</span>
                    <div className="absolute -bottom-2 -right-2 bg-bg-base text-brand-amber text-[10px] font-bold px-1 border border-brand-orange clip-chamfer">
                        LV.12
                    </div>
                </div>
                <div>
                    <div className="text-xl font-display font-black tracking-widest text-text-main">RIDHO</div>
                    <div className="w-48 h-2 bg-bg-base mt-1 border border-text-muted/30">
                        <div className="h-full bg-brand-orange w-2/3"></div>
                    </div>
                </div>
            </div>

            {/* Resource / Currency (Disabled - Coming Soon) */}
            <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-bg-panel/50 border border-text-muted/30 px-4 py-2 clip-chamfer opacity-50 cursor-not-allowed" title="Coming Soon">
                    <span className="text-aura-cyan text-lg">♦</span>
                    <span className="font-sans font-bold text-text-main">192,999</span>
                </div>
                <div className="flex items-center gap-2 bg-bg-panel/50 border border-text-muted/30 px-4 py-2 clip-chamfer opacity-50 cursor-not-allowed" title="Coming Soon">
                    <span className="text-brand-amber text-lg">★</span>
                    <span className="font-sans font-bold text-text-main">4,250</span>
                </div>

                {/* Settings (Bisa diklik nanti) */}
                <button className="w-10 h-10 bg-bg-panel border border-text-muted/30 clip-chamfer flex items-center justify-center text-text-muted hover:text-text-main hover:border-brand-orange transition-colors">
                    ⚙
                </button>
            </div>
        </header>
    );
}