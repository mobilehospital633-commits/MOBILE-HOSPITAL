import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ListCheck,
  Boxes,
  Users,
  Sliders,
  Smartphone,
  Wallet,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { ShopProfile, TabType } from '../types';
import { MHLogo } from './MHLogo';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  profile: ShopProfile;
  stolenAlertCount?: number;
  lockedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  profile,
  stolenAlertCount = 0,
  lockedCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-order' as TabType, label: 'New Order', icon: PlusCircle },
    { id: 'orders' as TabType, label: 'Manage Repairs', icon: ListCheck },
    { id: 'device-lock' as TabType, label: 'IMEI Lock Hub', icon: Lock, alertBadge: lockedCount },
    { id: 'stolen-finder' as TabType, label: 'Stolen Phone Finder', icon: ShieldAlert, alertBadge: stolenAlertCount },
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
              {item.alertBadge && item.alertBadge > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                  {item.alertBadge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-zinc-800 bg-zinc-950/40 text-[11px] text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
          <span className="truncate">{profile.shopName || 'Repair Hub'}</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] shrink-0 border border-zinc-700/60">
          v4.2 QR
        </span>
      </div>
    </aside>
  );
};
