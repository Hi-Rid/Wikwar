// src/data/roster.ts
import rosterJson from "./roster.json";

export interface CharacterData {
    id: string;
    name: string;
    className: string;
    auraId: string;
    aura: string;
    stats: { hp: number; speed: number; damage: number };
    skills: { special: string; ultimate: string; passive: string };
    quote: string;
    hasSprite: boolean;
}

const AURA_NAME_BY_HEX: Readonly<Record<string, string>> = {
    "#FF3B3B": "red",
    "#FF6A00": "orange",
    "#2F8CFF": "blue",
    "#22D36B": "green",
    "#A855F7": "purple",
};

// Jembatan data dari roster.json ke komponen layar lama sebelum migrasi F4
export const ROSTER_DATA: CharacterData[] = rosterJson.map((r) => ({
    id: r.id,
    name: r.name.toUpperCase(),
    className: r.role,
    auraId: AURA_NAME_BY_HEX[r.aura.toUpperCase()] ?? "orange",
    aura: r.aura,
    stats: r.stats,
    skills: {
        special: r.special.name,
        ultimate: r.ultimate.name,
        passive: r.passive,
    },
    quote: r.quote,
    hasSprite: r.id === "ridho",
}));