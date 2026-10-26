/**
 * Objek tata surya: Matahari, planet, roket, bintang latar.
 */

import * as THREE from 'three';

/**
 * Buat canvas texture prosedural.
 */
function canvasTex(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawFn(c.getContext('2d'), w, h);
  return new THREE.CanvasTexture(c);
}

/**
 * Buat label text sebagai sprite.
 */
function createLabel(text, color = '#93a1b8') {
  const tex = canvasTex(256, 64, (g) => {
    g.font = '500 30px Space Grotesk, sans-serif';
    g.fillStyle = color;
    g.textAlign = 'center';
    g.fillText(text, 128, 42);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, sizeAttenuation: false
  }));
  sp.scale.set(0.14, 0.035, 1);
  return sp;
}

/**
 * Buat tekstur pita planet gas raksasa.
 */
function bandTexture(bands, spotColor) {
  return canvasTex(256, 128, (g, w, h) => {
    bands.forEach((c, i) => {
      g.fillStyle = c;
      g.fillRect(0, i * h / bands.length, w, h / bands.length + 1);
    });
    if (spotColor) {
      g.fillStyle = spotColor;
      g.beginPath();
      g.ellipse(170, 82, 16, 8, 0, 0, 7);
      g.fill();
    }
  });
}

export class CelestialBodies {
  /**
   * @param {THREE.Scene} scene
   * @param {Object[]} planetsData - Array data planet dari constants.js
   * @param {number} scale - Faktor skala (1 AU = berapa unit scene)
   */
  constructor(scene, planetsData, scale = 10 / 1.495978707e11) {
    this.scene = scene;
    this.planets = planetsData;
    this.S = scale;
    
    this._createStars();
    this._createSun();
    this._createPlanets();
    this._createRocket();
    this._createArrows();
  }

