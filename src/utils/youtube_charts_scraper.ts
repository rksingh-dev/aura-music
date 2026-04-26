import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export interface YoutubeChartTrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  rank: string;
}

export async function parseYoutubeIndiaTopSongs(): Promise<YoutubeChartTrack[]> {
  let browser = null;
  try {
    browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Go to the YouTube India Weekly Top Songs URL
    await page.goto('https://charts.youtube.com/charts/TopSongs/in/weekly', { 
        waitUntil: 'networkidle2',
        timeout: 60000 
    });
    
    // Wait for the chart rows to be rendered
    try {
        await page.waitForSelector('ytmc-chart-table', { timeout: 10000 }).catch(() => {});
    } catch (e) {
    }
    // Additional wait just to make sure images and details are loaded
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const html = await page.content();
    const $ = cheerio.load(html);
    const data: YoutubeChartTrack[] = [];
    
    $('ytmc-entry-row').each((i, row) => {
        const $row = $(row);
        const rank = $row.find('#rank').text().trim();
        const title = $row.find('.title').text().trim();
        const artist = $row.find('.artistName').text().trim();
        const imgEl = $row.find('img.tracks-thumbnail');
        const thumbnail = imgEl.attr('src') || '';
        
        let videoId = '';
        const titleEndpoint = $row.find('.title').attr('endpoint');
        if (titleEndpoint) {
            try {
                const ep = JSON.parse(titleEndpoint);
                const url = ep?.urlEndpoint?.url;
                if (url) {
                    const match = url.match(/v=([a-zA-Z0-9_-]{11})/);
                    if (match) videoId = match[1];
                }
            } catch(e) {}
        }
        
        if (!videoId && imgEl.length) {
            const imgEndpoint = imgEl.attr('endpoint');
            if (imgEndpoint) {
                try {
                    const ep = JSON.parse(imgEndpoint);
                    const url = ep?.urlEndpoint?.url;
                    if (url) {
                        const match = url.match(/v=([a-zA-Z0-9_-]{11})/);
                        if (match) videoId = match[1];
                    }
                } catch(e) {}
            }
        }
        
        if (title && artist) {
            data.push({
                rank,
                title,
                artist,
                thumbnail,
                videoId
            });
        }
    });
    
    return data;
  } catch (error) {
    console.error('Error scraping YouTube charts:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
