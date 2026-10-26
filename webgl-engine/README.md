# 🎨 WebGL Engine — Grafis 3D & Sistem Spasial

Modul visualisasi 3D interaktif menggunakan Three.js untuk mengedukasi bahwa
gravitasi bukanlah gaya, melainkan kelengkungan kontinum ruang-waktu.

## Arsitektur

```
webgl-engine/
├── scene-manager.js      # Renderer, kamera, kontrol orbit, pencahayaan
├── spacetime-grid.js     # Grid ruang-waktu dengan GLSL shader (inline)
├── celestial-bodies.js   # Planet, Matahari, roket, bintang, panah gaya
├── trail-renderer.js     # Render lintasan orbit roket
└── README.md
```

## Fitur Visual

### Kelengkungan Ruang-Waktu (Mode Einstein)
Grid 3D yang terdeformasi oleh massa planet. Vertex shader di GPU memanipulasi
ribuan titik simpul secara paralel, menariknya ke bawah berdasarkan potensial
gravitasi: `depth = GM / √(d² + ε)`.

### Dual Mode: Newton vs Einstein
- **Newton:** Panah vektor gaya dari roket ke planet (F = GMm/r²)
- **Einstein:** Grid melengkung + gradien warna menunjukkan time dilation

## GLSL Shaders

Kode GLSL ditulis inline di `spacetime-grid.js` (praktik standar Three.js —
`ShaderMaterial` menerima string shader langsung, tanpa file terpisah).

### Vertex Shader
Memanipulasi posisi vertex berdasarkan jarak ke benda bermassa:
```glsl
float depth = strength / sqrt(dist*dist + softening);
position.y -= depth;  // tarik ke bawah → sumur gravitasi
```

### Fragment Shader
Menampilkan garis kisi (grid lines) dengan anti-aliasing menggunakan `fwidth()`,
dan gradien warna berdasarkan kedalaman sumur.

## Cara Pakai

```javascript
import { SceneManager } from './scene-manager.js';
import { SpacetimeGrid } from './spacetime-grid.js';
import { CelestialBodies } from './celestial-bodies.js';
import { TrailRenderer } from './trail-renderer.js';

const sm = new SceneManager(canvas);
const grid = new SpacetimeGrid(sm.scene);
const bodies = new CelestialBodies(sm.scene, PLANETS, scale);
const trail = new TrailRenderer(sm.scene, scale);

function animate() {
  grid.update({ planet: {...}, rocket: {...} });  // posisi tiap frame
  grid.animate(dt);                                // transisi Newton ↔ Einstein
  sm.render();
  requestAnimationFrame(animate);
}
```

## Catatan Arsitektur

Rendering berjalan di main thread dengan semua komputasi deformasi
didelegasikan ke GPU via vertex shader (202.500 vertex per frame) —
main thread hanya mengirim 4 uniform per frame, sehingga FPS tetap stabil
tanpa kompleksitas OffscreenCanvas/Web Worker.
