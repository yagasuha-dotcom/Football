// Base URL resmi Highlightly (bukan RapidAPI) — hanya butuh header x-rapidapi-key
const BASE_URL = 'https://soccer.highlightly.net';

function getHeaders() {
  const key = process.env.HIGHLIGHTLY_API_KEY;
  if (!key) {
    throw new Error('HIGHLIGHTLY_API_KEY belum diatur di environment variables');
  }
  return {
    'x-rapidapi-key': key,
  };
}

async function callApi(path, params = {}) {
  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 15 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Highlightly API error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

// Fetch matches for a given date (YYYY-MM-DD), optionally filtered by league
export async function getMatches({ date, leagueId, timezone } = {}) {
  const params = { timezone: timezone || 'Asia/Jakarta' };
  if (date) params.date = date;
  if (leagueId) params.leagueId = leagueId;
  return callApi('/matches', params);
}

export async function getMatchById(matchId) {
  // Endpoint ini mengembalikan array dengan 1 elemen: [match]
  const result = await callApi(`/matches/${matchId}`);
  return Array.isArray(result) ? result[0] : result;
}

export async function getHighlights({ matchId, leagueId, limit = 5 } = {}) {
  const params = { limit };
  if (matchId) params.matchId = matchId;
  if (leagueId) params.leagueId = leagueId;
  return callApi('/highlights', params);
}

export async function getLeagues({ leagueName } = {}) {
  const params = {};
  if (leagueName) params.leagueName = leagueName;
  return callApi('/leagues', params);
}
