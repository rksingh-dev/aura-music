// Scrape Spotify playlist for India's Top Songs
import axios from 'axios';
import * as cheerio from 'cheerio';

// The playlist URL (public) – no auth needed for scraping the page HTML
const PLAYLIST_URL = 'https://open.spotify.com/playlist/37i9dQZEVXbNG2KDcFcKOF';

export async function parseSpotifyIndiaTopSongs() {
  try {
    const response = await axios.get(PLAYLIST_URL, {
      // Spoof a browser user‑agent to get the full HTML
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const $ = cheerio.load(response.data);

    const tracks: { title: string; artist: string; thumbnail: string }[] = [];

    // Spotify renders each track inside a <div data-testid="tracklist-row">
    // The selector may change, but this works for the current public page.
    $('[data-testid="tracklist-row"]').each((_, el) => {
      const $row = $(el);
      const title = $row.find('[data-testid="track-name"] span').first().text().trim();
      const artist = $row.find('[data-testid="artists"] span').first().text().trim();
      // Image is in an <img> within the row, usually under data-testid="cover-art"
      const img = $row.find('img').first();
      let thumbnail = '';
      if (img.length) {
        const src = img.attr('src') || '';
        thumbnail = src.startsWith('http') ? src : '';
      }
      if (title && artist) {
        tracks.push({ title, artist, thumbnail });
      }
    });

    // Keep only the top 50 entries
    return tracks.slice(0, 50);
  } catch (error) {
    console.error('Error scraping Spotify playlist:', error);
    return [];
  }
}
