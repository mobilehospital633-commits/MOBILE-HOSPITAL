import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCw, Home, ShieldAlert, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  cacheCleared: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      cacheCleared: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mobile Hospital ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToDashboard = () => {
    try {
      localStorage.removeItem('mh_active_tab');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private handleSafeCacheReset = () => {
    try {
      localStorage.removeItem('mh_screen_config');
      localStorage.removeItem('mh_sidebar_open');
      localStorage.removeItem('mh_remember_pin');
      localStorage.removeItem('mh_saved_device_pin');
      localStorage.removeItem('mh_app_edition');
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      this.setState({ cacheCleared: true });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      console.warn('Cache clear error:', e);
      window.location.reload();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-900 text-zinc-100 font-sans select-none">
          <div className="max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            {/* Header Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Application Recovered from an Error
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                The terminal encountered an unexpected rendering issue. Your repair data and customer records are safely stored in local database.
              </p>
            </div>

            {/* Error Message Box */}
            {this.state.error && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-left">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Diagnostics Info
                </div>
                <div className="text-xs font-mono text-rose-400 break-words leading-relaxed max-h-28 overflow-y-auto">
                  {this.state.error.message || String(this.state.error)}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-98"
              >
                <RotateCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetToDashboard}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Home className="w-4 h-4 text-zinc-400" />
                <span>Dashboard</span>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={this.handleSafeCacheReset}
                disabled={this.state.cacheCleared}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 underline font-medium cursor-pointer inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {this.state.cacheCleared ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cache cleared! Reloading...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clear Local View Cache & Reload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
