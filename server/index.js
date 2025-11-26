// // Wrap everything in try-catch to prevent module-level crashes
// try {
// const express = require('express');
// const cors = require('cors');
// const fetch = require('node-fetch');
// const dotenv = require('dotenv');
// const path = require('path');
// // LowDB v6+ is ES Module, so we'll use dynamic import
// // const { Low } = require('lowdb');
// // const { JSONFile } = require('lowdb/node');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const OpenAI = require('openai');

// dotenv.config();
// const app = express();

// // CORS configuration - allow all origins for Vercel deployment
// // This ensures CORS works properly in serverless environment
// app.use(cors({
//   origin: true, // Allow all origins
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));

// // Handle OPTIONS requests for CORS preflight
// app.options('*', cors());

// app.use(express.json());

// const NEWS_API_KEY = process.env.NEWSAPI_KEY || '';
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
// const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
// const PORT = process.env.PORT || 7001;

// // OpenAI setup (optional) - lazy initialization to prevent module-level errors
// let openai = null;
// try {
//   if (OPENAI_API_KEY) {
//     openai = new OpenAI({ apiKey: OPENAI_API_KEY });
//   }
// } catch (error) {
//   console.error('OpenAI initialization error:', error);
// }

// // LowDB setup with default data
// // Use /tmp for Vercel serverless (ephemeral storage)
// // Note: Data won't persist between function invocations in serverless mode
// // For production, consider using Vercel KV, MongoDB, or another database service
// let db = null;
// let Low = null;
// let JSONFile = null;
// const defaultData = { users: [], bookmarks: [] };

// // Dynamic import for lowdb (ES Module)
// async function initLowdb() {
//   if (!Low || !JSONFile) {
//     try {
//       const lowdbModule = await import('lowdb');
//       const nodeModule = await import('lowdb/node');
//       Low = lowdbModule.Low;
//       JSONFile = nodeModule.JSONFile;
//     } catch (error) {
//       console.error('Failed to import lowdb:', error);
//       throw error;
//     }
//   }
// }

// async function getDb() {
//   if (!db) {
//     try {
//       await initLowdb();
//       const dbFile = process.env.VERCEL 
//         ? path.join('/tmp', 'db.json')
//         : path.join(__dirname, 'db.json');
//       const adapter = new JSONFile(dbFile);
//       db = new Low(adapter, defaultData);
//     } catch (error) {
//       console.error('Database initialization error:', error);
//       // Create a minimal in-memory database as fallback
//       db = { data: defaultData, read: async () => {}, write: async () => {} };
//     }
//   }
//   return db;
// }

// // Initialize database - make it safe for serverless
// async function initDb() {
//   try {
//     const currentDb = await getDb();
//     await currentDb.read();
//     if (!currentDb.data) {
//       currentDb.data = defaultData;
//       await currentDb.write();
//     }
//   } catch (error) {
//     console.error('Database init error:', error);
//     // Initialize with default data if read fails
//     try {
//       const currentDb = await getDb();
//       currentDb.data = defaultData;
//       await currentDb.write();
//     } catch (writeError) {
//       console.error('Database write error:', writeError);
//     }
//   }
// }

// // Initialize database lazily - don't block module load
// let dbInitialized = false;
// async function ensureDb() {
//   const currentDb = await getDb();
//   if (!dbInitialized) {
//     await initDb();
//     dbInitialized = true;
//   }
//   return currentDb;
// }

// // Don't initialize at module level - let it be lazy

// function generateToken(user) {
//   return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
// }

// // Health check endpoint - test if server is working
// app.get('/api/health', (req, res) => {
//   try {
//     res.json({ 
//       status: 'ok', 
//       timestamp: new Date().toISOString(),
//       environment: process.env.VERCEL ? 'vercel' : 'local',
//       hasNewsApiKey: !!process.env.NEWSAPI_KEY,
//       hasJwtSecret: !!process.env.JWT_SECRET
//     });
//   } catch (error) {
//     console.error('Health check error:', error);
//     res.status(500).json({ error: 'Health check failed', message: error.message });
//   }
// });

// // -------- Auth Routes --------
// app.post('/api/auth/register', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ error: 'Missing email or password' });

//     const currentDb = await ensureDb();
//     await currentDb.read();
//     const exists = currentDb.data.users.find(u => u.email === email.toLowerCase());
//     if (exists) return res.status(400).json({ error: 'User already exists' });

