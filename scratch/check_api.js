const http = require('http');

http.get('http://localhost:3000/api/posts', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    console.log('API Posts Count:', parsed.posts ? parsed.posts.length : 0);
  });
});
