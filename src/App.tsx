import React, { useState, useEffect } from 'react';
import { RotateCw, Plus, QrCode, Eye, EyeOff, Cloud, Lock, KeyRound, Monitor } from 'lucide-react';
import { RepairOrder, InventoryItem, ShopProfile, TabType, AccountTransaction, ThemeMode, ThemeAccent } from './types';
import { INITIAL_ORDERS, INITIAL_INVENTORY, INITIAL_PROFILE, INITIAL_TRANSACTIONS } from './data';
import { COMPREHENSIVE_PARTS_CATALOG } from './partsCatalog';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { NewOrderTab } from './components/NewOrderTab';
import { OrdersTab } from './components/OrdersTab';
import { InventoryTab } from './components/InventoryTab';
import { AccountsTab } from './components/AccountsTab';
import { CustomersTab } from './components/CustomersTab';
import { SettingsTab } from './components/SettingsTab';
import { ReceiptModal } from './components/ReceiptModal';
import { EditOrderModal } from './components/EditOrderModal';
import { MHLogo } from './components/MHLogo';
import { ThemeSelector } from './components/ThemeSelector';
import { PinLoginPage } from './components/PinLoginPage';
import { PinSetupModal } from './components/PinSetupModal';
import { DuePaymentsTab } from './components/DuePaymentsTab';
import { DesktopAppModal } from './components/DesktopAppModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BackupPayload } from './lib/googleDrive';
import { formatDeviceDisplay } from './utils/orderUtils';
import { applyThemeModeAndAccent } from './utils/themeUtils';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [settingsSubtab, setSettingsSubtab] = useState<'general' | 'tax' | 'system' | 'security' | 'drive'>('tax');
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

  const [isPinSetupModalOpen, setIsPinSetupModalOpen] = useState(false);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);

  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Apply dynamic theme mode and accent highlight to HTML document
  useEffect(() => {
    applyThemeModeAndAccent(profile);

    // If theme is 'solar', set interval to update dynamic solar phase every minute
    let timer: NodeJS.Timeout | null = null;
    if (profile.theme === 'solar') {
      timer = setInterval(() => {
        applyThemeModeAndAccent(profile);
      }, 60000);
    } else if (profile.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyThemeModeAndAccent(profile);
      mediaQuery.addEventListener('change', listener);
      return () => {
        mediaQuery.removeEventListener('change', listener);
        if (timer) clearInterval(timer);
      };
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [profile.theme, profile.themeAccent, profile.customAccentColor, profile.accentGlow]);

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
        notes: `Advance deposit for repair job ${newOrder.id} (${formatDeviceDisplay(newOrder)} - ${newOrder.name})`,
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
          notes: `Settled balance payment for repair job ${targetOrder.id} (${formatDeviceDisplay(targetOrder)} - ${targetOrder.name})`,
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

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, deposit: newDeposit } : o))
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm(`Are you sure you want to delete repair ticket ${orderId}?`)) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (receiptOrderId === orderId) setReceiptOrderId(null);
    }
  };

  const handleAddInventory = (item: InventoryItem) => {
    setInventory((prev) => [item, ...prev]);
  };

  const handleUpdateInventory = (updated: InventoryItem) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleAdjustStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
      )
    );
  };

  const handleResetCatalog = () => {
    setInventory(COMPREHENSIVE_PARTS_CATALOG);
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
    setOrders([...INITIAL_ORDERS]);
    setInventory([...INITIAL_INVENTORY]);
    setTransactions([...INITIAL_TRANSACTIONS]);
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
    'new-order': 'New Order Entry',
    orders: 'Customer Repair Orders',
    dues: 'Customer Due Payments',
    inventory: 'Parts Inventory',
    accounts: 'Income & Expense Accounts',
    customers: 'Customer Directory',
    profile: 'Profile, Receipts & Billing QR',
  };

  const activeReceiptOrder = orders.find((o) => o.id === receiptOrderId) || null;
  const activeEditOrder = orders.find((o) => o.id === editOrderId) || null;
  const dueOrdersCount = orders.filter((o) => (o.cost || 0) > (o.deposit || 0)).length;

  // Render PIN Login Screen if terminal is locked and PIN protection is enabled
  if (isLocked && profile.pinAuthEnabled !== false) {
    return (
      <>
        <PinLoginPage
          profile={profile}
          onUnlock={() => setIsLocked(false)}
          onOpenPinSetup={() => setIsPinSetupModalOpen(true)}
          onChangeTheme={handleChangeTheme}
          onChangeAccent={handleChangeAccent}
          onChangeCustomAccent={handleChangeCustomAccent}
          onToggleAccentGlow={handleToggleAccentGlow}
          onSaveProfile={setProfile}
        />
        <PinSetupModal
          isOpen={isPinSetupModalOpen}
          onClose={() => setIsPinSetupModalOpen(false)}
          profile={profile}
          onSaveProfile={setProfile}
          onPinSaved={() => setIsLocked(false)}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        profile={profile}
        duesCount={dueOrdersCount}
        onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
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
              customAccentColor={profile.customAccentColor || '#2563eb'}
              accentGlow={profile.accentGlow !== false}
              onChangeTheme={handleChangeTheme}
              onChangeAccent={handleChangeAccent}
              onChangeCustomAccent={handleChangeCustomAccent}
              onToggleAccentGlow={handleToggleAccentGlow}
            />

            <button
              onClick={() => setIsDesktopModalOpen(true)}
              title="Desktop App (Windows .EXE & Offline Support)"
              className="bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors border border-zinc-200 hover:border-zinc-300 active:scale-98 cursor-pointer shadow-2xs"
            >
              <Monitor className="w-3.5 h-3.5 text-zinc-700" />
              <span className="hidden lg:inline">Desktop App</span>
            </button>

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

            {/* PIN Setup & Terminal Lock Controls */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-zinc-200">
              <button
                type="button"
                onClick={() => setIsPinSetupModalOpen(true)}
                title="Configure Security PIN"
                className="bg-white hover:bg-zinc-50 text-zinc-700 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors border border-zinc-200 hover:border-zinc-300 active:scale-98 cursor-pointer shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">PIN Setup</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLocked(true)}
                title="Lock Terminal Now (Requires PIN)"
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors active:scale-98 cursor-pointer shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-300" />
                <span>Lock</span>
              </button>
            </div>
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
            />
          )}

          {currentTab === 'new-order' && (
            <NewOrderTab
              profile={profile}
              inventory={inventory}
              onOrderCreated={handleOrderCreated}
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
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              currency={profile.currency}
              onAddItem={handleAddInventory}
              onUpdateItem={handleUpdateInventory}
              onDeleteItem={handleDeleteInventory}
              onAdjustStock={handleAdjustStock}
              onResetCatalog={handleResetCatalog}
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

          {currentTab === 'profile' && (
            <SettingsTab
              profile={profile}
              onSaveProfile={setProfile}
              onClearOrders={handleClearOrders}
              onClearInventory={handleClearInventory}
              onClearTransactions={handleClearTransactions}
              onResetAllData={handleResetAllData}
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
        </div>
      </main>

      {/* Printable Receipt Modal with Billing QR (Repair Jobs) */}
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

      {/* Security PIN Setup Modal */}
      <PinSetupModal
        isOpen={isPinSetupModalOpen}
        onClose={() => setIsPinSetupModalOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
        onPinSaved={() => setIsLocked(false)}
      />

      {/* Desktop App (Offline & Online) Modal */}
      <DesktopAppModal
        isOpen={isDesktopModalOpen}
        onClose={() => setIsDesktopModalOpen(false)}
        onExportBackup={handleExportBackup}
      />

      {/* Real-time Offline/Online Floating Alert */}
      <OfflineIndicator />
    </div>
  );
}
