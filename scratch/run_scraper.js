const http = require('http');

const req = http.request('http://localhost:3000/api/scrape-now', { method: 'POST' }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Scrape result:', data);
  });
});

req.on('error', err => console.error(err));
req.end();
