const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// Pool of Groq API keys for high-availability auto-rotation
const GROQ_KEYS_POOL = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5
].filter(k => k && k.length > 10);

// ─── Per-page AI prompt builders ─────────────────────────────────────────────

function buildEntertainmentPrompt(newsItem, customPromptText) {
  if (customPromptText && customPromptText.trim()) return customPromptText;
  return `You are a viral Movie & Entertainment social media expert managing a popular Bengali Facebook Page with 500K+ followers.

Movie/Entertainment News Title: ${newsItem.title}
Category: ${newsItem.category}
Source: ${newsItem.sourceName}
Summary: ${newsItem.snippet}
Link: ${newsItem.link}

Write an exciting, viral Facebook post caption in Bengali-English mixed style (NO Hindi/Hinglish at all):
- Start with a CATCHY Bengali headline (বাংলায়) with fire emojis (🎬🔥🍿⭐💥🎭🌟)
- Write 3 punchy bullet points in Bengali about the news — keep it exciting!
- Add a Bengali call-to-action like "আপনার মতামত কমেন্টে জানান!" asking fans to comment & share
- End with 5 trending hashtags in English (#Bollywood #Tollywood #OTT #MovieNews #Entertainment)

IMPORTANT: Use ONLY Bengali and English. Do NOT use Hindi or Hinglish words.
Return ONLY the raw caption text without markdown code fences.`;
}

function buildFinancePrompt(newsItem, customPromptText) {
  if (customPromptText && customPromptText.trim()) return customPromptText;
  return `You are a professional stock market analyst and financial content creator managing a Bengali finance Facebook Page.

Market News Title: ${newsItem.title}
Category: ${newsItem.category}
Source: ${newsItem.sourceName}
Summary: ${newsItem.snippet}
Link: ${newsItem.link}

Write a professional yet engaging Facebook post caption in Bengali-English mixed style (NO Hindi at all):
- Start with a sharp Bengali market alert headline with finance emojis (📈📉💹💰🏦📊⚡)
- Provide 3 clear bullet points with market insights (mix Bengali + English naturally)
- Include a Bengali investor call-to-action like "আপনার মতামত শেয়ার করুন!"
- End with 5 relevant hashtags in English (#StockMarket #NSE #BSE #Nifty #Trading #Sensex)

IMPORTANT: Use ONLY Bengali and English. Do NOT use Hindi or Hinglish words.
Return ONLY the raw caption text.`;
}

function buildNewsPrompt(newsItem, customPromptText) {
  if (customPromptText && customPromptText.trim()) return customPromptText;
  return `You are an expert viral social media manager for a leading West Bengal Facebook Page covering news, school/college updates, weather, and social events.

News Title: ${newsItem.title}
Category: ${newsItem.category}
Source: ${newsItem.sourceName}
Summary: ${newsItem.snippet}
Link: ${newsItem.link}

Write a catchy Bengali-English mixed Facebook post caption:
- Start with a catchy Bengali headline (বাংলা) with viral emojis (📢📌🏫⚡🗞️)
- Provide 3 clear bullet points highlighting key details in Bengali
- Include a high-engagement call to action asking followers to like, comment & share
- End with 5 trending hashtags (#WestBengalNews #Kolkata #BengalUpdates #WBEducation #BanglaNews)

Return ONLY the raw post caption text without markdown code fences.`;
}

function buildPrompt(newsItem, aiStyle, customPromptText) {
  switch (aiStyle) {
    case 'entertainment': return buildEntertainmentPrompt(newsItem, customPromptText);
    case 'finance':       return buildFinancePrompt(newsItem, customPromptText);
    default:              return buildNewsPrompt(newsItem, customPromptText);
  }
}

// ─── Smart Template Fallbacks ─────────────────────────────────────────────────

function entertainmentFallback(newsItem) {
  const d = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `🎬🔥 **বিনোদন আপডেট | ${d}**\n\n⭐ **${newsItem.title}**\n\n🍿 বিস্তারিত:\n• ${newsItem.snippet || 'Bollywood ও Entertainment জগতের সর্বশেষ খবর!'}\n• বিভাগ: ${newsItem.category || 'Movies & Entertainment'}\n• সূত্র: ${newsItem.sourceName || 'Entertainment News'}\n\n💬 আপনার মতামত কমেন্টে জানান ও বন্ধুদের সাথে শেয়ার করুন!\n\n#Bollywood #Tollywood #OTT #MovieNews #Entertainment #BengaliCinema`;
}

