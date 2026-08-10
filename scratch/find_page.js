const axios = require('axios');

const userToken = 'EAAWppk08R4ABSJ3TfVm4KP8qs1OAcS3ZCwwExsaqZC65fMidrTGd2Q0crhGWqKOOd2c8AWXWbataZB7bJbLwURHuwRmCUbDqe4fB4B2KtC5i5YnrA7YBkeUprbHihphBYZAww3mHQ5AsPD1Mdc7ZBZCxh359KiEMN2K24edD3Y7gAt12RbSRO3lv0nXV65';
const apiVersion = 'v19.0';

async function findPages() {
  console.log('--- SEARCHING PAGES FOR USER TOKEN ---');
  
  // 1. Check me/accounts
  try {
    const acc = await axios.get(`https://graph.facebook.com/${apiVersion}/me/accounts?access_token=${userToken}`);
    console.log('me/accounts:', JSON.stringify(acc.data, null, 2));
  } catch (e) {
    console.log('me/accounts err:', e.response ? e.response.data : e.message);
  }

  // 2. Check me/businesses
  try {
    const biz = await axios.get(`https://graph.facebook.com/${apiVersion}/me/businesses?access_token=${userToken}`);
    console.log('me/businesses:', JSON.stringify(biz.data, null, 2));
  } catch (e) {
    console.log('me/businesses err:', e.response ? e.response.data : e.message);
  }

  // 3. Check me permissions
  try {
    const perm = await axios.get(`https://graph.facebook.com/${apiVersion}/me/permissions?access_token=${userToken}`);
    console.log('me/permissions:', JSON.stringify(perm.data, null, 2));
  } catch (e) {
    console.log('me/permissions err:', e.response ? e.response.data : e.message);
  }
}

findPages();
