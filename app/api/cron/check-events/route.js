import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/highlightly';
import { getMatchState, saveMatchState } from '@/lib/matchState';
import {
  notifyKickoff,
  notifyGoal,
  notifyRedCard,
  notifyFinished,
} from '@/lib/discord';

const WORLD_CUP_LEAGUE_ID = '1635';

function normalizeStatus(rawState) {
  if (!rawState) return 'scheduled';
  const s = String(rawState).toLowerCase();
  if (s.includes('not started') || s.includes('postponed') || s.includes('scheduled')) {
    return 'scheduled';
  }
  if (s.includes('finished') || s.includes('ft') || s.includes('ended') || s.includes('after')) {
    return 'finished';
  }
  if (s.includes('half') || s.includes('live') || s.includes('progress') || s.includes('extra time') || s.includes('penalt')) {
    return 'live';
  }
  return 'scheduled';
}

function parseScore(scoreCurrent, side) {
  if (scoreCurrent == null) return null;
  if (typeof scoreCurrent === 'object') return scoreCurrent[side] ?? null;
  if (typeof scoreCurrent === 'string') {
    const parts = scoreCurrent.split('-').map((p) => p.trim());
    if (parts.length === 2) return side === 'home' ? parts[0] : parts[1];
  }
  return null;
}

function eventKey(e) {
  // Kunci unik per event, dipakai untuk cek apakah sudah pernah dinotifikasi
  return `${e.type}-${e.time}-${e.player}-${e.team?.id}`;
}

// Endpoint ini dipanggil otomatis oleh Vercel Cron (lihat vercel.json).
// Bisa juga dipanggil manual untuk testing, tapi harus bawa header rahasia
// supaya orang luar tidak bisa memicu spam notifikasi ke Discord kamu.
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const results = [];

  try {
    const raw = await getMatches({ leagueId: WORLD_CUP_LEAGUE_ID, date: today });
    const matches = Array.isArray(raw) ? raw : raw?.data || [];

    for (const m of matches) {
      const status = normalizeStatus(m.state?.description || m.status);
      const homeScore = parseScore(m.state?.score?.current, 'home');
      const awayScore = parseScore(m.state?.score?.current, 'away');
      const matchView = {
        id: m.id,
        competitionName: m.league?.name || 'World Cup',
        homeTeam: { name: m.homeTeam?.name || 'Home' },
        awayTeam: { name: m.awayTeam?.name || 'Away' },
        homeScore,
        awayScore,
      };

      const prevState = (await getMatchState(m.id)) || {
        status: null,
        notifiedEventKeys: [],
      };

      // 1. Kickoff — status berubah dari scheduled/null jadi live
      if (status === 'live' && prevState.status !== 'live' && prevState.status !== 'finished') {
        await notifyKickoff(matchView);
        results.push(`kickoff: ${m.id}`);
      }

      // 2. Gol & kartu merah baru — bandingkan daftar event
      const events = Array.isArray(m.events) ? m.events : [];
      const notifiedSet = new Set(prevState.notifiedEventKeys || []);
      const newlyNotified = [...notifiedSet];

      for (const e of events) {
        const key = eventKey(e);
        if (notifiedSet.has(key)) continue;

        const teamName =
          e.team?.id === m.homeTeam?.id ? matchView.homeTeam.name : matchView.awayTeam.name;

        if (/goal/i.test(e.type || '')) {
          await notifyGoal(matchView, e.player || 'Pemain', e.time || '?', teamName);
          results.push(`goal: ${m.id} ${e.player}`);
        } else if (/red card/i.test(e.type || '')) {
          await notifyRedCard(matchView, e.player || 'Pemain', e.time || '?', teamName);
          results.push(`redcard: ${m.id} ${e.player}`);
        }
        newlyNotified.push(key);
      }

      // 3. Pertandingan selesai
      if (status === 'finished' && prevState.status !== 'finished') {
        await notifyFinished(matchView);
        results.push(`finished: ${m.id}`);
      }

      await saveMatchState(m.id, {
        status,
        notifiedEventKeys: newlyNotified,
      });
    }

    return NextResponse.json({ ok: true, checked: matches.length, notified: results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 502 });
  }
}
