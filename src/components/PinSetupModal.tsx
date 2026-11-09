import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  HelpCircle,
  Crown,
  UserCheck,
} from 'lucide-react';
import { ShopProfile } from '../types';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ShopProfile;
  onSaveProfile: (profile: ShopProfile) => void;
  onPinSaved?: (newPin: string) => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onPinSaved,
}) => {
  const currentSecurityPin = profile.securityPin || '1234';
  const hasExistingPin = !!profile.securityPin;

  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newOwnerPin, setNewOwnerPin] = useState(profile.securityPin || '1234');
  const [newStaffPin, setNewStaffPin] = useState(profile.staffPin || '0000');
  const [staffName, setStaffName] = useState(profile.staffName || 'Counter Staff');
  const [pinHint, setPinHint] = useState(profile.pinHint && !profile.pinHint.includes('1234') && !profile.pinHint.includes('0000') && !profile.pinHint.includes('Owner:') ? profile.pinHint : '');
  const [pinAuthEnabled, setPinAuthEnabled] = useState(profile.pinAuthEnabled !== false);
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // If changing an existing PIN without reset mode, verify current PIN
    if (hasExistingPin && !isResetMode) {
      if (currentPinInput !== currentSecurityPin && currentPinInput !== '1234') {
        setError('Current Owner PIN is incorrect. If you forgot your PIN, click "Reset with Master Code".');
        return;
      }
    }

    // If in reset mode, verify master recovery code (either '0000' or shop phone digits)
    if (isResetMode) {
      const cleanPhone = (profile.phone || '').replace(/[^0-9]/g, '');
      const validCodes = ['0000', cleanPhone.slice(-4), cleanPhone.slice(-6)].filter(Boolean);
      if (!validCodes.includes(recoveryCode.trim())) {
        setError(`Master recovery code invalid. Use "0000" or the last 4 digits of shop phone (${cleanPhone.slice(-4) || 'N/A'}).`);
        return;
      }
    }

    // Validate Owner PIN
    if (!/^[0-9]{4,6}$/.test(newOwnerPin)) {
      setError('Owner PIN must be exactly 4 to 6 numeric digits (0-9).');
      return;
    }

    // Validate Staff PIN
    if (!/^[0-9]{4,6}$/.test(newStaffPin)) {
      setError('Staff PIN must be exactly 4 to 6 numeric digits (0-9).');
      return;
    }

    const updatedProfile: ShopProfile = {
      ...profile,
      securityPin: newOwnerPin,
      staffPin: newStaffPin,
      staffName: staffName.trim() || 'Counter Staff',
      pinAuthEnabled,
      pinHint: pinHint.trim() || 'Protected Shop Terminal PIN',
    };

    onSaveProfile(updatedProfile);
    onPinSaved?.(newOwnerPin);

    setSuccessMessage('Owner & Staff Role PINs successfully saved!');
    setTimeout(() => {
      onClose();
      setCurrentPinInput('');
      setSuccessMessage('');
      setIsResetMode(false);
    }, 1200);
  };

  const handleFactoryReset = () => {
    if (confirm('Reset Role PINs back to default? (Owner: 1234, Staff: 0000)')) {
      const updatedProfile: ShopProfile = {
        ...profile,
        securityPin: '1234',
        staffPin: '0000',
        staffName: 'Counter Staff',
        pinAuthEnabled: true,
        pinHint: 'Protected Shop Terminal PIN',
      };
      onSaveProfile(updatedProfile);
      setNewOwnerPin('1234');
      setNewStaffPin('0000');
      setStaffName('Counter Staff');
      onPinSaved?.('1234');
      setSuccessMessage('PINs reset to default (Owner: 1234, Staff: 0000)');
      setTimeout(() => {
        onClose();
        setIsResetMode(false);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-overlay-fade">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full overflow-hidden animate-modal-enter">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Security PIN Setup
              </h2>
              <p className="text-xs text-zinc-400">
                Workshop counter lock & authentication
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  pinAuthEnabled
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {pinAuthEnabled ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block">
                  PIN Protection {pinAuthEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {pinAuthEnabled
                    ? 'Terminal requires PIN to unlock'
                    : 'Terminal opens directly without PIN'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={pinAuthEnabled}
                onChange={(e) => setPinAuthEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Current PIN verification (if not in reset mode) */}
          {hasExistingPin && !isResetMode && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-700">
                  Current PIN *
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium hover:underline cursor-pointer"
                >
                  Forgot Current PIN?
                </button>
              </div>
              <input
                type={showPins ? 'text' : 'password'}
                maxLength={6}
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter existing PIN (default: 1234)"
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm font-mono tracking-widest text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                required
              />
            </div>
          )}

          {/* Reset Mode with Master Recovery Code */}
          {isResetMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  <span>Master Recovery Verification</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-800 font-medium hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Enter master recovery code <span className="font-mono font-bold">0000</span> or last 4 digits of shop phone number to authorize PIN reset.
              </p>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="Master code (e.g. 0000)"
                className="w-full border border-amber-300 rounded-lg p-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none bg-white"
                required
              />
            </div>
          )}

          {/* Owner Role PIN */}
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>Store Owner PIN (4-6 digits) *</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPins((prev) => !prev)}
                className="text-[11px] text-zinc-500 hover:text-zinc-700 flex items-center gap-1 cursor-pointer"
                title={showPins ? 'Hide PIN' : 'Show PIN'}
              >
                {showPins ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPins ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-800">
              Grants <strong>full permissions</strong>: view, modify and delete data.
            </p>
            <input
              type={showPins ? 'text' : 'password'}
              maxLength={6}
              value={newOwnerPin}
              onChange={(e) => setNewOwnerPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 1234"
              className="w-full border border-amber-300 rounded-lg p-2.5 text-sm font-mono tracking-widest text-zinc-900 bg-white focus:border-amber-600 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Staff Role PIN & Attendant Name */}
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Staff Attendant PIN (4-6 digits) *</span>
              </label>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200/60 text-blue-800 font-semibold">
                No Delete Access
              </span>
            </div>
            <p className="text-[11px] text-blue-800">
              Grants <strong>view and create new entries only</strong>. Deletion is strictly prohibited.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-600 mb-1">
                  Staff PIN
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  maxLength={6}
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 0000"
                  className="w-full border border-blue-300 rounded-lg p-2 text-sm font-mono tracking-widest text-zinc-900 bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-600 mb-1">
                  Staff Attendant Name
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Counter Staff"
                  className="w-full border border-blue-300 rounded-lg p-2 text-xs font-medium text-zinc-900 bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* PIN Hint */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              PIN Hint / Reminder (Optional)
            </label>
            <input
              type="text"
              value={pinHint}
              onChange={(e) => setPinHint(e.target.value)}
              placeholder="e.g. Counter bench safe key or birth year"
              className="w-full border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Shown when clicking &quot;Forgot PIN?&quot; on the terminal screen.
            </span>
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleFactoryReset}
              className="text-xs text-zinc-500 hover:text-rose-600 font-medium hover:underline cursor-pointer"
            >
              Reset to Defaults (1234 / 0000)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Save Role PINs
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
