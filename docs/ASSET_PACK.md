# WIKWAR Asset Pack v2.0

*Dokumen pendamping **WIKWAR PRD v2.0** (22 Okt 2026). Dipakai di chat **generator gambar/audio**, bukan di chat kode. Isi: daftar aset lengkap (tiap pose, tiap frame, stage, VFX, audio), aturan dan prompt untuk generator supaya hasil selaras, dan checklist produksi. Kontrak teknis yang membaca aset ini ada di PRD Bagian 6.6 (animasi), 14 (stage), 15 (audio), 16 (pipeline).*

**Cara baca singkat.** Penjelasan dalam bahasa Indonesia; **prompt dalam English** (generator biasanya lebih stabil dengan English). Bagian yang harus lu isi sendiri ditandai `(isi)`. Bagian 3 (Character Sheet) wajib diisi sebelum membuat pose apa pun.

**Daftar isi**

- [1. Ringkasan dan Alur Kerja](#1-ringkasan-dan-alur-kerja): jumlah aset, alur kerja, urutan produksi P0 sampai P4
- [2. Aturan Master untuk Generator (Style Bible, Setup, Template)](#2-aturan-master-untuk-generator-style-bible-setup-template): aturan gaya, prompt setup, template pose
- [3. Character Sheet](#3-character-sheet): Character Sheet (isi dulu)
- [4. Pose Karakter Tier A (32 pose, wajib untuk muncul di roster)](#4-pose-karakter-tier-a-32-pose-wajib-untuk-muncul-di-roster): 32 pose per karakter
- [5. Frame Tambahan Karakter Tier B (62 frame, opsional dan bertahap)](#5-frame-tambahan-karakter-tier-b-62-frame-opsional-dan-bertahap): 62 frame halus (opsional)
- [6. Stage (Latar Pertandingan)](#6-stage-latar-pertandingan): prompt stage dan tes lantai
- [7. VFX Global (3 gambar)](#7-vfx-global-3-gambar): 3 efek global
- [8. Aset Boss (3 guru)](#8-aset-boss-3-guru): boss
- [9. Audio](#9-audio): musik, SFX, announcer
- [10. QA dan Perbaikan Hasil](#10-qa-dan-perbaikan-hasil): checklist dan perbaikan hasil

---

## 1. Ringkasan dan Alur Kerja

### 1.1 Apa saja yang perlu dibuat

| Kelompok | Jumlah | Wajib untuk | Bagian |
| --- | --- | --- | --- |
| Karakter **Tier A** (32 pose) | 160 (5 karakter) | Karakter muncul di game dan bisa main penuh | 4 |
| Karakter **Tier B** (+62 frame) | +310 (5 karakter) | Gerakan halus (opsional, bertahap) | 5 |
| Stage (4 layer × 4 stage) | 16 (minimum 8) | Latar pertandingan | 6 |
| VFX global | 3 | Proyektil, ledakan, tulang X-Ray | 7 |
| Boss (3 guru) | 42 minimum (3 × 14) | Mode Arcade | 8 |
| Musik (16 trek), TTS announcer (23 file), SFX (opsional, ada fallback sintesis) | – | Suasana | 9 |
| **Paket paling kecil agar engine jalan dengan karakter nyata** | **17** | `idle`, `portrait`, `splash` × 5 karakter + `far` dan `floor` Lapangan Wikrama | 1.3 |

Yang **tidak perlu** dibuat di generator (digambar kode): HUD, logo, ikon, spark, debu, ring, bintang dizzy, glow aura, bayangan lantai, garis kecepatan, efek Special/Ultimate selain tiga gambar di Bagian 7, damage number, banner, thumbnail stage.

### 1.2 Alur kerja per karakter (anti-drift)

1. Isi **Character Sheet** (Bagian 3).
2. Buat pose `idle` sampai wajah, rambut, dan outfit sudah pas. Ini **master reference** karakter.
3. Satu thread chat generator per karakter. Untuk **setiap** pose berikutnya, lampirkan master reference + `attack.png` (referensi gaya) dan pakai template 2.3.
4. Generate 2–4 variasi per pose; pilih yang paling konsisten; cek dengan checklist 10.1.
5. Simpan sebagai `raw-assets/<id>/<pose>.png` (nama persis seperti kolom "File" di Bagian 4 dan 5).
6. Jalankan `npm run assets` (PRD 16.3). Peringatan "ukuran menyimpang > 12% dari idle" berarti pose perlu digenerate ulang atau dikoreksi di sprite aligner (`/dev/aligner`).

Perkiraan waktu: 5–10 menit per gambar termasuk variasi, jadi Tier A ≈ 3–5 jam per karakter. Kerjakan berdasarkan prioritas 1.3, jangan sekaligus.

### 1.3 Urutan produksi (prioritas)

| Tahap | Isi | Gambar | Membuka apa di game |
| --- | --- | --- | --- |
| **P0** (sebelum F3) | Ridho: `idle`, `portrait`, `splash` + karakter kedua: `idle`, `portrait`, `splash` + `far` dan `floor` Lapangan | 8 | Engine bisa menggambar karakter dan stage; Training berjalan dengan fallback untuk pose lain |
| **P1** (sebelum F4) | Dua karakter pertama: `walk_a`, `walk_b`, `crouch`, `jump_up`, `jump_fall`, `dash_f`, `dash_b`, 4 normal, `guard`, `hit_high`, `knockdown_fly`, `down`, `getup` | 2 × 16 = 32 | Gerak dan pertarungan dasar terlihat benar |
| **P2** (sebelum F5) | Dua karakter pertama: `crouch_punch`, `crouch_sweep`, `crouch_uppercut`, `air_punch`, `air_kick`, `guard_crouch`, `hit_low`, `dizzy`, `special`, `ultimate`, `xray`, `intro`, `win` + VFX global | 2 × 13 + 3 = 29 | Semua aksi punya gambar sendiri |
| **P3** (sebelum F7) | 3 karakter lain Tier A penuh, 3 stage lagi (+ `mid`, `near` untuk Lapangan), pose minimum 3 boss | 96 + 14 + 42 | Roster penuh, Arcade |
| **P4** (F8) | Tier B (urutan di 5.1), BGM, TTS | – | Polish |

---

## 2. Aturan Master untuk Generator (Style Bible, Setup, Template)

### 2.1 Style Bible (dari `attack.png`, tidak berubah)

- **Gaya:** chibi anime 2D, kepala besar (± 40% tinggi badan), badan pendek, tangan dan kaki cukup besar supaya pose mudah dibaca.
- **Garis dan warna:** outline hitam tebal, bersih, konsisten di semua pose; shading cel lembut dengan sedikit tekstur kain; palet agak desaturasi dengan hitam pekat. **Tanpa neon** dan tanpa glow besar di sprite: glow, aura, dan VFX ditambahkan engine.
- **Wajah:** mata besar dengan highlight, alis tegas, blush pipi, ekspresi sesuai pose.
- **Komposisi:** satu karakter, full body, **menghadap kanan** (badan ke kanan, wajah 3/4 ke viewer), kaki menapak (kecuali pose melayang), kanvas persegi 1:1, latar transparan, **tanpa bayangan lantai, tanpa garis gerak (motion lines), tanpa teks, tanpa efek**.
- **Skala:** pose berdiri mengisi ± 85% tinggi kanvas, terpusat horizontal, dengan ruang di sekitar tangan/kaki yang terentang agar tidak terpotong. **Ukuran kepala sama di semua pose** (ini yang diperiksa warning 12%).

### 2.2 Prompt setup (paste SEKALI di awal tiap thread generator)

```
You are generating 2D game sprites for a fighting game. Follow these rules for EVERY image in this chat:
- Style: chibi anime, thick clean black outlines, soft cel shading, slightly desaturated palette, big head (about 40% of body height), short body, large hands and feet.
- One single character per image, full body, facing RIGHT (body toward the right, face in three-quarter view toward the viewer).
- Square 1:1 canvas. Transparent background. NO floor shadow, NO motion lines, NO speed lines, NO glow or energy effects, NO text, NO watermark, NO extra characters, NO props unless I ask.
- Keep the character EXACTLY consistent with the reference image: same face, hair, outfit, colors, outline thickness, head size and body proportions in every pose.
- Keep the head the same size as in the idle reference. Never zoom in or out between poses. Standing poses fill about 85% of the canvas height.
- Do not crop: hands, feet, and any extended limb must stay fully inside the canvas with a small margin.
- When I give a POSE, change ONLY the pose and expression. Do not change outfit, hairstyle, face, or proportions.
If a transparent background is not possible, use a solid pure magenta #FF00FF background and do not use magenta anywhere in the character.
```

### 2.3 Template prompt per pose

```
Use the attached character image as the exact reference (same face, hair, outfit, proportions) and attack.png as the art style reference.
Chibi anime 2D game sprite, thick clean black outlines, soft cel shading, big head, short body.
Full body, single character, body facing right, face in three-quarter view, character centered horizontally, square 1:1 canvas, transparent background, no floor shadow, no motion lines, no effects, no text.
SCALE: {SCALE_RULE}
POSE: {POSE_BLOCK}
EXPRESSION: {EXPRESSION}
AURA ACCENT: {AURA_COLOR}, only a very subtle rim or glow on hands or eyes if the pose needs it.
Do not change the outfit, hairstyle, face, or proportions.
```

Nilai `{SCALE_RULE}` ditentukan Bagian 4 (kolom "Skala"): `standing` = "character fills about 85% of the canvas height, same head size as the idle reference"; `crouch` = "same head size as the idle reference, body height about 60% of the idle height, feet at the bottom of the canvas"; `air` = "same head size as the idle reference, character floating in the middle of the canvas"; `wide` = "same head size as the idle reference, body fills about 85% of the canvas WIDTH, lowest body point at the bottom of the canvas"; `portrait`/`splash` = ditulis di pose-nya.

**Jika generator tidak bisa transparan:** tambahkan "solid pure magenta #FF00FF background". `process-sprites` menghapusnya.

### 2.4 Aturan skala, arah, dan titik pijak (kenapa penting)

- Engine menyamakan skala **satu karakter** dari tinggi `idle` (idle = 600 px pada kanvas 768). Pose yang kepalanya lebih besar akan tampak "membesar" saat diganti; karena itu **ukuran kepala harus sama**, bukan tinggi total.
- **Titik pijak otomatis** = titik paling bawah tubuh pada pose itu (telapak kaki untuk pose berdiri; titik terendah tubuh untuk pose melayang/berbaring). Jangan menaruh bayangan atau lantai di gambar; engine menggambar bayangan kontak sendiri.
- **Menghadap kanan** selalu; engine memantulkan gambar saat karakter menghadap kiri. Karena itu jangan menaruh teks, logo, atau benda asimetris yang bergantung pada sisi (mis. tulisan di baju).
- **Pose jongkok dan berbaring** dibuat dengan kepala yang sama besar; jangan diperbesar supaya "memenuhi kanvas".

---

## 3. Character Sheet

Isi sheet **sebelum** membuat pose apa pun. Sheet ini dipakai tiga kali: sebagai "Character Lock" di prompt (3.4), sebagai field `visual` di `roster.json`, dan sebagai acuan cek konsistensi (10.1).

### 3.1 Supaya tiap karakter terasa beda

- Minimal **dua elemen siluet unik** (gaya rambut, tinggi atau bentuk badan, aksesori, bentuk outfit). Siluet harus terbaca bila gambar dihitamkan.
- Warna dominan outfit **berbeda antar karakter** dan tidak bentrok dengan warna aura (aura hanya aksen kecil).
- Kuda-kuda sesuai gaya bertarung (4.5): rushdown condong ke depan, tank berdiri lebar dan kokoh, counter santai dan waspada, zoner menjaga jarak dengan telapak terbuka.
- Hindari tulisan, logo, dan benda asimetris di outfit (gambar dipantulkan saat menghadap kiri).

### 3.2 Ridho (sudah ada dari `attack.png`)

| Field | Isi |
| --- | --- |
| Nama, kelas | Ridho, RPL XII-4 |
| Aura | Orange `#FF6A00` |
| Role dan skill | Balanced · S1 Energy Bolt (Hello World), U1 Lunge Beam (Deploy to Production), P2 Quick Charge |
| Rambut dan wajah | Buzz cut hitam, alis tegas, mata besar abu-gelap dengan highlight, blush pipi, titik hitam kecil di sudut luar mata |
| Outfit | Blazer double-breasted abu-abu motif glen check berkerah hitam, kemeja putih, dasi hitam, celana panjang hitam lebar, sepatu hitam mengkilap |
| Ekspresi default | Serius, fokus |
| **Character Lock** | `buzz-cut black hair, strong eyebrows, big dark-grey eyes with highlights, blush on cheeks, small black dots near the outer corners of the eyes, grey glen-check double-breasted blazer with black lapels, white shirt, black tie, wide black trousers, glossy black shoes` |

Pastikan karakter di `attack.png` memang Ridho; bila bukan, tukar slot dan aura di `roster.json`.

### 3.3 Steven, Fadhiil, Berliana, Sahra (isi sendiri)

| Field | Steven | Fadhiil | Berliana | Sahra |
| --- | --- | --- | --- | --- |
| Aura | Merah `#FF3B3B` | Biru `#2F8CFF` | Hijau `#22D36B` | Ungu `#A855F7` |
| Role dan skill | Rushdown · S4 Hot Reload, U3 Infinite Loop, P6 Evasive | Zoner · S8 Triple Commit, U2 DDoS Storm, P7 Sharp Special | Tank · S3 Firewall Uppercut, U4 Kernel Panic, P1 Iron Skin | Counter · S6 Try / Catch, U5 Segmentation Fault, P5 Parry Master |
| Nickname | (isi bila ada) | (isi bila ada) | (isi bila ada) | (isi bila ada) |
| Rambut dan wajah | (isi) | (isi) | (isi) | (isi) |
| Outfit | (isi) | (isi) | (isi) | (isi) |
| Aksesori / ciri khas (≥ 2 elemen siluet) | (isi) | (isi) | (isi) | (isi) |
| Ekspresi default | (isi) | (isi) | (isi) | (isi) |
| **Character Lock** (1–2 kalimat English dari field di atas) | (isi) | (isi) | (isi) | (isi) |

Kuda-kuda `idle` per role ada di 4.5. Pemetaan nama ke slot mengikuti urutan input dan bisa ditukar.

### 3.4 Field `visual` untuk `roster.json`

Salin **Character Lock** ke field `visual` (PRD 10.1). Engine tidak memakainya; ia ada supaya deskripsi karakter selalu tersimpan bersama datanya.

### 3.5 Prompt pembuka: master reference (`idle`)

Paste prompt setup 2.2 lebih dulu, lalu:

```
Create the MASTER REFERENCE image of this character for a fighting game.
Character: {CHARACTER_LOCK}
Chibi anime 2D game sprite, thick clean black outlines, soft cel shading, big head, short body.
Full body, single character, body facing right, face in three-quarter view, feet on the ground, character fills about 85% of the canvas height, centered horizontally.
Square 1:1 canvas, transparent background, no floor shadow, no motion lines, no effects, no text.
POSE: {STANCE_FOR_ROLE} (see role stance below)
EXPRESSION: {DEFAULT_EXPRESSION}
AURA ACCENT: {AURA_COLOR}, only a very subtle rim light on the fists.
Generate 4 variations that differ only in facial detail and shading.
```

Pilih satu yang paling disukai; ini master reference. Lampirkan gambar itu (dan `attack.png`) di semua prompt berikutnya.

### 3.6 Opsional: turnaround untuk mengunci desain

Bila wajah atau outfit sering berubah antar pose, buat satu gambar acuan tambahan sebelum melanjutkan:

```
Character turnaround sheet of the same character on a plain transparent background: front view, three-quarter view, side view, back view, all in the same neutral standing pose, same scale, evenly spaced in one row. Same chibi anime style as the reference.
```

Lampirkan juga gambar ini bila AI mulai melenceng.

---

## 4. Pose Karakter Tier A (32 pose, wajib untuk muncul di roster)

Nama file = `<pose>.png` di `raw-assets/<id>/`. Pose yang kurang tidak membuat game crash (fallback PRD 6.6), tetapi hasilnya memakai gambar pengganti.

### 4.1 Daftar pose dan prompt block

Tiap baris dipakai untuk mengisi `{POSE_BLOCK}`, `{SCALE_RULE}`, dan `{EXPRESSION}` di template 2.3. **Skala:** `S` = standing (85% tinggi), `C` = crouch (tinggi badan ≈ 60% idle), `A` = air (mengambang di tengah), `W` = wide (85% lebar). Untuk semua skala: **ukuran kepala sama dengan idle**.

**Gerak dan UI**

| File | Dipakai oleh | Skala | POSE_BLOCK | EXPRESSION |
| --- | --- | --- | --- | --- |
| `idle` | Idle, Intro (fallback), dasar semua fallback | S | relaxed fighting stance, knees slightly bent, feet shoulder-width apart, both fists raised near the chest, weight balanced (+ stance role 4.5) | serious, focused |
| `walk_a` | WalkForward/WalkBack (langkah 1) | S | walking step: left foot forward, right foot back, fists still guarding near the chest, torso leaning slightly forward | serious |
| `walk_b` | Langkah 2 | S | the mirrored walking step: right foot forward, left foot back, same upper body as walk_a | serious |
| `crouch` | CrouchDown, Crouch, PreJump, Land, DiveLand | C | crouching low, knees deeply bent, fists up guarding the face, weight on the balls of the feet | alert |
| `jump_up` | JumpRise | A | rising jump, both knees tucked up, one fist raised, body slightly stretched upward | determined |
| `jump_fall` | JumpFall | A | falling in the air, legs extended downward and slightly apart, arms raised for balance, hair and clothes pointing upward | alert |
| `dash_f` | DashForward, AirDashForward | S | dashing forward, body leaning about 30 degrees forward, one leg pushed far back, arms swept back, no motion lines | determined |
| `dash_b` | DashBack, AirDashBack | S | dashing backward, body leaning back about 20 degrees, one foot lifted off the ground, forearms raised in a guard, eyes locked forward | alert |
| `portrait` | Select, HUD, panel | bust | head-and-chest portrait, bust shot, three-quarter view facing right, head and shoulders filling the frame | confident |
| `splash` | VS Intro, cut-in Ultimate, panel pilih | free | dynamic full-body splash art: dramatic low-angle three-quarter view, mid-action fighting pose that suggests the character's signature move (no energy effects), strong diagonal composition, character fills about 90% of the canvas | fierce, confident |

**Serangan normal (empat tombol)**

| File | Dipakai oleh | Skala | POSE_BLOCK | EXPRESSION |
| --- | --- | --- | --- | --- |
| `n1_jab` | N1 Jab (tombol J, pukulan kanan) | S | fast right straight punch: right arm fully extended forward at head height, left fist guarding the chin, shoulders rotated, front foot planted | focused |
| `n2_hook` | N2 Hook (K, pukulan kiri) | S | left hook: left arm bent about 90 degrees and swinging forward horizontally at chest height, torso twisted, right fist guarding | gritted teeth |
| `n3_lowkick` | N3 Low Kick (L, tendangan kiri) | S | left low kick: left leg extended forward low at ankle-to-shin height, body leaning slightly back for balance, fists guarding | focused |
| `n4_roundhouse` | N4 Roundhouse (;, tendangan kanan, finisher) | S | powerful right roundhouse kick: right leg fully extended horizontally forward at chest-to-head height, full-body rotation, arms flung out for balance | fierce, shouting |

**Serangan jongkok dan udara**

| File | Dipakai oleh | Skala | POSE_BLOCK | EXPRESSION |
| --- | --- | --- | --- | --- |
| `crouch_punch` | C1, C2 | C | crouching low, one fist jabbing forward at waist height, other fist guarding, same crouch height as the crouch reference | focused |
| `crouch_sweep` | C3 | C | low sweeping kick: sitting very low, one leg extended straight forward along the ground at floor level, one hand touching the ground for support | fierce |
| `crouch_uppercut` | C4 | S | rising uppercut from a crouch: one fist driving straight upward, body beginning to lift off the ground, other arm pulled back, looking up at the fist | shouting |
| `air_punch` | A1, A2 | A | jumping punch: knees tucked, one fist thrust forward and slightly downward, other arm pulled back | determined |
| `air_kick` | A3, A4 (dibuat miring 35° oleh engine), DiveLand | A | jumping kick: one leg extended forward and diagonally downward, other knee tucked, arms out for balance | fierce |

**Bertahan dan reaksi**

| File | Dipakai oleh | Skala | POSE_BLOCK | EXPRESSION |
| --- | --- | --- | --- | --- |
| `guard` | Parry, Guard, Blockstun, GuardRelease | S | defensive block: both forearms crossed in front of the face and chest, knees bent, body slightly crouched | eyes narrowed, tense |
| `guard_crouch` | GuardCrouch, BlockstunCrouch | C | crouching block: both forearms crossed in front of the face, very low stance | eyes narrowed |
| `hit_high` | HitstunLight/Heavy, ParryStunned, UltParried, KO fallback | S | hit reaction to the head: head snapped back, torso leaning backward, one arm flailing, eyes squeezed shut, mouth open in pain | pain |
| `hit_low` | HitstunCrouch | S | hit reaction to the stomach: body doubled over forward, both hands near the belly, one knee buckling, eyes squeezed shut | pain |
| `knockdown_fly` | KnockdownFly, KOFly | A | blown backward through the air: body nearly horizontal and tilted, arms and legs flailing, shocked face | shock |
| `down` | Down, KODown | W | lying flat on the back on the ground, limbs spread, dizzy swirling eyes, mouth slightly open, defeated | dazed |
| `getup` | GetUp | C | getting up from the ground: one knee on the ground, one hand pushing off the floor, head raised, gritting teeth | determined |
| `dizzy` | Dizzy | S | standing slumped, knees wobbling, head tilted to the side, swirling spiral eyes, tongue slightly out, arms hanging loose | dazed |

**Skill, sinematik, dan pertandingan**

| File | Dipakai oleh | Skala | POSE_BLOCK | EXPRESSION |
| --- | --- | --- | --- | --- |
| `special` | Special, SpecialEX | S | **sesuai template Special karakter, lihat 4.2** | – |
| `ultimate` | UltFreeze, UltStartup, UltActive, UltRecovery, GrabHold | S/A | **sesuai template Ultimate karakter, lihat 4.3** | – |
| `xray` | XRayHit, Grabbed (pose korban Ultimate dan EX) | S | heavily struck: body arched backward dramatically, arms thrown out, eyes wide, mouth open in shock, strong readable silhouette. Do NOT draw bones, skeleton, or lightning (the engine adds the X-Ray overlay) | shock |
| `intro` | Intro (sebelum FIGHT!) | S | dramatic ready pose before the fight: one fist clenched in front of the chest, the other hand beckoning or adjusting a sleeve, wide stance | confident smirk |
| `win` | Win | S | victory pose: one fist pumped upward, other hand on the hip, big confident smile | big smile |

Catatan penting:

- `knockdown_fly`, `down`, `xray`, dan `ultimate` sering menghasilkan ukuran kepala yang melenceng; periksa dengan hati-hati di warning 12%.
- `hit_high` dan `hit_low` harus **mudah dibedakan siluetnya** (kepala terlempar ke belakang vs badan membungkuk): pemain membaca serangan tinggi/rendah dari reaksi ini.
- `air_kick` harus **jelas mengarah ke depan-bawah** karena dipakai sebagai Dive Kick.

### 4.2 Pose `special` per template Special

| Template | Karakter | POSE_BLOCK |
| --- | --- | --- |
| S1 Energy Bolt | Ridho | both palms thrust forward together at chest height as if channeling energy, feet planted wide, determined shout |
| S2 Wave Burst | – | both palms pushed forward together, wide low stance, whole body braced as if releasing a big blast |
| S3 Rising Strike | Berliana | uppercut: one fist driving upward, body rising off the ground, other arm pulled back, looking up |
| S4 Charge Rush | Steven | low lunging sprint, shoulder forward, fists pulled back, very aggressive forward lean |
| S5 Ground Shock | – | crouching, one fist slamming into the ground, other arm pulled back |
| S6 Counter Stance | Sahra | arms crossed or one hand beckoning "come at me", relaxed but alert, slight smirk |
| S7 Shadow Step | – | crouched very low, one hand touching the ground, looking back over the shoulder as if about to vanish |
| S8 Triple Shot | Fadhiil | one arm extended forward with fingers pointing like a gun, other hand supporting the wrist |

### 4.3 Pose `ultimate` per template Ultimate

| Template | Karakter | Skala | POSE_BLOCK |
| --- | --- | --- | --- |
| U1 Lunge Beam | Ridho | S | deep lunge forward, both palms thrust ahead charging a huge beam, intense shout |
| U2 Lightning Storm | Fadhiil | S | both arms raised to the sky, head tilted back, shouting, power gathering overhead |
| U3 Rush Barrage | Steven | A | mid-air flurry of punches: one fist forward and another coming, ferocious face |
| U4 Shockwave Slam | Berliana | A | jumping high with both fists clasped overhead, about to slam down |
| U5 Reversal Grab | Sahra | S | lunging forward with both arms open wide to grab, intense predatory look |

### 4.4 Prompt `portrait` dan `splash` (kasus khusus)

`portrait` (kanvas 1:1; di-crop jadi bust 512×512 dan thumbnail 256×256):

```
{template 2.3 with} POSE: head-and-chest portrait, bust shot, three-quarter view facing right, head and shoulders filling the frame.
SCALE: bust portrait, the face fills about 60% of the canvas height. EXPRESSION: confident.
```

`splash` (ilustrasi, boleh lebih sinematik; dipakai di VS Intro dan cut-in Ultimate):

```
{template 2.3 with} Dynamic full-body splash illustration of the same character, dramatic low-angle three-quarter view, mid-action pose that hints at their signature move (no energy effects, no motion lines), strong diagonal composition, the character fills about 90% of the canvas, transparent background. EXPRESSION: fierce, confident.
```

### 4.5 Kuda-kuda `idle` per role (tambahkan ke POSE_BLOCK `idle`, `walk_a`, `walk_b`)

| Role | STANCE_FOR_ROLE |
| --- | --- |
| Balanced | neutral orthodox stance, fists at the chest |
| Rushdown | weight forward, front knee bent, torso leaning slightly toward the opponent, fists low and ready, on the balls of the feet |
| Zoner | upright and relaxed, one open palm held out in front, the other hand near the hip, slightly longer distance between feet |
| Tank | very wide and stable stance, shoulders squared, fists held high and heavy, planted like a wall |
| Counter | loose and relaxed stance, arms low and open, head slightly tilted, slight smirk |

### 4.6 Checklist produksi per karakter (salin satu per karakter)

```
[ ] master reference (idle) dipilih          [ ] Character Lock tersalin ke roster.json (visual)
P0: [ ] idle [ ] portrait [ ] splash
P1: [ ] walk_a [ ] walk_b [ ] crouch [ ] jump_up [ ] jump_fall [ ] dash_f [ ] dash_b
    [ ] n1_jab [ ] n2_hook [ ] n3_lowkick [ ] n4_roundhouse [ ] guard [ ] hit_high [ ] knockdown_fly [ ] down [ ] getup
P2: [ ] crouch_punch [ ] crouch_sweep [ ] crouch_uppercut [ ] air_punch [ ] air_kick [ ] guard_crouch [ ] hit_low
    [ ] dizzy [ ] special [ ] ultimate [ ] xray [ ] intro [ ] win
Cek: [ ] process-sprites tanpa warning 12% [ ] sprite aligner dicek untuk pose melayang/berbaring
```

---

## 5. Frame Tambahan Karakter Tier B (62 frame, opsional dan bertahap)

Tier B membuat gerakan lebih halus; engine memakainya lewat `animations.json` (PRD 6.6 dan 16.4). Tanpa Tier B, game tetap jalan memakai 32 pose Tier A. **Kerjakan hanya setelah Tier A semua karakter selesai dan game sudah bisa dimainkan (tahap P4).**

### 5.1 Urutan produksi (kerjakan dari atas, berhenti kapan saja)

| Prioritas | Kelompok | File | Jumlah | Efek yang terasa |
| --- | --- | --- | --- | --- |
| 1 | Jalan | `walk_1`…`walk_6` | 6 | Gerak paling sering terlihat |
| 2 | Normal darat | `n1`–`n3` `_windup`/`_recover`, `n4_windup`, `n4_swing`, `n4_recover` | 9 | Serangan tidak lagi "teleport" |
| 3 | Napas idle | `idle_2`, `idle_3`, `idle_4` | 3 | Karakter terasa hidup |
| 4 | Reaksi dan bertahan | `guard_start`, `hit_high_2`, `hit_low_2`, `knockdown_fly_2`, `knockdown_fly_3`, `getup_1`, `getup_3`, `getup_4`, `dizzy_2`, `dizzy_3` | 10 | Hit terasa berat |
| 5 | Lompat, jongkok, dash | `crouch_down`, `stand_up`, `prejump`, `jump_apex`, `land`, `dash_f_1`…`3`, `dash_b_1`…`3` | 11 | Transisi halus |
| 6 | Jongkok dan udara | 6 `crouch_*` + 5 `air_*` (daftar di 5.3) | 11 | Semua normal punya windup |
| 7 | Skill | `special_windup`, `special_end`, `ultimate_charge`, `ultimate_windup`, `ultimate_end`, `xray_2` | 6 | Skill terasa sinematik |
| 8 | Intro dan menang | `win_2`…`win_4`, `intro_2`…`intro_4` | 6 | Polish akhir |
| | **Total** | | **62** | |

### 5.2 Cara membuatnya (kunci agar tidak melenceng)

Frame Tier B adalah **antara** dua pose Tier A, jadi buat dari pose terdekat, bukan dari nol:

1. Lampirkan **master reference (`idle`)** dan **pose Tier A terdekat** (kolom "Acuan" di 5.3).
2. Pakai template 2.3 dengan `{SCALE_RULE}` yang sama dengan pose acuannya, lalu tambahkan baris ini di bawah POSE:

```
This is an IN-BETWEEN frame for an animation. Keep exactly the same head size, outfit, proportions, outline and camera as the attached pose "{ACUAN}". Only change the limbs and body angle as described. The change from the attached pose should be clear but not extreme.
```

3. Skala, kepala, dan arah hadap **harus sama** dengan acuan. Warning 12% tetap berlaku.
4. Setelah semua frame satu aksi selesai, minta AI coding menyusun `animations.json` (PRD 16.4); jumlah frame di timeline harus sama dengan total durasi state, dan `validate-data` memeriksanya.

### 5.3 Daftar frame (nama file, acuan, gambaran gerakan)

Skala: `S` standing, `C` crouch, `A` air, `W` wide (sama seperti 4.1). Ekspresi mengikuti acuan kecuali ditulis lain.

**Napas idle dan jalan** (loop: `idle` → `idle_2` → `idle_3` → `idle_4` → `idle_3` → `idle_2`; perbedaan antar frame **sangat kecil**, 1–2% tinggi badan)

| File | Skala | Acuan | POSE_BLOCK |
| --- | --- | --- | --- |
| `idle_2` | S | `idle` | inhaling: shoulders and fists rise slightly, knees slightly less bent |
| `idle_3` | S | `idle` | top of the breath: body at its highest, fists a little higher than idle, chest slightly out |
| `idle_4` | S | `idle` | exhaling: shoulders and fists lower slightly, knees slightly more bent, body at its lowest |
| `walk_1` | S | `walk_a` | contact: front heel just touching the ground, back foot on its toes, fists guarding steady |
| `walk_2` | S | `walk_a` | down: weight onto the front foot, front knee bent, body at its lowest, back heel lifting |
| `walk_3` | S | `idle` | passing: back leg swinging under the body, standing leg nearly straight, body at its highest |
| `walk_4` | S | `walk_b` | contact on the other side (mirror of walk_1 with the other foot forward) |
| `walk_5` | S | `walk_b` | down on the other side (mirror of walk_2) |
| `walk_6` | S | `idle` | passing on the other side (mirror of walk_3) |

Jalan mundur memutar urutan `walk_6` → `walk_1`; tidak perlu gambar baru.

**Jongkok, lompat, dan dash**

| File | Skala | Acuan | POSE_BLOCK |
| --- | --- | --- | --- |
| `crouch_down` | C | `crouch` | halfway between idle and crouch: knees half bent, body lowering, fists up |
| `stand_up` | S | `crouch` | rising from the crouch: knees half bent, torso leaning slightly forward, fists lowering to the guard position |
| `prejump` | C | `crouch` | squash before the jump: deep crouch, arms swung back, torso leaning forward, knees heavily bent |
| `jump_apex` | A | `jump_up` | top of the jump: knees tucked, arms slightly out, hair and clothes floating, body at the peak |
| `land` | C | `crouch` | landing impact: knees bent, arms out for balance, body compressed to about 70% of idle height |
| `dash_f_1` | S | `dash_f` | dash start: weight dropping and leaning forward about 15 degrees, pushing off the back foot |
| `dash_f_2` | S | `dash_f` | dash at full speed: leaning about 30 degrees, legs wide apart, arms swept back |
| `dash_f_3` | S | `dash_f` | dash stop: leaning about 10 degrees, one foot sliding forward, arms returning to guard |
| `dash_b_1` | S | `dash_b` | backward dash start: pushing off the front foot, leaning back about 10 degrees, forearms rising |
| `dash_b_2` | S | `dash_b` | backward dash at full speed: leaning back about 20 degrees, one foot lifted, guarding |
| `dash_b_3` | S | `dash_b` | backward dash landing: knees bent absorbing the stop, guard up |

**Serangan normal darat**

| File | Skala | Acuan | POSE_BLOCK |
| --- | --- | --- | --- |
| `n1_windup` | S | `n1_jab` | jab wind-up: right fist pulled back to the hip, left fist guarding, shoulders rotated back |
| `n1_recover` | S | `n1_jab` | jab recovery: right arm retracting from extended to half bent, returning to guard |
| `n2_windup` | S | `n2_hook` | hook wind-up: left arm cocked back and out to the side, torso wound back, right fist guarding |
| `n2_recover` | S | `n2_hook` | hook recovery: left arm swinging back across the body, torso untwisting |
| `n3_windup` | S | `n3_lowkick` | low kick wind-up: left knee lifted to the waist with the lower leg folded, torso leaning slightly back |
| `n3_recover` | S | `n3_lowkick` | low kick recovery: left leg lowering, foot just above the ground in front, returning to the stance |
| `n4_windup` | S | `n4_roundhouse` | roundhouse wind-up: right knee raised high to the chest, standing leg bent, arms drawn back |
| `n4_swing` | S | `n4_roundhouse` | roundhouse mid-swing: right leg sweeping up-and-forward at about 45 degrees, torso rotating |
| `n4_recover` | S | `n4_roundhouse` | roundhouse recovery: leg dropping after the kick, body rotated past the target, arms out for balance |

**Serangan jongkok dan udara**

| File | Skala | Acuan | POSE_BLOCK |
| --- | --- | --- | --- |
| `crouch_punch_windup` | C | `crouch_punch` | crouching, one fist pulled back at the waist, other fist guarding |
| `crouch_punch_recover` | C | `crouch_punch` | crouching, fist retracting from the jab, returning to the crouch guard |
| `crouch_sweep_windup` | C | `crouch_sweep` | sitting low, one leg folded under the body, torso twisted, one hand on the ground |
| `crouch_sweep_recover` | C | `crouch_sweep` | the swept leg pulling back, body rising slightly back to the crouch |
| `crouch_uppercut_windup` | C | `crouch_uppercut` | deep crouch, one fist pulled down by the hip and coiled, eyes looking up |
| `crouch_uppercut_peak` | A | `crouch_uppercut` | apex of the uppercut: body stretched upward with both feet just off the ground, fist straight up, head tilted back |
| `air_punch_windup` | A | `air_punch` | in the air, knees tucked, one fist pulled back |
| `air_punch_recover` | A | `air_punch` | in the air, arm retracting, legs lowering into a falling pose |
| `air_kick_windup` | A | `air_kick` | in the air, one knee pulled up to the chest, other leg tucked, arms out |
| `air_kick_recover` | A | `air_kick` | in the air, kicking leg retracting, both legs coming back down |
| `air_dive` | A | `air_kick` | dive kick: body angled steeply diagonal (about 45 degrees) toward the ground in front, one leg extended straight along the diagonal, other leg tucked, arms back |

**Bertahan dan reaksi**

| File | Skala | Acuan | POSE_BLOCK |
| --- | --- | --- | --- |
| `guard_start` | S | `guard` | raising the block: forearms halfway between the fighting stance and the crossed guard, slight flinch |
| `hit_high_2` | S | `hit_high` | recovering from a head hit: head returning forward, body leaning back less, one eye half open, wobbling |
| `hit_low_2` | S | `hit_low` | recovering from a stomach hit: body straightening up, hands slipping off the belly, wincing |
| `knockdown_fly_2` | A | `knockdown_fly` | just after being launched: leaning back about 40 degrees, feet barely leaving the ground, arms thrown out |
| `knockdown_fly_3` | A | `knockdown_fly` | falling: body tilted with the head lower than the feet at about 30 degrees, about to land on the back |
| `getup_1` | W | `down` | sitting up from lying: back off the ground, one hand pushing off the floor, head lifting |
| `getup_3` | C | `getup` | rising: crouching low with both hands off the ground, one foot flat on the floor |
| `getup_4` | S | `idle` | almost standing: guard raised, knees still slightly bent, determined look |
| `dizzy_2` | S | `dizzy` | swaying backward (away from the opponent): head tilted back, knees wobbling, arms hanging |
| `dizzy_3` | S | `dizzy` | swaying forward: head drooping forward, knees wobbling, arms hanging |

Urutan di `animations.json` untuk knockdown: `knockdown_fly_2` → `knockdown_fly` → `knockdown_fly_3` → `down`. Untuk bangun: `down` → `getup_1` → `getup` → `getup_3` → `getup_4`.

**Skill dan sinematik**

| File | Skala | Acuan | POSE_BLOCK |
| --- | --- | --- | --- |
| `special_windup` | S | `special` | the pose just before releasing the special: body coiled back, hands pulled to the hip or chest, focused eyes (reverse of the `special` pose, e.g. for a forward palm blast the palms are pulled back) |
| `special_end` | S | `special` | after the release: arms lowering from the extended pose, relaxed exhale |
| `ultimate_charge` | S | `ultimate` | power gathering during the freeze: fists clenched at the sides, body slightly hunched, eyes shut and teeth gritted |
| `ultimate_windup` | S | `ultimate` | arms drawing back, body coiled for the release, eyes opening wide |
| `ultimate_end` | S | `ultimate` | exhausted after the ultimate: arms dropped, bent forward, panting |
| `xray_2` | S | `xray` | second beat of being hit: doubled over forward, eyes wide, arms hanging. Do NOT draw bones or lightning |

**Intro dan menang**

| File | Skala | Acuan | POSE_BLOCK |
| --- | --- | --- | --- |
| `intro_2` | S | `intro` | head down, in a low pre-stance, eyes hidden by the hair, hands loose |
| `intro_3` | S | `intro` | stepping into a wide stance, one hand adjusting a sleeve, eyes looking up |
| `intro_4` | S | `intro` | final stance: wide, one fist clenched in front of the chest, smirk |
| `win_2` | S | `win` | fist half raised, a growing smile |
| `win_3` | S | `win` | fist pumped high at the peak, mouth open in a shout |
| `win_4` | S | `win` | pose held: one hand on the hip, big smile, a wink |

### 5.4 Checklist per karakter (Tier B)

```
[ ] 1 walk_1-6   [ ] 2 n1-n4 (9)   [ ] 3 idle_2-4   [ ] 4 reaksi (10)
[ ] 5 lompat/dash (11)   [ ] 6 crouch/air (11)   [ ] 7 skill (6)   [ ] 8 intro/win (6)
[ ] animations.json disusun dan lolos validate-data
```

---

## 6. Stage (Latar Pertandingan)

### 6.1 Kontrak lantai (kenapa karakter selalu terlihat menapak)

Layout background boleh beda antar stage, tetapi **lantainya harus mengikuti kontrak yang sama** (PRD 14.4). Dalam kanvas 1536×1024:

| Garis | Nilai | Posisi | Arti |
| --- | --- | --- | --- |
| `floorTop` | 0,82 | y ≈ 840 px | Tepi atas permukaan lantai |
| `feetLine` | 0,87 | y ≈ 890 px | Tempat telapak kaki karakter berdiri (± 5% di dalam lantai) |

Aturan yang harus dipenuhi **semua** layer yang memuat lantai (`mid`, `near`, `floor`, `fg`):

1. Lantai adalah permukaan **datar dan horizontal** (pandangan samping, perspektif minimal), kontras rendah-menengah, tepi atas lantai **jelas**.
2. Area **tengah-bawah** (horizontal 25–75%, vertikal 80–95%) **kosong**: tanpa garis vertikal tegas, tanpa benda tinggi, tanpa tulisan. Di sinilah karakter berdiri.
3. Tekstur lantai **berulang horizontal** (tileable): tepi kiri dan kanan harus menyambung.
4. Bayangan kontak dibuat engine, **jangan** menggambar bayangan karakter atau pantulan di lantai.
5. Warna lantai harus **kontras sedang** terhadap karakter (aura karakter: oranye, merah, biru, hijau, ungu). Hindari lantai yang sangat gelap, sangat terang, atau berwarna sama dengan salah satu aura.
6. Jangan menaruh teks, logo, atau papan tulisan yang terbaca (tulisan di tembok diganti goresan abstrak).

### 6.2 Layer dan ukuran

Semua gambar landscape **3:2 (disarankan 1536×1024)**, disimpan sebagai `raw-assets/stages/<id>/<layer>.png`. Semua layer **kecuali `far`** perlu latar transparan; bila generator tidak bisa, gunakan latar **magenta `#FF00FF`** (`process-stages` menghapusnya).

| Layer | File | Latar | Isi | Catatan |
| --- | --- | --- | --- | --- |
| far | `far.png` | Opaque (penuh) | Langit dan siluet jauh (kontras rendah, sedikit buram) | **Cover**, bagian atas boleh terpotong. 25% bawah dibuat **polos dan seragam** (warna tanah/lantai) supaya tidak ada sambungan terlihat |
| mid | `mid.png` | Transparan | Struktur tengah yang berdiri di lantai (gedung, rak, papan tulis, tandon) | Dasar struktur di `floorTop` (y ≈ 840); area di bawahnya transparan |
| near | `near.png` | Transparan | Properti dekat (bangku, meja, pagar) | Taruh di **tepi kiri dan kanan**, kosongkan tengah. Dasar di `floorTop` |
| floor | `floor.png` | Transparan | Permukaan lantai saja | Transparan di atas y ≈ 840; lantai di 18% bawah; tileable |
| fg *(opsional)* | `fg.png` | Transparan | Elemen depan tipis yang melintas | Hanya di sudut atas dan tepi; **tengah kosong**; boleh dilewati |

Jumlah minimum agar stage bisa dipakai: **`far` + `floor`**. Rekomendasi: 4 layer. `thumb.webp` dibuat otomatis.

### 6.3 Prompt (English)

**Setup** (paste sekali per thread stage):

```
You are generating background art for a 2D side-view fighting game. Rules for EVERY image in this chat:
- Style: chibi anime / cel-shaded, clean outlines (thinner than the character outlines), flat cel colors, slightly desaturated palette, low-to-medium contrast so game characters stand out.
- Side view (orthographic feel), minimal perspective, no vanishing-point depth. The ground is a flat horizontal surface.
- Landscape 3:2 canvas, 1536x1024.
- NO characters, NO people, NO text, NO signs with readable words, NO logos, NO UI, NO shadows of characters.
- The center-bottom of the image (horizontal 25-75%, vertical 80-95%) must be empty floor with no tall objects and no strong vertical lines.
- Horizontal edges must tile: the left and right edges match so the image can repeat sideways.
- Floor surface starts at 82% of the image height (the top edge of the floor is a clear horizontal line). 
If transparency is not possible, use a solid pure magenta #FF00FF background and do not use magenta in the art.
```

**Layer prompts** (ganti `{SETTING}`, `{PALETTE}`, `{PROPS}`, `{FLOOR_MATERIAL}` dengan data stage di 6.4):

```
# far (opaque)
Background layer FAR. {SETTING}. Distant elements only, soft and low contrast, {PALETTE}. Fill the whole frame (opaque). The bottom 25% of the image is a plain uniform {FLOOR_MATERIAL} ground tone with no details.

# mid (transparent)
Layer MID of the same scene, on a transparent background. Only the main structures standing on the ground: {SETTING}. Their bases sit exactly on the line at 82% of the image height. Everything below that line is transparent. Same palette and style as the far layer.

# near (transparent)
Layer NEAR of the same scene, on a transparent background. Only close-range props: {PROPS}. Place them at the far left and far right of the frame only; keep the center 40% empty. Their bases sit exactly on the line at 82% of the image height. Everything below that line is transparent.

# floor (transparent)
Layer FLOOR of the same scene, on a transparent background. ONLY the ground surface: {FLOOR_MATERIAL}, seen from the side. Everything above 82% of the image height is transparent; the floor occupies the bottom 18% with a clear, straight, horizontal top edge. Low contrast, horizontally tileable texture, no objects, no shadows.

# fg (optional, transparent)
Layer FOREGROUND of the same scene, on a transparent background. Only a few thin, sparse elements in the top corners and the far left and right edges (for example hanging leaves or a pole). The center 60% must be completely empty.
```

Urutan kerja yang disarankan: **`far` dulu**; lampirkan hasilnya untuk `mid`, `near`, `floor` supaya palet dan gaya sama (tambahkan "Use the attached far layer as the reference for palette and style").

### 6.4 Data empat stage (isi `{SETTING}` dan seterusnya)

| Stage (`id`) | SETTING | PALETTE | FLOOR_MATERIAL | PROPS |
| --- | --- | --- | --- | --- |
| **Lapangan Wikrama** (`lapangan`) | an open school courtyard in the daytime, the main school building and trees in the distance, a clear blue sky with soft clouds | bright warm daylight, sky blue, fresh green, beige | grey-beige paving blocks of a school field | benches, trees, a flagpole |
| **Lab PPLG** (`lab`) | a school computer lab with rows of monitors on desks, a server rack and cables along the back wall | cool teal-grey, soft monitor-blue glow, dim fluorescent light | grey floor tiles | desks, chairs, monitors, cables |
| **Kelas RPL XII-4** (`kelas`) | a classroom with a large blank whiteboard on the wall, student desks and chairs, big windows with daylight (no readable text anywhere) | warm cream, wood brown, pale yellow window light | light-colored floor tiles | student desks, chairs, school bags |
| **Rooftop Wikrama** (`rooftop`) | a school rooftop at dusk, a distant city skyline, a water tank and an antenna | orange-to-purple sunset gradient, dark silhouette skyline | concrete slab with subtle seams | metal railing, water tank, antenna |

### 6.5 Contoh prompt terisi (layer `floor`, Lapangan)

```
Layer FLOOR of the same scene, on a transparent background. ONLY the ground surface: grey-beige paving blocks of a school field, seen from the side. Everything above 82% of the image height is transparent; the floor occupies the bottom 18% with a clear, straight, horizontal top edge. Low contrast, horizontally tileable texture, no objects, no shadows.
```

### 6.6 Tes lantai cepat (sebelum memproses semua stage)

1. Buka `floor.png` atau gabungan `far` + `floor` di editor gambar mana pun (atau di game Training bila F3 sudah jalan).
2. Letakkan `idle.png` karakter dengan **telapak kaki di y ≈ 890** (bagian paling bawah tubuh).
3. Lihat: tepi atas lantai tampak **sedikit di atas kaki** (≈ 50 px), kaki **di dalam** permukaan lantai, dan tidak ada garis vertikal atau benda di belakang kaki yang mengganggu.
4. Bila kaki tampak melayang atau tenggelam: ubah `floorTop` / `feetLine` di `stage.json` (PRD 14.4) sesuai gambar, bukan menggambar ulang.
5. Uji dengan **dua karakter berbeda warna aura** (misalnya Ridho oranye dan Fadhiil biru) agar terlihat bila lantai bentrok.

---

## 7. VFX Global (3 gambar)

Hanya tiga efek yang digambar di generator; semua efek lain dibuat kode (daftar di 7.4). Simpan di `public/assets/vfx/` (PNG, **tidak** diproses `process-sprites`).

### 7.1 Ringkasan

| File | Ukuran | Latar | Dipakai untuk | Catatan |
| --- | --- | --- | --- | --- |
| `projectile.png` | 256×256 | Transparan | Proyektil Special (S1, S8) | Di-tint ke warna aura saat load, jadi **hampir putih-biru**, jangan memakai warna jenuh |
| `explosion.png` | 512×512 | Transparan | Ledakan benturan proyektil dan Ultimate | Di-tint dan di-scale oleh engine |
| `skeleton_overlay.png` | 512×1024 | Transparan | Overlay X-Ray (tulang) di atas korban | **Universal**: satu gambar untuk semua karakter |

### 7.2 Prompt (English)

Paste ke thread terpisah untuk VFX (bukan thread karakter). Setup:

```
You are generating game VFX sprites for a 2D fighting game. Rules for every image: transparent background (or solid pure magenta #FF00FF if transparency is impossible), no characters, no text, no background scene, centered, simple clean shapes with a soft cel-shaded look, white and pale blue colors only (the game will tint them later), the effect fills about 80% of the canvas.
```

`projectile.png` (256×256):

```
A single glowing energy orb for a fighting game projectile, seen from the side: a bright white core, a pale blue inner glow, a soft outer halo, and a short faint tail on the LEFT side suggesting it moves to the right. Square 1:1, 256x256 feel, centered, transparent background, no outline, no text.
```

`explosion.png` (512×512):

```
A single impact explosion burst for a fighting game, seen from the side: a bright white center, expanding pale blue shockwave ring and jagged spiky flame-like edges radiating outward in all directions, stylized comic-style (not realistic), symmetrical, centered. Square 1:1, 512x512 feel, transparent background, no smoke, no debris, no text.
```

`skeleton_overlay.png` (512×1024, portrait; ukuran tidak harus tepat, rasio 1:2 yang penting):

```
A white X-ray style skeleton of a chibi character, front view, standing neutrally with the arms slightly away from the body, oversized skull (about 35% of the total height), short ribcage and spine, short arms and legs, thin clean pale-grey outlines on white bones, completely symmetrical. Portrait 1:2, 512x1024 feel, transparent background, no flesh, no clothes, no glow, no text, the skeleton fills about 90% of the height.
```

### 7.3 Catatan hasil

- `skeleton_overlay.png` diskalakan ke kotak batas korban, jadi bentuknya harus **sederhana dan simetris**. Detail halus tidak terlihat.
- `projectile.png`: jika hasilnya berwarna kuat (merah/hijau), minta ulang "white and pale blue only", karena tint dari engine akan bercampur.
- Cek di latar gelap dan terang: tidak boleh ada halo kotak atau tepi putih kasar.

### 7.4 Yang **tidak** perlu digenerate (digambar kode)

HUD, logo, ikon, spark kena, debu langkah dan mendarat, bintang dizzy, ring parry, retakan, garis kecepatan, aura glow, bayangan kontak, afterimage dash, efek Special S2–S5 dan Ultimate U1–U5, damage number, banner ronde, thumbnail stage.

---

## 8. Aset Boss (3 guru)

Boss memakai pipeline karakter yang sama (PRD 10.4, 16.2). Engine memperbesar boss **1,15×** dan memakai fallback untuk pose yang belum ada, jadi **buat boss dengan skala yang sama seperti karakter biasa** (kepala sama besar dengan 2.4); jangan digambar lebih besar.

### 8.1 Boss Sheet (isi sebelum membuat pose)

Ciri fisik dan outfit nyata tiap guru **hanya lu yang tahu**; kolom `(isi)` jangan diisi dengan tebakan. Gunakan gaya chibi yang menyenangkan (karikatur ringan, bukan realistis) dan jangan menambahkan tulisan atau logo di pakaian.

| Field | Atjep Rahmat | Muslih | Juliana Mansur |
| --- | --- | --- | --- |
| `id` (slug, nama folder `raw-assets/<id>/`) | `atjep` | `muslih` | `juliana` |
| Konsep | The Strict Examiner | The Marker Master | The Homework Queen |
| Aura (saran, boleh diganti; fase 2 selalu merah dari engine) | Emas `#FFC21A` | Teal `#14B8A6` | Pink `#EC4899` |
| Special 1, Special 2 | S1 "Surprise Quiz", S5 "Deadline Shockwave" | S8 "Marker Barrage", S3 "Red Pen Rising" | S2 "Homework Tsunami", S6 "Pop Quiz Counter" |
| Ultimate, jurus fase 2 | U2 "Final Exam", S4 "Remedial Rush" | U4 "Attendance Slam", S2 "Whiteboard Wave" | U5 "Grade Reversal", S7 "Late Submission" |
| Rambut dan wajah | (isi) | (isi) | (isi) |
| Outfit | (isi) | (isi) | (isi) |
| Ciri khas / aksesori (≥ 2 elemen siluet) | (isi) | (isi) | (isi) |
| Ekspresi default | (isi, saran: tegas, berwibawa) | (isi) | (isi) |
| **Character Lock** (1–2 kalimat English) | (isi) | (isi) | (isi) |

Pose `idle` boss memakai kuda-kuda **Tank** (4.5) kecuali lu pilih lain. Untuk pose `special` dan `ultimate`, pakai POSE_BLOCK dari 4.2 (template Special 1) dan 4.3 (template Ultimate) sesuai tabel di atas.

### 8.2 Pose minimum (14 per guru)

Pakai template 2.3 dan prompt pembuka 3.5 (master reference = `idle`). POSE_BLOCK semua sama dengan 4.1 kecuali dinyatakan lain.

| # | File | POSE_BLOCK | Catatan |
| --- | --- | --- | --- |
| 1 | `idle` | Tank stance (4.5) | Master reference boss |
| 2 | `portrait` | 4.4 | Bar HP boss dan layar Boss Intro |
| 3 | `splash` | 4.4 | Boss Intro, cut-in Ultimate |
| 4 | `dash_f` | 4.1 | |
| 5 | `n1_jab` | 4.1 | |
| 6 | `n4_roundhouse` | 4.1 | |
| 7 | `guard` | 4.1 | |
| 8 | `hit_high` | 4.1 | |
| 9 | `down` | 4.1 | Skala `W` |
| 10 | `special` | 4.2, template Special 1 guru itu | |
| 11 | `ultimate` | 4.3, template Ultimate guru itu | |
| 12 | `xray` | 4.1 | Tanpa tulang |
| 13 | `win` | 4.1 | |
| 14 | `phase2` | enraged transformation pose: both fists clenched at the sides, body leaning forward, mouth open in a roar, hair and clothes flaring upward, a furious expression | Dipakai saat transisi fase 2 (90 frame); engine menambahkan aura merah |

**Ideal (nanti):** semua 32 pose Tier A + `phase2` = 33 per guru. Pose lain otomatis memakai fallback (PRD 6.6), jadi boss tetap bisa dimainkan dengan 14 pose.

### 8.3 Checklist per guru

```
[ ] Boss Sheet terisi   [ ] master reference (idle) dipilih   [ ] Character Lock tersalin ke bosses.json (quirk dikosongkan)
[ ] portrait [ ] splash [ ] idle [ ] dash_f [ ] n1_jab [ ] n4_roundhouse [ ] guard [ ] hit_high
[ ] down [ ] special [ ] ultimate [ ] xray [ ] win [ ] phase2
Cek: [ ] process-sprites tanpa warning 12% [ ] aura tidak sama dengan karakter pemain (pemain: oranye, merah, biru, hijau, ungu)
```

---

## 9. Audio

Audio **tidak memblokir** pengembangan: game selalu punya suara cadangan buatan kode (SFX disintesis, BGM diganti trek lain atau hening; PRD 15.1). File asli otomatis dipakai begitu ada di folder yang benar.

### 9.1 Aturan umum

| Hal | Aturan |
| --- | --- |
| Lisensi | Semua BGM, SFX, dan suara announcer harus **buatan sendiri atau berlisensi untuk publikasi** (termasuk hasil AI dan TTS: baca ketentuan penyedia). Catat tiap file di `docs/audio-credits.md`: judul, sumber, lisensi |
| Format BGM | Stereo, MP3 atau OGG ±128 kbps, **loop mulus** (lihat 9.2), folder `public/assets/audio/bgm/<key>.ogg` (atau `.mp3`) |
| Format SFX | Mono 44,1 kHz, `.mp3` atau `.ogg`, **< 100 KB** per file, folder `public/assets/audio/sfx/`. Nama **selalu bernomor**: `<key>_1`, `<key>_2`, … termasuk bila hanya satu varian (contoh `hit_light_1.mp3`) |
| Format announcer | Mono 44,1 kHz, ≤ 60 KB, dinormalisasi, folder `public/assets/audio/announcer/<key>.mp3` |
| Anggaran | Total audio ≤ **20 MB**. BGM 128 kbps ≈ 1 MB per menit, jadi buat loop **60–90 detik** (bukan 3 menit) supaya 12 loop + SFX + announcer muat. Periksa total ukuran folder sebelum menambah trek |
| Volume | Normalisasi semua trek ke level yang sama (±−14 LUFS untuk BGM, SFX sedikit lebih keras); engine mengatur bus dan ducking |

### 9.2 Cara membuat loop yang mulus

1. Di prompt generator musik minta: *"seamless loop, starts and ends on the same chord, no intro build, no fade-out, no vocals"*.
2. Buka hasilnya di editor audio gratis (Audacity): potong tepat di **batas birama** (mulai dan akhir sama-sama di ketukan 1), tanpa jeda sunyi di awal atau akhir.
3. Ekspor OGG (atau MP3 gapless), lalu **tes loop**: putar dua kali berturut-turut; tidak boleh ada klik, jeda, atau lonjakan volume.
4. Bila tidak bisa dibuat mulus, tetap pakai; engine melakukan crossfade 0,5 detik antar-trek, tetapi pengulangan trek yang sama akan terdengar sedikit memotong.

### 9.3 Gaya musik (paste di awal setiap permintaan musik)

```
Instrumental game music for a fast 2D arcade fighting game with a playful school theme. Style: punchy modern drums, driving bass, retro 8-bit/16-bit arcade synth leads, a catchy melodic hook, high energy, no vocals, no lyrics, clean mix, seamless loop.
```

### 9.4 Daftar 16 trek (key = nama file)

Kolom "Prompt" ditambahkan **setelah** gaya di 9.3.

| Key | Dipakai di | Jenis, durasi | BPM | Prompt (English) |
| --- | --- | --- | --- | --- |
| `title` | Title, Credits | loop, 60–90 dtk | 110 | epic yet playful main-menu theme, confident synth melody with a memorable hook, rising energy, heroic feeling |
| `select` | Select Mode / Character / Stage, How to Play | loop, 60–90 dtk | 120 | upbeat groovy menu music, light and anticipating, bouncy bass, less intense than battle music |
| `vs` | VS Intro | sting, **±3 dtk** | – | dramatic 3-second versus-screen sting: low rising tension, a heavy hit on the last beat, no loop |
| `stage_lapangan` | Battle Lapangan | loop, 60–90 dtk | 140 | bright sunny open-air battle theme, driving rock and chiptune, optimistic and energetic |
| `stage_lab` | Battle Lab PPLG | loop, 60–90 dtk | 135 | electronic battle theme, glitchy synth arpeggios and tight techno beat, cool and focused |
| `stage_kelas` | Battle Kelas | loop, 60–90 dtk | 128 | quirky bouncy battle theme, playful staccato synth and funky bass, a little mischievous |
| `stage_rooftop` | Battle Rooftop | loop, 60–90 dtk | 132 | sunset synthwave battle theme, warm pads with an intense driving beat, bittersweet but fierce |
| `boss_1` | Boss Atjep Rahmat | loop, 60–90 dtk | 150 | aggressive boss battle theme, brass-like synths and heavy drums, strict and authoritative, intimidating |
| `boss_2` | Boss Muslih | loop, 60–90 dtk | 148 | heavy boss battle theme, distorted guitar-style synth and pounding drums, relentless and confident |
| `boss_3` | Boss Juliana Mansur | loop, 60–90 dtk | 152 | dramatic regal boss battle theme, sharp strings-style synths and fast drums, commanding and elegant |
| `boss_phase2` | Fase 2 boss | loop, 60–90 dtk | 160 | even more intense boss theme: faster, harder drums, urgent rising synth lines, an "enraged final phase" feeling (generic: it plays over any boss) |
| `training` | Training | loop, 60–90 dtk | 100 | calm minimal training-room music, steady beat and a simple mellow synth loop, non-distracting |
| `victory` | Match Detail menang | jingle, 5–8 dtk | – | triumphant short victory fanfare, bright brass-style synth, resolves on a strong final chord, no loop |
| `defeat` | Match Detail kalah | jingle, 5–8 dtk | – | short disappointed defeat jingle, descending notes, a sad but gentle tone, no loop |
| `ending` | Ending Arcade | loop, 60–90 dtk | 100 | warm emotional ending theme, gentle piano and soft synth strings with a hopeful melody |
| `gameover` | Game Over | jingle, ±5 dtk | – | short dramatic game-over jingle, slow descending notes and a low final hit, no loop |

Fallback bila file belum ada ada di PRD 15.2 (mis. `stage_lab` memakai `stage_lapangan`), jadi prioritas pembuatan: `title`, `stage_lapangan`, `victory`, `defeat`, `vs`, lalu sisanya.

### 9.5 SFX (opsional, ada sintesis cadangan)

44 key, ±59 file termasuk varian. Buat bila sudah ada waktu; sebelum itu game memakai suara sintesis arcade (PRD 15.5). Prompt umum untuk generator SFX atau pencarian di perpustakaan berlisensi: `short game sound effect, {DESKRIPSI}, clean, no music, no voice, dry, {DURASI}`. Durasi di bawah 1 detik kecuali dinyatakan lain.

| Key (varian) | Kapan | Deskripsi (English) |
| --- | --- | --- |
| `ui_move` (1) | Gerak menu | tiny soft blip |
| `ui_select` (1) | Pilih menu | short bright confirm chirp |
| `ui_back` (1) | Kembali | short descending blip |
| `ui_start` (1) | PRESS START | big rising arcade start sweep with a punchy hit |
| `round_start` (1) | Banner ronde | three quick beeps then a short hit |
| `boss_warning` (1) | Peringatan boss | loud warning siren blast, 1.5 s |
| `jump` (2) | Lompat | quick light upward whoosh |
| `land` (2) | Mendarat | soft thud with a little dust |
| `dash` (2) | Dash | sharp fast air swish |
| `whoosh_light` (2) | N1, C1, A1 | very light fast swing |
| `whoosh_mid` (2) | N2, N3, C2, A2, A3 | medium swing |
| `whoosh_heavy` (2) | N4, C3, C4, A4 | heavy deep swing |
| `hit_light` (3) | Hit ringan | light punch impact, snappy |
| `hit_medium` (3) | Hit sedang | solid punch impact with a body thud |
| `hit_heavy` (3) | Hit heavy | heavy crushing impact with a deep boom |
| `block` (2) | Block | dull guarded thud with a cloth slap |
| `parry` (1) | Perfect Parry | bright metallic ping with a short shimmer |
| `reverse` (1) | Reverse | quick rewinding zap |
| `special_cast` (2) | Special dimulai | short energy charge-up burst |
| `proj_bolt` (1) | Proyektil S1 | zappy energy bolt launch |
| `triple_shot` (1) | S8 | three rapid light energy shots |
| `proj_wave` (1) | S2 | wide rolling energy wave |
| `shock_ground` (1) | S5 | ground slam with a rumbling shockwave |
| `special_hit` (2) | Special kena | energy impact burst |
| `rising` (1) | S3 | upward rushing strike with a whoosh |
| `rush` (1) | S4 | fast charging dash with a burst |
| `shadow_step` (1) | S7 | quick vanishing whoosh with a soft pop |
| `counter_stance` (1) | S6 dimulai | tense short drone, ready to counter |
| `counter_hit` (1) | S6 kena | sharp counter-strike hit |
| `ex_cast` (1) | EX Special | stronger charge burst with an echo |
| `ultimate_charge` (1) | Freeze Ultimate | powerful rising energy charge, 1.5 s |
| `ult_beam` (1) | U1 | huge sustained energy beam, 1.5 s |
| `ult_thunder` (1) | U2 | lightning storm crackle and thunder, 1.5 s |
| `ult_barrage` (1) | U3 | rapid fire of many quick hits |
| `ult_slam` (1) | U4 | giant ground slam with a huge boom |
| `ult_grab` (1) | U5 | menacing grab swoosh with a snap |
| `xray_shock` (1) | X-Ray | heavy bone-crack impact with a deep shock, 1 s |
| `dizzy` (1) | Dizzy | comical wobbling dizzy chime |
| `ko_hit` (1) | K.O. | huge final hit impact |
| `ko_siren` (1) | K.O. | short arcade K.O. siren sting |
| `energy_ready` (1) | Energy 50 / 100 | bright power-up ding |
| `cooldown_ready` (1) | Cooldown siap | tiny soft tick |
| `timer_low` (1) | Timer < 10 dtk | urgent short beep |
| `countdown_tick` (1) | Hitung mundur | clear short beep |

### 9.6 Announcer (TTS, English)

Satu suara energik dan konsisten untuk semua file (satu engine TTS, satu pengaturan). Ekspor mono, dinormalisasi. Catat mesin TTS dan lisensinya di `audio-credits.md` (cek apakah suara boleh dipakai untuk publikasi).

| File | Teks | File | Teks |
| --- | --- | --- | --- |
| `round_1` | "Round one!" | `you_win` | "You win!" |
| `round_2` | "Round two!" | `you_lose` | "You lose!" |
| `round_3` | "Round three!" | `draw` | "Draw game!" |
| `final_round` | "Final round!" | `get_ready` | "Get ready!" |
| `fight` | "Fight!" | `warning` | "Warning!" |
| `ko` | "K.O.!" | `continue` | "Continue?" |
| `perfect` | "Perfect!" | `game_over` | "Game over." |
| `time_over` | "Time over!" | `three` / `two` / `one` | "Three!" / "Two!" / "One!" |

Tambahan: `name_<id>` untuk tiap karakter (mis. `name_ridho` = "Ridho!") dipakai di VS Intro; boss opsional (`name_atjep`, dll.). Total **18 file tetap + 5 nama karakter = 23 file** (+3 bila nama boss).

Gaya baca: *"energetic arcade fighting-game announcer, loud, short, with a slight echo"*; kata terakhir ditekankan ("Fight!", "K.O.!"). Untuk `warning`, buat lebih dalam dan mendesak; untuk `continue`, lebih lambat.

---

## 10. QA dan Perbaikan Hasil

### 10.1 Checklist tiap gambar karakter (sebelum disimpan)

```
[ ] Menghadap kanan                                [ ] Hanya satu karakter, tanpa properti tambahan
[ ] Wajah, rambut, outfit sama dengan master        [ ] Ukuran kepala sama dengan idle (selisih < 12%)
[ ] Outline dan shading sama dengan pose lain       [ ] Tangan/kaki tidak terpotong, ada margin
[ ] Latar bersih (transparan atau magenta murni), tanpa halo, bayangan, teks, atau motion lines
[ ] Tangan dan jari wajar (5 jari, bentuk normal)   [ ] Aura hanya aksen halus (bukan efek besar)
[ ] Pose sesuai deskripsi (mis. N1 = pukulan KANAN setinggi kepala, N3 = tendangan KIRI rendah)
[ ] Siluet terbaca bila dihitamkan (terutama hit_high vs hit_low, air_kick arah depan-bawah)
```

### 10.2 Masalah umum dan prompt perbaikan (English)

Kirim prompt ini **di thread yang sama**, dengan gambar bermasalah dilampirkan bersama master reference.

| Gejala | Prompt perbaikan |
| --- | --- |
| Kepala atau badan lebih besar dari idle | `Redraw this pose with the head exactly the same size as in the idle reference. Do not zoom in. Keep everything else.` |
| Menghadap kiri | `Redraw the same pose facing RIGHT, mirrored, with the same face and outfit.` |
| Wajah atau outfit berubah | `Redraw with the exact face, hairstyle and outfit of the master reference image. Change only the pose.` |
| Terpotong di tepi | `Redraw the same pose smaller with a clear margin around all limbs. Keep the head size consistent with the idle reference.` |
| Ada bayangan, lantai, atau efek | `Redraw the same pose with NO floor shadow, NO ground, NO motion lines, NO glow, on a transparent background.` |
| Latar tidak transparan | `Redraw the same image on a solid pure magenta #FF00FF background, no magenta in the character.` |
| Tangan atau jari aneh | `Fix the hands: exactly five fingers each, natural proportions, same style as the reference. Keep everything else unchanged.` |
| Dua karakter atau ada orang lain | `Only ONE character in the image. Remove everything else.` |
| Pose tidak sesuai (mis. salah tangan) | `The pose must be: {POSE_BLOCK}. Redraw with exactly that pose, changing nothing else.` |
| Gaya melenceng (terlalu realistis, glow besar) | `Match the art style of attack.png: chibi anime, thick clean black outlines, soft cel shading, slightly desaturated colors, no glow.` |

Bila tiga percobaan gagal: mulai **thread baru**, paste ulang setup 2.2, lampirkan master reference, dan coba lagi. Thread yang sudah panjang sering "lupa" aturan awal.

### 10.3 Checklist stage, VFX, boss, dan audio

```
Stage (per stage): [ ] far opaque, bawah polos   [ ] mid/near dasar di y≈840   [ ] floor transparan atas, tileable
                   [ ] area tengah-bawah kosong  [ ] tes lantai 6.6 lulus dengan 2 karakter berbeda aura
VFX:  [ ] projectile putih-biru  [ ] explosion  [ ] skeleton_overlay simetris
Boss: [ ] Boss Sheet terisi  [ ] 14 pose  [ ] aura berbeda dari karakter pemain
Audio: [ ] lisensi dicatat di audio-credits.md  [ ] loop dites 2x  [ ] total folder audio ≤ 20 MB
```

### 10.4 Urutan yang disarankan untuk mulai hari ini

1. Isi Character Sheet Ridho (3.2) dan **tentukan karakter kedua** (isi sheet-nya, 3.3).
2. Buat `idle` Ridho dari `attack.png` sebagai master reference; tambah `portrait` dan `splash`. Ulangi untuk karakter kedua.
3. Buat `far` dan `floor` Lapangan Wikrama (6.3) lalu lakukan tes lantai (6.6).
4. Itu **P0 (8 gambar)**: berikan ke AI coding sebagai bahan F3; lanjutkan P1 saat engine sudah menggambar karakter.
