// src/types/game.ts

// ---------- A.2 Dasar dan engine ----------
export type Frames = number; // bilangan bulat; 60 frame = 1 detik
export type Units = number; // unit dunia; y = 0 lantai, y ke ATAS
export type FighterIndex = 0 | 1;
export type Facing = 1 | -1; // 1 = menghadap kanan (+x)

export interface Vec2 {
    x: Units;
    y: Units;
}

/** y = sisi BAWAH kotak. */
export interface Box {
    x: Units;
    y: Units;
    w: Units;
    h: Units;
}

/** Untuk switch yang harus exhaustive. */
export function assertNever(x: never): never {
    throw new Error(`Kasus tidak ditangani: ${String(x)}`);
}

export type Phase = 'RoundIntro' | 'Fighting' | 'KO' | 'RoundEnd' | 'MatchEnd';

// ---------- A.3 Input ----------
export const ACTIONS = [
    'Left', 'Right', 'Up', 'Down',
    'N1', 'N2', 'N3', 'N4',
    'Guard', 'Dash', 'Special', 'EX', 'Ultimate', 'Pause',
] as const;

export type Action = (typeof ACTIONS)[number];
export type GameAction = Exclude<Action, 'Pause'>;

export const actionBit = (a: Action): number => 1 << ACTIONS.indexOf(a);

/** Bitmask menurut indeks ACTIONS. pressed = tepi naik pada frame ini. */
export interface InputFrame {
    readonly held: number;
    readonly pressed: number;
    readonly released: number;
}

export const EMPTY_INPUT: InputFrame = { held: 0, pressed: 0, released: 0 };

/** Aksi game -> event.code (mis. 'KeyJ', 'Semicolon', 'Space'). */
export type ControlMap = Readonly<Record<GameAction, string>>;

/** Skrip test: hold-semantics (lihat 18.2). */
export interface InputScriptStep {
    f: Frames;
    p1?: readonly Action[];
    p2?: readonly Action[];
}

// ---------- A.4 State dan serangan ----------
export const STATE_IDS = [
    // Locomotion (14)
    'Idle', 'WalkForward', 'WalkBack', 'CrouchDown', 'Crouch', 'StandUp', 'PreJump', 'JumpRise',
    'JumpFall', 'Land', 'DashForward', 'DashBack', 'AirDashForward', 'AirDashBack',
    // Normal (13)
    'N1Jab', 'N2Hook', 'N3LowKick', 'N4Roundhouse', 'C1CrouchJab', 'C2CrouchHook', 'C3Sweep',
    'C4Uppercut', 'A1AirJab', 'A2AirHook', 'A3AirKick', 'A4DiveKick', 'DiveLand',
    // Skill (7)
    'Special', 'SpecialEX', 'UltFreeze', 'UltStartup', 'UltActive', 'UltRecovery', 'GrabHold',
    // Defense (7)
    'Parry', 'Guard', 'GuardCrouch', 'GuardRelease', 'BlockstunStand', 'BlockstunCrouch', 'ParrySuccess',
    // Reaksi (11)
    'HitstunLight', 'HitstunHeavy', 'HitstunCrouch', 'KnockdownFly', 'Down', 'GetUp', 'Dizzy',
    'ParryStunned', 'UltParried', 'XRayHit', 'Grabbed',
    // Pertandingan (5)
    'Intro', 'Win', 'Lose', 'KOFly', 'KODown',
] as const;

export type StateId = (typeof STATE_IDS)[number]; // 57 state

export type StateCategory = 'locomotion' | 'normal' | 'skill' | 'defense' | 'reaction' | 'match';
export type HurtboxKind = 'stand' | 'crouch' | 'air' | 'none';
export type InvulnKind = 'all' | 'projectile' | 'upperBody';

/** Dalam stateFrame; `to` eksklusif. Prosa PRD "f1-6" (1-based) = from 0, to 6. */
export interface InvulnRange {
    kind: InvulnKind;
    from: Frames;
    to: Frames;
}

export type ActionGroup =
    | 'move' | 'jump' | 'crouch' | 'normal' | 'guard' | 'dash' | 'special' | 'ex' | 'ultimate';

/** 'attack' = dari AttackDef; 'template' = dari template skill; 'cinematic' = diatur cinematic. */
export type Duration = Frames | 'hold' | 'untilLand' | 'attack' | 'template' | 'cinematic';

export interface StateDef {
    id: StateId;
    category: StateCategory;
    hurtbox: HurtboxKind;
    pushbox: boolean;
    gravity: boolean;
    canAct: boolean; // menerima aksi baru (6.1)
    allow: readonly ActionGroup[]; // aksi yang boleh dimulai dari state ini (6.3)
    invuln: readonly InvulnRange[];
    facing: 'auto' | 'locked';
    duration: Duration;
}

/** Hitbox: x = jarak titik tengah fighter ke SISI DEKAT kotak (searah hadap), y = sisi bawah dari lantai/kaki. */
export type HitboxDef = Box;
export type NormalId = 'N1' | 'N2' | 'N3' | 'N4' | 'C1' | 'C2' | 'C3' | 'C4' | 'A1' | 'A2' | 'A3' | 'A4';
export type Button = 'N1' | 'N2' | 'N3' | 'N4';
export type HitReaction = 'light' | 'heavy' | 'knockdown';

