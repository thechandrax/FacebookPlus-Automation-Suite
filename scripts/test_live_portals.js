const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const PORTALS = [
  { name: 'Bikash Bhavan (Higher Edu)', url: 'https://wbhed.gov.in/' },
  { name: 'CM Office Nabanna (Egiye Bangla)', url: 'https://egiyebangla.gov.in/' },
  { name: 'WBSSC (School Service Commission)', url: 'http://www.westbengalssc.com/' },
  { name: 'WBPSC (Public Service Commission)', url: 'https://psc.wb.gov.in/' },
  { name: 'WBBPE (Primary Education Board)', url: 'https://wbbpe.org/' },
  { name: 'WBBSE (Madhyamik Board)', url: 'https://wbbse.wb.gov.in/' },
  { name: 'WBCHSE (Higher Secondary Council)', url: 'https://wbchse.wb.gov.in/' },
  { name: 'WBJEEB (Joint Entrance Board)', url: 'https://wbjeeb.nic.in/' }
];

async function checkPortals() {
  console.log('=====================================================');
  console.log('🔍 CHECKING LIVE WEST BENGAL PORTALS CONNECTIVITY');
  console.log('=====================================================\n');

  for (const portal of PORTALS) {
    const startTime = Date.now();
    try {
      const res = await axios.get(portal.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        httpsAgent,
        timeout: 12000
      });

      const duration = Date.now() - startTime;
      const $ = cheerio.load(res.data);
      const linksCount = $('a[href*=".pdf"], a[href*="notice"], a[href*="advertisement"]').length;

      console.log(`✅ [ONLINE] ${portal.name}`);
      console.log(`   URL: ${portal.url}`);
      console.log(`   Status: ${res.status} OK | Response Time: ${duration}ms | PDF/Notice Links Found: ${linksCount}\n`);

    } catch (err) {
      const duration = Date.now() - startTime;
      console.log(`❌ [ERR / OFFLINE] ${portal.name}`);
      console.log(`   URL: ${portal.url}`);
      console.log(`   Error: ${err.message} (${duration}ms)\n`);
    }
  }

  console.log('=====================================================');
  console.log('FINISHED PORTAL STATUS CHECK');
  console.log('=====================================================');
}

checkPortals();
