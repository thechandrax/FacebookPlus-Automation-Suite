const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

const DIRECT_SOURCES = [
  { name: 'News18 Bangla', url: 'https://bengali.news18.com/rss/west-bengal.xml' },
  { name: 'ABP Ananda', url: 'https://bengali.abplive.com/home/feed' },
  { name: 'Indian Express Kolkata', url: 'https://indianexpress.com/section/cities/kolkata/feed/' },
  { name: 'Times of India Kolkata', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128833038.cms' }
];

async function testDirectFeeds() {
  for (const src of DIRECT_SOURCES) {
    try {
      console.log(`\n--- Testing Direct Source: ${src.name} ---`);
      const feed = await parser.parseURL(src.url);
      const firstItem = feed.items[0];

      let img = null;
      if (firstItem.enclosure && firstItem.enclosure.url) img = firstItem.enclosure.url;
      else if (firstItem['media:content'] && firstItem['media:content'].$.url) img = firstItem['media:content'].$.url;
      else if (firstItem['media:thumbnail'] && firstItem['media:thumbnail'].$.url) img = firstItem['media:thumbnail'].$.url;

      if (!img && firstItem.link) {
        try {
          const res = await axios.get(firstItem.link, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 6000 });
          const $ = cheerio.load(res.data);
          img = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
        } catch (e) {}
      }

      console.log('Title:', firstItem.title);
      console.log('Link:', firstItem.link);
      console.log('REAL PHOTO URL:', img);
    } catch (e) {
      console.error(`Failed ${src.name}:`, e.message);
    }
  }
}

testDirectFeeds();
