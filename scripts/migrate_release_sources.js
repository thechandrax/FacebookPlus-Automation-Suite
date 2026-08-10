const fs   = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'data', 'sources.json');

const releaseSources = [
  // ── Daily Theatrical Releases ──
  { id:'gnews-movie-release-today',  pageId:'page1', name:'Daily Movie Releases (India)',       type:'rss', url:'https://news.google.com/rss/search?q=new+movie+release+today+India+2025&hl=en-IN&gl=IN&ceid=IN:en',                   category:'Daily Movie Release', language:'english', active:true },
  { id:'gnews-bollywood-release',    pageId:'page1', name:'Bollywood Release This Week',        type:'rss', url:'https://news.google.com/rss/search?q=Bollywood+movie+release+this+week+box+office+2025&hl=en-IN&gl=IN&ceid=IN:en',   category:'Daily Movie Release', language:'english', active:true },
  { id:'gnews-tollywood-release',    pageId:'page1', name:'Tollywood / Bengali Release',        type:'rss', url:'https://news.google.com/rss/search?q=Bengali+Tollywood+new+movie+release+2025&hl=en-IN&gl=IN&ceid=IN:en',             category:'Bengali Cinema Release', language:'english', active:true },
  { id:'gnews-hindi-film-release',   pageId:'page1', name:'Hindi Film Release & Trailer',       type:'rss', url:'https://news.google.com/rss/search?q=Hindi+film+release+date+trailer+2025&hl=en-IN&gl=IN&ceid=IN:en',                category:'Bollywood Release',  language:'english', active:true },
  { id:'gnews-south-film-release',   pageId:'page1', name:'South Indian Film Release',          type:'rss', url:'https://news.google.com/rss/search?q=South+Indian+Hindi+dubbed+movie+release+today+2025&hl=en-IN&gl=IN&ceid=IN:en',  category:'South Indian Release',language:'english', active:true },

  // ── Daily OTT Releases ──
  { id:'gnews-netflix-india',        pageId:'page1', name:'Netflix India – New Release',        type:'rss', url:'https://news.google.com/rss/search?q=Netflix+India+new+release+today+this+week&hl=en-IN&gl=IN&ceid=IN:en',            category:'OTT Release', language:'english', active:true },
  { id:'gnews-prime-video-india',    pageId:'page1', name:'Amazon Prime Video India Release',   type:'rss', url:'https://news.google.com/rss/search?q=Amazon+Prime+Video+India+new+release+today+web+series&hl=en-IN&gl=IN&ceid=IN:en',category:'OTT Release', language:'english', active:true },
  { id:'gnews-hotstar-release',      pageId:'page1', name:'Disney+ Hotstar New Release',        type:'rss', url:'https://news.google.com/rss/search?q=Disney+Plus+Hotstar+new+release+today+India&hl=en-IN&gl=IN&ceid=IN:en',          category:'OTT Release', language:'english', active:true },
  { id:'gnews-jiocinema-release',    pageId:'page1', name:'JioCinema New Release',              type:'rss', url:'https://news.google.com/rss/search?q=JioCinema+new+release+today+web+series+movie&hl=en-IN&gl=IN&ceid=IN:en',         category:'OTT Release', language:'english', active:true },
  { id:'gnews-zee5-release',         pageId:'page1', name:'ZEE5 New Release Today',             type:'rss', url:'https://news.google.com/rss/search?q=ZEE5+new+release+today+movie+web+series&hl=en-IN&gl=IN&ceid=IN:en',              category:'OTT Release', language:'english', active:true },
  { id:'gnews-sonyliv-release',      pageId:'page1', name:'SonyLIV New Release',                type:'rss', url:'https://news.google.com/rss/search?q=SonyLIV+new+release+today+web+series+2025&hl=en-IN&gl=IN&ceid=IN:en',           category:'OTT Release', language:'english', active:true },
  { id:'gnews-ott-weekly',           pageId:'page1', name:'OTT Releases This Week (All)',       type:'rss', url:'https://news.google.com/rss/search?q=OTT+releases+this+week+India+Netflix+Prime+Hotstar+2025&hl=en-IN&gl=IN&ceid=IN:en', category:'OTT Release', language:'english', active:true },

  // ── Box Office & Reviews ──
  { id:'gnews-box-office-today',     pageId:'page1', name:'Box Office Collection Today',        type:'rss', url:'https://news.google.com/rss/search?q=box+office+collection+today+India+crore&hl=en-IN&gl=IN&ceid=IN:en',              category:'Box Office',   language:'english', active:true },
  { id:'gnews-movie-review',         pageId:'page1', name:'Movie Reviews & Ratings',            type:'rss', url:'https://news.google.com/rss/search?q=movie+review+rating+India+release+2025&hl=en-IN&gl=IN&ceid=IN:en',               category:'Movie Reviews', language:'english', active:true },
];

let existing = [];
try { existing = JSON.parse(fs.readFileSync(srcFile, 'utf8')); } catch (e) { console.log('No existing file.'); }

// Tag untagged sources as page3
existing = existing.map(s => ({ ...s, pageId: s.pageId || 'page3' }));

const existingIds = new Set(existing.map(s => s.id));
const toAdd       = releaseSources.filter(s => !existingIds.has(s.id));
const merged      = [...existing, ...toAdd];

fs.writeFileSync(srcFile, JSON.stringify(merged, null, 2));

const p1 = merged.filter(s => s.pageId === 'page1');
const release = p1.filter(s => ['Daily Movie Release','OTT Release','Box Office','Movie Reviews','Bollywood Release','Bengali Cinema Release','South Indian Release'].includes(s.category));
console.log(`✅ Migration done! Total: ${merged.length} sources`);
console.log(`  🎬 Page1 total: ${p1.length} sources`);
console.log(`  🎬 Daily Release + OTT sources: ${release.length}`);
console.log(`  📈 Page2: ${merged.filter(s=>s.pageId==='page2').length} sources`);
console.log(`  📰 Page3: ${merged.filter(s=>s.pageId==='page3').length} sources`);
