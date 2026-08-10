const axios = require('axios');

async function debugGoogleNewsHtml() {
  const url = 'https://news.google.com/rss/articles/CBMiqAFBVV95cUxOSUVPdFhIeEIyMVllMzBQMUNUOVRMbVk1SGZ1RUliWDd6a09iTE1Qa1h0bVpiZmptLTFzOHZrZE5rNFZEcTZMdHRwVEwzTjRTcUhHM0NVWjFmM2NoYmdXRk1rdGJjVk8ybGFEbkVWRVJ3dmFISkFKMjhkWjdhc3FfS3ZDemRINnNSb0Jxa1I3YmhEVmQxbVB2UWRJbWdZYUk3Sm56Mkx4YjY?oc=5';

  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)'
      }
    });

    console.log('Status:', res.status);
    console.log('HTML snippet:', res.data.substring(0, 800));

    // Regex search for http links in body
    const matches = res.data.match(/https?:\/\/[^"'\s<>]+/g);
    if (matches) {
      console.log('Total URLs found:', matches.length);
      const filtered = matches.filter(u => !u.includes('google.com') && !u.includes('gstatic.com') && !u.includes('schema.org') && !u.includes('w3.org'));
      console.log('Real News Target URLs:', [...new Set(filtered)]);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

debugGoogleNewsHtml();
