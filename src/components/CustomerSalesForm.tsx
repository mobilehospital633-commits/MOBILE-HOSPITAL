import React, { useState, useMemo } from 'react';
import {
  User,
  Phone,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Zap,
  PackageCheck,
  Receipt,
  RotateCcw,
  Calendar,
  Search,
  Package,
  Layers,
  X,
  Boxes,
  Sparkles,
} from 'lucide-react';
import { RepairOrder, ShopProfile, InventoryItem } from '../types';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface CustomerSalesFormProps {
  profile: ShopProfile;
  inventory?: InventoryItem[];
  onOrderCreated: (order: RepairOrder) => void;
  onSaveProfile?: (profile: ShopProfile) => void;
  onAdjustStock?: (id: string, delta: number) => void;
}

const WARRANTY_OPTIONS = [
  'No Warranty',
  'Checking / 7 Days',
  '1 Month',
  '3 Months',
  '6 Months',
  '1 Year',
];

export const CustomerSalesForm: React.FC<CustomerSalesFormProps> = ({
  profile,
  inventory = [],
  onOrderCreated,
  onSaveProfile,
  onAdjustStock,
}) => {
  const curr = profile.currency || '₹';

  // Sale Date (Today or Custom)
  const [saleDateOption, setSaleDateOption] = useState<'today' | 'custom'>('today');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Inventory Integration State
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const [autoDeductStock, setAutoDeductStock] = useState(true);

  // 1. Customer Details (Name first, then Mobile Number)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // 2. Product Details (Product Name, Warranty)
  const [productName, setProductName] = useState('');
  const [warranty, setWarranty] = useState('Checking / 7 Days');
  const [customWarranty, setCustomWarranty] = useState('');
  const [isCustomWarranty, setIsCustomWarranty] = useState(false);

  // 3. Billing System (Total, Advance Payment, Due, Payment Method)
  // 3. Billing System (Total, Advance Payment, Due, Payment Method, Quantity Multiplier)
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');

  // Status & Validation
  const [formError, setFormError] = useState('');
  const [recentSavedOrder, setRecentSavedOrder] = useState<RepairOrder | null>(null);
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<RepairOrder | null>(null);

  // Bill Calculations
  const parsedTotal = Math.max(0, parseFloat(totalAmount) || 0);
  const parsedAdvance = Math.max(0, parseFloat(advancePayment) || 0);
  const dueBalance = Math.max(0, parsedTotal - parsedAdvance);

  const handleTotalChange = (val: string) => {
    setTotalAmount(val);
    const parsedVal = parseFloat(val) || 0;
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    if (parsedVal > 0) {
      setUnitPrice((parsedVal / parsedQty).toFixed(2));
    }
    if (!advancePayment || advancePayment === totalAmount) {
      setAdvancePayment(val);
    }
    if (formError) setFormError('');
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    const parsedUnit = parseFloat(val) || 0;
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    if (parsedUnit >= 0) {
      const calculatedTotal = (parsedUnit * parsedQty).toFixed(2);
      setTotalAmount(calculatedTotal);
      setAdvancePayment(calculatedTotal);
    }
    if (formError) setFormError('');
  };

  const handleQuantityChange = (qtyStr: string) => {
    setQuantity(qtyStr);
    const parsedQty = Math.max(1, parseInt(qtyStr, 10) || 1);
    const parsedUnit = parseFloat(unitPrice) || 0;
    if (parsedUnit > 0) {
      const calculatedTotal = (parsedUnit * parsedQty).toFixed(2);
      setTotalAmount(calculatedTotal);
      setAdvancePayment(calculatedTotal);
    }
  };

  const handleResetForm = () => {
    setSaleDateOption('today');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setCustomerName('');
    setCustomerPhone('');
    setProductName('');
    setWarranty('Checking / 7 Days');
    setCustomWarranty('');
    setIsCustomWarranty(false);
    setQuantity('1');
    setUnitPrice('');
    setTotalAmount('');
    setAdvancePayment('');
    setPaymentMethod('Cash');
    setFormError('');
    setSelectedInventoryItem(null);
    setInventorySearch('');
    setShowInventoryPicker(false);
  };

  // Filter inventory by search query
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

  const handleSelectInventoryItem = (item: InventoryItem) => {
    const displayName = `${item.name}${item.brand && item.brand !== 'Generic / Universal' ? ` (${item.brand})` : ''}`;
    setProductName(displayName);
    const price = item.retailPrice || item.costPrice || 0;
    setUnitPrice(price > 0 ? price.toString() : '');
    const currentQty = Math.max(1, parseInt(quantity, 10) || 1);
    const calculatedTotal = price > 0 ? (price * currentQty).toFixed(2) : '';
    setTotalAmount(calculatedTotal);
    setAdvancePayment(calculatedTotal);
    setSelectedInventoryItem(item);
    setShowInventoryPicker(false);
    if (formError) setFormError('');
  };

  const handleSubmit = (actionType: 'save' | 'whatsapp') => {
    if (!customerName.trim()) {
      setFormError('Customer Name is required');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/[^0-9+]/g, '').length < 5) {
      setFormError('Customer Phone is required');
      return;
    }

    if (!productName.trim()) {
      setFormError('Product name is required');
      return;
    }

    if (parsedTotal <= 0) {
      setFormError('Total Bill is required');
      return;
    }

    setFormError('');
    const finalWarranty = isCustomWarranty ? (customWarranty.trim() || 'Custom') : warranty;
    const finalDate = saleDateOption === 'today'
      ? new Date().toISOString().split('T')[0]
      : (saleDate || new Date().toISOString().split('T')[0]);
    const salePrefix = profile.billingSystemConfig?.salePrefix?.trim() || 'SL-';
    const ticketId = `${salePrefix}${Math.floor(1000 + Math.random() * 9000)}`;
    const dueAmount = Math.max(0, parsedTotal - parsedAdvance);
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const parsedUnit = parseFloat(unitPrice) || (parsedTotal / parsedQty);

    const newOrder: RepairOrder = {
      id: ticketId,
      orderType: 'sale',
      name: customerName.trim(),
      phone: customerPhone.trim(),
      deviceName: productName.trim(),
      model: productName.trim(),
      imei: 'N/A (Product Sale)',
      problem: `Customer Sale: ${productName.trim()} (${parsedQty}x) | Warranty: ${finalWarranty} | Total: ${curr}${parsedTotal.toFixed(2)}${dueAmount > 0 ? ` | Paid: ${curr}${parsedAdvance.toFixed(2)} (Due: ${curr}${dueAmount.toFixed(2)})` : ' (Full Paid)'}`,
      cost: parsedTotal,
      deposit: parsedAdvance,
      status: dueAmount > 0 ? 'Completed' : 'Delivered',
      date: finalDate,
      technician: 'Sales Counter',
      createdBy: 'Counter Terminal',
      quantity: parsedQty,
      unitPrice: parsedUnit,
      warranty: finalWarranty,
      paymentMethod: paymentMethod,
      inventoryItemId: selectedInventoryItem ? selectedInventoryItem.id : undefined,
    };

    // Auto-deduct inventory if linked and enabled
    if (selectedInventoryItem && autoDeductStock && onAdjustStock) {
      onAdjustStock(selectedInventoryItem.id, -parsedQty);
    }

    onOrderCreated(newOrder);
    setRecentSavedOrder(newOrder);
    handleResetForm();

    if (actionType === 'whatsapp') {
      triggerWhatsApp(newOrder);
    }
  };

  const triggerWhatsApp = (order: RepairOrder) => {
    setWhatsAppModalOrder(order);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Success Notification */}
      {recentSavedOrder && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                <span>Customer Sale Successfully Recorded!</span>
                <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded text-[11px]">
                  #{recentSavedOrder.id}
                </span>
              </h4>
              <p className="text-[11px] text-emerald-700">
                {recentSavedOrder.name} • {recentSavedOrder.deviceName} • Total: {curr}{recentSavedOrder.cost.toFixed(2)} • Paid: {curr}{recentSavedOrder.deposit.toFixed(2)} ({recentSavedOrder.paymentMethod})
                {recentSavedOrder.cost > recentSavedOrder.deposit && (
                  <span className="ml-1.5 text-amber-700 font-bold">
                    (Due: {curr}{(recentSavedOrder.cost - recentSavedOrder.deposit).toFixed(2)})
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerWhatsApp(recentSavedOrder)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Send WhatsApp Bill</span>
            </button>
            <button
              type="button"
              onClick={() => setRecentSavedOrder(null)}
              className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit('save');
        }}
        className="space-y-4"
      >
        {/* =========================================================
            SALE DATE (TODAY / CUSTOM DATE)
        ========================================================= */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Sale Date
                </h3>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {saleDateOption === 'today' ? `Today: ${new Date().toISOString().split('T')[0]}` : `Selected: ${saleDate}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSaleDateOption('today')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    saleDateOption === 'today'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setSaleDateOption('custom')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    saleDateOption === 'custom'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Custom Date
                </button>
              </div>

              {saleDateOption === 'custom' && (
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-xl bg-zinc-50 border border-zinc-300 focus:border-emerald-600 focus:bg-white text-zinc-900 font-mono font-bold focus:outline-hidden"
                />
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            1. CUSTOMER DETAILS
            First: Customer Name
            Second: Customer Phone
        ========================================================= */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
            <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              1. Customer Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Customer Name - FIRST */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 border border-zinc-200 focus:border-violet-600 focus:bg-white text-zinc-900 font-medium focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Customer Phone - SECOND */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Customer Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 border border-zinc-200 focus:border-violet-600 focus:bg-white text-zinc-900 font-mono font-medium focus:outline-hidden transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            PRODUCT DETAILS (English Version Only)
            - Product Name
            - Warranty
        ========================================================= */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Product Details
              </h3>
            </div>

            {/* Pick From Inventory Stock Button */}
            {inventory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowInventoryPicker((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showInventoryPicker
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{showInventoryPicker ? 'Hide Stock Catalog' : 'Pick from Inventory Stock'}</span>
                <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded-md font-mono">
                  {inventory.length}
                </span>
              </button>
            )}
          </div>

          {/* Quick Inventory Search & Selection Drawer */}
          {showInventoryPicker && (
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search parts, tempered glass, cables, batteries, chargers by name or SKU..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white border border-blue-200 focus:border-blue-500 focus:outline-none text-zinc-800"
                    />
                    {inventorySearch && (
                      <button
                        type="button"
                        onClick={() => setInventorySearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredInventory.length === 0 ? (
                  <p className="text-center py-4 text-xs text-zinc-400">
                    No matching parts or accessories found in inventory.
                  </p>
                ) : (
                  filteredInventory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectInventoryItem(item)}
                      className="w-full text-left p-2 rounded-lg bg-white hover:bg-blue-100/70 border border-zinc-200 hover:border-blue-300 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer shadow-2xs group"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-800 group-hover:text-blue-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          {item.brand && <span>{item.brand}</span>}
                          {item.category && <span>• {item.category}</span>}
                          <span className="font-mono text-zinc-400">SKU: {item.sku}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-zinc-900 font-mono">
                          {curr}{(item.retailPrice || item.costPrice || 0).toFixed(2)}
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold font-mono ${
                            item.qty <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : item.qty <= 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.qty} in stock
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Selected Inventory Item Banner */}
          {selectedInventoryItem && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>Linked Stock: {selectedInventoryItem.name}</span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                      {selectedInventoryItem.qty} in stock
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700">
                    Retail: {curr}{(selectedInventoryItem.retailPrice || selectedInventoryItem.costPrice || 0).toFixed(2)} • SKU: {selectedInventoryItem.sku}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-emerald-900 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDeductStock}
                    onChange={(e) => setAutoDeductStock(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Deduct 1 unit on sale</span>
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedInventoryItem(null)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                  title="Remove stock link"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Product Name */}
            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 11D Tempered Glass / 33W Fast Charger"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 border border-zinc-200 focus:border-blue-600 focus:bg-white text-zinc-900 font-medium focus:outline-hidden transition-all"
              />
            </div>

            {/* Warranty */}
            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Warranty</span>
              </label>
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {WARRANTY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setWarranty(opt);
                        setIsCustomWarranty(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        !isCustomWarranty && warranty === opt
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomWarranty(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isCustomWarranty
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    + Custom
                  </button>
                </div>
                {isCustomWarranty && (
                  <input
                    type="text"
                    placeholder="Enter custom warranty (e.g. 15 Days Replacement)"
                    value={customWarranty}
                    onChange={(e) => setCustomWarranty(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-50 border border-amber-300 focus:border-amber-600 text-zinc-900"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            3. BILLING SYSTEM
            - Total Bill
            - Advance Payment
            - Due Balance
            - Payment Method
        ========================================================= */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                3. Billing System
              </h3>
            </div>
            {dueBalance > 0 ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Due: {curr}{dueBalance.toFixed(2)}
              </span>
            ) : parsedTotal > 0 ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Paid in Full</span>
              </span>
            ) : null}
          </div>

          {/* Quantity Multiplier & Unit Price Selector */}
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-zinc-700">Quantity:</span>
              <div className="flex items-center border border-zinc-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(quantity, 10) || 1;
                    if (current > 1) handleQuantityChange(String(current - 1));
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-zinc-100 text-zinc-600 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-12 text-center text-xs font-mono font-bold text-zinc-900 focus:outline-hidden py-1 border-x border-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(quantity, 10) || 1;
                    handleQuantityChange(String(current + 1));
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-zinc-100 text-zinc-600 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Quick Qty Chips */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 5, 10].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuantityChange(String(q))}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      quantity === String(q)
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-200/80 hover:bg-zinc-300 text-zinc-700'
                    }`}
                  >
                    {q}x
                  </button>
                ))}
              </div>
            </div>

            {/* Unit Price Input */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-500 font-medium">Unit Price:</span>
              <div className="relative w-28">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">
                  {curr}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 text-xs rounded-lg font-mono font-semibold bg-white border border-zinc-300 focus:border-zinc-900 focus:outline-hidden text-zinc-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
            {/* Total Bill */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Total Bill <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold text-xs">
                  {curr}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl font-mono font-bold bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Advance Payment */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Advance Payment
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setAdvancePayment(totalAmount)}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Full Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvancePayment('0')}
                    className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Due (0)
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold text-xs">
                  {curr}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl font-mono font-bold bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Due Balance / Status Card */}
            <div className={`p-3 rounded-xl flex items-center justify-between shadow-xs transition-colors ${
              dueBalance > 0 ? 'bg-amber-950 text-white' : 'bg-zinc-900 text-white'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  {dueBalance > 0 ? 'Due Balance' : 'Payment Status'}
                </span>
                <span className={`text-base sm:text-lg font-black font-mono ${
                  dueBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {dueBalance > 0 ? `${curr}${dueBalance.toFixed(2)}` : 'PAID IN FULL'}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
                {curr}{parsedAdvance.toFixed(2)} / {curr}{parsedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-3 border-t border-zinc-100">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'UPI', 'Card'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-3 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-98 ${
                    paymentMethod === method
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Form</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('whatsapp')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-emerald-200" />
              <span>Save & WhatsApp Bill</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 flex items-center gap-2"
            >
              <PackageCheck className="w-4 h-4 text-white" />
              <span>Complete Customer Sale</span>
            </button>
          </div>
        </div>
      </form>

      {/* WhatsApp Cloud API & Image Modal */}
      {whatsAppModalOrder && (
        <WhatsAppShareModal
          isOpen={Boolean(whatsAppModalOrder)}
          onClose={() => setWhatsAppModalOrder(null)}
          order={whatsAppModalOrder}
          profile={profile}
          onSaveProfile={onSaveProfile}
        />
      )}
    </div>
  );
};
