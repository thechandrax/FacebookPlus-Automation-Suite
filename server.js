if (typeof globalThis.File === 'undefined') {
  const { Blob } = require('buffer');
  class File extends Blob {
    constructor(fileBits, fileName, options = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified || Date.now();
    }
  }
  globalThis.File = File;
}
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const { getPosts, updatePost, getSources, saveSources, addPost, getPages, savePages, updatePage } = require('./backend/storage/posts_store');
const { runAutomationCycle, startCronScheduler } = require('./backend/publisher/scheduler');
const { publishToFacebook }   = require('./backend/publisher/fb_publisher');
const { generatePostBanner }  = require('./backend/services/banner_generator');
const { generatePostCaption } = require('./backend/services/ai_generator');
const { fetchRssFeed, fetchOgImageAndSummary } = require('./backend/scrapers/rss_scraper');
const { generateSeriesGraphChart } = require('./backend/services/seriesgraph_generator');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/generated_banners', express.static(path.join(__dirname, 'public/generated_banners')));

// ═══════════════════════════════════════════════════════════
//  AUTH  (protects all /api routes with a shared secret key)
// ═══════════════════════════════════════════════════════════
// Set DASHBOARD_API_KEY in .env to enable. If it's unset, the API stays open
// (fine for pure-localhost use) but a console warning is printed on boot.
app.use('/api', (req, res, next) => {
  const requiredKey = process.env.DASHBOARD_API_KEY;
  if (!requiredKey) return next(); // no key configured -> auth disabled
  const providedKey = req.get('x-api-key') || req.query.apiKey;
  if (providedKey === requiredKey) return next();
  res.status(401).json({ success: false, error: 'Unauthorized. Provide a valid x-api-key header.' });
});

// GET all pages
app.get('/api/pages', (req, res) => {
  res.json({ success: true, pages: getPages() });
});

// PUT update a page (credentials, settings, schedule)
app.put('/api/pages/:id', (req, res) => {
  const { name, fbPageId, fbPageToken, language, aiStyle, imageType, autoPost, cronSchedule, active } = req.body;
  const updated = updatePage(req.params.id, {
    ...(name          !== undefined && { name }),
    ...(fbPageId      !== undefined && { fbPageId }),
    ...(fbPageToken   !== undefined && { fbPageToken }),
    ...(language      !== undefined && { language }),
    ...(aiStyle       !== undefined && { aiStyle }),
    ...(imageType     !== undefined && { imageType }),
    ...(autoPost      !== undefined && { autoPost }),
    ...(cronSchedule  !== undefined && { cronSchedule }),
    ...(active        !== undefined && { active })
  });
  if (!updated) return res.status(404).json({ success: false, error: 'Page not found' });
  // Restart cron after page update
  startCronScheduler(`http://localhost:${PORT}`);
  res.json({ success: true, page: updated });
});

