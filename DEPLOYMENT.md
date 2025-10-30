# Deployment Guide

This guide covers deploying the Pokemon TCG Pocket Deck Builder to production using Railway (backend) and Netlify (frontend).

## Overview

- **Backend**: Railway (Express API)
- **Frontend**: Netlify (React SPA)
- **Database**: Firebase Firestore (already cloud-based)
- **Authentication**: Firebase Auth (already cloud-based)

## Prerequisites

- GitHub account (for connecting repositories)
- Railway account (free tier available at [railway.app](https://railway.app))
- Netlify account (free tier available at [netlify.com](https://netlify.com))
- Firebase project with Firestore and Authentication enabled

## Part 1: Deploy Backend to Railway

### Step 1: Push Code to GitHub

If you haven't already, push your code to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin master
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect it's a Node.js project

### Step 3: Configure Railway Build Settings

Railway should automatically detect your backend. If needed, set these manually:

- **Root Directory**: `backend`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### Step 4: Set Environment Variables in Railway

In your Railway project dashboard, go to "Variables" and add:

```
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY=<your-firebase-private-key>
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
FRONTEND_URL=<your-netlify-url-after-deployment>
```

**Important Notes**:
- For `FIREBASE_PRIVATE_KEY`: Copy the entire private key including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts
- Railway handles newlines correctly - you can paste the key as-is
- You'll update `FRONTEND_URL` after deploying the frontend

### Step 5: Deploy

1. Railway will automatically deploy after you add environment variables
2. Once deployed, copy your Railway URL (e.g., `https://your-app.railway.app`)
3. Test the health endpoint: `https://your-app.railway.app/health`

## Part 2: Deploy Frontend to Netlify

### Step 1: Create Netlify Site

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### Step 2: Set Environment Variables in Netlify

In Netlify, go to "Site settings" → "Environment variables" and add:

```
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
VITE_API_URL=https://your-app.railway.app
```

**Important**: `VITE_API_URL` should be your Railway backend URL (without trailing slash)

### Step 3: Deploy

1. Click "Deploy site"
2. Netlify will build and deploy automatically
3. Once deployed, copy your Netlify URL (e.g., `https://your-app.netlify.app`)

### Step 4: Update Backend CORS

Now that you have your Netlify URL:

1. Go back to Railway
2. Update the `FRONTEND_URL` environment variable to your Netlify URL
3. Railway will automatically redeploy

## Part 3: Configure Firebase

### Update Authorized Domains

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Netlify domain (e.g., `your-app.netlify.app`)

### Deploy Firestore Rules and Indexes

From your project root directory:

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy indexes and rules
firebase deploy --only firestore
```

## Part 4: Verify Deployment

### Test Backend

```bash
curl https://your-app.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}

curl https://your-app.railway.app/api/cards
# Should return card data (may require auth)
```

### Test Frontend

1. Visit your Netlify URL
2. Try signing up / logging in
3. Browse cards
4. Create and save a deck
5. Check that all features work

## Continuous Deployment

Both Railway and Netlify support automatic deployments:

- **Railway**: Auto-deploys on push to `master` branch (backend changes)
- **Netlify**: Auto-deploys on push to `master` branch (frontend changes)

To enable auto-deploy, ensure your GitHub repository is connected to both services.

## Custom Domains (Optional)

### Netlify Custom Domain

1. Go to "Domain settings" in Netlify
2. Add your custom domain
3. Configure DNS records as instructed

### Railway Custom Domain

1. Go to "Settings" → "Domains" in Railway
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `FRONTEND_URL` in Railway environment variables
5. Update CORS settings if needed

## Monitoring and Logs

### Railway Logs

- View logs in Railway dashboard under "Deployments" → "View Logs"
- Monitor API errors and performance

### Netlify Logs

- View deployment logs in Netlify dashboard
- Check function logs if using Netlify Functions

### Firebase Console

- Monitor authentication in Firebase Console → Authentication
- Check Firestore usage and performance

## Troubleshooting

### Backend Issues

**Problem**: 500 errors or health check fails
- Check Railway logs for errors
- Verify all environment variables are set correctly
- Ensure Firebase credentials are valid

**Problem**: CORS errors
- Verify `FRONTEND_URL` in Railway matches your Netlify URL exactly
- Check that URL has no trailing slash

### Frontend Issues

**Problem**: Blank page or build errors
- Check Netlify build logs
- Verify all `VITE_*` environment variables are set
- Ensure `VITE_API_URL` points to Railway backend

**Problem**: Authentication not working
- Check Firebase authorized domains include your Netlify domain
- Verify Firebase credentials in environment variables

**Problem**: API calls failing
- Verify `VITE_API_URL` is correct (Railway URL)
- Check browser console for CORS errors
- Ensure backend is running (check health endpoint)

### Database Issues

**Problem**: Deck loading fails
- Ensure Firestore indexes are deployed: `firebase deploy --only firestore:indexes`
- Check Firebase Console → Firestore → Indexes
- Verify the composite index for `userId` + `updatedAt` exists

## Cost Estimates

### Free Tier Limits

**Railway Free Tier**:
- $5 worth of usage per month
- Should be sufficient for small to medium traffic

**Netlify Free Tier**:
- 100GB bandwidth/month
- 300 build minutes/month
- Plenty for most applications

**Firebase Free Tier (Spark Plan)**:
- 50K reads/day
- 20K writes/day
- 1GB storage
- May need to upgrade for high traffic

### Recommended Upgrade Path

If you exceed free tiers:
1. **Railway**: Upgrade to Hobby plan ($5/month)
2. **Netlify**: Upgrade to Pro ($19/month)
3. **Firebase**: Upgrade to Blaze plan (pay-as-you-go)

## Environment Variables Quick Reference

### Railway (Backend)
```
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FRONTEND_URL=
```

### Netlify (Frontend)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=
```

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Netlify Documentation](https://docs.netlify.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review service-specific logs (Railway/Netlify/Firebase)
3. Create an issue in the project repository
