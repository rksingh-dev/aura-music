# RahulYTMUSIC

A **Next.js** music explorer that aggregates top tracks from multiple charts (Billboard, YouTube India, Global, USA) and provides instant playback via YouTube.
It is ad‑free and offers unlimited songs, streaming directly from YouTube without ads.

## Core Logic & Features
- **Chart Mode** – toggle between *global*, *india*, *usa* and *billboard* charts; data is fetched from `/api/...` endpoints and cached with a timestamp.
- **Search** – free‑text search (`/api/search?q=…`) returns matching tracks; results replace the home view.
- **Playback** – a global `PlayerContext` drives a single audio player. Clicking a track sets `activeTrack`; if a Billboard entry lacks a `videoId`, a secondary `/api/youtube-search` call resolves it before playing.
- **Refresh** – each chart section has a refresh button that forces a fresh API call (`?refresh=true`) and displays a spinner while loading.
- **Image Handling** – lazy‑loaded thumbnails with graceful fallback placeholders; broken images are skipped via an error set.
- **Responsive UI** – sidebar navigation on desktop, mobile menu toggle, and a bottom navigation bar for small screens.
- **State Management** – React `useState` tracks query, results, loading flags, errors, image errors, and timestamps for each chart.

## How It Works
On load, the app fetches top‑track data for each region from the `/api/...` endpoints and caches timestamps. Users toggle chart mode to view regional lists, refresh data on demand, or use the search bar to query tracks. Clicking a track updates the global `PlayerContext`; if a Billboard entry lacks a YouTube video ID, a secondary API call resolves it before playback. All playback streams directly from YouTube, ensuring an ad‑free experience.

## Development
```bash
npm install   # install dependencies
npm run dev   # start the dev server (http://localhost:3000)
```

The app auto‑reloads on file changes. Feel free to explore and extend the scraper utilities under `src/utils/`.
