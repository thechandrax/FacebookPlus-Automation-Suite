const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  timeout: 12000
});

/**
 * Extracts OpenGraph image and FULL complete article text from webpage
 */
async function fetchOgImageAndSummary(url) {
  let result = { imageUrl: null, summary: null };
  if (!url || !url.startsWith('http')) return result;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      maxRedirects: 5,
      timeout: 9000
    });
    
    let finalUrl = url;
    if (res.request && res.request.res && res.request.res.responseUrl) {
      finalUrl = res.request.res.responseUrl;
    }

    const $ = cheerio.load(res.data);

    // 1. Extract og:image
    let ogImg = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('link[rel="image_src"]').attr('href') ||
                $('article img').first().attr('src');

    if (ogImg && !ogImg.startsWith('http') && finalUrl.startsWith('http')) {
      const urlObj = new URL(finalUrl);
      ogImg = `${urlObj.origin}${ogImg.startsWith('/') ? '' : '/'}${ogImg}`;
    }

    if (ogImg && ogImg.startsWith('http')) {
      result.imageUrl = ogImg;
    }

    // 2. Extract ONLY REAL Article Body Text (Excluding Author Bios, Footers & Site Boilerplate)
    const paragraphs = [];

    // Ignore known boilerplate containers
    $('footer, header, nav, .author-bio, .about-author, .author-details, .toi-desk, .site-footer, .comments, #comments, .related-articles, .promoted-content, .ad-box').remove();

    const mainContainer = $('article, .article-content, .story-details, .story-content, .entry-content, .art_text, ._s30_');
    const targetElements = mainContainer.length ? mainContainer.find('p') : $('p');

    targetElements.each((i, el) => {
      let text = $(el).text().trim();
      const lower = text.toLowerCase();

      // Strict list of unwanted website boilerplate phrases
      const isBoilerplate = 
        lower.includes('toi entertainment desk') ||
        lower.includes('dynamic and dedicated team') ||
        lower.includes('no red carpet goes unrolled') ||
        lower.includes('team spans the globe') ||
        lower.includes('front-row seat to the fascinating') ||
        lower.includes('cookie') ||
        lower.includes('privacy policy') ||
        lower.includes('terms of use') ||
        lower.includes('allow all cookies') ||
        lower.includes('stories you may like') ||
        lower.includes('also read') ||
        lower.includes('follow us') ||
        lower.includes('subscribe') ||
        lower.includes('advertisement') ||
        lower.includes('rights reserved') ||
        lower.includes('download the app') ||
        lower.includes('telegram channel') ||
        lower.includes('whatsapp channel') ||
        lower.includes('leave a reply');

      if (text.length > 30 && !isBoilerplate && paragraphs.length < 40) {
        paragraphs.push(text);
      }
    });

    let fullBody = paragraphs.join('\n\n');

    if (!fullBody || fullBody.length < 40) {
      let metaDesc = $('meta[property="og:description"]').attr('content') ||
                     $('meta[name="description"]').attr('content') ||
                     $('meta[name="twitter:description"]').attr('content') || '';
      
      const lowerDesc = metaDesc.toLowerCase();
      if (metaDesc && !lowerDesc.includes('cookie') && !lowerDesc.includes('toi entertainment desk')) {
        fullBody = metaDesc;
      }
    }

    if (fullBody) {
      result.summary = fullBody.replace(/<[^>]*>/g, '').trim().substring(0, 8000);
    }
  } catch (err) {
    // Ignore timeout or block
  }
  return result;
}

async function fetchRssFeed(source) {
  try {
    console.log(`[Scraper] Fetching RSS feed from: ${source.name} (${source.url})`);
    
    let feed;
    try {
      feed = await parser.parseURL(source.url);
    } catch (parseErr) {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        timeout: 12000
      });
      feed = await parser.parseString(response.data);
    }

    if (!feed || !feed.items) return [];

    const items = [];
    for (const item of feed.items.slice(0, 8)) {
      let imageUrl = null;

      // 1. Check RSS Enclosure & Media XML tags
      if (item.enclosure && item.enclosure.url && item.enclosure.url.match(/\.(jpg|jpeg|png|webp)/i)) {
        imageUrl = item.enclosure.url;
      } else if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
        imageUrl = item['media:content'].$.url;
      } else if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
        imageUrl = item['media:thumbnail'].$.url;
      }

      // 2. Extract image from article description HTML snippet
      if (!imageUrl && item.content) {
        const $ = cheerio.load(item.content);
        const img = $('img').first().attr('src');
        if (img && img.startsWith('http')) imageUrl = img;
      }

      let snippet = item.contentSnippet || item.content || item.summary || '';
      snippet = snippet.replace(/<[^>]*>/g, '').trim();

      if (snippet.toLowerCase().includes('cookie')) {
        snippet = '';
      }

      // 3. Fast snippet & image extraction
      if (!imageUrl && item.link && !item.link.includes('news.google.com')) {
        imageUrl = `https://image.thum.io/get/width/600/crop/400/${item.link}`;
      }

      items.push({
        title: item.title ? item.title.trim() : 'West Bengal News Update',
        link: item.link || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        snippet: snippet ? snippet.substring(0, 8000) : (item.title ? item.title.trim() : ''),
        sourceName: source.name,
        category: source.category || 'West Bengal News',
        imageUrl: imageUrl
      });
    }

    return items;
  } catch (error) {
    console.error(`[Scraper Error] Failed to fetch RSS feed for ${source.name}:`, error.message);
    return [];
  }
}

module.exports = {
  fetchRssFeed,
  fetchOgImageAndSummary
};
