"use client";

export function LeftColumn() {
    return (
        <div className="absolute left-[32px] top-[120px] w-[260px] flex flex-col gap-[12px] pointer-events-auto z-20">
            {/* Featured Card */}
            <div className="w-full h-[150px] bg-[#14141A] border border-brand-orange/50 clip-bento relative overflow-hidden flex flex-col justify-between p-3 shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 right-0 bg-aura-red text-white text-[10px] font-bold px-2 py-1 clip-bento origin-top-right z-10">NEW</div>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 to-transparent" />
                <div className="relative z-10">
                    <span className="text-brand-amber font-display italic font-black text-xl">WIKWAR</span>
                    <p className="text-text-main font-sans text-xs mt-1">Welcome to Wikrama War. Choose your fighter.</p>
                </div>
                <div className="flex gap-1 relative z-10">
                    {[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-brand-orange' : 'bg-text-muted/30'}`} />)}
                </div>
            </div>

            {/* Tabs */}
            {["PACKAGE", "BATTLEPASS"].map((item, i) => (
                <div key={i} className="w-full h-[52px] bg-[#14141A]/85 backdrop-blur-md border border-brand-orange/50 clip-slant flex items-center px-4 shadow-[0_2px_0_rgba(0,0,0,0.5)] opacity-50 cursor-not-allowed">
                    <div className="w-6 h-6 flex items-center justify-center text-text-muted bg-bg-base clip-chamfer mr-3">
                        {i === 0 ? "📦" : "🎫"}
                    </div>
                    <span className="font-sans font-bold text-sm tracking-wider text-text-muted">{item}</span>
                </div>
            ))}
        </div>
    );
}