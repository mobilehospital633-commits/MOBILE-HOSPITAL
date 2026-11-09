import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Sparkles,
  PanelLeft,
  Check,
  Eye,
  Layers,
  ChevronDown,
  Monitor,
  Grid,
  Zap,
  Focus,
} from 'lucide-react';
import {
  ThemeMode,
  ThemeAccent,
  BackgroundStyle,
  MenuBarColorPreset,
  MenuBarStyle,
  SmoothnessLevel,
  SharpnessLevel,
  ThermalSharpnessLevel,
} from '../types';
import { MENU_BAR_STYLE_OPTIONS } from '../utils/menuBarUtils';
import { SmoothnessSharpnessPanel } from './SmoothnessSharpnessPanel';

export interface ThemeSelectorProps {
  theme?: ThemeMode;
  accent?: ThemeAccent;
  customAccentColor?: string;
  accentGlow?: boolean;
  backgroundStyle?: BackgroundStyle;
  menuBarColor?: MenuBarColorPreset;
  menuBarCustomColor?: string;
  menuBarStyle?: MenuBarStyle;
  menuBarHeaderSync?: boolean;
  layoutWidth?: 'compact' | 'standard' | 'wide' | 'fluid';
  smoothness?: SmoothnessLevel;
  sharpness?: SharpnessLevel;
  thermalSharpness?: ThermalSharpnessLevel;
  onChangeTheme: (theme: ThemeMode) => void;
  onChangeAccent: (accent: ThemeAccent) => void;
  onChangeBackgroundStyle?: (style: BackgroundStyle) => void;
  onChangeCustomAccent?: (hex: string) => void;
  onToggleAccentGlow?: (enabled: boolean) => void;
  onChangeMenuBarColor?: (color: MenuBarColorPreset) => void;
  onChangeMenuBarCustomColor?: (hex: string) => void;
  onChangeMenuBarStyle?: (style: MenuBarStyle) => void;
  onChangeMenuBarHeaderSync?: (sync: boolean) => void;
  onChangeLayoutWidth?: (width: 'compact' | 'standard' | 'wide' | 'fluid') => void;
  onChangeSmoothness?: (smoothness: SmoothnessLevel) => void;
  onChangeSharpness?: (sharpness: SharpnessLevel) => void;
  onChangeThermalSharpness?: (sharpness: ThermalSharpnessLevel) => void;
  initialTab?: 'accent' | 'canvas' | 'menubar' | 'engine';
  compact?: boolean;
}

// Popular custom color inspiration starter swatches including Warm Sand & Earthy tones
const QUICK_CUSTOM_SWATCHES = [
  { name: 'Warm Sand', hex: '#d97706' },
  { name: 'Desert Dune', hex: '#c2884a' },
  { name: 'Royal Cobalt', hex: '#2563eb' },
  { name: 'Matrix Emerald', hex: '#10b981' },
  { name: 'Cyber Violet', hex: '#8b5cf6' },
  { name: 'Velvet Crimson', hex: '#e11d48' },
  { name: 'Electric Cyan', hex: '#06b6d4' },
  { name: 'Carbon Stealth', hex: '#3f3f46' },
];

// Quick menu bar swatches including Cashmere Sand
const QUICK_MENU_BAR_SWATCHES = [
  { name: 'Cashmere Sand', hex: '#f8f5ee' },
  { name: 'Warm Espresso', hex: '#1b140e' },
  { name: 'Deep Midnight', hex: '#0d0f17' },
  { name: 'Obsidian Black', hex: '#000000' },
  { name: 'Slate Titanium', hex: '#0f172a' },
  { name: 'Clean White', hex: '#ffffff' },
];

