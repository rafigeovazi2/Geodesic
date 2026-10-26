/**
 * Fungsi percepatan gravitasi untuk simulasi N-body.
 * 
 * Rumus dasar:  a = -GM / r³ · X
 * dimana:
 *   G = konstanta gravitasi
 *   M = massa benda sumber
 *   r = |X| = jarak antara dua benda
 *   X = vektor posisi relatif (dari sumber ke objek)
 *   r³ = r² · √(r²) — lebih efisien dari pow(r, 3)
 * 
 * Tanda negatif menunjukkan percepatan menuju sumber massa,
 * bukan menjauhinya.
 */

import { K, PLANETS, EARTH_INDEX } from './constants.js';

/**
 * Hitung posisi planet pada waktu t (orbit lingkaran).
 * @param {number} planetIndex - Indeks planet di array PLANETS
 * @param {number} t - Waktu (detik)
 * @param {number[]} phases - Array fase awal tiap planet
 * @returns {number[]} [x, y, vx, vy] posisi dan kecepatan planet
 */
export function planetPosition(planetIndex, t, phases) {
  const p = PLANETS[planetIndex];
  const theta = phases[planetIndex] + p.w * t;
  return [
    p.r * Math.cos(theta),        // x
    p.r * Math.sin(theta),        // y
    -p.v * Math.sin(theta),       // vx
    p.v * Math.cos(theta),        // vy
  ];
}

/**
 * Buat fungsi turunan keadaan untuk integrasi RK4.
 * Menghitung gaya gravitasi dari Matahari + planet-planet yang dipilih.
 * 
 * @param {number[]} activePlanets - Indeks planet yang memberikan tarikan gravitasi
 * @param {number[]} phases - Array fase awal tiap planet
 * @returns {Function} f(t, state) → [vx, vy, ax, ay]
 */
export function createForceFunction(activePlanets, phases) {
  return function(t, s) {
    // s = [x, y, vx, vy]
    const x = s[0], y = s[1];
    
    // Percepatan dari Matahari: a = -GMs / r³ · [x, y]
    const rs2 = x * x + y * y;      // r²
    const rs3 = rs2 * Math.sqrt(rs2); // r³ = r² · r
    let ax = -K.GMs * x / rs3;
    let ay = -K.GMs * y / rs3;
    
    // Tambah percepatan dari setiap planet aktif
    for (const i of activePlanets) {
      const p = PLANETS[i];
      const theta = phases[i] + p.w * t;
      
      // Vektor dari planet ke roket
      const dx = x - p.r * Math.cos(theta);
      const dy = y - p.r * Math.sin(theta);
      const d2 = dx * dx + dy * dy;  // jarak²
      const d3 = d2 * Math.sqrt(d2); // jarak³
      
      // a_planet = -GM_planet / d³ · [dx, dy]
      ax -= p.GM * dx / d3;
      ay -= p.GM * dy / d3;
    }
    
    // Turunan: dx/dt = vx, dy/dt = vy, dvx/dt = ax, dvy/dt = ay
    return [s[2], s[3], ax, ay];
  };
}

/**
 * Hitung elemen orbit heliosentris dari posisi dan kecepatan.
 * @param {number} x - Posisi x (m)
 * @param {number} y - Posisi y (m)
 * @param {number} vx - Kecepatan x (m/s)
 * @param {number} vy - Kecepatan y (m/s)
 * @returns {Object} Elemen orbit (energi, semi-major axis, eksentrisitas, dll)
 */
export function computeOrbit(x, y, vx, vy) {
  const r = Math.hypot(x, y);
  const v2 = vx * vx + vy * vy;
  const E = v2 / 2 - K.GMs / r;           // energi spesifik
  const h = x * vy - y * vx;               // momentum sudut spesifik
  
  if (E >= 0) {
    return {
      E,
      escape: true,
      vInfSolar: Math.sqrt(2 * E),         // kecepatan di tak hingga
    };
  }
  
  const a = -K.GMs / (2 * E);              // semi-major axis
  const e = Math.sqrt(Math.max(0, 1 + 2 * E * h * h / (K.GMs * K.GMs)));
  
  return {
    E,
    escape: false,
    a,
    e,
    Q: a * (1 + e),   // apoapsis
    q: a * (1 - e),   // periapsis
    period: 2 * Math.PI * Math.sqrt(a * a * a / K.GMs),
  };
}
