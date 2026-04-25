// Scrape Billboard Hot 100 rankings
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function parseBillboardHot100() {
  try {
    const url = 'https://www.billboard.com/charts/hot-100/';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const songs = [];
    
    // Target the chart list items - based on actual HTML structure
    $('.o-chart-results-list-row').each((index, element) => {
      if (index >= 50) return false; // Only get top 50
      
      const $entry = $(element);
      
      // Extract rank from the first span with class c-label
      const rank = $entry.find('.c-label').first().text().trim().split('\n')[0] || (index + 1).toString();
      
      // Extract thumbnail from img tag
      const thumb = $entry.find('img').first();
      let img_url = '';
      
      // Try to get the real image URL from data-src first (for lazy-loaded images)
      const dataSrc = thumb.attr('data-src');
      if (dataSrc) {
        img_url = dataSrc.startsWith('http') ? dataSrc : 'https:' + dataSrc;
      } else {
        // Fall back to src attribute
        const src = thumb.attr('src');
        if (src) {
          img_url = src.startsWith('http') ? src : 'https:' + src;
        }
      }
      
      // Filter out fallback images
      if (img_url.includes('lazyload-fallback') || img_url.includes('placeholder')) {
        img_url = '';
      }
      
      // Extract title from h3 tag
      const title = $entry.find('h3').first().text().trim() || '';
      
      // Extract artist name - look for the artist link after the title
      let artist = '';
      const h3Content = $entry.find('h3').first();
      const artistLink = h3Content.find('a').last();
      if (artistLink.length > 0) {
        artist = artistLink.text().trim();
      }
      
      // Alternative: try to find artist in subtitle
      if (!artist) {
        const subtitle = $entry.find('.c-label-subtitle').first();
        if (subtitle.length > 0) {
          artist = subtitle.text().trim();
        }
      }
      
      // Another alternative: look for artist in the next sibling
      if (!artist) {
        const nextElement = h3Content.next();
        if (nextElement.length > 0) {
          artist = nextElement.text().trim();
        }
      }
      
      songs.push({
        rank: rank,
        thumbnail: img_url,
        title: title,
        artist: artist
      });
    });
    
    return songs;
  } catch (error) {
    console.error('Error scraping Billboard:', error);
    return [];
  }
}
