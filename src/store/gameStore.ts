import { create } from "zustand";

export type ScreenState =
    | "LOADING" | "TITLE" | "LOBBY" | "SELECT_MODE" | "SELECT_CHARACTER"
    | "SELECT_STAGE" | "VS_INTRO" | "BATTLE" | "MATCH_DETAIL"
    | "HOW_TO_PLAY" | "SETTINGS" | "PLACEHOLDER";

interface GameStore {
    currentScreen: ScreenState;
    mode: "arcade" | "quickMatch" | "training" | null;
    difficulty: "easy" | "normal" | "hard" | "gelo" | null;
    currentFighter: string;

    setScreen: (screen: ScreenState) => void;
    setMode: (mode: GameStore["mode"]) => void;
    setDifficulty: (diff: GameStore["difficulty"]) => void;
    setFighter: (id: string) => void;

    isAudioUnlocked: boolean;
    unlockAudio: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
    currentScreen: "TITLE",
    mode: null,
    difficulty: null,
    currentFighter: "ridho", // Default

    setScreen: (screen) => set({ currentScreen: screen }),
    setMode: (mode) => set({ mode }),
    setDifficulty: (difficulty) => set({ difficulty }),
    setFighter: (currentFighter) => set({ currentFighter }),

    isAudioUnlocked: false,
    unlockAudio: () => set({ isAudioUnlocked: true }),
}));