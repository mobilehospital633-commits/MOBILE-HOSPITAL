import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Lock,
  KeyRound,
  Delete,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Check,
  Sun,
  Moon,
  Clock,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Save,
  X,
  Crown,
  UserCheck,
  User,
  ShieldCheck,
  Palette,
  LogIn,
  Mail,
  Globe,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { ShopProfile, ThemeMode, ThemeAccent, BackgroundStyle, StylePreset, UserRole, AuthUser } from '../types';
import { MHLogo } from './MHLogo';
import { ThemeSelector } from './ThemeSelector';
import { loginWithGoogle, loginWithIdAndPassword } from '../lib/firebase';

interface PinLoginPageProps {
  profile: ShopProfile;
  onUnlock: (user: AuthUser) => void;
  onOpenPinSetup: () => void;
  onChangeTheme?: (theme: ThemeMode) => void;
  onChangeAccent?: (accent: ThemeAccent) => void;
  onChangeBackgroundStyle?: (style: BackgroundStyle) => void;
  onChangeCustomAccent?: (hex: string) => void;
  onToggleAccentGlow?: (enabled: boolean) => void;
  onApplyStylePreset?: (preset: StylePreset) => void;
  onSaveProfile?: (profile: ShopProfile) => void;
}

// Official Google 'G' colored vector icon
const GoogleGIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
    />
  </svg>
);

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
  // Authentication Method Switcher ('id_password' = default, 'google', 'pin')
  const [authMethod, setAuthMethod] = useState<'id_password' | 'google' | 'pin'>(() => {
    return (localStorage.getItem('mh_preferred_login_method') as any) || 'id_password';
  });

  // ID & Password form state
  const [loginId, setLoginId] = useState<string>(() => {
    return localStorage.getItem('mh_saved_login_id') || '';
  });
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberCredentials, setRememberCredentials] = useState<boolean>(() => {
    return localStorage.getItem('mh_remember_credentials') === 'true';
  });
  const [isSubmittingIdPass, setIsSubmittingIdPass] = useState<boolean>(false);

  // Google OAuth state
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Role selection
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [staffNameInput, setStaffNameInput] = useState<string>(profile.staffName || 'Counter Staff');

  // PIN keypad state
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPinDigits, setShowPinDigits] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Remember PIN on device
  const [rememberPin, setRememberPin] = useState<boolean>(() => {
    return localStorage.getItem('mh_remember_pin') === 'true';
  });
  const [savedDevicePin, setSavedDevicePin] = useState<string | null>(() => {
    return localStorage.getItem('mh_saved_device_pin');
  });

  // Inline Quick Save PIN Modal
  const [isQuickSaveOpen, setIsQuickSaveOpen] = useState<boolean>(false);
  const [newOwnerPinInput, setNewOwnerPinInput] = useState<string>('');
  const [newStaffPinInput, setNewStaffPinInput] = useState<string>('');
  const [newStaffNameInput, setNewStaffNameInput] = useState<string>(profile.staffName || 'Counter Staff');
  const [savePinError, setSavePinError] = useState<string>('');
  const [savePinSuccess, setSavePinSuccess] = useState<string>('');

  const ownerPin = profile.securityPin || '1234';
  const staffPin = profile.staffPin || '0000';
  const activePin = selectedRole === 'owner' ? ownerPin : staffPin;
  const pinLength = activePin.length || 4;

  // Real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 5000);
    return () => clearInterval(timer);
  }, []);

  const isLight = profile.theme === 'light';
  const customAccent = profile.customAccentColor || '#10b981';

  // Active color styling
  const activePalette = useMemo(() => {
    return {
      name: 'Custom Theme',
      themeMode: profile.theme || 'light',
      accent: 'custom' as const,
      bgHex: isLight ? '#f8fafc' : '#09090b',
      cardHex: isLight ? '#ffffff' : '#18181b',
      accentHex: customAccent,
      glowHex: `${customAccent}40`,
      isLight,
      borderHex: isLight ? '#e2e8f0' : '#27272a',
    };
  }, [profile.theme, customAccent, isLight]);

  const audioCtxRef = React.useRef<AudioContext | null>(null);

  const playClickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

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
    } catch {}
  }, [soundEnabled]);

  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  }, []);

  const handleUnlockSuccess = useCallback(
    (user?: AuthUser) => {
      setIsSuccess(true);
      const authenticatedUser: AuthUser = user || {
        role: selectedRole,
        name: selectedRole === 'owner' ? 'Store Owner' : (staffNameInput.trim() || profile.staffName || 'Counter Staff'),
        loginTime: new Date().toISOString(),
        loginMethod: authMethod,
      };

      try {
        localStorage.setItem('mh_preferred_login_method', authMethod);
        if (rememberCredentials && loginId) {
          localStorage.setItem('mh_saved_login_id', loginId);
          localStorage.setItem('mh_remember_credentials', 'true');
        } else {
          localStorage.removeItem('mh_remember_credentials');
        }

        if (rememberPin) {
          localStorage.setItem('mh_remember_pin', 'true');
          localStorage.setItem('mh_saved_device_pin', authenticatedUser.role === 'owner' ? ownerPin : staffPin);
          localStorage.setItem('mh_saved_device_role', authenticatedUser.role);
          setSavedDevicePin(authenticatedUser.role === 'owner' ? ownerPin : staffPin);
        } else {
          localStorage.removeItem('mh_remember_pin');
          localStorage.removeItem('mh_saved_device_pin');
          localStorage.removeItem('mh_saved_device_role');
          setSavedDevicePin(null);
        }
      } catch {}

      setTimeout(() => {
        onUnlock(authenticatedUser);
      }, 350);
    },
    [rememberPin, rememberCredentials, loginId, selectedRole, staffNameInput, profile.staffName, ownerPin, staffPin, onUnlock, authMethod]
  );

  // ID & Password Login Handler
  const handleIdPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginId.trim()) {
      setError('Please enter your User ID, Username, or Email.');
      return;
    }
    if (!loginPassword.trim()) {
      setError('Please enter your Password.');
      return;
    }

    setIsSubmittingIdPass(true);
    try {
      const authUser = await loginWithIdAndPassword(loginId, loginPassword);
      handleUnlockSuccess(authUser);
    } catch (err: any) {
      setError(err?.message || 'Invalid User ID or Password.');
      setIsShaking(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsSubmittingIdPass(false);
    }
  };

  // Google OAuth / Gmail Login Handler
  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const { authUser } = await loginWithGoogle();
      handleUnlockSuccess(authUser);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Google sign-in could not be completed. Please check your network.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // PIN Keypad Handlers
  const handleDigit = useCallback(
    (digit: string) => {
      if (isSuccess || authMethod !== 'pin') return;
      playClickSound();
      triggerHaptic();
      setError('');

      if (pin.length < 6) {
        const nextPin = pin + digit;
        setPin(nextPin);

        if (nextPin === ownerPin) {
          handleUnlockSuccess({
            role: 'owner',
            name: 'Store Owner',
            loginTime: new Date().toISOString(),
            loginMethod: 'pin',
          });
          return;
        }

        if (nextPin === staffPin) {
          handleUnlockSuccess({
            role: 'staff',
            name: staffNameInput.trim() || profile.staffName || 'Counter Staff',
            loginTime: new Date().toISOString(),
            loginMethod: 'pin',
          });
          return;
        }

        if (nextPin.length >= pinLength) {
          setIsShaking(true);
          setError(
            selectedRole === 'owner'
              ? 'Incorrect Owner PIN. Please try again.'
              : 'Incorrect Staff PIN. Please try again.'
          );
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([40, 60, 40]);
          }
          setTimeout(() => {
            setIsShaking(false);
            setPin('');
          }, 550);
        }
      }
    },
    [pin, pinLength, ownerPin, staffPin, selectedRole, staffNameInput, profile.staffName, isSuccess, authMethod, handleUnlockSuccess, playClickSound, triggerHaptic]
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

  // Quick Unlock with Saved PIN
  const handleQuickUnlockWithSavedPin = () => {
    if (savedDevicePin === ownerPin) {
      handleUnlockSuccess({
        role: 'owner',
        name: 'Store Owner',
        loginTime: new Date().toISOString(),
        loginMethod: 'pin',
      });
    } else if (savedDevicePin === staffPin) {
      handleUnlockSuccess({
        role: 'staff',
        name: staffNameInput.trim() || profile.staffName || 'Counter Staff',
        loginTime: new Date().toISOString(),
        loginMethod: 'pin',
      });
    } else {
      setError('Saved PIN does not match current configured PIN. Please re-enter.');
      localStorage.removeItem('mh_saved_device_pin');
      setSavedDevicePin(null);
    }
  };

  // Inline Save New PIN action
  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setSavePinError('');
    setSavePinSuccess('');

    if (newOwnerPinInput && !/^[0-9]{4,6}$/.test(newOwnerPinInput)) {
      setSavePinError('Owner PIN must be 4 to 6 numeric digits (0-9).');
      return;
    }
    if (newStaffPinInput && !/^[0-9]{4,6}$/.test(newStaffPinInput)) {
      setSavePinError('Staff PIN must be 4 to 6 numeric digits (0-9).');
      return;
    }

    const updatedProfile: ShopProfile = {
      ...profile,
      securityPin: newOwnerPinInput || profile.securityPin || '1234',
      staffPin: newStaffPinInput || profile.staffPin || '0000',
      staffName: newStaffNameInput.trim() || profile.staffName || 'Counter Staff',
      pinAuthEnabled: true,
      pinHint: 'PIN configured securely. Use Master Code if forgotten.',
    };

    if (onSaveProfile) {
      onSaveProfile(updatedProfile);
    }

    setSavePinSuccess('Owner & Staff PINs updated successfully!');
    setTimeout(() => {
      setIsQuickSaveOpen(false);
      setNewOwnerPinInput('');
      setNewStaffPinInput('');
      setSavePinSuccess('');
      setSavePinError('');
    }, 1200);
  };

  // Keyboard listener for numeric keypad when in PIN mode
  useEffect(() => {
    if (isQuickSaveOpen || authMethod !== 'pin') return;
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
  }, [handleDigit, handleBackspace, handleClear, isQuickSaveOpen, authMethod]);

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

      {/* TOP HEADER: Branding, Live Clock, and Quick Controls */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 pt-2 px-2">
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
                POS Counter Terminal
              </span>
              <span className="text-[11px] opacity-40">•</span>
              <span className="text-[11px] opacity-70 flex items-center gap-1 font-mono hidden sm:flex">
                <Clock className="w-3 h-3" />
                {currentTime}
              </span>
            </div>
          </div>
        </div>

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

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMode = isLight ? 'dark' : 'light';
              onChangeTheme?.(nextMode);
              onSaveProfile?.({ ...profile, theme: nextMode });
            }}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="p-2 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            style={{
              backgroundColor: isLight ? '#ffffff' : '#1e293b',
              borderColor: activePalette.borderHex,
              color: isLight ? '#334155' : '#f8fafc',
            }}
          >
            {isLight ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline text-xs font-semibold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline text-xs font-semibold">Dark</span>
              </>
            )}
          </button>

          {/* Save / Change PIN Button */}
          <button
            type="button"
            onClick={() => setIsQuickSaveOpen(true)}
            className="px-3 py-2 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center gap-1.5 text-xs font-bold"
            style={{
              backgroundColor: activePalette.accentHex,
              borderColor: activePalette.accentHex,
              color: '#ffffff',
            }}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configure PIN</span>
          </button>
        </div>
      </header>

      {/* CENTER TERMINAL CONTAINER */}
      <main className="w-full max-w-md z-10 my-auto flex flex-col items-center">
        <div
          className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
            isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
          style={{
            backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : activePalette.cardHex,
            borderColor: activePalette.borderHex,
            boxShadow: `0 20px 40px -15px ${activePalette.glowHex}, 0 0 20px -5px ${activePalette.glowHex}`,
          }}
        >
          {/* Header Icon & Title */}
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
              ) : authMethod === 'google' ? (
                <Globe className="w-6 h-6" style={{ color: activePalette.accentHex }} />
              ) : authMethod === 'id_password' ? (
                <LogIn className="w-6 h-6" style={{ color: activePalette.accentHex }} />
              ) : (
                <Lock className="w-6 h-6" style={{ color: activePalette.accentHex }} />
              )}
            </div>

            <h2 className="text-lg font-bold tracking-tight mt-2.5">
              {isSuccess
                ? `${selectedRole === 'owner' ? 'Owner' : 'Staff'} Access Granted`
                : authMethod === 'id_password'
                ? 'ID & Password Login'
                : authMethod === 'google'
                ? 'Google (Gmail) Sign-In'
                : 'PIN Counter Login'}
            </h2>
            <p className="text-xs opacity-60 text-center mt-0.5">
              {authMethod === 'google'
                ? 'Sign in with your Gmail account to sync all data across any phone, laptop, or PC.'
                : 'Secure terminal access with persistent multi-device cloud synchronization.'}
            </p>
          </div>

          {/* PRIMARY LOGIN METHOD SELECTOR (3 Clean Options) */}
          <div className="w-full mb-4.5">
            <div
              className="grid grid-cols-3 gap-1 p-1 rounded-2xl border"
              style={{
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)',
                borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)',
              }}
            >
              {/* Option 1: ID & Password */}
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('id_password');
                  setError('');
                }}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'id_password'
                    ? 'shadow-md text-white'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor:
                    authMethod === 'id_password' ? activePalette.accentHex : 'transparent',
                }}
              >
                <User className="w-3.5 h-3.5" />
                <span>ID & Password</span>
              </button>

              {/* Option 2: Google OAuth */}
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('google');
                  setError('');
                }}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'google'
                    ? 'shadow-md text-white'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor:
                    authMethod === 'google' ? activePalette.accentHex : 'transparent',
                }}
              >
                <GoogleGIcon className="w-3.5 h-3.5" />
                <span>Google Gmail</span>
              </button>

              {/* Option 3: Quick PIN */}
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('pin');
                  setError('');
                }}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'pin'
                    ? 'shadow-md text-white'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor:
                    authMethod === 'pin' ? activePalette.accentHex : 'transparent',
                }}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Quick PIN</span>
              </button>
            </div>
          </div>

          {/* ====================================================
              VIEW 1: ID & PASSWORD LOGIN FORM
          ==================================================== */}
          {authMethod === 'id_password' && (
            <form onSubmit={handleIdPasswordLogin} className="space-y-3.5 w-full">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-1.5 font-medium animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* User ID / Username Input */}
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80 flex items-center justify-between">
                  <span>User ID or Email <span className="text-red-500 font-bold">*</span></span>
                  <span className="text-[10px] opacity-60 font-mono">Demo: admin</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter User ID (e.g. admin or email)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-medium border transition-all focus:outline-hidden"
                    style={{
                      backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                      borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)',
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80 flex items-center justify-between">
                  <span>Password <span className="text-red-500 font-bold">*</span></span>
                  <span className="text-[10px] opacity-60 font-mono">Demo: admin123</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs font-medium border transition-all focus:outline-hidden"
                    style={{
                      backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                      borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={rememberCredentials}
                    onChange={(e) => setRememberCredentials(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="opacity-80 font-medium text-[11px]">
                    Remember User ID on this device
                  </span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmittingIdPass}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                style={{ backgroundColor: activePalette.accentHex }}
              >
                {isSubmittingIdPass ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Terminal</span>
                  </>
                )}
              </button>

              {/* 1-Tap Demo Quick-Fills */}
              <div className="pt-2 border-t flex flex-col gap-1.5" style={{ borderColor: activePalette.borderHex }}>
                <span className="text-[10px] uppercase font-bold opacity-60 tracking-wider">
                  Quick 1-Tap Fill:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginId('admin');
                      setLoginPassword('admin123');
                    }}
                    className="p-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)' }}
                  >
                    <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Owner (admin)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginId('alex.tech');
                      setLoginPassword('tech123');
                    }}
                    className="p-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)' }}
                  >
                    <UserCheck className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>Staff (alex.tech)</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ====================================================
              VIEW 2: GOOGLE OAUTH / GMAIL SIGN-IN
          ==================================================== */}
          {authMethod === 'google' && (
            <div className="space-y-4 w-full text-center">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-1.5 font-medium animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google Sign-In Primary Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 rounded-2xl border bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-98"
                style={{ borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.18)' }}
              >
                {isGoogleLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    <span>Connecting with Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleGIcon className="w-5 h-5 shrink-0" />
                    <span>Sign in with Google (Gmail)</span>
                  </>
                )}
              </button>

              {/* Multi-Device Cloud Sync Reassurance Box */}
              <div
                className="p-3 rounded-2xl border text-left text-xs space-y-1.5 shadow-2xs"
                style={{
                  backgroundColor: isLight ? '#f0fdf4' : 'rgba(16,185,129,0.08)',
                  borderColor: isLight ? '#bbf7d0' : 'rgba(16,185,129,0.25)',
                  color: isLight ? '#166534' : '#86efac',
                }}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider pb-1 border-b border-emerald-200 dark:border-emerald-800/40">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cross-Device Cloud Synchronization</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Logging in with your Google account seamlessly downloads all your previous repair orders, inventory parts, and ledger history to this device.
                </p>
                <div className="pt-1 flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Target Account: mobilehospital633@gmail.com</span>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              VIEW 3: QUICK 4-DIGIT PIN KEYPAD
          ==================================================== */}
          {authMethod === 'pin' && (
            <div className="w-full">
              {/* Role Selector Tabs (Owner vs Staff) */}
              <div
                className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border mb-3"
                style={{
                  backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)',
                  borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('owner');
                    setPin('');
                    setError('');
                  }}
                  className={`py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'owner' ? 'shadow-md text-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: selectedRole === 'owner' ? activePalette.accentHex : 'transparent',
                  }}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Owner PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('staff');
                    setPin('');
                    setError('');
                  }}
                  className={`py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'staff' ? 'shadow-md text-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: selectedRole === 'staff' ? activePalette.accentHex : 'transparent',
                  }}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Staff PIN</span>
                </button>
              </div>

              {/* 1-Tap Unlock with Saved PIN (if present) */}
              {savedDevicePin && savedDevicePin === activePin && !isSuccess && (
                <div className="w-full mb-3">
                  <button
                    type="button"
                    onClick={handleQuickUnlockWithSavedPin}
                    className="w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-98"
                    style={{
                      backgroundColor: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.15)',
                      borderColor: isLight ? '#a7f3d0' : 'rgba(16,185,129,0.4)',
                      color: isLight ? '#047857' : '#34d399',
                    }}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>1-Tap Unlock with Saved PIN</span>
                  </button>
                </div>
              )}

              {/* PIN Dots */}
              <div className="flex flex-col items-center mb-3">
                <div className="flex items-center justify-center gap-3.5 py-1">
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

                  <button
                    type="button"
                    onClick={() => setShowPinDigits((prev) => !prev)}
                    className="p-1 rounded-md opacity-40 hover:opacity-100 transition-opacity ml-1 cursor-pointer"
                  >
                    {showPinDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {error ? (
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : (
                  <div className="h-3 mt-1" />
                )}
              </div>

              {/* Numeric Keypad Grid */}
              <div className="grid grid-cols-3 gap-2 w-full">
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
                    className="h-11 sm:h-12 rounded-2xl font-bold text-lg flex flex-col items-center justify-center transition-all border shadow-xs active:scale-95 cursor-pointer select-none"
                    style={{
                      backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                      borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.12)',
                      color: isLight ? '#0f172a' : '#ffffff',
                    }}
                  >
                    <span className="leading-none">{num}</span>
                    {letters && (
                      <span className="text-[8px] font-semibold tracking-wider opacity-40 mt-0.5">
                        {letters}
                      </span>
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClear}
                  className="h-11 sm:h-12 rounded-2xl font-bold text-xs transition-all border flex items-center justify-center cursor-pointer select-none active:scale-95 tracking-wider"
                  style={{
                    backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)',
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)',
                    color: isLight ? '#64748b' : '#94a3b8',
                  }}
                >
                  CLEAR
                </button>

                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="h-11 sm:h-12 rounded-2xl font-bold text-lg flex flex-col items-center justify-center transition-all border shadow-xs active:scale-95 cursor-pointer select-none"
                  style={{
                    backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.12)',
                    color: isLight ? '#0f172a' : '#ffffff',
                  }}
                >
                  <span className="leading-none">0</span>
                  <span className="text-[8px] font-semibold tracking-wider opacity-40 mt-0.5">+</span>
                </button>

                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-11 sm:h-12 rounded-2xl transition-all border flex items-center justify-center cursor-pointer select-none active:scale-95"
                  style={{
                    backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)',
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)',
                    color: isLight ? '#64748b' : '#94a3b8',
                  }}
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Save PIN Toggle & Forgot PIN */}
              <div className="mt-3 w-full pt-2 border-t flex items-center justify-between" style={{ borderColor: activePalette.borderHex }}>
                <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={rememberPin}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRememberPin(checked);
                      if (!checked) {
                        localStorage.removeItem('mh_remember_pin');
                        localStorage.removeItem('mh_saved_device_pin');
                        setSavedDevicePin(null);
                      }
                    }}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="opacity-80 font-medium text-[11px]">Save PIN on device</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="text-[11px] opacity-70 hover:opacity-100 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>{showHint ? 'Hide' : 'Forgot PIN?'}</span>
                </button>
              </div>

              {showHint && (
                <div
                  className="w-full rounded-xl p-2.5 text-xs text-center mt-2 border"
                  style={{
                    backgroundColor: isLight ? '#f8fafc' : 'rgba(0,0,0,0.3)',
                    borderColor: activePalette.borderHex,
                  }}
                >
                  <span className="font-medium text-xs block opacity-90">
                    Default Owner PIN is <strong className="font-mono">1234</strong>. Default Staff PIN is <strong className="font-mono">0000</strong>. Or switch to ID & Password login above.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-md z-10 pb-2 text-center text-xs opacity-60">
        <span>Protected by Mobile Hospital Cloud Security • Real-time Data Sync</span>
      </footer>

      {/* MODAL: DIRECT INLINE "SAVE / CHANGE PIN" MODAL */}
      {isQuickSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-3xl p-6 border shadow-2xl animate-in zoom-in-95 duration-150 relative"
            style={{
              backgroundColor: isLight ? '#ffffff' : activePalette.cardHex,
              borderColor: activePalette.borderHex,
              color: isLight ? '#0f172a' : '#ffffff',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: activePalette.borderHex }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: activePalette.accentHex }}
                >
                  <Save className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Configure Security PIN</h3>
                  <p className="text-[11px] opacity-60">Set 4 to 6 numeric digits</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickSaveOpen(false)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPin} className="mt-4 space-y-3.5">
              {savePinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{savePinError}</span>
                </div>
              )}
              {savePinSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-1.5 font-bold">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{savePinSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80 flex items-center justify-between">
                  <span>👑 Owner PIN (Full Access)</span>
                  <span className="text-[10px] opacity-70">Secured</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={newOwnerPinInput}
                  onChange={(e) => setNewOwnerPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter new 4-6 digit Owner PIN"
                  className="w-full px-3 py-2 rounded-xl text-center text-base font-bold tracking-widest border transition-all"
                  style={{
                    backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                    borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80 flex items-center justify-between">
                  <span>👤 Staff PIN (View & Create Only)</span>
                  <span className="text-[10px] opacity-70">Secured</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={newStaffPinInput}
                  onChange={(e) => setNewStaffPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter new 4-6 digit Staff PIN"
                  className="w-full px-3 py-2 rounded-xl text-center text-base font-bold tracking-widest border transition-all"
                  style={{
                    backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                    borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Staff Display Name
                </label>
                <input
                  type="text"
                  value={newStaffNameInput}
                  onChange={(e) => setNewStaffNameInput(e.target.value)}
                  placeholder="e.g. Counter Staff"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border transition-all"
                  style={{
                    backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                    borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)',
                  }}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickSaveOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-98"
                  style={{ backgroundColor: activePalette.accentHex }}
                >
                  Save PINs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
