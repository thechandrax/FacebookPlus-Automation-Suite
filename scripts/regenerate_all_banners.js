require('dotenv').config();
const { getPosts, updatePost } = require('../backend/storage/posts_store');
const { generatePostBanner } = require('../backend/services/banner_generator');

async function regenerateAllBanners() {
  console.log('===================================================');
  console.log('🔄 Regenerating Photo Banners for ALL existing posts...');
  console.log('===================================================');

  const posts = getPosts();
  console.log(`Found ${posts.length} posts to update.`);

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`[${i + 1}/${posts.length}] Generating photo banner for: "${post.title.substring(0, 50)}..."`);
    
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const bannerUrl = await generatePostBanner(post.title, post.category || 'WEST BENGAL', dateStr, null, post.imageUrl, post.link);

    if (bannerUrl) {
      updatePost(post.id, { bannerUrl });
      console.log(`✓ Updated banner URL: ${bannerUrl}`);
    }
  }

  console.log('\n===================================================');
  console.log('✅ ALL POST BANNERS REGENERATED WITH HIGH-RES PHOTOS!');
  console.log('===================================================');
}

regenerateAllBanners();
