import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { RotateCw, Lock, KeyRound, Monitor, ZoomIn, ZoomOut, Wrench, ShoppingBag, Package, Flame, PanelLeftClose, PanelLeftOpen, Crown, UserCheck, Palette, Sparkles, ArrowUp, Cloud, CheckCircle2, LogOut, Mail, Globe, ShieldCheck } from 'lucide-react';
import { RepairOrder, InventoryItem, ShopProfile, TabType, CustomerEntryMode, AccountTransaction, ThemeMode, ThemeAccent, BackgroundStyle, ScreenConfig, DEFAULT_SCREEN_CONFIG, PageStructureConfig, DEFAULT_PAGE_STRUCTURE, AuthUser, UserRole, MenuBarColorPreset, MenuBarStyle, MdmLockRecord, MdmLockType, SmoothnessLevel, SharpnessLevel, ThermalSharpnessLevel } from './types';
import { INITIAL_ORDERS, INITIAL_INVENTORY, INITIAL_PROFILE, INITIAL_TRANSACTIONS, INITIAL_MDM_RECORDS } from './data';
import { COMPREHENSIVE_PARTS_CATALOG } from './partsCatalog';
import { Sidebar } from './components/Sidebar';
import { MHLogo } from './components/MHLogo';
import { ThemeSelector } from './components/ThemeSelector';
import { PinLoginPage } from './components/PinLoginPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BackupPayload } from './lib/googleDrive';
import { formatDeviceDisplay } from './utils/orderUtils';
import { applyThemeModeAndAccent, resolveAccentColors } from './utils/themeUtils';
import { resolveMenuBarStyle } from './utils/menuBarUtils';
import {
  syncAllToFirestore,
  getFirebaseConfig,
  testFirestoreConnection,
  isFirestoreQuotaExceeded,
  syncPreviousDataToCloudAndPull,
  subscribeToOrders,
  saveOrderToFirestore,
  deleteOrderFromFirestore,
  saveInventoryItemToFirestore,
  deleteInventoryItemFromFirestore,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  logoutFirebase,
} from './lib/firebase';

// Lazy-loaded tab components & modals for instant initial bundle loading and code splitting
const DashboardTab = lazy(() => import('./components/DashboardTab').then((m) => ({ default: m.DashboardTab })));
const NewOrderTab = lazy(() => import('./components/NewOrderTab').then((m) => ({ default: m.NewOrderTab })));
const OrdersTab = lazy(() => import('./components/OrdersTab').then((m) => ({ default: m.OrdersTab })));
const CustomersTab = lazy(() => import('./components/CustomersTab').then((m) => ({ default: m.CustomersTab })));
const SettingsTab = lazy(() => import('./components/SettingsTab').then((m) => ({ default: m.SettingsTab })));
const DuePaymentsTab = lazy(() => import('./components/DuePaymentsTab').then((m) => ({ default: m.DuePaymentsTab })));
const InventoryTab = lazy(() => import('./components/InventoryTab').then((m) => ({ default: m.InventoryTab })));
const ReceiptModal = lazy(() => import('./components/ReceiptModal').then((m) => ({ default: m.ReceiptModal })));
const EditOrderModal = lazy(() => import('./components/EditOrderModal').then((m) => ({ default: m.EditOrderModal })));
const ScreenAndPageSizeModal = lazy(() => import('./components/ScreenAndPageSizeModal').then((m) => ({ default: m.ScreenAndPageSizeModal })));
const PinSetupModal = lazy(() => import('./components/PinSetupModal').then((m) => ({ default: m.PinSetupModal })));
const DesktopAppModal = lazy(() => import('./components/DesktopAppModal').then((m) => ({ default: m.DesktopAppModal })));

const ViewFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center animate-pulse" role="status">
    <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-2.5" />
    <span className="text-xs font-medium text-zinc-500">Loading view...</span>
  </div>
);

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [customerEntryMode, setCustomerEntryMode] = useState<CustomerEntryMode>('repair');
  const [ordersDirectoryFilter, setOrdersDirectoryFilter] = useState<'all' | 'repair' | 'order' | 'sale'>('all');
  const [settingsSubtab, setSettingsSubtab] = useState<'general' | 'tax' | 'structure' | 'features' | 'system' | 'security' | 'drive' | 'firebase' | 'reset'>('features');
  const [orders, setOrders] = useState<RepairOrder[]>(() => {
    try {
      const saved = localStorage.getItem('mh_orders');
      if (saved) {
        const parsed: RepairOrder[] = JSON.parse(saved);
        return parsed.map((o) => {
          if (
            o.id?.startsWith('ORD-') ||
            (o.problem?.startsWith('Customer Order:') && o.orderType !== 'repair')
          ) {
            return { ...o, orderType: 'order' as const };
          }
          if (o.id?.startsWith('SL-')) {
            return { ...o, orderType: 'sale' as const };
          }
          if (o.id?.startsWith('T-') && !o.orderType) {
            return { ...o, orderType: 'repair' as const };
          }
          return o;
        });
      }
      return INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('mh_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 20 && parsed[0]?.category && parsed[0]?.brand) {
          return parsed;
        }
      }
      return INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  const [transactions, setTransactions] = useState<AccountTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('mh_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [mdmRecords, setMdmRecords] = useState<MdmLockRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mh_mdm_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_MDM_RECORDS;
    } catch {
      return INITIAL_MDM_RECORDS;
    }
  });

  const [profile, setProfile] = useState<ShopProfile>(() => {
    try {
      const saved = localStorage.getItem('mh_profile');
      if (saved) {
        return { ...INITIAL_PROFILE, ...JSON.parse(saved) };
      }
      return INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  // Role-Based User Authentication State ('owner' vs 'staff')
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    try {
      const saved = localStorage.getItem('mh_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'owner' || parsed.role === 'staff')) {
          return parsed;
        }
      }
    } catch {}
    return {
      role: 'owner',
      name: 'Store Owner',
      loginTime: new Date().toISOString(),
    };
  });

  // Auto Sync State & Mechanics
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mh_auto_sync') !== 'false';
  });
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string>(() => {
    return localStorage.getItem('mh_last_sync_time') || 'Just now';
  });

  // Firebase Cloud State
  const [firebaseStatus, setFirebaseStatus] = useState<'synced' | 'syncing' | 'error' | 'connected' | 'idle'>('idle');
  const [firebaseLastSync, setFirebaseLastSync] = useState<string | null>(null);

  const ordersRef = React.useRef(orders);
  ordersRef.current = orders;
  const inventoryRef = React.useRef(inventory);
  inventoryRef.current = inventory;
  const transactionsRef = React.useRef(transactions);
  transactionsRef.current = transactions;
  const profileRef = React.useRef(profile);
  profileRef.current = profile;
  const mdmRecordsRef = React.useRef(mdmRecords);
  mdmRecordsRef.current = mdmRecords;

  const handleUnlock = async (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('mh_auth_user', JSON.stringify(user));
    } catch {}
    setIsLocked(false);

    // Cross-device cloud sync: ensure all previous records on this device or cloud are unified
    try {
      setFirebaseStatus('syncing');
      const curOrders = ordersRef.current;
      const curInventory = inventoryRef.current;
      const curTransactions = transactionsRef.current;
      const curProfile = profileRef.current;

      const res = await syncPreviousDataToCloudAndPull({
        localOrders: curOrders,
        localInventory: curInventory,
        localTransactions: curTransactions,
        localProfile: curProfile,
      });

      if (res.mergedOrders.length > 0) {
        setOrders(res.mergedOrders);
        localStorage.setItem('mh_orders', JSON.stringify(res.mergedOrders));
      }
      if (res.mergedInventory.length > 0) {
        setInventory(res.mergedInventory);
        localStorage.setItem('mh_inventory', JSON.stringify(res.mergedInventory));
      }
      if (res.mergedTransactions.length > 0) {
        setTransactions(res.mergedTransactions);
        localStorage.setItem('mh_transactions', JSON.stringify(res.mergedTransactions));
      }
      if (res.mergedProfile && res.mergedProfile.shopName) {
        setProfile(res.mergedProfile);
        localStorage.setItem('mh_profile', JSON.stringify(res.mergedProfile));
      }

      setFirebaseStatus('synced');
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setFirebaseLastSync(nowStr);
      setLastSyncText(nowStr);
      localStorage.setItem('mh_last_sync_time', nowStr);
    } catch (e) {
      console.warn('Post-login cloud sync error:', e);
      setFirebaseStatus('idle');
    }
  };

  const handleLockTerminal = () => {
    setIsLocked(true);
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch {}
    setIsLocked(true);
  };

  // PIN Terminal Security Lock State
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mh_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.pinAuthEnabled === false) return false;
      }
    } catch {
      // fallback
    }
    return true;
  });

  // Clean up any legacy lite edition preference so the app is always in the standard full suite
  useEffect(() => {
    try {
      localStorage.removeItem('mh_app_edition');
    } catch {}
  }, []);

  const [isPinSetupModalOpen, setIsPinSetupModalOpen] = useState(false);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);
  const [isScreenPageModalOpen, setIsScreenPageModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Sidebar Visibility Toggle State (persisted across reloads)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mh_sidebar_open');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mh_sidebar_open', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Smooth Scroll Ref & Scroll-To-Top Monitoring
  const mainScrollRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Smooth scroll back to top when switching views/tabs
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab]);

  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollTop(el.scrollTop > 280);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Screen & Page Size Adjustment State
  const [screenConfig, setScreenConfig] = useState<ScreenConfig>(() => {
    try {
      const saved = localStorage.getItem('mh_screen_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return profile.screenConfig || DEFAULT_SCREEN_CONFIG;
  });

  const pageStructure = profile.pageStructure || DEFAULT_PAGE_STRUCTURE;

  const handleUpdateScreenConfig = (newConfig: ScreenConfig) => {
    setScreenConfig(newConfig);
    try {
      localStorage.setItem('mh_screen_config', JSON.stringify(newConfig));
    } catch {}
    setProfile((prev) => {
      const updated = {
        ...prev,
        screenConfig: newConfig,
        visualSmoothness: newConfig.smoothness || prev.visualSmoothness,
        visualSharpness: newConfig.sharpness || prev.visualSharpness,
        thermalSharpness: newConfig.thermalSharpness || prev.thermalSharpness,
      };
      try {
        localStorage.setItem('mh_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUpdatePageStructure = (newStructure: PageStructureConfig) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        pageStructure: newStructure,
        thermalSharpness: newStructure.thermalSharpness || prev.thermalSharpness,
      };
      try {
        localStorage.setItem('mh_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleQuickZoom = (delta: number) => {
    setScreenConfig((prev) => {
      const nextScale = Math.min(150, Math.max(75, prev.scale + delta));
      const updated = { ...prev, scale: nextScale };
      try {
        localStorage.setItem('mh_screen_config', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Initial cloud checks and cross-device sync on load
  useEffect(() => {
    testFirestoreConnection()
      .then(async (res) => {
        if (res.connected) {
          setFirebaseStatus('synced');
          // Reconcile and pull previous cloud data so any new device gets the full dataset immediately
          try {
            const curOrders = ordersRef.current;
            const curInventory = inventoryRef.current;
            const curTransactions = transactionsRef.current;
            const curProfile = profileRef.current;

            const pullRes = await syncPreviousDataToCloudAndPull({
              localOrders: curOrders,
              localInventory: curInventory,
              localTransactions: curTransactions,
              localProfile: curProfile,
            });

            if (pullRes.mergedOrders.length > 0) {
              setOrders(pullRes.mergedOrders);
              localStorage.setItem('mh_orders', JSON.stringify(pullRes.mergedOrders));
            }
            if (pullRes.mergedInventory.length > 0) {
              setInventory(pullRes.mergedInventory);
              localStorage.setItem('mh_inventory', JSON.stringify(pullRes.mergedInventory));
            }
            if (pullRes.mergedTransactions.length > 0) {
              setTransactions(pullRes.mergedTransactions);
              localStorage.setItem('mh_transactions', JSON.stringify(pullRes.mergedTransactions));
            }
            if (pullRes.mergedProfile && pullRes.mergedProfile.shopName) {
              setProfile(pullRes.mergedProfile);
              localStorage.setItem('mh_profile', JSON.stringify(pullRes.mergedProfile));
            }
            const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setFirebaseLastSync(nowStr);
            setLastSyncText(nowStr);
          } catch (e) {
            console.warn('Initial cloud reconcile error:', e);
          }
        } else if (res.isQuotaExceeded) {
          setFirebaseStatus('error');
        } else {
          setFirebaseStatus('idle');
        }
      })
      .catch(() => setFirebaseStatus('idle'));
  }, []);

  // Real-time subscription to orders collection for multi-device sync
  useEffect(() => {
    const unsub = subscribeToOrders((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders((prev) => {
          const localMap = new Map(prev.map((o) => [o.id, o]));
          let hasChange = false;
          for (const co of cloudOrders) {
            if (!co.id) continue;
            const local = localMap.get(co.id);
            if (!local) {
              localMap.set(co.id, co);
              hasChange = true;
            } else if (JSON.stringify(local) !== JSON.stringify(co)) {
              localMap.set(co.id, co);
              hasChange = true;
            }
          }
          if (hasChange) {
            const merged = Array.from(localMap.values());
            try {
              localStorage.setItem('mh_orders', JSON.stringify(merged));
            } catch {}
            return merged;
          }
          return prev;
        });
      }
    });
    return () => unsub();
  }, []);

  const triggerSync = useCallback(async (silent = false) => {
    setIsAutoSyncing(true);
    try {
      const curOrders = ordersRef.current;
      const curInventory = inventoryRef.current;
      const curTransactions = transactionsRef.current;
      const curProfile = profileRef.current;
      const curMdmRecords = mdmRecordsRef.current;

      localStorage.setItem('mh_orders', JSON.stringify(curOrders));
      localStorage.setItem('mh_inventory', JSON.stringify(curInventory));
      localStorage.setItem('mh_transactions', JSON.stringify(curTransactions));
      localStorage.setItem('mh_profile', JSON.stringify(curProfile));
      localStorage.setItem('mh_mdm_records', JSON.stringify(curMdmRecords));
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncText(nowStr);
      localStorage.setItem('mh_last_sync_time', nowStr);

      // Cloud reconciliation sync: pulls new cloud items & pushes local items
      if (!silent) {
        if (!isFirestoreQuotaExceeded()) {
          setFirebaseStatus('syncing');
          const pullRes = await syncPreviousDataToCloudAndPull({
            localOrders: curOrders,
            localInventory: curInventory,
            localTransactions: curTransactions,
            localProfile: curProfile,
          });

          if (pullRes.mergedOrders.length > 0) {
            setOrders(pullRes.mergedOrders);
            localStorage.setItem('mh_orders', JSON.stringify(pullRes.mergedOrders));
          }
          if (pullRes.mergedInventory.length > 0) {
            setInventory(pullRes.mergedInventory);
            localStorage.setItem('mh_inventory', JSON.stringify(pullRes.mergedInventory));
          }
          if (pullRes.mergedTransactions.length > 0) {
            setTransactions(pullRes.mergedTransactions);
            localStorage.setItem('mh_transactions', JSON.stringify(pullRes.mergedTransactions));
          }
          if (pullRes.mergedProfile && pullRes.mergedProfile.shopName) {
            setProfile(pullRes.mergedProfile);
            localStorage.setItem('mh_profile', JSON.stringify(pullRes.mergedProfile));
          }

          setFirebaseStatus('synced');
          setFirebaseLastSync(nowStr);
        } else {
          setFirebaseStatus('error');
        }
      }
    } catch (err) {
      console.error('Auto sync error:', err);
      setFirebaseStatus('error');
    } finally {
      setTimeout(() => {
        setIsAutoSyncing(false);
      }, 500);
    }
  }, []);

  const toggleAutoSync = () => {
    setAutoSyncEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('mh_auto_sync', next ? 'true' : 'false');
      if (next) {
        triggerSync(false);
      }
      return next;
    });
  };

  // Continuous background auto-sync interval every 60s without re-triggering on every keystroke
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      triggerSync(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, triggerSync]);

  // Debounced persistence to localStorage (250ms) to ensure 60fps UI and zero input lag
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('mh_orders', JSON.stringify(orders));
      } catch (e) {
        console.error('Failed to persist orders', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [orders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('mh_inventory', JSON.stringify(inventory));
      } catch (e) {
        console.error('Failed to persist inventory', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [inventory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('mh_transactions', JSON.stringify(transactions));
      } catch (e) {
        console.error('Failed to persist transactions', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [transactions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('mh_profile', JSON.stringify(profile));
      } catch (e) {
        console.error('Failed to persist profile', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [profile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('mh_mdm_records', JSON.stringify(mdmRecords));
      } catch (e) {
        console.error('Failed to persist mdm_records', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [mdmRecords]);

  // Apply dynamic theme mode and accent highlight to HTML document
  useEffect(() => {
    applyThemeModeAndAccent(profile);

    // If theme is 'solar', set interval to update dynamic solar phase every minute
    let timer: NodeJS.Timeout | null = null;
    if (profile.theme === 'solar') {
      timer = setInterval(() => {
        applyThemeModeAndAccent(profile);
      }, 60000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [profile.theme, profile.themeAccent, profile.customAccentColor, profile.accentGlow, profile.backgroundStyle, profile.visualSmoothness, profile.visualSharpness, profile.thermalSharpness, profile.screenConfig]);



  const handleRefresh = () => {
    setIsRefreshing(true);
    try {
      const savedOrders = localStorage.getItem('mh_orders');
      if (savedOrders) {
        const parsed: RepairOrder[] = JSON.parse(savedOrders);
        setOrders(
          parsed.map((o) => {
            if (
              o.id?.startsWith('ORD-') ||
              (o.problem?.startsWith('Customer Order:') && o.orderType !== 'repair')
            ) {
              return { ...o, orderType: 'order' as const };
            }
            if (o.id?.startsWith('SL-')) {
              return { ...o, orderType: 'sale' as const };
            }
            if (o.id?.startsWith('T-') && !o.orderType) {
              return { ...o, orderType: 'repair' as const };
            }
            return o;
          })
        );
      }
      const savedInv = localStorage.getItem('mh_inventory');
      if (savedInv) setInventory(JSON.parse(savedInv));
      const savedTxns = localStorage.getItem('mh_transactions');
      if (savedTxns) setTransactions(JSON.parse(savedTxns));
      const savedProf = localStorage.getItem('mh_profile');
      if (savedProf) setProfile({ ...INITIAL_PROFILE, ...JSON.parse(savedProf) });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleOrderCreated = (newOrder: RepairOrder) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Real-time Firestore sync for multi-device visibility
    saveOrderToFirestore(newOrder).catch((err) => console.warn('Cloud sync error for new order:', err));

    // Automatically record payment as income transaction in accounts with proper category
    if (newOrder.deposit > 0) {
      const isSale = newOrder.orderType === 'sale' || newOrder.id?.startsWith('SL-');
      const isOrder = newOrder.orderType === 'order' || newOrder.id?.startsWith('ORD-');
      const category = isSale
        ? 'Product Sales Payment'
        : isOrder
        ? 'Customer Order Advance'
        : 'Repair Service Payment';

      const validPaymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' =
        newOrder.paymentMethod === 'Cash' ||
        newOrder.paymentMethod === 'UPI' ||
        newOrder.paymentMethod === 'Card' ||
        newOrder.paymentMethod === 'Bank Transfer'
          ? newOrder.paymentMethod
          : profile.includeBillingQr
          ? 'UPI'
          : 'Cash';

      const depositTxn: AccountTransaction = {
        id: `TXN-${Date.now().toString().slice(-4)}`,
        type: 'income',
        category: category,
        amount: newOrder.deposit,
        date: newOrder.date,
        paymentMethod: validPaymentMethod,
        referenceId: newOrder.id,
        notes: `${
          isSale
            ? 'Full payment for customer sale'
            : isOrder
            ? 'Advance deposit for customer order'
            : 'Advance deposit for repair job'
        } ${newOrder.id} (${formatDeviceDisplay(newOrder)} - ${newOrder.name})`,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [depositTxn, ...prev]);
      saveTransactionToFirestore(depositTxn).catch(() => {});
    }

    // Automatically show the enhanced receipt with customer billing QR
    setReceiptOrderId(newOrder.id);
  };

  const handleUpdateStatus = (orderId: string, newStatus: RepairOrder['status']) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
      const target = updated.find((o) => o.id === orderId);
      if (target) {
        saveOrderToFirestore(target).catch(() => {});
      }
      return updated;
    });
  };

  const handleClearBalance = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      const balanceDue = Math.max(0, targetOrder.cost - targetOrder.deposit);
      if (balanceDue > 0) {
        // Record balance settlement into accounts income
        const settleTxn: AccountTransaction = {
          id: `TXN-${Date.now().toString().slice(-4)}`,
          type: 'income',
          category: 'Repair Service Payment',
          amount: balanceDue,
          date: new Date().toISOString().split('T')[0],
          paymentMethod: profile.includeBillingQr ? 'UPI' : 'Cash',
          referenceId: targetOrder.id,
          notes: `Settled balance payment for repair job ${targetOrder.id} (${formatDeviceDisplay(targetOrder)} - ${targetOrder.name})`,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [settleTxn, ...prev]);
        saveTransactionToFirestore(settleTxn).catch(() => {});
      }
    }

    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, deposit: o.cost } : o));
      const target = updated.find((o) => o.id === orderId);
      if (target) {
        saveOrderToFirestore(target).catch(() => {});
      }
      return updated;
    });
  };

  const handleSaveEditOrder = (updated: RepairOrder) => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot modify existing orders. Only the Store Owner has modify permissions.');
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    saveOrderToFirestore(updated).catch(() => {});
  };

  const handleCollectPayment = (
    orderId: string,
    amount: number,
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' = 'Cash',
    notes?: string
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || amount <= 0) return;

    const newDeposit = Math.min(targetOrder.cost, targetOrder.deposit + amount);

    // Record into accounts ledger
    const settleTxn: AccountTransaction = {
      id: `TXN-${Date.now().toString().slice(-4)}`,
      type: 'income',
      category: 'Repair Service Payment',
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      referenceId: targetOrder.id,
      notes: notes || `Payment collected for repair job ${targetOrder.id} (${formatDeviceDisplay(targetOrder)} - ${targetOrder.name})`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [settleTxn, ...prev]);
    saveTransactionToFirestore(settleTxn).catch(() => {});

    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, deposit: newDeposit } : o));
      const target = updated.find((o) => o.id === orderId);
      if (target) {
        saveOrderToFirestore(target).catch(() => {});
      }
      return updated;
    });
  };

  const handleReminderSent = (orderId: string, _reminderMessage?: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            lastReminderSent: new Date().toISOString(),
            reminderCount: (o.reminderCount || 0) + 1,
          };
        }
        return o;
      });
      const target = updated.find((o) => o.id === orderId);
      if (target) {
        saveOrderToFirestore(target).catch(() => {});
      }
      return updated;
    });
  };

  const handleDeleteOrder = (orderId: string, skipConfirm = false) => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts do not have delete permissions. Only the Store Owner can delete orders.');
      return;
    }
    if (skipConfirm || confirm(`Are you sure you want to delete repair ticket ${orderId}?`)) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (receiptOrderId === orderId) setReceiptOrderId(null);
      deleteOrderFromFirestore(orderId).catch(() => {});
    }
  };

  const handleAddInventory = (item: InventoryItem) => {
    setInventory((prev) => [item, ...prev]);
    saveInventoryItemToFirestore(item).catch(() => {});
  };

  const handleUpdateInventory = (updated: InventoryItem) => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot modify existing inventory items. Only the Store Owner has modify permissions.');
      return;
    }
    setInventory((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    saveInventoryItemToFirestore(updated).catch(() => {});
  };

  const handleAdjustStock = (id: string, delta: number) => {
    setInventory((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
      );
      const target = updated.find((item) => item.id === id);
      if (target) {
        saveInventoryItemToFirestore(target).catch(() => {});
      }
      return updated;
    });
  };

  const handleResetCatalog = () => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot reset parts catalog.');
      return;
    }
    setInventory(COMPREHENSIVE_PARTS_CATALOG);
  };

  const handleDeleteInventory = (id: string) => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts do not have delete permissions. Only the Store Owner can delete inventory items.');
      return;
    }
    setInventory((prev) => prev.filter((item) => item.id !== id));
    deleteInventoryItemFromFirestore(id).catch(() => {});
  };

  const handleAddTransaction = (txn: AccountTransaction) => {
    setTransactions((prev) => [txn, ...prev]);
    saveTransactionToFirestore(txn).catch(() => {});
  };

  const handleUpdateTransaction = (updated: AccountTransaction) => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot modify existing transactions. Only the Store Owner has modify permissions.');
      return;
    }
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    saveTransactionToFirestore(updated).catch(() => {});
  };

  const handleDeleteTransaction = (id: string) => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts do not have delete permissions. Only the Store Owner can delete accounting records.');
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    deleteTransactionFromFirestore(id).catch(() => {});
  };

  const handleAddMdmRecord = (record: MdmLockRecord) => {
    setMdmRecords((prev) => [record, ...prev]);
  };

  const handleUpdateMdmRecord = (updated: MdmLockRecord) => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot modify MDM records. Only the Store Owner has modify permissions.');
      return;
    }
    setMdmRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleDeleteMdmRecord = (id: string) => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts do not have delete permissions. Only the Store Owner can delete MDM records.');
      return;
    }
    setMdmRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleMdmLock = (id: string) => {
    let toggledImei = '';
    let nextLockState = false;

    setMdmRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextLock = !r.remoteLockActive;
          toggledImei = r.imei;
          nextLockState = nextLock;
          return {
            ...r,
            remoteLockActive: nextLock,
            lastActionDate: new Date().toISOString().split('T')[0],
            status: !nextLock && r.lockType === 'clean' ? 'cleared' : (nextLock ? 'overdue' : 'active'),
          };
        }
        return r;
      })
    );

    // If matching IMEI exists in repair orders, sync the lock status to the repair ticket
    if (toggledImei) {
      const cleanToggled = toggledImei.replace(/\D/g, '');
      setOrders((prev) =>
        prev.map((o) => {
          if (o.imei && o.imei.replace(/\D/g, '') === cleanToggled) {
            return {
              ...o,
              mdmLockActive: nextLockState,
              mdmLockType: nextLockState ? (o.mdmLockType || 'locked') : 'clean',
            };
          }
          return o;
        })
      );
    }
  };

  const handleGenerateMdmUnlockCode = (id: string) => {
    const code = 'NOC-' + Math.floor(100000 + Math.random() * 900000);
    let unlockedImei = '';

    setMdmRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          unlockedImei = r.imei;
          return { ...r, unlockCode: code, remoteLockActive: false, status: 'cleared' };
        }
        return r;
      })
    );

    if (unlockedImei) {
      const cleanImei = unlockedImei.replace(/\D/g, '');
      setOrders((prev) =>
        prev.map((o) =>
          o.imei && o.imei.replace(/\D/g, '') === cleanImei
            ? { ...o, mdmUnlockCode: code, mdmLockActive: false, mdmLockType: 'clean' }
            : o
        )
      );
    }
  };

  const handleSyncOrderLockStatus = (orderId: string, isLocked: boolean, lockType?: MdmLockType) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, mdmLockActive: isLocked, mdmLockType: lockType || (isLocked ? 'locked' : 'clean') } : o))
    );
  };

  const handleBatchAddTransactions = (newTxns: AccountTransaction[]) => {
    setTransactions((prev) => [...newTxns, ...prev]);
  };

  const handleClearTransactions = () => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot delete transaction records.');
      return;
    }
    setTransactions([]);
  };

  const handleClearOrders = () => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot delete orders.');
      return;
    }
    setOrders([]);
    localStorage.removeItem('mh_orders');
  };

  const handleResetOrdersToDefault = () => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot reset order data.');
      return;
    }
    setOrders([...INITIAL_ORDERS]);
    localStorage.setItem('mh_orders', JSON.stringify(INITIAL_ORDERS));
  };

  const handleClearInventory = () => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot clear inventory data.');
      return;
    }
    setInventory([]);
    localStorage.removeItem('mh_inventory');
  };

  const handleFullFactoryReset = (mode: 'wipe' | 'default' = 'default') => {
    if (currentUser.role === 'staff') {
      alert('Access Denied: Staff accounts cannot perform factory reset operations.');
      return;
    }
    localStorage.removeItem('mh_orders');
    localStorage.removeItem('mh_inventory');
    localStorage.removeItem('mh_transactions');
    localStorage.removeItem('mh_profile');
    localStorage.removeItem('mh_saved_device_pin');
    localStorage.removeItem('mh_remember_pin');
    localStorage.removeItem('mh_last_sync_time');

    if (mode === 'default') {
      setOrders([...INITIAL_ORDERS]);
      setInventory([...INITIAL_INVENTORY]);
      setTransactions([...INITIAL_TRANSACTIONS]);
    } else {
      setOrders([]);
      setInventory([]);
      setTransactions([]);
    }
    setProfile({ ...INITIAL_PROFILE });
  };

  const handleImportProfile = (imported: ShopProfile) => {
    setProfile(imported);
  };

  const handleToggleHideTotalBilled = () => {
    setProfile((prev) => ({
      ...prev,
      hideTotalBilled: !prev.hideTotalBilled,
    }));
  };

  const handleChangeTheme = (theme: ThemeMode) => {
    setProfile((prev) => ({ ...prev, theme }));
  };

  const handleChangeAccent = (themeAccent: ThemeAccent) => {
    setProfile((prev) => ({ ...prev, themeAccent }));
  };

  const handleChangeCustomAccent = (customAccentColor: string) => {
    setProfile((prev) => ({ ...prev, customAccentColor, themeAccent: 'custom' }));
  };

  const handleToggleAccentGlow = (accentGlow: boolean) => {
    setProfile((prev) => ({ ...prev, accentGlow }));
  };

  const handleChangeMenuBarColor = (menuBarColor: MenuBarColorPreset) => {
    setProfile((prev) => ({ ...prev, menuBarColor }));
  };

  const handleChangeMenuBarCustomColor = (menuBarCustomColor: string) => {
    setProfile((prev) => ({ ...prev, menuBarCustomColor, menuBarColor: 'custom' }));
  };

  const handleChangeMenuBarStyle = (menuBarStyle: MenuBarStyle) => {
    setProfile((prev) => ({ ...prev, menuBarStyle }));
  };

  const handleChangeMenuBarHeaderSync = (menuBarHeaderSync: boolean) => {
    setProfile((prev) => ({ ...prev, menuBarHeaderSync }));
  };

  const handleChangeBackgroundStyle = (backgroundStyle: BackgroundStyle) => {
    setProfile((prev) => ({ ...prev, backgroundStyle }));
  };

  const handleChangeSmoothness = (smoothness: SmoothnessLevel) => {
    handleUpdateScreenConfig({ ...screenConfig, smoothness });
  };

  const handleChangeSharpness = (sharpness: SharpnessLevel) => {
    handleUpdateScreenConfig({ ...screenConfig, sharpness });
  };

  const handleChangeThermalSharpness = (thermalSharpness: ThermalSharpnessLevel) => {
    handleUpdateScreenConfig({ ...screenConfig, thermalSharpness });
    handleUpdatePageStructure({ ...pageStructure, thermalSharpness });
  };

  const handleRestoreAllData = (payload: BackupPayload) => {
    if (payload.orders && Array.isArray(payload.orders)) {
      setOrders(payload.orders);
    }
    if (payload.inventory && Array.isArray(payload.inventory)) {
      setInventory(payload.inventory);
    }
    if (payload.transactions && Array.isArray(payload.transactions)) {
      setTransactions(payload.transactions);
    }
    if (payload.profile && typeof payload.profile === 'object') {
      setProfile((prev) => ({ ...prev, ...payload.profile }));
    }
  };

  const handleExportBackup = () => {
    const backup: BackupPayload = {
      app: 'Mobile Hospital POS & Workshop Management',
      version: '4.2',
      exportedAt: new Date().toISOString(),
      shopName: profile.shopName || 'Mobile Hospital',
      orders,
      inventory,
      transactions,
      profile,
      users: [],
      stats: {
        totalOrders: orders.length,
        totalInventoryItems: inventory.length,
        totalTransactions: transactions.length,
        totalUsers: 1,
      },
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MobileHospital-OfflineBackup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const pageTitles: Record<TabType, string> = {
    dashboard: 'Dashboard Overview',
    'new-order':
      customerEntryMode === 'sale'
        ? 'Customer Sales Entry'
        : customerEntryMode === 'order'
        ? 'Customer Orders Entry'
        : 'Service Repair Entry',
    orders: 'Customer Orders & Service Directory',
    dues: 'Customer Due Payments',
    inventory: 'Parts Inventory',
    accounts: 'Income & Expense Accounts',
    customers: 'Customer Directory',
    mdm: 'MDM & IMEI Lock Control Center',
    profile: 'Profile, Receipts & Billing QR',
  };

  const activeReceiptOrder = orders.find((o) => String(o.id).trim() === String(receiptOrderId || '').trim()) || null;
  const activeEditOrder = orders.find((o) => String(o.id).trim() === String(editOrderId || '').trim()) || null;
  const dueOrdersCount = orders.filter((o) => (o.cost || 0) > (o.deposit || 0)).length;
  const mdmLockedCount = mdmRecords.filter((r) => r.remoteLockActive || r.status === 'overdue' || r.lockType === 'locked').length;

  // Persist MDM Records in local storage
  useEffect(() => {
    try {
      localStorage.setItem('mh_mdm_records', JSON.stringify(mdmRecords));
    } catch {}
  }, [mdmRecords]);

  // Render PIN Login Screen if terminal is locked and PIN protection is enabled
  if (isLocked && profile.pinAuthEnabled !== false) {
    return (
      <>
        <PinLoginPage
          profile={profile}
          onUnlock={handleUnlock}
          onOpenPinSetup={() => setIsPinSetupModalOpen(true)}
          onChangeTheme={handleChangeTheme}
          onChangeAccent={handleChangeAccent}
          onChangeCustomAccent={handleChangeCustomAccent}
          onToggleAccentGlow={handleToggleAccentGlow}
          onSaveProfile={setProfile}
        />
        {isPinSetupModalOpen && (
          <Suspense fallback={null}>
            <PinSetupModal
              isOpen={isPinSetupModalOpen}
              onClose={() => setIsPinSetupModalOpen(false)}
              profile={profile}
              onSaveProfile={setProfile}
              onPinSaved={() => setIsLocked(false)}
            />
          </Suspense>
        )}
      </>
    );
  }

  const accentColors = resolveAccentColors(profile.themeAccent || 'slate', profile.customAccentColor || '#2563eb');
  const menuStyle = resolveMenuBarStyle(profile, accentColors.color);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-zinc-900 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        profile={profile}
        duesCount={dueOrdersCount}
        onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
        onOpenScreenPageModal={() => setIsScreenPageModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        customerEntryMode={customerEntryMode}
        onSelectCustomerEntryMode={setCustomerEntryMode}
        orderDirectoryFilter={ordersDirectoryFilter}
        onSelectOrderDirectoryFilter={setOrdersDirectoryFilter}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Container with Hardware-Accelerated Smooth Scrolling */}
      <main
        ref={mainScrollRef}
        className="flex-1 flex flex-col overflow-y-auto no-print app-workspace-bg smooth-scroll"
        style={{
          zoom: screenConfig.scale !== 100 ? `${screenConfig.scale}%` : undefined,
        }}
      >
        {/* Professional 3-Zone Header */}
        <header
          style={menuStyle.headerInlineStyle}
          className={`${menuStyle.headerBarClasses} px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4 select-none`}
        >
          {/* Zone 1: Sidebar Toggle, Brand Wordmark & Active View */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                !isSidebarOpen
                  ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-2xs'
                  : menuStyle.isLight || profile.menuBarHeaderSync === false
                  ? 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border-zinc-200'
                  : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
              }`}
              title={isSidebarOpen ? 'Hide Sidebar (Ctrl+B)' : 'Restore Sidebar (Ctrl+B)'}
              aria-label={isSidebarOpen ? 'Hide Sidebar' : 'Restore Sidebar'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>

            <MHLogo
              customUrl={profile.logoUrl}
              size="sm"
              rounded="md"
              theme={menuStyle.isLight ? 'light' : 'dark'}
            />

            <div className="min-w-0">
              <h1 className={`${menuStyle.headerTitleClass} truncate leading-tight`}>
                {pageTitles[currentTab]}
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] leading-tight text-zinc-500 font-medium">
                <span className="truncate">{profile.shopName || 'Mobile Hospital'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[10px] uppercase tracking-wider">POS v4.2</span>
              </div>
            </div>
          </div>

          {/* Zone 2: Unified Customer Entry Segmented Switcher (2 Clean Options) */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-zinc-100/90 border border-zinc-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setCustomerEntryMode('repair');
                setCurrentTab('new-order');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'new-order' && (customerEntryMode === 'repair' || customerEntryMode === 'sale')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
              }`}
              title="Create Service Repair or Product Sale"
            >
              <div className="flex items-center gap-0.5 shrink-0">
                <Wrench className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">/</span>
                <ShoppingBag className="w-3 h-3" />
              </div>
              <span>Service Repair & Sales</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomerEntryMode('order');
                setCurrentTab('new-order');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'new-order' && customerEntryMode === 'order'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
              }`}
              title="Create Customer Advance Order / Booking"
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>Customer Pre-Orders</span>
            </button>
          </div>

          {/* Zone 3: System Utilities, Theme, Scale & Role Security */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Unified Auto-Sync & Cloud DB Trigger */}
            {/* Unified Auto-Sync & Cloud DB Trigger */}
            <button
              type="button"
              onClick={() => triggerSync(false)}
              className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
              title={`Cloud DB Status: ${
                firebaseStatus === 'synced'
                  ? 'All records synced across devices'
                  : firebaseStatus === 'syncing'
                  ? 'Syncing changes to Cloud...'
                  : firebaseStatus === 'error'
                  ? 'Daily free quota reached or offline (local safe)'
                  : 'Ready to sync'
              }. Last sync: ${lastSyncText}. Click to sync immediately.`}
            >
              {firebaseStatus === 'syncing' || isAutoSyncing ? (
                <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
              ) : firebaseStatus === 'synced' ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : firebaseStatus === 'error' ? (
                <Cloud className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <RotateCw className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              )}
              <span className="hidden xl:inline font-mono text-[11px]">
                {firebaseStatus === 'syncing' || isAutoSyncing ? 'Syncing...' : 'Cloud Synced'}
              </span>
              <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 hidden 2xl:inline">{lastSyncText}</span>
            </button>

            {/* Quick Screen Scale & Paper Sizing Button */}
            <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={() => setIsScreenPageModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Screen & Page Size Adjustment (Scale, Width & Paper Presets)"
              >
                <Monitor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  {screenConfig.scale}%
                </span>
              </button>

              <div className="hidden lg:flex items-center border-l border-zinc-200 dark:border-zinc-800 p-0.5">
                <button
                  type="button"
                  onClick={() => handleQuickZoom(-5)}
                  disabled={screenConfig.scale <= 75}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                  title="Zoom Out (-5%)"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickZoom(5)}
                  disabled={screenConfig.scale >= 150}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                  title="Zoom In (+5%)"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Refresh App State Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="hidden lg:flex items-center p-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 transition-colors cursor-pointer shadow-2xs"
              title="Reload and Refresh All Local State"
              aria-label="Refresh State"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`} />
            </button>

            {/* Quick Smoothness & Sharpness Badge Button */}
            <button
              type="button"
              onClick={() => setIsScreenPageModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Display Smoothness & Sharpness Settings"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                {screenConfig.smoothness || 'ultra'} • {screenConfig.sharpness || 'ultra'}
              </span>
            </button>

            {/* Custom Theme Selector Dropdown */}
            <ThemeSelector
              compact
              theme={profile.theme || 'light'}
              accent={profile.themeAccent || 'slate'}
              customAccentColor={profile.customAccentColor || '#2563eb'}
              accentGlow={profile.accentGlow !== false}
              backgroundStyle={profile.backgroundStyle || 'workbench'}
              menuBarColor={profile.menuBarColor || 'default'}
              menuBarCustomColor={profile.menuBarCustomColor || '#0d0f17'}
              menuBarStyle={profile.menuBarStyle || 'solid'}
              menuBarHeaderSync={profile.menuBarHeaderSync !== false}
              layoutWidth={screenConfig.maxWidth}
              smoothness={screenConfig.smoothness || profile.visualSmoothness || 'ultra'}
              sharpness={screenConfig.sharpness || profile.visualSharpness || 'ultra'}
              thermalSharpness={pageStructure.thermalSharpness || screenConfig.thermalSharpness || 'ultra'}
              onChangeTheme={handleChangeTheme}
              onChangeAccent={handleChangeAccent}
              onChangeCustomAccent={handleChangeCustomAccent}
              onToggleAccentGlow={handleToggleAccentGlow}
              onChangeBackgroundStyle={handleChangeBackgroundStyle}
              onChangeMenuBarColor={handleChangeMenuBarColor}
              onChangeMenuBarCustomColor={handleChangeMenuBarCustomColor}
              onChangeMenuBarStyle={handleChangeMenuBarStyle}
              onChangeMenuBarHeaderSync={handleChangeMenuBarHeaderSync}
              onChangeLayoutWidth={(w) => handleUpdateScreenConfig({ ...screenConfig, maxWidth: w })}
              onChangeSmoothness={handleChangeSmoothness}
              onChangeSharpness={handleChangeSharpness}
              onChangeThermalSharpness={handleChangeThermalSharpness}
            />

            {/* User Account / Role Badge & Lock Terminal Trigger */}
            <div className="flex items-center gap-1 pl-1 sm:pl-1.5 border-l border-zinc-200 dark:border-zinc-800">
              {currentUser.loginMethod === 'google' || currentUser.email ? (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-bold shadow-2xs"
                  title={`Signed in with Google (${currentUser.email || 'mobilehospital633@gmail.com'}) - Real-time cross-device sync active`}
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden xl:inline truncate max-w-[140px]">
                    {currentUser.email ? currentUser.email.split('@')[0] : currentUser.name}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              ) : currentUser.role === 'owner' ? (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-2xs"
                  title="Store Owner: Full permissions (View, Edit, Delete & Config)"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="hidden xl:inline">{currentUser.name || 'Owner'}</span>
                </div>
              ) : (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-300/80 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs font-bold shadow-2xs"
                  title={`Staff Attendant: ${currentUser.name}`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="hidden xl:inline">{currentUser.name}</span>
                </div>
              )}

              {/* Owner PIN Setup Button */}
              {currentUser.role === 'owner' && (
                <button
                  type="button"
                  onClick={() => setIsPinSetupModalOpen(true)}
                  title="Configure Owner & Staff PINs"
                  aria-label="Configure Security PINs"
                  className="hidden sm:flex items-center p-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 transition-colors shadow-2xs cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              )}

              {/* Lock Terminal Button */}
              <button
                type="button"
                onClick={handleLockTerminal}
                title="Lock Terminal (switch account or enter PIN)"
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                <span className="hidden md:inline">Lock</span>
              </button>

              {/* Logout / Switch User Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Log out and sign in with another account"
                className="hidden sm:flex items-center p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 hover:text-red-600 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div
          className={`flex-1 ${
            screenConfig.maxWidth === 'compact'
              ? 'max-w-5xl mx-auto w-full px-4 sm:px-6 py-6'
              : screenConfig.maxWidth === 'fluid' || pageStructure?.appContentWidth === 'fluid'
              ? 'w-full px-4 sm:px-6 py-6'
              : screenConfig.maxWidth === 'wide' || pageStructure?.appContentWidth === 'wide'
              ? 'max-w-[1536px] mx-auto w-full px-6 sm:px-8 py-6'
              : 'max-w-7xl mx-auto w-full px-6 sm:px-8 py-6'
          }`}
        >
          <Suspense fallback={<ViewFallback />}>
            {currentTab === 'dashboard' && (
              <DashboardTab
                orders={orders}
                transactions={transactions}
                profile={profile}
                inventory={inventory}
                onNavigate={setCurrentTab}
                onOpenReceipt={(id) => setReceiptOrderId(id)}
                onToggleHideTotalBilled={handleToggleHideTotalBilled}
                onOpenCloudBackup={() => {
                  setSettingsSubtab('drive');
                  setCurrentTab('profile');
                }}
                onStartCustomerEntry={(mode) => {
                  setCustomerEntryMode(mode);
                  setCurrentTab('new-order');
                }}
              />
            )}

            {currentTab === 'new-order' && (
              <NewOrderTab
                profile={profile}
                inventory={inventory}
                onOrderCreated={handleOrderCreated}
                onSaveProfile={setProfile}
                entryMode={customerEntryMode}
                onEntryModeChange={setCustomerEntryMode}
                onAdjustStock={handleAdjustStock}
              />
            )}

            {currentTab === 'orders' && (
              <OrdersTab
                orders={orders}
                profile={profile}
                userRole={currentUser.role}
                onUpdateStatus={handleUpdateStatus}
                onClearBalance={handleClearBalance}
                onEditOrder={(id) => setEditOrderId(id)}
                onSelectOrderForEdit={(order) => setEditOrderId(order.id)}
                onDeleteOrder={handleDeleteOrder}
                onOpenReceipt={(id) => setReceiptOrderId(id)}
                onSelectOrderForReceipt={(order) => setReceiptOrderId(order.id)}
                initialOrderTypeFilter={ordersDirectoryFilter}
                onOrderTypeFilterChange={setOrdersDirectoryFilter}
                onSaveProfile={setProfile}
                onReminderSent={handleReminderSent}
              />
            )}

            {currentTab === 'dues' && (
              <DuePaymentsTab
                orders={orders}
                profile={profile}
                onClearBalance={handleClearBalance}
                onCollectPayment={handleCollectPayment}
                onOpenReceipt={(id) => setReceiptOrderId(id)}
                onNavigateToOrders={() => setCurrentTab('orders')}
                onSaveProfile={setProfile}
                onReminderSent={handleReminderSent}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryTab
                inventory={inventory}
                profile={profile}
                userRole={currentUser.role}
                onAddInventory={handleAddInventory}
                onUpdateInventory={handleUpdateInventory}
                onDeleteInventory={handleDeleteInventory}
                onAdjustStock={handleAdjustStock}
                onResetCatalog={handleResetCatalog}
              />
            )}

            {currentTab === 'customers' && (
              <CustomersTab
                orders={orders}
                profile={profile}
                onReminderSent={handleReminderSent}
                onOpenReceipt={(id) => setReceiptOrderId(id)}
              />
            )}

            {currentTab === 'profile' && (
              <SettingsTab
                profile={profile}
                userRole={currentUser.role}
                onSaveProfile={setProfile}
                onClearOrders={handleClearOrders}
                onResetOrdersToDefault={handleResetOrdersToDefault}
                onClearInventory={handleClearInventory}
                onResetInventoryToDefault={handleResetCatalog}
                onClearTransactions={handleClearTransactions}
                onResetAllData={() => handleFullFactoryReset('default')}
                onFullFactoryReset={handleFullFactoryReset}
                onExportBackup={handleExportBackup}
                onImportProfile={handleImportProfile}
                onOpenPinSetup={() => setIsPinSetupModalOpen(true)}
                onLockTerminal={() => setIsLocked(true)}
                orders={orders}
                inventory={inventory}
                transactions={transactions}
                onRestoreAllData={handleRestoreAllData}
                initialSubtab={settingsSubtab}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Printable Receipt Modal with Billing QR (Repair Jobs) - Loaded on demand */}
      {receiptOrderId && (
        <Suspense fallback={null}>
          <ReceiptModal
            order={activeReceiptOrder}
            profile={profile}
            isOpen={!!receiptOrderId}
            onClose={() => setReceiptOrderId(null)}
            onClearBalance={handleClearBalance}
            onSaveProfile={setProfile}
          />
        </Suspense>
      )}

      {/* Edit Order Modal - Loaded on demand */}
      {editOrderId && (
        <Suspense fallback={null}>
          <EditOrderModal
            order={activeEditOrder}
            isOpen={!!editOrderId}
            onClose={() => setEditOrderId(null)}
            onSave={handleSaveEditOrder}
            userRole={currentUser.role}
            ownerPin={profile.securityPin || '1234'}
          />
        </Suspense>
      )}

      {/* Security PIN Setup Modal - Loaded on demand */}
      {isPinSetupModalOpen && (
        <Suspense fallback={null}>
          <PinSetupModal
            isOpen={isPinSetupModalOpen}
            onClose={() => setIsPinSetupModalOpen(false)}
            profile={profile}
            onSaveProfile={setProfile}
            onPinSaved={() => setIsLocked(false)}
          />
        </Suspense>
      )}

      {/* Desktop App (Offline & Online) Modal - Loaded on demand */}
      {isDesktopModalOpen && (
        <Suspense fallback={null}>
          <DesktopAppModal
            isOpen={isDesktopModalOpen}
            onClose={() => setIsDesktopModalOpen(false)}
            onExportBackup={handleExportBackup}
          />
        </Suspense>
      )}

      {/* Screen & Page Size Adjustment Modal - Loaded on demand */}
      {isScreenPageModalOpen && (
        <Suspense fallback={null}>
          <ScreenAndPageSizeModal
            isOpen={isScreenPageModalOpen}
            onClose={() => setIsScreenPageModalOpen(false)}
            screenConfig={screenConfig}
            pageStructure={pageStructure}
            onUpdateScreenConfig={handleUpdateScreenConfig}
            onUpdatePageStructure={handleUpdatePageStructure}
          />
        </Suspense>
      )}

      {/* Workshop Theme & Menu Bar Customizer Modal */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-4xl w-full p-5 max-h-[92vh] overflow-y-auto text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
                  style={{ backgroundColor: profile.customAccentColor || '#2563eb' }}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Custom Theme & Workspace Studio</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Personalize your workshop with custom accent colors, canvas patterns, surface finishes, and layout width</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-sm font-bold"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <ThemeSelector
              theme={profile.theme || 'light'}
              accent={profile.themeAccent || 'slate'}
              customAccentColor={profile.customAccentColor || '#2563eb'}
              accentGlow={profile.accentGlow !== false}
              backgroundStyle={profile.backgroundStyle || 'workbench'}
              menuBarColor={profile.menuBarColor || 'default'}
              menuBarCustomColor={profile.menuBarCustomColor || '#0d0f17'}
              menuBarStyle={profile.menuBarStyle || 'solid'}
              menuBarHeaderSync={profile.menuBarHeaderSync !== false}
              layoutWidth={screenConfig.maxWidth}
              smoothness={screenConfig.smoothness || profile.visualSmoothness || 'ultra'}
              sharpness={screenConfig.sharpness || profile.visualSharpness || 'ultra'}
              thermalSharpness={pageStructure.thermalSharpness || screenConfig.thermalSharpness || 'ultra'}
              onChangeTheme={handleChangeTheme}
              onChangeAccent={handleChangeAccent}
              onChangeCustomAccent={handleChangeCustomAccent}
              onToggleAccentGlow={handleToggleAccentGlow}
              onChangeBackgroundStyle={handleChangeBackgroundStyle}
              onChangeMenuBarColor={handleChangeMenuBarColor}
              onChangeMenuBarCustomColor={handleChangeMenuBarCustomColor}
              onChangeMenuBarStyle={handleChangeMenuBarStyle}
              onChangeMenuBarHeaderSync={handleChangeMenuBarHeaderSync}
              onChangeLayoutWidth={(w) => handleUpdateScreenConfig({ ...screenConfig, maxWidth: w })}
              onChangeSmoothness={handleChangeSmoothness}
              onChangeSharpness={handleChangeSharpness}
              onChangeThermalSharpness={handleChangeThermalSharpness}
            />
          </div>
        </div>
      )}

      {/* Floating Smooth Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-5 z-40 p-2.5 rounded-full bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md border border-white/20 dark:border-black/20 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-200"
          title="Smooth Scroll to Top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Real-time Offline/Online Floating Alert */}
      <OfflineIndicator />
    </div>
  );
}
