# Frontend-Backend Integration Setup

## Current Deployment URLs
- **Frontend**: https://newsreponew.vercel.app/
- **Backend**: https://server-news.vercel.app/

## Changes Made

### 1. Frontend API Configuration (`client/src/config/api.js`)
- Updated to use backend URL `https://server-news.vercel.app` in production
- Falls back to proxy for local development
- All API calls now use the `apiFetch` utility function

### 2. Updated All Frontend Components
All components now use the centralized API configuration:
- `Home.jsx` - News fetching
- `Category.jsx` - Category news, bookmarks, summaries
- `Login.jsx` - User authentication
- `Register.jsx` - User registration
- `Bookmarks.jsx` - Bookmark management

### 3. Backend CORS Configuration
- Updated CORS to explicitly allow frontend domain
- Allows requests from `https://newsreponew.vercel.app`
- Maintains localhost support for development

## Next Steps to Deploy

### 1. Rebuild Frontend
```bash
cd client
npm run build
```

### 2. Redeploy Frontend to Vercel
- Push changes to your repository
- Vercel will automatically redeploy, OR
- Manually trigger redeploy from Vercel dashboard

### 3. Redeploy Backend to Vercel
```bash
cd server
vercel --prod
```

Or push changes and let Vercel auto-deploy.

## Testing

After redeployment, test the integration:

1. **Test API directly:**
   ```bash
   curl https://server-news.vercel.app/api/news
   ```

2. **Test from frontend:**
   - Visit https://newsreponew.vercel.app/
   - Check browser console for any CORS errors
   - Verify news articles load correctly

## Environment Variables

### Backend (Vercel)
Make sure these are set in your backend Vercel project:
- `NEWSAPI_KEY`
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `OPENAI_API_KEY` (optional)

### Frontend (Vercel)
Optional - if you want to override the backend URL:
- `REACT_APP_API_URL` (defaults to `https://server-news.vercel.app` in production)

## Troubleshooting

### CORS Errors
If you see CORS errors, verify:
1. Backend CORS configuration includes frontend URL
2. Backend is deployed and accessible
3. Check browser console for specific error messages

### API Not Working
1. Verify backend is deployed: `curl https://server-news.vercel.app/api/news`
2. Check backend logs in Vercel dashboard
3. Verify environment variables are set correctly
4. Check browser network tab for failed requests

### Database Issues
Remember: The current LowDB setup uses ephemeral storage in Vercel serverless functions. Data won't persist between invocations. For production, consider using:
- Vercel KV (Redis)
- MongoDB Atlas
- PostgreSQL with Vercel Postgres
- Supabase

