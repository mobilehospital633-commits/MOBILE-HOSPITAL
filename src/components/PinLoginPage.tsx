import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Lock,
  Shield,
  KeyRound,
  Delete,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Sun,
  Moon,
  Sparkles,
  Clock,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { ShopProfile, ThemeMode, ThemeAccent } from '../types';
import { MHLogo } from './MHLogo';
import { ThemeSelector } from './ThemeSelector';

interface PinLoginPageProps {
  profile: ShopProfile;
  onUnlock: () => void;
  onOpenPinSetup: () => void;
  onChangeTheme?: (theme: ThemeMode) => void;
  onChangeAccent?: (accent: ThemeAccent) => void;
  onChangeCustomAccent?: (hex: string) => void;
  onToggleAccentGlow?: (enabled: boolean) => void;
  onSaveProfile?: (profile: ShopProfile) => void;
}

interface ColorPaletteOption {
  id: string;
  name: string;
  themeMode: ThemeMode;
  accent: ThemeAccent;
  bgHex: string;
  cardHex: string;
  accentHex: string;
  glowHex: string;
  isLight: boolean;
  borderHex: string;
}

const COLOR_PALETTES: ColorPaletteOption[] = [
  {
    id: 'cyber-blue',
    name: 'Cyber Cobalt',
    themeMode: 'dark',
    accent: 'cobalt',
    bgHex: '#080d1a',
    cardHex: '#0d1527',
    accentHex: '#3b82f6',
    glowHex: 'rgba(59, 130, 246, 0.35)',
    isLight: false,
    borderHex: '#1e293b',
  },
  {
    id: 'emerald-tech',
    name: 'Emerald Tech',
    themeMode: 'dark',
    accent: 'emerald',
    bgHex: '#05130d',
    cardHex: '#0a1e16',
    accentHex: '#10b981',
    glowHex: 'rgba(16, 185, 129, 0.35)',
    isLight: false,
    borderHex: '#134e38',
  },
  {
    id: 'titanium-gold',
    name: 'Amber Gold',
    themeMode: 'dark',
    accent: 'amber',
    bgHex: '#120d06',
    cardHex: '#1c150c',
    accentHex: '#f59e0b',
    glowHex: 'rgba(245, 158, 11, 0.35)',
    isLight: false,
    borderHex: '#452a0a',
  },
  {
    id: 'neon-violet',
    name: 'Neon Violet',
    themeMode: 'dark',
    accent: 'violet',
    bgHex: '#0e081c',
    cardHex: '#170e2d',
    accentHex: '#a855f7',
    glowHex: 'rgba(168, 85, 247, 0.35)',
    isLight: false,
    borderHex: '#3b1d6e',
  },
  {
    id: 'ruby-rose',
    name: 'Ruby Rose',
    themeMode: 'dark',
    accent: 'rose',
    bgHex: '#14070b',
    cardHex: '#220d14',
    accentHex: '#f43f5e',
    glowHex: 'rgba(244, 63, 94, 0.35)',
    isLight: false,
    borderHex: '#4c1122',
  },
  {
    id: 'executive-light',
    name: 'Executive Light',
    themeMode: 'light',
    accent: 'cobalt',
    bgHex: '#f1f5f9',
    cardHex: '#ffffff',
    accentHex: '#2563eb',
    glowHex: 'rgba(37, 99, 235, 0.2)',
    isLight: true,
    borderHex: '#cbd5e1',
  },
  {
    id: 'oled-black',
    name: 'Pitch Black OLED',
    themeMode: 'oled',
    accent: 'emerald',
    bgHex: '#000000',
    cardHex: '#080808',
    accentHex: '#34d399',
    glowHex: 'rgba(52, 211, 153, 0.35)',
    isLight: false,
    borderHex: '#222222',
  },
];

