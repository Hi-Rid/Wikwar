// src/config/balance.test.ts
import { describe, expect, it } from 'vitest';
import { rosterSchema } from '@/data/schemas';
import roster from '@/data/roster.json';
import {
    COMBAT, DASH, GRAVITY, JUMP_VY, KNOCKDOWN, NORMALS, PARRY, PHYSICS, POWER_BUDGET, ROUND, powerPoints,
} from './balance';

const CHAIN_IDS = ['N1', 'N2', 'N3', 'C1', 'C2'] as const;
const LONGEST_NEXT_STARTUP = NORMALS.N4.startup; // 11

describe('18.5: verifikasi balance', () => {
    it('true combo: hitstun >= active + 5 + startup terlama + 1', () => {
        for (const id of CHAIN_IDS) {
            const a = NORMALS[id];
            expect(a.hitstun, id).toBeGreaterThanOrEqual(a.active + 5 + LONGEST_NEXT_STARTUP + 1);
        }
    });

    it('chip = floor(0,25 x damage) untuk normal ringan, dan sesuai tabel untuk lainnya', () => {
        expect(Math.floor(COMBAT.chipRatio * NORMALS.N1.damage)).toBe(NORMALS.N1.chip);
        expect(Math.floor(COMBAT.chipRatio * NORMALS.N2.damage)).toBe(NORMALS.N2.chip);
        expect(Math.floor(COMBAT.chipRatio * NORMALS.N4.damage)).toBe(NORMALS.N4.chip);
    });

    it('cooldown tombol lebih besar dari durasi serangan (RL-33)', () => {
        for (const a of Object.values(NORMALS)) {
            if (a.stance === 'air') continue; // A4 active = sampai mendarat
            expect(a.cooldown, a.id).toBeGreaterThan(a.startup + a.active + a.recovery - 1);
        }
    });

    it('anchor: combo J-K-L-; = 139 damage', () => {
        const seq = [NORMALS.N1, NORMALS.N2, NORMALS.N3, NORMALS.N4];
        const total = seq.reduce((sum, a, i) => sum + Math.floor(a.damage * (COMBAT.comboScale[i] ?? 0.6)), 0);
        expect(total).toBe(139);
    });

    it('anchor: fisika lompat dan dash', () => {
        let y = 0, vy = JUMP_VY, frames = 0, peak = 0;
        do { vy -= GRAVITY; y += vy; frames++; peak = Math.max(peak, y); } while (y > 0);
        expect(Math.abs(frames - 52)).toBeLessThanOrEqual(1);
        expect(Math.abs(peak - 271)).toBeLessThanOrEqual(2);
        expect((DASH.ground.active * DASH.ground.speedPerSec) / 60).toBeCloseTo(180, 5);
        expect((DASH.air.active * DASH.air.speedPerSec) / 60).toBeCloseTo(233.33, 1);
        expect(PHYSICS.walkForwardPerSec).toBe(320);
    });

    it('anchor: knockdown, parry, ronde', () => {
        expect(KNOCKDOWN.fly + KNOCKDOWN.down + KNOCKDOWN.getUp).toBe(94);
        expect([PARRY.window, PARRY.lock, PARRY.counterWindow]).toEqual([12, 24, 48]);
        expect(ROUND.frames).toBe(3600);
    });

    it('roster.json lolos schema dan power budget serta warna aura Ridho & Steven sesuai', () => {
        const parsed = rosterSchema.parse(roster);
        for (const c of parsed) {
            expect(Math.abs(powerPoints(c.stats)), c.id).toBeLessThanOrEqual(POWER_BUDGET.limit + 1e-9);
        }
        const ridho = parsed.find((c) => c.id === 'ridho');
        const steven = parsed.find((c) => c.id === 'steven');
        expect(ridho?.aura).toBe('#FF3B3B');
        expect(steven?.aura).toBe('#FF6A00');
    });
});