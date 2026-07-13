import { NextRequest, NextResponse } from "next/server";
import { parseYoutubeIndiaTopSongs } from "@/utils/youtube_charts_scraper";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

let youtubeIndiaCache: any[] = [];
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_FILE = join(process.cwd(), "youtube_india_cache.json");

function loadCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      const raw = readFileSync(CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.tracks && parsed.timestamp) {
        youtubeIndiaCache = parsed.tracks;
        cacheTimestamp = parsed.timestamp;
        console.log("[/api/youtube-india] Loaded cache from file");
      }
    }
  } catch (e) {
    console.error("[/api/youtube-india] Error loading cache:", e);
  }
}

function saveCache() {
  try {
    const data = { tracks: youtubeIndiaCache, timestamp: cacheTimestamp };
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log("[/api/youtube-india] Saved cache to file");
  } catch (e) {
    console.error("[/api/youtube-india] Error saving cache:", e);
  }
}

// Load on module init
loadCache();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const now = Date.now();
  const isCacheValid = cacheTimestamp && now - cacheTimestamp < CACHE_DURATION;

  // Return cache if valid and not forced
  if (isCacheValid && !forceRefresh && youtubeIndiaCache.length) {
    console.log("[/api/youtube-india] Using cached data");
    return NextResponse.json({ tracks: youtubeIndiaCache, cached: true }, { status: 200 });
  }

  try {
    console.log("[/api/youtube-india] Fetching fresh Youtube India Top Songs...");
    const rawTracks = await parseYoutubeIndiaTopSongs();
    
    if (rawTracks.length === 0) {
        throw new Error("No tracks returned from scraper");
    }

    // Map to the Track shape used by the UI
    const tracks = rawTracks.map(t => ({
      videoId: t.videoId,
      title: t.title,
      channel: t.artist,
      duration: "?",
      thumbnail: t.thumbnail || null,
      billboardRank: t.rank,
      billboardTitle: t.title,
      billboardArtist: t.artist
    }));

    youtubeIndiaCache = tracks;
    cacheTimestamp = now;
    saveCache();

    return NextResponse.json({ tracks, cached: false }, { status: 200 });
  } catch (e) {
    console.error("[/api/youtube-india] Fetch error:", e);
    // Fallback to stale cache if present
    if (youtubeIndiaCache.length) {
      return NextResponse.json({ tracks: youtubeIndiaCache, cached: true, error: "Using stale cache" }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to fetch YouTube India playlist" }, { status: 500 });
  }
}
