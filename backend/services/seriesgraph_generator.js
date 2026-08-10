const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const BANNERS_DIR = path.join(__dirname, '../../public/generated_banners');

function ensureBannersDir() {
  if (!fs.existsSync(BANNERS_DIR)) {
    fs.mkdirSync(BANNERS_DIR, { recursive: true });
  }
}

/**
 * Returns rating color code matching SeriesGraph standard palette
 */
function getRatingColor(rating) {
  const r = parseFloat(rating);
  if (isNaN(r)) return '#94a3b8'; // Grey fallback
  if (r >= 8.5) return '#05603a'; // Awesome (Dark Green)
  if (r >= 8.0) return '#10b981'; // Great (Green)
  if (r >= 7.0) return '#eab308'; // Good (Yellow / Gold)
  if (r >= 6.0) return '#f97316'; // Average (Orange)
  if (r >= 4.0) return '#ef4444'; // Bad (Red)
  return '#8b5cf6';             // Garbage (Purple)
}

/**
 * Generates SVG SeriesGraph Rating Chart SVG/PNG image
 */
async function generateSeriesGraphChart(options = {}) {
  ensureBannersDir();

  const title      = options.title || 'House of the Dragon';
  const rating     = options.rating || '8.3';
  const votes      = options.votes || '556,461';
  const years      = options.years || '2022 - present';
  const posterUrl  = options.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop';
  
  // Default seasons data if not provided (S1, S2, S3 rating matrix)
  const seasons = options.seasons || [
    [8.7, 8.3, 8.7, 8.4, 8.8, 8.0, 9.1, 9.3, 8.7, 9.3],
    [8.2, 8.2, 7.6, 9.4, 7.3, 6.3, 8.8, 6.5],
    [9.2, 9.3, 8.2, 7.5, 7.7, 7.6, 8.3, 9.2]
  ];

  const maxEpisodes = Math.max(...seasons.map(s => s.length), 8);
  const numSeasons = seasons.length;

  const width = 1080;
  const height = 1100;

  // Build SVG string
  let svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #ffffff; font-family: 'Outfit', 'Plus Jakarta Sans', Arial, sans-serif;">
  <style>
    .title { font-size: 34px; font-weight: 800; fill: #0f172a; }
    .subtitle { font-size: 18px; font-weight: 600; fill: #64748b; }
    .rating-text { font-size: 24px; font-weight: 800; fill: #0f172a; }
    .legend-label { font-size: 15px; font-weight: 700; fill: #334155; }
    .season-hdr { font-size: 22px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
    .ep-label { font-size: 18px; font-weight: 700; fill: #64748b; text-anchor: end; }
    .pill-val { font-size: 22px; font-weight: 800; fill: #ffffff; text-anchor: middle; dom-dominant-baseline: central; }
    .brand-logo { font-size: 30px; font-weight: 900; fill: #7c3aed; letter-spacing: 1px; }
  </style>

  <!-- BACKGROUND CARD -->
  <rect width="${width}" height="${height}" fill="#ffffff" />

  <!-- LEFT PANEL: SHOW POSTER & DETAILS -->
  <g transform="translate(45, 45)">
    <!-- Show Poster Image Container -->
    <rect x="0" y="0" width="310" height="460" rx="16" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
    <image href="${posterUrl}" x="0" y="0" width="310" height="460" preserveAspectRatio="xMidYMid slice" clip-path="url(#posterClip)" />
    <clipPath id="posterClip">
      <rect x="0" y="0" width="310" height="460" rx="16" />
    </clipPath>

    <!-- Rating & Votes -->
    <text x="0" y="515" class="rating-text">
      <tspan fill="#f59e0b">★ ${rating}</tspan> 
      <tspan font-size="17" font-weight="600" fill="#64748b">(${votes})</tspan>
    </text>

    <!-- Show Title -->
    <text x="0" y="560" class="title">${escapeXml(title)}</text>
    <text x="0" y="595" class="subtitle">${years}</text>

    <!-- SeriesGraph Branding -->
    <g transform="translate(0, 680)">
      <text x="0" y="0" class="brand-logo">SERIES<tspan fill="#ec4899">GRAPH</tspan></text>
      <text x="0" y="32" font-size="14" font-weight="700" fill="#64748b">For more charts visit:</text>
      <text x="0" y="54" font-size="16" font-weight="800" fill="#0f172a">seriesgraph.com</text>
    </g>
  </g>

  <!-- RIGHT PANEL: COLOR LEGEND & RATING MATRIX GRID -->
  <g transform="translate(410, 45)">
    
    <!-- LEGEND ROW -->
    <g transform="translate(0, 0)">
      <circle cx="10" cy="10" r="8" fill="#05603a" />
      <text x="24" y="15" class="legend-label">Awesome</text>

      <circle cx="120" cy="10" r="8" fill="#10b981" />
      <text x="134" y="15" class="legend-label">Great</text>

      <circle cx="205" cy="10" r="8" fill="#eab308" />
      <text x="219" y="15" class="legend-label">Good</text>

      <circle cx="285" cy="10" r="8" fill="#f97316" />
      <text x="299" y="15" class="legend-label">Average</text>

      <circle cx="385" cy="10" r="8" fill="#ef4444" />
      <text x="399" y="15" class="legend-label">Bad</text>

      <circle cx="455" cy="10" r="8" fill="#8b5cf6" />
      <text x="469" y="15" class="legend-label">Garbage</text>
    </g>

    <!-- SEASON HEADERS (S1, S2, S3...) -->
    <g transform="translate(70, 60)">
`;

  // Render Season Header Titles
  for (let s = 0; s < numSeasons; s++) {
    const colX = s * 115 + 50;
    svg += `<text x="${colX}" y="0" class="season-hdr">S${s + 1}</text>\n`;
  }
  svg += `</g>\n`;

  // RENDER EPISODE ROWS & PILLS
  const gridStartY = 110;
  const rowHeight = 62;
  const colWidth  = 115;

  for (let ep = 0; ep < maxEpisodes; ep++) {
    const y = gridStartY + ep * rowHeight;
    // Episode Label (E1, E2...)
    svg += `<text x="50" y="${y + 36}" class="ep-label">E${ep + 1}</text>\n`;

    // Season Pill Badges
    for (let s = 0; s < numSeasons; s++) {
      const epVal = seasons[s][ep];
      const colX = 70 + s * colWidth;

      if (epVal !== undefined && epVal !== null) {
        const fillColor = getRatingColor(epVal);
        svg += `
        <rect x="${colX}" y="${y}" width="100" height="52" rx="14" fill="${fillColor}" />
        <text x="${colX + 50}" y="${y + 34}" class="pill-val">${parseFloat(epVal).toFixed(1)}</text>
        `;
      }
    }
  }

  // RENDER SEASON AVERAGE ROW AT BOTTOM
  const avgY = gridStartY + maxEpisodes * rowHeight + 20;
  svg += `
    <line x1="50" y1="${avgY - 10}" x2="${70 + numSeasons * colWidth}" y2="${avgY - 10}" stroke="#e2e8f0" stroke-width="2" />
    <text x="50" y="${avgY + 28}" class="ep-label" style="fill:#0f172a;font-weight:900">AVG.</text>
  `;

  for (let s = 0; s < numSeasons; s++) {
    const validEps = seasons[s].filter(v => typeof v === 'number' && !isNaN(v));
    const avg = validEps.length ? (validEps.reduce((a,b)=>a+b,0) / validEps.length).toFixed(1) : '-';
    const colX = 70 + s * colWidth;
    const avgColor = getRatingColor(avg);

    svg += `
      <text x="${colX + 50}" y="${avgY + 28}" font-size="24" font-weight="900" fill="#0f172a" text-anchor="middle">${avg}</text>
      <line x1="${colX + 10}" y1="${avgY + 38}" x2="${colX + 90}" y2="${avgY + 38}" stroke="${avgColor}" stroke-width="5" stroke-linecap="round" />
    `;
  }

  svg += `
  </g>
</svg>
`;

  // Write SVG file
  const fileName = `seriesgraph_${Date.now()}_${Math.random().toString(36).substring(2,7)}.svg`;
  const filePath = path.join(BANNERS_DIR, fileName);
  fs.writeFileSync(filePath, svg, 'utf8');

  return `/generated_banners/${fileName}`;
}

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  generateSeriesGraphChart,
  getRatingColor
};
