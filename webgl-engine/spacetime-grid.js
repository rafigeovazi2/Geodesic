/**
 * Grid ruang-waktu 3D yang terdeformasi oleh massa planet.
 * 
 * Menggunakan BufferGeometry dan ShaderMaterial:
 * - Vertex Shader: memanipulasi posisi simpul berdasarkan jarak ke planet
 * - Fragment Shader: menampilkan garis kisi dengan gradien warna
 * 
 * Grid ini mengedukasi bahwa gravitasi adalah kelengkungan geometri,
 * bukan gaya tarik mekanis.
 */

import * as THREE from 'three';

// GLSL Vertex Shader — memanipulasi posisi vertex di GPU
const VERTEX_SHADER = `
  // Uniform: data dari JavaScript yang dikirim ke GPU setiap frame
  uniform vec2 uPlanetPos;     // posisi planet utama di bidang XZ
  uniform vec2 uRocketPos;     // posisi roket di bidang XZ
  uniform float uStrength;     // 0 = datar (Newton), 1 = melengkung (Einstein)
  uniform float uPlanetDepth;  // kedalaman sumur planet (proporsional GM)
  uniform float uSunDepth;     // kedalaman sumur Matahari
  
  // Varying: data yang diteruskan ke Fragment Shader
  varying vec2 vXZ;            // koordinat XZ vertex (untuk grid lines)
  varying float vDepth;        // kedalaman deformasi (untuk gradien warna)
  
  void main() {
    vec3 p = position;
    
    // Jarak vertex ke Matahari (di origin) dan planet
    float distToSun = length(p.xz);
    float distToPlanet = length(p.xz - uPlanetPos);
    
    // Potensial gravitasi: depth = GM / sqrt(d² + softening)
    // Softening mencegah singularitas di pusat
    float sunWell = uSunDepth / sqrt(distToSun * distToSun + 8.0);
    float planetWell = uPlanetDepth / sqrt(distToPlanet * distToPlanet + 6.0);
    float depth = sunWell + planetWell;
    
    // Teruskan ke fragment shader
    vXZ = p.xz;
    vDepth = depth;
    
    // Deformasi: tarik vertex ke bawah (sumbu Y) berdasarkan kedalaman
    p.y -= uStrength * depth;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

// GLSL Fragment Shader — warna dan garis kisi
const FRAGMENT_SHADER = `
  uniform vec2 uRocketPos;
  uniform float uStrength;
  uniform vec3 uColdColor;     // warna datar (biru gelap)
  uniform vec3 uHotColor;      // warna dalam sumur (cyan terang)
  
  varying vec2 vXZ;
  varying float vDepth;
  
  // Fungsi grid: menghasilkan garis kisi anti-aliased menggunakan fwidth()
  float grid(vec2 p, float spacing) {
    vec2 q = p / spacing;
    vec2 fw = fwidth(q);                              // derivatif layar
    vec2 g = abs(fract(q - 0.5) - 0.5) / fw;         // jarak ke garis terdekat
    float lod = 1.0 - smoothstep(0.25, 0.6, max(fw.x, fw.y)); // LOD fade
    return (1.0 - min(min(g.x, g.y), 1.0)) * lod;
  }
  
  void main() {
    // Dua level grid: kasar (10 unit) dan halus (2.5 unit)
    float line = max(
      grid(vXZ, 10.0),
      grid(vXZ, 2.5) * 0.35
    );
    
    // Gradien warna berdasarkan kedalaman sumur
    float warmth = clamp(vDepth / 9.0, 0.0, 1.0) * uStrength;
    
    // Fade di tepi grid
    float fade = 1.0 - smoothstep(280.0, 440.0, length(vXZ));
    
    // Glow di sekitar roket
    vec2 d = vXZ - uRocketPos;
    float glow = exp(-dot(d, d) / 30.0) * uStrength;
    
    // Warna akhir: campuran dingin-panas + glow
    vec3 color = mix(uColdColor, uHotColor, warmth) + glow * 0.4;
    float alpha = line * (0.2 + 0.6 * warmth + 0.7 * glow) * fade;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export class SpacetimeGrid {
  /**
   * @param {THREE.Scene} scene
   * @param {Object} [opts]
   * @param {number} [opts.size=900] - Ukuran grid (unit scene)
   * @param {number} [opts.segments=450] - Jumlah segmen per sisi
   */
  constructor(scene, opts = {}) {
    const size = opts.size || 900;
    const segments = opts.segments || 450;

    this.uniforms = {
      uPlanetPos:   { value: new THREE.Vector2() },
      uRocketPos:   { value: new THREE.Vector2() },
      uStrength:    { value: 0 },      // 0=Newton, 1=Einstein
      uPlanetDepth: { value: 6 },
      uSunDepth:    { value: 40 },
      uColdColor:   { value: new THREE.Color(0x3a4a6a) },
      uHotColor:    { value: new THREE.Color(0x4fd8ff) },
    };

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      extensions: { derivatives: true },
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.position.y = -0.02;

    scene.add(this.mesh);
  }

  /**
   * Update posisi planet dan roket untuk deformasi GPU.
   * @param {Object} positions - { planet: {x, z}, rocket: {x, z} }
   */
  update(positions) {
    if (positions.planet) {
      this.uniforms.uPlanetPos.value.set(positions.planet.x, positions.planet.z);
    }
    if (positions.rocket) {
      this.uniforms.uRocketPos.value.set(positions.rocket.x, positions.rocket.z);
    }
  }

  /**
   * Set mode tampilan.
   * @param {'newton'|'einstein'} mode
   */
  setMode(mode) {
    this.targetStrength = mode === 'einstein' ? 1 : 0;
  }

  /**
   * Animasikan transisi mode (panggil setiap frame).
   * @param {number} dt - Delta time (detik)
   */
  animate(dt) {
    if (this.targetStrength !== undefined) {
      const current = this.uniforms.uStrength.value;
      this.uniforms.uStrength.value += (this.targetStrength - current) * Math.min(1, dt * 4);
    }
  }

  /**
   * Set kedalaman sumur planet (proporsional GM).
   * @param {number} depth
   */
  setPlanetDepth(depth) {
    this.uniforms.uPlanetDepth.value = depth;
  }
}
