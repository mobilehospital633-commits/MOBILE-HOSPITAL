import React, { useState, useMemo, useEffect } from 'react';
import {
  Wrench,
  Receipt,
  QrCode,
  Calendar,
  Clock,
  Smartphone,
  Tag,
  CreditCard,
  User,
  Phone,
  CheckCircle2,
  Plus,
  Minus,
  X,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Save,
  ShieldAlert,
  FileText,
  Lock,
  Package,
  Layers,
  Zap,
  FileCheck,
  ShoppingBag,
  Search,
  ArrowDownAZ,
  AlertCircle,
} from 'lucide-react';
import {
  RepairOrder,
  ShopProfile,
  InventoryItem,
  OrderEntryPageConfig,
  DEFAULT_ORDER_ENTRY_CONFIG,
  CustomerOrdersPageConfig,
  DEFAULT_CUSTOMER_ORDERS_CONFIG,
  CustomerEntryMode,
} from '../types';
import {
  ALL_BRANDS,
  ALPHABET_LETTERS,
  getModelsForBrand,
  searchAllModels,
  formatDeviceBrandAndModel,
} from '../brandModels';
import { OrderEntryAdjustmentPanel } from './OrderEntryAdjustmentPanel';
import { CustomerOrdersAdjustmentPanel } from './CustomerOrdersAdjustmentPanel';
import { CustomerOrdersForm } from './CustomerOrdersForm';
import { CustomerSalesForm } from './CustomerSalesForm';

// Lazy-loaded A-to-Z catalog modal
const AtoZModelCatalogModal = React.lazy(() => import('./AtoZModelCatalogModal').then((m) => ({ default: m.AtoZModelCatalogModal })));

interface NewOrderTabProps {
  profile: ShopProfile;
  inventory?: InventoryItem[];
  onOrderCreated: (order: RepairOrder) => void;
  onSaveProfile?: (profile: ShopProfile) => void;
  entryMode?: CustomerEntryMode;
  onEntryModeChange?: (mode: CustomerEntryMode) => void;
  onAdjustStock?: (id: string, delta: number) => void;
}

