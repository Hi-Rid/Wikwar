// src/app/page.tsx
"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { TitleScreen } from "@/components/screens/TitleScreen";
import { LobbyScreen } from "@/components/lobby/LobbyScreen";
import { PlaceholderScreen } from "@/components/screens/PlaceholderScreen";
import SelectCharacterScreen, { Fighter } from "@/components/screens/SelectCharacterScreen";
import SelectStageScreen, { StageData } from "@/components/screens/SelectStageScreen";
import VsIntroScreen from "@/components/screens/VsIntroScreen";
import BattleScreen from "@/components/screens/BattleScreen";
import { ROSTER_DATA, CharacterData } from "@/data/roster";
import { soundManager } from "@/engine/SoundManager";

const MAPPED_FIGHTERS: Fighter[] = ROSTER_DATA.map((r: CharacterData) => ({
  id: r.id,
  name: r.name,
  className: r.className || "Balanced",
  aura: {
    id: r.auraId || "orange",
    name: (r.auraId || "orange").charAt(0).toUpperCase() + (r.auraId || "orange").slice(1),
    color: r.aura || "#FF6A00",
  },
  stats: r.stats,
  skills: [
    { id: "special", type: "special", name: r.skills.special },
    { id: "ultimate", type: "ultimate", name: r.skills.ultimate },
    { id: "passive", type: "passive", name: r.skills.passive },
  ],
  quote: r.quote,
  artSrc: r.hasSprite ? "/assets/characters/char_1/ridho.png" : undefined,
}));

const DEFAULT_FIGHTER: Fighter = MAPPED_FIGHTERS[0] ?? {
  id: "ridho",
  name: "RIDHO",
  className: "Balanced",
  aura: { id: "red", name: "Red", color: "#FF3B3B" },
  stats: { hp: 1000, speed: 1.0, damage: 1.0 },
  skills: [
    { id: "special", type: "special", name: "Hello World" },
    { id: "ultimate", type: "ultimate", name: "Deploy to Production" },
    { id: "passive", type: "passive", name: "P2" },
  ],
  quote: "Deploy complete. Prepare to lose.",
  artSrc: "/assets/characters/char_1/ridho.png",
};

const DEFAULT_OPPONENT: Fighter = MAPPED_FIGHTERS[1] ?? DEFAULT_FIGHTER;

const STAGES: StageData[] = [
  { id: "lapangan", name: "LAPANGAN", description: "Open field with school building", imageSrc: "/assets/stages/wikrama.png" },
  { id: "lab", name: "LAB PPLG", description: "Computers, cables, and code", imageSrc: "/assets/stages/lab.png" },
  { id: "kelas", name: "KELAS XII-4", description: "Whiteboards and student desks", imageSrc: "/assets/stages/kelas.png" },
  { id: "rooftop", name: "ROOFTOP", description: "City skyline at dusk", imageSrc: "/assets/stages/rooftop.png" },
];

const DEFAULT_STAGE: StageData = STAGES[0] ?? {
  id: "lapangan",
  name: "LAPANGAN",
  description: "Open field with school building",
  imageSrc: "/assets/stages/wikrama.png",
};

export default function Home() {
  const currentScreen = useGameStore((state) => state.currentScreen);
  const currentFighterId = useGameStore((state) => state.currentFighter);
  const setScreen = useGameStore((state) => state.setScreen);
  const setFighter = useGameStore((state) => state.setFighter);

  const [currentStage, setCurrentStage] = useState<StageData>(DEFAULT_STAGE);
  const [opponent, setOpponent] = useState<Fighter>(DEFAULT_OPPONENT);

  const player: Fighter =
    MAPPED_FIGHTERS.find((f) => f.id === currentFighterId) ?? DEFAULT_FIGHTER;

  return (
    <main className="w-full h-full bg-black text-white font-sans overflow-hidden">
      {currentScreen === "TITLE" && <TitleScreen />}
      {currentScreen === "LOBBY" && <LobbyScreen />}

      {currentScreen === "SELECT_CHARACTER" && (
        <SelectCharacterScreen
          fighters={MAPPED_FIGHTERS}
          onBack={() => setScreen("LOBBY")}
          onConfirm={(id) => {
            setFighter(id);
            setScreen("SELECT_STAGE");
          }}
          playSound={(e) => soundManager.play(e)}
        />
      )}

      {currentScreen === "SELECT_STAGE" && (
        <SelectStageScreen
          stages={STAGES}
          onBack={() => setScreen("SELECT_CHARACTER")}
          onConfirm={(id) => {
            const picked = STAGES.find((s) => s.id === id) ?? DEFAULT_STAGE;
            setCurrentStage(picked);
            // PRD 4.4: lawan Quick Match selalu acak dan tidak pernah sama dengan pemain
            const pool = MAPPED_FIGHTERS.filter((f) => f.id !== player.id);
            const randomOpp =
              pool[Math.floor(Math.random() * pool.length)] ?? DEFAULT_OPPONENT;
            setOpponent(randomOpp);
            setScreen("VS_INTRO");
          }}
          playSound={(e) => soundManager.play(e)}
        />
      )}

      {currentScreen === "VS_INTRO" && (
        <VsIntroScreen
          player={player}
          opponent={opponent}
          stage={currentStage}
          onComplete={() => setScreen("BATTLE")}
          playSound={(e) => soundManager.play(e)}
        />
      )}

      {currentScreen === "BATTLE" && (
        <BattleScreen
          player={player}
          opponent={opponent}
          stageId={currentStage.id}
          onEnd={() => setScreen("LOBBY")}
        />
      )}

      {currentScreen === "HOW_TO_PLAY" && <PlaceholderScreen name="HOW TO PLAY" />}
      {currentScreen === "SETTINGS" && <PlaceholderScreen name="SETTINGS" />}
    </main>
  );
}