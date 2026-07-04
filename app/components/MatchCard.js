'use client';

import { useState } from 'react';
import styles from './MatchCard.module.css';

function StatusBadge({ status, minute }) {
  if (status === 'live') {
    return (
      <div className={styles.liveBadge}>
        <span className={styles.liveDot} />
        {minute ? `${minute}'` : 'LIVE'}
      </div>
    );
  }
  if (status === 'finished') {
    return <div className={styles.ftBadge}>FT</div>;
  }
  return <div className={styles.scheduledBadge}>{minute || 'VS'}</div>;
}

function ScorerList({ events, side }) {
  if (!events || events.length === 0) return null;
  return (
    <ul className={`${styles.scorers} ${side === 'away' ? styles.scorersRight : ''}`}>
      {events.map((e, i) => (
        <li key={i}>
          {e.player} {e.minute}'{e.isOwnGoal ? ' (OG)' : ''}
        </li>
      ))}
    </ul>
  );
}

export default function MatchCard({ match, onOpenHighlight }) {
  const [imgError, setImgError] = useState(false);

  const {
    heroImageUrl,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    status,
    minute,
    homeEvents,
    awayEvents,
    competitionName,
    hasHighlight,
  } = match;

  const showHero = heroImageUrl && !imgError;

  return (
    <div className={styles.card}>
      <div className={styles.borderGlow} />
      <div className={styles.inner}>
        {showHero ? (
          <div className={styles.heroWrap}>
            <img
              src={heroImageUrl}
              alt=""
              className={styles.heroImg}
              onError={() => setImgError(true)}
            />
            <div className={styles.heroFade} />
          </div>
        ) : (
          <div className={styles.heroPlaceholder}>
            <span>{competitionName}</span>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.scoreboard}>
            <div className={styles.teamSide}>
              {homeTeam?.logo && <img className={styles.flag} src={homeTeam.logo} alt="" />}
              <span className={styles.teamName}>{homeTeam?.name}</span>
            </div>

            <div className={styles.centerScore}>
              <span className={styles.scoreNum}>{homeScore ?? '-'}</span>
              <StatusBadge status={status} minute={minute} />
              <span className={styles.scoreNum}>{awayScore ?? '-'}</span>
            </div>

            <div className={`${styles.teamSide} ${styles.teamSideRight}`}>
              <span className={styles.teamName}>{awayTeam?.name}</span>
              {awayTeam?.logo && <img className={styles.flag} src={awayTeam.logo} alt="" />}
            </div>
          </div>

          <div className={styles.eventsRow}>
            <ScorerList events={homeEvents} side="home" />
            <ScorerList events={awayEvents} side="away" />
          </div>

          {hasHighlight && (
            <button
              className={styles.highlightBtn}
              onClick={() => onOpenHighlight?.(match)}
            >
              ▶ Tonton highlight
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
