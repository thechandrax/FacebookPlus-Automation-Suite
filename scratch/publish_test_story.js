require('dotenv').config();
const { getPosts, updatePost } = require('../backend/storage/posts_store');
const { publishToFacebook } = require('../backend/publisher/fb_publisher');

async function testPublishRealStory() {
  const posts = getPosts();
  if (!posts || posts.length === 0) {
    console.error('No posts found');
    return;
  }

  const targetPost = posts[0];
  console.log(`Publishing Post: "${targetPost.title}"`);
  console.log(`Source: ${targetPost.sourceName}`);
  console.log(`Caption preview:\n${targetPost.generatedCaption}`);

  const res = await publishToFacebook(targetPost, { baseUrl: 'http://localhost:3000' });
  console.log('--- PUBLISH RESULT ---');
  console.log(res);

  if (res.success) {
    updatePost(targetPost.id, {
      status: 'published',
      facebookPostId: res.facebookPostId,
      publishedAt: res.publishedAt
    });
    console.log('Post status updated to published!');
  }
}

testPublishRealStory();