export interface AttackDef {
    id: NormalId;
    state: StateId;
    button: Button;
    stance: 'stand' | 'crouch' | 'air';
    startup: Frames;
    active: Frames;
    recovery: Frames;
    hitbox: HitboxDef;
    damage: number;
    reaction: HitReaction; // 'knockdown' = target darat juga jatuh
    hitstun: Frames; // 0 bila knockdown
    blockstun: Frames;
    hitStop: Frames;
    knockback: Units;
    stunAdd: number;
    chip: number;
    cooldown: Frames; // per tombol (RL-33)
    heavy: boolean; // armor tidak menahan
    chainable: boolean; // punya cancel window (RL-34)
}

// ---------- A.5 Event, snapshot, API engine ----------
export type SwingWeight = 'light' | 'mid' | 'heavy';
export type HitStyle = 'light' | 'medium' | 'heavy' | 'projectile' | 'special' | 'ultimate';
export type SkillKind = 'special' | 'ex' | 'ultimate';

interface EventBase {
    frame: number; // indeks step yang menghasilkan event ini
}

export type GameEvent =
    | (EventBase & { type: 'RoundStart'; round: number; final: boolean })
    | (EventBase & { type: 'Fight' })
    | (EventBase & { type: 'Jump'; fighter: FighterIndex })
    | (EventBase & { type: 'Land'; fighter: FighterIndex })
    | (EventBase & { type: 'Dash'; fighter: FighterIndex; air: boolean })
    | (EventBase & { type: 'Swing'; fighter: FighterIndex; attackId: string; weight: SwingWeight })
    | (EventBase & {
        type: 'Hit'; attacker: FighterIndex; victim: FighterIndex; attackId: string; style: HitStyle;
        damage: number; comboHit: number; counter: boolean; knockdown: boolean; pos: Vec2;
    })
    | (EventBase & {
        type: 'Block'; attacker: FighterIndex; defender: FighterIndex; attackId: string; chip: number; pos: Vec2;
    })
    | (EventBase & { type: 'Parry'; defender: FighterIndex; attacker: FighterIndex; onProjectile: boolean; pos: Vec2 })
    | (EventBase & { type: 'Reverse'; fighter: FighterIndex; projectileId: number })
    | (EventBase & { type: 'ArmorHit'; fighter: FighterIndex })
    | (EventBase & { type: 'SkillCast'; fighter: FighterIndex; kind: SkillKind; template: string })
    | (EventBase & { type: 'ProjectileSpawn'; id: number; owner: FighterIndex; template: string })
    | (EventBase & { type: 'ProjectileClash'; a: number; b: number })
    | (EventBase & { type: 'UltFreeze'; fighter: FighterIndex; template: UltimateId })
    | (EventBase & { type: 'XRay'; attacker: FighterIndex; victim: FighterIndex; kind: 'ultimate' | 'ex' })
    | (EventBase & { type: 'Dizzy'; fighter: FighterIndex })
    | (EventBase & { type: 'DizzyEnd'; fighter: FighterIndex })
    | (EventBase & { type: 'EnergyReady'; fighter: FighterIndex; level: 50 | 100 })
    | (EventBase & { type: 'CooldownReady'; fighter: FighterIndex; which: 'special' | 'ex' | 'dash' })
    | (EventBase & { type: 'Combo'; owner: FighterIndex; hits: number; damage: number })
    | (EventBase & { type: 'KO'; victim: FighterIndex })
    | (EventBase & {
        type: 'RoundEnd'; winner: FighterIndex | null; reason: 'KO' | 'TimeOver' | 'Draw'; perfect: boolean;
    })
    | (EventBase & { type: 'MatchEnd'; winner: FighterIndex | null });

export type GameEventType = GameEvent['type'];

export interface CooldownSnapshot {
    n1: Frames; n2: Frames; n3: Frames; n4: Frames; special: Frames; ex: Frames; dash: Frames;
}

export interface FighterSnapshot {
    index: FighterIndex;
    characterId: string;
    x: Units;
    y: Units;
    facing: Facing;
    state: StateId;
    stateFrame: Frames;
    hp: number;
    hpMax: number;
    stun: number;
    stunMax: number;
    energy: number;
    cooldowns: CooldownSnapshot;
    comboHits: number;
    comboDamage: number;
    counterWindow: Frames;
    parryLock: Frames;
    dizzyLeft: Frames;
    roundsWon: number;
}

export interface ProjectileSnapshot {
    id: number; owner: FighterIndex; template: string; x: Units; y: Units; w: Units; h: Units; vx: number; reflected: boolean;
}

export interface CinematicSnapshot {
    kind: 'ultimate' | 'ex';
    attacker: FighterIndex;
    victim: FighterIndex | null;
    stage: 'freeze' | 'xray';
    frame: Frames;
    total: Frames;
}

