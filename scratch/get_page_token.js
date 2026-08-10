const axios = require('axios');

const userToken = 'EAAWppk08R4ABSJ3TfVm4KP8qs1OAcS3ZCwwExsaqZC65fMidrTGd2Q0crhGWqKOOd2c8AWXWbataZB7bJbLwURHuwRmCUbDqe4fB4B2KtC5i5YnrA7YBkeUprbHihphBYZAww3mHQ5AsPD1Mdc7ZBZCxh359KiEMN2K24edD3Y7gAt12RbSRO3lv0nXV65';

async function fetchPageToken(pageIdOrUsername) {
  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/${pageIdOrUsername}?fields=id,name,access_token&access_token=${userToken}`);
    console.log('--- PAGE TOKEN FETCH SUCCESS ---');
    console.log(res.data);
  } catch (err) {
    console.error('FETCH PAGE TOKEN ERR:', err.response ? err.response.data : err.message);
  }
}

// Test with provided username or ID if user gives it
const pageArg = process.argv[2] || 'me';
fetchPageToken(pageArg);
