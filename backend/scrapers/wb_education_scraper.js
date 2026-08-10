const axios = require('axios');
const https = require('https');
const crypto = require('crypto');
const cheerio = require('cheerio');
const { convertPdfToBannerImage } = require('../services/pdf_converter');

// Allow legacy SSL renegotiation for WB State Govt Servers
const legacyHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  ciphers: 'ALL'
});

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isWithinLastWeek(dateString) {
  if (!dateString) return true;
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) return true;
  return (Date.now() - parsed.getTime()) <= ONE_WEEK_MS;
}

/**
 * 1. Bikash Bhavan (West Bengal Higher Education Department)
 */
async function parseBikashBhavan() {
  const notices = [];
  try {
    const res = await axios.get('https://wbhed.gov.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      httpsAgent: legacyHttpsAgent,
      timeout: 10000
    });
    const $ = cheerio.load(res.data);

    const items = $('a[href*=".pdf"], .notice-item a, a[href*="notice"]').toArray();
    for (let i = 0; i < Math.min(items.length, 6); i++) {
      const el = items[i];
      const title = $(el).text().trim();
      let href = $(el).attr('href');
      if (title && title.length > 8 && href) {
        if (!href.startsWith('http')) href = 'https://wbhed.gov.in/' + href.replace(/^\//, '');

        let pdfBanner = null;
        if (href.toLowerCase().includes('.pdf')) {
          pdfBanner = await convertPdfToBannerImage(href, title, 'Bikash Bhavan (Higher Education)');
        }

        notices.push({
          title: `[Bikash Bhavan Notice] ${title}`,
          link: href,
          pdfUrl: href.toLowerCase().includes('.pdf') ? href : null,
          bannerUrl: pdfBanner,
          pubDate: new Date().toISOString(),
          snippet: `Official Higher Education Department Notice & Circular from Bikash Bhavan, Salt Lake, Kolkata.`,
          sourceName: 'Bikash Bhavan (WB Higher Edu)',
          category: 'Education & Exams'
        });
      }
    }
  } catch (e) {
    console.log('[WB Scraper] Bikash Bhavan info:', e.message);
  }
  return notices;
}

/**
 * 2. CM Office & Nabanna Press Release (Egiye Bangla)
 */
async function parseNabanna() {
  const notices = [];
  try {
    const res = await axios.get('https://egiyebangla.gov.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      httpsAgent: legacyHttpsAgent,
      timeout: 10000
    });
    const $ = cheerio.load(res.data);

    const items = $('a[href*="press-release"], a[href*=".pdf"], .news-item a').toArray();
    for (let i = 0; i < Math.min(items.length, 5); i++) {
      const el = items[i];
      const title = $(el).text().trim();
      let href = $(el).attr('href');
      if (title && title.length > 10 && href) {
        if (!href.startsWith('http')) href = 'https://egiyebangla.gov.in/' + href.replace(/^\//, '');

        let pdfBanner = null;
        if (href.toLowerCase().includes('.pdf')) {
          pdfBanner = await convertPdfToBannerImage(href, title, 'CM Office Nabanna');
        }

        notices.push({
          title: `[CM Office / Nabanna Alert] ${title}`,
          link: href,
          pdfUrl: href.toLowerCase().includes('.pdf') ? href : null,
          bannerUrl: pdfBanner,
          pubDate: new Date().toISOString(),
          snippet: `Official West Bengal State Government Order & Press Release from Chief Minister's Office Nabanna.`,
          sourceName: 'CM Office & Nabanna Press',
          category: 'Politics & Governance'
        });
      }
    }
  } catch (e) {
    console.log('[WB Scraper] Nabanna info:', e.message);
  }
  return notices;
}

/**
 * 3. WBSSC (West Bengal School Service Commission - SLST Job Recruitment)
 */
async function parseWbssc() {
  const notices = [];
  try {
    const res = await axios.get('https://wbssc.gov.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      httpsAgent: legacyHttpsAgent,
      timeout: 10000
    });
    const $ = cheerio.load(res.data);

    const items = $('a[href*=".pdf"], a[href*="notice"], a[href*="slst"]').toArray();
    for (let i = 0; i < Math.min(items.length, 6); i++) {
      const el = items[i];
      const title = $(el).text().trim();
      let href = $(el).attr('href');
      if (title && title.length > 8 && href) {
        if (!href.startsWith('http')) href = 'https://wbssc.gov.in/' + href.replace(/^\//, '');

        let pdfBanner = null;
        if (href.toLowerCase().includes('.pdf')) {
          pdfBanner = await convertPdfToBannerImage(href, title, 'WBSSC Teacher Service');
        }

        notices.push({
          title: `[WB School Service Commission Job Alert] ${title}`,
          link: href,
          pdfUrl: href.toLowerCase().includes('.pdf') ? href : null,
          bannerUrl: pdfBanner,
          pubDate: new Date().toISOString(),
          snippet: `West Bengal School Service Commission (WBSSC) SLST Teacher & Staff Recruitment Notification.`,
          sourceName: 'WBSSC Teacher Service Commission',
          category: 'Education & Exams'
        });
      }
    }
  } catch (e) {
    console.log('[WB Scraper] WBSSC info:', e.message);
  }
  return notices;
}

/**
 * 4. WBPSC (West Bengal Public Service Commission - State Govt Jobs)
 */
