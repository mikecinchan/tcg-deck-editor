import TCGdex from '@tcgdex/sdk';
import { Card } from '../types';

// Initialize TCGDex SDK
const tcgdex = new TCGdex('en');

// Cache for cards to reduce API calls
let cardsCache: Card[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours (card data rarely changes)

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

export class TCGDexService {
  /**
   * Get all Pokemon TCG Pocket cards
   */
  static async getAllCards(): Promise<Card[]> {
    try {
      // Return cached data if still valid
      const now = Date.now();
      if (cardsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('Returning cached cards');
        return cardsCache;
      }

      console.log('Fetching cards from TCGDex API...');

      // Fetch the 'tcgp' series (Pokemon TCG Pocket) with retry and timeout
      const tcgpSeries = await retryWithBackoff(() =>
        withTimeout(tcgdex.serie.get('tcgp'), 30000) // 30 second timeout
      );

      if (!tcgpSeries || !tcgpSeries.sets || tcgpSeries.sets.length === 0) {
        console.log('No sets found for tcgp series');
        return [];
      }

      console.log(`Found ${tcgpSeries.sets.length} sets in tcgp series:`, tcgpSeries.sets.map((s: any) => s.id || s.name));

      // Fetch all cards from each set
      const allCards: Card[] = [];

      for (const setResume of tcgpSeries.sets) {
        try {
          // Get the full set details including cards with retry and timeout
          const setId = setResume.id || setResume.name;
          console.log(`Fetching set: ${setId}`);
          const setDetails = await retryWithBackoff(() =>
            withTimeout(tcgdex.set.get(setId), 30000) // 30 second timeout per set
          );

          if (setDetails && setDetails.cards) {
            console.log(`Fetched ${setDetails.cards.length} cards from set ${setId}`);

            // Transform cards to our format (cards data is already included in setDetails)
            const cards = setDetails.cards.map((card: any, index: number) => {
              // Extract card number from localId (e.g., "A1-001" -> "001")
              const cardNumber = card.localId ? card.localId.split('-')[1] : card.id;

              // Construct image URL
              // TCGdex API returns image URLs WITHOUT extensions
              // We need to append /{quality}.{extension} to the base URL
              // Format: https://assets.tcgdex.net/en/tcgp/{setId}/{cardNumber}/{quality}.{extension}
              let imageUrl = '';

              if (typeof card.image === 'string') {
                // If it's a string, it's likely the base URL without extension
                // Append high quality webp format (recommended by TCGdex)
                imageUrl = card.image.endsWith('.webp') || card.image.endsWith('.png') || card.image.endsWith('.jpg')
                  ? card.image
                  : `${card.image}/high.webp`;
              } else if (card.image && typeof card.image === 'object') {
                // If it's an object, try to get the base URL and append quality/extension
                const baseUrl = card.image.high || card.image.low || card.image.small || card.image.large || '';
                imageUrl = baseUrl.endsWith('.webp') || baseUrl.endsWith('.png') || baseUrl.endsWith('.jpg')
                  ? baseUrl
                  : `${baseUrl}/high.webp`;
              }

              // If no image URL found, construct it manually using TCGdex CDN pattern
              if (!imageUrl && setId && cardNumber) {
                imageUrl = `https://assets.tcgdex.net/en/tcgp/${setId}/${cardNumber}/high.webp`;
              }

              // Log first card's image URL for debugging
              if (index === 0) {
                console.log(`Sample image URL for ${card.name} (${card.localId}): ${imageUrl}`);
              }

              // Only include serializable properties (avoid circular references from TCGdex SDK)
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
            });

            allCards.push(...cards);
          }
        } catch (error) {
          console.error(`Error fetching set ${setResume.id || setResume.name}:`, error);
        }
      }

      console.log(`Total cards fetched: ${allCards.length}`);

      // Update cache
      cardsCache = allCards;
      cacheTimestamp = now;

      return allCards;
    } catch (error) {
      console.error('Error fetching cards from TCGDex:', error);

      // If cache exists, return it even if expired
      if (cardsCache) {
        console.log('Returning expired cache due to error');
        return cardsCache;
      }

      throw new Error('Failed to fetch cards from TCGDex API');
    }
  }

  /**
   * Get a single card by ID
   */
  static async getCardById(id: string): Promise<Card | null> {
    try {
      const allCards = await this.getAllCards();
      const card = allCards.find(c => c.id === id);
      return card || null;
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      throw new Error('Failed to fetch card');
    }
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    cardsCache = null;
    cacheTimestamp = 0;
    console.log('Cache cleared');
  }
}
