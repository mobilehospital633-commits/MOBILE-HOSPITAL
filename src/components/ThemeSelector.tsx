import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Check,
  Compass,
  Coffee,
  Leaf,
  Zap,
  Clock,
  Sparkles,
  Flame,
  Droplets,
  Sliders,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { ThemeMode, ThemeAccent } from '../types';
import {
  PRESET_ACCENTS,
  getSolarPhaseInfo,
  resolveAccentColors,
  SolarPhaseInfo,
} from '../utils/themeUtils';

interface ThemeSelectorProps {
  theme?: ThemeMode;
  accent?: ThemeAccent;
  customAccentColor?: string;
  accentGlow?: boolean;
  onChangeTheme: (theme: ThemeMode) => void;
  onChangeAccent: (accent: ThemeAccent) => void;
  onChangeCustomAccent?: (hex: string) => void;
  onToggleAccentGlow?: (enabled: boolean) => void;
  compact?: boolean;
}

export interface ThemeCategory {
  categoryName: string;
  options: ThemeOption[];
}

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  tagline: string;
  desc: string;
  badge: string;
  category: 'dynamic' | 'daylight' | 'dark';
  iconBg: string;
  textColor: string;
  previewBg: string;
  previewCard: string;
  previewText: string;
  previewBorder: string;
}

