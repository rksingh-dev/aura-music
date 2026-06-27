# Codebase Summary: RahulYTMUSIC / Aura-Music

A **Next.js** music exploration and streaming application that aggregates popular music charts from multiple sources (Billboard Hot 100, Spotify Top Hits, Spotify India, and YouTube Weekly Charts for India, USA, and Global) and plays them ad-free using an invisible YouTube background player.

---

## 🛠️ Tech Stack & Key Dependencies

*   **Core Framework**: [Next.js 16](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/package.json#L15) (App Router, TypeScript) and [React 19](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/package.json#L18).
*   **Media Searching**: [`play-dl`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/package.json#L16) is used server-side to search YouTube for tracks and obtain video metadata.
*   **Scraping**:
    *   [`puppeteer`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/package.json#L17) (headless browser control) is used to load and scrape dynamic elements from YouTube Charts pages.
    *   [`cheerio`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/package.json#L13) and [`axios`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/package.json#L12) are used for standard HTML parsing (Billboard & Spotify playlists).
*   **Icons**: [`lucide-react`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/package.json#L14).

---

## 📂 Codebase Directory Structure

```
RAHULYTMUSIC/
├── .gemini/
│   └── codebase_summary.md          # [This File] Codebase summary and architectural overview
├── public/                          # Static assets
├── src/
│   ├── app/                         # Next.js App Router root
│   │   ├── api/                     # Backend API handlers for scraping and search
│   │   │   ├── billboard/           # Serves scraped Billboard charts
│   │   │   ├── spotify-india/       # Serves scraped Spotify India top songs
│   │   │   ├── spotify-tophits/     # Serves scraped Spotify global top hits
│   │   │   ├── youtube-global/      # Serves scraped YouTube Global Weekly Top Songs
│   │   │   ├── youtube-india/       # Serves scraped YouTube India Weekly Top Songs
│   │   │   ├── youtube-usa/         # Serves scraped YouTube USA Weekly Top Songs
│   │   │   ├── youtube-search/      # Helper to retrieve YouTube video ID by track metadata
│   │   │   └── search/              # Main route for playing/searching tracks using play-dl
│   │   ├── lib/                     # Global state & layouts
│   │   │   ├── PlayerContext.tsx    # React context managing the active track state
│   │   │   ├── PlayerBar.tsx        # AudioPlayer consumer rendered globally in the root layout
│   │   │   └── billboardParser.js   # Script parsing Billboard chart entries
│   │   ├── globals.css              # Application design stylesheet and styling configuration
│   │   ├── layout.tsx               # App root layout, wraps page content inside PlayerProvider
│   │   └── page.tsx                 # Main application dashboard and search UI
│   ├── components/
│   │   └── AudioPlayer.tsx          # Background player component that wraps the YouTube IFrame API
│   └── utils/                       # Web scraping modules
│       ├── billboard_scraper.ts     # Billboard Hot 100 Scraper (Cheerio)
│       ├── spotify_scraper.ts       # Spotify Top Playlist Scraper (Cheerio)
│       ├── youtube_charts_scraper.ts # YouTube India Weekly Top Songs Scraper (Puppeteer + Cheerio)
│       ├── youtube_global_charts_scraper.ts # YouTube Global Weekly Top Songs Scraper (Puppeteer + Cheerio)
│       └── youtube_usa_charts_scraper.ts # YouTube USA Weekly Top Songs Scraper (Puppeteer + Cheerio)
├── billboard_cache.json             # Local caching files for regional lists
├── youtube_global_cache.json        
├── youtube_india_cache.json         
├── youtube_usa_cache.json           
├── spotify_india_cache.json         
└── spotify_tophits_cache.json
```

---

## 🔄 Core Architectural Workflows

### 1. Music Chart Scraping & Local Caching
To avoid excessive network calls and blockings, chart data is cached locally on the disk as JSON files in the project root:
*   API route handlers (such as [`/api/youtube-india`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/src/app/api/youtube-india/route.ts)) inspect cache files first.
*   If a cache file exists and is less than 24 hours old, it is served directly.
*   If expired (or if the user clicks **Refresh** which adds `?refresh=true`), the handler runs the respective scraper module under [`src/utils`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/src/utils) using Puppeteer (for YouTube Charts) or Axios + Cheerio (for Spotify/Billboard). The new data is written to disk and returned.

### 2. Search & Track Identification
*   When a search is requested via the header bar, [`/api/search?q=...`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/src/app/api/search/route.ts) utilizes the `play-dl` library to search YouTube for videos matching the search query, returning a payload containing `videoId`, title, duration, and thumbnail.
*   If the user clicks on a track that doesn't have a `videoId` (such as parsed Spotify/Billboard charts where only titles/artists are scraped), the application performs a background request to [`/api/youtube-search?title=...&artist=...`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/src/app/api/youtube-search/route.ts) to lookup and resolve the closest matching video on YouTube.

### 3. Background Audio Playback System
*   **Context Layer**: State management is handled globally by [`PlayerContext`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/src/app/lib/PlayerContext.tsx). The [`PlayerProvider`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/src/app/lib/PlayerContext.tsx#L13) is injected at the root of the layout (`src/app/layout.tsx`).
*   **Player Container**: When a track is selected, the global context state updates the `activeTrack`. This renders [`PlayerBar.tsx`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/src/app/lib/PlayerBar.tsx), which embeds the [`AudioPlayer`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/src/components/AudioPlayer.tsx) component.
*   **Playback Integration**: The [`AudioPlayer`](file:///c:/Users/Sanjay/Downloads/RAHULYTMUSIC/src/components/AudioPlayer.tsx) dynamically loads the official [YouTube IFrame Player API](https://www.youtube.com/iframe_api). It constructs a headless, invisible YouTube player (`width: 0`, `height: 0`), and maps custom control states (Play, Pause, Progress, Duration, Volume) to the underlying YouTube player instance.

---

## 🚀 Running Locally

Install the packages and run the local development server:
```bash
npm install
npm run dev
```
The server will boot on `http://localhost:3000`.
