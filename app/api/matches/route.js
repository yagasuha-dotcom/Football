import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/highlightly';
import { getAllOverrides } from '@/lib/overrides';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const leagueId = searchParams.get('leagueId') || undefined;
  const live = searchParams.get('live') === 'true';

  try {
    const data = await getMatches({ date, leagueId, live });
    const overrides = getAllOverrides();

    const matches = (data?.data || data || []).map((m) => {
      const override = overrides[m.id];
      return override ? { ...m, ...override } : m;
    });

    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json(
      { error: err.message, matches: [] },
      { status: 502 }
    );
  }
}
