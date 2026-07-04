const BASE_URL = 'https://football-highlightly.p.rapidapi.com';
const DIRECT_URL = 'https://football.highlightly.net';

function getHeaders() {
  const key = process.env.HIGHLIGHTLY_API_KEY;
  if (!key) {
    throw new Error('HIGHLIGHTLY_API_KEY belum diatur di environment variables');
  }
  return {
    'x-api-key': key,
    'x-rapidapi-key': key,
    'x-rapidapi-host': 'football-highlightly.p.rapidapi.com',
  };
}

async function callApi(path, params = {}) {
  const url = new URL(path, DIRECT_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    // Cache live data very briefly on the edge/server
    next: { revalidate: 15 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Highlightly API error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

// Fetch matches for a given date (YYYY-MM-DD), optionally filtered by league
export async function getMatches({ date, leagueId, live } = {}) {
  const params = {};
  if (date) params.date = date;
  if (leagueId) params.leagueId = leagueId;
  if (live) params.status = 'live';
  return callApi('/matches', params);
}

export async function getMatchById(matchId) {
  return callApi(`/matches/${matchId}`);
}

export async function getHighlights({ matchId, leagueId, limit = 5 } = {}) {
  const params = { limit };
  if (matchId) params.matchId = matchId;
  if (leagueId) params.leagueId = leagueId;
  return callApi('/highlights', params);
}

export async function getLeagues({ name } = {}) {
  const params = {};
  if (name) params.name = name;
  return callApi('/leagues', params);
}
