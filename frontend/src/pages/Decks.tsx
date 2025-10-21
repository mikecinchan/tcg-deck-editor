import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deckApi, cardApi } from '../services/api';
import { Deck, Card } from '../types';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export const Decks = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [decksData, cardsData] = await Promise.all([
        deckApi.getAll(),
        cardApi.getAll(),
      ]);
      setDecks(decksData);
      setCards(cardsData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load decks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deckApi.delete(id);
      setDecks(decks.filter(d => d.id !== id));
      setDeleteId(null);
      toast.success('Deck deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete deck');
    }
  };

  const getCardById = (cardId: string): Card | undefined => {
    return cards.find(c => c.id === cardId);
  };

  const getDeckPreview = (deck: Deck): Card[] => {
    return deck.cards
      .slice(0, 4)
      .map(dc => getCardById(dc.cardId))
      .filter(Boolean) as Card[];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading decks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Decks</h1>
          <Link
            to="/deck-builder"
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Deck</span>
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't created any decks yet</p>
            <Link
              to="/deck-builder"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} />
              <span>Create Your First Deck</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => {
              const previewCards = getDeckPreview(deck);
              const totalCards = deck.cards.reduce((sum, dc) => sum + dc.count, 0);

              return (
                <div key={deck.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{deck.name}</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      {totalCards} cards • Created {new Date(deck.createdAt).toLocaleDateString()}
                    </p>

                    {/* Card Preview */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {previewCards.map((card, idx) => (
                        <div key={idx} className="aspect-square">
                          {card.image ? (
                            <img
                              src={card.image}
                              alt={card.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-500">No image</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {deck.notes && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{deck.notes}</p>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/deck/${deck.id}`)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => navigate(`/deck-builder/${deck.id}`)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
                      >
                        <Edit size={16} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteId(deck.id)}
                        className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Deck</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this deck? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
