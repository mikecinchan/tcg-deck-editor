import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { deckApi, cardApi } from '../services/api';
import { Deck, Card } from '../types';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const DeckView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [deckData, cardsData] = await Promise.all([
        deckApi.getById(id),
        cardApi.getAll(),
      ]);
      setDeck(deckData);
      setCards(cardsData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load deck');
      navigate('/decks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deckApi.delete(id);
      toast.success('Deck deleted successfully');
      navigate('/decks');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete deck');
    }
  };

  const getCardById = (cardId: string): Card | undefined => {
    return cards.find(c => c.id === cardId);
  };

  const getDeckCards = (): Array<{ card: Card; count: number }> => {
    if (!deck) return [];
    return deck.cards
      .map(dc => {
        const card = getCardById(dc.cardId);
        return card ? { card, count: dc.count } : null;
      })
      .filter(Boolean) as Array<{ card: Card; count: number }>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return null;
  }

  const deckCards = getDeckCards();
  const totalCards = deck.cards.reduce((sum, dc) => sum + dc.count, 0);

  // Calculate deck statistics
  const typeDistribution = deckCards.reduce((acc, { card, count }) => {
    if (card.types) {
      card.types.forEach(type => {
        acc[type] = (acc[type] || 0) + count;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/decks"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Decks</span>
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{deck.name}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Created {new Date(deck.createdAt).toLocaleDateString()} • Last updated {new Date(deck.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to={`/deck-builder/${deck.id}`}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Edit size={18} />
                <span>Edit</span>
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deck Cards */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Cards ({totalCards})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {deckCards.map(({ card, count }) => (
                  <div key={card.id} className="relative">
                    {card.image && (
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-auto rounded-md"
                      />
                    )}
                    {count > 1 && (
                      <span className="absolute top-2 right-2 bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                        {count}
                      </span>
                    )}
                    <p className="mt-2 text-sm font-medium text-gray-900 truncate">
                      {card.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deck Info & Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Deck Info</h2>
              <div className="space-y-3">
                <div className="p-3 bg-gray-100 rounded-md">
                  <span className="text-sm text-gray-600">Total Cards</span>
                  <p className="text-2xl font-bold text-primary-600">{totalCards}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-md">
                  <span className="text-sm text-gray-600">Unique Cards</span>
                  <p className="text-2xl font-bold text-primary-600">{deck.cards.length}</p>
                </div>
              </div>
            </div>

            {Object.keys(typeDistribution).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Type Distribution</h2>
                <div className="space-y-2">
                  {Object.entries(typeDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{type}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${(count / totalCards) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {deck.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{deck.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Deck</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deck.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
