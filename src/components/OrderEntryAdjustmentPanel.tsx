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
  CheckSquare,
  Sparkles,
  Smartphone,
  ShieldAlert,
  Wrench,
  Clock,
  CreditCard,
  FileText,
} from 'lucide-react';
import { OrderEntryPageConfig, DEFAULT_ORDER_ENTRY_CONFIG } from '../types';

interface OrderEntryAdjustmentPanelProps {
  config: OrderEntryPageConfig;
  onChange: (config: OrderEntryPageConfig) => void;
  onSaveAsDefault?: () => void;
  onResetDefaults?: () => void;
  isSaved?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

export const OrderEntryAdjustmentPanel: React.FC<OrderEntryAdjustmentPanelProps> = ({
  config,
  onChange,
  onSaveAsDefault,
  onResetDefaults,
  isSaved = false,
  compact = false,
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
        showAlternatePhone: false,
        showDeviceColor: false,
        showImei: false,
        showPasscodeLock: false,
        showPhysicalCondition: false,
        showHandoverChecklist: false,
        showCommonFaults: true,
        showTechnician: false,
        showExpectedDate: false,
        showDeposit: true,
        showInternalNotes: false,
      });
    } else if (preset === 'detailed') {
      onChange({
        ...config,
        formLayout: 'detailed',
        columns: '2-col',
        density: 'comfortable',
        showBrandSelector: true,
        showAlternatePhone: true,
        showDeviceColor: true,
        showImei: true,
        showPasscodeLock: true,
        showPhysicalCondition: true,
        showHandoverChecklist: true,
        showCommonFaults: true,
        showTechnician: true,
        showExpectedDate: true,
        showDeposit: true,
        showInternalNotes: true,
      });
    } else {
      // Standard
      onChange({
        ...DEFAULT_ORDER_ENTRY_CONFIG,
      });
    }
  };

  const toggleField = (key: keyof OrderEntryPageConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Panel Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center border border-zinc-200">
            <SlidersHorizontal className="w-4 h-4 text-zinc-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>Customer New Order Entry Page Adjustment</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                {config.formLayout}
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              Customize form fields, column layout, spacing density, and intake workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onResetDefaults && (
            <button
              type="button"
              onClick={onResetDefaults}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset order entry page layout to default"
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
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
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
          1. Intake Workflow Preset
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              config.formLayout === 'standard'
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Layers className={`w-3.5 h-3.5 ${config.formLayout === 'standard' ? 'text-white' : 'text-zinc-700'}`} />
                Standard Intake
              </span>
              {config.formLayout === 'standard' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className={`text-[11px] leading-tight ${config.formLayout === 'standard' ? 'text-zinc-300' : 'text-zinc-500'}`}>
              Balanced intake with customer, device, issue, technician & advance deposit.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('express')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              config.formLayout === 'express'
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${config.formLayout === 'express' ? 'text-amber-400' : 'text-amber-600'}`} />
                Express Rush Mode
              </span>
              {config.formLayout === 'express' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className={`text-[11px] leading-tight ${config.formLayout === 'express' ? 'text-zinc-300' : 'text-zinc-500'}`}>
              Fast intake under 20 seconds. Hides secondary fields for rapid counter rush.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('detailed')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              config.formLayout === 'detailed'
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <FileCheck className={`w-3.5 h-3.5 ${config.formLayout === 'detailed' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                Detailed Inspection
              </span>
              {config.formLayout === 'detailed' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className={`text-[11px] leading-tight ${config.formLayout === 'detailed' ? 'text-zinc-300' : 'text-zinc-500'}`}>
              Full diagnostic intake with scratch checks, passcode, accessories & notes.
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
                  ? 'bg-white text-zinc-900 border-zinc-400 shadow-2xs'
                  : 'bg-transparent text-zinc-600 border-zinc-200 hover:bg-white/60'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-zinc-700" />
              <span>2-Column Grid</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, columns: '1-col' })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                config.columns === '1-col'
                  ? 'bg-white text-zinc-900 border-zinc-400 shadow-2xs'
                  : 'bg-transparent text-zinc-600 border-zinc-200 hover:bg-white/60'
              }`}
            >
              <Square className="w-3.5 h-3.5 text-zinc-700" />
              <span>Single Column</span>
            </button>
          </div>
        </div>

        {/* Form Spacing Density */}
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
                  ? 'bg-white text-zinc-900 border-zinc-400 shadow-2xs'
                  : 'bg-transparent text-zinc-600 border-zinc-200 hover:bg-white/60'
              }`}
            >
              <span>Comfortable</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, density: 'compact' })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                config.density === 'compact'
                  ? 'bg-white text-zinc-900 border-zinc-400 shadow-2xs'
                  : 'bg-transparent text-zinc-600 border-zinc-200 hover:bg-white/60'
              }`}
            >
              <span>Compact / Dense</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. FIELD & SECTION VISIBILITY ADJUSTMENTS */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
          3. Entry Form Fields & Sections Visibility
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {/* Brand Quick Chips */}
          <button
            type="button"
            onClick={() => toggleField('showBrandSelector')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showBrandSelector
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Brand Quick Chips</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showBrandSelector ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showBrandSelector ? '✓' : ''}
            </div>
          </button>

          {/* Alternate Phone */}
          <button
            type="button"
            onClick={() => toggleField('showAlternatePhone')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showAlternatePhone
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">📞</span>
              <span className="text-xs font-medium">Alternate Phone #</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showAlternatePhone ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showAlternatePhone ? '✓' : ''}
            </div>
          </button>

          {/* Device Color */}
          <button
            type="button"
            onClick={() => toggleField('showDeviceColor')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showDeviceColor
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">🎨</span>
              <span className="text-xs font-medium">Device Color</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showDeviceColor ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showDeviceColor ? '✓' : ''}
            </div>
          </button>

          {/* IMEI / Serial Number */}
          <button
            type="button"
            onClick={() => toggleField('showImei')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showImei
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">🔢</span>
              <span className="text-xs font-medium">IMEI / Serial Number</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showImei ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showImei ? '✓' : ''}
            </div>
          </button>

          {/* Passcode / Pattern Lock */}
          <button
            type="button"
            onClick={() => toggleField('showPasscodeLock')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showPasscodeLock
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">🔒</span>
              <span className="text-xs font-medium">Passcode / Lock Pattern</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showPasscodeLock ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showPasscodeLock ? '✓' : ''}
            </div>
          </button>

          {/* Physical Condition Checklist */}
          <button
            type="button"
            onClick={() => toggleField('showPhysicalCondition')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showPhysicalCondition
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Physical Condition / Dents</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showPhysicalCondition ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showPhysicalCondition ? '✓' : ''}
            </div>
          </button>

          {/* Handover Checklist */}
          <button
            type="button"
            onClick={() => toggleField('showHandoverChecklist')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showHandoverChecklist
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">📦</span>
              <span className="text-xs font-medium">SIM / Memory Card Handover</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showHandoverChecklist ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showHandoverChecklist ? '✓' : ''}
            </div>
          </button>

          {/* Common Fault Quick Chips */}
          <button
            type="button"
            onClick={() => toggleField('showCommonFaults')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showCommonFaults
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Common Faults Quick Chips</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showCommonFaults ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showCommonFaults ? '✓' : ''}
            </div>
          </button>

          {/* Assigned Technician */}
          <button
            type="button"
            onClick={() => toggleField('showTechnician')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showTechnician
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Technician Assignment</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showTechnician ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showTechnician ? '✓' : ''}
            </div>
          </button>

          {/* Expected Delivery Date */}
          <button
            type="button"
            onClick={() => toggleField('showExpectedDate')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showExpectedDate
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Expected Delivery Date</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showExpectedDate ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showExpectedDate ? '✓' : ''}
            </div>
          </button>

          {/* Advance Deposit */}
          <button
            type="button"
            onClick={() => toggleField('showDeposit')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showDeposit
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Advance Deposit & Pay Mode</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showDeposit ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showDeposit ? '✓' : ''}
            </div>
          </button>

          {/* Internal Notes */}
          <button
            type="button"
            onClick={() => toggleField('showInternalNotes')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              config.showInternalNotes
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-zinc-50/60 border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Internal Bench Notes</span>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${config.showInternalNotes ? 'bg-blue-600 text-white' : 'border border-zinc-300'}`}>
              {config.showInternalNotes ? '✓' : ''}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
