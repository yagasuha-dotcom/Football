import { NextResponse } from 'next/server';
import { getAllOverrides, setOverride, deleteOverride } from '@/lib/overrides';

export async function GET() {
  return NextResponse.json({ overrides: getAllOverrides() });
}

export async function POST(request) {
  const body = await request.json();
  const { matchId, heroImageUrl, playerName } = body;

  if (!matchId) {
    return NextResponse.json({ error: 'matchId wajib diisi' }, { status: 400 });
  }

  const result = setOverride(matchId, { heroImageUrl, playerName });
  return NextResponse.json({ override: result });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  if (!matchId) {
    return NextResponse.json({ error: 'matchId wajib diisi' }, { status: 400 });
  }
  deleteOverride(matchId);
  return NextResponse.json({ ok: true });
}
