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

// CORS configuration - allow frontend domain
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://newsreponew.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
};
app.use(cors(corsOptions));
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

async function initDb() {
  await db.read();
  if (!db.data) db.data = defaultData;
  await db.write();
}
initDb();

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
}

// -------- Auth Routes --------
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Missing email or password' });

  await db.read();
  const exists = db.data.users.find(u => u.email === email.toLowerCase());
  if (exists) return res.status(400).json({ error: 'User already exists' });

  const hash = await bcrypt.hash(password, 10);
  const id = Date.now();
  const user = { id, email: email.toLowerCase(), password: hash };

  db.data.users.push(user);
  await db.write();

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Missing email or password' });

  await db.read();
  const user = db.data.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email: user.email } });
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
  await db.read();
  const items = db.data.bookmarks.filter(b => b.userId === req.user.id);
  res.json(items);
});

app.post('/api/bookmarks', authenticateToken, async (req, res) => {
  const item = req.body;
  if (!item || !item.title)
    return res.status(400).json({ error: 'Invalid bookmark' });

  await db.read();
  const bookmark = {
    id: Date.now(),
    userId: req.user.id,
    ...item,
    createdAt: new Date().toISOString(),
  };

  db.data.bookmarks.push(bookmark);
  await db.write();
  res.json({ ok: true, bookmark });
});

// -------- NewsAPI Proxy --------
app.get('/api/news', async (req, res) => {
  const category = req.query.category || '';
  const q = category ? `&category=${encodeURIComponent(category)}` : '';
  if (!NEWS_API_KEY)
    return res.status(500).json({ error: 'Server: NEWSAPI_KEY not set in .env' });

  try {
    const url = `https://newsapi.org/v2/top-headlines?language=en${q}&pageSize=20&apiKey=${NEWS_API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing q parameter' });
  if (!NEWS_API_KEY)
    return res.status(500).json({ error: 'Server: NEWSAPI_KEY not set in .env' });

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=20&apiKey=${NEWS_API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GEMINI IMPORT (v1)
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Summarize with Gemini (correct endpoint, works)
app.post("/api/summarize", async (req, res) => {
  try {
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

// Export for Vercel serverless
module.exports = app;

// Only listen if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () =>
    console.log(`✅ NewsGenie server running on port ${PORT}`)
  );
}
