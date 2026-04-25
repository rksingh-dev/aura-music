import { NextRequest, NextResponse } from "next/server";
import playdl from "play-dl";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!title || !artist) {
    return NextResponse.json(
      { error: "Missing title or artist parameter" },
      { status: 400 }
    );
  }

  try {
    const searchQuery = `${title} ${artist} audio`;
    const results = await playdl.search(searchQuery, {
      source: { youtube: "video" },
      limit: 1,
    });

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "No YouTube video found for this song" },
        { status: 404 }
      );
    }

    const video = results[0];
    return NextResponse.json({
      videoId: video.id,
      title: video.title ?? `${title} - ${artist}`,
      channel: video.channel?.name ?? artist,
      duration: video.durationRaw ?? "—",
      thumbnail: video.thumbnails?.[0]?.url ?? null,
    });
  } catch (err: unknown) {
    console.error("[/api/youtube-search] Error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json(
      { error: `YouTube search failed: ${message}` },
      { status: 500 }
    );
  }
}
