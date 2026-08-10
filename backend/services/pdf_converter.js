const axios = require('axios');
const https = require('https');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');
const pdfParse = require('pdf-parse');

const PDF_DIR = path.join(__dirname, '../../public/pdf_downloads');
const BANNERS_DIR = path.join(__dirname, '../../public/generated_banners');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

function ensureDirs() {
  if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
  if (!fs.existsSync(BANNERS_DIR)) fs.mkdirSync(BANNERS_DIR, { recursive: true });
}

/**
 * Downloads a PDF, extracts official text/ref details, and renders a 1080x1350 (4:5 Portrait) 
 * Official West Bengal Government Notice Graphic Card.
 */
async function convertPdfToBannerImage(pdfUrl, title = 'West Bengal Education & Job Notice', sourceName = 'Government Notice') {
  ensureDirs();
  console.log(`[PDF Converter] Processing PDF notice: ${pdfUrl}`);

  try {
    // 1. Download PDF Buffer with SSL fallback
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      httpsAgent,
      timeout: 15000
    });

    const pdfBuffer = response.data;
    if (!pdfBuffer || pdfBuffer.byteLength < 500) {
      console.error('[PDF Converter] PDF buffer empty.');
      return null;
    }

    // Save copy of raw PDF
    const pdfFileName = `notice_${Date.now()}_${Math.random().toString(36).substr(2,5)}.pdf`;
    const pdfSavePath = path.join(PDF_DIR, pdfFileName);
    fs.writeFileSync(pdfSavePath, pdfBuffer);
    console.log(`[PDF Converter] Saved raw PDF: ${pdfSavePath}`);

    // 2. Parse text from PDF using pdf-parse
    let pdfText = '';
    try {
      const parseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse);
      const parsedData = await parseFn(pdfBuffer);
      pdfText = parsedData.text ? parsedData.text.replace(/\s+/g, ' ').trim() : '';
    } catch (pe) {
      console.log('[PDF Converter] pdf-parse info:', pe.message);
    }

    const cleanTitle = title.replace(/^\[.*?\]\s*/, '').trim();
    const snippetText = pdfText && pdfText.length > 50 
      ? pdfText.substring(0, 300) + '...' 
      : 'Official West Bengal Government Educational Notification / Job Release Document.';

    // 3. Create 1080x1350 (4:5 Vertical Portrait) Graphic Banner
    const width = 1080;
    const height = 1350;

    // Background: Deep Navy Slate gradient style
    const bg = new Jimp(width, height, 0x0f172aff); // Dark Navy Slate

    // Header banner area (Deep Blue / Crimson accent)
    const headerBar = new Jimp(width, 180, 0x1e3a8aff); // Royal Navy
    bg.composite(headerBar, 0, 0);

    // Accent Line
    const accentLine = new Jimp(width, 10, 0x38bdf8ff); // Sky Blue
    bg.composite(accentLine, 0, 180);

    // Document Card Container (White background inside dark portrait canvas)
    const cardContainer = new Jimp(980, 1060, 0xffffffff);
    bg.composite(cardContainer, 50, 220);

    // Card Header Bar
    const cardHeader = new Jimp(980, 80, 0x0284c7ff);
    bg.composite(cardHeader, 50, 220);

    // Load Fonts for Rendering Text
    const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontSub = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const fontBody = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

    // Render Text
    bg.print(fontSub, 70, 50, `OFFICIAL WEST BENGAL GOVT RELEASE`);
    bg.print(fontBody, 70, 248, `SOURCE: ${sourceName.toUpperCase()} | PDF RELEASE DOCUMENT`);

    // Title inside card
    bg.print(fontTitle, 85, 330, cleanTitle, 910);

    // Body snippet text inside card
    bg.print(fontBody, 85, 550, `NOTICE SUMMARY:\n${snippetText}`, 910);

    // Footer Tag inside card
    const footerBadge = new Jimp(980, 60, 0xe0f2feff);
    bg.composite(footerBadge, 50, 1220);
    const fontFooter = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    bg.print(fontFooter, 85, 1240, `FULL PDF ATTACHED & LINKED | WB EDUCATION & JOB PORTAL`);

    const bannerFileName = `pdf_notice_${Date.now()}_${Math.random().toString(36).substr(2,5)}.png`;
    const bannerPath = path.join(BANNERS_DIR, bannerFileName);
    await bg.writeAsync(bannerPath);

    console.log(`[PDF Converter] Successfully generated 1080x1350 Notice Banner: ${bannerPath}`);
    return `/generated_banners/${bannerFileName}`;
  } catch (err) {
    console.error('[PDF Converter Error] Failed to process PDF:', err.message);
    return null;
  }
}

module.exports = {
  convertPdfToBannerImage
};
