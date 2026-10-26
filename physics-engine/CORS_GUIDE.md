# 🌐 Panduan CORS untuk JPL Horizons API

## Apa Itu Masalah CORS?

Browser modern menerapkan kebijakan **Same-Origin Policy** untuk keamanan.
Ketika JavaScript di `http://localhost:5173` mencoba mengakses
`https://ssd.jpl.nasa.gov/api/horizons.api`, browser **memblokir** permintaan
karena origin berbeda.

Server NASA **tidak mengirim** header `Access-Control-Allow-Origin`, sehingga
browser menolak respons meskipun server NASA berhasil menjawab.

```
Browser → NASA API     ✗ Diblokir (tidak ada header CORS)
Browser → Proksi → NASA API → Proksi → Browser   ✓ Berhasil
```

## Solusi 1: Proksi Lokal (Node.js)

Cara termudah untuk hackathon. File `horizons-proxy.js` sudah tersedia.

```bash
# Install dependensi
npm install express cors

# Jalankan
node horizons-proxy.js
# Server di http://localhost:3001
```

Dari browser:
```javascript
const data = await fetchHorizonsVectors({
  body: '499',
  startTime: '2025-01-01',
  proxyUrl: 'http://localhost:3001/horizons'
});
```

## Solusi 2: Cloudflare Worker (Gratis, Produksi)

Buat worker di [dash.cloudflare.com](https://dash.cloudflare.com):

```javascript
// cloudflare-worker.js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const nasaUrl = `https://ssd.jpl.nasa.gov/api/horizons.api${url.search}`;
    
    const response = await fetch(nasaUrl);
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET');
    
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }
};
```

Deploy: `npx wrangler deploy cloudflare-worker.js`

URL proksi: `https://your-worker.your-subdomain.workers.dev`

## Solusi 3: CORS-Anywhere (Tidak Direkomendasikan untuk Produksi)

```javascript
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const nasaUrl = 'https://ssd.jpl.nasa.gov/api/horizons.api?...';
const response = await fetch(proxyUrl + nasaUrl);
```

⚠️ **Peringatan:** CORS-Anywhere memiliki rate limit ketat dan sering down.
Hanya gunakan untuk demo cepat.

## Contoh Permintaan Horizons

```
GET https://ssd.jpl.nasa.gov/api/horizons.api?
  format=json
  &COMMAND='499'              ← Mars
  &OBJ_DATA=NO
  &MAKE_EPHEM=YES
  &EPHEM_TYPE=VECTORS          ← Vektor posisi + kecepatan
  &CENTER='500@10'             ← Pusat Matahari
  &START_TIME='2025-01-01'
  &STOP_TIME='2025-01-02'
  &STEP_SIZE='1d'
  &VEC_TABLE=2
  &REF_PLANE=ECLIPTIC
```

Respons berisi blok `$$SOE`...`$$EOE` dengan data:
```
X = 2.071E+08  Y =-5.583E+07  Z =-6.061E+06   ← posisi (km)
VX= 7.412E+00  VY= 2.595E+01  VZ= 3.674E-01   ← kecepatan (km/s)
```