// Custom Workspace Background Canvas Patterns
const WORKSPACE_PATTERNS = [
  {
    id: 'workbench' as const,
    name: 'Technical ESD Grid',
    badge: 'ESD Grid',
    desc: '24px micro-grid with coordinate intersection marks',
  },
  {
    id: 'glow' as const,
    name: 'Ambient Studio Glow',
    badge: 'Studio Glow',
    desc: 'Dynamic radial lighting bloom reflecting custom accent',
  },
  {
    id: 'dots' as const,
    name: 'Micro-Dot Matrix',
    badge: 'Dot Matrix',
    desc: '20px precision Swiss technical dotted matrix canvas',
  },
  {
    id: 'blueprint' as const,
    name: 'Schematic CAD Blueprint',
    badge: 'CAD Blueprint',
    desc: 'Motherboard drafting dual-grid schematic layout',
  },
  {
    id: 'mesh' as const,
    name: 'Circuit Tech Mesh',
    badge: 'Tech Mesh',
    desc: '45° angled micro-hardware lattice surface texture',
  },
  {
    id: 'clean' as const,
    name: 'Minimalist Satin Canvas',
    badge: 'Satin Canvas',
    desc: 'Distraction-free smooth matte studio surface',
  },
];

// App Container Width Options
const LAYOUT_WIDTH_OPTIONS = [
  { id: 'standard' as const, name: 'Standard (1280px)', desc: 'Balanced desktop workspace' },
  { id: 'wide' as const, name: 'Wide Studio (1536px)', desc: 'Expansive wide monitor view' },
  { id: 'compact' as const, name: 'Compact (1024px)', desc: 'Focused center console' },
  { id: 'fluid' as const, name: 'Fluid (100%)', desc: 'Edge-to-edge full width' },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  theme = 'light',
  customAccentColor = '#2563eb',
  accentGlow = true,
  backgroundStyle = 'workbench',
  menuBarCustomColor = '#0d0f17',
  menuBarStyle = 'solid',
  menuBarHeaderSync = true,
  layoutWidth = 'standard',
  smoothness = 'ultra',
  sharpness = 'ultra',
  thermalSharpness = 'ultra',
  onChangeTheme,
  onChangeAccent,
  onChangeBackgroundStyle,
  onChangeCustomAccent,
  onToggleAccentGlow,
  onChangeMenuBarColor,
  onChangeMenuBarCustomColor,
  onChangeMenuBarStyle,
  onChangeMenuBarHeaderSync,
  onChangeLayoutWidth,
  onChangeSmoothness,
  onChangeSharpness,
  onChangeThermalSharpness,
  initialTab = 'accent',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'accent' | 'canvas' | 'menubar' | 'engine'>(initialTab);
  const [accentHexInput, setAccentHexInput] = useState(customAccentColor);
  const [menuBarHexInput, setMenuBarHexInput] = useState(menuBarCustomColor);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDarkMode = theme === 'dark' || theme === 'oled' || theme === 'forest';
  const isOledMode = theme === 'oled';
  const isWarmSandMode = theme === 'sepia';

  // Sync state if props change
  useEffect(() => {
    if (customAccentColor) setAccentHexInput(customAccentColor);
  }, [customAccentColor]);

  useEffect(() => {
    if (menuBarCustomColor) setMenuBarHexInput(menuBarCustomColor);
  }, [menuBarCustomColor]);

  // Handle outside click for compact dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleApplyCustomAccent = (hex: string) => {
    const formatted = hex.startsWith('#') ? hex : `#${hex}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(formatted)) {
      setAccentHexInput(formatted);
      onChangeAccent('custom');
      onChangeCustomAccent?.(formatted);
    }
  };

  const handleApplyCustomMenuBar = (hex: string) => {
    const formatted = hex.startsWith('#') ? hex : `#${hex}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(formatted)) {
      setMenuBarHexInput(formatted);
      onChangeMenuBarColor?.('custom');
      onChangeMenuBarCustomColor?.(formatted);
    }
  };

  // 1-Click Suite: Warm Sand Experience
  const handleApplyWarmSandSuite = () => {
    onChangeTheme('sepia');
    onChangeAccent('custom');
    onChangeCustomAccent?.('#d97706');
    onChangeBackgroundStyle?.('workbench');
    onChangeMenuBarColor?.('custom');
    onChangeMenuBarCustomColor?.('#f8f5ee');
    onChangeMenuBarStyle?.('solid');
    onChangeMenuBarHeaderSync?.(true);
  };

  // -------------------------------------------------------------
  // COMPACT VIEW (Dropdown Menu for App Header)
  // -------------------------------------------------------------
  if (compact) {
    return (
      <div className="relative inline-block text-left" ref={menuRef}>
        {/* Trigger Button in Header */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-98"
          title="Custom Theme, Canvas & Menu Bar Settings"
          aria-expanded={isOpen}
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs transition-transform"
            style={{
              backgroundColor: customAccentColor,
              boxShadow: accentGlow ? `0 0 8px ${customAccentColor}88` : undefined,
            }}
          />
          <span className="hidden md:inline">
            {isWarmSandMode ? 'Warm Sand' : 'Custom Theme'}
          </span>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-92 sm:w-100 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 p-4 text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header with Title and Mode Switch */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-2xs shrink-0"
                  style={{ backgroundColor: customAccentColor }}
                >
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">Theme Studio</h4>
                  <span className="text-[10px] text-zinc-400 font-mono">Custom Architecture</span>
                </div>
              </div>

              {/* Light / Warm Sand / Dark / OLED Mode Switcher */}
              <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => onChangeTheme('light')}
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                  title="Daylight White Mode"
                >
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTheme('sepia')}
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                    isWarmSandMode
                      ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                  title="Warm Sand & Parchment Eye Comfort"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600/30 inline-block shadow-2xs" />
                  <span>Sand</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTheme('dark')}
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-zinc-900 text-white shadow-2xs dark:bg-zinc-700 font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                  title="Stealth Dark Mode"
                >
                  <Moon className="w-3 h-3 text-blue-400" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTheme('oled')}
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                    isOledMode
                      ? 'bg-black text-white shadow-2xs border border-zinc-700 font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                  title="True Pitch Black OLED Mode"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>OLED</span>
                </button>
              </div>
            </div>

            {/* Quick Warm Sand 1-Click Banner */}
            <div className="mb-3 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600/40 shrink-0 shadow-2xs" />
                <span className="text-[11px] font-bold text-amber-950 dark:text-amber-200 truncate">
                  Warm Sand Suite
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyWarmSandSuite}
                className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                1-Click Apply
              </button>
            </div>

            {/* Segmented Controls for Tabs: Accent / Canvas / MenuBar / Engine */}
            <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 mb-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('accent')}
                className={`flex-1 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'accent'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Accent</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('canvas')}
                className={`flex-1 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'canvas'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-3 h-3 text-purple-500" />
                <span>Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('menubar')}
                className={`flex-1 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'menubar'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <PanelLeft className="w-3 h-3 text-emerald-500" />
                <span>Menu</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('engine')}
                className={`flex-1 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'engine'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3 text-blue-500" />
                <span>Smoothness</span>
              </button>
            </div>

            {/* TAB 1: CUSTOM BRAND ACCENT COLOR */}
            {activeTab === 'accent' && (
              <div className="space-y-3">
                {/* Color Input & Hex Field */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={customAccentColor}
                        onChange={(e) => handleApplyCustomAccent(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      />
                      <div
                        className="w-8 h-8 rounded-xl border border-black/15 shadow-2xs flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                        style={{ backgroundColor: customAccentColor }}
                      >
                        <Palette className="w-3.5 h-3.5 text-white drop-shadow" />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={accentHexInput}
                      onChange={(e) => setAccentHexInput(e.target.value)}
                      onBlur={() => handleApplyCustomAccent(accentHexInput)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomAccent(accentHexInput)}
                      placeholder="#d97706"
                      maxLength={7}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />

                    <button
                      type="button"
                      onClick={() => handleApplyCustomAccent(accentHexInput)}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      Set
                    </button>
                  </div>
                </div>

                {/* Quick Starter Swatches */}
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Quick Custom Swatches
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {QUICK_CUSTOM_SWATCHES.map((swatch) => {
                      const isSelected = customAccentColor.toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => handleApplyCustomAccent(swatch.hex)}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-zinc-900 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-800 font-bold shadow-2xs ring-1 ring-zinc-900/15'
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                          title={swatch.name}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/15 shadow-2xs"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <span className="text-[10px] font-mono truncate text-zinc-700 dark:text-zinc-300">{swatch.hex}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ambient Glow Toggle */}
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Ambient Accent Glow</div>
                    <div className="text-[10px] text-zinc-400">Radiant halo around buttons & tabs</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleAccentGlow?.(!accentGlow)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      accentGlow ? 'bg-zinc-900 dark:bg-amber-600' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                        accentGlow ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: WORKSPACE CANVAS & CONTAINER WIDTH */}
            {activeTab === 'canvas' && (
              <div className="space-y-3">
                {/* Background Patterns */}
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Workspace Background</span>
                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 capitalize">{backgroundStyle}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {WORKSPACE_PATTERNS.map((pattern) => {
                      const isActive = backgroundStyle === pattern.id;
                      return (
                        <button
                          key={pattern.id}
                          type="button"
                          onClick={() => onChangeBackgroundStyle?.(pattern.id)}
                          className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span className="text-[11px] font-bold truncate">{pattern.name}</span>
                          {isActive && <Check className="w-3 h-3 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* App Layout Width Selection */}
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    App Container Width
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LAYOUT_WIDTH_OPTIONS.map((wOpt) => {
                      const isWidthActive = layoutWidth === wOpt.id;
                      return (
                        <button
                          key={wOpt.id}
                          type="button"
                          onClick={() => onChangeLayoutWidth?.(wOpt.id)}
                          className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isWidthActive
                              ? 'border-zinc-900 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-800 font-bold shadow-2xs ring-1 ring-zinc-900/15'
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span className="text-[11px] block text-zinc-900 dark:text-zinc-100 truncate">{wOpt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MENU BAR COLOR & STYLE */}
            {activeTab === 'menubar' && (
              <div className="space-y-3">
                {/* Surface Finish */}
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Surface Finish</span>
                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 capitalize">{menuBarStyle}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-0.5">
                    {MENU_BAR_STYLE_OPTIONS.map((styleOpt) => {
                      const isStyleActive = menuBarStyle === styleOpt.id;
                      return (
                        <button
                          key={styleOpt.id}
                          type="button"
                          onClick={() => onChangeMenuBarStyle?.(styleOpt.id)}
                          className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isStyleActive
                              ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span className="text-[11px] font-bold truncate">{styleOpt.name}</span>
                          {isStyleActive && <Check className="w-3 h-3 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Menu Bar Swatches */}
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Menu Color Shortcuts</span>
                    <span className="font-mono text-[9px] text-zinc-400">{menuBarCustomColor}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {QUICK_MENU_BAR_SWATCHES.map((sw) => {
                      const isSel = menuBarCustomColor.toLowerCase() === sw.hex.toLowerCase();
                      return (
                        <button
                          key={sw.hex}
                          type="button"
                          onClick={() => handleApplyCustomMenuBar(sw.hex)}
                          className={`flex items-center gap-1.5 p-1 rounded-md border text-left cursor-pointer transition-all ${
                            isSel
                              ? 'border-zinc-900 dark:border-zinc-300 bg-zinc-50 dark:bg-zinc-800 font-bold'
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
                          }`}
                          title={sw.name}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: sw.hex }}
                          />
                          <span className="text-[9px] truncate text-zinc-800 dark:text-zinc-200">{sw.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Menu Bar Color Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Custom Menu Bar Hex
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={menuBarCustomColor}
                        onChange={(e) => handleApplyCustomMenuBar(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      />
                      <div
                        className="w-8 h-8 rounded-xl border border-black/15 shadow-2xs flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                        style={{ backgroundColor: menuBarCustomColor }}
                      >
                        <PanelLeft className="w-3.5 h-3.5 text-white drop-shadow" />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={menuBarHexInput}
                      onChange={(e) => setMenuBarHexInput(e.target.value)}
                      onBlur={() => handleApplyCustomMenuBar(menuBarHexInput)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomMenuBar(menuBarHexInput)}
                      placeholder="#0d0f17"
                      maxLength={7}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />

                    <button
                      type="button"
                      onClick={() => handleApplyCustomMenuBar(menuBarHexInput)}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      Set
                    </button>
                  </div>
                </div>

                {/* Sync Header Bar Toggle */}
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Sync Top Header Bar</div>
                    <div className="text-[10px] text-zinc-400">Match header with menu bar</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChangeMenuBarHeaderSync?.(!menuBarHeaderSync)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      menuBarHeaderSync ? 'bg-zinc-900 dark:bg-amber-600' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                        menuBarHeaderSync ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SMOOTHNESS & SHARPNESS ENGINE (COMPACT) */}
            {activeTab === 'engine' && (
              <div className="space-y-3">
                {/* Smoothness Level */}
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Smoothness Level</span>
                    <span className="text-[10px] font-bold text-blue-600 capitalize">{smoothness}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'ultra' as const, label: 'Ultra', sub: '120Hz' },
                      { id: 'balanced' as const, label: 'Balanced', sub: 'Smooth' },
                      { id: 'fast' as const, label: 'Fast POS', sub: '0ms' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onChangeSmoothness?.(s.id)}
                        className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          smoothness === s.id
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="text-[10px] font-bold">{s.label}</div>
                        <div className="text-[8px] text-zinc-400">{s.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sharpness Level */}
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Visual Sharpness</span>
                    <span className="text-[10px] font-bold text-emerald-600 capitalize">{sharpness}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'ultra' as const, label: 'Razor', sub: 'High-DPI' },
                      { id: 'crisp' as const, label: 'Crisp', sub: 'Standard' },
                      { id: 'soft' as const, label: 'Soft', sub: 'Eyecare' },
                    ].map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => onChangeSharpness?.(sh.id)}
                        className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          sharpness === sh.id
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="text-[10px] font-bold">{sh.label}</div>
                        <div className="text-[8px] text-zinc-400">{sh.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thermal Print Sharpness */}
                <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">Thermal POS Sharpness</div>
                    <div className="text-[8px] text-zinc-400">Zero-dither barcode dots</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChangeThermalSharpness?.(thermalSharpness === 'ultra' ? 'standard' : 'ultra')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      thermalSharpness === 'ultra'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white dark:bg-zinc-800 text-zinc-600 border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {thermalSharpness === 'ultra' ? 'Ultra' : 'Standard'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL / EMBEDDED VIEW (SettingsTab & Customizer Modal)
  // -------------------------------------------------------------
  return (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform"
            style={{
              backgroundColor: customAccentColor,
              boxShadow: accentGlow ? `0 0 16px ${customAccentColor}66` : undefined,
            }}
          >
            <Palette className="w-5 h-5 drop-shadow-xs" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Custom Theme Architecture Studio</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Full Custom Studio
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Build your signature workshop terminal with Warm Sand, Daylight Light, Midnight Dark, or OLED modes, plus custom accents and canvas finishes.
            </p>
          </div>
        </div>

        {/* Mode & 1-Click Setup Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Warm Sand Setup Action */}
          <button
            type="button"
            onClick={handleApplyWarmSandSuite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Instant 1-Click Warm Sand Transformation"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
            <span>Apply Warm Sand Theme</span>
          </button>

          {/* Daylight / Warm Sand / Dark / OLED Mode Switcher Card */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
            <button
              type="button"
              onClick={() => onChangeTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                theme === 'light' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme('sepia')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isWarmSandMode ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-600/40 inline-block shadow-2xs" />
              <span>Warm Sand</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-zinc-900 text-white shadow-2xs dark:bg-zinc-700' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme('oled')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                theme === 'oled' ? 'bg-black text-white shadow-2xs border border-zinc-600' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span>OLED</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: CUSTOM BRAND ACCENT & GLOW */}
        <div className="space-y-4 p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                1. Brand Accent Color
              </h4>
            </div>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded border"
              style={{
                borderColor: `${customAccentColor}44`,
                backgroundColor: `${customAccentColor}15`,
                color: customAccentColor,
              }}
            >
              {customAccentColor}
            </span>
          </div>

          {/* Interactive Color Picker Card */}
          <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Custom Color Picker
              </label>
              <span className="text-[11px] text-zinc-400 font-mono">Instant Apply</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <input
                  type="color"
                  value={customAccentColor}
                  onChange={(e) => handleApplyCustomAccent(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                />
                <div
                  className="w-10 h-10 rounded-xl border border-black/20 shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: customAccentColor }}
                >
                  <Palette className="w-4 h-4 text-white drop-shadow" />
                </div>
              </div>

              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="text"
                  value={accentHexInput}
                  onChange={(e) => setAccentHexInput(e.target.value)}
                  onBlur={() => handleApplyCustomAccent(accentHexInput)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomAccent(accentHexInput)}
                  placeholder="#d97706"
                  maxLength={7}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCustomAccent(accentHexInput)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Quick Starter Swatches */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Color Inspiration Shortcuts
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_CUSTOM_SWATCHES.map((swatch) => {
                const isSelected = customAccentColor.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => handleApplyCustomAccent(swatch.hex)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-800 ring-1 ring-zinc-900/15 font-bold shadow-2xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/15 shadow-2xs"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-zinc-900 dark:text-zinc-200 block truncate">{swatch.name}</span>
                      <span className="text-[9px] font-mono text-zinc-400 block truncate">{swatch.hex}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ambient Accent Glow Toggle */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Ambient Accent Lighting Glow
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Radiates a soft matching neon aura behind buttons and active tabs
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleAccentGlow?.(!accentGlow)}
              className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                accentGlow ? 'bg-zinc-900 dark:bg-amber-600' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
                  accentGlow ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* COLUMN 2: WORKSPACE CANVAS & CONTAINER WIDTH */}
        <div className="space-y-4 p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                2. Workspace Canvas & Layout
              </h4>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 capitalize">
              {backgroundStyle}
            </span>
          </div>

          {/* Background Canvas Patterns (6 Custom Patterns) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Canvas Pattern Style ({WORKSPACE_PATTERNS.length} Options)
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {WORKSPACE_PATTERNS.map((pattern) => {
                const isActive = backgroundStyle === pattern.id;
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => onChangeBackgroundStyle?.(pattern.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'border-zinc-900 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-800 ring-2 ring-zinc-900/15 dark:ring-zinc-400/20 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{pattern.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />}
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{pattern.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* App Container Width */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Workbench Container Width
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_WIDTH_OPTIONS.map((wOpt) => {
                const isWidthActive = layoutWidth === wOpt.id;
                return (
                  <button
                    key={wOpt.id}
                    type="button"
                    onClick={() => onChangeLayoutWidth?.(wOpt.id)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isWidthActive
                        ? 'border-zinc-900 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-800 ring-1 ring-zinc-900/15 font-bold shadow-2xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block truncate">{wOpt.name}</span>
                    <span className="text-[10px] text-zinc-400 block truncate">{wOpt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 3: MENU BAR & SURFACE FINISH */}
        <div className="space-y-4 p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <PanelLeft className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                3. Menu Bar & Surface
              </h4>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 capitalize">
              {menuBarStyle}
            </span>
          </div>

          {/* Surface Finishes (8 Options) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Menu Bar Surface Style ({MENU_BAR_STYLE_OPTIONS.length} Finishes)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {MENU_BAR_STYLE_OPTIONS.map((styleOpt) => {
                const isStyleActive = menuBarStyle === styleOpt.id;
                return (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => onChangeMenuBarStyle?.(styleOpt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isStyleActive
                        ? 'border-zinc-900 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-800 ring-2 ring-zinc-900/15 dark:ring-zinc-400/20 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{styleOpt.name}</span>
                      {isStyleActive && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 line-clamp-1">{styleOpt.tagline}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Menu Bar Swatches */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center justify-between">
              <span>Color Inspiration</span>
              <span className="font-mono text-[10px] text-zinc-400">{menuBarCustomColor}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_MENU_BAR_SWATCHES.map((sw) => {
                const isSel = menuBarCustomColor.toLowerCase() === sw.hex.toLowerCase();
                return (
                  <button
                    key={sw.hex}
                    type="button"
                    onClick={() => handleApplyCustomMenuBar(sw.hex)}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSel
                        ? 'border-zinc-900 dark:border-zinc-300 bg-zinc-50 dark:bg-zinc-800 font-bold shadow-2xs'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                    title={sw.name}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: sw.hex }}
                    />
                    <span className="text-[10px] truncate text-zinc-800 dark:text-zinc-200">{sw.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Menu Bar Color Picker */}
          <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Menu Bar Custom Hex
              </label>
              <span className="text-[11px] font-mono text-zinc-400">{menuBarCustomColor}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <input
                  type="color"
                  value={menuBarCustomColor}
                  onChange={(e) => handleApplyCustomMenuBar(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                />
                <div
                  className="w-10 h-10 rounded-xl border border-black/20 shadow-sm flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: menuBarCustomColor }}
                >
                  <PanelLeft className="w-4 h-4 text-white drop-shadow" />
                </div>
              </div>

              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="text"
                  value={menuBarHexInput}
                  onChange={(e) => setMenuBarHexInput(e.target.value)}
                  onBlur={() => handleApplyCustomMenuBar(menuBarHexInput)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomMenuBar(menuBarHexInput)}
                  placeholder="#0d0f17"
                  maxLength={7}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCustomMenuBar(menuBarHexInput)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Sync Header Bar Toggle */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Sync Top Header Bar
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Apply menu bar color and finish to the top navigation header
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChangeMenuBarHeaderSync?.(!menuBarHeaderSync)}
              className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                menuBarHeaderSync ? 'bg-zinc-900 dark:bg-amber-600' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
                  menuBarHeaderSync ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. SMOOTHNESS & SHARPNESS ENGINE CONTROLS */}
      <SmoothnessSharpnessPanel
        smoothness={smoothness}
        sharpness={sharpness}
        thermalSharpness={thermalSharpness}
        onChangeSmoothness={onChangeSmoothness || (() => {})}
        onChangeSharpness={onChangeSharpness || (() => {})}
        onChangeThermalSharpness={onChangeThermalSharpness}
      />

      {/* LIVE INTERACTIVE THEME PREVIEW CARD */}
      <div className="p-5 rounded-2xl bg-zinc-900 text-white shadow-xl border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Live Theme Architecture Preview
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Accent: {customAccentColor} • Canvas: {backgroundStyle} • Menu: {menuBarCustomColor} ({menuBarStyle})
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-wrap items-center gap-3">
          {/* Custom Accent Button */}
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-transform shadow-md cursor-pointer"
            style={{
              backgroundColor: customAccentColor,
              boxShadow: accentGlow ? `0 0 16px ${customAccentColor}66` : undefined,
            }}
          >
            Custom Brand Action
          </button>

          {/* Custom Badge */}
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
            style={{
              backgroundColor: `${customAccentColor}22`,
              borderColor: `${customAccentColor}55`,
              color: '#ffffff',
            }}
          >
            Active Badge
          </span>

          {/* Custom Menu Bar Preview Swatch */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium"
            style={{
              backgroundColor: menuBarCustomColor,
              borderColor: `${customAccentColor}66`,
            }}
          >
            <PanelLeft className="w-3.5 h-3.5" style={{ color: customAccentColor }} />
            <span>Menu Bar Surface</span>
          </div>

          <span className="text-xs text-zinc-400 ml-auto hidden sm:inline">
            Mode: {isWarmSandMode ? 'Warm Sand & Parchment' : isOledMode ? 'OLED Pitch Black' : isDarkMode ? 'Dark' : 'Light'} • Width: {layoutWidth}
          </span>
        </div>
      </div>
    </div>
  );
};
