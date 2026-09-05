import React, { useState, useEffect } from 'react';
import { RotateCw, Plus, QrCode, Eye, EyeOff, LogIn, Cloud } from 'lucide-react';
import { RepairOrder, InventoryItem, ShopProfile, TabType, AccountTransaction, ThemeMode, ThemeAccent, AppUser, StolenDeviceRecord } from './types';
import { INITIAL_ORDERS, INITIAL_INVENTORY, INITIAL_PROFILE, INITIAL_TRANSACTIONS, INITIAL_USERS, INITIAL_STOLEN_REGISTRY } from './data';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { NewOrderTab } from './components/NewOrderTab';
import { OrdersTab } from './components/OrdersTab';
import { InventoryTab } from './components/InventoryTab';
import { AccountsTab } from './components/AccountsTab';
import { CustomersTab } from './components/CustomersTab';
import { SettingsTab } from './components/SettingsTab';
import { StolenPhoneFinderTab } from './components/StolenPhoneFinderTab';
import { ReceiptModal } from './components/ReceiptModal';
import { EditOrderModal } from './components/EditOrderModal';
import { MHLogo } from './components/MHLogo';
import { ThemeSelector } from './components/ThemeSelector';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { LoginPage } from './components/LoginPage';
import { DeviceLockModal } from './components/DeviceLockModal';
import { BackupPayload } from './lib/googleDrive';
import { cleanImei } from './utils/imei';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [settingsSubtab, setSettingsSubtab] = useState<'general' | 'tax' | 'system' | 'staff' | 'drive'>('tax');
  const [orders, setOrders] = useState<RepairOrder[]>(() => {
    try {
      const saved = localStorage.getItem('mh_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('mh_inventory');
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
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

  // User Accounts & Authentication State - defaults to null to show Login Page first
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('mh_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [deviceLockOrder, setDeviceLockOrder] = useState<RepairOrder | null>(null);
  const [isDeviceLockModalOpen, setIsDeviceLockModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stolen Mobile Registry State & Persistence
  const [stolenRegistry, setStolenRegistry] = useState<StolenDeviceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mh_stolen_registry');
      return saved ? JSON.parse(saved) : INITIAL_STOLEN_REGISTRY;
    } catch {
      return INITIAL_STOLEN_REGISTRY;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mh_stolen_registry', JSON.stringify(stolenRegistry));
    } catch (e) {
      console.error('Failed to persist stolen registry', e);
    }
  }, [stolenRegistry]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mh_users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('mh_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('mh_current_user');
      }
    } catch (e) {
      console.error('Failed to persist current user', e);
    }
  }, [currentUser]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mh_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to persist orders', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('mh_inventory', JSON.stringify(inventory));
    } catch (e) {
      console.error('Failed to persist inventory', e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem('mh_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to persist transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('mh_profile', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to persist profile', e);
    }
  }, [profile]);

  // Apply theme mode and accent highlight to HTML document
  useEffect(() => {
    const themeMode = profile.theme || 'light';
    const accent = profile.themeAccent || 'slate';
    const root = document.documentElement;

    const applyThemeMode = (mode: string) => {
      // Clear previous theme mode classes
      root.classList.remove('dark', 'theme-midnight', 'theme-forest', 'theme-cyber', 'theme-sepia');

      if (mode === 'dark') {
        root.classList.add('dark');
      } else if (mode === 'midnight') {
        root.classList.add('dark', 'theme-midnight');
      } else if (mode === 'forest') {
        root.classList.add('dark', 'theme-forest');
      } else if (mode === 'cyber') {
        root.classList.add('dark', 'theme-cyber');
      } else if (mode === 'sepia') {
        root.classList.add('theme-sepia');
      }
      root.setAttribute('data-theme', mode);
    };

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyThemeMode(mediaQuery.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => applyThemeMode(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyThemeMode(themeMode);
    }

    root.setAttribute('data-accent', accent);
  }, [profile.theme, profile.themeAccent]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    try {
      const savedOrders = localStorage.getItem('mh_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
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

    // Automatically record advance deposit as income transaction in accounts
    if (newOrder.deposit > 0) {
      const depositTxn: AccountTransaction = {
        id: `TXN-${Date.now().toString().slice(-4)}`,
        type: 'income',
        category: 'Repair Service Payment',
        amount: newOrder.deposit,
        date: newOrder.date,
        paymentMethod: profile.includeBillingQr ? 'UPI' : 'Cash',
        referenceId: newOrder.id,
        notes: `Advance deposit for repair job ${newOrder.id} (${newOrder.model} - ${newOrder.name})`,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [depositTxn, ...prev]);
    }

    // Automatically show the enhanced receipt with customer billing QR
    setReceiptOrderId(newOrder.id);
  };

  const handleUpdateStatus = (orderId: string, newStatus: RepairOrder['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
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
          notes: `Settled balance payment for repair job ${targetOrder.id} (${targetOrder.model} - ${targetOrder.name})`,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [settleTxn, ...prev]);
      }
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, deposit: o.cost } : o))
    );
  };

  const handleSaveEditOrder = (updated: RepairOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleOpenDeviceLock = (order?: RepairOrder) => {
    if (order) {
      setDeviceLockOrder(order);
    } else {
      const target = orders.find((o) => o.isDeviceLocked) || orders.find((o) => o.cost > o.deposit) || orders[0] || null;
      setDeviceLockOrder(target);
    }
    setIsDeviceLockModalOpen(true);
  };

  const handleLockDevice = (orderId: string, reason: string, unlockCode: string, notes?: string) => {
    const target = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              isDeviceLocked: true,
              lockedReason: reason,
              lockReason: reason,
              unlockCode,
              lockedAt: new Date().toISOString(),
              lockNotes: notes,
            }
          : o
      )
    );
    setDeviceLockOrder((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            isDeviceLocked: true,
            lockedReason: reason,
            lockReason: reason,
            unlockCode,
            lockedAt: new Date().toISOString(),
            lockNotes: notes,
          }
        : target
        ? {
            ...target,
            isDeviceLocked: true,
            lockedReason: reason,
            lockReason: reason,
            unlockCode,
            lockedAt: new Date().toISOString(),
            lockNotes: notes,
          }
        : null
    );
  };

  const handleAddNewOrderWithLock = (newOrder: RepairOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    setDeviceLockOrder(newOrder);
  };

  const handleUnlockDevice = (orderId: string, collectPayment?: boolean) => {
    if (collectPayment) {
      handleClearBalance(orderId);
    }
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            isDeviceLocked: false,
            deposit: collectPayment ? o.cost : o.deposit,
            status: collectPayment && o.status !== 'Completed' && o.status !== 'Delivered' ? 'Completed' : o.status,
          };
        }
        return o;
      })
    );
    setDeviceLockOrder((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            isDeviceLocked: false,
            deposit: collectPayment ? prev.cost : prev.deposit,
            status: collectPayment && prev.status !== 'Completed' && prev.status !== 'Delivered' ? 'Completed' : prev.status,
          }
        : null
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm(`Are you sure you want to delete repair ticket ${orderId}?`)) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (receiptOrderId === orderId) setReceiptOrderId(null);
    }
  };

  const handleAddInventory = (item: InventoryItem) => {
    setInventory((prev) => [...prev, item]);
  };

  const handleDeleteInventory = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddTransaction = (txn: AccountTransaction) => {
    setTransactions((prev) => [txn, ...prev]);
  };

  const handleUpdateTransaction = (updated: AccountTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleBatchAddTransactions = (newTxns: AccountTransaction[]) => {
    setTransactions((prev) => [...newTxns, ...prev]);
  };

  const handleClearTransactions = () => {
    setTransactions([]);
  };

  const handleClearOrders = () => {
    setOrders([]);
  };

  const handleClearInventory = () => {
    setInventory([]);
  };

  const handleResetAllData = () => {
    localStorage.removeItem('mh_orders');
    localStorage.removeItem('mh_inventory');
    localStorage.removeItem('mh_transactions');
    localStorage.removeItem('mh_profile');
    localStorage.removeItem('mh_stolen_registry');
    setOrders([...INITIAL_ORDERS]);
    setInventory([...INITIAL_INVENTORY]);
    setTransactions([...INITIAL_TRANSACTIONS]);
    setProfile({ ...INITIAL_PROFILE });
    setStolenRegistry([...INITIAL_STOLEN_REGISTRY]);
  };

  const handleImportProfile = (imported: ShopProfile) => {
    setProfile(imported);
  };

  const handleAddStolenRecord = (record: StolenDeviceRecord) => {
    setStolenRegistry((prev) => [record, ...prev]);
  };

  const handleUpdateStolenRecord = (record: StolenDeviceRecord) => {
    setStolenRegistry((prev) => prev.map((r) => (r.id === record.id ? record : r)));
  };

  const handleDeleteStolenRecord = (recordId: string) => {
    setStolenRegistry((prev) => prev.filter((r) => r.id !== recordId));
  };

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleRegister = (newUser: AppUser) => {
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
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
    if (payload.users && Array.isArray(payload.users) && payload.users.length > 0) {
      setUsers(payload.users);
    }
    if (payload.stolenRegistry && Array.isArray(payload.stolenRegistry)) {
      setStolenRegistry(payload.stolenRegistry);
    }
  };

  const pageTitles: Record<TabType, string> = {
    dashboard: 'Dashboard Overview',
    'new-order': 'New Repair Order Entry',
    orders: 'Manage Repair Jobs',
    inventory: 'Parts Inventory',
    accounts: 'Income & Expense Accounts',
    customers: 'Customer Directory',
    profile: 'Profile, Receipts & Billing QR',
    'stolen-finder': 'Stolen Phone Finder & IMEI Radar',
  };

  // Count active repair orders matching stolen IMEI database
  const stolenAlertCount = orders.filter((o) => {
    const oImei = cleanImei(o.imei);
    return oImei && stolenRegistry.some((r) => {
      const p1 = cleanImei(r.imei);
      const p2 = cleanImei(r.imei2 || '');
      return (p1 && p1 === oImei) || (p2 && p2 === oImei);
    });
  }).length;

  const activeReceiptOrder = orders.find((o) => o.id === receiptOrderId) || null;
  const activeEditOrder = orders.find((o) => o.id === editOrderId) || null;

  // Render Login Page first if not authenticated
  if (!currentUser) {
    return (
      <LoginPage
        users={users}
        profile={profile}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        profile={profile}
        stolenAlertCount={stolenAlertCount}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-y-auto no-print">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-xs border-b border-zinc-200 sticky top-0 z-10 px-6 sm:px-8 py-3.5 flex justify-between items-center shadow-2xs">
          <div className="flex items-center gap-3">
            <MHLogo
              customUrl={profile.logoUrl}
              size="sm"
              rounded="md"
              theme="dark"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">
                  {pageTitles[currentTab]}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  MH Live
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeSelector
              compact
              theme={profile.theme || 'light'}
              accent={profile.themeAccent || 'slate'}
              onChangeTheme={handleChangeTheme}
              onChangeAccent={handleChangeAccent}
            />

            <button
              onClick={handleToggleHideTotalBilled}
              title={
                profile.hideTotalBilled
                  ? 'Total Billed is hidden for counter privacy. Click to reveal.'
                  : 'Hide Total Billed (Counter Privacy Mode)'
              }
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors border active:scale-98 cursor-pointer shadow-2xs ${
                profile.hideTotalBilled
                  ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                  : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {profile.hideTotalBilled ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="hidden md:inline text-zinc-200 font-semibold">Billed Hidden</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden md:inline">Hide Billed</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setSettingsSubtab('drive');
                setCurrentTab('profile');
              }}
              title="Free Google Drive Cloud Backup for all workshop entry data"
              className="bg-white hover:bg-emerald-50 text-zinc-700 hover:text-emerald-700 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors border border-zinc-200 hover:border-emerald-300 active:scale-98 cursor-pointer shadow-2xs"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Cloud Backup</span>
            </button>

            <button
              onClick={handleRefresh}
              className="bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors border border-zinc-200 hover:border-zinc-300 active:scale-98 cursor-pointer shadow-2xs"
            >
              <RotateCw className={`w-3.5 h-3.5 text-zinc-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setCurrentTab('new-order')}
              className="theme-primary-btn bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors shadow-xs active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Repair Order</span>
            </button>

            {/* Staff Account & Authentication Menu */}
            {currentUser ? (
              <UserMenu
                currentUser={currentUser}
                onSignOut={handleSignOut}
                onOpenSwitchUser={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                onOpenRegister={() => {
                  setAuthModalMode('register');
                  setIsAuthModalOpen(true);
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full flex-1">
          {currentTab === 'dashboard' && (
            <DashboardTab
              orders={orders}
              transactions={transactions}
              profile={profile}
              onNavigate={setCurrentTab}
              onOpenReceipt={(id) => setReceiptOrderId(id)}
              onToggleHideTotalBilled={handleToggleHideTotalBilled}
              onOpenCloudBackup={() => {
                setSettingsSubtab('drive');
                setCurrentTab('profile');
              }}
              onOpenDeviceLock={handleOpenDeviceLock}
              stolenRegistry={stolenRegistry}
            />
          )}

          {currentTab === 'new-order' && (
            <NewOrderTab
              profile={profile}
              onOrderCreated={handleOrderCreated}
              currentUser={currentUser}
              users={users}
              stolenRegistry={stolenRegistry}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersTab
              orders={orders}
              profile={profile}
              onUpdateStatus={handleUpdateStatus}
              onClearBalance={handleClearBalance}
              onEditOrder={(id) => setEditOrderId(id)}
              onDeleteOrder={handleDeleteOrder}
              onOpenReceipt={(id) => setReceiptOrderId(id)}
              onOpenDeviceLock={handleOpenDeviceLock}
              stolenRegistry={stolenRegistry}
              onOpenStolenFinder={() => setCurrentTab('stolen-finder')}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              onAddItem={handleAddInventory}
              onDeleteItem={handleDeleteInventory}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsTab
              transactions={transactions}
              orders={orders}
              profile={profile}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onBatchAddTransactions={handleBatchAddTransactions}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersTab
              orders={orders}
              profile={profile}
            />
          )}

          {currentTab === 'stolen-finder' && (
            <StolenPhoneFinderTab
              profile={profile}
              orders={orders}
              stolenRegistry={stolenRegistry}
              onAddStolenRecord={handleAddStolenRecord}
              onUpdateStolenRecord={handleUpdateStolenRecord}
              onDeleteStolenRecord={handleDeleteStolenRecord}
              onOpenOrderReceipt={(orderId) => setReceiptOrderId(orderId)}
              onOpenDeviceLock={handleOpenDeviceLock}
            />
          )}

          {currentTab === 'profile' && (
            <SettingsTab
              profile={profile}
              onSaveProfile={setProfile}
              onClearOrders={handleClearOrders}
              onClearInventory={handleClearInventory}
              onClearTransactions={handleClearTransactions}
              onResetAllData={handleResetAllData}
              onImportProfile={handleImportProfile}
              users={users}
              currentUser={currentUser}
              onOpenRegister={() => {
                setAuthModalMode('register');
                setIsAuthModalOpen(true);
              }}
              onSwitchUser={(u) => {
                setCurrentUser(u);
              }}
              onDeleteUser={handleDeleteUser}
              orders={orders}
              inventory={inventory}
              transactions={transactions}
              onRestoreAllData={handleRestoreAllData}
              initialSubtab={settingsSubtab}
            />
          )}
        </div>
      </main>

      {/* Printable Receipt Modal with Billing QR */}
      <ReceiptModal
        order={activeReceiptOrder}
        profile={profile}
        isOpen={!!receiptOrderId}
        onClose={() => setReceiptOrderId(null)}
        onClearBalance={handleClearBalance}
      />

      {/* Edit Order Modal */}
      <EditOrderModal
        order={activeEditOrder}
        isOpen={!!editOrderId}
        onClose={() => setEditOrderId(null)}
        onSave={handleSaveEditOrder}
      />

      {/* IMEI Device Lock & Payment Recovery Manager */}
      <DeviceLockModal
        isOpen={isDeviceLockModalOpen}
        onClose={() => setIsDeviceLockModalOpen(false)}
        order={deviceLockOrder}
        orders={orders}
        profile={profile}
        onLockDevice={handleLockDevice}
        onUnlockDevice={handleUnlockDevice}
        onSelectOrder={(selected) => setDeviceLockOrder(selected)}
        onAddNewOrderWithLock={handleAddNewOrderWithLock}
      />

      {/* Authentication (Login & Staff Registration) Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || !currentUser}
        canClose={!!currentUser}
        initialMode={authModalMode}
        users={users}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}
