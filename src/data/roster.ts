// src/data/roster.ts

export interface CharacterData {
    id: string;
    name: string;
    className?: string;
    auraId?: string;
    aura: string;
    stats: { hp: number; speed: number; damage: number };
    skills: { special: string; ultimate: string; passive: string };
    quote: string;
    hasSprite: boolean;
}

export const ROSTER_DATA: CharacterData[] = [
    {
        id: "ridho",
        name: "RIDHO",
        className: "Balanced",
        auraId: "red",
        aura: "#FF3B3B",
        stats: { hp: 1000, speed: 1.0, damage: 1.0 },
        skills: { special: "Energy Bolt", ultimate: "Lunge Beam", passive: "Quick Charge" },
        quote: "Zero errors. Full power.",
        hasSprite: true,
    },
    {
        id: "steven",
        name: "STEVEN",
        className: "Rushdown",
        auraId: "orange",
        aura: "#FF6A00",
        stats: { hp: 900, speed: 1.15, damage: 1.0 },
        skills: { special: "Charge Rush", ultimate: "Rush Barrage", passive: "Evasive" },
        quote: "Faster than your Wi-Fi.",
        hasSprite: false,
    },
    {
        id: "fadhiil",
        name: "FADHIIL",
        className: "Zoner",
        auraId: "blue",
        aura: "#2F8CFF",
        stats: { hp: 950, speed: 1.0, damage: 0.95 },
        skills: { special: "Triple Shot", ultimate: "Lightning Storm", passive: "Sharp Special" },
        quote: "Ping sent. Damage received.",
        hasSprite: false,
    },
    {
        id: "berliana",
        name: "BERLIANA",
        className: "Tank",
        auraId: "green",
        aura: "#22D36B",
        stats: { hp: 1150, speed: 0.85, damage: 1.05 },
        skills: { special: "Rising Strike", ultimate: "Shockwave Slam", passive: "Iron Skin" },
        quote: "Firewall up. Try me.",
        hasSprite: false,
    },
    {
        id: "sahra",
        name: "SAHRA",
        className: "Counter",
        auraId: "purple",
        aura: "#A855F7",
        stats: { hp: 1000, speed: 1.0, damage: 0.95 },
        skills: { special: "Counter Stance", ultimate: "Reversal Grab", passive: "Parry Master" },
        quote: "Request denied. Returning damage.",
        hasSprite: false,
    },
];