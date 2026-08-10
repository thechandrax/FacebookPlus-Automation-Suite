// ═══════════════════════════════════════════════════════
//  GLOBAL STATE
// ═══════════════════════════════════════════════════════
let currentPageId    = 'page1'; // Focus on Movies & Entertainment by default
let allPages         = [];
let allPosts         = [];
let allSources       = [];
let currentFilter    = 'all';
let currentSrcFilter = 'all';
let postSearchQuery  = '';
let enhPhotos        = [];

// ═══════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const savedPage = localStorage.getItem('activePageId');
  if (savedPage) currentPageId = savedPage;

  const savedTheme = localStorage.getItem('studioTheme') || 'pearl';
  switchTheme(savedTheme, false);

  init();
});

function switchTheme(themeName, notify = true) {
  if (themeName === 'default') themeName = 'aurora';
  document.body.dataset.theme = themeName;
  localStorage.setItem('studioTheme', themeName);
  const selector = document.getElementById('themeSelector');
  if (selector) selector.value = themeName;
  if (notify) showToast(`🎨 Theme switched to ${themeName.toUpperCase()}`);
}

async function init() {
  await loadPages();
  applyPageTheme(currentPageId);
  await Promise.all([loadPosts(), loadSources()]);
  loadGlobalSettings();
  updateTabCounts();
}

// ═══════════════════════════════════════════════════════
//  PAGE SWITCHING & THEMES
// ═══════════════════════════════════════════════════════
async function switchPage(pageId) {
  currentPageId = pageId;
  localStorage.setItem('activePageId', pageId);
  currentFilter = 'all';
  postSearchQuery = '';
  const searchInput = document.getElementById('postSearchInput');
  if (searchInput) searchInput.value = '';

  applyPageTheme(pageId);
  await Promise.all([loadPosts(), loadSources()]);
  updateSidebarInfo();
}

