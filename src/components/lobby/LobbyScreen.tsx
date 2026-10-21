"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { soundManager } from "@/engine/SoundManager";
import { BentoGrid } from "./BentoGrid";
import { LobbyBackground } from "./LobbyBackground";
import Image from "next/image";

const TopBar = () => (
    <motion.header
        initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        className="absolute top-0 left-0 w-full h-[80px] flex justify-between items-center px-6 lg:px-10 py-4 z-30 pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent"
    >
        <div className="flex items-center bg-[#14141A]/60 backdrop-blur-md border border-brand-orange/30 clip-bento p-2 pr-6 shadow-lg w-[300px] h-[56px]">
            <div className="relative w-10 h-10 bg-aura-red clip-bento flex items-center justify-center border-2 border-brand-orange mr-4">
                <span className="font-display text-white text-lg font-black">R</span>
            </div>
            <div>
                <div className="text-lg font-display font-black tracking-widest text-text-main leading-none">RIDHO</div>
                <div className="w-[160px] h-[6px] bg-bg-base mt-1 border border-text-muted/30">
                    <div className="h-full bg-brand-orange w-2/3"></div>
                </div>
            </div>
        </div>
        <div className="flex gap-3 h-[40px]">
            <div className="hidden md:flex items-center gap-2 bg-[#14141A]/60 backdrop-blur-md border border-text-muted/20 px-4 h-full clip-bento opacity-70">
                <span className="text-aura-cyan text-sm">♦</span>
                <span className="font-sans font-bold text-sm">192,999</span>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-[#14141A]/60 backdrop-blur-md border border-text-muted/20 px-4 h-full clip-bento opacity-70">
                <span className="text-brand-amber text-sm">★</span>
                <span className="font-sans font-bold text-sm">4,250</span>
            </div>
            <button className="w-[40px] h-[40px] bg-[#14141A]/60 backdrop-blur-md border border-text-muted/20 clip-bento flex items-center justify-center text-text-muted hover:text-white transition-colors">⚙</button>
        </div>
    </motion.header>
);

const LeftCol = () => (
    <motion.div
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="hidden xl:flex flex-col gap-4 w-[260px] z-20 pointer-events-auto"
    >
        <div className="w-full h-[150px] bg-[#14141A]/60 backdrop-blur-lg border border-brand-orange/30 clip-bento p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-aura-red text-white text-[10px] font-bold px-3 py-1 clip-bento">NEW</div>
            <h3 className="text-brand-amber font-display italic font-black text-2xl">WIKWAR</h3>
            <p className="text-text-main font-sans text-xs mt-2 leading-relaxed opacity-80">Welcome to Wikrama War. Choose your fighter.</p>
        </div>
        {["PACKAGE", "BATTLEPASS"].map((item, i) => (
            <div key={i} className="w-full h-[50px] bg-[#14141A]/60 backdrop-blur-lg border border-brand-orange/30 clip-bento flex items-center px-5 opacity-60 hover:opacity-100 transition-opacity">
                <span className="font-sans font-bold text-xs tracking-widest text-text-muted">{item}</span>
            </div>
        ))}
    </motion.div>
);

const CharacterZone = () => (
    <div className="relative flex-1 flex justify-center items-end z-10 pointer-events-none h-[75vh] xl:h-[85vh]">

        {/* Soft Shadow / Glow di bawah kaki (Pengganti Kotak Panggung) */}
        <div className="absolute bottom-[2%] w-[60%] max-w-[500px] h-[40px] bg-black/80 blur-[25px] rounded-[100%]" />
        <div className="absolute bottom-[2%] w-[40%] max-w-[300px] h-[20px] bg-brand-orange/30 blur-[15px] rounded-[100%] animate-[pulse-glow_3s_ease-in-out_infinite]" />

        <motion.div
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full max-w-[550px] h-full"
        >
            <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute inset-0"
            >
                <Image
                    src="/assets/characters/char_1/ridho.png"
                    alt="Ridho"
                    fill
                    className="object-contain object-bottom drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)]"
                    priority
                />
            </motion.div>
        </motion.div>
    </div>
);

// FOOTER DIHAPUS, GANTI JADI FLOATING HINTS
const FloatingHints = () => (
    <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute bottom-6 left-0 w-full flex justify-center items-center z-30 pointer-events-none"
    >
        <div className="flex gap-8 bg-black/40 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <span className="flex items-center gap-2 text-[10px] md:text-xs text-text-muted font-sans tracking-widest">
                <span className="text-brand-orange font-bold bg-brand-orange/10 px-2 py-1 rounded border border-brand-orange/30">[W/A/S/D]</span> NAVIGATE
            </span>
            <span className="flex items-center gap-2 text-[10px] md:text-xs text-text-muted font-sans tracking-widest">
                <span className="text-brand-orange font-bold bg-brand-orange/10 px-2 py-1 rounded border border-brand-orange/30">[ENTER]</span> SELECT
            </span>
            <span className="flex items-center gap-2 text-[10px] md:text-xs text-text-muted font-sans tracking-widest">
                <span className="text-brand-orange font-bold bg-brand-orange/10 px-2 py-1 rounded border border-brand-orange/30">[ESC]</span> BACK
            </span>
        </div>
    </motion.div>
);

export function LobbyScreen() {
    const { unlockAudio, isAudioUnlocked } = useGameStore();

    useEffect(() => {
        const handleFirstInteraction = () => {
            if (!isAudioUnlocked) {
                soundManager.init();
                unlockAudio();
            }
        };
        window.addEventListener("keydown", handleFirstInteraction, { once: true });
        window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
        return () => {
            window.removeEventListener("keydown", handleFirstInteraction);
            window.removeEventListener("pointerdown", handleFirstInteraction);
        };
    }, [isAudioUnlocked, unlockAudio]);

    return (
        <div className="fixed inset-0 bg-[#0A0A0D] overflow-hidden flex flex-col">
            <LobbyBackground />
            <TopBar />

            {/* Area Tengah yang Lega */}
            <div className="relative flex-1 flex justify-between items-center w-full px-8 lg:px-20 gap-8 pb-10 pt-10">
                <LeftCol />
                <CharacterZone />
                <BentoGrid />
            </div>

            {/* Floating Hints di paling bawah */}
            <FloatingHints />
        </div>
    );
}