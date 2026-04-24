"use client";

import { useRef, useState, useEffect } from "react";
import AudioPlayer from "@/components/AudioPlayer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Track {
  videoId:   string;
  title:     string;
  channel:   string;
  duration:  string;
  thumbnail: string | null;
}

interface SearchResponse {
  tracks?: Track[];
  error?:  string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<Track[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search bar on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setSearchError("");
    setResults([]);

    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: SearchResponse = await res.json();

      if (!res.ok || !data.tracks) {
        setSearchError(data.error ?? "Search failed. Please try again.");
        return;
      }
      setResults(data.tracks);
    } catch {
      setSearchError("Network error — could not reach the search API.");
    } finally {
      setSearching(false);
    }
  };

  // ── Play a track ──────────────────────────────────────────────────────────
  const handlePlay = (track: Track) => {
    setActiveTrack(track);
  };

  return (
    <div className="app-container">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar__logo">
          <span className="sidebar__logo-icon">▶</span>
          <h2>Aura Music</h2>
        </div>
        <nav className="sidebar__nav">
          <a href="#" className="sidebar__link sidebar__link--active">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Home
          </a>
          <a href="#" className="sidebar__link" onClick={() => inputRef.current?.focus()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            Search
          </a>
          <a href="#" className="sidebar__link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"></path></svg>
            Your Library
          </a>
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <header className="main-header">
          <form className="search-bar" onSubmit={handleSearch}>
            <svg className="search-bar__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            <input
              ref={inputRef}
              type="search"
              className="search-bar__input"
              placeholder="What do you want to listen to?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            {searching && <span className="search-bar__spinner"></span>}
          </form>
        </header>

        <div className="content-area">
          {searchError && (
            <div className="error-banner">
              ⚠ {searchError}
            </div>
          )}

          {!searching && results.length === 0 && !searchError && (
            <div className="empty-state">
              <h2>Listen to your favorite music</h2>
              <p>Search for songs, artists, or albums to start streaming instantly.</p>
            </div>
          )}

          {results.length > 0 && (
            <section className="results-section">
              <h2 className="section-title">Top Results</h2>
              <div className="track-grid">
                {results.map((track) => {
                  const isActive = activeTrack?.videoId === track.videoId;
                  return (
                    <div 
                      key={track.videoId} 
                      className={`track-card ${isActive ? 'track-card--active' : ''}`}
                      onClick={() => handlePlay(track)}
                    >
                      <div className="track-card__image-container">
                        {track.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="track-card__image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="track-card__image-placeholder"></div>
                        )}
                        <button 
                          className="track-card__play-btn"
                          aria-label={`Play ${track.title}`}
                          onClick={(e) => { e.stopPropagation(); handlePlay(track); }}
                        >
                          {isActive ? "⏸" : "▶"}
                        </button>
                      </div>
                      <h3 className="track-card__title" title={track.title}>{track.title}</h3>
                      <p className="track-card__channel">{track.channel}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── Bottom Player Bar ── */}
      {activeTrack && (
        <AudioPlayer
          key={activeTrack.videoId}
          track={activeTrack}
          autoPlay
          onPlay={() => console.log("▶ Playback started:", activeTrack.title)}
          onError={(msg) => console.error("AudioPlayer error:", msg)}
        />
      )}
    </div>
  );
}