//     const hash = await bcrypt.hash(password, 10);
//     const id = Date.now();
//     const user = { id, email: email.toLowerCase(), password: hash };

//     currentDb.data.users.push(user);
//     await currentDb.write();

//     const token = generateToken(user);
//     res.json({ token, user: { id: user.id, email: user.email } });
//   } catch (error) {
//     console.error('Register error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.post('/api/auth/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ error: 'Missing email or password' });

//     const currentDb = await ensureDb();
//     await currentDb.read();
//     const user = currentDb.data.users.find(u => u.email === email.toLowerCase());
//     if (!user) return res.status(400).json({ error: 'Invalid credentials' });

//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

//     const token = generateToken(user);
//     res.json({ token, user: { id: user.id, email: user.email } });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // -------- JWT Middleware --------
// function authenticateToken(req, res, next) {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
//   if (!token) return res.sendStatus(401);

//   jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) return res.sendStatus(403);
//     req.user = user;
//     next();
//   });
// }

// // -------- Bookmarks --------
// app.get('/api/bookmarks', authenticateToken, async (req, res) => {
//   try {
//     const currentDb = await ensureDb();
//     await currentDb.read();
//     const items = currentDb.data.bookmarks.filter(b => b.userId === req.user.id);
//     res.json(items);
//   } catch (error) {
//     console.error('Get bookmarks error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.post('/api/bookmarks', authenticateToken, async (req, res) => {
//   try {
//     const item = req.body;
//     if (!item || !item.title)
//       return res.status(400).json({ error: 'Invalid bookmark' });

//     const currentDb = await ensureDb();
//     await currentDb.read();
//     const bookmark = {
//       id: Date.now(),
//       userId: req.user.id,
//       ...item,
//       createdAt: new Date().toISOString(),
//     };

//     currentDb.data.bookmarks.push(bookmark);
//     await currentDb.write();
//     res.json({ ok: true, bookmark });
//   } catch (error) {
//     console.error('Create bookmark error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // -------- NewsAPI Proxy --------
// app.get('/api/news', async (req, res) => {
//   try {
//     const category = req.query.category || '';
//     const q = category ? `&category=${encodeURIComponent(category)}` : '';
//     if (!NEWS_API_KEY) {
//       return res.status(500).json({ error: 'Server: NEWSAPI_KEY not set in .env' });
//     }

//     const url = `https://newsapi.org/v2/top-headlines?language=en${q}&pageSize=20&apiKey=${NEWS_API_KEY}`;
//     const r = await fetch(url);
//     if (!r.ok) {
//       const errorText = await r.text();
//       return res.status(r.status).json({ error: `NewsAPI error: ${errorText}` });
//     }
//     const data = await r.json();
//     res.json(data);
//   } catch (e) {
//     console.error('News API error:', e);
//     res.status(500).json({ error: e.message || 'Failed to fetch news' });
//   }
// });

// app.get('/api/search', async (req, res) => {
//   try {
//     const q = req.query.q;
//     if (!q) return res.status(400).json({ error: 'Missing q parameter' });
//     if (!NEWS_API_KEY) {
//       return res.status(500).json({ error: 'Server: NEWSAPI_KEY not set in .env' });
//     }

//     const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=20&apiKey=${NEWS_API_KEY}`;
//     const r = await fetch(url);
//     if (!r.ok) {
//       const errorText = await r.text();
//       return res.status(r.status).json({ error: `NewsAPI error: ${errorText}` });
//     }
//     const data = await r.json();
//     res.json(data);
//   } catch (e) {
//     console.error('Search API error:', e);
//     res.status(500).json({ error: e.message || 'Failed to search news' });
//   }
// });

// // GEMINI IMPORT (v1) - lazy load to prevent module-level errors
// let GoogleGenerativeAI = null;
// let genAI = null;

// function getGenAI() {
//   if (!genAI && process.env.GEMINI_API_KEY) {
//     try {
//       if (!GoogleGenerativeAI) {
//         GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
//       }
//       genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//     } catch (error) {
//       console.error('Gemini initialization error:', error);
//     }
//   }
//   return genAI;
// }

// // Summarize with Gemini (correct endpoint, works)
// app.post("/api/summarize", async (req, res) => {
//   try {
//     const genAIInstance = getGenAI();
//     if (!genAIInstance) {
//       return res.status(500).json({ error: "Gemini API not configured. Please set GEMINI_API_KEY." });
//     }

