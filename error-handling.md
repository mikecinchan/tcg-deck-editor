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

## Future Issues

Document any new issues below this line...
