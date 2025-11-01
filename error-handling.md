# Error Handling and Issues Documentation

This document tracks all issues encountered during development and their solutions.

---

## Issue #1: Circular Reference Error - Card Images Not Appearing

**Date**: 2025-10-21

### Problem Description

Card images were not appearing in the application. Upon investigation, we discovered a circular reference error in the backend when serializing card data from the TCGDex API.

### Root Cause

In `backend/src/services/tcgdex.service.ts`, the card transformation logic was explicitly setting `attacks`, `weaknesses`, and `resistances` fields to `undefined`:

```typescript
// PROBLEMATIC CODE (Lines 103-109)
return {
  id: card.id,
  localId: card.localId,
  name: card.name,
  image: imageUrl,
  // ... other fields ...
  attacks: undefined,      // ❌ Setting to undefined causes serialization issues
  weaknesses: undefined,   // ❌ Circular references not properly removed
  resistances: undefined,  // ❌ Still included in object structure
  retreat: card.retreat,
  effect: card.effect,
};
```

**Why this caused issues:**
1. TCGDex SDK objects contain circular references in complex nested structures
2. Setting fields to `undefined` doesn't remove them from the object - they're still present during JSON serialization
3. This caused JSON serialization to fail or behave unexpectedly
4. As a result, the entire card data structure was compromised, preventing images from loading

### Solution

**File**: `backend/src/services/tcgdex.service.ts` (Lines 86-110)

Changed the approach to completely omit problematic fields instead of setting them to `undefined`:

```typescript
// FIXED CODE
const cardData: any = {
  id: card.id,
  localId: card.localId,
  name: card.name,
  image: imageUrl,
  category: card.category,
  hp: card.hp,
  types: Array.isArray(card.types) ? card.types : [],
  stage: card.stage,
  rarity: card.rarity,
  set: {
    id: setDetails.id,
    name: setDetails.name,
  },
  dexId: card.dexId,
  level: card.level,
  description: card.description,
  retreat: card.retreat,
  effect: card.effect,
};

// Only add these fields if they exist and don't have circular references
// For now, we skip attacks, weaknesses, and resistances to avoid circular refs

return cardData;
```

**Key changes:**
1. Create a clean `cardData` object with only serializable properties
2. Completely omit `attacks`, `weaknesses`, and `resistances` fields
3. Fields that don't exist in the object won't be serialized
4. This prevents circular reference errors during JSON serialization

### Impact

- ✅ Card images now display correctly
- ✅ JSON serialization works properly
- ✅ No circular reference errors
- ✅ Frontend receives clean, serializable card data

### Image URL Construction

The solution also maintains proper image URL construction using the TCGdex CDN pattern:

```typescript
// Image URL format
https://assets.tcgdex.net/en/tcgp/{setId}/{cardNumber}/high.webp
```

The code handles multiple image URL formats from the TCGDex API:
- String URLs (appends `/high.webp` if no extension)
- Object URLs (extracts best quality URL available)
- Fallback manual construction using CDN pattern

### Testing

Both servers confirmed working:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

Users can now:
1. Browse cards with images displayed correctly
2. Search and filter cards
3. Build decks with visual card previews
4. View deck details with card images

### Prevention

To prevent similar issues in the future:

1. **Never set complex objects to `undefined` in serializable data structures**
   - Instead, omit them completely using object destructuring or selective property assignment

2. **Be cautious with third-party API data**
   - Always transform external API data to your own clean data structure
   - Don't pass through nested objects that might contain circular references

3. **Use TypeScript interfaces carefully**
   - Define optional properties with `?` for fields that might not exist
   - This allows omitting fields without type errors

4. **Test JSON serialization**
   - Add logging or tests to verify data can be serialized to JSON
   - Check for circular reference errors in development

### Related Files

- `backend/src/services/tcgdex.service.ts` - Card data transformation
- `backend/src/types/index.ts` - Card type definitions
- `frontend/src/types/index.ts` - Frontend card types
- `frontend/src/pages/Cards.tsx` - Card display component
- `frontend/src/pages/DeckBuilder.tsx` - Deck building with card images

---

## Issue #2: Deck Saving/Loading - Firebase Index Missing

**Date**: 2025-10-21

### Problem Description

Decks could be saved successfully but could not be loaded from the database. The application would fail to retrieve saved decks for users.

### Root Cause

