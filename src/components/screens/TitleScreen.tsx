"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

export function TitleScreen() {
    const { setScreen, isAudioUnlocked, unlockAudio } = useGameStore();

    const handleStart = () => {
        if (!isAudioUnlocked) {
            unlockAudio();
        }
        setScreen("LOBBY"); // <-- Ubah dari SELECT_MODE ke LOBBY
    };

    // Listener global untuk Enter key (sesuai PRD: PRESS START / ENTER)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Enter" || e.code === "KeyJ") {
                handleStart();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isAudioUnlocked]); // Re-bind if audio state changes

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden"
        >
            {/* Ornamen Background (Garis miring & Plus) */}
            <div className="absolute top-10 left-10 flex gap-2 text-brand-orange">
                <span className="text-2xl font-bold">+</span>
                <span className="text-2xl font-bold">+</span>
                <span className="text-2xl font-bold">+</span>
            </div>
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-brand-orange/20 -translate-y-1/2 -rotate-12"></div>
            <div className="absolute bottom-10 right-10 font-display text-brand-orange/50 text-sm tracking-widest">
                v0.1.0
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center">
                <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="text-8xl md:text-9xl font-display font-black tracking-widest text-brand-orange italic text-glow mb-16 drop-shadow-[0_0_30px_rgba(255,106,0,0.8)]"
                >
                    WIKWAR
                </motion.h1>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    onClick={handleStart}
                    className="group relative px-12 py-4 bg-bg-panel border border-text-main/30 clip-chamfer hover:border-brand-orange transition-colors duration-200"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                    <span className="relative z-10 font-display text-2xl tracking-widest text-text-main group-hover:text-brand-amber transition-colors">
                        PRESS START
                    </span>
                    {/* Ornamen sudut tombol */}
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-orange opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-orange opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>

                <p className="mt-6 text-text-muted text-sm tracking-widest animate-pulse">
                    Press ENTER or J
                </p>
            </div>
        </motion.div>
    );
}