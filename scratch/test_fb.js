const axios = require('axios');
require('dotenv').config();

const pageId = process.env.FACEBOOK_PAGE_ID;
const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

async function testPageConnection() {
  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/${pageId}?fields=id,name&access_token=${pageToken}`);
    console.log('--- FACEBOOK PAGE CONNECTED ---');
    console.log(res.data);
  } catch (e) {
    console.error('FB ERROR:', e.response ? e.response.data : e.message);
  }
}

testPageConnection();
