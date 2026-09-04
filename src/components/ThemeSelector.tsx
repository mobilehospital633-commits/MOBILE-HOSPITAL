import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';
import { ThemeMode, ThemeAccent } from '../types';

interface ThemeSelectorProps {
  theme?: ThemeMode;
  accent?: ThemeAccent;
  onChangeTheme: (theme: ThemeMode) => void;
  onChangeAccent: (accent: ThemeAccent) => void;
  compact?: boolean;
}

const ACCENT_OPTIONS: { id: ThemeAccent; name: string; color: string; badge: string }[] = [
  { id: 'slate', name: 'Classic Slate', color: '#18181b', badge: 'bg-zinc-800' },
  { id: 'emerald', name: 'Emerald Tech', color: '#059669', badge: 'bg-emerald-600' },
  { id: 'cobalt', name: 'Cobalt Blue', color: '#2563eb', badge: 'bg-blue-600' },
  { id: 'amber', name: 'Amber Gold', color: '#d97706', badge: 'bg-amber-600' },
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

  const currentIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="w-3.5 h-3.5 text-zinc-300" />;
      case 'system':
        return <Monitor className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const themeLabel = () => {
    switch (theme) {
      case 'dark':
        return 'Dark';
      case 'system':
        return 'Auto';
      default:
        return 'Light';
    }
  };

  if (compact) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`Active Theme: ${themeLabel()} (${accent}). Click to change theme.`}
          className="bg-white hover:bg-zinc-50 text-zinc-700 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors border border-zinc-200 hover:border-zinc-300 active:scale-98 cursor-pointer shadow-2xs"
        >
          {currentIcon()}
          <span className="hidden sm:inline capitalize">{themeLabel()}</span>
          <span
            className="w-2 h-2 rounded-full shrink-0 border border-black/10"
            style={{
              backgroundColor:
                ACCENT_OPTIONS.find((a) => a.id === accent)?.color || '#18181b',
            }}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-zinc-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-600" />
                <span>Theme & Appearance</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {theme.toUpperCase()}
              </span>
            </div>

            {/* Mode selection buttons */}
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Display Mode
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => {
                  onChangeTheme('light');
                  setIsOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  theme === 'light'
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-900 font-semibold shadow-2xs'
                    : 'border-transparent text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onChangeTheme('dark');
                  setIsOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 text-white font-semibold shadow-2xs'
                    : 'border-transparent text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Moon className="w-4 h-4 text-zinc-300" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onChangeTheme('system');
                  setIsOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  theme === 'system'
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-900 font-semibold shadow-2xs'
                    : 'border-transparent text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Monitor className="w-4 h-4 text-zinc-600" />
                <span>Auto</span>
              </button>
            </div>

            {/* Accent Selection */}
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Accent Color
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ACCENT_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeAccent(item.id)}
                  className={`flex items-center gap-2 p-1.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                    accent === item.id
                      ? 'border-zinc-300 bg-zinc-50 font-semibold text-zinc-900'
                      : 'border-transparent text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate flex-1 text-left">{item.name}</span>
                  {accent === item.id && (
                    <Check className="w-3 h-3 text-zinc-800 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Layout for Settings Tab
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Color Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => onChangeTheme('light')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10 shadow-xs'
                : 'border-zinc-200 bg-white hover:bg-zinc-50/50'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900">Light Mode</span>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-zinc-900" />}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Crisp, clean high-contrast daytime workshop display.
              </p>
            </div>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => onChangeTheme('dark')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-zinc-900 bg-zinc-900 text-white ring-2 ring-zinc-900/10 shadow-xs'
                : 'border-zinc-200 bg-white hover:bg-zinc-50/50'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4 text-zinc-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  Dark Mode
                </span>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <p
                className={`text-[11px] mt-0.5 ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                Deep OLED charcoal canvas for evening and bench repairs.
              </p>
            </div>
          </button>

          {/* System Theme Card */}
          <button
            type="button"
            onClick={() => onChangeTheme('system')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10 shadow-xs'
                : 'border-zinc-200 bg-white hover:bg-zinc-50/50'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
              <Monitor className="w-4 h-4 text-zinc-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900">System Auto</span>
                {theme === 'system' && <Check className="w-3.5 h-3.5 text-zinc-900" />}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Automatically matches your device or OS color scheme.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Accent selection */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Accent Color Highlight
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ACCENT_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeAccent(item.id)}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                accent === item.id
                  ? 'border-zinc-900 bg-zinc-50 font-semibold text-zinc-900 ring-1 ring-zinc-900/10'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-black/10"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs truncate flex-1">{item.name}</span>
              {accent === item.id && (
                <Check className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