// POST auto-connect FB token for a page
app.post('/api/pages/:id/connect-fb', async (req, res) => {
  const { userToken } = req.body;
  if (!userToken) return res.status(400).json({ success: false, error: 'No token provided' });
  try {
    const axios = require('axios');
    const apiVersion = process.env.FACEBOOK_API_VERSION || 'v19.0';
    const accRes = await axios.get(`https://graph.facebook.com/${apiVersion}/me/accounts?access_token=${userToken}`);
    const pages = accRes.data && accRes.data.data;
    if (pages && pages.length > 0) {
      const fbPage = pages[0];
      const updated = updatePage(req.params.id, { fbPageId: fbPage.id, fbPageToken: fbPage.access_token });
      return res.json({ success: true, pageName: fbPage.name, pageId: fbPage.id, message: `Connected to "${fbPage.name}"!`, page: updated });
    }
    // Direct page token fallback
    const pageRes = await axios.get(`https://graph.facebook.com/${apiVersion}/me?fields=id,name&access_token=${userToken}`);
    if (pageRes.data && pageRes.data.id) {
      const updated = updatePage(req.params.id, { fbPageId: pageRes.data.id, fbPageToken: userToken });
      return res.json({ success: true, pageName: pageRes.data.name, pageId: pageRes.data.id, message: `Connected to "${pageRes.data.name}"!`, page: updated });
    }
    return res.status(400).json({ success: false, error: 'No Facebook Pages found for this token.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.response ? JSON.stringify(err.response.data) : err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  POSTS API  (all support ?pageId= filter)
// ═══════════════════════════════════════════════════════════

// GET all posts (optionally filtered by pageId)
app.get('/api/posts', (req, res) => {
  const { pageId } = req.query;
  const posts = getPosts(pageId || null);
  res.json({ success: true, posts });
});

// POST fetch original article body
app.post('/api/posts/:id/fetch-original-body', async (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
  if (post.link) {
    const scraped = await fetchOgImageAndSummary(post.link);
    if (scraped.summary && scraped.summary.length > 40) {
      const updated = updatePost(post.id, {
        summary: scraped.summary, snippet: scraped.summary,
        ...(scraped.imageUrl && (!post.imageUrl || post.imageUrl.includes('placeholder')) && { imageUrl: scraped.imageUrl })
      });
      return res.json({ success: true, post: updated, summary: scraped.summary });
    }
  }
  res.json({ success: true, post, summary: post.summary || post.snippet || post.title });
});

// POST publish a post to its Facebook page
app.post('/api/posts/:id/publish', async (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const result = await publishToFacebook(post, { baseUrl });
  if (result.success) {
    const updated = updatePost(post.id, { status: 'published', publishedAt: result.publishedAt, facebookPostId: result.facebookPostId, simulation: result.simulation || false, error: null });
    res.json({ success: true, post: updated, message: result.message || 'Post published!' });
  } else {
    updatePost(post.id, { status: 'failed', error: result.error });
    res.status(500).json({ success: false, error: result.error });
  }
});

// PUT update post caption / properties
app.put('/api/posts/:id', (req, res) => {
  const { generatedCaption, title, category, bannerUrl, photos } = req.body;
  const updated = updatePost(req.params.id, {
    ...(generatedCaption !== undefined && { generatedCaption }),
    ...(title            !== undefined && { title }),
    ...(category         !== undefined && { category }),
    ...(bannerUrl        !== undefined && { bannerUrl }),
    ...(photos           !== undefined && { photos })
  });
  if (!updated) return res.status(404).json({ success: false, error: 'Post not found' });
  res.json({ success: true, post: updated });
});

// POST regenerate banner for a post
app.post('/api/posts/:id/regenerate-banner', async (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
  const { mode, customAiPrompt } = req.body;
  const dateStr  = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const bannerUrl = await generatePostBanner(post.title, post.category || 'NEWS', dateStr, mode, post.imageUrl, post.link, customAiPrompt);
  const updated = updatePost(post.id, { bannerUrl });
  res.json({ success: true, post: updated });
});

// POST AI enhance (rewrite caption + new AI image)
app.post('/api/posts/:id/ai-enhance', async (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
  try {
    const pages  = getPages();
    const page   = pages.find(p => p.id === (post.pageId || 'page3')) || {};
    const aiStyle = page.aiStyle || 'news';
    const newCaption = await generatePostCaption(
      { title: post.title, category: post.category, sourceName: post.sourceName, snippet: post.summary || post.snippet || post.title, link: post.link },
      page.language || 'bengali_english_mixed', null, null, aiStyle
    );
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const cleanTitle = post.title.replace(/[^\x00-\x7F]/g, '').trim() || 'news report';
    const customAiPrompt = `${page.name || 'News'} editorial photography, ${cleanTitle}, professional journalism 4k photo`;
    const bannerUrl = await generatePostBanner(post.title, post.category || page.name || 'NEWS', dateStr, 'ai_image', post.imageUrl, post.link, customAiPrompt);
    const updated = updatePost(post.id, { generatedCaption: newCaption || post.generatedCaption, bannerUrl: bannerUrl || post.bannerUrl, copyrightSafe: true });
    res.json({ success: true, post: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST rewrite text only
app.post('/api/posts/:id/rewrite-text', async (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
  try {
    const pages   = getPages();
    const page    = pages.find(p => p.id === (post.pageId || 'page3')) || {};
    const aiStyle = page.aiStyle || 'news';
    const newCaption = await generatePostCaption(
      { title: post.title, category: post.category, sourceName: post.sourceName, snippet: post.summary || post.snippet || post.title, link: post.link },
      page.language || 'bengali_english_mixed', null, null, aiStyle
    );
    const updated = updatePost(post.id, { generatedCaption: newCaption });
    res.json({ success: true, post: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST custom prompt generate
app.post('/api/posts/:id/custom-generate', async (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
  const { customCaptionPrompt, customImagePrompt } = req.body;
  try {
    const pages   = getPages();
    const page    = pages.find(p => p.id === (post.pageId || 'page3')) || {};
    const aiStyle = page.aiStyle || 'news';
    let newCaption = post.generatedCaption;
    if (customCaptionPrompt && customCaptionPrompt.trim()) {
      newCaption = await generatePostCaption(
        { title: post.title, category: post.category, sourceName: post.sourceName, snippet: post.summary || post.snippet || post.title, link: post.link },
        page.language || 'bengali_english_mixed', null, customCaptionPrompt, aiStyle
      );
    }
    let bannerUrl = post.bannerUrl;
    if (customImagePrompt && customImagePrompt.trim()) {
      const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      bannerUrl = await generatePostBanner(post.title, post.category || 'NEWS', dateStr, 'ai_image', post.imageUrl, post.link, customImagePrompt);
    }
    const updated = updatePost(post.id, { generatedCaption: newCaption || post.generatedCaption, bannerUrl: bannerUrl || post.bannerUrl, copyrightSafe: true });
    res.json({ success: true, post: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST generate SeriesGraph Rating Chart for a post
app.post('/api/posts/:id/generate-seriesgraph', async (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
  try {
    const posterUrl = post.imageUrl || post.bannerUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop';
    const chartUrl = await generateSeriesGraphChart({
      title: post.title,
      rating: '8.4',
      votes: '520,100',
      years: '2024 - 2026',
      posterUrl: posterUrl
    });
    const updated = updatePost(post.id, { bannerUrl: chartUrl });
    res.json({ success: true, post: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE post (reject)
app.delete('/api/posts/:id', (req, res) => {
  const updated = updatePost(req.params.id, { status: 'rejected' });
  res.json({ success: true, post: updated });
});

// ═══════════════════════════════════════════════════════════
//  SCRAPE NOW  (per page)
// ═══════════════════════════════════════════════════════════
app.post('/api/scrape-now', async (req, res) => {
  const { pageId } = req.body;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const result = await runAutomationCycle({ pageId: pageId || 'page3', baseUrl });
  res.json(result);
});

// ═══════════════════════════════════════════════════════════
//  SOURCES API  (support ?pageId= filter)
// ═══════════════════════════════════════════════════════════
app.get('/api/sources', (req, res) => {
  const { pageId } = req.query;
  res.json({ success: true, sources: getSources(pageId || null) });
});

app.post('/api/sources', (req, res) => {
  const { name, url, type, category, language, pageId } = req.body;
  if (!name || !url) return res.status(400).json({ success: false, error: 'Name and URL are required' });
  const all = getSources();
  const newSrc = { id: 'src_' + Date.now(), pageId: pageId || 'page3', name, url, type: type || 'rss', category: category || 'General News', language: language || 'english', active: true };
  all.push(newSrc);
  saveSources(all);
  res.json({ success: true, source: newSrc });
});

app.put('/api/sources/:id', (req, res) => {
  const { name, url, category, language, active, pinned } = req.body;
  const all = getSources();
  const idx = all.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Source not found' });
  all[idx] = { ...all[idx], ...(name !== undefined && { name }), ...(url !== undefined && { url }), ...(category !== undefined && { category }), ...(language !== undefined && { language }), ...(active !== undefined && { active }), ...(pinned !== undefined && { pinned }) };
  saveSources(all);
  res.json({ success: true, source: all[idx] });
});

app.delete('/api/sources/:id', (req, res) => {
  let all = getSources();
  all = all.filter(s => s.id !== req.params.id);
  saveSources(all);
  res.json({ success: true, message: 'Source deleted' });
});

app.get('/api/sources/:id/posts', async (req, res) => {
  const all = getSources();
  const source = all.find(s => s.id === req.params.id);
  if (!source) return res.status(404).json({ success: false, error: 'Source not found' });
  
  const posts = getPosts(source.pageId || null);
  let sourcePosts = posts.filter(p => {
    if (p.sourceName && p.sourceName.toLowerCase().includes(source.name.toLowerCase())) return true;
    if (p.sourceName && source.name.toLowerCase().includes(p.sourceName.toLowerCase())) return true;
    try {
      const host = new URL(source.url).hostname.replace('www.', '');
      if (host && host !== 'news.google.com' && p.link && p.link.includes(host)) return true;
    } catch (e) {}
    return false;
  });

  // Live Fallback: If no saved posts for this source, live-fetch directly from RSS URL!
  if (!sourcePosts || sourcePosts.length === 0) {
    try {
      const liveItems = await fetchRssFeed(source);
      if (liveItems && liveItems.length > 0) {
        sourcePosts = liveItems.slice(0, 15).map(item => ({
          title: item.title,
          link: item.link,
          scrapedAt: item.pubDate || new Date().toISOString(),
          imageUrl: item.imageUrl || '',
          bannerUrl: item.imageUrl || ''
        }));
      }
    } catch (e) {}
  }

  res.json({ success: true, source, posts: sourcePosts });
});

// ═══════════════════════════════════════════════════════════
//  SETTINGS API  (global AI keys + per-page handled via /api/pages)
// ═══════════════════════════════════════════════════════════
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    settings: {
      hasGeminiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
      hasGroqKey:   !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')),
      hasHfKey:     !!(process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.startsWith('hf_')),
      defaultAiProvider: process.env.DEFAULT_AI_PROVIDER || 'groq',
      pages: getPages()
    }
  });
});

app.post('/api/settings', (req, res) => {
  const { geminiKey, groqKey, hfKey, defaultAiProvider } = req.body;
  if (geminiKey     !== undefined) process.env.GEMINI_API_KEY      = geminiKey;
  if (groqKey       !== undefined) process.env.GROQ_API_KEY         = groqKey;
  if (hfKey         !== undefined) process.env.HUGGINGFACE_API_KEY  = hfKey;
  if (defaultAiProvider !== undefined) process.env.DEFAULT_AI_PROVIDER = defaultAiProvider;

  const envPath = path.join(__dirname, '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const setEnvLine = (key, val) => {
    if (envContent.includes(`${key}=`)) envContent = envContent.replace(new RegExp(`${key}=.*`), `${key}=${val}`);
    else envContent += `\n${key}=${val}`;
  };
  setEnvLine('GEMINI_API_KEY',     process.env.GEMINI_API_KEY || '');
  setEnvLine('GROQ_API_KEY',       process.env.GROQ_API_KEY || '');
  setEnvLine('HUGGINGFACE_API_KEY',process.env.HUGGINGFACE_API_KEY || '');
  setEnvLine('DEFAULT_AI_PROVIDER',process.env.DEFAULT_AI_PROVIDER || 'groq');
  fs.writeFileSync(envPath, envContent);
  res.json({ success: true, message: 'AI settings saved!' });
});

// ═══════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`===================================================`);
  if (!process.env.DASHBOARD_API_KEY) {
    console.log(`⚠️  DASHBOARD_API_KEY not set — /api routes are UNPROTECTED.`);
    console.log(`   Set DASHBOARD_API_KEY in .env before exposing this server beyond localhost.`);
  }
  console.log(`🟢 WB Multi-Page FB Studio running on port ${PORT}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`🎬 Page 1: Movies & Entertainment`);
  console.log(`📈 Page 2: Trading & Stock Market`);
  console.log(`📰 Page 3: General News & Education`);
  console.log(`===================================================`);
  const serverUrl = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${PORT}`;
  startCronScheduler(serverUrl);
});
