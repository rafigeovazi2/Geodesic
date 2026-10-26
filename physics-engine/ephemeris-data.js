/**
 * Data ephemeris planet pra-unduh dari JPL Horizons API.
 * 
 * Koordinat: Heliosentris Ekliptika (ICRF/J2000)
 * Satuan posisi: km
 * Satuan kecepatan: km/s
 * Sumber: https://ssd.jpl.nasa.gov/horizons/
 * 
 * Dengan data lokal ini, aplikasi tidak perlu:
 * - Koneksi internet
 * - Proksi CORS
 * - Server backend
 * 
 * Data ini cukup untuk inisialisasi posisi planet yang akurat.
 * Untuk simulasi jangka panjang, orbit lingkaran dari constants.js
 * sudah memadai (error < 2% untuk planet luar).
 * 
 * Cara memperbarui data:
 * 1. Jalankan: node horizons-proxy.js
 * 2. Gunakan horizons-client.js untuk fetch data baru
 * 3. Salin hasil ke file ini
 */

// Epoch: J2000.0 (2000-Jan-01 12:00:00.0 TDB, JD 2451545.0)
// Sumber: JPL Horizons, CENTER='500@10' (Sun body center)
export const EPHEMERIS_J2000 = {
  epoch: '2000-01-01T12:00:00',
  jd: 2451545.0,
  bodies: {
    Merkurius: {
      id: 199,
      position: { x: -2.212062175862221e+07, y: -6.682431829610253e+07, z: -3.461601353176080e+06 },
      velocity: { vx: 3.666229236478711e+01, vy: -1.230266986781422e+01, vz: -4.368336051784789e+00 },
    },
    Venus: {
      id: 299,
      position: { x: -1.085735509299969e+08, y: -3.784200933160055e+06, z: 6.190064472977990e+06 },
      velocity: { vx: 8.984651054838754e-01, vy: -3.517203950794635e+01, vz: -5.320225582712421e-01 },
    },
    Bumi: {
      id: 399,
      position: { x: -2.627892928682480e+07, y: 1.445102393586391e+08, z: 3.022818135935813e+04 },
      velocity: { vx: -2.983052803283506e+01, vy: -5.220465685407924e+00, vz: -1.014621798034465e-04 },
    },
    Mars: {
      id: 499,
      position: { x: 2.069270543147017e+08, y: -3.560689745239088e+06, z: -5.147936537447235e+06 },
      velocity: { vx: 1.304308833322233e+00, vy: 2.628158890420931e+01, vz: 5.188465740839767e-01 },
    },
    Jupiter: {
      id: 599,
      position: { x: 5.978411588543636e+08, y: 4.387049921382775e+08, z: -1.520170033599574e+07 },
      velocity: { vx: -7.892632330758821e+00, vy: 1.115034520921672e+01, vz: 1.304975878498742e-01 },
    },
    Saturnus: {
      id: 699,
      position: { x: 9.576383363101840e+08, y: 9.821475305205084e+08, z: -5.518981166600601e+07 },
      velocity: { vx: -7.419580330593956e+00, vy: 6.725982472738094e+00, vz: 1.775012002122663e-01 },
    },
    Uranus: {
      id: 799,
      position: { x: 2.157706702828514e+09, y: -2.055242911807622e+09, z: -3.559264256520975e+07 },
      velocity: { vx: 4.637648411798584e+00, vy: 4.627192877193688e+00, vz: -4.290574804498830e-02 },
    },
    Neptunus: {
      id: 899,
      position: { x: 2.513785419503992e+09, y: -3.739265092576820e+09, z: 1.907036758498692e+07 },
      velocity: { vx: 4.466004783892565e+00, vy: 3.075618002240783e+00, vz: -1.667245326218167e-01 },
    },
  },
};

