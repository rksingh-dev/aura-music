import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCacheFile(playlistId: string) {
  return join(process.cwd(), `playlist_${playlistId}_cache.json`);
}

function loadCache(playlistId: string) {
  try {
    const file = getCacheFile(playlistId);
    if (existsSync(file)) {
      const raw = readFileSync(file, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`[/api/playlist] Error loading cache for ${playlistId}:`, e);
  }
  return null;
}

function saveCache(playlistId: string, tracks: any[]) {
  try {
    const data = { tracks, timestamp: Date.now() };
    writeFileSync(getCacheFile(playlistId), JSON.stringify(data, null, 2));
    console.log(`[/api/playlist] Saved cache to file for ${playlistId}`);
  } catch (e) {
    console.error(`[/api/playlist] Error saving cache for ${playlistId}:`, e);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playlistId = searchParams.get("id");
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!playlistId) {
    return NextResponse.json({ error: "Missing playlist id parameter" }, { status: 400 });
  }

  const now = Date.now();
  const cachedData = loadCache(playlistId);
  const isCacheValid = cachedData && cachedData.timestamp && now - cachedData.timestamp < CACHE_DURATION;

  if (isCacheValid && !forceRefresh && cachedData.tracks && cachedData.tracks.length > 0) {
    console.log(`[/api/playlist] Using cached data for ${playlistId}`);
    return NextResponse.json({ tracks: cachedData.tracks, cached: true }, { status: 200 });
  }

  try {
    console.log(`[/api/playlist] Fetching fresh playlist: ${playlistId}`);
    const yt = await Innertube.create();
    const playlist = await yt.music.getPlaylist(playlistId);
    
    if (!playlist || !playlist.items || playlist.items.length === 0) {
      throw new Error("No tracks returned from playlist");
    }

    const tracks = playlist.items.map((item: any) => {
      // Safely extract thumbnail, preferring larger sizes
      let thumb = null;
      if (item.thumbnail && item.thumbnail.contents && item.thumbnail.contents.length > 0) {
        thumb = item.thumbnail.contents[item.thumbnail.contents.length - 1].url;
      }
      
      // Safely extract artist/channel name
      let artistName = "";
      if (item.artists && item.artists.length > 0) {
        artistName = item.artists.map((a: any) => a.name).join(", ");
      } else if (item.author && item.author.name) {
        artistName = item.author.name;
      }

      return {
        videoId: item.id,
        title: item.title,
        channel: artistName,
        duration: item.duration?.text || "?",
        thumbnail: thumb,
        billboardTitle: item.title,
        billboardArtist: artistName,
      };
    }).filter((t: any) => t.videoId); // ensure valid video id

    if (tracks.length > 0) {
      saveCache(playlistId, tracks);
      return NextResponse.json({ tracks, cached: false }, { status: 200 });
    } else {
      throw new Error("Parsed tracks array is empty");
    }
  } catch (e: any) {
    console.error(`[/api/playlist] Fetch error for ${playlistId}:`, e);
    if (cachedData && cachedData.tracks && cachedData.tracks.length > 0) {
      return NextResponse.json({ tracks: cachedData.tracks, cached: true, error: "Using stale cache" }, { status: 200 });
    }
    return NextResponse.json({ error: `Failed to fetch playlist: ${e.message}` }, { status: 500 });
  }
}
