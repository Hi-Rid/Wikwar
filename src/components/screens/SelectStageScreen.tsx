// src/components/screens/SelectStageScreen.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export interface StageData {
    id: string;
    name: string;
    description: string;
    imageSrc: string;
}

interface Props {
    stages: StageData[];
    onConfirm: (id: string) => void;
    onBack: () => void;
    playSound?: (event: "move" | "select" | "back") => void;
}

export default function SelectStageScreen({ stages, onConfirm, onBack, playSound }: Props) {
    const [selectedIdx, setSelectedIdx] = useState(0);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const cols = 2;
            let nextIdx = selectedIdx;

            if (e.code === "KeyD" || e.code === "ArrowRight") {
                if ((selectedIdx + 1) % cols !== 0) nextIdx = selectedIdx + 1;
            } else if (e.code === "KeyA" || e.code === "ArrowLeft") {
                if (selectedIdx % cols !== 0) nextIdx = selectedIdx - 1;
            } else if (e.code === "KeyS" || e.code === "ArrowDown") {
                if (selectedIdx + cols < stages.length) nextIdx = selectedIdx + cols;
            } else if (e.code === "KeyW" || e.code === "ArrowUp") {
                if (selectedIdx - cols >= 0) nextIdx = selectedIdx - cols;
            } else if (e.code === "Enter" || e.code === "KeyJ") {
                const picked = stages[selectedIdx];
                if (picked) {
                    playSound?.("select");
                    onConfirm(picked.id);
                }
                return;
            } else if (e.code === "Escape" || e.code === "KeyK") {
                playSound?.("back");
                onBack();
                return;
            }

            if (nextIdx !== selectedIdx) {
                playSound?.("move");
                setSelectedIdx(nextIdx);
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [selectedIdx, stages, onConfirm, onBack, playSound]);

    return (
        <div className="fixed inset-0 bg-[#0A0A0D] text-white font-ui overflow-hidden flex flex-col">
            <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(255,106,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,106,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/10 blur-[100px] rounded-full" />
            </div>

            <header className="relative z-10 flex justify-between items-center px-8 py-6 shrink-0 border-b border-white/10 bg-black/40 backdrop-blur-md">
                <button onClick={onBack} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#14141A] border border-white/20 group-hover:border-brand-orange [clip-path:polygon(0_0,100%_0,calc(100%-8px)_100%,0_100%)]">
                        <span className="text-brand-orange">←</span>
                    </div>
                    <span className="font-display font-black italic tracking-widest text-lg">STAGE SELECT</span>
                </button>
                <div className="text-xs text-white/50 tracking-widest font-mono">
                    [A/D/W/S] NAVIGATE • [ENTER] CONFIRM • [ESC] BACK
                </div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
                <div className="text-center mb-8">
                    <h1 className="font-display font-black text-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-wider">
                        CHOOSE YOUR BATTLEGROUND
                    </h1>
                    <p className="text-white/50 text-sm mt-2">The arena is purely cosmetic. Fight with honor.</p>
                </div>

                <div className="grid grid-cols-2 gap-6 max-w-4xl w-full">
                    {stages.map((stage, idx) => {
                        const isFocused = selectedIdx === idx;
                        return (
                            <button
                                key={stage.id}
                                onClick={() => {
                                    playSound?.("move");
                                    setSelectedIdx(idx);
                                }}
                                onDoubleClick={() => {
                                    playSound?.("select");
                                    onConfirm(stage.id);
                                }}
                                className={`relative aspect-video bg-[#14141A] border-2 overflow-hidden outline-none transition-all duration-200 [clip-path:polygon(16px_0,100%_0,100%_calc(100%-16px),calc(100%-16px)_100%,0_100%,0_16px)] ${isFocused
                                        ? "border-brand-orange scale-[1.02] shadow-[0_0_30px_rgba(255,106,0,0.3)] z-10"
                                        : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                                    }`}
                            >
                                <img
                                    src={stage.imageSrc}
                                    alt={stage.name}
                                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isFocused ? "scale-105" : "scale-100"}`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%2314141A"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-family="sans-serif" font-size="20">IMAGE NOT FOUND</text></svg>';
                                    }}
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                <div className="absolute bottom-0 left-0 w-full p-5 text-left flex justify-between items-end">
                                    <div>
                                        <h2 className={`font-display font-black italic tracking-widest text-2xl transition-colors ${isFocused ? "text-brand-orange" : "text-white"}`}>
                                            {stage.name}
                                        </h2>
                                        <p className="text-white/70 text-xs font-sans mt-1">{stage.description}</p>
                                    </div>
                                    {isFocused && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-brand-orange text-black px-3 py-1 font-display font-black text-xs tracking-wider [clip-path:polygon(8px_0,100%_0,calc(100%-8px)_100%,0_100%)]"
                                        >
                                            SELECTED
                                        </motion.div>
                                    )}
                                </div>

                                {isFocused && (
                                    <>
                                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/50" />
                                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/50" />
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-10">
                    <button
                        onClick={() => {
                            const picked = stages[selectedIdx];
                            if (picked) {
                                playSound?.("select");
                                onConfirm(picked.id);
                            }
                        }}
                        className="px-16 py-4 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-display font-black italic text-xl tracking-widest [clip-path:polygon(16px_0,100%_0,calc(100%-16px)_100%,0_100%)] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,106,0,0.4)]"
                    >
                        FIGHT HERE
                    </button>
                </div>
            </main>
        </div>
    );
}