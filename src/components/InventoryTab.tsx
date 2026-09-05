import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Trash2,
  Package,
  Search,
  Filter,
  RotateCcw,
  Download,
  AlertTriangle,
  TrendingUp,
  Smartphone,
  Headphones,
  ShieldCheck,
  Layers,
  Battery,
  Zap,
  Camera,
  Volume2,
  Cpu,
  Wrench,
  Minus,
  Edit2,
  Check,
  X,
  Tag,
  Sparkles,
  SmartphoneNfc,
  Laptop,
} from 'lucide-react';
import { InventoryItem, PartCategory } from '../types';
import { BRAND_MODELS_DATA, ALL_BRANDS, getModelsForBrand } from '../brandModels';

interface InventoryTabProps {
  inventory: InventoryItem[];
  currency?: string;
  onAddItem: (item: InventoryItem) => void;
  onUpdateItem?: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onAdjustStock?: (id: string, delta: number) => void;
  onResetCatalog?: () => void;
}

const CATEGORIES: { name: PartCategory; icon: React.ElementType }[] = [
  { name: 'Screens & Displays', icon: Smartphone },
  { name: 'Tempered Glass', icon: ShieldCheck },
  { name: 'Cases & Covers', icon: Layers },
  { name: 'Audio & Headphones', icon: Headphones },
  { name: 'Batteries', icon: Battery },
  { name: 'Charging Ports & Flex', icon: Zap },
  { name: 'Cameras & Lenses', icon: Camera },
  { name: 'Speakers & Earpiece', icon: Volume2 },
  { name: 'Housings & Frames', icon: SmartphoneNfc },
  { name: 'Motherboard & ICs', icon: Cpu },
  { name: 'Buttons & Sensors', icon: Wrench },
  { name: 'Workshop Consumables', icon: Laptop },
  { name: 'General Spares', icon: Package },
];

const CATEGORY_PART_SUGGESTIONS: Record<string, string[]> = {
  'Screens & Displays': [
    'Super Retina XDR OLED Display Assembly',
    'Dynamic AMOLED 2X Display + Frame',
    '120Hz Curved AMOLED Screen Assembly',
    'Incell High-Brightness Display Assembly',
  ],
  'Tempered Glass': [
    '9D Edge-to-Edge ESD Dust-Proof Glass',
    '11D Full Glue HD Clear Tempered Glass',
    '180° Anti-Spy Privacy Tempered Glass',
    'UV Liquid Optical Curved Screen Glass',
    'Sapphire Camera Lens Metal Ring Protectors',
  ],
  'Cases & Covers': [
    'MagSafe Frosted Matte Armor Bumper Case',
    'Liquid Silicone Case with Microfiber Lining',
    'Military Grade Kickstand Shockproof Armor',
    'Luxury Vegan Leather Back Cover',
    'Clear Anti-Yellowing Air-Cushioned Case',
  ],
  'Audio & Headphones': [
    'True Wireless Earbuds (TWS)',
    'Active Noise Cancelling Bluetooth Earbuds',
    'Magnetic Bluetooth Wireless Neckband',
    'Over-Ear Wireless Stereo Headphone',
    'Type-C Hi-Fi In-Ear Wired Earphones',
    '3.5mm Jack Wired Earphones with Mic',
  ],
  'Batteries': [
    'Original Spec High-Capacity Battery Pack',
    '5000mAh Replacement Battery with TI-Gas Gauge',
    'SUPERVOOC Dual-Cell Fast Charge Battery',
  ],
  'Charging Ports & Flex': [
    'Type-C Fast Charging Sub-Board with Mic',
    'Lightning Dock Connector Flex with Dual Mic',
    'Universal Type-C Female Charging Jack Connectors',
  ],
  'Cameras & Lenses': [
    'Main Rear OIS Primary Camera Sensor Module',
    'Front Face ID TrueDepth Camera Flex Assembly',
    'Periscope Optical Zoom Telephoto Module',
    'Rear Outer Camera Glass Lens with Adhesive',
  ],
  'Speakers & Earpiece': [
    'Bottom Loudspeaker Ringer Buzzer Audio Module',
    'Top Earpiece Ear Speaker with Proximity Sensor Flex',
  ],
  'Housings & Frames': [
    'Titanium Middle Frame Chassis & Back Glass',
    'Rear Glass Battery Door Cover with Camera Bezel',
    'Corning Gorilla Armor Housing Back Panel',
  ],
  'Motherboard & ICs': [
    'USB Charging Controller IC Chip (Tristar/Hydra)',
    'Power Management IC (PMIC)',
    'RF Cellular Network Transceiver IC',
    'High-Precision BGA Reballing Stencils Set',
  ],
  'Buttons & Sensors': [
    'Power Key & Volume Buttons Flex Assembly',
    'Ultrasonic In-Display Biometric Fingerprint Sensor',
    'Taptic Engine Linear Resonant Vibrator Motor',
  ],
  'Workshop Consumables': [
    'B-7000 Multi-Purpose Waterproof Display Glue',
    'T-7000 Black Industrial Screen Frame Glue',
    'Display Waterproof Adhesive Seal Gaskets',
    'Battery Easy-Pull Stretch Adhesive Strips',
    'High Thermal Conductivity Heatsink Paste',
  ],
};