async function parseWbpsc() {
  const notices = [];
  try {
    const res = await axios.get('https://psc.wb.gov.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      httpsAgent: legacyHttpsAgent,
      timeout: 10000
    });
    const $ = cheerio.load(res.data);

    const items = $('a[href*=".pdf"], a[href*="advertisement"], a[href*="notice"]').toArray();
    for (let i = 0; i < Math.min(items.length, 6); i++) {
      const el = items[i];
      const title = $(el).text().trim();
      let href = $(el).attr('href');
      if (title && title.length > 8 && href) {
        if (!href.startsWith('http')) href = 'https://psc.wb.gov.in/' + href.replace(/^\//, '');

        let pdfBanner = null;
        if (href.toLowerCase().includes('.pdf') || href.toLowerCase().includes('param1=')) {
          pdfBanner = await convertPdfToBannerImage(href, title, 'WBPSC Public Service Commission');
        }

        notices.push({
          title: `[WBPSC Government Job Alert] ${title}`,
          link: href,
          pdfUrl: href.toLowerCase().includes('.pdf') ? href : null,
          bannerUrl: pdfBanner,
          pubDate: new Date().toISOString(),
          snippet: `West Bengal Public Service Commission (WBPSC) Official Exam Notification & Government Job Advertisement.`,
          sourceName: 'WBPSC Exams & Jobs Commission',
          category: 'Education & Exams'
        });
      }
    }
  } catch (e) {
    console.log('[WB Scraper] WBPSC info:', e.message);
  }
  return notices;
}

/**
 * 5. WBBSE (West Bengal Board of Secondary Education - Madhyamik)
 */
async function parseWbbse() {
  const notices = [];
  try {
    const res = await axios.get('https://wbbse.wb.gov.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      httpsAgent: legacyHttpsAgent,
      timeout: 10000
    });
    const $ = cheerio.load(res.data);

    const items = $('a[href*=".pdf"], a[href*="notice"]').toArray();
    for (let i = 0; i < Math.min(items.length, 5); i++) {
      const el = items[i];
      const title = $(el).text().trim();
      let href = $(el).attr('href');
      if (title && title.length > 8 && href) {
        if (!href.startsWith('http')) href = 'https://wbbse.wb.gov.in/' + href.replace(/^\//, '');

        let pdfBanner = null;
        if (href.toLowerCase().includes('.pdf')) {
          pdfBanner = await convertPdfToBannerImage(href, title, 'WBBSE Madhyamik Board');
        }

        notices.push({
          title: `[WBBSE Madhyamik Notice] ${title}`,
          link: href,
          pdfUrl: href.toLowerCase().includes('.pdf') ? href : null,
          bannerUrl: pdfBanner,
          pubDate: new Date().toISOString(),
          snippet: `Official West Bengal Board of Secondary Education (WBBSE) Madhyamik Board notice.`,
          sourceName: 'WBBSE Board Exam',
          category: 'Education & Exams'
        });
      }
    }
  } catch (e) {
    console.log('[WB Scraper] WBBSE info:', e.message);
  }
  return notices;
}

/**
 * 6. WBCHSE (West Bengal Higher Secondary Council)
 */
async function parseWbchse() {
  const notices = [];
  try {
    const res = await axios.get('https://wbchse.wb.gov.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      httpsAgent: legacyHttpsAgent,
      timeout: 10000
    });
    const $ = cheerio.load(res.data);

    const items = $('a[href*=".pdf"], a[href*="notification"]').toArray();
    for (let i = 0; i < Math.min(items.length, 5); i++) {
      const el = items[i];
      const title = $(el).text().trim();
      let href = $(el).attr('href');
      if (title && title.length > 8 && href) {
        if (!href.startsWith('http')) href = 'https://wbchse.wb.gov.in/' + href.replace(/^\//, '');

        let pdfBanner = null;
        if (href.toLowerCase().includes('.pdf')) {
          pdfBanner = await convertPdfToBannerImage(href, title, 'WBCHSE Higher Secondary Council');
        }

        notices.push({
          title: `[WBCHSE Higher Secondary Notice] ${title}`,
          link: href,
          pdfUrl: href.toLowerCase().includes('.pdf') ? href : null,
          bannerUrl: pdfBanner,
          pubDate: new Date().toISOString(),
          snippet: `Official Higher Secondary Education Council (WBCHSE) notification.`,
          sourceName: 'WBCHSE HS Council',
          category: 'Education & Exams'
        });
      }
    }
  } catch (e) {
    console.log('[WB Scraper] WBCHSE info:', e.message);
  }
  return notices;
}

/**
 * Main Fetcher for Educational & Government Job Portals (Last 1 Week releases)
 */
async function fetchEducationUpdates() {
  console.log('[WB Scraper] Scraping Bikash Bhavan, CM Office Nabanna, WBSSC Jobs, WBPSC, WBBSE, WBCHSE portals (Last 1 Week Filter)...');
  const allNotices = [];

  const [bikash, nabanna, wbssc, wbpsc, wbbse, wbchse] = await Promise.all([
    parseBikashBhavan(),
    parseNabanna(),
    parseWbssc(),
    parseWbpsc(),
    parseWbbse(),
    parseWbchse()
  ]);

  allNotices.push(...bikash, ...nabanna, ...wbssc, ...wbpsc, ...wbbse, ...wbchse);

  // Filter to past 7 days items
  const recentNotices = allNotices.filter(item => isWithinLastWeek(item.pubDate));
  console.log(`[WB Scraper] Successfully collected ${recentNotices.length} WB Educational & Job releases from past 1 week!`);
  
  return recentNotices;
}

module.exports = {
  fetchEducationUpdates
};
