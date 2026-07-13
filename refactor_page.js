const fs = require('fs');

const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Replace the top states and fetch functions
const stateStart = content.indexOf('  const [trending, setTrending] = useState<Track[]>([]);');
const searchRefStart = content.indexOf('  const inputRef = useRef<HTMLInputElement>(null);');

if (stateStart === -1 || searchRefStart === -1) {
  console.error('Could not find state/fetch boundaries');
  process.exit(1);
}

const newStateAndFetch = `
  const [chartMode, setChartMode] = useState<string>('global');
  
  const PLAYLIST_CATEGORIES = [
    { id: 'global', label: 'Global', endpoint: '/api/youtube-global', isStatic: false },
    { id: 'india', label: 'India', endpoint: '/api/youtube-india', isStatic: false },
    { id: 'usa', label: 'USA', endpoint: '/api/youtube-usa', isStatic: false },
    { id: 'bollywood', label: 'Bollywood', endpoint: '/api/playlist?id=RDCLAK5uy_n9Fbdw7e6ap-98_A-8JYBmPv64v-Uaq1g', isStatic: false },
    { id: 'billboard', label: 'Billboard', endpoint: '/api/search', isStatic: false },
    { id: 'rks', label: 'RKS', endpoint: '', isStatic: true },
  ];

  type PlaylistData = { tracks: Track[]; lastUpdated: string | null; };
  const [playlistsData, setPlaylistsData] = useState<Record<string, PlaylistData>>({});
  const [refreshingCat, setRefreshingCat] = useState<string | null>(null);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchCategory = async (catId: string, refresh = false) => {
    const cat = PLAYLIST_CATEGORIES.find(c => c.id === catId);
    if (!cat) return;
    
    if (cat.isStatic) {
      if (catId === 'rks') {
        setPlaylistsData(prev => ({ ...prev, [catId]: { tracks: rksChart, lastUpdated: new Date().toLocaleString() } }));
      }
      return;
    }

    setRefreshingCat(catId);
    try {
      const url = new URL(cat.endpoint, window.location.origin);
      if (refresh) {
        url.searchParams.set('refresh', 'true');
        url.searchParams.set('t', Date.now().toString());
      }
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.tracks) {
        setPlaylistsData(prev => ({
          ...prev,
          [catId]: {
            tracks: data.tracks,
            lastUpdated: refresh || !data.cached ? new Date().toLocaleString() : prev[catId]?.lastUpdated || null
          }
        }));
      } else {
        console.error(\`Failed to fetch \${catId}:\`, data.error);
      }
    } catch (err) {
      console.error(\`Network error while fetching \${catId}:\`, err);
    } finally {
      setRefreshingCat(null);
    }
  };

  useEffect(() => {
    // Initial fetch for dynamic categories
    PLAYLIST_CATEGORIES.forEach(cat => {
      if (!cat.isStatic) fetchCategory(cat.id);
    });
  }, []);

  useEffect(() => {
    if (chartMode === 'rks') fetchCategory('rks');
  }, [chartMode]);

`;

content = content.slice(0, stateStart) + newStateAndFetch + content.slice(searchRefStart);

// 2. Remove handleRefresh as it's no longer needed
const handleRefreshStart = content.indexOf('  // ── Refresh Billboard data');
const handleRefreshEnd = content.indexOf('  return (');
if (handleRefreshStart !== -1 && handleRefreshEnd !== -1) {
  content = content.slice(0, handleRefreshStart) + content.slice(handleRefreshEnd);
}

// 3. Replace the chart-mode-toggle div
const toggleStart = content.indexOf('<div className="chart-mode-toggle">');
const toggleEnd = content.indexOf('</div>', toggleStart) + 6;
const newToggle = `          <div className="chart-mode-toggle">
            {PLAYLIST_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={\`toggle-button \${chartMode === cat.id ? 'active' : ''}\`}
                onClick={() => setChartMode(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>`;

content = content.slice(0, toggleStart) + newToggle + content.slice(toggleEnd);

// 4. Replace the sections entirely down to the closing div before Mobile Bottom Navigation
const sectionsStart = content.indexOf("              {chartMode === 'india' && (");
const sectionsEnd = content.indexOf('      {/* ── Mobile Bottom Navigation ── */}'); // this is safe!

const newSections = `
              {PLAYLIST_CATEGORIES.map(cat => {
                if (chartMode !== cat.id) return null;
                const pData = playlistsData[cat.id];
                const tracks = pData?.tracks || [];
                const isRefreshing = refreshingCat === cat.id;
                
                return (
                  <section key={cat.id} className="results-section">
                    <div className="section-header">
                      <h2 className="section-title">{cat.label} Chart</h2>
                      {!cat.isStatic && (
                        <button
                          className="refresh-button"
                          onClick={() => fetchCategory(cat.id, true)}
                          disabled={isRefreshing}
                          title={\`Refresh \${cat.label} top songs\`}
                        >
                          {isRefreshing ? '⟳' : '↻'}
                        </button>
                      )}
                    </div>
                    {pData?.lastUpdated && (
                      <p className="last-updated">Last updated: {pData.lastUpdated}</p>
                    )}
                    <div className="track-grid">
                      {tracks.map((track, index) => {
                        const isActive = activeTrack?.videoId === track.videoId;
                        const uniqueKey = track.videoId || \`\${track.title}-\${track.channel}-\${index}\`;
                        const isLoading = loadingTrack === \`\${track.billboardTitle || ''}\${track.billboardArtist || ''}\`;
                        const hasImageError = imageErrors.has(uniqueKey);
                        const showImage = track.thumbnail && !hasImageError && !isLoading;
                        
                        return (
                          <div
                            key={uniqueKey}
                            className={\`track-card \${isActive ? 'track-card--active' : ''} \${isLoading ? 'track-card--loading' : ''}\`}
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
                                  aria-label={\`Play \${track.title}\`}
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
                );
              })}
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
                    const uniqueKey = track.videoId || \`\${track.title}-\${track.channel}-\${index}\`;
                    const hasImageError = imageErrors.has(uniqueKey);
                    const showImage = track.thumbnail && !hasImageError;
                    
                    return (
                      <div 
                        key={uniqueKey} 
                        className={\`track-card \${isActive ? 'track-card--active' : ''}\`}
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
                           aria-label={\`Play \${track.title}\`}
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

`;

content = content.slice(0, sectionsStart) + newSections + content.slice(sectionsEnd);

fs.writeFileSync(file, content, 'utf-8');
console.log('Successfully refactored page.tsx');
