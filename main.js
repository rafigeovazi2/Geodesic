/**
 * main.js — Entry point Geodesik
 *
 * Mengintegrasikan ketiga folder:
 *   physics-engine/  → simulasi orbit (RK4, adaptive step), Oberth, Tsiolkovsky
 *   webgl-engine/    → SceneManager, objek tata surya, grid ruang-waktu, trail
 *   ui-dashboard/    → telemetri, jam relativistik, fuel gauge
 */

// ── physics-engine ──────────────────────────────────────────
import { K, PLANETS, EARTH_INDEX, DAY } from './physics-engine/constants.js';
import { simulate } from './physics-engine/simulation.js';
import { vInfFromDv, hohmannDv } from './physics-engine/oberth.js';

// ── ui-dashboard ────────────────────────────────────────────
import { formatMissionTime, formatDistance, formatVelocity } from './ui-dashboard/telemetry-panel.js';
import { updateFuelGauge } from './ui-dashboard/fuel-gauge.js';
import { updateClockDisplay, timeDilationRate } from './ui-dashboard/clock-display.js';

// ── webgl-engine ────────────────────────────────────────────
import { SceneManager } from './webgl-engine/scene-manager.js';
import { CelestialBodies } from './webgl-engine/celestial-bodies.js';
import { SpacetimeGrid } from './webgl-engine/spacetime-grid.js';
import { TrailRenderer } from './webgl-engine/trail-renderer.js';

// ── three.js (dari node_modules via Vite) ───────────────────
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════
//  SCENE (webgl-engine)
// ═══════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);
const fmt = (n, d = 2) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const SC = 10 / K.AU;
const V3 = (x, y) => new THREE.Vector3(x * SC, 0, -y * SC);

// Renderer, scene, kamera, kontrol, pencahayaan → webgl-engine/scene-manager.js
const sm = new SceneManager($('scene'));
const scene = sm.scene, camera = sm.camera, controls = sm.controls;

// Matahari, planet, roket, panah gaya → webgl-engine/celestial-bodies.js
const bodies = new CelestialBodies(scene, PLANETS, SC);
const sun = bodies.sun, rocket = bodies.rocket;
const arrowS = bodies.arrowSun, arrowJ = bodies.arrowPlanet;

// Grid ruang-waktu GLSL → webgl-engine/spacetime-grid.js
const grid = new SpacetimeGrid(scene);

// Lintasan roket → webgl-engine/trail-renderer.js
const trail = new TrailRenderer(scene, SC);

// ═══════════════════════════════════════════════════════════
//  APPLICATION STATE & UI WIRING
// ═══════════════════════════════════════════════════════════

let R = null, simT = 0, playing = true, mode = 'newton', focusName = 'sun';
let rel = null;
const lastFocus = new THREE.Vector3();
let BASE = 90, target = 4;

// Tab system
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    $('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// Presets
[
  { name: 'Lewat belakang, jauh', off: 0.55 },
  { name: 'Lewat belakang, dekat', off: 0.2 },
  { name: 'Lewat depan, dekat', off: -0.2 },
  { name: 'Lewat depan, jauh', off: -0.55 },
  { name: 'Bidik tepat', off: 0 }
].forEach(p => {
  const b = document.createElement('button'); b.className = 'chip'; b.textContent = p.name;
  b.onclick = () => { $('off').value = p.off; runSim(); };
  $('presets').appendChild(b);
});

// Planet targets
PLANETS.forEach((p, i) => {
  if (i === EARTH_INDEX) return;
  const b = document.createElement('button'); b.className = 'chip'; b.textContent = p.name; b.dataset.i = i;
  b.onclick = () => setTarget(i);
  $('targets').appendChild(b);
});

function setTarget(i) {
  target = i; const P = PLANETS[i];
  document.querySelectorAll('.tn').forEach(e => e.textContent = P.name);
  document.querySelectorAll('#targets button').forEach(b => b.classList.toggle('sel', +b.dataset.i === i));
  const h = Math.ceil((hohmannDv(P) / 1000 + 0.02) * 100) / 100;
  $('dv').min = h.toFixed(2); $('dv').max = (h + 1.8).toFixed(2); $('dv').value = (h + 0.3).toFixed(2);
  $('off').value = 0.2;
  PLANETS.forEach((p, k) => { p.orbitLine.material.opacity = k === i ? 0.75 : k === EARTH_INDEX ? 0.55 : 0.25; });
  grid.setPlanetDepth(clamp(6 * Math.pow(P.GM / 1.26686534e17, 0.3), 0.8, 6));
  focusName = 'sun'; $('focus').value = 'sun';
  const d = clamp(Math.max(P.a, 1) * 10 * 2.4, 40, 800);
  controls.target.set(0, 0, 0); camera.position.set(0, d * 0.67, d * 0.74); lastFocus.set(0, 0, 0);
  runSim();
}

const pAt = (i, t) => { const p = PLANETS[i], th = R.ph[i] + p.w * t; return [p.r * Math.cos(th), p.r * Math.sin(th)]; };
const jAt = t => pAt(R.ti, t);

function stateAt(t) {
  const T = R.T; let lo = 0, hi = T.length - 1;
  t = clamp(t, 0, T[hi]);
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= t) lo = m; else hi = m; }
  const u = T[hi] > T[lo] ? (t - T[lo]) / (T[hi] - T[lo]) : 0;
  const L = A => A[lo] + (A[hi] - A[lo]) * u;
  const x = L(R.X), y = L(R.Y), vx = L(R.VX), vy = L(R.VY), j = jAt(t);
  return { t, i: lo, x, y, vx, vy, lag: L(R.LAG), jx: j[0], jy: j[1], rs: Math.hypot(x, y), rj: Math.hypot(x - j[0], y - j[1]), v: Math.hypot(vx, vy) };
}

