const { fetchRssFeed } = require('./rss_scraper');
const { getSources, getPosts } = require('../storage/posts_store');

/**
 * Categorize stock market / finance news
 */
function categorizeFinance(title = '', snippet = '') {
  const text = (title + ' ' + snippet).toLowerCase();
  if (text.match(/bitcoin|crypto|ethereum|btc|eth|blockchain|web3|defi|nft/i))
    return 'Crypto & Blockchain';
  if (text.match(/ipo|initial public offering|gmp|grey market|allotment|listing/i))
    return 'IPO & Listings';
  if (text.match(/sebi|securities|regulation|circular|compliance/i))
    return 'Economy & RBI';
  if (text.match(/rbi|repo rate|inflation|gdp|interest rate|monetary policy|rupee|forex|dollar|exchange rate/i))
    return 'Economy & RBI';
  if (text.match(/sensex|nifty|nse|bse|stock market|equity|share price|index|rally|bull|bear/i))
    return 'Stock Market';
  if (text.match(/mutual fund|sip|etf|portfolio|nav|aum|fund house/i))
    return 'Mutual Funds & SIP';
  if (text.match(/gold|silver|commodity|crude oil|metal|mcx|natural gas/i))
    return 'Commodities';
  if (text.match(/result|quarterly|earnings|profit|revenue|balance sheet|q[1-4] result/i))
    return 'Company Results';
  if (text.match(/upi|phonepe|paytm|gpay|fintech|digital payment|razorpay|zerodha|groww|angel/i))
    return 'Fintech & UPI';
  if (text.match(/real estate|property|housing|realty|home loan|mortgage|rera/i))
    return 'Real Estate';
  if (text.match(/startup|unicorn|funding|venture capital|series [a-e]|angel invest|valuation/i))
    return 'Startup & Investment';
  if (text.match(/budget|tax|income tax|gst|customs duty|fiscal|finance ministry/i))
    return 'Economy & RBI';
  return 'Business & Finance';
}


/**
 * Fetch all trading & stock market news for page2
 */
async function fetchStockNews() {
  console.log('[Stock Scraper] Fetching Trading & Stock Market RSS feeds...');
  const sources = getSources('page2').filter(s => s.active && s.type === 'rss');
  const existingPosts = getPosts('page2');
  const existingLinks = new Set(existingPosts.map(p => p.link));
  const existingTitles = new Set(existingPosts.map(p => p.title.toLowerCase().trim()));

  let allItems = [];
  for (const source of sources) {
    const items = await fetchRssFeed(source);
    allItems.push(...items);
  }

  // Deduplicate & categorize
  const newItems = [];
  for (const item of allItems) {
    const cleanTitle = item.title ? item.title.toLowerCase().trim() : '';
    if (item.link && existingLinks.has(item.link)) continue;
    if (cleanTitle && existingTitles.has(cleanTitle)) continue;
    existingLinks.add(item.link);
    existingTitles.add(cleanTitle);
    item.pageId = 'page2';
    item.category = categorizeFinance(item.title, item.snippet);
    newItems.push(item);
  }

  console.log(`[Stock Scraper] Found ${newItems.length} new finance/market items.`);
  return newItems;
}

module.exports = { fetchStockNews, categorizeFinance };
