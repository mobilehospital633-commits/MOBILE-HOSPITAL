import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Smartphone,
  Check,
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Sparkles,
} from 'lucide-react';
import {
  ALL_BRANDS,
  ALPHABET_LETTERS,
  getModelsAtoZ,
} from '../brandModels';

interface AtoZModelCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (selection: { brand: string; model: string; fullDeviceName: string }) => void;
  initialBrand?: string;
  title?: string;
}

export const AtoZModelCatalogModal: React.FC<AtoZModelCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectModel,
  initialBrand = 'All Brands',
  title = 'A to Z Device Models Catalog (All Old & New Models)',
}) => {
  const [selectedBrand, setSelectedBrand] = useState(initialBrand || 'All Brands');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'az' | 'za' | 'default'>('az');

  // Sync initial brand when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialBrand && initialBrand.trim()) {
        setSelectedBrand(initialBrand);
      } else {
        setSelectedBrand('All Brands');
      }
      setSelectedLetter('ALL');
      setSearchQuery('');
    }
  }, [isOpen, initialBrand]);

  // Filtered and sorted models
  const modelResults = useMemo(() => {
    return getModelsAtoZ({
      brand: selectedBrand,
      letter: selectedLetter,
      searchQuery: searchQuery,
      sortOrder: sortOrder,
      limit: 1000,
    });
  }, [selectedBrand, selectedLetter, searchQuery, sortOrder]);

  // Brand letter count mapping - single fast O(N) pass
  const letterCounts = useMemo(() => {
    const all = getModelsAtoZ({
      brand: selectedBrand,
      letter: 'ALL',
      searchQuery: '',
      sortOrder: 'default',
      limit: 2000,
    });
    const counts: Record<string, number> = { ALL: all.length, '0-9': 0 };
    for (let i = 0; i < all.length; i++) {
      const model = all[i].model.trim().toUpperCase();
      if (!model) continue;
      const firstChar = model[0];
      if (firstChar >= '0' && firstChar <= '9') {
        counts['0-9'] = (counts['0-9'] || 0) + 1;
      } else if (firstChar >= 'A' && firstChar <= 'Z') {
        counts[firstChar] = (counts[firstChar] || 0) + 1;
      }
    }
    return counts;
  }, [selectedBrand]);

  if (!isOpen) return null;

  return (
    <div
      id="atoz-model-catalog-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-overlay-fade"
    >
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 animate-modal-enter">
        {/* Header */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-none">
                  {title}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {modelResults.length} Available
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Instant search &amp; alphabetical index spanning all old, classic, and newest models
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            title="Close Catalog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 sm:px-6 sm:py-3 border-b border-zinc-100 bg-white space-y-2.5">
          {/* Top Search & Brand Row */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search any model name, number, or brand (e.g. S24, 15 Pro, Note 9, V29, 3310)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-zinc-900 transition-all font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Brand Filter Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <span>Brand:</span>
              </div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-2.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-zinc-800"
              >
                <option value="All Brands">All Brands ({ALL_BRANDS.length})</option>
                {ALL_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Sort Order Toggle */}
              <button
                type="button"
                onClick={() =>
                  setSortOrder((prev) => (prev === 'az' ? 'za' : prev === 'za' ? 'default' : 'az'))
                }
                className="px-2.5 py-2 text-xs border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded-xl flex items-center gap-1 font-semibold text-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
                title="Toggle Sorting Order"
              >
                {sortOrder === 'az' ? (
                  <>
                    <ArrowDownAZ className="w-3.5 h-3.5 text-blue-600" />
                    <span>A to Z</span>
                  </>
                ) : sortOrder === 'za' ? (
                  <>
                    <ArrowUpAZ className="w-3.5 h-3.5 text-purple-600" />
                    <span>Z to A</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Default</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Alphabet Letters Quick Filter Bar (A to Z) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1 shrink-0">
              Jump A-Z:
            </span>
            {ALPHABET_LETTERS.map((letter) => {
              const count = letterCounts[letter] || 0;
              const isSelected = selectedLetter === letter;
              const isDisabled = count === 0 && letter !== 'ALL';
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : isDisabled
                      ? 'text-zinc-300 opacity-40 cursor-not-allowed bg-zinc-50'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                  title={`${letter} (${count} models)`}
                >
                  <span>{letter}</span>
                  {count > 0 && letter !== 'ALL' && (
                    <span
                      className={`ml-1 text-[9px] font-normal ${
                        isSelected ? 'text-blue-100' : 'text-zinc-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Models Grid & List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/40">
          {modelResults.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-700">
                  No device models found matching "{searchQuery || selectedLetter}"
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Try adjusting the letter filter, clearing search, or use the custom model adder above.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedLetter('ALL');
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters (Show All)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {modelResults.map(({ brand, model, fullDeviceName }) => (
                <button
                  key={`${brand}:::${model}`}
                  type="button"
                  onClick={() => {
                    onSelectModel({ brand, model, fullDeviceName });
                    onClose();
                  }}
                  className="group p-2.5 rounded-xl border border-zinc-200/80 bg-white hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-xs text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-900 group-hover:text-blue-700 truncate">
                      {model}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {brand}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 group-hover:bg-blue-600 group-hover:text-white text-zinc-700 transition-colors">
                    Select
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-6 border-t border-zinc-200 bg-white flex items-center justify-between text-xs text-zinc-500">
          <div>
            Showing <strong className="text-zinc-900">{modelResults.length}</strong> models
            {selectedBrand !== 'All Brands' && ` for ${selectedBrand}`}
            {selectedLetter !== 'ALL' && ` starting with "${selectedLetter}"`}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
