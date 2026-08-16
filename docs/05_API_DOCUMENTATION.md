# 05. Complete API Reference

## 🔐 Authentication
If `DASHBOARD_API_KEY` is defined in `.env`, all `/api` endpoints require:
- **Header**: `x-api-key: <YOUR_KEY>`  
- OR **Query Param**: `?apiKey=<YOUR_KEY>`

---

## 📡 Endpoints Overview

### 📰 Posts API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/posts` | Retrieve all scraped & generated posts. |
| `POST` | `/api/posts/trigger-scrape` | Manually trigger a fresh RSS scraper cycle. |
| `PUT` | `/api/posts/:id` | Update post title, caption, attached photos, or category. |
| `POST` | `/api/posts/:id/publish` | Publish post directly to target Facebook page. |
| `POST` | `/api/posts/:id/regenerate-caption` | Trigger AI caption rewrite for post. |
| `POST` | `/api/posts/:id/regenerate-banner` | Trigger AI photo or stock banner generation for post. |

---

### 🌐 Sources & Settings API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/sources` | Retrieve all RSS news sources. |
| `PUT` | `/api/sources/:id` | Update source active toggle or `pinned` priority state. |
| `GET` | `/api/pages` | Retrieve target Facebook pages. |
| `POST` | `/api/settings/ai` | Save AI provider API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, etc.). |