function applyPageTheme(pageId) {
  document.body.className = `page-${pageId}`;

  // Update tab active states
  ['page1','page2','page3'].forEach(pid => {
    const tab = document.getElementById(`tab-${pid}`);
    if (!tab) return;
    tab.classList.remove('active');
    if (pid === pageId) tab.classList.add('active');
  });

  const page = allPages.find(p => p.id === pageId) || {};
  const emoji = page.emoji || '📰';
  const name  = page.name  || 'News Page';

  // Update page header
  document.getElementById('postsPageTitle').textContent = `${name} Feed`;
  document.getElementById('postsPageDesc').textContent  = page.description || 'Autonomous content curation & post automation engine.';
  const badge = document.getElementById('postsPageBadge');
  if (badge) {
    badge.textContent = `${emoji} ${name.toUpperCase()}`;
  }

  const btnScrape = document.getElementById('btnScrapeNow');
  if (btnScrape) {
    btnScrape.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
      <span>Scrape Now</span>
    `;
  }

  const srcDesc = document.getElementById('sourcesPageDesc');
  if (srcDesc) srcDesc.textContent = `Active RSS feeds & scrapers for ${emoji} ${name}`;

  updateSidebarInfo();
}

function updateSidebarInfo() {
  const page = allPages.find(p => p.id === currentPageId) || {};
  const sbName = document.getElementById('sidebarPageName');
  const sbStatus = document.getElementById('sidebarAutoStatus');
  const sbCategory = document.getElementById('sidebarPageCategory');

  if (sbName) sbName.textContent = `${page.emoji || '📰'} ${page.name || currentPageId}`;
  if (sbCategory) sbCategory.textContent = page.description || 'Channel Stream';

  if (sbStatus) {
    sbStatus.textContent = page.autoPost ? 'Auto-Post On' : 'Auto-Off';
    sbStatus.className = 'sidebar-auto-badge' + (page.autoPost ? ' active' : '');
  }

  const anyAutoPost = allPages.some(p => p.autoPost && (p.fbPageId || '').length > 5);
  const dot  = document.getElementById('globalStatusDot');
  const text = document.getElementById('globalStatusText');
  if (dot) dot.className = 'status-dot' + (anyAutoPost ? ' active' : '');
  if (text) text.textContent = anyAutoPost ? 'Direct Auto-Publish Active' : 'Manual Review Studio';
}

function updateTabCounts() {
  ['page1','page2','page3'].forEach(pid => {
    const el = document.getElementById(`count-${pid}`);
    if (el) {
      const count = (allPosts || []).filter(p => (p.pageId || 'page3') === pid && p.status !== 'rejected').length;
      el.textContent = count;
    }
  });
}

// ═══════════════════════════════════════════════════════
//  VIEW SWITCHING
// ═══════════════════════════════════════════════════════
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const targetView = document.getElementById(`view-${name}`);
  const targetNav  = document.getElementById(`nav-${name}`);
  if (targetView) targetView.classList.add('active');
  if (targetNav)  targetNav.classList.add('active');

  if (name === 'settings') renderPageConfigCards();
}

// ═══════════════════════════════════════════════════════
//  DATA LOADERS
// ═══════════════════════════════════════════════════════
async function loadPages() {
  try {
    const res  = await fetch('/api/pages');
    const data = await res.json();
    if (data.success) allPages = data.pages;
  } catch (e) {}
}

async function loadPosts() {
  try {
    const res  = await fetch(`/api/posts?pageId=${currentPageId}`);
    const data = await res.json();
    if (data.success) {
      allPosts = data.posts;
      renderStats();
      renderFilterBar();
      renderPosts();
      updateTabCounts();
    }
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════
//  STATS & FILTERS
// ═══════════════════════════════════════════════════════
function renderStats() {
  const grid  = document.getElementById('statsGrid');
  const total = allPosts.filter(p => p.status !== 'rejected').length;
  const pend  = allPosts.filter(p => p.status === 'pending').length;
  const pub   = allPosts.filter(p => p.status === 'published').length;

  let html = `
    <div class="stat-card primary-stat">
      <div class="stat-label">TOTAL POSTS</div>
      <div class="stat-value">${total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">⏳ PENDING</div>
      <div class="stat-value" style="color:#fbbf24">${pend}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">✅ PUBLISHED</div>
      <div class="stat-value" style="color:#34d399">${pub}</div>
    </div>
  `;

  if (grid) grid.innerHTML = html;
}

function toProperCase(str) {
  if (!str) return '';
  return str.split(' ').map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '').join(' ');
}

function renderFilterBar() {
  const cats = ['all', 'pending', 'published', ...new Set(allPosts.filter(p => p.category).map(p => p.category))];
  const bar  = document.getElementById('filterBar');
  if (!bar) return;

  bar.innerHTML = cats.map(c => {
    const count = c === 'all' ? allPosts.filter(p => p.status !== 'rejected').length
                : c === 'pending' || c === 'published' ? allPosts.filter(p => p.status === c).length
                : allPosts.filter(p => p.category === c && p.status !== 'rejected').length;
    const label = toProperCase(c);
    return `
      <button class="filter-btn ${currentFilter === c ? 'active' : ''}" onclick="setFilter('${escHtml(c)}', this)">
        <span>${catEmoji(c)} ${escHtml(label)}</span>
        <strong style="margin-left:4px;opacity:0.8">${count}</strong>
      </button>
    `;
  }).join('');
}

function setFilter(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('#filterBar .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPosts();
}

function handleSearchPosts(val) {
  postSearchQuery = (val || '').toLowerCase().trim();
  renderPosts();
}

// ═══════════════════════════════════════════════════════
//  RENDER POSTS GRID
// ═══════════════════════════════════════════════════════
function renderPosts() {
  let filtered = allPosts.filter(p => p.status !== 'rejected');

  if (currentFilter === 'pending' || currentFilter === 'published') {
    filtered = filtered.filter(p => p.status === currentFilter);
  } else if (currentFilter !== 'all') {
    filtered = filtered.filter(p => p.category === currentFilter);
  }

  if (postSearchQuery) {
    filtered = filtered.filter(p => 
      (p.title && p.title.toLowerCase().includes(postSearchQuery)) ||
      (p.generatedCaption && p.generatedCaption.toLowerCase().includes(postSearchQuery)) ||
      (p.sourceName && p.sourceName.toLowerCase().includes(postSearchQuery)) ||
      (p.category && p.category.toLowerCase().includes(postSearchQuery))
    );
  }

  const grid = document.getElementById('postsGrid');
  if (!grid) return;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon-spin">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        </div>
        <h3>No Content Found</h3>
        <p>No posts match the current filter or search criteria. Click "Run Pipeline Now" to scrape new articles!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(post => {
    const imgSrc = post.bannerUrl || post.imageUrl || '';
    const statusClass = `badge-${post.status || 'pending'}`;

    return `
      <div class="post-card" id="card-${post.id}">
        <div class="post-media">
          ${imgSrc ? `<img class="post-img" src="${escHtml(imgSrc)}" alt="preview" onerror="this.style.display='none'"/>` : ''}
          <div class="post-category-badge">${catEmoji(post.category)} ${escHtml(post.category || 'General')}</div>
          <div class="post-status-badge ${statusClass}">${post.status}</div>
        </div>

        <div class="post-body">
          <div class="post-source-row">
            <span class="post-source-name">${escHtml(post.sourceName || 'News Source')}</span>
            <span>${post.createdAt ? new Date(post.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Today'}</span>
          </div>

          <h3 class="post-title">${escHtml(post.title)}</h3>

          ${post.error ? `<div style="color:#f87171;font-size:11px;margin-bottom:8px">⚠️ ${escHtml(post.error)}</div>` : ''}

          <div class="post-actions">
            <button class="btn-action btn-publish" onclick="publishPost('${post.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span>Publish</span>
            </button>
            <button class="btn-action btn-enhance" onclick="openAiEnhance('${post.id}')">
              <span>✨ AI Workshop</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════
//  SCRAPE PIPELINE TRIGGER
// ═══════════════════════════════════════════════════════
async function handleScrapeNow() {
  const btn = document.getElementById('btnScrapeNow');
  btn.disabled = true;
  const page = allPages.find(p => p.id === currentPageId) || {};
  btn.innerHTML = `<span>⏳</span> Fetching Streams...`;

  try {
    const res  = await fetch('/api/scrape-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: currentPageId })
    });
    const data = await res.json();
    if (data.count > 0) {
      showToast(`✅ ${data.count} fresh posts generated for ${page.name}!`);
      await loadPosts();
    } else {
      showToast(data.error || 'Pipeline run complete — no new articles found.');
    }
  } catch (e) {
    showToast('❌ Scrape failed. Check server status.');
  } finally {
    btn.disabled = false;
    applyPageTheme(currentPageId);
  }
}

// ═══════════════════════════════════════════════════════
//  POST ACTIONS & UTILITIES
// ═══════════════════════════════════════════════════════
async function publishPost(id) {
  const card = document.getElementById(`card-${id}`);
  if (card) card.style.opacity = '0.5';
  try {
    const res  = await fetch(`/api/posts/${id}/publish`, { method: 'POST' });
    const data = await res.json();
    showToast(data.success ? (data.message || '✅ Post Published to Facebook!') : ('❌ ' + (data.error || 'Failed to publish')));
    loadPosts();
  } catch (e) {
    showToast('❌ Network error publishing post.');
    loadPosts();
  }
}

async function rejectPost(id) {
  try {
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    loadPosts();
    showToast('🗑️ Post removed from queue');
  } catch (e) {
    showToast('❌ Delete failed');
  }
}

function copyCaption(id) {
  const post = allPosts.find(p => p.id === id);
  if (!post || !post.generatedCaption) return;
  navigator.clipboard.writeText(post.generatedCaption);
  showToast('📋 Caption copied to clipboard!');
}

// ═══════════════════════════════════════════════════════
//  AI ENHANCE STUDIO MODAL
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
//  AI WORKSHOP SIDE-BY-SIDE MODAL HANDLERS
// ═══════════════════════════════════════════════════════
let currentEnhPhotos = [];

async function openAiEnhance(postId) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;

  document.getElementById('enhPostId').value = postId;

  // Left Panel: Source details
  const srcBadge = document.getElementById('enhSourceBadge');
  if (srcBadge) srcBadge.textContent = post.sourceName || 'News Source';

  const origLink = document.getElementById('enhOriginalLink');
  if (origLink) origLink.href = post.link || '#';

  document.getElementById('enhOriginalTitle').textContent = post.title || 'No Title';

  const origSnippet = document.getElementById('enhOriginalSnippet');
  let initialSummary = post.summary || post.snippet || post.title;
  if (origSnippet) origSnippet.textContent = initialSummary;

  const origImg = document.getElementById('enhOriginalImg');
  const imgSrc = post.imageUrl || post.bannerUrl || '';
  if (imgSrc && origImg) {
    origImg.src = imgSrc;
    origImg.style.display = 'block';
  } else if (origImg) {
    origImg.style.display = 'none';
  }

  // Right Panel: AI Caption & Photos
  document.getElementById('enhCaption').value = post.generatedCaption || '';

  // Gallery Photos (up to 5 photos max)
  currentEnhPhotos = post.photos && post.photos.length 
    ? [...post.photos] 
    : (post.bannerUrl ? [post.bannerUrl] : (post.imageUrl ? [post.imageUrl] : []));
  renderEnhPhotosGallery();

  const modal = document.getElementById('modalAiEnhance');
  if (modal) modal.style.display = 'flex';

  // Automatically fetch full story body if summary is short
  if (!post.summary || post.summary.trim() === post.title.trim() || post.summary.length < 350) {
    if (origSnippet) origSnippet.textContent = '⌛ Fetching full complete article text...';
    try {
      const res = await fetch(`/api/posts/${postId}/fetch-original-body`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.summary && data.summary.length > 30) {
        if (origSnippet) origSnippet.textContent = data.summary;
        post.summary = data.summary;
      } else if (origSnippet) {
        origSnippet.textContent = initialSummary;
      }
    } catch (e) {
      if (origSnippet) origSnippet.textContent = initialSummary;
    }
  }
}

function renderEnhPhotosGallery() {
  const container = document.getElementById('enhPhotosGallery');
  if (!container) return;

  if (!currentEnhPhotos || currentEnhPhotos.length === 0) {
    container.innerHTML = `
      <div style="height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; color: #94a3b8;">
        <span style="font-size: 24px;">📷</span>
        <span style="font-size: 12px; font-weight: 600; margin-top: 4px;">No Attached Photos (Max 5)</span>
      </div>
    `;
    return;
  }

  if (currentEnhPhotos.length === 1) {
    container.innerHTML = `
      <div style="position: relative; width: 100%; height: 180px;">
        <img src="${currentEnhPhotos[0]}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 10px; border: 1.5px solid var(--active-primary);" alt="Photo 1">
        <button type="button" onclick="removeEnhPhotoAtIndex(0)" style="position: absolute; top: 6px; right: 6px; background: rgba(239,68,68,0.9); color: #fff; border: none; border-radius: 50%; width: 26px; height: 26px; font-size: 13px; font-weight: 800; cursor: pointer;">&times;</button>
        <span style="position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,0.7); color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 10.5px; font-weight: 700;">1 / 5 Photos</span>
      </div>
    `;
    return;
  }

  container.style.display = 'grid';
  container.style.gridTemplateColumns = currentEnhPhotos.length === 2 ? '1fr 1fr' : 'repeat(auto-fill, minmax(105px, 1fr))';
  container.style.gap = '8px';

  container.innerHTML = currentEnhPhotos.map((url, idx) => `
    <div style="position: relative; width: 100%; height: ${currentEnhPhotos.length <= 2 ? '180px' : '90px'}; overflow: hidden; border-radius: 8px; border: 1.5px solid var(--active-primary);">
      <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" alt="Photo ${idx+1}">
      <button type="button" onclick="removeEnhPhotoAtIndex(${idx})" style="position: absolute; top: 4px; right: 4px; background: rgba(239,68,68,0.9); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 12px; font-weight: 800; cursor: pointer;">&times;</button>
      <span style="position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 9.5px; font-weight: 700;">#${idx+1}</span>
    </div>
  `).join('');
}

function removeEnhPhotoAtIndex(idx) {
  if (idx >= 0 && idx < currentEnhPhotos.length) {
    currentEnhPhotos.splice(idx, 1);
    renderEnhPhotosGallery();
    showToast(`Photo #${idx + 1} removed`);
  }
}

function removeAllEnhPhotos() {
  currentEnhPhotos = [];
  renderEnhPhotosGallery();
  showToast('All gallery photos removed');
}

function triggerAddPhoto() {
  if (currentEnhPhotos.length >= 5) {
    showToast('⚠️ Max 5 photos limit reached!');
    return;
  }
  document.getElementById('enhPhotoFileInput').click();
}

function handleEnhPhotoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (currentEnhPhotos.length >= 5) {
    showToast('⚠️ Max 5 photos limit reached!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    currentEnhPhotos.push(evt.target.result);
    renderEnhPhotosGallery();
    showToast(`📷 Photo added (${currentEnhPhotos.length}/5)`);
  };
  reader.readAsDataURL(file);
}

function togglePromptInputs() {
  const area = document.getElementById('promptInputsArea');
  if (area) {
    area.style.display = area.style.display === 'none' ? 'block' : 'none';
  }
}

async function handleRegenerateAiPhoto() {
  if (currentEnhPhotos.length >= 5) {
    showToast('⚠️ Max 5 photos limit reached!');
    return;
  }
  const postId = document.getElementById('enhPostId').value;
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;

  showToast('🖼️ Generating brand new AI photo (FLUX)...');

  const cleanTitle = post.title.replace(/[^\x00-\x7F]/g, '').trim() || 'news photo';
  const customAiPrompt = `${post.category || 'News'} editorial photography, ${cleanTitle}, professional journalism 4k photo`;

  try {
    const res = await fetch(`/api/posts/${postId}/regenerate-banner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'ai_image', customAiPrompt })
    });
    const data = await res.json();
    if (data.success && data.post && data.post.bannerUrl) {
      currentEnhPhotos.push(data.post.bannerUrl);
      renderEnhPhotosGallery();
      showToast(`🖼️ New AI photo added (${currentEnhPhotos.length}/5)`);
      loadPosts();
    }
  } catch (e) {
    showToast('❌ AI photo generation failed.');
  }
}

async function handleGenerateSeriesGraphChart() {
  if (currentEnhPhotos.length >= 5) {
    showToast('⚠️ Max 5 photos limit reached!');
    return;
  }
  const postId = document.getElementById('enhPostId').value;
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;

  showToast('📊 Generating SeriesGraph Rating Matrix Chart...');

  try {
    const res = await fetch(`/api/posts/${postId}/generate-seriesgraph`, { method: 'POST' });
    const data = await res.json();
    if (data.success && data.post && data.post.bannerUrl) {
      currentEnhPhotos.push(data.post.bannerUrl);
      renderEnhPhotosGallery();
      showToast(`📊 SeriesGraph Rating Chart generated & attached! (${currentEnhPhotos.length}/5)`);
      loadPosts();
    }
  } catch (e) {
    showToast('❌ SeriesGraph chart generation failed.');
  }
}

async function handleAiRewriteCaption() {
  const postId = document.getElementById('enhPostId').value;
  const btn    = document.getElementById('btnRewriteCaption');
  btn.disabled = true;
  btn.textContent = '⌛ Rewriting...';

  try {
    const res  = await fetch(`/api/posts/${postId}/rewrite-text`, { method: 'POST' });
    const data = await res.json();
    if (data.success && data.post) {
      document.getElementById('enhCaption').value = data.post.generatedCaption;
      showToast('✨ AI Caption Rewritten!');
    }
  } catch (e) {
    showToast('❌ Rewrite failed.');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 Rewrite';
  }
}

const VIBRANT_CARTOON_PROMPTS = {
  cartoon_general: "Vibrant colorful 2D cartoon illustration, bold thick outlines, flat saturated colors, playful children's book art style, bright rainbow palette, high contrast",
  cartoon_movie: "Colorful cartoon illustration of a movie theater, popcorn and film reel, bold outlines, flat bright colors, festive Bollywood poster style, rainbow color palette",
  cartoon_stock: "Colorful flat cartoon illustration of stock market growth, bold outlines, bright green and gold chart, playful business icons, vibrant saturated colors",
  cartoon_news: "Colorful cartoon illustration of Kolkata cityscape, Howrah Bridge, bold outlines, flat bright colors, cheerful poster art style, vibrant palette"
};

function applyPromptPreset(key) {
  const promptText = VIBRANT_CARTOON_PROMPTS[key];
  if (promptText) {
    document.getElementById('promptDialogImage').value = promptText;
    showToast('🎨 Applied Vibrant Cartoon Preset!');
  }
}

function openPromptDialog() {
  const modal = document.getElementById('promptDialogModal');
  if (modal) modal.style.display = 'flex';
}

function closePromptDialog() {
  const modal = document.getElementById('promptDialogModal');
  if (modal) modal.style.display = 'none';
}

async function generateCaptionFromPromptDialog() {
  const postId = document.getElementById('enhPostId').value;
  const capPrompt = document.getElementById('promptDialogCaption').value.trim();

  if (!capPrompt) {
    showToast('⚠️ Please enter a custom caption prompt first!');
    return;
  }

  const btn = document.getElementById('btnDialogGenCaption');
  btn.disabled = true;
  btn.textContent = '⌛ Generating Caption...';
  showToast('✨ Generating caption with custom prompt...');

  try {
    const res = await fetch(`/api/posts/${postId}/custom-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customCaptionPrompt: capPrompt })
    });
    const data = await res.json();
    if (data.success && data.post) {
      document.getElementById('enhCaption').value = data.post.generatedCaption;
      showToast('✨ New Caption generated with custom prompt!');
    }
  } catch (e) {
    showToast('❌ Caption generation failed.');
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Generate Caption';
  }
}

