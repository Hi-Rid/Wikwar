"use client";
import { useGameStore } from "@/store/gameStore";
import { useEffect } from "react";
import { soundManager } from "@/engine/SoundManager";

export function PlaceholderScreen({ name }: { name: string }) {
    const setScreen = useGameStore((s) => s.setScreen);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === "Escape" || e.code === "KeyK") {
                soundManager.play("ui_back");
                setScreen("LOBBY");
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [setScreen]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <h1 className="text-4xl font-display text-brand-orange">{name}</h1>
            <p className="text-text-muted mt-4 font-sans">ESC BACK</p>
        </div>
    );
}