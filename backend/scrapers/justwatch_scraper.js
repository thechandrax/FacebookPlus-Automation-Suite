const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes daily new OTT releases & movie poster images from JustWatch India
 * URL: https://www.justwatch.com/in/new
 */
async function fetchJustWatchReleases() {
  console.log('[JustWatch Scraper] Fetching daily new OTT releases from https://www.justwatch.com/in/new...');
  try {
    const res = await axios.get('https://www.justwatch.com/in/new', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 12000
    });

    const $ = cheerio.load(res.data);
    const items = [];
    const seen = new Set();

    $('a[href*="/in/movie/"], a[href*="/in/tv-show/"]').each((i, el) => {
      const href = $(el).attr('href');
      const rawTitle = $(el).find('img').attr('alt') || $(el).attr('aria-label') || $(el).text();
      let img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

      if (!img) {
        const srcset = $(el).find('source').attr('srcset');
        if (srcset) img = srcset.split(',')[0].split(' ')[0];
      }

      if (rawTitle && rawTitle.trim() && rawTitle.trim() !== 'JustWatch') {
        const title = rawTitle.trim();
        const cleanTitle = title.toLowerCase();
        if (seen.has(cleanTitle)) return;
        seen.add(cleanTitle);

        const fullLink = href.startsWith('http') ? href : `https://www.justwatch.com${href}`;
        let fullImg = img;
        if (img && img.includes('/s166/')) {
          fullImg = img.replace('/s166/', '/s592/');
        } else if (img && img.includes('/s276/')) {
          fullImg = img.replace('/s276/', '/s592/');
        } else if (img && img.includes('/s100/')) {
          fullImg = img.replace('/s100/', '/s592/');
        }

        items.push({
          title: `${title} - New OTT Release`,
          link: fullLink,
          sourceName: 'JustWatch India (New OTT Releases)',
          category: 'OTT Release',
          snippet: `🔥 New OTT Release on JustWatch India: "${title}". Check streaming platform availability, cast details, ratings, and watch online now!`,
          imageUrl: fullImg,
          pubDate: new Date().toISOString()
        });
      }
    });

    console.log(`[JustWatch Scraper] Successfully scraped ${items.length} new OTT releases with HD poster images!`);
    return items;
  } catch (err) {
    console.error(`[JustWatch Scraper Error] ${err.message}`);
    return [];
  }
}

module.exports = { fetchJustWatchReleases };
