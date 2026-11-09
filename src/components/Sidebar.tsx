import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Wrench,
  CreditCard,
  Users,
  Sliders,
  Smartphone,
  Monitor,
  SlidersHorizontal,
  ShoppingBag,
  Package,
  Zap,
  Layers,
  ChevronDown,
  PanelLeftClose,
  ShieldCheck,
  ShieldAlert,
  Palette,
  Sparkles,
} from 'lucide-react';
import { ShopProfile, TabType, CustomerEntryMode } from '../types';
import { MHLogo } from './MHLogo';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { resolveMenuBarStyle } from '../utils/menuBarUtils';
import { resolveAccentColors } from '../utils/themeUtils';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  profile: ShopProfile;
  duesCount?: number;
  mdmLockedCount?: number;
  onOpenDesktopModal?: () => void;
  onOpenScreenPageModal?: () => void;
  onOpenDeviceModal?: () => void;
  onOpenThemeModal?: () => void;
  customerEntryMode?: CustomerEntryMode;
  onSelectCustomerEntryMode?: (mode: CustomerEntryMode) => void;
  orderDirectoryFilter?: 'all' | 'repair' | 'order' | 'sale';
  onSelectOrderDirectoryFilter?: (filter: 'all' | 'repair' | 'order' | 'sale') => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  profile,
  duesCount = 0,
  mdmLockedCount = 0,
  onOpenDesktopModal,
  onOpenScreenPageModal,
  onOpenDeviceModal,
  onOpenThemeModal,
  customerEntryMode = 'repair',
  onSelectCustomerEntryMode,
  orderDirectoryFilter = 'all',
  onSelectOrderDirectoryFilter,
  isOpen = true,
  onToggle,
}) => {
  const isOnline = useOnlineStatus();
  const [isCustomEntryOpen, setIsCustomEntryOpen] = useState(true);
  const [isOrdersDirectoryOpen, setIsOrdersDirectoryOpen] = useState(true);

  const accentColors = resolveAccentColors(profile.themeAccent || 'slate', profile.customAccentColor || '#2563eb');
  const menuStyle = resolveMenuBarStyle(profile, accentColors.color);

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-order' as TabType, label: 'Customer Entry', icon: PlusCircle },
    { id: 'orders' as TabType, label: 'Orders & Directory', icon: Layers },
    { id: 'dues' as TabType, label: 'Due Payments', icon: CreditCard, badge: duesCount },
    { id: 'inventory' as TabType, label: 'Inventory & Stock', icon: Package },
    { id: 'customers' as TabType, label: 'Customers', icon: Users },
    { id: 'profile' as TabType, label: 'Settings & QR', icon: Sliders },
  ];

  return (
    <>
      <aside
        style={menuStyle.sidebarInlineStyle}
        className={`${menuStyle.sidebarClasses} ${menuStyle.textColorClass} flex flex-col no-print border-r shadow-2xs z-20 shrink-0 select-none ${
          isOpen
            ? 'w-64 opacity-100 translate-x-0'
            : 'w-0 -translate-x-full opacity-0 pointer-events-none border-r-0 overflow-hidden'
        }`}
      >
      {/* Brand Header */}
      <div
        style={menuStyle.brandHeaderStyle}
        className="p-4 border-b flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-3 min-w-0">
          <MHLogo
            customUrl={profile.logoUrl}
            size="sm"
            rounded="lg"
            theme={menuStyle.isLight ? 'light' : 'dark'}
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold tracking-tight leading-tight truncate ${menuStyle.textColorClass}`}>
                {profile.shopName || 'MOBILE HOSPITAL'}
              </span>
            </div>
            <span className={`text-[10px] font-medium tracking-wider uppercase leading-tight mt-0.5 ${menuStyle.textMutedClass}`}>
              Workshop POS & Billing
            </span>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1">
          {onOpenThemeModal && (
            <button
              type="button"
              onClick={onOpenThemeModal}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                menuStyle.isLight
                  ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Menu Bar Color & Style"
              aria-label="Menu Bar Color & Style"
            >
              <Palette className="w-4 h-4" />
            </button>
          )}

          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                menuStyle.isLight
                  ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Hide Sidebar (Ctrl+B)"
              aria-label="Hide Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          const activeClass = menuStyle.isLight
            ? 'bg-zinc-900 text-white font-semibold shadow-xs border border-zinc-800'
            : 'bg-white/15 text-white font-semibold shadow-xs border border-white/20';
          const inactiveClass = menuStyle.isLight
            ? 'text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900'
            : 'text-zinc-300 hover:bg-white/10 hover:text-white';
          const subInactiveClass = menuStyle.isLight
            ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-900/5'
            : 'text-zinc-300 hover:text-white hover:bg-white/10';

          if (item.id === 'new-order') {
            return (
              <div key={item.id} className="space-y-1">
                <div
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                    isActive ? activeClass : inactiveClass
                  }`}
                  onClick={() => {
                    if (currentTab !== 'new-order') {
                      onTabChange('new-order');
                      setIsCustomEntryOpen(true);
                    } else {
                      setIsCustomEntryOpen((prev) => !prev);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (currentTab !== 'new-order') {
                        onTabChange('new-order');
                        setIsCustomEntryOpen(true);
                      } else {
                        setIsCustomEntryOpen((prev) => !prev);
                      }
                    }
                  }}
                  aria-expanded={isCustomEntryOpen}
                  title={isCustomEntryOpen ? 'Click to collapse submenu' : 'Click to expand submenu'}
                >
                  <div className="flex items-center gap-3 truncate flex-1">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : menuStyle.textMutedClass}`} />
                    <span className="truncate text-left">{item.label}</span>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCustomEntryOpen((prev) => !prev);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setIsCustomEntryOpen((prev) => !prev);
                      }
                    }}
                    className={`p-1 -mr-1 rounded-md transition-colors ${
                      menuStyle.isLight ? 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    aria-label={isCustomEntryOpen ? 'Collapse Customer Entry' : 'Expand Customer Entry'}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isCustomEntryOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </span>
                </div>

                {/* Collapsible Submenu Options for Customer Entry (2 Clean Options) */}
                {isCustomEntryOpen && (
                  <div className="pl-4 pr-1 space-y-1 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('new-order');
                        onSelectCustomerEntryMode?.('repair');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        currentTab === 'new-order' && (customerEntryMode === 'repair' || customerEntryMode === 'sale')
                          ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                          : subInactiveClass
                      }`}
                    >
                      <div className="flex items-center gap-0.5 text-emerald-400 shrink-0">
                        <Wrench className="w-3 h-3" />
                        <span className="text-[9px] font-bold">/</span>
                        <ShoppingBag className="w-2.5 h-2.5" />
                      </div>
                      <span className="truncate">Service Repair & Sales</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('new-order');
                        onSelectCustomerEntryMode?.('order');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        currentTab === 'new-order' && customerEntryMode === 'order'
                          ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                          : subInactiveClass
                      }`}
                    >
                      <Package className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">Customer Pre-Order</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }

          if (item.id === 'orders') {
            return (
              <div key={item.id} className="space-y-1">
                <div
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer group ${
                    isActive ? activeClass : inactiveClass
                  }`}
                  onClick={() => {
                    if (currentTab !== 'orders') {
                      onTabChange('orders');
                      onSelectOrderDirectoryFilter?.('all');
                      setIsOrdersDirectoryOpen(true);
                    } else {
                      setIsOrdersDirectoryOpen((prev) => !prev);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (currentTab !== 'orders') {
                        onTabChange('orders');
                        onSelectOrderDirectoryFilter?.('all');
                        setIsOrdersDirectoryOpen(true);
                      } else {
                        setIsOrdersDirectoryOpen((prev) => !prev);
                      }
                    }
                  }}
                  aria-expanded={isOrdersDirectoryOpen}
                  title={isOrdersDirectoryOpen ? 'Click to collapse submenu' : 'Click to expand submenu'}
                >
                  <div className="flex items-center gap-3 truncate flex-1">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : menuStyle.textMutedClass}`} />
                    <span className="truncate text-left">{item.label}</span>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOrdersDirectoryOpen((prev) => !prev);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setIsOrdersDirectoryOpen((prev) => !prev);
                      }
                    }}
                    className={`p-1 -mr-1 rounded-md transition-colors ${
                      menuStyle.isLight ? 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    aria-label={isOrdersDirectoryOpen ? 'Collapse Orders & Directory' : 'Expand Orders & Directory'}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOrdersDirectoryOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </span>
                </div>

                {/* Collapsible Submenu Options for Orders & Directory */}
                {isOrdersDirectoryOpen && (
                  <div className="pl-4 pr-1 space-y-1 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('orders');
                        onSelectOrderDirectoryFilter?.('all');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        currentTab === 'orders' && orderDirectoryFilter === 'all'
                          ? menuStyle.isLight
                            ? 'bg-zinc-800 text-white font-semibold'
                            : 'bg-white/20 text-white font-semibold'
                          : subInactiveClass
                      }`}
                    >
                      <Layers className="w-3 h-3 text-zinc-300 shrink-0" />
                      <span className="truncate">ALL ORDERS</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('orders');
                        onSelectOrderDirectoryFilter?.('repair');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        currentTab === 'orders' && orderDirectoryFilter === 'repair'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : subInactiveClass
                      }`}
                    >
                      <Wrench className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">SERVICE REPAIR</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('orders');
                        onSelectOrderDirectoryFilter?.('order');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        currentTab === 'orders' && orderDirectoryFilter === 'order'
                          ? 'bg-blue-600 text-white font-semibold'
                          : subInactiveClass
                      }`}
                    >
                      <Package className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">CUSTOMER ORDERS</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('orders');
                        onSelectOrderDirectoryFilter?.('sale');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        currentTab === 'orders' && orderDirectoryFilter === 'sale'
                          ? 'bg-violet-600 text-white font-semibold'
                          : subInactiveClass
                      }`}
                    >
                      <ShoppingBag className="w-3 h-3 text-violet-400 shrink-0" />
                      <span className="truncate">CUSTOMER SALES</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive ? activeClass : inactiveClass
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : menuStyle.textMutedClass}`} />
              <span className="truncate flex-1 text-left">{item.label}</span>
              {Boolean(item.badge && item.badge > 0) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-rose-600 text-white tracking-tight leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Screen & Page Size Adjustment Button */}
      {onOpenScreenPageModal && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onOpenScreenPageModal}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer shadow-2xs group active:scale-98 ${
              menuStyle.isLight
                ? 'bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border-zinc-200'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10'
            }`}
            title="Adjust display smoothness, visual sharpness, screen scale, and receipt paper sizes"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-105 transition-transform" />
              <span>Smoothness & Display</span>
            </div>
            <SlidersHorizontal className={`w-3.5 h-3.5 ${menuStyle.textMutedClass}`} />
          </button>
        </div>
      )}

      {/* Offline Status */}
      <div
        style={menuStyle.footerStyle}
        className="p-3 border-t"
      >
        <div className="flex items-center justify-between px-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span className={`font-medium ${menuStyle.textColorClass}`}>
              {isOnline ? 'System Online' : 'Offline Mode'}
            </span>
          </div>
          <span className={`text-[10px] font-mono ${menuStyle.textMutedClass}`}>
            Encrypted Local DB
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={menuStyle.footerStyle}
        className={`p-3 border-t text-[11px] ${menuStyle.textMutedClass} flex items-center justify-between`}
      >
        <div className="flex items-center gap-2 truncate">
          <Smartphone className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span className={`truncate font-medium ${menuStyle.textColorClass}`}>{profile.shopName || 'Mobile Hospital'}</span>
        </div>
        <span className="text-[10px] font-mono opacity-80">
          Ready
        </span>
      </div>
    </aside>

    {/* Dashboard Icon in Bottom Left Corner when Sidebar is Hidden */}
    {!isOpen && (
      <div className="fixed bottom-4 left-4 z-40 no-print animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => {
            if (currentTab !== 'dashboard') {
              onTabChange('dashboard');
            } else if (onToggle) {
              onToggle();
            }
          }}
          onDoubleClick={() => onToggle?.()}
          title={
            currentTab === 'dashboard'
              ? 'Dashboard Active (Click to expand sidebar)'
              : 'Dashboard (Click to switch to Dashboard)'
          }
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl active:scale-95 group relative ${
            currentTab === 'dashboard'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 ring-4 ring-emerald-500/20'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 hover:border-zinc-500 shadow-black/40 hover:scale-105'
          }`}
          aria-label="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5 transition-transform group-hover:scale-110" />

          {/* Hover Tooltip / Floating Label */}
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-900/95 backdrop-blur-xs text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-zinc-700/80 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${currentTab === 'dashboard' ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
            <span>Dashboard</span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {currentTab === 'dashboard' ? 'Active' : 'Click to View'}
            </span>
          </div>
        </button>
      </div>
    )}
  </>
);
};
