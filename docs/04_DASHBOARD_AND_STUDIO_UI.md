# 04. Dashboard & Side-by-Side Content Studio

## 🖥️ User Interface Overview

The dashboard UI ([public/index.html](file:///C:/Users/thego/.gemini/antigravity/scratch/Facebook+%20Automation%20Suite/public/index.html)) provides a modern, responsive single-page web app built with Vanilla CSS variables and Cambria typography.

---

## 🎨 Visual Features

### 1. Cambria Typography & Design System
- Global font stack: `'Cambria', Georgia, serif;`
- Custom CSS variables for active primary accents (`#8b5cf6`), soft borders (`#e2e8f0`), and smooth 3D card lift animations (`transform: translateY(-4px)`).

### 2. Side-by-Side AI Workshop Modal (`#enhancementModal`)
- **Left Panel (Original Article)**:
  - Original source title, summary snippet (160px height), and scraped article HD photo (200px height).
- **Right Panel (AI Content Studio)**:
  - 5 Action Toolbar buttons on 1 single row: `🔄 Rewrite`, `🖼️ AI Photo`, `📷 Add Photo`, `💬 Prompts`, `💾 Save & Apply`.
  - Rewritten Bengali/English AI caption textarea (160px height).
  - Multi-photo gallery preview (up to 5 photos) strictly aligned at 200px height matching the left panel.

### 3. Interactive Prompt Studio (`#promptDialogModal`)
- Pop-up modal (`z-index: 300`) with 4 1-click **Vibrant Cartoon Preset Chips**.
- Dedicated `✨ Generate Caption` and `🖼️ Generate Image` trigger buttons.

### 4. Live Sources & Pin-to-Top Feature
- Cards feature persistent `📌 Pin` buttons sorting pinned sources to the top of the feed (`pinned: true`).
- Modern circular SVG close buttons (`.modern-close-btn`) with smooth 90° rotate hover animations.