//     const { url, content } = req.body;

//     let text = content;

//     if (!text && url) {
//       const r = await fetch(url);
//       text = await r.text();
//     }

//     if (!text) {
//       return res.status(400).json({ error: "Missing content or URL" });
//     }

//     // Use correct model (v1 endpoint)
//     const model = genAIInstance.getGenerativeModel({ model: "gemini-1.5-flash" });

//     const result = await model.generateContent([
//       `Summarize into 3 bullet points:\n\n${text.slice(0, 4000)}`
//     ]);

//     const summary = result.response.text();
//     res.json({ summary });

//   } catch (err) {
//     console.error("GEMINI ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // -------- Serve React build (only in local development) --------
// // In Vercel, the frontend is deployed separately, so we don't serve static files
// if (process.env.VERCEL !== '1') {
//   // Serve static files (only if file exists, otherwise calls next())
//   app.use(express.static(path.join(__dirname, '../client/build')));

//   // Catch-all route: serve index.html for non-API routes (React Router)
//   // API routes are defined above, so they will be matched first
//   app.get('*', (req, res) => {
//     // Safety check: Don't serve index.html for API routes
//     if (req.path.startsWith('/api/')) {
//       return res.status(404).json({ error: 'API endpoint not found' });
//     }
//     res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
//   });
// }

// // Global error handler - catch any unhandled errors
// app.use((err, req, res, next) => {
//   console.error('Unhandled error:', err);
//   res.status(500).json({ error: 'Internal server error', message: err.message });
// });

// // 404 handler for API routes
// app.use('/api/*', (req, res) => {
//   res.status(404).json({ error: 'API endpoint not found' });
// });

// // Export for Vercel serverless
// module.exports = app;

// // Only listen if not in Vercel environment
// if (process.env.VERCEL !== '1') {
//   app.listen(PORT, () =>
//     console.log(`✅ NewsGenie server running on port ${PORT}`)
//   );
// }

// } catch (error) {
//   // If module initialization fails, create a minimal error handler
//   console.error('Module initialization error:', error);
//   const express = require('express');
//   const app = express();
//   app.use((req, res) => {
//     res.status(500).json({ 
//       error: 'Server initialization failed', 
//       message: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   });
//   module.exports = app;
// }


// index.js — Full server with extraction + OpenAI bullet summaries (• bullets)
// Works locally (app.listen) and on Vercel (exports handler)
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const path = require("path");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Debug route to check which API key the backend is actually using
app.get("/debug-key", (req, res) => {
  res.json({
    using_key: process.env.OPENAI_API_KEY || "NOT_FOUND",
    running_on_vercel: !!process.env.VERCEL
  });
});

// Environment
const NEWS_API_KEY = process.env.NEWSAPI_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const PORT = process.env.PORT || 7300;

// LowDB
const dbFile = path.join(__dirname, "db.json");
const adapter = new JSONFile(dbFile);
const defaultData = { users: [], bookmarks: [] };
const db = new Low(adapter, defaultData);

async function initDb() {
  try {
    await db.read();
    if (!db.data) db.data = defaultData;
    await db.write();
  } catch (e) {
    // fallback to in-memory minimal DB if file system isn't writable (serverless)
    console.warn("LowDB init warning:", e && e.message ? e.message : e);
    if (!db.data) db.data = defaultData;
  }
}
initDb();

// JWT helper
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "8h",
  });
}

