// Kirim embed message ke Discord webhook.
// URL webhook disimpan di environment variable, tidak pernah di kode/browser.

const COLORS = {
  kickoff: 0x00e5a0, // mint
  goal: 0xffb800, // amber
  finished: 0x7c6cff, // violet
  redCard: 0xff3b5c, // red
};

async function sendToDiscord(embed) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL belum diatur, skip notifikasi');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'MATCHDAY',
        embeds: [embed],
      }),
    });
  } catch (err) {
    console.error('Gagal kirim notifikasi Discord:', err.message);
  }
}

function matchTitle(match) {
  return `${match.homeTeam.name} vs ${match.awayTeam.name}`;
}

export async function notifyKickoff(match) {
  await sendToDiscord({
    title: `🏁 Kickoff! ${matchTitle(match)}`,
    description: `Pertandingan **${match.competitionName}** baru dimulai.`,
    color: COLORS.kickoff,
    timestamp: new Date().toISOString(),
  });
}

export async function notifyGoal(match, scorerName, minute, team) {
  await sendToDiscord({
    title: `⚽ GOAL! ${matchTitle(match)}`,
    description: `**${scorerName}** (${team}) mencetak gol di menit ${minute}'\n\nSkor saat ini: **${match.homeScore} - ${match.awayScore}**`,
    color: COLORS.goal,
    footer: { text: match.competitionName },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyRedCard(match, playerName, minute, team) {
  await sendToDiscord({
    title: `🟥 Kartu Merah! ${matchTitle(match)}`,
    description: `**${playerName}** (${team}) dikartu merah di menit ${minute}'`,
    color: COLORS.redCard,
    footer: { text: match.competitionName },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyFinished(match) {
  await sendToDiscord({
    title: `🔚 Selesai: ${matchTitle(match)}`,
    description: `Hasil akhir: **${match.homeScore} - ${match.awayScore}**`,
    color: COLORS.finished,
    footer: { text: match.competitionName },
    timestamp: new Date().toISOString(),
  });
}
