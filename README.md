# 🌌 Geodesic - Simulator Ruang-Waktu Interaktif

**NASA Space Apps Challenge**

Platform edukasi web interaktif yang membedah miskonsepsi gravitasi.
Gravitasi **bukan gaya tarik** — melainkan kelengkungan kontinum ruang-waktu.

![Mode](https://img.shields.io/badge/Newton-vs-Einstein-blue)
![Tech](https://img.shields.io/badge/Three.js-WebGL-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Fitur Utama

| Fitur                       | Deskripsi                                                  |
| --------------------------- | ---------------------------------------------------------- |
| **Dual Mode**               | Newton (panah gaya) vs Einstein (grid melengkung)          |
| **Simulasi RK4**            | Integrasi Runge-Kutta orde 4 dengan adaptive time stepping |
| **Gravitational Slingshot** | Flyby planet dengan perhitungan momentum transfer          |
| **Efek Oberth**             | Dashboard KE = ½mv² — burn di periapsis vs apoapsis        |
| **Jam Relativistik**        | Time dilation: dτ/dt ≈ 1 − Φ/c² − v²/(2c²)                 |
| **Bahan Bakar Tsiolkovsky** | Δv = Isp·g₀·ln(m₀/m₁) — perbandingan rute                  |
| **JPL Horizons API**        | Data posisi planet aktual dari NASA                        |
| **GLSL Shaders**            | Deformasi grid di GPU — 200K+ vertex paralel               |

## 📁 Struktur Proyek

```
Geodesic/
├── index.html                # Halaman utama (Vite entry)
├── main.js                   # Entry point — integrasi ketiga folder
├── style.css                 # Styling UI
├── vite.config.js            # Konfigurasi Vite
├── package.json
├── README.md                 # Dokumentasi ini
├── Evaluasi_Ide.md           # Analisis kelayakan proyek
│
├── physics-engine/           # 🔧 Fisika & Arsitektur Data (Backend)
│   ├── constants.js          #   Konstanta SI + data 8 planet NASA
│   ├── rk4.js                #   Integrator Runge-Kutta orde 4
│   ├── gravity.js            #   Percepatan gravitasi N-body
│   ├── simulation.js         #   Orkestrator simulasi + adaptive stepping
│   ├── oberth.js             #   Efek Oberth + Tsiolkovsky
│   ├── ephemeris-data.js     #   Data posisi planet pra-unduh (offline)
│   ├── horizons-client.js    #   Fetch API client JPL Horizons
│   ├── horizons-proxy.js     #   Proksi CORS (Node.js Express)
│   ├── CORS_GUIDE.md         #   Panduan setup proksi CORS
│   └── README.md
│
├── webgl-engine/             # 🎨 Grafis 3D & Sistem Spasial (WebGL)
│   ├── scene-manager.js      #   Renderer, kamera, kontrol, pencahayaan
│   ├── spacetime-grid.js     #   Grid ruang-waktu + GLSL shaders
│   ├── celestial-bodies.js   #   Planet, Matahari, roket, bintang, panah gaya
│   ├── trail-renderer.js     #   Lintasan orbit roket
│   └── README.md
│
└── ui-dashboard/             # 🎯 UI/UX & Storytelling (Hustler)
    ├── dashboard.html        #   Dashboard kalkulator standalone
    ├── telemetry-panel.js    #   Format telemetri real-time
    ├── fuel-gauge.js         #   Visualisasi bahan bakar
    ├── clock-display.js      #   Jam relativistik
    ├── storyboard.md         #   Storyboard presentasi 4 menit
    ├── STORYTELLING_GUIDE.md #   Panduan narasi untuk juri
    └── README.md
```

## 🚀 Cara Menjalankan

### Simulasi Utama (Vite)

```bash
npm install   # sekali saja
npm run dev   # buka http://localhost:5173
npm run build # build produksi → dist/
```

Semua logika di-import langsung dari ketiga folder oleh `main.js` —
satu aplikasi web, satu command untuk menjalankannya.

### Dashboard Kalkulator (Tanpa Install)

```bash
# Buka langsung
ui-dashboard/dashboard.html
```

### Proksi CORS untuk Data NASA (Opsional)

```bash
cd physics-engine
npm install express cors
node horizons-proxy.js
# Server di http://localhost:3001
```

## 🧪 Fisika yang Digunakan

### Integrasi RK4

```
k1 = f(t, y)
k2 = f(t + h/2, y + h·k1/2)
k3 = f(t + h/2, y + h·k2/2)
k4 = f(t + h, y + h·k3)
y_baru = y + (h/6)(k1 + 2k2 + 2k3 + k4)
```

### Percepatan Gravitasi

```
a = -GM/r³ · X
```

### Efek Oberth

```
KE = ½mv²
ΔKE = m · Δv · (v + Δv/2)
Burn di periapsis: v besar → ΔKE besar → lebih efisien
```

### Time Dilation (Weak Field)

```
dτ/dt ≈ 1 − GM/(rc²) − v²/(2c²)
```

## 📊 Data NASA

| Sumber                                                                           | Kegunaan                        |
| -------------------------------------------------------------------------------- | ------------------------------- |
| [NSSDCA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)  | Massa, radius, orbit planet     |
| [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html)               | Posisi aktual planet real-time  |
| [PDS Geosciences](https://pds-geosciences.wustl.edu/dataserv/gravity_models.htm) | Model gravitasi resolusi tinggi |

## 👥 Tim MBGenk

| Peran                      | Fokus                                   | Folder            |
| -------------------------- | --------------------------------------- | ----------------- |
| **Hacker** - Fisika & Data | RK4, N-body, CORS proxy, Horizons API   | `physics-engine/` |
| **Hipster** - Grafis 3D    | Three.js, GLSL shaders                  | `webgl-engine/`   |
| **Hustler** - UI & Cerita  | Dashboard, storytelling, presentasi     | `ui-dashboard/`   |

## 🤝 Berkontribusi

Proyek ini dikerjakan tim — dokumen berikut ditulis ramah untuk anggota baru
(bahkan yang baru pertama kali pakai Git):

| Dokumen | Isi |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cara setup, alur kerja Git, aturan kode, checklist PR |
| [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md) | Penjelasan mendalam tiap file & konsep fisika (dengan analogi awam) |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Kode etik tim |
| Template Issue & PR | Muncul otomatis di tab Issues / New Pull Request |

## 📄 Lisensi

MIT - Dibuat untuk NASA Space Apps Challenge.