async function generateImageFromPromptDialog() {
  const postId = document.getElementById('enhPostId').value;
  const imgPrompt = document.getElementById('promptDialogImage').value.trim();

  if (!imgPrompt) {
    showToast('⚠️ Please enter a custom image prompt first!');
    return;
  }

  if (currentEnhPhotos.length >= 5) {
    showToast('⚠️ Max 5 photos limit reached!');
    return;
  }

  const btn = document.getElementById('btnDialogGenImage');
  btn.disabled = true;
  btn.textContent = '⌛ Generating AI Image...';
  showToast('🖼️ Generating AI image with custom prompt...');

  try {
    const res = await fetch(`/api/posts/${postId}/custom-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customImagePrompt: imgPrompt })
    });
    const data = await res.json();
    if (data.success && data.post && data.post.bannerUrl) {
      currentEnhPhotos.push(data.post.bannerUrl);
      renderEnhPhotosGallery();
      showToast('🖼️ New AI Image generated with custom prompt!');
      loadPosts();
    }
  } catch (e) {
    showToast('❌ Image generation failed.');
  } finally {
    btn.disabled = false;
    btn.textContent = '🖼️ Generate Image';
  }
}

async function saveEnhAndClose() {
  const postId  = document.getElementById('enhPostId').value;
  const caption = document.getElementById('enhCaption').value;
  const bannerUrl = currentEnhPhotos[0] || '';

  try {
    await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generatedCaption: caption,
        bannerUrl: bannerUrl,
        photos: currentEnhPhotos
      })
    });
    showToast('💾 Saved & Applied!');
    closeModal('modalAiEnhance');
    loadPosts();
  } catch (e) {
    showToast('❌ Failed to save changes.');
  }
}

// ═══════════════════════════════════════════════════════
//  SOURCES & SETTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════
async function loadSources() {
  try {
    const res  = await fetch(`/api/sources?pageId=${currentPageId}`);
    const data = await res.json();
    if (data.success) {
      allSources = data.sources;
      renderSources();
    }
  } catch (e) {}
}

function renderSources() {
  const container = document.getElementById('sourcesList');
  if (!container) return;

  let filtered = allSources;
  if (currentSrcFilter !== 'all') {
    filtered = allSources.filter(s => s.type === currentSrcFilter);
  }

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>No sources configured.</h3></div>`;
    return;
  }

  container.innerHTML = filtered.map(s => `
    <div class="source-card" id="src-card-${s.id}">
      <div>
        <div class="source-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="source-title" style="font-weight:700;font-size:14px;color:#0f172a;line-height:1.3">${escHtml(s.name)}</span>
            <span class="source-type-tag" style="font-size:10px;font-weight:800;text-transform:uppercase;padding:2px 8px;border-radius:6px;background:#f1f5f9;color:#475569;white-space:nowrap">${escHtml(s.type || 'rss')}</span>
          </div>

          <!-- TOP RIGHT GREEN ON/OFF TOGGLE SWITCH -->
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11px;font-weight:700;color:${s.active ? '#059669' : '#64748b'}">${s.active ? 'Active' : 'Paused'}</span>
            <label class="card-toggle-switch" title="Toggle Source ON/OFF">
              <input type="checkbox" ${s.active ? 'checked' : ''} onchange="toggleSourceActive('${s.id}', this.checked)"/>
              <span class="card-toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div class="source-url" style="font-size:11px;color:#64748b;word-break:break-all;margin-bottom:10px">${escHtml(s.url)}</div>
      </div>

      <div class="source-toolbar" style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #f1f5f9;margin-top:auto">
        <span style="font-size:11px;color:#334155;font-weight:600">📁 ${escHtml(s.category || 'General')}</span>

        <!-- Action Buttons: VIEW, EDIT, DELETE -->
        <div style="display:flex;gap:4px;align-items:center">
          <button class="btn btn-secondary btn-xs" onclick="openSourceArticlesModal('${s.id}')" title="View Articles from this Source" style="padding:4px 8px;font-size:11px;border-radius:6px;font-weight:700">👁️ View</button>
          <button class="btn btn-secondary btn-xs" onclick="openEditSourceModal('${s.id}')" title="Edit Source" style="padding:4px 8px;font-size:11px;border-radius:6px;font-weight:700">✏️ Edit</button>
          <button class="btn btn-danger btn-xs" onclick="deleteSource('${s.id}')" title="Delete Source" style="padding:4px 8px;font-size:11px;border-radius:6px;font-weight:700;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function toggleSourceActive(id, active) {
  try {
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    showToast(active ? '🟢 Source Activated' : '🔴 Source Paused');
    loadSources();
  } catch (e) {
    showToast('❌ Failed to update source status');
  }
}

function openEditSourceModal(id) {
  const src = allSources.find(s => s.id === id);
  if (!src) return;

  document.getElementById('editSrcId').value = src.id;
  document.getElementById('editSrcName').value = src.name;
  document.getElementById('editSrcCategory').value = src.category || 'General';
  document.getElementById('editSrcLanguage').value = src.language || 'english';
  document.getElementById('editSrcUrl').value = src.url;
  document.getElementById('editSrcActive').value = src.active ? 'true' : 'false';

  const modal = document.getElementById('modalEditSource');
  if (modal) modal.style.display = 'flex';
}

async function handleSaveEditSource(e) {
  e.preventDefault();
  const id        = document.getElementById('editSrcId').value;
  const name      = document.getElementById('editSrcName').value;
  const category  = document.getElementById('editSrcCategory').value;
  const language  = document.getElementById('editSrcLanguage').value;
  const url       = document.getElementById('editSrcUrl').value;
  const activeVal = document.getElementById('editSrcActive').value;

  try {
    const res = await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, language, url, active: activeVal === 'true' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('💾 Source updated successfully!');
      closeModal('modalEditSource');
      loadSources();
    }
  } catch (e) {
    showToast('❌ Failed to update source');
  }
}

async function deleteSource(id) {
  if (!confirm('Are you sure you want to delete this source feed?')) return;
  try {
    const res  = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('🗑️ Source feed deleted');
      loadSources();
    }
  } catch (e) {
    showToast('❌ Failed to delete source');
  }
}

function deleteSourceFromModal() {
  const id = document.getElementById('editSrcId').value;
  closeModal('modalEditSource');
  deleteSource(id);
}

async function openSourceArticlesModal(id) {
  const src = allSources.find(s => s.id === id);
  if (!src) return;

  document.getElementById('srcArticlesTitle').textContent = `👁️ Articles from ${src.name}`;
  const body = document.getElementById('srcArticlesBody');
  body.innerHTML = `<div style="text-align:center;padding:30px;color:#64748b">⌛ Fetching articles from source...</div>`;

  const modal = document.getElementById('modalSourceArticles');
  if (modal) modal.style.display = 'flex';

  try {
    const res  = await fetch(`/api/sources/${id}/posts`);
    const data = await res.json();
    if (data.success && data.posts.length > 0) {
      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px">
          ${data.posts.map(p => `
            <div style="display:flex;gap:14px;align-items:center;background:#f8fafc;padding:12px;border-radius:10px;border:1px solid #e2e8f0">
              ${p.bannerUrl || p.imageUrl ? `<img src="${p.bannerUrl || p.imageUrl}" style="width:70px;height:70px;object-fit:cover;border-radius:8px">` : ''}
              <div style="flex:1">
                <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px">${escHtml(p.title)}</div>
                <div style="font-size:11px;color:#64748b">${new Date(p.scrapedAt || Date.now()).toLocaleString()}</div>
              </div>
              <a href="${p.link}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none">Read 🔗</a>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      body.innerHTML = `
        <div style="text-align:center;padding:40px;color:#64748b">
          <div style="font-size:32px;margin-bottom:8px">📰</div>
          <div style="font-weight:700;font-size:14px;color:#0f172a">No articles collected yet</div>
          <div style="font-size:12px">Click "Run Pipeline Now" to scrape latest updates from this source!</div>
        </div>
      `;
    }
  } catch (e) {
    body.innerHTML = `<div style="color:#ef4444;text-align:center">Failed to load articles.</div>`;
  }
}

