# 03. AI & Banner Generation Engine

## 🎨 Image Processing & HD Scraper Pipeline

The application features a strict 4-step image resolution pipeline:

1. **Step #1 — Exact Original Article HD Image**:
   - Parses `og:image:secure_url`, `og:image`, `twitter:image`, and article `<figure> img`.
   - Cleans resolution query parameters (`?w=1200`, `/large/`) to extract uncompressed 1080p+ cover photos.

2. **Step #2 — Pollinations FLUX.1 AI Image Generation**:
   - If 0 images exist on the news article, triggers FLUX.1 AI generation using category-tuned cartoon prompts.

3. **Step #3 — Diverse Topic Stock Pool**:
   - Fallback pool categorized into *Movies*, *Finance*, *West Bengal News*, and *General* using a hash algorithm for maximum visual diversity.

4. **Step #4 — Clean Canvas Overlay**:
   - Renders 1080x1350 vertical portrait aspect ratios ideal for Facebook feed posts.

---

## 🎨 FLUX.1 Vibrant Cartoon Prompt Presets

Pre-tuned prompts configured in **Prompt Studio**:

* **🎨 General Colorful Cartoon**:
  ```text
  Vibrant colorful 2D cartoon illustration, bold thick outlines, flat saturated colors, playful children's book art style, bright rainbow palette, high contrast
  ```

* **🎬 Movies & OTT**:
  ```text
  Colorful cartoon illustration of a movie theater, popcorn and film reel, bold outlines, flat bright colors, festive Bollywood poster style, rainbow color palette
  ```

* **📈 Trading & Stock Market**:
  ```text
  Colorful flat cartoon illustration of stock market growth, bold outlines, bright green and gold chart, playful business icons, vibrant saturated colors
  ```

* **📰 News & West Bengal**:
  ```text
  Colorful cartoon illustration of Kolkata cityscape, Howrah Bridge, bold outlines, flat bright colors, cheerful poster art style, vibrant palette
  ```
