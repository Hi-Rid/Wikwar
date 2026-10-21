"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ════════════════════════════════════════════════════════════════════
   WIKWAR · SELECT CHARACTER
   Stack: React + Tailwind + framer-motion. Tanpa file CSS terpisah.
   Layar full-bleed: tidak ada stage tetap, tidak ada letterbox.
   Satuan desain: 1u = min(100vw / 1280, 100dvh / 720). Semua ukuran = N × u.
   Token yang dipakai (sudah ada di tema Tailwind lo):
     bg-bg-base, bg-bg-panel, text-text-main, text-text-muted,
     brand-orange, brand-amber, font-display, font-ui
   ════════════════════════════════════════════════════════════════════ */

/* ───────────────────────── types ───────────────────────── */

export interface Fighter {
    id: string;
    name: string;
    className: string;
    aura: { id: string; name: string; color: string };
    stats: { hp: number; speed: number; damage: number };
    skills: { id: string; type: "special" | "ultimate" | "passive"; name: string }[];
    quote: string;
    artSrc?: string;
    portraitSrc?: string;
    locked?: boolean;
}

export type SfxEvent = "move" | "select" | "back" | "start" | "denied";

interface Props {
    fighters: Fighter[];
    initialId?: string;
    onConfirm: (id: string) => void;
    onBack: () => void;
    playSound?: (event: SfxEvent) => void;
}

/* ───────────────────────── helpers ───────────────────────── */

const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** N satuan desain → nilai CSS. */
const U = (n: number) => `calc(var(--u) * ${n})`;
/** Garis tipis yang tidak pernah kurang dari 1px. */
const hair = (n = 1) => `max(1px, ${U(n)})`;
/** Warna aura dengan alpha. */
const mix = (pct: number, color = "var(--aura)") => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** Potongan sudut (chamfer): kiri-atas, kanan-atas, kanan-bawah, kiri-bawah. */
const chamfer = (tl: number, tr: number, br: number, bl: number) =>
    `polygon(${U(tl)} 0, calc(100% - ${U(tr)}) 0, 100% ${U(tr)}, 100% calc(100% - ${U(br)}), calc(100% - ${U(br)}) 100%, ${U(bl)} 100%, 0 calc(100% - ${U(bl)}), 0 ${U(tl)})`;

/** Jajar genjang "/" (sisi atas bergeser ke kanan). */
const slant = (n: number, side: "both" | "left" | "right" = "both") => {
    const l = side === "right" ? 0 : n;
    const r = side === "left" ? 0 : n;
    return `polygon(${U(l)} 0, 100% 0, calc(100% - ${U(r)}) 100%, 0 100%)`;
};

const vars = (o: Record<string, string>) => o as React.CSSProperties;
const auraVar = (color: string) => vars({ "--aura": color });

const onAura = (hex: string) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return "text-bg-base";
    const n = parseInt(m[1], 16);
    const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    return lum > 150 ? "text-bg-base" : "text-text-main";
};

const auraKey = (a: Fighter["aura"]) => `${a.id}|${a.color}`;
const EASE = [0.22, 1, 0.36, 1] as const;

/* ───────────────────────── icons (inline SVG, grid 24) ───────────────────────── */

