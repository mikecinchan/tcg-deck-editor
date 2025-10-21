# Quick Setup Guide

This guide will help you get the Pokemon TCG Pocket Deck Builder running on your local machine in under 10 minutes.

## Step 1: Install Dependencies (2 minutes)

```bash
cd "C:\Users\USER\Desktop\Projects\tcg pocket"
npm install
```

This installs dependencies for both frontend and backend using npm workspaces.

## Step 2: Firebase Setup (3 minutes)

### Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or select existing project
3. Enter project name (e.g., "pokemon-tcg-pocket")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Click "Email/Password" under Sign-in method
4. Enable "Email/Password"
5. Click "Save"

### Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location (closest to you)
5. Click "Enable"

### Add Security Rules

1. Go to Firestore Database > Rules tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /decks/{deckId} {
      allow read, write: if request.auth != null &&
                          request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
                     request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click "Publish"

## Step 3: Get Firebase Credentials (2 minutes)

### Frontend Credentials

1. Go to Project Settings (gear icon) > General
2. Scroll down to "Your apps"
3. Click the web icon (`</>`)
4. Register app with nickname "Pokemon TCG Pocket Web"
5. Copy the config values

### Backend Credentials (Service Account)

1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Click "Generate key"
4. Save the JSON file securely (e.g., `serviceAccountKey.json`)

## Step 4: Configure Environment Variables (2 minutes)

### Frontend Environment

Create `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_API_URL=http://localhost:5000
```

Replace the values with your Firebase config from Step 3.

### Backend Environment

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# From serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

FRONTEND_URL=http://localhost:3000
```

**Important**:
- For `FIREBASE_PRIVATE_KEY`, copy the entire private_key value from the JSON file (including the quotes)
- Keep the `\n` characters in the key
- Wrap the entire key in double quotes

## Step 5: Run the Application (1 minute)

### Option A: Run Both (Recommended)

```bash
npm run dev
```

This runs both frontend and backend concurrently.

### Option B: Run Separately

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

## Step 6: Access the Application

1. Open your browser to http://localhost:3000
2. Click "Sign up" to create an account
3. Enter your email and password
4. Start browsing cards and building decks!

## Troubleshooting

### Issue: "Failed to fetch cards"

**Solution**: The TCGDex API might be loading. Wait a few seconds and refresh the page. The backend caches cards for better performance.

### Issue: "Unauthorized" errors

**Solution**:
1. Double-check your Firebase credentials in `.env` files
2. Make sure Authentication is enabled in Firebase Console
3. Try logging out and logging back in

### Issue: "Permission denied" in Firestore

**Solution**:
1. Verify Firestore security rules are set correctly
2. Make sure you're logged in
3. Check Firebase Console > Firestore Database > Rules

### Issue: Backend won't start

**Solution**:
1. Check that `FIREBASE_PRIVATE_KEY` is formatted correctly with `\n` characters
2. Ensure port 5000 is not in use by another application
3. Check backend console for specific error messages

### Issue: Frontend won't start

**Solution**:
1. Verify all `VITE_` environment variables are set
2. Make sure port 3000 is not in use
3. Try deleting `node_modules` and running `npm install` again

## Next Steps

- Read the main [README.md](./README.md) for detailed documentation
- Explore the codebase structure
- Customize the styling in Tailwind config
- Add new features!

## Important Files Checklist

Before running, make sure you have:

- [ ] `frontend/.env` - Frontend Firebase config
- [ ] `backend/.env` - Backend Firebase config
- [ ] Firebase Authentication enabled
- [ ] Firestore database created
- [ ] Firestore security rules set
- [ ] Dependencies installed

## Support

If you encounter any issues:

1. Check the Troubleshooting section above
2. Review the console logs (browser and backend)
3. Verify all Firebase settings
4. Check that all environment variables are set correctly

Happy deck building! 🎴
