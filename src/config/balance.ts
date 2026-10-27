// src/config/balance.ts
import type { AiLevel, AttackDef, NormalId } from '@/types/game';

export const FPS = 60;
/** Detik -> frame (hanya untuk konfigurasi dan tampilan). */
export const sec = (s: number): number => Math.round(s * FPS);

// ---------- 7.1 Dunia dan fisika (nilai per detik; turunan per frame di bawah) ----------
export const WORLD = {
    width: 2000,
    minX: 60,
    maxX: 1940,
    startX: [800, 1200] as const,
    charHeight: 320,
    maxSeparation: 1000,
} as const;

export const HURTBOX = {
    stand: { w: 110, h: 320 },
    crouch: { w: 120, h: 176 },
    air: { w: 110, h: 280 },
} as const;
export const PUSHBOX = { halfW: 35, h: 180 } as const;

export const PHYSICS = {
    gravityPerSec2: 3000,
    jumpVyPerSec: 1300,
    jumpSpeedXPerSec: 300,
    airControl: 0.6,
    walkForwardPerSec: 320,
    walkBackPerSec: 260,
    guardWalkMult: 0.5,
    knockbackFrames: 10,
    landPushOutPerFrame: 8,
} as const;
export const GRAVITY = PHYSICS.gravityPerSec2 / FPS / FPS; // 0,8333 u/frame²
export const JUMP_VY = PHYSICS.jumpVyPerSec / FPS; // 21,67 u/frame

export const DASH = {
    ground: { startup: 2, active: 12, recovery: 10, speedPerSec: 900 },
    air: { startup: 2, active: 14, recovery: 8, speedPerSec: 1000 },
    cooldown: 72, // dibagi dash darat dan air dash (RL-09)
    projectileInvuln: { from: 0, to: 6 }, // "f1-6" 1-based = stateFrame 0..5
} as const;

export const STATE_FRAMES = {
    preJump: 4, land: 4, crouchDown: 3, standUp: 3, guardRelease: 6, parrySuccess: 10, parrySuccessFreeAt: 5,
} as const;

// ---------- 8.1 Combat global ----------
export const COMBAT = {
    hpDefault: 1000,
    stunMax: 100,
    energyMax: 100,
    inputBuffer: 6,
    chipRatio: 0.25,
    comboScale: [1, 1, 0.9, 0.8, 0.7, 0.6] as const, // indeks = urutan hit (0-based), hit ke-6+ pakai elemen terakhir
    skillCancelMult: 0.8, // EX/Ultimate lewat cancel, sekali per jurus
    cancelWindowTail: 6, // window: stateFrame ∈ [startup, startup + active + 6)
    hitStopBlock: 2,
    comboDisplayMin: 2,
    comboGradeCap: 10,
} as const;

export const PARRY = {
    window: 12,
    lock: 24,
    hitStop: 8,
    attackerStun: 48,
    counterWindow: 48,
    counterDamageMult: 1.25,
    counterStunAdd: 25,
    energyGain: 25,
    ultParriedStun: 90,
    reverseSpeedMult: 1.3,
} as const;

export const STUN = {
    decayPerFrame: 0.2, // 12 per detik
    decayDelay: 180,
    dizzyFrames: 150,
    dizzyMin: 90,
    dizzyCutPerPress: 6,
    immunityFrames: 180,
} as const;

export const ENERGY = {
    normalHit: 8, normalBlock: 4,
    specialHit: 12, specialBlock: 6,
    takeDamage: 5, takeDamageComboCap: 15,
    perfectParry: 25,
    exCost: 50, ultimateCost: 100,
} as const;

export const KNOCKDOWN = { fly: 24, down: 40, getUp: 30, arcHeight: 60 } as const;

export const ROUND = {
    frames: sec(60), // 3600
    introBanner: 72,
    roundEnd: 150,
    koSlowScale: 0.3,
    koSlowRealMs: 600,
    maxRounds: 4,
    winsNeeded: 2,
} as const;

// ---------- 8.2 Serangan normal (frame data 5/3/9 = startup/active/recovery) ----------
type AttackSeed = Omit<AttackDef, 'id' | 'state' | 'button' | 'stance'>;
const mk = (
    id: NormalId, state: AttackDef['state'], button: AttackDef['button'], stance: AttackDef['stance'], s: AttackSeed,
): AttackDef => ({ id, state, button, stance, ...s });

