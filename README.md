# MATCHDAY — Live Football Scores & Highlights

## Setup lokal

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` jadi `.env.local`, lalu isi API key kamu:
   ```
   HIGHLIGHTLY_API_KEY=key_kamu_dari_highlightly.net
   ```

3. Jalankan:
   ```
   npm run dev
   ```
   Buka http://localhost:3000

## Deploy ke Vercel / Railway

1. Push project ini ke GitHub
2. Import ke Vercel atau Railway
3. Set environment variable `HIGHLIGHTLY_API_KEY` di dashboard hosting (JANGAN taruh di kode)
4. Deploy

## Catatan penting

- **Endpoint Highlightly**: Aku set default endpoint di `lib/highlightly.js` berdasarkan dokumentasi umum
  provider ini (`/matches`, `/highlights`, `/leagues`). Kalau setelah deploy ada error 404/400,
  cek dokumentasi resmi di dashboard Highlightly kamu (biasanya ada tab "API Reference") dan
  sesuaikan nama path/parameter di file itu — strukturnya sudah rapi jadi tinggal ganti nama field.

- **Foto pemain**: Field `heroImageUrl` di setiap match diambil dari API kalau tersedia.
  Kalau API-nya nggak ngasih foto pemain (cuma logo tim), kartu otomatis fallback ke
  placeholder gradient dengan nama kompetisi.

- **Override manual foto**: Kalau mau pasang foto sendiri untuk match tertentu, kirim POST ke:
  ```
  POST /api/overrides
  { "matchId": "12345", "heroImageUrl": "https://url-foto-kamu.jpg" }
  ```
  Foto itu akan otomatis dipakai menggantikan yang dari API untuk match tersebut.

- **Highlight video**: Modal akan otomatis coba deteksi link YouTube dari data API
  dan embed sebagai iframe resmi (bukan re-upload).

- **Polling**: Halaman utama polling tiap 15 detik kalau ada match live, atau 30 detik
  kalau tidak ada — supaya hemat kuota API gratis (100 request/hari).
