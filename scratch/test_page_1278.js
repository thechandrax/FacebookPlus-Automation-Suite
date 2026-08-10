const axios = require('axios');
const fs = require('fs');
const path = require('path');

const userToken = 'EAAWppk08R4ABSJ3TfVm4KP8qs1OAcS3ZCwwExsaqZC65fMidrTGd2Q0crhGWqKOOd2c8AWXWbataZB7bJbLwURHuwRmCUbDqe4fB4B2KtC5i5YnrA7YBkeUprbHihphBYZAww3mHQ5AsPD1Mdc7ZBZCxh359KiEMN2K24edD3Y7gAt12RbSRO3lv0nXV65';
const pageId = '1278417762019367';

async function testPage() {
  console.log(`Querying Page ID: ${pageId}...`);
  try {
    const pageRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}?fields=id,name,access_token&access_token=${userToken}`);
    console.log('--- PAGE FOUND ---');
    console.log('Page Name:', pageRes.data.name);
    console.log('Page ID:', pageRes.data.id);
    const pageToken = pageRes.data.access_token || userToken;

    // Save to .env
    const envPath = path.join(__dirname, '../.env');
    let envLines = [];
    if (fs.existsSync(envPath)) {
      envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    }

    function setEnvVar(key, val) {
      const idx = envLines.findIndex(l => l.startsWith(`${key}=`));
      if (idx !== -1) envLines[idx] = `${key}=${val}`;
      else envLines.push(`${key}=${val}`);
    }

    setEnvVar('PORT', '3000');
    setEnvVar('FACEBOOK_PAGE_ID', pageId);
    setEnvVar('FACEBOOK_PAGE_ACCESS_TOKEN', pageToken);
    setEnvVar('FACEBOOK_API_VERSION', 'v19.0');
    setEnvVar('AUTO_POST_ENABLED', 'true');
    setEnvVar('DEFAULT_AI_PROVIDER', 'groq');

    fs.writeFileSync(envPath, envLines.filter(Boolean).join('\n') + '\n');
    console.log('--- SUCCESS: .env FILE UPDATED ---');

    // Test Feed Publish!
    console.log('Testing live post publication to Facebook Page...');
    const postRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      message: '📢 West Bengal Updates Automation System Connected Live! 🚀',
      access_token: pageToken
    });
    console.log('--- LIVE FB POST PUBLISHED SUCCESS! ---', postRes.data);

  } catch (err) {
    console.error('PAGE TEST ERR:', err.response ? err.response.data : err.message);
  }
}

testPage();
