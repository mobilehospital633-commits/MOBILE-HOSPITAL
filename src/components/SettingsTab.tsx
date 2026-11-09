import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Download,
  Upload,
  Save,
  Trash2,
  Store,
  Receipt,
  RotateCcw,
  CheckCircle,
  Eye,
  EyeOff,
  Palette,
  Shield,
  Check,
  Lock,
  Unlock,
  Cloud,
  KeyRound,
  AlertCircle,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Boxes,
  Database,
  SlidersHorizontal,
  Printer,
  Scissors,
  CheckCircle2,
  Wrench,
  Flame,
  Zap,
  Share2,
  Crown,
  UserCheck,
  ImageIcon,
  Smartphone,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Server,
  HardDrive,
  CheckCheck,
  RefreshCw,
  Cpu,
  Activity,
  Package,
  MessageSquare,
  ReceiptText,
  Hash,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { compressImage, formatBytes } from '../utils/imageCompressor';
import {
  ShopProfile,
  ThemeMode,
  ThemeAccent,
  RepairOrder,
  InventoryItem,
  AccountTransaction,
  PageStructureConfig,
  DEFAULT_PAGE_STRUCTURE,
  OrderEntryPageConfig,
  DEFAULT_ORDER_ENTRY_CONFIG,
  CustomerOrdersPageConfig,
  DEFAULT_CUSTOMER_ORDERS_CONFIG,
  SystemFeaturesConfig,
  DEFAULT_SYSTEM_FEATURES,
  CustomerEntryMode,
  AppEdition,
  UserRole,
  BillingSystemConfig,
  DEFAULT_BILLING_SYSTEM_CONFIG,
  BillingType,
} from '../types';
import { MHLogo } from './MHLogo';
import { MHRepairWatermark } from './MHRepairWatermark';
import { ThemeSelector } from './ThemeSelector';
import { BackupPayload } from '../lib/googleDrive';
import { ResetType } from './ResetConfirmModal';

// Lazy-loaded heavy cloud and modal views
const GoogleDriveBackupView = React.lazy(() => import('./GoogleDriveBackupView').then((m) => ({ default: m.GoogleDriveBackupView })));
const FirebaseSyncView = React.lazy(() => import('./FirebaseSyncView').then((m) => ({ default: m.FirebaseSyncView })));
const ResetConfirmModal = React.lazy(() => import('./ResetConfirmModal').then((m) => ({ default: m.ResetConfirmModal })));
import { PageStructurePanel } from './PageStructurePanel';
import { OrderEntryAdjustmentPanel } from './OrderEntryAdjustmentPanel';
import { CustomerOrdersAdjustmentPanel } from './CustomerOrdersAdjustmentPanel';