export const InventoryTab: React.FC<InventoryTabProps> = ({
  inventory,
  currency = '₹',
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAdjustStock,
  onResetCatalog,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'instock' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'brand' | 'model' | 'stock-asc' | 'stock-desc' | 'price-desc' | 'price-asc'>('name');

  // Form toggling & editing
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form Fields
  const [category, setCategory] = useState<string>('Screens & Displays');
  const [brand, setBrand] = useState<string>('Apple');
  const [model, setModel] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [qty, setQty] = useState<string>('5');
  const [costPrice, setCostPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [minStock, setMinStock] = useState<string>('2');

  // Brands list dynamically from database + brand models registry
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>(ALL_BRANDS);
    inventory.forEach((item) => {
      if (item.brand && item.brand.trim()) {
        brandsSet.add(item.brand.trim());
      }
    });
    return Array.from(brandsSet).sort();
  }, [inventory]);

  // Models list dynamically based on selectedBrand filter
  const filterAvailableModels = useMemo(() => {
    const modelsSet = new Set<string>();
    if (selectedBrand !== 'all') {
      const predefined = getModelsForBrand(selectedBrand);
      predefined.forEach((m) => modelsSet.add(m));
      inventory.forEach((item) => {
        if (item.brand?.toLowerCase() === selectedBrand.toLowerCase() && item.model?.trim()) {
          modelsSet.add(item.model.trim());
        }
      });
    } else {
      inventory.forEach((item) => {
        if (item.model?.trim()) {
          modelsSet.add(item.model.trim());
        }
      });
    }
    return Array.from(modelsSet).sort();
  }, [inventory, selectedBrand]);

  // Models list for Form when user selects a brand in the form
  const formBrandModels = useMemo(() => {
    if (!brand) return [];
    const models = getModelsForBrand(brand);
    if (models.length > 0) return models;
    // Fallback: check if inventory has models for this brand
    const inInv = new Set<string>();
    inventory.forEach((i) => {
      if (i.brand?.toLowerCase() === brand.toLowerCase() && i.model) {
        inInv.add(i.model);
      }
    });
    return Array.from(inInv);
  }, [brand, inventory]);

  // Overall Inventory Analytics
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    inventory.forEach((item) => {
      const q = item.qty || 0;
      totalUnits += q;
      const cost = item.costPrice || 0;
      const sale = item.salePrice || 0;
      totalCostValuation += cost * q;
      totalRetailValuation += sale * q;

      const threshold = item.minStock !== undefined ? item.minStock : 2;
      if (q === 0) {
        outOfStockCount++;
        lowStockCount++;
      } else if (q <= threshold) {
        lowStockCount++;
      }
    });

    return {
      totalItems,
      totalUnits,
      totalCostValuation,
      totalRetailValuation,
      lowStockCount,
      outOfStockCount,
    };
  }, [inventory]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return inventory
      .filter((item) => {
        // Search filter across Category, Brand, Model, Parts Name, SKU
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchName = item.name.toLowerCase().includes(query);
          const matchSku = item.sku.toLowerCase().includes(query);
          const matchBrand = item.brand ? item.brand.toLowerCase().includes(query) : false;
          const matchModel = item.model ? item.model.toLowerCase().includes(query) : false;
          const matchCategory = item.category ? item.category.toLowerCase().includes(query) : false;
          if (!matchName && !matchSku && !matchBrand && !matchModel && !matchCategory) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (item.category !== selectedCategory) return false;
        }

        // Brand filter
        if (selectedBrand !== 'all') {
          if (!item.brand || item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
        }

        // Model filter
        if (selectedModel !== 'all') {
          if (!item.model || item.model.toLowerCase() !== selectedModel.toLowerCase()) return false;
        }

        // Stock status filter
        const threshold = item.minStock !== undefined ? item.minStock : 2;
        if (stockStatusFilter === 'low') {
          if (item.qty > threshold) return false;
        } else if (stockStatusFilter === 'instock') {
          if (item.qty <= 0) return false;
        } else if (stockStatusFilter === 'out') {
          if (item.qty > 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'brand') {
          return (a.brand || '').localeCompare(b.brand || '');
        } else if (sortBy === 'model') {
          return (a.model || '').localeCompare(b.model || '');
        } else if (sortBy === 'stock-asc') {
          return a.qty - b.qty;
        } else if (sortBy === 'stock-desc') {
          return b.qty - a.qty;
        } else if (sortBy === 'price-desc') {
          return (b.salePrice || 0) - (a.salePrice || 0);
        } else if (sortBy === 'price-asc') {
          return (a.salePrice || 0) - (b.salePrice || 0);
        }
        return 0;
      });
  }, [inventory, searchTerm, selectedCategory, selectedBrand, selectedModel, stockStatusFilter, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach((item) => {
      const cat = item.category || 'General Spares';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [inventory]);

  // Open Edit Form
  const handleStartEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setCategory(item.category || 'Screens & Displays');
    setBrand(item.brand || 'Apple');
    setModel(item.model || '');
    setName(item.name);
    setSku(item.sku);
    setQty(item.qty.toString());
    setCostPrice(item.costPrice ? item.costPrice.toString() : '');
    setSalePrice(item.salePrice ? item.salePrice.toString() : '');
    setMinStock(item.minStock !== undefined ? item.minStock.toString() : '2');
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingItemId(null);
    setCategory('Screens & Displays');
    setBrand('Apple');
    setModel('');
    setName('');
    setSku('');
    setQty('5');
    setCostPrice('');
    setSalePrice('');
    setMinStock('2');
  };

  // Auto-generate SKU helper
  const handleAutoGenerateSku = () => {
    let catCode = 'PAR';
    if (category === 'Screens & Displays') catCode = 'SCR';
    else if (category === 'Tempered Glass') catCode = 'GLS';
    else if (category === 'Cases & Covers') catCode = 'CAS';
    else if (category === 'Audio & Headphones') catCode = 'AUD';
    else if (category === 'Batteries') catCode = 'BAT';
    else if (category === 'Charging Ports & Flex') catCode = 'CHG';
    else if (category === 'Cameras & Lenses') catCode = 'CAM';
    else if (category === 'Speakers & Earpiece') catCode = 'SPK';
    else if (category === 'Housings & Frames') catCode = 'HOU';
    else if (category === 'Motherboard & ICs') catCode = 'MIC';
    else if (category === 'Buttons & Sensors') catCode = 'BTN';
    else if (category === 'Workshop Consumables') catCode = 'CON';

    const cleanModelCode = (model || brand || 'UNIV')
      .replace(/iPhone\s*/i, 'IP')
      .replace(/Galaxy\s*/i, '')
      .replace(/OnePlus\s*/i, 'OP')
      .replace(/Redmi\s*Note\s*/i, 'RN')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 8)
      .toUpperCase();

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setSku(`${catCode}-${cleanModelCode || 'GEN'}-${randomSuffix}`);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || qty === '') return;

    const parsedQty = parseInt(qty, 10) || 0;
    const parsedCost = costPrice ? parseFloat(costPrice) : undefined;
    const parsedSale = salePrice ? parseFloat(salePrice) : undefined;
    const parsedMin = minStock ? parseInt(minStock, 10) : 2;

    if (editingItemId) {
      if (onUpdateItem) {
        onUpdateItem({
          id: editingItemId,
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          qty: parsedQty,
          category,
          brand: brand.trim() || undefined,
          model: model.trim() || undefined,
          costPrice: parsedCost,
          salePrice: parsedSale,
          minStock: parsedMin,
        });
      }
    } else {
      const newItem: InventoryItem = {
        id: 'P-' + Math.floor(1000 + Math.random() * 9000),
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        qty: parsedQty,
        category,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        costPrice: parsedCost,
        salePrice: parsedSale,
        minStock: parsedMin,
      };
      onAddItem(newItem);
    }

    handleCancelForm();
  };

  // Stock quick stepper
  const handleStepStock = (id: string, delta: number) => {
    if (onAdjustStock) {
      onAdjustStock(id, delta);
    } else if (onUpdateItem) {
      const item = inventory.find((i) => i.id === id);
      if (item) {
        onUpdateItem({ ...item, qty: Math.max(0, item.qty + delta) });
      }
    }
  };

  // Export inventory to CSV with separated columns
  const handleExportCSV = () => {
    const headers = ['Category', 'Brand', 'Model Info', 'Part Name', 'SKU / Code', 'Stock Qty', 'Cost Price', 'Sale Price', 'Min Stock Alert'];
    const rows = filteredItems.map((item) => [
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.brand || '').replace(/"/g, '""')}"`,
      `"${(item.model || '').replace(/"/g, '""')}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${item.sku || ''}"`,
      item.qty,
      item.costPrice || '',
      item.salePrice || '',
      item.minStock !== undefined ? item.minStock : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Smartphone_Parts_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Parts Listed</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{stats.totalItems}</span>
            <span className="text-xs text-zinc-500 font-medium">unique parts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stock On Hand</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{stats.totalUnits.toLocaleString()}</span>
            <span className="text-xs text-zinc-500 font-medium">units total</span>
          </div>
        </div>

        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:border-amber-400 ${
            stockStatusFilter === 'low' ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-zinc-200'
          }`}
          title="Click to toggle low stock filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{stats.lowStockCount}</span>
            <span className="text-xs text-zinc-500 font-medium">
              {stats.outOfStockCount > 0 ? `(${stats.outOfStockCount} zero stock)` : 'needs restock'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Stock Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-700">
              {currency} {stats.totalRetailValuation.toLocaleString()}
            </span>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">Retail Value</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isFormOpen && !editingItemId) {
                handleCancelForm();
              } else {
                handleCancelForm();
                setIsFormOpen(true);
              }
            }}
            className="theme-primary-btn bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{isFormOpen && !editingItemId ? 'Close Form' : 'Add New Spare Part / Accessory'}</span>
          </button>

          {onResetCatalog && (
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Load Complete Smartphone Parts Catalog? This will populate the master database with 70+ smartphone screens, cases, earbuds, tempered glass, batteries, cameras, and spare parts with separated brand, model, and category fields.'
                  )
                ) {
                  onResetCatalog();
                }
              }}
              title="Restores or initializes the master catalog with all brands & models"
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border border-zinc-200/80 flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              <span>Load Full Smartphone Catalog (All Brands & Models)</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border border-zinc-200 flex items-center gap-1.5 cursor-pointer active:scale-98 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Part Expandable Form */}
      {isFormOpen && (
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm transition-all animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                {editingItemId ? <Edit2 className="w-4 h-4 text-blue-600" /> : <Boxes className="w-4 h-4 text-zinc-900" />}
                <span>{editingItemId ? 'Edit Spare Part Details' : 'Add New Smartphone Spare Part / Accessory'}</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Fields are cleanly separated into Category, Brand, Model Info, and Parts Name for precise workshop inventory tracking.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {/* 1. Category */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  1. Component Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors bg-white cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Brand */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  2. Brand Name *
                </label>
                <select
                  value={brand}
                  onChange={(e) => {
                    const newBrand = e.target.value;
                    setBrand(newBrand);
                    const brandModels = getModelsForBrand(newBrand);
                    if (brandModels.length > 0 && !brandModels.includes(model)) {
                      setModel(brandModels[0]);
                    }
                  }}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors bg-white cursor-pointer"
                >
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Model Info */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    3. Model Info *
                  </label>
                  <span className="text-[10px] text-zinc-400">Select or type</span>
                </div>
                <input
                  type="text"
                  list="form-model-suggestions"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={`e.g. ${formBrandModels[0] || 'iPhone 15 Pro Max'}`}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
                <datalist id="form-model-suggestions">
                  {formBrandModels.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              {/* 4. SKU with auto-generate button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    SKU / Part Code *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSku}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Auto-Gen</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. SCR-IP15PM-OLED"
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>

              {/* 5. Parts Name */}
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  4. Parts Name / Component Description *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Super Retina XDR OLED Display Assembly (120Hz ProMotion)"
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />

                {/* Quick Suggestion Chips for Part Name */}
                {CATEGORY_PART_SUGGESTIONS[category] && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400 font-medium mr-1">Quick Suggestions:</span>
                    {CATEGORY_PART_SUGGESTIONS[category].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setName(sug)}
                        className="text-[11px] px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantities & Pricing */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Units in Stock *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="Units"
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Low Stock Alert Level</label>
                <input
                  type="number"
                  min="1"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="Alert at e.g. 2"
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Wholesale Cost ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="Purchase cost"
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Retail Sale Price ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Selling price"
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="theme-primary-btn bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-lg font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>{editingItemId ? 'Update Part Details' : 'Save Part to Inventory'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Navigation Pills */}
      <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white shadow-2xs'
                : 'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'all' ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-zinc-600 border border-zinc-200'
              }`}
            >
              {inventory.length}
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.name] || 0;
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSelected ? 'bg-zinc-900 text-white shadow-2xs' : 'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-zinc-600 border border-zinc-200'
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

      {/* Separated Filters & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input across all fields */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search parts name, model, brand, category, SKU..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Separate Brand Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedModel('all'); // Reset model when brand changes
              }}
              className="w-full border border-zinc-200 rounded-lg py-2 px-2.5 text-xs text-zinc-800 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
            >
              <option value="all">All Brands ({availableBrands.length})</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Separate Model Info Filter (populated for chosen brand) */}
          <div className="md:col-span-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg py-2 px-2.5 text-xs text-zinc-800 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
            >
              <option value="all">
                {selectedBrand !== 'all' ? `All ${selectedBrand} Models` : 'All Models (Filter by Device)'}
              </option>
              {filterAvailableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="w-1/2 border border-zinc-200 rounded-lg py-2 px-2 text-xs text-zinc-700 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
            >
              <option value="all">All Stock</option>
              <option value="low">Low (&le; 2)</option>
              <option value="instock">In Stock (&gt; 0)</option>
              <option value="out">Out of Stock (0)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-1/2 border border-zinc-200 rounded-lg py-2 px-2 text-xs text-zinc-700 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
            >
              <option value="name">Part Name (A-Z)</option>
              <option value="brand">Brand</option>
              <option value="model">Model Info</option>
              <option value="stock-desc">Stock: High to Low</option>
              <option value="stock-asc">Stock: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(searchTerm || selectedCategory !== 'all' || selectedBrand !== 'all' || selectedModel !== 'all' || stockStatusFilter !== 'all') && (
          <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="text-[11px] font-semibold text-zinc-400">Active Filters:</span>

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-800 text-[11px]">
                <Tag className="w-2.5 h-2.5 text-zinc-400" />
                <span>{selectedCategory}</span>
                <button onClick={() => setSelectedCategory('all')} className="hover:text-rose-600 ml-1">
                  &times;
                </button>
              </span>
            )}

            {selectedBrand !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full text-blue-800 text-[11px] font-medium border border-blue-200/60">
                <span>Brand: {selectedBrand}</span>
                <button
                  onClick={() => {
                    setSelectedBrand('all');
                    setSelectedModel('all');
                  }}
                  className="hover:text-rose-600 ml-1"
                >
                  &times;
                </button>
              </span>
            )}

            {selectedModel !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-full text-purple-800 text-[11px] font-medium border border-purple-200/60">
                <Smartphone className="w-2.5 h-2.5 text-purple-600" />
                <span>Model: {selectedModel}</span>
                <button onClick={() => setSelectedModel('all')} className="hover:text-rose-600 ml-1">
                  &times;
                </button>
              </span>
            )}

            {stockStatusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full text-amber-800 text-[11px] font-medium border border-amber-200/60">
                <span>Stock: {stockStatusFilter}</span>
                <button onClick={() => setStockStatusFilter('all')} className="hover:text-rose-600 ml-1">
                  &times;
                </button>
              </span>
            )}

            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-800 text-[11px]">
                <span>Query: "{searchTerm}"</span>
                <button onClick={() => setSearchTerm('')} className="hover:text-rose-600 ml-1">
                  &times;
                </button>
              </span>
            )}

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedBrand('all');
                setSelectedModel('all');
                setStockStatusFilter('all');
              }}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-medium underline ml-auto cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Inventory Table with Separated Columns: Category, Brand, Model Info, Parts Name */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-wrap justify-between items-center gap-2 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-zinc-500" />
            <h3 className="font-semibold text-zinc-800 text-sm">
              Smartphone Parts Directory
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              Showing {filteredItems.length} of {inventory.length} parts
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Brand</th>
                <th className="py-3 px-3.5">Model Info</th>
                <th className="py-3 px-4">Parts Name & SKU</th>
                <th className="py-3 px-3.5">Cost / Retail</th>
                <th className="py-3 px-3.5 text-center">Stock Units</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Package className="w-8 h-8 text-zinc-300 mx-auto" />
                      <p className="font-medium text-zinc-600">No matching smartphone parts found.</p>
                      <p className="text-[11px] text-zinc-400">
                        Try adjusting your Category, Brand, or Model filters.
                      </p>
                      {onResetCatalog && (
                        <button
                          type="button"
                          onClick={onResetCatalog}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Load Full Smartphone Catalog</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const threshold = item.minStock !== undefined ? item.minStock : 2;
                  const isOut = item.qty === 0;
                  const isLow = !isOut && item.qty <= threshold;

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors group">
                      {/* 1. Category Column */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3 text-zinc-400" />
                          <span>{item.category || 'General'}</span>
                        </span>
                      </td>

                      {/* 2. Brand Column */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          onClick={() => item.brand && setSelectedBrand(item.brand)}
                          title={`Filter all ${item.brand} parts`}
                          className="font-bold text-xs text-zinc-900 bg-zinc-100 hover:bg-blue-100 hover:text-blue-800 px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          {item.brand || 'Universal'}
                        </span>
                      </td>

                      {/* 3. Model Info Column */}
                      <td className="py-3 px-3.5">
                        {item.model ? (
                          <button
                            type="button"
                            onClick={() => setSelectedModel(item.model || 'all')}
                            title={`Filter all parts for ${item.model}`}
                            className="inline-flex items-center gap-1 font-semibold text-xs text-zinc-800 hover:text-blue-700 bg-zinc-50 hover:bg-blue-50 border border-zinc-200/80 hover:border-blue-300 px-2 py-0.5 rounded transition-colors cursor-pointer text-left"
                          >
                            <Smartphone className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>{item.model}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">Universal Fit</span>
                        )}
                      </td>

                      {/* 4. Parts Name & SKU Column */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-medium text-zinc-900 text-xs leading-snug">
                          {item.name}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] font-mono font-medium text-zinc-500 bg-zinc-50 px-1.5 py-0.2 rounded border border-zinc-200/60">
                            {item.sku}
                          </span>
                        </div>
                      </td>

                      {/* 5. Cost / Retail Pricing */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-xs">
                        {item.salePrice ? (
                          <div>
                            <div className="font-bold text-zinc-900">
                              {currency} {item.salePrice.toLocaleString()}
                            </div>
                            {item.costPrice ? (
                              <div className="text-[10px] text-zinc-400">
                                Cost: {currency} {item.costPrice.toLocaleString()}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">&mdash;</span>
                        )}
                      </td>

                      {/* 6. Stock Quantity with Steppers */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => handleStepStock(item.id, -1)}
                            disabled={item.qty <= 0}
                            title="Deduct 1 unit (used in repair)"
                            className="w-5 h-5 rounded flex items-center justify-center bg-white hover:bg-zinc-200 text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-200 cursor-pointer active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span
                            className={`min-w-8 text-center text-xs font-bold px-1.5 py-0.5 rounded ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-zinc-800'
                            }`}
                          >
                            {item.qty}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleStepStock(item.id, 1)}
                            title="Add 1 unit (restocked)"
                            className="w-5 h-5 rounded flex items-center justify-center bg-white hover:bg-zinc-200 text-zinc-600 border border-zinc-200 cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {isOut && <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Out of Stock</div>}
                        {isLow && !isOut && (
                          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Low Stock</div>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            title="Edit part details"
                            className="text-zinc-400 hover:text-zinc-800 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove "${item.name}" from inventory?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            title="Delete part from inventory"
                            className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
