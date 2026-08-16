# 09. 7-Day Rolling Data Retention & Auto-Cleanup

## 🔄 Overview

The application features an automated **7-Day Rolling Data Retention Manager** (`pruneOldData(7)`). This system guarantees that only the **most recent 7 days of data** are kept across all environments (Local PC, Railway.app, Docker, etc.).

---

## 🧹 What Gets Cleaned Automatically?

1. **`data/posts.json`**:
   - Scraped articles older than 7 days (`Date.now() - 7 days`) are automatically removed from the database.

2. **`public/generated_banners/`**:
   - HD banner photos (`banner_xxxx.png`) associated with expired 7-day-old posts are automatically deleted from local disk / cloud storage.
   - Unlinked / orphan banner images older than 7 days are automatically purged.

3. **`public/pdf_downloads/`**:
   - Scraped PDF government notice files (`notice_xxxx.pdf`) older than 7 days are automatically purged.

---

## ⚙️ How It Operates

- **On Startup**: Executes automatically when `node server.js` boots up.
- **On Every 5-Minute Cycle**: Runs automatically during every 5-minute background auto-scrape interval.
- **Zero Storage Leak**: Keeps total disk usage under ~50 MB to 100 MB indefinitely!
