import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export interface YoutubePlaylistTrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

export async function parseYoutubeBollywoodSongs(): Promise<YoutubePlaylistTrack[]> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto('https://music.youtube.com/playlist?list=RDCLAK5uy_n9Fbdw7e6ap-98_A-8JYBmPv64v-Uaq1g', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    
    try {
      await page.waitForSelector('ytmusic-responsive-list-item-renderer', { timeout: 30000 });
    } catch (e) {
      console.error('Timeout waiting for ytmusic-responsive-list-item-renderer (bollywood)');
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const tracks: YoutubePlaylistTrack[] = [];
    $('ytmusic-responsive-list-item-renderer').each((i, el) => {
      const titleEl = $(el).find('.title-column yt-formatted-string a');
      const title = titleEl.text().trim();
      const url = titleEl.attr('href');
      
      const artistLinks = $(el).find('.secondary-flex-columns yt-formatted-string.complex-string a');
      let artist = '';
      if (artistLinks.length > 0) {
        artist = artistLinks.first().text().trim();
      } else {
        artist = $(el).find('.secondary-flex-columns yt-formatted-string.complex-string').text().trim();
      }
                     
      const img = $(el).find('img').attr('src');
      
      let videoId = '';
      if (url) {
        const match = url.match(/v=([a-zA-Z0-9_-]{11})/);
        if (match) videoId = match[1];
      }
      
      if (title) {
        tracks.push({ title, artist, videoId, thumbnail: img || '' });
      }
    });
    
    return tracks;
  } catch (error) {
    console.error('Error scraping YouTube Bollywood playlist:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
