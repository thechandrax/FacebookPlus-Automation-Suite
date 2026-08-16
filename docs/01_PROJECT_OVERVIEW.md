# 01. Project Overview & Features

## 📌 Executive Summary
**Facebook+ Automation Suite** is a full-stack, 24/7 automated news scraping, AI caption generating, HD banner graphic creating, and multi-page Facebook publishing application. It is engineered specifically for West Bengal & Indian media ecosystem automation, supporting Bengali & English language content creation across 3 dedicated target pages:
1. 🎬 **Page 1**: Movies, OTT & Celebrity News
2. 📈 **Page 2**: Stock Market, Finance & Trading
3. 📰 **Page 3**: West Bengal News, Kolkata Updates & Education

---

## 🔥 Key Core Features

### 1. 24/7 Background RSS & Article Scraper
- Automatically checks news feeds every 5 minutes from top portals (*LiveMint*, *Pinkvilla*, *Times of India*, *Filmibeat*, *Bollywood Hungama*, *Aajkaal*, *News18 Bengali*).
- Deduplicates incoming news using article URL hashes and title matching.

### 2. Exact Scraped HD Article Image Engine
- Extracts original `og:image`, `twitter:image`, and article cover photos directly from news sites.
- Strips low-resolution thumbnail query parameters (`?w=100`, `/small/`) to ensure crisp 1080p+ HD quality.
- Built-in `File` & `WebP/AVIF` decoder polyfills for seamless multi-format handling.

### 3. Dual-Engine AI Caption Generator
- **Groq Llama-3.3-70B** / **Google Gemini 1.5 Flash** for instant Bengali & English viral caption generation.
- Formats posts with engaging hook emojis, key bullet points, call-to-actions, and targeted hashtags.

### 4. Interactive AI Workshop & Side-by-Side Content Studio
- **Side-by-Side UI**: Compare original scraped article text/photo on the left against rewritten AI caption/gallery on the right.
- **Equal Image Heights**: Left and right image containers are strictly aligned at 200px height with matching aspect-ratios.
- **Prompt Studio**: Built-in 1-click **Vibrant Cartoon Presets** (`🎨 General`, `🎬 Movies/OTT`, `📈 Stock/Trading`, `📰 News/WB`) tuned for FLUX.1.
- **Pin to Top**: Pin priority sources to the top of your dashboard.

### 5. 1-Click Multi-Page Facebook Publisher
- Publishes or schedules content across multiple Facebook pages using official Graph API tokens.
- Supports single-photo and multi-photo carousel attachments.
