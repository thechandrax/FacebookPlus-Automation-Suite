const { getPosts, savePosts } = require('../backend/storage/posts_store');
const { categorizeNewsItem } = require('../backend/scrapers/aggregator');

function recategorizeAll() {
  const posts = getPosts();
  let count = 0;

  for (const post of posts) {
    const newCat = categorizeNewsItem(post.title, post.snippet, post.sourceName);
    if (post.category !== newCat) {
      console.log(`Recategorized "${post.title.substring(0, 40)}...": "${post.category}" -> "${newCat}"`);
      post.category = newCat;
      count++;
    }
  }

  savePosts(posts);
  console.log(`--- SUCCESS: Recategorized ${count} posts! Total posts in database: ${posts.length} ---`);
}

recategorizeAll();