function destName(o) {
  if (o.escape) return `Lepas dari tata surya (${fmt(o.vInfSolar / 1000, 1)} km/s)`;
  if (o.Q / K.AU > 500) return `Nyaris lepas: titik terjauh >500 AU`;
  return `${fmt(o.q / K.AU, 2)} – ${fmt(o.Q / K.AU, 2)} AU`;
}

function runSim() {
  const P = PLANETS[target], dv = +$('dv').value, off = +$('off').value * P.offRange;
  $('dvVal').textContent = fmt(dv);
  $('offVal').textContent = (off > 0 ? '+' : '') + fmt(off / 1e6, 0);

  // physics-engine/simulation.js
  R = simulate({ dv: dv * 1000, targetIndex: target, offset: off });
  const banner = $('banner'); banner.classList.add('hidden');
  if (!R.T) { banner.textContent = `Δv terlalu kecil: roket tidak sampai ke orbit ${P.name}.`; banner.classList.remove('hidden'); return; }
  if (R.status === 'crashP') { banner.textContent = `Roket menabrak ${P.name}. Geser titik bidik.`; banner.classList.remove('hidden'); }
  if (R.status === 'crashSun') { banner.textContent = 'Roket jatuh ke Matahari.'; banner.classList.remove('hidden'); }
  trail.build(R);

  rel = null;
  if (R.entry) {
    const W = clamp(3 * R.ca.r, 12 * P.R, 400 * P.R), xs = [], ys = [], ts = [];
    const i0 = R.entry.i, i1 = R.exit ? R.exit.i : R.T.length - 1;
    for (let i = i0; i <= i1; i++) {
      const j = jAt(R.T[i]); const dx = R.X[i] - j[0], dy = R.Y[i] - j[1];
      if (Math.abs(dx) < W * 1.6 && Math.abs(dy) < W * 1.2) { xs.push(dx); ys.push(dy); ts.push(R.T[i]); }
    }
    rel = { W, xs, ys, ts };
  }

  const e = R.entry, x = R.exit;
  $('rPeri').textContent = e ? `${fmt(R.ca.r / P.R, 1)} radius (${fmt(R.ca.r / 1e6, 0)} rb km)` : 'tidak ada flyby';
  $('rTurn').textContent = R.turn != null ? `${fmt(R.turn * 180 / Math.PI, 1)}°` : '-';
  $('rRel').textContent = e && x ? `${fmt(e.vrel / 1000)} / ${fmt(x.vrel / 1000)} km/s` : '-';
  $('rHel').textContent = e && x ? `${fmt(e.vh / 1000)} / ${fmt(x.vh / 1000)} km/s` : '-';
  $('rGain').textContent = e && x ? `${x.vh >= e.vh ? '+' : ''}${fmt((x.vh - e.vh) / 1000)} km/s` : '-';
  $('rDest').textContent = R.status === 'ok' ? destName(R.after) : '-';
  $('insetNote').textContent = e && x
    ? `Dari sudut pandang ${P.name}, roket masuk dan keluar dengan laju hampir sama (${fmt(e.vrel / 1000)} dan ${fmt(x.vrel / 1000)} km/s). Perubahan kecepatan thd Matahari datang dari orbit ${P.name} (${fmt(P.v / 1000, 1)} km/s).`
    : `Roket tidak masuk wilayah gravitasi ${P.name}.`;
  $('obLow').textContent = `${fmt(dv)} km/s`;
  $('obHigh').textContent = `${fmt(R.dvDeep / 1000)} km/s`;
  updateOberthDetail(dv * 1000);
  updateFuel(); drawSpark();
  BASE = R.T[R.T.length - 1] / DAY / 40;
  simT = 0; playing = true; $('play').textContent = 'Jeda';
}

