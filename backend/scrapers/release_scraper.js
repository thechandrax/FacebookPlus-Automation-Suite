const RSSParser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { getSources, getPosts, addPost } = require('../storage/posts_store');

const parser = new RSSParser({ timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });

// ─── Daily Movie Release RSS Sources ─────────────────────────────────────────
const DAILY_MOVIE_SOURCES = [
  // Theatrical Releases
  { id: 'gnews-movie-release-today',  name: 'Google News – Movie Release Today',      url: 'https://news.google.com/rss/search?q=new+movie+release+today+India+2025&hl=en-IN&gl=IN&ceid=IN:en',           category: 'Daily Movie Release' },
  { id: 'gnews-bollywood-release',    name: 'Google News – Bollywood Release This Week', url: 'https://news.google.com/rss/search?q=Bollywood+movie+release+this+week+box+office+2025&hl=en-IN&gl=IN&ceid=IN:en', category: 'Daily Movie Release' },
  { id: 'gnews-tollywood-release',    name: 'Google News – Tollywood/Bengali Release', url: 'https://news.google.com/rss/search?q=Bengali+Tollywood+new+movie+release+2025&hl=en-IN&gl=IN&ceid=IN:en',     category: 'Daily Movie Release' },
  { id: 'gnews-hindi-film-release',   name: 'Google News – Hindi Film Release',        url: 'https://news.google.com/rss/search?q=Hindi+film+release+date+trailer+2025&hl=en-IN&gl=IN&ceid=IN:en',          category: 'Daily Movie Release' },
  { id: 'gnews-south-film-release',   name: 'Google News – South Indian Release',      url: 'https://news.google.com/rss/search?q=South+Indian+Hindi+dubbed+movie+release+today+2025&hl=en-IN&gl=IN&ceid=IN:en', category: 'Daily Movie Release' },

  // OTT Releases
  { id: 'gnews-netflix-india',        name: 'Google News – Netflix India New Release', url: 'https://news.google.com/rss/search?q=Netflix+India+new+release+today+this+week&hl=en-IN&gl=IN&ceid=IN:en',    category: 'OTT Release' },
  { id: 'gnews-prime-video-india',    name: 'Google News – Amazon Prime India',        url: 'https://news.google.com/rss/search?q=Amazon+Prime+Video+India+new+release+today+web+series&hl=en-IN&gl=IN&ceid=IN:en', category: 'OTT Release' },
  { id: 'gnews-hotstar-release',      name: 'Google News – Disney Hotstar Release',    url: 'https://news.google.com/rss/search?q=Disney+Plus+Hotstar+new+release+today+India&hl=en-IN&gl=IN&ceid=IN:en',   category: 'OTT Release' },
  { id: 'gnews-jiocinema-release',    name: 'Google News – JioCinema New Release',     url: 'https://news.google.com/rss/search?q=JioCinema+new+release+today+web+series+movie&hl=en-IN&gl=IN&ceid=IN:en', category: 'OTT Release' },
  { id: 'gnews-zee5-release',         name: 'Google News – ZEE5 New Release',          url: 'https://news.google.com/rss/search?q=ZEE5+new+release+today+movie+web+series&hl=en-IN&gl=IN&ceid=IN:en',       category: 'OTT Release' },
  { id: 'gnews-sonyliv-release',      name: 'Google News – SonyLIV New Release',       url: 'https://news.google.com/rss/search?q=SonyLIV+new+release+today+web+series+2025&hl=en-IN&gl=IN&ceid=IN:en',    category: 'OTT Release' },
  { id: 'gnews-ott-weekly',           name: 'Google News – OTT Releases This Week',    url: 'https://news.google.com/rss/search?q=OTT+releases+this+week+India+Netflix+Prime+Hotstar+2025&hl=en-IN&gl=IN&ceid=IN:en', category: 'OTT Release' },

  // Box Office & Reviews
  { id: 'gnews-box-office-today',     name: 'Google News – Box Office Collection Today', url: 'https://news.google.com/rss/search?q=box+office+collection+today+India+crore&hl=en-IN&gl=IN&ceid=IN:en',    category: 'Box Office' },
  { id: 'gnews-movie-review',         name: 'Google News – Movie Review Today',         url: 'https://news.google.com/rss/search?q=movie+review+rating+India+release+2025&hl=en-IN&gl=IN&ceid=IN:en',       category: 'Movie Reviews' },
];

