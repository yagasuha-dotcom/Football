'use client';

import { useEffect, useState } from 'react';
import styles from './HighlightModal.module.css';

function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function HighlightModal({ match, onClose }) {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!match) return;
    setLoading(true);
    fetch(`/api/highlights?matchId=${match.id}`)
      .then((r) => r.json())
      .then((data) => setHighlights(data.highlights || []))
      .catch(() => setHighlights([]))
      .finally(() => setLoading(false));
  }, [match]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!match) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
          ✕
        </button>
        <h2 className={styles.title}>
          {match.homeTeam?.name} {match.homeScore}–{match.awayScore} {match.awayTeam?.name}
        </h2>

        {loading && <p className={styles.status}>Memuat highlight…</p>}
        {!loading && highlights.length === 0 && (
          <p className={styles.status}>Highlight belum tersedia untuk pertandingan ini.</p>
        )}

        <div className={styles.list}>
          {highlights.map((h, i) => {
            const ytId = getYouTubeId(h.url || h.embedUrl);
            return (
              <div key={i} className={styles.item}>
                <p className={styles.itemTitle}>{h.title}</p>
                {ytId ? (
                  <div className={styles.videoWrap}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title={h.title || 'Highlight'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : h.url ? (
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    Buka video ↗
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
