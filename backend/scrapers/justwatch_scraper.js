const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes daily new OTT releases & movie poster images from JustWatch India
 * Groups releases into Day-Wise 5-Image Bundle Posts (All 5 Poster Images & 5 Titles in 1 Post Container)
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
    const rawReleases = [];
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

        rawReleases.push({ title, link: fullLink, img: fullImg });
      }
    });

    console.log(`[JustWatch Scraper] Found ${rawReleases.length} raw releases for today.`);

    if (rawReleases.length === 0) return [];

    const todayDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const bundlePosts = [];

    // Group releases into bundles of 5 releases per post (5 images attached per post container)
    const chunkSize = 5;
    for (let i = 0; i < rawReleases.length && i < 25; i += chunkSize) {
      const chunk = rawReleases.slice(i, i + chunkSize);
      const bundleNum = Math.floor(i / chunkSize) + 1;

      const titleListStr = chunk.map((c, idx) => `  ${idx + 1}. ${c.title}`).join('\n');
      const photosList = chunk.map(c => c.img).filter(Boolean);

      const masterTitle = `🎬 Today's Top ${chunk.length} New OTT Releases in India (${todayDate}) #${bundleNum}`;
      const masterSnippet = `🔥 Day-Wise OTT Release Roundup (${todayDate}):\n${titleListStr}\n\nCheck streaming platform availability, ratings, and watch online now on JustWatch India!`;

      bundlePosts.push({
        title: masterTitle,
        link: chunk[0].link || 'https://www.justwatch.com/in/new',
        sourceName: 'JustWatch India (New OTT Releases)',
        category: 'OTT Release',
        snippet: masterSnippet,
        imageUrl: photosList[0] || '',
        photos: photosList,
        pubDate: new Date().toISOString()
      });
    }

    console.log(`[JustWatch Scraper] Created ${bundlePosts.length} day-wise bundle posts (each containing 5 release titles & 5 attached poster images)!`);
    return bundlePosts;
  } catch (err) {
    console.error(`[JustWatch Scraper Error] ${err.message}`);
    return [];
  }
}

module.exports = { fetchJustWatchReleases };
