const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const BANNERS_DIR = path.join(__dirname, '../../public/generated_banners');

const STOCK_PHOTOS_POOLS = {
  movies: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518676599602-f4b826aaa2c3?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586899028174-e7098604235b?q=80&w=1080&auto=format&fit=crop'
  ],
  finance: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?q=80&w=1080&auto=format&fit=crop'
  ],
  news: [
    'https://images.unsplash.com/photo-1558431382-27e303142255?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571679654681-ba01b9e1e117?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?q=80&w=1080&auto=format&fit=crop'
  ]
};

function getDiverseStockPhoto(title = '', category = '') {
  const catLower = (category || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();

  let pool = STOCK_PHOTOS_POOLS.news;
  if (catLower.includes('movie') || catLower.includes('bollywood') || catLower.includes('ott') || catLower.includes('entertainment') || titleLower.includes('movie') || titleLower.includes('film') || titleLower.includes('series')) {
    pool = STOCK_PHOTOS_POOLS.movies;
  } else if (catLower.includes('stock') || catLower.includes('finance') || catLower.includes('market') || catLower.includes('trading') || titleLower.includes('ipo') || titleLower.includes('nifty') || titleLower.includes('sensex') || titleLower.includes('share')) {
    pool = STOCK_PHOTOS_POOLS.finance;
  }

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

function ensureBannersDir() {
  if (!fs.existsSync(BANNERS_DIR)) {
    fs.mkdirSync(BANNERS_DIR, { recursive: true });
  }
}

function isInvalidOrLogoUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('googleusercontent.com') ||
    lower.includes('lh3.googleusercontent') ||
    lower.includes('gstatic.com') ||
    lower.includes('google.com/images') ||
    lower.includes('favicon') ||
    lower.includes('logo_') ||
    lower.includes('logo-') ||
    lower.includes('placeholder')
  );
}

function cleanTextForPrompt(str, fallback = 'Kolkata West Bengal news report') {
  if (!str) return fallback;
  const asciiOnly = str
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (asciiOnly.length < 4) {
    return fallback;
  }
  return asciiOnly;
}

async function resolveRealArticleImage(link) {
  if (!link || !link.startsWith('http')) return null;
  try {
    const res = await axios.get(link, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      },
      maxRedirects: 5,
      timeout: 8000
    });
    
    let finalUrl = link;
    if (res.request && res.request.res && res.request.res.responseUrl) {
      finalUrl = res.request.res.responseUrl;
    }

    const $ = cheerio.load(res.data);
    let ogImg = $('meta[property="og:image:secure_url"]').attr('content') ||
                $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image:src"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('meta[name="thumbnail"]').attr('content') ||
                $('link[rel="image_src"]').attr('href') ||
                $('article img').first().attr('src') ||
                $('.featured-image img').first().attr('src') ||
                $('.entry-content img').first().attr('src');

    if (ogImg && !ogImg.startsWith('http') && finalUrl.startsWith('http')) {
      const urlObj = new URL(finalUrl);
      ogImg = `${urlObj.origin}${ogImg.startsWith('/') ? '' : '/'}${ogImg}`;
    }

    if (ogImg && ogImg.startsWith('http') && !isInvalidOrLogoUrl(ogImg)) {
      // Clean low-res thumbnail query params to fetch highest HD resolution
      ogImg = ogImg.replace(/\?w=\d+&h=\d+/, '?w=1200')
                   .replace(/\/(w\d+|h\d+|thumb|small|mini)\//gi, '/large/');
      return ogImg;
    }
  } catch (err) {}
  return null;
}

/**
 * Generates a post banner. Prioritizes EXACT ORIGINAL SCRAPED HD ARTICLE IMAGE without changes.
 */
