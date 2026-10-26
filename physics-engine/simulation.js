/**
 * Orkestrator simulasi orbit lengkap.
 * Mengintegrasikan lintasan roket dari LEO melewati flyby planet.
 */

import { K, PLANETS, EARTH_INDEX, DAY, YEAR } from './constants.js';
import { rk4 } from './rk4.js';
import { createForceFunction, planetPosition, computeOrbit } from './gravity.js';
import { vInfFromDv, dvFromVInf } from './oberth.js';

/**
 * Cari waktu dan sudut saat roket memotong orbit planet tujuan.
 * (tanpa pengaruh gravitasi planet tujuan)
 */
function sunCross(v0, rTarget, forceFunc) {
  const out = rTarget > K.rE;
  let s = [K.rE, 0, 0, v0], t = 0, r = K.rE;
  
  for (let n = 0; n < 300000 && t < 80 * YEAR; n++) {
    const h = Math.max(5, Math.min(2 * DAY, 0.01 * Math.sqrt(r * r * r / K.GMs)));
    const s2 = rk4(forceFunc, t, s, h);
    const r2 = Math.hypot(s2[0], s2[1]);
    
    if (out ? r2 >= rTarget : r2 <= rTarget) {
      const u = (rTarget - r) / (r2 - r);
      return {
        t: t + u * h,
        ang: Math.atan2(
          s[1] + (s2[1] - s[1]) * u,
          s[0] + (s2[0] - s[0]) * u
        ),
      };
    }
    
    if (n > 20 && (out ? r2 < r : r2 > r)) return null;
    s = s2; r = r2; t += h;
  }
  return null;
}

/**
 * Jalankan simulasi orbit lengkap.
 * 
 * @param {Object} params
 * @param {number} params.dv - Delta-v burn di LEO (m/s)
 * @param {number} params.targetIndex - Indeks planet tujuan
 * @param {number} params.offset - Offset titik bidik (satuan offRange planet)
 * @returns {Object} Hasil simulasi lengkap
 */
export function simulate({ dv, targetIndex, offset }) {
  const P = PLANETS[targetIndex];
  const out = P.r > K.rE;
  const vInf = vInfFromDv(dv);
  
  if (vInf <= 0) return { status: 'bound', vInf };
  
  const v0 = K.vE + (out ? vInf : -vInf);
  const ph = PLANETS.map(p => p.ph);
  
  // Planet yang memberikan tarikan gravitasi (kecuali Bumi, sudah dihitung saat launch)
  const activePlanets = PLANETS.map((_, i) => i).filter(i => i !== EARTH_INDEX);
  
  // Cari titik potong orbit tanpa gravitasi planet tujuan
  const withoutTarget = activePlanets.filter(i => i !== targetIndex);
  const kc = sunCross(v0, P.r, createForceFunction(withoutTarget, ph));
  if (!kc) return { status: 'short', vInf };
  
  // Atur fase planet tujuan berdasarkan titik bidik
  ph[targetIndex] = kc.ang - P.w * kc.t + offset / P.r;
  
  // Fungsi gaya lengkap (semua planet)
  const forceFunc = createForceFunction(activePlanets, ph);
  
  // Laju perlambatan jam relativistik (weak field approximation)
  const clockRate = (s, rj) => {
    return (K.GMs / Math.hypot(s[0], s[1]) + P.GM / rj) / (K.c * K.c) +
           (s[2] * s[2] + s[3] * s[3]) / (2 * K.c * K.c);
  };
  
  // Inisialisasi state
  let t = 0, s = [K.rE, 0, 0, v0], lag = 0;
  const T = [], X = [], Y = [], VX = [], VY = [], LAG = [];
  
  const push = () => {
    T.push(t); X.push(s[0]); Y.push(s[1]);
    VX.push(s[2]); VY.push(s[3]); LAG.push(lag);
  };
  push();
  
  const tEnd = kc.t + Math.max(YEAR, Math.min(12 * YEAR, 1.5 * kc.t));
  let status = 'ok', entry = null, exit = null, ca = { r: Infinity };
  
  const snap = (i) => {
    const j = planetPosition(targetIndex, t, ph);
    const rvx = s[2] - j[2], rvy = s[3] - j[3];
    return {
      t, i,
      vh: Math.hypot(s[2], s[3]),
      vrel: Math.hypot(rvx, rvy),
      rvx, rvy, jvx: j[2], jvy: j[3],
    };
  };
  
  let j0 = planetPosition(targetIndex, 0, ph);
  let rjPrev = Math.hypot(s[0] - j0[0], s[1] - j0[1]);
  
  // Loop integrasi utama dengan adaptive time stepping
  for (let n = 0; n < 400000 && t < tEnd; n++) {
    const rs = Math.hypot(s[0], s[1]);
    
    // Adaptive step: fraksi kecil dari skala waktu orbit lokal terpendek
    let tau = Math.sqrt(rs * rs * rs / K.GMs);
    for (const i of activePlanets) {
      const q = planetPosition(i, t, ph);
      const d = Math.hypot(s[0] - q[0], s[1] - q[1]);
      tau = Math.min(tau, Math.sqrt(d * d * d / PLANETS[i].GM));
    }
    const h = Math.max(5, Math.min(2 * DAY, 0.01 * tau));
    
    const r0 = clockRate(s, rjPrev);
    s = rk4(forceFunc, t, s, h);
    t += h;
    
    const j = planetPosition(targetIndex, t, ph);
    const rj = Math.hypot(s[0] - j[0], s[1] - j[1]);
    lag += h * (r0 + clockRate(s, rj)) / 2;
    
    push();
    const idx = T.length - 1;
    
    if (!entry && rj < P.soi) entry = snap(idx);
    if (entry && !exit && rj > P.soi) exit = snap(idx);
    if (rj < ca.r) ca = Object.assign(snap(idx), { r: rj });
    if (rj < P.R) { status = 'crashP'; break; }
    if (Math.hypot(s[0], s[1]) < K.Rsun) { status = 'crashSun'; break; }
    
    rjPrev = rj;
  }
  
  // Hitung orbit sebelum dan sesudah flyby
  const n = T.length - 1;
  const before = computeOrbit(K.rE, 0, 0, v0);
  const after = computeOrbit(X[n], Y[n], VX[n], VY[n]);
  
  // Delta-v langsung yang memberikan energi orbit sama
  const vNeed = Math.sqrt(Math.max(0, 2 * (after.E + K.GMs / K.rE)));
  const dvDirect = dvFromVInf(Math.abs(vNeed - K.vE));
  
  // Sudut belok flyby
  let turn = null;
  if (entry && exit) {
    turn = Math.acos(Math.max(-1, Math.min(1,
      (entry.rvx * exit.rvx + entry.rvy * exit.rvy) /
      (entry.vrel * exit.vrel)
    )));
  }
  
  return {
    status, ti: targetIndex, P, ph, vInf,
    T, X, Y, VX, VY, LAG,
    entry, exit, ca, before, after,
    dvDirect, turn,
    dvDeep: (K.vEsc - K.vCirc) + vInf,
  };
}
