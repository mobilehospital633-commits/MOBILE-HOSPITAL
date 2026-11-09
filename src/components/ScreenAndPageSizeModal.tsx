import React, { useState, useEffect } from 'react';
import {
  X,
  Monitor,
  Printer,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Sparkles,
  Sliders,
  SlidersHorizontal,
  FileText,
  AlignCenter,
  AlignLeft,
  Scissors,
  Save,
  CheckCircle2,
  Layers,
  Smartphone,
  Eye,
} from 'lucide-react';
import {
  PageStructureConfig,
  PaperSize,
  PageMargin,
  FontScale,
  HeaderAlignment,
  ScreenConfig,
  DEFAULT_PAGE_STRUCTURE,
  DEFAULT_SCREEN_CONFIG,
} from '../types';
import { SmoothnessSharpnessPanel } from './SmoothnessSharpnessPanel';

interface ScreenAndPageSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenConfig: ScreenConfig;
  onUpdateScreenConfig: (config: ScreenConfig) => void;
  pageStructure: PageStructureConfig;
  onUpdatePageStructure: (structure: PageStructureConfig) => void;
  onSaveDefaults?: () => void;
}

export const ScreenAndPageSizeModal: React.FC<ScreenAndPageSizeModalProps> = ({
  isOpen,
  onClose,
  screenConfig,
  onUpdateScreenConfig,
  pageStructure,
  onUpdatePageStructure,
  onSaveDefaults,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'screen' | 'visual' | 'page'>('visual');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen) return null;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request blocked or not supported:', e);
    }
  };

  const handleZoomChange = (delta: number) => {
    const newScale = Math.min(150, Math.max(75, Math.round((screenConfig.scale + delta) / 5) * 5));
    onUpdateScreenConfig({ ...screenConfig, scale: newScale });
  };

  const setScaleDirect = (scale: number) => {
    onUpdateScreenConfig({ ...screenConfig, scale });
  };

  const resetScreenDefaults = () => {
    onUpdateScreenConfig({ ...DEFAULT_SCREEN_CONFIG });
  };

  const resetPageDefaults = () => {
    onUpdatePageStructure({ ...DEFAULT_PAGE_STRUCTURE });
  };

  const handleSaveAndConfirm = () => {
    if (onSaveDefaults) {
      onSaveDefaults();
    }
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
    }, 2000);
  };

  const applyPaperPreset = (preset: 'pos80' | 'pos58' | 'invoiceA4' | 'memoA5') => {
    switch (preset) {
      case 'pos80':
        onUpdatePageStructure({
          ...DEFAULT_PAGE_STRUCTURE,
          paperSize: '80mm',
        });
        break;
      case 'pos58':
        onUpdatePageStructure({
          ...pageStructure,
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
      case 'invoiceA4':
        onUpdatePageStructure({
          ...pageStructure,
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
        onUpdatePageStructure({
          ...pageStructure,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs select-none animate-fadeIn">
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 leading-tight">
                  Screen & Page Size Adjustment
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Display & Print
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Optimize application screen zoom, container width, and customer receipt paper dimensions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Kiosk Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-zinc-200 bg-white flex items-center justify-between gap-4 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('visual')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
                activeSubTab === 'visual'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Smoothness & Sharpness</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold uppercase">
                {screenConfig.smoothness || 'ultra'} • {screenConfig.sharpness || 'ultra'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('screen')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
                activeSubTab === 'screen'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Screen Size & Scale</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
                {screenConfig.scale}%
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('page')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
                activeSubTab === 'page'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Page & Print Size (Paper)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 uppercase">
                {pageStructure.paperSize}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 shrink-0">
            <span>Live changes applied instantly</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeSubTab === 'visual' && (
            <SmoothnessSharpnessPanel
              smoothness={screenConfig.smoothness || 'ultra'}
              sharpness={screenConfig.sharpness || 'ultra'}
              thermalSharpness={pageStructure.thermalSharpness || screenConfig.thermalSharpness || 'ultra'}
              onChangeSmoothness={(s) => {
                onUpdateScreenConfig({ ...screenConfig, smoothness: s });
              }}
              onChangeSharpness={(sh) => {
                onUpdateScreenConfig({ ...screenConfig, sharpness: sh });
              }}
              onChangeThermalSharpness={(th) => {
                onUpdateScreenConfig({ ...screenConfig, thermalSharpness: th });
                onUpdatePageStructure({ ...pageStructure, thermalSharpness: th });
              }}
              onResetDefaults={() => {
                onUpdateScreenConfig({ ...screenConfig, smoothness: 'ultra', sharpness: 'ultra', thermalSharpness: 'ultra' });
                onUpdatePageStructure({ ...pageStructure, thermalSharpness: 'ultra' });
              }}
            />
          )}

          {activeSubTab === 'screen' && (
            /* ========================================================
               SCREEN & DISPLAY SIZE CONTROLS
               ======================================================== */
            <div className="space-y-6">
              {/* 1. Zoom / Scale Slider & Presets */}
              <div className="bg-zinc-50/80 p-4.5 rounded-xl border border-zinc-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                      <ZoomIn className="w-4 h-4 text-blue-600" />
                      <span>Interface Display Zoom / Screen Scale</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Scale the entire workshop interface up or down for high-resolution monitors or touch POS
                    </p>
                  </div>

                  {/* Direct Controls */}
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-zinc-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleZoomChange(-5)}
                      disabled={screenConfig.scale <= 75}
                      className="p-1.5 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                      title="Zoom Out 5%"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-blue-600 px-2 min-w-[50px] text-center">
                      {screenConfig.scale}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleZoomChange(5)}
                      disabled={screenConfig.scale >= 150}
                      className="p-1.5 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                      title="Zoom In 5%"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setScaleDirect(100)}
                      className="text-[10px] font-semibold px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer transition-colors"
                      title="Reset to 100%"
                    >
                      100%
                    </button>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="px-2 py-2">
                  <input
                    type="range"
                    min="75"
                    max="150"
                    step="5"
                    value={screenConfig.scale}
                    onChange={(e) => setScaleDirect(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
                    <span>75% (Ultra-Compact)</span>
                    <span>90% (POS Laptop)</span>
                    <span className="font-bold text-zinc-700">100% (Default)</span>
                    <span>115% (Comfort)</span>
                    <span>125% (Touch Screen)</span>
                    <span>150% (Max)</span>
                  </div>
                </div>

                {/* Quick Zoom Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-4 pt-3 border-t border-zinc-200/80">
                  {[
                    { scale: 80, label: '80% Compact', sub: 'Max Tickets View' },
                    { scale: 90, label: '90% Small', sub: '13" Counter Screen' },
                    { scale: 100, label: '100% Standard', sub: 'Default Balanced' },
                    { scale: 110, label: '110% Comfort', sub: 'Relaxed Eyes' },
                    { scale: 125, label: '125% Touch POS', sub: 'Large Buttons' },
                    { scale: 140, label: '140% Large TV', sub: 'Wall Display' },
                  ].map((preset) => (
                    <button
                      key={preset.scale}
                      type="button"
                      onClick={() => setScaleDirect(preset.scale)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        screenConfig.scale === preset.scale
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{preset.label}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{preset.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Screen Container Width & Workspace Layout */}
              <div className="bg-zinc-50/80 p-4.5 rounded-xl border border-zinc-200">
                <label className="text-xs font-bold text-zinc-900 flex items-center gap-2 mb-1">
                  <Maximize2 className="w-4 h-4 text-emerald-600" />
                  <span>Screen Canvas Width Mode</span>
                </label>
                <p className="text-[11px] text-zinc-500 mb-3">
                  Controls how wide the content expands across your browser window
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: 'compact' as const,
                      label: 'Compact (1024px)',
                      desc: 'Ideal for 4:3 or small counter touchscreen terminals',
                    },
                    {
                      id: 'standard' as const,
                      label: 'Standard (1280px)',
                      desc: 'Centered desktop canvas with balanced side margins',
                    },
                    {
                      id: 'wide' as const,
                      label: 'Wide Desktop (1536px)',
                      desc: 'Expansive view for 1080p full HD desktop monitors',
                    },
                    {
                      id: 'fluid' as const,
                      label: 'Full Fluid (100%)',
                      desc: 'Edge-to-edge layout, zero wasted space on wide screens',
                    },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() =>
                        onUpdateScreenConfig({
                          ...screenConfig,
                          maxWidth: w.id,
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        screenConfig.maxWidth === w.id
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-medium shadow-2xs ring-1 ring-emerald-500/20'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{w.label}</span>
                        {screenConfig.maxWidth === w.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{w.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Screen Text Sizing & UI Density */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Density */}
                <div className="bg-zinc-50/80 p-4 rounded-xl border border-zinc-200">
                  <label className="text-xs font-bold text-zinc-900 block mb-1">
                    Screen UI Density
                  </label>
                  <p className="text-[11px] text-zinc-500 mb-2.5">
                    Spacing between tables, buttons, and form inputs
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateScreenConfig({
                          ...screenConfig,
                          density: 'comfortable',
                        })
                      }
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        screenConfig.density === 'comfortable'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="text-xs font-bold">Comfortable</div>
                      <div className="text-[10px] text-zinc-400">Spacious padding</div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateScreenConfig({
                          ...screenConfig,
                          density: 'compact',
                        })
                      }
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        screenConfig.density === 'compact'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="text-xs font-bold">Compact</div>
                      <div className="text-[10px] text-zinc-400">Dense row spacing</div>
                    </button>
                  </div>
                </div>

                {/* Sidebar Mode */}
                <div className="bg-zinc-50/80 p-4 rounded-xl border border-zinc-200">
                  <label className="text-xs font-bold text-zinc-900 block mb-1">
                    Sidebar Navigation Style
                  </label>
                  <p className="text-[11px] text-zinc-500 mb-2.5">
                    Full sidebar width or compact icon rail
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateScreenConfig({
                          ...screenConfig,
                          sidebarMode: 'standard',
                        })
                      }
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        screenConfig.sidebarMode === 'standard'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="text-xs font-bold">Expanded (256px)</div>
                      <div className="text-[10px] text-zinc-400">Full labels & icons</div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateScreenConfig({
                          ...screenConfig,
                          sidebarMode: 'compact',
                        })
                      }
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        screenConfig.sidebarMode === 'compact'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="text-xs font-bold">Compact Rail (72px)</div>
                      <div className="text-[10px] text-zinc-400">More workbench space</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'page' && (
            /* ========================================================
               PAGE & PRINT SIZE CONTROLS (RECEIPT / INVOICE PAPER)
               ======================================================== */
            <div className="space-y-6">
              {/* Paper Format Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-800">
                    Quick Paper Presets:
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyPaperPreset('pos80')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      pageStructure.paperSize === '80mm'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    80mm Thermal POS
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPaperPreset('pos58')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      pageStructure.paperSize === '58mm'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    58mm Mini POS
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPaperPreset('invoiceA4')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      pageStructure.paperSize === 'a4'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    A4 Full Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPaperPreset('memoA5')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      pageStructure.paperSize === 'a5'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    A5 Half Sheet
                  </button>
                </div>
              </div>

              {/* 1. Paper Size & Margins Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Paper Size */}
                <div className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Receipt Paper Format</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: '80mm' as PaperSize, label: '80mm POS', sub: 'Standard 3" Roll' },
                      { id: '58mm' as PaperSize, label: '58mm Mini', sub: 'Compact 2" Roll' },
                      { id: 'a4' as PaperSize, label: 'A4 Sheet', sub: 'Full Invoice' },
                      { id: 'a5' as PaperSize, label: 'A5 Sheet', sub: 'Half Sheet' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onUpdatePageStructure({ ...pageStructure, paperSize: p.id })}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          pageStructure.paperSize === p.id
                            ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-semibold'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight">{p.label}</div>
                        <div className="text-[10px] text-zinc-400">{p.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margins */}
                <div className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Page Edge Margins</span>
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'tight' as PageMargin, label: 'Tight (Zero/Minimal)', desc: 'Saves paper' },
                      { id: 'normal' as PageMargin, label: 'Normal (Standard)', desc: 'Balanced' },
                      { id: 'spacious' as PageMargin, label: 'Spacious (Generous)', desc: 'Sheets' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onUpdatePageStructure({ ...pageStructure, margins: m.id })}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                          pageStructure.margins === m.id
                            ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-semibold'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <span className="text-xs font-medium">{m.label}</span>
                        {pageStructure.margins === m.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Scaling */}
                <div className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Print Font Size
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'compact' as FontScale, label: 'Compact (85%)', desc: 'Dense data' },
                      { id: 'normal' as FontScale, label: 'Normal (100%)', desc: 'Standard' },
                      { id: 'large' as FontScale, label: 'Large (115%)', desc: 'Bold readability' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onUpdatePageStructure({ ...pageStructure, fontScale: f.id })}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                          pageStructure.fontScale === f.id
                            ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-semibold'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <span className="text-xs font-medium">{f.label}</span>
                        {pageStructure.fontScale === f.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Thermal Printhead & Header Alignment */}
              <div className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-zinc-800">Header Alignment:</label>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => onUpdatePageStructure({ ...pageStructure, headerAlign: 'center' })}
                      className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        pageStructure.headerAlign === 'center'
                          ? 'bg-zinc-900 text-white'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <AlignCenter className="w-3 h-3" />
                      <span>Center</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdatePageStructure({ ...pageStructure, headerAlign: 'left' })}
                      className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        pageStructure.headerAlign === 'left'
                          ? 'bg-zinc-900 text-white'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <AlignLeft className="w-3 h-3" />
                      <span>Left</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pageStructure.thermalMonoMode}
                      onChange={(e) =>
                        onUpdatePageStructure({ ...pageStructure, thermalMonoMode: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded text-blue-600 border-zinc-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-zinc-800">
                      Pure B&W Thermal Mode
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pageStructure.tearLine}
                      onChange={(e) =>
                        onUpdatePageStructure({ ...pageStructure, tearLine: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded text-blue-600 border-zinc-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-zinc-500" />
                      <span>Tear-off Guideline</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Bill Sections Visibility */}
              <div className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-zinc-800">
                    Receipt Content Sections Visibility
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    Check or uncheck sections to print on the customer bill
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[
                    { key: 'showLogo' as const, label: 'Shop Logo' },
                    { key: 'showWatermark' as const, label: 'Center Watermark (MH Mobile Hospital)' },
                    { key: 'showShopDetails' as const, label: 'Address & Phone' },
                    { key: 'showTaxGst' as const, label: 'GST / Tax Reg.' },
                    { key: 'showCustomerDetails' as const, label: 'Customer Details' },
                    { key: 'showItemDetails' as const, label: 'Device Model' },
                    { key: 'showImei' as const, label: 'IMEI / Serial' },
                    { key: 'showWarranty' as const, label: 'Warranty & Mode' },
                    { key: 'showProblemDetails' as const, label: 'Defect / Fault' },
                    { key: 'showTaxBreakdown' as const, label: 'Tax Breakdown' },
                    { key: 'showStatusBadge' as const, label: 'Status & Paid Stamp' },
                    { key: 'showTerms' as const, label: 'Terms & Conditions' },
                    { key: 'showSignatures' as const, label: 'Signature Lines' },
                    { key: 'showPaymentQr' as const, label: 'Payment UPI QR' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                        pageStructure[item.key]
                          ? 'border-blue-200 bg-white text-zinc-900 shadow-2xs'
                          : 'border-zinc-200/60 bg-zinc-100/40 text-zinc-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={pageStructure[item.key]}
                        onChange={(e) =>
                          onUpdatePageStructure({
                            ...pageStructure,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 rounded text-blue-600 border-zinc-300 focus:ring-blue-500"
                      />
                      <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {saveToast && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration saved successfully!</span>
              </span>
            )}
            {!saveToast && (
              <span>
                Screen: <strong className="text-zinc-800">{screenConfig.scale}%</strong> | Smoothness: <strong className="text-blue-600 uppercase">{screenConfig.smoothness || 'ultra'}</strong> | Sharpness: <strong className="text-emerald-600 uppercase">{screenConfig.sharpness || 'ultra'}</strong> | Paper: <strong className="text-zinc-800 uppercase">{pageStructure.paperSize}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'visual' ? (
              <button
                type="button"
                onClick={() => {
                  onUpdateScreenConfig({ ...screenConfig, smoothness: 'ultra', sharpness: 'ultra', thermalSharpness: 'ultra' });
                  onUpdatePageStructure({ ...pageStructure, thermalSharpness: 'ultra' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Reset Smoothness & Sharpness to Ultra defaults"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                <span>Reset Smoothness (Ultra)</span>
              </button>
            ) : activeSubTab === 'screen' ? (
              <button
                type="button"
                onClick={resetScreenDefaults}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                <span>Reset Screen (100%)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={resetPageDefaults}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                <span>Reset Paper (80mm)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAndConfirm}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-98"
            >
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
