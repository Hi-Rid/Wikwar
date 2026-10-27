// src/data/schemas.ts
import { z } from 'zod';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'warna harus #RRGGBB');
const slug = z.string().regex(/^[a-z0-9-]+$/, 'id harus huruf kecil, angka, atau "-"');
const name = z.string().min(1);

export const specialIdSchema = z.enum(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']);
export const ultimateIdSchema = z.enum(['U1', 'U2', 'U3', 'U4', 'U5']);
export const passiveIdSchema = z.enum(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']);
export const roleSchema = z.enum(['Balanced', 'Rushdown', 'Zoner', 'Tank', 'Counter']);

/** Satu entri roster.json (10.1). `visual` tidak dipakai engine (untuk generator aset). */
export const characterSchema = z.object({
    id: slug,
    name,
    nickname: z.string().optional(),
    kelas: name,
    aura: hex,
    role: roleSchema,
    stats: z.object({
        hp: z.number().int().min(900).max(1150),
        speed: z.number().min(0.85).max(1.15),
        damage: z.number().min(0.95).max(1.05),
    }).strict(),
    special: z.object({ template: specialIdSchema, name }).strict(),
    ultimate: z.object({ template: ultimateIdSchema, name }).strict(),
    passive: passiveIdSchema,
    quote: name,
    winQuote: name,
    loseQuote: name,
    visual: z.string(),
}).strict();

export type CharacterData = z.infer<typeof characterSchema>;

export const rosterSchema = z.array(characterSchema).min(1).superRefine((list, ctx) => {
    const seen = new Set<string>();
    list.forEach((c, i) => {
        if (seen.has(c.id)) ctx.addIssue({ code: 'custom', path: [i, 'id'], message: `id ganda: ${c.id}` });
        seen.add(c.id);
    });
});

const moveRef = z.object({ template: z.union([specialIdSchema, ultimateIdSchema]), name }).strict();

/** bosses.json (10.4). `quirk` diisi belakangan oleh yang mengenal guru itu. */
export const bossSchema = z.object({
    id: slug,
    name,
    aura: hex,
    concept: z.string(),
    specials: z.tuple([moveRef, moveRef]),
    ultimate: moveRef,
    phase2Move: moveRef,
    dialog: z.object({
        intro: z.tuple([z.string(), z.string()]),
        phase2: z.string(),
        win: z.string(),
        lose: z.string(),
    }).strict(),
    quirk: z.string().nullable(),
}).strict();

export type BossData = z.infer<typeof bossSchema>;
export const bossesSchema = z.array(bossSchema).min(1);

/** stages/<id>/stage.json (14.4, 14.6). */
export const stageSchema = z.object({
    id: slug,
    name,
    floorTop: z.number().min(0.5).max(0.95),
    feetLine: z.number().min(0.5).max(0.95),
    shadowAlpha: z.number().min(0).max(1),
    layers: z.array(z.enum(['far', 'mid', 'near', 'floor', 'fg'])).min(2),
    bgm: z.string(),
}).strict().refine((s) => s.feetLine >= s.floorTop, { message: 'feetLine harus ≥ floorTop (kaki tidak boleh di atas lantai)' });

export type StageData = z.infer<typeof stageSchema>;

/** characters/<id>/sprites.json (16.4). */
export const spritesSchema = z.object({
    unitsPerPx: z.number().positive(),
    poses: z.record(z.string(), z.object({
        file: z.string().endsWith('.webp'),
        pivot: z.tuple([z.number(), z.number()]),
        offset: z.tuple([z.number(), z.number()]),
        scale: z.number().positive(),
        flags: z.array(z.enum(['lying'])).optional(),
    }).strict()),
}).strict().refine((s) => 'idle' in s.poses && 'portrait' in s.poses, { message: 'pose idle dan portrait wajib ada' });

/** characters/<id>/animations.json (16.4): id aksi -> daftar kunci. */
export const animationKeySchema = z.object({
    pose: z.string(),
    frames: z.number().int().positive(),
    ox: z.number().optional(), oy: z.number().optional(), rot: z.number().optional(),
    sx: z.number().optional(), sy: z.number().optional(),
    ease: z.enum(['linear', 'outQuad', 'outBack']).optional(),
}).strict();

export const animationsSchema = z.record(z.string(), z.array(animationKeySchema).min(1));