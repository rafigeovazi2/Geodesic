# 🤝 Panduan Kontribusi - Geodesic

Selamat datang di **Geodesic**! 👋

Dokumen ini ditulis untuk **semua orang** - termasuk kamu yang baru pertama
kali pakai Git, baru pertama kali melihat kode simulasi fisika, atau bahkan
belum pernah koding sama sekali. Tidak perlu menguasai semua hal di dokumen
ini untuk mulai berkontribusi. Baca pelan-pelan, praktikkan langkah demi
langkah, dan jangan takut bertanya.

---

## 📚 Daftar Isi

1. [Pahami Dulu: Proyek Ini Apa?](#1-pahami-dulu-proyek-ini-apa)
2. [Persiapan: Instalasi dari Nol](#2-persiapan-instalasi-dari-nol)
3. [Struktur Proyek: Di Mana Saya Harus Bekerja?](#3-struktur-proyek-di-mana-saya-harus-bekerja)
4. [Alur Kerja Git untuk Pemula](#4-alur-kerja-git-untuk-pemula)
5. [Aturan Penulisan Kode](#5-aturan-penulisan-kode)
6. [Cara Menguji Perubahanmu](#6-cara-menguji-perubahanmu)
7. [Aturan Commit dan Pull Request](#7-aturan-commit-dan-pull-request)
8. [Melaporkan Bug / Mengusulkan Ide](#8-melaporkan-bug--mengusulkan-ide)
9. [Pembagian Peran Tim](#9-pembagian-peran-tim)
10. [Kontak dan Bantuan](#10-kontak-dan-bantuan)

---

## 1. Pahami Dulu: Proyek Ini Apa?

Geodesic adalah **simulator tata surya interaktif berbasis browser** untuk
NASA Space Apps Challenge. Tujuannya edukasi: membongkar miskonsepsi bahwa
gravitasi adalah "gaya tarik" — padahal menurut Einstein, gravitasi adalah
**kelengkungan ruang-waktu**.

Fitur inti yang wajib kamu pahami sebelum koding:

| Fitur                | Penjelasan Bahasa Awam                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dual Mode**        | Tombol _Newton vs Einstein_. Lintasan roketnya **sama persis** — yang berubah hanya "cara menjelaskannya": panah gaya (Newton) atau grid ruang-waktu melengkung (Einstein).        |
| **Slingshot**        | Seperti memegang tali tambah saat berputar di taman bermain, lalu melepasnya di waktu yang tepat — roket "meminjam" kecepatan planet.                                              |
| **Efek Oberth**      | Menyalakan mesin roket saat bergerak **paling cepat** (paling dekat ke planet) jauh lebih hemat bahan bakar. Seperti melempar bola saat di puncak ayunan, bukan di titik terendah. |
| **Jam Relativistik** | Jam roket berdetak _sedikit lebih lambat_ dari jam di Bumi. Selisihnya nanodetik, tapi nyata — GPS di HP-mu mengoreksi efek ini setiap hari.                                       |

Dokumentasi fisika lengkap ada di [`physics-engine/README.md`](physics-engine/README.md)
dan [`docs/ARSITEKTUR.md`](docs/ARSITEKTUR.md).

---

## 2. Persiapan: Instalasi dari Nol

### Prasyarat

| Alat               | Fungsi                           | Cara Dapat                                             |
| ------------------ | -------------------------------- | ------------------------------------------------------ |
| **Node.js ≥ 18**   | Menjalankan dev server & build   | [nodejs.org](https://nodejs.org) — pilih versi LTS     |
| **Git**            | Melacak & berbagi perubahan kode | [git-scm.com](https://git-scm.com)                     |
| **Browser modern** | Chrome / Edge / Firefox terbaru  | Sudah kamu punya 🙂                                    |
| **Editor**         | VS Code disarankan               | [code.visualstudio.com](https://code.visualstudio.com) |

> **Cek instalasi berhasil:** buka terminal (Command Prompt / PowerShell),
> ketik `node --version` dan `git --version`. Kalau muncul nomor versi,
> kamu siap.

### Langkah Instalasi Proyek

```bash
# 1. Ambil kode dari GitHub (ganti <username> dengan username-mu)
git clone https://github.com/<username>/Geodesic.git
cd Geodesic

# 2. Pasang dependensi (Three.js + Vite)
npm install

# 3. Jalankan aplikasi
npm run dev
```

Setelah itu browser akan terbuka otomatis di `http://localhost:5173`.
Kalau tidak, buka manual. **Selamat — aplikasi berjalan di komputermu!** 🎉

### Sekali Saja: Menyiapkan Git Lokalmu

```bash
git config --global user.name "Nama Kamu"
git config --global user.email "email@kamu.com"
```

---

## 3. Struktur Proyek: Di Mana Saya Harus Bekerja?

Proyek terbagi menjadi **3 folder peran + 1 entry point**. Temukan peranmu,
dan Anda akan tahu folder mana yang jadi "rumah" Anda:

```
Geodesic/
├── index.html            ← Kerangka halaman (panel, tombol, slider)
├── main.js               ← ✨ CONDUCTOR — menyatukan semua folder
├── style.css             ← Tampilan (warna, layout, animasi)
│
├── physics-engine/       ← 🔧 Folder "Hacker" — semua matematika fisika
├── webgl-engine/         ← 🎨 Folder "Hipster" — semua visual 3D
├── ui-dashboard/         ← 🎯 Folder "Hustler" — telemetri & storytelling
└── docs/                 ← 📖 Dokumentasi teknis mendalam
```

### Peta Modul — siapa memanggil siapa

Semua logika terpusat di `main.js`. **Tidak ada duplikasi kode** — jika kamu
mengubah rumus, ubah di foldernya, bukan di `main.js`:

```
main.js
 ├── import dari physics-engine/
 │     ├── constants.js    → konstanta + data 8 planet (NASA NSSDCA)
 │     ├── rk4.js          → integrator numerik RK4
 │     ├── gravity.js      → percepatan gravitasi N-body
 │     ├── simulation.js   → orkestrator simulasi lengkap
 │     └── oberth.js       → Efek Oberth + Tsiolkovsky
 │
 ├── import dari webgl-engine/
 │     ├── scene-manager.js    → renderer, kamera, kontrol
 │     ├── celestial-bodies.js → Matahari, planet, roket, panah gaya
 │     ├── spacetime-grid.js   → grid ruang-waktu (GLSL shader)
 │     └── trail-renderer.js   → garis lintasan roket
 │
 ├── import dari ui-dashboard/
 │     ├── telemetry-panel.js → format angka telemetri
 │     ├── fuel-gauge.js      → bar perbandingan bahan bakar
 │     └── clock-display.js   → jam relativistik
 │
 └── import three dari node_modules (pustaka Three.js)
```

> 📖 Penjelasan mendalam tiap file (termasuk analogi awam untuk RK4,
> shader GPU, dan time dilation) ada di **[docs/ARSITEKTUR.md](docs/ARSITEKTUR.md)**.

---

## 4. Alur Kerja Git untuk Pemula

Kami memakai alur **feature branch** — jangan pernah langsung mengubah
branch `main`. Anggap `main` adalah "versi museum yang sudah beres", dan
setiap ide baru dikerjakan di "ruang kerja terpisah" dulu.

### Langkah 4.1 — Sinkronkan & buat cabang baru

```bash
# Pastikan versi main terbaru
git checkout main
git pull origin main

# Buat cabang untuk tugasmu (nama singkat, deskriptif)
git checkout -b fitur/skala-waktu-planet
```

Konvensi nama cabang:

| Awalan       | Kapan dipakai              | Contoh                          |
| ------------ | -------------------------- | ------------------------------- |
| `fitur/`     | Menambah sesuatu yang baru | `fitur/bulan-orbit`             |
| `perbaikan/` | Memperbaiki bug            | `perbaikan/jam-selisih-negatif` |
| `docs/`      | Mengubah dokumentasi       | `docs/update-storyboard`        |
| `grafis/`    | Perubahan visual/3D        | `grafis/tekstur-saturnus`       |

### Langkah 4.2 — Bekerja & menyimpan progres

```bash
# Lihat file apa yang berubah
git status

# "Bungkus" perubahan (add semua file yang berubah)
git add .

# Simpan snapshot dengan pesan jelas
git commit -m "fitur: tambah opsi target Bulan"
```

Lakukan `add` + `commit` **sering** — misal setiap selesai satu perubahan
kecil. Commit itu seperti titik simpan (save point) di gim; kalau ada yang
rusak, kamu bisa kembali.

### Langkah 4.3 — Kirim ke GitHub & minta review

```bash
git push -u origin fitur/skala-waktu-planet
```

Lalu buka GitHub → akan muncul tombol **"Compare & pull request"** → klik,
isi template PR (ada petunjuknya otomatis), minta salah satu anggota tim
untuk me-review.

> ⚠️ **Aturan penting:** PR harus di-review **minimal 1 anggota lain**
> sebelum di-merge ke `main`. Ini bukan birokrasi — ini cara kami menjaga
> agar `main` selalu bisa dijalankan siapa pun, kapan pun (terutama penting
> menjelang demo hari-H).

### Situasi Darurat 🚨

- **"Aku salah commit ke main!"** → jangan panik. `git checkout -b perbaikan/aman` lalu lapor di grup tim. Semua bisa dipulihkan selama belum di-push-force.
- **"Konflik merge!"** → baca [dokumen konflik](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line), atau minta bantuan — konflik pertama selalu paling menakutkan.
- **"Aku merusak semuanya"** → `git stash` atau `git checkout -- <file>`. Kalau ragu, **copy dulu foldernya** sebelum eksperimen.

---

## 5. Aturan Penulisan Kode

### Bahasa

- **Komentar & dokumentasi:** Bahasa Indonesia.
- **Nama variabel/fungsi:** Bahasa Inggris, camelCase (contoh: `vInfFromDv`, `clockRate`).
- **Pesan commit & PR:** Boleh campur, tapi konsisten dan deskriptif.

### Gaya Kode

```javascript
// ✅ BAIK — nama deskriptif, komentar menjelaskan "kenapa"
const v0 = K.vE + (out ? vInf : -vInf); // arah luncur: keluar (prograde) atau masuk (retrograde)
tau = Math.min(tau, Math.sqrt((d * d * d) / PLANETS[i].GM)); // skala waktu orbit lokal → dasar adaptive step

// ❌ BURUK — tidak bisa dibaca orang lain
const v = a ? b : -b;
t = Math.min(t, Math.sqrt(x));
```

### Aturan Khusus Proyek

1. **Satu sumber kebenaran.** Rumus fisika hanya boleh ada di `physics-engine/`.
   UI hanya memformat dan menampilkan. Jika butuh rumus di UI, _import_, jangan salin.
2. **Unit selalu SI** (meter, detik, kg) di dalam mesin fisika. Konversi ke
   km/AU **hanya saat menampilkan** ke layar (lihat `ui-dashboard/telemetry-panel.js`).
3. **Komentar di awal setiap file** menjelaskan: apa, kenapa, dan rumusnya.
   Contoh terbaik: bagian atas `oberth.js`.
4. **Jangan menambah dependensi tanpa diskusi dulu** — setiap paket baru
   menambah ukuran build dan risiko demo hari-H.
5. **Uji sebelum commit.** Jalankan `npx vite build` — harus hijau tanpa error.

---

## 6. Cara Menguji Perubahanmu

### Tes cepat (wajib sebelum setiap PR)

```bash
npx vite build          # 1. Build harus sukses
npm run dev             # 2. Buka app, mainkan 2–3 menit:
```

Checklist manual saat `npm run dev`:

- [ ] Ganti target planet (klik chip planet) → slider Δv menyesuaikan, tidak error di console (F12)
- [ ] Geser slider titik bidik ke ujung → muncul banner merah ATAU lintasan tetap wajar
- [ ] Toggle Newton ↔ Einstein → grid beranimasi mulus, jam relativistik muncul di mode Einstein
- [ ] Tab Telemetri/Slingshot/Oberth → angka masuk akal (kecepatan ~10–40 km/s, bukan NaN)
- [ ] Tombol Ulang & scrub timeline → tidak macet

### Tes fisika via Node (tanpa browser)

Untuk mengubah logika di `physics-engine/`, uji hasilnya langsung:

```bash
node -e "import('./physics-engine/simulation.js').then(async m => {
  const { PLANETS } = await import('./physics-engine/constants.js');
  const r = m.simulate({ dv: 6900, targetIndex: 4, offset: 0.2 * PLANETS[4].offRange });
  console.log(r.status, 'titik:', r.T.length, 'Δv langsung:', (r.dvDirect/1000).toFixed(2), 'km/s');
})"
```

Hasil acuan (baseline saat ini): `ok`, ±1200 titik, Δv langsung ≈ 9.74 km/s
untuk Jupiter. Kalau angkanya menyimpang jauh setelah perubahanmu — ada
yang salah di fisikanya.

---

## 7. Aturan Commit dan Pull Request

### Format pesan commit

```
<tipe>: <perubahan dalam satu kalimat>

<opsional: penjelasan detail>
```

| Tipe        | Arti                                       |
| ----------- | ------------------------------------------ |
| `fitur`     | Fitur baru                                 |
| `perbaikan` | Bug fix                                    |
| `fisika`    | Perubahan logika/konstanta fisika          |
| `grafis`    | Visual, shader, animasi                    |
| `docs`      | Dokumentasi                                |
| `rapikan`   | Refactor/cleaning tanpa perubahan perilaku |

Contoh: `perbaikan: jam relativistik tanda lag terbalik saat retrograde`

### Checklist Pull Request

Template PR otomatis muncul saat kamu membukanya. Ringkasannya:

- [ ] Build sukses (`npx vite build`)
- [ ] Checklist manual di bagian [Menguji](#6-cara-menguji-perubahanmu) lolos
- [ ] Tidak ada dead code / console.log sisa debugging
- [ ] Jika mengubah fisika: angka baseline masih cocok (atau perubahannya dijelaskan)
- [ ] Screenshot/video untuk perubahan visual (masukkan ke deskripsi PR)
- [ ] Direview ≥ 1 anggota tim

---

## 8. Melaporkan Bug / Mengusulkan Ide

Jangan perbaiki diam-diam kalau belum yakin — laporkan dulu supaya tidak
bentrok dengan yang lain:

1. Buka tab **Issues** di repo GitHub.
2. Pilih template: **🐞 Bug Report** atau **💡 Ide Fitur**.
3. Isi sesuai petunjuk template (cara reproduksi, screenshot, dsb).
4. Tugaskan label dan comment "aku yang kerjakan" supaya tidak dikerjakan dua orang.

---

## 9. Pembagian Peran Tim

Tiga peran (bisa lebih dari satu orang per peran — saling backup!):

| Peran       | Emoji | Folder            | Ringkasan Tanggung Jawab                          |
| ----------- | ----- | ----------------- | ------------------------------------------------- |
| **Hacker**  | 🔧    | `physics-engine/` | Akurasi RK4, N-body, slingshot, Oberth, data NASA |
| **Hipster** | 🎨    | `webgl-engine/`   | Visual 3D, GLSL shader, kamera, animasi           |
| **Hustler** | 🎯    | `ui-dashboard/`   | Telemetri, storytelling, storyboard, demo         |

**Baca juga:** `docs/ARSITEKTUR.md` untuk peta teknis tiap file, dan
`ui-dashboard/storyboard.md` untuk alur presentasi 4 menit ke juri.

---

## 10. Kontak dan Bantuan

- 💬 Tanya cepat → grup chat tim.
- 🐞 Bug → [Issues](../../issues) dengan template.
- 📖 Dokumentasi → mulai dari [README.md](README.md) lalu [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md).

Terakhir: **tidak ada pertanyaan yang terlalu dasar.** Lebih baik tanya
sekarang daripada demo gagal nanti. Selamat berkontribusi! 🚀
