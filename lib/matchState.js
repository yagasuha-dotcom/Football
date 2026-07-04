import { Redis } from '@upstash/redis';

// Menyimpan snapshot terakhir tiap match World Cup yang sudah pernah dicek,
// supaya cron job bisa bandingkan dengan data baru dan tahu event apa yang
// baru terjadi (gol baru, match baru mulai, dst) tanpa mengirim notifikasi dobel.

let redis = null;
function getRedis() {
  if (!redis) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Redis belum dikonfigurasi (KV_REST_API_URL / KV_REST_API_TOKEN kosong)');
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

const KEY_PREFIX = 'matchstate:';

export async function getMatchState(matchId) {
  const r = getRedis();
  const data = await r.get(`${KEY_PREFIX}${matchId}`);
  return data || null;
}

export async function saveMatchState(matchId, state) {
  const r = getRedis();
  // TTL 3 hari — cukup untuk 1 pertandingan + buffer, otomatis bersih sendiri
  await r.set(`${KEY_PREFIX}${matchId}`, state, { ex: 60 * 60 * 24 * 3 });
}
