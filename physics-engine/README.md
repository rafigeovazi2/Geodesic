# 🔧 Physics Engine — Sistem Fisika & Arsitektur Data

Modul backend yang menangani seluruh perhitungan fisika orbit, integrasi numerik,
dan pengambilan data ephemeris NASA.

## Arsitektur

```
physics-engine/
├── constants.js      # Konstanta fisika (AU, c, data planet)
├── rk4.js            # Integrator Runge-Kutta orde 4
├── gravity.js        # Fungsi percepatan gravitasi N-body
├── simulation.js     # Orkestrator simulasi orbit lengkap
├── oberth.js         # Kalkulator Efek Oberth & Tsiolkovsky
├── ephemeris-data.js # Data posisi planet pra-unduh dari JPL Horizons
├── horizons-proxy.js # Contoh proksi CORS untuk JPL Horizons API
├── horizons-client.js# Fetch API client untuk data ephemeris NASA
├── CORS_GUIDE.md     # Panduan lengkap setup proksi CORS
└── README.md
```

## Modul

### `constants.js`
Konstanta SI dan data orbital 8 planet dari NASA Planetary Fact Sheet (NSSDCA).

### `rk4.js`
Integrator Runge-Kutta orde 4 — mengambil rata-rata tertimbang dari 4 estimasi
gradien (k1–k4) dalam satu time step untuk menjaga stabilitas orbit jangka panjang.

Metode Euler sederhana mengakumulasi error eksponensial dan menyebabkan orbit
diverge. RK4 mempertahankan orbit elips stabil pada simulasi N-body.

**Rumus:**
```
k1 = f(t, y)
k2 = f(t + h/2, y + h·k1/2)
k3 = f(t + h/2, y + h·k2/2)
k4 = f(t + h, y + h·k3)
y_next = y + (h/6)(k1 + 2k2 + 2k3 + k4)
```

### `gravity.js`
Menghitung percepatan gravitasi dengan rumus: **a = -GM/r³ · X**
dimana r = |X| (jarak), X = vektor posisi relatif, dan r³ = r²·√r² untuk efisiensi.

### `simulation.js`
Mengorkestrasikan seluruh simulasi: peluncuran dari LEO, integrasi RK4 dengan
adaptive time stepping, deteksi SOI entry/exit, dan perhitungan time dilation.

### `oberth.js`
Kalkulator Efek Oberth dan persamaan roket Tsiolkovsky.
- **Tsiolkovsky:** Δv = Isp · g₀ · ln(m₀/m₁)
- **Oberth:** KE = ½mv² — burn di periapsis menghasilkan ΔKE lebih besar

### `horizons-client.js`
Contoh penggunaan JavaScript Fetch API untuk menarik data posisi planet aktual
dari JPL Horizons API NASA.

### `horizons-proxy.js`
Server proksi Node.js sederhana untuk mengatasi pemblokiran CORS browser.

### `ephemeris-data.js`
Dataset posisi/kecepatan 8 planet yang sudah diunduh dari JPL Horizons
(epoch J2000 dan 2025). Memungkinkan aplikasi berjalan offline tanpa API
dan tanpa proksi CORS.

## Cara Pakai

```javascript
import { K, PLANETS } from './constants.js';
import { simulate } from './simulation.js';

const result = simulate({
  dv: 6600,         // m/s burn di LEO
  targetIndex: 4,   // Jupiter
  offset: 0.2       // titik bidik
});
// result.T, result.X, result.Y, result.VX, result.VY — array lintasan
```

## Menjalankan Proksi CORS

```bash
cd physics-engine
npm install express node-fetch cors
node horizons-proxy.js
# Server berjalan di http://localhost:3001
```
