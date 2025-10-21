import axios from 'axios';
import { Card, Deck } from '../types';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Card APIs
export const cardApi = {
  getAll: async (): Promise<Card[]> => {
    const response = await api.get('/api/cards');
    return response.data;
  },

  getById: async (id: string): Promise<Card> => {
    const response = await api.get(`/api/cards/${id}`);
    return response.data;
  },
};

// Deck APIs
export const deckApi = {
  getAll: async (): Promise<Deck[]> => {
    const response = await api.get('/api/decks');
    return response.data;
  },

  getById: async (id: string): Promise<Deck> => {
    const response = await api.get(`/api/decks/${id}`);
    return response.data;
  },

  create: async (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Deck> => {
    const response = await api.post('/api/decks', deck);
    return response.data;
  },

  update: async (id: string, deck: Partial<Deck>): Promise<Deck> => {
    const response = await api.put(`/api/decks/${id}`, deck);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/decks/${id}`);
  },
};

export default api;
