# 08. Folder Structure & Codebase Map

## 🌳 Complete Directory Tree

```text
FacebookPlus-Automation-Suite/
├── backend/
│   ├── publisher/
│   │   ├── fb_publisher.js          # Official Facebook Graph API publisher module
│   │   └── scheduler.js             # 5-minute automated RSS & publishing daemon
│   ├── scrapers/
│   │   └── rss_scraper.js           # Live news feed scraper & HTML og:image parser
│   ├── services/
│   │   ├── ai_generator.js          # Groq Llama-3.3 & Gemini AI caption generator
│   │   └── banner_generator.js      # Exact HD article image scraper & FLUX.1 generator
│   └── storage/
│       └── posts_store.js           # Atomic JSON read/write database storage helper
├── data/
│   ├── pages.json                   # Target Facebook Pages configuration
│   ├── posts.json                   # Master scraped posts database & AI captions
│   └── sources.json                 # RSS news sources configuration & pinned states
├── docs/
│   ├── 01_PROJECT_OVERVIEW.md       # Executive summary & key features
│   ├── 02_ARCHITECTURE_AND_DATA_PIPELINE.md  # Technical architecture & sequence flow
│   ├── 03_AI_AND_BANNER_GENERATION.md       # AI prompt presets & HD image pipeline
│   ├── 04_DASHBOARD_AND_STUDIO_UI.md         # UI layout & side-by-side workshop
│   ├── 05_API_DOCUMENTATION.md      # Full REST API reference & authentication
│   ├── 06_RAILWAY_247_DEPLOYMENT_GUIDE.md   # Railway 24/7 cloud hosting guide
│   ├── 07_MOBILE_RESPONSIVE_DESIGN.md       # Mobile view & touch UI optimizations
│   ├── 08_FOLDER_STRUCTURE_AND_CODEBASE_MAP.md # Folder map & file breakdown
│   └── README.md                    # Master documentation index
├── public/
│   ├── app.js                       # Frontend state management & API interaction
│   ├── index.html                   # Single-page web dashboard HTML framework
│   ├── styles.css                   # Custom CSS variables, Cambria font & mobile design
│   └── generated_banners/           # Downloaded HD article banners & AI images
├── scripts/
│   ├── test_ai.js                   # CLI tool to test AI caption generation
│   ├── test_banner.js               # CLI tool to test HD banner resolution
│   └── test_scraper.js              # CLI tool to test RSS news scraping
├── .env.example                     # Environment variables configuration template
├── .gitignore                       # Git exclusion rules
├── package-lock.json                # NPM dependency lockfile
├── package.json                     # Node.js project manifest & scripts (Node 20+)
├── railway.json                     # Railway.app 24/7 deployment blueprint
├── server.js                        # Main Express application entry point
└── start.bat                        # Windows 1-click launcher script
```

---

## 📂 Detailed Directory & Component Breakdown

### 1. `server.js` (Core Application Entry Point)
- **Role**: Express web server & API controller.
- **Responsibilities**:
  - Initializes CORS, static file serving (`/public`), and API key authentication.
  - Exposes REST API endpoints (`/api/posts`, `/api/sources`, `/api/pages`).
  - Contains `globalThis.File` polyfill for Node 18 compatibility.
  - Launches 5-minute background automation cycle via `startCronScheduler()`.

### 2. `backend/` (Server Architecture)
- **`backend/publisher/`**:
  - `fb_publisher.js`: Formats multipart form payloads and posts photos/text to Facebook Page Graph API endpoints (`https://graph.facebook.com/v21.0`).
  - `scheduler.js`: Orchestrates the 5-minute interval cycle, scraping fresh news feeds and triggering auto-publishing.
- **`backend/scrapers/`**:
  - `rss_scraper.js`: Parses RSS feeds via `rss-parser` and scrapes original article web pages using `cheerio` to find high-resolution `og:image` tags.
- **`backend/services/`**:
  - `ai_generator.js`: Formats prompt inputs for **Groq** (`llama-3.3-70b-versatile`) and **Google Gemini** (`gemini-1.5-flash`) to output structured Bengali & English posts.
  - `banner_generator.js`: Downloads exact scraped HD cover photos, handles URL parameter cleaning, and generates FLUX.1 cartoon fallback images.
- **`backend/storage/`**:
  - `posts_store.js`: Manages atomic JSON read/write operations to prevent data corruption in `data/posts.json`.

### 3. `public/` (Frontend Single-Page Dashboard)
- `index.html`: Contains app shell layout, navigation tabs, post feed grids, **Side-by-Side Content Studio Modal** (`#enhancementModal`), and **Prompt Studio Modal** (`#promptDialogModal`).
- `styles.css`: Custom CSS design system using Cambria typography, CSS variables, 3D lift animations, and mobile responsive media queries.
- `app.js`: Client-side JavaScript handling post searching, filtering, pinning, AI caption editing, multi-photo gallery rendering, and modal management.

### 4. `data/` (JSON Storage Layer)
- Stores application state locally without requiring heavy external SQL databases.

### 5. `docs/` (Documentation Suite)
- Complete technical documentation numbered from 01 to 08.

### 6. `scripts/` (CLI Testing Utilities)
- CLI utilities for testing scraping (`npm run test-scrape`), AI text (`npm run test-ai`), and banner downloads (`npm run test-banner`).
