import { NextResponse } from 'next/server';
import { parseBillboardHot100 } from '@/utils/billboard_scraper';

export async function GET() {
  try {
    const songs = await parseBillboardHot100();
    return NextResponse.json(songs);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Billboard data' },
      { status: 500 }
    );
  }
}
