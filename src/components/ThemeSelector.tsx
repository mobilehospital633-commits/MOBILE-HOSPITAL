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
} from 'lucide-react';
import { ThemeMode, ThemeAccent } from '../types';

interface ThemeSelectorProps {
  theme?: ThemeMode;
  accent?: ThemeAccent;
  onChangeTheme: (theme: ThemeMode) => void;
  onChangeAccent: (accent: ThemeAccent) => void;
  compact?: boolean;
}

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  tagline: string;
  desc: string;
  badge: string;
  iconBg: string;
  textColor: string;
  isDarkFamily: boolean;
}

export const THEME_MODES: ThemeOption[] = [
  {
    id: 'light',
    name: 'Daylight White',
    tagline: 'Clean & Crisp',
    desc: 'Crisp, clean high-contrast daytime workshop display.',
    badge: 'Light',
    iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
    textColor: 'text-amber-500',
    isDarkFamily: false,
  },
  {
    id: 'dark',
    name: 'OLED Charcoal',
    tagline: 'Deep Bench Contrast',
    desc: 'Deep OLED charcoal canvas for evening and bench repairs.',
    badge: 'Dark',
    iconBg: 'bg-zinc-800 border-zinc-700 text-zinc-200',
    textColor: 'text-zinc-300',
    isDarkFamily: true,
  },
  {
    id: 'midnight',
    name: 'Midnight Navy',
    tagline: 'Aerospace Indigo',
    desc: 'Deep navy indigo slate that reduces eye strain during long sessions.',
    badge: 'Navy',
    iconBg: 'bg-blue-950/80 border-blue-800 text-blue-400',
    textColor: 'text-blue-400',
    isDarkFamily: true,
  },
  {
    id: 'sepia',
    name: 'Warm Sand',
    tagline: 'Eye-Safe Paper',
    desc: 'Soft warm cream & parchment tone that eliminates harsh blue-light glare.',
    badge: 'Warm',
    iconBg: 'bg-amber-100/70 border-amber-300 text-amber-800',
    textColor: 'text-amber-700',
    isDarkFamily: false,
  },
  {
    id: 'forest',
    name: 'Nordic Forest',
    tagline: 'Pine & Botanical',
    desc: 'Deep pine & botanical dark slate with calming emerald tones.',
    badge: 'Forest',
    iconBg: 'bg-emerald-950/80 border-emerald-800 text-emerald-400',
    textColor: 'text-emerald-400',
    isDarkFamily: true,
  },
  {
    id: 'cyber',
    name: 'Cyber Carbon',
    tagline: 'High-Tech Matrix',
    desc: 'Futuristic dark slate carbon with tech contrast & sharp readability.',
    badge: 'Cyber',
    iconBg: 'bg-cyan-950/80 border-cyan-800 text-cyan-400',
    textColor: 'text-cyan-400',
    isDarkFamily: true,
  },
  {
    id: 'system',
    name: 'System Auto',
    tagline: 'Matches Device OS',
    desc: 'Automatically matches your device or OS color scheme.',
    badge: 'Auto',
    iconBg: 'bg-zinc-100 border-zinc-200 text-zinc-700',
    textColor: 'text-zinc-600',
    isDarkFamily: false,
  },
];

export const ACCENT_OPTIONS: { id: ThemeAccent; name: string; color: string; badge: string }[] = [
  { id: 'slate', name: 'Classic Slate', color: '#18181b', badge: 'bg-zinc-800' },
  { id: 'emerald', name: 'Emerald Tech', color: '#059669', badge: 'bg-emerald-600' },
  { id: 'cobalt', name: 'Cobalt Blue', color: '#2563eb', badge: 'bg-blue-600' },
  { id: 'amber', name: 'Amber Gold', color: '#d97706', badge: 'bg-amber-600' },
  { id: 'rose', name: 'Ruby Rose', color: '#e11d48', badge: 'bg-rose-600' },
  { id: 'violet', name: 'Electric Violet', color: '#7c3aed', badge: 'bg-purple-600' },
  { id: 'cyan', name: 'Cyber Cyan', color: '#0891b2', badge: 'bg-cyan-600' },
  { id: 'orange', name: 'Flame Orange', color: '#ea580c', badge: 'bg-orange-600' },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  theme = 'light',
  accent = 'slate',
  onChangeTheme,
  onChangeAccent,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
  const currentAccentObj = ACCENT_OPTIONS.find((a) => a.id === accent) || ACCENT_OPTIONS[0];

  if (compact) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`Theme: ${currentThemeObj.name} (${currentAccentObj.name}). Click to change.`}
          className="bg-white hover:bg-zinc-50 text-zinc-700 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors border border-zinc-200 hover:border-zinc-300 active:scale-98 cursor-pointer shadow-2xs"
        >
          <span className={currentThemeObj.textColor}>{renderIcon(theme, 'w-3.5 h-3.5')}</span>
          <span className="hidden sm:inline capitalize">{currentThemeObj.badge}</span>
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15 shadow-2xs"
            style={{ backgroundColor: currentAccentObj.color }}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-zinc-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-600" />
                <span>Theme & Appearance</span>
              </span>
              <span className="text-[10px] text-zinc-600 font-semibold px-2 py-0.5 rounded-full bg-zinc-100">
                {currentThemeObj.badge} • {currentAccentObj.name.split(' ')[0]}
              </span>
            </div>

            {/* Display Themes */}
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Display Theme ({THEME_MODES.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-3.5 max-h-56 overflow-y-auto pr-0.5">
              {THEME_MODES.map((item) => {
                const isActive = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChangeTheme(item.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer border ${
                      isActive
                        ? 'bg-zinc-900 border-zinc-900 text-white font-semibold shadow-2xs'
                        : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border text-[11px] ${
                        isActive
                          ? 'bg-zinc-800 border-zinc-700 text-white'
                          : `${item.iconBg}`
                      }`}
                    >
                      {renderIcon(item.id, 'w-3 h-3')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold leading-tight">{item.badge}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-zinc-300' : 'text-zinc-400'
                        }`}
                      >
                        {item.tagline}
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Accent Selection */}
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Accent Highlight ({ACCENT_OPTIONS.length} Colors)
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {ACCENT_OPTIONS.map((item) => {
                const isActive = accent === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeAccent(item.id)}
                    title={item.name}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[11px] transition-all cursor-pointer border ${
                      isActive
                        ? 'border-zinc-900 bg-zinc-50 font-bold text-zinc-900 shadow-2xs ring-1 ring-zinc-900/10'
                        : 'border-zinc-200 hover:bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-black/15 flex items-center justify-center text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {isActive && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </span>
                    <span className="truncate w-full text-center text-[10px]">
                      {item.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Layout for Settings Tab
  return (
    <div className="space-y-6">
      {/* Theme Modes Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Select Workshop Display Theme ({THEME_MODES.length} Curated Styles)
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
                    ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10 shadow-xs'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50/60'
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
                      <span className="text-[10px] text-zinc-400 font-medium">
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

      {/* Accent selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Accent Color Highlights ({ACCENT_OPTIONS.length} Colors)
          </label>
          <span className="text-xs text-zinc-500 font-medium">
            Active: <strong className="text-zinc-900 capitalize">{currentAccentObj.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACCENT_OPTIONS.map((item) => {
            const isActive = accent === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeAccent(item.id)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
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
                  <div className="text-xs font-semibold truncate text-zinc-900">{item.name}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{item.color}</div>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-zinc-900 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
