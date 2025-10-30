# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

- [ ] Code is committed to GitHub repository
- [ ] Firebase project is set up with Firestore and Authentication enabled
- [ ] All local development tests pass
- [ ] `.env` files are NOT committed to repository (should be in `.gitignore`)

## Railway Backend Deployment

- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] Create new project from GitHub repository
- [ ] Verify build settings:
  - Root Directory: `backend`
  - Build Command: `npm run build`
  - Start Command: `npm start`
- [ ] Add environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FIREBASE_PRIVATE_KEY`
  - [ ] `FIREBASE_CLIENT_EMAIL`
  - [ ] `FRONTEND_URL` (update after Netlify deployment)
- [ ] Wait for successful deployment
- [ ] Copy Railway URL (e.g., `https://your-app.railway.app`)
- [ ] Test health endpoint: `https://your-app.railway.app/health`

## Netlify Frontend Deployment

- [ ] Create Netlify account at [netlify.com](https://netlify.com)
- [ ] Create new site from GitHub repository
- [ ] Verify build settings:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `frontend/dist`
- [ ] Add environment variables:
  - [ ] `VITE_FIREBASE_API_KEY`
  - [ ] `VITE_FIREBASE_AUTH_DOMAIN`
  - [ ] `VITE_FIREBASE_PROJECT_ID`
  - [ ] `VITE_FIREBASE_STORAGE_BUCKET`
  - [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `VITE_FIREBASE_APP_ID`
  - [ ] `VITE_API_URL` (your Railway URL)
- [ ] Deploy site
- [ ] Copy Netlify URL (e.g., `https://your-app.netlify.app`)

## Post-Deployment Configuration

- [ ] Update `FRONTEND_URL` in Railway to your Netlify URL
- [ ] Wait for Railway to redeploy with new CORS settings
- [ ] Add Netlify domain to Firebase authorized domains:
  - Firebase Console → Authentication → Settings → Authorized domains
- [ ] Deploy Firestore rules and indexes:
  ```bash
  firebase deploy --only firestore
  ```

## Verification Tests

- [ ] Backend health check responds: `https://your-app.railway.app/health`
- [ ] Frontend loads without errors
- [ ] User signup works
- [ ] User login works
- [ ] Cards page loads and displays cards
- [ ] Card search and filtering works
- [ ] Deck builder opens
- [ ] Can add cards to deck
- [ ] Can save deck (20 cards)
- [ ] Can view saved decks
- [ ] Can edit existing deck
- [ ] Can delete deck
- [ ] Logout works
- [ ] Protected routes redirect when not authenticated

## Optional Enhancements

- [ ] Set up custom domain on Netlify
- [ ] Set up custom domain on Railway
- [ ] Update environment variables with custom domains
- [ ] Configure SSL certificates (usually automatic)
- [ ] Set up monitoring/alerting
- [ ] Configure automatic deployments for both services

## Troubleshooting Quick Checks

If something doesn't work:

1. **Check logs**:
   - Railway: Dashboard → Deployments → View Logs
   - Netlify: Dashboard → Deploys → [Latest] → Deploy log
   - Browser: Console (F12)

2. **Verify URLs match**:
   - Railway `FRONTEND_URL` = Netlify site URL
   - Netlify `VITE_API_URL` = Railway site URL

3. **Check environment variables**:
   - All required variables are set
   - No typos in variable names
   - Firebase credentials are correct

4. **Firebase configuration**:
   - Indexes deployed: `firebase deploy --only firestore:indexes`
   - Rules deployed: `firebase deploy --only firestore:rules`
   - Netlify domain added to authorized domains

## Rollback Plan

If deployment fails:

1. **Railway**:
   - Go to Deployments → Click previous successful deployment → "Redeploy"

2. **Netlify**:
   - Go to Deploys → Click previous successful deployment → "Publish deploy"

3. **Firestore**:
   - Rules and indexes can be updated anytime: `firebase deploy --only firestore`

## Success Criteria

Your deployment is successful when:
- ✅ Users can sign up and log in
- ✅ Cards load and can be browsed
- ✅ Decks can be created, saved, edited, and deleted
- ✅ No console errors in browser
- ✅ No 500 errors from backend
- ✅ CORS issues are resolved

---

**Next Steps**: See `DEPLOYMENT.md` for detailed instructions on each step.
