# 🏗️ Arsitektur Geodesic — Penjelasan Mendalam untuk Semua Kalangan

> Dokumen ini menjelaskan **bagaimana aplikasi bekerja dari dalam** — file
> demi file, konsep demi konsep — dengan bahasa yang bisa dipahami orang
> yang belum pernah menyentuh simulasi fisika atau grafis 3D sekalipun.
>
> Pendamping untuk: [README.md](../README.md) (ringkasan proyek) dan
> [CONTRIBUTING.md](../CONTRIBUTING.md) (aturan berkontribusi).

---

## Daftar Isi

1. [Gambaran Besar: Bagaimana Aplikasi Ini Hidup](#1-gambaran-besar-bagaimana-aplikasi-ini-hidup)
2. [physics-engine/ — Otak Fisika](#2-physics-engine--otak-fisika)
3. [webgl-engine/ — Panggung Visual](#3-webgl-engine--panggung-visual)
4. [ui-dashboard/ — Wajah dan Bicara](#4-ui-dashboard--wajah-dan-bicara)
5. [main.js — Sang Konduktor](#5-mainjs--sang-konduktor)
6. [Alur Data: Dari Klik Slider sampai Roket Bergerak](#6-alur-data-dari-klik-slider-sampai-roket-bergerak)
7. [Konsep Fisika untuk Orang Awam](#7-konsep-fisika-untuk-orang-awam)
8. [Konvensi yang Harus Dijaga](#8-konvensi-yang-harus-dijaga)

---

## 1. Gambaran Besar: Bagaimana Aplikasi Ini Hidup

### Analogi bioskop 🎬

Bayangkan aplikasi ini seperti bioskop:

| Bagian bioskop | Di proyek ini |
|---|---|
| **Naskah film** (apa yang terjadi per detik) | `physics-engine/` — menghitung di mana roket berada di setiap momen |
| **Layar & proyektor** | `webgl-engine/` — menggambar 3D: planet, roket, grid |
| **Tiket, subtitle, spanduk** | `ui-dashboard/` — angka telemetri, bar bahan bakar, jam |
| **Sutradara** (mengatur kapan siapa bekerja) | `main.js` — menyatukan semuanya |
| **Gedung bioskop** | Vite + browser — tempat semuanya berjalan |

### Kenapa butuh Vite?

File JavaScript modern memakai `import`/`export` untuk saling terhubung.
Browser memblokir import lintas-folder saat halaman dibuka lewat `file://`
(aturan keamanan bernama *CORS*). Vite adalah **server pengembangan lokal**
yang mengatur itu semua:

```bash
npm run dev     # mode pengembangan — buka http://localhost:5173
npm run build   # merapikan semuanya jadi 3 file di dist/ untuk dipublish
npm run preview # mencoba hasil build
```

> Analogi: Vite seperti dapur. Bahan (`physics-engine/`, dll.) dan resep
> (`main.js`) disiapkan di dapur; pelanggan (browser) hanya menerima hidangan.

---

## 2. physics-engine/ — Otak Fisika

> **Peran folder ini:** menjawab satu pertanyaan berulang-ulang —
> *"Di mana roket berada, dan seberapa cepat, di detik ke-n?"*

### 2.1 `constants.js` — Buku catatan konstanta

Data dasar: kecepatan cahaya `c`, GM Matahari, dan tabel 8 planet
(jarak, massa, radius) yang bersumber dari
[NASA NSSDCA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/).

Bagian yang mudah terlewat: setiap planet mendapat properti *turunan* yang
dihitung otomatis di bawah file:

- `p.r` — jarak ke Matahari (dari semi-major axis, orbit dianggap lingkaran)
- `p.v` — kecepatan orbit (dari vis-viva: `v = √(GM/r)`)
- `p.w` — kecepatan sudut (`ω = v/r`, rad/detik) → dipakai menggambar posisi planet per detik
- `p.soi` — *Sphere of Influence*: wilayah "kewenangan" gravitasi planet.
  Analogi: **radius upeti kerajaan** — di dalam radius ini, gravitasi planet
  lebih dominan daripada gravitasi Matahari. Entry/exit SOI dipakai untuk
  mendeteksi awal/akhir flyby.
- `p.ph` — fase awal tiap planet (dari bujur rata-rata J2000), relatif ke Bumi.
- `p.offRange` — rentang slider titik bidik (berapa "lewat depan/belakang" yang wajar).

### 2.2 `rk4.js` — Mesin penghitung langkah

**Masalah:** gerak roket mengikuti persamaan diferensial (posisi & kecepatan
saling memengaruhi terus-menerus). Komputer tidak bisa menghitung "kontinu" —
hanya bisa melangkah: hitung posisi 1 detik dari sekarang, lalu 2 detik, dst.

**Analogi:** kamu mengemudi buta di jalan berkelok. Kalau cuma merasakan
kemiringan jalan *di posisi sekarang* dan asal jalan lurus (metode Euler),
kamu akan keluar tikungan. **RK4 lebih pintar:** sebelum melangkah, ia
mencicipi kemiringan di **4 titik** (awal, tengah 2×, akhir) lalu
merata-rata tertimbangnya — sehingga tetap berada di jalur walau langkahnya
besar.

```text
k1 = kemiringan di titik awal
k2, k3 = kemiringan di tengah (dengan perkiraan yang makin disempurnakan)
k4 = kemiringan di titik akhir
posisi_baru = posisi + (h/6)·(k1 + 2k2 + 2k3 + k4)
```

Error per langkah RK4 berorder O(h⁵) — orbit elips tetap stabil ratusan
langkah, sedangkan Euler akan spiral keluar.

### 2.3 `gravity.js` — Hukum tarik-menarik

Intinya satu rumus, dipakai berulang:

```
a = −GM / r³ · X
```

Analogi: tarikan gravitasi seperti **lampu sorot yang makin terang makin
dekat** — mendekat 2× berarti tarikan 4× lebih kuat (kebalikan kuadrat).

Tiga fungsi:

| Fungsi | Tugas |
|---|---|
| `planetPosition(i, t, ph)` | Di mana planet ke-i pada waktu t? (orbit lingkaran: `θ = fase + ω·t`) |
| `createForceFunction(planets, ph)` | Membuat "mesin gaya": diberi keadaan roket → kembalikan percepatan total dari Matahari + planet-planet terpilih |
| `computeOrbit(x, y, vx, vy)` | Dari satu keadaan, selidiki bentuk orbitnya: terikat (elips, berapa dekat-jauhnya?) atau lepas (hiperbola)? Ini yang mengisi baris "Orbit akhir" di tab Slingshot. |

### 2.4 `simulation.js` — Naskah lengkap satu misi

Fungsi utama: `simulate({ dv, targetIndex, offset })`. Urutan kerjanya:

1. **Ubah Δv jadi v-infinity.** Burn di LEO menghasilkan laju lepas tertentu (`oberth.js`).
2. **Cari titik potong** orbit roket dengan orbit planet tujuan
   (`sunCross` — simulasi pendek, gravitasi planet tujuan diabaikan dulu).
3. **Geser fase planet** sesuai `offset` (slider titik bidik) — inilah yang
   membuat flyby "lewat depan" atau "lewat belakang".
4. **Integrasi RK4 panjang** dengan *adaptive time stepping*:
   - Langkah `h` menyesuaikan otomatis: di dekat planet (gravitasi berubah
     cepat) langkah mengecil; di ruang antar planet langkah membesar (maks 2 hari/detik-sim).
   - Sementara itu mencatat: posisi, kecepatan, **lag jam relativistik**, entry/exit SOI, closest approach, tabrakan.
5. **Selidiki orbit sebelum vs sesudah flyby** → hitung `dvDirect`: berapa
   Δv yang dibutuhkan *tanpa slingshot* untuk mencapai orbit akhir yang sama.
   Selisih inilah yang ditampilkan sebagai "kecepatan/propelan gratis".

### 2.5 `oberth.js` — Kalkulator hemat bahan bakar

Empat fungsi kecil yang dipakai lintas aplikasi:

- `vInfFromDv(dv)` — berapa laju lepas dari burn di LEO (vis-viva).
- `dvFromVInf(vInf)` — kebalikannya.
- `propellant(dv, isp, mDry)` — Persamaan Tsiolkovsky (lihat §7.4).
- `hohmannDv(planet)` — Δv minimum transfer Hohmann → dipakai untuk
  mengatur batas bawah slider Δv tiap target planet.

### 2.6 `ephemeris-data.js` — Data NASA yang diunduh di muka

Posisi 8 planet pada epoch **J2000** dan **2025** dalam koordinat
heliosentris, hasil JPL Horizons API. Fungsinya sebagai cadangan & referensi:
aplikasi bisa berjalan **offline tanpa internet dan tanpa proksi**.

### 2.7 `horizons-client.js` + `horizons-proxy.js` — Jalur data langsung (opsional)

- `horizons-client.js`: contoh memanggil [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) dengan `fetch` untuk posisi planet real-time.
- `horizons-proxy.js`: server Express kecil yang meneruskan permintaan ke NASA
  dan menambahkan header CORS. **Kenapa perlu?** Browser memblokir fetch ke
  domain lain (keamanan CORS). Jalankan `npm run proxy` jika ingin demo
  data live ke juri; tanpa itu pun simulasi 100% jalan (pakai data lokal).

---

## 3. webgl-engine/ — Panggung Visual

> **Peran folder ini:** mengubah angka-angka fisika menjadi gambar 3D yang
> bisa diputar-putar dengan mouse, 60 kali per detik.

### Konsep dasar Three.js (2 menit)

- **Scene** — "dunia" tempat semua objek hidup.
- **Mesh** — objek (bola planet, silinder roket) = bentuk + bahan (warna/tekstur).
- **Kamera** — mata pengguna; OrbitControls memungkinkan drag-putar-zoom.
- **Render loop** — tiap frame (~16 ms): update posisi → gambar ulang.

### 3.1 `scene-manager.js` — Panggung & pencahayaan

Membuat renderer WebGL, kamera perspektif, kontrol orbit, lampu (ambient +
titik dari arah Matahari), dan otomatis menyesuaikan ukuran layar saat
window di-resize. `sm.render()` dipanggil sekali per frame dari `main.js`.

### 3.2 `celestial-bodies.js` — Para aktor

Pabrik semua benda: **bintang latar** (3000 titik acak), **Matahari**
(bola + sprite pendar), **8 planet** (tekstur pita prosedural untuk
Jupiter/Saturnus, cincin Saturnus, label nama), **roket** (badan, hidung,
sirip, api), dan **dua panah gaya** untuk mode Newton.

Penting: kelas ini hanya **membuat** objek dan menempelkannya ke array
`PLANETS` (`p.mesh`, `p.label`, `p.orbitLine`). Gerakan per frame diatur
`main.js` — pemisahan "aktor" vs "koreografi" memudahkan modifikasi.

### 3.3 `spacetime-grid.js` — Panggung yang melengkung ✨

Bagian paling "Hipster". Grid 900×900 unit dengan **202.500 vertex**, yang
dideformasi di **GPU** — bukan CPU.

**Kenapa GPU?** Menggerakkan 200 ribu titik per frame di JavaScript = lag.
GPU bisa menghitung jutaan operasi paralel. Caranya: tulis program kecil
(*shader*) yang dijalankan **untuk setiap titik sekaligus**:

```glsl
// Vertex shader (disederhanakan) — dijalankan per titik
float dSun    = length(p.xz);                 // jarak ke Matahari
float dPlanet = length(p.xz - uPlanetPos);    // jarak ke planet
float depth = 40.0/sqrt(dSun*dSun+8.0)        // sumur Matahari
            + uPlanetDepth/sqrt(dPlanet*dPlanet+6.0);  // sumur planet
p.y -= uStrength * depth;                     // tarik titik ke bawah
```

**Fragment shader** (per piksel) lalu menggambar garis kisi anti-aliased
(pakai `fwidth()`), memberi gradien warna biru→cyan sesuai kedalaman, dan
glow di sekitar roket.

**Transisi Newton ↔ Einstein:** uniform `uStrength` dianimasikan 0 → 1.
Grid tidak "tertukar" — ia **menggembung perlahan**, persis seperti
perpindahan paradigma yang seharusnya terasa.

> Analogi: vertex shader itu seperti **kartu-kartu statis di stadion**.
> Satu orang (GPU) menyuruh 200 ribu penonton mengangkat kartu sesuai
> kursi masing-masing — semuanya berubah dalam satu ketukan, bukan satu per satu.

### 3.4 `trail-renderer.js` — Jejak roket

Dua garis dari data simulasi: **garis putih redup** (seluruh lintasan,
sebagai "peta masa depan") dan **garis aksen terang** (sejauh mana roket
sudah melalui — diatur `setDrawRange`). Warnanya berubah mengikuti mode:
amber (Newton) atau cyan (Einstein).

---

## 4. ui-dashboard/ — Wajah dan Bicara

### 4.1 `telemetry-panel.js` — Penerjemah angka

Angka fisika mentah berupa meter dan m/detik — tidak ramah manusia. Modul
ini menerjemahkan: `formatMissionTime()` ("398 hari" → "1.09 tahun"),
`formatDistance()` (pilih AU / jt km / rb km otomatis), `formatVelocity()`.

> Prinsip: **konversi unit hanya di sini**, dekat tampilan. Mesin fisika
> selalu SI — mencegah bug "salah satuan" yang klasik (lihat kejadian
> Mars Climate Orbiter 1999 😅).

### 4.2 `fuel-gauge.js` — Cerita dua bar

Membandingkan propelan rute **dengan slingshot** vs **peluncuran langsung**
(dengan energi orbit akhir yang sama) memakai Tsiolkovsky, lalu merender
dua bar horizontal + kalimat penghematan ("Slingshot menghemat X ton (Y%)").

### 4.3 `clock-display.js` — Dua jam yang tidak sinkron

Mode Einstein menampilkan: jam pengamat jauh vs jam roket, selisih (ms), dan
laju perlambatan (ns/detik). Rumusnya pendekatan weak-field:

```
dτ/dt ≈ 1 − Φ/c² − v²/(2c²)
```

Φ = potensial gravitasi total (Matahari + planet tujuan), v = kecepatan
roket. **Analogi:** jam di dasar kolam berlumpur berdetak lebih lambat
daripada di permukaan — dan kolamnya adalah gravitasi. Angkanya nyata
(nanodetik); hanya kedalaman *visual* grid yang dilebih-lebihkan.

### 4.4 `dashboard.html` — Kalkulator standalone

Halaman mandiri (buka langsung via file, pakai Tailwind CDN) untuk
bermain rumus Oberth & Tsiolkovsky di luar simulasi. Berguna saat
presentasi untuk menunjukkan "mengapa burn di dekat planet lebih hemat"
tanpa harus menjalankan aplikasi utama.

### 4.5 `storyboard.md` & `STORYTELLING_GUIDE.md`

Naskah demo 4 menit + panduan narasi untuk kriteria *"Best Use of
Storytelling"*. Bukan kode — tapi sama pentingnya: baca sebelum hari-H.

---

## 5. main.js — Sang Konduktor

Semua logika perekat ada di sini, dalam urutan ini:

1. **Import** dari ketiga folder + Three.js (lihat peta di CONTRIBUTING.md).
2. **Konstruksi scene** — `SceneManager`, `CelestialBodies`, `SpacetimeGrid`, `TrailRenderer`.
3. **Wiring UI** — tab, preset flyby, chip target planet, slider.
4. **`setTarget(i)`** — ganti planet tujuan: sesuaikan slider Δv (dari
   `hohmannDv`), kedalaman sumur grid (proporsional GM), posisi kamera.
5. **`runSim()`** — panggil `simulate()` dari physics-engine, bangun trail,
   isi tab Slingshot & Oberth, gambar sparkline kecepatan.
6. **`frame()`** — loop 60 fps: majukan waktu simulasi (kecepatan warp
   otomatis: lambat dekat planet agar flyby terlihat, cepat di ruang kosong),
   posisikan planet/roket, update panah gaya **atau** jam relativistik
   (tergantung mode), perbarui telemetri, render.

---

## 6. Alur Data: Dari Klik Slider sampai Roket Bergerak

Contoh lengkap — pengguna menggeser slider Δv:

```
[User geser slider #dv]
        │
        ▼
runSim() di main.js                        (event 'input')
        │  baca: dv, offset (m), target
        ▼
simulate({ dv, targetIndex, offset })       physics-engine/simulation.js
        │  RK4 + adaptive step, deteksi flyby
        ▼
R = { T, X, Y, VX, VY, LAG, entry, exit, ca, after, dvDirect, ... }
        │
        ├──► trail.build(R)                 webgl-engine/trail-renderer.js
        ├──► update tab Slingshot + Oberth  (via ui-dashboard format & fuel-gauge)
        └──► drawSpark()                    grafik kecepatan (canvas 2D)

[Setiap frame berikutnya — main.js frame()]
        ├── stateAt(simT)   → interpolasi posisi roket pada waktu k
        ├── pAt(i, simT)    → posisi tiap planet
        ├── grid.update(...)→ geser sumur gravitasi di GPU
        ├── trail.updateProgress(st.i)
        ├── telemetri (formatMissionTime/Distance/Velocity)
        └── sm.render()     → satu frame digambar
```

---

## 7. Konsep Fisika untuk Orang Awam

### 7.1 Dual Mode — dua penjelasan, satu kenyataan

- **Newton:** "Matahari dan planet **menarik** roket." → panah gaya di layar.
- **Einstein:** "Massa **melengkungkan** ruang-waktu; roket hanya berjalan
  lurus mungkin (*geodesik*) di atas permukaan yang melengkung." → grid turun.

Roket mengikuti lintasan **sama persis** di kedua mode. Poin edukasinya:
mode Newton adalah perkiraan yang bekerja untuk perhitungan; mode Einstein
adalah deskripsi yang lebih dalam tentang *apa itu gravitasi*.

### 7.2 Slingshot — meminjam kecepatan planet

Dari kursi penonton planet: roket masuk dan keluar dengan kecepatan **sama**
(pertumburan elastis). Tapi planet itu sendiri sedang bergerak (~13 km/s
untuk Jupiter). Maka dari kursi Matahari, roket bisa keluar **lebih cepat**
— momentum diambil dari orbit planet. Tab Slingshot menampilkan pasangan
angka masuk/keluar (relatif planet vs heliosentris) supaya trik ini terlihat
jelas.

### 7.3 Efek Oberth — burn di tempat tercepat

Energi kinetik KE = ½mv². Setelah burn Δv:

```
ΔKE = ½m(v+Δv)² − ½mv² = m·Δv·(v + Δv/2)
```

Semakin besar `v` saat burn, semakin besar tambahan energi — meskipun Δv-nya
sama. **Analogi:** lempar bola di puncak ayunan (gerak tercepat), bukan di
titik terendah. Karena roket paling cepat di dekat planet/periapsis, itulah
tempat burn paling efisien. Panel Oberth menampilkan rasio efisiensi
(burn di LEO vs burn di luar sumur Bumi).

### 7.4 Tsiolkovsky — matematika rasa malas-malasan roket

```
Δv = Isp · g₀ · ln(m₀/m₁)
```

Analogi: roket membawa bahan bakarnya sendiri, tapi **bahan bakar itu juga
berat**. Mau kecepatan 2× lebih besar? Tidak cukup 2× bahan bakar — butuh
*eksponensial*. Itulah kenapa penghematan Δv dari slingshot begitu berharga:
`propellant()` di `oberth.js` mengubah selisih Δv menjadi ton propelan yang
tidak perlu diluncurkan.

### 7.5 Adaptive time stepping — langkah kecil di tikungan

Sekitar planet, gravitasi berubah tajam → RK4 perlu langkah kecil agar akurat.
Di ruang antar planet, langkah besar aman dan menghemat waktu hitung.
Simulasi memakai skala waktu orbit lokal terpendek (`tau = √(d³/GM)`)
sebagai dasar ukuran langkah: `h = 0.01·tau`, dibatasi 5 detik … 2 hari.

---

## 8. Konvensi yang Harus Dijaga

| Konvensi | Kenapa |
|---|---|
| Satuan SI di `physics-engine/`; konversi unit hanya di UI | Mencegah bug satuan; rumus tetap murni |
| Satu sumber kebenaran — rumus tidak boleh disalin antar folder | Duplikasi = dua rumus berbeda saat diubah orang berbeda |
| Deformasi grid & efek visual berat di **GPU (shader)**, bukan JS | 202.500 vertex per frame mustahil di CPU |
| Adaptive step, bukan langkah tetap | Akurasi dekat planet tanpa simulasi membandel |
| Tidak menambah dependensi tanpa diskusi | Demo hari-H harus stabil; setiap paket = risiko |
| Komentar bahasa Indonesia menjelaskan "kenapa", bukan "apa" | Tim berganti-ganti; konteks lebih penting daripada sintaks |

---

*Terakhir diperbarui bersama refaktor integrasi penuh (main.js meng-import
ketiga folder tanpa duplikasi). Jika mengubah arsitektur, perbarui dokumen
ini di PR yang sama.*
