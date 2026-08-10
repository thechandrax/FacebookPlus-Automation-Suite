const { getPosts, savePosts } = require('../backend/storage/posts_store');
const { categorizeNewsItem } = require('../backend/scrapers/aggregator');

const posts = getPosts();
let updatedCount = 0;

for (const post of posts) {
  const newCat = categorizeNewsItem(post.title, post.snippet || post.generatedCaption || '', post.category);
  if (post.category !== newCat) {
    post.category = newCat;
    updatedCount++;
  }
}

savePosts(posts);
console.log(`✓ Re-categorized ${updatedCount} / ${posts.length} posts into Politics, Social Schemes, Education, Police/Law, Weather.`);
