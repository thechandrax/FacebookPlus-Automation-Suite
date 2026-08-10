const axios = require('axios');

const userToken = 'EAASyBqO7yCYBSBcDjCF0ZAQUGrCNZBFYIY5phsHELZCMid5J1NCjiza12HVDm4wZA0QTBitA7OFsZBfHM3wAZAj7fzakDAZA65nzX13rCylHBStqyKtkjIoHrcRdC33IvNF5O5LOlTC1N43j0qDPvPxmDicjht61A2cHeHMBy1ikxMaMFJshYVrUJZCShjDHucc2W6OVGduj8RS7sPh0PxJzpLBW5QefWk2E';

async function checkUserPages() {
  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`);
    console.log('--- USER PAGES LIST ---');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('ERROR:', e.response ? e.response.data : e.message);
  }
}

checkUserPages();
