# Backend Deployment to Vercel

## Prerequisites
- Vercel account
- Backend code ready in the `server/` directory

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Navigate to server directory
```bash
cd server
```

### 3. Login to Vercel
```bash
vercel login
```

### 4. Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No** (or Yes if you have one)
- Project name? (e.g., `webnewsgenie-api`)
- Directory? **./** (current directory)
- Override settings? **No**

### 5. Set Environment Variables

After deployment, set these environment variables in Vercel dashboard:

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following:

```
NEWSAPI_KEY=your_newsapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_long_random_secret_string
OPENAI_API_KEY=your_openai_key_here (optional)
```

### 6. Redeploy after setting environment variables
```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

## Frontend Configuration

After deploying the backend, you'll get a URL like:
`https://your-backend-name.vercel.app`

### Update Frontend Environment Variable

In your frontend Vercel project (https://webnewsgenie.vercel.app):

1. Go to **Settings** → **Environment Variables**
2. Add:
   ```
   REACT_APP_API_URL=https://your-backend-name.vercel.app
   ```
3. Redeploy the frontend

## Important Notes

⚠️ **Database Limitation**: The current setup uses LowDB with `/tmp` storage, which is **ephemeral** in Vercel serverless functions. Data will not persist between function invocations.

**For production, consider:**
- Vercel KV (Redis) for persistent storage
- MongoDB Atlas
- PostgreSQL with Vercel Postgres
- Supabase or other database services

## Testing

After deployment, test your API:
```bash
curl https://your-backend-name.vercel.app/api/news
```

You should get JSON response with news articles.