export const NORMALS: Readonly<Record<NormalId, AttackDef>> = {
    N1: mk('N1', 'N1Jab', 'N1', 'stand', { startup: 5, active: 3, recovery: 9, hitbox: { x: 30, y: 190, w: 75, h: 60 }, damage: 25, reaction: 'light', hitstun: 24, blockstun: 12, hitStop: 3, knockback: 60, stunAdd: 6, chip: 6, cooldown: 24, heavy: false, chainable: true }),
    N2: mk('N2', 'N2Hook', 'N2', 'stand', { startup: 7, active: 3, recovery: 11, hitbox: { x: 30, y: 140, w: 85, h: 90 }, damage: 35, reaction: 'light', hitstun: 26, blockstun: 14, hitStop: 4, knockback: 80, stunAdd: 8, chip: 8, cooldown: 30, heavy: false, chainable: true }),
    N3: mk('N3', 'N3LowKick', 'N3', 'stand', { startup: 8, active: 4, recovery: 13, hitbox: { x: 30, y: 15, w: 100, h: 70 }, damage: 35, reaction: 'light', hitstun: 28, blockstun: 15, hitStop: 4, knockback: 90, stunAdd: 8, chip: 8, cooldown: 34, heavy: false, chainable: true }),
    N4: mk('N4', 'N4Roundhouse', 'N4', 'stand', { startup: 11, active: 4, recovery: 22, hitbox: { x: 20, y: 110, w: 140, h: 150 }, damage: 60, reaction: 'knockdown', hitstun: 0, blockstun: 18, hitStop: 6, knockback: 220, stunAdd: 15, chip: 15, cooldown: 60, heavy: true, chainable: false }),
    C1: mk('C1', 'C1CrouchJab', 'N1', 'crouch', { startup: 6, active: 3, recovery: 10, hitbox: { x: 30, y: 90, w: 80, h: 55 }, damage: 20, reaction: 'light', hitstun: 24, blockstun: 12, hitStop: 3, knockback: 50, stunAdd: 6, chip: 5, cooldown: 26, heavy: false, chainable: true }),
    C2: mk('C2', 'C2CrouchHook', 'N2', 'crouch', { startup: 8, active: 3, recovery: 12, hitbox: { x: 30, y: 100, w: 90, h: 75 }, damage: 32, reaction: 'light', hitstun: 26, blockstun: 14, hitStop: 4, knockback: 70, stunAdd: 8, chip: 8, cooldown: 32, heavy: false, chainable: true }),
    C3: mk('C3', 'C3Sweep', 'N3', 'crouch', { startup: 10, active: 4, recovery: 20, hitbox: { x: 30, y: 0, w: 130, h: 45 }, damage: 45, reaction: 'knockdown', hitstun: 0, blockstun: 16, hitStop: 6, knockback: 120, stunAdd: 10, chip: 11, cooldown: 60, heavy: true, chainable: false }),
    C4: mk('C4', 'C4Uppercut', 'N4', 'crouch', { startup: 9, active: 4, recovery: 24, hitbox: { x: 20, y: 120, w: 80, h: 200 }, damage: 55, reaction: 'knockdown', hitstun: 0, blockstun: 14, hitStop: 6, knockback: 100, stunAdd: 15, chip: 13, cooldown: 60, heavy: true, chainable: false }),
    A1: mk('A1', 'A1AirJab', 'N1', 'air', { startup: 6, active: 5, recovery: 10, hitbox: { x: 30, y: 10, w: 80, h: 90 }, damage: 22, reaction: 'light', hitstun: 20, blockstun: 12, hitStop: 3, knockback: 60, stunAdd: 6, chip: 5, cooldown: 20, heavy: false, chainable: false }),
    A2: mk('A2', 'A2AirHook', 'N2', 'air', { startup: 7, active: 5, recovery: 12, hitbox: { x: 25, y: 60, w: 85, h: 120 }, damage: 28, reaction: 'light', hitstun: 22, blockstun: 13, hitStop: 4, knockback: 70, stunAdd: 8, chip: 7, cooldown: 26, heavy: false, chainable: false }),
    A3: mk('A3', 'A3AirKick', 'N3', 'air', { startup: 8, active: 6, recovery: 14, hitbox: { x: 30, y: 0, w: 110, h: 80 }, damage: 32, reaction: 'light', hitstun: 24, blockstun: 14, hitStop: 4, knockback: 90, stunAdd: 8, chip: 8, cooldown: 30, heavy: false, chainable: false }),
    // A4: active = sampai mendarat; `active` di sini hanya batas atas untuk validasi, gerak diatur DIVE.
    A4: mk('A4', 'A4DiveKick', 'N4', 'air', { startup: 9, active: 60, recovery: 10, hitbox: { x: 20, y: -50, w: 90, h: 120 }, damage: 50, reaction: 'knockdown', hitstun: 0, blockstun: 18, hitStop: 6, knockback: 140, stunAdd: 15, chip: 12, cooldown: 60, heavy: true, chainable: false }),
};
export const DIVE = { vxPerSec: 500, vyPerSec: 700, whiffLand: 12, contactLand: 4, tiltDeg: 35 } as const;
export const MAX_AIR_NORMALS = 2;

