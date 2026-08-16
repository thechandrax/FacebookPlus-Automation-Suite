const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const SOURCES_FILE = path.join(DATA_DIR, 'sources.json');
const PAGES_FILE = path.join(DATA_DIR, 'pages.json');

// ─── Default Pages ────────────────────────────────────────────────────────────
const DEFAULT_PAGES = [
  {
    id: 'page1', name: 'Movies & Entertainment', emoji: '🎬',
    description: 'Bollywood, Tollywood, OTT & Celebrity News',
    category: 'entertainment', theme: 'purple',
    fbPageId: '', fbPageToken: '', language: 'hindi_english_mixed',
    aiStyle: 'entertainment', imageType: 'ai_image',
    autoPost: false, cronSchedule: '0 10 * * *,0 15 * * *,0 20 * * *', active: true
  },
  {
    id: 'page2', name: 'Trading & Stock Market', emoji: '📈',
    description: 'NSE, BSE, Sensex, Nifty, Crypto & Economy',
    category: 'finance', theme: 'green',
    fbPageId: '', fbPageToken: '', language: 'english',
    aiStyle: 'finance', imageType: 'ai_image',
    autoPost: false, cronSchedule: '0 9 * * *,0 12 * * *,0 16 * * *', active: true
  },
  {
    id: 'page3', name: 'General News & Education', emoji: '📰',
    description: 'West Bengal News, Govt Jobs, WBBSE, WBPSC, Education',
    category: 'news', theme: 'blue',
    fbPageId: '', fbPageToken: '', language: 'bengali_english_mixed',
    aiStyle: 'news', imageType: 'ai_image',
    autoPost: false, cronSchedule: '0 8 * * *,0 13 * * *,0 19 * * *', active: true
  }
];