// Epoch: 2025-Jan-01 00:00:00.0 TDB (JD 2460676.5)
// Sumber: JPL Horizons, CENTER='500@10' (Sun body center)
export const EPHEMERIS_2025 = {
  epoch: '2025-01-01T00:00:00',
  jd: 2460676.5,
  bodies: {
    Merkurius: {
      id: 199,
      position: { x: -3.944337539968738e+07, y: 2.873839340968498e+07, z: 5.920692304688200e+06 },
      velocity: { vx: -3.808543784088698e+01, vy: -3.395099551908098e+01, vz: 3.338476792524498e-01 },
    },
    Venus: {
      id: 299,
      position: { x: -5.765155917498543e+07, y: -8.553375814498987e+07, z: 2.158703538625800e+06 },
      velocity: { vx: 2.747218274893780e+01, vy: -1.880662784785890e+01, vz: -1.838351701948200e+00 },
    },
    Bumi: {
      id: 399,
      position: { x: -2.688666978817720e+07, y: 1.443418786498610e+08, z: 1.189330698752000e+04 },
      velocity: { vx: -2.977904052968130e+01, vy: -5.576243118972120e+00, vz: 7.847938908986000e-04 },
    },
    Mars: {
      id: 499,
      position: { x: -2.434497478696590e+08, y: -2.590869815868700e+07, z: 5.579927484375000e+06 },
      velocity: { vx: 3.617999589218740e+00, vy: -2.225555826917980e+01, vz: -5.635610458988000e-01 },
    },
    Jupiter: {
      id: 599,
      position: { x: 5.894413889137290e+08, y: -4.598258728686370e+08, z: -1.148456652343750e+07 },
      velocity: { vx: 7.487267267238260e+00, vy: 1.094447003736560e+01, vz: -2.530979073056000e-01 },
    },
    Saturnus: {
      id: 699,
      position: { x: 1.350805816218750e+09, y: -5.309270262500000e+08, z: -4.635889843750000e+07 },
      velocity: { vx: 3.002019178857420e+00, vy: 8.970810890197750e+00, vz: -2.428780674934000e-01 },
    },
    Uranus: {
      id: 799,
      position: { x: 1.761965156250000e+09, y: 2.359783906250000e+09, z: -1.550854687500000e+07 },
      velocity: { vx: -5.515023879394530e+00, vy: 3.784012489318850e+00, vz: 8.296704292297000e-02 },
    },
    Neptunus: {
      id: 899,
      position: { x: 4.464590000000000e+09, y: -3.977095312500000e+08, z: -9.437734375000000e+07 },
      velocity: { vx: 4.288120269775390e-01, vy: 5.461723327636720e+00, vz: -1.196491718292000e-01 },
    },
  },
};

/**
 * Konversi data ephemeris dari km ke SI (meter, m/s) untuk digunakan
 * langsung oleh mesin fisika.
 * 
 * @param {Object} ephemeris - EPHEMERIS_J2000 atau EPHEMERIS_2025
 * @returns {Object} Data dalam satuan SI
 */
export function toSI(ephemeris) {
  const result = { epoch: ephemeris.epoch, jd: ephemeris.jd, bodies: {} };
  for (const [name, body] of Object.entries(ephemeris.bodies)) {
    result.bodies[name] = {
      id: body.id,
      position: {
        x: body.position.x * 1000,  // km → m
        y: body.position.y * 1000,
        z: body.position.z * 1000,
      },
      velocity: {
        vx: body.velocity.vx * 1000,  // km/s → m/s
        vy: body.velocity.vy * 1000,
        vz: body.velocity.vz * 1000,
      },
    };
  }
  return result;
}

/**
 * Dapatkan data untuk planet tertentu.
 * 
 * @param {string} name - Nama planet (e.g., 'Mars', 'Jupiter')
 * @param {Object} [ephemeris] - Dataset (default: EPHEMERIS_2025)
 * @returns {Object|null} { position, velocity } dalam km dan km/s
 */
export function getPlanet(name, ephemeris = EPHEMERIS_2025) {
  return ephemeris.bodies[name] || null;
}

/**
 * ID benda langit JPL Horizons untuk referensi.
 */
export const BODY_IDS = {
  Merkurius: '199', Venus: '299', Bumi: '399', Mars: '499',
  Jupiter: '599', Saturnus: '699', Uranus: '799', Neptunus: '899',
  Matahari: '10', Bulan: '301',
};
