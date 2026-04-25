import { NextRequest, NextResponse } from "next/server";
import playdl from "play-dl";
import { parseBillboardHot100 } from "@/utils/billboard_scraper";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

let topTracksCache: any[] = [];
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (Billboard updates weekly)
const CACHE_FILE = join(process.cwd(), 'billboard_cache.json');

// Load cache from file on startup
function loadCacheFromFile() {
  try {
    if (existsSync(CACHE_FILE)) {
      const data = readFileSync(CACHE_FILE, 'utf-8');
      const cached = JSON.parse(data);
      if (cached.tracks && cached.timestamp) {
        topTracksCache = cached.tracks;
        cacheTimestamp = cached.timestamp;
        console.log('[/api/search] Loaded Billboard cache from file');
      }
    }
  } catch (error) {
    console.error('[/api/search] Error loading cache from file:', error);
  }
}

// Save cache to file
function saveCacheToFile() {
  try {
    const data = {
      tracks: topTracksCache,
      timestamp: cacheTimestamp
    };
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log('[/api/search] Saved Billboard cache to file');
  } catch (error) {
    console.error('[/api/search] Error saving cache to file:', error);
  }
}

// Initialize cache on module load
loadCacheFromFile();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!query || query.trim() === "") {
    const now = Date.now();
    const isCacheValid = cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION;
    
    // Return cached data if valid and not forcing refresh
    if (isCacheValid && !forceRefresh && topTracksCache.length > 0) {
      console.log('[/api/search] Using cached Billboard data');
      return NextResponse.json({ tracks: topTracksCache, cached: true }, { status: 200 });
    }

    try {
      console.log('[/api/search] Fetching fresh Billboard data...');
      const billboardSongs = await parseBillboardHot100();
      const tracks = billboardSongs.slice(0, 50).map((song) => ({
        videoId: "",
        title: `${song.title} - ${song.artist}`,
        channel: song.artist,
        duration: "—",
        thumbnail: song.thumbnail,
        billboardRank: song.rank,
        billboardTitle: song.title,
        billboardArtist: song.artist
      }));

      topTracksCache = tracks;
      cacheTimestamp = now;
      saveCacheToFile();

      return NextResponse.json({ tracks, cached: false }, { status: 200 });
    } catch (err: unknown) {
      console.error("[/api/search] Error fetching Billboard tracks:", err);
      
      // Return cached data even if expired if available
      if (topTracksCache.length > 0) {
        console.log('[/api/search] Returning expired cache as fallback');
        return NextResponse.json({ tracks: topTracksCache, cached: true, error: "Using cached data - fresh data unavailable" }, { status: 200 });
      }
      
      const message = err instanceof Error ? err.message : "Unexpected error.";
      return NextResponse.json(
        { error: `Failed to fetch Billboard tracks: ${message}` },
        { status: 500 }
      );
    }
  }

  try {
    const searchQuery = `${query.trim()} audio`;
    const results = await playdl.search(searchQuery, {
      source: { youtube: "video" },
      limit: 10,
    });

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "No results found for the given query." },
        { status: 404 }
      );
    }

    const tracks = results.map((v) => ({
      videoId: v.id,
      title: v.title ?? "Unknown Title",
      channel: v.channel?.name ?? "Unknown Artist",
      duration: v.durationRaw ?? "—",
      thumbnail: v.thumbnails?.[0]?.url ?? null,
    }));

    return NextResponse.json({ tracks }, { status: 200 });
  } catch (err: unknown) {
    console.error("[/api/search] Error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json(
      { error: `Search failed: ${message}` },
      { status: 500 }
    );
  }
}
