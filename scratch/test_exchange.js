const axios = require('axios');

const userToken = 'EAAWppk08R4ABSJ3TfVm4KP8qs1OAcS3ZCwwExsaqZC65fMidrTGd2Q0crhGWqKOOd2c8AWXWbataZB7bJbLwURHuwRmCUbDqe4fB4B2KtC5i5YnrA7YBkeUprbHihphBYZAww3mHQ5AsPD1Mdc7ZBZCxh359KiEMN2K24edD3Y7gAt12RbSRO3lv0nXV65';

async function testExchange() {
  const apiVersion = 'v19.0';
  console.log('Testing exchange...');

  // Try 1: debug_token
  try {
    const debug = await axios.get(`https://graph.facebook.com/${apiVersion}/debug_token?input_token=${userToken}&access_token=${userToken}`);
    console.log('--- DEBUG TOKEN ---', JSON.stringify(debug.data, null, 2));
  } catch (e) {
    console.log('Debug err:', e.response ? e.response.data : e.message);
  }
}

testExchange();