function updateOberthDetail(dv) {
  $('obVleo').textContent = `${fmt(K.vCirc / 1000, 2)} km/s`;
  $('obVesc').textContent = `${fmt(K.vEsc / 1000, 2)} km/s`;
  $('obVinf').textContent = `${fmt(vInfFromDv(dv) / 1000, 2)} km/s`;
  const keLeo = 0.5 * K.vCirc * K.vCirc;
  const keAfter = 0.5 * (K.vCirc + dv) * (K.vCirc + dv);
  $('obKeLeo').textContent = `${fmt(keLeo / 1e6, 1)} MJ/kg`;
  $('obKeAfter').textContent = `${fmt(keAfter / 1e6, 1)} MJ/kg`;
  $('obEfficiency').textContent = `${fmt((keAfter - keLeo) / (0.5 * dv * dv), 1)}×`;
}

function updateFuel() {
  const m = +$('mdry').value, isp = +$('isp').value, dv = +$('dv').value * 1000;
  $('mVal').textContent = fmt(m, 0); $('ispVal').textContent = fmt(isp, 0);
  if (!R || !R.T) return;

  // Uses ui-dashboard/fuel-gauge.js
  updateFuelGauge(
    { dvSlingshot: dv, dvDirect: R.dvDirect, isp, mDry: m },
    { barA: $('barA'), barB: $('barB'), fuelA: $('fuelA'), fuelB: $('fuelB'), fuelSave: $('fuelSave') }
  );
  $('fuelAdv').textContent = `Δv ${fmt(dv / 1000)} km/s`;
  $('fuelBdv').textContent = R.status === 'ok' ? `Δv ${fmt(R.dvDirect / 1000)} km/s` : '-';
}

// ── Sparkline ───────────────────────────────────────────────
const sparkCache = document.createElement('canvas'); sparkCache.width = 560; sparkCache.height = 150;
function drawSpark() {
  const g = sparkCache.getContext('2d'), W = 560, H = 150, n = R.T.length, tMax = R.T[n - 1];
  g.clearRect(0, 0, W, H);
  let vmax = 0; for (let i = 0; i < n; i++) vmax = Math.max(vmax, Math.hypot(R.VX[i], R.VY[i]));
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.fillStyle = '#7c8aa5'; g.font = '18px JetBrains Mono, monospace';
  for (let v = 10e3; v < vmax; v += 10e3) { const y = H - 8 - v / vmax * (H - 20); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.fillText(v / 1000 + ' km/s', 6, y - 4); }
  g.strokeStyle = mode === 'einstein' ? '#4fd8ff' : '#f5a524'; g.lineWidth = 2.5; g.beginPath();
  for (let i = 0; i < n; i++) { const x = R.T[i] / tMax * W, y = H - 8 - Math.hypot(R.VX[i], R.VY[i]) / vmax * (H - 20); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
}
function paintSpark() {
  const c = $('spark'), g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height); g.drawImage(sparkCache, 0, 0);
  const x = simT / R.T[R.T.length - 1] * c.width;
  g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, c.height); g.stroke();
}

