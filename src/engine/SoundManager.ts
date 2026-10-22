// src/engine/SoundManager.ts

export type SoundEvent =
    | "ui_move"
    | "ui_select"
    | "ui_back"
    | "ui_start"
    | "ui_denied"
    | "move"
    | "select"
    | "back"
    | "start"
    | "denied";

export class SoundManager {
    private ctx: AudioContext | null = null;
    private lastMoveTime = 0;

    public init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    private playTone(
        type: OscillatorType,
        freqStart: number,
        freqEnd: number,
        duration: number,
        gainVal: number
    ) {
        if (!this.ctx) return;

        const pitchOffset = 1 + (Math.random() * 0.1 - 0.05);
        const freqS = freqStart * pitchOffset;
        const freqE = freqEnd * pitchOffset;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freqS, this.ctx.currentTime);
        if (freqS !== freqE) {
            osc.frequency.exponentialRampToValueAtTime(freqE, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    public play(event: SoundEvent) {
        if (!this.ctx) return;

        const normalized = event.startsWith("ui_") ? event : `ui_${event}`;

        switch (normalized) {
            case "ui_move": {
                const now = Date.now();
                if (now - this.lastMoveTime < 40) return;
                this.lastMoveTime = now;
                this.playTone("square", 1200, 1200, 0.04, 0.08);
                break;
            }
            case "ui_select":
                this.playTone("triangle", 600, 900, 0.12, 0.1);
                break;
            case "ui_back":
                this.playTone("triangle", 500, 300, 0.1, 0.1);
                break;
            case "ui_start":
                this.playTone("sawtooth", 300, 1200, 0.25, 0.1);
                break;
            case "ui_denied":
                this.playTone("square", 180, 180, 0.09, 0.1);
                break;
        }
    }
}

export const soundManager = new SoundManager();

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    (window as any).__soundManager = soundManager;
}