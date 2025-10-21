import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cardApi, deckApi } from '../services/api';
import { Card, DeckCard } from '../types';
import { Search, Save, X, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_DECK_SIZE = 20;

export const DeckBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [deckCards, setDeckCards] = useState<Map<string, DeckCard>>(new Map());
  const [deckName, setDeckName] = useState('');
  const [deckNotes, setDeckNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalCards = Array.from(deckCards.values()).reduce((sum, dc) => sum + dc.count, 0);

  useEffect(() => {
    fetchCards();
    if (id) {
      fetchDeck();
    }
  }, [id]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredCards(cards.filter(card => card.name.toLowerCase().includes(query)));
    } else {
      setFilteredCards(cards);
    }
  }, [searchQuery, cards]);

  const fetchCards = async () => {
    try {
      const data = await cardApi.getAll();
      setCards(data);
      setFilteredCards(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeck = async () => {
    if (!id) return;
    try {
      const deck = await deckApi.getById(id);
      setDeckName(deck.name);
      setDeckNotes(deck.notes || '');
      const deckMap = new Map(deck.cards.map(dc => [dc.cardId, dc]));
      setDeckCards(deckMap);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load deck');
    }
  };

  const addCard = (cardId: string) => {
    const currentCard = deckCards.get(cardId);
    const currentCount = currentCard?.count || 0;

    if (totalCards >= MAX_DECK_SIZE) {
      toast.error(`Deck is full (${MAX_DECK_SIZE} cards maximum)`);
      return;
    }

    const newDeckCards = new Map(deckCards);
    newDeckCards.set(cardId, { cardId, count: currentCount + 1 });
    setDeckCards(newDeckCards);
  };

  const removeCard = (cardId: string) => {
    const currentCard = deckCards.get(cardId);
    if (!currentCard) return;

    const newDeckCards = new Map(deckCards);
    if (currentCard.count > 1) {
      newDeckCards.set(cardId, { cardId, count: currentCard.count - 1 });
    } else {
      newDeckCards.delete(cardId);
    }
    setDeckCards(newDeckCards);
  };

  const handleSave = async () => {
    if (!deckName.trim()) {
      toast.error('Please enter a deck name');
      return;
    }

    if (totalCards !== MAX_DECK_SIZE) {
      toast.error(`Deck must contain exactly ${MAX_DECK_SIZE} cards`);
      return;
    }

    try {
      setSaving(true);
      const deckData = {
        name: deckName,
        cards: Array.from(deckCards.values()),
        notes: deckNotes,
      };

      if (id) {
        await deckApi.update(id, deckData);
        toast.success('Deck updated successfully');
      } else {
        await deckApi.create(deckData);
        toast.success('Deck created successfully');
      }
      navigate('/decks');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save deck');
    } finally {
      setSaving(false);
    }
  };

  const getCardById = (cardId: string): Card | undefined => {
    return cards.find(c => c.id === cardId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {id ? 'Edit Deck' : 'Build New Deck'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Selection */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto">
              {filteredCards.map(card => {
                const cardCount = deckCards.get(card.id)?.count || 0;
                return (
                  <div
                    key={card.id}
                    className="bg-gray-50 rounded-lg p-3 relative group"
                  >
                    {card.image && (
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-auto rounded-md mb-2"
                      />
                    )}
                    <h3 className="font-semibold text-xs text-gray-900 truncate">{card.name}</h3>
                    {cardCount > 0 && (
                      <span className="absolute top-2 right-2 bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {cardCount}
                      </span>
                    )}
                    <button
                      onClick={() => addCard(card.id)}
                      disabled={totalCards >= MAX_DECK_SIZE}
                      className="mt-2 w-full py-1 px-2 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deck Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Deck Summary</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deck Name
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Enter deck name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={deckNotes}
                  onChange={(e) => setDeckNotes(e.target.value)}
                  placeholder="Add deck notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-4 p-3 bg-gray-100 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Cards:</span>
                  <span className={`text-lg font-bold ${totalCards === MAX_DECK_SIZE ? 'text-green-600' : 'text-primary-600'}`}>
                    {totalCards} / {MAX_DECK_SIZE}
                  </span>
                </div>
              </div>

              {/* Selected Cards List */}
              <div className="mb-4 max-h-[300px] overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Cards</h3>
                {Array.from(deckCards.entries()).map(([cardId, deckCard]) => {
                  const card = getCardById(cardId);
                  if (!card) return null;
                  return (
                    <div key={cardId} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{card.name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeCard(cardId)}
                          className="p-1 text-gray-600 hover:text-red-600"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-sm font-semibold text-gray-700 w-6 text-center">
                          {deckCard.count}
                        </span>
                        <button
                          onClick={() => addCard(cardId)}
                          disabled={totalCards >= MAX_DECK_SIZE}
                          className="p-1 text-gray-600 hover:text-green-600 disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {deckCards.size === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No cards selected</p>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || totalCards !== MAX_DECK_SIZE || !deckName.trim()}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                <span>{saving ? 'Saving...' : 'Save Deck'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