In `backend/src/services/deck.service.ts`, the `getUserDecks()` method uses a composite query with both a `where` clause and an `orderBy` clause:

```typescript
// Lines 12-16
const snapshot = await db
  .collection(DECKS_COLLECTION)
  .where('userId', '==', userId)
  .orderBy('updatedAt', 'desc')
  .get();
```

**Why this caused issues:**
1. Firebase requires a composite index for queries that combine `where` and `orderBy` clauses on different fields
2. Without the index, Firebase throws an error when trying to execute the query
3. The index needs to be explicitly created in Firebase console or via `firestore.indexes.json`
4. The query was attempting to filter by `userId` AND sort by `updatedAt`, requiring an index on both fields

### Solution

**Step 1: Create Firebase Index**

Created a composite index in Firebase for the `decks` collection with the following configuration:
- Collection: `decks`
- Fields indexed:
  - `userId` (Ascending)
  - `updatedAt` (Descending)

This index was defined in `firestore.indexes.json` and deployed to Firebase.

**Step 2: Enable orderBy Clause**

The `orderBy` clause in `backend/src/services/deck.service.ts:15` was already enabled and correctly configured:

```typescript
.orderBy('updatedAt', 'desc')
```

This clause sorts decks by their last update time in descending order (newest first).

**Step 3: Server Restart**

After creating and enabling the Firebase index, the backend server was restarted to ensure the connection was fresh:

```bash
cd backend && npm run dev
```

### Impact

- ✅ Decks can now be saved successfully
- ✅ Saved decks load properly for users
- ✅ Decks are displayed in order of most recently updated first
- ✅ No Firebase index errors

### Firebase Index Configuration

The composite index enables efficient querying with the following structure:

```json
{
  "collectionGroup": "decks",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "userId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "updatedAt",
      "order": "DESCENDING"
    }
  ]
}
```

### Testing

Confirmed working in local environment:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

Users can now:
1. Create and save decks with 20 cards
2. View their saved decks list
3. Load individual deck details
4. Update existing decks
5. Delete decks
6. Decks appear sorted by most recently updated

### Prevention

To prevent similar issues in the future:

1. **Always create necessary Firebase indexes before deploying queries**
   - Use `firestore.indexes.json` to define indexes in version control
   - Deploy indexes using Firebase CLI: `firebase deploy --only firestore:indexes`

2. **Firebase composite query requirements**
   - Any query with `where` + `orderBy` on different fields needs an index
   - Multiple `where` clauses on different fields need an index
   - Firebase error messages include a direct link to create the required index

3. **Test queries locally with Firebase emulator**
   - Use Firebase emulator suite to catch index requirements during development
   - The emulator will warn about missing indexes before production deployment

4. **Document index requirements**
   - Keep `firestore.indexes.json` up to date
   - Comment complex queries explaining why specific indexes are needed

### Related Files

- `backend/src/services/deck.service.ts` - Deck CRUD operations with composite query
- `firestore.indexes.json` - Firebase index definitions
- `backend/src/types/index.ts` - Deck type definitions
- `frontend/src/pages/DeckBuilder.tsx` - Deck creation interface
- `frontend/src/pages/MyDecks.tsx` - Saved decks list display

---

## Issue #3: TCGDex API Timeout on Railway Deployment

**Date**: 2025-10-30

### Problem Description

After successfully deploying the application to Railway (backend) and Netlify (frontend), the cards endpoint was returning 500 Internal Server Error. Users could not load cards, making the application unusable.

### Root Cause

In Railway deployment logs, the following error was observed:

```
[cause]: AggregateError [ETIMEDOUT]:
  at internalConnectMultiple (node:net:1134:18)
  at internalConnectMultiple (node:net:1210:5)
  at Timeout.internalConnectMultipleTimeout (node:net:1742:5)

Error in getAllCards: Error: Failed to fetch cards from TCGDex API
```

**Why this caused issues:**
1. Railway's servers were experiencing network connectivity issues with the TCGDex API
2. The default Node.js timeout (typically 2 minutes) was insufficient for the API calls
3. TCGDex API was fetching data for 11 sets with 1,681 total cards
4. No retry mechanism existed to handle transient network failures
5. The backend would crash on first load, preventing any card data from being cached

