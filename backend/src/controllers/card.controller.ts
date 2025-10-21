import { Response } from 'express';
import { AuthRequest } from '../types';
import { TCGDexService } from '../services/tcgdex.service';

export class CardController {
  /**
   * Get all cards
   */
  static async getAllCards(req: AuthRequest, res: Response): Promise<void> {
    try {
      const cards = await TCGDexService.getAllCards();
      res.json(cards);
    } catch (error) {
      console.error('Error in getAllCards:', error);
      res.status(500).json({ error: 'Failed to fetch cards' });
    }
  }

  /**
   * Get card by ID
   */
  static async getCardById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const card = await TCGDexService.getCardById(id);

      if (!card) {
        res.status(404).json({ error: 'Card not found' });
        return;
      }

      res.json(card);
    } catch (error) {
      console.error('Error in getCardById:', error);
      res.status(500).json({ error: 'Failed to fetch card' });
    }
  }

  /**
   * Clear card cache (useful for debugging/testing)
   */
  static clearCache(req: AuthRequest, res: Response): void {
    try {
      TCGDexService.clearCache();
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Error in clearCache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }
}