// ---------- 11.7 Grade ----------
export const GRADE = {
    weights: { win: 40, hp: 30, time: 10, combo: 10, parry: 10 },
    parryPoints: 2,
    parryCap: 5,
    secondsPerRound: 60,
    difficultyMult: { easy: 0.9, normal: 1.0, hard: 1.1, gelo: 1.2 } as const,
    thresholds: { S: 85, A: 70, B: 50 } as const, // di bawah B = C
    loseMaxGrade: 'C',
    continueMax: 3,
    continuePenalty: 10,
} as const;

// ---------- 12.2 AI ----------
export interface AiParams {
    reactionMin: number; reactionMax: number; minReactStartup: number;
    pEvadeProj: number; pEvadeMelee: number; pGuard: number; pParry: number;
    aggression: number; temperature: number; damageMult: number;
}
export const AI_LEVELS: Readonly<Record<AiLevel, AiParams>> = {
    easy: { reactionMin: 36, reactionMax: 54, minReactStartup: 14, pEvadeProj: 0.15, pEvadeMelee: 0.05, pGuard: 0.15, pParry: 0, aggression: 0.2, temperature: 1.5, damageMult: 0.85 },
    normal: { reactionMin: 21, reactionMax: 30, minReactStartup: 9, pEvadeProj: 0.5, pEvadeMelee: 0.15, pGuard: 0.4, pParry: 0.1, aggression: 0.4, temperature: 0.9, damageMult: 1.0 },
    hard: { reactionMin: 9, reactionMax: 15, minReactStartup: 6, pEvadeProj: 0.85, pEvadeMelee: 0.3, pGuard: 0.7, pParry: 0.35, aggression: 0.6, temperature: 0.5, damageMult: 1.1 },
    gelo: { reactionMin: 2, reactionMax: 5, minReactStartup: 4, pEvadeProj: 0.98, pEvadeMelee: 0.45, pGuard: 0.9, pParry: 0.65, aggression: 0.8, temperature: 0.25, damageMult: 1.25 },
};
export const AI_RULES = { decisionEvery: 4, parryCooldownHard: 180, stallFrames: 360, stallRampPerSec: 0.1, stallMaxBonus: 0.4 } as const;

// ---------- 3.8 Kualitas ----------
export const QUALITY = {
    low: { maxW: 1280, maxH: 720, particles: 0.5 },
    medium: { maxW: 1920, maxH: 1080, particles: 1.0 },
    high: { maxW: 2560, maxH: 1440, particles: 1.5 },
} as const;

// ---------- 10.1 Power budget ----------
/** poin = (hp-1000)/1000 + (speed-1) + (damage-1); harus berada di ±powerBudgetLimit. */
export const POWER_BUDGET = { limit: 0.1 } as const;
export const powerPoints = (s: { hp: number; speed: number; damage: number }): number =>
    (s.hp - 1000) / 1000 + (s.speed - 1) + (s.damage - 1);

// ---------- 14.x Kamera dan lantai ----------
export const VIEW = { height: 720, minWidth: 1240, maxWidth: 2000, floorScreenRatio: 0.87, zoomMax: 1.08, zoomMargin: 240 } as const;