// ── Flyby inset ─────────────────────────────────────────────
function paintInset(st) {
  const c = $('inset'), g = c.getContext('2d'), W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  g.font = '20px JetBrains Mono, monospace'; g.fillStyle = '#7c8aa5';
  if (!rel) { g.fillText('Tidak ada flyby', 20, 40); return; }
  const k = (H / 2) / rel.W, px = x => W / 2 + x * k, py = y => H / 2 - y * k;
  g.fillStyle = '#' + R.P.col.toString(16).padStart(6, '0');
  g.beginPath(); g.arc(W / 2, H / 2, Math.max(3, R.P.R * k), 0, 7); g.fill();
  const draw = (upTo, style, lw) => {
    g.strokeStyle = style; g.lineWidth = lw; g.beginPath(); let started = false;
    for (let i = 0; i < rel.xs.length && rel.ts[i] <= upTo; i++) {
      const X = px(rel.xs[i]), Y = py(rel.ys[i]);
      started ? g.lineTo(X, Y) : g.moveTo(X, Y); started = true;
    } g.stroke();
  };
  draw(Infinity, 'rgba(255,255,255,.3)', 2);
  draw(simT, mode === 'einstein' ? '#4fd8ff' : '#f5a524', 3);
  const dx = st.x - st.jx, dy = st.y - st.jy;
  if (Math.abs(dx) < rel.W * 1.6 && Math.abs(dy) < rel.W * 1.2) {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(px(dx), py(dy), 5, 0, 7); g.fill();
  }
  const n = Math.hypot(R.ca.jvx, R.ca.jvy), ux = R.ca.jvx / n, uy = R.ca.jvy / n, ax = 60, ay = H - 50;
  g.strokeStyle = '#ff9f5a'; g.fillStyle = '#ff9f5a'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + ux * 40, ay - uy * 40); g.stroke();
  g.beginPath(); g.arc(ax + ux * 40, ay - uy * 40, 4, 0, 7); g.fill();
  g.fillStyle = '#7c8aa5';
  g.fillText('arah gerak ' + R.P.name, 20, H - 14);
  g.fillText(`lebar jendela ${fmt(rel.W * 2 * (W / H) / 1e6, 0)} rb km`, 20, 28);
}

// ═══════════════════════════════════════════════════════════
//  MODE TOGGLE
// ═══════════════════════════════════════════════════════════

const MODE_TEXT = {
  newton: 'Gravitasi adalah <b>gaya tarik</b>. Matahari dan planet menarik roket dengan gaya yang makin besar ketika jaraknya makin dekat. Ruang hanyalah panggung datar.',
  einstein: 'Tidak ada gaya. Massa <b>melengkungkan ruang-waktu</b>, dan roket bergerak selurus mungkin (geodesik) di geometri yang melengkung. Makin dalam di sumur, makin lambat jamnya.'
};

function setMode(m) {
  mode = m;
  grid.setMode(m);
  $('btnNewton').classList.toggle('on', m === 'newton');
  $('btnEinstein').classList.toggle('on', m === 'einstein');
  document.documentElement.style.setProperty('--accent', m === 'newton' ? '#f5a524' : '#4fd8ff');
  $('modeText').innerHTML = MODE_TEXT[m];
  $('telNewton').classList.toggle('hidden', m !== 'newton');
  $('telEinstein').classList.toggle('hidden', m !== 'einstein');
  arrowS.visible = arrowJ.visible = m === 'newton';
  trail.setColor(m === 'newton' ? 0xf5a524 : 0x4fd8ff);
  if (R && R.T) drawSpark();
}
$('btnNewton').onclick = () => setMode('newton');
$('btnEinstein').onclick = () => setMode('einstein');

// ═══════════════════════════════════════════════════════════
//  CONTROLS
// ═══════════════════════════════════════════════════════════

function focusPos() {
  return focusName === 'rocket' ? rocket.position : focusName === 'target' ? PLANETS[target].mesh.position : sun.position;
}
$('focus').onchange = ev => {
  focusName = ev.target.value;
  const off = camera.position.clone().sub(controls.target);
  off.setLength(focusName === 'sun' ? clamp(Math.max(PLANETS[target].a, 1) * 24, 40, 800) : 16);
  const fp = focusPos(); controls.target.copy(fp); camera.position.copy(fp).add(off); lastFocus.copy(fp);
};

['dv', 'off'].forEach(id => $(id).addEventListener('input', runSim));
['mdry', 'isp'].forEach(id => $(id).addEventListener('input', updateFuel));
$('play').onclick = () => {
  if (!playing && R.T && simT >= R.T[R.T.length - 1]) simT = 0;
  playing = !playing; $('play').textContent = playing ? 'Jeda' : 'Putar';
};
$('reset').onclick = () => { simT = 0; playing = true; $('play').textContent = 'Jeda'; };
$('scrub').addEventListener('input', ev => {
  if (!R.T) return; playing = false; $('play').textContent = 'Putar';
  simT = ev.target.value / 1000 * R.T[R.T.length - 1];
});

