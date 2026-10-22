// src/components/screens/BattleScreen.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { BattleEngine, FighterConfig } from "@/engine/BattleEngine";
import { Fighter } from "./SelectCharacterScreen";
import { useGameStore } from "@/store/gameStore";

interface Props {
    player: Fighter;
    opponent: Fighter;
    stageId: string;
    onEnd: () => void;
}

const STAGE_BG_MAP: Record<string, string> = {
    lapangan: "/assets/stages/wikrama.png",
    lab: "/assets/stages/lab.png",
    kelas: "/assets/stages/kelas.png",
    rooftop: "/assets/stages/rooftop.png",
};

export default function BattleScreen({ player, opponent, stageId, onEnd }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<BattleEngine | null>(null);
    const [snap, setSnap] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const difficulty = useGameStore((s) => s.difficulty) || "normal";
    const mode = useGameStore((s) => s.mode);

    // Shortcut ESC untuk keluar dari battle dengan cepat
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.code === "Escape") {
                onEnd();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onEnd]);

    useEffect(() => {
        let isCancelled = false;

        if (engineRef.current) {
            engineRef.current.stop();
            engineRef.current = null;
        }

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
            const targetStageSrc = STAGE_BG_MAP[stageId] || "/assets/stages/wikrama.png";
            let bg = await loadImg(targetStageSrc);
            if (bg.naturalWidth === 0) bg = await loadImg("/assets/stages/wikrama.png");
            if (bg.naturalWidth === 0) bg = await loadImg("/assets/stages/wikrama.jpeg");

            const [p1Poses, p2Poses, projectile, explosion] = await Promise.all([
                loadFighterPoses(player.id),
                loadFighterPoses(opponent.id),
                loadImg("/assets/vfx/projectile.png"),
                loadImg("/assets/vfx/explosion.png"),
            ]);

            if (isCancelled || !canvasRef.current) return;

            const assets = { bg, p1Poses, p2Poses, projectile, explosion };

            const p1Config: FighterConfig = {
                id: player.id,
                name: player.name,
                auraColor: player.aura?.color || "#FF6A00",
                hp: player.stats?.hp || 1000,
                speed: player.stats?.speed || 1.0,
                damage: player.stats?.damage || 1.0,
            };

            const p2Config: FighterConfig = {
                id: opponent.id,
                name: opponent.name,
                auraColor: opponent.aura?.color || "#2F8CFF",
                hp: opponent.stats?.hp || 1000,
                speed: opponent.stats?.speed || 1.0,
                damage: opponent.stats?.damage || 1.0,
            };

            const engine = new BattleEngine(
                canvasRef.current,
                assets,
                p1Config,
                p2Config,
                (newSnap) => {
                    if (!isCancelled) {
                        setSnap(newSnap);
                    }
                },
                { difficulty, mode }
            );

            engineRef.current = engine;
            engine.start();
            setIsLoading(false);
        };

        loadAssets();

        return () => {
            isCancelled = true;
            if (engineRef.current) {
                engineRef.current.stop();
                engineRef.current = null;
            }
        };
    }, [player.id, opponent.id, stageId, difficulty, mode]);

    const p1Color = player.aura?.color || "#FF6A00";
    const p2Color = opponent.aura?.color || "#2F8CFF";

    const p1Max = snap?.p1MaxHp || 1000;
    const p2Max = snap?.p2MaxHp || 1000;
    const p1HpPct = snap ? Math.max(0, Math.min(100, (snap.p1.hp / p1Max) * 100)) : 100;
    const p2HpPct = snap ? Math.max(0, Math.min(100, (snap.p2.hp / p2Max) * 100)) : 100;

    const p1LowHp = p1HpPct > 0 && p1HpPct <= 25;
    const p2LowHp = p2HpPct > 0 && p2HpPct <= 25;

    const renderRoundPips = (wins: number, activeColor: string, align: "left" | "right") => (
        <div className={`flex items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
            {[1, 2].map((i) => {
                const active = i <= wins;
                return (
                    <div
                        key={i}
                        className="w-5 h-2.5 [clip-path:polygon(4px_0,100%_0,calc(100%-4px)_100%,0_100%)] transition-all duration-300"
                        style={{
                            backgroundColor: active ? activeColor : "rgba(255,255,255,0.12)",
                            boxShadow: active ? `0 0 10px ${activeColor}` : "none",
                            border: active ? "1px solid #FFFFFF" : "1px solid rgba(255,255,255,0.2)",
                        }}
                    />
                );
            })}
        </div>
    );

    const renderJumpPips = (jumpsLeft: number, maxJumps = 3, color: string, align: "left" | "right") => (
        <div className={`flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
            <span className="text-[9px] font-mono text-white/50 tracking-widest uppercase mr-1">AIR</span>
            {Array.from({ length: maxJumps }).map((_, idx) => {
                const active = idx < jumpsLeft;
                return (
                    <span
                        key={idx}
                        className="w-2.5 h-1.5 rounded-xs transition-all duration-150"
                        style={{
                            backgroundColor: active ? color : "rgba(255,255,255,0.12)",
                        }}
                    />
                );
            })}
        </div>
    );

    const renderPortrait = (fighter: Fighter, accentColor: string, side: "left" | "right", isHit: boolean) => (
        <div
            className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 p-[2px] [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)] transition-transform duration-100 ${isHit ? "scale-95 brightness-150" : "scale-100"
                }`}
            style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, rgba(255,255,255,0.25) 100%)`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.75)`,
            }}
        >
            <div className="relative w-full h-full bg-[#0A0A0D] [clip-path:polygon(11px_0,100%_0,100%_calc(100%-11px),calc(100%-11px)_100%,0_100%,0_11px)] overflow-hidden flex items-center justify-center">
                {/* Glow Aura Belakang */}
                <div
                    className="absolute inset-0 opacity-35"
                    style={{
                        background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 75%)`,
                    }}
                />
                <img
                    src={fighter.artSrc || "/assets/characters/char_1/ridho.png"}
                    alt={fighter.name}
                    className={`w-full h-full object-cover object-top scale-125 translate-y-2 ${side === "left" ? "scale-x-[-1.25]" : ""
                        }`}
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
                {/* Badge Class Kecil di Bawah Portrait */}
                <div className="absolute bottom-0 inset-x-0 bg-black/85 border-t border-white/15 py-0.5 text-center">
                    <span
                        className="font-mono font-bold text-[8px] md:text-[9px] tracking-widest uppercase block leading-none"
                        style={{ color: accentColor }}
                    >
                        {fighter.className || "FIGHTER"}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#0A0A0D] overflow-hidden z-50 select-none font-sans">
            {/* Fullscreen Responsive Canvas */}
            <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="absolute inset-0 w-full h-full object-fill"
            />

            {/* Vignette Tipis di Pinggir Layar agar HUD Lebih Kontras */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_65%,rgba(0,0,0,0.55)_100%)]" />
            <div className="absolute top-0 inset-x-0 h-32 pointer-events-none bg-gradient-to-b from-black/75 via-black/30 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-28 pointer-events-none bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0D] z-50">
                    <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
                    <span className="text-brand-orange font-display font-black italic text-2xl tracking-[0.25em]">
                        PREPARING ARENA...
                    </span>
                </div>
            )}

            {/* HUD UI */}
            {snap && !isLoading && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between px-4 py-3 md:px-8 md:py-4">
                    {/* ==========================================
                        1. TOP HUD (PORTRAIT + HP BARS + TIMER)
                       ========================================== */}
                    <div className="relative w-full max-w-[1440px] mx-auto flex items-start justify-between gap-2 md:gap-4">
                        {/* --- PLAYER 1 MODULE (KIRI) --- */}
                        <div className="flex-1 flex items-start gap-2.5 md:gap-3.5 min-w-0">
                            {renderPortrait(player, p1Color, "left", snap.p1.state === "HITSTUN")}

                            <div className="flex-1 flex flex-col min-w-0 pt-0.5">
                                {/* Baris Nama, Move Tag, & Win Pips */}
                                <div className="flex items-end justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="px-1.5 py-0.5 bg-brand-orange text-black font-display font-black text-[9px] tracking-widest [clip-path:polygon(0_0,100%_0,calc(100%-4px)_100%,0_100%)]">
                                            P1
                                        </span>
                                        <h2 className="font-display font-black italic text-lg md:text-2xl text-white tracking-wider truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                            {player.name}
                                        </h2>
                                        {renderRoundPips(snap.p1Rounds, p1Color, "left")}
                                        {snap.p1.moveLabel && (
                                            <span className="hidden sm:inline-block bg-white text-black font-display font-black italic text-[10px] px-2 py-0.5 tracking-wider [clip-path:polygon(6px_0,100%_0,calc(100%-6px)_100%,0_100%)]">
                                                {snap.p1.moveLabel}
                                            </span>
                                        )}
                                    </div>

                                    <div className="font-mono font-bold text-xs md:text-sm tracking-wider text-white/90 shrink-0">
                                        <span style={{ color: p1LowHp ? "#FF3B3B" : "#FFFFFF" }}>
                                            {Math.max(0, Math.ceil(snap.p1.hp))}
                                        </span>
                                        <span className="text-white/40 text-[11px]"> / {p1Max}</span>
                                    </div>
                                </div>

                                {/* Outer Frame HP Bar P1 (Memberi border utuh pada sudut miring) */}
                                <div
                                    className="w-full h-7 md:h-8 p-[2px] [clip-path:polygon(0_0,100%_0,calc(100%-18px)_100%,0_100%)] shadow-[0_6px_20px_rgba(0,0,0,0.75)]"
                                    style={{
                                        background: p1LowHp
                                            ? "linear-gradient(90deg, #FF3B3B, #FF6A00)"
                                            : "linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0.15))",
                                    }}
                                >
                                    <div className="relative w-full h-full bg-[#0A0A0D]/95 [clip-path:polygon(0_0,100%_0,calc(100%-17px)_100%,0_100%)] overflow-hidden">
                                        {/* Background Grid Pattern */}
                                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:10%_100%]" />

                                        {/* Delayed Damage Bar (Putih/Merah) */}
                                        <div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-rose-400 transition-[width] duration-500 ease-out will-change-[width]"
                                            style={{ width: `${p1HpPct}%` }}
                                        />

                                        {/* Main HP Fill */}
                                        <div
                                            className="absolute inset-y-0 left-0 transition-[width] duration-75 ease-linear border-r-2 border-white will-change-[width]"
                                            style={{
                                                width: `${p1HpPct}%`,
                                                background: p1LowHp
                                                    ? "linear-gradient(90deg, #DC2626 0%, #FF6A00 100%)"
                                                    : `linear-gradient(90deg, ${p1Color} 0%, #FFB020 100%)`,
                                            }}
                                        >
                                            {/* Top Glossy Highlight */}
                                            <div className="w-full h-[42%] bg-gradient-to-b from-white/35 to-transparent" />
                                        </div>

                                        {/* Garis Segmen per 10% */}
                                        <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                                            {Array.from({ length: 9 }).map((_, idx) => (
                                                <div key={idx} className="w-[1px] h-full bg-black/45" />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Sub-Bar Info: Air Jumps & Status */}
                                <div className="flex items-center justify-between pr-5 mt-1">
                                    {renderJumpPips(snap.p1.jumpsLeft ?? 3, snap.p1.maxJumps ?? 3, p1Color, "left")}
                                    <span className="text-[10px] font-mono text-white/50 tracking-widest">
                                        SPD {(player.stats?.speed || 1).toFixed(2)}x · ATK {(player.stats?.damage || 1).toFixed(2)}x
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* --- CENTER TACTICAL TIMER MODULE --- */}
                        <div className="shrink-0 flex flex-col items-center">
                            <div className="relative p-[2px] bg-gradient-to-b from-brand-orange/80 to-white/15 [clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,14px_100%)] shadow-[0_8px_25px_rgba(0,0,0,0.85)]">
                                <div className="bg-[#0E0E14]/95 px-6 md:px-8 pt-1 pb-2 [clip-path:polygon(0_0,100%_0,calc(100%-13px)_100%,13px_100%)] flex flex-col items-center min-w-[116px] md:min-w-[136px]">
                                    <span className="font-mono font-bold text-[9px] md:text-[10px] tracking-[0.25em] text-brand-amber uppercase">
                                        {snap.isTraining ? "FREE PRACTICE" : `ROUND 0${snap.round}`}
                                    </span>
                                    <div
                                        className={`font-display font-black italic text-4xl md:text-5xl leading-none tracking-tight mt-0.5 ${!snap.isTraining && snap.timer <= 10
                                                ? "text-red-500 animate-pulse"
                                                : "text-white"
                                            }`}
                                    >
                                        {snap.isTraining ? "∞" : String(Math.max(0, Math.ceil(snap.timer))).padStart(2, "0")}
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Exit Terintegrasi Rapi di Bawah Timer */}
                            <button
                                onClick={onEnd}
                                className="mt-1.5 pointer-events-auto group flex items-center gap-1.5 bg-black/80 hover:bg-red-600/90 border border-white/20 hover:border-red-400 px-3 py-0.5 [clip-path:polygon(6px_0,100%_0,calc(100%-6px)_100%,0_100%)] transition-all duration-150"
                                title="Return to Lobby (ESC)"
                            >
                                <span className="text-[9px] font-mono font-bold text-white/60 group-hover:text-white tracking-widest">
                                    [ESC] EXIT
                                </span>
                            </button>
                        </div>

                        {/* --- PLAYER 2 MODULE (KANAN) --- */}
                        <div className="flex-1 flex items-start gap-2.5 md:gap-3.5 min-w-0 flex-row-reverse">
                            {renderPortrait(opponent, p2Color, "right", snap.p2.state === "HITSTUN")}

                            <div className="flex-1 flex flex-col min-w-0 pt-0.5">
                                {/* Baris Nama, Move Tag, & Win Pips */}
                                <div className="flex items-end justify-between gap-2 mb-1.5 flex-row-reverse">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-row-reverse">
                                        <span
                                            className="px-1.5 py-0.5 text-black font-display font-black text-[9px] tracking-widest [clip-path:polygon(4px_0,100%_0,100%_100%,0_100%)]"
                                            style={{ backgroundColor: p2Color }}
                                        >
                                            {snap.isTraining ? "DUMMY" : "CPU"}
                                        </span>
                                        <h2 className="font-display font-black italic text-lg md:text-2xl text-white tracking-wider truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                            {opponent.name}
                                        </h2>
                                        {renderRoundPips(snap.p2Rounds, p2Color, "right")}
                                        {snap.p2.moveLabel && (
                                            <span className="hidden sm:inline-block bg-white text-black font-display font-black italic text-[10px] px-2 py-0.5 tracking-wider [clip-path:polygon(6px_0,100%_0,calc(100%-6px)_100%,0_100%)]">
                                                {snap.p2.moveLabel}
                                            </span>
                                        )}
                                    </div>

                                    <div className="font-mono font-bold text-xs md:text-sm tracking-wider text-white/90 shrink-0">
                                        <span style={{ color: p2LowHp ? "#FF3B3B" : "#FFFFFF" }}>
                                            {Math.max(0, Math.ceil(snap.p2.hp))}
                                        </span>
                                        <span className="text-white/40 text-[11px]"> / {p2Max}</span>
                                    </div>
                                </div>

                                {/* Outer Frame HP Bar P2 */}
                                <div
                                    className="w-full h-7 md:h-8 p-[2px] [clip-path:polygon(18px_0,100%_0,100%_100%,0_100%)] shadow-[0_6px_20px_rgba(0,0,0,0.75)]"
                                    style={{
                                        background: p2LowHp
                                            ? "linear-gradient(270deg, #FF3B3B, #FF6A00)"
                                            : "linear-gradient(270deg, rgba(255,255,255,0.45), rgba(255,255,255,0.15))",
                                    }}
                                >
                                    <div className="relative w-full h-full bg-[#0A0A0D]/95 [clip-path:polygon(17px_0,100%_0,100%_100%,0_100%)] overflow-hidden flex justify-end">
                                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:10%_100%]" />

                                        {/* Delayed Damage Bar P2 */}
                                        <div
                                            className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-600 to-rose-400 transition-[width] duration-500 ease-out will-change-[width]"
                                            style={{ width: `${p2HpPct}%` }}
                                        />

                                        {/* Main HP Fill P2 */}
                                        <div
                                            className="absolute inset-y-0 right-0 transition-[width] duration-75 ease-linear border-l-2 border-white will-change-[width]"
                                            style={{
                                                width: `${p2HpPct}%`,
                                                background: p2LowHp
                                                    ? "linear-gradient(270deg, #DC2626 0%, #FF6A00 100%)"
                                                    : `linear-gradient(270deg, ${p2Color} 0%, #38BDF8 100%)`,
                                            }}
                                        >
                                            <div className="w-full h-[42%] bg-gradient-to-b from-white/35 to-transparent" />
                                        </div>

                                        {/* Garis Segmen per 10% */}
                                        <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                                            {Array.from({ length: 9 }).map((_, idx) => (
                                                <div key={idx} className="w-[1px] h-full bg-black/45" />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Sub-Bar Info P2 */}
                                <div className="flex items-center justify-between pl-5 mt-1 flex-row-reverse">
                                    {renderJumpPips(snap.p2.jumpsLeft ?? 3, snap.p2.maxJumps ?? 3, p2Color, "right")}
                                    <span className="text-[10px] font-mono text-white/50 tracking-widest uppercase">
                                        DIFF: {difficulty}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ==========================================
                        2. CENTER OVERLAYS (ANNOUNCER & COMBO)
                       ========================================== */}
                    {snap.gameState === "INTRO" && snap.announceText && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                            <div className="relative flex flex-col items-center">
                                <div className="h-[2px] w-80 bg-gradient-to-r from-transparent via-brand-orange to-transparent mb-2" />
                                <h1 className="font-display font-black italic text-7xl md:text-9xl text-white tracking-wider drop-shadow-[0_10px_35px_rgba(255,106,0,0.85)]">
                                    {snap.announceText}
                                </h1>
                                <div className="h-[2px] w-80 bg-gradient-to-r from-transparent via-brand-orange to-transparent mt-2" />
                            </div>
                        </div>
                    )}

                    {/* P1 COMBO COUNTER */}
                    {snap.p1.comboCount > 1 && snap.gameState === "FIGHTING" && (
                        <div className="absolute top-36 left-6 md:left-10 flex flex-col items-start">
                            <div className="flex items-baseline gap-2">
                                <span
                                    className="font-display font-black text-6xl md:text-7xl italic leading-none drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)]"
                                    style={{ color: p1Color }}
                                >
                                    {snap.p1.comboCount}
                                </span>
                                <span className="font-display font-black italic text-xl text-white tracking-widest">
                                    HITS
                                </span>
                            </div>
                            <div
                                className="bg-black/85 px-3 py-0.5 text-[10px] font-mono font-bold tracking-[0.25em] text-white uppercase border-l-4"
                                style={{ borderColor: p1Color }}
                            >
                                {snap.p1.comboCount >= 5 ? "UNSTOPPABLE STRING!" : "COMBO ACTIVE"}
                            </div>
                        </div>
                    )}

                    {/* P2 COMBO COUNTER */}
                    {snap.p2.comboCount > 1 && snap.gameState === "FIGHTING" && (
                        <div className="absolute top-36 right-6 md:right-10 flex flex-col items-end">
                            <div className="flex items-baseline gap-2">
                                <span
                                    className="font-display font-black text-6xl md:text-7xl italic leading-none drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)]"
                                    style={{ color: p2Color }}
                                >
                                    {snap.p2.comboCount}
                                </span>
                                <span className="font-display font-black italic text-xl text-white tracking-widest">
                                    HITS
                                </span>
                            </div>
                            <div
                                className="bg-black/85 px-3 py-0.5 text-[10px] font-mono font-bold tracking-[0.25em] text-white uppercase border-r-4"
                                style={{ borderColor: p2Color }}
                            >
                                RIVAL COMBO
                            </div>
                        </div>
                    )}

                    {/* ==========================================
                        3. BOTTOM TACTICAL DOCK (OVERDRIVE & SKILL DECK)
                       ========================================== */}
                    <div className="w-full max-w-[1440px] mx-auto flex items-end justify-between gap-4 pb-0.5">
                        {/* P1 OVERDRIVE GAUGE */}
                        <div className="w-[26%] flex flex-col gap-1">
                            <div className="flex justify-between items-center px-1">
                                <span className="font-display font-black italic text-[11px] tracking-wider text-white">
                                    OVERDRIVE
                                </span>
                                <span
                                    className={`font-mono font-bold text-xs ${snap.p1.energy >= 100 ? "text-brand-amber" : "text-white/75"
                                        }`}
                                >
                                    {snap.p1.energy >= 100 ? "MAX READY [O]" : `${Math.floor(snap.p1.energy)}%`}
                                </span>
                            </div>

                            <div className="w-full h-4 p-[1.5px] bg-white/25 [clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)]">
                                <div className="relative w-full h-full bg-[#0A0A0D] [clip-path:polygon(0_0,100%_0,calc(100%-9px)_100%,0_100%)] overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 transition-[width] duration-75 ease-linear"
                                        style={{
                                            width: `${Math.min(100, snap.p1.energy)}%`,
                                            background:
                                                snap.p1.energy >= 100
                                                    ? "linear-gradient(90deg, #FF6A00, #FFB020, #FFFFFF)"
                                                    : `linear-gradient(90deg, ${p1Color}, #FFB020)`,
                                        }}
                                    />
                                    {/* 4 Segment Dividers */}
                                    <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                                        <div className="w-[1.5px] h-full bg-black/70" />
                                        <div className="w-[1.5px] h-full bg-black/70" />
                                        <div className="w-[1.5px] h-full bg-black/70" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CENTER TACTICAL ACTION DECK (KeyCap Cards) */}
                        <div className="hidden lg:flex items-center gap-1.5 bg-[#0E0E14]/90 border border-white/15 px-3 py-1.5 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_100%,0_100%)] shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                            {[
                                {
                                    key: "W / S",
                                    label: `JUMP (${snap.p1.jumpsLeft}) · FALL`,
                                    ready: (snap.p1.jumpsLeft ?? 0) > 0,
                                    cd: 0,
                                    accent: "border-white/30 text-white",
                                },
                                {
                                    key: "J",
                                    label: "LIGHT / AIR",
                                    ready: (snap.p1.attackCooldown ?? 0) <= 0,
                                    cd: snap.p1.attackCooldown ?? 0,
                                    accent: "border-brand-orange/60 text-brand-orange",
                                },
                                {
                                    key: "L",
                                    label: "SIGNATURE",
                                    ready: (snap.p1.sigCooldown ?? 0) <= 0,
                                    cd: snap.p1.sigCooldown ?? 0,
                                    accent: "border-brand-amber/70 text-brand-amber",
                                },
                                {
                                    key: "K / U",
                                    label: "DASH · DODGE",
                                    ready: (snap.p1.dodgeCooldown ?? 0) <= 0,
                                    cd: snap.p1.dodgeCooldown ?? 0,
                                    accent: "border-aura-cyan/60 text-aura-cyan",
                                },
                                {
                                    key: "O",
                                    label: "OVERDRIVE",
                                    ready: (snap.p1.energy ?? 0) >= 100,
                                    cd: 0,
                                    accent:
                                        (snap.p1.energy ?? 0) >= 100
                                            ? "border-brand-amber bg-brand-amber text-black font-black"
                                            : "border-white/10 text-white/30",
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 border bg-black/60 transition-colors ${item.cd > 0
                                            ? "border-red-500/50 text-red-400 bg-red-950/30"
                                            : item.accent
                                        }`}
                                >
                                    <span className="px-1.5 py-0.5 bg-white/10 font-mono font-bold text-[10px] leading-none">
                                        {item.key}
                                    </span>
                                    <span className="font-mono text-[10px] tracking-wider uppercase whitespace-nowrap">
                                        {item.cd > 0 ? `${item.cd.toFixed(1)}s` : item.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* P2 OVERDRIVE GAUGE */}
                        <div className="w-[26%] flex flex-col gap-1">
                            <div className="flex justify-between items-center px-1 flex-row-reverse">
                                <span className="font-display font-black italic text-[11px] tracking-wider text-white">
                                    OVERDRIVE
                                </span>
                                <span
                                    className={`font-mono font-bold text-xs ${snap.p2.energy >= 100 ? "text-brand-amber" : "text-white/75"
                                        }`}
                                >
                                    {snap.p2.energy >= 100 ? "MAX READY" : `${Math.floor(snap.p2.energy)}%`}
                                </span>
                            </div>

                            <div className="w-full h-4 p-[1.5px] bg-white/25 [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%)]">
                                <div className="relative w-full h-full bg-[#0A0A0D] [clip-path:polygon(9px_0,100%_0,100%_100%,0_100%)] overflow-hidden flex justify-end">
                                    <div
                                        className="absolute inset-y-0 right-0 transition-[width] duration-75 ease-linear"
                                        style={{
                                            width: `${Math.min(100, snap.p2.energy)}%`,
                                            background:
                                                snap.p2.energy >= 100
                                                    ? "linear-gradient(270deg, #2F8CFF, #38BDF8, #FFFFFF)"
                                                    : `linear-gradient(270deg, ${p2Color}, #38BDF8)`,
                                        }}
                                    />
                                    <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                                        <div className="w-[1.5px] h-full bg-black/70" />
                                        <div className="w-[1.5px] h-full bg-black/70" />
                                        <div className="w-[1.5px] h-full bg-black/70" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ==========================================
                        4. K.O. & VICTORY CINEMATIC OVERLAY
                       ========================================== */}
                    {(snap.gameState === "KO" || snap.gameState === "GAMEOVER") && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 backdrop-blur-[2px]">
                            <div className="relative flex flex-col items-center">
                                <span className="font-mono text-xs tracking-[0.4em] text-brand-amber uppercase mb-2">
                                    {snap.gameState === "GAMEOVER" ? "MATCH COMPLETED" : `ROUND ${snap.round} FINISHED`}
                                </span>

                                <h1 className="font-display font-black text-8xl md:text-[140px] italic text-transparent bg-clip-text bg-gradient-to-b from-white via-brand-amber to-brand-orange leading-none drop-shadow-[0_10px_40px_rgba(255,106,0,0.8)]">
                                    K.O.
                                </h1>

                                <div className="mt-6 bg-[#14141A] border border-brand-orange/50 px-10 py-3 [clip-path:polygon(16px_0,100%_0,calc(100%-16px)_100%,0_100%)] shadow-[0_0_30px_rgba(255,106,0,0.25)]">
                                    <p className="text-white font-display font-black italic text-2xl md:text-4xl tracking-[0.15em]">
                                        {snap.winnerSlot === "P1"
                                            ? `${player.name} TAKES THE WIN!`
                                            : `${opponent.name} TAKES THE WIN!`}
                                    </p>
                                </div>

                                {snap.gameState === "GAMEOVER" && (
                                    <button
                                        onClick={onEnd}
                                        className="mt-10 pointer-events-auto bg-gradient-to-r from-brand-orange to-brand-amber text-black font-display font-black italic text-lg md:text-xl px-12 py-3.5 [clip-path:polygon(14px_0,100%_0,calc(100%-14px)_100%,0_100%)] hover:scale-105 transition-transform shadow-[0_0_25px_rgba(255,106,0,0.6)]"
                                    >
                                        RETURN TO LOBBY
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}