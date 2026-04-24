import { NextRequest, NextResponse } from "next/server";
import playdl from "play-dl";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim() === "") {
    return NextResponse.json(
      { error: "Missing search query parameter `q`." },
      { status: 400 }
    );
  }

  try {
    // Append 'audio' to heavily favor songs and official audio tracks
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

    // Map to a clean, serialisable shape
    const tracks = results.map((v) => ({
      videoId:   v.id,
      title:     v.title ?? "Unknown Title",
      channel:   v.channel?.name ?? "Unknown Artist",
      duration:  v.durationRaw ?? "—",
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
