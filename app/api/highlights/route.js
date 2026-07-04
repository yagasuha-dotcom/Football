import { NextResponse } from 'next/server';
import { getHighlights } from '@/lib/highlightly';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId') || undefined;
  const leagueId = searchParams.get('leagueId') || undefined;

  try {
    const data = await getHighlights({ matchId, leagueId, limit: 5 });
    return NextResponse.json({ highlights: data?.data || data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err.message, highlights: [] },
      { status: 502 }
    );
  }
}
