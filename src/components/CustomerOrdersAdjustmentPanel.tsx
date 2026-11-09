import React from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Check,
  Save,
  Columns,
  Square,
  Zap,
  Layers,
  FileCheck,
  Eye,
  ShoppingBag,
  Calendar,
  Clock,
  User,
  Phone,
  Tag,
  CreditCard,
  ShieldCheck,
  Plus,
  Search,
  Sparkles,
  FileText,
  Package,
  Smartphone,
} from 'lucide-react';
import { CustomerOrdersPageConfig, DEFAULT_CUSTOMER_ORDERS_CONFIG } from '../types';

interface CustomerOrdersAdjustmentPanelProps {
  config: CustomerOrdersPageConfig;
  onChange: (config: CustomerOrdersPageConfig) => void;
  onSaveAsDefault?: () => void;
  onResetDefaults?: () => void;
  isSaved?: boolean;
  onClose?: () => void;
}

export const CustomerOrdersAdjustmentPanel: React.FC<CustomerOrdersAdjustmentPanelProps> = ({
  config,
  onChange,
  onSaveAsDefault,
  onResetDefaults,
  isSaved = false,
  onClose,
}) => {
  const applyPreset = (preset: 'standard' | 'express' | 'detailed') => {
    if (preset === 'express') {
      onChange({
        ...config,
        formLayout: 'express',
        columns: '1-col',
        density: 'compact',
        showBrandSelector: true,
        showModelSelector: true,
        showQuickItems: true,
        showInventorySearch: true,
        showDateSchedule: false,
        showExpectedDate: false,
        showUrgencySelector: false,
        showAlternatePhone: false,
        showCategorySelector: true,
        showQuantityStepper: true,
        showWarrantySelector: true,
        showSerialBarcode: false,
        showPaymentMethod: true,
        showDepositShortcuts: true,
        showFulfillmentStatus: true,
        showOrderNotes: false,
        defaultStatus: 'Delivered',
        defaultUrgency: 'Immediate Handover',
      });
    } else if (preset === 'detailed') {
      onChange({
        ...config,
        formLayout: 'detailed',
        columns: '2-col',
        density: 'comfortable',
        showBrandSelector: true,
        showModelSelector: true,
        showQuickItems: true,
        showInventorySearch: true,
        showDateSchedule: true,
        showExpectedDate: true,
        showUrgencySelector: true,
        showAlternatePhone: true,
        showCategorySelector: true,
        showQuantityStepper: true,
        showWarrantySelector: true,
        showSerialBarcode: true,
        showPaymentMethod: true,
        showDepositShortcuts: true,
        showFulfillmentStatus: true,
        showOrderNotes: true,
        defaultStatus: 'Delivered',
        defaultUrgency: 'Immediate Handover',
      });
    } else {
      // Standard
      onChange({
        ...DEFAULT_CUSTOMER_ORDERS_CONFIG,
      });
    }
  };

  const toggleField = (key: keyof CustomerOrdersPageConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Panel Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>Customer Orders Page Adjustment</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                {config.formLayout}
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              Customize counter order layout, quick items, columns, density, and sales workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onResetDefaults && (
            <button
              type="button"
              onClick={onResetDefaults}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset customer orders page layout to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {onSaveAsDefault && (
            <button
              type="button"
              onClick={onSaveAsDefault}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved as Default' : 'Save Default'}</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* 1. WORKFLOW PRESET SELECTOR */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
          1. Counter Sales Workflow Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              config.formLayout === 'standard'
                ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Layers className={`w-3.5 h-3.5 ${config.formLayout === 'standard' ? 'text-white' : 'text-blue-600'}`} />
                Standard Counter
              </span>
              {config.formLayout === 'standard' && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className={`text-[11px] leading-tight ${config.formLayout === 'standard' ? 'text-blue-100' : 'text-zinc-500'}`}>
              Balanced POS form with quick accessories, warranty, deposit shortcuts & receipts.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('express')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              config.formLayout === 'express'
                ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${config.formLayout === 'express' ? 'text-white' : 'text-amber-600'}`} />
                Express Rush Mode
              </span>
              {config.formLayout === 'express' && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className={`text-[11px] leading-tight ${config.formLayout === 'express' ? 'text-amber-100' : 'text-zinc-500'}`}>
              Rapid 10-second checkout. Hides date schedule, alt phone, notes & barcodes for busy rush.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('detailed')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              config.formLayout === 'detailed'
                ? 'border-emerald-700 bg-emerald-700 text-white shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <FileCheck className={`w-3.5 h-3.5 ${config.formLayout === 'detailed' ? 'text-white' : 'text-emerald-600'}`} />
                Detailed Pre-orders
              </span>
              {config.formLayout === 'detailed' && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className={`text-[11px] leading-tight ${config.formLayout === 'detailed' ? 'text-emerald-100' : 'text-zinc-500'}`}>
              Complete tracking with promised delivery dates, serial/IMEI, parts inventory & custom notes.
            </p>
          </button>
        </div>
      </div>

      {/* 2. GRID & DENSITY CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Column Arrangement */}
        <div className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Page Grid Structure
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...config, columns: '2-col' })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                config.columns === '2-col'
                  ? 'bg-white text-blue-900 border-blue-400 shadow-2xs font-bold'
                  : 'bg-transparent text-zinc-600 border-zinc-200 hover:bg-white/60'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-blue-600" />
              <span>2-Column Grid</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, columns: '1-col' })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                config.columns === '1-col'
                  ? 'bg-white text-blue-900 border-blue-400 shadow-2xs font-bold'
                  : 'bg-transparent text-zinc-600 border-zinc-200 hover:bg-white/60'
              }`}
            >
              <Square className="w-3.5 h-3.5 text-blue-600" />
              <span>Single Column</span>
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">
            {config.columns === '2-col'
              ? 'Customer & schedule on left, item & billing on right'
              : 'Stacked vertical layout for smaller screens & simple flow'}
          </p>
        </div>

        {/* Spacing Density */}
        <div className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Form Spacing & Density
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...config, density: 'comfortable' })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                config.density === 'comfortable'
                  ? 'bg-white text-blue-900 border-blue-400 shadow-2xs font-bold'
                  : 'bg-transparent text-zinc-600 border-zinc-200 hover:bg-white/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Comfortable</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, density: 'compact' })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                config.density === 'compact'
                  ? 'bg-white text-blue-900 border-blue-400 shadow-2xs font-bold'
                  : 'bg-transparent text-zinc-600 border-zinc-200 hover:bg-white/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Compact POS</span>
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">
            {config.density === 'compact'
              ? 'Reduced paddings for maximum information above fold'
              : 'Spacious padding for comfortable touch & desktop operation'}
          </p>
        </div>
      </div>

      {/* 3. FIELD & SECTION VISIBILITY CHECKLIST */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
          3. Customer Orders Form Fields & Sections (Click to Toggle)
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {/* Device Brand Selector */}
          <button
            type="button"
            onClick={() => toggleField('showBrandSelector')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showBrandSelector
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Smartphone className={`w-3.5 h-3.5 ${config.showBrandSelector ? 'text-blue-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Device Brand Selector</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showBrandSelector ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showBrandSelector && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Device Model Selector */}
          <button
            type="button"
            onClick={() => toggleField('showModelSelector')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showModelSelector
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Smartphone className={`w-3.5 h-3.5 ${config.showModelSelector ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Device Model Selector</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showModelSelector ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showModelSelector && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Quick Counter Items */}
          <button
            type="button"
            onClick={() => toggleField('showQuickItems')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showQuickItems
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-3.5 h-3.5 ${config.showQuickItems ? 'text-amber-500' : 'text-zinc-400'}`} />
              <span className="text-xs">Quick Counter Items</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showQuickItems ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showQuickItems && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Browse Inventory Catalog */}
          <button
            type="button"
            onClick={() => toggleField('showInventorySearch')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showInventorySearch
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className={`w-3.5 h-3.5 ${config.showInventorySearch ? 'text-blue-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Browse Inventory Catalog</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showInventorySearch ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showInventorySearch && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Date & Delivery Schedule Section */}
          <button
            type="button"
            onClick={() => toggleField('showDateSchedule')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showDateSchedule
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className={`w-3.5 h-3.5 ${config.showDateSchedule ? 'text-blue-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Order Date & Urgency Box</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showDateSchedule ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showDateSchedule && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Expected Delivery Date */}
          <button
            type="button"
            onClick={() => toggleField('showExpectedDate')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showExpectedDate
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className={`w-3.5 h-3.5 ${config.showExpectedDate ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Expected Delivery Date</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showExpectedDate ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showExpectedDate && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Urgency / Fulfillment Mode */}
          <button
            type="button"
            onClick={() => toggleField('showUrgencySelector')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showUrgencySelector
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-3.5 h-3.5 ${config.showUrgencySelector ? 'text-amber-500' : 'text-zinc-400'}`} />
              <span className="text-xs">Urgency Mode Selector</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showUrgencySelector ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showUrgencySelector && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Alternate Contact / Address */}
          <button
            type="button"
            onClick={() => toggleField('showAlternatePhone')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showAlternatePhone
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Phone className={`w-3.5 h-3.5 ${config.showAlternatePhone ? 'text-blue-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Alternate Phone / Address</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showAlternatePhone ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showAlternatePhone && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Quantity Stepper */}
          <button
            type="button"
            onClick={() => toggleField('showQuantityStepper')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showQuantityStepper
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className={`w-3.5 h-3.5 ${config.showQuantityStepper ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Quantity Stepper (+ / -)</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showQuantityStepper ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showQuantityStepper && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Warranty Duration Selector */}
          <button
            type="button"
            onClick={() => toggleField('showWarrantySelector')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showWarrantySelector
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-3.5 h-3.5 ${config.showWarrantySelector ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Warranty Duration</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showWarrantySelector ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showWarrantySelector && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Serial / Barcode / IMEI */}
          <button
            type="button"
            onClick={() => toggleField('showSerialBarcode')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showSerialBarcode
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className={`w-3.5 h-3.5 ${config.showSerialBarcode ? 'text-violet-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Serial / Barcode / IMEI</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showSerialBarcode ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showSerialBarcode && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Deposit Shortcuts (0, 50%, Full) */}
          <button
            type="button"
            onClick={() => toggleField('showDepositShortcuts')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showDepositShortcuts
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className={`w-3.5 h-3.5 ${config.showDepositShortcuts ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Deposit Shortcuts (0/50%/Full)</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showDepositShortcuts ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showDepositShortcuts && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Payment Method Selector */}
          <button
            type="button"
            onClick={() => toggleField('showPaymentMethod')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showPaymentMethod
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className={`w-3.5 h-3.5 ${config.showPaymentMethod ? 'text-blue-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Payment Method Dropdown</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showPaymentMethod ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showPaymentMethod && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Order Fulfillment Status */}
          <button
            type="button"
            onClick={() => toggleField('showFulfillmentStatus')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showFulfillmentStatus
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className={`w-3.5 h-3.5 ${config.showFulfillmentStatus ? 'text-blue-600' : 'text-zinc-400'}`} />
              <span className="text-xs">Fulfillment Status Dropdown</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showFulfillmentStatus ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showFulfillmentStatus && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Customer Special Notes */}
          <button
            type="button"
            onClick={() => toggleField('showOrderNotes')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              config.showOrderNotes
                ? 'bg-blue-50/50 border-blue-300 text-blue-950 font-medium'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className={`w-3.5 h-3.5 ${config.showOrderNotes ? 'text-zinc-700' : 'text-zinc-400'}`} />
              <span className="text-xs">Customer Special Notes</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              config.showOrderNotes ? 'bg-blue-600 text-white' : 'border border-zinc-300'
            }`}>
              {config.showOrderNotes && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>

      {/* 4. DEFAULT VALUES SETTINGS */}
      <div className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
          4. Default Initial Order State
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Default Fulfillment Status
            </label>
            <select
              value={config.defaultStatus || 'Delivered'}
              onChange={(e) => onChange({ ...config, defaultStatus: e.target.value as any })}
              className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Delivered">Delivered (Direct Counter Handover)</option>
              <option value="Completed">Completed (Ready for Pickup)</option>
              <option value="Pending">Pending (Awaiting Stock / Pre-order)</option>
              <option value="In Progress">In Progress (Arranging / Testing)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Default Delivery Urgency
            </label>
            <select
              value={config.defaultUrgency || 'Immediate Handover'}
              onChange={(e) => onChange({ ...config, defaultUrgency: e.target.value as any })}
              className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Immediate Handover">Immediate Handover (In Stock)</option>
              <option value="Today Pickup">Today Evening Pickup</option>
              <option value="Scheduled">Scheduled / Pre-order Part</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
