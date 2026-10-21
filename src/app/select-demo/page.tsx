"use client";

import SelectCharacterScreen, { Fighter } from "@/components/screens/SelectCharacterScreen";

const MOCK_FIGHTERS: Fighter[] = [
    { id: "ridho", name: "RIDHO", className: "Balanced", aura: { id: "orange", name: "Orange", color: "#FF6A00" }, stats: { hp: 1000, speed: 1.0, damage: 1.0 }, skills: [{ id: "s1", type: "special", name: "Energy Bolt" }, { id: "u1", type: "ultimate", name: "Lunge Beam" }, { id: "p2", type: "passive", name: "Quick Charge" }], quote: "Zero errors. Full power.", artSrc: "/assets/characters/char_1/ridho.png" },
    { id: "steven", name: "STEVEN", className: "Rushdown", aura: { id: "red", name: "Red", color: "#FF3B3B" }, stats: { hp: 900, speed: 1.15, damage: 1.0 }, skills: [{ id: "s4", type: "special", name: "Charge Rush" }, { id: "u3", type: "ultimate", name: "Rush Barrage" }, { id: "p6", type: "passive", name: "Evasive" }], quote: "Faster than your Wi-Fi.", locked: false },
    { id: "fadhiil", name: "FADHIIL", className: "Zoner", aura: { id: "blue", name: "Blue", color: "#2F8CFF" }, stats: { hp: 950, speed: 1.0, damage: 0.95 }, skills: [{ id: "s8", type: "special", name: "Triple Shot" }, { id: "u2", type: "ultimate", name: "Lightning Storm" }, { id: "p7", type: "passive", name: "Sharp Special" }], quote: "Ping sent. Damage received.", locked: true },
    { id: "berliana", name: "BERLIANA", className: "Tank", aura: { id: "green", name: "Green", color: "#22D36B" }, stats: { hp: 1150, speed: 0.85, damage: 1.05 }, skills: [{ id: "s3", type: "special", name: "Rising Strike" }, { id: "u4", type: "ultimate", name: "Shockwave Slam" }, { id: "p1", type: "passive", name: "Iron Skin" }], quote: "Firewall up. Try me." },
    { id: "sahra", name: "SAHRA", className: "Counter", aura: { id: "purple", name: "Purple", color: "#A855F7" }, stats: { hp: 1000, speed: 1.0, damage: 0.95 }, skills: [{ id: "s6", type: "special", name: "Counter Stance" }, { id: "u5", type: "ultimate", name: "Reversal Grab" }, { id: "p5", type: "passive", name: "Parry Master" }], quote: "Request denied. Returning damage." },
];

export default function SelectDemoPage() {
    return (
        <SelectCharacterScreen
            fighters={MOCK_FIGHTERS}
            onConfirm={(id) => alert(`Confirmed: ${id}`)}
            onBack={() => alert("Back to Lobby")}
            playSound={(e) => console.log("SFX:", e)}
        />
    );
}