interface SettingsTabProps {
  profile: ShopProfile;
  userRole?: UserRole;
  onSaveProfile: (profile: ShopProfile) => void;
  onClearOrders: () => void;
  onResetOrdersToDefault?: () => void;
  onClearInventory: () => void;
  onResetInventoryToDefault?: () => void;
  onClearTransactions?: () => void;
  onResetAllData: () => void;
  onFullFactoryReset?: (mode: 'wipe' | 'default') => void;
  onExportBackup?: () => void;
  onImportProfile: (profile: ShopProfile) => void;
  onOpenPinSetup?: () => void;
  onLockTerminal?: () => void;
  orders?: RepairOrder[];
  inventory?: InventoryItem[];
  transactions?: AccountTransaction[];
  onRestoreAllData?: (payload: BackupPayload) => void;
  initialSubtab?: 'general' | 'tax' | 'structure' | 'features' | 'system' | 'security' | 'drive' | 'firebase' | 'reset';
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profile,
  userRole = 'owner',
  onSaveProfile,
  onClearOrders,
  onResetOrdersToDefault,
  onClearInventory,
  onResetInventoryToDefault,
  onClearTransactions,
  onResetAllData,
  onFullFactoryReset,
  onExportBackup,
  onImportProfile,
  onOpenPinSetup,
  onLockTerminal,
  orders = [],
  inventory = [],
  transactions = [],
  onRestoreAllData,
  initialSubtab = 'tax',
}) => {
  const [subtab, setSubtab] = useState<'general' | 'tax' | 'structure' | 'features' | 'system' | 'security' | 'drive' | 'firebase' | 'reset'>(initialSubtab);
  const [structureSection, setStructureSection] = useState<'receipt' | 'order_entry' | 'customer_orders'>('order_entry');
  const [structure, setStructure] = useState<PageStructureConfig>(() => {
    return profile.pageStructure || DEFAULT_PAGE_STRUCTURE;
  });
  const [orderEntryConfig, setOrderEntryConfig] = useState<OrderEntryPageConfig>(() => {
    return profile.orderEntryConfig || DEFAULT_ORDER_ENTRY_CONFIG;
  });
  const [customerOrdersConfig, setCustomerOrdersConfig] = useState<CustomerOrdersPageConfig>(() => {
    return profile.customerOrdersConfig || DEFAULT_CUSTOMER_ORDERS_CONFIG;
  });
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(() => {
    return profile.systemFeatures || DEFAULT_SYSTEM_FEATURES;
  });
  const [billingConfig, setBillingConfig] = useState<BillingSystemConfig>(() => {
    return profile.billingSystemConfig || {
      ...DEFAULT_BILLING_SYSTEM_CONFIG,
      defaultBillingType: profile.systemFeatures?.defaultCustomerEntryMode || 'repair',
      autoDeductInventoryOnSale: profile.systemFeatures?.autoDeductInventoryOnSale !== false,
      autoDeductInventoryOnRepair: !!profile.systemFeatures?.autoDeductInventoryOnRepair,
      lowStockAlerts: profile.systemFeatures?.lowStockAlerts !== false,
      lowStockThreshold: profile.systemFeatures?.lowStockThreshold || 5,
    };
  });
  const [activeResetModal, setActiveResetModal] = useState<ResetType | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShopProfile>(profile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const [logoCompressionInfo, setLogoCompressionInfo] = useState<{ original: string; compressed: string; savings: number } | null>(null);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingLogo(true);
      const result = await compressImage(file, { maxWidth: 360, maxHeight: 360, quality: 0.82 });
      setFormData((prev) => ({ ...prev, logoUrl: result.dataUrl }));
      setLogoCompressionInfo({
        original: formatBytes(result.originalSizeBytes),
        compressed: formatBytes(result.compressedSizeBytes),
        savings: result.savingsPercent,
      });
    } catch (err) {
      console.error('Image compression failed', err);
    } finally {
      setIsCompressingLogo(false);
    }
  };

  useEffect(() => {
    if (profile.pageStructure) {
      setStructure(profile.pageStructure);
    }
  }, [profile.pageStructure]);

  useEffect(() => {
    if (profile.orderEntryConfig) {
      setOrderEntryConfig(profile.orderEntryConfig);
    }
  }, [profile.orderEntryConfig]);

  useEffect(() => {
    if (initialSubtab) {
      setSubtab(initialSubtab);
    }
  }, [initialSubtab]);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleStructureChange = (updated: PageStructureConfig) => {
    setStructure(updated);
    setFormData((prev) => ({
      ...prev,
      pageStructure: updated,
    }));
  };

  const handleSaveStructure = () => {
    const updated: ShopProfile = {
      ...formData,
      pageStructure: structure,
    };
    onSaveProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleOrderEntryConfigChange = (updated: OrderEntryPageConfig) => {
    setOrderEntryConfig(updated);
    setFormData((prev) => ({
      ...prev,
      orderEntryConfig: updated,
    }));
    try {
      localStorage.setItem('mh_order_entry_config', JSON.stringify(updated));
    } catch {}
  };

  const handleSaveOrderEntryConfig = () => {
    const updated: ShopProfile = {
      ...formData,
      orderEntryConfig,
    };
    onSaveProfile(updated);
    try {
      localStorage.setItem('mh_order_entry_config', JSON.stringify(orderEntryConfig));
    } catch {}
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCustomerOrdersConfigChange = (updated: CustomerOrdersPageConfig) => {
    setCustomerOrdersConfig(updated);
    setFormData((prev) => ({
      ...prev,
      customerOrdersConfig: updated,
    }));
    try {
      localStorage.setItem('mh_customer_orders_config', JSON.stringify(updated));
    } catch {}
  };

  const handleSaveCustomerOrdersConfig = () => {
    const updated: ShopProfile = {
      ...formData,
      customerOrdersConfig,
    };
    onSaveProfile(updated);
    try {
      localStorage.setItem('mh_customer_orders_config', JSON.stringify(customerOrdersConfig));
    } catch {}
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleToggleFeature = (key: keyof SystemFeaturesConfig) => {
    const updated: SystemFeaturesConfig = {
      ...systemFeatures,
      [key]: !systemFeatures[key],
    };
    setSystemFeatures(updated);
    const updatedProfile = { ...formData, systemFeatures: updated };
    setFormData(updatedProfile);
    onSaveProfile(updatedProfile);
    try {
      localStorage.setItem('mh_profile', JSON.stringify(updatedProfile));
    } catch {}
  };

  const handleUpdateFeatureValue = <K extends keyof SystemFeaturesConfig>(key: K, value: SystemFeaturesConfig[K]) => {
    const updated: SystemFeaturesConfig = {
      ...systemFeatures,
      [key]: value,
    };
    setSystemFeatures(updated);
    const updatedProfile = { ...formData, systemFeatures: updated };
    setFormData(updatedProfile);
    onSaveProfile(updatedProfile);
    try {
      localStorage.setItem('mh_profile', JSON.stringify(updatedProfile));
    } catch {}
  };

  const handleUpdateBillingConfig = <K extends keyof BillingSystemConfig>(key: K, value: BillingSystemConfig[K]) => {
    const updated: BillingSystemConfig = {
      ...billingConfig,
      [key]: value,
    };
    setBillingConfig(updated);

    // Keep backwards compatible flags aligned
    const updatedFeatures: SystemFeaturesConfig = {
      ...systemFeatures,
      defaultCustomerEntryMode: updated.defaultBillingType,
      autoDeductInventoryOnSale: updated.autoDeductInventoryOnSale,
      autoDeductInventoryOnRepair: updated.autoDeductInventoryOnRepair,
      lowStockAlerts: updated.lowStockAlerts,
      lowStockThreshold: updated.lowStockThreshold,
    };
    setSystemFeatures(updatedFeatures);

    const updatedProfile: ShopProfile = {
      ...formData,
      billingSystemConfig: updated,
      systemFeatures: updatedFeatures,
    };
    setFormData(updatedProfile);
    onSaveProfile(updatedProfile);
    try {
      localStorage.setItem('mh_profile', JSON.stringify(updatedProfile));
    } catch {}
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleToggleBillingTypeActive = (type: CustomerEntryMode) => {
    const currentList = billingConfig.activeBillingTypes || ['repair', 'order', 'sale'];
    let newList: CustomerEntryMode[];
    if (currentList.includes(type)) {
      if (currentList.length === 1) return; // Prevent disabling all types
      newList = currentList.filter((t) => t !== type);
    } else {
      newList = [...currentList, type];
    }
    handleUpdateBillingConfig('activeBillingTypes', newList);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `mobile_hospital_profile_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.shopName) {
          onImportProfile(imported);
          alert('Profile settings imported successfully!');
        } else {
          alert('Invalid profile JSON configuration.');
        }
      } catch (err) {
        alert('Could not read JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Staff Role Notice Banner */}
      {userRole === 'staff' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 text-xs">
          <UserCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold block text-sm">
              Staff Attendant Mode Active (View & Create Only)
            </span>
            <span className="text-[11px] text-amber-800">
              Staff accounts have view and create permissions. Data deletion, catalog wipes, and security PIN management are restricted to the Store Owner.
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-6 sm:p-7 space-y-6">
        
        {/* Header & Logo Live Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-100 pb-5 gap-4">
          <div className="flex items-center gap-3.5">
            <MHLogo
              customUrl={formData.logoUrl}
              size="lg"
              rounded="xl"
              theme="dark"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                  {formData.shopName || 'MOBILE HOSPITAL'}
                </h2>
                <span className="bg-zinc-100 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-200">
                  Official MH Branding
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Receipt Design, Tax Rates & Shop Profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubtab('firebase')}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-300/30" />
              <span>Firebase Cloud</span>
            </button>
            <button
              type="button"
              onClick={() => setSubtab('drive')}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cloud Backup</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export</span>
            </button>
            <label className="bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Subtabs */}
        <div className="flex border-b border-zinc-100 gap-6 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubtab('general')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider whitespace-nowrap ${
              subtab === 'general'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            General & Branding
          </button>
          <button
            type="button"
            onClick={() => setSubtab('tax')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
              subtab === 'tax'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Tax & Receipts</span>
          </button>
          <button
            type="button"
            onClick={() => setSubtab('structure')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
              subtab === 'structure'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Page Structure & Layout</span>
          </button>
          <button
            type="button"
            onClick={() => setSubtab('features')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
              subtab === 'features'
                ? 'border-emerald-600 text-emerald-600 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Billing Type System</span>
          </button>
          <button
            type="button"
            onClick={() => setSubtab('system')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
              subtab === 'system'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & System</span>
          </button>
          <button
            type="button"
            onClick={() => setSubtab('security')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
              subtab === 'security'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>PIN & Security</span>
          </button>
          <button
            type="button"
            onClick={() => setSubtab('drive')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
              subtab === 'drive'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            <span>Google Drive Backup</span>
          </button>
          <button
            type="button"
            onClick={() => setSubtab('firebase')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
              subtab === 'firebase'
                ? 'border-amber-500 text-amber-500 font-bold'
                : 'border-transparent text-zinc-400 hover:text-amber-500'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Firebase Cloud DB</span>
          </button>
          <button
            type="button"
            onClick={() => setSubtab('reset')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
              subtab === 'reset'
                ? 'border-rose-600 text-rose-600 font-bold'
                : 'border-transparent text-zinc-400 hover:text-rose-600'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Data & Factory Reset</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SUBTAB 1: General & Branding */}
          {subtab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Store Identity & Customer Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Shop Brand Logo
                    </label>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '' })}
                        className="text-[11px] text-zinc-600 hover:text-zinc-900 font-semibold underline cursor-pointer"
                      >
                        Reset to Official MH Logo
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0">
                        <MHLogo
                          customUrl={formData.logoUrl}
                          size="sm"
                          rounded="md"
                          theme="light"
                        />
                      </div>
                      <input
                        type="url"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        placeholder="Leave empty for Official MH Logo, or paste custom URL"
                        className="flex-1 border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                      />
                      <label className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg border border-zinc-200 cursor-pointer transition-colors shadow-2xs">
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-600" />
                        <span>{isCompressingLogo ? 'Compressing...' : 'Upload & Compress'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoFileUpload}
                          disabled={isCompressingLogo}
                        />
                      </label>
                    </div>

                    {logoCompressionInfo && (
                      <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                        <span className="font-semibold">⚡ Image Compressed:</span>
                        <span>{logoCompressionInfo.original} → {logoCompressionInfo.compressed}</span>
                        <span className="font-bold text-emerald-700">(-{logoCompressionInfo.savings}% reduced)</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Upload any photo or logo — it will be automatically resized & compressed (WebP/JPEG) for maximum loading speed and minimal storage use.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@mobilehospital.com"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Shop Address (Printed on Receipts) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-semibold text-zinc-400">@</span>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="mobilehospital"
                      className="w-full pl-7 border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Website / Link
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="mobilehospital.com"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: Tax & Invoicing */}
          {subtab === 'tax' && (
            <div className="space-y-5">
              {/* Tax Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.gst}
                    onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm font-mono text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Tax Label
                  </label>
                  <input
                    type="text"
                    value={formData.taxLabel}
                    onChange={(e) => setFormData({ ...formData, taxLabel: e.target.value })}
                    placeholder="e.g. GST / VAT"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="18"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="₹ or $"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Tax Toggle */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-800">Print Tax Breakdown on Receipts</h4>
                  <p className="text-[11px] text-zinc-400">
                    Calculates subtotal excluding tax and displays tax line item on receipts.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showTaxOnReceipt}
                    onChange={(e) =>
                      setFormData({ ...formData, showTaxOnReceipt: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              {/* Terms */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Receipt Footer Warranty & Terms (Printed on all slips)
                </label>
                <textarea
                  rows={3}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* SUBTAB: Page Structure & Layout Adjustment */}
          {subtab === 'structure' && (
            <div className="space-y-6">
              {/* Section Switcher Pills: Order Entry vs Receipt Print */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    <span>Page Structure & Layout Adjustment</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Customize the customer new order intake form structure and receipt print layout presets
                  </p>
                </div>

                <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100/90 p-1 shadow-2xs flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setStructureSection('order_entry')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      structureSection === 'order_entry'
                        ? 'bg-white text-zinc-900 shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Repair Ticket Form</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStructureSection('customer_orders')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      structureSection === 'customer_orders'
                        ? 'bg-white text-blue-900 shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pre-Orders & Booking Form</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStructureSection('receipt')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      structureSection === 'receipt'
                        ? 'bg-white text-zinc-900 shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-blue-600" />
                    <span>Receipt & Print Layout</span>
                  </button>
                </div>
              </div>

              {/* VIEW 1: CUSTOMER REPAIR ORDER ENTRY PAGE ADJUSTMENT */}
              {structureSection === 'order_entry' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <OrderEntryAdjustmentPanel
                    config={orderEntryConfig}
                    onChange={handleOrderEntryConfigChange}
                    onSaveAsDefault={handleSaveOrderEntryConfig}
                    onResetDefaults={() => handleOrderEntryConfigChange(DEFAULT_ORDER_ENTRY_CONFIG)}
                    isSaved={saveSuccess}
                  />
                </div>
              )}

              {/* VIEW 2: CUSTOMER PRE-ORDERS & BOOKING FORM ADJUSTMENT */}
              {structureSection === 'customer_orders' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <CustomerOrdersAdjustmentPanel
                    config={customerOrdersConfig}
                    onChange={handleCustomerOrdersConfigChange}
                    onSaveAsDefault={handleSaveCustomerOrdersConfig}
                    onResetDefaults={() => handleCustomerOrdersConfigChange(DEFAULT_CUSTOMER_ORDERS_CONFIG)}
                    isSaved={saveSuccess}
                  />
                </div>
              )}

              {/* VIEW 3: RECEIPT PRINT LAYOUT STRUCTURE */}
              {structureSection === 'receipt' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                        Thermal Roll & Sheet Print Layout Settings
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Default 80mm / 58mm / A4 paper sizes, margins, thermal mono mode, and visible blocks
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStructureChange(DEFAULT_PAGE_STRUCTURE)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Reset Defaults</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveStructure}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                          saveSuccess
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                        }`}
                      >
                        {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{saveSuccess ? 'Saved as Default' : 'Save as Default'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Structure Control Panel */}
                  <PageStructurePanel
                    structure={structure}
                    onChange={handleStructureChange}
                    onSaveAsDefault={handleSaveStructure}
                    onResetDefaults={() => handleStructureChange(DEFAULT_PAGE_STRUCTURE)}
                    isSaved={saveSuccess}
                    compactMode={false}
                    showAppLayoutOptions={true}
                  />

              {/* Live Interactive Bill Preview */}
              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-xs">
                      👁️
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                        Live Page Structure Output Preview
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Shows how receipts and job cards will appear with the adjusted structure
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                      {structure.paperSize} | {structure.margins} | {structure.fontScale}
                    </span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200"
                    >
                      <Printer className="w-3 h-3 text-zinc-600" />
                      <span>Print Test Slip</span>
                    </button>
                  </div>
                </div>

                {/* Preview Sheet Container */}
                <div className="flex justify-center items-start p-4 sm:p-8 bg-zinc-100/70 rounded-xl overflow-x-auto">
                  <div
                    className={`relative overflow-hidden bg-white shadow-md rounded-xl border border-zinc-200 font-mono transition-all ${
                      structure.paperSize === '58mm'
                        ? 'w-[280px] max-w-[280px]'
                        : structure.paperSize === '80mm'
                        ? 'w-[370px] max-w-[370px]'
                        : structure.paperSize === 'a5'
                        ? 'w-[520px] max-w-[520px]'
                        : 'w-full max-w-[720px]'
                    } ${
                      structure.margins === 'tight'
                        ? 'p-2.5'
                        : structure.margins === 'spacious'
                        ? 'p-7'
                        : 'p-5'
                    } ${
                      structure.fontScale === 'compact'
                        ? 'text-[10px]'
                        : structure.fontScale === 'large'
                        ? 'text-[13px]'
                        : 'text-xs'
                    } ${structure.thermalMonoMode ? 'mono-thermal' : ''}`}
                  >
                    {/* Center Watermark Lite: Mobile Repair Shop Logo "MH" with MOBILE HOSPITAL & MOBILE REPAIRING CENTER */}
                    {structure.showWatermark !== false && (
                      <MHRepairWatermark
                        size={structure.paperSize === '58mm' ? 'sm' : structure.paperSize === '80mm' ? 'md' : 'lg'}
                        label="MOBILE REPAIRING CENTER"
                        sublabel="MOBILE HOSPITAL"
                        bottomText="★ MOBILE REPAIRING CENTER ★"
                        className={structure.thermalMonoMode ? 'opacity-[0.04]' : 'opacity-[0.065]'}
                      />
                    )}

                    {/* Header */}
                    <div className={`relative z-10 pb-3 border-b border-dashed border-zinc-300 flex flex-col ${structure.headerAlign === 'left' ? 'text-left items-start' : 'text-center items-center'}`}>
                      {structure.showLogo && (
                        <MHLogo
                          customUrl={formData.logoUrl}
                          size="md"
                          rounded="lg"
                          theme="receipt"
                          className="mb-1.5"
                        />
                      )}
                      <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 leading-tight">
                        {formData.shopName || 'MOBILE HOSPITAL'}
                      </h2>
                      {structure.showShopDetails && (
                        <>
                          <p className="text-[11px] text-zinc-500 mt-0.5 max-w-[260px] leading-tight">
                            {formData.address || 'Shop #14, Ground Floor, City Tech Center'}
                          </p>
                          <p className="text-[11px] text-zinc-500 font-medium">
                            Ph: {formData.phone || '+91 98765 43210'}
                          </p>
                        </>
                      )}
                      {structure.showTaxGst && formData.gst && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {formData.taxLabel || 'GSTIN'}: {formData.gst}
                        </p>
                      )}
                      <div className="mt-2 inline-block px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-800 uppercase">
                        Sample Preview Slip
                      </div>
                    </div>

                    {/* Metadata & Customer */}
                    <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Ticket #:</span>
                        <span className="font-bold text-zinc-900">T-1001</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Date:</span>
                        <span className="text-zinc-700">2026-09-15</span>
                      </div>
                      {structure.showCustomerDetails && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Customer:</span>
                            <span className="font-bold text-zinc-800">John Doe</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Phone:</span>
                            <span className="text-zinc-700">+91 98765 43210</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Item & Issue */}
                    <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                      {structure.showItemDetails && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Device:</span>
                          <span className="font-bold text-zinc-900 text-right">iPhone 13 Pro</span>
                        </div>
                      )}
                      {structure.showImei && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">IMEI:</span>
                          <span className="text-zinc-700 font-mono">356892091234567</span>
                        </div>
                      )}
                      {structure.showWarranty && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Warranty:</span>
                          <span className="font-bold text-emerald-800">30 Days Warranty</span>
                        </div>
                      )}
                      {structure.showProblemDetails && (
                        <div className="mt-1 pt-1 border-t border-dotted border-zinc-200">
                          <span className="text-zinc-400 uppercase text-[10px] font-semibold">Reported Issue:</span>
                          <p className="text-zinc-800 italic mt-0.5 bg-zinc-50 p-1.5 rounded text-[11px] leading-relaxed border border-zinc-100">
                            Cracked Front Glass & Touch Sensor
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Financials */}
                    <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1.5 text-[11px]">
                      {structure.showTaxBreakdown && (
                        <>
                          <div className="flex justify-between text-zinc-600">
                            <span>Subtotal (Excl. Tax):</span>
                            <span>{formData.currency || '₹'}4,236.44</span>
                          </div>
                          <div className="flex justify-between text-zinc-600">
                            <span>GST (18%):</span>
                            <span>{formData.currency || '₹'}762.56</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-xs font-bold text-zinc-900 pt-0.5">
                        <span>Total Cost:</span>
                        <span>{formData.currency || '₹'}4,999.00</span>
                      </div>
                      <div className="flex justify-between text-zinc-600">
                        <span>Deposit Paid:</span>
                        <span className="text-emerald-700 font-medium">{formData.currency || '₹'}1,500.00</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-dotted border-zinc-300">
                        <span className="uppercase tracking-wider">Balance Due:</span>
                        <span className="text-xs px-2 py-0.5 rounded font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {formData.currency || '₹'}3,499.00
                        </span>
                      </div>
                    </div>

                    {/* Terms */}
                    {structure.showTerms && (
                      <div className="pt-2 text-[9px] text-center space-y-1 text-zinc-500 whitespace-pre-line font-sans">
                        {formData.terms || 'Genuine replaced parts only. Handover slip mandatory.'}
                      </div>
                    )}

                    {/* Signatures */}
                    {structure.showSignatures && (
                      <div className="pt-4 border-t border-zinc-200 flex justify-between items-end text-[9px] text-zinc-400 font-sans mt-2">
                        <div className="text-center">
                          <div className="w-16 border-b border-zinc-300 mb-1" />
                          <span>Authorized Sign</span>
                        </div>
                        <div className="text-center">
                          <div className="w-16 border-b border-zinc-300 mb-1" />
                          <span>Customer Sign</span>
                        </div>
                      </div>
                    )}

                    {/* Tear line */}
                    {structure.tearLine && (
                      <div className="mt-3 pt-2 border-t-2 border-dashed border-zinc-300 flex items-center justify-center gap-1 text-[9px] text-zinc-400">
                        <Scissors className="w-3 h-3 text-zinc-400" />
                        <span>TEAR HERE</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

          {/* SUBTAB: Billing Type System & Counter Modes Master Control */}
          {subtab === 'features' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold tracking-tight uppercase text-zinc-100 flex items-center gap-2">
                      <ReceiptText className="w-4 h-4 text-emerald-400" />
                      <span>Billing Type System & Counter Modes</span>
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                    Configure workshop billing types, customize receipt and invoice numbering prefixes, set default startup counter mode, tax rules, and inventory auto-deduction.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{(billingConfig.activeBillingTypes || ['repair', 'order', 'sale']).length} Billing Types Active</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanDefaults: BillingSystemConfig = {
                        ...DEFAULT_BILLING_SYSTEM_CONFIG,
                      };
                      setBillingConfig(cleanDefaults);
                      const updatedProfile = {
                        ...formData,
                        billingSystemConfig: cleanDefaults,
                        systemFeatures: {
                          ...systemFeatures,
                          defaultCustomerEntryMode: cleanDefaults.defaultBillingType,
                          autoDeductInventoryOnSale: cleanDefaults.autoDeductInventoryOnSale,
                          autoDeductInventoryOnRepair: cleanDefaults.autoDeductInventoryOnRepair,
                          lowStockAlerts: cleanDefaults.lowStockAlerts,
                          lowStockThreshold: cleanDefaults.lowStockThreshold,
                        },
                      };
                      setFormData(updatedProfile);
                      onSaveProfile(updatedProfile);
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer border border-white/15 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                    <span>Reset Billing Defaults</span>
                  </button>
                </div>
              </div>

              {/* Startup Counter Mode Selection */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-zinc-700" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Default Billing Mode on App Startup
                    </h4>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    Auto-selected when opening Customer Entry
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Service Repair */}
                  <button
                    type="button"
                    onClick={() => handleUpdateBillingConfig('defaultBillingType', 'repair')}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-3 ${
                      (billingConfig.defaultBillingType || 'repair') === 'repair'
                        ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white hover:bg-zinc-100/80 border-zinc-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      (billingConfig.defaultBillingType || 'repair') === 'repair'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 truncate">Service Repair</span>
                        {(billingConfig.defaultBillingType || 'repair') === 'repair' && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Startup
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        Prefix: <code className="font-mono text-zinc-800">{billingConfig.repairPrefix}#</code>
                      </p>
                    </div>
                  </button>

                  {/* Customer Pre-Order */}
                  <button
                    type="button"
                    onClick={() => handleUpdateBillingConfig('defaultBillingType', 'order')}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-3 ${
                      billingConfig.defaultBillingType === 'order'
                        ? 'bg-white border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white hover:bg-zinc-100/80 border-zinc-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      billingConfig.defaultBillingType === 'order'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 truncate">Pre-Order / Booking</span>
                        {billingConfig.defaultBillingType === 'order' && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            Startup
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        Prefix: <code className="font-mono text-zinc-800">{billingConfig.orderPrefix}#</code>
                      </p>
                    </div>
                  </button>

                  {/* Product Sale */}
                  <button
                    type="button"
                    onClick={() => handleUpdateBillingConfig('defaultBillingType', 'sale')}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-3 ${
                      billingConfig.defaultBillingType === 'sale'
                        ? 'bg-white border-violet-500 shadow-xs ring-2 ring-violet-500/20'
                        : 'bg-white hover:bg-zinc-100/80 border-zinc-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      billingConfig.defaultBillingType === 'sale'
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 truncate">Retail Product Sale</span>
                        {billingConfig.defaultBillingType === 'sale' && (
                          <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.2 rounded border border-violet-200">
                            Startup
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        Prefix: <code className="font-mono text-zinc-800">{billingConfig.salePrefix}#</code>
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 4 Specialized Billing Types Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Billing Type 1: Service Repair Bill */}
                <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-3.5 transition-all hover:border-zinc-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>1. Service Repair Bill</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            JOB SHEET
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          Hardware & software diagnostics, IMEI, lock pattern, physical check & deposit
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Toggle active on counter">
                      <input
                        type="checkbox"
                        checked={(billingConfig.activeBillingTypes || ['repair', 'order', 'sale']).includes('repair')}
                        onChange={() => handleToggleBillingTypeActive('repair')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Prefix Customizer & Tax Mode */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Receipt Prefix
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={billingConfig.repairPrefix}
                          onChange={(e) => handleUpdateBillingConfig('repairPrefix', e.target.value)}
                          placeholder="REP-"
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block font-mono">
                        Preview: {billingConfig.repairPrefix || 'REP-'}4821
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Tax Applicability
                      </label>
                      <select
                        value={billingConfig.repairTaxMode || 'inclusive'}
                        onChange={(e) => handleUpdateBillingConfig('repairTaxMode', e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="inclusive">GST Inclusive (MRP)</option>
                        <option value="exclusive">GST Exclusive (+Rate)</option>
                        <option value="exempt">Non-GST / Cash Memo</option>
                      </select>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">
                        Rate: {formData.taxRate || 18}% {formData.taxLabel || 'GST'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Checklist & Pattern Lock</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSubtab('structure');
                        setStructureSection('order_entry');
                      }}
                      className="text-emerald-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Adjust Intake Fields</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Billing Type 2: Customer Pre-Order & Booking Bill */}
                <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-3.5 transition-all hover:border-zinc-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>2. Customer Pre-Order Bill</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold">
                            PRE-BOOKING
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          Parts procurement, screen advance booking, arrival dates & token deposit
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Toggle active on counter">
                      <input
                        type="checkbox"
                        checked={(billingConfig.activeBillingTypes || ['repair', 'order', 'sale']).includes('order')}
                        onChange={() => handleToggleBillingTypeActive('order')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Prefix Customizer & Tax Mode */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Booking Prefix
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={billingConfig.orderPrefix}
                          onChange={(e) => handleUpdateBillingConfig('orderPrefix', e.target.value)}
                          placeholder="ORD-"
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block font-mono">
                        Preview: {billingConfig.orderPrefix || 'ORD-'}1942
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Tax Applicability
                      </label>
                      <select
                        value={billingConfig.orderTaxMode || 'inclusive'}
                        onChange={(e) => handleUpdateBillingConfig('orderTaxMode', e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="inclusive">GST Inclusive (MRP)</option>
                        <option value="exclusive">GST Exclusive (+Rate)</option>
                        <option value="exempt">Non-GST / Cash Memo</option>
                      </select>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">
                        Advance token receipt
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 text-blue-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-blue-500" />
                      <span>Urgency & Delivery Dates</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSubtab('structure');
                        setStructureSection('customer_orders');
                      }}
                      className="text-blue-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Adjust Booking Fields</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Billing Type 3: Retail Product Sales Bill */}
                <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-3.5 transition-all hover:border-zinc-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>3. Retail Product Sales Bill</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-100 text-violet-800 font-semibold">
                            INVOICE
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          Rapid 1-click counter retail billing, tempered glass, cables, adapters & warranties
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Toggle active on counter">
                      <input
                        type="checkbox"
                        checked={(billingConfig.activeBillingTypes || ['repair', 'order', 'sale']).includes('sale')}
                        onChange={() => handleToggleBillingTypeActive('sale')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  {/* Prefix Customizer & Tax Mode */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Invoice Prefix
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={billingConfig.salePrefix}
                          onChange={(e) => handleUpdateBillingConfig('salePrefix', e.target.value)}
                          placeholder="SL-"
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block font-mono">
                        Preview: {billingConfig.salePrefix || 'SL-'}7840
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Tax Applicability
                      </label>
                      <select
                        value={billingConfig.saleTaxMode || 'inclusive'}
                        onChange={(e) => handleUpdateBillingConfig('saleTaxMode', e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                      >
                        <option value="inclusive">GST Inclusive (MRP)</option>
                        <option value="exclusive">GST Exclusive (+Rate)</option>
                        <option value="exempt">Non-GST / Cash Memo</option>
                      </select>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">
                        Instant receipt / tax bill
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 text-violet-700 font-medium">
                      <Zap className="w-3.5 h-3.5 text-violet-500" />
                      <span>1-Click Cash / UPI Checkout</span>
                    </span>
                    <span className="text-violet-700 font-semibold font-mono">Stock Auto-Deduct Ready</span>
                  </div>
                </div>

                {/* Billing Type 4: Service Estimate / Quotation */}
                <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-3.5 transition-all hover:border-zinc-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>4. Repair Estimate / Quotation</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                            QUOTATION
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          Pre-repair price quotes, component breakdown & customer estimates
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Enable Quotations">
                      <input
                        type="checkbox"
                        checked={billingConfig.allowEstimateBilling !== false}
                        onChange={() => handleUpdateBillingConfig('allowEstimateBilling', billingConfig.allowEstimateBilling === false ? true : false)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Prefix Customizer & Validity */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Estimate Prefix
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={billingConfig.estimatePrefix || 'EST-'}
                          onChange={(e) => handleUpdateBillingConfig('estimatePrefix', e.target.value)}
                          placeholder="EST-"
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block font-mono">
                        Preview: {billingConfig.estimatePrefix || 'EST-'}3051
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Default Validity
                      </label>
                      <select
                        defaultValue="7"
                        className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="7">7 Calendar Days</option>
                        <option value="15">15 Calendar Days</option>
                        <option value="30">30 Calendar Days</option>
                      </select>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">
                        Non-fiscal quotation
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 text-amber-700 font-medium">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>Printable on Thermal or A4</span>
                    </span>
                    <span className="text-amber-700 font-semibold">Pre-Dropoff Quote</span>
                  </div>
                </div>

              </div>

              {/* Live Receipt & Invoice Number Simulator */}
              <div className="p-4.5 rounded-xl border border-zinc-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-zinc-800" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Live Receipt Numbering Simulator
                    </h4>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Real-time generation preview
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-emerald-800">Repair Ticket</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {billingConfig.repairPrefix || 'REP-'}4821
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-950 font-medium truncate">
                      iPhone 14 Pro Max • Screen
                    </p>
                    <p className="text-[10px] text-emerald-700">Advance: {formData.currency || '₹'}1,500 (Due: {formData.currency || '₹'}2,500)</p>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-blue-800">Pre-Order Slip</span>
                      <span className="font-mono font-bold text-blue-700 text-xs">
                        {billingConfig.orderPrefix || 'ORD-'}1942
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-950 font-medium truncate">
                      AMOLED Folder Assembly Original
                    </p>
                    <p className="text-[10px] text-blue-700">Token: {formData.currency || '₹'}500 • Arrival Tomorrow</p>
                  </div>

                  <div className="p-3 rounded-lg bg-violet-50/60 border border-violet-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-violet-800">Sales Invoice</span>
                      <span className="font-mono font-bold text-violet-700 text-xs">
                        {billingConfig.salePrefix || 'SL-'}7840
                      </span>
                    </div>
                    <p className="text-[11px] text-violet-950 font-medium truncate">
                      25W GaN Fast Charger + Cable
                    </p>
                    <p className="text-[10px] text-violet-700">Paid: {formData.currency || '₹'}899 (UPI) • Full Settled</p>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-amber-800">Quotation Quote</span>
                      <span className="font-mono font-bold text-amber-700 text-xs">
                        {billingConfig.estimatePrefix || 'EST-'}3051
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-950 font-medium truncate">
                      Motherboard IC Diagnostics
                    </p>
                    <p className="text-[10px] text-amber-700">Quote: {formData.currency || '₹'}2,400 • Valid 7 Days</p>
                  </div>
                </div>
              </div>

              {/* Inventory & Stock Automation Controls */}
              <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2.5">
                  <Boxes className="w-4 h-4 text-zinc-800" />
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Inventory & Billing Automation Rules
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Auto-Deduct on Sale */}
                  <div className="p-3.5 bg-white rounded-lg border border-zinc-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 block">
                        Auto-Deduct Stock on Counter Sale
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Automatically decrement inventory count when accessories or tempered glass are billed
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={billingConfig.autoDeductInventoryOnSale !== false}
                        onChange={() => handleUpdateBillingConfig('autoDeductInventoryOnSale', !billingConfig.autoDeductInventoryOnSale)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Auto-Deduct on Repair Ticket Closure */}
                  <div className="p-3.5 bg-white rounded-lg border border-zinc-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 block">
                        Auto-Deduct Stock on Repair Delivery
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Automatically deduct linked spare parts when job status is marked Completed or Delivered
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={!!billingConfig.autoDeductInventoryOnRepair}
                        onChange={() => handleUpdateBillingConfig('autoDeductInventoryOnRepair', !billingConfig.autoDeductInventoryOnRepair)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Low Stock Alert Threshold */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                      Low Stock Alert Threshold (Units)
                    </label>
                    <div className="flex items-center gap-2">
                      {[2, 3, 5, 8, 10].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => handleUpdateBillingConfig('lowStockThreshold', count)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
                            (billingConfig.lowStockThreshold || 5) === count
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                              : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          ≤ {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Low Stock Banner Alert */}
                  <div className="p-3 bg-white rounded-lg border border-zinc-200 flex items-center justify-between gap-3 self-end">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 block">
                        Low Stock Visual Notifications
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Highlight depleted spare parts and low inventory items across the app
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={billingConfig.lowStockAlerts !== false}
                        onChange={() => handleUpdateBillingConfig('lowStockAlerts', !billingConfig.lowStockAlerts)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* System Diagnostics & Operational Health */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Counter Terminal Diagnostics & Operational Health
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    All Billing Systems Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Active Orders</span>
                    <span className="text-base font-bold font-mono text-zinc-900">{orders.length}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Inventory SKUs</span>
                    <span className="text-base font-bold font-mono text-zinc-900">{inventory.length}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Cash Ledger</span>
                    <span className="text-base font-bold font-mono text-zinc-900">{transactions.length}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Cloud Sync</span>
                    <span className="text-xs font-bold text-emerald-600 block mt-1">Firebase Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: Theme & System */}
          {subtab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Application Theme, Preferences & Storage Maintenance
              </h3>

              {/* Theme & Color Scheme Section */}
              <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-zinc-700" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Theme & Display Appearance
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                    Live Real-Time
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Customize your workshop display with your unique brand accent color, light/dark mode, ambient lighting glow, and navigation menu bar styling.
                </p>
                <div className="pt-2">
                  <ThemeSelector
                    theme={formData.theme || 'light'}
                    accent={formData.themeAccent || 'slate'}
                    customAccentColor={formData.customAccentColor || '#2563eb'}
                    accentGlow={formData.accentGlow !== false}
                    backgroundStyle={formData.backgroundStyle || 'workbench'}
                    menuBarColor={formData.menuBarColor || 'default'}
                    menuBarCustomColor={formData.menuBarCustomColor || '#0d0f17'}
                    menuBarStyle={formData.menuBarStyle || 'solid'}
                    menuBarHeaderSync={formData.menuBarHeaderSync !== false}
                    layoutWidth={formData.screenConfig?.maxWidth || 'standard'}
                    smoothness={formData.visualSmoothness || formData.screenConfig?.smoothness || 'ultra'}
                    sharpness={formData.visualSharpness || formData.screenConfig?.sharpness || 'ultra'}
                    thermalSharpness={formData.thermalSharpness || formData.pageStructure?.thermalSharpness || 'ultra'}
                    onChangeTheme={(newTheme) => {
                      const updated = { ...formData, theme: newTheme };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeAccent={(newAccent) => {
                      const updated = { ...formData, themeAccent: newAccent };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeCustomAccent={(hex) => {
                      const updated = { ...formData, customAccentColor: hex, themeAccent: 'custom' as const };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onToggleAccentGlow={(glow) => {
                      const updated = { ...formData, accentGlow: glow };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeBackgroundStyle={(style) => {
                      const updated = { ...formData, backgroundStyle: style };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeMenuBarColor={(color) => {
                      const updated = { ...formData, menuBarColor: color };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeMenuBarCustomColor={(hex) => {
                      const updated = { ...formData, menuBarCustomColor: hex, menuBarColor: 'custom' as const };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeMenuBarStyle={(style) => {
                      const updated = { ...formData, menuBarStyle: style };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeMenuBarHeaderSync={(sync) => {
                      const updated = { ...formData, menuBarHeaderSync: sync };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeLayoutWidth={(w) => {
                      const currentScreen = formData.screenConfig || {
                        scale: 100,
                        maxWidth: 'standard',
                        density: 'comfortable',
                        fontScale: 'normal',
                        sidebarMode: 'standard',
                      };
                      const updated = {
                        ...formData,
                        screenConfig: { ...currentScreen, maxWidth: w },
                      };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeSmoothness={(s) => {
                      const currentScreen = formData.screenConfig || {
                        scale: 100,
                        maxWidth: 'standard',
                        density: 'comfortable',
                        fontScale: 'normal',
                        sidebarMode: 'standard',
                      };
                      const updated = {
                        ...formData,
                        visualSmoothness: s,
                        screenConfig: { ...currentScreen, smoothness: s },
                      };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeSharpness={(sh) => {
                      const currentScreen = formData.screenConfig || {
                        scale: 100,
                        maxWidth: 'standard',
                        density: 'comfortable',
                        fontScale: 'normal',
                        sidebarMode: 'standard',
                      };
                      const updated = {
                        ...formData,
                        visualSharpness: sh,
                        screenConfig: { ...currentScreen, sharpness: sh },
                      };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeThermalSharpness={(th) => {
                      const currentStructure = formData.pageStructure || structure;
                      const currentScreen = formData.screenConfig || {
                        scale: 100,
                        maxWidth: 'standard',
                        density: 'comfortable',
                        fontScale: 'normal',
                        sidebarMode: 'standard',
                      };
                      const updated = {
                        ...formData,
                        thermalSharpness: th,
                        pageStructure: { ...currentStructure, thermalSharpness: th },
                        screenConfig: { ...currentScreen, thermalSharpness: th },
                      };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Default Initial Status
                  </label>
                  <select
                    value={formData.defaultStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultStatus: e.target.value as ShopProfile['defaultStatus'],
                      })
                    }
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm focus:border-zinc-900 focus:outline-none transition-colors bg-white cursor-pointer text-zinc-800"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Interface Density
                  </label>
                  <select
                    value={formData.density}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        density: e.target.value as ShopProfile['density'],
                      })
                    }
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm focus:border-zinc-900 focus:outline-none transition-colors bg-white cursor-pointer text-zinc-800"
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
              </div>

              {/* Dashboard & Counter Privacy */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-zinc-700" />
                      <span>Hide Total Billed (Counter Privacy Mode)</span>
                    </h4>
                    {formData.hideTotalBilled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    Masks the Total Billed and revenue figures with <span className="font-mono font-semibold text-zinc-700">••••••••</span> on the Dashboard to maintain privacy while customers or visitors stand near the counter. You can also toggle this instantly anytime using the eye icon on the Dashboard or top header bar.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!formData.hideTotalBilled}
                    onChange={(e) =>
                      setFormData({ ...formData, hideTotalBilled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              {/* Data Cleaning */}
              <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-rose-900 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Data Reset & Factory Reset</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSubtab('reset')}
                    className="text-xs text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Reset Center</span>
                    <span>→</span>
                  </button>
                </div>
                <p className="text-xs text-rose-700/80 leading-relaxed">
                  Safely reset repair orders or perform a full factory reset.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveResetModal('data')}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs active:scale-98 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Data Reset (Orders)...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResetModal('factory')}
                    className="bg-rose-800 hover:bg-rose-900 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs active:scale-98 flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Full Factory Reset...</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: PIN & Terminal Security */}
          {subtab === 'security' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Counter Terminal PIN Security
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Fast numeric PIN protection for customer billing records, cash ledger, and repair jobs.
                  </p>
                </div>
                {onLockTerminal && (
                  <button
                    type="button"
                    onClick={onLockTerminal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer active:scale-98 self-start sm:self-auto"
                  >
                    <Lock className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Lock Terminal Now</span>
                  </button>
                )}
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      formData.pinAuthEnabled !== false
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {formData.pinAuthEnabled !== false ? (
                      <Shield className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Unlock className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-zinc-900">
                        {formData.pinAuthEnabled !== false
                          ? 'PIN Lock Active'
                          : 'PIN Lock Disabled'}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          formData.pinAuthEnabled !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {formData.pinAuthEnabled !== false ? 'PROTECTED' : 'OPEN ACCESS'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Current Security PIN:{' '}
                      <span className="font-mono font-bold text-zinc-800">
                        {showPinInput ? formData.securityPin || '1234' : '••••'}
                      </span>{' '}
                      <button
                        type="button"
                        onClick={() => setShowPinInput((p) => !p)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-800 font-medium underline ml-1 cursor-pointer"
                      >
                        {showPinInput ? 'Hide' : 'Reveal'}
                      </button>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {onOpenPinSetup && (
                    <button
                      type="button"
                      onClick={onOpenPinSetup}
                      className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Configure in Keypad</span>
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.pinAuthEnabled !== false}
                      onChange={(e) =>
                        setFormData({ ...formData, pinAuthEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Quick Change PIN Form Card */}
              <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-zinc-700" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Setup / Change Security PIN
                    </h4>
                  </div>
                  <span className="text-[11px] text-zinc-400">4 to 6 numeric digits</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      New Security PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 5824"
                      className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm font-mono tracking-widest text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Repeat new PIN"
                      className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm font-mono tracking-widest text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    PIN Reminder / Hint
                  </label>
                  <input
                    type="text"
                    value={formData.pinHint || ''}
                    onChange={(e) => setFormData({ ...formData, pinHint: e.target.value })}
                    placeholder="e.g. Counter bench safe key or birth year"
                    className="w-full border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Shown when tapping &quot;Forgot PIN?&quot; on the lock screen.
                  </span>
                </div>

                {pinChangeError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{pinChangeError}</span>
                  </div>
                )}

                {pinChangeSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="font-semibold">{pinChangeSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        securityPin: '1234',
                        pinHint: 'Security PIN Active',
                      });
                      setNewPinInput('');
                      setConfirmPinInput('');
                      setPinChangeSuccess('PIN reset to default "1234"');
                      setTimeout(() => setPinChangeSuccess(''), 2500);
                    }}
                    className="text-xs text-zinc-500 hover:text-rose-600 font-medium hover:underline cursor-pointer"
                  >
                    Reset PIN to Default (1234)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPinChangeError('');
                      setPinChangeSuccess('');
                      if (!newPinInput) {
                        setPinChangeError('Please enter a new 4-6 digit numeric PIN.');
                        return;
                      }
                      if (!/^[0-9]{4,6}$/.test(newPinInput)) {
                        setPinChangeError('PIN must be 4 to 6 numeric digits.');
                        return;
                      }
                      if (newPinInput !== confirmPinInput) {
                        setPinChangeError('New PIN and Confirm PIN do not match.');
                        return;
                      }
                      const updated = {
                        ...formData,
                        securityPin: newPinInput,
                        pinHint: formData.pinHint && !formData.pinHint.includes(newPinInput) ? formData.pinHint : 'Security PIN Active',
                      };
                      setFormData(updated);
                      onSaveProfile(updated);
                      setNewPinInput('');
                      setConfirmPinInput('');
                      setPinChangeSuccess('New Security PIN saved successfully!');
                      setTimeout(() => setPinChangeSuccess(''), 2500);
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Apply New PIN
                  </button>
                </div>
              </div>

              {/* Security Guidance Card */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-zinc-700" />
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Counter Access & Security Architecture
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-600">
                  <div className="p-3 rounded-lg bg-white border border-zinc-200/80">
                    <span className="font-bold text-zinc-900 block mb-1">
                      Fast 4-Digit Counter Lock
                    </span>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Staff authentication has been simplified into instant PIN authorization. Whenever you step away from the counter, click the &quot;Lock&quot; button in the top bar to lock down tickets, payments, and inventory.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-zinc-200/80">
                    <span className="font-bold text-zinc-900 block mb-1">
                      Master Recovery & Safeguards
                    </span>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      If you ever forget your custom PIN, the default factory PIN is <span className="font-mono font-bold text-zinc-800">1234</span>. You can also use the Master Recovery code <span className="font-mono font-bold text-zinc-800">0000</span> or the last 4 digits of the shop phone number to reset access at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 5: Google Drive Cloud Backup */}
          {subtab === 'drive' && (
            <div className="pt-1">
              <React.Suspense
                fallback={
                  <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">
                    <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-2" />
                    Loading Google Drive backup module...
                  </div>
                }
              >
                <GoogleDriveBackupView
                  orders={orders}
                  inventory={inventory}
                  transactions={transactions}
                  profile={profile}
                  users={[]}
                  onRestoreAllData={onRestoreAllData || (() => {})}
                />
              </React.Suspense>
            </div>
          )}

          {/* SUBTAB 6: Workshop Data & Factory Reset Center */}
          {subtab === 'reset' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="resetCenterSection">
              {/* Header Overview Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white border border-zinc-700 shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                      <RotateCcw className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold tracking-tight">
                          Workshop Reset & Factory Center
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Data Safeguards Active
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5 max-w-xl leading-relaxed">
                        Control individual data purges for customer repair jobs, inventory catalog items, or perform a complete factory restoration with safety backup options.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={onExportBackup || handleExportJSON}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Download an offline JSON copy of all data before resetting"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Download Safety Backup</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset Success Feedback Banner */}
              {resetSuccessMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{resetSuccessMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResetSuccessMessage(null)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 3 Core Reset Options */}
              {userRole === 'staff' ? (
                <div className="p-8 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                    <Lock className="w-6 h-6 text-amber-700" />
                  </div>
                  <h4 className="text-sm font-bold text-amber-950">Workshop Reset & Factory Center Restricted</h4>
                  <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                    Staff accounts cannot perform factory resets, delete orders, wipe inventory, or clear ledger transactions. Please switch to the Store Owner account to manage database purges and reset operations.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. DATA RESET (Repair Orders & Ledger) */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900">Data Reset (Orders & Jobs)</h4>
                          <span className="text-[11px] text-zinc-500">Repair tickets, customer dues, and billing history</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {orders.length} Active Tickets
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed pt-1">
                      Wipe or reset your repair jobs, customer repair history, and customer dues. This allows you to start customer intake fresh without wiping your inventory stock or shop branding.
                    </p>

                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-500 space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-700 font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Preserves: Spare parts inventory & custom shop branding</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setActiveResetModal('data')}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Configure Data Reset...</span>
                    </button>
                    {onClearTransactions && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete all ${transactions.length} income and expense transactions from the ledger?`)) {
                            onClearTransactions();
                            setResetSuccessMessage('Accounts cashbook ledger cleared.');
                          }
                        }}
                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium border border-zinc-200 transition-colors cursor-pointer active:scale-98"
                      >
                        <span>Clear Ledger Only</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. INVENTORY RESET (Parts & Accessories) */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                          <Boxes className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900">Inventory Reset (Stock & Spares)</h4>
                          <span className="text-[11px] text-zinc-500">Screens, batteries, tempered glass, cases, tools</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {inventory.length} Parts in Stock
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed pt-1">
                      Reset your spare parts catalog. Choose between wiping all items down to zero stock for fresh custom entry, or reloading the comprehensive 70+ smartphone parts master catalog.
                    </p>

                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-500 space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-700 font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Preserves: Repair tickets, customer dues & shop profile</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setActiveResetModal('inventory')}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Configure Inventory Reset...</span>
                    </button>
                    {onResetInventoryToDefault && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Reload complete 70+ smartphone parts catalog?')) {
                            onResetInventoryToDefault();
                            setResetSuccessMessage('Master parts catalog reloaded successfully.');
                          }
                        }}
                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium border border-zinc-200 transition-colors cursor-pointer active:scale-98"
                      >
                        <span>Reload 70+ Master Catalog</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. FULL FACTORY RESET (Master System Wipe) */}
              <div className="p-6 rounded-2xl bg-rose-50/70 border-2 border-rose-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-rose-950">
                          Full Factory Reset (Master System Restore)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                          Master Purge
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 mt-1 max-w-2xl leading-relaxed">
                        Restores the entire Mobile Hospital terminal back to its out-of-the-box factory default state. This clears all local browser storage, deletes all custom repair jobs, wipes or restores the catalog, clears the cashbook, resets shop settings, and resets the Security PIN to <strong className="font-mono">1234</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-rose-900">
                  <div className="p-3 rounded-xl bg-white/80 border border-rose-200/80">
                    <span className="font-bold block text-rose-950 mb-0.5">Tickets & Accounts</span>
                    <span className="text-[11px] text-rose-800">All repair orders, status updates, dues, and transaction records will be wiped.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 border border-rose-200/80">
                    <span className="font-bold block text-rose-950 mb-0.5">Inventory Catalog</span>
                    <span className="text-[11px] text-rose-800">Restores standard master catalog or empties stock quantities as chosen.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 border border-rose-200/80">
                    <span className="font-bold block text-rose-950 mb-0.5">Security PIN & Settings</span>
                    <span className="text-[11px] text-rose-800">Shop name, address, tax rate, and terminal PIN resets to factory default 1234.</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rose-200">
                  <button
                    type="button"
                    onClick={onExportBackup || handleExportJSON}
                    className="px-3.5 py-2 bg-white hover:bg-rose-100/50 text-rose-900 border border-rose-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-700" />
                    <span>Download Backup Before Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveResetModal('factory')}
                    className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Execute Full Factory Reset...</span>
                  </button>
                </div>
              </div>
            </>
            )}
          </div>
          )}

          {/* SUBTAB: Firebase Cloud Database */}
          {subtab === 'firebase' && (
            <React.Suspense
              fallback={
                <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">
                  <div className="w-6 h-6 border-2 border-zinc-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
                  Connecting to Firebase Cloud sync module...
                </div>
              }
            >
              <FirebaseSyncView
                orders={orders}
                inventory={inventory}
                transactions={transactions}
                profile={profile}
                onRestoreAllData={onRestoreAllData}
              />
            </React.Suspense>
          )}

          {/* Form Actions - Hidden when on drive, reset, or firebase subtab */}
          {subtab !== 'drive' && subtab !== 'reset' && subtab !== 'firebase' && (
            <div className="flex items-center justify-between border-t border-zinc-100 pt-5">
              <div>
                {saveSuccess && (
                  <span className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Settings saved successfully!</span>
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </button>
            </div>
          )}
        </form>

        {/* Global Reset Confirmation Modal - Loaded on demand */}
        {activeResetModal !== null && (
          <React.Suspense fallback={null}>
            <ResetConfirmModal
              isOpen={activeResetModal !== null}
              type={activeResetModal || 'data'}
              onClose={() => setActiveResetModal(null)}
              onConfirm={(mode) => {
                if (!activeResetModal) return;
                if (activeResetModal === 'data') {
                  if (mode === 'wipe') {
                    onClearOrders();
                    setResetSuccessMessage('All repair orders have been cleared.');
                  } else {
                    if (onResetOrdersToDefault) onResetOrdersToDefault();
                    setResetSuccessMessage('Repair orders restored to default sample jobs.');
                  }
                } else if (activeResetModal === 'inventory') {
                  if (mode === 'wipe') {
                    onClearInventory();
                    setResetSuccessMessage('Inventory catalog cleared to 0 items.');
                  } else {
                    if (onResetInventoryToDefault) onResetInventoryToDefault();
                    setResetSuccessMessage('Complete 70+ parts master catalog loaded.');
                  }
                } else if (activeResetModal === 'factory') {
                  if (onFullFactoryReset) {
                    onFullFactoryReset(mode || 'default');
                  } else {
                    onResetAllData();
                  }
                  setResetSuccessMessage('Full Factory Reset completed successfully.');
                }
                setTimeout(() => setResetSuccessMessage(null), 4000);
              }}
              stats={{
                ordersCount: orders.length,
                inventoryCount: inventory.length,
                transactionsCount: transactions.length,
              }}
              onExportBackup={onExportBackup || handleExportJSON}
            />
          </React.Suspense>
        )}
      </div>
    </div>
  );
};
