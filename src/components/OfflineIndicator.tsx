import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
      setShowReconnected(false);
    } else if (hasBeenOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-2 duration-200">
        <Wifi className="w-4 h-4 text-emerald-200" />
        <span>Internet Reconnected - Online Sync Active</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5 text-amber-300 font-bold">
          <WifiOff className="w-3.5 h-3.5" />
          Offline Mode Active
        </span>
        <span className="text-[11px] text-zinc-300 font-normal">
          All workshop data & receipts are saved locally to your PC
        </span>
      </div>
    </div>
  );
};
