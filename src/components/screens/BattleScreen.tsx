// src/components/screens/BattleScreen.tsx (atau sesuai lokasi file BattleScreen.tsx lu)
"use client";

import React, { useEffect, useRef, useState } from "react";
import { BattleEngine } from "@/engine/BattleEngine";
import { Fighter } from "./SelectCharacterScreen";

interface Props {
    player: Fighter;
    opponent: Fighter;
    stageId: string;
    onEnd: () => void;
}

export default function BattleScreen({ player, opponent, stageId, onEnd }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<BattleEngine | null>(null);
    const [snap, setSnap] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!canvasRef.current) return;

        const loadImg = (src: string) =>
            new Promise<HTMLImageElement>((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
                img.onerror = () => resolve(img);
            });

        const loadFighterPoses = async (charId: string) => {
            const base = `/assets/characters/${charId}`;
            const fallbackBase = `/assets/characters/char_1`;

            let idle = await loadImg(`${base}/idle.png`);
            if (idle.naturalWidth === 0) idle = await loadImg(`${fallbackBase}/idle.png`);
            if (idle.naturalWidth === 0) idle = await loadImg(`${fallbackBase}/ridho.png`);

            let attack = await loadImg(`${base}/attack.png`);
            if (attack.naturalWidth === 0) attack = await loadImg(`${fallbackBase}/attack.png`);
            if (attack.naturalWidth === 0) attack = idle;

            let dash = await loadImg(`${base}/dash.png`);
            if (dash.naturalWidth === 0) dash = await loadImg(`${fallbackBase}/dash.png`);
            if (dash.naturalWidth === 0) dash = idle;

            let cast = await loadImg(`${base}/cast.png`);
            if (cast.naturalWidth === 0) cast = await loadImg(`${fallbackBase}/cast.png`);
            if (cast.naturalWidth === 0) cast = idle;

            return { idle, attack, dash, cast, guard: idle, damaged: idle, xray: attack };
        };

        const loadAssets = async () => {
            let bg = await loadImg("/assets/stages/wikrama.png");
            if (bg.naturalWidth === 0) bg = await loadImg("/assets/stages/wikrama.jpeg");

            const [p1Poses, p2Poses, projectile, explosion] = await Promise.all([
                loadFighterPoses(player.id),
                loadFighterPoses(opponent.id),
                loadImg("/assets/vfx/projectile.png"),
                loadImg("/assets/vfx/explosion.png"),
            ]);

            const assets = { bg, p1Poses, p2Poses, projectile, explosion };

            if (canvasRef.current) {
                const engine = new BattleEngine(
                    canvasRef.current,
                    assets,
                    player.id,
                    opponent.id,
                    (newSnap) => setSnap(newSnap)
                );
                engineRef.current = engine;
                engine.start();
                setIsLoading(false);
            }
        };

        loadAssets();
        return () => {
            engineRef.current?.stop();
        };
    }, [player, opponent]);

    const renderPips = (wins: number) => (
        <div className="flex gap-2">
            {[1, 2].map((i) => (
                <div
                    key={i}
                    className={`w-3.5 h-3.5 rotate-45 border-2 transition-colors duration-300 ${i <= wins
                            ? "bg-brand-orange border-brand-orange shadow-[0_0_10px_#FF6A00]"
                            : "bg-transparent border-white/30"
                        }`}
                />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black overflow-hidden z-50">
            {/* Fullscreen Responsive Canvas */}
            <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="absolute inset-0 w-full h-full object-fill"
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
                    <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
                    <span className="text-brand-orange font-display text-2xl animate-pulse tracking-widest">
                        LOADING BATTLE...
                    </span>
                </div>
            )}

            {/* HUD UI */}
            {snap && !isLoading && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between px-6 py-4 md:px-10 md:py-5">
                    {/* TOP BAR (HP & TIMER) */}
                    <div className="flex justify-between items-start w-full max-w-[1440px] mx-auto">
                        {/* PLAYER 1 (KIRI) */}
                        <div className="flex-1 flex flex-col items-start">
                            <div className="flex items-center gap-3 mb-1.5">
                                <div
                                    className="text-white font-display font-black text-xl md:text-2xl italic tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                                    style={{ color: player.aura?.color || "#FF6A00" }}
                                >
                                    {player.name}
                                </div>
                                {renderPips(snap.p1Rounds)}
                            </div>

                            {/* HP Bar P1 */}
                            <div className="w-full h-8 md:h-10 bg-black/80 border-2 border-white/30 [clip-path:polygon(0_0,100%_0,calc(100%-24px)_100%,0_100%)] overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                                <div
                                    className="absolute inset-0 bg-red-600 transition-all duration-500 ease-out"
                                    style={{ width: `${(snap.p1.hp / snap.maxHp) * 100}%` }}
                                />
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-brand-orange to-brand-amber transition-all duration-100 ease-linear border-r-4 border-white"
                                    style={{ width: `${(snap.p1.hp / snap.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* TIMER (TENGAH) */}
                        <div className="w-36 md:w-44 flex flex-col items-center justify-center mx-4 md:mx-6">
                            <div className="text-white font-display font-black text-6xl md:text-7xl italic leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                                {Math.ceil(snap.timer)}
                            </div>
                            <div className="text-brand-orange font-mono text-xs md:text-sm tracking-[0.25em] mt-1 bg-black/80 px-4 py-0.5 border border-brand-orange/60">
                                ROUND {snap.round}
                            </div>
                        </div>

                        {/* PLAYER 2 (KANAN) */}
                        <div className="flex-1 flex flex-col items-end">
                            <div className="flex items-center gap-3 mb-1.5 flex-row-reverse">
                                <div
                                    className="text-white font-display font-black text-xl md:text-2xl italic tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                                    style={{ color: opponent.aura?.color || "#22D36B" }}
                                >
                                    {opponent.name}
                                </div>
                                {renderPips(snap.p2Rounds)}
                            </div>

                            {/* HP Bar P2 */}
                            <div className="w-full h-8 md:h-10 bg-black/80 border-2 border-white/30 [clip-path:polygon(24px_0,100%_0,100%_100%,0_100%)] overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex justify-end">
                                <div
                                    className="absolute inset-y-0 right-0 bg-red-600 transition-all duration-500 ease-out"
                                    style={{ width: `${(snap.p2.hp / snap.maxHp) * 100}%` }}
                                />
                                <div
                                    className="absolute inset-y-0 right-0 bg-gradient-to-l from-brand-orange to-brand-amber transition-all duration-100 ease-linear border-l-4 border-white"
                                    style={{ width: `${(snap.p2.hp / snap.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM BAR (ENERGY & CONTROLS HINT) */}
                    <div className="flex flex-col gap-2 w-full max-w-[1440px] mx-auto pb-1">
                        <div className="flex justify-between items-end w-full">
                            {/* P1 Energy */}
                            <div className="w-[32%] h-4 bg-black/75 border border-brand-orange/40 [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)] relative overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-brand-orange shadow-[0_0_10px_#FF6A00] transition-all"
                                    style={{ width: `${snap.p1.energy}%` }}
                                />
                                <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/50" />
                            </div>

                            {/* Petunjuk Kontrol di Bawah (Tidak Menabrak Karakter) */}
                            <div className="bg-black/70 border border-white/15 px-4 py-1 text-[11px] md:text-xs font-mono text-white/80 tracking-wider text-center">
                                <span className="text-brand-orange font-bold">A/D</span> MOVE ·{" "}
                                <span className="text-brand-orange font-bold">W/S</span> JUMP/CROUCH ·{" "}
                                <span className="text-brand-orange font-bold">J</span> ATTACK ·{" "}
                                <span className="text-brand-orange font-bold">K</span> GUARD ·{" "}
                                <span className="text-brand-orange font-bold">L</span> SPECIAL ·{" "}
                                <span className="text-brand-orange font-bold">U</span> DASH
                            </div>

                            {/* P2 Energy */}
                            <div className="w-[32%] h-4 bg-black/75 border border-brand-orange/40 [clip-path:polygon(12px_0,100%_0,100%_100%,0_100%)] relative overflow-hidden flex justify-end">
                                <div
                                    className="absolute inset-y-0 right-0 bg-brand-orange shadow-[0_0_10px_#FF6A00] transition-all"
                                    style={{ width: `${snap.p2.energy}%` }}
                                />
                                <div className="absolute top-0 bottom-0 right-1/2 w-[2px] bg-white/50" />
                            </div>
                        </div>
                    </div>

                    {/* COMBO COUNTER (KIRI) */}
                    {snap.p1.comboCount > 0 && snap.gameState === "FIGHTING" && (
                        <div className="absolute top-1/3 left-10 flex flex-col items-start">
                            <span className="font-display font-black text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white to-brand-orange drop-shadow-[0_0_15px_rgba(255,106,0,0.8)] italic">
                                {snap.p1.comboCount}
                            </span>
                            <span className="text-brand-orange font-display font-bold text-lg tracking-widest uppercase">
                                Hits
                            </span>
                        </div>
                    )}

                    {/* K.O. OVERLAY */}
                    {(snap.gameState === "KO" || snap.gameState === "GAMEOVER") && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-50">
                            <h1 className="relative font-display font-black text-8xl md:text-[150px] italic text-transparent bg-clip-text bg-gradient-to-b from-white via-brand-orange to-red-700 drop-shadow-[0_0_50px_rgba(255,0,0,0.8)] leading-none animate-bounce">
                                K.O.
                            </h1>

                            <div className="relative mt-6 flex flex-col items-center gap-3">
                                <div className="h-[2px] w-64 bg-gradient-to-r from-transparent via-brand-orange to-transparent" />
                                <p className="text-white font-display font-bold text-3xl md:text-4xl tracking-[0.2em]">
                                    {snap.winner === player.id ? "YOU WIN" : "YOU LOSE"}
                                </p>
                                <div className="h-[2px] w-64 bg-gradient-to-r from-transparent via-brand-orange to-transparent" />
                            </div>

                            {snap.gameState === "GAMEOVER" && (
                                <button
                                    onClick={onEnd}
                                    className="relative mt-10 pointer-events-auto bg-brand-orange text-black font-display font-black text-lg px-10 py-3 hover:scale-105 transition-transform"
                                >
                                    CONTINUE
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* QUIT BUTTON (Dipindah ke kiri bawah tipis atau pojok atas tengah agar tidak menabrak bar HP P2) */}
            <button
                onClick={onEnd}
                className="absolute top-20 right-6 md:right-10 z-[60] bg-red-600/85 hover:bg-red-600 text-white px-5 py-1.5 font-display font-bold text-xs tracking-widest [clip-path:polygon(10px_0,100%_0,calc(100%-10px)_100%,0_100%)] backdrop-blur-md border border-red-400 transition-colors"
            >
                QUIT
            </button>
        </div>
    );
}