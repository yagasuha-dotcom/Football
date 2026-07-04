import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/highlightly';
import { getAllOverrides } from '@/lib/overrides';

// Highlightly memakai status seperti "Not started", "First Half", "Halftime",
// "Second Half", "Finished", "Postponed", dst.
// Liga populer diprioritaskan tampil di atas
const PRIORITY_LEAGUES = [
  'world cup', 'fifa world cup',
  'premier league', 'english premier league',
  'la liga', 'laliga',
  'serie a',
  'bundesliga',
  'ligue 1',
  'champions league', 'uefa champions league',
  'europa league',
  'copa america',
  'euro', 'european championship',
];

function leaguePriority(name) {
  if (!name) return 999;
  const lower = name.toLowerCase();
  const idx = PRIORITY_LEAGUES.findIndex((l) => lower.includes(l));
  return idx === -1 ? 999 : idx;
}

function normalizeStatus(rawState) {
  if (!rawState) return 'scheduled';
  const s = String(rawState).toLowerCase();
  if (s.includes('not started') || s.includes('postponed') || s.includes('scheduled')) {
    return 'scheduled';
  }
  if (
    s.includes('half') ||
    s.includes('live') ||
    s.includes('progress') ||
    s.includes('extra time') ||
    s.includes('penalt')
  ) {
    return 'live';
  }
  if (s.includes('finished') || s.includes('ft') || s.includes('ended') || s.includes('after')) {
    return 'finished';
  }
  return 'scheduled';
}

function extractEvents(events, teamId) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((e) => e.team?.id === teamId && /goal/i.test(e.type || ''))
    .map((e) => ({
      player: e.player || 'Unknown',
      minute: e.time || '',
      isOwnGoal: /own/i.test(e.type || ''),
    }));
}

function mapMatch(m) {
  const homeId = m.homeTeam?.id;
  const awayId = m.awayTeam?.id;
  const status = normalizeStatus(m.state?.description || m.status);

  let minuteDisplay = null;
  if (status === 'live') {
    minuteDisplay = m.state?.clock ? `${m.state.clock}'` : m.state?.description;
  } else if (status === 'scheduled' && m.date) {
    try {
      const d = new Date(m.date);
      const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      minuteDisplay = `${datePart}, ${timePart}`;
    } catch {
      minuteDisplay = null;
    }
  }

  return {
    id: m.id,
    competitionName: m.league?.name || m.competition?.name || '',
    status,
    minute: minuteDisplay,
    rawDate: m.date || null,
    homeScore: m.state?.score?.current?.home ?? m.homeScore ?? null,
    awayScore: m.state?.score?.current?.away ?? m.awayScore ?? null,
    homeTeam: {
      name: m.homeTeam?.name || 'Home',
      logo: m.homeTeam?.logo || null,
    },
    awayTeam: {
      name: m.awayTeam?.name || 'Away',
      logo: m.awayTeam?.logo || null,
    },
    homeEvents: extractEvents(m.events, homeId),
    awayEvents: extractEvents(m.events, awayId),
    heroImageUrl: null, // API football gratis biasanya tidak sediakan foto pemain individual
    hasHighlight: status === 'finished',
  };
}

// World Cup 2026 punya leagueId khusus di Highlightly — tidak selalu muncul
// di endpoint /matches umum tanpa filter ini secara eksplisit.
const WORLD_CUP_LEAGUE_ID = '1635';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const leagueId = searchParams.get('leagueId') || undefined;

  try {
    const [generalRaw, worldCupRaw] = await Promise.all([
      getMatches({ date, leagueId }),
      leagueId ? Promise.resolve([]) : getMatches({ date, leagueId: WORLD_CUP_LEAGUE_ID }),
    ]);

    const generalList = Array.isArray(generalRaw) ? generalRaw : generalRaw?.data || [];
    const worldCupList = Array.isArray(worldCupRaw) ? worldCupRaw : worldCupRaw?.data || [];

    // Gabungkan tanpa duplikat (World Cup match mungkin sudah ada di list umum)
    const seenIds = new Set();
    const rawList = [];
    for (const m of [...worldCupList, ...generalList]) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        rawList.push(m);
      }
    }

    const overrides = getAllOverrides();

    const matches = rawList.map((m) => {
      const mapped = mapMatch(m);
      const override = overrides[mapped.id];
      return override ? { ...mapped, ...override } : mapped;
    });

    // Urutan: Live paling atas, lalu liga populer duluan, lalu urut waktu
    const statusOrder = { live: 0, scheduled: 1, finished: 2 };
    matches.sort((a, b) => {
      const statusDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      if (statusDiff !== 0) return statusDiff;

      const leagueDiff = leaguePriority(a.competitionName) - leaguePriority(b.competitionName);
      if (leagueDiff !== 0) return leagueDiff;

      const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return dateA - dateB;
    });

    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json(
      { error: err.message, matches: [] },
      { status: 502 }
    );
  }
}
