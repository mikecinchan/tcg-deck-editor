# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pokemon TCG Pocket Deck Builder - A full-stack web application for building and managing Pokemon TCG Pocket decks. Uses React + Vite frontend, Node.js + Express backend, Firebase Authentication + Firestore, and TCGDex API for card data.

## Development Commands

### Installation

```bash
# Install all dependencies (root, frontend, and backend)
npm run install:all
# or: npm install
```

This project uses npm workspaces, so installing from the root installs dependencies for both frontend and backend.

### Running the Application

```bash
# Run both frontend and backend concurrently (recommended)
npm run dev

# Run backend only (http://localhost:5000)
npm run dev:backend
# or: cd backend && npm run dev

# Run frontend only (http://localhost:3000)
npm run dev:frontend
# or: cd frontend && npm run dev
```

### Building

```bash
# Build both projects
npm run build

# Build individually
npm run build:frontend
npm run build:backend
```

### Frontend Development

```bash
cd frontend

# Development server with HMR
npm run dev

# TypeScript + Vite build
npm run build

# Preview production build
npm run preview

# Lint TypeScript/React code
npm run lint
```

### Backend Development

```bash
cd backend

# Development server with auto-restart
npm run dev

# TypeScript compilation
npm run build

# Run compiled production code
npm run start
```

## Architecture

### Monorepo Structure

This project uses npm workspaces with two packages:
- `frontend/` - React + Vite application
- `backend/` - Express API server

### Authentication Flow

1. **Frontend**: User logs in via Firebase Authentication (`frontend/src/contexts/AuthContext.tsx`)
2. **Frontend**: Gets Firebase ID token and includes it in API requests as `Authorization: Bearer <token>`
3. **Backend**: `authenticateUser` middleware (`backend/src/middleware/auth.ts`) verifies the token using Firebase Admin SDK
4. **Backend**: Extracts `uid` and `email` from token, attaches to `req.user` for use in controllers

All protected API routes require the authentication middleware.

### Data Flow: Deck Operations

**Creating/Updating Decks:**
1. Frontend submits deck data to backend API with auth token
2. Backend validates:
   - User authentication (middleware)
   - Deck must have exactly 20 cards (business logic)
   - User ownership for updates
3. Backend saves to Firestore with `userId`, `createdAt`, `updatedAt` timestamps
4. Frontend receives response and updates UI

**Loading Decks:**
1. Frontend requests decks from backend with auth token
2. Backend queries Firestore: `.where('userId', '==', userId).orderBy('updatedAt', 'desc')`
3. This query requires a composite Firebase index (defined in `firestore.indexes.json`)
4. Backend returns decks sorted by most recently updated first

### Card Data Architecture

**TCGDex Integration:**
- Cards fetched from TCGDex SDK (`@tcgdex/sdk`)
- Backend service (`backend/src/services/tcgdex.service.ts`) transforms and caches card data
- Caching strategy: In-memory for 1 hour to reduce API calls
- **Important**: Card objects from TCGDex contain circular references - must be transformed to plain objects before serialization
- Fields like `attacks`, `weaknesses`, `resistances` are omitted to avoid circular reference errors

**Image URLs:**
Pattern: `https://assets.tcgdex.net/en/tcgp/{setId}/{cardNumber}/high.webp`

### Firebase Configuration Files

**Location**: Root directory contains two critical Firebase configuration files:
- `firestore.rules` - Security rules for Firestore database
- `firestore.indexes.json` - Composite index definitions

**Deploying to Firebase**:
```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy both
firebase deploy --only firestore
```

### Firebase Indexes

**Critical**: The `decks` collection requires a composite index for the query combining `where('userId')` + `orderBy('updatedAt')`.

Index configuration in `firestore.indexes.json`:
```json
{
  "collectionGroup": "decks",
  "fields": [
    {"fieldPath": "userId", "order": "ASCENDING"},
    {"fieldPath": "updatedAt", "order": "DESCENDING"}
  ]
}
```

**Why this index is required**: Firebase requires composite indexes for queries that combine `where` clauses with `orderBy` on different fields. Without this index, the `getUserDecks()` query will fail. See `error-handling.md` Issue #2 for details.

### Frontend Routing

Uses React Router v6 with protected routes:
- `/login`, `/signup` - Public authentication pages
- `/cards` - Browse all cards (protected, default route)
- `/decks` - View saved decks (protected)
- `/deck-builder` - Create new deck (protected)
- `/deck-builder/:id` - Edit existing deck (protected)
- `/deck/:id` - View deck details (protected)

Protected routes use `ProtectedRoute` component that checks `AuthContext` and redirects unauthenticated users to `/login`.

### State Management

**Frontend:**
- **Auth State**: React Context (`AuthContext`) manages current user and Firebase auth state
- **Component State**: Local `useState` for UI state, forms, and data fetching
- **API Token**: AuthContext provides `getIdToken()` for authenticated API calls

**Backend:**
- Stateless API - all state in Firestore
- In-memory cache for TCGDex card data (expires after 1 hour)

## Environment Configuration

### Frontend `.env` (Required)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:5000
```

### Backend `.env` (Required)

```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=
FRONTEND_URL=http://localhost:3000
```

**Important**: `FIREBASE_PRIVATE_KEY` must include `\n` characters and be wrapped in quotes.

## Key Constraints and Business Logic

### Deck Validation Rules

- **Exactly 20 cards per deck** - Enforced on both frontend and backend
- Users can only access their own decks (enforced by Firestore security rules and backend middleware)
- Deck updates must preserve the original `userId`

### Firestore Security Rules

Located in `firestore.rules` (root directory):
- Users can only read/write their own decks (`resource.data.userId == request.auth.uid`)
- Deck creation validates required fields (name, cards, timestamps)
- Deck updates cannot change ownership

**Deploy rules**: `firebase deploy --only firestore:rules`

## Common Issues & Solutions

See `error-handling.md` for documented issues and resolutions:

1. **Circular Reference Error**: TCGDex objects must be transformed to plain objects (Issue #1)
2. **Deck Loading Failure**: Requires Firebase composite index for userId + updatedAt query (Issue #2)

## Tech Stack Reference

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router v6 (routing)
- Firebase SDK (authentication)
- Axios (HTTP client)
- React Hot Toast (notifications)
- Lucide React (icons)

**Backend:**
- Node.js + Express
- TypeScript
- Firebase Admin SDK (auth + Firestore)
- TCGDex SDK (card data)
- ts-node-dev (development)

## File Organization Patterns

**Backend Services Layer:**
- `services/*.service.ts` - Business logic and external API integration
- `controllers/*.controller.ts` - Request/response handling, call services
- `routes/*.routes.ts` - Route definitions, apply middleware
- `middleware/auth.ts` - Authentication verification

**Frontend Pages:**
- `pages/*.tsx` - Full page components with routing
- `components/*.tsx` - Reusable UI components
- `contexts/*.tsx` - React Context providers
- `services/*.ts` - API clients and Firebase config
