/**
 * Konstanta fisika (SI) dan data orbital planet.
 * Sumber: NASA NSSDCA Planetary Fact Sheet
 * https://nssdc.gsfc.nasa.gov/planetary/factsheet/
 */

export const K = {
  GMs: 1.32712440018e20,    // GM Matahari (m³/s²)
  GMe: 3.986004418e14,      // GM Bumi (m³/s²)
  AU: 1.495978707e11,        // 1 Astronomical Unit (m)
  c: 299792458,              // kecepatan cahaya (m/s)
  g0: 9.80665,               // percepatan gravitasi standar (m/s²)
  Rsun: 6.957e8,             // radius Matahari (m)
  rLEO: 6.671e6,             // radius LEO 300 km (m)
};

// Hitung turunan dari konstanta dasar
K.rE = null;    // diisi setelah PLANETS diinisialisasi
K.vCirc = null;
K.vEsc = null;

/**
 * Data planet tata surya.
 * a: semi-major axis (AU)
 * GM: parameter gravitasi (m³/s²)
 * R: radius ekuatorial (m)
 * L: bujur rata-rata J2000 (derajat)
 * mass: massa (10²⁴ kg) — untuk referensi
 * col: warna hex untuk visualisasi
 * vr: skala visual radius di scene 3D
 */
export const PLANETS = [
  { name: 'Merkurius', a: 0.3871, GM: 2.2032e13,      R: 2.4397e6, L: 252.25, mass: 0.330,  col: 0x9c9085, vr: 0.30 },
  { name: 'Venus',     a: 0.7233, GM: 3.24859e14,     R: 6.0518e6, L: 181.98, mass: 4.87,   col: 0xe3c07a, vr: 0.42 },
  { name: 'Bumi',      a: 1.0000, GM: 3.986004418e14,  R: 6.371e6,  L: 100.46, mass: 5.97,   col: 0x4a90d9, vr: 0.45 },
  { name: 'Mars',      a: 1.5237, GM: 4.282837e13,     R: 3.3895e6, L: 355.43, mass: 0.642,  col: 0xc8553a, vr: 0.36 },
  { name: 'Jupiter',   a: 5.2044, GM: 1.26686534e17,   R: 7.1492e7, L: 34.40,  mass: 1898,   col: 0xd9a066, vr: 1.00 },
  { name: 'Saturnus',  a: 9.5826, GM: 3.7931187e16,    R: 6.0268e7, L: 49.94,  mass: 568,    col: 0xe0c890, vr: 0.85 },
  { name: 'Uranus',    a: 19.2184,GM: 5.793939e15,     R: 2.5559e7, L: 313.23, mass: 86.8,   col: 0x9fe0e6, vr: 0.60 },
  { name: 'Neptunus',  a: 30.11,  GM: 6.836529e15,     R: 2.4764e7, L: 304.88, mass: 102,    col: 0x4f6fe0, vr: 0.60 },
];

export const EARTH_INDEX = 2;
export const DAY = 86400;
export const YEAR = 365.25 * DAY;

// Inisialisasi properti turunan untuk setiap planet
PLANETS.forEach(p => {
  p.r = p.a * K.AU;                                    // jarak ke Matahari (m)
  p.v = Math.sqrt(K.GMs / p.r);                       // kecepatan orbital (m/s)
  p.w = p.v / p.r;                                     // kecepatan sudut (rad/s)
  p.soi = p.r * Math.pow(p.GM / K.GMs, 0.4);          // radius Sphere of Influence (m)
  p.ph = (p.L - PLANETS[EARTH_INDEX].L) * Math.PI / 180;  // fase awal relatif Bumi (rad)
  // Rentang titik bidik flyby
  p.offRange = 16 * p.R * Math.sqrt(1 + (2 * p.GM / p.R) / Math.pow(0.5 * p.v, 2));
});

// Properti turunan global
K.rE = PLANETS[EARTH_INDEX].r;
K.vE = PLANETS[EARTH_INDEX].v;
K.vCirc = Math.sqrt(K.GMe / K.rLEO);     // kecepatan orbit lingkaran LEO
K.vEsc = Math.SQRT2 * K.vCirc;           // kecepatan lepas dari LEO
