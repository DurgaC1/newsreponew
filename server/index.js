const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');

dotenv.config();
const app = express();

// CORS configuration - allow all origins for Vercel deployment
// This ensures CORS works properly in serverless environment
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle OPTIONS requests for CORS preflight
app.options('*', cors());

app.use(express.json());

const NEWS_API_KEY = process.env.NEWSAPI_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const PORT = process.env.PORT || 7001;

// OpenAI setup (optional)
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// LowDB setup with default data
// Use /tmp for Vercel serverless (ephemeral storage)
// Note: Data won't persist between function invocations in serverless mode
// For production, consider using Vercel KV, MongoDB, or another database service
const dbFile = process.env.VERCEL 
  ? path.join('/tmp', 'db.json')
  : path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const defaultData = { users: [], bookmarks: [] };
const db = new Low(adapter, defaultData);

// Initialize database - make it safe for serverless
async function initDb() {
  try {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
  } catch (error) {
    console.error('Database init error:', error);
    // Initialize with default data if read fails
    db.data = defaultData;
    try {
      await db.write();
    } catch (writeError) {
      console.error('Database write error:', writeError);
    }
  }
}

// Initialize database lazily - don't block module load
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
  return db;
}

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
}

// Health check endpoint - test if server is working
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : 'local'
  });
});

// -------- Auth Routes --------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Missing email or password' });

    const currentDb = await ensureDb();
    await currentDb.read();
    const exists = currentDb.data.users.find(u => u.email === email.toLowerCase());
    if (exists) return res.status(400).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);
    const id = Date.now();
    const user = { id, email: email.toLowerCase(), password: hash };

    currentDb.data.users.push(user);
    await currentDb.write();

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Missing email or password' });

    const currentDb = await ensureDb();
    await currentDb.read();
    const user = currentDb.data.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------- JWT Middleware --------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// -------- Bookmarks --------
app.get('/api/bookmarks', authenticateToken, async (req, res) => {
  try {
    const currentDb = await ensureDb();
    await currentDb.read();
    const items = currentDb.data.bookmarks.filter(b => b.userId === req.user.id);
    res.json(items);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/bookmarks', authenticateToken, async (req, res) => {
  try {
    const item = req.body;
    if (!item || !item.title)
      return res.status(400).json({ error: 'Invalid bookmark' });

    const currentDb = await ensureDb();
    await currentDb.read();
    const bookmark = {
      id: Date.now(),
      userId: req.user.id,
      ...item,
      createdAt: new Date().toISOString(),
    };

    currentDb.data.bookmarks.push(bookmark);
    await currentDb.write();
    res.json({ ok: true, bookmark });
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------- NewsAPI Proxy --------
app.get('/api/news', async (req, res) => {
  try {
    const category = req.query.category || '';
    const q = category ? `&category=${encodeURIComponent(category)}` : '';
    if (!NEWS_API_KEY) {
      return res.status(500).json({ error: 'Server: NEWSAPI_KEY not set in .env' });
    }

    const url = `https://newsapi.org/v2/top-headlines?language=en${q}&pageSize=20&apiKey=${NEWS_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) {
      const errorText = await r.text();
      return res.status(r.status).json({ error: `NewsAPI error: ${errorText}` });
    }
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error('News API error:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch news' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Missing q parameter' });
    if (!NEWS_API_KEY) {
      return res.status(500).json({ error: 'Server: NEWSAPI_KEY not set in .env' });
    }

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=20&apiKey=${NEWS_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) {
      const errorText = await r.text();
      return res.status(r.status).json({ error: `NewsAPI error: ${errorText}` });
    }
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error('Search API error:', e);
    res.status(500).json({ error: e.message || 'Failed to search news' });
  }
});

// GEMINI IMPORT (v1) - lazy load to prevent module-level errors
let GoogleGenerativeAI = null;
let genAI = null;

function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    try {
      if (!GoogleGenerativeAI) {
        GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
      }
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } catch (error) {
      console.error('Gemini initialization error:', error);
    }
  }
  return genAI;
}

// Summarize with Gemini (correct endpoint, works)
app.post("/api/summarize", async (req, res) => {
  try {
    const genAIInstance = getGenAI();
    if (!genAIInstance) {
      return res.status(500).json({ error: "Gemini API not configured. Please set GEMINI_API_KEY." });
    }

    const { url, content } = req.body;

    let text = content;

    if (!text && url) {
      const r = await fetch(url);
      text = await r.text();
    }

    if (!text) {
      return res.status(400).json({ error: "Missing content or URL" });
    }

    // Use correct model (v1 endpoint)
    const model = genAIInstance.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      `Summarize into 3 bullet points:\n\n${text.slice(0, 4000)}`
    ]);

    const summary = result.response.text();
    res.json({ summary });

  } catch (err) {
    console.error("GEMINI ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------- Serve React build (only in local development) --------
// In Vercel, the frontend is deployed separately, so we don't serve static files
if (process.env.VERCEL !== '1') {
  // Serve static files (only if file exists, otherwise calls next())
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Catch-all route: serve index.html for non-API routes (React Router)
  // API routes are defined above, so they will be matched first
  app.get('*', (req, res) => {
    // Safety check: Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Global error handler - catch any unhandled errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Export for Vercel serverless
module.exports = app;

// Only listen if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () =>
    console.log(`✅ NewsGenie server running on port ${PORT}`)
  );
}
