const axios = require('axios');

const token = 'EAASyBqO7yCYBSAZCkFnw8Dym0EU3zd5G0Yj5sfrEkNVHVAkYpKM8KuUZBF2yWAc8l2IenlXabZBAcsFRF6EaABAyGs4uJUtt1IgNdZAUplZCXkJI3Yt0485YIDfuvcGEaZBIVoGqGO7fSm8nXtc1SrLeJsit7MvrVJ6FXQPbZBIUfQ1SkXAOzBqfafDwLFdQkDwhgobo0k38gDqiFXDuIn5zGKVDS61UnhU0gQADtgcfOF0AT5XCnGFh0w1AtehXAYP3MD8ZBaQH48VOCQfDsuCKQ1pKRTL6P2yimYUSK7YHZAeC3Yx0cJPqc1JLgZBMDr3j3S1heff8CN';

async function checkPages() {
  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
    console.log('Pages:', res.data);
  } catch (e) {
    console.error('Error:', e.response ? e.response.data : e.message);
  }
}

checkPages();