**Local vs Production Behavior:**
- **Local Development**: TCGDex API responded successfully in ~11 seconds with all 1,681 cards
- **Railway Production**: Consistent ETIMEDOUT errors, all API calls failed

This confirmed it was a **Railway-specific network issue**, not a problem with the TCGDex API itself.

### Solution

**File**: `backend/src/services/tcgdex.service.ts` (Lines 1-42, 59-81)

Implemented a comprehensive retry mechanism with extended timeouts:

```typescript
// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    console.log(`Retry attempt. Retries left: ${retries}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}
```

**Applied to TCGDex API calls:**

```typescript
// Fetch series with retry and 30s timeout
const tcgpSeries = await retryWithBackoff(() =>
  withTimeout(tcgdex.serie.get('tcgp'), 30000)
);

// Fetch each set with retry and 30s timeout
const setDetails = await retryWithBackoff(() =>
  withTimeout(tcgdex.set.get(setId), 30000)
);
```

**Additional optimization:**

```typescript
// Increased cache duration from 1 hour to 24 hours
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours (card data rarely changes)
```

**Key improvements:**
1. **30-second timeout** per API call (vs default 120s for entire process)
2. **3 retry attempts** with exponential backoff (2s, 4s, 8s delays)
3. **24-hour cache** to minimize API calls after successful fetch
4. **Graceful degradation**: Returns expired cache if all retries fail

### Impact

- ✅ Railway deployment successfully fetches all 1,681 cards from TCGDex API
- ✅ First load takes 10-30 seconds (acceptable for initial cache population)
- ✅ Subsequent loads are instant (served from 24-hour cache)
- ✅ Retry logic handles transient network issues automatically
- ✅ Extended timeouts accommodate Railway's network latency
- ✅ Application is fully functional in production

### Testing Results

**Local Environment:**
```
Fetching cards from TCGDex API...
Found 11 sets in tcgp series: ['P-A', 'A1', 'A1a', 'A2', 'A2a', 'A2b', 'A3', 'A3a', 'A3b', 'A4', 'A4a']
Fetching set: P-A
Fetched 100 cards from set P-A
...
Total cards fetched: 1681
```
Time: ~11 seconds

**Railway Production:**
- First deployment: Timeout errors (before fix)
- After implementing retry logic: Successfully fetched all cards
- Cache warming: ~20-30 seconds on first request
- Subsequent requests: Instant (cache hit)

### Deployment Configuration

**Railway Environment Variables:**
```
NODE_ENV=production
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_PRIVATE_KEY=<your-private-key>
FIREBASE_CLIENT_EMAIL=<your-client-email>
FRONTEND_URL=https://tcg-deck-editor.netlify.app
```

**Netlify Environment Variables:**
```
VITE_API_URL=https://backend-production-f62e.up.railway.app
VITE_FIREBASE_API_KEY=<your-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

**Live URLs:**
- Frontend: https://tcg-deck-editor.netlify.app
- Backend: https://backend-production-f62e.up.railway.app

### Prevention

To prevent similar issues in future deployments:

1. **Always implement retry logic for external API calls**
   - Use exponential backoff to avoid overwhelming failing services
   - Set reasonable retry limits (3-5 attempts)
   - Log retry attempts for debugging

2. **Set explicit timeouts for network operations**
   - Don't rely on default timeouts
   - Set timeouts per operation, not for entire process
   - Use 30-60 seconds for API calls that fetch large datasets

3. **Implement robust caching strategies**
   - Cache external API data to reduce dependency on third-party services
   - Use long cache durations for rarely-changing data (24 hours for card data)
   - Consider persistent cache (Redis, file system) for production

4. **Test in production-like environments**
   - Local testing may not reveal network latency issues
   - Deploy to staging environment first
   - Monitor logs for timeout patterns

5. **Consider fallback mechanisms**
   - Pre-seed critical data as static JSON files
   - Return stale cache data if fresh fetch fails
   - Implement circuit breaker pattern for repeated failures

### Alternative Solutions Considered

1. **Remove authentication from card routes** - Makes sense architecturally (cards are public data) but doesn't solve the timeout issue

2. **Pre-seed card data as static JSON** - Best long-term solution for reliability, but requires manual updates when new cards are released

3. **Switch hosting providers** - Render or Fly.io might have better TCGDex connectivity, but no guarantee

4. **Hybrid approach (recommended for future)**:
   - Keep current retry logic for live data
   - Add static JSON fallback for critical failures
   - Use static data during Railway cold starts