// ─── Default Sources ──────────────────────────────────────────────────────────
const DEFAULT_SOURCES = [
  // PAGE 1: Movies & Entertainment
  { id: 'bollywood-hungama', pageId: 'page1', name: 'Bollywood Hungama', type: 'rss', url: 'https://www.bollywoodhungama.com/rss/news.xml', category: 'Movies & Entertainment', language: 'hindi_english_mixed', active: true },
  { id: 'filmibeat', pageId: 'page1', name: 'FilmiBeat Entertainment', type: 'rss', url: 'https://www.filmibeat.com/rss.xml', category: 'Movies & Entertainment', language: 'hindi_english_mixed', active: true },
  { id: 'toi-entertainment', pageId: 'page1', name: 'Times of India Entertainment', type: 'rss', url: 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', category: 'Movies & Entertainment', language: 'english', active: true },
  { id: 'pinkvilla', pageId: 'page1', name: 'Pinkvilla Celebrity News', type: 'rss', url: 'https://www.pinkvilla.com/feed', category: 'Celebrity & Gossip', language: 'english', active: true },
  { id: 'google-tollywood', pageId: 'page1', name: 'Google News (Tollywood)', type: 'rss', url: 'https://news.google.com/rss/search?q=Tollywood+Bengali+movie+release&hl=en-IN&gl=IN&ceid=IN:en', category: 'Movies & Entertainment', language: 'english', active: true },
  { id: 'google-bollywood', pageId: 'page1', name: 'Google News (Bollywood)', type: 'rss', url: 'https://news.google.com/rss/search?q=Bollywood+new+movie+box+office&hl=en-IN&gl=IN&ceid=IN:en', category: 'Movies & Entertainment', language: 'english', active: true },
  { id: 'google-ott', pageId: 'page1', name: 'Google News (OTT Releases)', type: 'rss', url: 'https://news.google.com/rss/search?q=OTT+Netflix+Amazon+Prime+Hotstar+new+release&hl=en-IN&gl=IN&ceid=IN:en', category: 'OTT & Web Series', language: 'english', active: true },
  { id: 'google-bengali-movie', pageId: 'page1', name: 'Google News (Bengali Cinema)', type: 'rss', url: `https://news.google.com/rss/search?q=Bengali+cinema+Kolkata+film+${new Date().getFullYear()}&hl=bn&gl=IN&ceid=IN:bn`, category: 'Bengali Cinema', language: 'bengali', active: true },

  // PAGE 2: Trading & Stock Market
  { id: 'moneycontrol-markets', pageId: 'page2', name: 'Moneycontrol Markets', type: 'rss', url: 'https://www.moneycontrol.com/rss/marketreports.xml', category: 'Stock Market', language: 'english', active: true },
  { id: 'et-markets', pageId: 'page2', name: 'Economic Times Markets', type: 'rss', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', category: 'Stock Market', language: 'english', active: true },
  { id: 'business-standard', pageId: 'page2', name: 'Business Standard Markets', type: 'rss', url: 'https://www.business-standard.com/rss/markets-106.rss', category: 'Business & Finance', language: 'english', active: true },
  { id: 'livemint-markets', pageId: 'page2', name: 'LiveMint Markets', type: 'rss', url: 'https://www.livemint.com/rss/markets', category: 'Stock Market', language: 'english', active: true },
  { id: 'google-nse-bse', pageId: 'page2', name: 'Google News (NSE/BSE/Nifty)', type: 'rss', url: 'https://news.google.com/rss/search?q=NSE+BSE+Sensex+Nifty+stock+market+today&hl=en-IN&gl=IN&ceid=IN:en', category: 'Stock Market', language: 'english', active: true },
  { id: 'google-crypto-india', pageId: 'page2', name: 'Google News (Crypto India)', type: 'rss', url: 'https://news.google.com/rss/search?q=Bitcoin+crypto+India+market+price+today&hl=en-IN&gl=IN&ceid=IN:en', category: 'Crypto & Blockchain', language: 'english', active: true },
  { id: 'google-ipo', pageId: 'page2', name: 'Google News (IPO Alerts)', type: 'rss', url: `https://news.google.com/rss/search?q=IPO+India+${new Date().getFullYear()}+GMP+allotment&hl=en-IN&gl=IN&ceid=IN:en`, category: 'IPO & Investment', language: 'english', active: true },

  // PAGE 3: General News & Education (existing sources)
  { id: 'abp-ananda-bn', pageId: 'page3', name: 'ABP Ananda (Bangla News)', type: 'rss', url: 'https://bengali.abplive.com/home/feed', category: 'General WB News', language: 'bengali', active: true },
  { id: 'sangbad-pratidin-bn', pageId: 'page3', name: 'Sangbad Pratidin (Bangla)', type: 'rss', url: 'https://www.sangbadpratidin.in/feed/', category: 'General WB News', language: 'bengali', active: true },
  { id: 'google-kolkata-bn', pageId: 'page3', name: 'Google News (Kolkata Bangla)', type: 'rss', url: 'https://news.google.com/rss/search?q=Kolkata+West+Bengal+News&hl=bn&gl=IN&ceid=IN:bn', category: 'Bangla News', language: 'bengali', active: true },
  { id: 'indian-express-wb', pageId: 'page3', name: 'Indian Express (Kolkata & WB)', type: 'rss', url: 'https://indianexpress.com/section/cities/kolkata/feed/', category: 'State News', language: 'english', active: true },
  { id: 'toi-kolkata', pageId: 'page3', name: 'Times of India (Kolkata)', type: 'rss', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128833038.cms', category: 'Kolkata News', language: 'english', active: true },
  { id: 'google-wb-news', pageId: 'page3', name: 'Google News (West Bengal)', type: 'rss', url: 'https://news.google.com/rss/search?q=West+Bengal&hl=en-IN&gl=IN&ceid=IN:en', category: 'General WB News', language: 'english', active: true },
  { id: 'bikash-bhavan-edu', pageId: 'page3', name: 'Bikash Bhavan (WB Higher Education)', type: 'web', url: 'https://wbhed.gov.in/', category: 'Education & Exams', language: 'govt_portal', active: true },
  { id: 'cm-nabanna-press', pageId: 'page3', name: 'CM Office & Nabanna Press Release', type: 'web', url: 'https://egiyebangla.gov.in/', category: 'Politics & Governance', language: 'govt_portal', active: true },
  { id: 'wbbse-board', pageId: 'page3', name: 'WBBSE (Madhyamik Board)', type: 'web', url: 'https://wbbse.wb.gov.in/', category: 'Education & Exams', language: 'govt_portal', active: true },
  { id: 'wbchse-council', pageId: 'page3', name: 'WBCHSE (Higher Secondary Council)', type: 'web', url: 'https://wbchse.wb.gov.in/', category: 'Education & Exams', language: 'govt_portal', active: true },
  { id: 'wbpsc-exam', pageId: 'page3', name: 'WBPSC (Public Service Commission)', type: 'web', url: 'https://psc.wb.gov.in/', category: 'Education & Exams', language: 'govt_portal', active: true },
  { id: 'wbssc-teacher', pageId: 'page3', name: 'WBSSC (School Service Commission)', type: 'web', url: 'https://wbssc.gov.in/', category: 'Education & Exams', language: 'govt_portal', active: true }
];

// ─── Ensure dirs & seed files ─────────────────────────────────────────────────
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2));
  if (!fs.existsSync(SOURCES_FILE)) fs.writeFileSync(SOURCES_FILE, JSON.stringify(DEFAULT_SOURCES, null, 2));
  if (!fs.existsSync(PAGES_FILE)) fs.writeFileSync(PAGES_FILE, JSON.stringify(DEFAULT_PAGES, null, 2));
}