export interface BattleSnapshot {
    frame: number;
    phase: Phase;
    round: number;
    roundFramesLeft: Frames | null; // null = tanpa batas (Training)
    freeze: Frames;
    fighters: readonly [FighterSnapshot, FighterSnapshot];
    projectiles: readonly ProjectileSnapshot[];
    cinematic: CinematicSnapshot | null;
}

export type AiLevel = 'easy' | 'normal' | 'hard' | 'gelo';

export interface FighterSetup {
    characterId: string;
    control: 'human' | 'ai';
    aiLevel?: AiLevel;
    /** Hanya untuk test dan Training. */
    start?: Partial<{ x: Units; hp: number; energy: number; stun: number }>;
}

export interface MatchConfig {
    seed: number;
    p1: FighterSetup;
    p2: FighterSetup;
    mode: 'training' | 'quick' | 'arcade' | 'boss';
    roundFrames: Frames | null; // null = Training (tanpa batas)
}

/**
 * Kontrak engine headless. `step` dipanggil tepat 60x per detik oleh platform (atau bebas oleh test).
 * Array event yang dikembalikan DIPAKAI ULANG pada step berikutnya: salin bila perlu disimpan.
 */
export interface BattleEngine {
    step(inputs: readonly [InputFrame, InputFrame]): readonly GameEvent[];
    snapshot(): BattleSnapshot;
    readonly frame: number;
}

// Port: diimplementasikan di platform (browser) dan stub di Node. Sim tidak memanggilnya.
export interface InputSource {
    read(index: FighterIndex): InputFrame;
}
export interface AudioPort {
    handle(event: GameEvent): void;
}
export interface FxPort {
    handle(event: GameEvent): void;
}

// ---------- A.6 Template skill ----------
export type SpecialId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8';
export type UltimateId = 'U1' | 'U2' | 'U3' | 'U4' | 'U5';
export type PassiveId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'none'; // 'none' hanya fixture test

export interface SkillHit {
    damage: number;
    chip: number;
    stunAdd: number;
    reaction: HitReaction;
    hitstun: Frames;
    knockback: Units;
    hitStop: Frames;
    energyHit: number;
    energyBlock: number;
}

export interface ProjectileSpec {
    box: Box; // w, h, y (dari lantai/kaki); x diabaikan (pakai spawnOffset)
    spawnOffset: Units;
    speed: Units; // u per frame
    lifetime: Frames;
    maxActive: number;
    pierceSmall: boolean; // menembus proyektil kecil (S2, S5)
    canBeParried: boolean;
    hits: number;
    hitInterval: Frames;
}

export interface AiHints {
    rangeMin: Units;
    rangeMax: Units;
    use: string;
    bait?: string;
}

export type SpecialKind =
    | 'projectile' | 'wave' | 'rising' | 'lunge' | 'groundWave' | 'counter' | 'teleport' | 'multiShot';

export interface SpecialDef {
    id: SpecialId;
    defaultName: string;
    kind: SpecialKind;
    startup: Frames;
    active: Frames;
    recovery: Frames;
    cooldown: Frames;
    hits: readonly SkillHit[]; // 1 elemen; S2 punya 2
    hitbox?: HitboxDef; // serangan jarak dekat (S3, S4, S6 balasan, S7)
    projectile?: ProjectileSpec;
    shotFrames?: readonly Frames[]; // S8: frame spawn relatif ke state
    motion?: { distance: Units; frames: Frames; stopOnContact: boolean };
    invuln: readonly InvulnRange[];
    armor?: { from: Frames; to: Frames; hits: number };
    ai: AiHints;
    vfx: string;
    sfx: readonly string[];
}

export type UltimateKind = 'beam' | 'storm' | 'barrage' | 'slam' | 'grab';

export interface UltimateDef {
    id: UltimateId;
    defaultName: string;
    kind: UltimateKind;
    freeze: Frames; // 30
    startup: Frames;
    active: Frames;
    recovery: Frames;
    recoveryWhiff?: Frames; // U5: 50
    hitCount: number; // U3 = 7
    hitInterval?: Frames; // U3 = 6
    hit: SkillHit; // per hit
    hitbox: HitboxDef;
    motion?: { distance: Units; frames: Frames };
    guardable: boolean; // U5 = false
    beatsInvuln: boolean; // U5 = true (RL-39)
    ai: AiHints;
    vfx: string;
    sfx: readonly string[];
}

export interface PassiveDef {
    id: Exclude<PassiveId, 'none'>;
    defaultName: string;
    effect: {
        stunTakenMult?: number; // P1: 0.8
        energyGainMult?: number; // P2: 1.25 (hanya dari serangan)
        comboHitDamageMult?: { hits: readonly number[]; mult: number }; // P3: hit 3 dan 4, 1.15
        lowHpDamageMult?: { belowHpRatio: number; mult: number }; // P4: 0.25, 1.15
        parryWindow?: Frames; // P5: 14
        parryEnergy?: number; // P5: 30
        dashCooldownMult?: number; // P6: 0.75
        specialCooldownMult?: number; // P7: 0.8
    };
}