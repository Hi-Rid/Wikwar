# Progress WIKWAR

Satu-satunya "memori proyek" di antara chat AI. Centang `[x]` setelah tugas lolos (lint, typecheck, test hijau, sudah di-commit). Detail tiap tugas (bagian PRD yang di-paste dan kriteria selesai) ada di PRD 21.6.

## Fase R: Rescue game lama (PRD 21.1)

- [ ] 0 Amankan game lama (zip, `git tag legacy-v1`, aset ke `raw-assets-old/`)
- [ ] 1 Siapkan alat di T480 (Node 24, Git, VS Code, Chrome)
- [ ] 2 Simpan dokumen di `docs/` (file-file ini)
- [ ] 3 Audit game lama (`audit.mjs`, isi `audit-v1.md`)
- [ ] 4 Putuskan rewrite atau refactor (skor 21.5, catat di `decisions.md`)
- [ ] 5 Inventaris aset lama (`asset-log.md`)

Catatan:

## F0: Fondasi

- [ ] F0-1 Buat app Next.js (create-next-app) + tsconfig, ESLint, scripts
- [ ] F0-2 `src/config/balance.ts` dan `src/types/game.ts`
- [ ] F0-3 `schemas.ts` (Zod), `roster.json` (5 karakter), `scripts/validate-data.ts`
- [ ] F0-4 GitHub Actions CI dan folder `docs/`

Catatan:

## F1: Sim inti dan walking skeleton

- [ ] F1-1 `Rng` (mulberry32, dua stream), helper frame (`sec()`), test
- [ ] F1-2 `InputFrame`, `InputBuffer` (6f), resolusi arah 5.3, test
- [ ] F1-3 `StateMachine`, registry `StateDef`, state Idle/Walk/Crouch*, auto-facing, test
- [ ] F1-4 Lompat, gravitasi, kontrol udara, PreJump/Land, test
- [ ] F1-5 Dash darat dan air dash, cooldown bersama, test
- [ ] F1-6 Pushbox, dinding dunia, dinding kamera, pendaratan di lawan, test
- [ ] F1-7 Rangka `BattleEngine.step` (urutan 3.4, `freeze`, fase), `ports.ts`, harness test
- [ ] F1-8 `GameLoop`, `KeyboardInput`, `Fullscreen`
- [ ] F1-9 Renderer kotak (hurtbox/hitbox/pushbox), overlay F1/F3, halaman Training minimal

Catatan:

## F2: Combat inti

- [ ] F2-1 Hitbox data, AABB, hurtbox per postur (RL-05), test
- [ ] F2-2 Normal darat N1–N4, cooldown tombol (RL-06, 33)
- [ ] F2-3 Jalur Hit: damage RL-30, hit-stop, knockback, hitstun, RL-02
- [ ] F2-4 Chain, combo lock, cancel window, `ComboTracker`
- [ ] F2-5 Normal jongkok dan udara, RL-08, RL-22
- [ ] F2-6 Guard, Blockstun, chip
- [ ] F2-7 Perfect Parry, parry lock, Counter
- [ ] F2-8 Stun Gauge, Dizzy, immunity
- [ ] F2-9 Energy
- [ ] F2-10 Knockdown, GetUp, corner pushback, RL-13, 48
- [ ] F2-11 `balance.test.ts`, anchor, determinisme
- [ ] F2-12 Review silang (chat lain) `HitResolver` dan `StateMachine`; perbaiki temuan

Catatan:

## F3: Render, aset, kamera

- [ ] F3-1 `process-sprites.mjs`, `sprites.json`, manifest aset
- [ ] F3-2 `AssetLoader`, `SpriteAtlas` (ImageBitmap, placeholder bila gagal)
- [ ] F3-3 Sistem animasi keyframe, rantai fallback, transformasi prosedural
- [ ] F3-4 `Camera`, `computeView`, `CanvasRenderer` (fighter, bayangan kontak)
- [ ] F3-5 `ParallaxRenderer`, `process-stages.mjs`, `stage.json`
- [ ] F3-6 `EffectsSystem` (spark, debu, siluet flash, afterimage, shake), hit-stop visual
- [ ] F3-7 `DamageNumbers` (atlas digit, pool 12)
- [ ] F3-8 Aligner `/dev/aligner`
- [ ] F3-9 Preset kualitas, overlay F3, auto-saran

