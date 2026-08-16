const cron = require('node-cron');
const { collectNewsForPage } = require('../scrapers/aggregator');
const { generateFacebookCaption } = require('../services/ai_generator');
const { generatePostBanner } = require('../services/banner_generator');
const { publishToFacebook } = require('./fb_publisher');
const { addPost, updatePost, getPages, pruneOldData } = require('../storage/posts_store');

let isRunning = {};   // { page1: false, page2: false, page3: false }
let cronTasks = [];

/**
 * Run automation cycle for a single page
 */
async function runAutomationCycle(options = {}) {
  const pageId = options.pageId || 'page3';
  if (isRunning[pageId]) {
    console.log(`[Scheduler] Cycle for ${pageId} already running — skipping.`);
    return { status: 'busy', pageId };
  }

  const clr = {
    reset: "\x1b[0m", bold: "\x1b[1m", cyan: "\x1b[36m", green: "\x1b[32m",
    yellow: "\x1b[33m", magenta: "\x1b[35m", blue: "\x1b[34m", white: "\x1b[37m", gray: "\x1b[90m"
  };

  isRunning[pageId] = true;
  console.log(`${clr.cyan}${clr.bold}════════════════════════════════════════════════════════════════════${clr.reset}`);
  console.log(`${clr.magenta}${clr.bold}[Scheduler] Starting automation cycle for page: ${pageId}${clr.reset}`);

  try {
    const pages = getPages();
    const page = pages.find(p => p.id === pageId) || {};
    const aiStyle   = page.aiStyle   || 'news';
    const language  = page.language  || 'bengali_english_mixed';
    const autoPost  = options.forceAutoPost !== undefined ? options.forceAutoPost : (page.autoPost === true);

    // 1. Scrape news for this page
    const newItems = await collectNewsForPage(pageId);
    const itemsToProcess = newItems.slice(0, 3);
    const createdPosts = [];

    for (const item of itemsToProcess) {
      console.log(`${clr.gray}────────────────────────────────────────────────────────────────────${clr.reset}`);
      console.log(`${clr.yellow}${clr.bold}[Scraped Content]${clr.reset} ${clr.cyan}${clr.bold}"${item.title}"${clr.reset}`);
      console.log(`${clr.gray}  Source : ${clr.white}${item.sourceName || 'RSS Feed'}${clr.reset} | Category : ${clr.magenta}${item.category || 'General'}${clr.reset}`);

      // 2. Generate AI caption in the correct style for this page
      const caption = await generateFacebookCaption(item, language, null, null, aiStyle);

      // 3. Generate banner image
      const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const bannerUrl = await generatePostBanner(
        item.title,
        item.category || page.name || 'NEWS',
        dateStr, null, item.imageUrl, item.link
      );

      // 4. Save post with pageId
      const post = addPost({
        pageId,
        title: item.title,
        link: item.link,
        sourceName: item.sourceName,
        category: item.category,
        snippet: item.snippet,
        imageUrl: item.imageUrl,
        generatedCaption: caption,
        bannerUrl,
        status: autoPost ? 'approved' : 'pending'
      });

      // 5. Auto-publish if enabled for this page
      if (autoPost) {
        console.log(`${clr.blue}[Scheduler][${pageId}] Auto-publishing post ${post.id}...${clr.reset}`);
        const pubResult = await publishToFacebook(post, { baseUrl: options.baseUrl || 'http://localhost:3000' });
        if (pubResult.success) {
          updatePost(post.id, {
            status: 'published',
            publishedAt: pubResult.publishedAt,
            facebookPostId: pubResult.facebookPostId,
            simulation: pubResult.simulation || false
          });
        } else {
          updatePost(post.id, { status: 'failed', error: pubResult.error });
        }
      }
      createdPosts.push(post);
      console.log(`${clr.green}${clr.bold}✔ Saved Scraped Post #${post.id}${clr.reset}`);
      console.log(`${clr.gray}────────────────────────────────────────────────────────────────────${clr.reset}`);
    }

    console.log(`${clr.green}${clr.bold}[Scheduler][${pageId}] Cycle complete — ${createdPosts.length} posts created.${clr.reset}`);
    console.log(`${clr.cyan}${clr.bold}════════════════════════════════════════════════════════════════════${clr.reset}`);
    isRunning[pageId] = false;
    return { status: 'success', pageId, count: createdPosts.length, posts: createdPosts };
  } catch (err) {
    console.error(`[Scheduler Error][${pageId}]`, err.message);
    isRunning[pageId] = false;
    return { status: 'error', pageId, error: err.message };
  }
}

let intervalTimer = null;

/**
 * Start cron jobs for ALL active pages using each page's own schedule (defaulting to 5 minutes)
 */
function startCronScheduler(baseUrl = 'http://localhost:3000') {
  stopCronScheduler();
  // Perform 7-day rolling data & file cleanup on startup
  pruneOldData(7);
  const pages = getPages();

  pages.forEach(page => {
    if (!page.active) return;
    const times = page.cronSchedule ? page.cronSchedule.split(',') : ['*/5 * * * *'];
    times.forEach(expr => {
      const trimmed = expr.trim();
      if (cron.validate(trimmed)) {
        console.log(`\x1b[33m[Scheduler]\x1b[0m Registered cron "\x1b[36m${trimmed}\x1b[0m" for page: ${page.emoji} \x1b[1m${page.name}\x1b[0m`);
        const task = cron.schedule(trimmed, () => {
          console.log(`\x1b[32m[Cron Triggered 5m]\x1b[0m ${page.emoji} \x1b[1m${page.name}\x1b[0m — ${trimmed}`);
          runAutomationCycle({ pageId: page.id, baseUrl });
        });
        cronTasks.push(task);
      }
    });
  });

  // Dedicated 5-minute auto-scraper fallback timer (5 mins = 300,000 ms)
  intervalTimer = setInterval(() => {
    pruneOldData(7);
    const activePages = getPages().filter(p => p.active !== false);
    activePages.forEach(page => {
      console.log(`\x1b[36m[Auto-Scrape 5m Timer]\x1b[0m Scraping fresh articles for page: ${page.emoji} \x1b[1m${page.name}\x1b[0m...`);
      runAutomationCycle({ pageId: page.id, baseUrl });
    });
  }, 5 * 60 * 1000);
}

function stopCronScheduler() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  cronTasks.forEach(t => t.stop());
  cronTasks = [];
}

module.exports = { runAutomationCycle, startCronScheduler, stopCronScheduler };
