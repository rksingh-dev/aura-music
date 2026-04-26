import { NextRequest, NextResponse } from "next/server";
import { parseYoutubeUsaTopSongs } from "@/utils/youtube_usa_charts_scraper";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

let youtubeUsaCache: any[] = [];
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_FILE = join(process.cwd(), "youtube_usa_cache.json");

function loadCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      const raw = readFileSync(CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.tracks && parsed.timestamp) {
        youtubeUsaCache = parsed.tracks;
        cacheTimestamp = parsed.timestamp;
        console.log("[/api/youtube-usa] Loaded cache from file");
      }
    }
  } catch (e) {
    console.error("[/api/youtube-usa] Error loading cache:", e);
  }
}

function saveCache() {
  try {
    const data = { tracks: youtubeUsaCache, timestamp: cacheTimestamp };
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log("[/api/youtube-usa] Saved cache to file");
  } catch (e) {
    console.error("[/api/youtube-usa] Error saving cache:", e);
  }
}

// Load on module init
loadCache();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const now = Date.now();
  const isCacheValid = cacheTimestamp && now - cacheTimestamp < CACHE_DURATION;

  if (isCacheValid && !forceRefresh && youtubeUsaCache.length) {
    console.log("[/api/youtube-usa] Using cached data");
    return NextResponse.json({ tracks: youtubeUsaCache, cached: true }, { status: 200 });
  }

  try {
    console.log("[/api/youtube-usa] Fetching fresh USA top songs...");
    const rawTracks = await parseYoutubeUsaTopSongs();
    if (rawTracks.length === 0) {
      throw new Error("No tracks returned from USA scraper");
    }
    const tracks = rawTracks.map(t => ({
      videoId: t.videoId,
      title: t.title,
      channel: t.artist,
      duration: "?",
      thumbnail: t.thumbnail || null,
      billboardRank: t.rank,
      billboardTitle: t.title,
      billboardArtist: t.artist,
    }));
    youtubeUsaCache = tracks;
    cacheTimestamp = now;
    saveCache();
    return NextResponse.json({ tracks, cached: false }, { status: 200 });
  } catch (e) {
    console.error("[/api/youtube-usa] Fetch error:", e);
    if (youtubeUsaCache.length) {
      return NextResponse.json({ tracks: youtubeUsaCache, cached: true, error: "Using stale cache" }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to fetch YouTube USA playlist" }, { status: 500 });
  }
}
