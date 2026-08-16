const { fetchRssFeed } = require('./rss_scraper');
const { fetchDailyReleases, categorizeMovieItem } = require('./release_scraper');
const { fetchJustWatchReleases } = require('./justwatch_scraper');
const { getSources, getPosts } = require('../storage/posts_store');

/**
 * Categorize general entertainment news items
 */
function categorizeEntertainment(title = '', snippet = '') {
  return categorizeMovieItem(title, snippet);
}

/**
 * Fetch all movie & entertainment news for page1
 * Combines: general RSS sources + dedicated daily release feeds + JustWatch India OTT releases
 */
async function fetchMovieNews() {
  console.log('[Movie Scraper] Fetching Movies & Entertainment + Daily Releases + JustWatch India...');

  const sources = getSources('page1').filter(s => s.active && s.type === 'rss');
  const existingPosts  = getPosts('page1');
  const existingLinks  = new Set(existingPosts.map(p => p.link));
  const existingTitles = new Set(existingPosts.map(p => (p.title || '').toLowerCase().trim()));

  // 1. General RSS sources (configured in sources.json)
  let allItems = [];
  for (const source of sources) {
    const items = await fetchRssFeed(source);
    allItems.push(...items);
  }

  // 2. Daily movie & OTT release feeds (dedicated scraper)
  const releaseItems = await fetchDailyReleases();
  allItems.push(...releaseItems);

  // 3. JustWatch India daily new OTT releases & posters
  const justWatchItems = await fetchJustWatchReleases();
  allItems.push(...justWatchItems);

  // Deduplicate across both sources
  const newItems = [];
  for (const item of allItems) {
    const cleanTitle = (item.title || '').toLowerCase().trim();
    if (item.link && existingLinks.has(item.link))   continue;
    if (cleanTitle && existingTitles.has(cleanTitle)) continue;
    existingLinks.add(item.link);
    existingTitles.add(cleanTitle);
    item.pageId   = 'page1';
    item.category = categorizeEntertainment(item.title, item.snippet);
    newItems.push(item);
  }

  // Log breakdown
  const breakdown = {};
  newItems.forEach(i => { breakdown[i.category] = (breakdown[i.category] || 0) + 1; });
  console.log('[Movie Scraper] Category breakdown:', breakdown);
  console.log(`[Movie Scraper] Total new items: ${newItems.length}`);

  return newItems;
}

module.exports = { fetchMovieNews, categorizeEntertainment };