export const NewOrderTab: React.FC<NewOrderTabProps> = ({
  profile,
  inventory = [],
  onOrderCreated,
  onSaveProfile,
  entryMode = 'repair',
  onEntryModeChange,
  onAdjustStock,
}) => {
  const curr = profile.currency || '₹';

  const defaultMode = entryMode || profile.systemFeatures?.defaultCustomerEntryMode || 'repair';
  const [activeMode, setActiveMode] = useState<CustomerEntryMode>(defaultMode);

  useEffect(() => {
    if (entryMode && entryMode !== activeMode) {
      setActiveMode(entryMode);
    }
  }, [entryMode]);

  const handleModeSwitch = (mode: CustomerEntryMode) => {
    setActiveMode(mode);
    if (onEntryModeChange) {
      onEntryModeChange(mode);
    }
  };

  // ----------------------------------------------------
  // PAGE STRUCTURE / ENTRY CONFIG STATE
  // ----------------------------------------------------
  const [config, setConfig] = useState<OrderEntryPageConfig>(() => {
    if (profile.orderEntryConfig) {
      return { ...DEFAULT_ORDER_ENTRY_CONFIG, ...profile.orderEntryConfig };
    }
    try {
      const saved = localStorage.getItem('mh_order_entry_config');
      if (saved) return { ...DEFAULT_ORDER_ENTRY_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_ORDER_ENTRY_CONFIG;
  });

  const [showAdjustmentPanel, setShowAdjustmentPanel] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync if profile.orderEntryConfig changes externally
  useEffect(() => {
    if (profile.orderEntryConfig) {
      setConfig({ ...DEFAULT_ORDER_ENTRY_CONFIG, ...profile.orderEntryConfig });
    }
  }, [profile.orderEntryConfig]);

  const handleConfigChange = (newCfg: OrderEntryPageConfig) => {
    setConfig(newCfg);
    try {
      localStorage.setItem('mh_order_entry_config', JSON.stringify(newCfg));
    } catch {}
  };

  const handleSaveAsDefault = () => {
    try {
      localStorage.setItem('mh_order_entry_config', JSON.stringify(config));
    } catch {}
    if (onSaveProfile) {
      onSaveProfile({
        ...profile,
        orderEntryConfig: config,
      });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_ORDER_ENTRY_CONFIG);
    try {
      localStorage.setItem('mh_order_entry_config', JSON.stringify(DEFAULT_ORDER_ENTRY_CONFIG));
    } catch {}
    if (onSaveProfile) {
      onSaveProfile({
        ...profile,
        orderEntryConfig: DEFAULT_ORDER_ENTRY_CONFIG,
      });
    }
  };

  // ----------------------------------------------------
  // CUSTOMER ORDERS PAGE ADJUSTMENT CONFIG STATE
  // ----------------------------------------------------
  const [customerOrdersConfig, setCustomerOrdersConfig] = useState<CustomerOrdersPageConfig>(() => {
    if (profile.customerOrdersConfig) {
      return { ...DEFAULT_CUSTOMER_ORDERS_CONFIG, ...profile.customerOrdersConfig };
    }
    try {
      const saved = localStorage.getItem('mh_customer_orders_config');
      if (saved) return { ...DEFAULT_CUSTOMER_ORDERS_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_CUSTOMER_ORDERS_CONFIG;
  });

  const [showCustomerOrdersAdjustment, setShowCustomerOrdersAdjustment] = useState(false);
  const [customerOrdersSaveSuccess, setCustomerOrdersSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile.customerOrdersConfig) {
      setCustomerOrdersConfig({ ...DEFAULT_CUSTOMER_ORDERS_CONFIG, ...profile.customerOrdersConfig });
    }
  }, [profile.customerOrdersConfig]);

  const handleCustomerOrdersConfigChange = (newCfg: CustomerOrdersPageConfig) => {
    setCustomerOrdersConfig(newCfg);
    try {
      localStorage.setItem('mh_customer_orders_config', JSON.stringify(newCfg));
    } catch {}
  };

  const handleSaveCustomerOrdersAsDefault = () => {
    try {
      localStorage.setItem('mh_customer_orders_config', JSON.stringify(customerOrdersConfig));
    } catch {}
    if (onSaveProfile) {
      onSaveProfile({
        ...profile,
        customerOrdersConfig: customerOrdersConfig,
      });
    }
    setCustomerOrdersSaveSuccess(true);
    setTimeout(() => setCustomerOrdersSaveSuccess(false), 2500);
  };

  const handleResetCustomerOrdersDefaults = () => {
    setCustomerOrdersConfig(DEFAULT_CUSTOMER_ORDERS_CONFIG);
    try {
      localStorage.setItem('mh_customer_orders_config', JSON.stringify(DEFAULT_CUSTOMER_ORDERS_CONFIG));
    } catch {}
    if (onSaveProfile) {
      onSaveProfile({
        ...profile,
        customerOrdersConfig: DEFAULT_CUSTOMER_ORDERS_CONFIG,
      });
    }
  };

  // ====================================================
  // CUSTOMER REPAIR ORDER STATE
  // ====================================================
  const [repairName, setRepairName] = useState('');
  const [repairPhone, setRepairPhone] = useState('');
  const [repairAltPhone, setRepairAltPhone] = useState('');
  const [custValidationError, setCustValidationError] = useState('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [repairDeviceName, setRepairDeviceName] = useState('');
  const [repairDeviceColor, setRepairDeviceColor] = useState('');
  const [repairImei, setRepairImei] = useState('');
  const [repairPasscode, setRepairPasscode] = useState('');

  // Device Model Selection
  const [customModelsVersion, setCustomModelsVersion] = useState(0);
  const [showAtoZCatalog, setShowAtoZCatalog] = useState(false);
  const [modelLetterFilter, setModelLetterFilter] = useState('ALL');

  // Sync models version if updated
  useEffect(() => {
    const handleUpdate = () => setCustomModelsVersion((v) => v + 1);
    window.addEventListener('custom-device-models-updated', handleUpdate);
    return () => window.removeEventListener('custom-device-models-updated', handleUpdate);
  }, []);

  const currentBrandModels = useMemo(() => {
    if (!selectedBrand) return [];
    const models = getModelsForBrand(selectedBrand);
    if (modelLetterFilter === 'ALL') return models;
    if (modelLetterFilter === '0-9') {
      return models.filter((m) => /^[0-9]/.test(m.trim()));
    }
    return models.filter((m) => m.trim().toUpperCase().startsWith(modelLetterFilter));
  }, [selectedBrand, customModelsVersion, modelLetterFilter]);

  const [repairProblem, setRepairProblem] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [repairDeposit, setRepairDeposit] = useState('');
  const [repairPaymentMethod, setRepairPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('Cash');
  const [repairStatus, setRepairStatus] = useState<RepairOrder['status']>(profile.defaultStatus || 'Pending');
  const [repairTechnician, setRepairTechnician] = useState('Main Bench');
  const [repairNotes, setRepairNotes] = useState('');

  // Physical Condition & Handover items
  const [physicalConditions, setPhysicalConditions] = useState<string[]>([]);
  const [handoverItems, setHandoverItems] = useState<string[]>([]);

  // Date & Delivery Schedule
  const [repairDate, setRepairDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [repairDateOption, setRepairDateOption] = useState<'today' | 'custom'>('today');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryUrgency, setDeliveryUrgency] = useState<'Normal' | 'Express' | 'Urgent Same-Day'>('Normal');

  // Common Repair Problems presets
  const DEFAULT_REPAIR_PROBLEMS = [
    'Screen / Display Broken',
    'Touch Not Responding',
    'Battery Draining Fast',
    'Charging Port Damaged',
    'Water Damage / Dead',
    'No Power / Auto Restart',
    'Back Glass Cracked',
    'Camera Glass / Lens Fault',
    'Ear Speaker / Mic Noise',
    'Network / Wi-Fi Signal Loss',
    'Software Bootloop / FRP',
  ];

  const [customProblems, setCustomProblems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mh_custom_repair_problems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAddCustomProblem, setShowAddCustomProblem] = useState(false);
  const [newCustomProblemText, setNewCustomProblemText] = useState('');

  const POPULAR_BRANDS = [
    'Apple',
    'Samsung',
    'Xiaomi',
    'Vivo',
    'Oppo',
    'Realme',
    'OnePlus',
    'Motorola',
    'Google Pixel',
  ];

  const POPULAR_COLORS = ['Black', 'Blue', 'White', 'Silver', 'Gold', 'Green', 'Purple', 'Grey'];

  const PHYSICAL_CONDITION_OPTIONS = [
    'Normal Wear & Tear',
    'Heavy Scratches on Glass',
    'Dents on Frame/Corners',
    'Bent Chassis / Body',
    'Camera Lens Scratched',
    'Previous Repair Signs',
    'Water/Moisture Detected',
  ];

  const HANDOVER_ITEM_OPTIONS = [
    'SIM Card / Tray',
    'Memory Card',
    'Protective Case',
    'Charging Adapter',
    'Original Box',
  ];

  const handleAddCustomProblem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCustomProblemText.trim();
    if (!trimmed) return;
    if (!customProblems.includes(trimmed) && !DEFAULT_REPAIR_PROBLEMS.includes(trimmed)) {
      const updated = [...customProblems, trimmed];
      setCustomProblems(updated);
      try {
        localStorage.setItem('mh_custom_repair_problems', JSON.stringify(updated));
      } catch {}
    }
    setRepairProblem((prev) => (prev.trim() ? `${prev.trim()}, ${trimmed}` : trimmed));
    setNewCustomProblemText('');
    setShowAddCustomProblem(false);
  };

  const handleToggleProblemChip = (prob: string) => {
    setRepairProblem((prev) => {
      if (!prev.trim()) return prob;
      if (prev.includes(prob)) {
        const parts = prev.split(',').map((s) => s.trim()).filter((s) => s !== prob && s.length > 0);
        return parts.join(', ');
      } else {
        return `${prev.trim()}, ${prob}`;
      }
    });
  };

  const handleTogglePhysicalCondition = (item: string) => {
    setPhysicalConditions((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleToggleHandoverItem = (item: string) => {
    setHandoverItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    if (!repairDeviceName || POPULAR_BRANDS.some((b) => repairDeviceName.startsWith(b))) {
      setRepairDeviceName(`${brand} `);
    }
  };

  const handleRepairSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Required field validation for Customer Details
    if (!repairName.trim()) {
      setShowValidationErrors(true);
      setCustValidationError('Customer Full Name is required *');
      const nameInput = document.getElementById('repairCustNameInput');
      if (nameInput) nameInput.focus();
      return;
    }

    const cleanPhone = repairPhone.replace(/[^0-9+]/g, '');
    if (!repairPhone.trim() || cleanPhone.length < 5) {
      setShowValidationErrors(true);
      setCustValidationError('Valid Customer Phone Number is required *');
      const phoneInput = document.getElementById('repairCustPhoneInput');
      if (phoneInput) phoneInput.focus();
      return;
    }

    const numCost = parseFloat(repairCost) || 0;
    if (!repairCost.trim() || numCost <= 0) {
      setShowValidationErrors(true);
      setCustValidationError('Billing / Repair Cost is required *');
      const costInput = document.getElementById('repairCostInput');
      if (costInput) costInput.focus();
      return;
    }

    setCustValidationError('');
    setShowValidationErrors(false);

    const cleanName = repairName.trim();
    const cleanDeviceName = repairDeviceName.trim() || (selectedBrand ? `${selectedBrand} Device` : 'Mobile Device');
    const cleanProblem = repairProblem.trim() || 'General Service / Inspection';
    const numDeposit = parseFloat(repairDeposit) || 0;

    const orderDateToUse =
      repairDateOption === 'today'
        ? new Date().toISOString().split('T')[0]
        : repairDate || new Date().toISOString().split('T')[0];

    const repairPrefix = profile.billingSystemConfig?.repairPrefix?.trim() || 'REP-';
    const newOrder: RepairOrder = {
      id: `${repairPrefix}${Math.floor(1000 + Math.random() * 9000)}`,
      orderType: 'repair',
      name: cleanName,
      phone: cleanPhone,
      altPhone: repairAltPhone.trim() || undefined,
      deviceName: cleanDeviceName,
      model: cleanDeviceName,
      deviceColor: repairDeviceColor.trim() || undefined,
      imei: repairImei.trim() || 'N/A',
      passcode: repairPasscode.trim() || undefined,
      physicalCondition: physicalConditions.length > 0 ? physicalConditions : undefined,
      handedOverItems: handoverItems.length > 0 ? handoverItems : undefined,
      problem: cleanProblem,
      cost: numCost,
      deposit: numDeposit,
      status: repairStatus,
      date: orderDateToUse,
      expectedDate: config.showExpectedDate && expectedDeliveryDate ? expectedDeliveryDate : undefined,
      technician: repairTechnician.trim() || 'Workshop Bench',
      createdBy: 'Counter Terminal',
      paymentMethod: repairPaymentMethod,
      notes: repairNotes.trim() || undefined,
    };

    onOrderCreated(newOrder);

    // Reset form
    setRepairName('');
    setRepairPhone('');
    setRepairAltPhone('');
    setSelectedBrand('');
    setRepairDeviceName('');
    setRepairDeviceColor('');
    setRepairImei('');
    setRepairPasscode('');
    setPhysicalConditions([]);
    setHandoverItems([]);
    setRepairProblem('');
    setRepairCost('');
    setRepairDeposit('');
    setRepairNotes('');
    setRepairDate(new Date().toISOString().split('T')[0]);
    setRepairDateOption('today');
    setExpectedDeliveryDate('');
  };

  const calculatedRepairBalance = Math.max(
    0,
    (parseFloat(repairCost) || 0) - (parseFloat(repairDeposit) || 0)
  );

  const isCompact = config.density === 'compact';
  const isTwoCol = config.columns === '2-col';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* ====================================================
          HEADER WITH CUSTOMER NEW ORDER ENTRY PAGE ADJUSTMENT OPTION
      ==================================================== */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-xs transition-colors ${
            activeMode === 'sale'
              ? 'bg-violet-600'
              : activeMode === 'order'
              ? 'bg-blue-600'
              : 'bg-zinc-900'
          }`}>
            {activeMode === 'sale' ? (
              <ShoppingBag className="w-5 h-5 text-white" />
            ) : activeMode === 'order' ? (
              <Package className="w-5 h-5 text-white" />
            ) : (
              <Wrench className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                {activeMode === 'sale'
                  ? 'Customer Sales'
                  : activeMode === 'order'
                  ? 'Customer Orders'
                  : 'Service Repair Entry'}
              </h1>
              {activeMode === 'sale' ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  Retail Counter Sale
                </span>
              ) : activeMode === 'order' ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Product & Parts Booking
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Repair Job Card
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {activeMode === 'sale'
                ? 'Instant counter billing: Customer details, product, warranty, bill & deposit'
                : activeMode === 'order'
                ? 'Customer accessory orders, parts booking, advance sourcing & expected pickup'
                : 'Customer device diagnosis, issue checklist, advance deposit & workshop ticketing'}
            </p>
          </div>
        </div>

        {/* Page Structure Adjustment Button */}
        {activeMode === 'repair' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdjustmentPanel(!showAdjustmentPanel)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-2xs ${
                showAdjustmentPanel
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-100'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-300'
              }`}
              title="Adjust Service Repair Entry Page Layout, Fields & Structure"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Repair Page Adjustment</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono uppercase ${
                  showAdjustmentPanel
                    ? 'bg-emerald-700 text-white'
                    : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {config.columns === '2-col' ? '2-Col' : '1-Col'} • {config.formLayout}
              </span>
            </button>
          </div>
        ) : activeMode === 'order' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCustomerOrdersAdjustment(!showCustomerOrdersAdjustment)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-2xs ${
                showCustomerOrdersAdjustment
                  ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-100'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 hover:border-blue-300'
              }`}
              title="Adjust Customer Orders Entry Page Layout, Quick Items, Fields & Structure"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Orders Adjustment</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono uppercase ${
                  showCustomerOrdersAdjustment
                    ? 'bg-blue-700 text-white'
                    : 'bg-blue-200 text-blue-900 font-bold'
                }`}
              >
                {customerOrdersConfig.columns === '2-col' ? '2-Col' : '1-Col'} • {customerOrdersConfig.formLayout}
              </span>
            </button>
          </div>
        ) : null}
      </div>

      {/* ====================================================
          BILLING TYPE SYSTEM COUNTER MODES:
          1. "SERVICE REPAIR & PRODUCT SALES" (Combined primary counter entry)
          2. "CUSTOMER PRE-ORDER / BOOKING"
      ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-zinc-100/80 rounded-2xl border border-zinc-200 shadow-2xs">
        {/* Billing Type 1: SERVICE REPAIR & PRODUCT SALES (COMBINED OPTION) */}
        <div
          onClick={() => {
            if (activeMode !== 'repair' && activeMode !== 'sale') {
              handleModeSwitch('repair');
            }
          }}
          className={`relative p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
            activeMode === 'repair' || activeMode === 'sale'
              ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white/60 border-transparent hover:bg-white hover:border-zinc-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              activeMode === 'repair' || activeMode === 'sale'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-zinc-200 text-zinc-600'
            }`}>
              <div className="flex items-center gap-0.5">
                <Wrench className="w-4 h-4" />
                <span className="text-[10px] font-bold">/</span>
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className={`text-xs tracking-tight uppercase flex items-center gap-1.5 ${
                  activeMode === 'repair' || activeMode === 'sale'
                    ? 'font-bold text-emerald-950'
                    : 'font-semibold text-zinc-700'
                }`}>
                  <span>Service Repair & Product Sales</span>
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    {profile.billingSystemConfig?.repairPrefix || 'REP-'}#
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-violet-50 text-violet-700 font-semibold border border-violet-200">
                    {profile.billingSystemConfig?.salePrefix || 'SL-'}#
                  </span>
                  {(activeMode === 'repair' || activeMode === 'sale') && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Active
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                Mobile device intake, repair tickets & instant counter sales
              </p>

              {/* Sub-selector pills directly inside this option */}
              <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModeSwitch('repair');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeMode === 'repair'
                      ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-700'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <Wrench className="w-3 h-3" />
                  <span>Device Repair Job</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModeSwitch('sale');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeMode === 'sale'
                      ? 'bg-violet-600 text-white shadow-2xs ring-1 ring-violet-700'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Quick Product Sale</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Type 2: CUSTOMER PRE-ORDER */}
        <button
          type="button"
          onClick={() => handleModeSwitch('order')}
          className={`relative p-3.5 rounded-xl text-left transition-all cursor-pointer flex items-start gap-3 border ${
            activeMode === 'order'
              ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
              : 'bg-white/60 border-transparent hover:bg-white hover:border-zinc-300'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            activeMode === 'order'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-zinc-200 text-zinc-600'
          }`}>
            <Package className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className={`text-xs tracking-tight uppercase flex items-center gap-1.5 ${
                activeMode === 'order' ? 'font-bold text-blue-950' : 'font-semibold text-zinc-700'
              }`}>
                <span>Customer Pre-Order & Booking</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  {profile.billingSystemConfig?.orderPrefix || 'ORD-'}#
                </span>
                {activeMode === 'order' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                    Active
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
              Parts procurement, pre-booking & token deposit
            </p>
          </div>
        </button>
      </div>

      {/* ====================================================
          COLLAPSIBLE ORDER ENTRY PAGE ADJUSTMENT PANEL
      ==================================================== */}
      {showAdjustmentPanel && activeMode === 'repair' && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-200">
          <OrderEntryAdjustmentPanel
            config={config}
            onChange={handleConfigChange}
            onSaveAsDefault={handleSaveAsDefault}
            onResetDefaults={handleResetDefaults}
            isSaved={saveSuccess}
            onClose={() => setShowAdjustmentPanel(false)}
          />
        </div>
      )}

      {/* ====================================================
          COLLAPSIBLE CUSTOMER ORDERS PAGE ADJUSTMENT PANEL
      ==================================================== */}
      {showCustomerOrdersAdjustment && activeMode === 'order' && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-200">
          <CustomerOrdersAdjustmentPanel
            config={customerOrdersConfig}
            onChange={handleCustomerOrdersConfigChange}
            onSaveAsDefault={handleSaveCustomerOrdersAsDefault}
            onResetDefaults={handleResetCustomerOrdersDefaults}
            isSaved={customerOrdersSaveSuccess}
            onClose={() => setShowCustomerOrdersAdjustment(false)}
          />
        </div>
      )}

      {/* ====================================================
          ACTIVE FORM DISPLAY: SERVICE REPAIR, CUSTOMER ORDERS, OR CUSTOMER SALES
      ==================================================== */}
      {activeMode === 'sale' ? (
        <CustomerSalesForm
          profile={profile}
          inventory={inventory}
          onOrderCreated={onOrderCreated}
          onSaveProfile={onSaveProfile}
          onAdjustStock={onAdjustStock}
        />
      ) : activeMode === 'order' ? (
        <CustomerOrdersForm
          profile={profile}
          inventory={inventory}
          onOrderCreated={onOrderCreated}
          config={customerOrdersConfig}
          onOpenAdjustment={() => setShowCustomerOrdersAdjustment((prev) => !prev)}
        />
      ) : (
        <div className={`bg-white rounded-2xl border border-zinc-200 shadow-2xs ${isCompact ? 'p-4 sm:p-5' : 'p-6 sm:p-7'}`}>
          <form onSubmit={handleRepairSubmit} className={isCompact ? 'space-y-4' : 'space-y-6'}>
          {/* ====================================================
              JOB TICKET DATE & PRIORITY — NEW MODERN STYLE
          ==================================================== */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-zinc-50/70 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              {/* Left: Date Section */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider">
                      Job Ticket Date & Priority
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300/60 font-mono">
                      {profile.billingSystemConfig?.repairPrefix || 'REP-'}INTAKE
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                    {repairDateOption === 'today' ? (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                        <span className="text-zinc-500 text-[11px]">Date:</span>
                        <span className="font-mono font-bold text-zinc-950 bg-white px-2 py-0.5 rounded-md border border-zinc-200 shadow-2xs">
                          {new Date().toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 text-[11px]">Custom:</span>
                        <input
                          type="date"
                          required
                          value={repairDate}
                          onChange={(e) => setRepairDate(e.target.value)}
                          className="px-2.5 py-0.5 text-xs bg-white border border-zinc-300 rounded-md text-zinc-900 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                        />
                      </div>
                    )}

                    {/* Segmented Pill for Today vs Custom */}
                    <div className="inline-flex rounded-lg border border-zinc-200/90 bg-zinc-100/90 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setRepairDateOption('today');
                          setRepairDate(new Date().toISOString().split('T')[0]);
                        }}
                        className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                          repairDateOption === 'today'
                            ? 'bg-white text-zinc-950 shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepairDateOption('custom')}
                        className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                          repairDateOption === 'custom'
                            ? 'bg-white text-zinc-950 shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Custom Date
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Modern Priority Level Chips */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 self-start md:self-center">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Urgency Level:
                </span>
                <div className="inline-flex items-center p-1 bg-white rounded-xl border border-zinc-200 shadow-2xs gap-1">
                  <button
                    type="button"
                    onClick={() => setDeliveryUrgency('Normal')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      deliveryUrgency === 'Normal'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <span>Normal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryUrgency('Express')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      deliveryUrgency === 'Express'
                        ? 'bg-amber-500 text-white shadow-xs ring-1 ring-amber-600'
                        : 'text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <span>⚡ Express</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryUrgency('Urgent Same-Day')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      deliveryUrgency === 'Urgent Same-Day'
                        ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-700 animate-pulse'
                        : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>🚨 Urgent</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Core Grid: Customer Details & Device Information */}
          <div className={`grid grid-cols-1 ${isTwoCol ? 'md:grid-cols-2' : ''} gap-4`}>
            {/* 1. CUSTOMER DETAILS */}
            <div className={`rounded-xl border border-zinc-200 bg-white ${isCompact ? 'p-3.5 space-y-3' : 'p-4 space-y-3.5'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-800" />
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1">
                    <span>1. Customer Details</span>
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  </h3>
                </div>
              </div>

              {custValidationError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-medium">{custValidationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center justify-between">
                  <span>
                    Customer Name <span className="text-red-500 font-bold text-sm leading-none ml-0.5">*</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Required for receipt</span>
                </label>
                <input
                  id="repairCustNameInput"
                  type="text"
                  required
                  placeholder="e.g. John Doe / Sarah Smith"
                  className={`w-full px-3 py-2 text-xs bg-zinc-50 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 ${
                    showValidationErrors && !repairName.trim()
                      ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30'
                      : 'border-zinc-200'
                  }`}
                  value={repairName}
                  onChange={(e) => {
                    setRepairName(e.target.value);
                    if (custValidationError && e.target.value.trim()) setCustValidationError('');
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center justify-between">
                  <span>
                    Customer Phone <span className="text-red-500 font-bold text-sm leading-none ml-0.5">*</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">WhatsApp / SMS updates</span>
                </label>
                <input
                  id="repairCustPhoneInput"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210 (10 digits)"
                  className={`w-full px-3 py-2 text-xs bg-zinc-50 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-mono ${
                    showValidationErrors && (!repairPhone.trim() || repairPhone.replace(/[^0-9+]/g, '').length < 5)
                      ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30'
                      : 'border-zinc-200'
                  }`}
                  value={repairPhone}
                  onChange={(e) => {
                    setRepairPhone(e.target.value);
                    if (custValidationError && e.target.value.trim()) setCustValidationError('');
                  }}
                />
              </div>

              {/* Optional: Alternate Phone */}
              {config.showAlternatePhone && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Alternate Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. Landline or Secondary Mobile"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-mono"
                    value={repairAltPhone}
                    onChange={(e) => setRepairAltPhone(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* 2. DEVICE INFORMATION */}
            <div className={`rounded-xl border border-zinc-200 bg-white ${isCompact ? 'p-3.5 space-y-3' : 'p-4 space-y-3.5'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-zinc-800" />
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    2. Device Information
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAtoZCatalog(true)}
                    className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Open All Models A to Z Catalog (Old & New Models)"
                  >
                    <ArrowDownAZ className="w-3.5 h-3.5 text-blue-600" />
                    <span>All Models A-Z</span>
                  </button>
                  {selectedBrand && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {selectedBrand}
                    </span>
                  )}
                </div>
              </div>

              {/* Brand Selector Chips */}
              {config.showBrandSelector && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-zinc-500">
                      Quick Brand Selection:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAtoZCatalog(true)}
                      className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span>A-Z Catalog</span>
                      <ArrowDownAZ className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_BRANDS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleBrandSelect(b)}
                        className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition-all cursor-pointer ${
                          selectedBrand === b
                            ? 'bg-zinc-900 text-white font-bold'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>

                  {/* A-Z Quick Letter Filter Bar */}
                  <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase shrink-0 mr-0.5">
                      Jump:
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

              {/* Brand Model Dropdown */}
              {selectedBrand && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-zinc-600">
                      {selectedBrand} Models ({currentBrandModels.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectedBrand('')}
                      className="text-[10px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      title="Clear brand"
                    >
                      Clear
                    </button>
                  </div>
                  <select
                    value={repairDeviceName.startsWith(selectedBrand) ? repairDeviceName.replace(`${selectedBrand} `, '') : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setRepairDeviceName(formatDeviceBrandAndModel(selectedBrand, e.target.value));
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white text-zinc-900"
                  >
                    <option value="">-- Choose {selectedBrand} Model --</option>
                    {currentBrandModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Device Name & Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 14 Pro / Samsung Galaxy S23 Ultra / Vivo V29"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-medium"
                  value={repairDeviceName}
                  onChange={(e) => setRepairDeviceName(e.target.value)}
                />
              </div>

              {/* Device Color & Screen Lock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {config.showDeviceColor && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">
                      Device Color
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Space Black"
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900"
                      value={repairDeviceColor}
                      onChange={(e) => setRepairDeviceColor(e.target.value)}
                    />
                  </div>
                )}

                {config.showPasscodeLock && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-zinc-500" />
                      <span>Passcode / Pattern</span>
                    </label>
                    <input
                      type="text"
                      placeholder="PIN / Lock Pattern"
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-mono"
                      value={repairPasscode}
                      onChange={(e) => setRepairPasscode(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* IMEI / Serial */}
              {config.showImei && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-600">
                      IMEI / Serial Number (Optional)
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {repairImei.length > 0 ? `${repairImei.length}/15 digits` : 'Dial *#06#'}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={18}
                    placeholder="15-digit IMEI or Serial #"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-mono tracking-wider"
                    value={repairImei}
                    onChange={(e) => setRepairImei(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. DIAGNOSTIC & FAULT DETAILS */}
          <div className={`rounded-xl border border-zinc-200 bg-white ${isCompact ? 'p-3.5 space-y-3' : 'p-4 space-y-3.5'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-zinc-800" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  3. Reported Problem & Fault Diagnosis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomProblem(!showAddCustomProblem)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Problem Option</span>
              </button>
            </div>

            {/* Custom problem modal / input */}
            {showAddCustomProblem && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 animate-in fade-in duration-150">
                <span className="text-xs font-semibold text-blue-900 block">
                  Add Custom Reported Issue / Service:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Face ID Not Functioning / Fingerprint Sensor"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                    value={newCustomProblemText}
                    onChange={(e) => setNewCustomProblemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomProblem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomProblem()}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomProblem(false)}
                    className="px-2 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Common problem quick chips */}
            {config.showCommonFaults && (
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">
                  Click Common Faults to Insert / Toggle:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_REPAIR_PROBLEMS.map((prob) => {
                    const isSelected = repairProblem.includes(prob);
                    return (
                      <button
                        key={prob}
                        type="button"
                        onClick={() => handleToggleProblemChip(prob)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        {prob}
                      </button>
                    );
                  })}
                  {customProblems.map((prob) => {
                    const isSelected = repairProblem.includes(prob);
                    return (
                      <button
                        key={prob}
                        type="button"
                        onClick={() => handleToggleProblemChip(prob)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {prob} (Custom)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Problem Textarea */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Reported Problem / Job Description
              </label>
              <textarea
                rows={2}
                placeholder="Describe fault, symptoms, customer complaints, and requested replacements..."
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 resize-none"
                value={repairProblem}
                onChange={(e) => setRepairProblem(e.target.value)}
              />
            </div>

            {/* Optional: Physical Condition Inspection */}
            {config.showPhysicalCondition && (
              <div className="pt-2 border-t border-zinc-100">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Physical Device Inspection at Handover:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PHYSICAL_CONDITION_OPTIONS.map((opt) => {
                    const checked = physicalConditions.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleTogglePhysicalCondition(opt)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                          checked
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {checked ? '✓ ' : ''}{opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional: Handover Accessories Checklist */}
            {config.showHandoverChecklist && (
              <div className="pt-2 border-t border-zinc-100">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>Handed-Over Customer Accessories / Cards:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {HANDOVER_ITEM_OPTIONS.map((opt) => {
                    const checked = handoverItems.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleToggleHandoverItem(opt)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                          checked
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {checked ? '✓ ' : ''}{opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. BILLING & PAYMENT (SIMPLIFIED & CLEAN) */}
          <div className={`rounded-xl border border-zinc-200 bg-white ${isCompact ? 'p-3.5 space-y-3' : 'p-4 space-y-3.5'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1">
                  <span>4. Billing & Payment</span>
                  <span className="text-red-500 font-bold ml-0.5">*</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 font-medium">Balance Due:</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                  calculatedRepairBalance > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {curr}{calculatedRepairBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${isTwoCol ? 'sm:grid-cols-2 md:grid-cols-4' : 'sm:grid-cols-2'} gap-3.5`}>
              {/* Estimated / Total Repair Cost */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center justify-between">
                  <span>
                    Total / Estimated Cost <span className="text-red-500 font-bold text-sm leading-none ml-0.5">*</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Pricing</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs font-bold">
                    {curr}
                  </span>
                  <input
                    id="repairCostInput"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg focus:outline-hidden focus:ring-1 transition-all text-zinc-900 font-mono font-bold ${
                      showValidationErrors && (!repairCost.trim() || parseFloat(repairCost) <= 0)
                        ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30'
                        : 'bg-zinc-50 border border-zinc-200 focus:ring-zinc-900 focus:bg-white'
                    }`}
                    value={repairCost}
                    onChange={(e) => {
                      setRepairCost(e.target.value);
                      if (custValidationError && parseFloat(e.target.value) > 0) setCustValidationError('');
                    }}
                    onFocus={(e) => {
                      if (e.target.value === '0' || e.target.value === '0.00') {
                        setRepairCost('');
                      } else {
                        e.target.select();
                      }
                    }}
                  />
                </div>
                {showValidationErrors && (!repairCost.trim() || parseFloat(repairCost) <= 0) && (
                  <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                    <span>Billing cost is required *</span>
                  </p>
                )}
              </div>

              {/* Advance Deposit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700">Advance Deposit</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRepairDeposit('')}
                      className="text-[10px] text-zinc-500 hover:text-zinc-800 hover:underline font-medium cursor-pointer"
                      title="No advance deposit (₹0)"
                    >
                      {curr}0
                    </button>
                    {parseFloat(repairCost) > 0 && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            const half = Math.round((parseFloat(repairCost) || 0) / 2);
                            setRepairDeposit(half.toString());
                          }}
                          className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                          title="50% advance deposit"
                        >
                          50%
                        </button>
                        <span className="text-zinc-300">•</span>
                        <button
                          type="button"
                          onClick={() => setRepairDeposit(repairCost)}
                          className="text-[10px] text-emerald-600 hover:underline font-semibold cursor-pointer"
                          title="Full payment upfront"
                        >
                          Full Paid
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs font-bold">
                    {curr}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-mono font-bold"
                    value={repairDeposit}
                    onChange={(e) => setRepairDeposit(e.target.value)}
                    onFocus={(e) => {
                      if (e.target.value === '0' || e.target.value === '0.00') {
                        setRepairDeposit('');
                      } else {
                        e.target.select();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={repairPaymentMethod}
                  onChange={(e) => setRepairPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 text-zinc-900 font-medium"
                >
                  <option value="Cash">Cash Counter</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer / Credit</option>
                </select>
              </div>

              {/* Initial Status (With Delivered option and rapid 1-click pills!) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Initial Status <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  value={repairStatus}
                  onChange={(e) => setRepairStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 text-zinc-900 font-medium"
                >
                  <option value="Pending">Pending Diagnosis</option>
                  <option value="In Progress">In Progress (Bench)</option>
                  <option value="Completed">Completed (Ready)</option>
                  <option value="Delivered">Delivered (Handed Over / Closed)</option>
                </select>

                {/* 1-Click Status Selection Pills */}
                <div className="grid grid-cols-4 gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setRepairStatus('Pending')}
                    className={`px-1 py-0.5 rounded text-[10px] font-medium transition-all text-center cursor-pointer ${
                      repairStatus === 'Pending'
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairStatus('In Progress')}
                    className={`px-1 py-0.5 rounded text-[10px] font-medium transition-all text-center cursor-pointer ${
                      repairStatus === 'In Progress'
                        ? 'bg-blue-100 text-blue-900 font-bold border border-blue-300 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    In Prog
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairStatus('Completed')}
                    className={`px-1 py-0.5 rounded text-[10px] font-medium transition-all text-center cursor-pointer ${
                      repairStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairStatus('Delivered')}
                    className={`px-1 py-0.5 rounded text-[10px] font-medium transition-all text-center cursor-pointer ${
                      repairStatus === 'Delivered'
                        ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Balance Preview Card */}
          {parseFloat(repairCost) > 0 && (
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-500">Calculated Balance Due at Handover:</span>
                <p className="text-lg font-bold text-zinc-900 font-mono">
                  {curr}{calculatedRepairBalance.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-zinc-700 font-medium flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-zinc-200">
                  <QrCode className="w-3.5 h-3.5 text-zinc-900" />
                  <span>Billing QR embeds {curr}{calculatedRepairBalance.toFixed(2)}</span>
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5">
            <button
              type="button"
              onClick={() => {
                setRepairName('');
                setRepairPhone('');
                setRepairAltPhone('');
                setRepairDeviceName('');
                setRepairDeviceColor('');
                setRepairImei('');
                setRepairPasscode('');
                setRepairProblem('');
                setRepairCost('');
                setRepairDeposit('');
                setRepairNotes('');
              }}
              className="px-4 py-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              Clear Form
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Save & Generate Repair Ticket</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      )}

      {/* A to Z Device Models Catalog Modal - Lazy loaded */}
      {showAtoZCatalog && (
        <React.Suspense fallback={null}>
          <AtoZModelCatalogModal
            isOpen={showAtoZCatalog}
            onClose={() => setShowAtoZCatalog(false)}
            initialBrand={selectedBrand || 'All Brands'}
            onSelectModel={({ brand, model, fullDeviceName }) => {
              setSelectedBrand(brand);
              setRepairDeviceName(fullDeviceName);
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
};
