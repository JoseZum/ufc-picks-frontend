# UFC Picks Frontend - Deployment Guide (Vercel)

## Prerequisites

1. **Backend deployed** - Deploy the backend to Render first (see `backend/DEPLOYMENT.md`)
2. **Google OAuth configured** - Same credentials as backend
3. **Vercel Account** - https://vercel.com (free tier available)
4. **GitHub repo** - Code pushed to GitHub

---

## Step 1: Prepare for Deployment

Make sure your backend is deployed and you have:
- Backend URL (e.g., `https://ufc-picks-api.onrender.com`)
- Google OAuth Client ID

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the frontend directory:
   ```bash
   cd frontend
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No** (first time)
   - Project name? `ufc-picks` (or your choice)
   - Directory? `./` (current directory)
   - Override settings? **No**

5. Set environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter: https://ufc-picks-api.onrender.com

   vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production
   # Enter: your-client-id.apps.googleusercontent.com

   vercel env add NEXT_PUBLIC_APP_URL production
   # Enter: https://ufc-picks.vercel.app (your Vercel URL)
   ```

6. Redeploy with environment variables:
   ```bash
   vercel --prod
   ```

### Option B: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)

2. Click **Add New > Project**

3. Import your GitHub repository

4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Add Environment Variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://ufc-picks-api.onrender.com` |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` |
   | `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |

6. Click **Deploy**

---

## Step 3: Configure Google OAuth

After deployment, update Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services > Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-project.vercel.app
   ```
5. Add to **Authorized redirect URIs**:
   ```
   https://your-project.vercel.app
   ```
6. Save changes

---

## Step 4: Update Backend CORS

Update your backend's `CORS_ORIGINS` environment variable in Render:

```
CORS_ORIGINS=https://your-project.vercel.app
```

If you have multiple domains (custom domain + vercel.app):
```
CORS_ORIGINS=https://your-project.vercel.app,https://your-custom-domain.com
```

---

## Step 5: Verify Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. You should see the UFC Picks homepage
3. Test Google Sign In
4. Test viewing events and making picks

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (Render) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID |
| `NEXT_PUBLIC_APP_URL` | No | Frontend URL (for metadata) |

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard > Your Project > Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update:
   - Google OAuth authorized origins
   - Backend CORS_ORIGINS

---

## Troubleshooting

### "CORS error" or "Network error"
- Verify backend `CORS_ORIGINS` includes your Vercel URL
- Make sure URL doesn't have trailing slash
- Check backend is running (not in sleep mode on free tier)

### "Google Sign In failed"
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` matches backend's `GOOGLE_CLIENT_ID`
- Check Google Console authorized origins include your domain
- Clear browser cache and cookies

### "API calls fail"
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend health: `https://your-backend.onrender.com/health`
- Check browser console for detailed errors

### Build fails
- Check build logs in Vercel dashboard
- Run `npm run build` locally to reproduce
- Verify all dependencies are in `package.json`

### Images not loading
- Fighter images require backend proxy to be working
- Check backend logs for proxy errors
- Verify nginx/proxy configuration

---

## Performance Tips

1. **Enable Analytics**: Vercel > Project > Analytics
2. **Enable Speed Insights**: Vercel > Project > Speed Insights
3. **Edge Functions**: Consider using Edge runtime for faster responses
4. **ISR**: Implement Incremental Static Regeneration for event pages

---

## Auto-Deploy

Vercel automatically deploys:
- **Production**: On push to `main` branch
- **Preview**: On push to other branches or PRs

To disable auto-deploy:
1. Go to Project Settings > Git
2. Disable "Auto-Deploy"

---

## Notes

- **Free tier limits**: 100GB bandwidth/month, serverless function limits
- **Preview deployments**: Each PR gets a unique preview URL
- **Rollbacks**: One-click rollback in Vercel dashboard
- **Logs**: Available in Functions tab for debugging
