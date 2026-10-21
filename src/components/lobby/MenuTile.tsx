"use client";

import { motion } from "framer-motion";

interface MenuTileProps {
    id: string;
    index: number;
    className: string;
    isFocused: boolean;
    onFocus: () => void;
    onActivate: () => void;
}

const TileIcon = ({ id, className }: { id: string; className: string }) => {
    const icons: Record<string, React.ReactNode> = {
        // Ikon Petir (Quick Match) yang baru, lebih clean
        quickmatch: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
        ),
        // Ikon Arcade (Controller)
        arcade: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5S20.33 12 19.5 12z" />
            </svg>
        ),
        // Ikon Training (Target)
        training: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
        ),
        // Ikon How to Play (Tanda Tanya)
        howtoplay: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
            </svg>
        ),
        // Ikon Roster (Dua Orang)
        roster: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
        ),
        // Ikon Settings (Gear)
        settings: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            </svg>
        ),
    };
    return icons[id] || null;
};

export function MenuTile({ id, index, className, isFocused, onFocus, onActivate }: MenuTileProps) {
    const isPrimary = id === "quickmatch"; // Quickmatch jadi primary (orange)
    const isWide = className.includes("col-span-2");
    const isTall = className.includes("row-span-2") && !isWide;

    return (
        <motion.button
            initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
            data-testid={`tile-${id}`} data-focused={isFocused} onMouseEnter={onFocus} onClick={onActivate}
            className={`relative group text-left outline-none w-full h-full ${className} ${isFocused ? "z-20 scale-[1.03]" : "z-10 scale-100"} transition-transform duration-200`}
            style={{ filter: isFocused ? "drop-shadow(0 8px 0 rgba(0,0,0,0.6)) drop-shadow(0 0 15px rgba(255,106,0,0.4))" : "drop-shadow(0 4px 0 rgba(0,0,0,0.5))" }}
        >
            <div className={`absolute inset-0 clip-bento ${isPrimary ? "bg-brand-orange" : isFocused ? "bg-brand-orange" : "bg-[#0A0A0D]"}`} />
            <div className={`absolute inset-[2px] clip-bento overflow-hidden flex flex-col ${isPrimary ? "bg-gradient-to-r from-brand-orange to-brand-amber text-[#0A0A0D]" : "bg-[#14141A] text-text-main"
                }`}>
                {isPrimary && (
                    <>
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-30"></div>
                        {/* Watermark Ikon di Background */}
                        <div className="absolute -right-8 -bottom-8 opacity-10 w-64 h-64 pointer-events-none"><TileIcon id={id} className="w-full h-full" /></div>

                        {/* Pita FEATURED digeser ke KIRI ATAS biar gak nabrak ikon */}
                        <div className="absolute top-0 left-0 bg-[#0A0A0D] text-brand-amber text-[10px] font-bold px-3 py-1 clip-bento origin-top-left scale-90 z-20">FEATURED</div>
                    </>
                )}
                {isPrimary && (
                    <div className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shine-sweep_4s_ease-in-out_infinite]" />
                )}
            </div>

            {/* Content Layer */}
            <div className="absolute inset-0 p-4 flex z-10 pointer-events-none">
                {isWide && (
                    <div className="flex w-full h-full items-center justify-between">
                        <div className="flex flex-col max-w-[calc(100%-60px)]">
                            <span className={`font-display italic font-black tracking-wider text-stroke-dark whitespace-nowrap ${isPrimary ? 'text-[32px] leading-none mb-1' : 'text-[20px] leading-tight'}`}>
                                {id === "quickmatch" ? "QUICK MATCH" : id.toUpperCase()}
                            </span>
                            {isPrimary && <span className="font-sans text-[12px] font-bold opacity-80">1v1 vs random foe</span>}
                        </div>

                        {/* Ikon Utama di Kanan Atas */}
                        <div className={`absolute -top-1 right-2 w-14 h-14 pointer-events-auto drop-shadow-xl ${isPrimary ? "text-[#0A0A0D]" : "text-brand-orange"}`}>
                            <TileIcon id={id} className="w-full h-full" />
                        </div>
                    </div>
                )}

                {isTall && (
                    <div className="flex flex-col w-full h-full justify-end relative">
                        <div className={`absolute top-0 right-0 w-10 h-10 pointer-events-auto drop-shadow-lg ${isFocused ? "text-brand-orange" : "text-text-muted"}`}>
                            <TileIcon id={id} className="w-full h-full" />
                        </div>
                        <div className="flex flex-col mt-auto max-w-full">
                            <span className="font-display italic font-black tracking-wider text-[20px] leading-tight text-stroke-dark">ARCADE</span>
                            <span className="font-sans text-[11px] font-bold opacity-80 mt-1 leading-snug">4 rivals + Boss Guru</span>
                        </div>
                    </div>
                )}

                {!isWide && !isTall && (
                    <div className="flex flex-col w-full h-full justify-end relative">
                        <div className={`absolute top-0 right-0 w-8 h-8 pointer-events-auto drop-shadow-lg ${isFocused ? "text-brand-orange" : "text-text-muted"}`}>
                            <TileIcon id={id} className="w-full h-full" />
                        </div>
                        <span className="font-display italic font-black tracking-wider text-[14px] leading-tight text-stroke-dark max-w-[85%] mt-2">
                            {id === "howtoplay" ? "HOW TO PLAY" : id.toUpperCase()}
                        </span>
                    </div>
                )}
            </div>

            {isFocused && (
                <>
                    <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white z-30 pointer-events-none" />
                    <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white z-30 pointer-events-none" />
                </>
            )}
        </motion.button>
    );
}