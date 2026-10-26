/**
 * Proksi CORS sederhana untuk JPL Horizons API.
 * 
 * Browser memblokir permintaan langsung ke ssd.jpl.nasa.gov karena
 * server NASA tidak mengirim header CORS. Proksi ini:
 * 1. Menerima permintaan dari browser (origin lokal)
 * 2. Meneruskan ke API NASA dari sisi server
 * 3. Menambahkan header Access-Control-Allow-Origin: *
 * 4. Mengirim respons kembali ke browser
 * 
 * Jalankan: node horizons-proxy.js
 * Akses:    http://localhost:3001/horizons?COMMAND='499'&EPHEM_TYPE='VECTORS'&...
 * 
 * CATATAN: Ini untuk development/hackathon saja. Untuk produksi,
 * gunakan Cloudflare Workers atau serverless function.
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Izinkan semua origin (untuk hackathon)
app.use(cors());

/**
 * Endpoint proksi ke JPL Horizons API.
 * Meneruskan semua query parameter ke NASA.
 */
app.get('/horizons', async (req, res) => {
  const params = new URLSearchParams(req.query);
  params.set('format', 'json');
  
  const nasaUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
  
  console.log(`[Proxy] → ${nasaUrl}`);
  
  try {
    const response = await fetch(nasaUrl);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(`[Proxy] Error: ${err.message}`);
    res.status(502).json({ error: `Gagal menghubungi NASA: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`CORS Proxy berjalan di http://localhost:${PORT}`);
  console.log(`Contoh: http://localhost:${PORT}/horizons?COMMAND='499'&EPHEM_TYPE='VECTORS'&CENTER='500@10'&START_TIME='2025-01-01'&STOP_TIME='2025-01-02'&STEP_SIZE='1d'`);
});