### Related Files

- `backend/src/services/tcgdex.service.ts` - TCGDex API integration with retry logic
- `backend/src/routes/card.routes.ts` - Card API routes (authentication enabled)
- `backend/src/controllers/card.controller.ts` - Card request handling
- `frontend/netlify.toml` - Netlify deployment configuration
- `DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT-CHECKLIST.md` - Step-by-step deployment checklist

### Commits

- `bd2f137` - Fix TCGDex API timeout: add retry logic with exponential backoff and 30s timeout
- `132bcc1` - Fix Netlify deployment: remove unused import and update build config
- `ce3d366` - Initial commit: Add deployment configuration for Netlify and Railway

---

## Issue #4: TCGDex API Card Resumes Missing Type Information

**Date**: 2025-11-01

### Problem Description

When implementing energy type filtering for the Cards and Deck Builder pages, we discovered that card type information (Grass, Fire, Water, etc.) was not available in the card data. Users could not filter cards by energy type because the `types` field was always `undefined`.

### Root Cause

The TCGDex API for Pokemon TCG Pocket returns two different levels of card data:

**Card Resume** (from `setDetails.cards`):
- Only includes basic fields: `id`, `image`, `localId`, `name`, `sdk`
- **DOES NOT include**: `types`, `category`, `hp`, `rarity`, `stage`, etc.

**Full Card Details** (from `tcgdex.card.get(cardId)`):
- Includes complete card data: `types`, `category`, `hp`, `rarity`, `stage`, `attacks`, etc.

```typescript
// Card Resume - Limited data
{
  sdk: {...},
  id: 'A1-001',
  image: 'https://...',
  localId: 'A1-001',
  name: 'Bulbasaur'
}

// Full Card - Complete data
{
  ...
  types: ['Grass'],      // ✅ Available
  category: 'Pokemon',   // ✅ Available
  hp: 70,               // ✅ Available
  ...
}
```

Our initial implementation in `backend/src/services/tcgdex.service.ts:86-110` only used the resume data from `setDetails.cards`, which is why `types` was always `undefined`.

### Solution

**File**: `backend/src/services/tcgdex.service.ts` (Lines 86-115)

Implemented batched fetching of full card details for all cards:

```typescript
// Fetch full card details in batches to get types
const BATCH_SIZE = 10; // Concurrent requests
const cardResumes = setDetails.cards;
const fullCards: any[] = [];

console.log(`Fetching full details for ${cardResumes.length} cards in batches of ${BATCH_SIZE}...`);

for (let i = 0; i < cardResumes.length; i += BATCH_SIZE) {
  const batch = cardResumes.slice(i, i + BATCH_SIZE);
  const batchPromises = batch.map((cardResume: any) =>
    retryWithBackoff(() =>
      withTimeout(tcgdex.card.get(cardResume.id), 30000)
    ).catch((error) => {
      console.error(`Failed to fetch card ${cardResume.id}:`, error.message);
      return null; // Continue even if one card fails
    })
  );

  const batchResults = await Promise.all(batchPromises);
  fullCards.push(...batchResults.filter(c => c !== null));

  // Log progress every 50 cards
  if ((i + BATCH_SIZE) % 50 === 0 || (i + BATCH_SIZE) >= cardResumes.length) {
    console.log(`Progress: ${Math.min(i + BATCH_SIZE, cardResumes.length)}/${cardResumes.length} cards fetched from set ${setId}`);
  }
}
```

**Key improvements:**
1. **Batched fetching**: Process 10 cards concurrently to balance speed vs API load
2. **Error handling**: Individual card failures don't stop the entire process
3. **Progress logging**: Real-time updates every 50 cards for transparency
4. **Retry logic**: Leverages existing retry mechanism with exponential backoff
5. **Timeout protection**: 30-second timeout per card request

### Frontend Implementation

**Files**:
- `frontend/src/pages/DeckBuilder.tsx` (Lines 19, 24, 33-50, 79-85, 187-210)
- `frontend/src/pages/Cards.tsx` (Already had type filtering implemented)

Added energy type filtering to Deck Builder:

