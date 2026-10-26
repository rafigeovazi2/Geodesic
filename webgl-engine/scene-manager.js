/**
 * Manajer scene Three.js — inisialisasi renderer, kamera, kontrol, pencahayaan.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} [opts]
   * @param {number} [opts.fov=50]
   * @param {number} [opts.near=0.05]
   * @param {number} [opts.far=6000]
   */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060c);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Kamera
    this.camera = new THREE.PerspectiveCamera(
      opts.fov || 50, 1, opts.near || 0.05, opts.far || 6000
    );
    this.camera.position.set(0, 95, 105);

    // Kontrol orbit
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 900;

    // Pencahayaan
    this.scene.add(new THREE.AmbientLight(0x8899bb, 0.7));
    const pointLight = new THREE.PointLight(0xfff1d0, 2.2, 0, 0);
    this.scene.add(pointLight);

    // Responsif
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Pindahkan fokus kamera ke posisi tertentu.
   * @param {THREE.Vector3} target
   * @param {number} distance
   */
  focusOn(target, distance = 40) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(distance);
    this.controls.target.copy(target);
    this.camera.position.copy(target).add(offset);
  }

  /** Satu frame render. */
  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /** Tambah objek ke scene. */
  add(obj) {
    this.scene.add(obj);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}
