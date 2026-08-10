const { fetchEducationUpdates } = require('../backend/scrapers/wb_education_scraper');

async function runTest() {
  console.log('--- TESTING EDUCATIONAL & GOVT JOB SCRAPER & PDF CONVERTER ---');
  const updates = await fetchEducationUpdates();
  console.log(`Found ${updates.length} educational & job releases.`);
  console.log('Sample updates:', JSON.stringify(updates.slice(0, 3), null, 2));
}

runTest();
