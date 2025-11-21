# NewsGenie Server (Full UX)

Express backend providing:

- `/api/news` & `/api/search` → NewsAPI proxy
- `/api/auth/register` & `/api/auth/login` → JWT auth
- `/api/bookmarks` → per-user bookmark storage (LowDB)
- `/api/summarize` → optional OpenAI-powered summaries

## Setup

1. Go to `server/`:

   ```bash
   cd server
   copy .env.example .env   # or create .env manually
   ```

2. Edit `.env` and fill:

   ```env
   NEWSAPI_KEY=your_newsapi_key_here
   OPENAI_API_KEY=your_openai_api_key_here   # optional
   JWT_SECRET=some_long_random_string
   PORT=5000
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start backend (after building client):

   ```bash
   npm start
   ```

Then open `http://localhost:5000`.
