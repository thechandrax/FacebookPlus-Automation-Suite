const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function testAndUpdate(pageToken) {
  const pageId = '61592641155295';
  console.log(`Testing token for Page: West Bengal Special Updates (ID: ${pageId})`);

  try {
    const pageRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}?fields=id,name&access_token=${pageToken}`);
    console.log('FB PAGE VERIFIED:', pageRes.data);

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
    console.log('SUCCESS: .env updated!');
  } catch (err) {
    console.error('VERIFY ERROR:', err.response ? err.response.data : err.message);
  }
}

const inputToken = process.argv[2];
if (inputToken) {
  testAndUpdate(inputToken);
} else {
  console.log('Provide token as arg');
}
