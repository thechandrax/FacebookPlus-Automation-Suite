const fs   = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'data', 'sources.json');

const newTradingSources = [
  // ── Premium Finance RSS ──
  { id:'cnbctv18-market',       pageId:'page2', name:'CNBC TV18 Markets',            type:'rss', url:'https://www.cnbctv18.com/commonfeeds/v1/eng/rss/market.xml',                                                                     category:'Stock Market',        language:'english', active:true },
  { id:'zee-business',          pageId:'page2', name:'Zee Business News',             type:'rss', url:'https://www.zeebiz.com/feeds/market-news.xml',                                                                                   category:'Business & Finance',  language:'english', active:true },
  { id:'financial-express-mkt', pageId:'page2', name:'Financial Express Markets',     type:'rss', url:'https://www.financialexpress.com/market/feed/',                                                                                  category:'Stock Market',        language:'english', active:true },
  { id:'ndtv-profit',           pageId:'page2', name:'NDTV Profit Markets',           type:'rss', url:'https://feeds.feedburner.com/ndtvprofit-latest',                                                                                 category:'Business & Finance',  language:'english', active:true },

  // ── Google News Targeted Feeds ──
  { id:'gnews-share-market-today', pageId:'page2', name:'Google News – Share Market Today',  type:'rss', url:'https://news.google.com/rss/search?q=share+market+today+India+Sensex+Nifty&hl=en-IN&gl=IN&ceid=IN:en',                  category:'Stock Market',        language:'english', active:true },
  { id:'gnews-rbi-news',           pageId:'page2', name:'Google News – RBI & Interest Rate', type:'rss', url:'https://news.google.com/rss/search?q=RBI+repo+rate+monetary+policy+India+2025&hl=en-IN&gl=IN&ceid=IN:en',               category:'Economy & RBI',       language:'english', active:true },
  { id:'gnews-mutual-fund',        pageId:'page2', name:'Google News – Mutual Fund & SIP',   type:'rss', url:'https://news.google.com/rss/search?q=mutual+fund+SIP+returns+India+2025&hl=en-IN&gl=IN&ceid=IN:en',                     category:'Mutual Funds & SIP',  language:'english', active:true },
  { id:'gnews-sebi-news',          pageId:'page2', name:'Google News – SEBI Regulations',    type:'rss', url:'https://news.google.com/rss/search?q=SEBI+regulation+investor+India+2025&hl=en-IN&gl=IN&ceid=IN:en',                    category:'Economy & RBI',       language:'english', active:true },
  { id:'gnews-india-budget',       pageId:'page2', name:'Google News – India Budget & Tax',  type:'rss', url:'https://news.google.com/rss/search?q=India+budget+tax+income+GST+2025&hl=en-IN&gl=IN&ceid=IN:en',                       category:'Economy & RBI',       language:'english', active:true },
  { id:'gnews-company-result',     pageId:'page2', name:'Google News – Company Results',     type:'rss', url:'https://news.google.com/rss/search?q=quarterly+results+earnings+profit+loss+India+company+2025&hl=en-IN&gl=IN&ceid=IN:en', category:'Company Results',    language:'english', active:true },
  { id:'gnews-gold-silver',        pageId:'page2', name:'Google News – Gold & Silver Price', type:'rss', url:'https://news.google.com/rss/search?q=gold+silver+price+today+India+MCX+2025&hl=en-IN&gl=IN&ceid=IN:en',                 category:'Commodities',         language:'english', active:true },
  { id:'gnews-fintech-india',      pageId:'page2', name:'Google News – Fintech & UPI India', type:'rss', url:'https://news.google.com/rss/search?q=fintech+UPI+Zerodha+Groww+PhonePe+India+2025&hl=en-IN&gl=IN&ceid=IN:en',           category:'Fintech & UPI',       language:'english', active:true },
  { id:'gnews-forex-rupee',        pageId:'page2', name:'Google News – Rupee & Forex',       type:'rss', url:'https://news.google.com/rss/search?q=Indian+rupee+dollar+forex+exchange+rate+today&hl=en-IN&gl=IN&ceid=IN:en',           category:'Economy & RBI',       language:'english', active:true },
  { id:'gnews-real-estate-india',  pageId:'page2', name:'Google News – Real Estate India',   type:'rss', url:'https://news.google.com/rss/search?q=real+estate+property+price+India+2025&hl=en-IN&gl=IN&ceid=IN:en',                  category:'Real Estate',         language:'english', active:true },
  { id:'gnews-startup-funding',    pageId:'page2', name:'Google News – Startup Funding',     type:'rss', url:'https://news.google.com/rss/search?q=India+startup+funding+investment+unicorn+2025&hl=en-IN&gl=IN&ceid=IN:en',           category:'Startup & Investment',language:'english', active:true },
  { id:'gnews-crude-oil',          pageId:'page2', name:'Google News – Crude Oil & Energy',  type:'rss', url:'https://news.google.com/rss/search?q=crude+oil+price+today+India+energy+sector+2025&hl=en-IN&gl=IN&ceid=IN:en',         category:'Commodities',         language:'english', active:true },
];

let existing = [];
try { existing = JSON.parse(fs.readFileSync(srcFile, 'utf8')); } catch (e) { console.log('Creating new sources.json'); }

existing = existing.map(s => ({ ...s, pageId: s.pageId || 'page3' }));

const existingIds = new Set(existing.map(s => s.id));
const toAdd       = newTradingSources.filter(s => !existingIds.has(s.id));
const merged      = [...existing, ...toAdd];

fs.writeFileSync(srcFile, JSON.stringify(merged, null, 2));

const p2 = merged.filter(s => s.pageId === 'page2');
const cats = {};
p2.forEach(s => { cats[s.category] = (cats[s.category]||0)+1; });

console.log(`\n✅ Migration done! Total sources: ${merged.length}`);
console.log(`\n📈 Page 2 (Trading) — ${p2.length} total sources:\n`);
Object.entries(cats).sort((a,b)=>b[1]-a[1]).forEach(([cat, cnt]) => {
  console.log(`  ${cnt}x  ${cat}`);
});
console.log(`\n🎬 Page 1: ${merged.filter(s=>s.pageId==='page1').length}`);
console.log(`📰 Page 3: ${merged.filter(s=>s.pageId==='page3').length}`);
