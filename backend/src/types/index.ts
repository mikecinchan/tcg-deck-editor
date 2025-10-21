import { Request } from 'express';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

// TCG Pocket Card Types (matching TCGDex structure)
export interface Card {
  id: string;
  localId: string;
  name: string;
  image?: string;
  category?: string;
  hp?: number;
  types?: string[];
  stage?: string;
  rarity?: string;
  set?: {
    id: string;
    name: string;
  };
  dexId?: number[];
  level?: number;
  description?: string;
  attacks?: Attack[];
  weaknesses?: TypeEffect[];
  resistances?: TypeEffect[];
  retreat?: number;
  effect?: string;
}

export interface Attack {
  name: string;
  cost?: string[];
  damage?: string | number;
  effect?: string;
}

export interface TypeEffect {
  type: string;
  value?: string;
}

// Deck Types
export interface Deck {
  id: string;
  name: string;
  cards: DeckCard[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface DeckCard {
  cardId: string;
  count: number;
}

export interface CreateDeckInput {
  name: string;
  cards: DeckCard[];
  notes?: string;
}

export interface UpdateDeckInput {
  name?: string;
  cards?: DeckCard[];
  notes?: string;
}