export const PinLoginPage: React.FC<PinLoginPageProps> = ({
  profile,
  onUnlock,
  onOpenPinSetup,
  onChangeTheme,
  onChangeAccent,
  onChangeCustomAccent,
  onToggleAccentGlow,
  onSaveProfile,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPinDigits, setShowPinDigits] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const activePin = profile.securityPin || '1234';
  const pinLength = activePin.length || 4;

  // Real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine active color style based on profile
  const activePalette = useMemo(() => {
    const isLightMode =
      profile.theme === 'light' || profile.theme === 'glacier' || profile.theme === 'sepia';

    if (isLightMode) {
      return COLOR_PALETTES.find((p) => p.id === 'executive-light') || COLOR_PALETTES[5];
    }
    if (profile.theme === 'oled') {
      return COLOR_PALETTES.find((p) => p.id === 'oled-black') || COLOR_PALETTES[6];
    }

    const matchByAccent = COLOR_PALETTES.find(
      (p) => !p.isLight && p.accent === profile.themeAccent
    );
    return matchByAccent || COLOR_PALETTES[0];
  }, [profile.theme, profile.themeAccent]);

  // Tactile keypad click audio synthesizer (100% offline via Web Audio API)
  const playClickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Audio playback bypassed gracefully
    }
  }, [soundEnabled]);

  // Haptic feedback for touch devices
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  }, []);

  const handleSelectPalette = (palette: ColorPaletteOption) => {
    if (onChangeTheme) {
      onChangeTheme(palette.themeMode);
    }
    if (onChangeAccent) {
      onChangeAccent(palette.accent);
    }
    if (onSaveProfile) {
      onSaveProfile({
        ...profile,
        theme: palette.themeMode,
        themeAccent: palette.accent,
      });
    }
  };

  const handleDigit = useCallback(
    (digit: string) => {
      if (isSuccess) return;
      playClickSound();
      triggerHaptic();
      setError('');

      if (pin.length < pinLength) {
        const nextPin = pin + digit;
        setPin(nextPin);

        // Auto-check on complete PIN length
        if (nextPin.length === pinLength) {
          if (nextPin === activePin) {
            setIsSuccess(true);
            setTimeout(() => {
              onUnlock();
            }, 350);
          } else {
            setIsShaking(true);
            setError('Incorrect Security PIN. Please try again.');
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([40, 60, 40]);
            }
            setTimeout(() => {
              setIsShaking(false);
              setPin('');
            }, 550);
          }
        }
      }
    },
    [pin, pinLength, activePin, isSuccess, onUnlock, playClickSound, triggerHaptic]
  );

  const handleBackspace = useCallback(() => {
    if (isSuccess) return;
    playClickSound();
    triggerHaptic();
    setError('');
    setPin((prev) => prev.slice(0, -1));
  }, [isSuccess, playClickSound, triggerHaptic]);

  const handleClear = useCallback(() => {
    if (isSuccess) return;
    playClickSound();
    triggerHaptic();
    setError('');
    setPin('');
  }, [isSuccess, playClickSound, triggerHaptic]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  const isLight = activePalette.isLight;

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 transition-all duration-300 relative overflow-hidden select-none"
      style={{
        backgroundColor: activePalette.bgHex,
        color: isLight ? '#0f172a' : '#f8fafc',
      }}
    >
      {/* Dynamic Ambient Mesh Radial Glow */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-500"
        style={{ backgroundColor: activePalette.accentHex }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30 transition-all duration-500"
        style={{ backgroundColor: activePalette.accentHex }}
      />

      {/* TOP HEADER: Branding, Live Clock, and Controls */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 pt-2 px-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <MHLogo
            customUrl={profile.logoUrl}
            size="md"
            rounded="xl"
            theme={isLight ? 'light' : 'dark'}
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
              {profile.shopName || 'MOBILE HOSPITAL'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[11px] font-mono uppercase tracking-wider font-semibold"
                style={{ color: activePalette.accentHex }}
              >
                POS Workshop Terminal
              </span>
              <span className="text-[11px] opacity-40">•</span>
              <span className="text-[11px] opacity-70 flex items-center gap-1 font-mono hidden sm:flex">
                <Clock className="w-3 h-3" />
                {currentTime}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Mute Keypad Sound' : 'Enable Keypad Sound'}
            className="p-2 rounded-xl border transition-all cursor-pointer shadow-xs"
            style={{
              backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
              borderColor: activePalette.borderHex,
              color: isLight ? '#334155' : '#cbd5e1',
            }}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-50" />}
          </button>

          {/* Light / Dark Mode Fast Switcher */}
          <button
            type="button"
            onClick={() => {
              const targetPalette = isLight
                ? COLOR_PALETTES[0] // Switch to Cyber Cobalt
                : COLOR_PALETTES[5]; // Switch to Executive Light
              handleSelectPalette(targetPalette);
            }}
            title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            className="p-2 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            style={{
              backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
              borderColor: activePalette.borderHex,
              color: isLight ? '#334155' : '#cbd5e1',
            }}
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline text-xs font-semibold">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-xs font-semibold">Light</span>
              </>
            )}
          </button>

          {/* Standard Full Theme Selector Modal */}
          {onChangeTheme && onChangeAccent && (
            <ThemeSelector
              compact
              theme={profile.theme || 'dark'}
              accent={profile.themeAccent || 'cobalt'}
              customAccentColor={profile.customAccentColor || '#2563eb'}
              accentGlow={profile.accentGlow !== false}
              onChangeTheme={onChangeTheme}
              onChangeAccent={onChangeAccent}
              onChangeCustomAccent={onChangeCustomAccent}
              onToggleAccentGlow={onToggleAccentGlow}
            />
          )}
        </div>
      </header>

      {/* COLOR THEME SELECTOR BAR (Direct Visual Choice) */}
      <div className="w-full max-w-lg z-10 my-3 px-2">
        <div
          className="p-2 sm:p-2.5 rounded-2xl border backdrop-blur-md flex items-center justify-between shadow-lg transition-all"
          style={{
            backgroundColor: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.65)',
            borderColor: activePalette.borderHex,
          }}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: activePalette.accentHex }} />
            <span className="text-[11px] uppercase tracking-wider font-bold">Theme Style:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {COLOR_PALETTES.map((palette) => {
              const isSelected = activePalette.id === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => handleSelectPalette(palette)}
                  title={`${palette.name} (${palette.isLight ? 'Light' : 'Dark'})`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center relative shadow-sm ${
                    isSelected
                      ? 'scale-115 ring-2 ring-offset-2 ring-white shadow-md'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: palette.cardHex,
                    border: `2px solid ${palette.accentHex}`,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: palette.accentHex }}
                  />
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px]">
                      <Check className="w-3.5 h-3.5 drop-shadow-md stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CENTER TERMINAL CONTAINER */}
      <main className="w-full max-w-sm z-10 my-auto flex flex-col items-center">
        <div
          className="w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : activePalette.cardHex,
            borderColor: activePalette.borderHex,
            boxShadow: `0 20px 40px -15px ${activePalette.glowHex}, 0 0 20px -5px ${activePalette.glowHex}`,
          }}
        >
          {/* Hardware Lock Icon */}
          <div className="flex flex-col items-center mb-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-md ${
                isSuccess
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500'
                  : error
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-500'
                  : ''
              }`}
              style={
                !isSuccess && !error
                  ? {
                      backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                      borderColor: activePalette.borderHex,
                      color: activePalette.accentHex,
                      boxShadow: `0 0 24px ${activePalette.glowHex}`,
                    }
                  : undefined
              }
            >
              {isSuccess ? (
                <CheckCircle className="w-7 h-7 animate-bounce text-emerald-500" />
              ) : (
                <Lock className="w-6 h-6" style={{ color: activePalette.accentHex }} />
              )}
            </div>

            <h2 className="text-lg font-bold tracking-tight mt-3">
              {isSuccess ? 'Terminal Unlocked' : 'Security PIN Access'}
            </h2>
            <p className="text-xs opacity-60 text-center mt-0.5">
              Enter {pinLength}-digit PIN to unlock counter billing
            </p>
          </div>

          {/* PIN Indicators Display (Dots / Digits) */}
          <div className="flex flex-col items-center mb-5">
            <div
              className={`flex items-center justify-center gap-3.5 py-2 transition-transform ${
                isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
              }`}
            >
              {Array.from({ length: pinLength }).map((_, idx) => {
                const isFilled = idx < pin.length;
                const digitVal = pin[idx];

                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 flex items-center justify-center ${
                      isSuccess
                        ? 'bg-emerald-500 ring-4 ring-emerald-500/20 scale-110'
                        : isFilled
                        ? 'scale-110 ring-4 ring-offset-2'
                        : 'border'
                    }`}
                    style={
                      isFilled && !isSuccess
                        ? {
                            backgroundColor: activePalette.accentHex,
                            boxShadow: `0 0 14px ${activePalette.glowHex}`,
                          }
                        : !isSuccess
                        ? {
                            backgroundColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)',
                            borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)',
                          }
                        : undefined
                    }
                  >
                    {showPinDigits && isFilled && !isSuccess && (
                      <span className="text-[10px] font-bold text-white leading-none font-mono">
                        {digitVal}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Reveal digits toggle button */}
              <button
                type="button"
                onClick={() => setShowPinDigits((prev) => !prev)}
                title={showPinDigits ? 'Hide Digits' : 'Show Digits'}
                className="p-1 rounded-md opacity-40 hover:opacity-100 transition-opacity ml-1 cursor-pointer"
              >
                {showPinDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Error Message */}
            {error ? (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold mt-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <div className="h-4 mt-1" />
            )}
          </div>

          {/* NUMERIC KEYPAD (Comfortable POS Hardware Layout) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
            {[
              { num: '1', letters: '' },
              { num: '2', letters: 'ABC' },
              { num: '3', letters: 'DEF' },
              { num: '4', letters: 'GHI' },
              { num: '5', letters: 'JKL' },
              { num: '6', letters: 'MNO' },
              { num: '7', letters: 'PQRS' },
              { num: '8', letters: 'TUV' },
              { num: '9', letters: 'WXYZ' },
            ].map(({ num, letters }) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="h-13 sm:h-14 rounded-2xl font-bold text-xl flex flex-col items-center justify-center transition-all border shadow-xs active:scale-95 cursor-pointer select-none group"
                style={{
                  backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                  borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.12)',
                  color: isLight ? '#0f172a' : '#ffffff',
                }}
              >
                <span className="leading-none group-hover:scale-105 transition-transform">{num}</span>
                {letters && (
                  <span className="text-[9px] font-semibold tracking-wider opacity-40 mt-0.5">
                    {letters}
                  </span>
                )}
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              className="h-13 sm:h-14 rounded-2xl font-bold text-xs transition-all border flex items-center justify-center cursor-pointer select-none active:scale-95 tracking-wider"
              style={{
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)',
                borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)',
                color: isLight ? '#64748b' : '#94a3b8',
              }}
              title="Clear (Esc)"
            >
              CLEAR
            </button>

            {/* Zero Key */}
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-13 sm:h-14 rounded-2xl font-bold text-xl flex flex-col items-center justify-center transition-all border shadow-xs active:scale-95 cursor-pointer select-none group"
              style={{
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.12)',
                color: isLight ? '#0f172a' : '#ffffff',
              }}
            >
              <span className="leading-none group-hover:scale-105 transition-transform">0</span>
              <span className="text-[9px] font-semibold tracking-wider opacity-40 mt-0.5">+</span>
            </button>

            {/* Backspace Key */}
            <button
              type="button"
              onClick={handleBackspace}
              className="h-13 sm:h-14 rounded-2xl transition-all border flex items-center justify-center cursor-pointer select-none active:scale-95"
              style={{
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)',
                borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)',
                color: isLight ? '#64748b' : '#94a3b8',
              }}
              title="Backspace (Del)"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Help & Setup Functions */}
          <div className="mt-5 flex flex-col items-center gap-2 w-full pt-2 border-t" style={{ borderColor: activePalette.borderHex }}>
            {showHint && (
              <div
                className="w-full rounded-xl p-2.5 text-xs text-center animate-fade-in shadow-md border"
                style={{
                  backgroundColor: isLight ? '#f8fafc' : 'rgba(0,0,0,0.3)',
                  borderColor: activePalette.borderHex,
                }}
              >
                <span className="block text-[10px] uppercase font-bold tracking-wider opacity-60">
                  Security Hint
                </span>
                <span className="font-semibold font-mono text-sm" style={{ color: activePalette.accentHex }}>
                  {profile.pinHint || 'Default PIN: 1234'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between w-full px-1 text-xs">
              <button
                type="button"
                onClick={() => setShowHint((prev) => !prev)}
                className="opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'Forgot PIN?'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenPinSetup}
                className="font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                style={{ color: activePalette.accentHex }}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Setup PIN</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM FOOTER: Terminal Status & Security Badge */}
      <footer className="w-full max-w-md z-10 flex items-center justify-between px-3 py-2 text-[11px] opacity-60">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" style={{ color: activePalette.accentHex }} />
          <span>Encrypted Terminal • Offline Ready</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
          {activePalette.name}
        </span>
      </footer>
    </div>
  );
};
