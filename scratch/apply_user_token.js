const axios = require('axios');
const fs = require('fs');
const path = require('path');

const token = 'EAAWppk08R4ABSJ3TfVm4KP8qs1OAcS3ZCwwExsaqZC65fMidrTGd2Q0crhGWqKOOd2c8AWXWbataZB7bJbLwURHuwRmCUbDqe4fB4B2KtC5i5YnrA7YBkeUprbHihphBYZAww3mHQ5AsPD1Mdc7ZBZCxh359KiEMN2K24edD3Y7gAt12RbSRO3lv0nXV65';

async function configureFacebookToken() {
  console.log('Testing provided token with Meta Graph API...');
  const apiVersion = 'v19.0';

  try {
    // 1. Get Me / User Info
    const meRes = await axios.get(`https://graph.facebook.com/${apiVersion}/me?fields=id,name&access_token=${token}`);
    console.log('User Account:', meRes.data);

    // 2. Get User Accounts / Pages
    const accRes = await axios.get(`https://graph.facebook.com/${apiVersion}/me/accounts?access_token=${token}`);
    console.log('Accounts Response:', JSON.stringify(accRes.data, null, 2));

    let targetPageId = '';
    let targetPageToken = token;
    let targetPageName = '';

    if (accRes.data && accRes.data.data && accRes.data.data.length > 0) {
      const page = accRes.data.data[0];
      targetPageId = page.id;
      targetPageToken = page.access_token || token;
      targetPageName = page.name;
      console.log(`FOUND PAGE: "${targetPageName}" (ID: ${targetPageId})`);
    } else {
      // Check if token itself is a Page Token
      try {
        const pageRes = await axios.get(`https://graph.facebook.com/${apiVersion}/me?fields=id,name&access_token=${token}`);
        if (pageRes.data && pageRes.data.id) {
          targetPageId = pageRes.data.id;
          targetPageName = pageRes.data.name;
          console.log(`TOKEN IS DIRECT PAGE OR USER TOKEN FOR: "${targetPageName}" (ID: ${targetPageId})`);
        }
      } catch (pe) {
        console.error('Page check err:', pe.message);
      }
    }

    if (!targetPageId) {
      targetPageId = meRes.data.id;
      targetPageName = meRes.data.name;
      console.log(`Using Account ID: ${targetPageId}`);
    }

    // 3. Update .env file
    const envPath = path.join(__dirname, '../.env');
    let envLines = [];
    if (fs.existsSync(envPath)) {
      const existing = fs.readFileSync(envPath, 'utf8');
      envLines = existing.split('\n');
    }

    function setEnvVar(key, val) {
      const idx = envLines.findIndex(l => l.startsWith(`${key}=`));
      if (idx !== -1) {
        envLines[idx] = `${key}=${val}`;
      } else {
        envLines.push(`${key}=${val}`);
      }
    }

    setEnvVar('PORT', '3000');
    setEnvVar('FACEBOOK_PAGE_ID', targetPageId);
    setEnvVar('FACEBOOK_PAGE_ACCESS_TOKEN', targetPageToken);
    setEnvVar('FACEBOOK_API_VERSION', 'v19.0');
    setEnvVar('AUTO_POST_ENABLED', 'true');
    setEnvVar('DEFAULT_AI_PROVIDER', 'groq');

    fs.writeFileSync(envPath, envLines.filter(Boolean).join('\n') + '\n');
    console.log('Successfully updated .env file!');

    console.log('RESULT_SUCCESS:', { pageId: targetPageId, pageName: targetPageName });
  } catch (err) {
    const errData = err.response ? err.response.data : err.message;
    console.error('CONFIGURE ERROR:', errData);
  }
}

configureFacebookToken();
