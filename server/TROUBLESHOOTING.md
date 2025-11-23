# Troubleshooting 500 Errors on Vercel

## Current Issues
- Function returns 500 error
- CORS headers not being sent (because function crashes before response)

## Steps to Debug

### 1. Check Vercel Function Logs
1. Go to your Vercel dashboard
2. Select your project (`server-news`)
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **View Function Logs** or **Runtime Logs**
6. Look for error messages

### 2. Verify Environment Variables
Make sure these are set in Vercel dashboard (Settings → Environment Variables):

**Required:**
- `NEWSAPI_KEY` - Your NewsAPI key (required for `/api/news` endpoint)
- `JWT_SECRET` - A random string for JWT signing

**Optional:**
- `GEMINI_API_KEY` - For summarize feature (if not set, summarize will return error but won't crash)
- `OPENAI_API_KEY` - Optional, not used currently

### 3. Test Health Endpoint
After redeploying, test the health endpoint:
```bash
curl https://server-news.vercel.app/api/health
```

This should return:
```json
{"status":"ok","timestamp":"...","environment":"vercel"}
```

If this works, the function is running. If it fails, check the logs.

### 4. Test News Endpoint
```bash
curl https://server-news.vercel.app/api/news
```

If this fails with 500, check:
- Is `NEWSAPI_KEY` set in Vercel?
- Check function logs for the actual error

### 5. Common Issues

#### Issue: "NEWSAPI_KEY not set"
**Solution:** Add `NEWSAPI_KEY` environment variable in Vercel dashboard

#### Issue: Database initialization error
**Solution:** The database uses `/tmp` which should work, but if it fails, the function will still work (database is lazy-loaded)

#### Issue: Module initialization error
**Solution:** Check logs for specific error. Common causes:
- Missing dependencies in `package.json`
- Syntax errors in code
- Environment variable access issues

### 6. Redeploy After Fixes
After making changes:
```bash
cd server
vercel --prod
```

Or push to git and let Vercel auto-deploy.

### 7. Check CORS
Once the function works (returns 200), CORS should work automatically because:
- CORS middleware is configured to allow all origins
- OPTIONS requests are handled

### 8. Local Testing
Test locally first:
```bash
cd server
npm install
node index.js
```

Then test:
```bash
curl http://localhost:7001/api/health
curl http://localhost:7001/api/news
```

## Quick Fix Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] Code has no syntax errors (check with `node index.js` locally)
- [ ] All dependencies in `package.json` are correct
- [ ] Function logs checked in Vercel dashboard
- [ ] Health endpoint tested
- [ ] News endpoint tested with valid `NEWSAPI_KEY`

## If Still Failing

1. Check Vercel function logs for the exact error
2. Test locally to see if the same error occurs
3. Simplify the code temporarily to isolate the issue
4. Check if all npm packages are compatible with Node.js version Vercel uses

