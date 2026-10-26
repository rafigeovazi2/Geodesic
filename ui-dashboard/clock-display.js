/**
 * Tampilan jam relativistik — menunjukkan time dilation.
 * 
 * Rumus (weak field, slow motion approximation):
 * dτ/dt ≈ 1 − Φ/c² − v²/(2c²)
 * 
 * dimana:
 * - Φ = potensial gravitasi (GM/r) — selalu positif
 * - v = kecepatan roket
 * - c = kecepatan cahaya
 * 
 * Jam di dekat massa besar (Φ besar) berdetak lebih LAMBAT.
 * Jam yang bergerak cepat (v besar) juga berdetak lebih LAMBAT.
 */

const c = 299792458;  // kecepatan cahaya (m/s)
const c2 = c * c;

/**
 * Hitung laju relatif jam roket terhadap jam jauh.
 * 
 * @param {number} phi - Total potensial gravitasi di posisi roket (m²/s²)
 *   phi = GM_sun/r_sun + GM_planet/r_planet
 * @param {number} v - Kecepatan roket (m/s)
 * @returns {number} Fraksi perlambatan (misal: 5.2e-9 berarti 5.2 ns per detik)
 */
export function timeDilationRate(phi, v) {
  return phi / c2 + (v * v) / (2 * c2);
}

/**
 * Update tampilan jam di DOM.
 * @param {Object} params
 * @param {number} params.missionTime - Waktu misi (detik)
 * @param {number} params.lag - Total lag kumulatif (detik)
 * @param {number} params.rate - Laju perlambatan saat ini
 * @param {Object} elements - DOM elements
 */
export function updateClockDisplay({ missionTime, lag, rate }, elements) {
  const formatClock = (sec) => {
    const DAY = 86400;
    const d = Math.floor(sec / DAY);
    let r = sec - d * DAY;
    const h = Math.floor(r / 3600); r -= h * 3600;
    const m = Math.floor(r / 60); r -= m * 60;
    const pad = (v) => String(v).padStart(2, '0');
    return `${d}h ${pad(h)}:${pad(m)}:${r.toFixed(3).padStart(6, '0')}`;
  };

  if (elements.cFar) elements.cFar.textContent = formatClock(missionTime);
  if (elements.cRocket) elements.cRocket.textContent = formatClock(missionTime - lag);
  if (elements.cLag) elements.cLag.textContent = `${(lag * 1000).toFixed(1)} ms`;
  if (elements.cRate) elements.cRate.textContent = `${(rate * 1e9).toFixed(1)} ns per detik`;
}
