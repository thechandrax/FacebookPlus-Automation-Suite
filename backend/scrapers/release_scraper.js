const RSSParser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { getSources, getPosts, addPost } = require('../storage/posts_store');

const parser = new RSSParser({ timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });

// ─── Daily Movie Release RSS Sources ─────────────────────────────────────────
function buildDailyMovieSources() {
  const year = new Date().getFullYear();
  const gnews = (q) => `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;

  return [
    // Theatrical Releases
    { id: 'gnews-movie-release-today',  name: 'Google News – Movie Release Today',         url: gnews(`new+movie+release+today+India+${year}`),                       category: 'Daily Movie Release' },
    { id: 'gnews-bollywood-release',    name: 'Google News – Bollywood Release This Week', url: gnews(`Bollywood+movie+release+this+week+box+office+${year}`),          category: 'Daily Movie Release' },
    { id: 'gnews-tollywood-release',    name: 'Google News – Tollywood/Bengali Release',   url: gnews(`Bengali+Tollywood+new+movie+release+${year}`),                   category: 'Daily Movie Release' },
    { id: 'gnews-hindi-film-release',   name: 'Google News – Hindi Film Release',          url: gnews(`Hindi+film+release+date+trailer+${year}`),                       category: 'Daily Movie Release' },
    { id: 'gnews-south-film-release',   name: 'Google News – South Indian Release',        url: gnews(`South+Indian+Hindi+dubbed+movie+release+today+${year}`),         category: 'Daily Movie Release' },

    // OTT Releases
    { id: 'gnews-netflix-india',        name: 'Google News – Netflix India New Release',   url: gnews('Netflix+India+new+release+today+this+week'),                    category: 'OTT Release' },
    { id: 'gnews-prime-video-india',    name: 'Google News – Amazon Prime India',          url: gnews('Amazon+Prime+Video+India+new+release+today+web+series'),        category: 'OTT Release' },
    { id: 'gnews-hotstar-release',      name: 'Google News – Disney Hotstar Release',      url: gnews('Disney+Plus+Hotstar+new+release+today+India'),                  category: 'OTT Release' },
    { id: 'gnews-jiocinema-release',    name: 'Google News – JioCinema New Release',       url: gnews('JioCinema+new+release+today+web+series+movie'),                 category: 'OTT Release' },
    { id: 'gnews-zee5-release',         name: 'Google News – ZEE5 New Release',             url: gnews('ZEE5+new+release+today+movie+web+series'),                      category: 'OTT Release' },
    { id: 'gnews-sonyliv-release',      name: 'Google News – SonyLIV New Release',         url: gnews(`SonyLIV+new+release+today+web+series+${year}`),                  category: 'OTT Release' },
    { id: 'gnews-ott-weekly',           name: 'Google News – OTT Releases This Week',      url: gnews(`OTT+releases+this+week+India+Netflix+Prime+Hotstar+${year}`),    category: 'OTT Release' },

    // Box Office & Reviews
    { id: 'gnews-box-office-today',     name: 'Google News – Box Office Collection Today', url: gnews('box+office+collection+today+India+crore'),                      category: 'Box Office' },
    { id: 'gnews-movie-review',         name: 'Google News – Movie Review Today',          url: gnews(`movie+review+rating+India+release+${year}`),                     category: 'Movie Reviews' },
  ];
}

const DAILY_MOVIE_SOURCES = buildDailyMovieSources();

// ─── Categorization ────────────────────────────────────────────────────────────
function categorizeMovieItem(title = '', snippet = '', sourceCat = '') {
  const t = (title + ' ' + snippet).toLowerCase();

  if (t.match(/netflix|amazon prime|hotstar|jiocinema|zee5|sonyliv|mxplayer|aha|ott\s|streaming|digital premiere|direct ott|web series|digital release/i))
    return 'OTT Release';
  if (t.match(/box office|collection|crore|₹|earning|opening day|week collection|blockbuster|flop|hit/i))
    return 'Box Office';
  if (t.match(/review|rating|stars?\/5|stars?\/10|verdict|must watch|worth watching/i))
    return 'Movie Reviews';
  if (t.match(/bengali|tollywood|kolkata|prosenjit|dev|jeeta|mimi|subhashree/i))
    return 'Bengali Cinema Release';
  if (t.match(/south indian|telugu|tamil|kannada|malayalam|allu arjun|prabhas|vijay|jr ntr|ram charan/i))
    return 'South Indian Release';
  if (t.match(/bollywood|hindi film|khans?|akshay|ranbir|ranveer|deepika|alia|srk/i))
    return 'Bollywood Release';

  return sourceCat || 'Daily Movie Release';
}

// ─── Fetch Feed Items for a Single Source ──────────────────────────────────────
async function fetchFeedItems(source) {
  try {
    let feed;
    try {
      feed = await parser.parseURL(source.url);
    } catch (e) {
      const res = await axios.get(source.url, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      feed = await parser.parseString(res.data);
    }

    return (feed.items || []).slice(0, 10).map(item => ({
      title: (item.title || '').trim(),
      link: item.link || '',
      sourceName: source.name,
      category: source.category,
      snippet: (item.contentSnippet || item.snippet || item.title || '').trim(),
      imageUrl: null,
      pubDate: item.pubDate || item.isoDate || new Date().toISOString()
    })).filter(i => i.title.length > 5 && i.link.startsWith('http'));
  } catch (err) {
    console.log(`[Release Scraper Error] ${source.name}: ${err.message}`);
    return [];
  }
}

// ─── Main Daily Release Scraper Run ──────────────────────────────────────────
async function fetchDailyReleases() {
  console.log('[Release Scraper] Fetching daily movie & OTT releases...');
  const existingPosts = getPosts();
  const existingLinks  = new Set(existingPosts.map(p => p.link));
  const existingTitles = new Set(existingPosts.map(p => (p.title || '').toLowerCase().trim()));

  let allItems = [];
  for (const source of buildDailyMovieSources()) {
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
  return buildDailyMovieSources().map(s => ({ ...s, pageId: 'page1', type: 'rss', language: 'english', active: true }));
}

module.exports = { fetchDailyReleases, getDailyReleaseSources, categorizeMovieItem };
