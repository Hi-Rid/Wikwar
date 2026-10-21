export interface InputState {
    left: boolean; right: boolean; up: boolean; down: boolean;
    attack: boolean; guard: boolean; special: boolean; dash: boolean; ex: boolean; ultimate: boolean;
}

export interface FighterPoses {
    idle: HTMLImageElement;
    dash: HTMLImageElement;
    attack: HTMLImageElement;
    cast: HTMLImageElement;
    guard: HTMLImageElement;
    damaged: HTMLImageElement;
    xray: HTMLImageElement;
}

export interface Afterimage {
    x: number;
    y: number;
    facing: 1 | -1;
    scaleX: number;
    scaleY: number;
    alpha: number;
    sprite: HTMLImageElement;
}

export interface FighterState {
    id: string;
    x: number; y: number;
    groundY: number; // Lantai statis
    vx: number; vy: number;
    facing: 1 | -1;

    // State & Physics
    state: "idle" | "walk" | "jump" | "crouch" | "attack" | "dash" | "hitstun" | "xray";
    hp: number; maxHp: number; energy: number; isGrounded: boolean;

    // Combat
    attackTimer: number;
    hitstunTimer: number;
    hasHitThisAttack: boolean;
    comboCount: number;
    lastAttackTime: number;

    // Visual Properties (LERPed)
    scaleX: number; targetScaleX: number;
    scaleY: number; targetScaleY: number;
    rotation: number; targetRotation: number;
    visualOffsetY: number;
    flashAlpha: number;
    hueRotate: number;

    // Effects
    afterimages: Afterimage[];
    hitStopTimer: number; // Frame-based pause
    xrayTimer: number;

    // Assets
    poses: FighterPoses;
    width: number;
    height: number;
}

export interface BattleAssets {
    bg: HTMLImageElement;
    p1Poses: FighterPoses;
    p2Poses: FighterPoses;
    projectile: HTMLImageElement;
    explosion: HTMLImageElement;
}

export interface BattleSnapshot {
    p1: FighterState;
    p2: FighterState;
    timer: number;
    round: number;
    maxHp: number;
}