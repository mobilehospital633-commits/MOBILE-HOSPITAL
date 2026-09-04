import React, { useState, useEffect } from 'react';
import { RotateCw, Plus, QrCode, Eye, EyeOff, LogIn } from 'lucide-react';
import { RepairOrder, InventoryItem, ShopProfile, TabType, AccountTransaction, ThemeMode, ThemeAccent, AppUser } from './types';
import { INITIAL_ORDERS, INITIAL_INVENTORY, INITIAL_PROFILE, INITIAL_TRANSACTIONS, INITIAL_USERS } from './data';
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
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

    const applyDark = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (themeMode === 'dark') {
      applyDark(true);
    } else if (themeMode === 'light') {
      applyDark(false);
    } else if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => applyDark(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
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
    setOrders([...INITIAL_ORDERS]);
    setInventory([...INITIAL_INVENTORY]);
    setTransactions([...INITIAL_TRANSACTIONS]);
    setProfile({ ...INITIAL_PROFILE });
  };

  const handleImportProfile = (imported: ShopProfile) => {
    setProfile(imported);
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

  const pageTitles: Record<TabType, string> = {
    dashboard: 'Dashboard Overview',
    'new-order': 'New Repair Order Entry',
    orders: 'Manage Repair Jobs',
    inventory: 'Parts Inventory',
    accounts: 'Income & Expense Accounts',
    customers: 'Customer Directory',
    profile: 'Profile, Receipts & Billing QR',
  };

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
            />
          )}

          {currentTab === 'new-order' && (
            <NewOrderTab
              profile={profile}
              onOrderCreated={handleOrderCreated}
              currentUser={currentUser}
              users={users}
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
