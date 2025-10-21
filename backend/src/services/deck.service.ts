import { db } from '../config/firebase';
import { Deck, CreateDeckInput, UpdateDeckInput } from '../types';

const DECKS_COLLECTION = 'decks';

export class DeckService {
  /**
   * Get all decks for a user
   */
  static async getUserDecks(userId: string): Promise<Deck[]> {
    try {
      const snapshot = await db
        .collection(DECKS_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .get();

      const decks: Deck[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        decks.push({
          id: doc.id,
          name: data.name,
          cards: data.cards,
          notes: data.notes,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          userId: data.userId,
        });
      });

      return decks;
    } catch (error) {
      console.error('Error fetching user decks:', error);
      throw new Error('Failed to fetch decks');
    }
  }

  /**
   * Get a single deck by ID
   */
  static async getDeckById(deckId: string, userId: string): Promise<Deck | null> {
    try {
      const doc = await db.collection(DECKS_COLLECTION).doc(deckId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();

      // Verify the deck belongs to the user
      if (data?.userId !== userId) {
        throw new Error('Unauthorized access to deck');
      }

      return {
        id: doc.id,
        name: data.name,
        cards: data.cards,
        notes: data.notes,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        userId: data.userId,
      };
    } catch (error) {
      console.error('Error fetching deck:', error);
      throw error;
    }
  }

  /**
   * Create a new deck
   */
  static async createDeck(userId: string, deckData: CreateDeckInput): Promise<Deck> {
    try {
      // Validate deck has exactly 20 cards
      const totalCards = deckData.cards.reduce((sum, card) => sum + card.count, 0);
      if (totalCards !== 20) {
        throw new Error('Deck must contain exactly 20 cards');
      }

      const now = new Date();
      const newDeck = {
        name: deckData.name,
        cards: deckData.cards,
        notes: deckData.notes || '',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await db.collection(DECKS_COLLECTION).add(newDeck);

      return {
        id: docRef.id,
        ...newDeck,
      };
    } catch (error) {
      console.error('Error creating deck:', error);
      throw error;
    }
  }

  /**
   * Update an existing deck
   */
  static async updateDeck(
    deckId: string,
    userId: string,
    deckData: UpdateDeckInput
  ): Promise<Deck> {
    try {
      // Verify deck exists and belongs to user
      const existingDeck = await this.getDeckById(deckId, userId);
      if (!existingDeck) {
        throw new Error('Deck not found');
      }

      // Validate deck size if cards are being updated
      if (deckData.cards) {
        const totalCards = deckData.cards.reduce((sum, card) => sum + card.count, 0);
        if (totalCards !== 20) {
          throw new Error('Deck must contain exactly 20 cards');
        }
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (deckData.name !== undefined) updateData.name = deckData.name;
      if (deckData.cards !== undefined) updateData.cards = deckData.cards;
      if (deckData.notes !== undefined) updateData.notes = deckData.notes;

      await db.collection(DECKS_COLLECTION).doc(deckId).update(updateData);

      // Fetch and return updated deck
      const updatedDeck = await this.getDeckById(deckId, userId);
      if (!updatedDeck) {
        throw new Error('Failed to fetch updated deck');
      }

      return updatedDeck;
    } catch (error) {
      console.error('Error updating deck:', error);
      throw error;
    }
  }

  /**
   * Delete a deck
   */
  static async deleteDeck(deckId: string, userId: string): Promise<void> {
    try {
      // Verify deck exists and belongs to user
      const existingDeck = await this.getDeckById(deckId, userId);
      if (!existingDeck) {
        throw new Error('Deck not found');
      }

      await db.collection(DECKS_COLLECTION).doc(deckId).delete();
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw error;
    }
  }
}
