// src/engine/BattleEngine.ts

export interface PoseSet {
    idle: HTMLImageElement;
    attack: HTMLImageElement;
    dash: HTMLImageElement;
    cast: HTMLImageElement;
    guard: HTMLImageElement;
    damaged: HTMLImageElement;
    xray: HTMLImageElement;
}

export interface BattleAssets {
    bg: HTMLImageElement;
    p1Poses: PoseSet;
    p2Poses: PoseSet;
    projectile: HTMLImageElement;
    explosion: HTMLImageElement;
}

export interface FighterConfig {
    id: string;
    name: string;
    auraColor: string;
    hp: number;
    speed: number;
    damage: number;
}

export interface BattleOptions {
    difficulty?: "easy" | "normal" | "hard" | "gelo";
    mode?: "arcade" | "quickMatch" | "training" | null;
}

interface SpriteBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    footX: number;
}

type MoveType =
    | "NONE"
    | "NLIGHT"
    | "SLIGHT"
    | "DLIGHT"
    | "NAIR"
    | "SAIR"
    | "DAIR"
    | "NSIG"
    | "SSIG"
    | "DSIG"
    | "ULTIMATE";

type ActionState =
    | "IDLE"
    | "RUN"
    | "AIR"
    | "CROUCH"
    | "DASH"
    | "DODGE"
    | "ATTACK"
    | "HITSTUN"
    | "KO";

interface FighterRuntime {
    slot: "P1" | "P2";
    id: string;
    name: string;
    auraColor: string;
    maxHp: number;
    speedMult: number;
    dmgMult: number;

    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: 1 | -1;
    hp: number;
    energy: number;

    jumpsLeft: number;
    maxJumps: number;
    isFastFalling: boolean;
    gravityCancelTimer: number;

    state: ActionState;
    currentMove: MoveType;
    moveLabel: string;
    stateTimer: number;
    stateDuration: number;

    comboCount: number;
    comboResetTimer: number;
    whiffCount: number;

    attackCooldown: number;
    maxAttackCooldown: number;
    sigCooldown: number;
    dodgeCooldown: number;

    hitRegistered: boolean;
    invulnerableTimer: number;

    scaleX: number;
    scaleY: number;
    scaleVX: number;
    scaleVY: number;
    rotation: number;
    rotV: number;
    spinAngle: number;
    animOffsetX: number;
    animOffsetY: number;
    walkPhase: number;
    flashTimer: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    life: number;
    maxLife: number;
    gravity: boolean;
    isSmoke?: boolean;
}

interface JumpRing {
    x: number;
    y: number;
    rx: number;
    ry: number;
    maxRx: number;
    color: string;
    alpha: number;
    tilt: number;
}

interface SlashArc {
    x: number;
    y: number;
    facing: 1 | -1;
    radiusX: number;
    radiusY: number;
    startAngle: number;
    endAngle: number;
    rotation: number;
    color: string;
    alpha: number;
    life: number;
    maxLife: number;
    thickness: number;
}

interface ExplosionEffect {
    x: number;
    y: number;
    scale: number;
    maxScale: number;
    rotation: number;
    color: string;
    alpha: number;
    life: number;
    maxLife: number;
}

interface Projectile {
    ownerSlot: "P1" | "P2";
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    damage: number;
    kbX: number;
    kbY: number;
    color: string;
    life: number;
    isUltimate: boolean;
}

interface AfterimageGhost {
    x: number;
    y: number;
    facing: 1 | -1;
    scaleX: number;
    scaleY: number;
    rotation: number;
    img: HTMLImageElement;
    alpha: number;
}

interface FloatingText {
    text: string;
    x: number;
    y: number;
    vy: number;
    color: string;
    scale: number;
    alpha: number;
    life: number;
}

const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 720;
const FLOOR_Y = 580;
const STAGE_LEFT = 75;
const STAGE_RIGHT = LOGICAL_WIDTH - 75;
const TARGET_CHAR_HEIGHT = 235;

const GRAVITY = 2450;
const FAST_FALL_GRAVITY = 4200;
const GROUND_JUMP_V0 = 960;
const AIR_JUMP_V0 = 860;
const MAX_FALL_SPEED = 920;
const FAST_FALL_SPEED = 1320;

