import { NextRequest, NextResponse } from "next/server";
import { parseSpotifyIndiaTopSongs } from "@/utils/spotify_scraper";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

let spotifyCache: any[] = [];
let spotifyCacheTimestamp: number | null = null;
const SPOTIFY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 h
const SPOTIFY_CACHE_FILE = join(process.cwd(), "spotify_india_cache.json");

function loadCache() {
  try {
    if (existsSync(SPOTIFY_CACHE_FILE)) {
      const raw = readFileSync(SPOTIFY_CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.tracks && parsed.timestamp) {
        spotifyCache = parsed.tracks;
        spotifyCacheTimestamp = parsed.timestamp;
        console.log("[/api/spotify-india] Loaded cache from file");
      }
    }
  } catch (e) {
    console.error("[/api/spotify-india] Error loading cache:", e);
  }
}

function saveCache() {
  try {
    const data = { tracks: spotifyCache, timestamp: spotifyCacheTimestamp };
    writeFileSync(SPOTIFY_CACHE_FILE, JSON.stringify(data, null, 2));
    console.log("[/api/spotify-india] Saved cache to file");
  } catch (e) {
    console.error("[/api/spotify-india] Error saving cache:", e);
  }
}

// Load on module init
loadCache();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const now = Date.now();
  const isCacheValid = spotifyCacheTimestamp && now - spotifyCacheTimestamp < SPOTIFY_CACHE_DURATION;

  // Return cache if valid and not forced
  if (isCacheValid && !forceRefresh && spotifyCache.length) {
    console.log("[/api/spotify-india] Using cached data");
    return NextResponse.json({ tracks: spotifyCache, cached: true }, { status: 200 });
  }

  try {
    const rawTracks = await parseSpotifyIndiaTopSongs();
    // Map to the Track shape used by the UI
    const tracks = rawTracks.map(t => ({
      videoId: "", // No YouTube video yet
      title: t.title,
      channel: t.artist,
      duration: "—",
      thumbnail: t.thumbnail || null
    }));

    spotifyCache = tracks;
    spotifyCacheTimestamp = now;
    saveCache();

    return NextResponse.json({ tracks, cached: false }, { status: 200 });
  } catch (e) {
    console.error("[/api/spotify-india] Fetch error:", e);
    // Fallback to stale cache if present
    if (spotifyCache.length) {
      return NextResponse.json({ tracks: spotifyCache, cached: true, error: "Using stale cache" }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to fetch Spotify playlist" }, { status: 500 });
  }
}

    