function filterSources(type, btn) {
  currentSrcFilter = type;
  document.querySelectorAll('#sourceFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSources();
}

function openAddSourceModal() {
  const modal = document.getElementById('modalAddSource');
  if (modal) modal.style.display = 'flex';
}

async function handleAddSource(e) {
  e.preventDefault();
  const name     = document.getElementById('srcName').value;
  const type     = document.getElementById('srcType').value;
  const category = document.getElementById('srcCategory').value;
  const url      = document.getElementById('srcUrl').value;

  try {
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, category, url, pageId: currentPageId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('📡 Source added!');
      closeModal('modalAddSource');
      loadSources();
    }
  } catch (e) {
    showToast('❌ Failed to add source');
  }
}

// ═══════════════════════════════════════════════════════
//  PAGE CONFIG CARDS & MODAL
// ═══════════════════════════════════════════════════════
function renderPageConfigCards() {
  const container = document.getElementById('pageConfigCards');
  if (!container) return;

  container.innerHTML = allPages.map(page => `
    <div class="page-config-card">
      <div class="pcfg-header">
        <span class="pcfg-title">${page.emoji || '📰'} ${escHtml(page.name)}</span>
        <span style="font-size:11px;color:${page.autoPost?'#34d399':'#f87171'}">${page.autoPost ? '🟢 Auto-Publish On' : '⭕ Manual Review'}</span>
      </div>
      <div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">${escHtml(page.description || '')}</div>
      <button class="btn btn-secondary btn-sm" onclick="openPageSettingsModal('${page.id}')">⚙️ Configure Credentials &amp; Schedule</button>
    </div>
  `).join('');
}

