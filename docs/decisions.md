# Keputusan Proyek WIKWAR

Catat di sini tiap keputusan yang mengubah arah, supaya lu (dan AI) tidak lupa alasannya. Keputusan awal sudah ada di PRD bagian 2 (tabel perubahan v1.3 ke v2.0 dan tabel asumsi); file ini untuk keputusan **baru** selama pengerjaan.

## Format entri

```
## YYYY-MM-DD: judul singkat
- Keputusan: ...
- Alasan: ...
- Dampak: bagian PRD / file yang ikut berubah
```

## Keputusan

## (isi tanggal): Rewrite atau refactor game lama (langkah 4)
- Skor tabel 21.5: (isi) dari 10
- Keputusan: (rewrite inti di repo baru / refactor bertahap / refactor di tempat)
- Alasan: (isi)
- Dampak: game lama di-tag `legacy-v1`; yang boleh dipindah: gambar, audio, teks, nama jurus, layar menu yang rapi

## Aturan perubahan angka (PRD 18.4)
Angka tuning hanya diubah di `src/config/balance.ts`. Bila anchor test gagal karena angka sengaja diubah: ubah angka dan anchor sekaligus, lalu catat di sini:

| Tanggal | Angka | Dari | Ke | Alasan |
| --- | --- | --- | --- | --- |
| | | | | |
