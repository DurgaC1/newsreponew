# NewsGenie Full UX (Frontend + Backend)

This is your fullstack NewsGenie app:

- Express backend (`server/`) with NewsAPI, JWT auth, bookmarks, optional OpenAI summaries
- React + Tailwind frontend (`client/`) with:
  - Hero layout home page (Top Headlines)
  - Category pages `/category/:category`
  - Compact sidebar
  - Modern login/register cards
  - Bookmarks page

## How to run

1. **Client (build)**

```bash
cd client
npm install
npm run build
```

2. **Server**

```bash
cd ../server
copy .env.example .env   # then edit .env with your keys
npm install
npm start
```

3. Open browser at:

- http://localhost:5000
