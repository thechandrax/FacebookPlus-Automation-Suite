require('dotenv').config();
const { collectAllWBNews } = require('../backend/scrapers/aggregator');

async function testLiveScraper() {
  console.log('===================================================');
  console.log('🔍 LIVE WEST BENGAL NEWS & DATA SCRAPER TEST');
  console.log('===================================================');
  console.log('Fetching live updates from West Bengal sources...\n');

  const startTime = Date.now();
  const scrapedItems = await collectAllWBNews();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n===================================================`);
  console.log(`✅ SCRAPING COMPLETE (${duration} seconds)`);
  console.log(`📊 Total Fresh Items Scraped: ${scrapedItems.length}`);
  console.log(`===================================================\n`);

  scrapedItems.forEach((item, index) => {
    console.log(`--- [ITEM #${index + 1}] ---`);
    console.log(`📌 Title:       ${item.title}`);
    console.log(`📍 Source:      ${item.sourceName} (${item.category})`);
    console.log(`🗓️ Published:   ${item.pubDate}`);
    console.log(`🔗 Article Link: ${item.link}`);
    console.log(`📝 Snippet:     ${item.snippet}`);
    console.log(`🖼️ Image URL:   ${item.imageUrl || 'None (Will generate visual graphic banner)'}`);
    console.log(`---------------------------------------------------\n`);
  });
}

testLiveScraper();