const Svg = ({ children, solid }: { children: React.ReactNode; solid?: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        className="h-full w-full"
        fill={solid ? "currentColor" : "none"}
        stroke={solid ? "none" : "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const IconSearch = () => (
    <Svg>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
    </Svg>
);
const IconDice = () => (
    <Svg>
        <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
        <g fill="currentColor" stroke="none">
            <circle cx="8.5" cy="8.5" r="1.4" />
            <circle cx="15.5" cy="8.5" r="1.4" />
            <circle cx="12" cy="12" r="1.4" />
            <circle cx="8.5" cy="15.5" r="1.4" />
            <circle cx="15.5" cy="15.5" r="1.4" />
        </g>
    </Svg>
);
const IconBack = () => (
    <Svg>
        <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
    </Svg>
);
const IconChevrons = () => (
    <Svg>
        <path d="m5.5 6 6 6-6 6" />
        <path d="m12.5 6 6 6-6 6" />
    </Svg>
);
const IconHp = () => (
    <Svg solid>
        <path d="M12 20.6S3.4 15.2 3.4 9.1A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.6 2.2c0 6.1-8.6 11.5-8.6 11.5Z" />
    </Svg>
);
const IconSpeed = () => (
    <Svg solid>
        <path d="M13.5 2.5 5 13.6h5.6L9.6 21.5 19 10.2h-5.7z" />
    </Svg>
);
const IconDamage = () => (
    <Svg solid>
        <path d="m12 2 2.1 6.1L20.5 7l-3.4 5.3L21.5 17l-6.3-.6L12 22l-3.2-5.6L2.5 17l4.4-4.7L3.5 7l6.4 1.1z" />
    </Svg>
);
const IconLock = () => (
    <Svg>
        <rect x="5" y="10.5" width="14" height="10" rx="2" />
        <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Svg>
);
const IconDiamond = () => (
    <Svg solid>
        <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" />
    </Svg>
);
const SkillIcon = ({ type }: { type: Fighter["skills"][number]["type"] }) => {
    if (type === "special")
        return (
            <Svg solid>
                <circle cx="16" cy="8" r="4.5" />
                <path d="M3 21c1.4-6 4.6-9.2 9.4-10.8-2.4 3-3.4 6.2-3.6 10.8z" opacity=".75" />
            </Svg>
        );
    if (type === "ultimate")
        return (
            <Svg solid>
                <path d="m12 1.8 2.3 6.1 5.9-2.4-2.4 5.9 6.1 2.3-6.1 2.3 2.4 5.9-5.9-2.4L12 25l-2.3-6.1-5.9 2.4 2.4-5.9L0 13.1l6.1-2.3-2.4-5.9 5.9 2.4z" transform="translate(2.9 -1.2) scale(.76)" />
            </Svg>
        );
    return (
        <Svg solid>
            <path d="M12 2.5 20 5.8v5.6c0 5-3.3 8.7-8 10.3-4.7-1.6-8-5.3-8-10.3V5.8z" />
        </Svg>
    );
};

/* ───────────────────────── Plate: bentuk bersudut dengan outline ─────────────────────────
   clip-path ikut memotong border, jadi outline digambar sebagai dua lapis:
   lapis luar (warna outline) + lapis dalam (isi) yang di-inset. */

interface PlateProps {
    clip: string;
    edge: string;
    fill: string;
    edgeWidth?: number;
    shadow?: boolean | string;
    className?: string;
    contentClassName?: string;
    fillClassName?: string;
    style?: React.CSSProperties;
    fillStyle?: React.CSSProperties;
    fillChildren?: React.ReactNode;
    children?: React.ReactNode;
}

function Plate({
    clip,
    edge,
    fill,
    edgeWidth = 1.5,
    shadow = true,
    className,
    contentClassName,
    fillClassName,
    style,
    fillStyle,
    fillChildren,
    children,
}: PlateProps) {
    const filter =
        typeof shadow === "string" ? shadow : shadow ? `drop-shadow(0 ${U(3)} 0 rgba(0,0,0,.55))` : undefined;
    return (
        <div className={cn(!className?.includes("absolute") && "relative", className)} style={{ filter, ...style }}>
            <div aria-hidden className={cn("absolute inset-0 transition-colors duration-150", edge)} style={{ clipPath: clip }} />
            <div
                aria-hidden
                className={cn("absolute overflow-hidden", fill, fillClassName)}
                style={{ inset: hair(edgeWidth), clipPath: clip, ...fillStyle }}
            >
                {fillChildren}
            </div>
            <div className={cn("relative z-10 h-full w-full", contentClassName)}>{children}</div>
        </div>
    );
}

/* ───────────────────────── siluet placeholder (karakter tanpa art) ───────────────────────── */

function Silhouette({ variant }: { variant: "bust" | "full" }) {
    const gid = useId();
    const fillId = `${gid}-f`;
    return variant === "bust" ? (
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--aura)" stopOpacity=".95" />
                    <stop offset="1" stopColor="var(--aura)" stopOpacity=".35" />
                </linearGradient>
            </defs>
            <ellipse cx="50" cy="40" rx="19" ry="21" fill={`url(#${fillId})`} />
            <path d="M12 100c0-22 14-33 38-33s38 11 38 33z" fill={`url(#${fillId})`} />
        </svg>
    ) : (
        <svg viewBox="0 0 100 160" className="h-full max-h-full w-auto max-w-full" aria-hidden="true" style={{ filter: `drop-shadow(0 0 ${U(14)} ${mix(55)})` }}>
            <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--aura)" stopOpacity=".55" />
                    <stop offset="1" stopColor="var(--aura)" stopOpacity=".12" />
                </linearGradient>
            </defs>
            <g fill={`url(#${fillId})`} stroke="var(--aura)" strokeOpacity=".7" strokeWidth="1.2">
                <ellipse cx="50" cy="44" rx="30" ry="32" />
                <path d="M30 78h40l5 38H25z" />
                <path d="M30 80 16 112l8 4 12-24zM70 80l14 32-8 4-12-24z" />
                <path d="M32 116h15v32H32zM53 116h15v32H53z" />
                <path d="M28 148h22v8H24zM50 148h22l4 8H50z" />
            </g>
        </svg>
    );
}

/* ───────────────────────── komponen utama ───────────────────────── */

