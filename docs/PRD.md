# WIKWAR (Wikrama War): Product Requirements Document

*Versi 2.0 (22 Okt 2026) · Menggantikan v1.3 · Web (laptop/PC, keyboard), fullscreen responsive, deploy Vercel · Next.js (App Router) + TypeScript strict + Tailwind + Canvas 2D Engine · Status: semua pertanyaan Q&A tertutup; yang tersisa hanya input konten (deskripsi visual karakter, ciri khas guru) dan aset gambar/audio*

**Cara baca dokumen ini.** Dokumen ini ditulis supaya bisa dipotong per bagian dan di-paste ke chat AI (DeepSeek/Claude). Bagian 0 menjelaskan caranya. Tiap bagian sengaja berdiri sendiri: angka dan aturan yang dipakai modul tertentu ditulis lengkap di bagiannya, tidak cuma "lihat bagian lain". Kalau ada kontradiksi antar bagian, bagian dengan nomor aturan lebih spesifik (mis. 8.3) menang atas ringkasan di bagian lain.

**Daftar isi**

- [0. Cara Pakai PRD Ini dengan AI (Copy-Paste Workflow)](#0-cara-pakai-prd-ini-dengan-ai-copy-paste-workflow): Context Block, template tugas, peta paste (baca dulu)
- [1. Ringkasan Produk](#1-ringkasan-produk): visi, mode, ruang lingkup
- [2. Keputusan, Perubahan dari v1.3, Asumsi, dan Istilah](#2-keputusan-perubahan-dari-v13-asumsi-dan-istilah)
- [3. Arsitektur Teknis](#3-arsitektur-teknis): stack, folder, sim vs UI, urutan step, versi paket
- [4. Layar, Navigasi, dan Mode](#4-layar-navigasi-dan-mode)
- [5. Kontrol](#5-kontrol): tombol dan input
- [6. Fighter: State Machine dan Animasi](#6-fighter-state-machine-dan-animasi)
- [7. Fisika, Hitbox, dan Tabrakan](#7-fisika-hitbox-dan-tabrakan)
- [8. Aturan Combat](#8-aturan-combat): aturan combat (RL-xx), frame, damage
- [9. Skill Kit](#9-skill-kit): Special, Ultimate, Passive
- [10. Roster, Boss, dan Konten Karakter](#10-roster-boss-dan-konten-karakter): roster, boss, humor
- [11. Alur Match dan Grade](#11-alur-match-dan-grade)
- [12. AI Controller](#12-ai-controller)
- [13. HUD, Game Feel, dan Cinematic](#13-hud-game-feel-dan-cinematic)
- [14. Rendering, Kamera, dan Stage](#14-rendering-kamera-dan-stage): canvas, kamera, stage, lantai
- [15. Audio](#15-audio)
- [16. Aset dan Pipeline](#16-aset-dan-pipeline): pipeline gambar dan data aset
- [17. Data, Settings, Copy, dan Error Handling](#17-data-settings-copy-dan-error-handling): simpanan, setelan, teks, error
- [18. Testing dan Validasi](#18-testing-dan-validasi)
- [19. Performa, Deploy, dan Legal](#19-performa-deploy-dan-legal)
- [20. Roadmap](#20-roadmap): fase R, F0 sampai F8, milestone aset
- [21. Rencana Kerja dan Rescue Game Lama](#21-rencana-kerja-dan-rescue-game-lama): urutan kerja dan cara menyelamatkan game lama
- [22. Risiko](#22-risiko)
- [Lampiran A: Tipe, Setup, dan Schema (siap paste)](#lampiran-a-tipe-setup-dan-schema-siap-paste): tipe TypeScript, setup, schema Zod (kode siap paste)
- [Lampiran B: balance.ts awal dan test anchor](#lampiran-b-balancets-awal-dan-test-anchor): balance.ts dan test
- [Lampiran C: Konvensi, Definisi Selesai, dan Checklist](#lampiran-c-konvensi-definisi-selesai-dan-checklist): git, definisi selesai, checklist
- [Lampiran D: Katalog Test](#lampiran-d-katalog-test): katalog scenario test
- [Lampiran E: Prompt Siap Pakai](#lampiran-e-prompt-siap-pakai): prompt siap pakai untuk AI

---

## 0. Cara Pakai PRD Ini dengan AI (Copy-Paste Workflow)

**Kenapa bagian ini ada.** AI yang dipakai (DeepSeek, kadang Claude) tidak punya akses ke repo, jadi file pendukung seperti `AGENTS.md` yang "dibaca otomatis oleh tool" tidak berguna. Gantinya: **Context Block** (0.1) yang di-paste di awal tiap chat, plus potongan PRD yang relevan (0.4), plus isi file yang sedang dikerjakan. Dokumen pendamping lain yang dulu direncanakan (types, balance, schema, prompt per fase, checklist PR) sekarang ada sebagai **Lampiran A–E** di akhir PRD, tinggal paste kalau perlu.

### 0.1 Context Block (paste di awal SETIAP chat baru)

Ditulis dalam English karena model kode biasanya lebih patuh dengan instruksi English. Balasan penjelasan tetap diminta dalam bahasa Indonesia.

```
You are my senior TypeScript game engineer. I'm building WIKWAR, a 2D 1v1 fighting game that runs in the browser.
You have NO access to my repo: I paste code, you answer with complete files. I run the code and paste errors back.

STACK (versions pinned in package.json, no ^): Node 24 LTS, Next.js 16 (App Router), React 19, TypeScript strict,
Tailwind, Zustand, Zod, Vitest, Playwright, sharp, tsx (dev). Game rendering = Canvas 2D. NO Phaser/Pixi/Matter/Three/other game libs.

HARD RULES
1. src/engine/sim/** is pure TypeScript: no React, no DOM, no window/document, no Math.random (use the seeded Rng),
   no Date.now/performance.now. It must run in plain Node.
2. All gameplay time is INTEGER FRAMES at 60 Hz (1 s = 60 f). Never use seconds or delta-time inside sim.
   Space is in world units (u). y = 0 is the floor and y goes UP. Facing right = +x.
3. Every tuning number lives in src/config/balance.ts or src/data/*. No magic numbers in logic.
4. No `any`. No `!` non-null assertion without a one-line reason. Exhaustive switch on unions (assertNever).
5. No allocations inside per-frame hot loops (reuse objects / pools).
6. Do not add dependencies without asking me first.
7. Next.js: canvas components are client components; create the engine in useEffect and call destroy() in cleanup
   (React StrictMode mounts twice in dev). Never touch window/document during server render.
8. Keyboard: use event.code. The game fills the WHOLE window (responsive). Never hardcode 1280x720 or any fixed canvas size.
9. Sim order per frame is fixed (PRD 3.4). Do not reorder it.
10. TypeScript is pinned to 6.0.x (NOT 7.x: typescript-eslint does not support it yet). Do not run `npm i typescript@latest`.
11. Next.js 16 facts: Turbopack is the default bundler (do not add a custom webpack config); `next lint` was removed
   (lint = `eslint .`, ESLint 9 flat config); do not use next/image for game assets (a custom loader decodes them to ImageBitmap).

HOW TO ANSWER
- Explanations in casual Indonesian. Code and identifiers in English. Code comments: short Indonesian, only the "why".
- Give COMPLETE files, one code block per file, path as the first line comment. Never write "...rest unchanged"
  or partial snippets. Keep each file under ~400 lines; split if bigger.
- One task = one module + its Vitest tests. If the task is too big, say so and propose the split BEFORE coding.
- You cannot run code, so never say "done" or "tests pass". End every answer with:
  (a) commands for me to run, (b) the exact expected output or behavior, (c) PRD rule numbers you implemented,
  (d) assumptions you made.
- If the spec is ambiguous or contradicts itself, ask first (max 3 questions). Do not invent rules.
- If you need a file I did not paste, ask for it by path instead of guessing its contents.
- If you are not sure an API exists in the pinned versions, say so and give the safest alternative.
```

### 0.2 Template brief tugas (isi lalu paste setelah Context Block)

```
## TASK
<satu kalimat: modul apa, hasilnya apa>

## SPEC (dari PRD)
<paste bagian PRD yang relevan, lihat peta 0.4>

## FILES I'M PASTING
<path>: <isi file lengkap>   (hanya file yang berubah atau diimpor langsung)

## ACCEPTANCE
- [ ] <kriteria yang bisa dicek: test X lolos, perilaku Y terlihat di Training>

## OUT OF SCOPE
<hal yang jangan disentuh>
```

### 0.3 Aturan kerja (supaya hasil kode bagus)

1. **Satu chat = satu tugas.** Selesai atau chat sudah panjang (±25 pesan) → buka chat baru, paste Context Block + brief baru + isi file terbaru. AI yang chat-nya terlalu panjang mulai lupa aturan dan mengarang.
2. **Selalu paste isi file terbaru**, bukan ringkasan. AI tidak bisa melihat perubahan yang lu buat sendiri.
3. **Urutan kerja bawah-ke-atas:** types → data → logika sim (dengan test) → adapter (input/render/audio) → HUD → layar. Jangan minta AI membuat layar sebelum engine-nya punya test.
4. **Test dulu, tampilan belakangan.** Tiap aturan combat punya scenario test (Bagian 18) yang jalan di Node tanpa browser. Kalau test lolos tapi di game terasa salah, perbaiki test-nya dulu agar mewakili perilaku yang benar.
5. **Setelah AI menjawab:** jalankan perintah di bagian (a) jawaban AI. Kalau error, paste error mentah (teks lengkap, bukan screenshot) beserta file yang dimaksud, pakai template 0.5.
6. **Review kedua** untuk modul yang rawan bug (state machine, hit resolver, AI): paste kode ke chat lain (Claude/DeepSeek) dengan template 0.6.
7. **Jangan percaya angka dari AI.** Semua angka tuning berasal dari PRD ini. Kalau AI mengubah angka, minta kembalikan.
8. **Commit tiap tugas selesai** (branch fitur, pesan jelas). Kalau tugas berikutnya merusak sesuatu, lu bisa kembali.

### 0.4 Peta paste: tugas → bagian PRD yang di-paste

| Tugas | Paste bagian | Lampiran |
| --- | --- | --- |
| Setup repo, tsconfig, ESLint, CI, scripts | 3, 19 | A.1 |
| Clock, Rng, EventBus, urutan step | 3.2–3.5 | A.2 |
| InputManager + buffer + rebind | 5, 17.3 | A.3 |
| State machine fighter, animasi | 6, 7 | A.4 |
| Hitbox, collision, hit resolver | 7, 8.1–8.5 | A.4, A.5 |
| Normal attack, chain, cooldown | 6.3, 8.2–8.4 | A.4 |
| Guard, parry, stun, energy | 8.5–8.9 | A.5 |
| Skill Kit (satu template per chat) | 9 + baris template terkait | A.6 |
| Kamera, renderer, parallax, stage | 14, 3.7 | – |
| HUD React + damage number + banner | 13, 3.6 | A.5 |
| Alur match, timer, grade | 11 | – |
| AI controller | 12 + 8.1 | A.4 |
| Menu dan layar | 4, 5.4, 17 | – |
| Audio | 15 | – |
| Script aset (process-sprites, aligner) | 16 | – |
| Test | 18 + Lampiran D | – |

### 0.5 Template debug (paste error)

```
## BUG
Expected: <apa yang seharusnya terjadi, rujuk nomor aturan PRD>
Actual: <apa yang terjadi, urutan tombol dan frame bila relevan>
Error (teks mentah): <paste>
Files: <path + isi>
Before answering: list the 3 most likely causes ranked, then fix only the most likely one with a complete file.
Add a Vitest scenario that fails before the fix and passes after.
```

### 0.6 Template review kode (chat lain)

```
Review this module against the PRD rules below. Do NOT rewrite it. List: (1) rule violations with PRD rule numbers,
(2) off-by-one frame errors, (3) any use of seconds / Math.random / DOM inside src/engine/sim,
(4) allocations inside per-frame loops, (5) missing tests. Rank by severity. PRD rules: <paste>. Code: <paste>.
```

---

## 1. Ringkasan Produk

**Konsep.** Game fighting 2D real-time 1v1 di browser. Pemain memilih 1 dari roster karakter bertema Wikrama (mulai 5 karakter, bisa berkembang jadi satu kelas atau satu angkatan), melawan AI di "tempat war" Wikrama, dengan kontrol full-keyboard. Pertarungan bergaya **Tekken-lite** (4 tombol anggota badan: pukulan kanan/kiri, tendangan kiri/kanan) dengan rasa **Brawlhalla** (hukuman jelas untuk serangan meleset, air dash, cooldown, hitstun ketat), plus parry, energy, Special, dan Ultimate sinematik. Ada boss guru di ujung mode Arcade.

**Pilar desain**

- **Responsif dan adil:** input terasa instan (input buffer, fixed timestep) dan setiap serangan punya telegraph yang bisa dibaca. Tidak ada kerugian tersembunyi: semua kemenangan dan kekalahan bisa dijelaskan dengan aturan tertulis.
- **Tidak bisa di-spam:** tiap serangan punya cooldown per tombol, tiap tombol normal hanya sekali per combo, serangan meleset dihukum. Combo berasal dari variasi tombol, bukan tekan tombol yang sama berulang.
- **Mudah dipelajari, dalam dikuasai:** 4 tombol serang yang jelas fungsinya, lalu guard/parry, dash, energy, dan Ultimate memberi lapisan strategi.
- **Juicy:** hit-stop, screen shake, damage number melayang, flash, SFX, HUD dan banner bergaya anime/arcade membuat pose statis terasa hidup.

**Target dan platform.** Pemain casual (teman sekolah), sesi 3–5 menit per match. Laptop/PC dengan Chrome/Edge (utama), Firefox, Safari. Kontrol full-keyboard. **Selalu fullscreen responsif** (mengisi seluruh jendela, tanpa bingkai hitam), deploy ke Vercel. Mesin referensi developer: **ThinkPad T480, RAM 16 GB, GPU terintegrasi, Chrome**; semua target performa diukur di mesin ini.

**Non-goals v1.** Multiplayer online, 2P lokal dan gamepad (arsitektur input disiapkan), touch/mobile, preset mouse, story mode, boss playable, replay viewer, input recording (batal, lihat 2.2), taunt, hazard di stage.

**Metrik sukses.**
- 60 FPS stabil di T480 (Chrome, 1080p fullscreen, kualitas Medium), termasuk saat Ultimate dan banyak damage number.
- Dari buka halaman sampai bertarung ≤ 60 detik (termasuk memilih karakter).
- Pemain baru mengalahkan Easy dalam ≤ 3 percobaan; win-rate pemain per level sesuai Bagian 12.
- Simulasi AI vs AI semua kombinasi karakter: win-rate tiap pasangan 35–65% (Bagian 18.5).
- Tidak ada infinite combo, tidak ada situasi "tidak bisa bergerak" selain yang didefinisikan aturan.

---

## 2. Keputusan, Perubahan dari v1.3, Asumsi, dan Istilah

### 2.1 Perubahan besar v1.3 → v2.0

| # | Topik | v1.3 | v2.0 (keputusan final) | Bagian |
| --- | --- | --- | --- | --- |
| 1 | Layar | Viewport tetap 1280×720 + letterbox | **Fullscreen responsif**, tanpa letterbox. "720" tinggal satuan ukur internal (unit dunia), bukan resolusi | 3.7, 14.1 |
| 2 | Serangan | 1 tombol (J), combo 3-hit | **4 tombol**: J pukulan kanan, K pukulan kiri, L tendangan kiri, ; tendangan kanan. Rantai = tombol berbeda, tiap tombol 1x per combo, cooldown per tombol | 5, 8.2–8.4 |
| 3 | Layout tombol | K guard, L Special, I EX, O Ultimate | **Space** guard/parry, **I** Special, **O** EX, **P** Ultimate, **U** Dash, **Enter** pause | 5.1 |
| 4 | Dash | Tanpa air dash | **Air dash** ada (1x per lompat, cooldown bersama dash) | 7.3 |
| 5 | State machine | ±24 state | **±60 state**, flag per state, aturan ketat (tidak bisa menyerang saat hitstun, dsb.) | 6 |
| 6 | Tinggi serangan | Hitbox seragam | Hitbox punya **band tinggi**: serangan atas meleset pada lawan jongkok, serangan bawah meleset pada lawan melompat | 7.2, 8.2 |
| 7 | Animasi | 7–16 pose statis + transformasi prosedural | **Sistem keyframe animasi**: tiap aksi = daftar pose + durasi + transformasi; Tier A (32 pose) cukup main, Tier B (+62 gambar, total 94 per karakter) untuk gerakan halus | 6.6, 16 |
| 8 | Damage number | Tidak ada | **Damage number melayang** di semua gameplay (canvas, pooled) | 13.5 |
| 9 | HUD | SFV minimalis | **Gaya Tekken / Honkai Star Rail / Genshin**: panel berlapis, aksen aura, animasi anime; font unik | 13 |
| 10 | VS Intro | 2 dtk | **3 dtk, koreografi detail**, roulette lawan di Quick Match | 4.5 |
| 11 | Training | Pilih dummy | **Satu dummy** yang bisa dipukul (sprite karakter pemain berwarna abu-abu); opsi perilaku dummy | 4.4 |
| 12 | Quick Match | Lawan acak (boleh sama?) | Lawan **selalu acak dan tidak pernah sama** dengan karakter pemain | 4.4 |
| 13 | Resume pause | Tanpa hitung mundur | **Hitung mundur 3 dtk** setelah Resume atau kembali dari tab blur (kecuali Training) | 11.4 |
| 14 | Ending | Total grade | Ending/Game Over menampilkan **detail tiap match** + total grade + total waktu | 11.6 |
| 15 | Posisi pemain | Kabur soal P1 kiri/kanan | **HUD P1 selalu di kiri**; di arena fighter **bebas bertukar sisi** (cross-up) | 13.2 |
| 16 | Lantai stage | Garis lantai 86% | **Kontrak lantai**: tiap stage mendeklarasikan `floorTop` dan `feetLine`; engine menyelaraskan; bayangan kontak prosedural | 14.4 |
| 17 | Hitstun | 18 / 22 / jatuh | Dinaikkan (24 / 26 / 28) agar rantai 4-tombol jadi true combo | 8.2 |
| 18 | Passive P3 | Hit 3 damage +15% | Hit ke-3 dan ke-4 dalam combo +15% | 9.4 |
| 19 | Font | Orbitron + Chakra Petch | Dela Gothic One (banner), Zen Dots (label/combo), Orbitron (timer), Chakra Petch (HUD/menu) | 13.3 |
| 20 | Audio | 3+ lagu, announcer rekaman/TTS | **Banyak lagu** (daftar 15.2), announcer **TTS** | 15 |
| 21 | Dokumen pendamping | AGENTS.md dkk | Diganti **Context Block** dan Lampiran A–E | 0, Lampiran |
| 22 | Input recording | Rekam input | **Dibatalkan** (tidak penting); engine tetap deterministik dan test memakai skrip input | 3.5 |
| 23 | Performa | Mid-range 8 GB | **T480 sebagai mesin patokan**, anggaran render khusus iGPU | 3.8 |
| 24 | Jadwal | 6–10 jam/minggu | **20 jam/minggu**, tanpa tenggat; ada Fase R (rescue game lama) | 20, 21 |
| 25 | Esc di fullscreen | Esc = pause | **Enter = pause** (Esc tetap dipakai untuk Back di menu); Keyboard Lock API sebagai bonus Chrome | 5.5 |

### 2.2 Keputusan Q&A yang diterima apa adanya (ringkasan)

Semua default yang tertulis di Q&A dan dijawab "iya/boleh/ikut/terserah" diterima. Yang berdampak pada implementasi:

- **Workflow (A):** DeepSeek + kadang Claude, copy-paste. Versi dikunci exact di `package.json` dan `.nvmrc`. npm + GitHub + branch fitur + CI hijau (lint, typecheck, Vitest, validate). Library: Zod, Playwright, sharp. Aturan keras: tanpa Phaser/Pixi/Matter, tanpa `any`, `engine/sim` tanpa React/DOM (dijaga ESLint). Satu prompt = satu modul + test. Komentar kode ringkas.
- **Engine (B):** durasi gameplay dalam frame integer; engine headless (Renderer, Audio, Input lewat interface); determinisme cukup di satu perangkat; hit-stop dan super freeze membekukan seluruh sim termasuk timer (input tetap dibuffer); slow-mo K.O. = laju sim 0,3x; sim tetap 60 step walau render turun, tawarkan preset kualitas; `GameEvent` union lengkap (Lampiran A.5).
- **Menu (C):** semua default diterima: WASD/panah + Enter/J + Esc/K, mouse hover/klik, key-repeat 350/90 ms, wrap kursor, search/filter muncul saat roster ≥ 12, transisi wipe diagonal 300 ms (input diblokir), konfirmasi Quit (default No), Esc mundur satu langkah, refresh di tengah match kembali ke Title, menu Title = START / HOW TO PLAY / SETTINGS / CREDITS, How to Play otomatis muncul sekali (4 halaman, bisa dibuka dari Pause).
- **Select (D):** difficulty default Normal dan diingat; tata letak kartu kiri + panel detail kanan; preview idle bergantian dengan pose special/ultimate tiap 2 dtk; stat bar relatif + 3 chip dengan tooltip; Arcade tanpa pilih stage; Rooftop terkunci untuk boss; stage kosmetik murni.
- **Combat (E–G):** semua default kecuali yang diubah di 2.1. Lihat Bagian 6–8.
- **Skill (H):** template sebagai data TypeScript, tabel lengkap ditulis di Bagian 9, EX ×1,5 damage / ×1,3 jangkauan / −2f startup / +1 armor, cooldown Special mulai saat cast + radial di HUD, VFX template prosedural, nama dan deskripsi English ditulis di Bagian 10 dan 17.
- **Match (I):** urutan ronde, timer 3600 frame berhenti saat hit-stop/super freeze/cinematic/pause, PERFECT juga untuk Time Over HP penuh, rematch seed baru, Arcade Continue −10 poin, rumus grade.
- **AI (J):** keputusan tiap 4 frame, FSM + utilitas berbobot, input virtual yang sama dengan pemain, roll probabilitas per serangan, persona dari archetype, anti-stall, simulasi AI vs AI sebagai pengesahan balance. **Gelo** = AI yang bermain seperti pemain asli (prediksi, bait, punish), bukan AI dengan angka curang.
- **Boss (K):** 3 guru, jurus dirakit dari template, Super Armor, skala 1,15x, boss tersedia di production karena izin sudah beres.
- **Render (L), HUD (M), Audio (N), Aset (O), Data (P), Test (Q), Deploy (R), Copy (S), Jadwal (T):** lihat bagian masing-masing. Izin semua orang (teman dan 3 guru) sudah beres, tidak ada batasan humor dari developer.

### 2.3 Asumsi yang gua ambil (jawaban ambigu, bisa dibalik)

| Kode | Jawaban | Asumsi |
| --- | --- | --- |
| B4 | "kalau tidak penting tidak usah" | Input recording **tidak dibangun**. Karena sim deterministik dan test memakai skrip input per frame, nanti mudah ditambah |
| R4 | "gak usah" | **Tanpa analytics/tracking** dan **tanpa kontak takedown** di Credits |
| K1 | "ngikut aja" | Jurus boss dirakit dari **trope guru generik** (tugas, kuis dadakan, remedial, deadline, spidol) karena ciri khas pribadi tiap guru belum ada. Slot `quirk` di `bosses.json` diisi belakangan oleh yang kenal gurunya |
| D6 | "1 training dummy yang bisa di-hit" | Dummy = sprite karakter pemain berwarna abu-abu berlabel DUMMY, tanpa aset baru. Boleh diganti `dummy.webp` khusus nanti |
| M2 | "player bisa ke kanan juga" | Fighter **bebas bertukar sisi**; yang tetap hanya posisi HUD (P1 kiri) |
| M9 | "damage number melayang bagus" | Menggantikan keputusan v1.3 "tanpa damage number" |
| N3 | "bakal banyak" | Daftar lagu di 15.2 (±16 trek), dibuat bertahap, sisanya fallback ke trek yang ada |
| T5 | "bebas" | Urutan backlog: gamepad → 2P lokal → boss playable → taunt → replay viewer → preset mouse |
| L8 | "fullscreen default?" | Browser tidak mengizinkan fullscreen tanpa klik/tombol, jadi **PRESS START otomatis meminta fullscreen** (opsi Auto Fullscreen, default ON); halaman selalu mengisi jendela walau belum fullscreen |
| E7 | "A+W? D+W?" | A+W = lompat ke kiri, D+W = lompat ke kanan (tabel di 5.3) |

### 2.4 Glosarium (istilah yang ditanyakan atau sering muncul)

| Istilah | Arti sederhana |
| --- | --- |
| **Frame** | Satu langkah waktu game. Game dihitung 60 langkah per detik. **Semua durasi gameplay disimpan sebagai jumlah frame (bilangan bulat)**, mis. timer ronde "60 detik" = 3600 frame. Detik hanya dipakai saat menampilkan angka di layar. Alasannya: aturan jadi pasti dan sama di monitor 60 Hz maupun 144 Hz |
| **Hit-stop** | Game **membeku sebentar (3–8 frame, ±0,05–0,13 dtk) saat pukulan kena**, supaya pukulan terasa "nendang". Bukan menu pause. Timer ronde ikut berhenti selama itu |
| **Super freeze** | Pembekuan 30 frame saat Ultimate dimulai (layar redup, nama jurus muncul) |
| **Startup / Active / Recovery** | Tiga fase tiap serangan: persiapan (belum bisa kena), aktif (hitbox ada), pemulihan (tidak bisa apa-apa) |
| **Hitbox / Hurtbox / Pushbox** | Kotak area: hitbox = bagian yang memukul; hurtbox = bagian tubuh yang bisa dipukul; pushbox = kotak yang mencegah dua fighter saling menembus |
| **Hitstun / Blockstun** | Waktu tidak bisa bergerak setelah terkena pukulan / setelah menangkis |
| **Chip damage** | Damage kecil (25%) yang tetap masuk saat menangkis |
| **Parry (Perfect Parry)** | Menangkis tepat waktu: tidak kena damage, lawan terkena stun |
| **Cancel / Chain** | Membatalkan sisa recovery serangan untuk langsung menyambung serangan lain, sehingga jadi combo |
| **Knockdown** | Korban terpental lalu terbaring sebentar; selama itu tidak bisa dipukul |
| **Juggle** | Memukul lawan yang sedang melayang berulang kali. **Tidak ada di game ini** |
| **Invulnerable / Armor** | Kebal sementara / menahan satu pukulan tanpa terganggu |
| **Cooldown** | Waktu tunggu sebelum aksi yang sama bisa dipakai lagi |
| **Pivot / anchor** | Titik pada gambar yang ditempel ke posisi fighter. Di game ini = telapak kaki, supaya semua pose menapak di lantai yang sama |
| **Sprite aligner** | Alat dev (halaman `/dev/aligner`) untuk menggeser dan mengecilkan satu pose secara visual sampai kakinya sejajar dengan pose idle, karena gambar dari generator AI ukurannya sering tidak konsisten. Hasilnya diekspor sebagai JSON dan di-paste ke `sprites.json` |
| **Warning 12%** | Skrip aset memberi peringatan bila ukuran karakter di suatu pose berbeda lebih dari 12% dari pose idle. Skrip tidak mengubah ukuran otomatis; lu putuskan: generate ulang atau koreksi di aligner |
| **WebP** | Format gambar modern yang mendukung transparansi dan ukuran file 70–90% lebih kecil dari PNG. Chrome, Edge, Firefox, dan Safari modern mendukungnya. PNG asli tetap disimpan di `raw-assets/` |
| **Parallax** | Lapisan latar (jauh, tengah, dekat) bergeser dengan kecepatan berbeda saat kamera bergerak, memberi kesan kedalaman |
| **DOM vs Canvas** | HUD dan banner dibuat dengan elemen HTML/CSS di atas kanvas (mudah dibuat bagus: font, gradien, animasi CSS). Efek di dunia game (damage number, percikan, proyektil) digambar di kanvas |
| **Nameplate** | Papan nama di HUD: nama karakter + kelas + warna aura |
| **Engine headless** | Mesin game yang bisa jalan tanpa layar (di Node), sehingga bisa dites dan dipakai untuk simulasi AI vs AI |
| **Deterministik / seed** | Dengan awal dan input yang sama hasilnya selalu sama. Angka acak berasal dari generator ber-seed, jadi bug mudah direproduksi |
| **Fixed timestep** | Game selalu dihitung 60 langkah/detik, terlepas dari seberapa cepat layar menggambar |
| **Cross-up** | Melewati lawan (lewat lompat atau air dash) sehingga mendarat di sisi belakangnya |

---

## 3. Arsitektur Teknis

### 3.1 Lapisan dan pembagian tugas

| Lapisan | Folder | Isi | Boleh import |
| --- | --- | --- | --- |
| **Sim** (murni) | `src/engine/sim/**` | Clock, Rng, Fighter + state machine, combat, proyektil, match, AI | hanya `types/`, `config/`, `data/` (JSON/TS data), sesama `sim/` |
| **Platform** (adapter) | `src/engine/platform/**` | Game loop (rAF), CanvasRenderer, parallax, efek visual, damage number, WebAudio, KeyboardInput, AssetLoader, Fullscreen | DOM boleh; `sim/` boleh |
| **UI** (React) | `src/components/**`, `src/app/**` | Layar menu, overlay, HUD, banner | React, Zustand, `platform/` lewat store |
| **State** | `src/store/**` | `gameStore` (alur layar, pilihan), `battleStore` (snapshot HUD) | Zustand |

- **Engine headless (B2).** `sim/` hanya bicara ke dunia luar lewat **argumen** `step(inputs)` (input) dan **nilai kembali** `GameEvent[]` (event). Tiga interface di `src/engine/sim/ports.ts` adalah kontrak adapter: `InputSource` (platform mengumpulkan `InputFrame` tiap fighter dari keyboard atau AI), `AudioPort` dan `FxPort` (menerima event dari platform untuk suara dan visual). Sim tidak memanggil port itu; di Node (test dan simulasi AI vs AI) adapternya diganti stub kosong. Renderer tidak ada di `sim/`: `BattleEngine` mengekspos snapshot read-only yang dibaca renderer di platform.
- **Alur layar.** State machine di `gameStore` (Zustand), bukan route Next.js, supaya transisi layar dan musik tidak terputus. `page.tsx` hanya merender layar aktif. Tombol Back browser dipetakan ke "Back dalam game" lewat `history.pushState` per layar. Refresh di tengah match kembali ke Title.
- **Roster data-driven.** Semua karakter hidup di `roster.json` + folder aset. Menambah karakter = menaruh folder aset + 1 entri JSON, tanpa ubah kode. Validasi dengan Zod (build dan dev) plus skrip `validate-data.ts` di CI.
- **Library (disetujui):** Zustand, Zod, Vitest, Playwright, sharp, Framer Motion (hanya transisi menu, tidak di dalam loop game), dan `tsx` (dev, untuk menjalankan `scripts/*.ts`). Selain itu tanya dulu.

### 3.2 Waktu: frame integer, fixed timestep, hit-stop, time scale

- **Satuan waktu sim = frame (60/detik).** Konstanta `FPS = 60`. Dilarang memakai detik atau delta-time di dalam `sim/`. Konversi detik ↔ frame hanya di config (`sec(2.5) = 150`) dan di tampilan.
- **Loop (platform).** Accumulator: `acc += min(realDt, 100 ms) * timeScale`; selama `acc >= 1000/60` dan langkah < 5 per frame render: `engine.step(inputs)`, `acc -= 1000/60`. Bila langkah mencapai 5, sisa `acc` dibuang (anti spiral setelah tab tidak aktif). Render memakai `alpha = acc / (1000/60)` untuk interpolasi posisi (hanya tampilan; sim tidak pernah membaca alpha).
- **`timeScale`:** 1,0 normal; 0,3 selama slow-mo K.O. (B6, laju sim yang melambat, bukan sekadar visual); 0 saat Pause dan hitung mundur resume. Monitor 144 Hz tetap 60 langkah sim per detik.
- **Hit-stop dan super freeze (B5).** `world.freeze` = sisa frame pembekuan. Saat `freeze > 0`: sim hanya mengurangi `freeze`, mem-buffer input, dan **tidak** memajukan fighter, proyektil, cooldown, timer ronde, maupun combo timer. Efek visual (spark, ring) memakai `vfxFrame` yang tetap maju agar terlihat bergerak saat hit-stop. Saat super freeze, hanya overlay sinematik yang beranimasi.
- **Pause** menghentikan semuanya, termasuk `vfxFrame`.
- **Tampilan detik:** `ceil(frames / 60)`.

### 3.3 Random dan determinisme

- `Rng` = mulberry32 ber-seed. Dua stream terpisah: `rngMatch` (pilih lawan, pilih boss, roulette) dan `rngAI` (keputusan dan roll probabilitas AI). Visual acak (jitter partikel, shake) memakai RNG sendiri di `platform/` dan **tidak boleh** memengaruhi sim.
- Seed diambil dari `Date.now()` di platform saat match dibuat, lalu diberikan ke `BattleEngine`. Rematch = seed baru.
- Determinisme cukup di satu perangkat (B3). Posisi boleh `number` float; urutan operasi tetap sama (jangan pakai `Map` iteration order yang bergantung pada insert acak, pakai array berindeks fighter 0/1).

### 3.4 Urutan step per frame (WAJIB, kanonik)

`BattleEngine.step(inputs: [InputFrame, InputFrame]): GameEvent[]`

| # | Langkah | Catatan |
| --- | --- | --- |
| 1 | Jika `phase` bukan `Fighting` (intro, K.O., dll.) → jalankan timer fase, kembalikan | Input diabaikan kecuali yang diizinkan fase |
| 2 | Jika `freeze > 0`: `freeze--`, push input ke buffer, **return** | Hit-stop / super freeze (3.2) |
| 3 | Push `InputFrame` ke buffer 6 frame tiap fighter; AI menghasilkan `InputFrame` virtual yang sama | Bagian 5.2 |
| 4 | Tick semua timer: cooldown tombol, dash, Special, EX, parryLock, comboTimer, counterWindow, stunDecay, stunImmunity | Semua integer frame |
| 5 | Transisi state tiap fighter: (a) paksa (durasi state habis, stun habis), (b) berbasis input sesuai prioritas Bagian 6.5 | Hanya jika `canAct` atau dalam cancel window |
| 6 | Integrasi gerak: kecepatan state, gravitasi, kontrol udara, dash | Bagian 7.3 |
| 7 | Selesaikan tabrakan badan: pushbox, dinding dunia, dinding kamera (jarak maks), pemisahan saat mendarat | Bagian 7.4 |
| 8 | Aktifkan hitbox / spawn proyektil sesuai frame state saat ini | Data dari Bagian 8–9 |
| 9 | Gerakkan proyektil, buang yang kedaluwarsa | Bagian 7.5 |
| 10 | Deteksi overlap hitbox/proyektil vs hurtbox → daftar kandidat hit | AABB |
| 11 | Resolusi kandidat (prioritas parry > guard > hit, trade, multi-hit) lalu terapkan damage, chip, stun, energy, reaksi, knockback, `freeze`, combo | Bagian 8.5 |
| 12 | Update combo tracker, dizzy, KO check | Bagian 8.7, 8.10 |
| 13 | Timer ronde (`roundFrames--` jika tidak freeze), deteksi Time Over / double KO | Bagian 11 |
| 14 | Kumpulkan `GameEvent[]`, perbarui snapshot | Lampiran A.5 |

### 3.5 Event dan skrip input

- `step()` **mengembalikan** daftar `GameEvent` (tanpa event bus global di sim). Platform meneruskannya ke HUD (React), audio, dan efek visual.
- **Skrip input** (`InputScript`) = daftar `{frame, p1?, p2?}` yang diumpankan ke `step()`; dipakai test (Bagian 18) dan simulasi. Format di Lampiran D.1.
- **Input recording tidak dibangun di v1** (keputusan B4). Alat "rekam lalu putar ulang" cukup muncul dari skrip input yang sama bila nanti dibutuhkan.

### 3.6 Jembatan engine ke HUD

- `BattleEngine` memegang state mutable; platform mem-publish **snapshot** ke `battleStore` maksimal 30 Hz (tiap 2 frame sim), plus **event diskrit** langsung saat terjadi.
- HUD (React) membaca snapshot lewat selector Zustand dengan `shallow` equality. Animasi bar memakai CSS transform dan transition, bukan re-render per frame.
- Yang digambar di **DOM/React:** HP/stun/energy bar, nameplate, portrait, timer, round pips, combo counter, label COUNTER/PARRY/REVERSE/PERFECT, banner besar (ROUND, FIGHT!, K.O.), cooldown radial, key hints, layar menu. Yang digambar di **kanvas:** fighter, proyektil, stage, bayangan, efek hit, damage number, cinematic Ultimate/X-Ray, vignette.
- Field snapshot ada di Lampiran A.5.

### 3.7 Viewport, kanvas, dan responsif (fullscreen)

**Prinsip.** Halaman selalu mengisi seluruh jendela. Tidak ada resolusi logis tetap dan tidak ada letterbox. "720 unit" hanya satuan ukur: pada zoom 1,0, tinggi yang terlihat di layar = 720 unit dunia, berapa pun ukuran piksel layar.

- **Elemen kanvas:** `position: fixed; inset: 0; width: 100dvw; height: 100dvh`. Latar `#0A0A0D` (terlihat hanya sebelum aset termuat).
- **Ukuran buffer kanvas:** `cssSize × devicePixelRatio`, lalu dikecilkan proporsional bila melebihi `maxBackingPixels` preset kualitas (Low 1280×720, Medium 1920×1080, High 2560×1440). CSS yang menskalakan ke layar. Tangani `resize` dan `visualViewport` (debounce 100 ms), serta `fullscreenchange`.
- **Konstanta:** `VIEW_H = 720`, `MIN_VIEW_W = 1240`, `MAX_VIEW_W = 2000` (= lebar dunia), `FLOOR_SCREEN_RATIO = 0.87` (garis kaki selalu di 87% tinggi layar), `MAX_SEPARATION = 1000` (jarak maksimum antar fighter).

```ts
// Menghitung skala dari ukuran buffer kanvas (px). Dipanggil saat resize dan tiap frame render untuk zoom dinamis.
export function computeView(cw: number, ch: number, zoom: number) {
  let scale = ch / VIEW_H;                        // px per unit dunia
  const visW = cw / scale;                        // lebar terlihat (unit)
  if (visW < MIN_VIEW_W) scale = cw / MIN_VIEW_W; // layar sempit (4:3): zoom out, lebih banyak langit
  else if (visW > MAX_VIEW_W) scale = cw / MAX_VIEW_W; // super lebar: zoom in sedikit
  scale *= zoom;
  return { scale, floorY: ch * FLOOR_SCREEN_RATIO, halfW: cw / scale / 2 };
}
// dunia -> layar: sx = (wx - cam.x) * scale + cw / 2 ; sy = floorY - wy * scale
```

- **Batas zoom dinamis:** `zoom = clamp(min(zoomByDistance, visWBase / (dist + 240)), 1.0, 1.08)`, sehingga kedua fighter selalu terlihat dengan margin ≥ 120 unit di tiap sisi.
- **Kamera** dikunci supaya area terlihat tetap di dalam dunia `[0, 2000]`.
- **HUD (DOM)** memakai satuan `--u = min(1vw, 1.7778vh)` (1u = 1% lebar bingkai 16:9 yang muat di layar). Kontainer HUD berukuran `min(100vw, 190vh)`, tengah, tinggi penuh, sehingga di layar sangat lebar HUD tidak menyebar ke ujung. Detail di Bagian 13.2.
- **Fullscreen:** tombol `F` dan toggle di Settings memanggil `requestFullscreen()` pada elemen root (butuh gesture pengguna, jadi tidak bisa otomatis saat halaman dibuka). PRESS START juga meminta fullscreen bila opsi **Auto Fullscreen** aktif (default ON). `fullscreenchange` saat Battle → auto-pause.
- **Layar kecil (< 900 px lebar) atau perangkat sentuh:** tampilkan layar "gunakan laptop/PC".

### 3.8 Anggaran performa (patokan: ThinkPad T480, iGPU, Chrome, 1080p)

| Anggaran | Target |
| --- | --- |
| Total per frame | ≤ 16,6 ms (rata-rata ≤ 12 ms di Medium) |
| Sim (`step`) | ≤ 2 ms |
| Render kanvas | ≤ 8 ms |
| HUD React | ≤ 2 ms rata-rata; update ≤ 30 Hz |
| Memori | ≤ 400 MB tab Chrome |

**Aturan render (wajib, karena iGPU lemah):**

1. **Dilarang** `ctx.filter`, `shadowBlur`, dan `globalCompositeOperation` yang mahal di jalur panas. Efek invert/tint dibuat **sekali** ke canvas offscreen lalu di-cache (mis. versi invert pose `xray`, versi tint aura).
2. Glow aura = sprite radial gradient yang sudah dirender sekali per warna aura, digambar dengan alpha.
3. Layer parallax **diskalakan sekali** ke ukuran layar saat stage dimuat dan saat resize, bukan tiap frame.
4. Overlay redup / vignette = `fillRect` beralpha atau satu gambar pra-render.
5. Damage number memakai **atlas digit pra-render** per gaya (tidak memanggil `fillText` tiap frame). Maksimum 12 damage number aktif (pooled).
6. Partikel: pool tetap (maks 200), tanpa alokasi per frame. Spark/debu prosedural sederhana.
7. Sprite di-cache sebagai `ImageBitmap`. Hanya muat sprite penuh 2 karakter yang bertanding.
8. Bulatkan posisi gambar ke piksel bulat untuk menghindari blur subpiksel.
9. `ctx.imageSmoothingQuality = 'medium'`.

**Preset kualitas (B7):**

| Preset | Backing max | Layer parallax | Partikel | Bayangan/Refleksi | Damage number |
| --- | --- | --- | --- | --- | --- |
| Low | 1280×720 | far + floor | 50% | bayangan sederhana | ya |
| Medium (default) | 1920×1080 | far + mid + floor | 100% | bayangan | ya |
| High | 2560×1440 | semua + fg | 150% | bayangan + refleksi lantai | ya |

**Auto-saran:** bila 120 frame render berturut-turut > 20 ms, tampilkan toast "Game terasa berat? Pindah ke kualitas {lebih rendah}? [Enter] Ya [Esc] Tidak" (maks sekali per sesi). Sim tetap 60 langkah/detik apa pun hasil render.

### 3.9 Struktur folder dan aturan ESLint

```
wikwar/
  .nvmrc                       (24)
  raw-assets/                  (gambar mentah dari generator, tidak ikut deploy)
  scripts/                     (process-sprites.mjs, process-stages.mjs, validate-data.ts, simulate.ts)
  public/assets/
    characters/<id>/           (WebP hasil proses + sprites.json + animations.json)
    stages/<stageId>/          (far, mid, near, floor, fg, stage.json)
    vfx/  audio/ (bgm, announcer, sfx, voice)
  src/
    app/ (layout.tsx, page.tsx, dev/aligner/page.tsx, dev/fonts/page.tsx)
    config/ (balance.ts)
    types/ (game.ts)
    data/ (roster.json, bosses.json, stages.json, templates/ (specials.ts, ultimates.ts, passives.ts),
           copy.ts, audio-events.ts, synth-recipes.ts, schemas.ts)
    engine/
      sim/ (ports.ts, BattleEngine.ts, core/ (Clock.ts, Rng.ts, InputBuffer.ts),
            fighter/ (Fighter.ts, states/*.ts, StateMachine.ts),
            combat/ (HitResolver.ts, Projectile.ts, ComboTracker.ts),
            world/ (WorldBounds.ts), match/ (MatchFlow.ts, Grade.ts), ai/ (AIController.ts, Perception.ts),
            testing/ (harness.ts, hash.ts, fixtures.ts; hanya dipakai test dan simulate))
      platform/ (GameLoop.ts, Camera.ts, CanvasRenderer.ts, ParallaxRenderer.ts, EffectsSystem.ts, DamageNumbers.ts,
                 SpriteAtlas.ts, AssetLoader.ts, WebAudioEngine.ts, KeyboardInput.ts, Fullscreen.ts)
    store/ (gameStore.ts, battleStore.ts)
    components/
      screens/ (Loading, Title, SelectMode, SelectChar, SelectStage, VsIntro, BossIntro, Battle, MatchDetail, Ending, HowToPlay, Credits)
      hud/ (BattleHUD.tsx, HealthBar.tsx, EnergyGauge.tsx, ComboCounter.tsx, Banner.tsx, ...)
      overlays/ (Pause, Settings, ConfirmDialog, Toast)
```

```js
// eslint.config.mjs (potongan): menjaga engine sim tetap murni
{
  files: ['src/engine/sim/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', { patterns: ['react', 'react-dom', 'next', 'next/*', 'zustand',
      '**/platform/**', '**/components/**', '**/store/**'] }],
    'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage',
      'performance', 'requestAnimationFrame', 'setTimeout', 'setInterval'],
    'no-restricted-properties': ['error',
      { object: 'Math', property: 'random' }, { object: 'Date', property: 'now' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
  },
}
```

### 3.10 Versi dan konfigurasi

| Paket | Versi | Catatan |
| --- | --- | --- |
| Node | 24 LTS (`.nvmrc` = `24`) | Dicek Okt 2026: Node 24 berstatus LTS; Node 26 baru jadi LTS, pindah nanti setelah stabil. Next.js 16 sendiri mensyaratkan minimal Node 20.9 |
| Next.js | 16.x (App Router) | 16.x berstatus Active LTS (cek nextjs.org/support-policy, Okt 2026) |
| React / React DOM | 19.x | Ikuti `peerDependencies` Next: jalankan `npm view next@latest peerDependencies` |
| TypeScript | **6.0.x** (atau 5.9.x), `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` | **Jangan `typescript@latest`:** per 22 Okt 2026 `latest` = 7.0.x, sedangkan `typescript-eslint` mensyaratkan `typescript <6.1.0` (dicek via `npm view typescript-eslint peerDependencies`). Pin ke 6.0.3 atau yang tertinggi di bawah 6.1; naikkan ke 7 hanya bila peer range sudah mengizinkan |
| Tailwind, Zustand, Zod, Vitest, Playwright, sharp, Framer Motion, tsx (dev) | versi stabil terbaru saat F0 | Jalankan `npm view <paket> version`, catat exact di `package.json` (tanpa `^`/`~`) dan salin ke Context Block |

- **Fakta Next.js 16 (dicek di dokumentasi upgrade resmi, Okt 2026):** Turbopack adalah bundler default untuk `dev` dan `build` (jangan menambah konfigurasi `webpack` di `next.config`, build akan gagal); perintah `next lint` **sudah dihapus** dan `next build` tidak menjalankan lint, jadi `lint` = `eslint .`; `eslint-config-next@16` memakai ESLint 9+ (flat config); `next build` tidak lagi menampilkan ukuran First Load JS; Next menyediakan `next/image`, tetapi **aset game tidak memakai `next/image`** (dimuat sendiri oleh `AssetLoader` ke `ImageBitmap`).
- **Perintah wajib** (`package.json` scripts): `dev`, `build`, `lint` (`eslint .`), `typecheck` (`tsc --noEmit`), `test` (Vitest), `test:e2e` (Playwright), `validate` (validate-data + Zod), `assets` (process-sprites + process-stages), `simulate` (AI vs AI, via `tsx scripts/simulate.ts`).
- **CI (GitHub Actions):** `lint` → `typecheck` → `test` → `validate` wajib hijau sebelum merge.
- **Peringatan untuk workflow copy-paste:** model kode sering memakai API lama (Next 13/14, React 17/18). Kalau kode dari AI gagal compile karena API, paste error mentah + versi dari `package.json`.

---

## 4. Layar, Navigasi, dan Mode

### 4.1 Alur layar

`Loading → Title → Select Mode → Select Character → (Select Stage, hanya Quick Match dan Training) → VS Intro → (Boss Intro, hanya match terakhir Arcade) → Battle → Victory Overlay → Match Detail (Quick Match) atau match berikut (Arcade) → Ending / Game Over (Arcade)`

| Layar | Isi utama | Catatan |
| --- | --- | --- |
| Loading | Preload font, UI, thumbnail portrait, SFX inti; progress bar | Sprite penuh dan BGM per match dimuat belakangan (lazy) |
| Title | Logo WIKWAR, "PRESS START", lalu menu START / HOW TO PLAY / SETTINGS / CREDITS | PRESS START = gesture yang membuka AudioContext dan meminta fullscreen |
| Select Mode | Arcade / Quick Match / Training + difficulty Easy / Normal / Hard / Gelo | Difficulty tidak tampil di Training; How to Play muncul otomatis sekali di kunjungan pertama |
| Select Character | Grid kartu portrait (kiri), panel detail (kanan) | Detail di 4.3 |
| Select Stage | Thumbnail stage + Random | Hanya Quick Match dan Training |
| VS Intro | Koreografi 3 dtk | Detail di 4.5 |
| Boss Intro | Banner WARNING, dialog 2 baris, nama boss | Hanya Arcade match terakhir |
| Battle | Kanvas + HUD, Best of 3 | Pause dengan Enter/Esc |
| Victory Overlay | K.O. / PERFECT / TIME OVER, pose menang | Bagian 11 |
| Match Detail | Statistik, Grade, Rematch / Back to Select Mode | Rematch = konfigurasi sama, seed baru |
| Ending / Game Over | Teks singkat, detail tiap match, total grade, total waktu | Bisa di-skip; tombol ke Title |

### 4.2 Navigasi menu (keyboard + mouse)

| Aturan | Nilai |
| --- | --- |
| Gerak kursor | ↑↓←→ atau WASD |
| Pilih | Enter atau J |
| Kembali | Esc atau K |
| Mouse | Hover = fokus, klik = pilih (tetap didukung) |
| Key-repeat saat arah ditahan | Delay 350 ms, interval 90 ms |
| Kursor di tepi grid | Wrap (tembus ke sisi lain) |
| Fokus awal layar | Pilihan terakhir (disimpan di `gameStore`) |
| Transisi layar | Wipe diagonal 300 ms; **input diblokir** selama transisi |
| Konfirmasi | Dialog Yes/No untuk Quit match atau Quit Arcade; fokus default **No** |
| Back | Esc mundur satu langkah; pilihan sebelumnya diingat sampai kembali ke Title |
| Browser | Tombol Back browser = Back dalam game; refresh di tengah match = kembali ke Title |
| Search/filter Select Character | Disembunyikan sampai roster ≥ 12; bila tampil: `/` untuk search, Tab untuk ganti filter |
| Suara | `ui_move`, `ui_select`, `ui_back` tiap aksi (Bagian 15) |

### 4.3 Detail layar

- **Title.** Logo teks "WIKWAR" (Dela Gothic One, gradien orange→amber, outline tebal, irisan glitch RGB tiap ±4 dtk, kilau menyapu pelan), subjudul "WIKRAMA WAR". Latar = stage parallax acak dengan siluet 5 karakter dalam pose idle. Sebelum menu muncul ada "PRESS START" berkedip; menekan tombol apa pun membuka audio, meminta fullscreen (bila opsi aktif), memutar BGM title, lalu menampilkan menu.
- **Select Mode.** Tiga kartu mode besar dengan ikon SVG inline, deskripsi 1 kalimat, dan selektor difficulty. Kunjungan pertama: How to Play otomatis tampil sekali (flag `wikwar:v1:seenHowTo`).
- **Select Character.** Kiri: grid kartu portrait (urutan mengikuti `roster.json`), bingkai warna aura saat fokus, ikon lock bila karakter belum lengkap asetnya (tidak ditampilkan di production). Kanan: panel detail.
  - Preview besar (pakai `splash`, fallback `idle`) dengan idle bobbing, **bergantian dengan pose `special` lalu `ultimate` tiap 2 dtk** (fallback `cast`).
  - Nama, kelas, gaya (Rushdown/Zoner/Tank/Counter/Balanced), quote.
  - **Stat bar** HP / SPD / DMG dipetakan relatif ke min–max roster (bar terpendek = nilai terendah roster, bukan 0).
  - **3 chip** (Special, Ultimate, Passive) dengan nama dan tooltip 1 kalimat (Bagian 17.4).
  - Tombol Random. Lawan **tidak** dipilih di sini (Quick Match dan Arcade memakai lawan acak).
  - Nama karakter dipotong maksimal 12 karakter di nameplate HUD, penuh di panel ini.
- **Select Stage.** Grid 4 thumbnail + Random. Rooftop Wikrama bisa dipilih di sini (terkunci hanya sebagai arena boss di Arcade).
- **How to Play (4 halaman).** (1) Gerak, lompat, jongkok, dash, air dash. (2) Empat tombol serang, rantai dan cooldown. (3) Guard, Parry, serangan atas vs jongkok. (4) Energy, EX, Ultimate, Dizzy. Teks di 17.4. Bisa dibuka dari Title dan Pause. Navigasi ←→, Esc keluar.
- **Credits.** Tim (nama), guru, sumber audio dan musik, font (lisensi OFL), alat yang dipakai, catatan bahwa semua tokoh nyata sudah memberi izin. Tanpa kontak takedown (keputusan R4).
- **Settings.** Daftar di 17.2. Rebind di 17.3.
- **Pause.** Resume (hitung mundur 3 dtk, Bagian 11.4), How to Play, Settings, Restart (hanya Training), Quit (dialog konfirmasi → kembali ke Select Mode).

### 4.4 Mode

- **Arcade.** 4 lawan acak dari roster (selain pemain; dengan 5 karakter berarti semua karakter lain, urutan diacak), lalu **Boss Guru** (Bagian 10.4): satu dari guru yang aktif di pool, dipilih acak (seed). Stage berurutan: Lapangan Wikrama → Lab PPLG → Kelas RPL XII-4 → satu stage acak dari ketiganya; boss selalu di Rooftop Wikrama. Difficulty tetap sesuai pilihan. Aturan Continue dan ending di 11.5–11.6.
- **Quick Match.** 1 match (Best of 3). Lawan **selalu acak dan tidak pernah sama** dengan karakter pemain (animasi roulette di VS Intro). Stage dipilih pemain atau Random. Setelah selesai: Match Detail (Rematch = karakter, lawan, stage sama, seed baru).
- **Training.** Satu **dummy** yang bisa dipukul. Dummy memakai sprite karakter pemain berwarna abu-abu (filter grayscale pra-render), nameplate "DUMMY"; mirror hanya terjadi di mode ini. Tanpa timer (tampil ∞), tanpa Match Detail.
  - **Menu Training** (tombol Tab): perilaku dummy (Stand, Crouch, Jump berulang, Guard terus, Guard setelah kena pertama, CPU = AI Normal), HP infinite (default ON; bar terisi lagi 1 dtk setelah combo berakhir), Energy infinite (default ON), Reset cooldown, Show Hitboxes (juga F1), Show Inputs, Show Frame Data.
  - **Reset posisi:** tombol R. **Frame data readout:** setelah tiap serangan menampilkan startup / active / recovery dan frame advantage (positif = penyerang pulih lebih dulu) pada hit dan block.
  - **Input display:** deretan ikon tombol yang sedang terbaca engine (dipakai juga untuk menguji ghosting keyboard laptop).
  - Training dipakai juga untuk menguji Special dan Ultimate tiap karakter.

### 4.5 VS Intro (3,0 detik) dan Boss Intro

Layar ini berjalan di DOM/CSS dengan timeline berbasis waktu nyata (bukan sim). Tidak memakai filter blur langsung; latar blur dibuat sekali saat aset stage dimuat. Total 3,0 dtk; **bisa di-skip dengan Enter setelah 0,8 dtk** (loncat ke 2,85 dtk). Sprite penuh kedua karakter dan BGM stage dimuat selama layar ini; bila belum siap saat 2,85 dtk, tahan di "GET READY" dengan spinner.

| Waktu (dtk) | Kejadian |
| --- | --- |
| 0,00–0,30 | Wipe diagonal membuka layar. Latar: stage (far + mid) diredupkan 40% dan diburamkan. Dua panel jajar genjang warna aura (P1 kiri, lawan kanan) meluncur dari luar layar |
| 0,30–0,90 | Seni `splash` P1 masuk dari kiri dengan overshoot (ease-out-back) dan garis kecepatan; lawan dari kanan. **Quick Match:** slot lawan berputar cepat melewati portrait roster (ganti tiap 4 frame, makin melambat), **terkunci di 1,1 dtk** dengan kilatan dan bunyi "ding". Karakter pemain tidak pernah muncul di roulette |
| 0,90–1,30 | **Nama** menghantam: skala 1,5→1 dengan goyang 6 px (Dela Gothic One); chip kelas (RPL XII-4) dan gaya; partikel aura |
| 1,30–1,80 | 3 chip stat/skill muncul berurutan; strip nama Ultimate meluncur di bawah tiap karakter |
| 1,50–2,00 | Lambang **VS** jatuh dari atas ke tengah dengan ring gelombang kejut, shake 6 px; garis retakan listrik prosedural di tengah dengan campuran dua warna aura |
| 2,00–2,60 | **Quote** kedua karakter muncul dengan efek ketik (30 ms/karakter); banner nama stage menyapu dari bawah |
| 2,60–2,85 | Teks "GET READY" berdenyut, denyut layar halus |
| 2,85–3,00 | Kilatan putih lembut sekali (alpha ≤ 0,6) + wipe diagonal ke Battle; BGM stage crossfade masuk |

**Boss Intro (±3,5 dtk, skip setelah 1,0 dtk).** Banner WARNING bergaris hitam-merah menyapu layar, siren, portrait boss besar 1,15x, nama boss (huruf besar), dialog 2 baris dengan efek ketik, lalu wipe ke Battle di Rooftop.

---

## 5. Kontrol

### 5.1 Layout tombol (Preset A, satu-satunya preset v1)

Tangan kiri: gerak dan Space (ibu jari). Tangan kanan: empat tombol serang di home row (J K L ;), aksi lain di baris atas (U I O P).

| Aksi | Tombol | Keterangan |
| --- | --- | --- |
| Kiri / Kanan | A / D | Absolut (kiri/kanan layar); karakter otomatis menghadap lawan |
| Lompat | W | Tekan baru (menahan tidak mengulang lompat) |
| Jongkok | S | |
| **Pukulan Kanan (RP)** | **J** | Normal 1, Jab: cepat, tinggi |
| **Pukulan Kiri (LP)** | **K** | Normal 2, Hook: menengah |
| **Tendangan Kiri (LK)** | **L** | Normal 3, Low Kick: rendah |
| **Tendangan Kanan (RK)** | **;** | Normal 4, Roundhouse: finisher, knockdown |
| Guard / Parry | Space | Tekan baru = coba Parry; ditahan = Guard |
| Dash / Air Dash | U | Arah dari A/D yang ditahan; netral = ke arah lawan |
| Special | I | Skill unik karakter (Bagian 9) |
| EX Special | O | Butuh 50 Energy |
| Ultimate | P | Butuh 100 Energy |
| Pause | Enter atau Esc | Hanya di Battle |
| Fullscreen | F | Juga di Settings |
| Debug | F1 hitbox (dev dan Training), F2 sprite aligner (hanya dev), F3 overlay performa (FPS, ms sim, ms render, jumlah partikel; dev dan Training) | |

Di udara dan jongkok, tombol serang yang sama menghasilkan serangan berbeda (Bagian 8.2). Tombol Special, EX, Ultimate hanya bekerja di darat (kecuali yang ditulis lain di Bagian 9).

### 5.2 Aturan input

- **Dasar:** `event.code`; listener di `window`; semua input di-reset saat `blur` dan `visibilitychange`; `preventDefault` untuk Space, panah, Tab, dan tombol game saat Battle aktif.
- **InputFrame** per fighter per frame: `held` (bitmask), `pressed` (tepi naik pada frame ini), `released`. Aksi: `Left, Right, Up, Down, N1, N2, N3, N4, Guard, Dash, Special, EX, Ultimate, Pause`.
- **Input buffer 6 frame:** tepi tekan tombol aksi tetap valid 6 frame (ditekan di step f → valid di step f sampai f+5) dan dikonsumsi sekali. Arah yang ditahan tidak dibuffer.
- **Prioritas bila beberapa aksi ditekan pada frame yang sama:** Ultimate > EX > Guard(Parry) > Special > Normal (N1 > N2 > N3 > N4) > Dash > Lompat > Jongkok > Gerak.
- **Anti-ghosting:** tidak ada aksi yang butuh lebih dari 3 tombol bersamaan; kasus terburuk = arah + arah/lompat + serang (mis. W + D + J). Uji di T480 lewat Input Display (Training) dengan kombinasi: W+D+J, W+A+Space, S+D+;, A+W+U. Bila ada yang tidak terbaca, rebind.
- **AI** menghasilkan `InputFrame` virtual yang identik dengan input pemain (tidak ada jalan pintas ke state).

### 5.3 Resolusi arah (A+D, W+S, diagonal)

| Vertikal \ Horizontal | tidak ada | A | D | A+D |
| --- | --- | --- | --- | --- |
| tidak ada | Idle | Jalan kiri | Jalan kanan | Idle |
| W | Lompat tegak | Lompat ke kiri | Lompat ke kanan | Lompat tegak |
| S | Jongkok | Jongkok (A tidak menggerakkan) | Jongkok (D tidak menggerakkan) | Jongkok |
| W+S | Idle (vertikal netral) | Jalan kiri | Jalan kanan | Idle |

- Arah lompat **dikunci saat takeoff** (setelah PreJump 4f), lalu dimodifikasi kontrol udara (7.3).
- Saat jongkok, A/D tidak menggerakkan karakter, tetapi tetap dibaca untuk arah **Dash** dan untuk Dizzy-mash.
- "Maju" dan "mundur" ditentukan relatif ke lawan: maju = menuju lawan; kecepatan jalan berbeda (7.3).

### 5.4 Tombol menu dan global

Lihat 4.2. Di luar Battle: `Enter/J` pilih, `Esc/K` kembali, arah `WASD/panah`. `F` = fullscreen di semua layar. Tombol aksi game (J/K/L/;) tidak bentrok dengan menu karena menu hanya memakai J dan K.

### 5.5 Pause dan fullscreen (Esc bermasalah di fullscreen)

- **Enter** adalah tombol Pause yang andal. **Esc** juga mem-pause bila sampai ke game.
- Di fullscreen, browser biasanya memakai Esc untuk keluar fullscreen. Setelah masuk fullscreen, panggil `navigator.keyboard.lock(['Escape'])` (hanya Chrome/Edge; sejak Chrome 130 meminta izin; abaikan bila gagal), sehingga **tekan singkat Esc** sampai ke game sementara **tahan Esc** tetap keluar fullscreen.
- Tanpa Keyboard Lock: Esc keluar dari fullscreen → event `fullscreenchange` → game **auto-pause** bila sedang Battle.

### 5.6 Rebind

- Semua aksi game bisa di-rebind di Settings: pilih aksi → "PRESS A KEY" → bila tombol sudah dipakai aksi lain, tawarkan **swap** (Enter = swap, Esc = batal).
- **Tombol terlarang:** Esc, Enter, Tab, F1–F12, Shift/Ctrl/Alt/Meta sebagai tombol tunggal, dan tombol menu (panah). Tombol navigasi menu tidak bisa di-rebind.
- Reset Controls mengembalikan layout 5.1. Disimpan di `wikwar:v1:controls`.
- Backlog: preset kidal, gamepad, 2P lokal (layout cadangan panah + Numpad); `InputSource` per fighter sudah disiapkan.

---

## 6. Fighter: State Machine dan Animasi

Bagian ini adalah kontrak utama untuk `Fighter.ts` dan `states/*.ts`. Aturan diberi ID `RL-xx` supaya bisa dirujuk di test dan di jawaban AI.

### 6.1 Prinsip

- Satu fighter punya **tepat satu state aktif** (`RL-01`). Perpindahan hanya lewat tabel di 6.3 dan aturan 6.4. Tidak ada flag "setengah state".
- Tiap state punya `StateDef` (Lampiran A.4): `id`, `category`, `hurtbox` (`stand | crouch | air | none`), `pushbox` (bool), `gravity` (bool), `canAct`, `invuln` (`none | all | projectile | upperBody`), `facing` (`auto | locked`), `duration` (frame, atau `hold`, atau `untilLand`).
- **`canAct`** = state menerima input aksi baru. State yang `canAct = false` tetap mem-buffer input (6 frame); input yang masih valid saat state berakhir langsung dieksekusi pada frame itu.
- Durasi serangan (startup/active/recovery) berasal dari `balance.ts` (Bagian 8–9), bukan ditulis di logika state.

### 6.2 Daftar state (±57)

**Locomotion (14)**

| State | Durasi (f) | Hurtbox | canAct | Kebal | Keluar ke | Pose Tier A |
| --- | --- | --- | --- | --- | --- | --- |
| `Idle` | hold | stand | ya | – | Walk*, Crouch*, PreJump, aksi lain | `idle` |
| `WalkForward` | hold | stand | ya | – | Idle, aksi lain | `walk_a`/`walk_b` |
| `WalkBack` | hold | stand | ya | – | Idle, aksi lain | `walk_a`/`walk_b` (mundur) |
| `CrouchDown` | 3 | crouch | ya | – | Crouch | `crouch` |
| `Crouch` | hold | crouch | ya | – | StandUp, aksi crouch | `crouch` |
| `StandUp` | 3 | stand | ya | – | Idle | `crouch`→`idle` |
| `PreJump` | 4 | stand | **tidak** | – (bisa kena) | JumpRise | `crouch` (squash) |
| `JumpRise` | sampai vy ≤ 0 | air | terbatas (air normal, air dash) | – | JumpFall | `jump_up` |
| `JumpFall` | sampai mendarat | air | terbatas | – | Land | `jump_fall` |
| `Land` | 4 | stand | **tidak** (input buffer dieksekusi di akhir) | – | Idle | `crouch` (squash 80 ms) |
| `DashForward` | 24 (2+12+10) | stand | tidak | proyektil, f1–6 | Idle | `dash_f` |
| `DashBack` | 24 | stand | tidak | proyektil, f1–6 | Idle | `dash_b` |
| `AirDashForward` | 24 (2+14+8) | air | tidak | proyektil, f1–6 | JumpFall | `dash_f` |
| `AirDashBack` | 24 | air | tidak | proyektil, f1–6 | JumpFall | `dash_b` |

**Serangan normal (13)** (frame data di 8.2)

| State | Tombol | Hurtbox | canAct | Cancel | Pose Tier A |
| --- | --- | --- | --- | --- | --- |
| `N1Jab` | J | stand | tidak | chain + skill-cancel (hit) | `n1_jab` |
| `N2Hook` | K | stand | tidak | chain + skill-cancel (hit) | `n2_hook` |
| `N3LowKick` | L | stand | tidak | chain + skill-cancel (hit) | `n3_lowkick` |
| `N4Roundhouse` | ; | stand | tidak | tidak ada (finisher) | `n4_roundhouse` |
| `C1CrouchJab` | S+J | crouch | tidak | chain + skill-cancel (hit) | `crouch_punch` |
| `C2CrouchHook` | S+K | crouch | tidak | chain + skill-cancel (hit) | `crouch_punch` |
| `C3Sweep` | S+L | crouch | tidak | tidak ada | `crouch_sweep` |
| `C4Uppercut` | S+; | stand→air (naik) | tidak | tidak ada | `crouch_uppercut` |
| `A1AirJab` | J di udara | air | tidak | – | `air_punch` |
| `A2AirHook` | K di udara | air | tidak | – | `air_punch` |
| `A3AirKick` | L di udara | air | tidak | – | `air_kick` |
| `A4DiveKick` | ; di udara | air | tidak | – | `air_kick` (miring 35°) |
| `DiveLand` | setelah A4 whiff | stand | tidak | – | `crouch` |

**Skill (7)**

| State | Durasi | canAct | Catatan | Pose Tier A |
| --- | --- | --- | --- | --- |
| `Special` | dari template (9.2) | tidak | Cooldown mulai saat cast | `special` |
| `SpecialEX` | dari template, startup −2f | tidak | Armor 1 hit, biaya 50 Energy | `special` + glow |
| `UltFreeze` | 30 | tidak | Super freeze; semua sim beku | `ultimate` |
| `UltStartup` | 12 (U5: 18) | tidak | Bisa terganggu hit (Energy tetap hangus) | `ultimate` |
| `UltActive` | dari template | tidak | Hitbox aktif / sinar / rangkaian | `ultimate` |
| `UltRecovery` | dari template | tidak | | `ultimate` |
| `GrabHold` | U5 saat mencengkeram | tidak | Penyerang dan korban dikunci cinematic | `ultimate` |

**Defense (7)**

| State | Durasi | Hurtbox | canAct | Catatan | Pose Tier A |
| --- | --- | --- | --- | --- | --- |
| `Parry` | 12 (P5: 14) | stand/crouch (ikut S saat tekan) | tidak | Jendela Perfect Parry; lalu Guard bila Space masih ditahan, jika tidak → GuardRelease | `guard` |
| `Guard` | hold | stand | ya (Special, EX, Ultimate, normal, dash, lompat keluar dari guard) | Jalan ×0,5; tidak menerima stun | `guard` |
| `GuardCrouch` | hold | crouch | ya | Serangan tinggi meleset (7.2) | `guard_crouch` |
| `GuardRelease` | 6 | stand | tidak | Lag hanya setelah Parry yang Space-nya tidak ditahan (melepas Guard biasa langsung ke Idle tanpa lag) | `guard` |
| `BlockstunStand` | dari serangan | stand | tidak | Chip damage | `guard` |
| `BlockstunCrouch` | dari serangan | crouch | tidak | | `guard_crouch` |
| `ParrySuccess` | 10 (bebas bergerak mulai f6) | stand | ya mulai f6 | Hit-stop 8f; membuka Counter window 48f | `guard` + ring cyan |

**Reaksi (11)**

| State | Durasi | Hurtbox | Bisa dipukul | Catatan | Pose Tier A |
| --- | --- | --- | --- | --- | --- |
| `HitstunLight` | `hitstun` serangan | stand | ya | Rantai combo | `hit_high` |
| `HitstunHeavy` | `hitstun` serangan | stand | ya | Special/Ultimate non-knockdown | `hit_high` (rot lebih besar) |
| `HitstunCrouch` | `hitstun` serangan | crouch | ya | Kena saat jongkok | `hit_low` |
| `KnockdownFly` | ±24 (tergantung knockback) | none | **tidak** | Terlempar; tanpa juggle | `knockdown_fly` |
| `Down` | 40 | none | **tidak** | Terbaring | `down` |
| `GetUp` | 30 | none | **tidak** (kebal) | Bangkit; tanpa quick-rise | `getup` |
| `Dizzy` | 150 (min 90) | stand | ya | Hanya mash A/D (+6f potong per tekan) | `dizzy` |
| `ParryStunned` | 48 | stand | ya | Penyerang yang di-parry | `hit_high` |
| `UltParried` | 90 | stand | ya | Ultimate yang di-parry | `hit_high` |
| `XRayHit` | sesuai cinematic | none | tidak | Korban Ultimate/EX saat efek X-Ray | `xray` |
| `Grabbed` | sesuai cinematic | none | tidak | Korban U5 | `xray` |

**Pertandingan (5)**: `Intro` (pose siap tarung sampai FIGHT!), `Win` (pose menang, tanpa input), `Lose` (kalah Time Over: idle membungkuk), `KOFly` (hit penentu, slow-mo), `KODown` (rebah).

### 6.3 Matriks aksi (siapa boleh melakukan apa)

| Dari state | Gerak | Lompat | Jongkok | Normal | Guard/Parry | Dash | Special/EX | Ultimate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Idle, Walk*, Crouch*, StandUp, CrouchDown | ✔ | ✔ | ✔ | ✔ (ground atau crouch sesuai S) | ✔ | ✔ | ✔ | ✔ |
| Guard, GuardCrouch | ✔ (×0,5) | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ |
| Parry | ✘ | ✘ | ✘ | ✘ | – | ✘ | ✘ | ✘ |
| Land, PreJump, GuardRelease | ✘ (buffer) | ✘ (buffer) | ✘ | ✘ (buffer) | ✘ (buffer) | ✘ | ✘ | ✘ |
| Normal ground/crouch (di cancel window, kena atau block) | ✘ | ✘ | ✘ | rantai (8.3) | ✘ | ✘ | hanya jika **hit** | hanya jika **hit** |
| JumpRise/JumpFall | drift 60% | ✘ | ✘ | air normal (maks 2) | ✘ | air dash (1x) | ✘ | ✘ |
| Dash, Air dash, A*, DiveLand, skill states | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| Semua state Reaksi dan Pertandingan | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ (Dizzy: hanya A/D mash) |

### 6.4 Aturan ketat state (`RL`)

| ID | Aturan |
| --- | --- |
| RL-01 | Satu state aktif per fighter; perpindahan hanya via tabel 6.2–6.3 |
| RL-02 | **Terkena damage = tidak bisa beraksi.** Di HitstunLight/Heavy/Crouch, Blockstun, KnockdownFly, Down, GetUp, Dizzy, ParryStunned, UltParried, XRayHit, Grabbed tidak ada aksi yang diterima (input hanya dibuffer 6f) |
| RL-03 | Serangan normal di udara hanya air normal. Special, EX, Ultimate **tidak** bisa dimulai di udara |
| RL-04 | Guard tidak bisa dimulai di udara, saat recovery serangan, hitstun, Dizzy, dash, atau sedang Parry lock untuk percobaan parry (guard biasa tetap boleh) |
| RL-05 | Serangan **tinggi** meleset terhadap lawan jongkok dan serangan **rendah** meleset terhadap lawan yang melayang cukup tinggi; ditentukan geometri hitbox (7.2), bukan if-else |
| RL-06 | Tiap tombol normal punya cooldown sendiri (8.4); input tombol itu saat cooldown aktif diabaikan |
| RL-07 | Lompat hanya dari **tekan baru** W; menahan W saat mendarat tidak melompat lagi |
| RL-08 | Air normal maks **2** per lompat, tombol berbeda; `A4DiveKick` selalu yang terakhir |
| RL-09 | Air dash maks 1 per lompat; dash darat dan air dash **berbagi cooldown 72f** |
| RL-10 | Dash tidak bisa di-cancel; cooldown dihitung dari frame pertama dash |
| RL-11 | Auto-facing berbalik hanya di Idle, Walk*, Crouch, CrouchDown, StandUp, Guard, GuardCrouch, Land. State serangan, dash, skill, dan udara mempertahankan arah hadap (arah hadap di udara berubah setelah mendarat) |
| RL-12 | Dizzy: semua input mati kecuali tekan A/D (tiap tekan memotong 6f, min 90f total) |
| RL-13 | KnockdownFly, Down, GetUp, XRayHit, Grabbed: tanpa hurtbox; serangan dan proyektil menembus; combo berakhir |
| RL-14 | Land dan PreJump tidak kebal (4f masing-masing) |
| RL-15 | Saat jongkok tidak bisa berjalan |
| RL-16 | Guard menurunkan kecepatan jalan ×0,5; Parry tidak bisa berjalan |
| RL-17 | Selama `freeze` (hit-stop/super freeze) timer state tidak maju; input tetap dibuffer |
| RL-18 | Sebelum FIGHT! dan setelah ronde berakhir input tidak diterima |
| RL-19 | Serangan yang meleset (tanpa kontak) menyelesaikan seluruh recovery; tidak ada cancel apa pun |
| RL-20 | Rantai normal hanya bila kontak (hit atau block), ke tombol berbeda yang belum dipakai dalam combo ini (8.3) |
| RL-21 | Cancel ke Special/EX/Ultimate hanya dari N1–N3 / C1–C2 yang **kena (hit)**, bukan block |
| RL-22 | Mendarat saat serangan udara belum selesai: serangan terpotong, `Land` 4f + 4f ekstra bila masih startup/active, 4f bila sudah recovery |
| RL-23 | Pause saat super freeze/cinematic ditunda sampai selesai (11.4) |
| RL-24 | Menahan Space saat Parry berakhir = lanjut Guard; tidak menahan = GuardRelease 6f |

### 6.5 Prioritas transisi per frame (step 5)

1. **Paksa:** state mencapai akhir durasi; hit/guard resolution dari frame sebelumnya (step 11) mengganti state; stun mencapai 100 → `Dizzy`; HP 0 → `KOFly`.
2. **Input** (hanya jika `canAct`, atau di cancel window yang diizinkan): Ultimate > EX > Parry > Special > Normal (N1 > N2 > N3 > N4) > Dash > Lompat > Jongkok > Gerak. Syarat tiap aksi (cooldown, Energy, tanah/udara) dicek; bila syarat gagal, aksi dilewati dan aksi prioritas berikutnya dicoba.
3. **Default:** Idle/Walk/Crouch sesuai arah ditahan (5.3).

### 6.6 Sistem animasi (keyframe)

Tiap aksi punya **timeline kunci** (keyframe). Satu kunci = `{ pose, frames, ox, oy, rot, sx, sy, ease }` (offset unit dunia, rotasi derajat, skala). Pergantian pose antar kunci berupa potong keras; transformasi di-tween (ease-out). Ini memungkinkan satu gambar pose dipakai untuk beberapa kunci, sehingga gerakan tetap terlihat beranimasi walau gambarnya sedikit.

- **Tier A (32 pose per karakter, cukup untuk main).** Setiap kunci memakai satu pose + transformasi prosedural. Timeline serangan dibangun otomatis dari frame data: startup = pose `idle` condong ke belakang (rot −4°, ox −6) → active = pose serangan dengan lunge (ox +12) → recovery = pose serangan mengendur ke `idle`.
- **Tier B (+62 gambar per karakter, total 94, gerakan halus; daftar di 16.2).** `animations.json` per karakter menimpa timeline Tier A dengan pose-pose antara. Aset yang kurang → otomatis kembali ke Tier A.
- **Fallback pose** (bila file tidak ada, game tidak crash): `walk_a/walk_b → idle` (bob); `crouch → idle` (scaleY 0,55); `jump_up/jump_fall → idle` (stretch/squash); `n2_hook → n1_jab`; `n3_lowkick/n4_roundhouse → n1_jab` (+rot); `crouch_punch/sweep/uppercut → crouch`; `air_punch/air_kick → jump_up`; `guard_crouch → guard`; `hit_low → hit_high`; `knockdown_fly → hit_high` (rot 60°); `down → hit_high` (rot 90°); `getup → crouch`; `dizzy → hit_high`; `intro → idle`; `win → idle` (bounce); `splash → idle`; `special/ultimate → n1_jab`; `xray → hit_high`.

**Transformasi prosedural default (satuan unit dunia, 60 fps)**

| Aksi | Transformasi |
| --- | --- |
| Idle | Bobbing sinus oy ±3, ≈ 2 Hz |
| Jalan | Bobbing oy ±5 ≈ 6 Hz, miring 3° searah gerak; ganti `walk_a`/`walk_b` tiap 8f bila ada |
| PreJump | Squash: sx 1,10, sy 0,88 dari kaki |
| Lompat naik / turun | Stretch sx 0,92, sy 1,12 (naik); netral di puncak; turun sx 0,96, sy 1,06 |
| Mendarat | Squash sx 1,10, sy 0,88 selama 80 ms lalu kembali |
| Jongkok | Pose `crouch`; fallback sy 0,55, sx 1,08 |
| Dash / Air dash | Pose dash + afterimage 3 salinan (alpha 0,4 → 0,1, selisih 3f) |
| Serangan | Lunge sesuai tabel di atas; spark berbeda per tombol |
| Special / Ultimate | Recoil 6; glow tangan (sprite aura pra-render) |
| Guard | Squash ringan; ring cyan saat Parry |
| Kena | Knockback + flash putih 4f (siluet putih pra-render per pose) |
| Dizzy | Goyang rotasi ±6° + bintang berputar (sprite prosedural) |
| Kena X-Ray | Flash invert + tint cyan (versi invert pra-render) |
| KO | Rebah rotasi hingga 90°, fade 20% |
| Menang | Bounce 2x (oy +14, 8f naik, 8f turun) |
| Intro | Kuda-kuda, goyang halus; lalu `Idle` saat FIGHT! |

---

## 7. Fisika, Hitbox, dan Tabrakan

### 7.1 Satuan dan konstanta dunia (semua di `balance.ts`)

| Parameter | Nilai |
| --- | --- |
| Sumbu | `x` ke kanan, `y` ke ATAS, `y = 0` = lantai. Posisi fighter = titik tengah kaki |
| Lebar dunia | 2000 u; fighter dikunci di x ∈ [60, 1940]; mulai di x = 800 dan 1200 (jarak 400 u) |
| Tinggi karakter | 320 u (bisa diubah di config; hitbox ikut) |
| Jarak maksimum antar fighter | 1000 u (dinding kamera) |
| Kecepatan per frame | 1 u/dtk = 1/60 u/frame |
| Gravitasi | 3000 u/dtk² = 0,8333 u/frame² |
| Kecepatan lompat awal | 1300 u/dtk = 21,67 u/frame; puncak ≈ 271 u (integrasi diskret; ≈ 281 u kontinu); waktu di udara ≈ 52 f (±1 f) |

Integrasi: `vy -= GRAVITY; y += vy; if (y <= 0) mendarat`. Urutan operasi selalu sama (3.4). Test boleh memakai toleransi ±1 frame untuk airtime.

### 7.2 Hurtbox, pushbox, hitbox

- **Hurtbox** (kotak yang bisa dipukul), origin di kaki, lebar simetris di sekitar x:

| Posture | Ukuran (w × h) | Rentang y |
| --- | --- | --- |
| Berdiri | 110 × 320 | 0–320 |
| Jongkok | 120 × 176 | 0–176 |
| Udara | 110 × 280 | y_kaki sampai y_kaki + 280 |
| Knockdown / Down / GetUp / XRay / Grabbed | tidak ada | tidak bisa dipukul |

- **Pushbox:** lebar 70 (x ± 35), tinggi 0–180, hanya aktif saat fighter di tanah. Di udara tidak aktif (bisa melewati lawan).
- **Hitbox** (kotak serangan) ditulis sebagai `{ x, y, w, h }` dengan `x` = jarak dari titik tengah fighter ke **sisi dekat** kotak searah hadap, `y` = tinggi sisi bawah dari lantai (untuk air attack: dari kaki), `w`, `h`. Dicerminkan saat menghadap kiri. Aktif hanya pada frame active. Satu serangan mengenai satu target **sekali** per instance (kecuali multi-hit dengan `hitInterval`).
- **Pelengkap tinggi (RL-05).** Kelas tinggi serangan hanya penamaan: High = sisi bawah ≥ 180; Mid = melintasi 120–180; Low = sisi atas ≤ 100. Hasilnya berasal dari overlap AABB:

| Serangan (rentang y) | Berdiri | Jongkok (puncak 176) | Melayang (kaki di h) |
| --- | --- | --- | --- |
| N1 Jab (190–250) | kena | **meleset** | kena bila h ≤ 250 |
| N2 Hook (140–230) | kena | kena | kena bila h ≤ 230 |
| N3 Low Kick (15–85) | kena | kena | kena bila h ≤ 85 |
| N4 Roundhouse (110–260) | kena | kena | kena bila h ≤ 260 |
| C1 (90–145) | kena | kena | h ≤ 145 |
| C2 (100–175) | kena | kena | h ≤ 175 |
| C3 Sweep (0–45) | kena | kena | h ≤ 45 |
| C4 Uppercut (120–320) | kena | kena | h ≤ 320 (anti-air) |
| Proyektil S1 (190–240) | kena | **meleset** | kena bila h ≤ 240 (jendela lompat ≈ 20f di atas 240) |
| Proyektil S5 (0–60) | kena | **kena** | meleset bila h > 60 |

### 7.3 Gerak

| Parameter | Nilai |
| --- | --- |
| Jalan maju / mundur | 320 / 260 u/dtk × `char.speed` (5,33 / 4,33 u/frame) |
| Jongkok | tidak bergerak (RL-15) |
| Guard | jalan ×0,5 (RL-16) |
| Lompat | PreJump 4f → `vy0 = 21,67 u/frame`; kecepatan horizontal dasar `jumpSpeedX = 300 u/dtk × char.speed` |
| **Kontrol udara 60%** | `vx = jumpSpeedX × clamp(lockedDir + 0,6 × heldDir, −1, 1)` dengan `lockedDir ∈ {−1, 0, +1}` (arah saat takeoff, A = −1, D = +1) dan `heldDir` arah A/D yang ditahan saat ini. Contoh: terkunci +1 lalu menahan −1 → 0,4 × kecepatan (melambat tapi tidak berbalik); terkunci 0 dan menahan ±1 → 0,6 |
| **Dash darat** | startup 2f, aktif 12f pada 900 u/dtk (15 u/frame, ≈ 180 u), recovery 10f. Kebal **proyektil** pada f1–6. Pushbox tetap aktif (tidak menembus lawan). Arah: A/D yang ditahan; netral = ke arah lawan. Cooldown 72f dari frame pertama |
| **Air dash** | Hanya di udara, 1x per lompat. startup 2f, aktif 14f pada 1000 u/dtk (16,67 u/frame, ≈ 233 u), recovery 8f, **gravitasi ditangguhkan** selama startup + aktif, lalu jatuh normal. Arah: A/D yang ditahan = ke arah itu (mundur bila menahan arah menjauhi lawan); **netral = ke arah lawan dan melewatinya** (tanpa pushbox di udara) sehingga mendarat di sisi belakang (cross-up). Kebal proyektil f1–6. Berbagi cooldown 72f dengan dash darat |
| Knockback | Didorong sejauh `kb` u selama 10 frame, kecepatan menurun linear ke 0 (`v_i = 2·kb/10 × (1 − i/10)`). Saat Block: 50% `kb` |

### 7.4 Tabrakan badan, dinding, dan sudut

- **Pushbox di tanah:** dua fighter di tanah tidak boleh tumpang tindih. Bila overlap, keduanya didorong menjauh sama besar; bila salah satu menempel dinding, yang lain menerima seluruh koreksi.
- **Mendarat tepat di lawan:** setelah mendarat (state `Land`), bila pushbox overlap, fighter yang baru mendarat didorong 8 u/frame menjauhi titik tengah lawan sampai tidak overlap; bila x persis sama, didorong menjauhi tengah dunia.
- **Dinding dunia:** x fighter dikunci di [60, 1940]. **Dinding kamera:** setelah gerak, bila |x1 − x2| > 1000, fighter yang bergerak menjauh dikunci; bila keduanya, tiap fighter dikoreksi separuhnya.
- **Corner pushback (E10):** saat serangan mengenai atau diblok dan korban tidak bisa terdorong penuh karena dinding (dunia atau kamera), **sisa knockback × 0,5** diterapkan ke penyerang ke arah menjauh. Menghindari penyerang terus menekan sudut tanpa batas.
- **Cross-up:** hanya lewat lompat, air dash, atau Shadow Step (S7). Dash darat tidak bisa menembus lawan.

### 7.5 Proyektil (aturan umum)

- Tiap proyektil: `{ id, owner, template, x, y, vx, w, h, damage..., hitsLeft, lifetime, canBeParried, reflected }`.
- **Hilang** bila: mengenai target (kecuali multi-hit), keluar dunia, melewati jarak maksimum (1400 u dari penembak untuk S1), atau lifetime habis.
- **Clash (F7):** dua proyektil bertabrakan saling hilang, kecuali S2 dan S5 yang **menembus** proyektil kecil (S1, S8) dan tetap berjalan.
- **Reverse:** Perfect Parry pada proyektil membuatnya berbalik: pemilik = parrier, damage asli, kecepatan ×1,3, tidak bisa di-parry ulang. Proyektil yang dipantulkan boleh mengenai penembak.
- **Guard dinilai per hit** (multi-hit seperti S2, S8); Parry pada hit pertama membatalkan seluruh rangkaian.
- Jumlah maksimum aktif per fighter: S1 1, S2 1, S5 1, S8 3 (satu rentetan).

---

## 8. Aturan Combat

Semua angka di bagian ini adalah **nilai awal** yang hidup di `balance.ts` dan divalidasi lewat Training, scenario test, dan simulasi AI vs AI. Aturan ber-ID `RL-xx` dipakai sebagai rujukan test.

### 8.1 Rumus dan parameter global

| ID | Aturan | Nilai |
| --- | --- | --- |
| RL-30 | **Damage akhir** | `floor(base × char.damage × ai.mult × passive × counter × scale)`, minimum 1; HP bilangan bulat. `floor` hanya sekali di akhir. `ai.mult` hanya untuk fighter yang dikendalikan AI |
| RL-31 | **Chip damage** (diblok) | `floor(0,25 × floor(base × char.damage × ai.mult))`; HP **tidak bisa turun di bawah 1** karena chip; berlaku juga untuk Ultimate |
| RL-32 | **Scaling combo** menurut urutan hit dalam combo: hit 1–2 ×1,0 · hit 3 ×0,9 · hit 4 ×0,8 · hit 5 ×0,7 · hit 6+ ×0,6. **EX/Ultimate** yang dilepas lewat cancel (hit ke-2 atau lebih): ×0,8 **sekali** (satu faktor untuk seluruh jurus, tidak diskalakan per hit) | |
| – | HP awal per ronde | 1000 (karakter 900–1150 sesuai stat) |
| – | Stun Gauge maks | 100 (boss 150) |
| – | Energy maks | 100 |

Passive (9.4) yang mengubah damage masuk sebagai `passive` multiplier di rumus RL-30.

### 8.2 Serangan normal: empat tombol

Prinsip: setiap tombol = satu anggota badan dengan peran berbeda. **J** pukulan kanan cepat dan tinggi; **K** pukulan kiri menengah; **L** tendangan kiri rendah; **;** tendangan kanan berat (finisher knockdown). Tombol yang sama menghasilkan varian jongkok (tahan S) dan varian udara.

**Darat (berdiri)**: `x, y, w, h` = hitbox (7.2). Waktu dalam frame.

| Kode | Tombol | Nama | Startup / Active / Recovery | Hitbox (x, y, w, h) | Damage | Hitstun | Blockstun | Hit-stop | Knockback | Stun + | Chip | Cooldown tombol | Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| N1 | J | Jab | 5 / 3 / 9 | 30, 190, 75, 60 | 25 | 24 | 12 | 3 | 60 | +6 | 6 | 24 | Tinggi; meleset pada lawan jongkok; dapat rantai |
| N2 | K | Hook | 7 / 3 / 11 | 30, 140, 85, 90 | 35 | 26 | 14 | 4 | 80 | +8 | 8 | 30 | Menengah; dapat rantai |
| N3 | L | Low Kick | 8 / 4 / 13 | 30, 15, 100, 70 | 35 | 28 | 15 | 4 | 90 | +8 | 8 | 34 | Rendah; meleset pada lawan melayang di atas 85 u; dapat rantai |
| N4 | ; | Roundhouse | 11 / 4 / 22 | 20, 110, 140, 150 | 60 | knockdown | 18 | 6 | 220 | +15 | 15 | 60 | **Finisher**: knockdown, mengakhiri combo; heavy (armor tidak menahan) |

**Jongkok (tahan S + tombol)**

| Kode | Tombol | Nama | S / A / R | Hitbox | Damage | Hitstun | Blockstun | Hit-stop | KB | Stun + | Chip | CD | Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | S+J | Crouch Jab | 6 / 3 / 10 | 30, 90, 80, 55 | 20 | 24 | 12 | 3 | 50 | +6 | 5 | 26 | Poke rendah-menengah; dapat rantai |
| C2 | S+K | Crouch Hook | 8 / 3 / 12 | 30, 100, 90, 75 | 32 | 26 | 14 | 4 | 70 | +8 | 8 | 32 | Dapat rantai |
| C3 | S+L | Sweep | 10 / 4 / 20 | 30, 0, 130, 45 | 45 | knockdown | 16 | 6 | 120 | +10 | 11 | 60 | Menyapu kaki; meleset pada lawan melayang di atas 45 u; heavy |
| C4 | S+; | Uppercut | 9 / 4 / 24 | 20, 120, 80, 200 | 55 | knockdown | 14 | 6 | 100 | +15 | 13 | 60 | Anti-air; fighter naik sedikit saat aktif; heavy |

**Udara** (maks 2 per lompat, RL-08; `y` relatif ke kaki, boleh negatif)

| Kode | Tombol | Nama | S / A / R | Hitbox | Damage | Hitstun (target darat) | Blockstun | Hit-stop | KB | Stun + | Chip | CD | Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | J | Air Jab | 6 / 5 / 10 | 30, 10, 80, 90 | 22 | 20 | 12 | 3 | 60 | +6 | 5 | 20 | Cepat |
| A2 | K | Air Hook | 7 / 5 / 12 | 25, 60, 85, 120 | 28 | 22 | 13 | 4 | 70 | +8 | 7 | 26 | Menghadap atas-depan (anti jump-in) |
| A3 | L | Air Kick | 8 / 6 / 14 | 30, 0, 110, 80 | 32 | 24 | 14 | 4 | 90 | +8 | 8 | 30 | Jangkauan terjauh |
| A4 | ; | Dive Kick | 9 / sampai mendarat / 10 | 20, −50, 90, 120 | 50 | knockdown | 18 | 6 | 140 | +15 | 12 | 60 | Meluncur 45° ke bawah 500 u/dtk horizontal, 700 u/dtk vertikal; whiff → `DiveLand` 12f; kena/block → mendarat 4f; heavy; selalu yang terakhir di udara |

- **Konvensi frame (WAJIB, dipakai test).** Aksi yang diterima pada **step k** memulai state pada step k itu juga dengan `stateFrame = 0`; tiap step berikutnya (di luar `freeze`) menambah `stateFrame` 1. Startup = `stateFrame` 0 sampai startup−1; **hitbox aktif pada `stateFrame` ∈ [startup, startup + active)**; recovery = sisanya; durasi state = startup + active + recovery. Contoh N1 (5/3/9): aktif pada `stateFrame` 5–7, state berakhir setelah `stateFrame` 16 (17 frame). Event `Hit` untuk N1 yang ditekan pada step k keluar pada **step k + 5**. Cancel window = `stateFrame` ∈ [startup, startup + active + 6) (frame terakhir yang sah = startup + active + 5). **Hitstun** = jumlah step korban berada di state hitstun, dihitung mulai step pertama setelah `freeze` habis; selama `freeze` timer penyerang (termasuk cancel window) dan korban sama-sama berhenti (RL-17). Penomoran "fN–M" di prosa PRD (mis. kebal proyektil dash "f1–6") bersifat **1-based**: f1–6 = `stateFrame` 0..5.
- **Energy:** tiap normal yang kena +8 untuk penyerang (diblok: +4). **Hit-stop saat diblok:** 2f.
- **Reaksi korban:** target di udara yang terkena **selalu knockdown** (RL-48). Kolom "knockdown" = target darat juga knockdown.
- **Kenapa hitstun lebih panjang dari v1.3:** supaya rantai "tombol berbeda" yang dilakukan di dalam cancel window selalu menjadi true combo (korban tidak bisa lepas).
- **Pemeriksaan true combo:** hitstun ≥ (active + 5) + startup terlama (11) + 1 = 20 untuk N1/N2/C1/C2 dan 21 untuk N3; nilai di tabel (24–28) memenuhi dengan margin 4–7 frame (diverifikasi script, Bagian 18).

### 8.3 Rantai (chain), combo lock, dan cancel

| ID | Aturan |
| --- | --- |
| RL-34 | **Cancel window** N1, N2, N3, C1, C2: dari frame active pertama sampai `startup + active + 6`. Di dalam window, bila serangan **kontak** (hit atau block), menekan tombol normal **berbeda** langsung membatalkan sisa recovery dan memulai serangan tombol itu. Versi (berdiri/jongkok) ditentukan S pada saat cancel. N4, C3, C4 tidak punya cancel (finisher) |
| RL-35 | **Combo lock:** dalam satu combo (atau satu blockstring), tiap tombol normal (J, K, L, ;) hanya boleh dipakai **1 kali**. Menekan tombol yang sudah dipakai diabaikan. Combo/blockstring berakhir saat korban kembali ke state yang `canAct` (atau masuk `KnockdownFly`). Ini mencegah infinite combo secara pasti: panjang maksimum 4 normal |
| RL-36 | **Skill cancel:** Special (I), EX (O), Ultimate (P) boleh dilepas dari N1–N3 / C1–C2 **yang kena (hit, bukan block)** dalam cancel window. Tiap satu hanya sekali per combo. Special/EX/Ultimate yang kena dengan reaksi knockdown mengakhiri combo |
| – | **Rantai di block** memakai aturan yang sama; blockstun lebih pendek dari hitstun (12–15 vs 24–28), sehingga rantai yang dilakukan di akhir window memberi celah 1–3 frame yang memungkinkan lawan memulai Parry |
| – | **Whiff** tidak membuka cancel apa pun (RL-19) |

Contoh combo valid: J → K → L → ; (4 hit, 139 damage dengan scaling); J → K → Ultimate; L → J → Special. Contoh tidak valid: J → J (tombol sama), J → K → J, ; → apa pun.

### 8.4 Cooldown per tombol dan serangan lain

| ID | Aturan |
| --- | --- |
| RL-33 | Cooldown normal dihitung per **tombol** (J/K/L/;), mulai dari frame pertama serangan, nilainya dari kolom CD di 8.2 (lebih panjang dari durasi serangan sehingga menekan tombol yang sama beruntun tidak berguna). Input tombol yang **ditekan saat cooldown aktif dibuang** (tidak masuk buffer 6f; di Training ikon tombol berwarna abu-abu) |
| – | **Special:** cooldown dari template (9.2), mulai saat cast. **EX:** cooldown sendiri = 50% dari cooldown Special karakter. **Dash** (darat dan udara): 72f dari frame pertama. Ketiganya tampil sebagai radial di HUD |
| – | Cooldown dan timer direset tiap ronde (kecuali Energy yang carry-over) |

### 8.5 Resolusi hit (langkah 10–11 di 3.4)

1. **Kandidat hit:** pasangan (hitbox atau proyektil penyerang, hurtbox bertahan) yang overlap, belum mengenai target ini pada instance serangan yang sama, dan target tidak kebal terhadapnya.
2. **Kebal dan armor:** `invuln: all` mengabaikan semua; `projectile` mengabaikan proyektil; `upperBody` mengabaikan hitbox yang sisi bawahnya ≥ 120. **Armor** (EX +1, Super Armor boss) menahan **1 hit non-heavy**: damage tetap masuk, tanpa hitstun, tanpa knockback, armor habis. Serangan **heavy** (N4, C3, C4, A4, semua Ultimate, S3) tidak ditahan armor. **U5 (grab) mengalahkan kebal dan armor** (RL-39).
3. **Prioritas (RL-37), per kandidat:** (a) bertahan di jendela Parry dan serangan bisa di-parry → **Perfect Parry**; (b) bertahan dalam Guard/GuardCrouch/Blockstun, serangan bisa di-guard → **Block**; (c) selain itu → **Hit**. Guard tidak terarah (menahan semua sisi, termasuk serangan dari belakang).
4. **Trade (RL-38):** semua kandidat dikumpulkan lebih dulu, lalu diterapkan bersamaan. Dua serangan yang saling mengenai pada frame yang sama: **keduanya kena**, tanpa bonus Counter. Double K.O. = ronde seri (Bagian 11).
5. **Multi-hit (RL-40):** Guard dinilai **per hit**; Perfect Parry pada hit pertama membatalkan seluruh rangkaian (penyerang → `ParryStunned`).
6. **Efek Hit** (berurutan): damage (RL-30) → stun (bila tidak Dizzy dan tidak immunity) → Energy (penyerang +, bertahan +5 per hit, maks +15 per combo, chip tidak dihitung) → reaksi (`HitstunLight/Heavy/Crouch` bila korban darat dan serangan tidak knockdown; `KnockdownFly` bila korban melayang atau serangan knockdown) → knockback (7.3) → `freeze = hit-stop` untuk **kedua** fighter → combo tracker → event.
7. **Efek Block:** chip (RL-31), 0 stun, bertahan ke `BlockstunStand/Crouch` selama `blockstun`, penyerang +50% Energy, hit-stop 2f, knockback 50%.
8. Serangan melee tidak menghancurkan proyektil. Proyektil bertabrakan: 7.5.
9. **Tidak ada throw biasa (RL-52).** Hanya U5 yang berupa cengkeraman.

### 8.6 Guard dan Perfect Parry

| ID | Aturan |
| --- | --- |
| RL-41 | **Normal Guard:** tahan Space. Damage jadi chip, stun 0, tanpa Guard Gauge dan tanpa guard break (RL-51: pengaman anti-turtle hanya chip dan HP% saat Time Over). Hanya di tanah |
| RL-41a | **Perfect Parry:** Space **tekan baru** membuka jendela `Parry` **12 frame** (P5 Parry Master: 14f), dihitung dari frame tekan. Serangan yang mendarat di dalam jendela: damage 0, tanpa chip; bertahan +25 Energy (P5: +30); hit-stop 8f; penyerang → `ParryStunned` 48f (0,8 dtk); bertahan → `ParrySuccess` dan membuka **Counter window 48f** |
| RL-42 | **Parry lock:** setelah menekan Space, 24f tidak bisa membuka jendela Parry lagi (Guard biasa tetap boleh). Parry yang tidak kena tidak menimbulkan hukuman lain selain lock dan `GuardRelease` bila Space dilepas (RL-24) |
| RL-43 | **COUNTER:** serangan pertama bertahan dalam Counter window 48f: damage ×1,25 dan Stun +25 (tambahan di atas stun normal). Label COUNTER |
| – | **REVERSE:** Perfect Parry pada proyektil memantulkannya (7.5); label REVERSE |
| – | **Parry terhadap Ultimate:** Ultimate gagal, penyerang → `UltParried` 90f (1,5 dtk), Energy yang sudah dipakai **tetap hangus** (kalimat lama "Energy lawan hangus" dibuang) |
| – | **Parry terhadap U5:** bisa (U5 tidak bisa di-guard, tetapi bisa di-parry) |
| – | Parry tidak bisa dilakukan di udara, saat recovery, hitstun, atau Dizzy (RL-04) |

### 8.7 Stun Gauge dan Dizzy

| ID | Aturan |
| --- | --- |
| RL-44 | Stun Gauge bertambah saat **Hit** (nilai di tabel serangan, Special, Ultimate); **Block = 0**. Peluruhan 12 per detik (0,2/frame) setelah 3 dtk (180f) tidak terkena hit; peluruhan **berhenti selama Guard/Blockstun** |
| RL-45 | Gauge mencapai 100 → `Dizzy` 150f (2,5 dtk) dan gauge reset ke 0. Tiap tekan A atau D memotong 6f (min total 90f). Setelah pulih: **Stun Immunity 180f** (3 dtk). Hit saat Dizzy **tidak** menambah stun dan **tidak** memperpendek dizzy (hanya damage). P1 Iron Skin: stun diterima ×0,8. Boss: dizzy 90f, immunity 360f |

### 8.8 Energy / CA Gauge (0–100)

| Sumber | Nilai |
| --- | --- |
| Normal kena / diblok | +8 / +4 |
| Special kena / diblok | +12 / +6 |
| Menerima damage (tiap hit, chip tidak dihitung) | +5, maks +15 per combo |
| Perfect Parry | +25 (P5: +30) |
| EX Special kena, Ultimate kena | 0 |

- **RL-46:** mulai 0 di Ronde 1, **carry-over antar ronde**, reset saat match baru. P2 Quick Charge: Energy dari serangan +25% (parry dan damage diterima tidak).
- **EX (50):** versi lebih cepat dan kuat dari Special (9.5). **Ultimate (100):** Bagian 9.3. Ultimate yang whiff, di-parry, atau terganggu: Energy tetap hangus.

### 8.9 Knockdown, bangun, dan reaksi

| ID | Aturan |
| --- | --- |
| RL-47 | **Knockdown:** `KnockdownFly` ±24f (terlempar sejauh knockback, melengkung setinggi ±60 u) → `Down` 40f → `GetUp` 30f. Selama ketiganya **tidak bisa dipukul** dan kebal (RL-13). Tanpa quick-rise. Total ±94f (1,6 dtk) memberi penyerang waktu mengatur posisi |
| RL-48 | **Tanpa juggle:** korban yang melayang lalu terkena = `KnockdownFly`; korban yang sedang KnockdownFly/Down/GetUp tidak bisa terkena apa pun |
| RL-49 | **Corner pushback:** lihat 7.4 |
| RL-51 | **Anti-turtle:** tanpa Guard Gauge. Pengaman = chip damage + keputusan Time Over berdasarkan HP% + serangan jongkok/udara yang melewati posisi bertahan |
| RL-52 | Tidak ada throw biasa; hanya U5 |

### 8.10 Definisi hit dan combo counter

- **RL-50:** satu "hit" = satu kontak yang menyebabkan Hit (bukan Block, bukan Parry) pada korban yang sedang berada di rantai hitstun. Serangan multi-hit menghitung tiap hit (U3 = 7). Proyektil juga dihitung.
- Combo dimulai pada hit pertama terhadap korban yang `canAct`; **berakhir** saat korban kembali `canAct` atau masuk `KnockdownFly`. Counter tampil mulai **2 hit**, hilang 1 dtk setelah combo selesai. Damage total combo = jumlah damage (chip tidak dihitung).
- Untuk statistik dan grade: max combo di-cap 10 hit.
- Combo juga melacak `buttonsUsed` (RL-35) dan `skillsUsed` (RL-36).

---

## 9. Skill Kit

Tiap karakter memilih **1 Special, 1 Ultimate, 1 Passive** dari library template. Tiap template ditulis sebagai **data TypeScript** (`src/data/templates/*.ts`, bentuk di Lampiran A.6): frame, hitbox, gerak, kebal/armor, biaya, cooldown, `aiHints`, kunci VFX dan SFX. Engine dan AI hanya membaca data ini (H1), tidak ada kode khusus per karakter.

### 9.1 Aturan umum skill

| ID | Aturan |
| --- | --- |
| RL-80 | Special, EX, Ultimate hanya bisa dimulai di tanah (RL-03). Cooldown Special mulai saat cast (frame pertama state `Special`) dan tampil sebagai radial di HUD |
| RL-81 | Special tidak butuh Energy. EX butuh 50, Ultimate butuh 100; Energy dikurangi saat state dimulai dan **tidak kembali** bila whiff, di-parry, atau terganggu |
| RL-82 | Special/EX/Ultimate hanya bisa di-cancel dari N1–N3 / C1–C2 yang **kena** (RL-21). Skill yang kena dengan reaksi knockdown mengakhiri combo |
| RL-83 | Hanya satu Special, satu EX, dan satu Ultimate per combo (RL-36) |
| RL-84 | Armor: lihat 8.5 langkah 2. Kebal `upperBody` hanya terhadap hitbox yang sisi bawahnya ≥ 120 |
| RL-85 | Proyektil mengikuti aturan 7.5 (clash, reverse, guard per hit) |

### 9.2 Special (S1–S8)

Kolom waktu: Startup (frame sampai aksi/spawn) / Active / Recovery. Semua damage sebelum `char.damage`, scaling, dan passive. `chip` = `floor(0,25 × damage)`.

| Kode | Nama | S / A / R (f) | CD (f) | Damage | Chip | Stun + | Energy (hit / block) | Bentuk dan gerak | Reaksi korban | Kebal/Armor | Counter-play |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | Energy Bolt | 14 / – / 20 | 150 | 90 | 22 | +18 | +12 / +6 | Proyektil 80×50 pada y 190 (190–240), spawn 60 u di depan, 650 u/dtk (10,83 u/f), hilang saat 1400 u dari penembak (≈129 f), maks 1 aktif, hit-stop 4f | HitstunHeavy 28f, KB 120 | – | Jongkok, lompat (jendela ≈ 20f), dash, guard, parry (REVERSE) |
| S2 | Wave Burst | 20 / – / 26 | 210 | 2 × 50 | 12 | +10 per hit | +6 per hit | Gelombang 150×130 pada y 0 (0–130), 350 u/dtk (5,83 u/f), lifetime 171f (≈1000 u), **2 hit** dengan jeda 10f, menembus proyektil kecil | Hit 1: HitstunHeavy 24f KB 30; Hit 2: **knockdown** KB 140 | – | Lompat, guard, dash |
| S3 | Rising Strike | 7 / 6 / 34 | 240 | 70 | 17 | +15 | +12 / +6 | Uppercut: hitbox 90×230 (x 20, y 0–230), fighter naik ±150 u selama active | **Knockdown** KB 100 (heavy) | `upperBody` f1–8 | Guard lalu punish (recovery 34f), serangan rendah (N3, C3) |
| S4 | Charge Rush | 12 / 14 / 20 | 240 | 55 | 13 | +12 | +12 / +6 | Lunge 300 u selama 14f (21,43 u/f), hitbox 110×170 (y 20–190) bergerak bersama fighter; lunge **berhenti saat kontak** (hit atau block) | HitstunHeavy 26f, KB 140 | **Armor 1 hit non-heavy** f1–12 (startup) | Mundur, lompat, parry |
| S5 | Ground Shock | 16 / – / 24 | 180 | 80 | 20 | +15 | +12 / +6 | Gelombang rendah 100×60 pada y 0 (0–60), 500 u/dtk (8,33 u/f), lifetime 132f (≈1100 u), menembus proyektil kecil | HitstunHeavy 30f, KB 150 | – | **Hanya lompat atau dash** (jongkok tidak aman) |
| S6 | Counter Stance | stance 36 (siap f6–36) / strike 6+4 / 20 | 300 | 100 | – | +20 | +12 | Postur 36f; **siap membalas f6–36**. Whiff: recovery 24f. Bila terkena melee atau proyektil biasa saat siap: serangan lawan dibatalkan (tanpa damage), hit-stop 8f, lalu serangan balasan otomatis (hitbox 120×220 di x 20, y 60) yang **pasti kena** (lawan dalam hit-stop/`ParryStunned`). Terhadap proyektil: proyektil dipantulkan (aturan REVERSE) | **Knockdown** KB 160 | Counter-ready (tidak bisa melawan Ultimate dan U5) | Bait lalu serang saat recovery; Ultimate; jarak jauh |
| S7 | Shadow Step | 10 / – / – lalu strike 8 / 4 / 24 | 300 | 50 | 12 | +12 | +12 / +6 | Kebal f1–12; menghilang lalu muncul 90 u di **belakang** lawan (sisi berlawanan dari posisi saat ini; bila posisi itu keluar dunia/dinding kamera, muncul di sisi terdekat yang valid, H5), menghadap lawan, lalu menyerang: hitbox 100×150 (x 25, y 60–210) | HitstunHeavy 24f, KB 90 | `all` f1–12 | Baca arah, guard (guard tidak terarah) |
| S8 | Triple Shot | 12 / 3 tembakan tiap 8f (f12, f20, f28) / 24 | 180 | 3 × 30 | 7 | +6 per hit | +4 per hit | 3 proyektil kecil 40×30 pada y 190 (190–220), 700 u/dtk (11,67 u/f), lifetime 120f, maks 3 aktif | HitstunLight 18f per hit, KB 40 | – | Jongkok, lompat, S2/S5 menembus |

### 9.3 Ultimate (U1–U5, 100 Energy)

Urutan: `UltFreeze` 30f (semua beku, layar redup, nama jurus) → `UltStartup` → `UltActive` → `UltRecovery`. Total damage ≈ 320. **Cinematic X-Ray penuh (1,2 dtk) dimulai saat Ultimate mengenai (Hit, bukan Block)**; untuk U3 saat hit pertama mengenai. Bila diblok: chip (floor(0,25 × damage), U3 per hit), tanpa cinematic. Detail cinematic di 13.8.

| Kode | Nama | Startup | Active | Recovery | Damage | Chip | Stun + | Gerak dan hitbox | Guard / Parry |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| U1 | Lunge Beam | 12 | lunge 150 u / 8f (18,75 u/f) lalu sinar 20f | 40 | 320 (1 hit) | 80 | +40 | Sinar x 0, y 100, w 450, h 110 (100–210) di depan posisi akhir lunge | Bisa di-guard dan di-parry |
| U2 | Lightning Storm | 18 | 24 (4 sambaran visual tiap 6f; **satu** event hit di sambaran pertama) | 44 | 320 (1 hit) | 80 | +50 | Area x 0, y 0, w 600, h 450 (semua ketinggian) | Bisa di-guard dan di-parry |
| U3 | Rush Barrage | 12 | lunge 300 u / 12f (25 u/f), bila kontak: **7 hit** tiap 6f | 36 | 7 × 46 = 322 | 11 per hit (77) | +6 per hit (≈ +40) | Lunge hitbox 100×170 (y 20–190). Tiap hit dinilai guard terpisah; parry pada hit pertama membatalkan seluruhnya. Cinematic mulai setelah hit pertama kena | Guard per hit; parry hit pertama |
| U4 | Shockwave Slam | 16 (melompat naik, state udara, bisa terganggu) | slam 6f saat mendarat | 44 | 320 (1 hit) | 80 | +40 | Hitbox pendaratan x −60, y 0, w 480, h 220: mengenai tanah **dan** udara (kaki ≤ 220) | Bisa di-guard dan di-parry |
| U5 | Reversal Grab | **18** | lunge 300 u / 12f (25 u/f); bila kontak: cengkeram + banting (cinematic) | 50 bila whiff | 320 (1 hit) | – | +40 | Hitbox cengkeram x 0, y 0, w 150, h 130 (rendah-menengah) | **Tidak bisa di-guard**, bisa di-parry, bisa dihindari dengan lompat (kaki > 130) atau dash; **mengalahkan kebal dan armor** (RL-39) |

- Pose penyerang: `ultimate`; pose korban: `xray`. Aura warna penyerang mewarnai semua efek.
- Penyerang tidak kebal setelah freeze; bila terkena hit saat `UltStartup`, Ultimate gagal dan Energy tetap hangus.

### 9.4 Passive (P1–P7, satu per karakter)

| Kode | Nama | Efek |
| --- | --- | --- |
| P1 | Iron Skin | Stun yang diterima ×0,8 |
| P2 | Quick Charge | Energy dari serangan (kena/blok) +25% |
| P3 | Combo Master | Hit ke-3 dan ke-4 dalam combo: damage +15% (sebelum scaling) |
| P4 | Last Stand | Damage +15% saat HP < 25% |
| P5 | Parry Master | Jendela Parry 14f; Energy dari Perfect Parry +30 |
| P6 | Evasive | Cooldown dash −25% (72f → 54f) |
| P7 | Sharp Special | Cooldown Special −20% |

### 9.5 EX Special (50 Energy)

- **Aturan (H3):** damage ×1,5, jangkauan dan kecepatan ×1,3, startup −2f, **+1 armor** (ditambahkan ke armor bawaan template bila ada), cooldown EX sendiri = 50% cooldown Special (tidak memengaruhi cooldown Special). **EX S6 = serangan balasan 150 damage.**
- **Efek X-Ray singkat 0,4 dtk (24f)** saat EX mengenai (tanpa cinematic penuh).
- Angka EX turunan (dibulatkan ke bawah):

| Template | Startup | Damage | Chip | Stun + | Kecepatan | Cooldown EX (f) |
| --- | --- | --- | --- | --- | --- | --- |
| S1 EX | 12 | 135 | 33 | +27 | 845 u/dtk | 75 |
| S2 EX | 18 | 2 × 75 | 18 | +15 per hit | 455 u/dtk | 105 |
| S3 EX | 5 | 105 | 26 | +22 | – (naik ±195 u) | 120 |
| S4 EX | 10 | 82 | 20 | +18 | lunge 390 u | 120 |
| S5 EX | 14 | 120 | 30 | +22 | 650 u/dtk | 90 |
| S6 EX | 36 (stance) | 150 | – | +30 | – | 150 |
| S7 EX | 8 | 75 | 18 | +18 | – | 150 |
| S8 EX | 10 | 3 × 45 | 11 | +9 per hit | 910 u/dtk | 90 |

### 9.6 `aiHints`, VFX, dan SFX per template

`aiHints` dipakai AI (Bagian 12): `range` = jarak ideal (unit, titik tengah ke titik tengah), `use` = kondisi, `bait` = cara memancing.

| Template | aiHints (range; use; bait) | VFX (prosedural, tint aura) | SFX key |
| --- | --- | --- | --- |
| S1 | 350–900; lawan jauh atau lompat mendekat; sering | Orb `projectile.png` + jejak, percikan saat kena | `special_cast`, `proj_bolt`, `special_hit` |
| S2 | 300–700; lawan menahan/jongkok, menutup ruang; setelah lawan mendarat | Bulan sabit besar bergelombang | `special_cast`, `proj_wave`, `special_hit` |
| S3 | 0–180; anti-air saat lawan lompat dekat; punish setelah blok | Jejak vertikal + debu | `rising`, `special_hit` |
| S4 | 150–420; lawan diam atau habis menembak | Afterimage + garis kecepatan | `rush`, `special_hit` |
| S5 | 250–800; lawan sering jongkok | Retakan lantai merambat | `shock_ground`, `special_hit` |
| S6 | 80–220; saat lawan agresif dan dekat; tahan diam sebagai bait | Cincin aura berdenyut di sekeliling | `counter_stance`, `counter_hit` |
| S7 | 120–500; lawan menembak atau di sudut | Asap + kilatan pada hilang dan muncul | `shadow_step`, `special_hit` |
| S8 | 300–900; zoning rutin | Tiga peluru kecil berjajar | `triple_shot`, `special_hit` |
| U1 | 150–450; combo cancel, lawan Dizzy | Sinar menyilaukan + ring | `ultimate_charge`, `ult_beam`, `xray_shock` |
| U2 | 0–600; lawan tidak mungkin menghindar (Dizzy/recovery) | Sambaran petir dari atas | `ultimate_charge`, `ult_thunder`, `xray_shock` |
| U3 | 100–350; combo cancel | Rangkaian pukulan berbayang | `ultimate_charge`, `ult_barrage`, `xray_shock` |
| U4 | 100–400; lawan di tanah, setelah knockdown reposisi | Gelombang kejut melingkar | `ultimate_charge`, `ult_slam`, `xray_shock` |
| U5 | 100–320; lawan sering guard; setelah parry stun | Kilatan cengkeram | `ultimate_charge`, `ult_grab`, `xray_shock` |

---

## 10. Roster, Boss, dan Konten Karakter

### 10.1 Data karakter dan power budget

Roster awal 5 karakter (teman sekolah; izin sudah ada) dan harus bisa tumbuh jadi satu kelas (±36) atau satu angkatan (100+) tanpa ubah kode. Perbedaan antar karakter dibangun dari **Skill Kit** (Bagian 9) plus stat.

- Tiap karakter = 1 entri `roster.json` (divalidasi Zod, Lampiran A.7): `id` (slug, juga nama folder aset), `name`, `nickname?`, `kelas`, `aura` (hex), `role` (`Balanced | Rushdown | Zoner | Tank | Counter`), `stats {hp, speed, damage}`, `special {template, name}`, `ultimate {template, name}`, `passive`, `quote`, `winQuote`, `loseQuote`, `visual` (deskripsi untuk generator aset, tidak dipakai engine).
- **Power budget:** HP 900–1150, speed 0,85–1,15, damage 0,95–1,05, dan **poin stat** `(hp − 1000)/1000 + (speed − 1) + (damage − 1)` harus berada di ±0,10 (konstanta `POWER_BUDGET` di `balance.ts`; hasil roster awal: 0, +0,05, −0,10, +0,05, −0,05). Kekuatan Special, Ultimate, Passive diseimbangkan lewat template, bukan angka khusus per karakter.
- Kombinasi: 8 Special × 5 Ultimate × 7 Passive = 280, cukup untuk satu angkatan tanpa duplikat persis.
- Hanya karakter dengan aset **Tier A lengkap** (Bagian 16.2) yang muncul di Select Character.

### 10.2 Roster awal

| Slot | Nama | Aura | Role | HP / Speed / Damage | Special | Ultimate | Passive |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Ridho | Orange `#FF6A00` | Balanced | 1000 / 1,0 / 1,0 | S1 Energy Bolt | U1 Lunge Beam | P2 Quick Charge |
| 2 | Steven | Merah `#FF3B3B` | Rushdown | 900 / 1,15 / 1,0 | S4 Charge Rush | U3 Rush Barrage | P6 Evasive |
| 3 | Fadhiil | Biru `#2F8CFF` | Zoner | 950 / 1,0 / 0,95 | S8 Triple Shot | U2 Lightning Storm | P7 Sharp Special |
| 4 | Berliana | Hijau `#22D36B` | Tank | 1150 / 0,85 / 1,05 | S3 Rising Strike | U4 Shockwave Slam | P1 Iron Skin |
| 5 | Sahra | Ungu `#A855F7` | Counter | 1000 / 1,0 / 0,95 | S6 Counter Stance | U5 Reversal Grab | P5 Parry Master |

Aura dasar identitas game = orange; karakter ke-6 dst. memakai cyan, kuning, pink. Semua kelas RPL XII-4. Pemetaan nama ke slot mengikuti urutan input dan bisa ditukar tanpa mengubah kode.

### 10.3 Nama jurus dan quote (rekomendasi final + alternatif)

Nama jurus bertema dunia RPL (bahasa pemrograman, server, error). **Kolom 1 = default yang dipakai di `roster.json`;** kolom 2–3 adalah alternatif untuk diganti bebas.

| Karakter | Special (default / alt 2 / alt 3) | Ultimate (default / alt 2 / alt 3) |
| --- | --- | --- |
| Ridho (S1, U1) | Hello World / Ping Packet / Compile Bolt | Deploy to Production / Git Push --force / Sudo Beam |
| Steven (S4, U3) | Hot Reload / Speedrun Dash / Fast Forward | Infinite Loop / Fork Bomb / Brute Force |
| Fadhiil (S8, U2) | Triple Commit / Packet Burst / Spam Request | DDoS Storm / Server Overload / Thunder Cloud |
| Berliana (S3, U4) | Firewall Uppercut / Stack Push / Pop Stack | Kernel Panic / Stack Overflow / Blue Screen |
| Sahra (S6, U5) | Try / Catch / Error Handler / Reverse Proxy | Segmentation Fault / Null Pointer / Hard Reset |

**Quote final (VS Intro), kemenangan, dan kekalahan** (English, pendek, nyeleneh; alternatif lama di tabel 10.3b):

| Karakter | Quote VS Intro (final) | Kalimat menang | Kalimat kalah |
| --- | --- | --- | --- |
| Ridho | "Deploy complete. Prepare to lose." | "Build passed. You didn't." | "Rollback... I'll fix it in the next commit." |
| Steven | "Faster than your Wi-Fi." | "Loading screen? I skipped it." | "Lag. It was definitely lag." |
| Fadhiil | "Ping sent. Damage received." | "Out of range. Out of luck." | "Connection timed out." |
| Berliana | "Firewall up. Try me." | "Access denied." | "Firewall breached... who gave you the password?" |
| Sahra | "Request denied. Returning damage." | "Exception handled." | "Unexpected error. I blame the compiler." |

**10.3b Alternatif quote VS Intro:** Ridho: "Zero errors. Full power." / "Stay balanced. Hit clean." · Steven: "No lag. Only speed." / "Rush mode: ON." · Fadhiil: "Range is my favorite function." / "Stay back. I'm already firing." · Berliana: "Hit me. I dare you." / "Unbreakable. Unbothered." · Sahra: "Calm. Calculated. Countered." / "I read every move you make."

**`roster.json` awal** (`visual` diisi dari Character Sheet, Asset Pack bagian 3):

```json
[
  { "id": "ridho", "name": "Ridho", "kelas": "RPL XII-4", "aura": "#FF6A00", "role": "Balanced",
    "stats": { "hp": 1000, "speed": 1.0, "damage": 1.0 },
    "special": { "template": "S1", "name": "Hello World" }, "ultimate": { "template": "U1", "name": "Deploy to Production" },
    "passive": "P2", "quote": "Deploy complete. Prepare to lose.",
    "winQuote": "Build passed. You didn't.", "loseQuote": "Rollback... I'll fix it in the next commit.", "visual": "buzz-cut black hair, strong eyebrows, big dark-grey eyes with highlights, blush on cheeks, small black dots near the outer corners of the eyes, grey glen-check double-breasted blazer with black lapels, white shirt, black tie, wide black trousers, glossy black shoes" },
  { "id": "steven", "name": "Steven", "kelas": "RPL XII-4", "aura": "#FF3B3B", "role": "Rushdown",
    "stats": { "hp": 900, "speed": 1.15, "damage": 1.0 },
    "special": { "template": "S4", "name": "Hot Reload" }, "ultimate": { "template": "U3", "name": "Infinite Loop" },
    "passive": "P6", "quote": "Faster than your Wi-Fi.",
    "winQuote": "Loading screen? I skipped it.", "loseQuote": "Lag. It was definitely lag.", "visual": "TODO" },
  { "id": "fadhiil", "name": "Fadhiil", "kelas": "RPL XII-4", "aura": "#2F8CFF", "role": "Zoner",
    "stats": { "hp": 950, "speed": 1.0, "damage": 0.95 },
    "special": { "template": "S8", "name": "Triple Commit" }, "ultimate": { "template": "U2", "name": "DDoS Storm" },
    "passive": "P7", "quote": "Ping sent. Damage received.",
    "winQuote": "Out of range. Out of luck.", "loseQuote": "Connection timed out.", "visual": "TODO" },
  { "id": "berliana", "name": "Berliana", "kelas": "RPL XII-4", "aura": "#22D36B", "role": "Tank",
    "stats": { "hp": 1150, "speed": 0.85, "damage": 1.05 },
    "special": { "template": "S3", "name": "Firewall Uppercut" }, "ultimate": { "template": "U4", "name": "Kernel Panic" },
    "passive": "P1", "quote": "Firewall up. Try me.",
    "winQuote": "Access denied.", "loseQuote": "Firewall breached... who gave you the password?", "visual": "TODO" },
  { "id": "sahra", "name": "Sahra", "kelas": "RPL XII-4", "aura": "#A855F7", "role": "Counter",
    "stats": { "hp": 1000, "speed": 1.0, "damage": 0.95 },
    "special": { "template": "S6", "name": "Try / Catch" }, "ultimate": { "template": "U5", "name": "Segmentation Fault" },
    "passive": "P5", "quote": "Request denied. Returning damage.",
    "winQuote": "Exception handled.", "loseQuote": "Unexpected error. I blame the compiler.", "visual": "TODO" }
]
```

Deskripsi visual (rambut, outfit, aksesori) tinggal diisi di field `visual` dan Character Sheet; Ridho sudah ada dari `attack.png` (buzz cut hitam, blazer glen check abu-abu, dasi hitam, celana hitam lebar).

### 10.4 Boss Guru

- **Posisi:** match terakhir Arcade; tidak bisa dipilih di Select Character. Pool: **Atjep Rahmat, Muslih, Juliana Mansur** (izin sudah beres, semua aktif di production). Satu dipilih acak per run (`rngMatch`). Data di `bosses.json` (id, nama, aura, moveset, dialog, aset, `quirk`), terpisah dari `roster.json`. MVP (T3) belum ada boss; boss dibangun di F7, mulai dari satu guru, lalu dua lainnya tanpa ubah kode. Arena: Rooftop Wikrama.
- **Stat:** HP 1500, Stun Gauge maks 150, Dizzy 90f dengan immunity 360f. Hitbox, hurtbox, dan sprite **skala 1,15×**.
- **Super Armor (K4):** menahan 1 hit non-heavy selama startup Special (aturan armor 8.5). Perfect Parry tetap bekerja.
- **Dua fase:** Fase 1 (100–50% HP) pola normal. Fase 2 (< 50% HP): transisi 90f (aura jadi merah, dialog), Aggression +0,2, cooldown Special −25%, **1 jurus tambahan**.
- **Moveset:** 2 Special + 1 Ultimate + 1 jurus fase 2, semuanya dari template Skill Kit dengan modifier ukuran/damage. Kombinasi tiap guru harus berbeda.
- **Presentasi:** Boss Intro, Rooftop Wikrama, BGM boss, bar HP lebar dengan penanda fase di 50%.
- **AI:** satu tingkat di atas difficulty pilihan (maks Gelo). Target win-rate pemain melawan boss pada Normal ≈ 40%.
- **Aset boss:** minimum 14 pose per guru (`portrait, splash, idle, dash_f, n1_jab, n4_roundhouse, guard, hit_high, down, special, ultimate, xray, win, phase2`); pose lain otomatis fallback (6.6). Ideal: Tier A penuh + `phase2` = 33.

**Rakitan jurus (generik bertema sekolah).** Ciri khas pribadi tiap guru belum tersedia, jadi jurus dirakit dari trope guru yang umum (kuis dadakan, tenggat, spidol, remedial, absen) yang tidak mengklaim apa pun tentang orangnya. Isi `quirk` di `bosses.json` nanti oleh yang mengenal guru itu, lalu nama jurus boleh diganti.

| Guru | Konsep | Special 1 | Special 2 | Ultimate | Jurus fase 2 |
| --- | --- | --- | --- | --- | --- |
| Atjep Rahmat | The Strict Examiner | S1 "Surprise Quiz" (kertas ujian terbang) | S5 "Deadline Shockwave" | U2 "Final Exam" | S4 "Remedial Rush" |
| Muslih | The Marker Master | S8 "Marker Barrage" | S3 "Red Pen Rising" | U4 "Attendance Slam" | S2 "Whiteboard Wave" |
| Juliana Mansur | The Homework Queen | S2 "Homework Tsunami" | S6 "Pop Quiz Counter" | U5 "Grade Reversal" | S7 "Late Submission" |

**Dialog boss** (English, humor ringan; `{NAME}` = nama guru):

| Momen | Atjep Rahmat | Muslih | Juliana Mansur |
| --- | --- | --- | --- |
| Boss Intro baris 1 | "Closed-book exam. Open-handed beating." | "Sit down. Today's lesson is pain." | "Homework due: your defeat." |
| Boss Intro baris 2 | "Time starts... now." | "Questions? Answer them with your fists." | "No extensions. No mercy." |
| Fase 2 | "Enough warm-up. REMEDIAL CLASS!" | "Attendance is mandatory. So is losing." | "Late submissions get double damage!" |
| Boss menang | "See you in remedial class." | "Detention. Starting now." | "Grade: F. For Fight-less." |
| Boss kalah | "...Fine. Everyone passes. This time." | "Class dismissed... for today." | "I'll extend the deadline. Once." |

### 10.5 Batas humor

Tidak ada pembatasan dari developer: ejekan ringan, termasuk ke guru, aman karena izin sudah beres dan suasana santai; humor nyeleneh justru direkomendasikan. Tetap dijaga agar jenaka, bukan merendahkan. Daftar copy ada di 17.4.

---

## 11. Alur Match dan Grade

### 11.1 Urutan dan fase sim

`VS Intro → RoundIntro → Fighting → KO atau TimeOver → RoundEnd (pose menang) → (ronde berikut atau MatchEnd)`

| Fase sim | Durasi | Isi |
| --- | --- | --- |
| `RoundIntro` | banner ROUND n 72f (1,2 dtk), lalu FIGHT! | Fighter `Intro`; input diabaikan (RL-18). Ronde penentu setelah 1–1 menampilkan **FINAL ROUND** |
| `Fighting` | sampai KO atau timer habis | Input aktif |
| `KO` | slow-mo (platform `timeScale = 0,3` selama 600 ms real) + zoom 1,1× | Fighter pemenang menunggu |
| `RoundEnd` | 150f (2,5 dtk) | Pose `Win` pemenang, banner K.O./TIME OVER/PERFECT/DRAW |
| `MatchEnd` | – | Victory Overlay → Match Detail (atau match berikutnya di Arcade) |

### 11.2 Timer

- 3600 frame per ronde (tampil 60 → 0, `ceil`). **Berhenti** saat hit-stop, super freeze, cinematic, Pause, dan di luar fase `Fighting`. Training: ∞ dan tanpa Match Detail.
- Merah di bawah 10; berkedip di bawah 5.

### 11.3 Hasil ronde

- **Best of 3** (2 menang). HP direset ke nilai stat tiap ronde, Stun 0, cooldown reset, posisi reset (x 800 dan 1200, menghadap tengah), **Energy carry-over**.
- **K.O.** (HP 0): lawan menang. **Time Over:** HP% tertinggi menang. **Seri:** HP% sama atau double K.O. → ronde diulang, **maksimal 4 ronde total**; bila masih 1–1 → match **DRAW** (Arcade dihitung kalah).
- **PERFECT:** menang ronde tanpa kehilangan HP, termasuk menang Time Over dengan HP penuh (I3).
- Slow-mo K.O. = laju sim 0,3× (B6), bukan sekadar visual.

### 11.4 Pause, blur, dan hitung mundur

- **Pause:** Enter atau Esc (Bagian 5.5). **Ditunda** bila terjadi saat super freeze atau cinematic Ultimate/EX, dieksekusi setelah selesai (RL-23). Menu: Resume, How to Play, Settings, Restart (hanya Training), Quit (konfirmasi → Select Mode).
- **Auto-pause** saat tab blur, `visibilitychange` hidden, atau keluar fullscreen di Battle. Audio di-mute saat tab tersembunyi.
- **Resume** (dari menu atau setelah auto-pause): **hitung mundur 3 detik** (3, 2, 1) dengan sim beku dan input diabaikan; tidak berlaku di Training (langsung lanjut).

### 11.5 Rematch dan Arcade

- **Rematch:** konfigurasi sama, seed baru.
- **Continue (Arcade):** setelah kalah atau seri di sebuah match: layar Continue (hitung mundur 10 dtk, Yes/No). Maksimal **3 Continue** per run. Continue **mengulang match yang kalah dari ronde 0**, dan tiap Continue **mengurangi 10 poin** dari skor total Arcade. Kalah tanpa Continue (atau Continue habis) = **GAME OVER**.
- **Skor total Arcade** = rata-rata skor tiap match yang dimenangkan (rumus 11.7) − 10 × jumlah Continue, dibatasi 0–100, lalu dikonversi ke grade.

### 11.6 Layar akhir

- **Match Detail** (Quick Match): statistik, Grade (animasi count-up dan stempel), tombol Rematch dan Back to Select Mode.
- **Ending (tamat Arcade):** teks singkat (mis. "Graduation approved."), tabel per match (lawan, stage, hasil, jumlah ronde, waktu, HP% rata-rata, grade), **total grade**, total waktu, jumlah Continue. Bisa di-skip (Enter). Tombol ke Title.
- **Game Over:** teks singkat, tabel match yang sudah dilalui, tombol Coba Lagi dan Back to Title.

### 11.7 Statistik dan grade

`MatchStats`: total damage dealt/taken, max combo, parry sukses, proyektil kena, Ultimate kena, ronde menang, ronde perfect, waktu terpakai, difficulty, grade.

| Komponen skor | Maks |
| --- | --- |
| Menang match | 40 |
| Rata-rata HP% tersisa (semua ronde yang dimainkan, termasuk yang kalah) | 30 |
| Efisiensi waktu `1 − waktuTerpakai / waktuMaksimum`, dengan `waktuMaksimum = jumlahRondeDimainkan × 60 dtk` | 10 |
| Max combo (cap 10 hit) | 10 |
| Parry sukses (cap 5, 2 poin per parry) | 10 |

Skor × multiplier difficulty (Easy 0,9 · Normal 1,0 · Hard 1,1 · Gelo 1,2), cap 100. **Grade:** S ≥ 85, A ≥ 70, B ≥ 50, C < 50. Kalah = maksimal C. Grade terbaik per mode + difficulty + karakter disimpan (17.1).

---

## 12. AI Controller

Tujuan: lawan yang terasa seperti pemain sungguhan di tiap level. **Gelo = AI yang bermain seperti pemain asli** (membaca jarak, memancing, menghukum, beradaptasi), bukan AI yang curang. AI hidup di `src/engine/sim/ai/` dan hanya memakai informasi yang juga bisa dilihat pemain.

### 12.1 Arsitektur

1. **Keputusan tiap 4 frame** (diacak offsetnya per match dengan `rngAI`). Di antara keputusan, AI mengeksekusi antrean input.
2. **Aksi = input virtual** (`InputFrame`) yang identik dengan input pemain. AI tidak boleh mengubah state fighter secara langsung (dijaga lewat test: AI hanya mengeluarkan `InputFrame`).
3. **Pipeline:** `Perception` → `ThreatDetector` → `StrategyFSM` → `UtilityScorer` → `MacroExecutor`.

**Perception (apa yang AI lihat).** Posisi dan arah hadap kedua fighter, state dan **frame ke-berapa** state lawan, proyektil (posisi, kecepatan, pemilik, jenis), HP%, Stun lawan, Energy lawan (terlihat di HUD), cooldown milik sendiri, dinding terdekat, status combo, sisa timer, skor ronde. AI **tidak** membaca tombol mentah lawan. Pembacaan dari **ring buffer** snapshot yang tertunda sebesar `reactionFrames` (tabel 12.2).

**ThreatDetector.** Saat lawan memulai serangan (state serangan baru) dan sudah "terlihat" setelah delay reaksi, hitung `ttc` (frame sampai kontak) dari data frame serangan dan jarak. **Keputusan bertahan di-roll sekali per instance serangan (J3)** memakai `rngAI`, bukan tiap frame:

| Hasil roll (urutan) | Peluang |
| --- | --- |
| Parry (tekan Space tepat agar kontak jatuh di jendela 12f) | `pParry` |
| Guard (tahan Space; jongkok-guard bila serangan tinggi) | `pGuard − pParry` |
| Hindar (proyektil: jongkok/lompat/dash; melee: mundur/dash/lompat menjauh) | `pEvade` |
| Abaikan / lawan balik | sisanya |

Serangan dengan startup lebih kecil dari `minReactStartup` tidak bisa direaksikan sama sekali (Gelo: < 4f; Hard: < 6f; Normal: < 9f; Easy: < 14f).

**StrategyFSM.** `Neutral` (spacing), `Approach`, `Retreat`, `Pressure`, `Defend`, `Zone`, `Punish`, `Wakeup` (lawan baru knockdown), `AntiAir`, `Ultimate`. Transisi ditentukan oleh jarak, state/frame lawan, Energy, HP, dan aggression.

**UtilityScorer.** Tiap keputusan, kandidat aksi diberi skor `base × bobot persona × faktor situasi`, lalu dipilih lewat softmax dengan suhu `T` (Easy tinggi = acak; Gelo rendah = konsisten).

| Aksi kandidat | Skor tinggi ketika | Faktor situasi utama |
| --- | --- | --- |
| Jalan maju / mundur / tahan jarak | jarak di luar atau di dalam jangkauan ideal | selisih jarak dengan `idealRange` persona |
| Dash maju / menjauh | jarak jauh dan cooldown dash siap | aggression, ada proyektil lawan |
| Poke (N1/C1/N2) | dalam jangkauan, lawan tidak guard-crouch (untuk tinggi) | jarak, state lawan |
| Rendah (N3/C3) | lawan guard-crouch atau lompat belum terjadi | kebiasaan lawan (12.4) |
| Anti-air (C4, S3, A2) | lawan di udara mendekat dalam 220 u | `ttc` mendarat |
| Jump-in + air normal / air dash cross-up | jarak menengah, lawan diam atau menembak | aggression, cooldown dash |
| Rantai string (J-K-L-;) | konfirmasi hit (kontak bukan block) | combo lock, cancel window |
| Special (aiHints, 9.6) | sesuai `range` dan `use` template | cooldown, jarak, kebiasaan lawan |
| EX | Energy ≥ 50 dan untuk menembus tekanan (armor) atau memperpanjang punish | Energy, HP |
| Ultimate | 12.2 | Energy = 100 |
| Guard / jongkok-guard / tunggu | Defend; lawan agresif dan dekat | HP rendah, persona Counter/Tank |
| Bait (whiff sengaja lalu punish) | persona Counter, level Hard/Gelo | `rngAI` |

**MacroExecutor.** Mengubah aksi terpilih menjadi antrean `InputFrame` dengan waktu relatif (mis. string `J` lalu `K` hanya bila event kontak datang dalam cancel window). Antrean dikosongkan bila AI terkena hit, atau bila ancaman baru memicu roll bertahan.

### 12.2 Parameter level

| Parameter | Easy | Normal | Hard | Gelo |
| --- | --- | --- | --- | --- |
| Reaction delay (frame) | 36–54 | 21–30 | 9–15 | 2–5 |
| `minReactStartup` (frame) | 14 | 9 | 6 | 4 |
| Hindari proyektil `pEvadeProj` | 15% | 50% | 85% | 98% |
| Hindari melee `pEvadeMelee` (baru) | 5% | 15% | 30% | 45% |
| Guard `pGuard` (total bertahan) | 15% | 40% | 70% | 90% |
| Perfect Parry `pParry` | 0% | 10% | 35% | 65% |
| Aggression | 0,2 | 0,4 | 0,6 | 0,8 |
| Suhu softmax `T` | 1,5 | 0,9 | 0,5 | 0,25 |
| Damage multiplier | 0,85× | 1,0× | 1,1× | 1,25× |
| Perilaku serang | 1 hit lalu mundur | Rantai 2–3 hit | Rantai penuh + proyektil + Ultimate | Rantai penuh, bait parry, hukum whiff, Ultimate di saat tepat |
| **Syarat Ultimate (J4)** | acak saat Energy 100 | saat jarak pas dan Energy 100 | setelah cancel yang kena, atau saat lawan Dizzy/recovery | sama dengan Hard, plus kombinasi dengan bait/anti-air |
| Target win-rate pemain | 85–90% | ≈ 60% | 35–40% | 10–20% |

- **Training CPU = AI Normal (J9).** Boss memakai satu level di atas difficulty pilihan (maks Gelo).
- **Aturan fairness:** input sama dengan pemain; cooldown, Energy, parry lock berlaku sama; satu-satunya "keuntungan" adalah damage multiplier. AI tidak bisa guard saat startup/recovery sendiri. Parry AI Hard/Gelo dibatasi **1x per 3 detik** (180f); bila terkunci, AI memilih guard. Angka Gelo (guard 90%, parry 65%, damage 1,25×) adalah titik awal dan **divalidasi lewat simulasi AI vs AI dan playtest**; bila Gelo terasa tidak mungkin dikalahkan, turunkan `pParry` dulu.

### 12.3 Perilaku "seperti pemain asli" (Hard dan Gelo)

1. **Footsies:** menjaga jarak tepat di luar jangkauan poke lawan (dihitung dari data N1–N4 lawan), melangkah masuk-keluar untuk memancing whiff.
2. **Whiff punish:** bila lawan menyelesaikan serangan tanpa kontak dan masih recovery cukup lama (`recoveryLeft ≥ startupSaya + waktuTempuh`), langsung menghukum dengan rantai terkuat yang mungkin.
3. **Anti-air:** lawan melompat mendekat → C4, S3, atau A2 yang ditiming.
4. **Zoning:** memakai proyektil Special sesuai cooldown; melompati proyektil lawan dengan air normal.
5. **Mix-up:** setelah tekanan diblok, berganti antara tinggi (J), rendah (L), dan cross-up air dash; kadang berhenti untuk memancing parry lalu menghukum lock parry (24f).
6. **Tekanan bangun (Wakeup):** setelah knockdown, mengatur posisi agar serangan aktif tepat saat `GetUp` selesai (30f kebal).
7. **Manajemen resource:** menyimpan EX untuk menembus tekanan atau memperpanjang punish; Ultimate lewat cancel dari N1/N2 yang kena bila Energy 100.
8. **Pembaca lawan (12.4).**

### 12.4 Model kebiasaan lawan (Hard dan Gelo)

AI menghitung selama match: frekuensi lompat mendekat, penggunaan proyektil, lama menahan guard, rasio jongkok-guard, spam poke. Bobot aksi disesuaikan maksimal ±30%: lawan sering lompat → bobot anti-air naik; lawan terus guard → naik bobot rendah, sweep, U5; lawan menembak terus → naik bobot jump-in dan dash. Model direset tiap match.

### 12.5 Persona dari role

| Role | Bobot utama |
| --- | --- |
| Balanced | semua 1,0 |
| Rushdown | Approach 1,4 · Pressure 1,4 · Zone 0,4 · Defend 0,8; jangkauan ideal pendek |
| Zoner | Zone 1,6 · Retreat 1,2 · Approach 0,6; jangkauan ideal jauh |
| Tank | Defend 1,2 · Pressure 1,0 · pemakaian N4/Special berat lebih tinggi; maju lambat |
| Counter | Bait 1,6 · tunggu 1,3 · +10% `pParry` (maks 70%) · S6 sering dipakai sebagai bait |

Tiap template juga membawa `aiHints` (9.6), sehingga Charge Rush, Counter Stance, dan lainnya terasa berbeda saat dihadapi. Jarak dihitung dalam koordinat dunia dan menghormati batas 1000 u.

### 12.6 Anti-stall dan anti-loop

- **Anti-stall (J6):** bila 6 dtk (360f) tanpa interaksi (hit, block, parry), Aggression naik 0,1 per detik sampai +0,4; direset saat ada interaksi.
- **Anti-corner-loop:** bila AI mengulang string yang sama 3 kali di sudut tanpa hasil, pilih pola lain; bila posisi AI tidak berubah ±20 u selama 4 dtk, paksa `Approach`.
- **Time Over:** AI di depan HP% memilih bertahan (guard, jaga jarak); di belakang menaikkan aggression pada 15 detik terakhir.

### 12.7 Validasi (simulasi AI vs AI)

`scripts/simulate.ts` menjalankan N match headless (default 1000 per pasangan) dengan seed berurutan, lalu menulis **CSV**: win-rate per kombinasi karakter dan template, durasi rata-rata match, damage rata-rata, % Time Over, % double K.O., jumlah ronde. **Lolos** bila win-rate setiap pasangan karakter (AI Normal vs AI Normal, tukar sisi) berada di 35–65%. Hasil yang melenceng → ubah angka di `balance.ts` / template, bukan logika. Simulasi juga memeriksa: tidak ada combo > 4 normal + 1 Special, tidak ada match yang macet (> 5400 frame tanpa interaksi).

---

## 13. HUD, Game Feel, dan Cinematic

Acuan rasa: **Tekken** (bar besar yang terbaca, trail damage, round pips), **Honkai: Star Rail** (panel bersudut bersih, garis gradien bercahaya, partikel halus), **Genshin Impact** (ring dan ornamen aksen). Yang ditiru hanya rasa dan struktur; semua bentuk, nama, dan aset dibuat orisinal.

### 13.1 Identitas visual

- **Palet dasar:** hitam `#0A0A0D`, panel `#14141A`, orange `#FF6A00`, amber `#FFB020`, putih `#F4F4F6`. **Aksen aura** per karakter (merah `#FF3B3B`, biru `#2F8CFF`, ungu `#A855F7`, hijau `#22D36B`, cyan `#19E6FF`, kuning, pink). Aura dipakai untuk bingkai portrait, nameplate, tint proyektil dan VFX, cinematic Ultimate, serta highlight di Select Character. Warna HP bar tetap orange → amber (merah di bawah 25%) agar konsisten.
- **Gaya UI:** sudut terpotong (chamfer), garis diagonal, panel gelap berlapis dengan border tipis bercahaya, scanline halus, transisi glitch singkat (< 200 ms), partikel halus melayang di menu. Bahasa UI: **English** (FIGHT!, K.O., PRESS START).
- **Teknik:** semua bentuk HUD memakai `clip-path: polygon(...)`, gradien CSS, dan animasi `transform/opacity` (tanpa `filter: blur` live, tanpa `box-shadow` besar yang dianimasikan, karena T480). Glow dibuat dengan lapisan gradien statis atau gambar SVG pra-render.

### 13.2 Layout responsif (satuan `u`)

Kontainer HUD: `width: min(100vw, 190vh)`, `height: 100vh`, tengah horizontal; `--u = min(1vw, 1.7778vh)` (1u = 1% lebar bingkai 16:9 yang muat). Semua ukuran HUD ditulis dalam `u` dan elemen **di-anchor ke tepi bingkai**, bukan koordinat piksel. Pada 16:9, lebar bingkai = 100u, tinggi = 56,25u.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [P1 PORTRAIT] ◆◆                    ┌──────┐                   ◆◆ [P2 PORTRAIT]│
│  NAME  RPL XII-4   ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰ │ TIMER│ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰   NAME  RPL XII-4 │
│                    stun ▂▂▂▂▂▂▂▂▂   └──────┘   ▂▂▂▂▂▂▂▂▂ stun                 │
│                                                                              │
│  COUNTER!  (label 0,8 dtk)                                                   │
│  12 HITS  (combo, sisi penyerang)         [ ROUND 2 / FIGHT! banner tengah ] │
│  Damage 214                                                                  │
│                                                                              │
│                              (arena, fighter, damage number)                 │
│                                                                              │
│  (I) (O) (U)  cooldown radial                       cooldown radial (I)(O)(U)│
│  ▰▰▰▰▰▰▰▰▰▰▰▰ | EX | ULT  Energy                   Energy  ULT | EX | ▰▰▰▰▰▰ │
└──────────────────────────────────────────────────────────────────────────┘
```

| Elemen | Anchor | Offset (u) | Ukuran (u) | Catatan |
| --- | --- | --- | --- | --- |
| Timer | atas-tengah | y 1,2 | 9 × 9 (heksagon) | Orbitron 900; ring segmen berputar pelan; merah < 10, berkedip < 5; ∞ di Training |
| Portrait P1 | atas-kiri | x 2, y 1,5 | 7 × 7 | Bingkai oktagon bersudut + ring putus-putus berputar warna aura |
| HP bar P1 | atas-kiri | x 9,5, y 2,2 | 36 × 3,4 | Jajar genjang miring −18°; terisi dari sisi tengah, **menyusut ke tepi luar**; 3 lapis (dasar gelap dengan tick tiap 10%, trail, isi gradien); tanpa angka |
| Stun bar P1 | di bawah HP | y +0,5 | 30 × 0,7 | Kuning; berkedip di atas 75% |
| Nameplate P1 | di bawah stun | y +0,6 | tinggi 2,2 | UPPERCASE maks 12 karakter (Chakra Petch 700) + chip kelas + ikon role; garis miring warna aura |
| Round pips P1 | di bawah timer, kiri | x −5 | 2 berlian 1,4 | Terisi warna aura + kilau saat menang ronde |
| Energy P1 | bawah-kiri | x 2, bottom 2 | 28 × 2,2 | Segmen 100 dengan penanda 50 dan 100; cyan; ≥ 50 stok pertama menyala ("EX READY"); = 100 menyala penuh dengan chevron ("ULTIMATE READY") dan percikan |
| Cooldown radial P1 | bawah-kiri, di atas Energy | x 2, bottom 5 | 3 lingkaran 3,2 | Special (I), EX (O), Dash (U); sapuan radial, kilat saat siap |
| Combo counter | sisi penyerang (kiri bila penyerang = slot P1) | x 3, y 18 | angka tinggi 9 | "N HITS", angka berdenyut (skala 1→1,25→1 dalam 6f); warna putih (2–3), amber (4–5), orange (6+); total damage menghitung naik |
| Label COUNTER/PARRY/REVERSE/PERFECT | di atas area combo | y 13 | tinggi 4 | 13.6 |
| Banner besar | tengah | y 40% tinggi | tinggi 14 | 13.6 |
| Key hints | bawah-tengah | bottom 1 | tinggi 2,4 | Hanya Training dan How to Play; toggle di Settings |
| P2 | cermin P1 | – | – | **HUD P1 selalu di kiri dan lawan di kanan, tidak mengikuti posisi di arena**; fighter boleh bertukar sisi |

- **Boss:** bar HP lebar (±60 u) di atas-tengah di bawah timer, nama boss besar, penanda fase di 50%.
- **Training:** panel kecil di kanan (perilaku dummy, frame data, input display).
- **Low HP < 20%:** vignette merah berdenyut pelan (siklus 60f) + bar HP berdenyut.
- **Layar sangat sempit/lebar:** karena bingkai HUD dibatasi `min(100vw, 190vh)` dan `--u` ikut mengecil, tidak ada elemen yang keluar layar.

### 13.3 Font

Semua lewat `next/font/google` (self-hosted, subset latin, `display: swap`), bobot dibatasi. Nama font diverifikasi di `/dev/fonts` (halaman dev yang menampilkan semua gaya); bila ada nama yang tidak tersedia, pakai cadangan.

| Peran | Font | Cadangan | Gaya |
| --- | --- | --- | --- |
| Logo dan banner besar (ROUND, FIGHT!, K.O., PERFECT) | **Dela Gothic One** | Russo One | Miring (skew −8°), gradien, outline tebal, bayangan keras |
| Label combat dan angka combo (COUNTER, PARRY, REVERSE, N HITS), damage number | **Zen Dots** | Audiowide | Miring −12°, gradien, outline, glitch RGB saat masuk |
| Timer | **Orbitron** 900 | Rajdhani 700 | Angka tebal terbaca jauh |
| HUD dan menu (nama, teks, tooltip, tombol) | **Chakra Petch** 600/700 | Rajdhani 600 | Kotak, sudut terpotong |

Karena font ditampilkan lewat canvas juga (damage number), atlas digit baru dibuat setelah `document.fonts.load()` selesai untuk tiap font.

### 13.4 Perilaku komponen HUD

- **HP bar:** `value` dari snapshot (≤ 30 Hz). Lapisan isi mengikuti nilai seketika; lapisan trail (putih-amber) menyusut dengan CSS transition 0,5 dtk setelah jeda 0,25 dtk setelah kena. Tick tiap 10%. Di bawah 25%: isi berubah merah dan berdenyut. Bar boleh bergetar 3 px saat menerima hit (CSS keyframes, 120 ms).
- **Energy:** stok 50 dan 100 menyala saat tercapai; sekali berbunyi `energy_ready`.
- **Cooldown radial:** `conic-gradient` yang diperbarui lewat CSS variable (≤ 30 Hz); kilat putih singkat saat siap.
- **Round pips:** berlian kosong → terisi (animasi skala + kilau 12 frame).
- **Portrait:** ring putus-putus berputar (CSS), glow aura; saat Energy = 100 ring berdenyut. Saat HP < 25% bingkai memerah.

### 13.5 Damage number melayang (semua mode)

Digambar di **kanvas** dengan atlas digit pra-render per gaya (tanpa `fillText` per frame), pool maksimum 12 aktif. Toggle di Settings (default ON). Animasi mengikuti `vfxFrame` sehingga tetap bergerak saat hit-stop.

| Parameter | Nilai |
| --- | --- |
| Posisi muncul | Titik tengah overlap hitbox–hurtbox, x ± 24 u acak (RNG visual), y = tengah hurtbox + 40 |
| Gerak | Pop 0,6→1,25 dalam 4f lalu 1,0 dalam 4f; naik 70 u selama 48f (ease-out); memudar 12f terakhir; umur 48f (0,8 dtk) |
| Stacking | Angka dalam satu combo muncul dengan offset vertikal bertambah; bila > 12 aktif, angka tertua didaur ulang |

| Gaya | Kondisi | Warna dan ukuran |
| --- | --- | --- |
| Normal | Hit normal/proyektil | Putih, outline warna aura penyerang, 1,0× |
| Heavy | N4, C3, C4, A4, Special | Amber, 1,2× |
| Counter | Hit dalam Counter window | Orange, 1,3×, label kecil COUNTER |
| Chip | Diblok | Biru-abu, 0,8×, tanpa outline aura |
| Ultimate | Hit Ultimate | Gradien warna aura, 2,0×, **menghitung naik 0 → total dalam 24f** lalu tahan |
| Parry | – | Tidak ada angka (hanya label PARRY) |

### 13.6 Banner dan label bergaya anime

Banner dan label adalah elemen DOM dengan animasi `transform/opacity`. Struktur: panel miring (slash) bergradien + garis kecepatan (SVG statis) + teks.

| Elemen | Animasi masuk | Tahan | Keluar | Tambahan |
| --- | --- | --- | --- | --- |
| ROUND n | Huruf muncul bergantian (stagger 2f), skala 2,5→1 dalam 8f (ease-out-back) | 60f | Zoom 1→1,3 + fade 10f | Garis kecepatan |
| FIGHT! | Skala 3→1 dalam 6f + shake layar 4 u + ring gelombang kejut | 30f | Pecah ke samping 10f | Gradien orange→amber |
| K.O. | Garis diagonal putih membelah layar (sangat singkat, 1f terang) lalu teks raksasa jatuh | 90f | Fade | Slow-mo 0,3× + zoom 1,1× |
| PERFECT | Teks emas bertahap dengan kilau | 60f | Fade | Percikan partikel |
| FINAL ROUND | Berdenyut merah | 72f | Zoom out | Siren pendek |
| TIME OVER / DRAW | Jatuh dari atas dengan memantul | 60f | Fade | |
| WARNING (boss) | Garis hitam-merah bergulir | 120f | Wipe | Siren |
| COUNTER / PARRY / REVERSE / PERFECT (label) | Meluncur dari samping dengan overshoot, glitch RGB 2f; miring −12° | 48f total (0,8 dtk) | Zoom kecil + fade | Warna: COUNTER orange · PARRY cyan · REVERSE magenta · PERFECT emas |

### 13.7 Efek event

| Event | Hit-stop | Shake | Efek |
| --- | --- | --- | --- |
| Hit ringan (N1, C1, A1) | 3f | 2 u | Spark kecil kuning-putih |
| Hit sedang (N2, N3, C2, A2, A3) | 4f | 3 u | Spark sedang |
| Hit heavy (N4, C3, C4, A4) | 6f | 6 u | Spark besar, debu knockback |
| Proyektil kena | 4f | 3 u | Ledakan `explosion.png` tint aura |
| Special kena | 6f | 5 u | Spark besar + ring |
| Block | 2f | 1 u | Percikan logam kecil |
| Perfect Parry | 8f | 2 u | Ring cyan mengembang, teks PARRY, kilat putih lembut 1f |
| Ultimate | Super freeze 30f | 10 u (saat beat) | Bagian 13.8 |
| K.O. | – | – | Slow-mo 0,3× selama 600 ms real + zoom 1,1× + banner |
| Dash / Air dash | – | – | Afterimage 3 salinan + debu |
| Mendarat | – | – | Debu |
| Dizzy | – | – | Bintang berputar, bar stun berkedip |
| HP < 20% | – | – | Vignette merah berdenyut |

### 13.8 Cinematic Ultimate dan EX

Seluruh overlay **pra-render** (peredupan = `fillRect`, garis kecepatan = kanvas pra-render yang diputar, tulang = `skeleton_overlay.png`, versi invert sprite = cache). Warna aura penyerang mewarnai semua efek.

**Fase A: Super freeze (30f, sim beku)**

| Frame | Kejadian |
| --- | --- |
| 0 | `freeze = 30`; kilat putih lembut 2f; layar redup ke 35% (kecuali penyerang dan glow aura); SFX `ultimate_charge`; ducking BGM −8 dB |
| 0–12 | Kamera zoom ke penyerang 1,0→1,25 (ease-out); shake naik bertahap hingga 3 u; api aura prosedural naik; garis kecepatan memancar dari penyerang |
| 4–24 | **Cut-in:** `splash` (fallback portrait) penyerang meluncur diagonal melintasi pita warna aura setinggi ±28% layar; **nama Ultimate** (Dela Gothic One raksasa, miring, gradien putih→aura, outline tebal) menyapu masuk |
| 24–30 | Tahan, kamera snap kembali |

**Fase B: Eksekusi.** Kamera zoom 1,1× ke titik tengah, latar diredupkan 25%, overlay garis kecepatan alpha 0,35, mengikuti frame data template (Bagian 9).

**Fase C: Saat kena (Hit, bukan Block).** Hit-stop 8f + kilat putih lembut 2f, lalu **X-Ray 72f (1,2 dtk)**:

- Latar diredupkan ke 15% dan didesaturasi; vignette radial warna aura.
- Korban digambar dengan versi **invert + tint cyan** dari pose `xray`, skala 1,15×; kamera zoom ke korban 1,0→1,15 selama 72f.
- **`skeleton_overlay.png`** (tulang universal) digambar di atas korban dengan tampilan terang (cyan-putih), disejajarkan ke kotak batas korban; tulang berkedip per beat.
- **Beat** (tiap beat: shake 10 u meluruh, ring benturan, garis retak di titik benturan, potongan damage number menghitung naik, SFX `xray_shock`): U1 pada f0, f24, f48; U2 f0, f18, f36, f54; U3 tiap 10f (7 beat sampai f60); U4 f0, f30, f54; U5 f0 (cengkeram), f30 (banting), f54.
- f60–72: kilat putih lembut, korban dilempar (`KnockdownFly`), kamera kembali 8f. Damage diterapkan bertahap per beat; bar HP menyusut dengan trail.

**EX:** X-Ray singkat 24f (kilat putih 1f, korban invert 24f, satu beat, shake 6 u), tanpa cut-in dan tanpa nama jurus.

**Performa dan keamanan:** `prefers-reduced-motion` atau slider rendah → tanpa zoom/shake, cinematic dipersingkat ±0,5 dtk. Semua kilat melewati `FlashLimiter` (13.9).

### 13.9 Aksesibilitas efek

- Slider **Screen Shake** (0–100%) dan **Flash** (0–100%) di Settings. `FlashLimiter` memastikan **maksimal 3 kilat per detik** secara global dan menahan kilat tambahan.
- Peringatan photosensitivity sekali di kunjungan pertama (sebelum efek X-Ray dan glitch), disimpan di localStorage.
- Hormati `prefers-reduced-motion` (default shake 30%, cinematic dipersingkat, tanpa glitch RGB).
- Toggle Damage Numbers, Key Hints, kualitas grafis (Low/Medium/High). Semua menu bisa dinavigasi keyboard.

---

## 14. Rendering, Kamera, dan Stage

### 14.1 Kamera

Kamera hidup di `platform/` (bergantung pada ukuran layar). Sim tidak membaca kamera; batas jarak antar fighter (1000 u) dijaga sim secara terpisah.

| Parameter | Nilai |
| --- | --- |
| Target | Titik tengah x kedua fighter |
| Smoothing | Lerp ≈ 8/dtk (faktor ≈ 0,125 per frame) |
| Deadzone | 80 u: kamera hanya bergerak bila target keluar dari zona ini |
| Zoom dinamis | `1,08` saat dekat → `1,0` saat jauh (`lerp` pada jarak 350–1000 u), tidak melampaui batas di 3.7; bisa dimatikan |
| Zoom K.O. | 1,1× |
| Zoom Ultimate | 1,25 (freeze) → 1,1 (eksekusi) → 1,15 ke korban (X-Ray), Bagian 13.8 |
| Shake | Aditif (offset x,y yang meluruh); amplitudo dikali slider Settings; memakai RNG visual |
| Batas | Kamera dikunci agar area terlihat tetap di dalam dunia `[0, 2000]` |
| Fullscreen/resize | Skala dihitung ulang lewat `computeView` (3.7); parallax di-cache ulang saat resize |

### 14.2 Urutan gambar (L1)

`far → mid → near → floor → bayangan kontak → fighter (yang sedang Ultimate digambar paling depan) → proyektil → VFX dan damage number → fg → overlay (peredupan, vignette, cinematic)`. HUD (DOM) berada di atas kanvas.

### 14.3 Parallax dan skala layer

| Layer | File | Isi | Scroll | Penskalaan |
| --- | --- | --- | --- | --- |
| far | `far.webp` | Langit, siluet jauh (buram, kontras rendah) | 10% | **Cover** (menutup seluruh layar); tinggi atas boleh terpotong |
| mid | `mid.webp` | Struktur tengah | 30% | Tinggi gambar = 720 u × skala; `feetLine` diselaraskan ke lantai |
| near | `near.webp` | Properti dekat | 60% | Sama dengan mid |
| floor | `floor.webp` | Permukaan lantai | 100% | Sama dengan mid; bila ada celah di bawah layar (layar sempit), baris piksel paling bawah diregangkan |
| fg (opsional) | `fg.webp` | Elemen depan yang melintas | 130% | Sama dengan mid |

- Semua layer **tileable horizontal**; bila lebih sempit dari layar, diulang dengan mirror.
- Offset x layer = `kamera.x × faktorScroll × skala`.
- Layer diskalakan sekali ke ukuran layar (cache) dan dihitung ulang saat resize.

```ts
// Menyelaraskan garis kaki gambar dengan floorY layar (mid/near/floor/fg)
const imgScale = (VIEW_H * view.scale) / img.height;            // tinggi gambar = 720 unit di layar
const top = view.floorY - stage.feetLine * img.height * imgScale; // feetLine = 0.87 default
```

### 14.4 Kontrak lantai: bagaimana karakter selalu terlihat berdiri di lantai (L)

Layout background **tidak perlu identik** antar stage. Yang harus sama hanya **kontrak lantai** berikut, sehingga karakter yang digambar terpisah tetap tampak menapak di setiap stage:

1. **Dua garis acuan per stage** (di `stage.json`, dalam pecahan tinggi gambar): `floorTop` = tepi atas permukaan lantai (default **0,82**) dan `feetLine` = tempat telapak kaki karakter berdiri (default **0,87**, kira-kira 5% di dalam permukaan lantai). Semua layer yang memuat lantai (mid, near, floor, fg) memakai nilai yang sama.
2. **Penyelarasan oleh engine:** `feetLine` gambar selalu diletakkan di `floorY` layar (`FLOOR_SCREEN_RATIO = 0,87` × tinggi layar). Stage boleh memakai nilai berbeda di `stage.json` bila layout-nya memang berbeda; engine yang menyesuaikan.
3. **Bayangan kontak prosedural** (digambar sebelum fighter): elips di titik kaki, lebar 100 u, tinggi 20 u, hitam beralpha `stage.shadowAlpha` (default 0,35). Saat melompat bayangan **mengecil dan memudar** (`skala = max(0,5; 1 − tinggi/600)`, alpha × `1 − min(tinggi/500; 0,6)`) dan tetap di `feetLine`. Inilah yang membuat karakter "menempel" ke lantai.
4. **Aturan seni lantai:** permukaan lantai datar dan horizontal (tampak samping, perspektif minimal), kontras rendah-menengah, tekstur berulang horizontal, tepi atas lantai jelas, **tidak ada garis vertikal tegas atau objek tinggi di area kaki** (tengah, antara 80% dan 95% tinggi gambar). Kosongkan area tengah-bawah karena akan tertutup karakter.
5. **Refleksi lantai** (opsional, hanya kualitas High): salinan terbalik fighter beralpha 0,12 dengan gradien memudar.
6. **Cahaya sekitar per stage** (`ambientTint`) masuk backlog; v1 cukup dengan bayangan dan warna latar yang selaras dengan aura.

### 14.5 Efek visual pada fighter

- **Aura glow:** sprite radial gradient pra-render per warna aura, digambar di belakang fighter: tipis saat Energy ≥ 50, kuat saat Energy = 100 (berdenyut). Tanpa `shadowBlur`.
- **Flash kena:** siluet putih pra-render per pose (di-cache) selama 4f.
- **X-Ray:** versi invert + tint cyan pose `xray` (cache) + satu overlay **`skeleton_overlay.png` universal** (tulang putih, 512×1024, transparan) yang diskalakan ke kotak batas korban.
- **Afterimage dash:** 3 salinan alpha 0,4 → 0,1.
- **Dummy Training:** versi grayscale pra-render dari sprite pemain.

### 14.6 Stage

Empat stage; semuanya kosmetik murni (tanpa hazard, D8).

| # | `id` | Nama | Setting | Lantai | Properti dekat | BGM | Dipakai |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `lapangan` | Lapangan Wikrama | Lapangan sekolah terbuka dengan gedung utama dan pohon di kejauhan | Paving lapangan | Bangku, pohon, tiang bendera | `stage_lapangan` | Arcade match 1, Quick Match, Training |
| 2 | `lab` | Lab PPLG | Lab komputer dengan deretan monitor, meja, rak server | Ubin abu-abu | Meja, kursi, monitor, kabel | `stage_lab` | Arcade match 2 |
| 3 | `kelas` | Kelas RPL XII-4 | Kelas dengan papan tulis, meja siswa, jendela besar | Ubin | Meja, kursi, tas | `stage_kelas` | Arcade match 3 |
| 4 | `rooftop` | Rooftop Wikrama | Atap sekolah saat senja, cakrawala kota jauh, tandon air dan antena | Beton | Pagar, tandon, antena | `stage_rooftop` | Arena boss Arcade; juga bisa dipilih di Quick Match dan Training |

Arcade: match 1 `lapangan`, match 2 `lab`, match 3 `kelas`, match 4 acak dari ketiganya, boss `rooftop`.

`stage.json`:

```json
{ "id": "lapangan", "name": "Lapangan Wikrama", "floorTop": 0.82, "feetLine": 0.87,
  "shadowAlpha": 0.35, "layers": ["far", "mid", "near", "floor"], "bgm": "stage_lapangan" }
```

---

## 15. Audio

### 15.1 Arsitektur

- **Dua layer.** Layer 1: sintesis Web Audio untuk semua SFX (resep di 15.5), selalu ada sebagai fallback dan prototipe. Layer 2: file BGM dan SFX asli, otomatis dipakai begitu file ada (manifest). Audio tidak memblokir pengembangan engine.
- **Manifest** `audio-events.ts` memetakan event → key → path; saat preload dicek, jika 404 otomatis fallback ke sintesis (SFX) atau ke trek pengganti (BGM, 15.2) tanpa error di console. File SFX **selalu bernomor** `<key>_N` (`hit_light_1.mp3`, juga bila hanya satu varian) di `public/assets/audio/sfx/`; varian diacak. Announcer: `public/assets/audio/announcer/<key>.mp3`.
- **Format.** SFX: mono 44,1 kHz, `.mp3` atau `.ogg`, < 100 KB, di-decode jadi `AudioBuffer` saat preload. BGM: stereo 128 kbps, 1–3 menit, di-stream lewat `<audio>` + `MediaElementSource`; loop mulus pakai `.ogg` atau mp3 yang sudah di-trim gapless.
- **Anggaran:** total audio ≤ 20 MB; BGM title dan SFX inti dimuat saat Loading; BGM stage/boss dimuat saat VS Intro.
- **Bus:** Master → BGM / SFX / UI / VOICE. Volume tersimpan di localStorage. Pitch acak ±5%, polyphony maks 16 (prioritas terendah dicuri lebih dulu), crossfade BGM 0,5 dtk, **mute saat tab blur**. AudioContext di-resume saat PRESS START.
- **Ducking (N4):** BGM −8 dB saat announcer dan Ultimate (turun 100 ms, naik 400 ms).
- **Lisensi:** semua BGM, SFX, dan suara announcer harus buatan sendiri atau berlisensi untuk publik, termasuk musik hasil AI dan TTS; periksa ketentuan penyedia dan catat sumber di `docs/audio-credits.md` (judul, sumber, lisensi).

### 15.2 Daftar lagu (`public/assets/audio/bgm/`)

| Key | Dipakai di | Jenis | Fallback bila file belum ada |
| --- | --- | --- | --- |
| `title` | Title, Credits | loop | – (hening) |
| `select` | Select Mode / Character / Stage, How to Play | loop | `title` |
| `vs` | VS Intro (3 dtk) | sting | hening |
| `stage_lapangan` | Battle di Lapangan | loop | – |
| `stage_lab` | Battle di Lab PPLG | loop | `stage_lapangan` |
| `stage_kelas` | Battle di Kelas RPL XII-4 | loop | `stage_lapangan` |
| `stage_rooftop` | Battle di Rooftop (non-boss) | loop | `stage_lapangan` |
| `boss_1` | Boss Atjep Rahmat | loop | `stage_rooftop` |
| `boss_2` | Boss Muslih | loop | `boss_1` |
| `boss_3` | Boss Juliana Mansur | loop | `boss_1` |
| `boss_phase2` | Fase 2 boss (versi lebih intens) | loop | trek boss yang sedang main (tempo naik 5%) |
| `training` | Training | loop | `select` |
| `victory` | Match Detail menang | jingle | hening |
| `defeat` | Match Detail kalah, Game Over | jingle | hening |
| `ending` | Ending Arcade | loop | `title` |
| `gameover` | Game Over | jingle | `defeat` |

### 15.3 Announcer (TTS, English)

Satu suara energik yang konsisten, diekspor mono 44,1 kHz, ≤ 60 KB per file, dinormalisasi. Catat mesin TTS dan lisensinya di `audio-credits.md` (cek apakah suara boleh dipakai untuk publikasi).

`announcer/`: `round_1`, `round_2`, `round_3`, `final_round`, `fight`, `ko`, `perfect`, `time_over`, `you_win`, `you_lose`, `draw`, `get_ready`, `warning`, `continue`, `game_over`, `three`, `two`, `one`, dan `name_<id>` (satu per karakter, mis. "Ridho!") untuk hantaman nama di VS Intro.

### 15.4 Tabel event → SFX (`audio-events.ts`)

Bus: S = SFX, U = UI, V = VOICE. Prioritas 1 (rendah) – 10 (tinggi). Variasi = jumlah file `_N`.

| Event | Key | Variasi | Bus | Volume | Prioritas |
| --- | --- | --- | --- | --- | --- |
| Gerak menu | `ui_move` | 1 | U | 0,5 | 2 |
| Pilih menu | `ui_select` | 1 | U | 0,7 | 3 |
| Kembali | `ui_back` | 1 | U | 0,6 | 3 |
| PRESS START | `ui_start` | 1 | U | 0,9 | 6 |
| Banner ronde | `round_start` | 1 | S | 0,8 | 6 |
| Peringatan boss | `boss_warning` | 1 | S | 0,9 | 8 |
| Lompat | `jump` | 2 | S | 0,5 | 3 |
| Mendarat | `land` | 2 | S | 0,5 | 3 |
| Dash / Air dash | `dash` | 2 | S | 0,6 | 4 |
| Ayunan N1 / C1 / A1 | `whoosh_light` | 2 | S | 0,45 | 2 |
| Ayunan N2 / N3 / C2 / A2 / A3 | `whoosh_mid` | 2 | S | 0,5 | 2 |
| Ayunan N4 / C3 / C4 / A4 | `whoosh_heavy` | 2 | S | 0,6 | 3 |
| Hit ringan | `hit_light` | 3 | S | 0,7 | 5 |
| Hit sedang | `hit_medium` | 3 | S | 0,8 | 5 |
| Hit heavy | `hit_heavy` | 3 | S | 0,95 | 7 |
| Block | `block` | 2 | S | 0,7 | 5 |
| Perfect Parry | `parry` | 1 | S | 1,0 | 9 |
| Reverse | `reverse` | 1 | S | 0,9 | 8 |
| Special cast | `special_cast` | 2 | S | 0,7 | 5 |
| Proyektil S1 / S8 / S2 / S5 | `proj_bolt` / `triple_shot` / `proj_wave` / `shock_ground` | 1 | S | 0,6 | 4 |
| Special kena | `special_hit` | 2 | S | 0,85 | 7 |
| Rising / Rush / Shadow Step / Counter | `rising` / `rush` / `shadow_step` / `counter_stance`, `counter_hit` | 1 | S | 0,7 | 6 |
| EX cast | `ex_cast` | 1 | S | 0,85 | 7 |
| Ultimate charge (freeze) | `ultimate_charge` | 1 | S | 1,0 | 10 |
| Ultimate gerak | `ult_beam` / `ult_thunder` / `ult_barrage` / `ult_slam` / `ult_grab` | 1 | S | 0,9 | 9 |
| X-Ray beat | `xray_shock` | 1 | S | 1,0 | 10 |
| Dizzy | `dizzy` | 1 | S | 0,6 | 5 |
| K.O. | `ko_hit`, `ko_siren` | 1 | S | 1,0 | 9 |
| Energy siap (50 / 100) | `energy_ready` | 1 | S | 0,6 | 4 |
| Cooldown siap | `cooldown_ready` | 1 | U | 0,3 | 1 |
| Timer < 10 dtk | `timer_low` | 1 | U | 0,4 | 3 |
| Hitung mundur resume | `countdown_tick` | 1 | U | 0,6 | 5 |
| Menang / Kalah | `victory` / `defeat` (BGM jingle) | – | – | – | – |

### 15.5 Resep sintesis fallback (`synth-recipes.ts`)

Gaya arcade: osilator `square/saw/triangle/sine` + `noise` dengan envelope pendek. Bentuk resep:

```ts
type SynthLayer = { osc: 'square' | 'saw' | 'triangle' | 'sine' | 'noise'; f0: number; f1: number; durMs: number;
                    vol: number; attackMs: number; decayMs: number; filter?: { type: 'lowpass' | 'highpass' | 'bandpass'; f: number } };
type SynthRecipe = { layers: SynthLayer[]; pitchRand: number }; // pitchRand 0.05 = ±5%
```

| Key | Resep singkat |
| --- | --- |
| `ui_move` | square 880→1100 Hz, 40 ms |
| `ui_select` | square arpeggio 660→1320 Hz, 120 ms |
| `ui_back` | square 520→260 Hz, 100 ms |
| `ui_start` | saw 220→880 Hz, 300 ms + noise burst 60 ms |
| `round_start` | square 440 Hz, tiga bip 90 ms |
| `jump` | triangle 300→700 Hz, 120 ms |
| `land` | noise lowpass 400 Hz 80 ms + sine 120→60 Hz |
| `dash` | noise bandpass sweep 800→3000 Hz, 150 ms |
| `whoosh_light/mid/heavy` | noise bandpass 1200→2400 (90 ms) / 900→2000 (130 ms) / 600→1800 (180 ms) |
| `hit_light` | noise 60 ms + square 220→110 Hz 60 ms |
| `hit_medium` | noise 90 ms + square 180→80 Hz |
| `hit_heavy` | noise lowpass 900 Hz 140 ms + sine 110→40 Hz 200 ms |
| `block` | noise highpass 3000 Hz 50 ms + square 1400 Hz ping 40 ms |
| `parry` | sine 1800→2400 Hz + triangle 3000 Hz, ring 260 ms |
| `reverse` | `parry` + sweep naik 400→2000 Hz 180 ms |
| `special_cast` | saw 200→900 Hz, 180 ms |
| `special_hit` | noise 120 ms + saw 300→100 Hz |
| `ex_cast` | saw 150→1200 Hz 220 ms + sine sub 60 Hz |
| `ultimate_charge` | saw 100→1600 Hz selama 500 ms + noise swell |
| `xray_shock` | noise burst 80 ms + sine 60 Hz 200 ms + klik acak |
| `dizzy` | triangle 600 Hz ± LFO 8 Hz, 600 ms |
| `ko_siren` | square bergantian 700/500 Hz, 4 siklus 800 ms |
| `energy_ready` | triangle arpeggio 660, 880, 1320 Hz, 180 ms |
| `countdown_tick` | square 880 Hz 50 ms (angka akhir 1320 Hz) |
| `timer_low` | square 1000 Hz 40 ms |
| `victory` / `defeat` | arpeggio mayor naik / minor turun |

---

## 16. Aset dan Pipeline

Daftar aset lengkap, aturan gaya, dan **prompt untuk generator gambar** ada di dokumen pendamping **WIKWAR Asset Pack** (dipakai di ChatGPT/generator, bukan di chat kode). Bagian ini mendefinisikan kontrak teknis yang dibaca engine dan skrip.

### 16.1 Standar gambar

- **Sumber:** generator gambar (ChatGPT), kanvas persegi 1:1, menghadap kanan, gaya chibi anime, latar transparan (atau magenta `#FF00FF` bila tidak bisa transparan). Gambar mentah disimpan di `raw-assets/<id>/` (di luar `public/`, tidak ikut deploy). Contoh `attack.png` Ridho: 1254×1254, RGBA, ±1 MB: terlalu berat untuk game langsung, jadi **semua gambar diproses** dulu.
- **Hasil proses:** WebP (kualitas 90) pada kanvas **768×768** dengan **titik pivot** (lihat 16.3) di (384, 700); pose `idle` setinggi 600 px. Karakter 320 u tinggi → `0,5333 u per piksel` (`scale` di `sprites.json`, bisa diubah di config).
- **Kenapa WebP:** ukuran file 70–90% lebih kecil dari PNG dengan transparansi yang sama, didukung Chrome/Edge/Firefox/Safari modern. Hasilnya ±40–90 KB per pose, sehingga satu pertandingan (2 karakter + stage) tetap ≤ 10 MB.

### 16.2 Daftar pose karakter

**Tier A, wajib untuk karakter muncul di roster (32 pose).** Nama file = `<pose>.webp`. Pose yang kurang → fallback (6.6), game tidak crash.

| Kelompok | Pose | Dipakai oleh state |
| --- | --- | --- |
| UI (2) | `portrait`, `splash` | Grid Select, panel, VS Intro, HUD; `splash` = ilustrasi tubuh penuh dinamis untuk VS Intro, cut-in Ultimate, panel pilih |
| Gerak (6) | `idle`, `walk_a`, `walk_b`, `crouch`, `jump_up`, `jump_fall` | Idle, Walk*, Crouch*, PreJump/Land (squash `crouch`), JumpRise, JumpFall |
| Dash (2) | `dash_f`, `dash_b` | DashForward/AirDashForward, DashBack/AirDashBack |
| Normal darat (4) | `n1_jab`, `n2_hook`, `n3_lowkick`, `n4_roundhouse` | N1–N4 |
| Normal jongkok (3) | `crouch_punch` (C1, C2), `crouch_sweep` (C3), `crouch_uppercut` (C4) | C1–C4 |
| Normal udara (2) | `air_punch` (A1, A2), `air_kick` (A3, A4, DiveLand) | A1–A4 |
| Bertahan (2) | `guard`, `guard_crouch` | Parry, Guard*, Blockstun*, GuardRelease |
| Reaksi (6) | `hit_high`, `hit_low`, `knockdown_fly`, `down`, `getup`, `dizzy` | Hitstun*, KnockdownFly, Down, GetUp, Dizzy, ParryStunned, KO |
| Skill (3) | `special`, `ultimate`, `xray` | Special*, Ult*, XRayHit/Grabbed |
| Pertandingan (2) | `intro`, `win` | Intro, Win |

Total Tier A: 32 per karakter → **160 gambar untuk 5 karakter**. `Lose` memakai `idle` yang dibungkukkan; `KO` memakai `knockdown_fly` lalu `down`.

**Tier B, gerakan lebih halus (+62 gambar per karakter, total ±94).** Opsional dan bertahap; masing-masing menimpa timeline Tier A lewat `animations.json`. Urutan prioritas produksi ada di Asset Pack.

| Aksi | Frame tambahan (nama file) |
| --- | --- |
| Idle | `idle_2`, `idle_3`, `idle_4` (`idle` = `idle_1`) |
| Jalan | `walk_1`…`walk_6` (menggantikan `walk_a/b`; mundur memutar urutan) |
| Jongkok | `crouch_down`, `stand_up` |
| Lompat | `prejump`, `jump_apex`, `land` |
| Dash | `dash_f_1`…`dash_f_3`, `dash_b_1`…`dash_b_3` |
| N1 / N2 / N3 | `n1_windup`, `n1_recover`; `n2_windup`, `n2_recover`; `n3_windup`, `n3_recover` |
| N4 | `n4_windup`, `n4_swing`, `n4_recover` |
| Crouch | `crouch_punch_windup`, `crouch_punch_recover`, `crouch_sweep_windup`, `crouch_sweep_recover`, `crouch_uppercut_windup`, `crouch_uppercut_peak` |
| Udara | `air_punch_windup`, `air_punch_recover`, `air_kick_windup`, `air_kick_recover`, `air_dive` |
| Bertahan | `guard_start` |
| Reaksi | `hit_high_2`, `hit_low_2`, `knockdown_fly_2`, `knockdown_fly_3`, `getup_1`, `getup_3`, `getup_4`, `dizzy_2`, `dizzy_3` |
| Skill | `special_windup`, `special_end`, `ultimate_charge`, `ultimate_windup`, `ultimate_end`, `xray_2` |
| Match | `win_2`, `win_3`, `win_4`, `intro_2`, `intro_3`, `intro_4` |

**Boss:** minimum 14 pose (10.4), ideal Tier A + `phase2`.

### 16.3 Skrip `process-sprites.mjs` (sharp)

1. Jika gambar tidak punya alpha, hapus latar magenta `#FF00FF` dengan chroma key (defringe tepi), lalu trim area transparan.
2. **Skala semua pose satu karakter dengan faktor yang sama**, dihitung dari tinggi pose `idle` (idle = 600 px).
3. Hitung **pivot** otomatis = (x rata-rata piksel opak pada 8% baris paling bawah kotak batas, y dasar kotak batas); letakkan di (384, 700) pada kanvas 768×768. Untuk pose berdiri ini = telapak kaki; untuk pose melayang/berbaring ini = titik terendah tubuh. Pose yang pivotnya meleset dikoreksi manual di aligner (O2: pivot khusus per pose disimpan di `sprites.json`).
4. Ekspor WebP alpha kualitas 90; `portrait` di-crop bust 512×512 + thumbnail 256×256.
5. Tulis `sprites.json` dan beri **warning bila ukuran suatu pose menyimpang > 12% dari idle** (tanda generator tidak konsisten). Skrip **tidak** mengubah ukuran otomatis (O1): generate ulang atau koreksi di aligner.
6. Validasi: pose Tier A yang hilang dilaporkan sebagai daftar (bukan error), kecuali `idle`, `portrait` (wajib).

### 16.4 Format data per karakter

`public/assets/characters/<id>/sprites.json` (dihasilkan skrip, boleh dikoreksi aligner):

```json
{ "unitsPerPx": 0.5333,
  "poses": {
    "idle":   { "file": "idle.webp", "pivot": [384, 700], "offset": [0, 0], "scale": 1.0 },
    "n1_jab": { "file": "n1_jab.webp", "pivot": [384, 700], "offset": [0, 0], "scale": 0.98 },
    "down":   { "file": "down.webp", "pivot": [384, 640], "offset": [0, 0], "scale": 1.0, "flags": ["lying"] }
  } }
```

`animations.json` (opsional, Tier B): kunci = id aksi, nilai = daftar kunci `{pose, frames, ox, oy, rot, sx, sy}` (6.6):

```json
{ "N1Jab": [ { "pose": "n1_windup", "frames": 5 }, { "pose": "n1_jab", "frames": 5, "ox": 12 }, { "pose": "n1_recover", "frames": 9 } ] }
```

Jumlah frame kunci pada timeline harus sama dengan total durasi state (startup + active + recovery); `validate-data` memeriksanya.

### 16.5 Sprite aligner (`/dev/aligner`)

Alat dev (halaman Next.js yang hanya aktif di `development`) untuk memperbaiki pose yang ukurannya atau posisi kakinya meleset akibat generator AI.

- Pilih karakter dan pose; tampilkan **bayangan transparan pose `idle`** dan garis kaki sebagai acuan.
- Panah = geser `offset` 1 u (Shift = 5 u); `[` dan `]` = skala ±1%; tampil persentase selisih ukuran terhadap idle.
- Tombol **Copy JSON** menyalin potongan `sprites.json` untuk pose itu ke clipboard (lalu di-paste ke file; sesuai workflow copy-paste).
- Dikerjakan sebagai tugas sendiri di fase F1.

### 16.6 Stage

Per stage: `far`, `mid`, `near`, `floor` (+ `fg` opsional), landscape 3:2 (disarankan 1536×1024), tileable horizontal, mengikuti kontrak lantai 14.4 (`floorTop` 0,82, `feetLine` 0,87). `process-stages.mjs`: membaca `raw-assets/stages/<id>/<layer>.png` dan menulis `public/assets/stages/<id>/<layer>.webp` (`stage.json` ditulis tangan di folder yang sama); hapus magenta bila ada, batasi lebar maksimum 2048 px, ekspor WebP kualitas 85, buat `thumb.webp` 480×270 otomatis dari far + mid + floor. Minimum per stage: `far` + `floor`; rekomendasi: `far`, `mid`, `near`, `floor` (16 file untuk 4 stage).

### 16.7 VFX dan UI

- **Gambar global** (`public/assets/vfx/`): `projectile.png` (orb putih-biru, 256×256, di-tint ke warna aura saat load), `explosion.png` (ledakan benturan putih-biru, 512×512), `skeleton_overlay.png` (tulang universal putih, 512×1024). Belum ada; prompt-nya ada di Asset Pack.
- **Prosedural (tanpa gambar):** spark, debu, bintang dizzy, ring, garis kecepatan, retakan, aura glow, bayangan kontak, efek template S2–S5 dan U1–U5.
- **UI:** logo dari teks (Dela Gothic One + efek CSS), ikon sebagai SVG inline, latar Title = parallax stage + siluet 5 karakter idle.

### 16.8 Kebutuhan aset

| Kelompok | Jumlah | Catatan |
| --- | --- | --- |
| Karakter Tier A | 160 | 5 × 32; **cukup untuk MVP bermain penuh** |
| Karakter Tier B | +310 | 5 × 62; polish bertahap |
| Boss (minimum) | 42 | 3 × 14; ideal 3 × 33 |
| Stage | 16 (minimum 8) | 4 × 4 layer |
| VFX global | 3 | projectile, explosion, skeleton_overlay |
| **Paket paling kecil agar engine jalan dengan karakter nyata** | 17 | `idle`, `portrait`, `splash` × 5 karakter + `far` + `floor` Lapangan Wikrama; sisanya fallback |

---

## 17. Data, Settings, Copy, dan Error Handling

### 17.1 localStorage (`wikwar:v1:*`)

| Key | Isi |
| --- | --- |
| `settings` | volume (master/bgm/sfx/ui/voice), fullscreen otomatis, kualitas, shake, flash, damage number, key hints, zoom kamera |
| `controls` | peta aksi → `event.code` |
| `last` | difficulty terakhir, karakter terakhir |
| `best` | grade terbaik per `mode\|difficulty\|characterId` |
| `flags` | `seenHowTo`, `seenPhotosensitivity` |

- Tiap blob membawa `v` (angka versi). Pembaca menjalankan rantai migrasi `v → v+1`; blob rusak atau versi tak dikenal → default. **Semua akses dalam try/catch**; bila storage diblokir/penuh → fallback ke penyimpanan memori untuk sesi itu, dan toast sekali "Storage blocked. Progress won't be saved."
- Disimpan sesaat setelah perubahan (debounce 300 ms).

### 17.2 Settings

| Opsi | Nilai | Default |
| --- | --- | --- |
| Volume Master / BGM / SFX / UI / Voice | 0–100 | 80 / 70 / 80 / 70 / 80 |
| Fullscreen | tombol (juga `F`) | – |
| Auto Fullscreen saat PRESS START | ON/OFF | ON |
| Kualitas grafis | Low / Medium / High | Medium |
| Screen Shake | 0–100% | 100 (30 bila `prefers-reduced-motion`) |
| Flash | 0–100% | 100 (maks 3 kilat/dtk selalu berlaku) |
| Damage Numbers | ON/OFF | ON |
| Key Hints | ON/OFF (Training dan How to Play selalu tampil bila ON) | ON |
| Camera Zoom | ON/OFF | ON |
| Controls | Rebind (5.6), Reset Controls | – |
| Reset Progress | konfirmasi Yes/No (default No); menghapus `best` dan `flags` | – |
| Show Hitboxes | ON/OFF (Training dan dev) | OFF |

### 17.3 Rebind

Aturan di 5.6. Struktur `controls`: `{ left, right, up, down, n1, n2, n3, n4, guard, dash, special, ex, ultimate }` dengan nilai `event.code` (mis. `"KeyA"`, `"Semicolon"`, `"Space"`).

### 17.4 Teks UI (English, `src/data/copy.ts`)

**Template Special / Ultimate / Passive (1 kalimat; dipakai tooltip dan chip):**

| Kode | Nama | Deskripsi |
| --- | --- | --- |
| S1 | Energy Bolt | Fires a straight energy bolt at head height; crouch or jump to dodge it. |
| S2 | Wave Burst | Releases a slow, wide wave that hits twice and passes through small shots. |
| S3 | Rising Strike | A rising uppercut that is untouchable up high at the start, but slow to recover. |
| S4 | Charge Rush | Lunges forward with armor against one light hit, and stops on contact. |
| S5 | Ground Shock | Sends a low shockwave along the floor; crouching won't save you, jump or dash. |
| S6 | Counter Stance | Strike a pose and hit back automatically if you take a melee hit or a normal shot. |
| S7 | Shadow Step | Vanish and reappear behind your opponent with a quick strike. |
| S8 | Triple Shot | Fires three small shots in a row that are easy to jump but hard to ignore. |
| U1 | Lunge Beam | Dash in and unleash a massive beam at close range. |
| U2 | Lightning Storm | Calls down lightning over a wide area, hitting every height. |
| U3 | Rush Barrage | Lunge in and unload a seven-hit flurry. |
| U4 | Shockwave Slam | Leap up and slam down, hitting both the ground and the air. |
| U5 | Reversal Grab | A fast lunge into an unblockable grab; parry it or jump away. |
| P1 | Iron Skin | Takes 20% less stun from hits. |
| P2 | Quick Charge | Gains 25% more Energy from attacks. |
| P3 | Combo Master | The 3rd and 4th hits of a combo deal 15% more damage. |
| P4 | Last Stand | Deals 15% more damage below 25% HP. |
| P5 | Parry Master | A wider Parry window (14 frames) and more Energy from parries. |
| P6 | Evasive | Dash cooldown is 25% shorter. |
| P7 | Sharp Special | Special cooldown is 20% shorter. |

**How to Play (4 halaman):**

1. **MOVE** — A / D: move · W: jump · S: crouch · U: dash (in the air: air dash). Dash toward the direction you hold; hold nothing to dash at your opponent. Crouch to slip under high attacks.
2. **ATTACK** — J: right punch · K: left punch · L: left kick · ; : right kick. Chain **different** buttons into combos. Each button works once per combo and has a cooldown, so mashing won't work. ; is a heavy finisher that knocks down.
3. **DEFEND** — Hold Space to guard (you still take chip damage). Tap Space right before a hit to PARRY: no damage, and your next hit becomes a COUNTER. High attacks miss crouching opponents, and low attacks miss jumping ones.
4. **POWER** — Landing hits and parries fills Energy. I: Special · O: EX Special (50 Energy) · P: Ultimate (100 Energy). Taking too many hits fills the Stun bar and makes you Dizzy: mash A and D to recover.

**String UI lain:** `ROUND 1/2/3`, `FINAL ROUND`, `FIGHT!`, `K.O.`, `TIME OVER`, `PERFECT`, `DRAW`, `YOU WIN`, `YOU LOSE`, `WARNING`, `GET READY`, `PAUSED`, `CONTINUE?`, `GAME OVER`, `GRADUATION APPROVED`, `FINAL GRADE`, label `COUNTER`, `PARRY`, `REVERSE`, `PERFECT`; menu `START`, `HOW TO PLAY`, `SETTINGS`, `CREDITS`, `ARCADE`, `QUICK MATCH`, `TRAINING`, `RESUME`, `RESTART`, `QUIT`; toast: "Asset failed to load. Using a placeholder.", "Audio unavailable. Playing without sound.", "Storage blocked. Progress won't be saved.", "Game feels heavy? Switch to {quality} quality? [Enter] Yes  [Esc] No", "Press F for fullscreen".

### 17.5 Error handling

| Kasus | Perilaku |
| --- | --- |
| Aset gambar gagal dimuat | Placeholder (siluet berwarna aura + nama) dan toast English sekali per aset |
| Aset audio 404 / WebAudio tidak tersedia | Fallback sintesis atau trek pengganti; tanpa WebAudio → tanpa suara + toast |
| localStorage error | Fallback memori + toast (17.1) |
| `roster.json` / `bosses.json` tidak valid | Zod menggagalkan build dan memunculkan overlay error di dev; di production entri tidak valid dilewati |
| Font gagal | Font cadangan 13.3 |
| Perangkat sentuh / layar < 900 px | Layar "gunakan laptop/PC" |

---

## 18. Testing dan Validasi

**Kenapa test jadi tulang punggung proyek ini.** AI yang lu pakai tidak bisa menjalankan kode dan tidak bisa melihat game. Satu-satunya "kebenaran bersama" antara lu dan AI adalah test yang jalan di Node. Test yang lolos berarti aturan PRD terpenuhi; test yang gagal memberi AI pesan error yang tepat untuk diperbaiki. Tanpa test, game fighting hampir pasti berubah jadi tumpukan bug yang saling mengunci (sama seperti kondisi versi lama).

### 18.1 Jenis test

| Jenis | Alat | Jalan di | Memeriksa | Kapan dijalankan |
| --- | --- | --- | --- | --- |
| Unit | Vitest | Node | Fungsi murni: `Rng`, `Clock`, `InputBuffer`, `computeView`, rumus damage (RL-30), `Grade` | Tiap tugas |
| **Scenario** | Vitest + `InputScript` | Node | Aturan `RL-xx` end-to-end lewat `BattleEngine` headless | Tiap tugas sim |
| Verifikasi balance | Vitest (`balance.test.ts`) | Node | Konsistensi angka (true combo, airtime, jarak dash, tinggi hitbox, total durasi) | Tiap ubah `balance.ts` atau template |
| Determinisme | Vitest | Node | Seed + skrip sama → hash state identik | Dari F1 |
| Validasi data | `npm run validate` | Node | `roster.json`, `bosses.json`, template, `sprites.json`, `animations.json` (jumlah frame = durasi state) | CI dan sebelum commit |
| Simulasi AI | `npm run simulate` | Node | Win-rate seimbang 35–65%, tidak ada match macet | Tiap ubah angka balance; sebelum rilis |
| E2E | Playwright (Chromium) | Browser | Alur layar, input keyboard nyata, pause, resize/kontrak lantai | Sebelum merge fase besar dan rilis |
| Playtest manual | Formulir 18.8 | T480 | Rasa kontrol, keterbacaan, bug yang tidak tertangkap test | Tiap milestone |

### 18.2 Harness headless

File di `src/engine/sim/testing/` (hanya dipakai test dan `simulate`):

- `fixtures.ts`: roster uji `TEST_A` dan `TEST_B` (HP 1000, speed 1,0, damage 1,0, Special S1, Ultimate U1, passive `none`) supaya angka test tidak ikut berubah saat stat karakter asli di-balance.
- `harness.ts`: `runScenario(config): ScenarioResult` (bentuk di Lampiran D.1).
- `hash.ts`: `hashState(snapshot): string` (FNV-1a atas JSON terurut) untuk tes determinisme.

**Konvensi waktu test (harus sama dengan 8.2 "Konvensi frame"):**

- `InputScript` bersifat **hold**: `{ f: 3, p1: ['Right','N1'] }` artinya mulai step 3 tombol itu ditahan sampai ada entri berikutnya untuk p1. `{ f: 4, p1: [] }` melepas semuanya. `pressed` (tepi naik) dihitung engine dari perubahan `held`. Helper `tap(f, who, action)` membuat dua entri (tekan di f, lepas di f+1).
- Step ke-i (mulai 0) menerima input frame i. `result.at(n)` = snapshot **setelah** n step (`at(0)` = kondisi awal).
- Setiap `GameEvent` membawa `frame` = indeks step yang menghasilkannya.
- Posisi awal default: p1 x = 800, p2 x = 1200, saling menghadap. Override lewat `start`.

### 18.3 Aturan menulis test

1. **Satu test = satu aturan.** Nama test memuat ID aturan: `it('RL-19: whiff tidak membuka cancel', ...)`.
2. **Test dibuat dari PRD, bukan dari kode.** Kalau kode AI dan PRD berbeda, yang salah kodenya. Kalau PRD ambigu, perbaiki PRD dulu.
3. **Angka diambil dari `balance.ts`**, bukan ditulis ulang di test, kecuali test "anchor" (18.4) yang memang mengunci angka PRD.
4. **Tanpa timing nyata:** dilarang `setTimeout`, `Date.now`, atau `await` waktu di test sim. Semua dalam frame.
5. **Tes regresi:** tiap bug yang ditemukan di game → tambah scenario yang gagal sebelum perbaikan dan lolos sesudah (template debug 0.5).
6. Katalog scenario wajib per aturan ada di **Lampiran D.2**. Sebuah tugas combat dianggap selesai bila scenario yang terkait lolos.

### 18.4 Test anchor (mengunci angka PRD)

Test kecil yang sengaja menulis angka PRD apa adanya supaya perubahan angka tidak terjadi tanpa sadar (ubah angka di `balance.ts` → anchor gagal → ubah anchor sekaligus dan catat di `docs/decisions.md`):

| Anchor | Nilai |
| --- | --- |
| Berjalan 60 step maju | `Δx = 320 u ± 1` (speed 1,0) |
| Airtime lompat tegak | 52 frame ± 1; puncak 271 u ± 2 |
| Dash darat | total gerak 180 u; durasi state 24f; cooldown 72f |
| Air dash | gerak 233 u; gravitasi ditangguhkan 16f |
| Combo J → K → L → ; | 139 damage total (25 + 35 + 31 + 48) |
| Chip N1 / N2 / N4 | 6 / 8 / 15 |
| Knockdown | `KnockdownFly` ±24f → `Down` 40f → `GetUp` 30f (total ±94f) |
| Perfect Parry | Jendela 12f (P5: 14f); lock 24f; Counter window 48f; ×1,25 damage, +25 stun |
| Dizzy | 150f; tiap tekan A/D memotong 6f; minimum total 90f; immunity 180f |
| Waktu ronde | 3600f (60 dtk) |

### 18.5 Verifikasi balance (`balance.test.ts`)

Test ini membaca `balance.ts` dan template, lalu memeriksa hal-hal yang gampang rusak saat angka diubah:

1. **True combo:** untuk tiap normal yang bisa dirantai, `hitstun ≥ active + 5 + startupTerlama + 1`, dengan `startupTerlama` = startup terbesar di antara normal yang boleh menjadi sambungannya (N4 = 11). Hasil saat ini: N1 20 ≤ 24, N2 20 ≤ 26, N3 21 ≤ 28, C1 20 ≤ 24, C2 20 ≤ 26 (margin 4–7).
2. **Chip:** `chip = floor(0,25 × damage)` untuk tiap serangan di tabel.
3. **Tinggi hitbox vs hurtbox (RL-05):** tabel 7.2 dihitung dari AABB; hasilnya harus sama dengan kolom "meleset/kena" di tabel itu.
4. **Fisika:** airtime, puncak lompat, jarak dash, jarak air dash sesuai 7.1 dan 7.3.
5. **Total durasi:** untuk tiap state serangan dan tiap template, `startup + active + recovery` = durasi di `StateDef`; untuk karakter yang punya `animations.json`, jumlah `frames` pada timeline = durasi itu.
6. **Power budget (10.1):** stat tiap karakter di dalam rentang, dan `powerPoints(stats)` berada di ±`POWER_BUDGET.limit` (0,10).
7. **Kelengkapan template:** semua `special/ultimate/passive` di `roster.json` ada di `templates/`; tiap template punya `aiHints`, `vfx`, `sfx`.
8. **Cooldown > durasi:** tiap cooldown tombol normal lebih besar dari durasi serangannya.

### 18.6 Determinisme

- Test: jalankan skrip 1800 frame berisi campuran input (jalan, lompat, rantai, Special, Guard) dua kali dengan seed sama; `hashState` setiap 60 frame harus identik. Seed berbeda → AI boleh berbeda, tetapi skrip manual-saja tetap identik.
- Jaga: tidak ada `Map`/`Set` yang iterasinya memengaruhi hasil, tidak ada `Math.random`/`Date.now` di `sim/` (dijaga ESLint 3.9).
- Test **"AI hanya mengeluarkan `InputFrame`"**: AI dijalankan 600 frame; snapshot state fighter dari dua mesin (satu pakai AI, satu memutar ulang `InputFrame` yang dikeluarkan AI sebagai skrip) harus identik.

### 18.7 E2E (Playwright, Chromium)

Build khusus uji memasang `window.__wikwar` (hanya bila `NEXT_PUBLIC_E2E=1`) berisi `snapshot()` (frame, HP, state, posisi, `view.floorY`, `canvas.height`) dan `setSeed(n)`. Tidak ada kode uji di build production.

| ID | Skenario | Yang diperiksa |
| --- | --- | --- |
| E2E-1 | **Smoke:** buka `/` → tunggu PRESS START (maks 15 dtk) → Enter → Training → pilih karakter dan stage default | Layar Battle muncul, kanvas tampil, HUD ada, **tidak ada error di console** |
| E2E-2 | **Input nyata:** di Training, tahan D lalu tekan J di dekat dummy | `p2.hp` turun; damage number tampil; frame terus maju |
| E2E-3 | **Pause dan resume:** Quick Match vs Easy → Enter | Menu Pause tampil, frame sim berhenti (nilai `frame` sama setelah 500 ms); Resume → hitung mundur 3-2-1 sebelum sim jalan |
| E2E-4 | **Kontrak lantai:** ubah ukuran viewport ke 1280×720, 1920×1080, 1024×768, 2560×1080, 3440×1440 | `floorY / canvas.height ≈ 0,87 ± 0,005` dan kedua fighter berada dalam layar dengan margin ≥ 120 u |
| E2E-5 | **Blur:** `page.evaluate` memicu `blur` saat Battle | Game auto-pause |

Fullscreen tidak diuji di E2E (headless tidak mengizinkan gesture fullscreen); dicek manual (18.8).

### 18.8 Playtest manual

Jalankan di ThinkPad T480 (Chrome) minimal di akhir F3, F5, F6, F8. Ajak 3–5 teman; 15 menit per orang; catat tanpa membantu.

**Daftar periksa mandiri (sebelum mengajak orang):**

- [ ] 60 FPS stabil di 1080p Medium (F3 overlay); 5 menit tanpa patah-patah.
- [ ] Kombinasi tombol W+D+J, W+A+Space, S+D+;, A+W+U semua terbaca (5.2).
- [ ] Fullscreen (F dan PRESS START), Esc/Enter pause, keluar fullscreen → auto-pause.
- [ ] Karakter terlihat berdiri di lantai pada semua stage dan semua ukuran jendela.
- [ ] Tidak ada flash lebih dari 3 kali per detik.
- [ ] Audio: tanpa file audio pun game berbunyi (fallback sintesis).

**Formulir untuk teman (skala 1–5 + komentar):** (1) kontrol responsif? (2) paham kenapa kena hit? (3) mudah membedakan serangan tinggi/rendah? (4) parry terasa adil? (5) AI Normal menantang? (6) game terasa berat/lag? (7) bagian paling seru? (8) bagian paling membingungkan? (9) bug yang terlihat? (10) mau main lagi?

### 18.9 Definisi selesai

Sebuah tugas selesai bila memenuhi daftar di **Lampiran C.2** (typecheck, lint, test, scenario terkait, tidak melanggar ESLint sim, dicoba manual, dicommit).

---

## 19. Performa, Deploy, dan Legal

### 19.1 Deploy (Vercel Hobby, gratis)

- Repo GitHub → import ke Vercel; framework Next.js terdeteksi otomatis. Tiap branch/PR punya URL preview; `main` = production.
- Tidak ada environment variable wajib. `NEXT_PUBLIC_E2E` hanya diset di job Playwright.
- **Cache aset:** `scripts/process-sprites.mjs` dan `process-stages.mjs` menulis `public/assets/assets-manifest.json` (path → hash 8 karakter). `AssetLoader` menambahkan `?v=<hash>` ke tiap URL aset, dan `next.config` memberi `Cache-Control: public, max-age=31536000, immutable` untuk `/assets/*`. Ganti file → hash berubah → pemain otomatis mendapat versi baru.
- Alasan gratis cukup: tanpa server, tanpa database, tanpa analytics; semua statis. Pantau batas bandwidth Hobby di dashboard Vercel (cek syarat terbaru saat deploy).

### 19.2 Anggaran ukuran

| Item | Batas |
| --- | --- |
| JS menu pertama dimuat (gzip) | ≤ 300 kB (ukur lewat DevTools Network atau Lighthouse; `next build` Next 16 tidak lagi menampilkan angka ini) |
| Aset 1 pertandingan (2 karakter Tier A + 1 stage) | ≤ 10 MB |
| Satu pose karakter (WebP) | ≈ 40–90 kB |
| Satu BGM | ≤ 2,5 MB (128 kbps) |
| Total `public/assets` | ≤ 250 MB (batas wajar repo; aset mentah di `raw-assets/` tidak di-commit bila besar, pakai `.gitignore` dan cadangan manual) |

Aset dimuat per tahap: Title memuat font dan UI; Select Character memuat `portrait` + `splash` seluruh roster; setelah memilih, VS Intro memuat sprite penuh 2 karakter dan stage (progress bar), sehingga Battle tidak memuat apa pun saat jalan.

### 19.3 Browser yang didukung

| Browser | Minimum (target) | Catatan |
| --- | --- | --- |
| Chrome, Edge | 111+ | Utama; Keyboard Lock tersedia |
| Firefox | 111+ | Tanpa Keyboard Lock (Esc keluar fullscreen → auto-pause) |
| Safari desktop | 16.4+ | Fullscreen perlu gesture; diuji paling akhir |
| Mobile / tablet sentuh | tidak didukung | Layar "gunakan laptop/PC" |

Fitur yang dipakai: Canvas 2D, WebAudio, `createImageBitmap`, WebP, `dvh`, Fullscreen API, `visibilitychange`. Angka minimum di atas mengikuti syarat browser Next.js 16 (Chrome/Edge 111+, Firefox 111+, Safari 16.4+) dan adalah target perencanaan; konfirmasi dengan uji nyata, bukan dengan klaim di dokumen ini.

### 19.4 Legal, kredit, dan privasi

- **Karakter:** teman sekolah dengan izin (sudah ada). Boss: tiga guru dengan izin (sudah ada). Tidak memakai foto asli; semua gambar dibuat generator dari deskripsi. Humor mengikuti 10.5.
- **Font:** Dela Gothic One, Zen Dots, Orbitron, Chakra Petch dari Google Fonts (berlisensi SIL OFL, bebas dipakai dan di-host). Tetap tampilkan di Credits.
- **Audio:** hanya musik/SFX berlisensi bebas atau buatan sendiri; tiap file dicatat di `docs/audio-credits.md` (judul, pembuat, sumber, lisensi). Lisensi yang mewajibkan atribusi ditampilkan di layar Credits.
- **Gambar AI:** simpan prompt dan tanggal pembuatan di `docs/asset-log.md` (untuk pelacakan bila ada pertanyaan), pakai sesuai ketentuan layanan generator.
- **Privasi:** tidak ada analytics, tidak ada akun, tidak ada data yang keluar dari browser. Satu-satunya penyimpanan = `localStorage` lokal (17.1). Tidak ada halaman kontak takedown di v1 (keputusan R4).
- **Credits screen:** nama pembuat, karakter (nama + kelas), tiga guru, font, audio, alat (Next.js, React, dll.), "Dibuat untuk RPL XII-4, SMK Wikrama".

---

## 20. Roadmap

### 20.1 Prinsip urutan

1. **Walking skeleton dulu.** Secepat mungkin (akhir F1) ada dua kotak yang bergerak, melompat, dan dash di browser dengan input keyboard asli. Motivasi dan kecurigaan bug sama-sama terjawab lebih awal.
2. **Bawah ke atas, test dulu.** types → data → sim + test → adapter → HUD → layar (0.3). Layar menu dibangun **setelah** pertarungan bisa dites di Node.
3. **Irisan vertikal.** Satu karakter, satu stage, satu mode (Training) yang lengkap lebih berguna daripada lima karakter setengah jadi.
4. **Aset berjalan paralel.** Gambar dibuat di generator saat lu tidak sedang coding (jalur aset, 20.4). Engine tidak menunggu aset karena ada fallback (6.6).
5. **MVP lebih awal dari fitur lengkap.** Setelah F6 ada game yang bisa dimainkan dan dipamerkan; sisanya (Hard/Gelo, boss, Tier B) menyusul.

### 20.2 Fase

Estimasi jam untuk 20 jam/minggu, sudah termasuk bolak-balik copy-paste ke AI dan debugging ringan. Anggap ±40%; tidak ada tenggat (T4), jadi ini alat perencanaan, bukan target wajib.

| Fase | Nama | Isi utama | Selesai bila | Jam |
| --- | --- | --- | --- | --- |
| **R** | Rescue game lama | Amankan kode lama, audit, putuskan rewrite/refactor, inventaris aset (Bagian 21) | `docs/audit-v1.md` ada, keputusan tertulis, repo lama di-tag `legacy-v1` | 10 |
| **F0** | Fondasi repo | Repo baru, tooling, ESLint penjaga sim, CI, `balance.ts`, types, schema roster | `lint`, `typecheck`, `test`, `validate` hijau; menambah `Math.random` di `sim/` memunculkan error ESLint | 10 |
| **F1** | Sim inti + walking skeleton | Rng, Clock, InputBuffer, state machine locomotion, lompat, dash, tabrakan, `BattleEngine` rangka, `GameLoop`, `KeyboardInput`, renderer kotak, Training minimal | Anchor locomotion lolos (18.4); di browser dua kotak bergerak 60 FPS, F1 menampilkan hitbox | 30 |
| **F2** | Combat inti | Hitbox, normal N/C/A, hit resolver, chain, combo lock, cooldown, guard, Perfect Parry, stun/Dizzy, Energy, knockdown, combo tracker, `balance.test.ts`, determinisme | Semua scenario RL-01..RL-52 di Lampiran D.2 lolos; rasa pertarungan terasa benar di Training dengan hitbox terlihat | 40 |
| **F3** | Render, aset, kamera | `process-sprites`, loader, atlas, animasi keyframe, kamera + `computeView`, parallax, kontrak lantai, efek, damage number, aligner, preset kualitas | E2E-4 lolos; karakter berdiri di lantai di 5 ukuran jendela; 60 FPS di T480; aligner jalan | 30 |
| **F4** | Match, HUD, layar | `MatchFlow`, Grade, AI stub (dev), store, HUD lengkap, banner, semua layar, VS Intro 3 dtk, Pause/Settings/Rebind, localStorage, fullscreen | E2E-1, 2, 3, 5 lolos; satu match best-of-3 vs AI stub selesai sampai Match Detail | 40 |
| **F5** | Skill kit | Template S1–S8, U1–U5, P1–P7, EX, proyektil, cinematic Ultimate/X-Ray, VFX dan SFX sintesis | Scenario RL-80..RL-85 lolos; tiap template bisa dicoba di Training; FlashLimiter bekerja | 35 |
| **F6** | AI (Easy, Normal) | Perception, ThreatDetector, StrategyFSM, UtilityScorer, MacroExecutor, persona, anti-stall, `simulate.ts` | Win-rate Normal vs Normal tiap pasangan 35–65%; Easy bisa dikalahkan teman ≥ 85% | 30 |
| | **MVP (v0.9)** | **R sampai F6** dengan ≥ 2 karakter Tier A, 1 stage, Training, Quick Match | Playtest 18.8 dengan 3 teman tanpa bug fatal | **≈ 225** |
| **F6b** | AI (Hard, Gelo) | Footsies, whiff punish, anti-air, mix-up, wakeup, model lawan | Target win-rate 12.2 tercapai di playtest; Gelo beatable | 20 |
| **F7** | Konten | 3 karakter lagi, 3 stage lagi, Arcade + Continue + Ending, boss (satu guru dulu, lalu dua lagi), VS Intro detail, nama jurus final | Satu run Arcade sampai Ending dengan tiap boss | 40 |
| **F8** | Polish dan rilis | Tier B animasi bertahap, audio penuh (BGM, TTS, SFX file), pass performa, aksesibilitas, bug bash, Credits, deploy | Checklist rilis (Lampiran C.3) tercentang; URL publik jalan | 40 |

Total ≈ 325 jam ≈ 16 minggu jika murni 20 jam/minggu; rencanakan 18–24 minggu (4–6 bulan) agar ada ruang istirahat dan perbaikan.

### 20.3 Definisi MVP

- 2 atau lebih karakter dengan Tier A lengkap (Ridho dan satu lagi), 1 stage (Lapangan Wikrama) dengan lapisan minimum `far` + `floor`.
- Mode Training (dummy + CPU Normal) dan Quick Match vs AI Easy/Normal, best-of-3, Match Detail dengan grade.
- Skill kit lengkap (Special, EX, Ultimate, Passive) untuk template yang dipakai karakter MVP.
- HUD, VS Intro, Pause, Settings, Rebind, fullscreen. Audio memakai sintesis fallback.
- Belum ada: Arcade, boss, Hard/Gelo, Tier B, BGM, TTS.

### 20.4 Jalur aset (paralel dengan kode)

Tahap produksi P0–P4 didefinisikan di Asset Pack 1.3; tabel ini memetakannya ke fase kode.

| Milestone aset | Dibutuhkan sebelum | Isi (Asset Pack 1.3) |
| --- | --- | --- |
| **AT1** (P0, 8 gambar) | F3 | Ridho dan satu karakter lain: `idle`, `portrait`, `splash`; stage Lapangan: `far` + `floor` |
| **AT2** (P1, 32 gambar) | F4 | Dua karakter pertama: gerak, dash, 4 normal, guard, hit, knockdown, down, getup |
| **AT3** (P2, 29 gambar) | F5 | Dua karakter pertama: crouch/air attack, guard jongkok, hit rendah, dizzy, special, ultimate, xray, intro, win; VFX global (3) |
| **AT4** (P3) | F7 | 3 karakter lain Tier A penuh, 3 stage lagi + `mid`/`near` Lapangan, 14 pose minimum 3 boss |
| **AT5** (P4) | F8 | Tier B bertahap (prioritas di Asset Pack 5.1), BGM, voice |

Pekerjaan aset dilakukan di chat generator gambar (bukan chat kode) memakai **Asset Pack**.

### 20.5 Urutan pemotongan (bila waktu atau tenaga habis)

Dipotong dari atas ke bawah. Yang tidak pernah dipotong: test, fixed timestep, kontrak lantai, aturan guard/parry, kontrol.

1. Tier B animasi (game tetap enak dengan Tier A)
2. Refleksi lantai (preset High)
3. Model kebiasaan lawan Gelo (12.4)
4. Boss kedua dan ketiga (satu boss saja)
5. Stage keempat dan ketiga (cukup 2)
6. Karakter ke-5 dan ke-4 (cukup 3)
7. VS Intro detail (pakai versi sederhana 3 dtk)
8. TTS announcer (cukup teks dan SFX)

### 20.6 Backlog setelah v1 (urutan keputusan T5)

Gamepad → 2P lokal → boss bisa dimainkan → taunt → replay viewer → preset mouse. Tidak ada yang dikerjakan sebelum F8 selesai.

---

## 21. Rencana Kerja dan Rescue Game Lama

Bagian ini menjawab: **"Apa saja yang harus dilakukan, dan urutannya?"** Game lama sudah ada tetapi "ngaco". PRD ini dipakai untuk memperbaikinya, bukan untuk mengulang dari nol secara membabi buta. Alurnya: amankan yang lama → ukur seberapa parah → ambil yang masih berguna → bangun inti baru yang bisa dites → pindahkan aset dan layar yang bagus.

### 21.1 Langkah 0–5 (minggu 1)

| # | Langkah | Cara | Hasil |
| --- | --- | --- | --- |
| 0 | **Amankan game lama** | Zip seluruh folder lama (di luar repo). Bila sudah pakai git: `git tag legacy-v1` lalu `git push --tags`. Bila belum: `git init`, `git add -A`, `git commit -m "legacy v1"`. Salin semua gambar/audio lama ke folder `raw-assets-old/` | Tidak ada yang bisa hilang |
| 1 | **Siapkan alat di T480** | Node 24 LTS (via nvm atau installer), Git, VS Code, Chrome. Cek: `node -v` menampilkan `v24.x`, `npm -v`, `git --version` | Versi cocok dengan 3.10 |
| 2 | **Simpan dokumen** | Folder `docs/`: `PRD.md` (dokumen ini), `context-block.md` (isi 0.1), `decisions.md`, `asset-log.md`, `progress.md` (salinan tabel 21.6). Dokumen ini untuk lu dan untuk di-paste ke AI | Satu sumber kebenaran |
| 3 | **Audit game lama** | Jalankan `node scripts/audit.mjs src > audit-report.md` (skrip di Lampiran E.1, salin ke folder game lama). Isi daftar "ngaco" (21.4). Paste keduanya ke AI dengan prompt E.1 | `docs/audit-v1.md`: tabel simpan / tulis ulang / buang |
| 4 | **Putuskan rewrite atau refactor** | Hitung skor 21.5 | Keputusan tertulis di `decisions.md` |
| 5 | **Inventaris aset lama** | Daftar gambar/audio/teks yang bagus; tandai yang bisa dipakai ulang (nanti diproses pipeline 16.3 atau dipindah ke `raw-assets/`) | Daftar di `asset-log.md` |

### 21.2 Checklist audit (bagian dari langkah 3)

Jawab dengan melihat kode atau menjalankan game lama. Kolom terakhir menunjuk bagian PRD yang memperbaikinya.

| Pertanyaan | Tanda masalah | Perbaikan di PRD |
| --- | --- | --- |
| Loop game pakai apa? | `setInterval`/`setTimeout`, atau gerak dikali delta waktu | 3.2 (fixed timestep, frame integer) |
| Di mana logika pertarungan? | Di dalam komponen React / `useState` per frame | 3.1 (sim murni, HUD hanya membaca snapshot) |
| Bagaimana state fighter diwakili? | Banyak boolean (`isAttacking`, `isJumping`, ...) yang bisa bentrok | 6 (satu state aktif, RL-01) |
| Bisa jalankan satu pertarungan tanpa browser? | Tidak | 3.1, 18 |
| Ada test? | Tidak ada | 18 |
| Hitbox dari mana? | Dari ukuran gambar atau angka tersebar di kode serangan | 7.2, 8.2 (data di `balance.ts`) |
| Input dibaca bagaimana? | `event.key`, langsung mengubah posisi, tombol nyangkut setelah pindah tab | 5.2 |
| Angka tuning (damage, speed) di mana? | Tersebar di banyak file | 3.9, Lampiran B |
| Ukuran kanvas? | Tetap 1280×720 / ada letterbox | 3.7, 14.1 |
| Performa di T480? | Re-render React tiap frame, `ctx.filter`, gambar PNG 1 MB | 3.8, 16 |
| File terbesar berapa baris? | > 600 baris memegang banyak hal | 3.9 (maks ±400 baris) |

### 21.3 Peta gejala → bagian PRD

Saat mencatat "ngaco", cocokkan dengan tabel ini supaya AI tahu aturan mana yang dilanggar.

| Gejala di game lama | Penyebab umum | Bagian PRD |
| --- | --- | --- |
| Game lebih cepat di monitor 144 Hz | Gerak per `requestAnimationFrame` tanpa fixed timestep | 3.2 |
| Karakter melayang atau tenggelam di lantai, beda per stage | Posisi lantai ditulis per gambar | 14.4 |
| HUD terpotong atau kebesaran di layar lain | Ukuran piksel tetap | 3.7, 13.2 |
| Serangan kena padahal jauh, atau meleset padahal dekat | Hitbox dari sprite | 7.2 |
| Combo tak berujung, tombol di-spam | Tanpa cooldown/combo lock | RL-33, RL-35 |
| Bisa bergerak saat kena pukul / tidak bisa bergerak padahal bebas | State dan flag bentrok | RL-02, 6.3 |
| Karakter menghadap arah salah | Auto-facing di semua state | RL-11 |
| Tombol nyangkut setelah pindah tab | Tidak reset di `blur` | 5.2 |
| Pause merusak timer atau animasi | Pause hanya menghentikan sebagian | 3.2, RL-17, RL-23 |
| AI diam, atau AI curang membaca tombol | Tidak ada pipeline persepsi | 12.1 |
| Lag di laptop | Alokasi per frame, filter canvas | 3.8 |
| Kamera memotong karakter | Kamera tetap | 14.1 |
| Suara tumpang tindih atau telat | Satu `Audio` per efek | 15.1 |

### 21.4 Template daftar "ngaco"

Salin ke `docs/audit-v1.md` dan isi sebanyak yang lu ingat (10–20 baris cukup).

```
| # | Gejala (yang terlihat) | Kapan terjadi / cara memicu | Seharusnya | Bagian PRD (21.3) |
| 1 | | | | |
```

### 21.5 Skor rewrite atau refactor

Beri 1 poin untuk tiap jawaban "ya":

1. Logika pertarungan bercampur dengan komponen React.
2. Waktu memakai delta/`setInterval`/`setTimeout`.
3. State fighter berupa banyak boolean.
4. Tidak ada test.
5. Tidak bisa menjalankan satu pertarungan tanpa browser.
6. Ada file > 600 baris yang memegang banyak hal.
7. Angka tuning tersebar di banyak file.
8. Hitbox ditulis langsung di kode serangan atau diambil dari sprite.
9. Ukuran canvas tetap.
10. Lu tidak yakin dari mana bug berasal.

| Skor | Keputusan |
| --- | --- |
| **≥ 6** (default yang diperkirakan untuk game yang "ngaco") | **Tulis ulang inti** di repo baru (F0 dst.). Game lama jadi referensi rasa dan sumber aset |
| 3–5 | Refactor bertahap: bangun `engine/sim` berdampingan dan pindahkan satu modul per fase; game lama tetap jalan sampai modul pengganti lolos test |
| ≤ 2 | Refactor di tempat mengikuti urutan 21.6; PRD dipakai sebagai target |

**Boleh dipindahkan dari game lama:** gambar dan audio (setelah diproses/dilisensi), teks, nama jurus, layar menu yang rapi, ide efek. **Jangan dipindahkan:** loop, state fighter, tabrakan, input, penyimpanan, logika AI.

### 21.6 Daftar tugas berurutan (1 tugas = 1 chat AI)

Kolom "Paste" merujuk bagian PRD/Lampiran yang di-paste setelah Context Block (0.1) dan brief (0.2). Centang di `docs/progress.md`. Jangan loncat fase; tugas dalam satu fase boleh bertukar urutan bila tidak saling bergantung.

**F0, Fondasi**

| ID | Tugas | Paste | Selesai bila |
| --- | --- | --- | --- |
| F0-1 | Buat app (lu jalankan `npx create-next-app@latest`, jawab prompt: TypeScript ya, ESLint ya, Tailwind ya, `src/` ya, App Router ya, alias `@/*`; bila prompt berubah ikuti `--help`). AI memberi `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `package.json` scripts | 3.9, 3.10, A.1 | `npm run lint`, `typecheck`, `test` hijau |
| F0-2 | `src/config/balance.ts` dan `src/types/game.ts` | A.2–A.6, B | `typecheck` hijau; tidak ada angka tuning di luar `balance.ts` |
| F0-3 | `schemas.ts` (Zod), `roster.json` (5 karakter), `scripts/validate-data.ts` | A.7, 10.1, 10.2 | `npm run validate` hijau; menghapus satu field di JSON membuatnya gagal |
| F0-4 | GitHub Actions CI dan folder `docs/` | 3.10 | PR percobaan menjalankan lint → typecheck → test → validate |

**F1, Sim inti dan walking skeleton**

| ID | Tugas | Paste | Selesai bila |
| --- | --- | --- | --- |
| F1-1 | `Rng` (mulberry32, dua stream), helper frame (`sec()`), test | 3.2, 3.3, A.2 | Seed sama → urutan sama |
| F1-2 | `InputFrame`, `InputBuffer` (6f), resolusi arah 5.3, test | 5.2, 5.3, A.3 | Tabel 5.3 lolos semua sel |
| F1-3 | `StateMachine`, registry `StateDef`, state Idle/Walk/Crouch*, auto-facing, test | 6.1–6.5, A.4 | RL-01, 11, 15, 16 lolos |
| F1-4 | Lompat, gravitasi, kontrol udara, PreJump/Land, test | 7.1, 7.3 | Anchor airtime 52f ±1, RL-07, RL-14 |
| F1-5 | Dash darat dan air dash, cooldown bersama, test | 7.3, RL-09, RL-10 | Anchor 180 u / 233 u |
| F1-6 | Pushbox, dinding dunia, dinding kamera, pendaratan di lawan, test | 7.4 | Scenario D.2 (tabrakan) lolos |
| F1-7 | Rangka `BattleEngine.step` (urutan 3.4, `freeze`, fase), `ports.ts`, harness test | 3.4, 3.2, A.2, D.1 | `runScenario` bekerja |
| F1-8 | `GameLoop` (accumulator, aman StrictMode), `KeyboardInput` (`event.code`, reset saat blur), `Fullscreen` | 3.2, 5.2, 3.7 | Tidak ada loop ganda di dev |
| F1-9 | Renderer kotak (hurtbox/hitbox/pushbox), overlay F1/F3, halaman Training minimal | 3.7, 14.1 (`computeView`), 7.2 | Dua kotak bergerak 60 FPS |

**F2, Combat inti**

| ID | Tugas | Paste | Selesai bila |
| --- | --- | --- | --- |
| F2-1 | Hitbox data, AABB, hurtbox per postur (RL-05), test | 7.2, 8.2 | Tabel 7.2 dihitung dari AABB |
| F2-2 | Normal darat N1–N4, cooldown tombol (RL-06, 33) | 8.2, 8.4, 6.2 | Frame data sesuai (konvensi 8.2) |
| F2-3 | Jalur Hit: damage RL-30, hit-stop, knockback, hitstun, RL-02 | 8.1, 8.5, 7.3 | Anchor chip dan damage |
| F2-4 | Chain, combo lock, cancel window, `ComboTracker` | 8.3, 8.10 | Anchor 139 damage; RL-20, 34, 35 |
| F2-5 | Normal jongkok dan udara, RL-08, RL-22 | 8.2, 6.2 | Scenario crouch/air lolos |
| F2-6 | Guard, Blockstun, chip | 8.6, 8.5 | RL-31, 41 |
| F2-7 | Perfect Parry, parry lock, Counter | 8.6 | RL-41a, 42, 43 |
| F2-8 | Stun Gauge, Dizzy, immunity | 8.7 | RL-44, 45, 12 |
| F2-9 | Energy | 8.8 | RL-46 |
| F2-10 | Knockdown, GetUp, corner pushback, RL-13, 48 | 8.9, 7.4 | Anchor 24/40/30 |
| F2-11 | `balance.test.ts`, anchor, determinisme | 18.4–18.6 | Semua lolos |
| F2-12 | Review silang (chat lain) `HitResolver` dan `StateMachine`; perbaiki temuan | 0.6 | Daftar temuan kosong atau ditutup |

**F3, Render, aset, kamera**

| ID | Tugas | Paste | Selesai bila |
| --- | --- | --- | --- |
| F3-1 | `process-sprites.mjs`, `sprites.json`, manifest aset | 16.1–16.4, 19.1 | Ridho diproses; warning 12% bekerja |
| F3-2 | `AssetLoader`, `SpriteAtlas` (ImageBitmap, placeholder bila gagal) | 16, 3.8 | Aset hilang → placeholder + toast |
| F3-3 | Sistem animasi keyframe, rantai fallback, transformasi prosedural | 6.6, 16.4 | Pose hilang tidak crash |
| F3-4 | `Camera`, `computeView`, `CanvasRenderer` (fighter, bayangan kontak) | 3.7, 14.1, 14.2, 14.4 | Kaki di 87% tinggi layar |
| F3-5 | `ParallaxRenderer`, `process-stages.mjs`, `stage.json` | 14.3, 14.6, 16.6 | Floor contract pada 5 ukuran jendela |
| F3-6 | `EffectsSystem` (spark, debu, siluet flash, afterimage, shake), hit-stop visual | 13.7, 14.5, 3.8 | Tanpa alokasi per frame |
| F3-7 | `DamageNumbers` (atlas digit, pool 12) | 13.5 | Terlihat dan tidak lag |
| F3-8 | Aligner `/dev/aligner` | 16.5 | Copy JSON bekerja |
| F3-9 | Preset kualitas, overlay F3, auto-saran | 3.8 | Toast muncul sekali per sesi |

**F4, Match, HUD, layar**

| ID | Tugas | Paste | Selesai bila |
| --- | --- | --- | --- |
| F4-1 | `MatchFlow` (fase, timer, K.O., Time Over, seri, PERFECT) | 11.1–11.4 | Scenario ronde lolos |
| F4-2 | `Grade`, `MatchStats` | 11.7 | Tabel skor dites dengan contoh |
| F4-3 | AI stub (dev saja: mendekat, N1 berkala, guard acak) | 12.1 (hanya `InputFrame`) | Match best-of-3 bisa selesai |
| F4-4 | `gameStore`, `battleStore`, jembatan snapshot 30 Hz | 3.6, A.5 | HUD tidak re-render per frame |
| F4-5 | HUD: bar, nameplate, timer, pips, combo | 13.2–13.4 | Tampil benar di 5 ukuran jendela |
| F4-6 | Banner, label event, radial cooldown, key hints | 13.6, 13.7 | Event muncul sesuai |
| F4-7 | Layar: Loading, Title, Select Mode, Select Character, Select Stage | 4.1–4.3 | Navigasi keyboard dan mouse |
| F4-8 | VS Intro 3 dtk | 4.5 | Durasi 180f |
| F4-9 | Pause, Settings, Rebind, Confirm, Toast, localStorage | 5.4–5.6, 17 | Pengaturan bertahan setelah refresh |
| F4-10 | Match Detail, How to Play, Credits | 11.6, 17.4 | Teks sesuai `copy.ts` |
| F4-11 | Playwright E2E-1 sampai 5 | 18.7 | Semua hijau |

**F5, Skill kit**

| ID | Tugas | Paste | Selesai bila |
| --- | --- | --- | --- |
| F5-1 | Tipe dan loader template, sistem proyektil (clash, reverse, guard per hit) | 7.5, 9.1, A.6 | RL-85 |
| F5-2 | S1 Energy Bolt dan S8 Triple Shot | 9.2 | Scenario: jongkok/lompat menghindar |
| F5-3 | S3 Rising Strike dan S4 Charge Rush (kebal, armor, lunge) | 9.2, 8.5 | RL-84 |
| F5-4 | S5 Ground Shock dan S2 Wave Burst (gelombang, multi-hit) | 9.2 | S5 kena jongkok, S2 menembus S1/S8 |
| F5-5 | S6 Counter Stance dan S7 Shadow Step | 9.2 | Counter pasti kena; S7 muncul di belakang |
| F5-6 | EX generik (aturan 9.5) | 9.5 | Anchor angka EX |
| F5-7 | Rantai state Ultimate + U1 dan U3 | 9.3, 6.2 | RL-81, 82, 83 |
| F5-8 | U2, U4, U5 (grab) | 9.3 | RL-39 (U5 menembus kebal) |
| F5-9 | Passive P1–P7 | 9.4, 8.1 | Setiap P punya test |
| F5-10 | Cinematic Ultimate/EX (freeze, cut-in, X-Ray), `FlashLimiter` | 13.8, 13.9 | ≤ 3 kilat per detik |
| F5-11 | VFX per template, hook SFX sintesis | 9.6, 15.4, 15.5 | Setiap template berbunyi dan terlihat |
| F5-12 | Review silang skill kit + scenario | 0.6 | Temuan ditutup |

**F6, AI**

| ID | Tugas | Paste | Selesai bila |
| --- | --- | --- | --- |
| F6-1 | `Perception` (ring buffer tertunda) dan `ThreatDetector` | 12.1 | Roll bertahan sekali per serangan |
| F6-2 | `UtilityScorer`, `StrategyFSM`, `MacroExecutor` | 12.1, 9.6 | AI hanya mengeluarkan `InputFrame` |
| F6-3 | Parameter Easy/Normal dan persona | 12.2, 12.5 | Tabel 12.2 sebagai data |
| F6-4 | Anti-stall dan anti-loop | 12.6 | Tidak ada match macet |
| F6-5 | `simulate.ts` dan CSV | 12.7, 18.1 | Win-rate 35–65% |

**F6b, Hard dan Gelo:** F6-6 footsies + whiff punish + anti-air (12.3 butir 1–3); F6-7 mix-up + wakeup + resource (12.3 butir 4–7); F6-8 model lawan (12.4) + parameter Hard/Gelo.

**F7, Konten:** F7-1 Arcade + Continue + Ending (4.4, 11.5, 11.6); F7-2 data boss, dua fase, Super Armor (10.4, 8.5); F7-3 Boss Intro dan arena Rooftop; F7-4 tiga karakter tersisa (data + scenario kesehatan roster); F7-5 stage 2–4; F7-6 VS Intro detail (4.5).

**F8, Polish dan rilis:** F8-1 pipeline Tier B (`animations.json`) bertahap; F8-2 `WebAudioEngine` + BGM (15.1–15.2); F8-3 TTS announcer (15.3); F8-4 pass performa di T480 (3.8); F8-5 pass aksesibilitas (13.9); F8-6 deploy Vercel (19.1); F8-7 playtest + bug bash (18.8) + checklist rilis.

### 21.7 Ritme per minggu (20 jam)

Pola: 3 sesi coding 5–6 jam, 1 sesi aset/playtest 2–3 jam. Awal minggu mulai dari tugas dengan test (lebih jelas); akhir minggu fitur yang terlihat (memotivasi).

| Minggu | Tugas | Target akhir minggu |
| --- | --- | --- |
| 1 | R (21.1) + F0-1..F0-4; mulai AT1 (Ridho) | Repo baru hijau; keputusan rewrite/refactor tertulis |
| 2 | F1-1..F1-6 | Anchor locomotion lolos di Node |
| 3 | F1-7..F1-9; mulai F2-1 | Dua kotak bergerak di browser |
| 4 | F2-1..F2-5 | Rantai J-K-L-; berjalan di Training |
| 5 | F2-6..F2-12 | Semua scenario F2 hijau |
| 6 | F3-1..F3-4 (butuh AT1 selesai) | Ridho berdiri di lantai Lapangan |
| 7 | F3-5..F3-9 | Floor contract lolos di 5 ukuran jendela |
| 8 | F4-1..F4-6 | HUD tampil dan bereaksi |
| 9 | F4-7..F4-11 | Satu match best-of-3 dari Title sampai Match Detail |
| 10 | F5-1..F5-6 (butuh AT3) | Special dan EX bekerja |
| 11 | F5-7..F5-12 | Ultimate sinematik bekerja |
| 12–13 | F6-1..F6-5 | **MVP v0.9** + playtest pertama |
| 14 | F6b | Hard dan Gelo |
| 15–16 | F7 | Arcade sampai Ending |
| 17–18 | F8 | Rilis publik |

Bila satu minggu meleset, geser minggu berikutnya; **jangan memadatkan tugas dengan melewati test**.

### 21.8 Siklus kerja untuk setiap tugas

1. Buka chat **baru**. Paste Context Block (0.1).
2. Paste brief (0.2) dengan bagian PRD dan Lampiran dari kolom "Paste", plus isi file yang berubah/diimpor.
3. Salin file dari jawaban AI **utuh** ke repo (satu blok kode = satu file).
4. Jalankan perintah di bagian (a) jawaban AI. Cocokkan dengan hasil yang diharapkan di bagian (b).
5. Error → template debug (0.5) di chat yang sama bila masih < 25 pesan, selain itu chat baru.
6. Lolos → `git add -A && git commit -m "F1-3: state machine locomotion"`; centang `docs/progress.md`.
7. Modul rawan (state machine, hit resolver, AI, parry): review silang di chat lain (0.6).

**Tanda AI menyimpang (kirim ulang aturan keras 0.1):** mengubah angka PRD, memakai `Math.random`/`Date.now` di `sim/`, menulis "...kode lain tidak berubah", menambah dependency, memakai `any`, menyatakan "sudah lolos test", membuat file > 400 baris, atau memakai API yang tidak ada di versi terpasang.

---

## 22. Risiko

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| AI memakai API lama (Next 13/14, React 17/18) atau API yang tidak ada | Kode tidak jalan | Versi dipin dan disertakan di Context Block; paste error mentah; AI diminta berkata jika tidak yakin (0.1) |
| AI lupa aturan di chat panjang | Kode melanggar PRD | Satu tugas satu chat; paste Context Block tiap chat; review silang |
| Scope creep (fitur baru di tengah jalan) | Tidak selesai | Backlog 20.6; urutan pemotongan 20.5; MVP lebih awal |
| Angka balance tidak pernah pas | Game tidak seru | Angka di satu tempat; anchor + `simulate`; playtest; ubah angka, bukan logika |
| Gambar generator tidak konsisten antar pose | Karakter "berubah wujud" | Character Sheet + aturan prompt (Asset Pack), skala per karakter dari `idle`, warning 12%, aligner |
| Performa di T480 | Patah-patah | Anggaran 3.8, preset kualitas, aturan render, overlay F3, auto-saran |
| Fullscreen dan Esc bermasalah | Pause tidak terpicu | Enter sebagai pause utama; auto-pause saat keluar fullscreen; Keyboard Lock sebagai bonus (5.5) |
| Keyboard ghosting | Kombinasi tombol tidak terbaca | Maks 3 tombol; uji di Training; rebind (5.2, 5.6) |
| Bug non-deterministik | Test flaky, sulit diperbaiki | Rng ber-seed, ESLint sim, tes determinisme (3.3, 18.6) |
| Lisensi audio | Masalah hak cipta | Catat di `audio-credits.md`; sintesis fallback tidak butuh lisensi (19.4) |
| React StrictMode (mount dua kali) | Loop ganda, input ganda | `destroy()` di cleanup `useEffect` (Context Block aturan 7) |
| Burnout atau kehilangan motivasi | Proyek berhenti | Walking skeleton cepat; playtest dengan teman tiap milestone; MVP yang bisa dipamerkan |
| Humor menyinggung | Masalah sosial | Batas di 10.5 (izin sudah ada), jaga tetap jenaka |
| Storage diblokir/penuh | Pengaturan tidak tersimpan | Fallback memori + toast (17.1) |

---

## Lampiran A: Tipe, Setup, dan Schema (siap paste)

Semua kode di Lampiran A dan B **sudah dikompilasi dan diuji** (TypeScript 6.0.3 strict + `noUncheckedIndexedAccess`, Zod 4.6.7, Vitest 5.0.5; 7 test `balance.test.ts` lolos pada 23 Okt 2026) di proyek kosong. Itu bukan jaminan di dalam proyek Next.js lu, jadi tetap jalankan `npm run typecheck` dan `npm test` setelah menyalin. Bila AI memodifikasi tipe, minta ia menyebutkan field yang berubah dan memperbarui test.

### A.1 Setup proyek

`package.json` (bagian `scripts`; versi paket dipin exact, lihat 3.10):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "validate": "tsx scripts/validate-data.ts",
    "assets": "node scripts/process-sprites.mjs && node scripts/process-stages.mjs",
    "simulate": "tsx scripts/simulate.ts"
  },
  "engines": { "node": ">=24" }
}
```

`.nvmrc`: satu baris `24`.

`tsconfig.json`: biarkan opsi yang dibuat `create-next-app`; **pastikan** opsi berikut ada (alias `@/*` memakai `paths` tanpa `baseUrl`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`vitest.config.mts` (`.mts` supaya tidak muncul peringatan ESM dari Vite):

```ts
// vitest.config.mts (.mts supaya tidak ada peringatan ESM di Vite)
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
});
```

`eslint.config.mjs`: pakai konfigurasi bawaan Next (`eslint-config-next`, flat config) lalu tambahkan blok pelindung sim dari 3.9. Aturan `@typescript-eslint/*` tersedia lewat `eslint-config-next/typescript`.

`scripts/` yang berekstensi `.ts` dijalankan dengan `tsx` (dev dependency yang disetujui). Skrip aset `.mjs` memakai `sharp`.

### A.2 sampai A.6: `src/types/game.ts`

Satu file; potongan di bawah ditandai sesuai peta paste 0.4. **A.2** dasar dan satuan, **A.3** input, **A.4** state dan serangan, **A.5** event, snapshot, dan API engine (`BattleEngine`, `MatchConfig`), **A.6** template skill. Paste hanya potongan yang dibutuhkan tugas; tipe saling merujuk, jadi bila AI mengeluh tipe tidak ditemukan, paste potongan yang dirujuk juga.

Catatan desain yang harus dipertahankan:

- `step()` mengembalikan array event yang **dipakai ulang** tiap step (tanpa alokasi); konsumen menyalin bila perlu menyimpan.
- Invuln dan armor memakai `stateFrame` 0-based dengan `to` eksklusif (prosa PRD "f1–6" = `from: 0, to: 6`).
- `PassiveId` memuat `'none'` **hanya untuk fixture test**; `roster.json` tidak boleh memakainya (schema menolaknya).

#### A.2 Dasar dan engine

```ts
// src/types/game.ts: tipe bersama sim, platform, dan UI. Tanpa import dari mana pun.
// Boleh dipecah per area (input.ts, state.ts, events.ts) bila file > 400 baris.

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
```

#### A.3 Input

```ts
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
```

#### A.4 State dan serangan

```ts
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
```

#### A.5 Event, snapshot, dan API engine

```ts
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
```

#### A.6 Template skill

```ts
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
```

### A.7 Schema Zod: `src/data/schemas.ts`

Dipakai di `scripts/validate-data.ts` (CI), saat memuat data di dev, dan di test. Menolak field yang tidak dikenal (`strictObject`), id ganda, warna selain `#RRGGBB`, stat di luar power budget (rentang 10.1), `feetLine < floorTop`, `sprites.json` tanpa `idle`/`portrait`.

```ts
// src/data/schemas.ts: Zod untuk semua data JSON. Dipakai di build, dev, dan scripts/validate-data.ts.
import { z } from 'zod';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'warna harus #RRGGBB');
const slug = z.string().regex(/^[a-z0-9-]+$/, 'id harus huruf kecil, angka, atau "-"');
const name = z.string().min(1);

export const specialIdSchema = z.enum(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']);
export const ultimateIdSchema = z.enum(['U1', 'U2', 'U3', 'U4', 'U5']);
export const passiveIdSchema = z.enum(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']);
export const roleSchema = z.enum(['Balanced', 'Rushdown', 'Zoner', 'Tank', 'Counter']);

/** Satu entri roster.json (10.1). `visual` tidak dipakai engine (untuk generator aset). */
export const characterSchema = z.strictObject({
  id: slug,
  name,
  nickname: z.string().optional(),
  kelas: name,
  aura: hex,
  role: roleSchema,
  stats: z.strictObject({
    hp: z.number().int().min(900).max(1150),
    speed: z.number().min(0.85).max(1.15),
    damage: z.number().min(0.95).max(1.05),
  }),
  special: z.strictObject({ template: specialIdSchema, name }),
  ultimate: z.strictObject({ template: ultimateIdSchema, name }),
  passive: passiveIdSchema,
  quote: name,
  winQuote: name,
  loseQuote: name,
  visual: z.string(),
});
export type CharacterData = z.infer<typeof characterSchema>;

export const rosterSchema = z.array(characterSchema).min(1).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((c, i) => {
    if (seen.has(c.id)) ctx.addIssue({ code: 'custom', path: [i, 'id'], message: `id ganda: ${c.id}` });
    seen.add(c.id);
  });
});

const moveRef = z.strictObject({ template: z.union([specialIdSchema, ultimateIdSchema]), name });

/** bosses.json (10.4). `quirk` diisi belakangan oleh yang mengenal guru itu. */
export const bossSchema = z.strictObject({
  id: slug,
  name,
  aura: hex,
  concept: z.string(),
  specials: z.tuple([moveRef, moveRef]),
  ultimate: moveRef,
  phase2Move: moveRef,
  dialog: z.strictObject({
    intro: z.tuple([z.string(), z.string()]),
    phase2: z.string(),
    win: z.string(),
    lose: z.string(),
  }),
  quirk: z.string().nullable(),
});
export type BossData = z.infer<typeof bossSchema>;
export const bossesSchema = z.array(bossSchema).min(1);

/** stages/<id>/stage.json (14.4, 14.6). */
export const stageSchema = z.strictObject({
  id: slug,
  name,
  floorTop: z.number().min(0.5).max(0.95),
  feetLine: z.number().min(0.5).max(0.95),
  shadowAlpha: z.number().min(0).max(1),
  layers: z.array(z.enum(['far', 'mid', 'near', 'floor', 'fg'])).min(2),
  bgm: z.string(),
}).refine((s) => s.feetLine >= s.floorTop, { message: 'feetLine harus ≥ floorTop (kaki tidak boleh di atas lantai)' });
export type StageData = z.infer<typeof stageSchema>;

/** characters/<id>/sprites.json (16.4). */
export const spritesSchema = z.strictObject({
  unitsPerPx: z.number().positive(),
  poses: z.record(z.string(), z.strictObject({
    file: z.string().endsWith('.webp'),
    pivot: z.tuple([z.number(), z.number()]),
    offset: z.tuple([z.number(), z.number()]),
    scale: z.number().positive(),
    flags: z.array(z.enum(['lying'])).optional(),
  })),
}).refine((s) => 'idle' in s.poses && 'portrait' in s.poses, { message: 'pose idle dan portrait wajib ada' });

/** characters/<id>/animations.json (16.4): id aksi -> daftar kunci. */
export const animationKeySchema = z.strictObject({
  pose: z.string(),
  frames: z.number().int().positive(),
  ox: z.number().optional(), oy: z.number().optional(), rot: z.number().optional(),
  sx: z.number().optional(), sy: z.number().optional(),
  ease: z.enum(['linear', 'outQuad', 'outBack']).optional(),
});
export const animationsSchema = z.record(z.string(), z.array(animationKeySchema).min(1));
```

**Spesifikasi `scripts/validate-data.ts` (dibuat di F0-3, dikembangkan di F3/F7):**

1. Baca `src/data/roster.json` dan `bosses.json` → `rosterSchema`, `bossesSchema`; tiap `template`/`passive` harus ada di `src/data/templates/`.
2. Untuk tiap `public/assets/characters/<id>/`: `sprites.json` → `spritesSchema`; setiap `file` ada di disk; pose Tier A yang hilang dilaporkan sebagai **daftar peringatan** (bukan error); `idle` dan `portrait` wajib.
3. Bila ada `animations.json`: `animationsSchema`, tiap `pose` ada di `sprites.json`, dan jumlah `frames` pada timeline tiap aksi sama dengan durasi state (18.5 butir 5).
4. Untuk tiap `public/assets/stages/<id>/stage.json`: `stageSchema`, file layer yang disebut ada.
5. Karakter di `roster.json` tanpa aset Tier A lengkap diberi **peringatan** "tidak akan muncul di Select Character" (10.1).
6. Keluar dengan kode ≠ 0 bila ada error; peringatan tidak menggagalkan CI.

---

## Lampiran B: `balance.ts` awal dan test anchor

### B.1 `src/config/balance.ts`

Nilai awal dari Bagian 7, 8, 11, 12, 14. Template skill (S1–S8, U1–U5, P1–P7) **tidak** ada di sini: mereka hidup di `src/data/templates/*.ts` dengan tipe A.6 dan angka dari tabel 9.2–9.5.

```ts
// src/config/balance.ts: SATU-SATUNYA tempat angka tuning global. Nilai awal dari PRD 7-8, 11-12, 3.8.
// Ubah angka di sini (dan jalankan balance.test.ts), jangan di logika.
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
```

### B.2 `src/config/balance.test.ts`

Test anchor dan verifikasi balance (18.4, 18.5) yang hanya butuh data: true combo, chip, cooldown, combo 139, fisika lompat/dash, knockdown, parry, ronde, roster + power budget. Test yang membutuhkan engine (scenario) ada di Lampiran D.2.

```ts
// src/config/balance.test.ts: verifikasi angka PRD (18.4, 18.5). Murni data, jalan di Node.
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

  it('roster.json lolos schema dan power budget', () => {
    const parsed = rosterSchema.parse(roster);
    for (const c of parsed) {
      expect(Math.abs(powerPoints(c.stats)), c.id).toBeLessThanOrEqual(POWER_BUDGET.limit + 1e-9);
    }
  });
});
```

---

## Lampiran C: Konvensi, Definisi Selesai, dan Checklist

### C.1 Git

- Branch per tugas: `feat/F2-4-chain-combo-lock`. Commit kecil dan sering; pesan diawali ID tugas: `F2-4: chain + combo lock (RL-20, 34, 35)`.
- Commit hanya saat `lint`, `typecheck`, `test` hijau. Bila AI memberi perubahan yang merusak, `git restore .` mengembalikan file ke commit terakhir.
- Tag milestone: `legacy-v1` (game lama), `v0.1-skeleton` (akhir F1), `v0.5-combat` (akhir F2), `v0.9-mvp` (akhir F6), `v1.0` (rilis).
- `main` selalu bisa di-build; fitur setengah jadi hidup di branch.

### C.2 Definisi selesai (tiap tugas)

- [ ] File dari AI disalin **utuh**; tidak ada "...kode lain tidak berubah".
- [ ] `npm run typecheck` dan `npm run lint` hijau (termasuk aturan ESLint pelindung `sim/`).
- [ ] `npm test` hijau; scenario yang terkait tugas (Lampiran D.2) ada dan lolos.
- [ ] Tidak ada angka tuning baru di luar `balance.ts` / `src/data/*`.
- [ ] Tidak ada `any`, `!` tanpa alasan, `Math.random`, `Date.now` di `sim/`.
- [ ] Dicoba manual di browser bila tugas menyentuh platform/HUD (Training dengan hitbox F1).
- [ ] Untuk modul rawan: review silang (0.6) dan temuan ditutup.
- [ ] Commit dengan ID tugas; `docs/progress.md` dicentang; keputusan penting dicatat di `docs/decisions.md`.

### C.3 Checklist rilis (F8)

**Fungsional**
- [ ] Alur Title → Mode → Select → VS Intro → Battle → Match Detail jalan untuk Training, Quick Match, Arcade.
- [ ] Semua 5 karakter memenangkan dan kalah tanpa bug; Special, EX, Ultimate semua template teruji di Training.
- [ ] Tiga boss (fase 1 dan 2), Boss Intro, Ending, Game Over, Continue.
- [ ] Pause, Resume 3-2-1, auto-pause (blur, keluar fullscreen), Restart (Training), Quit.
- [ ] Rebind, Reset Controls, Settings tersimpan; localStorage diblokir tidak membuat crash.

**Kualitas**
- [ ] `lint`, `typecheck`, `test`, `validate`, `test:e2e` hijau; `simulate` 35–65% untuk semua pasangan.
- [ ] 60 FPS di T480 (1080p Medium) selama 10 menit; High dan Low juga dicoba.
- [ ] Kontrak lantai benar di semua stage dan 5 ukuran jendela.
- [ ] Tidak ada flash > 3 per detik; Screen Shake dan Flash bisa dikurangi di Settings.
- [ ] Playtest 18.8 dengan ≥ 5 orang; bug fatal nol.

**Konten dan legal**
- [ ] Teks UI English konsisten dengan `copy.ts`; tidak ada "TODO"/placeholder terlihat.
- [ ] `docs/audio-credits.md` lengkap; layar Credits memuat font, audio, alat.
- [ ] Izin karakter dan guru tersimpan (arsip lu sendiri).

**Deploy**
- [ ] `npm run build` bersih; deploy Vercel; URL publik diuji di Chrome, Edge, Firefox.
- [ ] `assets-manifest.json` terbaru; cache header benar; README singkat (cara main, kontrol).

### C.4 `docs/progress.md`

Salin tabel 21.6 menjadi daftar centang: `- [ ] F1-3 StateMachine locomotion`. Tambahkan di bawah tiap fase satu baris **"Catatan"** untuk hal yang ditunda. Ini satu-satunya "memori proyek" lu di antara chat AI.

---

## Lampiran D: Katalog Test

### D.1 Kontrak harness dan contoh

`runScenario` dibuat di tugas **F1-7** bersama `fixtures.ts` (`TEST_A`, `TEST_B`) dan `hash.ts`. Fixture untuk template tertentu (T-55, T-56, T-61 dst.) didaftarkan lewat `registerTestFighter('t-s7', { special: 'S7' })`, lalu dipakai sebagai `p1: { characterId: 't-s7' }`.

```ts
// src/engine/sim/testing/harness.ts: KONTRAK harness test (diimplementasikan di tugas F1-7).
// Hanya dipakai test dan scripts/simulate.ts. Tanpa timing nyata: semua dalam frame.
import type {
  Action, BattleSnapshot, FighterSetup, GameEvent, GameEventType, InputScriptStep,
} from '@/types/game';

export interface ScenarioConfig {
  seed?: number; // default 1
  /** Default: TEST_A (p1) dan TEST_B (p2) dari fixtures.ts, posisi 800 dan 1200. */
  p1?: Partial<FighterSetup>;
  p2?: Partial<FighterSetup>;
  roundFrames?: number | null; // default null (tanpa timer)
  steps: readonly InputScriptStep[]; // hold-semantics; entri dengan f sama digabung per pemain
  frames: number; // jumlah step yang dijalankan
}

export interface ScenarioResult {
  /** Snapshot SETELAH n step (at(0) = kondisi awal). */
  at(n: number): BattleSnapshot;
  /** Semua event berurutan; event.frame = indeks step penghasilnya. */
  readonly events: readonly GameEvent[];
  eventsOf<T extends GameEventType>(type: T): readonly Extract<GameEvent, { type: T }>[];
  first<T extends GameEventType>(type: T): Extract<GameEvent, { type: T }> | undefined;
  /** hashState(at(n)) untuk tes determinisme. */
  hash(n: number): string;
}

export declare function runScenario(config: ScenarioConfig): ScenarioResult;

/** Tekan di step f, lepas di step f+1. */
export const tap = (f: number, who: 'p1' | 'p2', action: Action): InputScriptStep[] => [
  who === 'p1' ? { f, p1: [action] } : { f, p2: [action] },
  who === 'p1' ? { f: f + 1, p1: [] } : { f: f + 1, p2: [] },
];
```

Contoh gaya test (belum bisa jalan sebelum F1-7; jangan dijalankan sebelum `runScenario` ada):

```ts
// Contoh gaya test (tugas F2-3). Jangan disalin apa adanya sebelum runScenario ada.
import { describe, expect, it } from 'vitest';
import { runScenario, tap } from './harness';

describe('T-20: N1 kena tepat 5 step setelah ditekan', () => {
  it('RL-30: damage 25 pada HP 1000', () => {
    const r = runScenario({ p2: { start: { x: 920 } }, steps: tap(0, 'p1', 'N1'), frames: 12 });
    expect(r.first('Hit')?.frame).toBe(5);
    expect(r.at(6).fighters[1].hp).toBe(975);
  });
});
```

**Aturan pembacaan skrip:** langkah `{ f, p1: [...] }` mengatur tombol yang **ditahan** p1 mulai step `f`; langkah berikutnya untuk p1 menggantikan. `tap(f, who, action)` menekan di `f` dan melepas di `f+1` (membuang tombol lain yang sedang ditahan pemain itu; untuk tombol arah + aksi gunakan dua langkah manual).

### D.2 Katalog scenario (wajib)

**Singkatan setup.** Default: p1 = `TEST_A` di x = 800, p2 = `TEST_B` di x = 1200 (HP 1000, speed 1,0, damage 1,0, S1, U1). `d120` = p2 di x = 920; `d300` = p2 di x = 1100. Semua frame = indeks step; "at(n)" = setelah n step. Angka harus sesuai Bagian 7–9 dan konvensi frame 8.2.

**Gerak dan input**

| ID | RL | Setup dan skrip | Harapan |
| --- | --- | --- | --- |
| T-01 | 16, 5.3 | p1 menahan `Right` dari step 0, 60 step | `x(at 60) − x(at 0)` = 320 ± 1 |
| T-02 | 15 | p1 menahan `Down` + `Right` 30 step | Δx = 0; state `Crouch` |
| T-03 | 16 | p1 `Guard` dari 0; tambah `Right` dari step 20 sampai 50 | Δx(at 20→at 50) = 80 ± 1 (320/60 × 0,5 × 30) |
| T-04 | 07 | p1 menahan `Up` 150 step | Tepat 1 event `Jump` (tidak melompat lagi setelah mendarat) |
| T-05 | 7.1 | Tap `Up` | `Land.frame − Jump.frame` = 52 ± 1; puncak y = 271 ± 2 |
| T-06 | 7.3 | p1 `Up`+`Right` di step 0, lalu hanya `Left` mulai step 10 | Setelah lepas landas, tiap step Δx = +2,0 ± 0,01 (5,0 × (1 − 0,6)); tidak berbalik |
| T-07 | 09, 10 | Tap `Dash` di step 0, 30, 72 | Event `Dash` hanya di step 0 dan 72 (tap step 30 dibuang oleh cooldown 72f dari frame pertama) |
| T-08 | 7.3 | p1 `Right`+`Dash` di step 0, lalu `Right` saja | Δx dalam 24 step = 180 ± 1; state kembali `Idle` pada step 24 |
| T-09 | 09, 7.3 | p1 `Up`+`Right`; tap `Dash` (+`Right`) di step 28; tap lagi di 50 | y konstan selama 16 step dash; Δx aktif = 233 ± 1; hanya 1 event `Dash` bertanda `air: true` |
| T-10 | 11 | p2 di x = 900; p1 tap `Up`; p2 menahan `Left` step 0–50 | p1.facing tetap 1 selama di udara; `at(70)`: p1.facing = −1 |
| T-11 | 5.3 | p1 menahan `Left`+`Right` 30 step | Δx = 0; state `Idle` |
| T-12 | 5.3 | p1 menahan `Up`+`Down` | Tidak melompat, tidak jongkok |
| T-13 | 5.2 | p1 tap `Up` di 0; tap `N1` di step 58 (jatuh di dalam state `Land`, step ±56–59) | Tidak ada `Swing` selama `Land`; `Swing` terjadi tepat pada step pertama state bukan-`Land` (input dibuffer) |
| T-14 | 5.2 | p1 tap `Guard` di 0 (lepas di 1; `Parry` 12f lalu `GuardRelease` 6f, bebas di step 18); tap `N1` di step 5; ulangi dengan tap `N1` di step 13 | Tap di 5: tidak ada `Swing` (buffer berlaku step f sampai f+5, sudah kedaluwarsa); tap di 13: `Swing` di step 18 |
| T-15 | 18 | p1 menahan `Left` 300 step, p2 diam di 1200 | p1.x ≥ 200 (dinding kamera, jarak ≤ 1000) |
| T-16 | 7.4 | p1 menahan `Right` 120 step menuju p2 (d120) | abs(x2 − x1) ≥ 70 (pushbox) di semua step |

**Combat dasar**

| ID | RL | Setup dan skrip | Harapan |
| --- | --- | --- | --- |
| T-20 | 30 | d120, tap `N1` di 0 | Event `Hit` di step 5; p2.hp(at 6) = 975 |
| T-21 | 19 | d300, tap `N1` di 0, tap `N2` di 8 | Tanpa `Hit`; p1 tetap `N1Jab` sampai stateFrame 16; tidak ada `Swing` N2 |
| T-22 | 17 | d120, tap `N1` di 0 | stateFrame p1 dan p2 sama pada at(6)…at(9); at(10) = at(9)+1 (hit-stop 3f membekukan keduanya) |
| T-23 | 30 | p1 damage 1,05, d120, tap `N2` | p2.hp = 964 (floor(35 × 1,05)); dengan p1 `control: 'ai'`, `aiLevel: 'easy'`, `N1` → p2.hp = 979 (floor(25 × 0,85) = 21) |
| T-24 | 20, 34 | d120, tap `N1` di 0, tap `N2` di 6 (buffer saat hit-stop) | N2 mulai di step 9 sebagai cancel; `Hit` N2 di step 16; p2.hp(at 17) = 940; combo 2 hit |
| T-25 | 35 | d120, urutan `N1`, `N2`, `N1` secepatnya | Hanya 2 event `Swing` (N1, N2); `N1` kedua dibuang sampai combo berakhir |
| T-26 | 32, 5.2 | d120, tap `N1` di 0, `N2` di 6, `N3` di 17, `N4` di 30 | 4 `Hit` di step 5, 16, 29, 45; total damage 139 (p2.hp 861); `N4` menyebabkan `KnockdownFly` |
| T-27 | 21, 36 | d120, tap `N1` di 0, `Special` di 6; ulangi dengan p2 `Guard` (Block) | Kena: `Special` mulai di step 9; diblok: `Special` **tidak** ter-cancel |
| T-28 | 05 | d120, p2 menahan `Down`; p1 tap `N1` / `N2`; lalu p1 `Special` (S1) | `N1` meleset; `N2` kena; proyektil S1 meleset |
| T-29 | 06, 33 | d300, tap `N1` di 0, 20, 24 | `Swing` di step 0 dan 24 saja (tap 20 dibuang saat cooldown 24f; tidak masuk buffer) |
| T-30 | 02 | p1 di hitstun (terkena `N1`); tap `Special`, `Guard`, `Up` selama hitstun | Tidak ada aksi baru sampai hitstun selesai; input > 6 step sebelum bebas kedaluwarsa |
| T-31 | 31, 41, 51 | p2 `Guard` dari 0; p1 tap `N1` di 15; ulangi dengan p2.hp = 3 | `Block` di step 20; chip 6 → hp 994; stun 0; dengan hp 3 → hp = 1 (chip tidak membunuh) |
| T-32 | 41a, 37 | p2 menahan `Guard` dari 0; p1 tap `N1` di 0, ulangi di 6 dan 7 | Di 0 dan 6: `Parry` (damage 0; p2 energi +25; p1 → `ParryStunned` 48f; p2 → `ParrySuccess`); di 7: `Block` |
| T-33 | 42 | p2 tap `Guard` di 0, lepas di 1; lalu tap `Guard` di 20 dan tahan; p1 `N1` di 20 (hit di 25); ulangi dengan tap kedua di 24 dan `N1` di 24 | Tap kedua di 20: `Block` (parry masih lock 24f); tap kedua di 24: `Parry` |
| T-34 | 43 | Setelah parry T-32, p2 tap `N2` di step 20 | `Hit` `counter: true`; damage 43 (floor(35 × 1,25)); stun korban +8 +25; serangan kedua di dalam window yang sama **tidak** counter |
| T-35 | 44, 45, 12 | p2.stun = 94; p1 `N1`; p2 menekan `Left`/`Right` bergantian | `Dizzy` di step 5; stun reset 0; tanpa mash: `DizzyEnd.frame − Dizzy.frame` ≈ 150 + 3 hit-stop (± 2); ≥ 10 tekan: ≈ 90 + 3 (minimum, ± 2); 180f sesudahnya `N1` tidak menambah stun |
| T-36 | 46 | `N1` kena; `N1` diblok; Perfect Parry | Kena: penyerang +8, bertahan +5; diblok: penyerang +4, bertahan 0; parry: bertahan +25 |
| T-37 | 13, 47 | d120, `N4` kena; p1 spam `N1` tiap 30 step | `KnockdownFly` → `Down` → `GetUp` total 94 ± 2; tanpa `Hit` baru selama itu; hurtbox kembali sesudahnya |
| T-38 | 48 | p2 tap `Up` di 0; p1 tap `N1` di 14 | p2 → `KnockdownFly` (bukan `HitstunLight`) |
| T-39 | 49 | p1 x = 1830, p2 x = 1940 (dinding); `N4` kena | p2.x = 1940; p1.x(at 35) = 1720 ± 2 (sisa knockback 220 × 0,5; knockback selesai sebelum step 28) |
| T-40 | 04 | p1 `Up` (udara) lalu tap `Guard`; p1 tap `Dash` lalu `Guard` selama dash; p1 Dizzy lalu `Guard` | Tidak ada `Parry`/`Guard` dari state tersebut |
| T-41 | 08 | p1 tap `Up` di 0; tap `N1` di 8, `N2` di 29, `N3` di 53 | Hanya 2 `Swing` (A1, A2); `N3` dibuang (batas 2 per lompat). Skenario kedua: `N1` di 8 lalu `N4` di 29 → A1 lalu A4 (A4 boleh sebagai yang kedua dan terakhir) |
| T-42 | 12 | p1 Dizzy; tap `N1`, `Special`, `Up`, `Guard` | Tidak ada aksi; hanya `Left`/`Right` yang memotong dizzy |
| T-43 | 14 | p1 tap `N1` di 0; p2 tap `Up` di 2 (kena saat `PreJump`). Skenario kedua: p2 tap `Up` di 2, p1 tap `N1` di 54 (kena saat `Land`, ±56–61) | `Hit` terjadi di kedua kasus (PreJump dan Land tidak kebal) |
| T-44 | 18 | `roundFrames: 3600`; tap `N1` di step 10 (saat `RoundIntro`) | Tidak ada `Swing` sebelum event `Fight` |
| T-45 | 22 | p1 tap `Up` di 0; tap `N3` di 30 (mendarat saat recovery); skenario kedua tap `N3` di 46 (mendarat saat active) | Durasi `Land`: 4f pada kasus pertama, 8f pada kasus kedua |
| T-46 | 24 | p2 tap `Guard` dan tahan; ulangi dengan lepas di step 5 | Tahan: state `Guard` pada step 12; lepas: `GuardRelease` 6f (step 12–17) lalu `Idle` |
| T-47 | 37 | p2 masuk jendela Parry sambil menahan Guard; p1 `N1` | `Parry` menang atas `Block` dan `Hit` |
| T-48 | 38 | d120, kedua tap `N1` di step 0 | Dua `Hit` di step 5, tanpa `counter`; hp 975 keduanya; combo 1 hit per sisi |
| T-49 | 50 | Serangan diblok dan di-parry | `comboHits` tidak bertambah |
| T-50 | 03, 80 | p1 tap `Special` saat di udara | Tidak ada `SkillCast` |

**Skill (F5)**

| ID | RL | Setup dan skrip | Harapan |
| --- | --- | --- | --- |
| T-51 | 81 | p1 energi 49 tap `EX`; energi 50 tap `EX`; energi 100 tap `Ultimate` | 49: tanpa aksi; 50: `SkillCast` ex, energi → 0 (tidak kembali bila whiff); `Ultimate` mulai, energi → 0 |
| T-52 | 80, 85 | S1: tap `Special` di d300 | `ProjectileSpawn` di step 14; kecepatan 10,83 ± 0,01 u/step; hilang pada 1400 u; maks 1 aktif |
| T-53 | 85 | Dua S1 saling bertemu; S2/S5 melawan S1/S8 | S1 vs S1: keduanya hilang (`ProjectileClash`); S2/S5 menembus proyektil kecil |
| T-54 | 85 | p2 Perfect Parry S1 | `Reverse`; pemilik jadi p2; kecepatan ×1,3; damage 90 mengenai p1; tidak bisa di-parry ulang |
| T-55 | 84 | Fixture S3. p1 tap `Special` di 10 (`upperBody` stateFrame 0–7 = step 10–17). p2 tap `N1` di 8 (kena di step 13); skenario kedua p2 tap `N3` di 5 (kena di step 13) | `N1` (sisi bawah ≥ 120) tidak melukai p1; `N3` (sisi bawah 15) mengenai p1 |
| T-56 | 84, 8.5 | Fixture S4. p1 tap `Special` di 0 (armor stateFrame 0–11). p2 tap `N1` di 2 (kena di step 7); skenario kedua p2 tap `N4` di 0 (kena di step 11) | `N1`: damage masuk, tanpa hitstun, `ArmorHit`, armor habis; `N4` (heavy): knockdown biasa |
| T-57 | S6 | p2 `N2` ke dalam stance siap; p2 proyektil; p2 Ultimate | `N2`: batal tanpa damage, balasan 100 damage pasti kena, knockdown; proyektil dipantulkan; Ultimate/U5 tidak bisa dibalas |
| T-58 | S7 | S7 saat p2 di tengah dunia; saat p2 di sudut | Muncul 90 u di belakang p2; di sudut: sisi valid terdekat; menghadap p2 |
| T-59 | 32, 9.5 | S1 EX kena; EX lewat cancel dari `N1` | Damage 135; setelah cancel floor(135 × 0,8) = 108; biaya 50 tidak berubah |
| T-60 | 82, 83, 36 | `N1` kena lalu `Ultimate` (U1), energi 100 | `UltFreeze` 30 step (sim beku, input dibuffer); `XRay` saat hit; damage floor(320 × 0,8) = 256; satu Ultimate per combo |
| T-61 | 39 | Fixture U5 untuk p1 (energi 100) dan S7 untuk p2. p1 tap `Ultimate` di 0 (d120); p2 tap `Special` di 48 (kebal `all` 48–59; kontak U5 ≈ step 49–50; sesuaikan ± 2 dengan timeline freeze 30 + startup 18). Skenario kedua: p2 S4 (armor) | U5 tetap mencengkeram (`Grabbed`, damage 320) menembus kebal dan armor; U5 tidak bisa di-guard tetapi bisa di-parry |
| T-62 | 9.4 | P1…P7 satu per satu | P1 stun ×0,8; P2 energi +25%; P3 hit 3 dan 4 ×1,15; P4 ×1,15 di bawah 25% HP; P5 jendela 14f dan +30; P6 cooldown dash 54f; P7 cooldown Special ×0,8 |
| T-63 | 40 | S2 hit pertama di-parry; S2 diblok | Parry hit 1 membatalkan hit 2; guard dinilai per hit |
| T-64 | 40 | U3 diblok; U3 kena hit pertama | Guard per hit; cinematic mulai setelah hit pertama kena |

**Struktur, match, dan determinisme**

| ID | RL | Setup dan skrip | Harapan |
| --- | --- | --- | --- |
| T-80 | 01, 52 | Unit: `STATE_IDS` | 57 state, semua punya `StateDef`; tidak ada state `Throw`; tiap fighter punya tepat satu state aktif |
| T-81 | 11.7 | Anchor Grade (unit) | Menang 2–0, rata-rata HP 80%, 60 dtk dari 120, combo 4, 2 parry, Normal → 77 → grade A; skor 100 × Gelo 1,2 → dipotong 100 |
| T-82 | 11.3 | Dua ronde seri berturut-turut | Maks 4 ronde; 1–1 setelah ronde 4 = DRAW |
| T-83 | 46 | Energi 60 setelah ronde 1 | Ronde 2: energi tetap 60, HP penuh, cooldown reset |
| T-84 | 11.2 | Ronde berjalan lalu hit-stop 3f | `roundFramesLeft` tidak berkurang selama freeze |
| T-85 | 11.3 | Time Over dengan HP% p1 > p2; HP penuh tanpa hit | p1 menang; PERFECT bila HP penuh |
| T-86 | 3.3 | Skrip 1800 step campuran, dua kali, seed sama | `hash` tiap 60 step identik |
| T-87 | 12.1 | AI 600 step vs skrip ulang | Snapshot identik: AI hanya mengeluarkan `InputFrame` |
| T-88 | 23 | (E2E-3 / unit `GameLoop`) pause saat super freeze | Pause ditunda sampai freeze selesai |

### D.3 Matriks cakupan aturan

Setiap aturan `RL-xx` punya minimal satu test. Bila menambah aturan baru di PRD, tambahkan baris di D.2 dan di sini.

| RL | Test | RL | Test | RL | Test |
| --- | --- | --- | --- | --- | --- |
| RL-01 | T-80 | RL-19 | T-21 | RL-39 | T-61 |
| RL-02 | T-30 | RL-20 | T-24 | RL-40 | T-63, T-64 |
| RL-03 | T-50 | RL-21 | T-27 | RL-41 | T-31 |
| RL-04 | T-40 | RL-22 | T-45 | RL-41a | T-32 |
| RL-05 | T-28 | RL-23 | T-88 | RL-42 | T-33 |
| RL-06 | T-29 | RL-24 | T-46 | RL-43 | T-34 |
| RL-07 | T-04 | RL-30 | T-20, T-23 | RL-44 | T-35 |
| RL-08 | T-41 | RL-31 | T-31 | RL-45 | T-35 |
| RL-09 | T-07, T-09 | RL-32 | T-26, T-59 | RL-46 | T-36, T-83 |
| RL-10 | T-07 | RL-33 | T-29 | RL-47 | T-37 |
| RL-11 | T-10 | RL-34 | T-24 | RL-48 | T-38 |
| RL-12 | T-42 | RL-35 | T-25 | RL-49 | T-39 |
| RL-13 | T-37 | RL-36 | T-27, T-60 | RL-50 | T-49 |
| RL-14 | T-43 | RL-37 | T-47 | RL-51 | T-31 |
| RL-15 | T-02 | RL-38 | T-48 | RL-52 | T-80 |
| RL-16 | T-03 | RL-80 | T-50 | RL-81 | T-51 |
| RL-17 | T-22 | RL-82 | T-27, T-60 | RL-83 | T-60 |
| RL-18 | T-44 | RL-84 | T-55, T-56 | RL-85 | T-52, T-53, T-54 |

---

## Lampiran E: Prompt Siap Pakai

Semua prompt ditulis dalam English (model kode lebih patuh); catatan untuk lu dalam bahasa Indonesia. **Selalu mulai chat dengan Context Block (0.1).** Ganti isi `<...>`.

### E.1 Audit game lama (Fase R)

Salin skrip ini ke folder game lama sebagai `scripts/audit.mjs` lalu jalankan `node scripts/audit.mjs src > audit-report.md` (ganti `src` bila folder kode lu beda). Skrip diuji di Node 24; tidak butuh paket tambahan.

```js
// Audit cepat game lama. Pakai: node scripts/audit.mjs src > audit-report.md
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const root = process.argv[2] ?? 'src';
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'out']);
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

const PATTERNS = {
  'setTimeout / setInterval': /\b(?:setTimeout|setInterval)\s*\(/g,
  'Math.random': /Math\.random\s*\(/g,
  'Date.now / performance.now': /\b(?:Date\.now|performance\.now)\s*\(/g,
  'requestAnimationFrame': /requestAnimationFrame\s*\(/g,
  'deltaTime / dt': /\b(?:deltaTime|dt)\b/g,
  'useState': /\buseState\s*[<(]/g,
  'useEffect': /\buseEffect\s*\(/g,
  'any (": any" / "as any")': /(?::\s*any\b|\bas any\b)/g,
  'event.key (bukan event.code)': /\b(?:event|e|ev)\.key\b/g,
  'flag boolean (isX = true/false)': /\bis[A-Z]\w*\s*=\s*(?:true|false)\b/g,
  'angka 1280 / 720': /\b(?:1280|720)\b/g,
  'localStorage': /\blocalStorage\b/g,
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXT.has(extname(name))) out.push(full);
  }
  return out;
}

const files = walk(root).map((path) => {
  const text = readFileSync(path, 'utf8');
  return { path: relative(process.cwd(), path).replaceAll('\\', '/'), text, lines: text.split('\n').length };
});

console.log(`# Audit otomatis (${files.length} file, ${files.reduce((s, f) => s + f.lines, 0)} baris)\n`);

console.log('## File terbesar (>400 baris = curiga)\n');
console.log('| File | Baris |\n| --- | --- |');
for (const f of [...files].sort((a, b) => b.lines - a.lines).slice(0, 15)) {
  console.log(`| ${f.path} | ${f.lines}${f.lines > 400 ? ' ⚠' : ''} |`);
}

console.log('\n## Pola berisiko\n');
console.log('| Pola | Total | File teratas |\n| --- | --- | --- |');
for (const [label, re] of Object.entries(PATTERNS)) {
  const per = files
    .map((f) => ({ path: f.path, n: (f.text.match(re) ?? []).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  const total = per.reduce((s, x) => s + x.n, 0);
  const top = per.slice(0, 3).map((x) => `${x.path} (${x.n})`).join(', ') || '-';
  console.log(`| ${label} | ${total} | ${top} |`);
}

console.log('\n## Semua file\n');
for (const f of files) console.log(`- ${f.path} (${f.lines})`);
```

Prompt (paste setelah Context Block, lalu `audit-report.md`, daftar "ngaco" 21.4, dan maksimal 3 file kunci: loop game, logika fighter, input):

```
## TASK
Audit my OLD game against the new PRD. Decide what to KEEP, REFACTOR, REWRITE or DROP. Do NOT write game code yet.

## INPUT
1. audit-report.md (below)  2. my problem list (below)  3. up to 3 key files, complete (below)
4. PRD sections: 3.1, 3.2, 6.1, 21.2, 21.3, 21.5 (below)

## OUTPUT (Indonesian explanation, English identifiers)
A. Table: file/module | verdict | reason | PRD section it should follow.
B. The 10 questions of PRD 21.5 scored yes/no with one-line evidence each, the total, and the resulting decision.
C. My listed problems mapped to PRD 21.3 rows with the most likely root cause.
D. Assets, texts, names and screens worth porting (and what to convert first).
E. The 5 biggest risks if I port old code instead of rewriting the core.
If anything is unclear, ask at most 3 questions BEFORE answering.
```

Simpan jawaban sebagai `docs/audit-v1.md`.

### E.2 Scaffold F0

```
## TASK
F0-1: give me the config files for a fresh Next.js 16 + TypeScript project for WIKWAR.
I already ran create-next-app (App Router, TypeScript, ESLint, Tailwind, src/ dir, alias @/*).

## SPEC (PRD)
<paste 3.9 and 3.10 and Lampiran A.1>

## FILES I'M PASTING
package.json, tsconfig.json, eslint.config.mjs (as generated, complete)

## ACCEPTANCE
- [ ] eslint.config.mjs keeps the generated Next config and ADDS the sim-protection block from 3.9
- [ ] tsconfig has strict, noUncheckedIndexedAccess, noImplicitOverride
- [ ] package.json scripts exactly as in A.1; versions pinned (no ^ or ~)
- [ ] vitest.config.mts with the "@" alias; one placeholder test passes
- [ ] a deliberate `Math.random()` inside src/engine/sim/x.ts makes `npm run lint` fail (tell me how to check)

## OUT OF SCOPE
Any game code, CI, assets.
```

### E.3 Modul sim (contoh F1-3)

Pola yang sama dipakai untuk semua tugas F1, F2, F5, F6; ganti isi `TASK`, `SPEC`, `ACCEPTANCE` dengan kolom dari 21.6.

```
## TASK
F1-3: StateMachine + StateDef registry + locomotion states (Idle, WalkForward, WalkBack, CrouchDown, Crouch, StandUp) + auto-facing, with Vitest tests.

## SPEC (PRD)
<paste 6.1, 6.2 (Locomotion table), 6.3, 6.4 rows RL-01 RL-11 RL-15 RL-16, 6.5, 5.3, 7.3 (Gerak)>
<paste Lampiran A.2, A.3, A.4>
Numbers come from src/config/balance.ts (pasted below). Do not invent numbers.

## FILES I'M PASTING
src/types/game.ts, src/config/balance.ts, <other files already in the repo that this module imports>

## ACCEPTANCE
- [ ] src/engine/sim/fighter/StateMachine.ts, Fighter.ts, states/locomotion.ts (each < 400 lines)
- [ ] Tests: T-01, T-02, T-03, T-11, T-12 from Lampiran D.2 (written as Vitest, using harness helpers if they exist, otherwise unit-level)
- [ ] No allocations in per-frame code; exhaustive switch on StateId with assertNever
- [ ] End with: commands to run, expected output, PRD rule numbers implemented, assumptions

## OUT OF SCOPE
Jump, dash, attacks, rendering.
```

### E.4 Test scenario dari katalog

```
## TASK
Implement Vitest scenarios <T-20 … T-26> from Lampiran D.2 using runScenario/tap (Lampiran D.1). If runScenario does not exist yet, write src/engine/sim/testing/harness.ts + fixtures.ts + hash.ts first.

## SPEC
<paste 8.2 incl. "Konvensi frame", 8.3, 8.5; Lampiran D.1 and the D.2 rows>

## ACCEPTANCE
- [ ] Each test name starts with its ID and RL number, e.g. it('T-20 RL-30: ...')
- [ ] Numbers in expectations match the table; if the table looks inconsistent with the PRD, STOP and tell me which row
- [ ] Failing tests print a readable message (state, frame, hp)
```

### E.5 Review silang

```
Review this module against the PRD rules below. Do NOT rewrite it.
List: (1) rule violations with RL/section numbers, (2) off-by-one frame errors (check the frame convention in PRD 8.2),
(3) any use of seconds / Math.random / Date.now / DOM inside src/engine/sim, (4) allocations inside per-frame loops,
(5) missing tests from Lampiran D.2 for the RL rules implemented, (6) places where a number is hard-coded instead of coming from balance.ts.
Rank by severity; for each finding give file:line and a 1-line fix. PRD rules: <paste>. Code: <paste>.
```

### E.6 Ketika AI menyimpang

```
STOP. Re-read the HARD RULES in my Context Block. Tell me which rules your last answer violated (be specific),
then re-issue the COMPLETE corrected files. Do not change any number from the PRD. Do not add dependencies.
```

### E.7 Tuning balance dari hasil simulasi

```
## TASK
Here is the CSV from `npm run simulate` (1000 matches per pair, AI Normal vs AI Normal, sides swapped).
Pairs outside 35-65% must be fixed by changing NUMBERS ONLY in src/config/balance.ts or src/data/templates/*.ts.

## OUTPUT
1. For each failing pair: the most likely cause (which template/stat/frame data) and why.
2. A list of the smallest number changes (old -> new) that should move the win-rate toward 50%, max 3 per pair, each with the expected effect.
3. Which Vitest anchors in balance.test.ts will fail because of those changes, so I can update them on purpose.
Do not change game logic. Do not change a number by more than 15% in one round.
CSV: <paste>   balance.ts: <paste>   templates involved: <paste>
```

### E.8 Skrip aset (F3-1)

```
## TASK
F3-1: write scripts/process-sprites.mjs with sharp following PRD 16.1-16.4.

## SPEC
<paste 16.1, 16.2 (Tier A table), 16.3, 16.4, 19.1 (assets-manifest.json) and Lampiran A.7 spritesSchema>

## ACCEPTANCE
- [ ] Input raw-assets/<id>/*.png (RGBA or magenta #FF00FF background); output public/assets/characters/<id>/*.webp (768x768, quality 90) + sprites.json (must pass spritesSchema)
- [ ] One scale factor per character from the idle height (idle = 600 px); pivot rule exactly as 16.3
- [ ] Warning when a pose differs > 12% from idle; missing Tier A poses reported as a list; idle and portrait required
- [ ] Idempotent: running twice gives identical files; writes assets-manifest.json hashes
- [ ] Node 24, ESM, no dependencies except sharp; short Indonesian comments
```

### E.9 Komponen HUD (F4-5)

```
## TASK
F4-5: build BattleHUD (HealthBar, EnergyGauge, Timer, RoundPips, Nameplate, Portrait, ComboCounter) as React client components reading the battleStore snapshot.

## SPEC
<paste 13.1, 13.2 (layout in --u units), 13.3 (fonts), 13.4, 3.6 and Lampiran A.5 BattleSnapshot>

## ACCEPTANCE
- [ ] Container min(100vw, 190vh) centered; sizes in the --u unit; no fixed px layout
- [ ] Zustand selectors with shallow equality; bar animation by CSS transform/transition (no re-render per frame)
- [ ] Looks correct at 1280x720, 1920x1080, 1024x768 and 3440x1440 (tell me what to check at each)
- [ ] Fonts via next/font/google exactly as 13.3, with the fallbacks
```
