import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/highlightly';
import { getAllOverrides } from '@/lib/overrides';

// Highlightly memakai state seperti "not_started", "live", "finished", dst.
// Normalisasi ke status yang dipahami frontend: scheduled | live | finished
function normalizeStatus(rawState) {
  if (!rawState) return 'scheduled';
  const s = String(rawState).toLowerCase();
  if (s.includes('live') || s.includes('half') || s.includes('progress')) return 'live';
  if (s.includes('finished') || s.includes('ft') || s.includes('ended')) return 'finished';
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
  return {
    id: m.id,
    competitionName: m.league?.name || m.competition?.name || '',
    status: normalizeStatus(m.state?.description || m.status),
    minute: m.state?.clock || m.state?.description || null,
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
    hasHighlight: normalizeStatus(m.state?.description || m.status) === 'finished',
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const leagueId = searchParams.get('leagueId') || undefined;

  try {
    const raw = await getMatches({ date, leagueId });
    const rawList = Array.isArray(raw) ? raw : raw?.data || [];
    const overrides = getAllOverrides();

    const matches = rawList.map((m) => {
      const mapped = mapMatch(m);
      const override = overrides[mapped.id];
      return override ? { ...mapped, ...override } : mapped;
    });

    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json(
      { error: err.message, matches: [] },
      { status: 502 }
    );
  }
}
