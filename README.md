# Pokemon TCG Pocket - Deck Builder

A full-stack web application for building and managing Pokemon TCG Pocket decks. Built with React, Node.js, Firebase, and the TCGDex API.

## Features

- **User Authentication**: Secure login/signup using Firebase Authentication
- **Card Browser**: Browse all Pokemon TCG Pocket cards with advanced filtering
  - Search by card name
  - Filter by energy type (Grass, Fire, Water, Lightning, Psychic, Fighting, etc.)
  - Filter by rarity and set
  - Multi-select filters work together
- **Deck Builder**: Create and edit decks with 20-card limit validation
  - Energy type filtering available in deck builder
  - Real-time card filtering while building decks
- **Deck Management**: Save, view, edit, and delete decks
- **Notes System**: Add notes to each deck for strategy planning
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Firebase SDK** for authentication
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Firebase Admin SDK** for authentication and Firestore
- **@tcgdex/sdk** for Pokemon card data
- **CORS** for cross-origin requests

### Database & Authentication
- **Firebase Authentication** for user management
- **Firestore** for deck storage

## Project Structure

```
tcg-pocket/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and Firebase services
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── types/         # TypeScript type definitions
│   └── package.json
└── package.json           # Root package.json (workspace)
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm 9+
- Firebase account and project
- Git

### 1. Clone the repository

```bash
cd tcg-pocket
```

### 2. Install dependencies

```bash
npm run install:all
```

This will install dependencies for both frontend and backend.

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable **Authentication** with Email/Password provider
4. Create a **Firestore Database** in production mode
5. Add Firestore security rules (see below)
6. Generate a service account key for backend:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

### 4. Environment Variables

#### Frontend (.env)

Create `frontend/.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000
```

Get these values from Firebase Console > Project Settings > General

#### Backend (.env)

Create `backend/.env` file:

```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FRONTEND_URL=http://localhost:3000
```

Get these values from the service account JSON file you downloaded.

### 5. Firestore Security Rules

Add these security rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own decks
    match /decks/{deckId} {
      allow read, write: if request.auth != null &&
                          request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
                     request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 6. Run the Application

#### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

#### Production Build

```bash
npm run build
```

## API Endpoints

### Cards

- `GET /api/cards` - Get all Pokemon TCG Pocket cards
- `GET /api/cards/:id` - Get a specific card by ID

### Decks

- `GET /api/decks` - Get all decks for authenticated user
- `GET /api/decks/:id` - Get a specific deck
- `POST /api/decks` - Create a new deck
- `PUT /api/decks/:id` - Update a deck
- `DELETE /api/decks/:id` - Delete a deck

All endpoints require authentication via Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase_id_token>
```

## Usage Guide

### 1. Create an Account

- Navigate to the signup page
- Enter your email and password
- Click "Sign up"

### 2. Browse Cards

- After login, you'll see the card browser
- Use the search bar to find cards by name
- Filter by type, rarity, or set
- Click on cards to view details

### 3. Build a Deck

- Click "Build Deck" button
- Search and add cards to your deck
- Each deck must contain exactly 20 cards
- Give your deck a name and optional notes
- Click "Save Deck"

### 4. Manage Decks

- Go to "My Decks" to see all your saved decks
- Click "View" to see deck details and statistics
- Click "Edit" to modify a deck
- Click "Delete" to remove a deck (with confirmation)

## Key Features Explained

### Deck Validation

- Each deck must contain exactly 20 cards (enforced on both frontend and backend)
- You can have multiple copies of the same card
- The deck builder shows real-time card count

### Card Filtering

- **Search**: Type-ahead search by card name
- **Energy Type Filter**: Filter by Pokemon energy type (Grass, Fire, Water, Lightning, Psychic, Fighting, Darkness, Metal, Fairy, Dragon, Colorless)
  - Click type buttons to select/deselect
  - Multiple types can be selected simultaneously
  - Cards matching ANY selected type will be shown
- **Rarity Filter**: Filter by card rarity
- **Set Filter**: Filter by card set/collection
- **Combined Filtering**: All filters work together for precise card discovery

### Deck Statistics

- Total card count
- Unique card count
- Type distribution chart
- Card previews

## Troubleshooting

### Cards not loading

- Check that the TCGDex API is accessible
- Backend caches cards for 24 hours - restart if needed
- Check backend logs for API errors

### First load is slow

- **First Load**: The initial card fetch takes 5-10 minutes as the backend retrieves full details for all 2,012 cards to get energy type information
- **Subsequent Loads**: Instant - cards are cached for 24 hours
- **Why**: TCGDex API requires individual card fetches to get type data (not included in set summaries)
- **Optimization**: Cards are fetched in batches of 10 concurrent requests with retry logic
- **Progress**: Check backend console logs for real-time progress updates

### Authentication errors

- Verify Firebase configuration is correct
- Check that Authentication is enabled in Firebase Console
- Ensure service account credentials are valid

### Firestore permission errors

- Verify Firestore security rules are set correctly
- Check that user is authenticated
- Ensure deck ownership matches authenticated user

## Development

### Adding New Features

1. Frontend: Add components in `frontend/src/components` or pages in `frontend/src/pages`
2. Backend: Add routes, controllers, and services in respective folders
3. Update types in both frontend and backend `types/index.ts`

### Code Style

- TypeScript strict mode enabled
- ESLint configuration included
- Prettier recommended for formatting

## License

MIT

## Support

For issues and questions, please create an issue in the repository.

---

Built with ❤️ using React, Node.js, Firebase, and TCGDex API