export default function SelectCharacterScreen({ fighters, initialId, onConfirm, onBack, playSound }: Props) {
    const reduce = !!useReducedMotion();

    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const randomTimer = useRef<number | null>(null);
    const toastTimer = useRef<number | null>(null);
    const lastFocus = useRef<HTMLElement | null>(null);
    const lastMoveAt = useRef(0);
    const sfxRef = useRef(playSound);
    sfxRef.current = playSound;
    const sfx = useCallback((e: SfxEvent) => sfxRef.current?.(e), []);

    const [selectedId, setSelectedId] = useState<string>(() => (fighters.find((f) => f.id === initialId) ?? fighters[0])?.id ?? "");
    const [query, setQuery] = useState("");
    const [auraFilter, setAuraFilter] = useState<string | null>(null);
    const [classFilter, setClassFilter] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [randomizing, setRandomizing] = useState(false);
    const [brokenArt, setBrokenArt] = useState<Record<string, boolean>>({});

    /* ── data turunan ── */
    const auras = useMemo(() => {
        const seen = new Map<string, Fighter["aura"]>();
        fighters.forEach((f) => {
            const k = auraKey(f.aura);
            if (!seen.has(k)) seen.set(k, f.aura);
        });
        return Array.from(seen.entries()).map(([key, aura]) => ({ key, aura }));
    }, [fighters]);

    const classes = useMemo(() => Array.from(new Set(fighters.map((f) => f.className))), [fighters]);

    const maxStats = useMemo(
        () => ({
            hp: Math.max(1, ...fighters.map((f) => f.stats.hp)),
            speed: Math.max(1, ...fighters.map((f) => f.stats.speed)),
            damage: Math.max(1, ...fighters.map((f) => f.stats.damage)),
        }),
        [fighters],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return fighters.filter(
            (f) =>
                (!q || f.name.toLowerCase().includes(q)) &&
                (!auraFilter || auraKey(f.aura) === auraFilter) &&
                (!classFilter || f.className === classFilter),
        );
    }, [fighters, query, auraFilter, classFilter]);

    const selected = fighters.find((f) => f.id === selectedId) ?? fighters[0];

    /* ── aksi ── */
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 1500);
    }, []);

    const confirm = useCallback(
        (f?: Fighter) => {
            if (!f) return;
            if (f.locked) {
                sfx("denied");
                showToast("Locked");
                return;
            }
            sfx("start");
            onConfirm(f.id);
        },
        [onConfirm, sfx, showToast],
    );

    const goBack = useCallback(() => {
        sfx("back");
        onBack();
    }, [onBack, sfx]);

    const focusCard = useCallback((id: string) => cardRefs.current[id]?.focus({ preventScroll: true }), []);

    const runRandom = useCallback(() => {
        if (randomizing || filtered.length === 0) return;
        const pool = filtered;
        const finalId = pool[Math.floor(Math.random() * pool.length)].id;
        const totalTicks = 10;
        let ticks = 0;
        setRandomizing(true);
        randomTimer.current = window.setInterval(() => {
            ticks += 1;
            if (ticks >= totalTicks) {
                if (randomTimer.current) window.clearInterval(randomTimer.current);
                randomTimer.current = null;
                setSelectedId(finalId);
                setRandomizing(false);
                focusCard(finalId);
                sfx("select");
                return;
            }
            setSelectedId(pool[Math.floor(Math.random() * pool.length)].id);
            sfx("move");
        }, 60);
    }, [randomizing, filtered, focusCard, sfx]);

    /* ── navigasi spasial: pindah fokus ke elemen terdekat pada arah tombol ── */
    const move = useCallback(
        (dir: "left" | "right" | "up" | "down") => {
            const root = rootRef.current;
            if (!root) return;
            const cur = document.activeElement as HTMLElement | null;
            if (!cur || !root.contains(cur) || !cur.hasAttribute("data-nav")) {
                if (selected) focusCard(selected.id);
                return;
            }
            const items = Array.from(root.querySelectorAll<HTMLElement>("[data-nav]")).filter(
                (el) => el !== cur && !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0,
            );
            const a = cur.getBoundingClientRect();
            const ax = a.left + a.width / 2;
            const ay = a.top + a.height / 2;
            let best: HTMLElement | null = null;
            let bestScore = Infinity;
            for (const el of items) {
                const r = el.getBoundingClientRect();
                const dx = r.left + r.width / 2 - ax;
                const dy = r.top + r.height / 2 - ay;
                const primary = dir === "right" ? dx : dir === "left" ? -dx : dir === "down" ? dy : -dy;
                const perp = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);
                if (primary <= 4) continue;
                const score = primary + perp * 2.2;
                if (score < bestScore) {
                    bestScore = score;
                    best = el;
                }
            }
            best?.focus({ preventScroll: true });
        },
        [focusCard, selected],
    );

    /* ── keyboard: A/D/W/S + panah, Enter/J, Esc/K, R, / ── */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const target = e.target as HTMLElement | null;

            if (target?.tagName === "INPUT") {
                if (e.code === "Escape" || e.code === "Enter") {
                    e.preventDefault();
                    if (e.code === "Escape" && query) {
                        setQuery("");
                        sfx("back");
                    }
                    (target as HTMLInputElement).blur();
                    if (selected) focusCard(selected.id);
                } else if (e.code === "ArrowDown" || e.code === "ArrowUp") {
                    e.preventDefault();
                    move(e.code === "ArrowDown" ? "down" : "up");
                }
                return;
            }

            switch (e.code) {
                case "Slash":
                    e.preventDefault();
                    searchRef.current?.focus();
                    return;
                case "Escape":
                case "KeyK":
                    e.preventDefault();
                    if (query) {
                        setQuery("");
                        sfx("back");
                    } else goBack();
                    return;
                case "KeyR":
                    e.preventDefault();
                    runRandom();
                    return;
                case "ArrowLeft":
                case "KeyA":
                    e.preventDefault();
                    move("left");
                    return;
                case "ArrowRight":
                case "KeyD":
                    e.preventDefault();
                    move("right");
                    return;
                case "ArrowUp":
                case "KeyW":
                    e.preventDefault();
                    move("up");
                    return;
                case "ArrowDown":
                case "KeyS":
                    e.preventDefault();
                    move("down");
                    return;
                case "Enter":
                case "KeyJ": {
                    e.preventDefault();
                    const cur = document.activeElement as HTMLElement | null;
                    if (cur && rootRef.current?.contains(cur) && cur.hasAttribute("data-nav")) cur.click();
                    else if (selected) focusCard(selected.id);
                    return;
                }
                default:
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [query, selected, move, goBack, runRandom, focusCard, sfx]);

    /* ── suara "move" setiap fokus pindah (keyboard, mouse, atau tab) ── */
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const onFocusIn = (e: FocusEvent) => {
            const el = e.target as HTMLElement;
            if (!el.hasAttribute?.("data-nav") || lastFocus.current === el) return;
            const first = lastFocus.current === null;
            lastFocus.current = el;
            const now = performance.now();
            if (first || now - lastMoveAt.current < 40) return;
            lastMoveAt.current = now;
            sfx("move");
        };
        root.addEventListener("focusin", onFocusIn);
        return () => root.removeEventListener("focusin", onFocusIn);
    }, [sfx]);

    /* ── fokus awal + pembersihan timer ── */
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            const id = (fighters.find((f) => f.id === initialId) ?? fighters[0])?.id;
            if (id) focusCard(id);
        });
        return () => {
            cancelAnimationFrame(raf);
            if (randomTimer.current) window.clearInterval(randomTimer.current);
            if (toastTimer.current) window.clearTimeout(toastTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── jaga pilihan tetap valid saat filter berubah ── */
    useEffect(() => {
        if (filtered.length > 0 && !filtered.some((f) => f.id === selectedId)) setSelectedId(filtered[0].id);
    }, [filtered, selectedId]);

    /* ── kartu terpilih selalu terlihat di strip ── */
    useEffect(() => {
        cardRefs.current[selectedId]?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: reduce ? "auto" : "smooth" });
    }, [selectedId, reduce]);

    if (!selected) return null;

    const hasArt = !!selected.artSrc && !brokenArt[selected.id];
    const nameSize = Math.max(26, Math.min(50, Math.floor(318 / (selected.name.length * 0.8))));
    const statRows = [
        { key: "hp", label: "HP", icon: <IconHp />, value: String(selected.stats.hp), pct: (selected.stats.hp / maxStats.hp) * 100 },
        { key: "speed", label: "SPEED", icon: <IconSpeed />, value: `${selected.stats.speed.toFixed(2)}x`, pct: (selected.stats.speed / maxStats.speed) * 100 },
        { key: "damage", label: "DAMAGE", icon: <IconDamage />, value: `${selected.stats.damage.toFixed(2)}x`, pct: (selected.stats.damage / maxStats.damage) * 100 },
    ];

    /* animasi masuk (sekali saat layar dibuka) */
    const enter = (x: number, y: number, delay: number) =>
        reduce
            ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.12 } }
            : { initial: { opacity: 0, x, y }, animate: { opacity: 1, x: 0, y: 0 }, transition: { duration: 0.45, delay, ease: EASE } };

    const swap = reduce
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
        : { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 24 }, transition: { duration: 0.18, ease: EASE } };

    const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: reduce ? 0.12 : 0.25 } };

    const textXs = "text-[max(11px,calc(var(--u)*11))]";
    const textSm = "text-[max(11px,calc(var(--u)*12))]";

    return (
        <div
            ref={rootRef}
            className="fixed inset-0 overflow-hidden bg-bg-base font-ui text-text-main select-none"
            style={vars({ "--u": "min(calc(100vw / 1280), calc(100dvh / 720))", "--aura": selected.aura.color })}
        >
            {/* ═══════════ BACKGROUND ═══════════ */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
                {/* cahaya dasar */}
                <div className="absolute inset-0" style={{ background: `radial-gradient(70% 80% at 40% 55%, ${mix(14)}, transparent 70%)` }} />

                {/* lantai grid perspektif */}
                <div
                    className="absolute inset-x-0 text-brand-orange"
                    style={{
                        bottom: 0,
                        height: U(260),
                        opacity: 0.22,
                        backgroundImage: `linear-gradient(to right, color-mix(in srgb, currentColor 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, currentColor 55%, transparent) 1px, transparent 1px)`,
                        backgroundSize: `${U(48)} ${U(48)}`,
                        transform: "perspective(700px) rotateX(62deg)",
                        transformOrigin: "50% 100%",
                        maskImage: "linear-gradient(to top, black, transparent 85%)",
                        WebkitMaskImage: "linear-gradient(to top, black, transparent 85%)",
                    }}
                />

                {/* band diagonal beraura (menyapu dari atas saat masuk, lalu crossfade antar karakter) */}
                <motion.div
                    className="absolute top-0 bottom-0 flex justify-center"
                    style={{ left: U(250), right: U(496) }}
                    initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 -100% 100% -100%)" }}
                    animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 -100% 0% -100%)" }}
                    transition={{ duration: reduce ? 0.12 : 0.55, delay: reduce ? 0 : 0.1, ease: EASE }}
                >
                    <AnimatePresence mode="sync" initial={false}>
                        <motion.div
                            key={selected.id}
                            className="absolute inset-y-0 flex items-stretch justify-center"
                            style={auraVar(selected.aura.color)}
                            {...fade}
                        >
                            <div className="relative h-full" style={{ width: U(340), transform: "skewX(-18deg)" }}>
                                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${mix(34)}, ${mix(14)} 62%, ${mix(4)})` }} />
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: `repeating-linear-gradient(135deg, transparent 0 ${U(9)}, ${mix(16)} ${U(9)} calc(${U(9)} + 1px))`,
                                    }}
                                />
                                <div className="absolute inset-y-0 left-0" style={{ width: hair(2), background: mix(75) }} />
                                <div className="absolute inset-y-0 right-0" style={{ width: hair(2), background: mix(75) }} />
                                {/* garis paralel di kanan band */}
                                <div className="absolute inset-y-0" style={{ left: `calc(100% + ${U(22)})`, width: U(10), background: mix(16) }} />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* watermark nama raksasa (outline) */}
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={selected.id}
                        className="absolute whitespace-nowrap font-display font-black italic uppercase leading-none"
                        style={{
                            ...auraVar(selected.aura.color),
                            left: U(-14),
                            top: U(80),
                            fontSize: U(200),
                            color: "transparent",
                            WebkitTextStroke: `${hair(2)} ${mix(26)}`,
                        }}
                        {...fade}
                    >
                        {selected.name}
                    </motion.div>
                </AnimatePresence>

                {/* vignette */}
                <div className="absolute inset-0" style={{ background: "radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(0,0,0,.65))" }} />
            </div>

            {/* ═══════════ TOP BAR ═══════════ */}
            <motion.header
                className="absolute z-20 flex items-center justify-between"
                style={{ left: U(32), right: U(32), top: U(24), height: U(48) }}
                {...enter(0, -22, 0)}
            >
                <button type="button" data-nav="back" onClick={goBack} aria-label="Back" className="group flex h-full items-stretch outline-none" style={{ gap: U(4) }}>
                    <Plate
                        className="h-full"
                        style={{ width: U(48) }}
                        clip={chamfer(10, 0, 0, 0)}
                        edge="bg-text-muted/50 group-hover:bg-brand-orange group-focus-visible:bg-brand-amber"
                        fill="bg-bg-panel"
                        contentClassName="grid place-items-center text-brand-amber"
                    >
                        <span style={{ width: U(22), height: U(22) }}>
                            <IconBack />
                        </span>
                    </Plate>
                    <Plate
                        className="h-full"
                        style={{ width: U(210) }}
                        clip={slant(14, "right")}
                        edge="bg-text-muted/50 group-hover:bg-brand-orange group-focus-visible:bg-brand-amber"
                        fill="bg-bg-panel"
                        contentClassName="flex items-center font-display font-black italic tracking-[0.14em]"
                    >
                        <span className="text-[max(12px,calc(var(--u)*17))]" style={{ paddingLeft: U(20) }}>
                            CHARACTER
                        </span>
                    </Plate>
                </button>

                <div className="flex items-center" style={{ gap: U(12) }}>
                    <div className="group h-full" style={{ width: U(250), height: U(44) }}>
                        <Plate
                            className="h-full w-full"
                            clip={slant(12, "left")}
                            edge="bg-text-muted/50 group-hover:bg-brand-orange/70 group-focus-within:bg-brand-orange"
                            fill="bg-bg-panel"
                            contentClassName="flex items-center"
                        >
                            <label className="flex h-full w-full items-center" style={{ gap: U(8), paddingLeft: U(24), paddingRight: U(12) }}>
                                <span className="shrink-0 text-text-muted" style={{ width: U(18), height: U(18) }}>
                                    <IconSearch />
                                </span>
                                <input
                                    ref={searchRef}
                                    data-nav="search"
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search fighter"
                                    aria-label="Search fighter"
                                    autoComplete="off"
                                    spellCheck={false}
                                    className={cn("min-w-0 flex-1 bg-transparent font-ui text-text-main outline-none placeholder:text-text-muted/60", "text-[max(12px,calc(var(--u)*14))]")}
                                />
                                <kbd className={cn("grid shrink-0 place-items-center border border-text-muted/40 font-ui font-bold text-text-muted", textXs)} style={{ width: U(20), height: U(20) }}>
                                    /
                                </kbd>
                            </label>
                        </Plate>
                    </div>

                    <button type="button" data-nav="random" onClick={runRandom} aria-label="Random fighter" className="group outline-none" style={{ width: U(136), height: U(44) }}>
                        <Plate
                            className="h-full w-full"
                            clip={slant(12, "left")}
                            edge="bg-text-muted/50 group-hover:bg-brand-amber group-focus-visible:bg-brand-amber"
                            fill="bg-bg-panel"
                            contentClassName="flex items-center justify-center"
                        >
                            <span className="flex items-center font-display font-black tracking-[0.1em] text-brand-amber" style={{ gap: U(8), paddingLeft: U(8) }}>
                                <span style={{ width: U(20), height: U(20) }}>
                                    <IconDice />
                                </span>
                                <span className="text-[max(11px,calc(var(--u)*13))]">RANDOM</span>
                            </span>
                        </Plate>
                    </button>
                </div>
            </motion.header>

            {/* ═══════════ RAIL KIRI: filter class + aura ═══════════ */}
            <motion.nav className="absolute z-20" style={{ left: U(32), top: U(112), width: U(210) }} aria-label="Fighter filters" {...enter(-30, 0, 0.12)}>
                <div className="relative flex flex-col" style={{ gap: U(4) }}>
                    <span aria-hidden className="absolute bg-text-muted/30" style={{ left: U(3), top: U(14), bottom: U(14), width: 1 }} />
                    {[{ label: "ALL", value: null as string | null }, ...classes.map((c) => ({ label: c.toUpperCase(), value: c as string | null }))].map((item) => {
                        const active = classFilter === item.value;
                        return (
                            <button
                                key={item.label}
                                type="button"
                                data-nav="class"
                                aria-pressed={active}
                                onClick={() => {
                                    setClassFilter(item.value);
                                    sfx("select");
                                }}
                                className="group relative flex w-full items-center outline-none"
                                style={{ height: U(44) }}
                            >
                                {active ? (
                                    <Plate
                                        className="h-full w-full group-focus-visible:brightness-125"
                                        clip={slant(12, "both")}
                                        edge="bg-brand-amber"
                                        fill="bg-gradient-to-r from-brand-orange to-brand-amber"
                                        contentClassName="flex items-center justify-between font-display font-black italic tracking-[0.08em] text-bg-base"
                                    >
                                        <span className="text-[max(11px,calc(var(--u)*14))]" style={{ paddingLeft: U(22) }}>
                                            {item.label}
                                        </span>
                                        <span style={{ width: U(18), height: U(18), marginRight: U(16) }}>
                                            <IconChevrons />
                                        </span>
                                    </Plate>
                                ) : (
                                    <span className="flex h-full w-full items-center font-display font-bold italic tracking-[0.08em] text-text-muted transition-colors group-hover:text-text-main group-focus-visible:text-brand-amber" style={{ paddingLeft: U(22) }}>
                                        <i aria-hidden className="absolute rotate-45 bg-text-muted/60 transition-colors group-focus-visible:bg-brand-amber" style={{ left: 0, width: U(7), height: U(7) }} />
                                        <span className="text-[max(11px,calc(var(--u)*14))]">{item.label}</span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div style={{ marginTop: U(22), paddingLeft: U(22) }}>
                    <div className={cn("font-display font-black tracking-[0.2em] text-text-muted", textXs)} style={{ marginBottom: U(8) }}>
                        AURA
                    </div>
                    <div className="flex" style={{ gap: U(6) }}>
                        {auras.map(({ key, aura }) => {
                            const active = auraFilter === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    data-nav="aura"
                                    aria-pressed={active}
                                    aria-label={`Aura ${aura.name}`}
                                    title={aura.name}
                                    onClick={() => {
                                        setAuraFilter(active ? null : key);
                                        sfx("select");
                                    }}
                                    className="group relative text-text-main outline-none"
                                    style={{ width: U(28), height: U(28) }}
                                >
                                    <span
                                        aria-hidden
                                        className="absolute rotate-45 transition-all duration-150"
                                        style={{
                                            inset: U(5),
                                            background: aura.color,
                                            opacity: active ? 1 : 0.6,
                                            boxShadow: active ? `0 0 0 ${hair(2)} currentColor, 0 0 ${U(10)} ${aura.color}` : undefined,
                                        }}
                                    />
                                    <span aria-hidden className="absolute rotate-45 border border-transparent group-hover:border-white/70 group-focus-visible:border-white" style={{ inset: U(1) }} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </motion.nav>

            {/* ═══════════ ZONA KARAKTER ═══════════ */}
            <div className="absolute z-10 flex items-end justify-center" style={{ top: U(88), bottom: U(128), left: U(250), right: U(496) }}>
                {/* bayangan lantai */}
                <div
                    aria-hidden
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                        bottom: U(-8),
                        width: U(320),
                        height: U(40),
                        background: `radial-gradient(closest-side, rgba(0,0,0,.85), ${mix(30)} 60%, transparent)`,
                    }}
                />
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={selected.id} className="relative flex h-full w-full items-end justify-center" style={{ maxHeight: U(570) }} {...swap}>
                        <motion.div
                            className="flex h-full w-full items-end justify-center"
                            animate={reduce ? undefined : { y: [0, -4, 0] }}
                            transition={reduce ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {hasArt ? (
                                <img
                                    src={selected.artSrc}
                                    alt={selected.name}
                                    draggable={false}
                                    onError={() => setBrokenArt((b) => ({ ...b, [selected.id]: true }))}
                                    className="max-h-full max-w-full object-contain object-bottom"
                                    style={{ filter: `drop-shadow(0 ${U(18)} ${U(24)} rgba(0,0,0,.7)) drop-shadow(0 0 ${U(18)} ${mix(40)})` }}
                                />
                            ) : (
                                <div data-placeholder="true" className="flex h-full w-full items-end justify-center" style={auraVar(selected.aura.color)}>
                                    <Silhouette variant="full" />
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ═══════════ PANEL INFO KANAN ═══════════ */}
            <div className="absolute z-20 flex items-center" style={{ right: U(32), top: U(96), bottom: U(32), width: U(440) }}>
                <motion.div className="w-full" {...enter(40, 0, 0.18)}>
                    <Plate
                        className="w-full"
                        clip={chamfer(0, 26, 0, 0)}
                        edge="bg-brand-orange/50"
                        fill="bg-bg-panel"
                        shadow={false}
                        edgeWidth={1.5}
                        contentClassName="flex flex-col"
                    >
                        <div className="flex flex-col" style={{ padding: U(24) }}>
                            {/* tag aura + class */}
                            <div className="flex items-center" style={{ gap: U(8), marginBottom: U(12) }}>
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div key={`tag-${selected.id}`} className="flex items-center" style={{ gap: U(8) }} {...fade}>
                                        <Plate
                                            style={{ height: U(24), ...auraVar(selected.aura.color) }}
                                            clip={slant(8, "both")}
                                            edge="bg-transparent"
                                            fill=""
                                            shadow={false}
                                            edgeWidth={0}
                                            fillStyle={{ background: "var(--aura)" }}
                                            contentClassName={cn("flex items-center font-display font-black uppercase tracking-[0.14em]", onAura(selected.aura.color), textXs)}
                                        >
                                            <span style={{ padding: `0 ${U(16)}` }}>{selected.aura.name}</span>
                                        </Plate>
                                        <Plate
                                            style={{ height: U(24) }}
                                            clip={slant(8, "both")}
                                            edge="bg-text-muted/60"
                                            fill="bg-bg-base"
                                            shadow={false}
                                            edgeWidth={1}
                                            contentClassName={cn("flex items-center font-display font-bold uppercase tracking-[0.14em] text-text-main", textXs)}
                                        >
                                            <span style={{ padding: `0 ${U(16)}` }}>{selected.className}</span>
                                        </Plate>
                                        {selected.locked && (
                                            <Plate
                                                style={{ height: U(24) }}
                                                clip={slant(8, "both")}
                                                edge="bg-brand-amber"
                                                fill="bg-bg-base"
                                                shadow={false}
                                                edgeWidth={1}
                                                contentClassName={cn("flex items-center font-display font-bold uppercase tracking-[0.14em] text-brand-amber", textXs)}
                                            >
                                                <span style={{ padding: `0 ${U(12)}` }}>LOCKED</span>
                                            </Plate>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* nama */}
                            <div className="flex items-center" style={{ gap: U(12), marginBottom: U(18) }}>
                                <div
                                    className="grid shrink-0 place-items-center"
                                    style={{
                                        width: U(48),
                                        height: U(48),
                                        background: mix(16),
                                        boxShadow: `inset 0 0 0 ${hair(1.5)} var(--aura)`,
                                        clipPath: chamfer(10, 0, 10, 0),
                                        color: "var(--aura)",
                                    }}
                                >
                                    <span style={{ width: U(20), height: U(20) }}>
                                        <IconDiamond />
                                    </span>
                                </div>
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.h1
                                        key={selected.id}
                                        className="min-w-0 flex-1 whitespace-nowrap font-display font-black italic uppercase leading-none tracking-tight"
                                        style={{ fontSize: `max(20px, ${U(nameSize)})` }}
                                        initial={{ opacity: 0, x: reduce ? 0 : -14 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: reduce ? 0.1 : 0.18, ease: EASE }}
                                    >
                                        {selected.name}
                                    </motion.h1>
                                </AnimatePresence>
                            </div>

                            {/* stat */}
                            <div className="flex flex-col" style={{ gap: U(8), marginBottom: U(20) }}>
                                {statRows.map((r) => (
                                    <div key={r.key} className="relative flex items-center overflow-hidden bg-black/35" style={{ height: U(40), clipPath: chamfer(0, 0, 8, 0) }}>
                                        <div className="grid h-full shrink-0 place-items-center bg-white/5 text-brand-orange" style={{ width: U(40) }}>
                                            <span style={{ width: U(18), height: U(18) }}>{r.icon}</span>
                                        </div>
                                        <span className={cn("font-display font-black tracking-[0.12em] text-text-muted", textSm)} style={{ marginLeft: U(12) }}>
                                            {r.label}
                                        </span>
                                        <span aria-hidden className="flex-1 border-t border-dotted border-text-muted/40" style={{ margin: `0 ${U(10)}` }} />
                                        <span className="font-display font-bold tabular-nums text-[max(12px,calc(var(--u)*15))]" style={{ marginRight: U(14) }}>
                                            {r.value}
                                        </span>
                                        <div aria-hidden className="absolute inset-x-0 bottom-0 bg-white/10" style={{ height: U(3) }} />
                                        <motion.div
                                            aria-hidden
                                            className="absolute bottom-0 left-0 bg-gradient-to-r from-brand-orange to-brand-amber"
                                            style={{ height: U(3) }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(4, Math.min(100, r.pct))}%` }}
                                            transition={{ duration: reduce ? 0.1 : 0.35, ease: EASE }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* skill */}
                            <div className="flex items-center" style={{ gap: U(10), marginBottom: U(10) }}>
                                <span className="font-display font-black tracking-[0.18em] text-text-muted text-[max(11px,calc(var(--u)*13))]">SKILLS_</span>
                                <span aria-hidden className="h-px flex-1 bg-white/15" />
                            </div>
                            <div className="grid grid-cols-3" style={{ gap: U(10), marginBottom: U(20) }}>
                                {selected.skills.slice(0, 3).map((s) => (
                                    <button key={`${selected.id}-${s.id}`} type="button" data-nav="skill" onClick={() => sfx("select")} className="group outline-none" aria-label={`${s.type}: ${s.name}`}>
                                        <Plate
                                            style={{ height: U(92) }}
                                            clip={chamfer(10, 0, 10, 0)}
                                            edge={s.type === "ultimate" ? "bg-brand-amber group-focus-visible:bg-white" : "bg-white/20 group-hover:bg-brand-orange group-focus-visible:bg-brand-amber"}
                                            fill="bg-bg-base"
                                            shadow={false}
                                            edgeWidth={s.type === "ultimate" ? 2 : 1.5}
                                            contentClassName="flex h-full flex-col items-center justify-center"
                                        >
                                            <span className={s.type === "ultimate" ? "text-brand-amber" : "text-brand-orange"} style={{ width: U(32), height: U(32), marginBottom: U(4) }}>
                                                <SkillIcon type={s.type} />
                                            </span>
                                            <span className="font-display font-bold uppercase tracking-[0.12em] text-text-muted text-[max(11px,calc(var(--u)*10))]">{s.type}</span>
                                            <span className={cn("text-center font-bold leading-tight text-text-main", textSm)} style={{ padding: `${U(2)} ${U(6)} 0` }}>
                                                {s.name}
                                            </span>
                                        </Plate>
                                    </button>
                                ))}
                            </div>

                            {/* quote */}
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={`quote-${selected.id}`}
                                    className={cn("bg-black/45 italic text-text-muted", textSm)}
                                    style={{ borderLeft: `${hair(3)} solid var(--aura)`, padding: `${U(12)} ${U(14)}`, marginBottom: U(20), clipPath: chamfer(0, 0, 10, 0) }}
                                    {...fade}
                                >
                                    &ldquo;{selected.quote}&rdquo;
                                </motion.div>
                            </AnimatePresence>

                            {/* aksi */}
                            <div className="flex" style={{ gap: U(12), height: U(52) }}>
                                <button type="button" data-nav="btn-back" onClick={goBack} className="group h-full outline-none" style={{ width: U(130) }}>
                                    <Plate
                                        className="h-full w-full"
                                        clip={slant(14, "both")}
                                        edge="bg-text-muted/60 group-hover:bg-white group-focus-visible:bg-brand-amber"
                                        fill="bg-bg-base"
                                        contentClassName="flex items-center justify-center font-display font-black italic tracking-[0.14em] text-text-main"
                                    >
                                        <span className="text-[max(11px,calc(var(--u)*14))]">BACK</span>
                                    </Plate>
                                </button>
                                <button
                                    type="button"
                                    data-nav="btn-select"
                                    disabled={filtered.length === 0}
                                    onClick={() => confirm(selected)}
                                    className="group h-full flex-1 outline-none disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label={selected.locked ? "Locked fighter" : "Select fighter"}
                                >
                                    <Plate
                                        className="h-full w-full group-focus-visible:brightness-125 group-hover:brightness-110"
                                        clip={slant(14, "both")}
                                        edge="bg-brand-amber group-focus-visible:bg-white"
                                        fill="bg-gradient-to-r from-brand-orange to-brand-amber"
                                        edgeWidth={2}
                                        contentClassName="flex items-center justify-center text-bg-base font-display font-black italic tracking-[0.14em]"
                                        fillChildren={
                                            reduce ? null : (
                                                <motion.span
                                                    className="absolute inset-y-0 -skew-x-[20deg] bg-white/45"
                                                    style={{ width: "28%", left: 0 }}
                                                    animate={{ x: ["-160%", "420%"] }}
                                                    transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }}
                                                />
                                            )
                                        }
                                    >
                                        <span className="flex items-center" style={{ gap: U(10) }}>
                                            <span className="text-[max(12px,calc(var(--u)*16))]">SELECT</span>
                                            <motion.span
                                                style={{ width: U(20), height: U(20) }}
                                                animate={reduce ? undefined : { x: [0, 4, 0] }}
                                                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                                            >
                                                <IconChevrons />
                                            </motion.span>
                                        </span>
                                    </Plate>
                                </button>
                            </div>
                        </div>
                    </Plate>
                </motion.div>
            </div>

            {/* ═══════════ STRIP ROSTER ═══════════ */}
            <motion.div
                className="absolute bottom-0 left-0 z-30"
                style={{ width: `min(${U(840)}, calc(100% - ${U(480)}))`, height: U(150) }}
                {...enter(-60, 0, 0.08)}
            >
                <Plate
                    className="pointer-events-none absolute inset-x-0 bottom-0"
                    style={{ height: U(100) }}
                    clip={slant(46, "right")}
                    edge="bg-brand-orange/45"
                    fill="bg-bg-base"
                    shadow={false}
                    edgeWidth={1.5}
                />
                <div
                    role="listbox"
                    aria-label="Fighters"
                    className="absolute inset-0 z-20 flex items-end overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ gap: U(8), paddingLeft: U(32), paddingRight: U(64), paddingBottom: U(12) }}
                >
                    {filtered.length === 0 ? (
                        <div className="flex w-full items-center justify-center font-display font-black tracking-[0.2em] text-brand-orange text-[max(12px,calc(var(--u)*16))]" style={{ height: U(84) }}>
                            NO MATCH
                        </div>
                    ) : (
                        filtered.map((f) => {
                            const sel = f.id === selected.id;
                            const img = !brokenArt[f.id] ? f.portraitSrc ?? f.artSrc : undefined;
                            return (
                                <button
                                    key={f.id}
                                    ref={(el) => {
                                        cardRefs.current[f.id] = el;
                                    }}
                                    type="button"
                                    role="option"
                                    aria-selected={sel}
                                    aria-label={f.locked ? `${f.name} (locked)` : f.name}
                                    data-nav="card"
                                    data-id={f.id}
                                    onFocus={() => setSelectedId(f.id)}
                                    onMouseEnter={(e) => {
                                        if (document.activeElement === searchRef.current) setSelectedId(f.id);
                                        else e.currentTarget.focus({ preventScroll: true });
                                    }}
                                    onClick={() => confirm(f)}
                                    className="group relative shrink-0 outline-none transition-[width,height] duration-200 ease-out"
                                    style={{ width: U(sel ? 132 : 112), height: U(sel ? 112 : 84), ...auraVar(f.aura.color) }}
                                >
                                    <Plate
                                        className="h-full w-full"
                                        clip={slant(14, "both")}
                                        edgeWidth={sel ? 2.5 : 1.5}
                                        edge={sel ? "bg-[var(--aura)]" : "bg-white/20 group-hover:bg-white/55 group-focus-visible:bg-brand-amber"}
                                        fill="bg-bg-panel"
                                        shadow={sel ? `drop-shadow(0 ${U(3)} 0 rgba(0,0,0,.55)) drop-shadow(0 0 ${U(12)} ${mix(60)})` : true}
                                        fillChildren={
                                            <>
                                                {img ? (
                                                    <img
                                                        src={img}
                                                        alt=""
                                                        draggable={false}
                                                        onError={() => setBrokenArt((b) => ({ ...b, [f.id]: true }))}
                                                        className="absolute inset-0 h-full w-full object-cover object-top"
                                                    />
                                                ) : (
                                                    <div data-placeholder="true" className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${mix(30)}, ${mix(6)})` }}>
                                                        <Silhouette variant="bust" />
                                                        <span className="absolute font-display font-black text-[var(--aura)] text-[max(11px,calc(var(--u)*12))]" style={{ left: U(18), top: U(8) }}>
                                                            {f.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.88), transparent 58%)" }} />
                                                {!sel && <div aria-hidden className="absolute inset-0 bg-black/30 transition-opacity group-hover:opacity-0" />}
                                                <div className="absolute inset-x-0 bottom-0" style={{ padding: `0 ${U(12)} ${U(7)} ${U(16)}` }}>
                                                    <span aria-hidden className="mb-[calc(var(--u)*3)] block bg-[var(--aura)]" style={{ height: U(2), width: U(sel ? 28 : 16) }} />
                                                    <span className="block truncate font-display font-bold italic uppercase tracking-tight text-text-main text-[max(10px,calc(var(--u)*12))]">{f.name}</span>
                                                </div>
                                                {f.locked && (
                                                    <div className="absolute inset-0 grid place-items-center bg-black/65 text-text-main">
                                                        <span style={{ width: U(26), height: U(26) }}>
                                                            <IconLock />
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        }
                                    />
                                </button>
                            );
                        })
                    )}
                </div>
            </motion.div>

            {/* ═══════════ TOAST ═══════════ */}
            <div className="pointer-events-none absolute inset-x-0 z-50 flex justify-center" style={{ top: U(92) }} aria-live="polite">
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: reduce ? 0 : -14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.16, ease: EASE }}
                        >
                            <Plate
                                clip={slant(10, "both")}
                                edge="bg-brand-amber"
                                fill="bg-brand-orange"
                                contentClassName="flex items-center font-display font-black tracking-[0.16em] text-bg-base text-[max(12px,calc(var(--u)*14))]"
                            >
                                <span style={{ padding: `${U(10)} ${U(28)}` }}>{toast.toUpperCase()}</span>
                            </Plate>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}