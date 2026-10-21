"use client";

export function BottomNav() {
    return (
        <footer className="relative z-30 w-full bg-bg-panel/80 border-t border-brand-orange/20 flex items-center justify-between px-8 py-3 pointer-events-auto backdrop-blur-md">

            {/* Kiri Bawah */}
            <div className="flex gap-6">
                {[
                    { icon: "👤", label: "FORMATION" },
                    { icon: "⚔", label: "HERO" }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center group cursor-not-allowed opacity-50" title="Coming Soon">
                        <div className="w-10 h-10 bg-bg-base border border-text-muted/30 clip-chamfer flex items-center justify-center text-xl text-text-muted">
                            {item.icon}
                        </div>
                        <span className="text-[10px] font-bold text-text-muted mt-1">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Tengah: Instruksi Keyboard */}
            <div className="text-xs text-text-muted font-sans tracking-widest flex items-center gap-6">
                <span className="flex items-center gap-2"><span className="text-brand-orange font-bold">[W/A/S/D]</span> NAVIGATE</span>
                <span className="flex items-center gap-2"><span className="text-brand-orange font-bold">[ENTER]</span> SELECT</span>
                <span className="flex items-center gap-2"><span className="text-brand-orange font-bold">[ESC]</span> BACK</span>
            </div>

            {/* Kanan Bawah */}
            <div className="flex gap-6">
                {[
                    { icon: "🎒", label: "INVENTORY" },
                    { icon: "🛒", label: "SHOP" }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center group cursor-not-allowed opacity-50" title="Coming Soon">
                        <div className="w-10 h-10 bg-bg-base border border-text-muted/30 clip-chamfer flex items-center justify-center text-xl text-text-muted">
                            {item.icon}
                        </div>
                        <span className="text-[10px] font-bold text-text-muted mt-1">{item.label}</span>
                    </div>
                ))}
            </div>
        </footer>
    );
}