const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const BANNERS_DIR = path.join(__dirname, '../../public/generated_banners');

const WB_STOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1558431382-27e303142255?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571679654681-ba01b9e1e117?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1080&auto=format&fit=crop'
];

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      maxRedirects: 5,
      timeout: 6000
    });
    
    let finalUrl = link;
    if (res.request && res.request.res && res.request.res.responseUrl) {
      finalUrl = res.request.res.responseUrl;
    }

    const $ = cheerio.load(res.data);
    let ogImg = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('link[rel="image_src"]').attr('href') ||
                $('article img').first().attr('src');

    if (ogImg && !ogImg.startsWith('http') && finalUrl.startsWith('http')) {
      const urlObj = new URL(finalUrl);
      ogImg = `${urlObj.origin}${ogImg.startsWith('/') ? '' : '/'}${ogImg}`;
    }

    if (ogImg && ogImg.startsWith('http') && !isInvalidOrLogoUrl(ogImg)) {
      return ogImg;
    }
  } catch (err) {}
  return null;
}

/**
 * Generates a clean 1080x1080 news image (Scraped Article Photo or AI Photo) WITHOUT any Google logo placeholders or banner text.
 */
async function generatePostBanner(title, category = 'WEST BENGAL NEWS', dateStr = null, mode = null, articleImageUrl = null, articleLink = null, customAiPrompt = null) {
  ensureBannersDir();
  const imageType = mode || process.env.IMAGE_GENERATOR_TYPE || 'ai_image';
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
  const outputPath = path.join(BANNERS_DIR, fileName);
  const publicUrl = `/generated_banners/${fileName}`;

  try {
    const width = 1080;
    const height = 1350;
    let photoBuffer = null;

    const VIBRANT_CARTOON_SUFFIX = ', Vibrant colorful 2D cartoon illustration, bold thick outlines, flat saturated colors, playful children book art style, bright rainbow palette, high contrast';
    const promptToUse = customAiPrompt || `Kolkata West Bengal news photograph, ${cleanTextForPrompt(title, 'Kolkata news report')}${VIBRANT_CARTOON_SUFFIX}`;

    // 1. TRY HUGGING FACE FREE FLUX.1 API IF PROMPT OR MODE IS AI_IMAGE
    if ((customAiPrompt || mode === 'ai_image') && hfKey && hfKey.startsWith('hf_')) {
      const hfAttempts = [
        {
          url: 'https://router.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
          payload: { inputs: promptToUse }
        },
        {
          url: 'https://router.huggingface.co/hf-inference/v1/images/generations',
          payload: { prompt: promptToUse, model: 'black-forest-labs/FLUX.1-schnell' }
        }
      ];

      for (const attempt of hfAttempts) {
        if (photoBuffer) break;
        try {
          console.log(`[Image Generator] Calling Hugging Face FLUX API (${attempt.url})...`);
          const hfRes = await axios.post(
            attempt.url,
            attempt.payload,
            {
              headers: {
                'Authorization': `Bearer ${hfKey}`,
                'Content-Type': 'application/json'
              },
              responseType: 'arraybuffer',
              timeout: 25000
            }
          );
          if (hfRes.data && hfRes.data.byteLength > 1000) {
            photoBuffer = hfRes.data;
            console.log('[Image Generator] Successfully generated image via Hugging Face FLUX.1 API!');
          }
        } catch (hfErr) {
          console.log(`[Image Generator] HF Endpoint failed: ${hfErr.message}`);
        }
      }
    }

    // 2. TRY POLLINATIONS FREE FLUX MODEL IF CUSTOM AI PROMPT OR MODE IS AI_IMAGE
    if (!photoBuffer && (customAiPrompt || mode === 'ai_image')) {
      try {
        console.log(`[Image Generator] Generating AI Image via Pollinations FLUX for: "${promptToUse}"...`);
        const cleanPrompt = encodeURIComponent(promptToUse);
        const aiUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1350&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;

        const aiRes = await axios.get(aiUrl, { responseType: 'arraybuffer', timeout: 15000 });
        photoBuffer = aiRes.data;
      } catch (aiErr) {
        console.log('[Image Generator] Pollinations AI image download failed.');
      }
    }

    // 3. TRY REAL SCRAPED ARTICLE PHOTO (REJECT GOOGLE LOGOS)
    if (!photoBuffer) {
      let realImgUrl = articleImageUrl;
      if (isInvalidOrLogoUrl(realImgUrl)) {
        realImgUrl = null;
      }

      if (!realImgUrl && articleLink) {
        realImgUrl = await resolveRealArticleImage(articleLink);
      }

      if (realImgUrl && realImgUrl.startsWith('http') && !isInvalidOrLogoUrl(realImgUrl)) {
        try {
          console.log(`[Image Generator] Downloading real article photo: ${realImgUrl}`);
          const imgRes = await axios.get(realImgUrl, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 8000
          });
          if (imgRes.data && imgRes.data.byteLength > 1000) {
            photoBuffer = imgRes.data;
          }
        } catch (e) {
          console.log('[Image Generator] Article photo download failed.');
        }
      }
    }

    // 4. POLLINATIONS FLUX AI GENERATION IF NO REAL PHOTO FOUND (REPLACES GOOGLE LOGO)
    if (!photoBuffer) {
      try {
        console.log(`[Image Generator] Generating FLUX AI news photo for: "${title}"...`);
        const cleanPrompt = encodeURIComponent(`High quality West Bengal news photograph, ${cleanTextForPrompt(title)}, professional journalism photo 4k`);
        const aiUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1350&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;

        const aiRes = await axios.get(aiUrl, { responseType: 'arraybuffer', timeout: 15000 });
        if (aiRes.data && aiRes.data.byteLength > 1000) {
          photoBuffer = aiRes.data;
        }
      } catch (aiErr) {
        console.log('[Image Generator] Fallback AI image download failed.');
      }
    }

    // 5. CURATED STOCK PHOTO FALLBACK IF ALL ELSE FAILS
    if (!photoBuffer) {
      const randomStockUrl = WB_STOCK_PHOTOS[Math.floor(Math.random() * WB_STOCK_PHOTOS.length)];
      try {
        console.log(`[Image Generator] Using West Bengal stock photo: ${randomStockUrl}`);
        const stockRes = await axios.get(randomStockUrl, { responseType: 'arraybuffer', timeout: 8000 });
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
