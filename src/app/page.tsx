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
  billboardRank?: string;
  billboardTitle?: string;
  billboardArtist?: string;
}

interface SearchResponse {
  tracks?: Track[];
  error?:  string;
  cached?: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<Track[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [trending, setTrending] = useState<Track[]>([]);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load static trending tracks on mount
  useEffect(() => {
    // Fetch top tracks from API
    const fetchTopTracks = async () => {
      try {
        const res = await fetch("/api/search");
        const data: SearchResponse = await res.json();
        if (res.ok && data.tracks) {
          setTrending(data.tracks);
          if (!data.cached) {
            setLastUpdated(new Date().toLocaleString());
          }
        } else {
          console.error("Failed to fetch top tracks:", data.error);
        }
      } catch (err) {
        console.error("Network error while fetching top tracks:", err);
      }
    };

    fetchTopTracks();
  }, []);

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
  const handlePlay = async (track: Track) => {
    // If track doesn't have a videoId (Billboard track), fetch it first
    if (!track.videoId && track.billboardTitle && track.billboardArtist) {
      const trackKey = track.billboardTitle + track.billboardArtist;
      setLoadingTrack(trackKey);
      
      try {
        const res = await fetch(`/api/youtube-search?title=${encodeURIComponent(track.billboardTitle)}&artist=${encodeURIComponent(track.billboardArtist)}`);
        const data = await res.json();
        
        if (res.ok && data.videoId) {
          // Update the track with the YouTube video ID
          const updatedTrack = {
            ...track,
            videoId: data.videoId,
            title: data.title,
            channel: data.channel,
            duration: data.duration,
            thumbnail: data.thumbnail || track.thumbnail
          };
          setActiveTrack(updatedTrack);
          setLoadingTrack(null);
          return;
        }
      } catch (err) {
        console.error("Error fetching YouTube video:", err);
      }
      
      setLoadingTrack(null);
    }
    
    setActiveTrack(track);
  };

  // ── Handle image load errors ─────────────────────────────────────────────────
  const handleImageError = (trackKey: string) => {
    setImageErrors(prev => new Set([...prev, trackKey]));
  };

  // ── Refresh Billboard data ───────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/search?refresh=true");
      const data: SearchResponse = await res.json();
      if (res.ok && data.tracks) {
        setTrending(data.tracks);
        setLastUpdated(new Date().toLocaleString());
      } else {
        console.error("Failed to refresh Billboard data:", data.error);
      }
    } catch (err) {
      console.error("Network error while refreshing Billboard data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="app-container">
      {/* ── Mobile Menu Button ── */}
      <button 
        className="mobile-menu-button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mobileMenuOpen ? (
            <path d="M18 6L6 18M6 6l12 12"></path>
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18"></path>
          )}
        </svg>
      </button>

      {/* ── Mobile Menu Overlay ── */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'mobile-menu-overlay--active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__logo">
          <span className="sidebar__logo-icon">▶</span>
          <h2>rks</h2>
        </div>
        <nav className="sidebar__nav">
          <a href="#" className="sidebar__link sidebar__link--active">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Home
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
            <>
              {/* Trending Section */}
              {trending.length > 0 && (
                <section className="results-section">
                  <div className="section-header">
                    <h2 className="section-title">Top 50 Billboard Hits</h2>
                    <button 
                      className="refresh-button"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      title="Refresh Billboard data"
                    >
                      {refreshing ? '⟳' : '↻'}
                    </button>
                  </div>
                  {lastUpdated && (
                    <p className="last-updated">Last updated: {lastUpdated}</p>
                  )}
                  <div className="track-grid">
                    {trending.map((track, index) => {
                      const isActive = activeTrack?.videoId === track.videoId;
                      const uniqueKey = track.videoId || `${track.title}-${track.channel}-${index}`;
                      const isLoading = loadingTrack === (track.billboardTitle + track.billboardArtist);
                      const hasImageError = imageErrors.has(uniqueKey);
                      const showImage = track.thumbnail && !hasImageError && !isLoading;
                      
                      return (
                        <div
                          key={uniqueKey}
                          className={`track-card ${isActive ? 'track-card--active' : ''} ${isLoading ? 'track-card--loading' : ''}`}
                          onClick={() => !isLoading && handlePlay(track)}
                        >
                          <div className="track-card__image-container">
                            {isLoading ? (
                              <div className="track-card__loading-overlay">
                                <span className="track-card__spinner"></span>
                              </div>
                            ) : showImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={track.thumbnail}
                                alt={track.title}
                                className="track-card__image"
                                loading="lazy"
                                onError={() => handleImageError(uniqueKey)}
                              />
                            ) : (
                              <div className="track-card__image-placeholder">
                                <div className="track-card__placeholder-icon">🎵</div>
                              </div>
                            )}
                            {!isLoading && (
                              <button
                                className="track-card__play-btn"
                                aria-label={`Play ${track.title}`}
                                onClick={(e) => { e.stopPropagation(); handlePlay(track); }}
                              >
                                {isActive ? "⏸" : "▶"}
                              </button>
                            )}
                          </div>
                          <h3 className="track-card__title" title={track.title}>{track.title}</h3>
                          <p className="track-card__channel">{track.channel}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}


           {results.length > 0 && (
             <section className="results-section">
               <h2 className="section-title">Top picks</h2>
               <div className="track-grid">
                  {results.map((track, index) => {
                    const isActive = activeTrack?.videoId === track.videoId;
                    const uniqueKey = track.videoId || `${track.title}-${track.channel}-${index}`;
                    const hasImageError = imageErrors.has(uniqueKey);
                    const showImage = track.thumbnail && !hasImageError;
                    
                    return (
                      <div 
                        key={uniqueKey} 
                        className={`track-card ${isActive ? 'track-card--active' : ''}`}
                        onClick={() => handlePlay(track)}
                      >
                       <div className="track-card__image-container">
                         {showImage ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img
                             src={track.thumbnail}
                             alt={track.title}
                             className="track-card__image"
                             loading="lazy"
                             onError={() => handleImageError(uniqueKey)}
                           />
                         ) : (
                           <div className="track-card__image-placeholder">
                             <div className="track-card__placeholder-icon">🎵</div>
                           </div>
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

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-bottom-nav">
        <a href="#" className="mobile-nav-item mobile-nav-item--active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>Home</span>
        </a>
        <a href="#" className="mobile-nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          <span>Search</span>
        </a>
        <a href="#" className="mobile-nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
          <span>Library</span>
        </a>
      </nav>
    </div>
  );
}
