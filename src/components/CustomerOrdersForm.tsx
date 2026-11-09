import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Package,
  Calendar,
  Clock,
  User,
  Phone,
  Tag,
  CreditCard,
  ShieldCheck,
  Plus,
  Minus,
  CheckCircle2,
  Receipt,
  Search,
  Sparkles,
  Zap,
  SlidersHorizontal,
  FileText,
  Smartphone,
  X,
  ChevronDown,
  Check,
  ArrowRight,
  ArrowDownAZ,
  AlertCircle,
} from 'lucide-react';
import { RepairOrder, ShopProfile, InventoryItem, CustomerOrdersPageConfig } from '../types';
import {
  BRAND_MODELS_DATA,
  ALL_BRANDS,
  ALPHABET_LETTERS,
  POPULAR_COUNTER_BRANDS,
  getModelsForBrand,
  getAllModels,
  searchAllModels,
  formatDeviceBrandAndModel,
} from '../brandModels';
import { AtoZModelCatalogModal } from './AtoZModelCatalogModal';

interface CustomerOrdersFormProps {
  profile: ShopProfile;
  inventory?: InventoryItem[];
  onOrderCreated: (order: RepairOrder) => void;
  config: CustomerOrdersPageConfig;
  onOpenAdjustment?: () => void;
}

const POPULAR_CUSTOMER_ITEMS = [
  { name: '11D Full Glue Tempered Glass', price: '150', warranty: 'Checking / 7 Days' },
  { name: '65W GaN Fast Charger Adapter', price: '750', warranty: '6 Months' },
  { name: 'Braided Type-C Fast Data Cable', price: '199', warranty: '1 Month' },
  { name: 'Shockproof Matte Armor Case', price: '299', warranty: 'No Warranty' },
  { name: 'Original Mobile Battery Pack', price: '1200', warranty: '3 Months' },
  { name: 'AMOLED Combo Display Folder', price: '2400', warranty: 'Checking / 7 Days' },
  { name: 'TWS Wireless Bluetooth Earbuds', price: '999', warranty: '6 Months' },
  { name: 'OTG Adapter & Connector Hub', price: '99', warranty: 'No Warranty' },
];

