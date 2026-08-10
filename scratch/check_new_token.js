const axios = require('axios');

const token = 'EAAdK7reGzDoBSLMZAZAZvXM56h6TC8HGloh5NvPY8xFIFWkJLauMTNMmqvrtfhzZEI';

async function checkNewToken() {
  try {
    const meRes = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
    console.log('--- ME ---');
    console.log(meRes.data);
  } catch (e) {
    console.error('ME ERR:', e.response ? e.response.data : e.message);
  }

  try {
    const accRes = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
    console.log('--- ACCOUNTS / PAGES ---');
    console.log(JSON.stringify(accRes.data, null, 2));
  } catch (e) {
    console.error('ACC ERR:', e.response ? e.response.data : e.message);
  }
}

checkNewToken();
