/**
 * Visualisasi perbandingan bahan bakar — slingshot vs peluncuran langsung.
 */

// Rumus Tsiolkovsky diambil dari physics-engine (satu sumber kebenaran)
import { propellant } from '../physics-engine/oberth.js';

/**
 * Hitung dan render perbandingan bahan bakar.
 * @param {Object} params
 * @param {number} params.dvSlingshot - Δv dengan slingshot (m/s)
 * @param {number} params.dvDirect - Δv peluncuran langsung (m/s)
 * @param {number} params.isp - Impuls spesifik (s)
 * @param {number} params.mDry - Massa kering (kg)
 * @param {Object} elements - DOM elements { barA, barB, fuelA, fuelB, fuelSave, ... }
 */
export function updateFuelGauge({ dvSlingshot, dvDirect, isp, mDry }, elements) {
  const fuelA = propellant(dvSlingshot, isp, mDry);
  const fuelB = propellant(dvDirect, isp, mDry);
  const maxFuel = Math.max(fuelA, fuelB);

  if (elements.barA) elements.barA.style.width = `${(fuelA / maxFuel * 100)}%`;
  if (elements.barB) elements.barB.style.width = `${(fuelB / maxFuel * 100)}%`;

  const fmt = (n) => (n / 1000).toFixed(2);
  if (elements.fuelA) elements.fuelA.textContent = `${fmt(fuelA)} ton`;
  if (elements.fuelB) elements.fuelB.textContent = `${fmt(fuelB)} ton`;

  if (elements.fuelSave) {
    if (fuelB > fuelA) {
      const saved = fuelB - fuelA;
      const pct = ((1 - fuelA / fuelB) * 100).toFixed(0);
      elements.fuelSave.innerHTML = `Slingshot menghemat <b class="accent">${fmt(saved)} ton</b> propelan (${pct}%).`;
    } else {
      elements.fuelSave.innerHTML = `Flyby ini <b class="text-red-300">tidak menguntungkan</b>: peluncuran langsung lebih murah.`;
    }
  }
}
