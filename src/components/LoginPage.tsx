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
  KeyRound,
  Check,
} from 'lucide-react';
import { AppUser, UserRole, ShopProfile } from '../types';
import { MHLogo } from './MHLogo';

interface LoginPageProps {
  users: AppUser[];
  profile: ShopProfile;
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

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  profile,
  onLogin,
  onRegister,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [saveCredentials, setSaveCredentials] = useState<boolean>(true);
  const [hasStoredCredentials, setHasStoredCredentials] = useState<boolean>(false);

  // Load saved credentials from localStorage on mount
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
      console.error('Failed to load saved credentials', e);
    }
  }, []);

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

  // Register state
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
      setLoginError('No staff account found with that username or email address.');
      return;
    }

    if (matchedUser.passwordHash !== cleanPw) {
      setLoginError('Incorrect password. Please verify your credentials.');
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
    onLogin({
      ...matchedUser,
      lastLoginAt: new Date().toISOString().split('T')[0],
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const cleanName = regName.trim();
    const cleanUsername = regUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim();

    if (!cleanName || !cleanUsername || !cleanEmail || !regPassword) {
      setRegError('Please complete all required fields (*).');
      return;
    }
    if (cleanUsername.length < 3) {
      setRegError('Username must be at least 3 characters long.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
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

    // Unique checks
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setRegError(`Username "${cleanUsername}" is already taken.`);
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setRegError(`An account with email "${cleanEmail}" is already registered.`);
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

    setRegSuccess('Staff account created successfully! Entering workstation...');
    setTimeout(() => {
      onRegister(newUser);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Brand */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-zinc-900/80 bg-zinc-950/60 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <MHLogo customUrl={profile.logoUrl} size="md" rounded="lg" theme="dark" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{profile.name || 'Mobile Hospital'}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                POS Workstation
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              {profile.tagline || 'Workshop & Device Repair Management'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Online • All Data Local</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4 relative z-10">
        <div className="w-full max-w-lg bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Card Header & Tabs */}
          <div className="p-6 pb-4 border-b border-zinc-800/80">
            <div className="text-center mb-5">
              <div className="inline-flex p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 mb-3 shadow-inner">
                <Lock className="w-5 h-5 text-zinc-300" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {mode === 'login' ? 'Staff Authentication' : 'Register New Staff Member'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                {mode === 'login'
                  ? 'Sign in to access repair tickets, customer billing receipts, and parts inventory.'
                  : 'Create a technician, manager, or owner account for this shop workstation.'}
              </p>
            </div>

            {/* Toggle Segment */}
            <div className="grid grid-cols-2 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In to Workstation
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegError('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Register New Staff
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-7">
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      autoComplete="username"
                      required
                      autoFocus
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. admin or alex.tech"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Save Username & Password Option */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer select-none group">
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
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 transition-colors cursor-pointer accent-emerald-500"
                    />
                    <span className="text-[12px] font-medium flex items-center gap-1.5">
                      <span>Save Username & Password</span>
                      {hasStoredCredentials && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.2 rounded font-normal flex items-center gap-0.5">
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
                      className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
                      title="Clear saved login credentials from this workstation browser"
                    >
                      Clear Saved
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Enter Workstation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {regError && (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. john.tech"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Staff Role & Access *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'technician', label: 'Technician', icon: Wrench },
                      { id: 'manager', label: 'Store Manager', icon: Briefcase },
                      { id: 'owner', label: 'Shop Owner', icon: Crown },
                    ].map((r) => {
                      const Icon = r.icon;
                      const selected = regRole === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRegRole(r.id as UserRole)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            selected
                              ? 'bg-zinc-800 border-zinc-400 text-white shadow-xs'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-semibold">{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 5 characters"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 pr-9 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-zinc-300"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Avatar color */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Badge Color Tag
                  </label>
                  <div className="flex items-center gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setRegAvatarColor(c.value)}
                        title={c.name}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          regAvatarColor === c.value ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.value }}
                      >
                        {regAvatarColor === c.value && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Account & Log In</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-zinc-900/80 text-center text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2 bg-zinc-950/40 relative z-10">
        <div>
          {profile.name || 'Mobile Hospital'} • Workshop Management & Billing POS
        </div>
        <div className="flex items-center gap-3">
          <span>Protected Workshop Terminal</span>
        </div>
      </footer>
    </div>
  );
};