async function generatePostBanner(title, category = 'WEST BENGAL NEWS', dateStr = null, mode = null, articleImageUrl = null, articleLink = null, customAiPrompt = null) {
  ensureBannersDir();
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
  const outputPath = path.join(BANNERS_DIR, fileName);
  const publicUrl = `/generated_banners/${fileName}`;

  try {
    const width = 1080;
    const height = 1350;
    let photoBuffer = null;

    // ═════════════════════════════════════════════════════════════════
    // STEP 1: TOP PRIORITY — EXACT ORIGINAL SCRAPED ARTICLE HD IMAGE!
    // (DO NOT CHANGE OR REPLACE SCRAPED IMAGES WITH AI)
    // ═════════════════════════════════════════════════════════════════
    if (!customAiPrompt) {
      let realImgUrl = articleImageUrl;
      if (isInvalidOrLogoUrl(realImgUrl)) {
        realImgUrl = null;
      }

      if (!realImgUrl && articleLink) {
        realImgUrl = await resolveRealArticleImage(articleLink);
      }

      if (realImgUrl && realImgUrl.startsWith('http') && !isInvalidOrLogoUrl(realImgUrl)) {
        try {
          console.log(`[Image Scraper] Fetching EXACT original HD article image: ${realImgUrl}`);
          const imgRes = await axios.get(realImgUrl, {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            },
            timeout: 12000
          });
          if (imgRes.data && imgRes.data.byteLength > 1000) {
            photoBuffer = imgRes.data;
            console.log('[Image Scraper] Successfully downloaded EXACT original scraped HD article image!');
          }
        } catch (e) {
          console.log(`[Image Scraper] Exact article photo download failed: ${e.message}`);
        }
      }
    }

    // ═════════════════════════════════════════════════════════════════
    // STEP 2: ONLY IF NO SCRAPED ARTICLE IMAGE EXISTS (OR CUSTOM AI PROMPT REQUESTED)
    // ═════════════════════════════════════════════════════════════════
    if (!photoBuffer && (customAiPrompt || mode === 'ai_image')) {
      const VIBRANT_CARTOON_SUFFIX = ', Vibrant colorful 2D cartoon illustration, bold thick outlines, flat saturated colors, playful children book art style, bright rainbow palette, high contrast';
      const promptToUse = customAiPrompt || `Kolkata West Bengal news photograph, ${cleanTextForPrompt(title, 'Kolkata news report')}${VIBRANT_CARTOON_SUFFIX}`;

      // 1. Try Hugging Face FLUX API
      if (hfKey && hfKey.startsWith('hf_')) {
        const hfAttempts = [
          { url: 'https://router.huggingface.co/models/black-forest-labs/FLUX.1-schnell', payload: { inputs: promptToUse } },
          { url: 'https://router.huggingface.co/hf-inference/v1/images/generations', payload: { prompt: promptToUse, model: 'black-forest-labs/FLUX.1-schnell' } }
        ];

        for (const attempt of hfAttempts) {
          if (photoBuffer) break;
          try {
            console.log(`[AI Generator] Calling Hugging Face FLUX API (${attempt.url})...`);
            const hfRes = await axios.post(attempt.url, attempt.payload, {
              headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
              responseType: 'arraybuffer',
              timeout: 25000
            });
            if (hfRes.data && hfRes.data.byteLength > 1000) {
              photoBuffer = hfRes.data;
            }
          } catch (hfErr) {}
        }
      }

      // 2. Try Pollinations FLUX API
      if (!photoBuffer) {
        try {
          const cleanPrompt = encodeURIComponent(promptToUse);
          const aiUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1350&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
          const aiRes = await axios.get(aiUrl, { responseType: 'arraybuffer', timeout: 15000 });
          if (aiRes.data && aiRes.data.byteLength > 1000) {
            photoBuffer = aiRes.data;
          }
        } catch (aiErr) {}
      }
    }

    // ═════════════════════════════════════════════════════════════════
    // STEP 3: FALLBACK TO TOPIC-MATCHED HD UNSPLASH PHOTO IF 0 IMAGES FOUND
    // ═════════════════════════════════════════════════════════════════
    if (!photoBuffer) {
      const diverseStockUrl = getDiverseStockPhoto(title, category);
      try {
        console.log(`[Image Scraper] Using topic HD stock photo (${category}): ${diverseStockUrl}`);
        const stockRes = await axios.get(diverseStockUrl, { responseType: 'arraybuffer', timeout: 8000 });
        photoBuffer = stockRes.data;
      } catch (e) {}
    }

    // 6. PROCESS AND SAVE CLEAN PORTRAIT IMAGE (1080x1350 4:5 PORTRAIT CROP)
    if (photoBuffer) {
      const photo = await Jimp.read(photoBuffer);
      // Jimp v0.22 compatible resize + crop (replaces deprecated .cover())
      const srcW = photo.getWidth();
      const srcH = photo.getHeight();
      const scaleW = width / srcW;
      const scaleH = height / srcH;
      const scale = Math.max(scaleW, scaleH);
      const newW = Math.round(srcW * scale);
      const newH = Math.round(srcH * scale);
      photo.resize(newW, newH);
      const cropX = Math.floor((newW - width) / 2);
      const cropY = Math.floor((newH - height) / 2);
      photo.crop(cropX, cropY, width, height);
      await photo.writeAsync(outputPath);
      console.log(`[Image Generator] Saved clean 1080x1350 vertical portrait image at: ${outputPath}`);
      return publicUrl;
    } else {
      const baseImage = new Jimp(width, height, 0x0f172aff);
      await baseImage.writeAsync(outputPath);
      return publicUrl;
    }
  } catch (err) {
    console.error('[Image Generator Error] Failed to generate clean image:', err.message);
    return null;
  }
}

module.exports = {
  generatePostBanner,
  resolveRealArticleImage
};
