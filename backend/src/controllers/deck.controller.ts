import { Response } from 'express';
import { AuthRequest } from '../types';
import { DeckService } from '../services/deck.service';

export class DeckController {
  /**
   * Get all decks for the authenticated user
   */
  static async getAllDecks(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const decks = await DeckService.getUserDecks(req.user.uid);
      res.json(decks);
    } catch (error) {
      console.error('Error in getAllDecks:', error);
      res.status(500).json({ error: 'Failed to fetch decks' });
    }
  }

  /**
   * Get a single deck by ID
   */
  static async getDeckById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const deck = await DeckService.getDeckById(id, req.user.uid);

      if (!deck) {
        res.status(404).json({ error: 'Deck not found' });
        return;
      }

      res.json(deck);
    } catch (error: any) {
      console.error('Error in getDeckById:', error);

      if (error.message === 'Unauthorized access to deck') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.status(500).json({ error: 'Failed to fetch deck' });
    }
  }

  /**
   * Create a new deck
   */
  static async createDeck(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { name, cards, notes } = req.body;

      // Validation
      if (!name || !cards || !Array.isArray(cards)) {
        res.status(400).json({ error: 'Invalid deck data' });
        return;
      }

      const deck = await DeckService.createDeck(req.user.uid, {
        name,
        cards,
        notes,
      });

      res.status(201).json(deck);
    } catch (error: any) {
      console.error('Error in createDeck:', error);

      if (error.message === 'Deck must contain exactly 20 cards') {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to create deck' });
    }
  }

  /**
   * Update a deck
   */
  static async updateDeck(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { name, cards, notes } = req.body;

      const deck = await DeckService.updateDeck(id, req.user.uid, {
        name,
        cards,
        notes,
      });

      res.json(deck);
    } catch (error: any) {
      console.error('Error in updateDeck:', error);

      if (error.message === 'Deck not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === 'Deck must contain exactly 20 cards') {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message === 'Unauthorized access to deck') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.status(500).json({ error: 'Failed to update deck' });
    }
  }

  /**
   * Delete a deck
   */
  static async deleteDeck(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await DeckService.deleteDeck(id, req.user.uid);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error in deleteDeck:', error);

      if (error.message === 'Deck not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === 'Unauthorized access to deck') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.status(500).json({ error: 'Failed to delete deck' });
    }
  }
}
