const axios = require('axios');

const token = 'EAAWppk08R4ABSJ3TfVm4KP8qs1OAcS3ZCwwExsaqZC65fMidrTGd2Q0crhGWqKOOd2c8AWXWbataZB7bJbLwURHuwRmCUbDqe4fB4B2KtC5i5YnrA7YBkeUprbHihphBYZAww3mHQ5AsPD1Mdc7ZBZCxh359KiEMN2K24edD3Y7gAt12RbSRO3lv0nXV65';
const pageId = '1599086631841945';

async function testPublish() {
  console.log('Testing Graph API Feed Publish...');
  try {
    const res = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      message: '📢 West Bengal News Automation Test Post',
      access_token: token
    });
    console.log('--- PUBLISH SUCCESS ---', res.data);
  } catch (err) {
    console.error('--- PUBLISH ERROR ---', err.response ? err.response.data : err.message);
  }
}

testPublish();
