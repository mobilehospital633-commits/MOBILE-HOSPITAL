import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Wrench,
  Briefcase,
  Crown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  X,
  Check,
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { MHLogo } from './MHLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
  initialMode?: 'login' | 'register';
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  onRegister: (newUser: AppUser) => void;
}

const AVATAR_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Cobalt', value: '#2563eb' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Slate', value: '#475569' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  canClose = false,
  initialMode = 'login',
  users,
  onLogin,
  onRegister,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [saveCredentials, setSaveCredentials] = useState<boolean>(true);
  const [hasStoredCredentials, setHasStoredCredentials] = useState<boolean>(false);

  // Load saved credentials from localStorage on modal open/mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mh_saved_credentials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.identifier) {
          setLoginIdentifier(parsed.identifier);
          if (parsed.password) {
            setLoginPassword(parsed.password);
          }
          setSaveCredentials(true);
          setHasStoredCredentials(true);
        }
      }
    } catch (e) {
      console.error('Failed to load saved credentials in AuthModal', e);
    }
  }, [isOpen]);

  const handleClearSavedCredentials = () => {
    try {
      localStorage.removeItem('mh_saved_credentials');
      setLoginIdentifier('');
      setLoginPassword('');
      setHasStoredCredentials(false);
    } catch (e) {
      console.error('Failed to clear credentials', e);
    }
  };

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('technician');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAvatarColor, setRegAvatarColor] = useState('#10b981');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanId = loginIdentifier.trim().toLowerCase();
    const cleanPw = loginPassword.trim();

    if (!cleanId || !cleanPw) {
      setLoginError('Please enter both your username/email and password.');
      return;
    }

    const matchedUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId
    );

    if (!matchedUser) {
      setLoginError('No account found with that username or email address.');
      return;
    }

    if (matchedUser.passwordHash !== cleanPw) {
      setLoginError('Incorrect password. Please try again or use a demo account.');
      return;
    }

    // Save or clear credentials on this workstation device
    try {
      if (saveCredentials) {
        localStorage.setItem(
          'mh_saved_credentials',
          JSON.stringify({
            identifier: cleanId,
            password: cleanPw,
            savedAt: new Date().toISOString(),
          })
        );
        setHasStoredCredentials(true);
      } else {
        localStorage.removeItem('mh_saved_credentials');
        setHasStoredCredentials(false);
      }
    } catch (e) {
      console.error('Failed to update credentials storage', e);
    }

    // Success
    onLogin(matchedUser);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const cleanName = regName.trim();
    const cleanUsername = regUsername.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim();

    if (!cleanName) {
      setRegError('Full Name is required.');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setRegError('Username must be at least 3 alphanumeric characters.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRegError('Please provide a valid email address.');
      return;
    }
    if (regPassword.length < 5) {
      setRegError('Password must be at least 5 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    // Check unique username and email
    const usernameExists = users.some(
      (u) => u.username.toLowerCase() === cleanUsername
    );
    if (usernameExists) {
      setRegError(`Username "${cleanUsername}" is already taken. Choose another.`);
      return;
    }

    const emailExists = users.some(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (emailExists) {
      setRegError(`An account with email "${cleanEmail}" already exists. Please sign in.`);
      return;
    }

    const newUser: AppUser = {
      id: 'USR-' + Math.floor(100 + Math.random() * 900),
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone || undefined,
      passwordHash: regPassword,
      role: regRole,
      avatarColor: regAvatarColor,
      createdAt: new Date().toISOString().split('T')[0],
      lastLoginAt: new Date().toISOString().split('T')[0],
    };

    setRegSuccess('Account created successfully! Logging you in...');
    setTimeout(() => {
      onRegister(newUser);
    }, 600);
  };

  const handleQuickFill = (u: AppUser) => {
    setLoginIdentifier(u.username);
    setLoginPassword(u.passwordHash);
    setLoginError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden my-6"
        id="authModalCard"
      >
        {/* Close Button if allowClose */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors z-10 cursor-pointer"
            aria-label="Close login dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Brand Header */}
        <div className="p-6 bg-linear-to-b from-zinc-50 to-white border-b border-zinc-100 text-center relative">
          <div className="flex justify-center mb-3">
            <MHLogo size="md" rounded="lg" theme="dark" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Mobile Hospital POS
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            Workshop Management, Device Diagnostics & Customer Invoicing
          </p>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl mt-4 max-w-xs mx-auto border border-zinc-200/70">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegError('');
                setRegSuccess('');
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Register Staff
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {mode === 'login' ? (
            /* ================= SIGN IN FORM ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. admin or alex.tech"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    Password
                  </label>
                  <span className="text-[10px] text-zinc-400">Default PIN: admin123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-9 py-2 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Save Username & Password Option */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={saveCredentials}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setSaveCredentials(isChecked);
                      if (!isChecked && hasStoredCredentials) {
                        localStorage.removeItem('mh_saved_credentials');
                        setHasStoredCredentials(false);
                      }
                    }}
                    className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500/20 focus:ring-offset-0 transition-colors cursor-pointer accent-emerald-600"
                  />
                  <span className="text-[12px] font-medium flex items-center gap-1.5">
                    <span>Save Username & Password</span>
                    {hasStoredCredentials && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-normal flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>Saved on device</span>
                      </span>
                    )}
                  </span>
                </label>

                {hasStoredCredentials && (
                  <button
                    type="button"
                    onClick={handleClearSavedCredentials}
                    className="text-[11px] text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer underline-offset-2 hover:underline"
                    title="Clear saved login credentials from this browser"
                  >
                    Clear Saved
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer active:scale-98"
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In to System</span>
              </button>

              {/* Quick Fill Demo Section */}
              <div className="pt-3 border-t border-zinc-100">
                <p className="text-[11px] text-zinc-500 font-medium mb-2 text-center">
                  Quick Access Demo Accounts:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => users[0] && handleQuickFill(users[0])}
                    className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-lg text-left bg-zinc-50 hover:bg-zinc-100/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>Shop Owner</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">admin / admin123</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => users[1] && handleQuickFill(users[1])}
                    className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-lg text-left bg-zinc-50 hover:bg-zinc-100/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                      <Wrench className="w-3.5 h-3.5 text-blue-500" />
                      <span>Technician</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">alex.tech / tech123</div>
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setLoginError('');
                  }}
                  className="text-xs text-zinc-600 hover:text-zinc-900 font-medium hover:underline cursor-pointer"
                >
                  Need to add a new technician? Register here
                </button>
              </div>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Vikram Patel"
                    className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. vikram.tech"
                    className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none transition-colors font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tech@hospital.com"
                    className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Staff Role Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Staff Role & Permissions *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('technician')}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      regRole === 'technician'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white'
                    }`}
                  >
                    <Wrench className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <div className="text-xs font-bold">Technician</div>
                    <div className="text-[9px] text-zinc-400">Repairs & Status</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('manager')}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      regRole === 'manager'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <div className="text-xs font-bold">Manager</div>
                    <div className="text-[9px] text-zinc-400">Jobs & Inventory</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('owner')}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      regRole === 'owner'
                        ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-1 ring-amber-600'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white'
                    }`}
                  >
                    <Crown className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <div className="text-xs font-bold">Shop Owner</div>
                    <div className="text-[9px] text-zinc-400">Full Access</div>
                  </button>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 5 characters"
                      className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Color Tag Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Badge Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setRegAvatarColor(c.value)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        regAvatarColor === c.value ? 'scale-125 ring-2 ring-zinc-900 ring-offset-1' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    >
                      {regAvatarColor === c.value && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <span className="text-xs text-zinc-500 ml-2 font-medium">
                    Avatar color on job tickets
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer mt-4"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Register Staff Member & Sign In</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRegError('');
                  }}
                  className="text-xs text-zinc-600 hover:text-zinc-900 font-medium hover:underline cursor-pointer"
                >
                  Already have an account? Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security & Workshop Footer */}
        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span>Encrypted Local Workstation Storage</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-400">v2.4 Live</span>
        </div>
      </div>
    </div>
  );
};