// ═══════════════════════════════════════════════════════════
//  RENDER LOOP
// ═══════════════════════════════════════════════════════════

const UP = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;

  if (R && R.T) {
    const tMax = R.T[R.T.length - 1];
    let st = stateAt(simT);

    if (playing) {
      const warp = BASE * +$('speed').value * clamp((st.rj / R.P.soi) ** 2, 0.002, 1);
      simT += dt * warp * DAY;
      $('warp').textContent = warp >= 1 ? `${fmt(warp, 0)} hari/dtk` : `${fmt(warp * 24, 1)} jam/dtk`;
      if (simT >= tMax) { simT = tMax; playing = false; $('play').textContent = 'Putar'; }
      $('scrub').value = simT / tMax * 1000;
      st = stateAt(simT);
    }

    // Planet positions
    PLANETS.forEach((p, i) => {
      const q = pAt(i, simT); p.mesh.position.copy(V3(q[0], q[1])); p.mesh.rotation.y += dt * 0.4;
      const sc = Math.max(1, camera.position.distanceTo(p.mesh.position) * 0.007 / p.vr);
      p.mesh.scale.setScalar(sc);
      p.label.position.copy(p.mesh.position).y += p.vr * sc * 1.9;
      p.label.visible = i === R.ti || camera.position.distanceTo(p.mesh.position) < p.a * 10 * 18;
    });

    sun.scale.setScalar(Math.max(1, camera.position.length() * 0.006));
    rocket.position.copy(V3(st.x, st.y));
    tmp.set(st.vx, 0, -st.vy).normalize();
    rocket.quaternion.setFromUnitVectors(UP, tmp);
    const rsc = clamp(camera.position.distanceTo(rocket.position) * 0.022, 0.3, 5);
    rocket.scale.setScalar(rsc);
    trail.updateProgress(st.i);

    const aS = K.GMs / (st.rs * st.rs), aJ = R.P.GM / (st.rj * st.rj), m = +$('mdry').value;

    if (mode === 'newton') {
      const len = a => clamp(2 + 1.3 * (Math.log10(a) + 7), 0.6, 14) * rsc * 0.6;
      arrowS.position.copy(rocket.position);
      arrowS.setDirection(tmp.copy(sun.position).sub(rocket.position).normalize());
      arrowS.setLength(len(aS), rsc * 0.5, rsc * 0.25);
      arrowJ.position.copy(rocket.position);
      arrowJ.setDirection(tmp.copy(R.P.mesh.position).sub(rocket.position).normalize());
      arrowJ.setLength(len(aJ), rsc * 0.5, rsc * 0.25);
      $('fSun').textContent = `${fmt(aS * m, 2)} N`;
      $('fJup').textContent = aJ * m >= 0.01 ? `${fmt(aJ * m, 2)} N` : `${(aJ * m).toExponential(1)} N`;
    } else {
      // Uses ui-dashboard/clock-display.js
      const phi = K.GMs / st.rs + R.P.GM / st.rj;
      const rate = timeDilationRate(phi, st.v);
      updateClockDisplay(
        { missionTime: simT, lag: st.lag, rate },
        { cFar: $('cFar'), cRocket: $('cRocket'), cLag: $('cLag'), cRate: $('cRate') }
      );
    }

    // Telemetry (uses ui-dashboard/telemetry-panel.js)
    $('tMission').textContent = formatMissionTime(simT);
    $('tRs').textContent = formatDistance(st.rs, 'AU');
    $('tRj').textContent = formatDistance(st.rj, 'auto');
    $('tV').textContent = formatVelocity(st.v);

    // Grid ruang-waktu (webgl-engine/spacetime-grid.js)
    grid.update({
      planet: { x: R.P.mesh.position.x, z: R.P.mesh.position.z },
      rocket: { x: rocket.position.x, z: rocket.position.z },
    });
    paintInset(st); paintSpark();
  }

  grid.animate(dt);

  const fp = focusPos();
  tmp.copy(fp).sub(lastFocus);
  camera.position.add(tmp); controls.target.add(tmp); lastFocus.copy(fp);
  sm.render();
}

// ═══════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════

setMode('newton');
setTarget(4);
updateFuel();
requestAnimationFrame(frame);
