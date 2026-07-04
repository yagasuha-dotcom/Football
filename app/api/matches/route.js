import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/highlightly';
import { getAllOverrides } from '@/lib/overrides';

// Highlightly memakai status seperti "Not started", "First Half", "Halftime",
// "Second Half", "Finished", "Postponed", dst.
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
      minuteDisplay = new Date(m.date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      minuteDisplay = null;
    }
  }

  return {
    id: m.id,
    competitionName: m.league?.name || m.competition?.name || '',
    status,
    minute: minuteDisplay,
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
