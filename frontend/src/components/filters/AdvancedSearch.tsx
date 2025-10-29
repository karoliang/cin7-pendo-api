import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, Bookmark, X } from 'lucide-react';

type SearchType = 'all' | 'guide' | 'feature' | 'page' | 'report';
type SearchItemType = 'guide' | 'feature' | 'page' | 'report';

interface SearchFilters {
  type: SearchType;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: SearchItemType;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  className?: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  className
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Mock suggestions based on current data
  const generateMockSuggestions = useCallback((searchText: string): SearchSuggestion[] => {
    if (!searchText || searchText.length < 2) return [];

    const mockData: Array<{ text: string; type: SearchItemType }> = [
      { text: 'Getting Started Guide', type: 'guide' },
      { text: 'Dashboard Analytics', type: 'feature' },
      { text: 'Advanced Features', type: 'guide' },
      { text: 'Weekly Usage Report', type: 'report' },
      { text: 'Export Reports', type: 'feature' },
      { text: 'Cloud Dashboard', type: 'page' },
      { text: 'User Onboarding', type: 'guide' },
    ];

    return mockData
      .filter(item =>
        item.text.toLowerCase().includes(searchText.toLowerCase()) &&
        (searchType === 'all' || item.type === searchType)
      )
      .slice(0, 5)
      .map((item, index) => ({
        id: `${index}-${item.text}`,
        text: item.text,
        type: item.type
      }));
  }, [searchType]);

  useEffect(() => {
    const delayedSuggestions = setTimeout(() => {
      if (query.length >= 2) {
        const newSuggestions = generateMockSuggestions(query);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayedSuggestions);
  }, [query, generateMockSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [searchQuery, ...prev.filter(q => q !== searchQuery)];
        return newHistory.slice(0, 10); // Keep last 10 searches
      });

      onSearch(searchQuery, { type: searchType });
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    handleSearch(historyItem);
  };

  const saveSearch = () => {
    if (query.trim()) {
      const newSavedSearch: SavedSearch = {
        id: Date.now().toString(),
        name: query.trim(),
        query: query.trim(),
        filters: { type: searchType },
        createdAt: new Date().toISOString()
      };

      setSavedSearches(prev => [newSavedSearch, ...prev.slice(0, 5)]); // Keep last 5 saved searches
    }
  };

  const deleteSavedSearch = (id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setSearchType(savedSearch.filters.type);
    onSearch(savedSearch.query, savedSearch.filters);
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Search Input */}
        <div className="relative" ref={suggestionsRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search guides, features, pages, reports..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                className="pl-10"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Select value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="guide">Guides</SelectItem>
                <SelectItem value="feature">Features</SelectItem>
                <SelectItem value="page">Pages</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => handleSearch()}>
              Search
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <Search className="h-4 w-4 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <span className="font-medium">{suggestion.text}</span>
                    <span className="ml-2 text-xs text-gray-500 capitalize">
                      {suggestion.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6 space-y-6">
            {/* Search History */}
            {searchHistory.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Searches
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(item)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Searches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  Saved Searches
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveSearch}
                  disabled={!query.trim()}
                  className="text-gray-500"
                >
                  Save Current
                </Button>
              </div>

              {savedSearches.length > 0 ? (
                <div className="space-y-2">
                  {savedSearches.map((savedSearch) => (
                    <div
                      key={savedSearch.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex-1">
                        <button
                          onClick={() => loadSavedSearch(savedSearch)}
                          className="text-left w-full hover:text-blue-600 transition-colors"
                        >
                          <p className="font-medium">{savedSearch.name}</p>
                          <p className="text-xs text-gray-500">
                            {savedSearch.filters.type} •
                            {new Date(savedSearch.createdAt).toLocaleDateString()}
                          </p>
                        </button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSavedSearch(savedSearch.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No saved searches yet. Save a search to quickly access it later.
                </p>
              )}
            </div>

            {/* Search Tips */}
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Search Tips</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Use quotes for exact phrases: "getting started"</li>
                <li>• Search supports partial matching</li>
                <li>• Filter by type using the dropdown</li>
                <li>• Save frequently used searches for quick access</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};