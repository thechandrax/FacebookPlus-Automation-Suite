require('dotenv').config();
const { runAutomationCycle } = require('../backend/publisher/scheduler');
const { getPosts } = require('../backend/storage/posts_store');

async function testSystem() {
  console.log('===================================================');
  console.log('🧪 Starting West Bengal Facebook Automation Test Run');
  console.log('===================================================');

  const result = await runAutomationCycle({ baseUrl: 'http://localhost:3000' });
  console.log('Automation Result:', result);

  const posts = getPosts();
  console.log(`\n📋 Current Posts in System (${posts.length} total):`);
  posts.slice(0, 3).forEach((p, i) => {
    console.log(`\n--- Post #${i + 1} [${p.status}] ---`);
    console.log(`Title: ${p.title}`);
    console.log(`Source: ${p.sourceName} (${p.category})`);
    console.log(`Banner: ${p.bannerUrl}`);
    console.log(`Caption:\n${p.generatedCaption}`);
  });
}

testSystem();
