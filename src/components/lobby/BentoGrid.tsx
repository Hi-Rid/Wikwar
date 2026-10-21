"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { soundManager } from "@/engine/SoundManager";
import { MenuTile } from "./MenuTile";

type TileId = "quickmatch" | "arcade" | "training" | "howtoplay" | "roster" | "settings";

const NEIGHBOR_MAP: Record<TileId, { up?: TileId; down?: TileId; left?: TileId; right?: TileId }> = {
    quickmatch: { right: "arcade", down: "training" },
    arcade: { left: "quickmatch", down: "howtoplay" },
    training: { up: "quickmatch", right: "howtoplay", down: "roster" },
    howtoplay: { up: "arcade", left: "training", down: "settings" },
    roster: { up: "training", right: "settings" },
    settings: { up: "howtoplay", left: "roster" },
};

const TILE_CLASSES: Record<TileId, string> = {
    quickmatch: "col-span-2 row-span-2",
    arcade: "col-span-1 row-span-2",
    training: "col-span-2 row-span-1",
    howtoplay: "col-span-1 row-span-1",
    roster: "col-span-2 row-span-1",
    settings: "col-span-1 row-span-1",
};

export function BentoGrid() {
    const [focusedId, setFocusedId] = useState<TileId>("quickmatch");
    const { setScreen, setMode, setDifficulty } = useGameStore();
    const [showDiffPicker, setShowDiffPicker] = useState(false);
    const [selectedDiff, setSelectedDiff] = useState<"easy" | "normal" | "hard" | "gelo">("normal");

    const handleActivate = useCallback(() => {
        soundManager.play("ui_select");
        if (focusedId === "arcade" || focusedId === "quickmatch") {
            if (!showDiffPicker) {
                setShowDiffPicker(true);
                return;
            }
            soundManager.play("ui_start");
            setMode(focusedId === "arcade" ? "arcade" : "quickMatch");
            setDifficulty(selectedDiff);
            setScreen("SELECT_CHARACTER");
        } else if (focusedId === "training") {
            setMode("training");
            setScreen("SELECT_CHARACTER");
        } else if (focusedId === "roster") {
            setScreen("SELECT_CHARACTER");
        } else if (focusedId === "howtoplay") {
            setScreen("HOW_TO_PLAY");
        } else if (focusedId === "settings") {
            setScreen("SETTINGS");
        }
    }, [focusedId, showDiffPicker, selectedDiff, setScreen, setMode, setDifficulty]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showDiffPicker) {
                const diffs: ("easy" | "normal" | "hard" | "gelo")[] = ["easy", "normal", "hard", "gelo"];
                const currentIdx = diffs.indexOf(selectedDiff);
                if (e.code === "KeyW" || e.code === "ArrowUp") {
                    soundManager.play("ui_move");
                    setSelectedDiff(diffs[Math.max(0, currentIdx - 1)]);
                }
                if (e.code === "KeyS" || e.code === "ArrowDown") {
                    soundManager.play("ui_move");
                    setSelectedDiff(diffs[Math.min(3, currentIdx + 1)]);
                }
                if (e.code === "Enter" || e.code === "KeyJ") handleActivate();
                if (e.code === "Escape" || e.code === "KeyK") {
                    soundManager.play("ui_back");
                    setShowDiffPicker(false);
                }
                return;
            }

            let nextId: TileId | undefined;
            const neighbors = NEIGHBOR_MAP[focusedId];

            if (e.code === "KeyW" || e.code === "ArrowUp") nextId = neighbors.up;
            if (e.code === "KeyS" || e.code === "ArrowDown") nextId = neighbors.down;
            if (e.code === "KeyA" || e.code === "ArrowLeft") nextId = neighbors.left;
            if (e.code === "KeyD" || e.code === "ArrowRight") nextId = neighbors.right;

            if (nextId) {
                soundManager.play("ui_move");
                setFocusedId(nextId);
            }

            if (e.code === "Enter" || e.code === "KeyJ") handleActivate();
            if (e.code === "Escape" || e.code === "KeyK") soundManager.play("ui_denied");
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusedId, showDiffPicker, selectedDiff, handleActivate]);

    return (
        // Ganti absolute jadi relative, pakai aspect-ratio biar responsif
        <div className="relative w-full max-w-[500px] xl:max-w-[550px] aspect-[5/4] z-20">
            <AnimatePresence mode="wait">
                {!showDiffPicker && (
                    <motion.div
                        key="menu-grid"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-3 grid-rows-4 gap-3 w-full h-full"
                    >
                        {(["quickmatch", "arcade", "training", "howtoplay", "roster", "settings"] as TileId[]).map((id, index) => (
                            <MenuTile
                                key={id}
                                id={id}
                                index={index}
                                className={TILE_CLASSES[id]}
                                isFocused={focusedId === id}
                                onFocus={() => { soundManager.play("ui_move"); setFocusedId(id); }}
                                onActivate={handleActivate}
                            />
                        ))}
                    </motion.div>
                )}

                {showDiffPicker && (
                    <motion.div
                        key="difficulty-picker"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-[#0A0A0D] border-2 border-brand-orange clip-bento p-6 flex flex-col justify-between shadow-[0_0_30px_rgba(255,106,0,0.2)]"
                    >
                        <div className="flex flex-col items-center">
                            <div className="bg-brand-orange/20 border border-brand-orange px-3 py-1 mb-2 clip-slant">
                                <span className="text-brand-orange font-bold text-[10px] tracking-[0.2em] uppercase">System Setup</span>
                            </div>
                            <h2 className="text-2xl font-display font-black text-white italic tracking-wider text-stroke-dark">
                                SELECT DIFFICULTY
                            </h2>
                        </div>
                        <div className="flex flex-col gap-2 relative z-10 w-full px-4">
                            {["easy", "normal", "hard", "gelo"].map((d) => {
                                const isSelected = selectedDiff === d;
                                return (
                                    <button
                                        key={d}
                                        onClick={() => { soundManager.play("ui_move"); setSelectedDiff(d as any); }}
                                        onDoubleClick={() => { handleActivate(); }}
                                        className={`relative flex items-center justify-between px-6 py-2 transition-all duration-200 clip-slant overflow-hidden group ${isSelected
                                                ? "bg-gradient-to-r from-brand-orange to-brand-amber text-[#0A0A0D] translate-x-2 shadow-[0_0_15px_rgba(255,106,0,0.6)]"
                                                : "bg-[#14141A] text-text-muted border border-text-muted/30 hover:border-brand-orange/50 hover:text-white"
                                            }`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shine-sweep_2s_ease-in-out_infinite]" />
                                        )}
                                        <span className={`font-display font-black italic tracking-wider text-lg ${isSelected ? "text-stroke-none" : "text-stroke-dark"}`}>
                                            {d.toUpperCase()}
                                        </span>
                                        <div className={`flex items-center gap-1 transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`}>
                                            <span className="w-2 h-2 bg-[#0A0A0D] clip-slant inline-block"></span>
                                            <span className="w-3 h-3 bg-[#0A0A0D] clip-slant inline-block"></span>
                                            <span className="w-4 h-4 bg-[#0A0A0D] clip-slant inline-block"></span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center border-t border-brand-orange/30 pt-3 px-2">
                            <button
                                onClick={() => { soundManager.play("ui_back"); setShowDiffPicker(false); }}
                                className="text-xs font-sans font-bold text-text-muted hover:text-white transition-colors"
                            >
                                [ESC] CANCEL
                            </button>
                            <button
                                onClick={() => handleActivate()}
                                className="text-xs font-sans font-bold text-brand-orange hover:text-brand-amber transition-colors flex items-center gap-1"
                            >
                                [ENTER] CONFIRM <span className="text-lg leading-none">›</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}