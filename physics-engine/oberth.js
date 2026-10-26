/**
 * Kalkulator Efek Oberth dan Persamaan Roket Tsiolkovsky.
 * 
 * ## Efek Oberth
 * Energi kinetik KE = ½mv². Ketika roket menyalakan mesin saat bergerak
 * di titik tercepat (periapsis), perubahan energi kinetik jauh lebih besar
 * dibanding burn dengan Δv sama di titik lambat.
 * 
 * Contoh: burn 1 km/s saat v = 10 km/s menghasilkan ΔKE = ½m(11²-10²) = 10.5m
 *         burn 1 km/s saat v = 1 km/s menghasilkan ΔKE = ½m(2²-1²) = 1.5m
 *         → 7x lebih efisien!
 * 
 * ## Persamaan Tsiolkovsky
 * Δv = Isp · g₀ · ln(m₀ / m₁)
 * dimana m₀ = massa awal (basah), m₁ = massa akhir (kering)
 */

import { K } from './constants.js';

/**
 * Kecepatan lebih saat lepas dari Bumi (v-infinity) dari burn di LEO.
 * Menggunakan persamaan vis-viva: v² = v_esc² + v_inf²
 * → v_inf = √(v_periapsis² - v_esc²)
 * 
 * @param {number} dv - Delta-v burn di LEO (m/s)
 * @returns {number} v-infinity (m/s), 0 jika tidak cukup untuk escape
 */
export function vInfFromDv(dv) {
  const vp = K.vCirc + dv;
  return vp <= K.vEsc ? 0 : Math.sqrt(vp * vp - K.vEsc * K.vEsc);
}

/**
 * Delta-v di LEO yang dibutuhkan untuk mencapai v-infinity tertentu.
 * Kebalikan dari vInfFromDv.
 * 
 * @param {number} vInf - Target v-infinity (m/s)
 * @returns {number} Delta-v yang dibutuhkan (m/s)
 */
export function dvFromVInf(vInf) {
  return Math.sqrt(vInf * vInf + K.vEsc * K.vEsc) - K.vCirc;
}

/**
 * Massa propelan yang dibutuhkan (Persamaan Tsiolkovsky).
 * 
 * Δv = Isp · g₀ · ln(m₀/m₁)
 * m₀ = m₁ · exp(Δv / (Isp · g₀))
 * massa_propelan = m₀ - m₁ = m₁ · (exp(Δv/(Isp·g₀)) - 1)
 * 
 * @param {number} dv - Delta-v yang dibutuhkan (m/s)
 * @param {number} isp - Impuls spesifik mesin (detik)
 * @param {number} mDry - Massa kering roket (kg)
 * @returns {number} Massa propelan (kg)
 */
export function propellant(dv, isp, mDry) {
  return mDry * (Math.exp(dv / (isp * K.g0)) - 1);
}

/**
 * Δv minimum untuk transfer Hohmann dari LEO ke orbit planet tujuan.
 * 
 * @param {Object} planet - Objek planet dari PLANETS array
 * @returns {number} Δv minimum (m/s)
 */
export function hohmannDv(planet) {
  const vTransfer = K.vE * (Math.sqrt(2 * planet.r / (K.rE + planet.r)) - 1);
  return dvFromVInf(Math.abs(vTransfer));
}

