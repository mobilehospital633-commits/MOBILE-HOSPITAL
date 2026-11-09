import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Gauge,
  Focus,
  Check,
  RotateCcw,
  Printer,
  Sliders,
  Layers,
  Smartphone,
  Eye,
  Activity,
  CheckCircle2,
  CheckCheck,
  MousePointerClick,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { SmoothnessLevel, SharpnessLevel, ThermalSharpnessLevel } from '../types';

export interface SmoothnessSharpnessPanelProps {
  smoothness: SmoothnessLevel;
  sharpness: SharpnessLevel;
  thermalSharpness?: ThermalSharpnessLevel;
  onChangeSmoothness: (level: SmoothnessLevel) => void;
  onChangeSharpness: (level: SharpnessLevel) => void;
  onChangeThermalSharpness?: (level: ThermalSharpnessLevel) => void;
  onResetDefaults?: () => void;
  compact?: boolean;
}

export const SmoothnessSharpnessPanel: React.FC<SmoothnessSharpnessPanelProps> = ({
  smoothness,
  sharpness,
  thermalSharpness = 'ultra',
  onChangeSmoothness,
  onChangeSharpness,
  onChangeThermalSharpness,
  onResetDefaults,
  compact = false,
}) => {
  const [testClickCount, setTestClickCount] = useState(0);
  const [testBounced, setTestBounced] = useState(false);

  const handleTestClick = () => {
    setTestClickCount((prev) => prev + 1);
    setTestBounced(true);
    setTimeout(() => setTestBounced(false), 240);
  };

  const applyPreset = (preset: 'pro' | 'pos' | 'balanced' | 'soft') => {
    switch (preset) {
      case 'pro':
        onChangeSmoothness('ultra');
        onChangeSharpness('ultra');
        onChangeThermalSharpness?.('ultra');
        break;
      case 'pos':
        onChangeSmoothness('fast');
        onChangeSharpness('ultra');
        onChangeThermalSharpness?.('ultra');
        break;
      case 'balanced':
        onChangeSmoothness('balanced');
        onChangeSharpness('crisp');
        onChangeThermalSharpness?.('high');
        break;
      case 'soft':
        onChangeSmoothness('balanced');
        onChangeSharpness('soft');
        onChangeThermalSharpness?.('standard');
        break;
    }
  };

  return (
    <div className={`space-y-6 ${compact ? 'text-xs' : ''}`}>
      {/* 1. Quick Presets Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 dark:from-zinc-800/90 dark:via-zinc-800/60 dark:to-zinc-800/90 p-4 rounded-xl border border-blue-200/80 dark:border-zinc-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Display Smoothness & Sharpness
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold tracking-wider uppercase">
                  120Hz Ultra Mode
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Optimize fluid 120Hz/60Hz spring physics, subpixel font antialiasing, crisp hairline borders, and smooth momentum scrolling
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => applyPreset('pro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                smoothness === 'ultra' && sharpness === 'ultra' && thermalSharpness === 'ultra'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
              }`}
            >
              Ultra-Smooth & Razor Sharp
            </button>
            <button
              type="button"
              onClick={() => applyPreset('pos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                smoothness === 'fast' && sharpness === 'ultra'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
              }`}
            >
              High-Speed POS (Zero Lag)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('balanced')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                smoothness === 'balanced' && sharpness === 'crisp'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
              }`}
            >
              Balanced Studio
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Controls Grid: Smoothness & Sharpness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SECTION A: UI SMOOTHNESS */}
        <div className="bg-zinc-50/80 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-zinc-700/80">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  Interface Smoothness
                </label>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Transitions, scrolling & spring physics
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 capitalize">
              {smoothness}
            </span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'ultra' as const,
                title: 'Ultra-Smooth 120Hz/60Hz',
                subtitle: 'Fluid cubic-bezier spring curves',
                desc: 'Silky smooth scrolling, spring micro-interactions on click, and GPU-accelerated dialog transitions.',
                badge: 'Recommended',
              },
              {
                id: 'balanced' as const,
                title: 'Balanced Smooth',
                subtitle: 'Standard clean transitions',
                desc: 'Gentle 150ms ease animations with standard scrolling dynamics for daily shop operation.',
                badge: 'Balanced',
              },
              {
                id: 'fast' as const,
                title: 'Instant High-Speed POS',
                subtitle: 'Zero transition delay (0ms)',
                desc: 'Instant tab switching, zero animation lag, and rapid checkout feel for high-volume billing counters.',
                badge: 'POS Express',
              },
            ].map((opt) => {
              const isSelected = smoothness === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeSmoothness(opt.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-2xs ring-1 ring-blue-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{opt.title}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                        {opt.badge}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION B: VISUAL SHARPNESS */}
        <div className="bg-zinc-50/80 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-zinc-700/80">
            <div className="flex items-center gap-2">
              <Focus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  Visual Sharpness
                </label>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Font definition, borders & contrast
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 capitalize">
              {sharpness}
            </span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'ultra' as const,
                title: 'Ultra-Sharp High-DPI',
                subtitle: 'Razor definition & hairline borders',
                desc: 'Subpixel text antialiasing, crisp 1px hairline borders without blur, optimized font ligatures, and geometric SVG precision.',
                badge: 'Razor Sharp',
              },
              {
                id: 'crisp' as const,
                title: 'Crisp Studio Standard',
                subtitle: 'Standard clear antialiasing',
                desc: 'Natural font rendering with subtle modern borders for pleasant viewing on all standard laptop monitors.',
                badge: 'Standard',
              },
              {
                id: 'soft' as const,
                title: 'Soft Focus Comfort',
                subtitle: 'Gentle low-contrast borders',
                desc: 'Softened contrast and relaxed edge borders designed to reduce eyestrain during prolonged night workshop shifts.',
                badge: 'Eye Comfort',
              },
            ].map((opt) => {
              const isSelected = sharpness === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeSharpness(opt.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{opt.title}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                        {opt.badge}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Thermal Printhead Sharpness Section */}
      <div className="bg-zinc-50/80 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div>
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                Thermal POS Receipt & Barcode Sharpness
              </label>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Printhead dot density and pixel-perfect 1D/2D QR code contrast
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'ultra' as const, label: 'Ultra-Sharp Printhead (Zero Dithering)' },
              { id: 'high' as const, label: 'High Contrast' },
              { id: 'standard' as const, label: 'Standard Thermal' },
            ].map((tp) => (
              <button
                key={tp.id}
                type="button"
                onClick={() => onChangeThermalSharpness?.(tp.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  thermalSharpness === tp.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          When Ultra-Sharp is active, thermal printheads render 100% crisp pure monochrome pixels with zero grayscale artifacts, ensuring hand scanners read customer IMEI barcodes and UPI payment QR codes in under 0.1s.
        </p>
      </div>

      {/* 4. Interactive Live Smoothness & Sharpness Test Gauge */}
      <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Live Interactive Test Gauge
            </h5>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>Mode: <strong className="text-blue-600 dark:text-blue-400 uppercase">{smoothness}</strong> smoothness</span>
            <span>•</span>
            <span>Sharpness: <strong className="text-emerald-600 dark:text-emerald-400 uppercase">{sharpness}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Test Component 1: Spring Physics Button */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Smoothness Physics & Micro-Interaction
              </span>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-3">
                Click to feel active spring damping and transition smoothness
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestClick}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  smoothness === 'ultra' ? 'active:scale-95 transition-all duration-150' : ''
                } ${smoothness === 'fast' ? 'transition-none active:scale-100' : ''}`}
              >
                <MousePointerClick className="w-4 h-4" />
                <span>Test Silky Click ({testClickCount})</span>
              </button>

              <div className="text-center px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <span className="text-[10px] text-zinc-400 block font-mono">Response</span>
                <span className="text-xs font-bold text-blue-600 font-mono">
                  {smoothness === 'ultra' ? 'Fluid Spring' : smoothness === 'fast' ? '0ms Instant' : '150ms Ease'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Component 2: Razor Sharp Typography & Hairline Divider */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
              Razor Sharp Typography & Hairline Test
            </span>

            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Apple iPhone 15 Pro Max
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ₹4,999.00
                </span>
              </div>

              {/* Hairline Divider */}
              <div className="border-t border-zinc-200 dark:border-zinc-700" />

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                <span>IMEI: 869402058192849</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  HAIRLINE SHARP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Engine Specs Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-md">
            <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>120Hz/60Hz Spring</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-md">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Subpixel Antialiased</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-md">
            <CheckCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Hairline 1px Edges</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-md">
            <CheckCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Zero Dither Thermal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
