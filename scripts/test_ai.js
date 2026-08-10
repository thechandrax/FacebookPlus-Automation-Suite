require('dotenv').config();
const { generateFacebookCaption } = require('../backend/services/ai_generator');

async function testAI() {
  console.log('===================================================');
  console.log('🤖 TESTING AI CAPTION GENERATOR');
  console.log('===================================================');

  const testNewsItem = {
    title: 'Kolkata Weather Update: IMD issues heavy rainfall alert in West Bengal',
    category: 'Weather & Festivals',
    sourceName: 'ABP Ananda',
    snippet: 'The Meteorological Department has issued a heavy rainfall warning across Kolkata and coastal West Bengal districts for the next 48 hours.',
    link: 'https://bengali.abplive.com'
  };

  console.log('\n--- Testing News Style ---');
  const newsCaption = await generateFacebookCaption(testNewsItem, 'bengali_english_mixed', 'groq', null, 'news');
  console.log('Generated Caption:\n', newsCaption);

  console.log('\n--- Testing Entertainment Style ---');
  const entNewsItem = {
    title: 'Shah Rukh Khan and Salman Khan to begin shooting for Tiger vs Pathaan in 2026',
    category: 'Movies & Entertainment',
    sourceName: 'Bollywood Hungama',
    snippet: 'The spy universe epic crossover project is set to kick off massive action sequences in Mumbai.',
    link: 'https://www.bollywoodhungama.com'
  };
  const entCaption = await generateFacebookCaption(entNewsItem, 'bengali_english_mixed', 'groq', null, 'entertainment');
  console.log('Generated Caption:\n', entCaption);
}

testAI();