```typescript
// State management
const [typeFilter, setTypeFilter] = useState<string[]>([]);
const availableTypes = Array.from(new Set(cards.flatMap(card => card.types || [])));

// Filtering logic
useEffect(() => {
  let result = [...cards];

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(card => card.name.toLowerCase().includes(query));
  }

  // Type filter
  if (typeFilter.length > 0) {
    result = result.filter(card =>
      card.types?.some(type => typeFilter.includes(type))
    );
  }

  setFilteredCards(result);
}, [searchQuery, typeFilter, cards]);

// UI with clickable type buttons
<div className="flex flex-wrap gap-2">
  {availableTypes.map(type => (
    <button
      key={type}
      onClick={() => toggleTypeFilter(type)}
      className={typeFilter.includes(type) ? 'bg-primary-600 text-white' : 'bg-gray-200'}
    >
      {type}
    </button>
  ))}
</div>
```

### Impact

- ✅ Energy type filtering now works on both Cards and Deck Builder pages
- ✅ Users can filter by: Grass, Fire, Water, Lightning, Psychic, Fighting, Darkness, Metal, Fairy, Dragon, Colorless
- ✅ Multi-select support (multiple types can be selected simultaneously)
- ✅ Filters work alongside existing search, rarity, and set filters
- ⚠️ **First Load**: Takes 5-10 minutes to fetch full details for all 2,012 cards
- ✅ **Subsequent Loads**: Instant (24-hour cache)

### Performance Metrics

**Initial card fetch (cold start):**
- Total cards: 2,012 across 12 sets
- Batch size: 10 concurrent requests
- Timeout per card: 30 seconds
- Retries: Up to 3 attempts with exponential backoff
- Estimated time: 5-10 minutes

**Example progress log:**
```
Fetching set: A1
Fetched 286 cards from set A1
Fetching full details for 286 cards in batches of 10...
Progress: 50/286 cards fetched from set A1
Progress: 100/286 cards fetched from set A1
Progress: 150/286 cards fetched from set A1
...
Successfully fetched 286/286 full card details for set A1
```

**Cached loads:**
- Time: ~0-1 seconds
- Cache duration: 24 hours (configurable in `CACHE_DURATION`)

### Prevention

To prevent similar issues in future API integrations:

1. **Always verify data completeness in API responses**
   - Check what fields are actually available in resume vs full details
   - Don't assume all fields exist in all response types
   - Test with actual API calls, not just documentation

2. **Log API response structures during development**
   - Use `console.log(Object.keys(response))` to see available fields
   - Log sample data for the first item to understand structure
   - Document any differences between summary and detail endpoints

3. **Consider performance implications of batched fetching**
   - Balance concurrent requests vs API rate limits
   - Implement progress logging for long-running operations
   - Use exponential backoff for retries
   - Set reasonable timeouts per request

4. **Implement robust caching strategies**
   - Cache expensive API operations (like 2,012 individual card fetches)
   - Use long cache durations for rarely-changing data
   - Consider persistent caching (Redis, file system) for production
   - Log cache hits/misses for monitoring

5. **Provide user feedback for long operations**
   - Show loading states during initial fetch
   - Display progress in console logs
   - Document expected load times in README/user guides
   - Consider background/async loading strategies

### Alternative Solutions Considered

1. **Use TCGDex REST API directly** - Might have different endpoint structure, but would still require individual card fetches

2. **Pre-seed card data as static JSON** - Best long-term solution:
   - Generate static JSON file with full card data
   - Update periodically when new sets are released
   - Instant loads, no API dependency during runtime
   - Trade-off: Manual updates required for new cards

3. **Lazy-load type data on demand** - Fetch full card details only when filtering by type:
   - Faster initial load
   - Slower first-time filtering
   - Complex state management
   - Decided against due to poor UX

4. **Implement incremental loading** - Show cards as they're fetched:
   - Better perceived performance
   - More complex implementation
   - May revisit in future if needed

### Related Files

- `backend/src/services/tcgdex.service.ts` - TCGDex API integration with batched full card fetching
- `frontend/src/pages/DeckBuilder.tsx` - Deck builder with energy type filtering
- `frontend/src/pages/Cards.tsx` - Card browser with energy type filtering (already implemented)
- `frontend/src/types/index.ts` - Card type definitions
- `README.md` - Updated with filtering documentation and performance notes

### Commits

- Added energy type filtering to Deck Builder
- Implemented batched full card fetching for type data
- Updated documentation for first load performance

---

## Future Issues

Document any new issues below this line...
