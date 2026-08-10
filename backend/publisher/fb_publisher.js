const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const { getPages } = require('../storage/posts_store');

/**
 * Get FB credentials for a specific pageId from pages.json
 */
function getPageCredentials(pageId) {
  try {
    const pages = getPages();
    const page = pages.find(p => p.id === pageId);
    if (page && page.fbPageId && page.fbPageToken) {
      return { pageId: page.fbPageId, pageToken: page.fbPageToken };
    }
  } catch (e) {}
  // Fallback to env vars (legacy / page3)
  return {
    pageId: process.env.FACEBOOK_PAGE_ID,
    pageToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  };
}

/**
 * Upload a photo to Facebook (local file, base64 data URL, or remote URL)
 */
async function uploadPhotoToFacebook(rawUrl, fbPageId, fbPageToken, apiVersion, isPublished = true, caption = '') {
  let localPath = null;

  if (rawUrl.startsWith('/')) {
    localPath = path.join(__dirname, '../../public', rawUrl);
  } else if (rawUrl.startsWith('data:image')) {
    const matches = rawUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const buffer = Buffer.from(matches[2], 'base64');
      const tempPath = path.join(__dirname, '../../public/generated_banners', `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}.png`);
      fs.writeFileSync(tempPath, buffer);
      localPath = tempPath;
    }
  }

  if (localPath && fs.existsSync(localPath)) {
    const form = new FormData();
    form.append('source', fs.createReadStream(localPath));
    form.append('published', isPublished ? 'true' : 'false');
    if (caption && isPublished) form.append('caption', caption);
    form.append('access_token', fbPageToken);
    const res = await axios.post(`https://graph.facebook.com/${apiVersion}/${fbPageId}/photos`, form, { headers: form.getHeaders() });
    return res.data;
  } else {
    const payload = { url: rawUrl, published: isPublished, access_token: fbPageToken };
    if (caption && isPublished) payload.caption = caption;
    const res = await axios.post(`https://graph.facebook.com/${apiVersion}/${fbPageId}/photos`, payload);
    return res.data;
  }
}

/**
 * Publish a post to its assigned Facebook Page
 */
async function publishToFacebook(postItem, options = {}) {
  const apiVersion = process.env.FACEBOOK_API_VERSION || 'v19.0';
  const creds = getPageCredentials(postItem.pageId || 'page3');
  const { pageId, pageToken } = creds;

  console.log(`[FB Publisher] Publishing post ${postItem.id} for pageId="${postItem.pageId || 'page3'}"`);

  // Simulation mode if no real credentials
  if (!pageId || !pageToken ||
      pageToken === 'your_page_access_token_here' ||
      pageId === 'your_facebook_page_id_here') {
    console.log('[FB Publisher] No FB credentials — running in SIMULATION mode.');
    return {
      success: true, simulation: true,
      facebookPostId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      publishedAt: new Date().toISOString(),
      message: 'Simulated post. Add FB Page ID & Token in Settings to go live.'
    };
  }

  try {
    const captionText = postItem.generatedCaption || postItem.snippet || postItem.title;
    const photosList = postItem.photos && postItem.photos.length > 0
      ? postItem.photos
      : (postItem.bannerUrl ? [postItem.bannerUrl] : (postItem.imageUrl ? [postItem.imageUrl] : []));

    // Multi-photo post
    if (photosList.length > 1) {
      console.log(`[FB Publisher] Multi-photo post (${photosList.length} photos) → FB Page ${pageId}`);
      const attachedMedia = [];
      for (let i = 0; i < Math.min(photosList.length, 5); i++) {
        const res = await uploadPhotoToFacebook(photosList[i], pageId, pageToken, apiVersion, false, '');
        if (res && res.id) attachedMedia.push({ media_fbid: res.id });
      }
      const feedRes = await axios.post(`https://graph.facebook.com/${apiVersion}/${pageId}/feed`, {
        message: captionText, attached_media: attachedMedia, access_token: pageToken
      });
      return { success: true, simulation: false, facebookPostId: feedRes.data.id, publishedAt: new Date().toISOString() };
    }

    // Single photo post
    if (photosList.length === 1) {
      console.log(`[FB Publisher] Single photo post → FB Page ${pageId}`);
      const res = await uploadPhotoToFacebook(photosList[0], pageId, pageToken, apiVersion, true, captionText);
      return { success: true, simulation: false, facebookPostId: res.id || res.post_id, publishedAt: new Date().toISOString() };
    }

    // Text / link only post
    console.log(`[FB Publisher] Text/link post → FB Page ${pageId}`);
    const payload = { message: captionText, access_token: pageToken };
    if (postItem.link) payload.link = postItem.link;
    const res = await axios.post(`https://graph.facebook.com/${apiVersion}/${pageId}/feed`, payload);
    return { success: true, simulation: false, facebookPostId: res.data.id, publishedAt: new Date().toISOString() };

  } catch (error) {
    const errDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('[FB Publisher Error]', errDetails);
    return { success: false, simulation: false, error: errDetails };
  }
}

module.exports = { publishToFacebook };
