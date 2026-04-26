"use client";

import { useRef, useState, useEffect } from "react";
import { usePlayer } from "@/app/lib/PlayerContext";
// AudioPlayer moved to global player bar

// ─── RKS Chart Data ────────────────────────────────────────────────────────
const rksChart: Track[] = [
  { videoId: "", title: "Is There Someone Else? — The Weeknd", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Open Hearts — The Weeknd", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "bargad — sufr, Arpit Bala, toorjo dey", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "PILLOWTALK — ZAYN", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Haseen — Talwiinder, NDS, Rippy Grewal", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Khayaal — Talwiinder, NDS", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Tu — Talwiinder, Sanjoy", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "I Wonder — Kanye West", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Maharani — Karun, Lambo Drive, Arpit Bala, GHIL...", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "NIGHTS LIKE THIS — The Kid LAROI", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Gallan 4 — Talwiinder", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Labon Ko — Pritam, KK, Sayeed Quadri", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Tere Liye — Atif Aslam, Shreya Ghoshal, Sachin G...", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Tu Hi Meri Shab Hai — Pritam, KK", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "3 Nights — Dominic Fike", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "GOSSIP (feat. Tom Morello) — Måneskin, Tom Morello", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "I WANNA BE YOUR SLAVE — Måneskin", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Beggin' — Måneskin", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "SAD GIRLZ LUV MONEY Remix — Amaarae, Kali Uchis, MOLIY", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "End of Beginning — Djo", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Gata Only — FloyyMenor, Cris MJ", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "One Dance — Drake, Wizkid, Kyla", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Antisocial (with Travis Scott) — Ed Sheeran, Travis Scott, Steel Banglez, Zeph Ellis", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Baptized In Fear — The Weeknd", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Pray For Me — The Weeknd, Kendrick Lamar", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "TKN (feat. Travis Scott) — ROSALÍA, Travis Scott", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "fat funny friend (sped up) — daddy's girl, creamy, 11:11 Music Group", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "GIRLS — The Kid LAROI", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "I Wanna Be Yours — Arctic Monkeys", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Jimmy Cooks (feat. 21 Savage) — Drake, 21 Savage", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Say Yes To Heaven — Lana Del Rey", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "God's Plan — Drake", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Radio — Lana Del Rey", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Diet Mountain Dew — Lana Del Rey", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "STAR WALKIN' — Lil Nas X", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "INDUSTRY BABY — Lil Nas X, Jack Harlow", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "MONTERO (Call Me By Your Name) — Lil Nas X", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Sweater Weather — The Neighbourhood", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Good In Goodbye — Madison Beer", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Swimming Pools (Drank) — Kendrick Lamar", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Heartless — Kanye West", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Heathens — Twenty One Pilots", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Lover — Taylor Swift", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "The Search — NF", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "Agora Hills — Doja Cat", channel: "", duration: "?", thumbnail: null },
  { videoId: "", title: "West Coast — Lana Del Rey ", channel: "", duration: "?", thumbnail: null },
];

// Initialize RKS top songs state later


// ─── Types ────────────────────────────────────────────────────────────────────

