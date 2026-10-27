// src/engine/InputManager.ts
import { InputState } from "./types";

export class InputManager {
    private keys: Set<string> = new Set();
    private buffer: Record<string, number> = {};
    public state: InputState = {
        left: false,
        right: false,
        up: false,
        down: false,
        attack: false,
        guard: false,
        special: false,
        dash: false,
        ex: false,
        ultimate: false,
    };

    constructor() {
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("blur", this.onBlur);
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
        }
        this.keys.add(e.code);
        this.buffer[e.code] = 6;
    };

    private onKeyUp = (e: KeyboardEvent) => {
        this.keys.delete(e.code);
    };

    private onBlur = () => {
        this.keys.clear();
        this.buffer = {};
    };

    public update() {
        this.state.left = this.keys.has("KeyA") || this.keys.has("ArrowLeft");
        this.state.right = this.keys.has("KeyD") || this.keys.has("ArrowRight");
        this.state.up = this.keys.has("KeyW") || this.keys.has("ArrowUp");
        this.state.down = this.keys.has("KeyS") || this.keys.has("ArrowDown");

        this.state.attack = (this.buffer["KeyJ"] ?? 0) > 0;
        this.state.guard = (this.buffer["KeyK"] ?? 0) > 0;
        this.state.special = (this.buffer["KeyL"] ?? 0) > 0;
        this.state.dash = (this.buffer["KeyU"] ?? 0) > 0;
        this.state.ex = (this.buffer["KeyI"] ?? 0) > 0;
        this.state.ultimate = (this.buffer["KeyO"] ?? 0) > 0;

        for (const k in this.buffer) {
            const val = this.buffer[k];
            if (val !== undefined && val > 0) {
                this.buffer[k] = val - 1;
            }
        }
    }

    public destroy() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("blur", this.onBlur);
    }
}