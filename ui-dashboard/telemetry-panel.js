/**
 * Panel telemetri real-time — menampilkan data misi.
 */

const DAY = 86400;
const YEAR = 365.25 * DAY;
const AU = 1.495978707e11;

/**
 * Format waktu misi menjadi string yang mudah dibaca.
 * @param {number} seconds
 * @returns {string}
 */
export function formatMissionTime(seconds) {
  if (seconds > 2 * YEAR) {
    return `${(seconds / YEAR).toFixed(2)} tahun`;
  }
  return `${(seconds / DAY).toFixed(1)} hari`;
}

/**
 * Format jarak.
 * @param {number} meters
 * @param {string} unit - 'AU', 'km', atau 'auto'
 * @returns {string}
 */
export function formatDistance(meters, unit = 'auto') {
  if (unit === 'AU' || (unit === 'auto' && meters > AU * 0.1)) {
    return `${(meters / AU).toFixed(3)} AU`;
  }
  if (meters < 1e9) {
    return `${(meters / 1e6).toFixed(0)} rb km`;
  }
  return `${(meters / 1e9).toFixed(1)} jt km`;
}

/**
 * Format kecepatan.
 * @param {number} ms - Kecepatan dalam m/s
 * @returns {string}
 */
export function formatVelocity(ms) {
  return `${(ms / 1000).toFixed(2)} km/s`;
}