function openPageSettingsModal(pageId) {
  const page = allPages.find(p => p.id === pageId);
  if (!page) return;

  document.getElementById('editingPageId').value   = pageId;
  document.getElementById('psPageId').value        = page.fbPageId || '';
  document.getElementById('psPageToken').value     = page.fbPageToken || '';
  document.getElementById('psAiStyle').value       = page.aiStyle || 'news';
  document.getElementById('psLanguage').value      = page.language || 'bengali_english_mixed';
  document.getElementById('psCronSchedule').value  = page.cronSchedule || '';
  document.getElementById('psAutoPost').checked    = page.autoPost === true;

  const modal = document.getElementById('modalPageSettings');
  if (modal) modal.style.display = 'flex';
}

async function savePageSettings() {
  const pageId = document.getElementById('editingPageId').value;
  const updates = {
    fbPageId:     document.getElementById('psPageId').value,
    fbPageToken:  document.getElementById('psPageToken').value,
    aiStyle:      document.getElementById('psAiStyle').value,
    language:     document.getElementById('psLanguage').value,
    cronSchedule: document.getElementById('psCronSchedule').value,
    autoPost:     document.getElementById('psAutoPost').checked
  };

  try {
    const res = await fetch(`/api/pages/${pageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (data.success) {
      showToast('💾 Page configuration saved!');
      closeModal('modalPageSettings');
      await loadPages();
      updateSidebarInfo();
    }
  } catch (e) {
    showToast('❌ Failed to save page settings');
  }
}

async function handleAutoConnectFbPage() {
  const pageId    = document.getElementById('editingPageId').value;
  const userToken = document.getElementById('psUserToken').value;
  if (!userToken) {
    showToast('⚠️ Paste user token first');
    return;
  }

  try {
    const res = await fetch(`/api/pages/${pageId}/connect-fb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userToken })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`⚡ ${data.message}`);
      document.getElementById('psPageId').value    = data.pageId;
      document.getElementById('psPageToken').value = data.page.fbPageToken;
    } else {
      showToast(`❌ ${data.error}`);
    }
  } catch (e) {
    showToast('❌ Connection error');
  }
}

// ═══════════════════════════════════════════════════════
//  GLOBAL SETTINGS
// ═══════════════════════════════════════════════════════
async function loadGlobalSettings() {}
async function handleSaveGlobalSettings(e) {
  e.preventDefault();
  showToast('💾 Global settings saved');
}

// ═══════════════════════════════════════════════════════
//  HELPERS & TOAST
// ═══════════════════════════════════════════════════════
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

function showToast(msg) {
  const container = document.getElementById('toast');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function catEmoji(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('movie') || c.includes('cinema') || c.includes('bollywood') || c.includes('tollywood')) return '🎬';
  if (c.includes('stock') || c.includes('market') || c.includes('trading') || c.includes('crypto') || c.includes('ipo')) return '📈';
  if (c.includes('weather') || c.includes('rain')) return '🌦️';
  if (c.includes('police') || c.includes('court') || c.includes('law')) return '⚖️';
  if (c.includes('politic') || c.includes('gov')) return '🏛️';
  if (c.includes('edu') || c.includes('exam')) return '🎓';
  if (c.includes('scheme') || c.includes('welfare')) return '🤝';
  return '📌';
}

function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
