import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cardApi } from '../services/api';
import { Card, CardFilters } from '../types';
import { Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const Cards = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CardFilters>({
    search: '',
    types: [],
    rarities: [],
    sets: [],
  });

  // Get unique values for filters
  const availableTypes = Array.from(new Set(cards.flatMap(card => card.types || [])));
  const availableRarities = Array.from(new Set(cards.map(card => card.rarity).filter(Boolean)));
  const availableSets = Array.from(new Set(cards.map(card => card.set?.name).filter(Boolean)));

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cards, filters]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const data = await cardApi.getAll();
      setCards(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...cards];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(card =>
        card.name.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filters.types.length > 0) {
      result = result.filter(card =>
        card.types?.some(type => filters.types.includes(type))
      );
    }

    // Rarity filter
    if (filters.rarities.length > 0) {
      result = result.filter(card =>
        card.rarity && filters.rarities.includes(card.rarity)
      );
    }

    // Set filter
    if (filters.sets.length > 0) {
      result = result.filter(card =>
        card.set?.name && filters.sets.includes(card.set.name)
      );
    }

    setFilteredCards(result);
  };

  const toggleFilter = (filterType: keyof Omit<CardFilters, 'search'>, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pokemon Cards</h1>
          <Link
            to="/deck-builder"
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            <span>Build Deck</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search cards by name..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Type</h3>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('types', type)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.types.includes(type)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Rarity Filter */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Rarity</h3>
              <div className="flex flex-wrap gap-2">
                {availableRarities.map(rarity => (
                  <button
                    key={rarity}
                    onClick={() => toggleFilter('rarities', rarity as string)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.rarities.includes(rarity as string)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {rarity}
                  </button>
                ))}
              </div>
            </div>

            {/* Set Filter */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Set</h3>
              <div className="flex flex-wrap gap-2">
                {availableSets.map(set => (
                  <button
                    key={set}
                    onClick={() => toggleFilter('sets', set as string)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.sets.includes(set as string)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {set}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredCards.length} of {cards.length} cards
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCards.map(card => (
            <div
              key={card.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 cursor-pointer"
            >
              {card.image && (
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-auto rounded-md mb-2"
                />
              )}
              <h3 className="font-semibold text-sm text-gray-900 truncate">{card.name}</h3>
              {card.types && (
                <div className="flex gap-1 mt-1">
                  {card.types.map(type => (
                    <span
                      key={type}
                      className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
              {card.hp && (
                <p className="text-xs text-gray-500 mt-1">HP: {card.hp}</p>
              )}
            </div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No cards found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};
