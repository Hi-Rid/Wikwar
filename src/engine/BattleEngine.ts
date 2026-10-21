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

interface SpriteBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    footX: number;
}

interface FighterRuntime {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: 1 | -1;
    hp: number;
    energy: number;
    state: "IDLE" | "WALK" | "JUMP" | "CROUCH" | "DASH" | "ATTACK" | "CAST" | "GUARD" | "HITSTUN" | "KO";
    stateTimer: number;
    comboCount: number;
    attackCooldown: number;
    dashCooldown: number;
    hitRegistered: boolean;
}

const LOGICAL_HEIGHT = 720;
const FLOOR_Y = 560; // Disesuaikan agar tapak kaki pas di lapangan
const TARGET_CHAR_HEIGHT = 260; // Tinggi konsisten karakter di layar
const GRAVITY = 2500;
const JUMP_V0 = 950;

export class BattleEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private assets: BattleAssets;
    private onSnapshot: (snap: any) => void;

    private p1: FighterRuntime;
    private p2: FighterRuntime;
    private maxHp = 1000;
    private p1Rounds = 0;
    private p2Rounds = 0;
    private round = 1;
    private timer = 60;
    private gameState: "FIGHTING" | "KO" | "GAMEOVER" = "FIGHTING";
    private winner: string | null = null;
    private koTimer = 0;

    private keys = new Set<string>();
    private justPressed = new Set<string>();
    private boundsCache = new WeakMap<HTMLImageElement, SpriteBounds>();

    private rafId: number | null = null;
    private lastTime = 0;
    private accumulator = 0;
    private frameCount = 0;

    private handleKeyDown = (e: KeyboardEvent) => {
        if (!this.keys.has(e.code)) {
            this.justPressed.add(e.code);
        }
        this.keys.add(e.code);
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        this.keys.delete(e.code);
    };

    private handleBlur = () => {
        this.keys.clear();
        this.justPressed.clear();
    };

    constructor(
        canvas: HTMLCanvasElement,
        assets: BattleAssets,
        p1Id: string,
        p2Id: string,
        onSnapshot: (snap: any) => void
    ) {
        this.canvas = canvas;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas 2D context not available");
        this.ctx = context;
        this.assets = assets;
        this.onSnapshot = onSnapshot;

        this.p1 = this.createFighter(p1Id, 400, 1);
        this.p2 = this.createFighter(p2Id, 880, -1);
    }

    private createFighter(id: string, startX: number, facing: 1 | -1): FighterRuntime {
        return {
            id,
            x: startX,
            y: FLOOR_Y,
            vx: 0,
            vy: 0,
            facing,
            hp: this.maxHp,
            energy: 0,
            state: "IDLE",
            stateTimer: 0,
            comboCount: 0,
            attackCooldown: 0,
            dashCooldown: 0,
            hitRegistered: false,
        };
    }

    public start() {
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
        window.addEventListener("blur", this.handleBlur);

        this.lastTime = performance.now();
        this.publishSnapshot();
        this.rafId = requestAnimationFrame(this.loop);
    }

    public stop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
        window.removeEventListener("blur", this.handleBlur);
    }

    private loop = (now: number) => {
        const FIXED_DT = 1 / 60;
        let frameTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (frameTime > FIXED_DT * 5) frameTime = FIXED_DT * 5;

        this.accumulator += frameTime;
        while (this.accumulator >= FIXED_DT) {
            this.step(FIXED_DT);
            this.accumulator -= FIXED_DT;
        }

        this.render();
        this.rafId = requestAnimationFrame(this.loop);
    };

    private step(dt: number) {
        this.frameCount++;

        if (this.gameState === "FIGHTING") {
            this.timer = Math.max(0, this.timer - dt);
            if (this.timer <= 0) {
                this.resolveRoundByTimeout();
            }

            this.updatePlayerInput(this.p1, this.p2, dt);
            this.updateSimpleAI(this.p2, this.p1, dt);

            this.updatePhysics(this.p1, this.p2, dt);
            this.updatePhysics(this.p2, this.p1, dt);
            this.resolvePushboxAndFacing();
            this.checkHitCollision(this.p1, this.p2);
            this.checkHitCollision(this.p2, this.p1);
        } else if (this.gameState === "KO") {
            this.koTimer -= dt;
            this.updatePhysics(this.p1, this.p2, dt);
            this.updatePhysics(this.p2, this.p1, dt);
            if (this.koTimer <= 0) {
                if (this.p1Rounds >= 2 || this.p2Rounds >= 2) {
                    this.gameState = "GAMEOVER";
                } else {
                    this.round++;
                    this.resetRound();
                }
            }
        }

        this.justPressed.clear();

        if (this.frameCount % 2 === 0) {
            this.publishSnapshot();
        }
    }

    private updatePlayerInput(f: FighterRuntime, opp: FighterRuntime, dt: number) {
        if (f.state === "HITSTUN" || f.state === "KO") return;

        const isGrounded = f.y >= FLOOR_Y;
        const canAct = f.state === "IDLE" || f.state === "WALK" || f.state === "CROUCH";

        if (canAct && isGrounded && this.keys.has("KeyK")) {
            f.state = "GUARD";
            f.vx = 0;
            return;
        }
        if (f.state === "GUARD" && !this.keys.has("KeyK")) {
            f.state = "IDLE";
        }

        if (canAct && isGrounded && f.dashCooldown <= 0 && this.justPressed.has("KeyU")) {
            f.state = "DASH";
            f.stateTimer = 0.2;
            f.dashCooldown = 1.2;
            let dir: number = f.facing;
            if (this.keys.has("KeyA")) dir = -1;
            else if (this.keys.has("KeyD")) dir = 1;
            f.vx = dir * 820;
            return;
        }

        if (canAct && f.attackCooldown <= 0 && this.justPressed.has("KeyJ")) {
            f.state = "ATTACK";
            f.stateTimer = 0.28;
            f.attackCooldown = 0.32;
            f.hitRegistered = false;
            f.vx = f.facing * 90;
            return;
        }

        if (canAct && isGrounded && this.justPressed.has("KeyL")) {
            f.state = "CAST";
            f.stateTimer = 0.38;
            f.hitRegistered = false;
            f.vx = 0;
            return;
        }

        if (canAct && isGrounded) {
            if (this.keys.has("KeyW")) {
                f.state = "JUMP";
                f.vy = -JUMP_V0;
                return;
            }
            if (this.keys.has("KeyS")) {
                f.state = "CROUCH";
                f.vx = 0;
                return;
            }

            const moveDir = (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0);
            if (moveDir !== 0) {
                f.state = "WALK";
                const speed = moveDir === f.facing ? 320 : 260;
                f.vx = moveDir * speed;
            } else {
                f.state = "IDLE";
                f.vx = 0;
            }
        } else if (!isGrounded && f.state === "JUMP") {
            const moveDir = (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0);
            f.vx = moveDir * 220;
        }
    }

    private updateSimpleAI(ai: FighterRuntime, player: FighterRuntime, dt: number) {
        if (ai.state === "HITSTUN" || ai.state === "KO") return;
        const canAct = ai.state === "IDLE" || ai.state === "WALK";
        if (!canAct) return;

        const dist = Math.abs(player.x - ai.x);
        if (dist > 145) {
            ai.state = "WALK";
            ai.vx = ai.facing * 240;
        } else {
            ai.vx = 0;
            if (ai.attackCooldown <= 0 && Math.random() < 0.06) {
                ai.state = "ATTACK";
                ai.stateTimer = 0.3;
                ai.attackCooldown = 0.65;
                ai.hitRegistered = false;
            } else {
                ai.state = "IDLE";
            }
        }
    }

    private updatePhysics(f: FighterRuntime, opp: FighterRuntime, dt: number) {
        if (f.attackCooldown > 0) f.attackCooldown = Math.max(0, f.attackCooldown - dt);
        if (f.dashCooldown > 0) f.dashCooldown = Math.max(0, f.dashCooldown - dt);

        if (f.stateTimer > 0) {
            f.stateTimer -= dt;
            if (f.stateTimer <= 0 && f.state !== "KO") {
                if (f.state === "HITSTUN") opp.comboCount = 0;
                f.state = f.y < FLOOR_Y ? "JUMP" : "IDLE";
                f.vx = 0;
            }
        }

        f.x += f.vx * dt;
        f.y += f.vy * dt;

        // Pastikan posisi y tidak jatuh tembus ke bawah lantai
        if (f.y < FLOOR_Y) {
            f.vy += GRAVITY * dt;
        }

        if (f.y >= FLOOR_Y) {
            f.y = FLOOR_Y;
            f.vy = 0;
            if (f.state === "JUMP") {
                f.state = "IDLE";
                f.vx = 0;
            }
        }

        const maxW = this.canvas.width || 1280;
        f.x = Math.max(90, Math.min(maxW - 90, f.x));
    }

    private resolvePushboxAndFacing() {
        const minDistance = 100;
        const dx = this.p2.x - this.p1.x;
        if (Math.abs(dx) < minDistance && this.p1.y >= FLOOR_Y && this.p2.y >= FLOOR_Y) {
            const overlap = (minDistance - Math.abs(dx)) / 2;
            const sign = dx >= 0 ? 1 : -1;
            this.p1.x -= sign * overlap;
            this.p2.x += sign * overlap;
        }

        if (this.p1.state !== "DASH" && this.p1.state !== "ATTACK") {
            this.p1.facing = this.p2.x >= this.p1.x ? 1 : -1;
        }
        if (this.p2.state !== "DASH" && this.p2.state !== "ATTACK") {
            this.p2.facing = this.p1.x >= this.p2.x ? 1 : -1;
        }
    }

    private checkHitCollision(att: FighterRuntime, def: FighterRuntime) {
        if ((att.state !== "ATTACK" && att.state !== "CAST") || att.hitRegistered) return;
        if (def.state === "KO") return;

        const reach = att.state === "CAST" ? 170 : 130;
        const dist = (def.x - att.x) * att.facing;
        const yDiff = Math.abs(att.y - def.y);

        if (dist > 0 && dist <= reach && yDiff < 140) {
            att.hitRegistered = true;
            const baseDmg = att.state === "CAST" ? 90 : 40;
            const isGuarding = def.state === "GUARD";
            const finalDmg = isGuarding ? Math.floor(baseDmg * 0.25) : baseDmg;

            def.hp = Math.max(isGuarding ? 1 : 0, def.hp - finalDmg);
            att.energy = Math.min(100, att.energy + (isGuarding ? 4 : 10));
            def.energy = Math.min(100, def.energy + 5);

            if (!isGuarding) {
                att.comboCount++;
                def.state = "HITSTUN";
                def.stateTimer = 0.32;
                def.vx = att.facing * 120;
            }

            if (def.hp <= 0) {
                def.state = "KO";
                def.vx = att.facing * 180;
                this.triggerKO(att.id);
            }
        }
    }

    private resolveRoundByTimeout() {
        if (this.p1.hp >= this.p2.hp) {
            this.triggerKO(this.p1.id);
        } else {
            this.triggerKO(this.p2.id);
        }
    }

    private triggerKO(winnerId: string) {
        this.gameState = "KO";
        this.koTimer = 2.5;
        this.winner = winnerId;
        if (winnerId === this.p1.id) this.p1Rounds++;
        else this.p2Rounds++;
        this.publishSnapshot();
    }

    private resetRound() {
        this.p1 = this.createFighter(this.p1.id, 400, 1);
        this.p2 = this.createFighter(this.p2.id, 880, -1);
        this.timer = 60;
        this.gameState = "FIGHTING";
        this.winner = null;
        this.publishSnapshot();
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

        ctx.clearRect(0, 0, W, H);

        if (this.assets.bg && this.assets.bg.naturalWidth > 0) {
            ctx.drawImage(this.assets.bg, 0, 0, W, H);
        } else {
            ctx.fillStyle = "#14141A";
            ctx.fillRect(0, 0, W, H);
        }

        this.drawFighter(this.p1, this.assets.p1Poses);
        this.drawFighter(this.p2, this.assets.p2Poses);
    }

    private drawFighter(f: FighterRuntime, poses: PoseSet) {
        const ctx = this.ctx;
        let img = poses.idle;
        if (f.state === "ATTACK") img = poses.attack || poses.idle;
        else if (f.state === "DASH") img = poses.dash || poses.idle;
        else if (f.state === "CAST") img = poses.cast || poses.idle;
        else if (f.state === "GUARD") img = poses.guard || poses.idle;
        else if (f.state === "HITSTUN" || f.state === "KO") img = poses.damaged || poses.idle;

        // Bayangan proporsional di lantai berdasarkan posisi lompat
        const heightFromFloor = Math.max(0, FLOOR_Y - f.y);
        const shadowScale = Math.max(0.5, 1 - heightFromFloor / 300);

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(f.x, FLOOR_Y + 10, 45 * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (!img || img.naturalWidth === 0) return;

        const bounds = this.getSpriteBounds(img);
        const scale = TARGET_CHAR_HEIGHT / bounds.height;

        const now = performance.now() / 1000;
        const bobOffset = f.state === "IDLE" ? Math.sin(now * 5) * 2 : 0;
        const crouchScaleY = f.state === "CROUCH" ? 0.65 : 1.0;
        const crouchScaleX = f.state === "CROUCH" ? 1.05 : 1.0;

        ctx.save();
        ctx.translate(f.x, f.y + bobOffset);
        ctx.scale(f.facing * crouchScaleX, crouchScaleY);

        if (f.state === "KO") {
            ctx.rotate(-Math.PI / 2);
        }

        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const offsetX = -bounds.footX * scale;
        const offsetY = -bounds.maxY * scale;

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        ctx.restore();
    }

    private publishSnapshot() {
        this.onSnapshot({
            p1: { ...this.p1 },
            p2: { ...this.p2 },
            maxHp: this.maxHp,
            p1Rounds: this.p1Rounds,
            p2Rounds: this.p2Rounds,
            round: this.round,
            timer: this.timer,
            gameState: this.gameState,
            winner: this.winner,
        });
    }
}