  _createStars() {
    const n = 2500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const q = Math.sqrt(1 - u * u);
      const v = new THREE.Vector3(q * Math.cos(a), u, q * Math.sin(a)).multiplyScalar(2500);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      color: 0x9fb0d0, size: 1.6, sizeAttenuation: false,
      transparent: true, opacity: 0.7
    })));
  }

  _createSun() {
    this.sun = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd98a })
    );
    this.scene.add(this.sun);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: canvasTex(128, 128, (g) => {
        const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
        gr.addColorStop(0, 'rgba(255,220,150,.9)');
        gr.addColorStop(.3, 'rgba(255,180,80,.25)');
        gr.addColorStop(1, 'rgba(255,160,60,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      }),
      blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true
    }));
    glow.scale.set(16, 16, 1);
    this.scene.add(glow);
  }

  _createPlanets() {
    const TEX = {
      Jupiter: bandTexture(
        ['#c9a27a','#e6d2b5','#b98556','#ead9c0','#a8683f','#e2c9a4','#c08f62','#ecdcc6','#b47a4c','#d9bd98'],
        '#a8492c'
      ),
      Saturnus: bandTexture(
        ['#d8c08a','#eadbb0','#cdb27a','#efe2bd','#c9ab72','#e6d5a6','#d2b983','#ecdcb4']
      ),
    };

    this.planets.forEach((p, i) => {
      const matOpts = TEX[p.name]
        ? { map: TEX[p.name], roughness: 0.9 }
        : { color: p.col, roughness: 0.85 };

      p.mesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.vr, 32, 32),
        new THREE.MeshStandardMaterial(matOpts)
      );

      // Cincin Saturnus
      if (p.name === 'Saturnus') {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(p.vr * 1.35, p.vr * 2.2, 64),
          new THREE.MeshBasicMaterial({
            color: 0xd9c79a, side: THREE.DoubleSide,
            transparent: true, opacity: 0.65
          })
        );
        ring.rotation.x = -Math.PI / 2 + 0.35;
        p.mesh.add(ring);
      }

      this.scene.add(p.mesh);

      // Label nama
      p.label = createLabel(p.name, '#' + p.col.toString(16).padStart(6, '0'));
      this.scene.add(p.label);

      // Orbit ring
      const pts = [];
      for (let j = 0; j <= 256; j++) {
        const a = j / 256 * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * p.a * 10, 0, Math.sin(a) * p.a * 10));
      }
      p.orbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: p.col, transparent: true, opacity: 0.3 })
      );
      this.scene.add(p.orbitLine);
    });
  }

  _createRocket() {
    this.rocket = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.7, 16),
      new THREE.MeshStandardMaterial({ color: 0xe9edf5, roughness: 0.4, metalness: 0.3 })
    );
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.32, 16),
      new THREE.MeshStandardMaterial({ color: 0xf5a524, roughness: 0.5 })
    );
    nose.position.y = 0.51;
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.4, 12),
      new THREE.MeshBasicMaterial({ color: 0x66d9ff, transparent: true, opacity: 0.8 })
    );
    flame.rotation.x = Math.PI; flame.position.y = -0.55;
    this.rocket.add(body, nose, flame);

    // Sirip roket
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.22, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xf5a524 })
      );
      const a = i * Math.PI * 2 / 3;
      fin.position.set(Math.sin(a) * 0.18, -0.26, Math.cos(a) * 0.18);
      fin.rotation.y = a;
      this.rocket.add(fin);
    }

    // Titik penanda jarak jauh
    const dot = new THREE.Sprite(new THREE.SpriteMaterial({
      map: canvasTex(64, 64, (g) => {
        const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
        gr.addColorStop(0, 'rgba(255,255,255,.9)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      }),
      depthTest: false, transparent: true
    }));
    dot.scale.set(1.2, 1.2, 1);
    this.rocket.add(dot);

    this.scene.add(this.rocket);
  }

  _createArrows() {
    this.arrowSun = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xffd27a
    );
    this.arrowPlanet = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xff9f5a
    );
    this.scene.add(this.arrowSun, this.arrowPlanet);
  }

  /**
   * Konversi koordinat fisika (m) ke koordinat scene.
   */
  toScene(x, y) {
    return new THREE.Vector3(x * this.S, 0, -y * this.S);
  }

  /**
   * Update posisi semua benda pada waktu simulasi t.
   */
  updatePositions(t, phases, rocketState, cameraPos) {
    const UP = new THREE.Vector3(0, 1, 0);
    const tmp = new THREE.Vector3();

    this.planets.forEach((p, i) => {
      const theta = phases[i] + p.w * t;
      const px = p.r * Math.cos(theta);
      const py = p.r * Math.sin(theta);
      p.mesh.position.copy(this.toScene(px, py));
      p.mesh.rotation.y += 0.016 * 0.4;

      const sc = Math.max(1, cameraPos.distanceTo(p.mesh.position) * 0.007 / p.vr);
      p.mesh.scale.setScalar(sc);
      p.label.position.copy(p.mesh.position);
      p.label.position.y += p.vr * sc * 1.9;
    });

    this.sun.scale.setScalar(Math.max(1, cameraPos.length() * 0.006));

    if (rocketState) {
      this.rocket.position.copy(this.toScene(rocketState.x, rocketState.y));
      tmp.set(rocketState.vx, 0, -rocketState.vy).normalize();
      this.rocket.quaternion.setFromUnitVectors(UP, tmp);
      const rsc = Math.max(0.3, Math.min(5, cameraPos.distanceTo(this.rocket.position) * 0.022));
      this.rocket.scale.setScalar(rsc);
    }
  }

  /** Set visibilitas panah gaya Newton. */
  setArrowsVisible(visible) {
    this.arrowSun.visible = visible;
    this.arrowPlanet.visible = visible;
  }

  /**
   * Dapatkan posisi planet dan roket dalam koordinat scene (untuk grid update).
   */
  getScenePositions(targetIndex) {
    return {
      planet: {
        x: this.planets[targetIndex].mesh.position.x,
        z: this.planets[targetIndex].mesh.position.z,
      },
      rocket: {
        x: this.rocket.position.x,
        z: this.rocket.position.z,
      },
    };
  }
}
