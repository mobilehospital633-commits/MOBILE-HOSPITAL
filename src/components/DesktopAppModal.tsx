import React, { useState } from 'react';
import {
  X,
  Monitor,
  Wifi,
  WifiOff,
  Download,
  CheckCircle2,
  HardDrive,
  FileCode2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface DesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportBackup?: () => void;
}

export const DesktopAppModal: React.FC<DesktopAppModalProps> = ({
  isOpen,
  onClose,
  onExportBackup,
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<'pwa' | 'exe' | 'offline'>('pwa');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-zinc-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-white border border-zinc-700">
              <Monitor className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                Desktop App (Offline & Online)
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    Offline Mode
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Run Mobile Hospital POS on your Windows PC with 100% offline local storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/80 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-t-2 ${
              activeTab === 'pwa'
                ? 'bg-white text-zinc-900 border-zinc-900 border-x border-zinc-200'
                : 'text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            1-Click Desktop App (PWA)
          </button>
          <button
            onClick={() => setActiveTab('exe')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-t-2 ${
              activeTab === 'exe'
                ? 'bg-white text-zinc-900 border-zinc-900 border-x border-zinc-200'
                : 'text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            Windows .EXE Converter
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-t-2 ${
              activeTab === 'offline'
                ? 'bg-white text-zinc-900 border-zinc-900 border-x border-zinc-200'
                : 'text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            Offline Data & Storage
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-zinc-700">
          {/* TAB 1: PWA */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-emerald-950">
                    Native Desktop App with Offline Caching
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Installs instantly as a standalone program on Windows, Mac, or Linux. Launches without browser tabs, pins to your Windows taskbar, and works completely offline even when your internet drops.
                  </p>
                </div>
              </div>

              {isInstalled ? (
                <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-300 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Mobile Hospital is currently installed as a Desktop App!</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">Standalone Mode</span>
                </div>
              ) : isInstallable ? (
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      const res = await install();
                      if (res) onClose();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-98"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Install Mobile Hospital on Windows PC (1-Click)</span>
                  </button>
                  <p className="text-[11px] text-center text-zinc-500">
                    Creates desktop shortcut & Start Menu entry automatically
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                    How to install directly from your browser:
                  </h4>
                  <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside">
                    <li>
                      <strong>In Chrome:</strong> Click the <strong>Install icon (⊕)</strong> at the right end of the address bar, or click <strong>⋮ &gt; Save and share &gt; Install Mobile Hospital</strong>.
                    </li>
                    <li>
                      <strong>In Microsoft Edge:</strong> Click the <strong>App icon</strong> in the address bar, or click <strong>... &gt; Apps &gt; Install this site as an app</strong>.
                    </li>
                    <li>
                      Once installed, it opens in its own window and appears in your Windows Start Menu!
                    </li>
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <HardDrive className="w-4 h-4 text-zinc-700" />
                    <span>Offline Reliability</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    The Service Worker caches all code, styles, and interface icons so the application opens instantly even with no Wi-Fi.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <ShieldCheck className="w-4 h-4 text-zinc-700" />
                    <span>Zero Data Loss</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Orders and customer payments are saved to your PC's browser database and never depend on a slow internet connection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Standalone EXE */}
          {activeTab === 'exe' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-zinc-900 text-white space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  <span>Pre-Configured Windows .EXE Package</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  This project already includes full Electron configuration files (<code className="text-emerald-300">electron/main.cjs</code>, <code className="text-emerald-300">build-exe.bat</code>, and <code className="text-emerald-300">start-app.bat</code>) inside the root directory.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  How to build the .EXE file on your PC:
                </h4>

                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-2 text-zinc-700 font-sans font-semibold">
                    <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">1</span>
                    Export project to ZIP from the top AI Studio settings menu
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700 font-sans font-semibold">
                    <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">2</span>
                    Extract the ZIP folder onto your Windows PC
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700 font-sans font-semibold">
                    <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">3</span>
                    Double-click <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">build-exe.bat</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <strong>Tip for Windows SmartScreen:</strong>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    If Windows shows a blue "Windows protected your PC" screen when running the new .exe, click <strong>"More info"</strong> and then <strong>"Run anyway"</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-zinc-900">Instant Local Launcher</div>
                    <div className="text-[11px] text-zinc-500">Run <code className="text-zinc-800">start-app.bat</code> to open instantly on PC without packaging</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-zinc-200 text-zinc-800 text-[10px] font-mono font-semibold">
                    start-app.bat
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Offline Data */}
          {activeTab === 'offline' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span>Persistent Local Workshop Storage</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  All repair tickets, customer details, transactions, and inventory items are securely retained in your computer's local offline database. They will remain saved even if you close the app or restart your computer.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Data Backup & Portability
                </h4>
                <p className="text-xs text-zinc-500">
                  You can export a complete JSON snapshot of all records to a USB drive or email at any time:
                </p>

                {onExportBackup && (
                  <button
                    onClick={onExportBackup}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download Complete Offline JSON Backup</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Mobile Hospital POS & Workshop Management</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
