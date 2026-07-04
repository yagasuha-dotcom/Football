# MATCHDAY — Live Football Scores & Highlights

## Setup lokal

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` jadi `.env.local`, lalu isi API key kamu:
   ```
   HIGHLIGHTLY_API_KEY=isi_dengan_api_key_kamu
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

## Setup notifikasi Discord (fitur baru)

Fitur ini kirim notifikasi otomatis ke Discord tiap ada kickoff, gol, kartu merah,
atau pertandingan World Cup selesai.

### 1. Tambahkan Redis (Upstash) di Vercel
Vercel KV sudah deprecated, penggantinya Upstash Redis lewat Vercel Marketplace:
1. Buka project kamu di dashboard Vercel -> tab **Storage**
2. Klik **Create Database** -> pilih **Upstash** -> **Redis**
3. Ikuti wizard, hubungkan ke project ini
4. Vercel otomatis menambahkan environment variable `KV_REST_API_URL` dan
   `KV_REST_API_TOKEN` ke project — tidak perlu diisi manual

### 2. Tambahkan environment variable
Di **Settings -> Environment Variables**, tambahkan:
- `DISCORD_WEBHOOK_URL` — link webhook Discord kamu (dari Server Settings ->
  Integrations -> Webhooks). **Jangan pernah taruh ini di kode atau share di
  tempat publik.**
- `CRON_SECRET` — string acak minimal 16 karakter, untuk mengamankan endpoint
  cron supaya orang lain tidak bisa memicunya sembarangan.

### 3. Setup pemanggil cron eksternal
Karena Vercel Hobby (plan gratis) cuma bisa jalankan cron built-in 1x/hari,
untuk cek tiap 1-2 menit kita pakai layanan eksternal gratis:

1. Daftar di **https://cron-job.org** (gratis, tanpa kartu kredit)
2. Buat cronjob baru dengan setting:
   - URL: `https://domain-vercel-kamu.vercel.app/api/cron/check-events`
   - Method: GET
   - Header tambahan: `Authorization: Bearer <isi dengan CRON_SECRET yang sama>`
   - Interval: tiap 1-2 menit
3. Simpan dan aktifkan

Setelah ini aktif, setiap ada kickoff/gol/kartu merah/pertandingan selesai di
World Cup, notifikasi otomatis akan masuk ke channel Discord kamu.

## Catatan penting

- **Endpoint Highlightly**: base URL resmi adalah `https://soccer.highlightly.net`,
  header yang dipakai `x-rapidapi-key`.

- **Foto pemain**: Free tier Highlightly umumnya tidak menyediakan foto pemain
  individual, hanya logo tim.

- **Override manual foto**: kirim POST ke `/api/overrides` dengan body
  `{ "matchId": "...", "heroImageUrl": "https://..." }`.

- **Highlight video**: Muncul di card match yang sudah selesai, biasanya
  tersedia 0-48 jam setelah pertandingan berakhir.

- **Notifikasi Discord**: Hanya untuk pertandingan World Cup 2026 (leagueId 1635
  di Highlightly). State terakhir tiap match disimpan di Redis dengan TTL 3 hari.

- **Polling**: Halaman utama polling tiap 15/30 detik. Cron notifikasi Discord
  terpisah dan juga memakai kuota API yang sama, jadi total pemakaian perlu
  diperhatikan saat World Cup ramai (limit 100 request/hari di free tier).
