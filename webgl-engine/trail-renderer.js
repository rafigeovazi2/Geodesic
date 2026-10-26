/**
 * Render lintasan orbit roket — garis penuh (redup) dan garis sudah dilalui (terang).
 */

import * as THREE from 'three';

export class TrailRenderer {
  /**
   * @param {THREE.Scene} scene
   * @param {number} scale - Faktor skala fisika → scene
   */
  constructor(scene, scale) {
    this.scene = scene;
    this.S = scale;
    this.fullLine = null;
    this.doneLine = null;
    this.accentColor = 0xf5a524;
  }

  /**
   * Bangun lintasan dari data simulasi.
   * @param {Object} result - Hasil simulasi { X, Y, T }
   */
  build(result) {
    this.dispose();

    const n = result.T.length;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = result.X[i] * this.S;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = -result.Y[i] * this.S;
    }

    const attr = new THREE.BufferAttribute(pos, 3);

    const g1 = new THREE.BufferGeometry();
    g1.setAttribute('position', attr);
    this.fullLine = new THREE.Line(g1, new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.22
    }));

    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', attr);
    this.doneLine = new THREE.Line(g2, new THREE.LineBasicMaterial({
      color: this.accentColor
    }));

    this.fullLine.frustumCulled = false;
    this.doneLine.frustumCulled = false;
    this.scene.add(this.fullLine, this.doneLine);
  }

  /**
   * Update seberapa jauh lintasan sudah dilalui.
   * @param {number} index - Indeks titik terakhir yang dilalui
   */
  updateProgress(index) {
    if (this.doneLine) {
      this.doneLine.geometry.setDrawRange(0, index + 2);
    }
  }

  /**
   * Ganti warna aksen.
   * @param {number} color - Hex color
   */
  setColor(color) {
    this.accentColor = color;
    if (this.doneLine) {
      this.doneLine.material.color.set(color);
    }
  }

  dispose() {
    [this.fullLine, this.doneLine].forEach(l => {
      if (l) {
        this.scene.remove(l);
        l.geometry.dispose();
      }
    });
    this.fullLine = null;
    this.doneLine = null;
  }
}
