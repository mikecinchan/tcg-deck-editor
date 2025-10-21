import { Router } from 'express';
import { CardController } from '../controllers/card.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All card routes require authentication
router.use(authenticateUser);

// GET /api/cards - Get all cards
router.get('/', CardController.getAllCards);

// POST /api/cards/clear-cache - Clear card cache
router.post('/clear-cache', CardController.clearCache);

// GET /api/cards/:id - Get card by ID
router.get('/:id', CardController.getCardById);

export default router;
