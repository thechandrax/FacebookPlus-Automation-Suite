require('dotenv').config();
const { generatePostBanner } = require('../backend/services/banner_generator');

async function testBanner() {
  console.log('Testing banner generation with real news photo...');
  const testTitle = 'Kolkata Weather Update: Heavy rainfall warning issued by IMD in West Bengal';
  const testCategory = 'WEST BENGAL NEWS';
  const testDate = '3 Aug';
  const articleUrl = 'https://news.google.com/rss/articles/CBMizwFBVV95cUxQdzN6T2hoZU1XTFdHNE5WamdHV3N0cGZpczNzX1hEbGhScWctMGpxeHU4cnNQYUNwY2JUX1Z4TEl6OUJpbWZQaG5pdEJEZ1VNUlM1ZGFpbDUxNHN1bVFrTlR5YU5VM3F6VVBIeDAzRGZOQnBsSExBano4WE12UC1ubFJUQTBHczRnM2ZVR2R2a1ZWWmZGTURqNVlyelJfLXNRR3FycV9TT0kyVFJpWlJ3cGdOWmRQaHZDdkFIZjRnTHBYVmdXZXlwTHd1SDU1aEHSAdQBQVVfeXFMTi1jYWdmSmhTa0paaTJ6am13ZWRiQzRjOEY3a01MWjFXWmhKenZ1anVFYVhiaElMV2J3UTAyRGhXWXFzZ1QxY0IxcmpCLTJ1OXlLWnJvc3VJUnVQRU1KYTFZd3Q2LWE1WEYyWGVIdzFoT01jMGZ3MnpZMmo2eWlYWXJXSTkzdFVNTW41NmhDZzVEQ1lzalNqS1RUdUkwTkxxcFZjQXBaYkZCMHFtblFzUmF3cDVMWXVhbklSLUdobEV5RHltaE5JeUpoUnVaOTRXc1l1dTc?oc=5';

  const bannerUrl = await generatePostBanner(testTitle, testCategory, testDate, 'ai_image', null, articleUrl);
  console.log('Result Banner URL:', bannerUrl);
}

testBanner();
