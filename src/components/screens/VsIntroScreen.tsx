"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fighter } from "./SelectCharacterScreen";
import { StageData } from "./SelectStageScreen";

interface Props {
    player: Fighter;
    opponent: Fighter;
    stage: StageData;
    onComplete: () => void;
    playSound?: (event: "move" | "select" | "back" | "start" | "denied") => void;
}

export default function VsIntroScreen({ player, opponent, stage, onComplete, playSound }: Props) {
    const [isSkipped, setIsSkipped] = useState(false);

    useEffect(() => {
        playSound?.("start"); // Suara dramatis pas masuk

        // Auto lanjut setelah 2.5 detik
        const timer = setTimeout(() => {
            if (!isSkipped) onComplete();
        }, 2500);

        // Skip kalau pencet tombol apa aja
        const handleKey = (e: KeyboardEvent) => {
            if (!isSkipped) {
                setIsSkipped(true);
                onComplete();
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("keydown", handleKey);
        };
    }, [onComplete, isSkipped, playSound]);

    const renderArt = (fighter: Fighter, side: "left" | "right") => (
        <div className="relative w-full h-full flex flex-col justify-end items-center overflow-hidden">
            {fighter.artSrc ? (
                <motion.img
                    src={fighter.artSrc}
                    alt={fighter.name}
                    className={`max-h-[75%] object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] ${side === 'left' ? 'scale-x-[-1]' : ''}`}
                    initial={{ x: side === 'left' ? -150 : 150, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
                />
            ) : (
                <motion.div
                    initial={{ x: side === 'left' ? -150 : 150, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="w-64 h-[70%] bg-black/50 border border-white/20 mb-20 flex flex-col justify-center items-center [clip-path:polygon(20px_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%,0_20px)] relative overflow-hidden"
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-30 absolute inset-0" style={{ color: fighter.aura.color }}>
                        <path d="M50 20 C60 20 70 30 70 45 C70 60 60 65 50 65 C40 65 30 60 30 45 C30 30 40 20 50 20 Z" fill="currentColor" />
                        <path d="M20 80 C20 60 40 55 50 55 C60 55 80 60 80 80 L80 100 L20 100 Z" fill="currentColor" />
                    </svg>
                </motion.div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#0A0A0D] text-white font-ui overflow-hidden flex">

            {/* Background Split & Glow */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-black/90 to-transparent z-10" />
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black/90 to-transparent z-10" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.25, scale: 1 }}
                    className="absolute top-1/2 left-[10%] -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] -z-10"
                    style={{ backgroundColor: player.aura.color }}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.25, scale: 1 }}
                    className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] -z-10"
                    style={{ backgroundColor: opponent.aura.color }}
                />
            </div>

            {/* Garis Diagonal Pemisah */}
            <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute top-0 bottom-0 left-1/2 w-64 bg-gradient-to-r from-transparent via-brand-orange/10 to-transparent -translate-x-1/2 -skew-x-[15deg] z-20"
            >
                <div className="absolute inset-y-0 left-1/2 w-px bg-brand-orange/50 shadow-[0_0_20px_#FF6A00]" />
            </motion.div>

            {/* KIRI: Player */}
            <div className="relative w-1/2 h-full flex flex-col justify-end items-center z-30 pb-10">
                {renderArt(player, 'left')}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute bottom-20 left-12 text-left"
                >
                    <div className="text-white/50 font-mono text-sm tracking-widest mb-1">PLAYER 1</div>
                    <h2 className="font-display font-black italic text-6xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 drop-shadow-lg">
                        {player.name}
                    </h2>
                    <div className="mt-3 text-sm font-bold bg-black/60 border border-white/20 inline-block px-4 py-1.5 [clip-path:polygon(8px_0,100%_0,calc(100%-8px)_100%,0_100%)]" style={{ color: player.aura.color, borderColor: player.aura.color }}>
                        {player.className}
                    </div>
                </motion.div>
            </div>

            {/* KANAN: Opponent */}
            <div className="relative w-1/2 h-full flex flex-col justify-end items-center z-30 pb-10">
                {renderArt(opponent, 'right')}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute bottom-20 right-12 text-right"
                >
                    <div className="text-white/50 font-mono text-sm tracking-widest mb-1">PLAYER 2</div>
                    <h2 className="font-display font-black italic text-6xl tracking-wider text-transparent bg-clip-text bg-gradient-to-l from-white to-white/50 drop-shadow-lg">
                        {opponent.name}
                    </h2>
                    <div className="mt-3 text-sm font-bold bg-black/60 border border-white/20 inline-block px-4 py-1.5 [clip-path:polygon(8px_0,100%_0,calc(100%-8px)_100%,0_100%)]" style={{ color: opponent.aura.color, borderColor: opponent.aura.color }}>
                        {opponent.className}
                    </div>
                </motion.div>
            </div>

            {/* TENGAH: Logo VS */}
            <motion.div
                initial={{ scale: 5, opacity: 0, rotate: -30 }}
                animate={{ scale: 1, opacity: 1, rotate: -10 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
            >
                <div className="font-display font-black italic text-[180px] text-transparent bg-clip-text bg-gradient-to-b from-white to-brand-orange drop-shadow-[0_10px_40px_rgba(255,106,0,0.6)] leading-none text-stroke-dark">
                    VS
                </div>
            </motion.div>

            {/* ATAS: Nama Stage */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-black/80 border border-brand-orange/50 px-10 py-2 [clip-path:polygon(16px_0,100%_0,calc(100%-16px)_100%,0_100%)] shadow-[0_0_20px_rgba(255,106,0,0.2)]"
            >
                <span className="text-white/50 font-display tracking-widest text-sm">STAGE: </span>
                <span className="text-brand-orange font-display font-black tracking-widest text-xl">{stage.name}</span>
            </motion.div>

            {/* BAWAH: Instruksi Skip */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 1] }} // Efek kedip
                transition={{ delay: 0.8, duration: 1.5, repeat: Infinity }}
                className="absolute bottom-4 w-full text-center z-40 text-xs text-white/40 font-mono tracking-widest"
            >
                PRESS ANY KEY TO CONTINUE
            </motion.div>

        </div>
    );
}