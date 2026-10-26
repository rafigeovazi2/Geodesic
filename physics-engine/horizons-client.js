/**
 * Client untuk mengambil data ephemeris planet dari JPL Horizons API NASA.
 * 
 * JPL Horizons menyediakan data posisi dan kecepatan (vektor state) untuk
 * semua benda di tata surya. Data ini digunakan untuk menginisialisasi
 * posisi planet yang akurat pada tanggal tertentu.
 * 
 * Dokumentasi API: https://ssd-api.jpl.nasa.gov/doc/horizons.html
 * 
 * ## Parameter Penting
 * - COMMAND: ID benda langit (e.g., '499' = Mars, '599' = Jupiter)
 * - EPHEM_TYPE: 'VECTORS' untuk mendapat posisi XYZ dan kecepatan
 * - CENTER: Titik acuan pengamat (e.g., '500@10' = pusat Matahari)
 * - START_TIME / STOP_TIME: Rentang waktu
 * - STEP_SIZE: Resolusi data
 * 
 * ## ID Benda Langit (COMMAND)
 * 199 = Merkurius    299 = Venus     399 = Bumi      499 = Mars
 * 599 = Jupiter      699 = Saturnus  799 = Uranus    899 = Neptunus
 * 10  = Matahari
 * 
 * ## PENTING: Masalah CORS
 * Browser memblokir permintaan langsung ke ssd.jpl.nasa.gov karena
 * server NASA tidak mengirim header Access-Control-Allow-Origin.
 * Gunakan proksi CORS (lihat horizons-proxy.js dan CORS_GUIDE.md).
 */

// ID benda langit untuk setiap planet
const BODY_IDS = {
  'Merkurius': '199',
  'Venus': '299',
  'Bumi': '399',
  'Mars': '499',
  'Jupiter': '599',
  'Saturnus': '699',
  'Uranus': '799',
  'Neptunus': '899',
};

/**
 * Ambil data vektor posisi/kecepatan planet dari JPL Horizons.
 * 
 * @param {Object} params
 * @param {string} params.body - Nama planet atau COMMAND ID ('499')
 * @param {string} params.startTime - Waktu mulai (format: 'YYYY-MM-DD')
 * @param {string} [params.stopTime] - Waktu akhir (default: startTime + 1 hari)
 * @param {string} [params.stepSize] - Resolusi (default: '1d')
 * @param {string} [params.center] - Pusat referensi (default: '500@10' = Matahari)
 * @param {string} [params.proxyUrl] - URL proksi CORS
 * @returns {Promise<Object>} Data vektor {x, y, z, vx, vy, vz} dalam km dan km/s
 * 
 * @example
 * // Posisi Mars pada 1 Januari 2025, dilihat dari Matahari
 * const mars = await fetchHorizonsVectors({
 *   body: '499',           // atau 'Mars'
 *   startTime: '2025-01-01',
 *   proxyUrl: 'http://localhost:3001/horizons'
 * });
 * console.log(mars);
 * // { x: -2.07e8, y: 5.58e7, z: 6.06e6, vx: -4.35, vy: -18.2, vz: -0.28 }
 */
export async function fetchHorizonsVectors({
  body,
  startTime,
  stopTime = null,
  stepSize = '1d',
  center = '500@10',
  proxyUrl = null,
}) {
  const command = BODY_IDS[body] || body;
  
  if (!stopTime) {
    const d = new Date(startTime);
    d.setDate(d.getDate() + 1);
    stopTime = d.toISOString().slice(0, 10);
  }
  
  // Bangun URL query
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${command}'`,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'VECTORS',
    CENTER: `'${center}'`,
    START_TIME: `'${startTime}'`,
    STOP_TIME: `'${stopTime}'`,
    STEP_SIZE: `'${stepSize}'`,
    VEC_TABLE: '2',           // posisi + kecepatan
    REF_PLANE: 'ECLIPTIC',
    REF_SYSTEM: 'ICRF',
    VEC_LABELS: 'YES',
    CSV_FORMAT: 'NO',
  });
  
  // Tentukan URL target
  const nasaUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
  const fetchUrl = proxyUrl
    ? `${proxyUrl}?${params}`
    : nasaUrl;
  
  console.log(`[Horizons] Fetching ${command} dari ${startTime}...`);
  
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Horizons API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Horizons error: ${data.error}`);
  }
  
  return parseHorizonsResponse(data);
}

/**
 * Parse respons JSON dari Horizons API.
 * Ekstrak vektor posisi dan kecepatan dari blok teks $$SOE...$$EOE.
 */
function parseHorizonsResponse(data) {
  const result = data.result || '';
  
  // Cari blok data antara $$SOE dan $$EOE
  const soeIndex = result.indexOf('$$SOE');
  const eoeIndex = result.indexOf('$$EOE');
  
  if (soeIndex === -1 || eoeIndex === -1) {
    throw new Error('Format respons Horizons tidak dikenali');
  }
  
  const dataBlock = result.slice(soeIndex + 5, eoeIndex).trim();
  const lines = dataBlock.split('\n').map(l => l.trim()).filter(l => l);
  
  const vectors = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Baris Julian Date: "2460676.500000000 = A.D. 2025-Jan-01 00:00:00.0000 TDB"
    if (line.includes('= A.D.') || line.includes('= B.C.')) {
      const jd = parseFloat(line.split('=')[0].trim());
      const dateMatch = line.match(/A\.D\.\s+(\d{4}-\w{3}-\d{2})/);
      
      // Baris berikutnya: X, Y, Z
      const posLine = lines[++i];
      const velLine = lines[++i];
      
      // Parse "X = 1.23E+08  Y = 4.56E+07  Z = 7.89E+05"
      const parseVec = (str) => {
        const vals = {};
        str.replace(/([A-Z]{1,2})\s*=\s*([+-]?\d+\.\d+E[+-]\d+)/g, (_, k, v) => {
          vals[k] = parseFloat(v);
        });
        return vals;
      };
      
      const pos = parseVec(posLine);
      const vel = parseVec(velLine);
      
      vectors.push({
        jd,
        date: dateMatch ? dateMatch[1] : null,
        x: pos.X,   y: pos.Y,   z: pos.Z,    // km
        vx: vel.VX,  vy: vel.VY,  vz: vel.VZ,  // km/s
      });
    }
  }
  
  return vectors.length === 1 ? vectors[0] : vectors;
}

/**
 * Ambil posisi semua planet pada tanggal tertentu.
 * 
 * @param {string} date - Tanggal (format: 'YYYY-MM-DD')
 * @param {string} proxyUrl - URL proksi CORS
 * @returns {Promise<Object>} Map nama planet → vektor
 */
export async function fetchAllPlanets(date, proxyUrl) {
  const results = {};
  
  const promises = Object.entries(BODY_IDS).map(async ([name, id]) => {
    try {
      results[name] = await fetchHorizonsVectors({
        body: id,
        startTime: date,
        proxyUrl,
      });
    } catch (err) {
      console.warn(`[Horizons] Gagal mengambil ${name}: ${err.message}`);
      results[name] = null;
    }
  });
  
  await Promise.all(promises);
  return results;
}