// -------------------- AUTH --------------------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing email or password" });

    await db.read();
    const exists = db.data.users.find((u) => u.email === email.toLowerCase());
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const id = Date.now();

    const user = { id, email: email.toLowerCase(), password: hash };
    db.data.users.push(user);
    // attempt write; ignore if running in ephemeral read-only fs
    try { await db.write(); } catch (e) { console.warn("DB write skipped:", e && e.message ? e.message : e); }

    const token = generateToken(user);
    res.json({ token, user: { id, email } });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing email or password" });

    await db.read();
    const user = db.data.users.find((u) => u.email === email.toLowerCase());
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email } });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- AUTH MIDDLEWARE --------------------
function authenticate(req, res, next) {
  const auth = req.headers["authorization"];
  const token = auth && auth.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// -------------------- BOOKMARKS --------------------
app.get("/api/bookmarks", authenticate, async (req, res) => {
  await db.read();
  res.json(db.data.bookmarks ? db.data.bookmarks.filter((b) => b.userId === req.user.id) : []);
});

app.post("/api/bookmarks", authenticate, async (req, res) => {
  try {
    const item = req.body;
    if (!item || !item.title)
      return res.status(400).json({ error: "Invalid bookmark" });

    await db.read();
    const bookmark = {
      id: Date.now(),
      userId: req.user.id,
      ...item,
      createdAt: new Date().toISOString(),
    };

    if (!db.data.bookmarks) db.data.bookmarks = [];
    db.data.bookmarks.push(bookmark);
    try { await db.write(); } catch (e) { console.warn("DB write skipped:", e && e.message ? e.message : e); }
    res.json({ ok: true, bookmark });
  } catch (err) {
    console.error("BOOKMARK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- NEWS API --------------------
app.get("/api/news", async (req, res) => {
  try {
    const category = req.query.category || "";
    if (!NEWS_API_KEY)
      return res.status(500).json({ error: "NEWSAPI_KEY missing" });

    const url = `https://newsapi.org/v2/top-headlines?language=en${category ? `&category=${encodeURIComponent(category)}` : ""
      }&pageSize=20&apiKey=${NEWS_API_KEY}`;

    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("NEWS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Missing q" });
    if (!NEWS_API_KEY)
      return res.status(500).json({ error: "NEWSAPI_KEY missing" });

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      q
    )}&pageSize=20&apiKey=${NEWS_API_KEY}`;

    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- EXTRACTION ENGINE --------------------
async function extractArticleText(url, html) {
  // Try LD+JSON articleBody
  try {
    const jsonMatches = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const match of jsonMatches) {
      try {
        const json = JSON.parse(match[1].trim());
        if (!json) continue;
        if (typeof json === "object" && json.articleBody && json.articleBody.length > 200) {
          return json.articleBody;
        }
        // array case
        if (Array.isArray(json)) {
          for (const block of json) {
            if (block && block.articleBody && block.articleBody.length > 200) return block.articleBody;
          }
        }
      } catch (e) { /* ignore JSON parse errors */ }
    }
  } catch (e) { }

  // Build DOM once for subsequent selectors
  let dom;
  try {
    dom = new JSDOM(html, { url });
  } catch (e) {
    dom = null;
  }

  // Site-specific: NBCSports, ESPN, etc.
  try {
    if (dom) {
      const doc = dom.window.document;
      // NBCSports
      const nbc = doc.querySelector(".article-body__content");
      if (nbc && nbc.textContent.trim().length > 200) return nbc.textContent.trim();

      // ESPN common containers
      const espn = doc.querySelector(".article-body, .article__body, .article-content");
      if (espn && espn.textContent.trim().length > 200) return espn.textContent.trim();
    }
  } catch (e) { }

  // Generic selectors
  try {
    if (dom) {
      const doc = dom.window.document;
      const selectors = [
        "article",
        ".story-body",
        ".story-content",
        ".article-content",
        ".post-content",
        ".entry-content",
        "#main-content",
        ".content-body",
        ".article__content",
        ".mw-parser-output" // wikipedia-like
      ];
      for (const sel of selectors) {
        const el = doc.querySelector(sel);
        if (el && el.textContent && el.textContent.trim().length > 200) {
          return el.textContent.trim();
        }
      }
    }
  } catch (e) { }

  // Readability
  try {
    if (dom) {
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      if (article && article.textContent && article.textContent.length > 200) {
        return article.textContent;
      }
    }
  } catch (e) { }

  // Fallback: clean HTML to plain text
  try {
    const cleanText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<\/(p|div|br)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanText.length > 200) return cleanText;
  } catch (e) { }

  // Give up
  return "";
}

// -------------------- SUMMARIZER (OpenAI Responses API) --------------------
app.post("/api/summarize", async (req, res) => {
  try {
    const { url, content } = req.body;

    if (!OPENAI_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    // If content provided directly, prefer it
    let extractedText = content && content.trim() ? content.trim() : "";

    // If URL provided, fetch HTML and extract
    if ((!extractedText || extractedText.length < 50) && url) {
      try {
        const page = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
          },
        });
        const html = await page.text();
        extractedText = await extractArticleText(url, html);
      } catch (err) {
        console.warn("Fetch/extract error:", err && err.message ? err.message : err);
      }
    }

    if (!extractedText || extractedText.length < 50) {
      return res.json({ summary: "⚠ Could not extract article content.", bullets: [] });
    }

    // Prompt: force exactly 5 bullets starting with "• "
    const prompt = [
      {
        role: "user",
        content:
          `Summarize the article into EXACTLY 5 important bullet points.
Rules:
- Each bullet MUST start with the bullet character \"• \" (bullet + space).
- Produce exactly 5 bullets (no numbering, no extra text).
- Keep each bullet 1-2 short sentences.
- Keep it factual, remove ads, promotions, unrelated links, and author bio.
- If the article contains opinions, label them as opinion in parentheses.

ARTICLE:
${extractedText.slice(0, 7000)}`
      }
    ];

    // Call OpenAI Responses API
    const openaiResp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_output_tokens: 450,
        input: prompt,
      }),
    });

    const data = await openaiResp.json();

    // Extract text blocks robustly
    let rawText = "";
    try {
      const out = data.output || data.choices || [];
      if (Array.isArray(out) && out.length > 0) {
        for (const item of out) {
          if (typeof item === "string") {
            rawText += item + "\n";
          } else if (item?.content && Array.isArray(item.content)) {
            for (const c of item.content) {
              if (c?.text) rawText += c.text + "\n";
            }
          } else if (item?.text) {
            rawText += item.text + "\n";
          }
        }
      } else if (data?.choices?.[0]?.message?.content) {
        rawText = data.choices[0].message.content;
      } else {
        rawText = JSON.stringify(data);
      }
    } catch (err) {
      rawText = data?.output?.[0]?.text || data?.choices?.[0]?.text || JSON.stringify(data);
    }

    rawText = (rawText || "").trim();

    // Normalize bullets: ensure lines starting with bullet char
    let formatted = rawText
      .replace(/\r/g, "")
      .replace(/\n{2,}/g, "\n")
      .replace(/^\s*-\s+/gm, "• ")
      .replace(/^\s*\*\s+/gm, "• ")
      .replace(/^\s*\d+\.\s+/gm, "• ")
      .trim();

    const lines = formatted.split("\n").map((ln) => ln.trim()).filter(Boolean);

    let bullets = lines.filter((l) => l.startsWith("• "));
    if (bullets.length < 5) {
      const sentences = formatted.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
      bullets = sentences.slice(0, 5).map(s => "• " + s.replace(/\s+/g, " "));
    }

    if (bullets.length > 5) bullets = bullets.slice(0, 5);
    while (bullets.length < 5) bullets.push("• (summary unavailable)");

    const finalSummary = bullets.join("\n");
    const bulletsArray = bullets.map((b) => b.replace(/^•\s*/, "").trim());

    res.json({ summary: finalSummary, bullets: bulletsArray });
  } catch (err) {
    console.error("SUMMARIZE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- STATIC FRONTEND --------------------
// Serve the built React app only in non-Vercel (local) mode OR if client build exists.
// If you're deploying frontend separately on Vercel, you can remove or keep this.
const clientBuildPath = path.join(__dirname, "../client/build");
try {
  // only mount static if folder exists to avoid errors on serverless
  // (fs check is avoided here; in most setups client/build will exist locally)
  if (!process.env.VERCEL) {
    app.use(express.static(clientBuildPath));
    app.get("/preview", (req, res) => {
      res.sendFile(path.join(__dirname, "../client/public/newsgenie_preview_lightmode.html"));
    });
    app.get("*", (req, res) => res.sendFile(path.join(clientBuildPath, "index.html")));
  } else {
    // When on Vercel, do not serve the client build here — frontend should be routed by vercel.json
    app.get("/", (req, res) => res.json({ status: "NewsGenie API (vercel serverless)", routes: "/api/*" }));
  }
} catch (e) {
  console.warn("Static serve skipped:", e && e.message ? e.message : e);
}

// -------------------- START / EXPORT --------------------
// If running on Vercel, export handler; otherwise start server
if (process.env.VERCEL) {
  // Export a Node handler for Vercel (@vercel/node expects module.exports = (req,res) => {})
  module.exports = (req, res) => {
    // Simple wrapper to ensure express handles the request
    app(req, res);
  };
} else {
  app.listen(PORT, () => console.log(`🚀 NewsGenie Server running at http://localhost:${PORT}`));
  // also export app for tests or external use
  module.exports = app;
}