export const THEME_MODES: ThemeOption[] = [
  // Dynamic Adaptive
  {
    id: 'solar',
    name: 'Dynamic Solar (Time-Adaptive)',
    tagline: '24-Hour Cycle Auto Shift',
    desc: 'Automatically shifts through Morning Glacier, Midday White, Golden Sand, and Midnight Navy based on your clock.',
    badge: 'Adaptive',
    category: 'dynamic',
    iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    textColor: 'text-amber-500',
    previewBg: '#0b1120',
    previewCard: '#0f172a',
    previewText: '#f8fafc',
    previewBorder: '#1e293b',
  },
  {
    id: 'system',
    name: 'System Auto (OS Sync)',
    tagline: 'Matches Computer OS',
    desc: 'Automatically synchronizes with your device or operating system light/dark preference in real time.',
    badge: 'OS Auto',
    category: 'dynamic',
    iconBg: 'bg-zinc-100 border-zinc-200 text-zinc-700',
    textColor: 'text-zinc-600',
    previewBg: '#fafafa',
    previewCard: '#ffffff',
    previewText: '#18181b',
    previewBorder: '#e4e4e7',
  },

  // Daylight & High Clarity
  {
    id: 'light',
    name: 'Daylight White',
    tagline: 'Clean & Crisp',
    desc: 'Crisp, high-contrast daytime workshop display with maximum clarity under bench lamps.',
    badge: 'Daylight',
    category: 'daylight',
    iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
    textColor: 'text-amber-600',
    previewBg: '#fafafa',
    previewCard: '#ffffff',
    previewText: '#18181b',
    previewBorder: '#e4e4e7',
  },
  {
    id: 'glacier',
    name: 'Arctic Glacier',
    tagline: 'Frost Light Slate',
    desc: 'Cool icy light slate with frost blue undertones that enhances screen contrast and parts readability.',
    badge: 'Glacier',
    category: 'daylight',
    iconBg: 'bg-cyan-50 border-cyan-200 text-cyan-600',
    textColor: 'text-cyan-600',
    previewBg: '#f1f5f9',
    previewCard: '#ffffff',
    previewText: '#0f172a',
    previewBorder: '#cbd5e1',
  },
  {
    id: 'sepia',
    name: 'Warm Sand (Sepia)',
    tagline: 'Eye-Safe Paper',
    desc: 'Soft warm parchment tone that filters harsh blue-light glare during lengthy diagnosis & micro-soldering.',
    badge: 'Warm',
    category: 'daylight',
    iconBg: 'bg-amber-100/70 border-amber-300 text-amber-800',
    textColor: 'text-amber-700',
    previewBg: '#fbf7ee',
    previewCard: '#fffdf7',
    previewText: '#2e2820',
    previewBorder: '#e7dcce',
  },

  // Evening & Bench Dark
  {
    id: 'dark',
    name: 'OLED Charcoal',
    tagline: 'Balanced Workshop Slate',
    desc: 'Deep graphite charcoal canvas balanced for evening repairs and comfortable workbench focus.',
    badge: 'Charcoal',
    category: 'dark',
    iconBg: 'bg-zinc-800 border-zinc-700 text-zinc-200',
    textColor: 'text-zinc-300',
    previewBg: '#09090b',
    previewCard: '#18181b',
    previewText: '#f4f4f5',
    previewBorder: '#27272a',
  },
  {
    id: 'oled',
    name: 'True Black 100% OLED',
    tagline: 'Pitch Black Zero Power',
    desc: 'Absolute 100% true pitch black (#000000) for OLED/AMOLED counter displays with razor-sharp contrast.',
    badge: 'True OLED',
    category: 'dark',
    iconBg: 'bg-black border-zinc-800 text-white',
    textColor: 'text-white',
    previewBg: '#000000',
    previewCard: '#0a0a0a',
    previewText: '#ffffff',
    previewBorder: '#262626',
  },
  {
    id: 'midnight',
    name: 'Midnight Navy',
    tagline: 'Aerospace Deep Indigo',
    desc: 'Deep navy indigo slate designed for long night shifts, reducing optical fatigue.',
    badge: 'Midnight',
    category: 'dark',
    iconBg: 'bg-blue-950/80 border-blue-800 text-blue-400',
    textColor: 'text-blue-400',
    previewBg: '#0b1120',
    previewCard: '#0f172a',
    previewText: '#f8fafc',
    previewBorder: '#1e293b',
  },
  {
    id: 'amethyst',
    name: 'Nebula Amethyst',
    tagline: 'Obsidian & Royal Violet',
    desc: 'Deep royal obsidian dark theme with luminous violet highlights and tech aesthetics.',
    badge: 'Amethyst',
    category: 'dark',
    iconBg: 'bg-purple-950/80 border-purple-800 text-purple-400',
    textColor: 'text-purple-400',
    previewBg: '#0c0714',
    previewCard: '#150d24',
    previewText: '#f5f3ff',
    previewBorder: '#2b1c48',
  },
  {
    id: 'sunset',
    name: 'Amber Sunset Twilight',
    tagline: 'Copper & Warm Twilight',
    desc: 'Atmospheric twilight slate with warm amber and copper undertones for cozy workshop ambiance.',
    badge: 'Sunset',
    category: 'dark',
    iconBg: 'bg-orange-950/80 border-orange-800 text-orange-400',
    textColor: 'text-orange-400',
    previewBg: '#140d09',
    previewCard: '#20140e',
    previewText: '#fff7ed',
    previewBorder: '#3b261c',
  },
  {
    id: 'forest',
    name: 'Nordic Forest',
    tagline: 'Pine & Botanical',
    desc: 'Deep botanical dark slate with calming emerald accents and organic clarity.',
    badge: 'Forest',
    category: 'dark',
    iconBg: 'bg-emerald-950/80 border-emerald-800 text-emerald-400',
    textColor: 'text-emerald-400',
    previewBg: '#06140e',
    previewCard: '#0d2118',
    previewText: '#ecfdf5',
    previewBorder: '#183c2d',
  },
  {
    id: 'cyber',
    name: 'Cyber Carbon',
    tagline: 'Matrix High-Tech Slate',
    desc: 'Futuristic high-tech carbon matrix with cyan luminescent accents and high density.',
    badge: 'Cyber',
    category: 'dark',
    iconBg: 'bg-cyan-950/80 border-cyan-800 text-cyan-400',
    textColor: 'text-cyan-400',
    previewBg: '#090d16',
    previewCard: '#101726',
    previewText: '#e2e8f0',
    previewBorder: '#1f2d4a',
  },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  theme = 'light',
  accent = 'slate',
  customAccentColor = '#2563eb',
  accentGlow = true,
  onChangeTheme,
  onChangeAccent,
  onChangeCustomAccent,
  onToggleAccentGlow,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'themes' | 'accents'>('themes');
  const [customHexInput, setCustomHexInput] = useState(customAccentColor);
  const [solarInfo, setSolarInfo] = useState<SolarPhaseInfo>(getSolarPhaseInfo());
  const menuRef = useRef<HTMLDivElement>(null);

  // Update solar clock status
  useEffect(() => {
    const updateSolar = () => setSolarInfo(getSolarPhaseInfo());
    const interval = setInterval(updateSolar, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync customHexInput when customAccentColor changes
  useEffect(() => {
    if (customAccentColor) setCustomHexInput(customAccentColor);
  }, [customAccentColor]);

  // Close dropdown on outside click
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

  const renderIcon = (mode?: ThemeMode | string, className = 'w-3.5 h-3.5') => {
    switch (mode) {
      case 'solar':
        return <Clock className={className} />;
      case 'glacier':
        return <Droplets className={className} />;
      case 'amethyst':
        return <Sparkles className={className} />;
      case 'sunset':
        return <Flame className={className} />;
      case 'oled':
        return <Moon className={className} />;
      case 'dark':
        return <Moon className={className} />;
      case 'midnight':
        return <Compass className={className} />;
      case 'sepia':
        return <Coffee className={className} />;
      case 'forest':
        return <Leaf className={className} />;
      case 'cyber':
        return <Zap className={className} />;
      case 'system':
        return <Monitor className={className} />;
      default:
        return <Sun className={className} />;
    }
  };

  const currentThemeObj = THEME_MODES.find((m) => m.id === theme) || THEME_MODES[0];
  const accentDetails = resolveAccentColors(accent, customHexInput);

  const handleCustomColorApply = (hex: string) => {
    setCustomHexInput(hex);
    if (onChangeCustomAccent) {
      onChangeCustomAccent(hex);
    }
    onChangeAccent('custom');
  };

  // Compact Header Bar Mode
  if (compact) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`Theme: ${currentThemeObj.name}. Click to change theme or accent.`}
          className="bg-white hover:bg-zinc-50 text-zinc-700 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors border border-zinc-200 hover:border-zinc-300 active:scale-98 cursor-pointer shadow-2xs"
        >
          <span className={currentThemeObj.textColor}>{renderIcon(theme, 'w-3.5 h-3.5')}</span>
          <span className="hidden sm:inline capitalize">{currentThemeObj.badge}</span>
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15 shadow-2xs transition-colors"
            style={{ backgroundColor: accentDetails.color }}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] flex flex-col">
            {/* Header with Title and Mode Switcher */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: accentDetails.color }}
                >
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-tight">Theme & Appearance</h4>
                  <p className="text-[10px] text-zinc-400">
                    {currentThemeObj.badge} • {accent === 'custom' ? customHexInput : accent}
                  </p>
                </div>
              </div>

              {/* Quick Tabs: Themes vs Accents */}
              <div className="flex items-center p-0.5 bg-zinc-100 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('themes')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'themes'
                      ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Themes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('accents')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'accents'
                      ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Accents
                </button>
              </div>
            </div>

            {/* Solar Info Pill if Solar active */}
            {theme === 'solar' && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-medium">
                    Solar Phase: <strong className="font-bold">{solarInfo.label}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900">
                  {solarInfo.timeString}
                </span>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto pr-1 space-y-3 flex-1 max-h-96">
              {activeTab === 'themes' ? (
                <>
                  {/* Dynamic Adaptive Group */}
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Adaptive & Auto (2)
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {THEME_MODES.filter((m) => m.category === 'dynamic').map((item) => {
                        const isActive = theme === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onChangeTheme(item.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-zinc-900 border-zinc-900 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                isActive ? 'bg-zinc-800 border-zinc-700 text-white' : item.iconBg
                              }`}
                            >
                              {renderIcon(item.id, 'w-3.5 h-3.5')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold truncate">{item.name}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              </div>
                              <p
                                className={`text-[10px] truncate leading-tight mt-0.5 ${
                                  isActive ? 'text-zinc-300' : 'text-zinc-500'
                                }`}
                              >
                                {item.desc}
                              </p>
                            </div>
                            {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daylight & Clarity Group */}
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Daylight & High-Clarity (3)
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {THEME_MODES.filter((m) => m.category === 'daylight').map((item) => {
                        const isActive = theme === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onChangeTheme(item.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-zinc-900 border-zinc-900 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                isActive ? 'bg-zinc-800 border-zinc-700 text-white' : item.iconBg
                              }`}
                            >
                              {renderIcon(item.id, 'w-3.5 h-3.5')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold truncate">{item.name}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              </div>
                              <p
                                className={`text-[10px] truncate leading-tight mt-0.5 ${
                                  isActive ? 'text-zinc-300' : 'text-zinc-500'
                                }`}
                              >
                                {item.tagline}
                              </p>
                            </div>
                            {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Evening & Dark Group */}
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Bench & Night Dark (7)
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {THEME_MODES.filter((m) => m.category === 'dark').map((item) => {
                        const isActive = theme === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onChangeTheme(item.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-zinc-900 border-zinc-900 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                isActive ? 'bg-zinc-800 border-zinc-700 text-white' : item.iconBg
                              }`}
                            >
                              {renderIcon(item.id, 'w-3.5 h-3.5')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold truncate">{item.name}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              </div>
                              <p
                                className={`text-[10px] truncate leading-tight mt-0.5 ${
                                  isActive ? 'text-zinc-300' : 'text-zinc-500'
                                }`}
                              >
                                {item.tagline}
                              </p>
                            </div>
                            {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Preset Accents Palette */}
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Curated Accent Colors ({PRESET_ACCENTS.length})</span>
                      <span className="text-[10px] font-semibold text-zinc-600 capitalize">
                        {accent === 'custom' ? 'Custom' : accent}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRESET_ACCENTS.map((item) => {
                        const isActive = accent === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onChangeAccent(item.id)}
                            title={item.name}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] transition-all cursor-pointer border ${
                              isActive
                                ? 'border-zinc-900 bg-zinc-50 font-bold text-zinc-900 shadow-2xs ring-1 ring-zinc-900/20'
                                : 'border-zinc-200 hover:bg-zinc-50 text-zinc-600'
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full shrink-0 shadow-2xs border border-black/15 flex items-center justify-center text-white transition-transform active:scale-95"
                              style={{ backgroundColor: item.color }}
                            >
                              {isActive && <Check className="w-3 h-3 text-white stroke-[3]" />}
                            </span>
                            <span className="truncate w-full text-center text-[10px]">
                              {item.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Hex Color Picker */}
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Custom Dynamic Hex Color</span>
                      </span>
                      {accent === 'custom' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative cursor-pointer shrink-0">
                        <input
                          type="color"
                          value={customHexInput.startsWith('#') ? customHexInput : '#2563eb'}
                          onChange={(e) => handleCustomColorApply(e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-8 h-8 rounded-lg border border-black/20 shadow-2xs flex items-center justify-center text-white transition-transform hover:scale-105"
                          style={{ backgroundColor: customHexInput }}
                        >
                          <Palette className="w-4 h-4 drop-shadow" />
                        </div>
                      </label>
                      <input
                        type="text"
                        value={customHexInput}
                        onChange={(e) => setCustomHexInput(e.target.value)}
                        onBlur={() => {
                          if (/^#([0-9A-F]{3}){1,2}$/i.test(customHexInput)) {
                            handleCustomColorApply(customHexInput);
                          }
                        }}
                        placeholder="#2563eb"
                        maxLength={7}
                        className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 bg-white uppercase text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleCustomColorApply(customHexInput)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Ambient Accent Glow Toggle */}
                  {onToggleAccentGlow && (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-white">
                      <div>
                        <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Ambient Accent Glow</span>
                        </span>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Subtle luminous lighting on primary buttons and indicators
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleAccentGlow(!accentGlow)}
                        className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                          accentGlow ? 'bg-zinc-900' : 'bg-zinc-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                            accentGlow ? 'right-1' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Summary */}
            <div className="pt-2.5 mt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
              <span>{THEME_MODES.length} Themes • 12+ Colors</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-zinc-900 hover:text-zinc-600 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Expanded View for Settings Tab
  return (
    <div className="space-y-6">
      {/* Live Terminal Preview Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-200/80">
          <div>
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-700" />
              <span>Real-Time Interactive Theme & Accent Preview</span>
            </span>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Live simulation of buttons, status chips, order cards, and workbench contrast.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-600 px-2.5 py-1 rounded-full bg-white border border-zinc-200 shadow-2xs">
              Theme: <strong className="text-zinc-900 capitalize">{currentThemeObj.name}</strong>
            </span>
            <span
              className="text-[11px] font-semibold text-white px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1.5"
              style={{ backgroundColor: accentDetails.color }}
            >
              <span className="w-2 h-2 rounded-full bg-white/80" />
              <span className="capitalize">{accent === 'custom' ? customHexInput : accent}</span>
            </span>
          </div>
        </div>

        {/* Miniature Workbench Card Simulation */}
        <div
          className="rounded-xl p-4 border transition-all duration-200 shadow-xs"
          style={{
            backgroundColor: currentThemeObj.previewBg,
            borderColor: currentThemeObj.previewBorder,
            color: currentThemeObj.previewText,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/10">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs"
                style={{
                  backgroundColor: accentDetails.color,
                  color: accentDetails.textColor,
                }}
              >
                MH
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-2">
                  <span>#T-1008 • iPhone 15 Pro Max</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: accentDetails.lightBg,
                      color: currentThemeObj.category === 'dark' ? accentDetails.textColorDark : accentDetails.color,
                      border: `1px solid ${accentDetails.borderRgba}`,
                    }}
                  >
                    In Progress
                  </span>
                </div>
                <div className="text-[11px] opacity-70 mt-0.5">
                  Customer: Johnathan Doe • Cracked AMOLED Display & Housing
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-mono font-bold">₹4,999.00</span>
              <button
                type="button"
                className="theme-primary-btn px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs"
                style={{
                  backgroundColor: accentDetails.color,
                  color: accentDetails.textColor,
                }}
              >
                View Ticket
              </button>
            </div>
          </div>

          {theme === 'solar' && (
            <div className="pt-2.5 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 opacity-80">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Dynamic Solar Phase: <strong>{solarInfo.label}</strong> ({solarInfo.desc})
                </span>
              </span>
              <span className="font-mono font-bold opacity-75">{solarInfo.timeString}</span>
            </div>
          )}
        </div>
      </div>

      {/* Theme Modes Selection (12 Curated Themes) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Display Theme Archetypes ({THEME_MODES.length} Curated Modes)
          </label>
          <span className="text-xs text-zinc-500 font-medium">
            Active: <strong className="text-zinc-900 capitalize">{currentThemeObj.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_MODES.map((item) => {
            const isActive = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTheme(item.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/15 shadow-xs'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50/70'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${item.iconBg}`}
                >
                  {renderIcon(item.id, 'w-4 h-4')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-zinc-900 truncate">
                      {item.name}
                    </span>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white shrink-0">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-medium uppercase">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-zinc-500 mt-0.5">
                    {item.tagline}
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-snug mt-1 line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color Palette & Custom Hex */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Accent Color Highlights & Custom Hex ({PRESET_ACCENTS.length}+ Accents)
          </label>
          <span className="text-xs text-zinc-500 font-medium">
            Active: <strong className="text-zinc-900 capitalize">{accent === 'custom' ? customHexInput : accent}</strong>
          </span>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mb-3">
          {PRESET_ACCENTS.map((item) => {
            const isActive = accent === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeAccent(item.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border-zinc-900 bg-zinc-50 font-semibold text-zinc-900 ring-2 ring-zinc-900/10 shadow-xs'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-black/15 flex items-center justify-center text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {isActive && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">{item.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{item.color}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Color Picker & Ambient Glow Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Custom Color Card */}
          <div className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer shrink-0">
                <input
                  type="color"
                  value={customHexInput.startsWith('#') ? customHexInput : '#2563eb'}
                  onChange={(e) => handleCustomColorApply(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <div
                  className="w-9 h-9 rounded-xl border border-black/15 shadow-2xs flex items-center justify-center text-white transition-transform hover:scale-105"
                  style={{ backgroundColor: customHexInput }}
                >
                  <Palette className="w-4 h-4 drop-shadow" />
                </div>
              </label>
              <div>
                <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <span>Custom Workshop Hex Accent</span>
                  {accent === 'custom' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  Pick any custom color for your shop branding
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={customHexInput}
                onChange={(e) => setCustomHexInput(e.target.value)}
                onBlur={() => {
                  if (/^#([0-9A-F]{3}){1,2}$/i.test(customHexInput)) {
                    handleCustomColorApply(customHexInput);
                  }
                }}
                placeholder="#2563eb"
                maxLength={7}
                className="w-24 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 bg-zinc-50 uppercase text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <button
                type="button"
                onClick={() => handleCustomColorApply(customHexInput)}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                Set
              </button>
            </div>
          </div>

          {/* Ambient Accent Glow Switch */}
          {onToggleAccentGlow && (
            <div className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">
                    Ambient Accent Glow Lighting
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Adds subtle atmospheric glow to primary workshop action buttons
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleAccentGlow(!accentGlow)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  accentGlow ? 'bg-zinc-900' : 'bg-zinc-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                    accentGlow ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
