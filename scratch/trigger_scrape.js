const { collectAllWBNews } = require('../backend/scrapers/aggregator');
const { savePosts, getPosts } = require('../backend/storage/posts_store');
const { generateFacebookCaption } = require('../backend/services/ai_generator');
const { generatePostBanner } = require('../backend/services/banner_generator');

async function triggerEducationalScrape() {
  console.log('--- SCRAPING FRESH EDUCATIONAL & GOVT JOB POSTS ---');
  const newItems = await collectAllWBNews();
  console.log(`Collected ${newItems.length} new items.`);

  const existing = getPosts();
  const fullList = [...existing];

  for (const item of newItems) {
    const id = `post_${Date.now()}_${Math.random().toString(36).substr(2,5)}`;
    
    // Generate AI Caption
    let caption = item.snippet || item.title;
    try {
      caption = await generateFacebookCaption(item.title, item.snippet, item.sourceName, item.category);
    } catch (e) {}

    // Generate Banner
    let banner = item.bannerUrl;
    if (!banner) {
      try {
        banner = await generatePostBanner(item.title, item.category, null, null, item.imageUrl, item.link);
      } catch (e) {}
    }

    const postObj = {
      id,
      scrapedAt: new Date().toISOString(),
      status: 'pending',
      publishedAt: null,
      facebookPostId: null,
      title: item.title,
      link: item.link,
      pdfUrl: item.pdfUrl || null,
      sourceName: item.sourceName,
      category: item.category,
      snippet: item.snippet,
      imageUrl: item.imageUrl || null,
      generatedCaption: caption,
      bannerUrl: banner,
      photos: banner ? [banner] : [],
      updatedAt: new Date().toISOString()
    };

    fullList.unshift(postObj);
  }

  savePosts(fullList);
  console.log(`--- SUCCESS: Saved ${fullList.length} total posts to posts.json! ---`);
}

triggerEducationalScrape();
