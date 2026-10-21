"use client";

import { useState } from "react"; // <-- INI YANG KURANG TADI
import { useGameStore } from "@/store/gameStore";
import { TitleScreen } from "@/components/screens/TitleScreen";
import { LobbyScreen } from "@/components/lobby/LobbyScreen";
import { PlaceholderScreen } from "@/components/screens/PlaceholderScreen";
import SelectCharacterScreen, { Fighter } from "@/components/screens/SelectCharacterScreen";
import SelectStageScreen, { StageData } from "@/components/screens/SelectStageScreen";
import VsIntroScreen from "@/components/screens/VsIntroScreen";
import BattleScreen from "@/components/screens/BattleScreen";
import { ROSTER_DATA } from "@/data/roster";
import { soundManager } from "@/engine/SoundManager";

// Mapping Roster
const MAPPED_FIGHTERS: Fighter[] = ROSTER_DATA.map(r => ({
  id: r.id,
  name: r.name,
  className: r.className || "Balanced",
  aura: {
    id: r.auraId || "orange",
    name: (r.auraId || "orange").charAt(0).toUpperCase() + (r.auraId || "orange").slice(1),
    color: r.aura || "#FF6A00"
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

// Data Stage Dummy
const STAGES: StageData[] = [
  { id: "lapangan", name: "LAPANGAN", description: "Open field with school building", imageSrc: "/assets/stages/wikrama.png" },
  { id: "lab", name: "LAB PPLG", description: "Computers, cables, and code", imageSrc: "/assets/stages/lab.png" },
  { id: "kelas", name: "KELAS XII-4", description: "Whiteboards and student desks", imageSrc: "/assets/stages/kelas.png" },
  { id: "rooftop", name: "ROOFTOP", description: "City skyline at dusk", imageSrc: "/assets/stages/rooftop.png" },
];

export default function Home() {
  const currentScreen = useGameStore((state) => state.currentScreen);
  const setScreen = useGameStore((state) => state.setScreen);
  const setFighter = useGameStore((state) => state.setFighter);

  // State lokal (simulasi store buat stage & lawan)
  const [currentStage, setCurrentStage] = useState(STAGES[0]);
  const [opponent, setOpponent] = useState(MAPPED_FIGHTERS[1]);

  // Ambil data fighter yang dipilih dari store (fallback ke Ridho)
  const player = MAPPED_FIGHTERS[0];

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
            const picked = STAGES.find(s => s.id === id) || STAGES[0];
            setCurrentStage(picked);
            const randomOpp = MAPPED_FIGHTERS[Math.floor(Math.random() * MAPPED_FIGHTERS.length)];
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

      {currentScreen === "BATTLE" && <PlaceholderScreen name="BATTLE ENGINE (COMING SOON)" />}
      {currentScreen === "HOW_TO_PLAY" && <PlaceholderScreen name="HOW TO PLAY" />}
      {currentScreen === "SETTINGS" && <PlaceholderScreen name="SETTINGS" />}
    </main>
  );
}