export interface Track {
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
  const { activeTrack, setActiveTrack } = usePlayer();
  const [trending, setTrending] = useState<Track[]>([]);
  const [indiaTopSongs, setIndiaTopSongs] = useState<Track[]>([]);
  const [globalTopSongs, setGlobalTopSongs] = useState<Track[]>([]);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chartMode, setChartMode] = useState<'billboard' | 'india' | 'global' | 'usa' | 'rks'>('global');
  const [refreshingIndia, setRefreshingIndia] = useState(false);
  const [indiaLastUpdated, setIndiaLastUpdated] = useState<string | null>(null);
  const [refreshingGlobal, setRefreshingGlobal] = useState(false);
  const [globalLastUpdated, setGlobalLastUpdated] = useState<string | null>(null);
  const [refreshingUsa, setRefreshingUsa] = useState(false);
  const [usaLastUpdated, setUsaLastUpdated] = useState<string | null>(null);
  const [usaTopSongs, setUsaTopSongs] = useState<Track[]>([]);
  const [rksTopSongs, setRksTopSongs] = useState<Track[]>([]);

  // Fetch India top songs from YouTube Charts
  const fetchIndiaTopSongs = async (refresh = false) => {
    if (refresh) setRefreshingIndia(true);
    try {
      const url = refresh ? "/api/youtube-india?refresh=true" : "/api/youtube-india";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.tracks) {
        setIndiaTopSongs(data.tracks);
        if (!data.cached || refresh) {
          setIndiaLastUpdated(new Date().toLocaleString());
        }
      } else {
        console.error("Failed to fetch India top songs:", data.error);
      }
    } catch (err) {
      console.error("Network error while fetching India top songs:", err);
    } finally {
      if (refresh) setRefreshingIndia(false);
    }
  };

  // Fetch Global top songs from YouTube Charts
  const fetchGlobalTopSongs = async (refresh = false) => {
    if (refresh) setRefreshingGlobal(true);
    try {
      const url = refresh ? "/api/youtube-global?refresh=true" : "/api/youtube-global";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.tracks) {
        setGlobalTopSongs(data.tracks);
        if (!data.cached || refresh) {
          setGlobalLastUpdated(new Date().toLocaleString());
        }
      } else {
        console.error("Failed to fetch Global top songs:", data.error);
      }
    } catch (err) {
      console.error("Network error while fetching Global top songs:", err);
    } finally {
      if (refresh) setRefreshingGlobal(false);
    }
  };

  // Load static trending tracks on mount
  // Fetch USA top songs from YouTube Charts
  const fetchUsaTopSongs = async (refresh = false) => {
    if (refresh) setRefreshingUsa(true);
    try {
      const url = refresh ? "/api/youtube-usa?refresh=true" : "/api/youtube-usa";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.tracks) {
        setUsaTopSongs(data.tracks);
        if (!data.cached || refresh) {
          setUsaLastUpdated(new Date().toLocaleString());
        }
      } else {
        console.error("Failed to fetch USA top songs:", data.error);
      }
    } catch (err) {
      console.error("Network error while fetching USA top songs:", err);
    } finally {
      if (refresh) setRefreshingUsa(false);
    }
  };
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
      fetchIndiaTopSongs(); fetchGlobalTopSongs(); fetchUsaTopSongs();
    }, []);

    // Load RKS chart data when selected
    useEffect(() => {
      if (chartMode === 'rks') {
        setRksTopSongs(rksChart);
      }
    }, [chartMode]);

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
      setResults(Array.from(new Map(data.tracks.map(t => [t.title.toLowerCase(), t])).values())); // deduplicate by title
    } catch {
      setSearchError("Network error — could not reach the search API.");
    } finally {
      setSearching(false);
    }
  };

  // ── Play a track ──────────────────────────────────────────────────────────
  const handlePlay = async (track: Track) => {
    // If track doesn't have a videoId, attempt to fetch it from YouTube
    if (!track.videoId) {
      // Try Billboard style fields first
      if (track.billboardTitle && track.billboardArtist) {
        const trackKey = track.billboardTitle + track.billboardArtist;
        setLoadingTrack(trackKey);
        try {
          const res = await fetch(`/api/youtube-search?title=${encodeURIComponent(track.billboardTitle)}&artist=${encodeURIComponent(track.billboardArtist)}`);
          const data = await res.json();
          if (res.ok && data.videoId) {
            const updatedTrack = { ...track, videoId: data.videoId, title: data.title, channel: data.channel, duration: data.duration, thumbnail: data.thumbnail || track.thumbnail };
            setActiveTrack(updatedTrack);
            setLoadingTrack(null);
            return;
          }
        } catch (err) {
          console.error("Error fetching YouTube video (Billboard):", err);
        }
        setLoadingTrack(null);
      } else if (track.title.includes('—')) {
        // Generic format: "Title — Artist"
        const [rawTitle, rawArtist] = track.title.split('—').map(s => s.trim());
        const trackKey = rawTitle + rawArtist;
        setLoadingTrack(trackKey);
        try {
          const res = await fetch(`/api/youtube-search?title=${encodeURIComponent(rawTitle)}&artist=${encodeURIComponent(rawArtist)}`);
          const data = await res.json();
          if (res.ok && data.videoId) {
            const updatedTrack = { ...track, videoId: data.videoId, title: data.title, channel: data.channel, duration: data.duration, thumbnail: data.thumbnail || track.thumbnail };
            setActiveTrack(updatedTrack);
            setLoadingTrack(null);
            return;
          }
        } catch (err) {
          console.error("Error fetching YouTube video (RKS):", err);
        }
        setLoadingTrack(null);
      }
    }
    // Fallback: play whatever we have (may be missing videoId)
    setActiveTrack(track);
  };

  // ── Play next track when current ends ────────────────────────────────────────
  const playNextTrack = useCallback(() => {
    if (!activeTrack) return;
    const list = (() => {
      switch (chartMode) {
        case 'india': return indiaTopSongs;
        case 'global': return globalTopSongs;
        case 'usa': return usaTopSongs;
        case 'billboard': return trending;
        case 'rks': return rksTopSongs;
        default: return [];
      }
    })();
    const currentIndex = list.findIndex(t => t.videoId && t.videoId === activeTrack.videoId);
    if (currentIndex >= 0 && currentIndex < list.length - 1) {
      const nextTrack = list[currentIndex + 1];
      // Initiate playback of next track (will fetch videoId if needed)
      handlePlay(nextTrack);
    }
  }, [activeTrack, chartMode, indiaTopSongs, globalTopSongs, usaTopSongs, trending, rksTopSongs]);

  // Listen for track-ended custom event from AudioPlayer
  useEffect(() => {
    const onEnded = () => {
      playNextTrack();
    };
    window.addEventListener('track-ended', onEnded);
    return () => window.removeEventListener('track-ended', onEnded);
  }, [playNextTrack]);

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
        <a href="/" className="sidebar__logo">
          <span className="sidebar__logo-icon">▶</span>
          <h2>rks</h2>
        </a>
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
          {/* Chart mode toggle */}
          <div className="chart-mode-toggle">
            <button
              className={`toggle-button ${chartMode === 'global' ? 'active' : ''}`}
              onClick={() => setChartMode('global')}
            >
              Global
            </button>
            <button
              className={`toggle-button ${chartMode === 'india' ? 'active' : ''}`}
              onClick={() => setChartMode('india')}
            >
              India
            </button>
            <button
              className={`toggle-button ${chartMode === 'usa' ? 'active' : ''}`}
              onClick={() => setChartMode('usa')}
            >
              USA
            </button>