export const CustomerOrdersForm: React.FC<CustomerOrdersFormProps> = ({
  profile,
  inventory = [],
  onOrderCreated,
  config,
  onOpenAdjustment,
}) => {
  const curr = profile.currency || '₹';
  const isTwoCol = config.columns === '2-col';
  const isCompact = config.density === 'compact';

  // Customer Contact State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAltPhone, setCustAltPhone] = useState('');
  const [custValidationError, setCustValidationError] = useState('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Date & Fulfillment Urgency State
  const [orderDateOption, setOrderDateOption] = useState<'today' | 'custom'>('today');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [urgency, setUrgency] = useState<'Immediate Handover' | 'Today Pickup' | 'Scheduled'>(
    config.defaultUrgency || 'Immediate Handover'
  );

  // Device Brand & Model State
  const [deviceName, setDeviceName] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [customModelsVersion, setCustomModelsVersion] = useState(0);
  const [showAtoZCatalog, setShowAtoZCatalog] = useState(false);
  const [modelLetterFilter, setModelLetterFilter] = useState('ALL');

  // Sync models version if updated
  useEffect(() => {
    const handleUpdate = () => setCustomModelsVersion((v) => v + 1);
    window.addEventListener('custom-device-models-updated', handleUpdate);
    return () => window.removeEventListener('custom-device-models-updated', handleUpdate);
  }, []);

  // Product / Item State
  const [productName, setProductName] = useState('');
  const [baseItemPrice, setBaseItemPrice] = useState<number>(0);
  const [inventorySearch, setInventorySearch] = useState('');
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [totalCost, setTotalCost] = useState('');
  const [paidDeposit, setPaidDeposit] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('Cash');
  const [orderStatus, setOrderStatus] = useState<RepairOrder['status']>(
    config.defaultStatus || 'Delivered'
  );
  const [warranty, setWarranty] = useState('Checking / 7 Days');
  const [serialOrBarcode, setSerialOrBarcode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Update defaults if config changes
  useEffect(() => {
    if (config.defaultStatus) setOrderStatus(config.defaultStatus);
    if (config.defaultUrgency) setUrgency(config.defaultUrgency);
  }, [config.defaultStatus, config.defaultUrgency]);

  // Models for selected brand (includes custom added models and letter filter)
  const currentBrandModels = useMemo(() => {
    if (!selectedBrand || selectedBrand === 'All Brands') return [];
    const models = getModelsForBrand(selectedBrand);
    if (modelLetterFilter === 'ALL') return models;
    if (modelLetterFilter === '0-9') {
      return models.filter((m) => /^[0-9]/.test(m.trim()));
    }
    return models.filter((m) => m.trim().toUpperCase().startsWith(modelLetterFilter));
  }, [selectedBrand, customModelsVersion, modelLetterFilter]);

  // Universal search across all brands and models
  const universalSearchResults = useMemo(() => {
    if (!modelSearchQuery.trim()) return [];
    return searchAllModels(modelSearchQuery, 15);
  }, [modelSearchQuery, customModelsVersion]);

  const handleBrandSelect = (brand: string) => {
    if (brand === 'All Brands') {
      setSelectedBrand('');
    } else {
      setSelectedBrand(brand);
      // If currently selected model does not belong to this brand, reset model
      const models = getModelsForBrand(brand);
      if (selectedModel && !models.includes(selectedModel)) {
        setSelectedModel('');
      }
    }
  };

  const handleModelSelect = (modelName: string, brandName?: string) => {
    setSelectedModel(modelName);
    const targetBrand = brandName || selectedBrand;
    if (targetBrand && targetBrand !== 'All Brands') {
      setSelectedBrand(targetBrand);
      setDeviceName(formatDeviceBrandAndModel(targetBrand, modelName));
    } else {
      setDeviceName(modelName);
    }
    setModelSearchQuery('');
    setShowModelDropdown(false);
  };

  const handleApplyModelToProduct = () => {
    if (!selectedModel) return;
    const cleanFormatted = formatDeviceBrandAndModel(selectedBrand, selectedModel);
    if (!productName.trim()) {
      setProductName(cleanFormatted);
    } else if (!productName.toLowerCase().includes(selectedModel.toLowerCase())) {
      setProductName(`${cleanFormatted} - ${productName.trim()}`);
    }
  };

  // Auto calculate total cost when qty changes if base item price exists
  const handleQuantityChange = (newQty: number) => {
    const q = Math.max(1, newQty);
    setQuantity(q);
    if (baseItemPrice > 0) {
      setTotalCost((q * baseItemPrice).toString());
    }
  };

  const handleQuickItemSelect = (item: { name: string; price: string; warranty: string }) => {
    const itemFullName = selectedModel && !item.name.toLowerCase().includes(selectedModel.toLowerCase())
      ? `${selectedModel} - ${item.name}`
      : item.name;
    setProductName(itemFullName);
    const p = parseFloat(item.price) || 0;
    setBaseItemPrice(p);
    const calcTotal = (quantity * p).toString();
    setTotalCost(calcTotal);
    setWarranty(item.warranty);
    if (!paidDeposit || paidDeposit === '0' || paidDeposit === '0.00') {
      setPaidDeposit(calcTotal);
    }
  };

  const handleSelectInventoryItem = (item: InventoryItem) => {
    if (item.brand) setSelectedBrand(item.brand);
    if (item.model) setSelectedModel(item.model);

    const displayName = `${item.brand ? `${item.brand} ` : ''}${item.model ? `${item.model} ` : ''}${item.name}`;
    setProductName(displayName);
    const p = item.salePrice || item.costPrice || 0;
    setBaseItemPrice(p);
    const calcTotal = (quantity * p).toString();
    setTotalCost(calcTotal);
    setPaidDeposit(calcTotal);
    setShowInventoryPicker(false);
  };

  // Filtered catalog/inventory items
  const filteredInventory = useMemo(() => {
    if (!inventorySearch.trim()) return inventory.slice(0, 15);
    const q = inventorySearch.toLowerCase();
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.model && item.model.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [inventory, inventorySearch]);

  const calculatedBalance = Math.max(
    0,
    (parseFloat(totalCost) || 0) - (parseFloat(paidDeposit) || 0)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Required check for Customer Details during billing
    if (!custName.trim()) {
      setShowValidationErrors(true);
      setCustValidationError('Customer Name is required * for billing.');
      const nameInput = document.getElementById('saleCustNameInput');
      if (nameInput) nameInput.focus();
      return;
    }

    const cleanPhone = custPhone.replace(/[^0-9+]/g, '');
    if (!custPhone.trim() || cleanPhone.length < 5) {
      setShowValidationErrors(true);
      setCustValidationError('Valid Mobile Phone is required * for billing.');
      const phoneInput = document.getElementById('saleCustPhoneInput');
      if (phoneInput) phoneInput.focus();
      return;
    }

    const numCost = parseFloat(totalCost) || (baseItemPrice * (quantity || 1)) || 0;
    if (!totalCost.trim() && numCost <= 0) {
      setShowValidationErrors(true);
      setCustValidationError('Total Bill Amount is required * for billing settlement.');
      const billInput = document.getElementById('saleTotalCostInput');
      if (billInput) billInput.focus();
      return;
    }

    setCustValidationError('');
    setShowValidationErrors(false);

    const cleanName = custName.trim();
    const cleanProductName = productName.trim() || selectedModel || 'Counter Item';
    const numDeposit = parseFloat(paidDeposit) || 0;

    const orderDateToUse =
      orderDateOption === 'today'
        ? new Date().toISOString().split('T')[0]
        : orderDate || new Date().toISOString().split('T')[0];

    const finalDeviceName =
      deviceName.trim() ||
      (selectedModel
        ? formatDeviceBrandAndModel(selectedBrand, selectedModel)
        : selectedBrand
        ? `${selectedBrand} Device`
        : cleanProductName);

    const finalModelDisplay = selectedModel
      ? `${selectedModel}${cleanProductName ? ` - ${cleanProductName}` : ''}`
      : cleanProductName;

    const orderPrefix = profile.billingSystemConfig?.orderPrefix?.trim() || 'ORD-';
    const newOrder: RepairOrder = {
      id: `${orderPrefix}${Math.floor(1000 + Math.random() * 9000)}`,
      orderType: 'order',
      name: cleanName,
      phone: cleanPhone,
      altPhone: custAltPhone.trim() || undefined,
      deviceBrand: selectedBrand.trim() || undefined,
      deviceName: finalDeviceName,
      model: finalModelDisplay,
      imei: serialOrBarcode.trim() || 'N/A',
      problem:
        orderNotes.trim() ||
        `Customer Order: ${quantity}x ${cleanProductName}${
          selectedBrand ? ` [${selectedBrand}${selectedModel ? ` - ${selectedModel}` : ''}]` : ''
        }`,
      cost: numCost,
      deposit: numDeposit,
      status: orderStatus,
      date: orderDateToUse,
      expectedDate: expectedDate || undefined,
      technician: 'Front Counter',
      createdBy: 'Counter Terminal',
      paymentMethod: paymentMethod,
      notes: orderNotes.trim() || undefined,
      quantity: quantity,
      warranty: warranty,
    };

    onOrderCreated(newOrder);

    // Reset Form
    setCustName('');
    setCustPhone('');
    setCustAltPhone('');
    setSelectedBrand('');
    setSelectedModel('');
    setModelSearchQuery('');
    setProductName('');
    setBaseItemPrice(0);
    setQuantity(1);
    setTotalCost('');
    setPaidDeposit('');
    setSerialOrBarcode('');
    setOrderNotes('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setOrderDateOption('today');
    setExpectedDate('');
  };

  // Section 1: Date & Schedule Component (Always available for Custom Date)
  const dateScheduleSection = (
    <div className={`bg-white rounded-2xl border border-zinc-200 shadow-2xs ${isCompact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            Order Date & Delivery Schedule
          </h2>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          SCHEDULE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
            Order Booking Date
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOrderDateOption('today')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                orderDateOption === 'today'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOrderDateOption('custom')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                orderDateOption === 'custom'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}
            >
              Custom Date
            </button>
          </div>
          {orderDateOption === 'custom' && (
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="mt-2 w-full border border-blue-300 rounded-lg p-2 text-xs text-zinc-900 bg-white font-mono font-bold focus:border-blue-600 focus:outline-none"
            />
          )}
        </div>

        {config.showUrgencySelector && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
              Urgency / Mode
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Immediate Handover">Immediate Counter Delivery (In Stock)</option>
              <option value="Today Pickup">Today Evening Pickup</option>
              <option value="Scheduled">Scheduled / Pre-order Part</option>
            </select>
          </div>
        )}

        {config.showExpectedDate && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
              Expected Delivery / Pickup
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:outline-none"
              placeholder="Optional delivery date"
            />
          </div>
        )}
      </div>
    </div>
  );

  // Section 2: Customer Information
  const customerInfoSection = (
    <div className={`bg-white rounded-2xl border border-zinc-200 shadow-2xs ${isCompact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1">
            <span>Customer Information</span>
            <span className="text-red-500 font-bold ml-0.5">*</span>
          </h2>
        </div>
      </div>

      {custValidationError && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{custValidationError}</span>
        </div>
      )}

      <div className={`grid grid-cols-1 ${config.showAlternatePhone ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-700 mb-1 flex items-center justify-between">
            <span>
              Customer Name <span className="text-red-500 font-bold text-sm leading-none ml-0.5">*</span>
            </span>
          </label>
          <input
            id="saleCustNameInput"
            type="text"
            required
            placeholder="e.g. Rahul Sharma"
            value={custName}
            onChange={(e) => {
              setCustName(e.target.value);
              if (custValidationError && e.target.value.trim()) setCustValidationError('');
            }}
            className={`w-full border rounded-lg p-2 text-sm text-zinc-900 bg-white focus:outline-none transition-all ${
              showValidationErrors && !custName.trim()
                ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30'
                : 'border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
            }`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-700 mb-1 flex items-center justify-between">
            <span>
              Customer Phone <span className="text-red-500 font-bold text-sm leading-none ml-0.5">*</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-normal">WhatsApp receipt</span>
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              id="saleCustPhoneInput"
              type="tel"
              required
              placeholder="10-digit mobile number"
              value={custPhone}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9+]/g, '');
                setCustPhone(cleaned);
                if (custValidationError && cleaned.length >= 5) setCustValidationError('');
              }}
              className={`w-full pl-8 border rounded-lg p-2 text-sm text-zinc-900 font-mono bg-white focus:outline-none transition-all ${
                showValidationErrors && (!custPhone.trim() || custPhone.replace(/[^0-9+]/g, '').length < 5)
                  ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30'
                  : 'border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
              }`}
            />
          </div>
        </div>

        {config.showAlternatePhone && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Alternate Phone / Address
            </label>
            <input
              type="text"
              placeholder="Alt number or landmark"
              value={custAltPhone}
              onChange={(e) => setCustAltPhone(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );

  // Section: Device Brand & Model Selection (All Brands & Models Included)
  const deviceBrandModelSection = (config.showBrandSelector || config.showModelSelector) && (
    <div className={`bg-white rounded-2xl border border-zinc-200 shadow-2xs ${isCompact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-100 flex-wrap">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            Device Brand & Model (All Brands & Models)
          </h2>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAtoZCatalog(true)}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Open All Models A to Z Catalog (Old & New Models)"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            <span>All Models A-Z</span>
          </button>
          {selectedBrand && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
              Brand: {selectedBrand}
            </span>
          )}
          {selectedModel && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Model: {selectedModel}
            </span>
          )}
          {(selectedBrand || selectedModel) && (
            <button
              type="button"
              onClick={() => {
                setSelectedBrand('');
                setSelectedModel('');
                setModelSearchQuery('');
              }}
              className="text-[10px] text-zinc-500 hover:text-rose-600 px-1.5 py-0.5 rounded hover:bg-rose-50 flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear Selected Brand & Model"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>


      {/* Brand Selection Chips */}
      {config.showBrandSelector && (
        <div className="mb-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Quick Brand Filter ({ALL_BRANDS.length} Brands Available):
            </label>
            <button
              type="button"
              onClick={() => setShowAtoZCatalog(true)}
              className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>A to Z Catalog</span>
              <ArrowDownAZ className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_COUNTER_BRANDS.map((b) => {
              const isSelected = (b === 'All Brands' && !selectedBrand) || selectedBrand === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleBrandSelect(b)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-sm ring-1 ring-blue-600'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>

          {/* Quick A-Z Letter Filter Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
            <span className="text-[9px] font-bold text-zinc-400 uppercase shrink-0 mr-0.5">
              Jump A-Z:
            </span>
            {ALPHABET_LETTERS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setModelLetterFilter(l)}
                className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-all cursor-pointer shrink-0 ${
                  modelLetterFilter === l
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brand Model Dropdown + Universal Model Search */}
      <div className={`grid gap-3 ${config.showModelSelector && selectedBrand ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Brand Models Dropdown - Only shown when a brand is selected */}
        {config.showModelSelector && selectedBrand && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                {selectedBrand} Models ({currentBrandModels.length})
              </label>
              <button
                type="button"
                onClick={() => setSelectedBrand('')}
                className="text-[10px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
                title="Deselect brand"
              >
                Clear
              </button>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => handleModelSelect(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:outline-none font-medium"
            >
              <option value="">-- Select {selectedBrand} Model --</option>
              {currentBrandModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 3. Universal Model Search across ALL Brands */}
        {config.showModelSelector && (
          <div className="relative">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
              Instant Search Across All Brands
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search e.g. S24, 15 Pro, V30, Nord..."
                value={modelSearchQuery}
                onChange={(e) => {
                  setModelSearchQuery(e.target.value);
                  setShowModelDropdown(true);
                }}
                onFocus={() => {
                  if (modelSearchQuery.trim()) setShowModelDropdown(true);
                }}
                className="w-full pl-8 pr-7 border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              {modelSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setModelSearchQuery('');
                    setShowModelDropdown(false);
                  }}
                  className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {showModelDropdown && universalSearchResults.length > 0 && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-blue-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-zinc-100">
                <div className="p-1.5 bg-blue-50 text-[10px] font-semibold text-blue-800 flex justify-between">
                  <span>Matching Models ({universalSearchResults.length})</span>
                  <span>Click to select</span>
                </div>
                {universalSearchResults.map(({ brand, model }) => (
                  <button
                    key={`${brand}-${model}`}
                    type="button"
                    onClick={() => handleModelSelect(model, brand)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-zinc-900">{model}</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                      {brand}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-Prefix selected model to Product Name if a model is chosen */}
      {selectedModel && (
        <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-end">
          <button
            type="button"
            onClick={handleApplyModelToProduct}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
            title="Prepend selected model name to Product/Item Description"
          >
            <span>Auto-Prefix "{selectedModel}" to Product Name</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );

  // Section 3: Product Details
  const productSection = (
    <div className={`bg-white rounded-2xl border border-zinc-200 shadow-2xs ${isCompact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            Product & Item Details
          </h2>
        </div>
        {config.showInventorySearch && (
          <button
            type="button"
            onClick={() => setShowInventoryPicker(!showInventoryPicker)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="w-3 h-3" />
            <span>{showInventoryPicker ? 'Hide Catalog' : 'Browse Inventory Parts'}</span>
          </button>
        )}
      </div>

      {/* Collapsible Inventory Picker */}
      {config.showInventorySearch && showInventoryPicker && (
        <div className="mb-4 p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-blue-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Select from Spare Parts & Accessories Inventory</span>
            </span>
            <input
              type="text"
              placeholder="Filter by name, brand, model..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="text-xs bg-white border border-blue-200 rounded-lg px-2.5 py-1 text-zinc-900 focus:outline-none focus:border-blue-500 w-48 sm:w-64"
            />
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-blue-100/60 bg-white rounded-lg border border-blue-100">
            {filteredInventory.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400">No matching parts found.</div>
            ) : (
              filteredInventory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectInventoryItem(item)}
                  className="w-full text-left p-2 hover:bg-blue-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-zinc-900">{item.name}</span>
                    <span className="text-zinc-500 ml-2 font-mono text-[11px]">
                      {item.brand ? `[${item.brand}]` : ''} {item.model || ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-500 font-mono">Stock: {item.qty}</span>
                    <span className="font-bold text-blue-700">{curr}{item.salePrice || item.costPrice || 0}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Popular Fast-Click Accessory Shortcuts */}
      {config.showQuickItems && (
        <div className="mb-3.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Quick Counter Items (1-Click Fill)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_CUSTOMER_ITEMS.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleQuickItemSelect(item)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-blue-50 text-zinc-700 hover:text-blue-800 border border-zinc-200 hover:border-blue-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>{item.name}</span>
                <span className="font-mono text-zinc-400 font-bold">{curr}{item.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product Details Inputs */}
      <div className="mb-3">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-700 mb-1">
          Product / Item Name
        </label>
        <input
          type="text"
          placeholder="e.g. 11D Full Glue Tempered Glass, 65W Fast Charger..."
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>

      {/* Quantity, Warranty, Serial Number */}
      <div className={`grid grid-cols-1 ${config.showWarrantySelector && config.showSerialBarcode ? 'sm:grid-cols-3' : config.showWarrantySelector || config.showSerialBarcode ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-3`}>
        {/* Quantity Stepper */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
            Quantity
          </label>
          {config.showQuantityStepper ? (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                className="w-9 h-9 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-l-lg border border-r-0 border-zinc-200 transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-full text-center border-y border-zinc-200 py-1.5 text-sm font-mono text-zinc-900 bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-9 h-9 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-r-lg border border-l-0 border-zinc-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="w-full border border-zinc-200 rounded-lg p-2 text-sm font-mono text-zinc-900 bg-white focus:border-blue-500 focus:outline-none"
            />
          )}
        </div>

        {/* Warranty */}
        {config.showWarrantySelector && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Warranty</span>
            </label>
            <select
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="No Warranty">No Warranty</option>
              <option value="Checking / 7 Days">7 Days Testing</option>
              <option value="1 Month Replacement">1 Month Replacement</option>
              <option value="3 Months">3 Months</option>
              <option value="6 Months">6 Months</option>
              <option value="1 Year Official">1 Year Official</option>
            </select>
          </div>
        )}

        {/* Serial / Barcode / IMEI */}
        {config.showSerialBarcode && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Serial / Barcode / IMEI
            </label>
            <input
              type="text"
              placeholder="Optional ID / barcode"
              value={serialOrBarcode}
              onChange={(e) => setSerialOrBarcode(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 font-mono bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );

  // Section 4: Billing & Settlement
  const billingSection = (
    <div className={`bg-white rounded-2xl border border-zinc-200 shadow-2xs ${isCompact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
            <span>Billing & Payment Settlement</span>
            <span className="text-red-500 font-bold text-sm leading-none">*</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500">Balance Due:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded ${
              calculatedBalance > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {curr}{calculatedBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Bill Amount */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-700 mb-1 flex items-center justify-between">
            <span>
              Total Bill Amount <span className="text-red-500 font-bold text-sm leading-none ml-0.5">*</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-normal">Pricing</span>
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-sm text-zinc-400 font-mono">{curr}</span>
            <input
              id="saleTotalCostInput"
              type="number"
              step="any"
              placeholder="0.00"
              value={totalCost}
              onChange={(e) => {
                setTotalCost(e.target.value);
                if (custValidationError && parseFloat(e.target.value) > 0) setCustValidationError('');
              }}
              className={`w-full pl-7 border rounded-lg p-2 text-sm font-mono font-bold text-zinc-900 bg-white focus:outline-none transition-all ${
                showValidationErrors && (!totalCost.trim() || parseFloat(totalCost) <= 0)
                  ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30'
                  : 'border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
              }`}
            />
          </div>
          {showValidationErrors && (!totalCost.trim() || parseFloat(totalCost) <= 0) && (
            <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
              <span>Billing amount is required *</span>
            </p>
          )}
        </div>

        {/* Advance Deposit / Amount Paid */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700">
              Amount Paid / Advance
            </label>
            {config.showDepositShortcuts && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaidDeposit('')}
                  className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded transition-colors cursor-pointer"
                  title="Zero deposit / full balance due"
                >
                  {curr}0
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const costNum = parseFloat(totalCost) || 0;
                    if (costNum > 0) setPaidDeposit(Math.round(costNum * 0.5).toString());
                  }}
                  className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors cursor-pointer"
                  title="50% advance deposit"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (totalCost) setPaidDeposit(totalCost);
                  }}
                  className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors cursor-pointer"
                  title="Full payment received"
                >
                  Full Paid
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-sm text-zinc-400 font-mono">{curr}</span>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={paidDeposit}
              onChange={(e) => setPaidDeposit(e.target.value)}
              onFocus={(e) => {
                if (e.target.value === '0' || e.target.value === '0.00') {
                  setPaidDeposit('');
                } else {
                  e.target.select();
                }
              }}
              className="w-full pl-7 border border-zinc-200 rounded-lg p-2 text-sm font-mono font-medium text-zinc-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Payment Method */}
        {config.showPaymentMethod && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        )}
      </div>

      {/* Order Status & Special Notes */}
      {(config.showFulfillmentStatus || config.showOrderNotes) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-zinc-100">
          {config.showFulfillmentStatus && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Order Fulfillment Status
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as any)}
                className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:outline-none font-semibold"
              >
                <option value="Delivered">Delivered (Handed Over Now)</option>
                <option value="Completed">Completed (Ready for Pickup)</option>
                <option value="Pending">Pending (Waiting Stock / Pre-order)</option>
                <option value="In Progress">In Progress (Testing / Arranging)</option>
              </select>
            </div>
          )}

          {config.showOrderNotes && (
            <div className={config.showFulfillmentStatus ? 'sm:col-span-2' : 'sm:col-span-3'}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Customer Special Notes / Specifications
              </label>
              <input
                type="text"
                placeholder="e.g. Matte finish requested, customer will collect after 6 PM..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Top Banner / In-page Adjustment Trigger Bar */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-950">
            Customer Orders Entry
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">
            {config.columns === '2-col' ? '2-Column' : '1-Column'} • {config.formLayout} • {config.density}
          </span>
        </div>

        {onOpenAdjustment && (
          <button
            type="button"
            onClick={onOpenAdjustment}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Open Customer Orders Page Adjustment Settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Customer Orders Page Adjustment</span>
          </button>
        )}
      </div>

      {/* Main Grid: 2-Column or 1-Column based on config.columns */}
      {isTwoCol ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (5 Cols on large screen): Schedule & Customer */}
          <div className="lg:col-span-5 space-y-4">
            {customerInfoSection}
            {dateScheduleSection}
          </div>

          {/* Right Column (7 Cols on large screen): Device, Product & Billing */}
          <div className="lg:col-span-7 space-y-4">
            {deviceBrandModelSection}
            {productSection}
            {billingSection}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {dateScheduleSection}
          {customerInfoSection}
          {deviceBrandModelSection}
          {productSection}
          {billingSection}
        </div>
      )}

      {/* SUBMISSION & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            setCustName('');
            setCustPhone('');
            setCustAltPhone('');
            setSelectedBrand('');
            setSelectedModel('');
            setModelSearchQuery('');
            setProductName('');
            setBaseItemPrice(0);
            setQuantity(1);
            setTotalCost('');
            setPaidDeposit('');
            setSerialOrBarcode('');
            setOrderNotes('');
          }}
          className="px-4 py-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
        >
          Clear Form
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Create Customer Order & Print Receipt</span>
          </button>
        </div>
      </div>

      {/* A to Z Models Catalog Modal */}
      <AtoZModelCatalogModal
        isOpen={showAtoZCatalog}
        onClose={() => setShowAtoZCatalog(false)}
        initialBrand={selectedBrand || 'All Brands'}
        onSelectModel={({ brand, model, fullDeviceName }) => {
          setSelectedBrand(brand);
          setSelectedModel(model);
          setDeviceName(fullDeviceName);
          if (!productName.trim()) {
            setProductName(fullDeviceName);
          }
        }}
      />
    </form>
  );
};
