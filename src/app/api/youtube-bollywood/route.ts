import { NextRequest, NextResponse } from "next/server";
import { parseYoutubeBollywoodSongs } from "@/utils/youtube_bollywood_scraper";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

let youtubeBollywoodCache: any[] = [];
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_FILE = join(process.cwd(), "youtube_bollywood_cache.json");

function loadCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      const raw = readFileSync(CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.tracks && parsed.timestamp) {
        youtubeBollywoodCache = parsed.tracks;
        cacheTimestamp = parsed.timestamp;
        console.log("[/api/youtube-bollywood] Loaded cache from file");
      }
    }
  } catch (e) {
    console.error("[/api/youtube-bollywood] Error loading cache:", e);
  }
}

function saveCache() {
  try {
    const data = { tracks: youtubeBollywoodCache, timestamp: cacheTimestamp };
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log("[/api/youtube-bollywood] Saved cache to file");
  } catch (e) {
    console.error("[/api/youtube-bollywood] Error saving cache:", e);
  }
}

// Load on module init
loadCache();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const now = Date.now();
  const isCacheValid = cacheTimestamp && now - cacheTimestamp < CACHE_DURATION;

  if (isCacheValid && !forceRefresh && youtubeBollywoodCache.length) {
    console.log("[/api/youtube-bollywood] Using cached data");
    return NextResponse.json({ tracks: youtubeBollywoodCache, cached: true }, { status: 200 });
  }

  try {
    console.log("[/api/youtube-bollywood] Fetching fresh bollywood top songs...");
    const rawTracks = await parseYoutubeBollywoodSongs();
    if (rawTracks.length === 0) {
      throw new Error("No tracks returned from bollywood scraper");
    }
    const tracks = rawTracks.map(t => ({
      videoId: t.videoId,
      title: t.title,
      channel: t.artist,
      duration: "?",
      thumbnail: t.thumbnail || null,
      billboardTitle: t.title,
      billboardArtist: t.artist,
    }));
    youtubeBollywoodCache = tracks;
    cacheTimestamp = now;
    saveCache();
    return NextResponse.json({ tracks, cached: false }, { status: 200 });
  } catch (e) {
    console.error("[/api/youtube-bollywood] Fetch error:", e);
    if (youtubeBollywoodCache.length) {
      return NextResponse.json({ tracks: youtubeBollywoodCache, cached: true, error: "Using stale cache" }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to fetch YouTube bollywood playlist" }, { status: 500 });
  }
}
