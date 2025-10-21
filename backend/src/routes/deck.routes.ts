import { Router } from 'express';
import { DeckController } from '../controllers/deck.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All deck routes require authentication
router.use(authenticateUser);

// GET /api/decks - Get all decks for user
router.get('/', DeckController.getAllDecks);

// GET /api/decks/:id - Get deck by ID
router.get('/:id', DeckController.getDeckById);

// POST /api/decks - Create new deck
router.post('/', DeckController.createDeck);

// PUT /api/decks/:id - Update deck
router.put('/:id', DeckController.updateDeck);

// DELETE /api/decks/:id - Delete deck
router.delete('/:id', DeckController.deleteDeck);

export default router;