Catatan:

## F4: Match, HUD, layar

- [ ] F4-1 `MatchFlow` (fase, timer, K.O., Time Over, seri, PERFECT)
- [ ] F4-2 `Grade`, `MatchStats`
- [ ] F4-3 AI stub (dev saja: mendekat, N1 berkala, guard acak)
- [ ] F4-4 `gameStore`, `battleStore`, jembatan snapshot 30 Hz
- [ ] F4-5 HUD: bar, nameplate, timer, pips, combo
- [ ] F4-6 Banner, label event, radial cooldown, key hints
- [ ] F4-7 Layar: Loading, Title, Select Mode, Select Character, Select Stage
- [ ] F4-8 VS Intro 3 dtk
- [ ] F4-9 Pause, Settings, Rebind, Confirm, Toast, localStorage
- [ ] F4-10 Match Detail, How to Play, Credits
- [ ] F4-11 Playwright E2E-1 sampai 5

Catatan:

## F5: Skill kit

- [ ] F5-1 Tipe dan loader template, sistem proyektil (clash, reverse, guard per hit)
- [ ] F5-2 S1 Energy Bolt dan S8 Triple Shot
- [ ] F5-3 S3 Rising Strike dan S4 Charge Rush (kebal, armor, lunge)
- [ ] F5-4 S5 Ground Shock dan S2 Wave Burst (gelombang, multi-hit)
- [ ] F5-5 S6 Counter Stance dan S7 Shadow Step
- [ ] F5-6 EX generik (aturan 9.5)
- [ ] F5-7 Rantai state Ultimate + U1 dan U3
- [ ] F5-8 U2, U4, U5 (grab)
- [ ] F5-9 Passive P1–P7
- [ ] F5-10 Cinematic Ultimate/EX (freeze, cut-in, X-Ray), `FlashLimiter`
- [ ] F5-11 VFX per template, hook SFX sintesis
- [ ] F5-12 Review silang skill kit + scenario

Catatan:

## F6: AI

- [ ] F6-1 `Perception` (ring buffer tertunda) dan `ThreatDetector`
- [ ] F6-2 `UtilityScorer`, `StrategyFSM`, `MacroExecutor`
- [ ] F6-3 Parameter Easy/Normal dan persona
- [ ] F6-4 Anti-stall dan anti-loop
- [ ] F6-5 `simulate.ts` dan CSV

Catatan:

## F6b: Hard dan Gelo

- [ ] F6-6 footsies + whiff punish + anti-air (12.3 butir 1–3)
- [ ] F6-7 mix-up + wakeup + resource (12.3 butir 4–7)
- [ ] F6-8 model lawan (12.4) + parameter Hard/Gelo

Catatan:

## F7: Konten

- [ ] F7-1 Arcade + Continue + Ending (4.4, 11.5, 11.6)
- [ ] F7-2 data boss, dua fase, Super Armor (10.4, 8.5)
- [ ] F7-3 Boss Intro dan arena Rooftop
- [ ] F7-4 tiga karakter tersisa (data + scenario kesehatan roster)
- [ ] F7-5 stage 2–4
- [ ] F7-6 VS Intro detail (4.5)

Catatan:

## F8: Polish dan rilis

- [ ] F8-1 pipeline Tier B (`animations.json`) bertahap
- [ ] F8-2 `WebAudioEngine` + BGM (15.1–15.2)
- [ ] F8-3 TTS announcer (15.3)
- [ ] F8-4 pass performa di T480 (3.8)
- [ ] F8-5 pass aksesibilitas (13.9)
- [ ] F8-6 deploy Vercel (19.1)
- [ ] F8-7 playtest + bug bash (18.8) + checklist rilis

Catatan:
