import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Sparkles,
  Tag,
  DollarSign,
  Layers,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  X,
  RotateCcw,
  Barcode,
  TrendingUp,
  Boxes,
  Star,
  Download,
} from 'lucide-react';
import { InventoryItem, PartCategory, ShopProfile, UserRole } from '../types';

export const INVENTORY_CATEGORIES: PartCategory[] = [
  'Screens & Displays',
  'Batteries',
  'Charging Ports & Flex',
  'Cameras & Lenses',
  'Speakers & Earpiece',
  'Housings & Frames',
  'Motherboard & ICs',
  'Tempered Glass',
  'Cases & Covers',
  'Audio & Headphones',
  'Buttons & Sensors',
  'Workshop Consumables',
  'General Spares',
];

export const POPULAR_INVENTORY_BRANDS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Vivo',
  'Oppo',
  'Realme',
  'OnePlus',
  'Motorola',
  'Google Pixel',
  'Infinix',
  'Tecno',
  'Generic / Universal',
];

interface InventoryTabProps {
  inventory: InventoryItem[];
  profile: ShopProfile;
  userRole?: UserRole;
  onAddInventory: (item: InventoryItem) => void;
  onUpdateInventory: (item: InventoryItem) => void;
  onDeleteInventory: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
  onResetCatalog?: () => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  inventory,
  profile,
  userRole = 'owner',
  onAddInventory,
  onUpdateInventory,
  onDeleteInventory,
  onAdjustStock,
  onResetCatalog,
}) => {
  const curr = profile.currency || '₹';

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);

  const [activeFilter, setActiveFilter] = useState<'all' | 'custom' | 'low-stock' | 'in-stock'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'custom-first' | 'name-asc' | 'qty-asc' | 'qty-desc' | 'price-desc' | 'margin-desc'>('custom-first');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('Apple');
  const [formCustomBrand, setFormCustomBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Screens & Displays');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formQty, setFormQty] = useState('5');
  const [formMinStock, setFormMinStock] = useState('2');
  const [formCostPrice, setFormCostPrice] = useState('0');
  const [formSalePrice, setFormSalePrice] = useState('0');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Reset confirmation modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [barcodeLabelItem, setBarcodeLabelItem] = useState<InventoryItem | null>(null);

  // Open modal for Adding new Custom item
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormBrand('Apple');
    setFormCustomBrand('');
    setFormModel('');
    setFormCategory('Screens & Displays');
    setFormCustomCategory('');
    // Auto-generate clean custom SKU
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    setFormSku(`INV-CUST-${randomCode}`);
    setFormQty('5');
    setFormMinStock('2');
    setFormCostPrice('');
    setFormSalePrice('');
    setFormLocation('');
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Editing an item
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    if (POPULAR_INVENTORY_BRANDS.includes(item.brand || '')) {
      setFormBrand(item.brand || 'Apple');
      setFormCustomBrand('');
    } else {
      setFormBrand('Other');
      setFormCustomBrand(item.brand || '');
    }
    setFormModel(item.model || '');
    if (INVENTORY_CATEGORIES.includes(item.category as any)) {
      setFormCategory(item.category || 'Screens & Displays');
      setFormCustomCategory('');
    } else {
      setFormCategory('Other');
      setFormCustomCategory(item.category || '');
    }
    setFormSku(item.sku || '');
    setFormQty(String(item.qty || 0));
    setFormMinStock(String(item.minStock || 2));
    setFormCostPrice(item.costPrice !== undefined ? String(item.costPrice) : '');
    setFormSalePrice(item.salePrice !== undefined ? String(item.salePrice) : '');
    setFormLocation(item.location || '');
    setFormNotes(item.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Item / Part Name is required.');
      return;
    }

    const finalBrand = formBrand === 'Other' ? formCustomBrand.trim() || 'Generic' : formBrand;
    const finalCategory = formCategory === 'Other' ? formCustomCategory.trim() || 'General Spares' : formCategory;
    const finalSku = formSku.trim() || `INV-${Date.now().toString().slice(-6)}`;
    const numQty = Math.max(0, parseInt(formQty) || 0);
    const numMin = Math.max(0, parseInt(formMinStock) || 2);
    const numCost = Math.max(0, parseFloat(formCostPrice) || 0);
    const numSale = Math.max(0, parseFloat(formSalePrice) || 0);

    if (editingItem) {
      // Update
      const updated: InventoryItem = {
        ...editingItem,
        name: formName.trim(),
        brand: finalBrand,
        model: formModel.trim() || undefined,
        category: finalCategory,
        sku: finalSku,
        qty: numQty,
        minStock: numMin,
        costPrice: numCost,
        salePrice: numSale,
        location: formLocation.trim() || undefined,
        notes: formNotes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      onUpdateInventory(updated);
    } else {
      // New Custom Item
      const newItem: InventoryItem = {
        id: `INV-CUST-${Date.now()}`,
        name: formName.trim(),
        brand: finalBrand,
        model: formModel.trim() || undefined,
        category: finalCategory,
        sku: finalSku,
        qty: numQty,
        minStock: numMin,
        costPrice: numCost,
        salePrice: numSale,
        isCustom: true,
        location: formLocation.trim() || undefined,
        notes: formNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddInventory(newItem);
    }

    setIsModalOpen(false);
  };

  // Aggregate stats
  const customItemsCount = useMemo(() => {
    return inventory.filter((item) => item.isCustom).length;
  }, [inventory]);

  const totalStockUnits = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.qty || 0), 0);
  }, [inventory]);

  const totalInventoryCostValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + ((item.costPrice || 0) * (item.qty || 0)), 0);
  }, [inventory]);

  const totalInventoryRetailValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + ((item.salePrice || item.costPrice || 0) * (item.qty || 0)), 0);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((item) => (item.qty || 0) <= (item.minStock || 2)).length;
  }, [inventory]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory
      .filter((item) => {
        const q = deferredSearch.toLowerCase().trim();
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.brand || '').toLowerCase().includes(q) ||
          (item.model || '').toLowerCase().includes(q) ||
          (item.sku || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q) ||
          (item.location || '').toLowerCase().includes(q);

        let matchesTab = true;
        if (activeFilter === 'custom') {
          matchesTab = Boolean(item.isCustom);
        } else if (activeFilter === 'low-stock') {
          matchesTab = (item.qty || 0) <= (item.minStock || 2);
        } else if (activeFilter === 'in-stock') {
          matchesTab = (item.qty || 0) > 0;
        }

        let matchesCat = true;
        if (selectedCategory !== 'All') {
          matchesCat = item.category === selectedCategory;
        }

        let matchesBrand = true;
        if (selectedBrand !== 'All') {
          matchesBrand = item.brand === selectedBrand;
        }

        return matchesSearch && matchesTab && matchesCat && matchesBrand;
      })
      .sort((a, b) => {
        if (sortBy === 'custom-first') {
          if (a.isCustom && !b.isCustom) return -1;
          if (!a.isCustom && b.isCustom) return 1;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'qty-asc') return (a.qty || 0) - (b.qty || 0);
        if (sortBy === 'qty-desc') return (b.qty || 0) - (a.qty || 0);
        if (sortBy === 'price-desc') return (b.salePrice || 0) - (a.salePrice || 0);
        if (sortBy === 'margin-desc') {
          const marginA = (a.salePrice || 0) - (a.costPrice || 0);
          const marginB = (b.salePrice || 0) - (b.costPrice || 0);
          return marginB - marginA;
        }
        return 0;
      });
  }, [inventory, deferredSearch, activeFilter, selectedCategory, selectedBrand, sortBy]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, activeFilter, selectedCategory, selectedBrand, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / (pageSize === 0 ? (filteredInventory.length || 1) : pageSize)));

  const paginatedInventory = useMemo(() => {
    if (pageSize === 0) return filteredInventory;
    const start = (currentPage - 1) * pageSize;
    return filteredInventory.slice(start, start + pageSize);
  }, [filteredInventory, currentPage, pageSize]);

  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const handleExportInventoryCSV = () => {
    if (inventory.length === 0) return;
    const headers = [
      'SKU',
      'Item Name',
      'Brand',
      'Model',
      'Category',
      'Quantity In Stock',
      'Min Stock Alert',
      'Cost Price',
      'Sale Price',
      'Profit Margin',
      'Location / Bin',
      'Custom Added',
      'Notes',
    ];
    const rows = inventory.map((item) => {
      const profit = (item.salePrice || 0) - (item.costPrice || 0);
      return [
        `"${item.sku}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${(item.brand || '').replace(/"/g, '""')}"`,
        `"${(item.model || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        item.qty || 0,
        item.minStock || 2,
        item.costPrice || 0,
        item.salePrice || 0,
        profit,
        `"${(item.location || '').replace(/"/g, '""')}"`,
        item.isCustom ? 'Yes' : 'No',
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MH_Inventory_Stock_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Valuation Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs shrink-0">
              <Package className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-zinc-950 tracking-tight">
                  Inventory & Spare Parts
                </h2>
                {customItemsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{customItemsCount} Custom Added</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage mobile displays, batteries, accessories, wholesale cost, and stock alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* ADD CUSTOM INVENTORY ITEM BUTTON */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Item</span>
            </button>

            <button
              type="button"
              onClick={handleExportInventoryCSV}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download full inventory catalog as CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500" />
              <span>Print Stock Sheet</span>
            </button>

            {userRole !== 'staff' && onResetCatalog && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset or restore standard catalog"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Catalog</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Financial & Stock KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-zinc-100">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Total Parts Catalog
              </span>
              <Boxes className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-zinc-900 mt-2 tracking-tight">
              {inventory.length} <span className="text-xs font-normal text-zinc-500 font-sans">Items</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium mt-1">
              {totalStockUnits} total units in stock ({customItemsCount} custom)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Cost Valuation
              </span>
              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                {curr}
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-2 tracking-tight font-mono tabular-nums">
              {curr}{totalInventoryCostValue.toFixed(0)}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Wholesale purchasing capital invested
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Retail / Selling Value
              </span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-900 mt-2 tracking-tight font-mono tabular-nums">
              {curr}{totalInventoryRetailValue.toFixed(0)}
            </div>
            <p className="text-[11px] text-blue-700 font-medium mt-1">
              Est. Profit: +{curr}{(totalInventoryRetailValue - totalInventoryCostValue).toFixed(0)}
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${
            lowStockCount > 0
              ? 'bg-amber-50/80 border-amber-200/90 text-amber-900'
              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Low Stock Alerts
              </span>
              <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-zinc-400'}`} />
            </div>
            <div className="text-2xl font-black font-mono tabular-nums mt-2 tracking-tight">
              {lowStockCount} <span className="text-xs font-normal font-sans">Need Reorder</span>
            </div>
            <p className="text-[11px] font-medium mt-1">
              {lowStockCount > 0 ? 'Stock at or below minimum threshold' : 'All items sufficiently stocked'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by part name, brand, model, SKU barcode, or rack..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-hidden bg-zinc-50/50 focus:bg-white text-zinc-900"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Segmented Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 overflow-x-auto w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-white text-zinc-950 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({inventory.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('custom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'custom'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>Custom Added ({customItemsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('low-stock')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'low-stock'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Low Stock ({lowStockCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('in-stock')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === 'in-stock'
                  ? 'bg-white text-zinc-950 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              In Stock
            </button>
          </div>
        </div>

        {/* Second row filters: Category, Brand & Sorting */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-800 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Categories</option>
              {INVENTORY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 font-medium">Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-800 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Brands</option>
              {POPULAR_INVENTORY_BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-800 focus:outline-hidden cursor-pointer"
            >
              <option value="custom-first">⭐ Custom Added First</option>
              <option value="name-asc">Item Name (A-Z)</option>
              <option value="qty-asc">Stock: Low to High (Alerts First)</option>
              <option value="qty-desc">Stock: High to Low</option>
              <option value="price-desc">Sale Price (High to Low)</option>
              <option value="margin-desc">Profit Margin (Highest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Items List / Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        {filteredInventory.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">No Inventory Items Found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              No parts or accessories match your filter criteria. Click below to add a new custom inventory item.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Item</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="py-3 px-5">Part / Item Details</th>
                  <th className="py-3 px-5">Brand & Model</th>
                  <th className="py-3 px-5">Category & Rack</th>
                  <th className="py-3 px-5">Stock & Stepper</th>
                  <th className="py-3 px-5">Cost Price</th>
                  <th className="py-3 px-5">Sale Price & Margin</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginatedInventory.map((item) => {
                  const isLow = (item.qty || 0) <= (item.minStock || 2);
                  const isOut = (item.qty || 0) === 0;
                  const profit = (item.salePrice || 0) - (item.costPrice || 0);
                  const marginPct = item.costPrice && item.costPrice > 0
                    ? Math.round((profit / item.costPrice) * 100)
                    : null;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/70 transition-colors group"
                    >
                      {/* Name & Custom Badge */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-bold text-zinc-950 text-sm">{item.name}</strong>
                          {item.isCustom && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              <span>Custom</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 font-mono">
                          <span>SKU: {item.sku}</span>
                          <button
                            type="button"
                            onClick={() => handleCopySku(item.sku)}
                            className="text-[10px] text-zinc-400 hover:text-zinc-700 cursor-pointer"
                            title="Copy SKU code"
                          >
                            {copiedSku === item.sku ? (
                              <span className="text-emerald-600 font-bold">Copied!</span>
                            ) : (
                              'Copy'
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Brand & Compatible Model */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-zinc-800 text-xs">{item.brand || 'Generic'}</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {item.model || 'Universal / All Models'}
                        </div>
                      </td>

                      {/* Category & Storage Location */}
                      <td className="py-3.5 px-5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {item.category || 'General Spares'}
                        </span>
                        {item.location && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-1">
                            <MapPin className="w-3 h-3 text-zinc-400" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </td>

                      {/* Stock Quantity & +/- Stepper */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => onAdjustStock(item.id, -1)}
                              disabled={item.qty <= 0}
                              className="w-7 h-7 flex items-center justify-center hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold cursor-pointer transition-colors"
                              title="Decrease stock by 1"
                            >
                              -
                            </button>
                            <span className="w-9 text-center font-mono font-bold text-xs text-zinc-950 tabular-nums">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAdjustStock(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer transition-colors"
                              title="Increase stock by 1"
                            >
                              +
                            </button>
                          </div>

                          {/* Status Pill */}
                          {isOut ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Low ({item.qty})
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              In Stock
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                          Min Alert: {item.minStock || 2} units
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-5 font-mono text-zinc-700 font-medium text-xs tabular-nums">
                        {curr}{(item.costPrice || 0).toFixed(2)}
                      </td>

                      {/* Sale Price & Profit Margin */}
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-zinc-950 text-sm tabular-nums">
                          {curr}{(item.salePrice || 0).toFixed(2)}
                        </div>
                        {profit !== 0 && (
                          <div className={`text-[10px] font-mono font-medium mt-0.5 tabular-nums ${profit > 0 ? 'text-emerald-700' : 'text-zinc-400'}`}>
                            {profit > 0 ? `+${curr}${profit.toFixed(0)}` : `${curr}${profit.toFixed(0)}`}
                            {marginPct !== null && ` (${marginPct}%)`}
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setBarcodeLabelItem(item)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Print Barcode & Shelf Sticker Label"
                          >
                            <Barcode className="w-3.5 h-3.5 text-zinc-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Edit Inventory Item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {userRole !== 'staff' && (
                            confirmDeleteId === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteInventory(item.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                                  title="Confirm delete"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="p-1.5 rounded-lg border border-zinc-200 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {filteredInventory.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-600">
            <div className="flex items-center gap-3 flex-wrap">
              <span>
                Showing <strong className="font-semibold text-zinc-900 font-mono">{pageSize === 0 ? 1 : Math.min(filteredInventory.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
                <strong className="font-semibold text-zinc-900 font-mono">{pageSize === 0 ? filteredInventory.length : Math.min(filteredInventory.length, currentPage * pageSize)}</strong> of{' '}
                <strong className="font-semibold text-zinc-900 font-mono">{filteredInventory.length}</strong> items
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 font-medium">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs font-semibold text-zinc-800 shadow-2xs cursor-pointer focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={0}>All</option>
                </select>
              </div>
            </div>

            {pageSize !== 0 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-3 py-1 text-xs font-mono font-semibold bg-white border border-zinc-200 rounded-md text-zinc-800 shadow-2xs">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT CUSTOM INVENTORY ITEM MODAL                    */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-zinc-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{editingItem ? 'Edit Inventory Item' : 'Add Custom Inventory Item'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Custom Stock
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {editingItem
                      ? `Update stock pricing and SKU for ${editingItem.name}`
                      : 'Add new spare display, battery, IC, or accessory to workshop catalog'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Part Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1">
                  Item / Part Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. iPhone 14 Pro OLED Screen Original"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-hidden bg-white text-zinc-900"
                />
              </div>

              {/* Brand & Model Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Device Brand
                  </label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-900 bg-white text-zinc-900 cursor-pointer"
                  >
                    {POPULAR_INVENTORY_BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Other">Other / Custom Brand</option>
                  </select>
                  {formBrand === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter brand name..."
                      value={formCustomBrand}
                      onChange={(e) => setFormCustomBrand(e.target.value)}
                      className="w-full text-xs mt-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-900"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Compatible Model / Device
                  </label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="e.g. iPhone 14 Pro / A2890"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-900 bg-white text-zinc-900"
                  />
                </div>
              </div>

              {/* Category & SKU Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-900 bg-white text-zinc-900 cursor-pointer"
                  >
                    {INVENTORY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Other">Other / Custom Category</option>
                  </select>
                  {formCategory === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter category..."
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      className="w-full text-xs mt-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-900"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    SKU / Barcode Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="e.g. INV-CUST-1049"
                      className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-900 bg-white text-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Qty & Low Stock Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-900 bg-white text-zinc-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Min Stock Reorder Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-900 bg-white text-zinc-900 font-bold"
                  />
                </div>
              </div>

              {/* Pricing: Cost Price & Sale Price */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    Pricing & Profit Margin
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Wholesale / Cost Price ({curr})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Customer / Sale Price ({curr})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formSalePrice}
                      onChange={(e) => setFormSalePrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-900 font-bold"
                    />
                  </div>
                </div>

                {/* Profit calculation badge */}
                {parseFloat(formSalePrice) > 0 && (
                  <div className="p-2.5 bg-white border border-emerald-200 rounded-lg flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-600">Expected Profit per unit:</span>
                    <strong className="text-emerald-700 font-bold">
                      +{curr}{(Math.max(0, (parseFloat(formSalePrice) || 0) - (parseFloat(formCostPrice) || 0))).toFixed(2)}
                      {parseFloat(formCostPrice) > 0 && (
                        <span className="text-[10px] text-zinc-500 ml-1">
                          ({Math.round((((parseFloat(formSalePrice) || 0) - (parseFloat(formCostPrice) || 0)) / parseFloat(formCostPrice)) * 100)}% margin)
                        </span>
                      )}
                    </strong>
                  </div>
                )}
              </div>

              {/* Storage Rack & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Storage Shelf / Rack / Bin
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Rack B, Box 4"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-900 bg-white text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Warranty / Supplier Notes
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. 30 days testing warranty"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-900 bg-white text-zinc-900"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs active:scale-98"
                >
                  {editingItem ? 'Save Changes' : 'Save Custom Inventory Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Catalog Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-900">Reset Parts Catalog?</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  This will reload the standard workshop catalog of mobile spare parts.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetCatalog?.();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode & Shelf Sticker Label Modal */}
      {barcodeLabelItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <Barcode className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Part Barcode & Shelf Label</h4>
                  <p className="text-[11px] text-zinc-500">58mm / 80mm sticker format</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBarcodeLabelItem(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticker Preview Box */}
            <div className="p-4 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-xl space-y-3 font-mono text-center">
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                {profile.shopName || 'Mobile Repair Center'}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-950 font-sans leading-tight">
                  {barcodeLabelItem.name}
                </div>
                <div className="text-[11px] text-zinc-600 mt-0.5 font-sans">
                  {barcodeLabelItem.brand} {barcodeLabelItem.model && `• ${barcodeLabelItem.model}`}
                </div>
              </div>

              {/* Barcode Graphic */}
              <div className="bg-white p-2 rounded-lg border border-zinc-200 inline-block w-full">
                <div className="flex justify-center items-stretch h-10 gap-0.5 overflow-hidden px-4">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((w, i) => (
                    <div
                      key={i}
                      className="bg-black"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>
                <div className="text-[11px] font-bold text-zinc-800 tracking-widest mt-1">
                  *{barcodeLabelItem.sku}*
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 px-1 font-sans">
                <div className="text-left">
                  <span className="text-[10px] text-zinc-400 block uppercase">Price</span>
                  <span className="font-bold font-mono text-zinc-900">
                    {curr}{(barcodeLabelItem.salePrice || 0).toFixed(2)}
                  </span>
                </div>
                {barcodeLabelItem.location && (
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block uppercase">Bin / Shelf</span>
                    <span className="font-bold text-zinc-700">{barcodeLabelItem.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBarcodeLabelItem(null)}
                className="px-3.5 py-1.5 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold cursor-pointer hover:bg-zinc-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
