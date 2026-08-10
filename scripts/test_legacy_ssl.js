const axios = require('axios');
const https = require('https');
const crypto = require('crypto');

// Allow legacy SSL renegotiation for WB State Govt Servers
const legacyHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  ciphers: 'ALL'
});

const PORTALS = [
  { name: 'WBBSE (Madhyamik Board)', url: 'https://wbbse.wb.gov.in/' },
  { name: 'WBCHSE (Higher Secondary Council)', url: 'https://wbchse.wb.gov.in/' },
  { name: 'WBBPE (Primary Board)', url: 'https://wbbpe.wb.gov.in/' },
  { name: 'WBSSC (School Service Commission)', url: 'https://wbssc.gov.in/' },
  { name: 'WBPSC (Public Service Commission)', url: 'https://psc.wb.gov.in/' },
  { name: 'Bikash Bhavan (Higher Edu)', url: 'https://wbhed.gov.in/' }
];

async function testLegacySsl() {
  console.log('--- TESTING WB GOVT PORTALS WITH LEGACY SSL AGENT ---');
  for (const portal of PORTALS) {
    try {
      const res = await axios.get(portal.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        httpsAgent: legacyHttpsAgent,
        timeout: 10000
      });
      console.log(`✅ [SUCCESS] ${portal.name} - Code ${res.status}`);
    } catch (e) {
      console.log(`❌ [ERR] ${portal.name} - ${e.message}`);
    }
  }
}

testLegacySsl();