function financeFallback(newsItem) {
  const d = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `📈 **বাজার আপডেট | Market Update | ${d}**\n\n💹 **${newsItem.title}**\n\n📊 মূল তথ্য / Key Highlights:\n• ${newsItem.snippet || 'ভারতীয় শেয়ার বাজারের গুরুত্বপূর্ণ আপডেট।'}\n• বিভাগ: ${newsItem.category || 'Stock Market'}\n• সূত্র: ${newsItem.sourceName || 'Financial News'}\n\n💬 আপনার বিনিয়োগের মতামত কমেন্টে শেয়ার করুন!\n\n#StockMarket #NSE #BSE #Nifty #Sensex #Trading #Investing #ShareBajar`;
}

function newsFallback(newsItem) {
  const d = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `📢 **পশ্চিমবঙ্গ সাম্প্রতিক সংবাদ | West Bengal Update** (${d})\n\n📌 **${newsItem.title}**\n\n📰 **প্রধান তথ্য / Highlights:**\n• ${newsItem.snippet || 'পশ্চিমবঙ্গের সর্বশেষ গুরুত্বপূর্ন আপডেট।'}\n• **ক্যাটেগরি:** ${newsItem.category || 'পশ্চিমবঙ্গ খবর'}\n• **উৎস:** ${newsItem.sourceName || 'ওয়েস্ট বেঙ্গল মিডিয়া'}\n\n👇 আপনার মতামত কমেন্টে লিখে জানান!\n\n#WestBengalNews #KolkataUpdates #WestBengal #BengalEducation #Kolkata #BengalNews`;
}

function buildFallback(newsItem, aiStyle) {
  switch (aiStyle) {
    case 'entertainment': return entertainmentFallback(newsItem);
    case 'finance':       return financeFallback(newsItem);
    default:              return newsFallback(newsItem);
  }
}

// ─── Main Generator ───────────────────────────────────────────────────────────

async function generateFacebookCaption(newsItem, preferredLanguage = 'bengali_english_mixed', provider = null, customPromptText = null, aiStyle = 'news') {
  const selectedProvider = provider || process.env.DEFAULT_AI_PROVIDER || 'groq';
  const geminiKey = process.env.GEMINI_API_KEY;
  const prompt = buildPrompt(newsItem, aiStyle, customPromptText);

  // 1. Try Groq key pool
  if (selectedProvider === 'groq' || selectedProvider === 'auto') {
    for (const key of GROQ_KEYS_POOL) {
      try {
        console.log(`[AI Generator] Groq (${aiStyle} style) key ...${key.slice(-6)}`);
        const groq = new Groq({ apiKey: key });
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: aiStyle === 'entertainment' ? 0.85 : (aiStyle === 'finance' ? 0.5 : 0.7),
          max_tokens: 900
        });
        const text = completion.choices[0]?.message?.content?.trim();
        if (text) {
          console.log(`[AI Generator] Caption generated via Groq (${aiStyle})!`);
          return text;
        }
      } catch (err) {
        console.error(`[AI Generator] Groq key ...${key.slice(-6)} failed: ${err.message}`);
      }
    }
  }

  // 2. Gemini fallback
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      console.log(`[AI Generator] Trying Gemini API (${aiStyle} style)...`);
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = (await result.response).text().trim();
      if (text) {
        console.log(`[AI Generator] Caption generated via Gemini (${aiStyle})!`);
        return text;
      }
    } catch (err) {
      console.error('[AI Generator] Gemini failed:', err.message);
    }
  }

  // 3. Smart template fallback
  console.log(`[AI Generator] Using template fallback (${aiStyle}).`);
  return buildFallback(newsItem, aiStyle);
}

// Alias used by server.js
const generatePostCaption = generateFacebookCaption;

module.exports = { generateFacebookCaption, generatePostCaption };
