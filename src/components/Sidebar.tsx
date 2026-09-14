import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ListCheck,
  CreditCard,
  Boxes,
  Users,
  Sliders,
  Smartphone,
  Wallet,
  Wrench,
  Monitor,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ShopProfile, TabType } from '../types';
import { MHLogo } from './MHLogo';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  profile: ShopProfile;
  duesCount?: number;
  onOpenDesktopModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  profile,
  duesCount = 0,
  onOpenDesktopModal,
}) => {
  const isOnline = useOnlineStatus();

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-order' as TabType, label: 'New Order Entry', icon: PlusCircle },
    { id: 'orders' as TabType, label: 'Repair Orders', icon: Wrench },
    { id: 'dues' as TabType, label: 'Due Payments', icon: CreditCard, badge: duesCount },
    { id: 'inventory' as TabType, label: 'Inventory', icon: Boxes },
    { id: 'accounts' as TabType, label: 'Income & Expense', icon: Wallet },
    { id: 'customers' as TabType, label: 'Customers', icon: Users },
    { id: 'profile' as TabType, label: 'Settings & QR', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-zinc-900 text-zinc-100 flex flex-col no-print border-r border-zinc-800 shadow-2xs z-20 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950/50">
        <MHLogo
          customUrl={profile.logoUrl}
          size="sm"
          rounded="lg"
          theme="dark"
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-zinc-100 tracking-tight leading-tight truncate">
              {profile.shopName || 'MOBILE HOSPITAL'}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase leading-tight mt-0.5">
            Repair & Billing
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-2xs font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              <span className="truncate flex-1 text-left">{item.label}</span>
              {Boolean(item.badge && item.badge > 0) && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white tracking-tight leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Desktop App & Offline Status */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/30 space-y-2">
        <button
          onClick={onOpenDesktopModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-medium transition-colors border border-zinc-700/60 cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-2 truncate">
            <Monitor className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Desktop App (.EXE)</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-700/40">
            PC
          </span>
        </button>

        <div className="flex items-center justify-between px-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-300 font-medium">Online Mode</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-medium">Offline Active</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            Local DB
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 text-[11px] text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
          <span className="truncate">{profile.shopName || 'Repair Hub'}</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] shrink-0 border border-zinc-700/60">
          v4.2 POS
        </span>
      </div>
    </aside>
  );
};
