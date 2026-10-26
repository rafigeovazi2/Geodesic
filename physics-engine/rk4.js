/**
 * Integrator Runge-Kutta Orde 4 (RK4)
 * 
 * Metode numerik untuk menyelesaikan persamaan diferensial biasa (ODE).
 * Menghitung rata-rata tertimbang dari 4 estimasi gradien (k1-k4)
 * dalam satu rentang waktu (h) untuk mengurangi kesalahan kalkulasi.
 * 
 * Keunggulan dibanding Euler:
 * - Error per step: O(h⁵) vs O(h²)  
 * - Orbit elips tetap stabil dalam jangka panjang
 * - Pendekatan hiperbolik pada slingshot akurat
 * 
 * @param {Function} f - Fungsi turunan: f(t, state) → dState/dt
 *   state = [x, y, vx, vy] → return [vx, vy, ax, ay]
 * @param {number} t - Waktu saat ini (detik)
 * @param {number[]} s - Vektor keadaan [x, y, vx, vy]
 * @param {number} h - Ukuran langkah waktu (detik)
 * @returns {number[]} Vektor keadaan baru setelah satu langkah
 * 
 * Rumus:
 *   k1 = f(t, s)
 *   k2 = f(t + h/2, s + h/2 · k1)
 *   k3 = f(t + h/2, s + h/2 · k2)
 *   k4 = f(t + h, s + h · k3)
 *   s_baru = s + (h/6)(k1 + 2·k2 + 2·k3 + k4)
 */
export function rk4(f, t, s, h) {
  const n = s.length;
  
  // k1 = f(t, s) — gradien di titik awal
  const k1 = f(t, s);
  
  // k2 = f(t + h/2, s + h/2 · k1) — gradien di titik tengah, pakai k1
  const s2 = new Array(n);
  for (let i = 0; i < n; i++) s2[i] = s[i] + k1[i] * h / 2;
  const k2 = f(t + h / 2, s2);
  
  // k3 = f(t + h/2, s + h/2 · k2) — gradien di titik tengah, pakai k2
  const s3 = new Array(n);
  for (let i = 0; i < n; i++) s3[i] = s[i] + k2[i] * h / 2;
  const k3 = f(t + h / 2, s3);
  
  // k4 = f(t + h, s + h · k3) — gradien di titik akhir, pakai k3
  const s4 = new Array(n);
  for (let i = 0; i < n; i++) s4[i] = s[i] + k3[i] * h;
  const k4 = f(t + h, s4);
  
  // Rata-rata tertimbang: (k1 + 2k2 + 2k3 + k4) / 6
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = s[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  
  return result;
}
/**
 * Catatan adaptive time stepping:
 * Simulasi (simulation.js) menggunakan adaptive step berbasis skala waktu
 * orbit lokal terpendek (tau), bukan estimator error RK4 ganda — lebih cepat
 * dan cukup akurat untuk orbit N-body yang dihadapi.
 */
