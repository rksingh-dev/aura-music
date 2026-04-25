import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

export async function fetchBillboardHot100() {
  try {
    // In a real implementation, you would fetch the HTML from the Billboard website
    // For this example, we'll assume the HTML content is passed as a parameter
    // const response = await fetch('https://www.billboard.com/charts/hot-100/');
    // const html = await response.text();
    
    // For now, we'll return a placeholder function that would parse the HTML
    // This function would need to be called with the actual HTML content
    return [];
  } catch (error) {
    console.error('Error fetching Billboard Hot 100:', error);
    return [];
  }
}

export function parseBillboardHot100(html) {
  const $ = cheerio.load(html);
  const songs = [];

  // Each song entry is contained in a div with class 'o-chart-results-list-row-container'
  $('.o-chart-results-list-row-container').each((index, element) => {
    // We only want the top 50
    if (index >= 50) return false;

    const $row = $(element);
    const rank = $row.find('.o-chart-results-list-row-item:first-child').text().trim();
    
    // Extracting song title and artist requires navigating the nested structure
    // This is a simplified version - the actual selectors would need to match the real HTML structure
    const title = $row.find('h3').text().trim();
    const artist = $row.find('h3').next().text().trim();

    songs.push({
      rank: parseInt(rank, 10),
      title,
      artist
    });
  });

  return songs;
}

// This would be called in a real implementation
// const songs = await fetchBillboardHot100();
// writeFileSync('billboard-hot-100.json', JSON.stringify(songs, null, 2));