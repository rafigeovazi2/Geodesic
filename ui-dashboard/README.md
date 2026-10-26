# 🎯 UI Dashboard — Antarmuka, Storytelling & Hustler

Modul antarmuka pengguna, kalkulator pesawat luar angkasa, dan
materi storytelling untuk penceritaan sains yang memenangkan
kriteria "Best Use of Storytelling" di NASA Space Apps Challenge.

## Arsitektur

```
ui-dashboard/
├── dashboard.html          # Dashboard kalkulator + simulasi (halaman utama)
├── storyboard.md           # Struktur storyboard presentasi
├── telemetry-panel.js      # Panel telemetri real-time
├── fuel-gauge.js           # Visualisasi perbandingan bahan bakar
├── clock-display.js        # Jam relativistik (time dilation)
├── STORYTELLING_GUIDE.md   # Panduan narasi edukasi
└── README.md
```

## Fitur Dashboard

### Kalkulator Efek Oberth
Dashboard interaktif yang menghitung dan memvisualisasikan penghematan
bahan bakar saat roket menyalakan mesin di periapsis (titik tercepat).

**Rumus Energi Kinetik:**
```
KE = ½mv²
ΔKE = m · Δv · (v + Δv/2)
```

Burn 1 km/s di periapsis (v=10 km/s) → ΔKE = 10.5m
Burn 1 km/s di apoapsis (v=1 km/s)  → ΔKE = 1.5m
→ **7x lebih efisien!**

### Persamaan Tsiolkovsky
```
Δv = Isp · g₀ · ln(m₀/m₁)
Massa propelan = m_kering · (e^(Δv/(Isp·g₀)) - 1)
```

### Telemetri Real-time
- Waktu misi (hari/tahun)
- Jarak ke Matahari (AU)
- Jarak ke planet tujuan (km)
- Kecepatan heliosentris (km/s)

### Jam Relativistik
Menunjukkan bahwa jam berdetak lebih lambat di dalam sumur gravitasi:
```
dτ/dt ≈ 1 − Φ/c² − v²/(2c²)
```

## Cara Pakai

Buka `dashboard.html` langsung di browser, atau integrasikan dengan
modul physics-engine dan webgl-engine.

## Storytelling

Lihat `storyboard.md` untuk struktur presentasi dan `STORYTELLING_GUIDE.md`
untuk panduan narasi yang menargetkan kriteria penjurian.