// ─── Categorization ────────────────────────────────────────────────────────────
function categorizeMovieItem(title = '', snippet = '', sourceCat = '') {
  const t = (title + ' ' + snippet).toLowerCase();

  if (t.match(/netflix|amazon prime|hotstar|jiocinema|zee5|sonyliv|mxplayer|aha|ott\s|streaming|digital premiere|direct ott|web series|digital release/i))
    return 'OTT Release';
  if (t.match(/box office|collection|crore|₹|earning|opening day|week collection|blockbuster|flop|hit/i))
    return 'Box Office';
  if (t.match(/review|rating|stars?\/5|stars?\/10|verdict|must watch|worth watching/i))
    return 'Movie Reviews';
  if (t.match(/trailer|teaser|poster|first look|announcement|release date confirm/i))
    return 'Trailers & Announcements';
  if (t.match(/tollywood|bengali film|kolkata|hoichoi|bengali cinema|বাংলা/i))
    return 'Bengali Cinema Release';
  if (t.match(/bollywood|hindi film|mumbai|yrf|dharma|excel|t-series film/i))
    return 'Bollywood Release';
  if (t.match(/south indian|telugu|tamil|kannada|malayalam|dubbed|pan india/i))
    return 'South Indian Release';
  if (sourceCat) return sourceCat;
  return 'Daily Movie Release';
}

// ─── Fetch Single RSS Feed ────────────────────────────────────────────────────
async function fetchFeedItems(source) {
  try {
    const feed  = await parser.parseURL(source.url);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (feed.items || []).slice(0, 12).map(item => ({
      title:      (item.title || '').replace(/<[^>]+>/g, '').trim(),
      link:       item.link  || item.guid || '',
      snippet:    (item.contentSnippet || item.summary || item.content || '').replace(/<[^>]+>/g, '').slice(0, 280),
      imageUrl:   item.enclosure?.url || item['media:thumbnail']?.['$']?.url || '',
      sourceName: source.name,
      category:   source.category,
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString()
    })).filter(item => item.title && item.link);
  } catch (err) {
    console.error(`[Release Scraper] Feed failed (${source.name}): ${err.message}`);
    return [];
  }
}

// ─── Main: Fetch Daily Releases ────────────────────────────────────────────────
async function fetchDailyReleases() {
  console.log('[Release Scraper] Fetching daily movie & OTT releases...');

  const existingPosts  = getPosts('page1');
  const existingLinks  = new Set(existingPosts.map(p => p.link));
  const existingTitles = new Set(existingPosts.map(p => (p.title || '').toLowerCase().trim()));

  let allItems = [];
  for (const source of DAILY_MOVIE_SOURCES) {
    const items = await fetchFeedItems(source);
    allItems.push(...items);
  }

  // Deduplicate and categorize
  const newItems = [];
  for (const item of allItems) {
    const cleanTitle = item.title.toLowerCase().trim();
    if (existingLinks.has(item.link))   continue;
    if (existingTitles.has(cleanTitle)) continue;
    existingLinks.add(item.link);
    existingTitles.add(cleanTitle);
    item.pageId   = 'page1';
    item.category = categorizeMovieItem(item.title, item.snippet, item.category);
    newItems.push(item);
  }

  // Group by category for logging
  const groups = {};
  newItems.forEach(i => { groups[i.category] = (groups[i.category] || 0) + 1; });
  console.log('[Release Scraper] New items by category:', groups);
  console.log(`[Release Scraper] Total new release items: ${newItems.length}`);

  return newItems;
}

// ─── Get RSS source list (for sources page display) ─────────────────────────
function getDailyReleaseSources() {
  return DAILY_MOVIE_SOURCES.map(s => ({ ...s, pageId: 'page1', type: 'rss', language: 'english', active: true }));
}

module.exports = { fetchDailyReleases, getDailyReleaseSources, categorizeMovieItem };
