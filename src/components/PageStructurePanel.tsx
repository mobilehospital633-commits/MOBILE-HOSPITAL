import React from 'react';
import {
  SlidersHorizontal,
  Printer,
  FileText,
  Check,
  RotateCcw,
  Scissors,
  Save,
  AlignCenter,
  AlignLeft,
  Sparkles,
  Stamp,
  PenTool,
  Type,
} from 'lucide-react';
import { PageStructureConfig, PaperSize, PageMargin, FontScale, HeaderAlignment, DEFAULT_PAGE_STRUCTURE } from '../types';
import { WATERMARK_STYLES, WatermarkStyle } from './MHRepairWatermark';

interface PageStructurePanelProps {
  structure: PageStructureConfig;
  onChange: (updated: PageStructureConfig) => void;
  onSaveAsDefault?: () => void;
  onResetDefaults?: () => void;
  isSaved?: boolean;
  compactMode?: boolean;
  showAppLayoutOptions?: boolean;
}

export const PageStructurePanel: React.FC<PageStructurePanelProps> = ({
  structure,
  onChange,
  onSaveAsDefault,
  onResetDefaults,
  isSaved = false,
  compactMode = false,
  showAppLayoutOptions = false,
}) => {
  const updateField = <K extends keyof PageStructureConfig>(
    key: K,
    value: PageStructureConfig[K]
  ) => {
    onChange({
      ...structure,
      [key]: value,
    });
  };

  const applyPreset = (preset: 'pos58' | 'pos80' | 'invoiceA4' | 'memoA5') => {
    switch (preset) {
      case 'pos58':
        onChange({
          ...structure,
          paperSize: '58mm',
          margins: 'tight',
          fontScale: 'compact',
          headerAlign: 'center',
          showLogo: false,
          showWatermark: false,
          showShopDetails: true,
          showTaxGst: true,
          showCustomerDetails: true,
          showItemDetails: true,
          showImei: true,
          showWarranty: true,
          showProblemDetails: false,
          showTaxBreakdown: false,
          showStatusBadge: true,
          showTerms: false,
          showSignatures: false,
          showPaymentQr: true,
          thermalMonoMode: true,
          tearLine: true,
        });
        break;
      case 'pos80':
        onChange({
          ...DEFAULT_PAGE_STRUCTURE,
          paperSize: '80mm',
          thermalMonoMode: false,
        });
        break;
      case 'invoiceA4':
        onChange({
          ...structure,
          paperSize: 'a4',
          margins: 'spacious',
          fontScale: 'normal',
          headerAlign: 'left',
          showLogo: true,
          showWatermark: true,
          showShopDetails: true,
          showTaxGst: true,
          showCustomerDetails: true,
          showItemDetails: true,
          showImei: true,
          showWarranty: true,
          showProblemDetails: true,
          showTaxBreakdown: true,
          showStatusBadge: true,
          showTerms: true,
          showSignatures: true,
          showPaymentQr: true,
          thermalMonoMode: false,
          tearLine: false,
        });
        break;
      case 'memoA5':
        onChange({
          ...structure,
          paperSize: 'a5',
          margins: 'normal',
          fontScale: 'normal',
          headerAlign: 'left',
          showLogo: true,
          showWatermark: true,
          showShopDetails: true,
          showTaxGst: true,
          showCustomerDetails: true,
          showItemDetails: true,
          showImei: true,
          showWarranty: true,
          showProblemDetails: true,
          showTaxBreakdown: true,
          showStatusBadge: true,
          showTerms: true,
          showSignatures: true,
          showPaymentQr: false,
          thermalMonoMode: false,
          tearLine: false,
        });
        break;
    }
  };

  return (
    <div className={`bg-zinc-50 rounded-xl border border-zinc-200 text-xs ${compactMode ? 'p-3.5 space-y-3.5' : 'p-5 space-y-5'}`}>
      {/* Top Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 leading-tight">Page Structure Adjustment</h4>
            <p className="text-[11px] text-zinc-500">Configure paper format, margins, font scaling & layout structure</p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('pos80')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
              structure.paperSize === '80mm'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            80mm POS
          </button>
          <button
            type="button"
            onClick={() => applyPreset('pos58')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
              structure.paperSize === '58mm'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            58mm Mini
          </button>
          <button
            type="button"
            onClick={() => applyPreset('invoiceA4')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
              structure.paperSize === 'a4'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            A4 Invoice
          </button>
          <button
            type="button"
            onClick={() => applyPreset('memoA5')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
              structure.paperSize === 'a5'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            A5 Memo
          </button>
        </div>
      </div>

      {/* Primary Structure Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Paper Size */}
        <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs">
          <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Paper Format / Size</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: '80mm' as PaperSize, label: '80mm POS', sub: 'Standard Roll' },
              { id: '58mm' as PaperSize, label: '58mm Mini', sub: 'Compact POS' },
              { id: 'a4' as PaperSize, label: 'A4 Sheet', sub: 'Full Invoice' },
              { id: 'a5' as PaperSize, label: 'A5 Sheet', sub: 'Half Page' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => updateField('paperSize', p.id)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  structure.paperSize === p.id
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{p.label}</div>
                <div className="text-[10px] text-zinc-400">{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Margins / Density */}
        <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs">
          <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Page Margin / Spacing</span>
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'tight' as PageMargin, label: 'Tight (Zero / Minimal)', desc: 'Saves paper on thermal rolls' },
              { id: 'normal' as PageMargin, label: 'Normal (Standard)', desc: 'Balanced padding' },
              { id: 'spacious' as PageMargin, label: 'Spacious (Generous)', desc: 'Relaxed margins for sheets' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateField('margins', m.id)}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  structure.margins === m.id
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-semibold'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <span className="text-xs font-medium">{m.label}</span>
                {structure.margins === m.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Typography & Font Size */}
        <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs">
          <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2">
            Font Scale / Text Size
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'compact' as FontScale, label: 'Compact (85%)', desc: 'Dense data density' },
              { id: 'normal' as FontScale, label: 'Normal (100%)', desc: 'Standard clarity' },
              { id: 'large' as FontScale, label: 'Large (115%)', desc: 'High readability' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => updateField('fontScale', f.id)}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  structure.fontScale === f.id
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <span className="text-xs font-medium">{f.label}</span>
                {structure.fontScale === f.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Header Alignment & Thermal Enhancements */}
        <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs space-y-2.5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Header Alignment
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => updateField('headerAlign', 'center')}
                className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  structure.headerAlign === 'center'
                    ? 'border-zinc-900 bg-zinc-900 text-white font-medium'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
                <span>Center</span>
              </button>
              <button
                type="button"
                onClick={() => updateField('headerAlign', 'left')}
                className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  structure.headerAlign === 'left'
                    ? 'border-zinc-900 bg-zinc-900 text-white font-medium'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Left</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={structure.thermalMonoMode}
                onChange={(e) => updateField('thermalMonoMode', e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 border-zinc-300 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-zinc-800 text-[11px]">Pure B&W Thermal Mode</span>
                <p className="text-[10px] text-zinc-400">Removes grey shades for crisp thermal prints</p>
              </div>
            </label>

            {/* Printhead Sharpness Selector */}
            <div className="pt-1.5 border-t border-zinc-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-800 text-[11px]">Printhead Sharpness:</span>
                <div className="flex items-center gap-1">
                  {(['ultra', 'high', 'standard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => updateField('thermalSharpness', lvl)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        (structure.thermalSharpness || 'ultra') === lvl
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                      }`}
                    >
                      {lvl === 'ultra' ? 'Ultra-Sharp' : lvl === 'high' ? 'High' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-zinc-400">Zero-dither sharp dot density for instant barcode & QR scanner read</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={structure.tearLine}
                onChange={(e) => updateField('tearLine', e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 border-zinc-300 focus:ring-blue-500"
              />
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3 h-3 text-zinc-500" />
                <span className="font-semibold text-zinc-800 text-[11px]">Paper Tear-off Guideline</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Section Structure & Component Visibility Toggles */}
      <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
            Page Sections & Component Visibility
          </label>
          <span className="text-[10px] text-zinc-400">Toggle sections to show or hide on the bill</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {[
            { key: 'showLogo' as const, label: 'Shop Logo' },
            { key: 'showWatermark' as const, label: 'Center Watermark (MH Mobile Hospital)' },
            { key: 'showShopDetails' as const, label: 'Shop Address & Phone' },
            { key: 'showTaxGst' as const, label: 'GST / Tax Reg. Number' },
            { key: 'showCustomerDetails' as const, label: 'Customer Details' },
            { key: 'showItemDetails' as const, label: 'Item / Device Name' },
            { key: 'showImei' as const, label: 'IMEI / Serial Number' },
            { key: 'showWarranty' as const, label: 'Warranty & Payment Mode' },
            { key: 'showProblemDetails' as const, label: 'Fault / Defect Box' },
            { key: 'showTaxBreakdown' as const, label: 'Subtotal & Tax Breakdown' },
            { key: 'showStatusBadge' as const, label: 'Status & Paid Stamp' },
            { key: 'showTerms' as const, label: 'Terms & Conditions' },
            { key: 'showSignatures' as const, label: 'Signature Lines' },
            { key: 'showPaymentQr' as const, label: 'Payment UPI QR Code' },
          ].map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                structure[item.key]
                  ? 'border-zinc-200 bg-zinc-50/80 text-zinc-900'
                  : 'border-zinc-100 bg-zinc-50/30 text-zinc-400'
              }`}
            >
              <input
                type="checkbox"
                checked={structure[item.key]}
                onChange={(e) => updateField(item.key, e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 border-zinc-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className={`text-[11px] font-medium leading-tight ${structure[item.key] ? 'text-zinc-800' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Watermark Stamp Style & Custom Text Branding */}
      <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <Stamp className="w-3.5 h-3.5" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider block">
                Watermark Stamp Styles & Shop Branding
              </label>
              <p className="text-[10px] text-zinc-400">12 Security stamp watermark styles with custom text lines</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...structure,
                  showWatermark: true,
                  watermarkText1: 'MOBILE HOSPITAL',
                  watermarkText2: 'Mobile repairing centre',
                  watermarkText3: 'kalitala Duttapulia',
                });
              }}
              className="text-[10px] px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Apply preset: MOBILE HOSPITAL • Mobile repairing centre • kalitala Duttapulia"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Apply "MOBILE HOSPITAL" Preset</span>
            </button>

            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-zinc-700 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">
              <input
                type="checkbox"
                checked={structure.showWatermark !== false}
                onChange={(e) => updateField('showWatermark', e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 border-zinc-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Enable Watermark</span>
            </label>
          </div>
        </div>

        {structure.showWatermark !== false && (
          <div className="space-y-3 pt-1">
            {/* 3 Text Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                  Line 1 (Shop Name):
                </label>
                <input
                  type="text"
                  value={structure.watermarkText1 ?? 'MOBILE HOSPITAL'}
                  onChange={(e) => updateField('watermarkText1', e.target.value)}
                  placeholder="MOBILE HOSPITAL"
                  className="w-full text-xs font-semibold px-2 py-1.5 rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                  Line 2 (Business Category):
                </label>
                <input
                  type="text"
                  value={structure.watermarkText2 ?? 'Mobile repairing centre'}
                  onChange={(e) => updateField('watermarkText2', e.target.value)}
                  placeholder="Mobile repairing centre"
                  className="w-full text-xs font-semibold px-2 py-1.5 rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                  Line 3 (Address / Location):
                </label>
                <input
                  type="text"
                  value={structure.watermarkText3 ?? 'kalitala Duttapulia'}
                  onChange={(e) => updateField('watermarkText3', e.target.value)}
                  placeholder="kalitala Duttapulia"
                  className="w-full text-xs font-semibold px-2 py-1.5 rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                />
              </div>
            </div>

            {/* Stamp Style Grid */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1.5">
                Select Watermark Stamp Seal Style ({WATERMARK_STYLES.length} Designs):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {WATERMARK_STYLES.map((ws) => {
                  const isSelected = (structure.watermarkStyle || 'stamp') === ws.id;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => updateField('watermarkStyle', ws.id)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs ring-1 ring-amber-500'
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate">{ws.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-amber-600 shrink-0" />}
                      </div>
                      <div className="text-[9.5px] text-zinc-400 mt-0.5 leading-tight line-clamp-1">
                        {ws.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature Typing & Authorized Signatory Customization */}
      <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <PenTool className="w-3.5 h-3.5" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider block">
                Signature Typing & Signatory Style
              </label>
              <p className="text-[10px] text-zinc-400">Type authorized signatory name with cursive calligraphy fonts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...structure,
                  showSignatures: true,
                  signatureType: 'typed',
                  authorizedSignerName: 'Mobile Hospital',
                  signatureFontStyle: 'cursive',
                });
              }}
              className="text-[10px] px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Apply "Mobile Hospital" Signature</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Typing vs Manual Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                Authorized Signature Mode:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateField('signatureType', 'typed')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    structure.signatureType !== 'manual'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Type className="w-3.5 h-3.5 text-blue-600" />
                  <span>Type Name</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('signatureType', 'manual')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    structure.signatureType === 'manual'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Blank Pen Line</span>
                </button>
              </div>
            </div>

            {structure.signatureType !== 'manual' && (
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                  Type Authorized Signatory Name:
                </label>
                <input
                  type="text"
                  value={structure.authorizedSignerName ?? 'Mobile Hospital'}
                  onChange={(e) => updateField('authorizedSignerName', e.target.value)}
                  placeholder="e.g. Mobile Hospital or Manager"
                  className="w-full text-xs font-semibold px-2 py-1.5 rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                />
              </div>
            )}
          </div>

          {/* Signature Font Styles */}
          {structure.signatureType !== 'manual' && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1.5">
                Signature Handwriting & Calligraphy Style:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'cursive', label: 'Caveat Hand', fontClass: "font-['Caveat',cursive] text-sm font-bold text-blue-800" },
                  { id: 'alex_brush', label: 'Alex Brush Elegant', fontClass: "font-['Alex_Brush',cursive] text-base text-blue-900" },
                  { id: 'dancing', label: 'Dancing Script', fontClass: "font-['Dancing_Script',cursive] text-sm text-indigo-900" },
                  { id: 'digital_stamp', label: 'Digital Stamp Seal', fontClass: "text-[9px] font-mono font-bold text-emerald-800" },
                  { id: 'formal', label: 'Formal Serif', fontClass: "font-serif italic font-bold text-xs text-zinc-800" },
                ].map((st) => {
                  const isSelected = (structure.signatureFontStyle || 'cursive') === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updateField('signatureFontStyle', st.id)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 ring-1 ring-blue-500'
                          : 'border-zinc-200 hover:bg-zinc-50 bg-white text-zinc-700'
                      }`}
                    >
                      <div className="text-[10px] font-semibold text-zinc-500 mb-1">{st.label}</div>
                      <div className={`${st.fontClass} truncate`}>
                        {structure.authorizedSignerName || 'Mobile Hospital'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional: App Layout Structure (Content width & density) */}
      {showAppLayoutOptions && (
        <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs">
          <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2.5">
            Application Screen Page Structure & Width
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'standard' as const, label: 'Standard Centered (1280px)', desc: 'Clean centered container' },
              { id: 'wide' as const, label: 'Wide Screen (1440px)', desc: 'Spacious wide workspace' },
              { id: 'fluid' as const, label: 'Full-Width Fluid (100%)', desc: 'Edge-to-edge layout for widescreen POS' },
            ].map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => updateField('appContentWidth', w.id)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  (structure.appContentWidth || 'standard') === w.id
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div className="text-xs font-bold">{w.label}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{w.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-[11px] text-zinc-500 font-mono">
          Active: <span className="font-bold text-zinc-800">{structure.paperSize}</span> | Margins: <span className="font-bold text-zinc-800">{structure.margins}</span> | Font: <span className="font-bold text-zinc-800">{structure.fontScale}</span>
        </div>

        <div className="flex items-center gap-2">
          {onResetDefaults && (
            <button
              type="button"
              onClick={onResetDefaults}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3 text-zinc-500" />
              <span>Reset Defaults</span>
            </button>
          )}

          {onSaveAsDefault && (
            <button
              type="button"
              onClick={onSaveAsDefault}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved as Default' : 'Save as Default'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
