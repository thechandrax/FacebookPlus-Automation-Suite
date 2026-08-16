# 06. Railway 24/7 Cloud Deployment Guide

## 🚀 Quick Deployment Guide

The repository includes a pre-configured **[railway.json](../railway.json)** file set up for Nixpacks Node 20 LTS environments.

---

## 🛠️ Step-by-Step Railway Deployment

1. **Log in to Railway**:
   Visit **[https://railway.app](https://railway.app)** and log in with GitHub.

2. **Create New Project**:
   Click **"New Project"** ➔ **"Deploy from GitHub repo"** ➔ Select **`thechandrax/FacebookPlus-Automation-Suite`**.

3. **Configure Environment Variables**:
   In the **Variables** tab, add your keys:
   ```env
   DEFAULT_AI_PROVIDER=groq
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key
   HUGGINGFACE_API_KEY=your_huggingface_key
   ```

4. **Generate Public Domain**:
   In **Settings** ➔ **Networking**, click **"Generate Domain"** to get your live URL:
   `https://facebookplus-automation-suite-production.up.railway.app`

---

## 🔧 Node 18 vs Node 20 & Polyfills

- **Node 20 LTS Requirement**: `@google/generative-ai` & `undici` require Node 20+ for global `File` API.
- **Polyfill Protection**: [server.js](../server.js) contains a built-in `globalThis.File` fallback class to guarantee zero runtime crashes on any platform.
- **Auto-Restart**: Built-in `restartPolicyType: "ON_FAILURE"` ensures 24/7 uptime even during network micro-outages.