<button
          className={`toggle-button ${chartMode === 'billboard' ? 'active' : ''}`}
          onClick={() => setChartMode('billboard')}
        >
          Billboard
        </button>
        <button
          className={`toggle-button ${chartMode === 'rks' ? 'active' : ''}`}
          onClick={() => setChartMode('rks')}
        >
          RKS
        </button>
          </div>
        </header>

        <div className="content-area">
          {searchError && (
            <div className="error-banner">
              ⚠ {searchError}
            </div>
          )}

{!searching && results.length === 0 && !searchError && (
            <>
              {chartMode === 'india' && indiaTopSongs.length > 0 && (
                <section className="results-section">
                  <div className="section-header">
                    <h2 className="section-title">Top Songs in India</h2>
                    <button 
                      className="refresh-button"
                      onClick={() => fetchIndiaTopSongs(true)}
                      disabled={refreshingIndia}
                      title="Refresh India Top Songs"
                    >
                      {refreshingIndia ? '⟳' : '↻'}
                    </button>
                  </div>
                  {indiaLastUpdated && (
                    <p className="last-updated">Last updated: {indiaLastUpdated}</p>
                  )}
                  <div className="track-grid">
                    {indiaTopSongs.map((track, index) => {
                      const isActive = activeTrack?.videoId === track.videoId;
                      const uniqueKey = track.videoId || `${track.title}-${track.channel}-${index}`;
                      const isLoading = loadingTrack === `${track.billboardTitle || ''}${track.billboardArtist || ''}`;
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
) : showImage && track.thumbnail ? (
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
                          
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
              {chartMode === 'billboard' && trending.length > 0 && (
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
                      const isLoading = loadingTrack === `${track.billboardTitle || ''}${track.billboardArtist || ''}`;
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
) : showImage && track.thumbnail ? (
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
                          
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            {chartMode === 'global' && globalTopSongs.length > 0 && (
                <section className="results-section">
                  <div className="section-header">
                    <h2 className="section-title">Top Songs Global</h2>
                    <button
                      className="refresh-button"
                      onClick={() => fetchGlobalTopSongs(true)}
                      disabled={refreshingGlobal}
                      title="Refresh Global top songs"
                    >
                      {refreshingGlobal ? '⟳' : '↻'}
                    </button>
                  </div>
                  {globalLastUpdated && (
                    <p className="last-updated">Last updated: {globalLastUpdated}</p>
                  )}
                  <div className="track-grid">
                    {globalTopSongs.map((track, index) => {
                      const isActive = activeTrack?.videoId === track.videoId;
                      const uniqueKey = track.videoId || `${track.title}-${track.channel}-${index}`;
                      const isLoading = loadingTrack === `${track.billboardTitle || ''}${track.billboardArtist || ''}`;
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
                              <div className="track-card__loading-overlay"><span className="track-card__spinner"></span></div>
                            ) : showImage && track.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={track.thumbnail}
                                alt={track.title}
                                className="track-card__image"
                                loading="lazy"
                                onError={() => handleImageError(uniqueKey)}
                              />
                            ) : (
                              <div className="track-card__image-placeholder"><div className="track-card__placeholder-icon">🎵</div></div>
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
                          
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            {chartMode === 'usa' && usaTopSongs.length > 0 && (
                <section className="results-section">
                  <div className="section-header">
                    <h2 className="section-title">Top Songs in USA</h2>
                    <button
                      className="refresh-button"
                      onClick={() => fetchUsaTopSongs(true)}
                      disabled={refreshingUsa}
                      title="Refresh USA top songs"
                    >
                      {refreshingUsa ? '⟳' : '↻'}
                    </button>
                  </div>
                  {usaLastUpdated && (
                    <p className="last-updated">Last updated: {usaLastUpdated}</p>
                  )}
                  <div className="track-grid">
                    {usaTopSongs.map((track, index) => {
                      const isActive = activeTrack?.videoId === track.videoId;
                      const uniqueKey = track.videoId || `${track.title}-${track.channel}-${index}`;
                      const isLoading = loadingTrack === `${track.billboardTitle || ''}${track.billboardArtist || ''}`;
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
                              <div className="track-card__loading-overlay"><span className="track-card__spinner"></span></div>
                            ) : showImage && track.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={track.thumbnail}
                                alt={track.title}
                                className="track-card__image"
                                loading="lazy"
                                onError={() => handleImageError(uniqueKey)}
                              />
                            ) : (
                              <div className="track-card__image-placeholder"><div className="track-card__placeholder-icon">🎵</div></div>
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
                <button className="back-button" onClick={() => { setResults([]); setQuery(""); setSearchError(""); }}>
                  ← Back to Home
                </button>
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
{showImage && track.thumbnail ? (
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
              {chartMode === 'rks' && rksTopSongs.length > 0 && (
                <section className="results-section">
                  <div className="section-header">
                    <h2 className="section-title">RKS Chart</h2>
                  </div>
                  <div className="track-grid">
                    {rksTopSongs.map((track, index) => {
                      const isActive = activeTrack?.videoId === track.videoId;
                      const uniqueKey = track.title + index;
                      return (
                        <div
                          key={uniqueKey}
                          className={`track-card ${isActive ? 'track-card--active' : ''}`}
                          onClick={() => handlePlay(track)}
                        >
                          <div className="track-card__image-container">
                            <div className="track-card__image-placeholder"><div className="track-card__placeholder-icon">🎵</div></div>
                            <button className="track-card__play-btn" aria-label={`Play ${track.title}`} onClick={(e) => { e.stopPropagation(); handlePlay(track); }}>
                              {isActive ? "⏸" : "▶"}
                            </button>
                          </div>
                          <h3 className="track-card__title" title={track.title}>{track.title}</h3>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
        </div>
      </main>


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
