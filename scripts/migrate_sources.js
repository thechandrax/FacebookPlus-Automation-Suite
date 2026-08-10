const fs   = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'data', 'sources.json');

const newSources = [
  { id:'bollywood-hungama',   pageId:'page1', name:'Bollywood Hungama',              type:'rss', url:'https://www.bollywoodhungama.com/rss/news.xml',                                                                           category:'Movies & Entertainment', language:'hindi_english_mixed', active:true },
  { id:'filmibeat',           pageId:'page1', name:'FilmiBeat Entertainment',        type:'rss', url:'https://www.filmibeat.com/rss.xml',                                                                                       category:'Movies & Entertainment', language:'hindi_english_mixed', active:true },
  { id:'toi-entertainment',   pageId:'page1', name:'Times of India Entertainment',   type:'rss', url:'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',                                                            category:'Movies & Entertainment', language:'english',             active:true },
  { id:'pinkvilla',           pageId:'page1', name:'Pinkvilla Celebrity News',       type:'rss', url:'https://www.pinkvilla.com/feed',                                                                                          category:'Celebrity & Gossip',     language:'english',             active:true },
  { id:'google-tollywood',    pageId:'page1', name:'Google News (Tollywood)',         type:'rss', url:'https://news.google.com/rss/search?q=Tollywood+Bengali+movie+release&hl=en-IN&gl=IN&ceid=IN:en',                        category:'Bengali Cinema',         language:'english',             active:true },
  { id:'google-bollywood',    pageId:'page1', name:'Google News (Bollywood)',         type:'rss', url:'https://news.google.com/rss/search?q=Bollywood+new+movie+box+office&hl=en-IN&gl=IN&ceid=IN:en',                         category:'Movies & Entertainment', language:'english',             active:true },
  { id:'google-ott',          pageId:'page1', name:'Google News (OTT Releases)',      type:'rss', url:'https://news.google.com/rss/search?q=OTT+Netflix+Amazon+Prime+Hotstar+new+release+2025&hl=en-IN&gl=IN&ceid=IN:en',     category:'OTT & Web Series',       language:'english',             active:true },
  { id:'google-bengali-movie',pageId:'page1', name:'Google News (Bengali Cinema)',    type:'rss', url:'https://news.google.com/rss/search?q=Bengali+cinema+Kolkata+film+2025&hl=bn&gl=IN&ceid=IN:bn',                         category:'Bengali Cinema',         language:'bengali',             active:true },
  { id:'moneycontrol-markets',pageId:'page2', name:'Moneycontrol Markets',            type:'rss', url:'https://www.moneycontrol.com/rss/marketreports.xml',                                                                    category:'Stock Market',           language:'english',             active:true },
  { id:'et-markets',          pageId:'page2', name:'Economic Times Markets',          type:'rss', url:'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',                                                  category:'Stock Market',           language:'english',             active:true },
  { id:'business-standard',   pageId:'page2', name:'Business Standard Markets',       type:'rss', url:'https://www.business-standard.com/rss/markets-106.rss',                                                                category:'Business & Finance',     language:'english',             active:true },
  { id:'livemint-markets',    pageId:'page2', name:'LiveMint Markets',                type:'rss', url:'https://www.livemint.com/rss/markets',                                                                                  category:'Stock Market',           language:'english',             active:true },
  { id:'google-nse-bse',      pageId:'page2', name:'Google News (NSE/BSE/Nifty)',     type:'rss', url:'https://news.google.com/rss/search?q=NSE+BSE+Sensex+Nifty+stock+market+today&hl=en-IN&gl=IN&ceid=IN:en',              category:'Stock Market',           language:'english',             active:true },
  { id:'google-crypto-india', pageId:'page2', name:'Google News (Crypto India)',      type:'rss', url:'https://news.google.com/rss/search?q=Bitcoin+crypto+India+market+price+today&hl=en-IN&gl=IN&ceid=IN:en',              category:'Crypto & Blockchain',    language:'english',             active:true },
  { id:'google-ipo',          pageId:'page2', name:'Google News (IPO Alerts)',        type:'rss', url:'https://news.google.com/rss/search?q=IPO+India+2025+GMP+allotment&hl=en-IN&gl=IN&ceid=IN:en',                         category:'IPO & Listings',         language:'english',             active:true }
];

let existing = [];
try { existing = JSON.parse(fs.readFileSync(srcFile, 'utf8')); } catch (e) { console.log('No existing sources.json, creating fresh.'); }

// Tag all existing page3 sources (those without a pageId)
existing = existing.map(s => ({ ...s, pageId: s.pageId || 'page3' }));

const existingIds = new Set(existing.map(s => s.id));
const toAdd       = newSources.filter(s => !existingIds.has(s.id));
const merged      = [...existing, ...toAdd];

fs.writeFileSync(srcFile, JSON.stringify(merged, null, 2));

console.log('✅ Migration complete! Total sources: ' + merged.length);
console.log('  🎬 page1 (Entertainment): ' + merged.filter(s => s.pageId === 'page1').length);
console.log('  📈 page2 (Finance):       ' + merged.filter(s => s.pageId === 'page2').length);
console.log('  📰 page3 (WB News):       ' + merged.filter(s => s.pageId === 'page3').length);
