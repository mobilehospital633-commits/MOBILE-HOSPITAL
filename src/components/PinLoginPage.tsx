import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Shield, KeyRound, Delete, ArrowRight, AlertCircle, HelpCircle, CheckCircle } from 'lucide-react';
import { ShopProfile } from '../types';
import { MHLogo } from './MHLogo';

interface PinLoginPageProps {
  profile: ShopProfile;
  onUnlock: () => void;
  onOpenPinSetup: () => void;
}

export const PinLoginPage: React.FC<PinLoginPageProps> = ({
  profile,
  onUnlock,
  onOpenPinSetup,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const activePin = profile.securityPin || '1234';
  const pinLength = activePin.length || 4;

  const handleDigit = useCallback(
    (digit: string) => {
      if (isSuccess) return;
      setError('');
      if (pin.length < pinLength) {
        const nextPin = pin + digit;
        setPin(nextPin);

        // Auto submit when complete length reached
        if (nextPin.length === pinLength) {
          if (nextPin === activePin) {
            setIsSuccess(true);
            setTimeout(() => {
              onUnlock();
            }, 300);
          } else {
            setIsShaking(true);
            setError('Incorrect PIN. Please try again.');
            setTimeout(() => {
              setIsShaking(false);
              setPin('');
            }, 550);
          }
        }
      }
    },
    [pin, pinLength, activePin, isSuccess, onUnlock]
  );

  const handleBackspace = useCallback(() => {
    if (isSuccess) return;
    setError('');
    setPin((prev) => prev.slice(0, -1));
  }, [isSuccess]);

  const handleClear = useCallback(() => {
    if (isSuccess) return;
    setError('');
    setPin('');
  }, [isSuccess]);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between items-center p-6 selection:bg-zinc-800">
      {/* Top Bar / Branding */}
      <div className="w-full max-w-sm flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <MHLogo customUrl={profile.logoUrl} size="sm" rounded="lg" theme="dark" />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">
              {profile.shopName || 'MOBILE HOSPITAL'}
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono">Counter POS Terminal</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>PIN Protected</span>
        </span>
      </div>

      {/* Center PIN Terminal Keypad */}
      <div className="w-full max-w-xs flex flex-col items-center my-auto py-6">
        {/* Terminal Icon */}
        <div className="relative mb-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-xl ${
              isSuccess
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : error
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-200'
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="w-8 h-8 animate-bounce text-emerald-400" />
            ) : (
              <Lock className="w-7 h-7 text-zinc-300" />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold tracking-tight text-white mb-1 text-center">
          {isSuccess ? 'Terminal Unlocked' : 'Enter Security PIN'}
        </h1>
        <p className="text-xs text-zinc-400 text-center mb-6">
          Enter your {pinLength}-digit PIN to access workshop orders and accounts
        </p>

        {/* PIN Dots Display */}
        <div
          className={`flex items-center justify-center gap-4 mb-8 transition-transform ${
            isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
        >
          {Array.from({ length: pinLength }).map((_, idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isSuccess
                    ? 'bg-emerald-400 ring-4 ring-emerald-500/20 scale-110'
                    : isFilled
                    ? 'bg-white ring-4 ring-white/20 scale-110'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error / Alert Message */}
        {error ? (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-4 font-medium animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="h-5 mb-4" />
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full">
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
              className="h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 text-white font-bold text-xl flex flex-col items-center justify-center transition-all border border-zinc-800/80 shadow-sm cursor-pointer select-none"
            >
              <span className="leading-none">{num}</span>
              {letters && (
                <span className="text-[9px] font-semibold text-zinc-500 tracking-wider mt-0.5">
                  {letters}
                </span>
              )}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 text-zinc-400 hover:text-white font-semibold text-xs transition-all border border-zinc-800/50 flex items-center justify-center cursor-pointer select-none"
            title="Clear all digits (Esc)"
          >
            CLEAR
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 text-white font-bold text-xl flex flex-col items-center justify-center transition-all border border-zinc-800/80 shadow-sm cursor-pointer select-none"
          >
            <span className="leading-none">0</span>
            <span className="text-[9px] font-semibold text-zinc-500 tracking-wider mt-0.5">+</span>
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 text-zinc-400 hover:text-white transition-all border border-zinc-800/50 flex items-center justify-center cursor-pointer select-none"
            title="Backspace (Delete)"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Help & Setup Functions */}
        <div className="mt-6 flex flex-col items-center gap-2.5 w-full">
          {showHint && (
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 text-center animate-fade-in shadow-lg">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                PIN Hint
              </span>
              <span className="font-semibold text-emerald-400 font-mono">
                {profile.pinHint || 'Default factory PIN is 1234'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between w-full px-2 text-xs">
            <button
              type="button"
              onClick={() => setShowHint((prev) => !prev)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
              <span>{showHint ? 'Hide Hint' : 'Forgot PIN?'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenPinSetup}
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Setup / Change PIN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="w-full max-w-sm text-center pb-2 text-[11px] text-zinc-500 flex items-center justify-center gap-2">
        <span>Use touch screen or physical number keyboard (0-9)</span>
      </div>
    </div>
  );
};
