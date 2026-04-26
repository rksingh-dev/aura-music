import { NextRequest, NextResponse } from "next/server";
import { parseYoutubeGlobalTopSongs } from "@/utils/youtube_global_charts_scraper";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

let youtubeGlobalCache: any[] = [];
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_FILE = join(process.cwd(), "youtube_global_cache.json");

function loadCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      const raw = readFileSync(CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.tracks && parsed.timestamp) {
        youtubeGlobalCache = parsed.tracks;
        cacheTimestamp = parsed.timestamp;
        console.log("[/api/youtube-global] Loaded cache from file");
      }
    }
  } catch (e) {
    console.error("[/api/youtube-global] Error loading cache:", e);
  }
}

function saveCache() {
  try {
    const data = { tracks: youtubeGlobalCache, timestamp: cacheTimestamp };
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log("[/api/youtube-global] Saved cache to file");
  } catch (e) {
    console.error("[/api/youtube-global] Error saving cache:", e);
  }
}

// Load on module init
loadCache();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const now = Date.now();
  const isCacheValid = cacheTimestamp && now - cacheTimestamp < CACHE_DURATION;

  if (isCacheValid && !forceRefresh && youtubeGlobalCache.length) {
    console.log("[/api/youtube-global] Using cached data");
    return NextResponse.json({ tracks: youtubeGlobalCache, cached: true }, { status: 200 });
  }

  try {
    console.log("[/api/youtube-global] Fetching fresh global top songs...");
    const rawTracks = await parseYoutubeGlobalTopSongs();
    if (rawTracks.length === 0) {
      throw new Error("No tracks returned from global scraper");
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
    youtubeGlobalCache = tracks;
    cacheTimestamp = now;
    saveCache();
    return NextResponse.json({ tracks, cached: false }, { status: 200 });
  } catch (e) {
    console.error("[/api/youtube-global] Fetch error:", e);
    if (youtubeGlobalCache.length) {
      return NextResponse.json({ tracks: youtubeGlobalCache, cached: true, error: "Using stale cache" }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to fetch YouTube global playlist" }, { status: 500 });
  }
}
