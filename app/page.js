'use client';

import { useEffect, useState, useCallback } from 'react';
import MatchCard from './components/MatchCard';
import HighlightModal from './components/HighlightModal';
import styles from './page.module.css';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'live', label: 'Live' },
  { key: 'finished', label: 'Selesai' },
  { key: 'scheduled', label: 'Terjadwal' },
];

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setError(null);
        setMatches(data.matches || []);
      }
      setLastUpdated(new Date());
    } catch (e) {
      setError('Gagal memuat data. Cek koneksi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const hasLive = matches.some((m) => m.status === 'live');
    const interval = setInterval(load, hasLive ? 15000 : 30000);
    return () => clearInterval(interval);
  }, [load, matches]);

  const filtered = matches.filter((m) => filter === 'all' || m.status === filter);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.logo}>
            MATCH<span>DAY</span>
          </h1>
          {lastUpdated && (
            <span className={styles.updated}>
              Update {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <nav className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Pastikan HIGHLIGHTLY_API_KEY sudah diatur dengan benar di environment variables.
          </p>
        </div>
      )}

      {loading && !error && <p className={styles.loading}>Memuat pertandingan…</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className={styles.empty}>Belum ada pertandingan untuk kategori ini hari ini.</p>
      )}

      <div className={styles.grid}>
        {filtered.map((match) => (
          <MatchCard key={match.id} match={match} onOpenHighlight={setActiveHighlight} />
        ))}
      </div>

      <HighlightModal match={activeHighlight} onClose={() => setActiveHighlight(null)} />
    </main>
  );
}