export class BattleEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private assets: BattleAssets;
    private onSnapshot: (snap: any) => void;

    private p1: FighterRuntime;
    private p2: FighterRuntime;
    private p1Rounds = 0;
    private p2Rounds = 0;
    private round = 1;
    private timer = 90;

    private gameState: "INTRO" | "FIGHTING" | "KO" | "GAMEOVER" = "INTRO";
    private introTimer = 1.3;
    private koTimer = 0;
    private winner: string | null = null;
    private winnerSlot: "P1" | "P2" | null = null;
    private announceText: string = "ROUND 1";

    private difficulty: "easy" | "normal" | "hard" | "gelo" = "normal";
    private isTraining = false;
    private isStopped = false;

    private hitstopFrames = 0;
    private screenShake = 0;
    private cameraZoom = 1;
    private cameraTargetZoom = 1;
    private cameraFocusX = LOGICAL_WIDTH / 2;
    private cameraFocusY = LOGICAL_HEIGHT / 2;
    private darkOverlayAlpha = 0;

    private particles: Particle[] = [];
    private jumpRings: JumpRing[] = [];
    private slashArcs: SlashArc[] = [];
    private explosions: ExplosionEffect[] = [];
    private projectiles: Projectile[] = [];
    private afterimages: AfterimageGhost[] = [];
    private floatingTexts: FloatingText[] = [];

    private keys = new Set<string>();
    private inputBuffer: Record<string, number> = {};
    private boundsCache = new WeakMap<HTMLImageElement, SpriteBounds>();
    private whiteSpriteCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
    private audioCtx: AudioContext | null = null;
    private noiseBuffer: AudioBuffer | null = null;

    private rafId: number | null = null;
    private lastTime = 0;
    private accumulator = 0;
    private frameCount = 0;
    private aiDecisionTimer = 0;
    private lastSnapHash = "";

    private handleKeyDown = (e: KeyboardEvent) => {
        if (this.isStopped) return;
        if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
        }
        if (e.repeat) return;
        this.inputBuffer[e.code] = 8;
        this.keys.add(e.code);
        this.ensureAudioReady();
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        this.keys.delete(e.code);
    };

    private handleBlur = () => {
        this.keys.clear();
        this.inputBuffer = {};
    };

    constructor(
        canvas: HTMLCanvasElement,
        assets: BattleAssets,
        p1Config: string | FighterConfig,
        p2Config: string | FighterConfig,
        onSnapshot: (snap: any) => void,
        options?: BattleOptions
    ) {
        this.canvas = canvas;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas 2D context not available");
        this.ctx = context;
        this.assets = assets;
        this.onSnapshot = onSnapshot;

        if (options?.difficulty) this.difficulty = options.difficulty;
        if (options?.mode === "training") this.isTraining = true;

        const c1: FighterConfig = typeof p1Config === "string"
            ? { id: p1Config, name: p1Config.toUpperCase(), auraColor: "#FF6A00", hp: 1000, speed: 1, damage: 1 }
            : p1Config;

        const c2: FighterConfig = typeof p2Config === "string"
            ? { id: p2Config, name: p2Config.toUpperCase(), auraColor: "#2F8CFF", hp: 1000, speed: 1, damage: 1 }
            : p2Config;

        this.p1 = this.createFighter("P1", c1, 380, 1);
        this.p2 = this.createFighter("P2", c2, 900, -1);
    }

    private createFighter(slot: "P1" | "P2", cfg: FighterConfig, startX: number, facing: 1 | -1): FighterRuntime {
        const validMaxHp = Number(cfg.hp) > 0 ? Number(cfg.hp) : 1000;
        return {
            slot,
            id: cfg.id,
            name: cfg.name,
            auraColor: cfg.auraColor || (slot === "P1" ? "#FF6A00" : "#2F8CFF"),
            maxHp: validMaxHp,
            speedMult: Number(cfg.speed) > 0 ? Number(cfg.speed) : 1.0,
            dmgMult: Number(cfg.damage) > 0 ? Number(cfg.damage) : 1.0,
            x: startX,
            y: FLOOR_Y,
            vx: 0,
            vy: 0,
            facing,
            hp: validMaxHp,
            energy: this.isTraining ? 100 : 0,
            jumpsLeft: 3,
            maxJumps: 3,
            isFastFalling: false,
            gravityCancelTimer: 0,
            state: "IDLE",
            currentMove: "NONE",
            moveLabel: "",
            stateTimer: 0,
            stateDuration: 0,
            comboCount: 0,
            comboResetTimer: 0,
            whiffCount: 0,
            attackCooldown: 0,
            maxAttackCooldown: 0.45,
            sigCooldown: 0,
            dodgeCooldown: 0,
            hitRegistered: false,
            invulnerableTimer: 0,
            scaleX: 1,
            scaleY: 1,
            scaleVX: 0,
            scaleVY: 0,
            rotation: 0,
            rotV: 0,
            spinAngle: 0,
            animOffsetX: 0,
            animOffsetY: 0,
            walkPhase: 0,
            flashTimer: 0,
        };
    }

    private impulseSpring(f: FighterRuntime, dScaleX: number, dScaleY: number, dRot = 0) {
        f.scaleX = Math.max(0.6, Math.min(1.45, 1 + dScaleX));
        f.scaleY = Math.max(0.6, Math.min(1.45, 1 + dScaleY));
        f.scaleVX = dScaleX * 8;
        f.scaleVY = dScaleY * 8;
        if (dRot !== 0) {
            f.rotation = dRot;
            f.rotV = dRot * 6;
        }
    }

    private ensureAudioReady() {
        if (typeof window === "undefined") return;
        if (!this.audioCtx) {
            const existingCtx = (window as any).__soundManager?.ctx;
            if (existingCtx) {
                this.audioCtx = existingCtx;
            } else {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtx) {
                    this.audioCtx = new AudioCtx({ latencyHint: "interactive" });
                }
            }

            if (this.audioCtx) {
                const sr = this.audioCtx.sampleRate;
                const length = Math.floor(sr * 0.15);
                const buffer = this.audioCtx.createBuffer(1, length, sr);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                this.noiseBuffer = buffer;
            }
        }
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            this.audioCtx.resume();
        }
    }

    private playSFX(type: "jump" | "air_jump" | "fast_fall" | "whoosh" | "sig" | "hit_light" | "hit_heavy" | "dodge" | "bounce" | "ko" | "fight" | "cooldown") {
        if (this.isStopped) return;
        this.ensureAudioReady();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        const playNoise = (dur: number, freq: number, gainVal: number) => {
            if (!this.noiseBuffer) return;
            const src = ctx.createBufferSource();
            src.buffer = this.noiseBuffer;
            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(freq, now);
            const g = ctx.createGain();
            g.gain.setValueAtTime(gainVal, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + dur);
            src.connect(filter);
            filter.connect(g);
            g.connect(ctx.destination);
            src.start(now);
            src.stop(now + dur);
        };

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "jump" || type === "air_jump") {
            const startF = type === "air_jump" ? 320 : 220;
            osc.type = "sine";
            osc.frequency.setValueAtTime(startF, now);
            osc.frequency.exponentialRampToValueAtTime(startF * 2.1, now + 0.075);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
            osc.start(now);
            osc.stop(now + 0.075);
        } else if (type === "fast_fall") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === "whoosh") {
            playNoise(0.055, 1400, 0.2);
            osc.type = "triangle";
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === "sig") {
            playNoise(0.1, 1800, 0.28);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(840, now + 0.13);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
            osc.start(now);
            osc.stop(now + 0.13);
        } else if (type === "hit_light") {
            playNoise(0.05, 2400, 0.38);
            osc.type = "sine";
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);
            gain.gain.setValueAtTime(0.36, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (type === "hit_heavy") {
            playNoise(0.12, 950, 0.52);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(175, now);
            osc.frequency.exponentialRampToValueAtTime(28, now + 0.16);
            gain.gain.setValueAtTime(0.44, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
            osc.start(now);
            osc.stop(now + 0.16);
        } else if (type === "dodge") {
            playNoise(0.065, 2200, 0.22);
            osc.type = "sine";
            osc.frequency.setValueAtTime(640, now);
            osc.frequency.exponentialRampToValueAtTime(240, now + 0.075);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
            osc.start(now);
            osc.stop(now + 0.075);
        } else if (type === "bounce") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (type === "ko") {
            playNoise(0.15, 650, 0.58);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(210, now);
            osc.frequency.exponentialRampToValueAtTime(24, now + 0.42);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
            osc.start(now);
            osc.stop(now + 0.42);
        } else if (type === "fight") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(980, now + 0.15);
            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === "cooldown") {
            osc.type = "square";
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.setValueAtTime(140, now + 0.035);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.07);
        }
    }

    public start() {
        this.isStopped = false;
        this.ensureAudioReady();
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
        window.addEventListener("blur", this.handleBlur);

        Object.values(this.assets.p1Poses).forEach((img) => {
            if (img) {
                this.getSpriteBounds(img);
                this.getWhiteSilhouette(img);
            }
        });
        Object.values(this.assets.p2Poses).forEach((img) => {
            if (img) {
                this.getSpriteBounds(img);
                this.getWhiteSilhouette(img);
            }
        });
        if (this.assets.projectile) this.getSpriteBounds(this.assets.projectile);
        if (this.assets.explosion) this.getSpriteBounds(this.assets.explosion);

        this.lastTime = performance.now();
        this.publishSnapshot(true);
        this.rafId = requestAnimationFrame(this.loop);
    }

    public stop() {
        this.isStopped = true;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
        window.removeEventListener("blur", this.handleBlur);
    }

    private consumeBuffered(code: string): boolean {
        if ((this.inputBuffer[code] || 0) > 0) {
            this.inputBuffer[code] = 0;
            return true;
        }
        return false;
    }

    private loop = (now: number) => {
        if (this.isStopped) return;

        const FIXED_DT = 1 / 60;
        let frameTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (frameTime > FIXED_DT * 3) frameTime = FIXED_DT * 3;

        this.accumulator += frameTime;
        while (this.accumulator >= FIXED_DT) {
            this.step(FIXED_DT);
            this.accumulator -= FIXED_DT;
        }

        this.render();
        if (!this.isStopped) {
            this.rafId = requestAnimationFrame(this.loop);
        }
    };

    private step(dt: number) {
        this.frameCount++;

        for (const k in this.inputBuffer) {
            if (this.inputBuffer[k] > 0) this.inputBuffer[k]--;
        }

        this.screenShake = Math.max(0, this.screenShake - dt * 55);
        this.cameraZoom += (this.cameraTargetZoom - this.cameraZoom) * 0.18;
        this.cameraTargetZoom += (1 - this.cameraTargetZoom) * 0.1;
        this.darkOverlayAlpha = Math.max(0, this.darkOverlayAlpha - dt * 3.2);

        const midX = (this.p1.x + this.p2.x) / 2;
        const midY = Math.min(LOGICAL_HEIGHT / 2, (this.p1.y + this.p2.y) / 2 - 60);
        this.cameraFocusX += (midX - this.cameraFocusX) * 0.14;
        this.cameraFocusY += (midY - this.cameraFocusY) * 0.12;

        if (this.hitstopFrames > 0) {
            this.hitstopFrames--;
            this.updateVFX(dt * 0.35);
            return;
        }

        if (this.gameState === "INTRO") {
            this.introTimer -= dt;
            if (this.introTimer > 0.5) {
                this.announceText = `ROUND ${this.round}`;
            } else if (this.introTimer > 0) {
                if (this.announceText !== "BRAWL!") {
                    this.announceText = "BRAWL!";
                    this.playSFX("fight");
                    this.spawnJumpRing(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, "#FF6A00", 320, 0);
                }
            } else {
                this.announceText = "";
                this.gameState = "FIGHTING";
                this.publishSnapshot(true);
            }
            this.updateSpringVisuals(this.p1, dt);
            this.updateSpringVisuals(this.p2, dt);
            this.updateVFX(dt);
        } else if (this.gameState === "FIGHTING") {
            if (!this.isTraining) {
                this.timer = Math.max(0, this.timer - dt);
                if (this.timer <= 0) {
                    this.resolveRoundByTimeout();
                    return;
                }
            } else {
                this.p1.energy = 100;
                if (this.p2.state === "IDLE" && this.p2.hp < this.p2.maxHp) {
                    this.p2.hp = Math.min(this.p2.maxHp, this.p2.hp + 200 * dt);
                }
            }

            this.updatePlayerBrawlhallaInput(this.p1, this.p2, dt);
            this.updateBrawlhallaAI(this.p2, this.p1, dt);

            this.updatePhysics(this.p1, this.p2, dt);
            this.updatePhysics(this.p2, this.p1, dt);
            this.resolveSoftBodyOverlap();

            this.checkHitboxes(this.p1, this.p2);
            this.checkHitboxes(this.p2, this.p1);
            this.updateProjectiles(dt);
            this.updateVFX(dt);
        } else if (this.gameState === "KO") {
            this.koTimer -= dt;
            const slowDt = dt * 0.45;
            this.updatePhysics(this.p1, this.p2, slowDt);
            this.updatePhysics(this.p2, this.p1, slowDt);
            this.updateProjectiles(slowDt);
            this.updateVFX(dt);

            if (this.koTimer <= 0) {
                if (this.p1Rounds >= 2 || this.p2Rounds >= 2) {
                    this.gameState = "GAMEOVER";
                    this.publishSnapshot(true);
                } else {
                    this.round++;
                    this.resetRound();
                }
            }
        }

        this.publishSnapshot(false);
    }

    private updatePlayerBrawlhallaInput(f: FighterRuntime, opp: FighterRuntime, dt: number) {
        if (f.state === "HITSTUN" || f.state === "KO") return;

        const isGrounded = f.y >= FLOOR_Y - 1;
        const holdLeft = this.keys.has("KeyA") || this.keys.has("ArrowLeft");
        const holdRight = this.keys.has("KeyD") || this.keys.has("ArrowRight");
        const holdUp = this.keys.has("KeyW") || this.keys.has("ArrowUp");
        const holdDown = this.keys.has("KeyS") || this.keys.has("ArrowDown");
        const moveDir = (holdRight ? 1 : 0) - (holdLeft ? 1 : 0);

        const canAct = f.state === "IDLE" || f.state === "RUN" || f.state === "AIR" || f.state === "CROUCH" || f.state === "DASH";
        const canGravityCancel = f.state === "DODGE" && !isGrounded && f.gravityCancelTimer > 0;

        if ((canAct || f.state === "DASH") && (this.consumeBuffered("KeyW") || this.consumeBuffered("Space") || this.consumeBuffered("ArrowUp"))) {
            if (isGrounded) {
                f.y = FLOOR_Y - 2;
                f.vy = -GROUND_JUMP_V0;
                f.jumpsLeft = f.maxJumps - 1;
                f.state = "AIR";
                f.isFastFalling = false;
                if (moveDir !== 0) {
                    f.facing = moveDir as 1 | -1;
                    f.vx = moveDir * Math.max(Math.abs(f.vx), 460 * f.speedMult);
                }
                this.impulseSpring(f, -0.22, 0.28, f.facing * -0.06);
                this.spawnJumpRing(f.x, FLOOR_Y, "#FFFFFF", 56, 0);
                this.spawnDust(f.x, FLOOR_Y, 6);
                this.playSFX("jump");
                return;
            } else if (f.jumpsLeft > 0) {
                f.vy = -AIR_JUMP_V0;
                f.jumpsLeft--;
                f.state = "AIR";
                f.isFastFalling = false;
                if (moveDir !== 0) {
                    f.facing = moveDir as 1 | -1;
                    f.vx = moveDir * 420 * f.speedMult;
                }
                this.impulseSpring(f, -0.2, 0.25, moveDir * 0.1);
                this.spawnJumpRing(f.x, f.y + 10, f.auraColor, 48, moveDir * 0.15);
                this.playSFX("air_jump");
                return;
            }
        }

        if (!isGrounded && f.state === "AIR" && holdDown && f.vy > -180 && !f.isFastFalling) {
            f.isFastFalling = true;
            f.vy = Math.max(f.vy, 780);
            this.impulseSpring(f, -0.18, 0.26, 0);
            this.spawnJumpRing(f.x, f.y - 90, "#FFFFFF", 34, 0);
            this.playSFX("fast_fall");
        }

        if ((canAct || canGravityCancel) && f.energy >= 100 && (this.consumeBuffered("KeyO") || this.consumeBuffered("KeyI"))) {
            if (moveDir !== 0) f.facing = moveDir as 1 | -1;
            this.triggerMove(f, "ULTIMATE", false);
            return;
        }

        if (this.consumeBuffered("KeyL")) {
            if ((canAct || canGravityCancel) && f.sigCooldown <= 0) {
                if (moveDir !== 0) f.facing = moveDir as 1 | -1;
                const isGC = canGravityCancel;
                if (holdDown) {
                    this.triggerMove(f, "DSIG", isGC);
                } else if (holdUp || moveDir === 0) {
                    this.triggerMove(f, "NSIG", isGC);
                } else {
                    this.triggerMove(f, "SSIG", isGC);
                }
                return;
            } else {
                this.playSFX("cooldown");
            }
        }

        if (this.consumeBuffered("KeyJ")) {
            if (f.attackCooldown > 0) {
                this.playSFX("cooldown");
            } else if (canAct || canGravityCancel) {
                if (moveDir !== 0) f.facing = moveDir as 1 | -1;
                const useGroundedMoves = isGrounded || canGravityCancel;

                if (useGroundedMoves) {
                    if (holdDown) {
                        this.triggerMove(f, "DLIGHT", canGravityCancel);
                    } else if (moveDir !== 0) {
                        this.triggerMove(f, "SLIGHT", canGravityCancel);
                    } else {
                        this.triggerMove(f, "NLIGHT", canGravityCancel);
                    }
                } else {
                    if (holdDown) {
                        this.triggerMove(f, "DAIR", false);
                    } else if (moveDir !== 0) {
                        this.triggerMove(f, "SAIR", false);
                    } else {
                        this.triggerMove(f, "NAIR", false);
                    }
                }
                return;
            }
        }

        if (this.consumeBuffered("KeyU") || this.consumeBuffered("KeyK")) {
            if (canAct && f.dodgeCooldown <= 0) {
                if (isGrounded && moveDir !== 0) {
                    f.facing = moveDir as 1 | -1;
                    f.state = "DASH";
                    f.stateDuration = 0.18;
                    f.stateTimer = 0.18;
                    f.dodgeCooldown = 0.55;
                    f.invulnerableTimer = 0.10;
                    f.vx = f.facing * 880 * f.speedMult;
                    this.impulseSpring(f, 0.26, -0.20, f.facing * 0.18);
                    this.spawnJumpRing(f.x, f.y - 50, f.auraColor, 42, Math.PI / 2);
                    this.spawnDust(f.x, FLOOR_Y, 6);
                    this.playSFX("dodge");
                } else {
                    f.state = "DODGE";
                    f.stateDuration = 0.24;
                    f.stateTimer = 0.24;
                    f.dodgeCooldown = isGrounded ? 0.95 : 1.45;
                    f.invulnerableTimer = 0.22;

                    if (!isGrounded && moveDir === 0 && !holdUp && !holdDown) {
                        f.gravityCancelTimer = 0.22;
                        f.vx = 0;
                        f.vy = 0;
                    } else {
                        f.vx = moveDir * 680 * f.speedMult;
                        f.vy = holdUp ? -580 : holdDown && !isGrounded ? 680 : 0;
                    }

                    this.impulseSpring(f, -0.15, 0.18, moveDir * 0.12);
                    this.playSFX("dodge");
                }
                return;
            } else if (f.dodgeCooldown > 0) {
                this.playSFX("cooldown");
            }
        }

        if (canAct && f.state !== "DASH") {
            if (isGrounded) {
                if (holdDown && moveDir === 0) {
                    f.state = "CROUCH";
                    f.vx *= Math.pow(0.0005, dt);
                } else if (moveDir !== 0) {
                    f.state = "RUN";
                    f.facing = moveDir as 1 | -1;
                    const targetVx = moveDir * 490 * f.speedMult;
                    f.vx += (targetVx - f.vx) * Math.min(1, 22 * dt);
                } else {
                    f.state = "IDLE";
                    f.vx *= Math.pow(0.0002, dt);
                    if (Math.abs(f.vx) < 12) f.vx = 0;
                }
            } else {
                f.state = "AIR";
                if (moveDir !== 0) {
                    f.facing = moveDir as 1 | -1;
                    const targetAirVx = moveDir * 430 * f.speedMult;
                    f.vx += (targetAirVx - f.vx) * Math.min(1, 12 * dt);
                } else {
                    f.vx *= Math.pow(0.25, dt);
                }
            }
        }
    }

    private triggerMove(f: FighterRuntime, move: MoveType, isGravityCancel: boolean) {
        f.state = "ATTACK";
        f.currentMove = move;
        f.hitRegistered = false;
        f.spinAngle = 0;
        f.isFastFalling = false;

        if (isGravityCancel) {
            f.gravityCancelTimer = 0;
            f.vx = 0;
            f.vy = 0;
            this.spawnJumpRing(f.x, f.y + 8, "#38BDF8", 68, 0);
            this.spawnFloatingText("GRAVITY CANCEL!", f.x, f.y - 210, "#38BDF8", 0.85);
        }

        switch (move) {
            case "NLIGHT":
                f.moveLabel = "N-LIGHT";
                f.stateDuration = 0.22;
                f.vx = f.facing * 140;
                this.impulseSpring(f, 0.2, -0.14, f.facing * 0.1);
                this.spawnSlashArc(f.x + f.facing * 45, f.y - 115, f.facing, 95, 75, -0.7, 0.7, 0, "#FFFFFF", 8);
                this.playSFX("whoosh");
                break;

            case "SLIGHT":
                f.moveLabel = "S-LIGHT";
                f.stateDuration = 0.27;
                f.vx = f.facing * 640 * f.speedMult;
                this.impulseSpring(f, 0.28, -0.2, f.facing * 0.18);
                this.spawnSlashArc(f.x + f.facing * 65, f.y - 110, f.facing, 130, 55, -0.45, 0.45, 0, f.auraColor, 10);
                this.spawnDust(f.x, f.y, 5);
                this.playSFX("whoosh");
                break;

            case "DLIGHT":
                f.moveLabel = "D-LIGHT";
                f.stateDuration = 0.28;
                f.vx = f.facing * 420 * f.speedMult;
                this.impulseSpring(f, 0.3, -0.32, f.facing * 0.12);
                this.spawnSlashArc(f.x + f.facing * 55, f.y - 45, f.facing, 125, 45, 0.1, 1.4, -0.25, "#38BDF8", 10);
                this.spawnDust(f.x, f.y, 6);
                this.playSFX("whoosh");
                break;

            case "NAIR":
                f.moveLabel = "N-AIR";
                f.stateDuration = 0.30;
                f.vy = Math.min(f.vy, -120);
                this.impulseSpring(f, 0.15, 0.15, 0);
                this.spawnJumpRing(f.x, f.y - 110, "#FFFFFF", 115, 0.2);
                this.playSFX("whoosh");
                break;

            case "SAIR":
                f.moveLabel = "S-AIR";
                f.stateDuration = 0.28;
                f.vx = f.facing * 520 * f.speedMult;
                f.vy = Math.min(f.vy, -80);
                this.impulseSpring(f, 0.32, -0.22, f.facing * 0.28);
                this.spawnSlashArc(f.x + f.facing * 65, f.y - 115, f.facing, 135, 65, -0.6, 0.6, 0, f.auraColor, 12);
                this.playSFX("whoosh");
                break;

            case "DAIR":
                f.moveLabel = "D-AIR";
                f.stateDuration = 0.32;
                f.vx = f.facing * 380;
                f.vy = 760;
                this.impulseSpring(f, -0.2, 0.28, f.facing * 0.45);
                this.spawnSlashArc(f.x + f.facing * 40, f.y - 50, f.facing, 110, 80, 0.3, 1.5, 0.4, f.auraColor, 11);
                this.playSFX("whoosh");
                break;

            case "NSIG":
                f.moveLabel = "N-SIG";
                f.stateDuration = 0.42;
                f.sigCooldown = 1.65;
                f.attackCooldown = 0.45;
                f.maxAttackCooldown = 0.45;
                f.vx = f.facing * 180;
                f.vy = -680;
                this.impulseSpring(f, -0.24, 0.34, -f.facing * 0.15);
                this.spawnSlashArc(f.x + f.facing * 35, f.y - 140, f.facing, 110, 145, -1.3, 0.2, -0.3, f.auraColor, 15);
                this.spawnJumpRing(f.x, f.y, f.auraColor, 85, 0);
                this.playSFX("sig");
                break;

            case "SSIG":
                f.moveLabel = "S-SIG";
                f.stateDuration = 0.40;
                f.sigCooldown = 1.65;
                f.attackCooldown = 0.45;
                f.maxAttackCooldown = 0.45;
                f.vx = f.id === "steven" || f.id === "berliana" ? f.facing * 820 : -f.facing * 110;
                if (isGravityCancel) f.vy = -150;
                this.impulseSpring(f, 0.3, -0.22, f.facing * 0.2);
                this.spawnCharacterSignatureProjectile(f);
                this.playSFX("sig");
                break;

            case "DSIG":
                f.moveLabel = "D-SIG";
                f.stateDuration = 0.42;
                f.sigCooldown = 1.65;
                f.attackCooldown = 0.45;
                f.maxAttackCooldown = 0.45;
                f.vx = 0;
                if (!isGravityCancel && f.y < FLOOR_Y) f.vy = 880;
                this.impulseSpring(f, 0.34, -0.28, 0);
                this.spawnJumpRing(f.x, f.y - 20, f.auraColor, 165, 0);
                this.spawnExplosion(f.x + f.facing * 75, f.y - 60, 1.15, f.auraColor);
                this.spawnExplosion(f.x - f.facing * 75, f.y - 60, 1.15, f.auraColor);
                this.playSFX("sig");
                break;

            case "ULTIMATE":
                f.moveLabel = "OVERDRIVE";
                f.energy = 0;
                f.stateDuration = 0.50;
                f.invulnerableTimer = 0.50;
                f.sigCooldown = 1.2;
                f.vx = f.facing * 620;
                f.vy = -120;
                this.impulseSpring(f, 0.36, -0.26, f.facing * 0.22);

                this.projectiles.push({
                    ownerSlot: f.slot,
                    x: f.x + f.facing * 85,
                    y: f.y - 120,
                    vx: f.facing * 1060,
                    vy: 0,
                    radius: 72,
                    damage: Math.round(195 * f.dmgMult),
                    kbX: 780,
                    kbY: -620,
                    color: f.auraColor,
                    life: 1.4,
                    isUltimate: true,
                });

                this.hitstopFrames = 7;
                this.darkOverlayAlpha = 0.65;
                this.cameraTargetZoom = 1.14;
                this.screenShake = 16;
                this.playSFX("sig");
                this.spawnJumpRing(f.x, f.y - 110, f.auraColor, 220, 0);
                this.spawnFloatingText("OVERDRIVE!", f.x, f.y - 220, f.auraColor, 1.3);
                break;
        }

        f.stateTimer = f.stateDuration;
    }

    private spawnCharacterSignatureProjectile(f: FighterRuntime) {
        const startX = f.x + f.facing * 75;
        const startY = f.y - 115;

        if (f.id === "fadhiil") {
            [-150, 0, 150].forEach((vy) => {
                this.projectiles.push({
                    ownerSlot: f.slot,
                    x: startX,
                    y: startY,
                    vx: f.facing * 840,
                    vy,
                    radius: 34,
                    damage: Math.round(30 * f.dmgMult),
                    kbX: 520,
                    kbY: -420,
                    color: f.auraColor,
                    life: 1.3,
                    isUltimate: false,
                });
            });
        } else if (f.id === "steven" || f.id === "berliana") {
            this.projectiles.push({
                ownerSlot: f.slot,
                x: startX + f.facing * 35,
                y: startY,
                vx: f.facing * 620,
                vy: 0,
                radius: 58,
                damage: Math.round(72 * f.dmgMult),
                kbX: 660,
                kbY: -520,
                color: f.auraColor,
                life: 0.32,
                isUltimate: false,
            });
        } else {
            this.projectiles.push({
                ownerSlot: f.slot,
                x: startX,
                y: startY,
                vx: f.facing * 900,
                vy: 0,
                radius: 46,
                damage: Math.round(64 * f.dmgMult),
                kbX: 620,
                kbY: -480,
                color: f.auraColor,
                life: 1.4,
                isUltimate: false,
            });
        }
    }

    private updateBrawlhallaAI(ai: FighterRuntime, player: FighterRuntime, dt: number) {
        if (this.isTraining) {
            if (ai.state !== "HITSTUN" && ai.state !== "KO") {
                ai.state = ai.y < FLOOR_Y ? "AIR" : "IDLE";
                if (ai.y >= FLOOR_Y) ai.vx *= Math.pow(0.001, dt);
            }
            return;
        }

        if (ai.state === "HITSTUN" || ai.state === "KO" || ai.state === "ATTACK" || ai.state === "DODGE") return;

        this.aiDecisionTimer -= dt;
        if (this.aiDecisionTimer > 0) return;

        const reactInterval =
            this.difficulty === "easy" ? 0.32 :
                this.difficulty === "normal" ? 0.20 :
                    this.difficulty === "hard" ? 0.12 : 0.07;
        this.aiDecisionTimer = reactInterval;

        const dx = player.x - ai.x;
        const dy = player.y - ai.y;
        const dist = Math.abs(dx);
        const isGrounded = ai.y >= FLOOR_Y - 1;
        ai.facing = dx >= 0 ? 1 : -1;

        const dodgeProb = this.difficulty === "easy" ? 0.12 : this.difficulty === "normal" ? 0.32 : this.difficulty === "hard" ? 0.58 : 0.78;
        if (player.state === "ATTACK" && dist < 210 && ai.dodgeCooldown <= 0 && Math.random() < dodgeProb) {
            ai.state = "DODGE";
            ai.stateDuration = 0.22;
            ai.stateTimer = 0.22;
            ai.dodgeCooldown = 1.25;
            ai.invulnerableTimer = 0.20;
            ai.vx = -ai.facing * 520;
            this.playSFX("dodge");
            return;
        }

        if (ai.attackCooldown > 0) {
            if (dist < 180) {
                ai.state = isGrounded ? "RUN" : "AIR";
                ai.vx = -ai.facing * 380 * ai.speedMult;
            } else if (isGrounded && Math.random() < 0.25) {
                ai.y = FLOOR_Y - 2;
                ai.vy = -GROUND_JUMP_V0;
                ai.jumpsLeft = 2;
                ai.state = "AIR";
                this.spawnJumpRing(ai.x, FLOOR_Y, "#FFFFFF", 48, 0);
            }
            return;
        }

        if (dy < -95 && dist < 260) {
            if (isGrounded && ai.sigCooldown <= 0 && Math.random() < 0.4) {
                this.triggerMove(ai, "NSIG", false);
                return;
            }
            if (ai.jumpsLeft > 0) {
                ai.vy = isGrounded ? -GROUND_JUMP_V0 : -AIR_JUMP_V0;
                ai.jumpsLeft--;
                ai.state = "AIR";
                ai.vx = ai.facing * 380;
                this.spawnJumpRing(ai.x, ai.y, ai.auraColor, 46, 0);
                this.playSFX("jump");
                return;
            }
        }

        if (!isGrounded && dist < 185 && Math.abs(dy) < 130) {
            if (dy > 40) {
                this.triggerMove(ai, "DAIR", false);
            } else if (dist > 90) {
                this.triggerMove(ai, "SAIR", false);
            } else {
                this.triggerMove(ai, "NAIR", false);
            }
            return;
        }

        if (isGrounded) {
            if (ai.energy >= 100 && dist < 350 && Math.random() < 0.45) {
                this.triggerMove(ai, "ULTIMATE", false);
                return;
            }
            if (ai.sigCooldown <= 0 && dist > 210 && dist < 480 && Math.random() < 0.32) {
                this.triggerMove(ai, "SSIG", false);
                return;
            }
            if (dist < 170) {
                const roll = Math.random();
                if (roll < 0.4) {
                    this.triggerMove(ai, "DLIGHT", false);
                } else if (roll < 0.75) {
                    this.triggerMove(ai, "SLIGHT", false);
                } else {
                    this.triggerMove(ai, "NLIGHT", false);
                }
                return;
            }

            if (dist > 340 && ai.dodgeCooldown <= 0 && Math.random() < 0.3) {
                ai.state = "DASH";
                ai.stateDuration = 0.18;
                ai.stateTimer = 0.18;
                ai.dodgeCooldown = 0.85;
                ai.vx = ai.facing * 840 * ai.speedMult;
                this.spawnJumpRing(ai.x, FLOOR_Y - 45, ai.auraColor, 40, Math.PI / 2);
                this.playSFX("dodge");
            } else {
                ai.state = "RUN";
                ai.vx = ai.facing * 450 * ai.speedMult;
            }
        }
    }

    private updatePhysics(f: FighterRuntime, opp: FighterRuntime, dt: number) {
        if (f.attackCooldown > 0) f.attackCooldown = Math.max(0, f.attackCooldown - dt);
        if (f.sigCooldown > 0) f.sigCooldown = Math.max(0, f.sigCooldown - dt);
        if (f.dodgeCooldown > 0) f.dodgeCooldown = Math.max(0, f.dodgeCooldown - dt);
        if (f.invulnerableTimer > 0) f.invulnerableTimer = Math.max(0, f.invulnerableTimer - dt);
        if (f.gravityCancelTimer > 0) f.gravityCancelTimer = Math.max(0, f.gravityCancelTimer - dt);
        if (f.flashTimer > 0) f.flashTimer = Math.max(0, f.flashTimer - dt);

        if (f.comboResetTimer > 0) {
            f.comboResetTimer -= dt;
            if (f.comboResetTimer <= 0) f.comboCount = 0;
        }

        if (f.stateTimer > 0) {
            f.stateTimer -= dt;

            if (f.state === "ATTACK" && f.currentMove === "NAIR") {
                f.spinAngle += f.facing * dt * 22;
            }

            if ((f.state === "DASH" || f.state === "DODGE" || f.currentMove === "SLIGHT" || f.currentMove === "SAIR" || f.currentMove === "ULTIMATE") && this.frameCount % 3 === 0) {
                const poses = f.slot === "P1" ? this.assets.p1Poses : this.assets.p2Poses;
                const img = f.state === "ATTACK" ? poses.attack : poses.dash;
                this.afterimages.push({
                    x: f.x,
                    y: f.y + f.animOffsetY,
                    facing: f.facing,
                    scaleX: f.scaleX,
                    scaleY: f.scaleY,
                    rotation: f.rotation + f.spinAngle,
                    img: img || poses.idle,
                    alpha: 0.38,
                });
            }

            if (f.state === "HITSTUN" && Math.hypot(f.vx, f.vy) > 450 && this.frameCount % 2 === 0) {
                this.particles.push({
                    x: f.x + (Math.random() - 0.5) * 20,
                    y: f.y - 100 + (Math.random() - 0.5) * 20,
                    vx: -f.vx * 0.08,
                    vy: -f.vy * 0.08,
                    size: 14 + Math.random() * 10,
                    color: "rgba(235, 238, 245, 0.75)",
                    alpha: 0.75,
                    life: 0.28,
                    maxLife: 0.28,
                    gravity: false,
                    isSmoke: true,
                });
            }

            if (f.stateTimer <= 0 && f.state !== "KO") {
                if (f.state === "ATTACK") {
                    const isSig = f.currentMove === "NSIG" || f.currentMove === "SSIG" || f.currentMove === "DSIG";
                    if (!f.hitRegistered) {
                        f.whiffCount++;
                        const cd = isSig ? 0.65 : f.whiffCount >= 2 ? 0.55 : 0.24;
                        f.attackCooldown = Math.max(f.attackCooldown, cd);
                        f.maxAttackCooldown = f.attackCooldown;
                        if (f.whiffCount >= 2) f.whiffCount = 0;
                    } else {
                        const cd = isSig ? 0.45 : f.currentMove === "DLIGHT" ? 0.10 : 0.18;
                        f.attackCooldown = Math.max(f.attackCooldown, cd);
                        f.maxAttackCooldown = Math.max(0.2, f.attackCooldown);
                        f.whiffCount = 0;
                    }
                }

                f.currentMove = "NONE";
                f.moveLabel = "";
                f.spinAngle = 0;
                f.state = f.y < FLOOR_Y - 1 ? "AIR" : "IDLE";
            }
        }

        if (f.y >= FLOOR_Y - 1 && (f.state === "ATTACK" || f.state === "HITSTUN")) {
            f.vx *= Math.pow(0.0025, dt);
        }

        f.x += f.vx * dt;
        f.y += f.vy * dt;

        if (f.y < FLOOR_Y) {
            if (f.gravityCancelTimer > 0) {
                f.vy = 0;
            } else {
                const g = f.isFastFalling ? FAST_FALL_GRAVITY : GRAVITY;
                const maxV = f.isFastFalling ? FAST_FALL_SPEED : MAX_FALL_SPEED;
                f.vy = Math.min(maxV, f.vy + g * dt);
            }
        }

        if (f.y >= FLOOR_Y) {
            if (f.state === "HITSTUN" && f.vy > 520) {
                f.y = FLOOR_Y - 2;
                f.vy = -f.vy * 0.58;
                this.impulseSpring(f, 0.32, -0.32, 0);
                this.spawnJumpRing(f.x, FLOOR_Y, "#FFFFFF", 75, 0);
                this.spawnDust(f.x, FLOOR_Y, 8);
                this.screenShake = Math.max(this.screenShake, 7);
                this.playSFX("bounce");
            } else {
                const impactVy = f.vy;
                f.y = FLOOR_Y;
                f.vy = 0;
                f.jumpsLeft = f.maxJumps;
                f.isFastFalling = false;

                if (impactVy > 260) {
                    const squash = Math.min(0.28, impactVy / 3400);
                    this.impulseSpring(f, squash, -squash, 0);
                    this.spawnDust(f.x, FLOOR_Y, 5);
                }
                if (f.state === "AIR") {
                    f.state = "IDLE";
                }
            }
        }

        if (f.x < STAGE_LEFT) {
            f.x = STAGE_LEFT;
            if (f.state === "HITSTUN" && Math.abs(f.vx) > 380) {
                f.vx = -f.vx * 0.72;
                f.vy = Math.min(f.vy, -320);
                this.spawnJumpRing(STAGE_LEFT, f.y - 100, "#FFFFFF", 70, Math.PI / 2);
                this.screenShake = Math.max(this.screenShake, 9);
                this.playSFX("bounce");
            } else {
                f.vx = 0;
            }
        } else if (f.x > STAGE_RIGHT) {
            f.x = STAGE_RIGHT;
            if (f.state === "HITSTUN" && Math.abs(f.vx) > 380) {
                f.vx = -f.vx * 0.72;
                f.vy = Math.min(f.vy, -320);
                this.spawnJumpRing(STAGE_RIGHT, f.y - 100, "#FFFFFF", 70, Math.PI / 2);
                this.screenShake = Math.max(this.screenShake, 9);
                this.playSFX("bounce");
            } else {
                f.vx = 0;
            }
        }

        this.updateSpringVisuals(f, dt);
    }

    private resolveSoftBodyOverlap() {
        if (this.p1.state === "DASH" || this.p1.state === "DODGE" || this.p2.state === "DASH" || this.p2.state === "DODGE") {
            return;
        }
        const minDistance = 55;
        const dx = this.p2.x - this.p1.x;
        const dy = Math.abs(this.p1.y - this.p2.y);

        if (Math.abs(dx) < minDistance && dy < 90) {
            const push = (minDistance - Math.abs(dx)) * 0.25;
            const sign = dx >= 0 ? 1 : -1;
            this.p1.x -= sign * push;
            this.p2.x += sign * push;
        }
    }

    private updateSpringVisuals(f: FighterRuntime, dt: number) {
        const now = performance.now() * 0.001;
        let targetSX = 1.0;
        let targetSY = 1.0;
        let targetRot = 0;
        let targetOffX = 0;
        let targetOffY = 0;

        if (f.state === "IDLE") {
            const breath = Math.sin(now * 7.0);
            targetSX = 1.0 - breath * 0.025;
            targetSY = 1.0 + breath * 0.03;
            targetOffY = -Math.abs(breath) * 3;
        } else if (f.state === "RUN") {
            f.walkPhase += dt * 19 * f.speedMult;
            const hop = Math.abs(Math.sin(f.walkPhase));
            targetOffY = -hop * 15;
            targetSX = 1.0 + (0.5 - hop) * 0.09;
            targetSY = 1.0 + (hop - 0.5) * 0.09;
            targetRot = f.facing * 0.14;
        } else if (f.state === "AIR") {
            const vyRatio = Math.max(-1, Math.min(1, f.vy / 900));
            targetSY = 1.0 + Math.abs(vyRatio) * 0.12;
            targetSX = 1.0 - Math.abs(vyRatio) * 0.08;
            targetRot = (f.vx / 500) * 0.16;
        } else if (f.state === "CROUCH") {
            targetSX = 1.18;
            targetSY = 0.68;
        } else if (f.state === "ATTACK") {
            if (f.currentMove === "DLIGHT") {
                targetSX = 1.24;
                targetSY = 0.72;
                targetRot = f.facing * 0.22;
            } else if (f.currentMove === "DAIR") {
                targetRot = f.facing * 0.52;
            } else if (f.currentMove === "SAIR" || f.currentMove === "SLIGHT") {
                targetRot = f.facing * 0.26;
                targetOffX = f.facing * 20;
            } else if (f.currentMove === "NSIG") {
                targetRot = -f.facing * 0.18;
            }
        } else if (f.state === "HITSTUN") {
            targetRot = -f.facing * 0.35;
            targetOffX = (Math.random() - 0.5) * 10;
        } else if (f.state === "KO") {
            targetRot = -f.facing * (Math.PI / 2.05);
            targetOffY = 12;
        }

        const stiffness = 280;
        const damping = 18;

        const forceX = (targetSX - f.scaleX) * stiffness;
        f.scaleVX = (f.scaleVX + forceX * dt) * Math.exp(-damping * dt);
        f.scaleX += f.scaleVX * dt;

        const forceY = (targetSY - f.scaleY) * stiffness;
        f.scaleVY = (f.scaleVY + forceY * dt) * Math.exp(-damping * dt);
        f.scaleY += f.scaleVY * dt;

        const forceRot = (targetRot - f.rotation) * 240;
        f.rotV = (f.rotV + forceRot * dt) * Math.exp(-16 * dt);
        f.rotation += f.rotV * dt;

        f.animOffsetX += (targetOffX - f.animOffsetX) * 22 * dt;
        f.animOffsetY += (targetOffY - f.animOffsetY) * 22 * dt;
    }

    private checkHitboxes(att: FighterRuntime, def: FighterRuntime) {
        if (this.gameState !== "FIGHTING") return;
        if (att.state !== "ATTACK" || att.hitRegistered) return;
        if (def.state === "KO" || def.invulnerableTimer > 0) return;

        const progress = 1 - att.stateTimer / Math.max(0.01, att.stateDuration);
        if (progress < 0.15 || progress > 0.82) return;

        const dx = (def.x - att.x) * att.facing;
        const absDx = Math.abs(def.x - att.x);
        const dy = def.y - att.y;

        let hit = false;
        let dmg = 26;
        let kbX = 240;
        let kbY = -220;
        let isHeavy = false;

        switch (att.currentMove) {
            case "NLIGHT":
                hit = dx > -20 && dx <= 145 && Math.abs(dy) < 120;
                dmg = 24;
                kbX = 210;
                kbY = -240;
                break;

            case "SLIGHT":
                hit = dx > -25 && dx <= 170 && Math.abs(dy) < 120;
                dmg = 32;
                kbX = 320;
                kbY = -360;
                break;

            case "DLIGHT":
                hit = dx > -25 && dx <= 165 && Math.abs(dy) < 110;
                dmg = 28;
                kbX = 160;
                kbY = -740;
                break;

            case "NAIR":
                hit = absDx <= 135 && Math.abs(dy) < 135;
                dmg = 30;
                kbX = 340;
                kbY = -520;
                break;

            case "SAIR":
                hit = dx > -20 && dx <= 175 && Math.abs(dy) < 125;
                dmg = 44;
                kbX = 620;
                kbY = -420;
                isHeavy = true;
                break;

            case "DAIR":
                hit = dx > -35 && dx <= 145 && dy > -60 && dy < 155;
                dmg = 38;
                kbX = 320;
                kbY = 580;
                isHeavy = true;
                if (hit) {
                    att.vy = -680;
                    this.spawnJumpRing(att.x, att.y, "#FFFFFF", 55, 0);
                }
                break;

            case "NSIG":
                hit = dx > -35 && dx <= 155 && dy < 60 && dy > -190;
                dmg = 68;
                kbX = 480;
                kbY = -780;
                isHeavy = true;
                break;

            case "DSIG":
                hit = absDx <= 185 && Math.abs(dy) < 120;
                dmg = 64;
                kbX = 640;
                kbY = -480;
                isHeavy = true;
                break;

            case "SSIG":
                hit = dx > -20 && dx <= 165 && Math.abs(dy) < 125;
                dmg = 62;
                kbX = 620;
                kbY = -460;
                isHeavy = true;
                break;
        }

        if (hit) {
            att.hitRegistered = true;
            att.whiffCount = 0;
            const pushDir: 1 | -1 = def.x >= att.x ? 1 : -1;
            this.applyBrawlhallaHit(att, def, Math.round(dmg * att.dmgMult), pushDir * kbX, kbY, isHeavy, false);
        }
    }

    private updateProjectiles(dt: number) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (this.frameCount % 2 === 0) {
                this.particles.push({
                    x: p.x + (Math.random() - 0.5) * 18,
                    y: p.y + (Math.random() - 0.5) * 18,
                    vx: -p.vx * 0.12,
                    vy: (Math.random() - 0.5) * 45,
                    size: Math.random() * 5 + 4,
                    color: p.color,
                    alpha: 0.85,
                    life: 0.18,
                    maxLife: 0.18,
                    gravity: false,
                });
            }

            // Gunakan ownerSlot ("P1" vs "P2") agar tidak salah sasaran saat Mirror Match!
            const att = p.ownerSlot === "P1" ? this.p1 : this.p2;
            const def = p.ownerSlot === "P1" ? this.p2 : this.p1;

            const hitX = Math.abs(p.x - def.x) < p.radius + 45;
            const hitY = p.y >= def.y - 220 && p.y <= def.y + 10;

            if (this.gameState === "FIGHTING" && def.state !== "KO" && def.invulnerableTimer <= 0 && hitX && hitY) {
                const dir: 1 | -1 = p.vx >= 0 ? 1 : -1;
                this.applyBrawlhallaHit(att, def, p.damage, dir * p.kbX, p.kbY, true, p.isUltimate);
                this.spawnExplosion(p.x, p.y, p.isUltimate ? 2.2 : 1.3, p.color);
                this.projectiles.splice(i, 1);
                continue;
            }

            if (p.life <= 0 || p.x < -120 || p.x > LOGICAL_WIDTH + 120) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    private applyBrawlhallaHit(
        att: FighterRuntime,
        def: FighterRuntime,
        baseDmg: number,
        kbX: number,
        kbY: number,
        isHeavy: boolean,
        isUlt: boolean
    ) {
        if (this.gameState !== "FIGHTING") return;

        const comboScale = Math.max(0.55, 1 - att.comboCount * 0.05);
        const finalDmg = Math.max(6, Math.round(baseDmg * comboScale));

        def.hp = Math.max(0, def.hp - finalDmg);
        att.energy = Math.min(100, att.energy + 14);
        def.energy = Math.min(100, def.energy + 9);

        att.comboCount++;
        att.comboResetTimer = 1.8;

        const missingHpRatio = Math.max(0, (def.maxHp - def.hp) / def.maxHp);
        const forceScale = isHeavy ? 1 + missingHpRatio * 0.65 : 1 + missingHpRatio * 0.25;

        def.state = "HITSTUN";
        def.currentMove = "NONE";
        def.stateDuration = isUlt ? 0.72 : isHeavy ? 0.48 : 0.34;
        def.stateTimer = def.stateDuration;
        def.vx = kbX * forceScale;
        def.vy = kbY * (kbY < 0 ? Math.min(1.35, forceScale) : 1);
        if (def.vy < 0 && def.y >= FLOOR_Y) {
            def.y = FLOOR_Y - 3;
        }

        def.flashTimer = 0.12;
        this.impulseSpring(def, 0.32, -0.26, (kbX >= 0 ? 1 : -1) * 0.28);

        const hitX = (att.x + def.x) / 2;
        const hitY = Math.min(att.y, def.y) - 115;

        if (isHeavy || isUlt) {
            this.hitstopFrames = isUlt ? 6 : 4;
            this.screenShake = isUlt ? 18 : 11;
            this.cameraTargetZoom = isUlt ? 1.12 : 1.05;
            this.playSFX("hit_heavy");
            this.spawnHitSparks(hitX, hitY, att.auraColor, 18);
            this.spawnJumpRing(hitX, hitY, att.auraColor, 130, 0);
            this.spawnExplosion(hitX, hitY, isUlt ? 2.0 : 1.0, att.auraColor);
            this.spawnFloatingText(`${finalDmg}!`, def.x, def.y - 210, "#FFB020", 1.25);
        } else {
            this.hitstopFrames = 2;
            this.screenShake = 5;
            this.playSFX("hit_light");
            this.spawnHitSparks(hitX, hitY, "#FFFFFF", 11);
            this.spawnJumpRing(hitX, hitY, "#FFFFFF", 80, 0);
            this.spawnFloatingText(`${finalDmg}`, def.x, def.y - 195, "#FFFFFF", 1.0);
        }

        // Hanya trigger K.O. jika HP benar-benar sudah 0!
        if (def.hp <= 0) {
            def.hp = 0;
            def.state = "KO";
            def.vx = (kbX >= 0 ? 1 : -1) * 780;
            def.vy = -680;
            this.hitstopFrames = 9;
            this.screenShake = 24;
            this.cameraTargetZoom = 1.16;
            this.playSFX("ko");
            this.spawnExplosion(def.x, def.y - 110, 2.4, "#FF3B3B");
            this.spawnJumpRing(def.x, def.y - 100, "#FF3B3B", 280, 0);
            this.triggerKO(att.slot);
        } else {
            this.publishSnapshot(true);
        }
    }

    private spawnJumpRing(x: number, y: number, color: string, maxRx: number, tilt: number) {
        this.jumpRings.push({
            x,
            y,
            rx: maxRx * 0.25,
            ry: maxRx * 0.08,
            maxRx,
            color,
            alpha: 0.95,
            tilt,
        });
    }

    private spawnSlashArc(
        x: number,
        y: number,
        facing: 1 | -1,
        radiusX: number,
        radiusY: number,
        startAngle: number,
        endAngle: number,
        rotation: number,
        color: string,
        thickness: number
    ) {
        this.slashArcs.push({
            x,
            y,
            facing,
            radiusX,
            radiusY,
            startAngle,
            endAngle,
            rotation,
            color,
            alpha: 1,
            life: 0.16,
            maxLife: 0.16,
            thickness,
        });
    }

    private spawnExplosion(x: number, y: number, maxScale: number, color: string) {
        this.explosions.push({
            x,
            y,
            scale: maxScale * 0.25,
            maxScale,
            rotation: (Math.random() - 0.5) * 0.6,
            color,
            alpha: 1,
            life: 0.28,
            maxLife: 0.28,
        });
    }

    private spawnHitSparks(x: number, y: number, color: string, count: number) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 180 + Math.random() * 540;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 5,
                color: i % 3 === 0 ? "#FFFFFF" : color,
                alpha: 1,
                life: 0.15 + Math.random() * 0.16,
                maxLife: 0.31,
                gravity: true,
            });
        }
    }

    private spawnDust(x: number, y: number, count: number) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 38,
                y: y + 2,
                vx: (Math.random() - 0.5) * 180,
                vy: -25 - Math.random() * 85,
                size: 7 + Math.random() * 7,
                color: "rgba(230, 232, 240, 0.7)",
                alpha: 0.7,
                life: 0.22 + Math.random() * 0.15,
                maxLife: 0.37,
                gravity: false,
                isSmoke: true,
            });
        }
    }

    private spawnFloatingText(text: string, x: number, y: number, color: string, scale: number) {
        this.floatingTexts.push({
            text,
            x: x + (Math.random() - 0.5) * 24,
            y,
            vy: -95,
            color,
            scale,
            alpha: 1,
            life: 0.52,
        });
    }

    private updateVFX(dt: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.gravity) p.vy += 1200 * dt;
            if (p.isSmoke) p.size += 18 * dt;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.jumpRings.length - 1; i >= 0; i--) {
            const r = this.jumpRings[i];
            r.rx += (r.maxRx - r.rx) * 16 * dt;
            r.ry = r.rx * 0.28;
            r.alpha -= dt * 4.5;
            if (r.alpha <= 0) this.jumpRings.splice(i, 1);
        }

        for (let i = this.slashArcs.length - 1; i >= 0; i--) {
            const sa = this.slashArcs[i];
            sa.life -= dt;
            sa.alpha = Math.max(0, sa.life / sa.maxLife);
            if (sa.life <= 0) this.slashArcs.splice(i, 1);
        }

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const ex = this.explosions[i];
            ex.scale += (ex.maxScale - ex.scale) * 18 * dt;
            ex.life -= dt;
            ex.alpha = Math.max(0, ex.life / ex.maxLife);
            if (ex.life <= 0) this.explosions.splice(i, 1);
        }

        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            const a = this.afterimages[i];
            a.alpha -= dt * 3.8;
            if (a.alpha <= 0) this.afterimages.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.vy *= 0.9;
            ft.life -= dt;
            ft.alpha = Math.min(1, ft.life * 3);
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    private resolveRoundByTimeout() {
        const p1Pct = this.p1.hp / this.p1.maxHp;
        const p2Pct = this.p2.hp / this.p2.maxHp;
        if (p1Pct >= p2Pct) {
            this.triggerKO("P1");
        } else {
            this.triggerKO("P2");
        }
    }

    private triggerKO(winnerSlot: "P1" | "P2") {
        if (this.gameState === "KO" || this.gameState === "GAMEOVER") return;
        this.gameState = "KO";
        this.koTimer = 2.2;
        this.winnerSlot = winnerSlot;
        this.winner = winnerSlot === "P1" ? this.p1.id : this.p2.id;
        if (winnerSlot === "P1") this.p1Rounds++;
        else this.p2Rounds++;
        this.publishSnapshot(true);
    }

    private resetRound() {
        this.p1.x = 380;
        this.p1.y = FLOOR_Y;
        this.p1.vx = 0;
        this.p1.vy = 0;
        this.p1.facing = 1;
        this.p1.hp = this.p1.maxHp;
        this.p1.jumpsLeft = this.p1.maxJumps;
        this.p1.state = "IDLE";
        this.p1.currentMove = "NONE";
        this.p1.moveLabel = "";
        this.p1.comboCount = 0;
        this.p1.rotation = 0;
        this.p1.spinAngle = 0;
        this.p1.attackCooldown = 0;

        this.p2.x = 900;
        this.p2.y = FLOOR_Y;
        this.p2.vx = 0;
        this.p2.vy = 0;
        this.p2.facing = -1;
        this.p2.hp = this.p2.maxHp;
        this.p2.jumpsLeft = this.p2.maxJumps;
        this.p2.state = "IDLE";
        this.p2.currentMove = "NONE";
        this.p2.moveLabel = "";
        this.p2.comboCount = 0;
        this.p2.rotation = 0;
        this.p2.spinAngle = 0;
        this.p2.attackCooldown = 0;

        this.projectiles = [];
        this.explosions = [];
        this.afterimages = [];
        this.slashArcs = [];
        this.jumpRings = [];
        this.timer = 90;
        this.introTimer = 1.2;
        this.gameState = "INTRO";
        this.winner = null;
        this.winnerSlot = null;
        this.publishSnapshot(true);
    }

    private getWhiteSilhouette(img: HTMLImageElement): HTMLCanvasElement | null {
        if (!img.complete || img.naturalWidth === 0) return null;
        const cached = this.whiteSpriteCache.get(img);
        if (cached) return cached;

        try {
            const off = document.createElement("canvas");
            off.width = img.naturalWidth;
            off.height = img.naturalHeight;
            const octx = off.getContext("2d");
            if (!octx) return null;

            octx.drawImage(img, 0, 0);
            octx.globalCompositeOperation = "source-in";
            octx.fillStyle = "#FFFFFF";
            octx.fillRect(0, 0, off.width, off.height);

            this.whiteSpriteCache.set(img, off);
            return off;
        } catch {
            return null;
        }
    }

    private getSpriteBounds(img: HTMLImageElement): SpriteBounds {
        const cached = this.boundsCache.get(img);
        if (cached) return cached;

        const w = img.naturalWidth || 512;
        const h = img.naturalHeight || 512;
        const fallback: SpriteBounds = {
            minX: 0,
            maxX: w,
            minY: 0,
            maxY: h,
            width: w,
            height: h,
            footX: w / 2,
        };

        if (!img.complete || img.naturalWidth === 0) return fallback;

        try {
            const sampleSize = 128;
            const off = document.createElement("canvas");
            off.width = sampleSize;
            off.height = sampleSize;
            const octx = off.getContext("2d");
            if (!octx) return fallback;

            octx.drawImage(img, 0, 0, sampleSize, sampleSize);
            const data = octx.getImageData(0, 0, sampleSize, sampleSize).data;

            let minX = sampleSize,
                maxX = 0,
                minY = sampleSize,
                maxY = 0;
            let found = false;

            for (let y = 0; y < sampleSize; y++) {
                for (let x = 0; x < sampleSize; x++) {
                    const alpha = data[(y * sampleSize + x) * 4 + 3];
                    if (alpha > 30) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                        found = true;
                    }
                }
            }

            if (!found) return fallback;

            const scaleX = w / sampleSize;
            const scaleY = h / sampleSize;
            const bounds: SpriteBounds = {
                minX: minX * scaleX,
                maxX: (maxX + 1) * scaleX,
                minY: minY * scaleY,
                maxY: (maxY + 1) * scaleY,
                width: Math.max(1, (maxX - minX + 1) * scaleX),
                height: Math.max(1, (maxY - minY + 1) * scaleY),
                footX: ((minX + maxX) / 2) * scaleX,
            };

            this.boundsCache.set(img, bounds);
            return bounds;
        } catch {
            return fallback;
        }
    }

    private render() {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const ctx = this.ctx;

        ctx.save();

        const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 1.8 : 0;
        const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 1.8 : 0;

        if (this.cameraZoom !== 1 || shakeX !== 0 || shakeY !== 0) {
            ctx.translate(W / 2 + shakeX, H / 2 + shakeY);
            ctx.scale(this.cameraZoom, this.cameraZoom);
            const camOffsetX = (this.cameraFocusX - W / 2) * (1 - 1 / this.cameraZoom);
            const camOffsetY = (this.cameraFocusY - H / 2) * (1 - 1 / this.cameraZoom);
            ctx.translate(-W / 2 - camOffsetX, -H / 2 - camOffsetY);
        }

        if (this.assets.bg && this.assets.bg.naturalWidth > 0) {
            ctx.drawImage(this.assets.bg, 0, 0, W, H);
        } else {
            ctx.fillStyle = "#14141A";
            ctx.fillRect(0, 0, W, H);
        }

        if (this.darkOverlayAlpha > 0) {
            ctx.fillStyle = `rgba(5, 5, 10, ${this.darkOverlayAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }

        for (const ghost of this.afterimages) {
            this.drawGhost(ghost);
        }

        this.drawFighter(this.p1, this.assets.p1Poses);
        this.drawFighter(this.p2, this.assets.p2Poses);

        const projImg = this.assets.projectile;
        for (const p of this.projectiles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            const dir = p.vx >= 0 ? 1 : -1;
            const pulse = 1 + Math.sin(performance.now() * 0.03) * 0.08;

            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 1.35 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = 1;

            if (projImg && projImg.naturalWidth > 0) {
                const bounds = this.getSpriteBounds(projImg);
                const targetSize = p.radius * 2.6 * pulse;
                const scale = targetSize / Math.max(1, bounds.height);

                ctx.scale(dir, 1);
                const drawW = projImg.naturalWidth * scale;
                const drawH = projImg.naturalHeight * scale;
                const centerX = ((bounds.minX + bounds.maxX) / 2) * scale;
                const centerY = ((bounds.minY + bounds.maxY) / 2) * scale;

                ctx.drawImage(projImg, -centerX, -centerY, drawW, drawH);
            } else {
                ctx.fillStyle = "#FFFFFF";
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const sa of this.slashArcs) {
            ctx.save();
            ctx.translate(sa.x, sa.y);
            ctx.scale(sa.facing, 1);
            ctx.rotate(sa.rotation);
            ctx.globalAlpha = sa.alpha;

            ctx.strokeStyle = sa.color;
            ctx.lineWidth = sa.thickness * sa.alpha;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.ellipse(0, 0, sa.radiusX, sa.radiusY, 0, sa.startAngle, sa.endAngle);
            ctx.stroke();

            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = Math.max(2, sa.thickness * 0.35 * sa.alpha);
            ctx.beginPath();
            ctx.ellipse(0, 0, sa.radiusX * 0.94, sa.radiusY * 0.94, 0, sa.startAngle + 0.1, sa.endAngle - 0.1);
            ctx.stroke();
            ctx.restore();
        }

        for (const r of this.jumpRings) {
            ctx.save();
            ctx.translate(r.x, r.y);
            ctx.rotate(r.tilt);
            ctx.strokeStyle = r.color;
            ctx.globalAlpha = Math.max(0, r.alpha);
            ctx.lineWidth = 4 * r.alpha;
            ctx.beginPath();
            ctx.ellipse(0, 0, r.rx, r.ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        const expImg = this.assets.explosion;
        for (const ex of this.explosions) {
            ctx.save();
            ctx.translate(ex.x, ex.y);
            ctx.rotate(ex.rotation);
            ctx.globalAlpha = ex.alpha;

            if (expImg && expImg.naturalWidth > 0) {
                const bounds = this.getSpriteBounds(expImg);
                const baseSize = 155 * ex.scale;
                const scale = baseSize / Math.max(1, bounds.height);

                const drawW = expImg.naturalWidth * scale;
                const drawH = expImg.naturalHeight * scale;
                const centerX = ((bounds.minX + bounds.maxX) / 2) * scale;
                const centerY = ((bounds.minY + bounds.maxY) / 2) * scale;

                ctx.drawImage(expImg, -centerX, -centerY, drawW, drawH);
            } else {
                ctx.fillStyle = ex.color;
                ctx.beginPath();
                ctx.arc(0, 0, 55 * ex.scale, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        for (const pt of this.particles) {
            ctx.save();
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = pt.alpha;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = `900 italic ${Math.round(26 * ft.scale)}px Orbitron, sans-serif`;
            ctx.textAlign = "center";
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#0A0A0D";
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }

        ctx.restore();
    }

    private drawGhost(g: AfterimageGhost) {
        if (!g.img || g.img.naturalWidth === 0) return;
        const ctx = this.ctx;
        const bounds = this.getSpriteBounds(g.img);
        const scale = TARGET_CHAR_HEIGHT / bounds.height;

        ctx.save();
        ctx.globalAlpha = g.alpha;
        ctx.translate(g.x, g.y);
        ctx.rotate(g.rotation);
        ctx.scale(g.facing * g.scaleX, g.scaleY);

        const drawW = g.img.naturalWidth * scale;
        const drawH = g.img.naturalHeight * scale;
        ctx.drawImage(g.img, -bounds.footX * scale, -bounds.maxY * scale, drawW, drawH);
        ctx.restore();
    }

    private drawFighter(f: FighterRuntime, poses: PoseSet) {
        const ctx = this.ctx;
        let img = poses.idle;
        if (f.state === "ATTACK") {
            const isSig = f.currentMove === "NSIG" || f.currentMove === "SSIG" || f.currentMove === "DSIG";
            img = isSig ? poses.cast || poses.attack : poses.attack || poses.idle;
        } else if (f.state === "DASH" || f.state === "RUN") {
            img = poses.dash || poses.idle;
        } else if (f.state === "DODGE") {
            img = poses.guard || poses.idle;
        } else if (f.state === "HITSTUN" || f.state === "KO") {
            img = poses.damaged || poses.idle;
        }

        const heightFromFloor = Math.max(0, FLOOR_Y - f.y);
        const shadowScale = Math.max(0.3, 1 - heightFromFloor / 450);

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
        ctx.beginPath();
        ctx.ellipse(f.x, FLOOR_Y + 6, 46 * shadowScale, 11 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = f.auraColor;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(f.x, FLOOR_Y + 6, 52 * shadowScale, 13 * shadowScale, 0, 0, Math.PI * 2);
        ctx.stroke();

        for (let j = 0; j < f.maxJumps; j++) {
            ctx.fillStyle = j < f.jumpsLeft ? f.auraColor : "rgba(255,255,255,0.2)";
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.arc(f.x - 14 + j * 14, FLOOR_Y + 23, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        if (!img || img.naturalWidth === 0) return;

        const bounds = this.getSpriteBounds(img);
        const scale = TARGET_CHAR_HEIGHT / bounds.height;
        const centerY = -TARGET_CHAR_HEIGHT * 0.5;

        ctx.save();
        ctx.translate(f.x + f.animOffsetX, f.y + f.animOffsetY);

        ctx.translate(0, centerY);
        ctx.rotate(f.rotation + f.spinAngle);
        ctx.scale(f.facing * f.scaleX, f.scaleY);
        ctx.translate(0, -centerY);

        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const offsetX = -bounds.footX * scale;
        const offsetY = -bounds.maxY * scale;

        if (f.invulnerableTimer > 0) {
            ctx.globalAlpha = 0.55;
        }

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        if (f.flashTimer > 0 || f.invulnerableTimer > 0) {
            const whiteCanvas = this.getWhiteSilhouette(img);
            if (whiteCanvas) {
                ctx.globalAlpha = f.flashTimer > 0 ? 0.75 : 0.35;
                ctx.drawImage(whiteCanvas, offsetX, offsetY, drawW, drawH);
            }
        }

        ctx.restore();

        if (f.isFastFalling) {
            ctx.save();
            ctx.strokeStyle = "#FFFFFF";
            ctx.globalAlpha = 0.65;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(f.x - 35, f.y - 40);
            ctx.lineTo(f.x - 35, f.y - 190);
            ctx.moveTo(f.x + 35, f.y - 40);
            ctx.lineTo(f.x + 35, f.y - 190);
            ctx.stroke();
            ctx.restore();
        }
    }

    private publishSnapshot(force = false) {
        if (this.isStopped) return;

        const hash = `${Math.ceil(this.p1.hp)}|${Math.ceil(this.p2.hp)}|${Math.floor(this.p1.energy)}|${this.p1.jumpsLeft}|${this.p1.moveLabel}|${this.p1.comboCount}|${this.p2.comboCount}|${Math.ceil(this.timer)}|${this.gameState}|${this.announceText}|${this.p1Rounds}|${this.p2Rounds}`;

        if (!force && hash === this.lastSnapHash && this.frameCount % 6 !== 0) {
            return;
        }
        this.lastSnapHash = hash;

        this.onSnapshot({
            p1: { ...this.p1 },
            p2: { ...this.p2 },
            p1MaxHp: this.p1.maxHp,
            p2MaxHp: this.p2.maxHp,
            maxHp: this.p1.maxHp,
            p1Rounds: this.p1Rounds,
            p2Rounds: this.p2Rounds,
            round: this.round,
            timer: this.timer,
            gameState: this.gameState,
            winner: this.winner,
            winnerSlot: this.winnerSlot,
            announceText: this.announceText,
            isTraining: this.isTraining,
        });
    }
}