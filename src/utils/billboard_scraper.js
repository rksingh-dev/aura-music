// Scrape Billboard Hot 100 rankings
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function parseBillboardHot100() {
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
      const img_url = thumb.attr('src') ? (thumb.attr('src').startsWith('http') ? thumb.attr('src') : 'https:' + thumb.attr('src')) : '';
      
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
    console.error('Error scraping Billboard:', error.message);
    return [];
  }
}

// Main execution
async function main() {
  const songs = await parseBillboardHot100();
  
  // Save to JSON file
  fs.writeFileSync('billboard_hot_100.json', JSON.stringify(songs, null, 2));
  
  console.log(`Successfully extracted ${songs.length} songs to billboard_hot_100.json`);
  
  // Display first few entries for verification
  console.log('\nFirst 5 entries:');
  songs.slice(0, 5).forEach((song, i) => {
    console.log(`${i + 1}. Rank: ${song.rank}, Title: ${song.title}, Artist: ${song.artist}`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { parseBillboardHot100 };