// ─── Pages ────────────────────────────────────────────────────────────────────
function getPages() {
  ensureDataDir();
  try { return JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8')); }
  catch (e) { return DEFAULT_PAGES; }
}

function savePages(pages) {
  ensureDataDir();
  fs.writeFileSync(PAGES_FILE, JSON.stringify(pages, null, 2));
}

function updatePage(id, updates) {
  const pages = getPages();
  const idx = pages.findIndex(p => p.id === id);
  if (idx === -1) return null;
  pages[idx] = { ...pages[idx], ...updates };
  savePages(pages);
  return pages[idx];
}

// ─── Posts ────────────────────────────────────────────────────────────────────
function getPosts(pageId = null) {
  ensureDataDir();
  try {
    const all = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
    if (!pageId) return all;
    // Posts without pageId are legacy → assign to page3
    return all.filter(p => (p.pageId || 'page3') === pageId);
  } catch (e) { return []; }
}

function savePosts(posts) {
  ensureDataDir();
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

function addPost(postData) {
  const all = getPosts();
  const newPost = {
    id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    pageId: postData.pageId || 'page3',
    scrapedAt: new Date().toISOString(),
    status: 'pending',
    publishedAt: null,
    facebookPostId: null,
    error: null,
    ...postData
  };
  all.unshift(newPost);
  savePosts(all);
  return newPost;
}

function updatePost(id, updates) {
  const all = getPosts();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  savePosts(all);
  return all[idx];
}

// ─── Sources ──────────────────────────────────────────────────────────────────
function getSources(pageId = null) {
  ensureDataDir();
  try {
    const all = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8'));
    if (!pageId) return all;
    return all.filter(s => (s.pageId || 'page3') === pageId);
  } catch (e) { return []; }
}

function saveSources(sources) {
  ensureDataDir();
  fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2));
}

/**
 * 7-Day Rolling Data & File Cleanup Manager
 * Keeps data, generated banners, and PDF files for ONLY the last N days (default: 7 days)
 */
function pruneOldData(maxDays = 7) {
  ensureDataDir();
  const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const cutoffTime = now - maxAgeMs;

  let allPosts = [];
  try { allPosts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8')); }
  catch (e) { return { prunedPosts: 0, prunedFiles: 0 }; }

  const activePosts = [];
  const expiredPosts = [];

  allPosts.forEach(post => {
    const postTime = new Date(post.createdAt || post.scrapedAt || post.updatedAt || 0).getTime();
    if (postTime > 0 && postTime < cutoffTime) {
      expiredPosts.push(post);
    } else {
      activePosts.push(post);
    }
  });

  let prunedFiles = 0;

  // Delete local generated banner images & attached photos belonging to expired posts
  expiredPosts.forEach(post => {
    const photosToDelete = [];
    if (post.bannerUrl && post.bannerUrl.startsWith('/generated_banners/')) {
      photosToDelete.push(post.bannerUrl);
    }
    if (Array.isArray(post.attachedPhotos)) {
      post.attachedPhotos.forEach(url => {
        if (url && url.startsWith('/generated_banners/')) photosToDelete.push(url);
      });
    }
    photosToDelete.forEach(relPath => {
      const absPath = path.join(__dirname, '../../public', relPath);
      if (fs.existsSync(absPath)) {
        try { fs.unlinkSync(absPath); prunedFiles++; } catch (e) {}
      }
    });
  });

  // Clean orphan files in generated_banners & pdf_downloads older than maxDays
  const foldersToClean = [
    path.join(__dirname, '../../public/generated_banners'),
    path.join(__dirname, '../../public/pdf_downloads')
  ];

  foldersToClean.forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      files.forEach(fileName => {
        const filePath = path.join(dirPath, fileName);
        try {
          const stats = fs.statSync(filePath);
          if (stats.mtimeMs < cutoffTime) {
            fs.unlinkSync(filePath);
            prunedFiles++;
          }
        } catch (e) {}
      });
    }
  });

  if (expiredPosts.length > 0) {
    savePosts(activePosts);
    console.log(`\x1b[35m[7-Day Auto-Cleanup]\x1b[0m Removed ${expiredPosts.length} posts & ${prunedFiles} files older than ${maxDays} days.`);
  }

  return { prunedPosts: expiredPosts.length, prunedFiles };
}

module.exports = {
  getPages, savePages, updatePage,
  getPosts, savePosts, addPost, updatePost,
  getSources, saveSources, pruneOldData
};
