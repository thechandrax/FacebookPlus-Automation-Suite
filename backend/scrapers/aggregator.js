const { fetchRssFeed } = require('./rss_scraper');
const { fetchEducationUpdates } = require('./wb_education_scraper');
const { fetchMovieNews } = require('./movie_scraper');
const { fetchStockNews } = require('./stock_scraper');
const { getSources, getPosts } = require('../storage/posts_store');

// ─── Page 3 (WB News) category classifier ────────────────────────────────────
function categorizeNewsItem(title = '', snippet = '', sourceCat = '') {
  const text = (title + ' ' + snippet + ' ' + sourceCat).toLowerCase();
  if (text.match(/kanyashree|lakshmir bhandar|swasthya sathi|ration|pension|allowance|scheme|welfare|প্রকল্প|লক্ষ্মীর ভান্ডার|কন্যাশ্রী/i))
    return 'Social Schemes & Welfare';
  if (text.match(/school|college|madhyamik|higher secondary|wbbse|wbchse|wbjee|wbpsc|wbssc|bikash bhavan|recruitment|job|vacancy|admit|result|exam|student|teacher|education|notice|পরীক্ষা|উচ্চ মাধ্যমিক|মাধ্যমিক|বিশ্ববিদ্যালয়|চাকরি|নিয়োগ/i))
    return 'Education & Exams';
  if (text.match(/bjp|tmc|trinamool|mamata|suvendu|governor|assembly|election|minister|politics|political|বিধানসভা|তৃণমূল|বিজেপি|মমতা/i))
    return 'Politics & Governance';
  if (text.match(/police|arrest|court|high court|cbi|cid|crime|investigation|terror|পুলিশ|গ্রেপ্তার|আদালত/i))
    return 'Police, Law & Defense';
  if (text.match(/weather|rain|imd|rainfall|storm|cyclone|puja|durga|festival|temperature|আবহাওয়া|বৃষ্টি|ঝড়|উৎসব/i))
    return 'Weather & Festivals';
  return sourceCat || 'General WB News';
}

// ─── Collect news for a specific page ────────────────────────────────────────
async function collectNewsForPage(pageId) {
  if (pageId === 'page1') return await fetchMovieNews();
  if (pageId === 'page2') return await fetchStockNews();
  if (pageId === 'page3') return await collectWBNews();
  return [];
}

// ─── Page 3 — WB General News (original logic) ───────────────────────────────
async function collectWBNews() {
  console.log('[Aggregator] Collecting West Bengal News & Education updates...');
  const sources = getSources('page3');
  const existingPosts = getPosts('page3');
  const existingLinks = new Set(existingPosts.map(p => p.link));
  const existingTitles = new Set(existingPosts.map(p => p.title.toLowerCase().trim()));

  let allCollected = [];

  for (const source of sources) {
    if (!source.active) continue;
    if (source.type === 'rss') {
      const items = await fetchRssFeed(source);
      allCollected.push(...items);
    }
  }

  // WB Education portal scraper
  const eduUpdates = await fetchEducationUpdates();
  allCollected.push(...eduUpdates);

  const newItems = [];
  for (const item of allCollected) {
    const cleanTitle = item.title ? item.title.toLowerCase().trim() : '';
    if (item.link && existingLinks.has(item.link)) continue;
    if (cleanTitle && existingTitles.has(cleanTitle)) continue;
    existingLinks.add(item.link);
    existingTitles.add(cleanTitle);
    item.pageId = 'page3';
    item.category = categorizeNewsItem(item.title, item.snippet, item.category);
    newItems.push(item);
  }

  console.log(`[Aggregator] WB News: ${newItems.length} new unique items collected.`);
  return newItems;
}

// ─── Legacy export (still used by old routes) ────────────────────────────────
async function collectAllWBNews() {
  return await collectWBNews();
}

module.exports = { collectNewsForPage, collectAllWBNews, collectWBNews, categorizeNewsItem };
