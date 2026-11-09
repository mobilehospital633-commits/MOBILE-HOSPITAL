import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Clock,
  CheckCircle2,
  IndianRupee,
  ArrowRight,
  Receipt,
  QrCode,
  AlertCircle,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  CreditCard,
  Calendar,
  Wrench,
  Package,
  ShoppingBag,
  Boxes,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AccountTransaction, RepairOrder, ShopProfile, TabType, InventoryItem } from '../types';
import { getOrderDeviceName, getOrderModelNumber } from '../utils/orderUtils';

interface DashboardTabProps {
  orders: RepairOrder[];
  transactions?: AccountTransaction[];
  profile: ShopProfile;
  inventory?: InventoryItem[];
  onNavigate: (tab: TabType) => void;
  onOpenReceipt: (orderId: string) => void;
  onToggleHideTotalBilled?: () => void;
  onOpenCloudBackup?: () => void;
  onStartCustomerEntry?: (mode: 'repair' | 'order' | 'sale') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  transactions = [],
  profile,
  inventory = [],
  onNavigate,
  onOpenReceipt,
  onToggleHideTotalBilled,
  onOpenCloudBackup,
  onStartCustomerEntry,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const curr = profile.currency || '₹';

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    if (periodFilter === 'all') return orders;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    return orders.filter((o) => {
      if (periodFilter === 'today') return o.date === todayStr;
      if (periodFilter === 'yesterday') return o.date === yesterdayStr;
      if (periodFilter === 'week') return o.date >= oneWeekAgoStr;
      if (periodFilter === 'month') return o.date >= startOfMonthStr;
      if (periodFilter === 'custom') {
        if (customStartDate && o.date < customStartDate) return false;
        if (customEndDate && o.date > customEndDate) return false;
        return true;
      }
      return true;
    });
  }, [orders, periodFilter, customStartDate, customEndDate]);

  // Filter transactions by selected period
  const filteredTransactions = useMemo(() => {
    if (periodFilter === 'all') return transactions;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    return transactions.filter((t) => {
      if (periodFilter === 'today') return t.date === todayStr;
      if (periodFilter === 'yesterday') return t.date === yesterdayStr;
      if (periodFilter === 'week') return t.date >= oneWeekAgoStr;
      if (periodFilter === 'month') return t.date >= startOfMonthStr;
      if (periodFilter === 'custom') {
        if (customStartDate && t.date < customStartDate) return false;
        if (customEndDate && t.date > customEndDate) return false;
        return true;
      }
      return true;
    });
  }, [transactions, periodFilter, customStartDate, customEndDate]);

  const {
    totalJobs,
    inProgressJobs,
    completedJobs,
    totalRevenue,
    totalDue,
    accIncome,
    accExpense,
    accNetProfit,
  } = useMemo(() => {
    const jobs = filteredOrders.length;
    let inProgress = 0;
    let completed = 0;
    let revenue = 0;
    let due = 0;

    for (let i = 0; i < filteredOrders.length; i++) {
      const o = filteredOrders[i];
      if (o.status === 'Pending' || o.status === 'In Progress') {
        inProgress++;
      } else if (o.status === 'Completed' || o.status === 'Delivered') {
        completed++;
      }
      const cost = o.cost || 0;
      const deposit = o.deposit || 0;
      revenue += cost;
      if (cost > deposit) {
        due += (cost - deposit);
      }
    }

    let income = 0;
    let expense = 0;
    for (let j = 0; j < filteredTransactions.length; j++) {
      const t = filteredTransactions[j];
      if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        expense += t.amount;
      }
    }

    return {
      totalJobs: jobs,
      inProgressJobs: inProgress,
      completedJobs: completed,
      totalRevenue: revenue,
      totalDue: due,
      accIncome: income,
      accExpense: expense,
      accNetProfit: income - expense,
    };
  }, [filteredOrders, filteredTransactions]);

  const lowStockCount = useMemo(() => {
    const threshold = profile.systemFeatures?.lowStockThreshold || 5;
    return inventory.filter((item) => (item.qty || 0) <= threshold).length;
  }, [inventory, profile.systemFeatures]);

  const recentOrders = filteredOrders.slice(0, 6);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'In Progress':
        return 'bg-sky-50 text-sky-800 border-sky-200/80';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      case 'Delivered':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Filter & Period Control */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shrink-0">
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-900">Dashboard Period</span>
              {periodFilter !== 'all' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Filtered
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              {periodFilter === 'all'
                ? 'Showing lifetime metrics & financial summary'
                : periodFilter === 'today'
                ? "Showing today's activity & financials"
                : periodFilter === 'yesterday'
                ? "Showing yesterday's activity & financials"
                : periodFilter === 'month'
                ? "Showing this month's activity & financials"
                : `Custom range: ${customStartDate || 'start'} to ${customEndDate || 'end'}`}
            </p>
          </div>
        </div>

        {/* Quick Period Buttons */}
        <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-2xs text-xs font-medium flex-wrap">
          <button
            type="button"
            onClick={() => setPeriodFilter('all')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              periodFilter === 'all' ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('today')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              periodFilter === 'today' ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('yesterday')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              periodFilter === 'yesterday' ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('week')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              periodFilter === 'week' ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('month')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              periodFilter === 'month' ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriodFilter('custom');
              if (!customStartDate && !customEndDate) {
                const today = new Date().toISOString().split('T')[0];
                setCustomStartDate(today);
                setCustomEndDate(today);
              }
            }}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              periodFilter === 'custom'
                ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                : 'text-zinc-600 hover:text-emerald-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Custom Date</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker when active in Dashboard */}
      {periodFilter === 'custom' && (
        <div className="p-3 bg-white border border-emerald-200/80 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Custom Date Range:</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-medium">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white text-zinc-900 font-medium text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-medium">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white text-zinc-900 font-medium text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setCustomStartDate(today);
                setCustomEndDate(today);
              }}
              className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-[11px] transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const yStr = y.toISOString().split('T')[0];
                setCustomStartDate(yStr);
                setCustomEndDate(yStr);
              }}
              className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-[11px] transition-colors cursor-pointer"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                setCustomStartDate(start);
                setCustomEndDate(now.toISOString().split('T')[0]);
              }}
              className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-[11px] transition-colors cursor-pointer"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('all')}
              className="px-2 py-1 text-zinc-500 hover:text-zinc-800 underline text-[11px] transition-colors cursor-pointer ml-1"
            >
              Reset to All Time
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-zinc-200/90 shadow-2xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Jobs</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-zinc-900 tracking-tight">{totalJobs}</span>
              <span className="text-[11px] text-zinc-500 font-medium">recorded</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-zinc-200/90 shadow-2xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">In Progress</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-700 tracking-tight">{inProgressJobs}</span>
              <span className="text-[11px] text-amber-700/80 font-medium">on bench</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-zinc-200/90 shadow-2xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Completed</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700 tracking-tight">{completedJobs}</span>
              <span className="text-[11px] text-emerald-700/80 font-medium">ready/delivered</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-zinc-200/90 shadow-2xs interactive-card flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Billed</span>
              {onToggleHideTotalBilled && (
                <button
                  type="button"
                  onClick={onToggleHideTotalBilled}
                  title={profile.hideTotalBilled ? 'Show Total Billed' : 'Hide Total Billed (Privacy Mode)'}
                  className="text-zinc-400 hover:text-zinc-700 p-1 -mr-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                  aria-label={profile.hideTotalBilled ? 'Show Total Billed' : 'Hide Total Billed'}
                >
                  {profile.hideTotalBilled ? (
                    <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
            {profile.hideTotalBilled ? (
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-widest text-zinc-400 font-mono select-none">
                    ••••••••
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    (Hidden)
                  </span>
                </div>
                {onToggleHideTotalBilled ? (
                  <button
                    type="button"
                    onClick={onToggleHideTotalBilled}
                    className="text-[11px] text-zinc-500 hover:text-zinc-700 font-medium mt-0.5 cursor-pointer underline text-left block"
                  >
                    Reveal amount
                  </button>
                ) : (
                  <p className="text-[10px] text-zinc-400 mt-0.5">Hidden in settings</p>
                )}
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 mt-0.5 tracking-tight">
                  {curr}{totalRevenue.toFixed(2)}
                </p>
                {totalDue > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigate('dues')}
                    className="text-[11px] font-mono tabular-nums text-rose-600 font-semibold mt-0.5 flex items-center gap-1.5 hover:underline cursor-pointer group"
                    title="View pending dues and send customer due amount reminders"
                  >
                    <span>Due: {curr}{totalDue.toFixed(2)}</span>
                    <span className="text-[10px] text-rose-700 font-sans font-bold group-hover:translate-x-0.5 transition-transform">
                      Remind →
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Intake Shortcuts (Balanced 6-Column Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => {
            if (onStartCustomerEntry) onStartCustomerEntry('repair');
            else onNavigate('new-order');
          }}
          className="p-3.5 bg-white hover:bg-emerald-50/60 border border-zinc-200/90 hover:border-emerald-300 rounded-xl transition-all cursor-pointer shadow-2xs group flex items-center gap-3 interactive-card"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Wrench className="w-4.5 h-4.5" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-bold text-zinc-900 group-hover:text-emerald-950 truncate">Service Repair</div>
            <div className="text-[11px] text-zinc-500 truncate">Device intake job</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onStartCustomerEntry) onStartCustomerEntry('order');
            else onNavigate('new-order');
          }}
          className="p-3.5 bg-white hover:bg-blue-50/60 border border-zinc-200/90 hover:border-blue-300 rounded-xl transition-all cursor-pointer shadow-2xs group flex items-center gap-3 interactive-card"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Package className="w-4.5 h-4.5" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-bold text-zinc-900 group-hover:text-blue-950 truncate">Customer Orders</div>
            <div className="text-[11px] text-zinc-500 truncate">Parts booking</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onStartCustomerEntry) onStartCustomerEntry('sale');
            else onNavigate('new-order');
          }}
          className="p-3.5 bg-white hover:bg-violet-50/60 border border-zinc-200/90 hover:border-violet-300 rounded-xl transition-all cursor-pointer shadow-2xs group flex items-center gap-3 interactive-card"
        >
          <div className="w-9 h-9 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-4.5 h-4.5" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-bold text-zinc-900 group-hover:text-violet-950 truncate">Customer Sales</div>
            <div className="text-[11px] text-zinc-500 truncate">Counter billing</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('inventory')}
          className="p-3.5 bg-white hover:bg-amber-50/60 border border-zinc-200/90 hover:border-amber-300 rounded-xl transition-all cursor-pointer shadow-2xs group flex items-center gap-3 interactive-card"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Boxes className="w-4.5 h-4.5" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-bold text-zinc-900 group-hover:text-amber-950 truncate">Inventory & Stock</div>
            <div className="text-[11px] text-zinc-500 truncate">
              {lowStockCount > 0 ? (
                <span className="text-amber-700 font-semibold font-mono tabular-nums">{lowStockCount} low stock</span>
              ) : (
                <span>{inventory.length} items cataloged</span>
              )}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('dues')}
          className="p-3.5 bg-white hover:bg-rose-50/60 border border-zinc-200/90 hover:border-rose-300 rounded-xl transition-all cursor-pointer shadow-2xs group flex items-center gap-3 interactive-card"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <CreditCard className="w-4.5 h-4.5" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-bold text-zinc-900 group-hover:text-rose-950 truncate">Due Payments</div>
            <div className="text-[11px] font-mono font-bold text-rose-600 truncate tabular-nums">
              {totalDue > 0 ? `${curr}${totalDue.toFixed(2)} due` : 'Zero dues'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="p-3.5 bg-white hover:bg-zinc-100/80 border border-zinc-200/90 hover:border-zinc-300 rounded-xl transition-all cursor-pointer shadow-2xs group flex items-center gap-3 interactive-card"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Sliders className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-bold text-zinc-900 group-hover:text-zinc-950 truncate">Workshop Config</div>
            <div className="text-[11px] text-zinc-500 truncate">Billing Types & QR</div>
          </div>
        </button>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Recent Repair Orders</h2>
            <p className="text-xs text-zinc-500">Preview and print official customer receipts</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="py-3 px-5">Ticket ID</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Device</th>
                <th className="py-3 px-5">Issue</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Cost / Due</th>
                <th className="py-3 px-5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                    No repair orders recorded yet. Click "Service Repair" above to create your first job card.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const bal = Math.max(0, o.cost - o.deposit);
                  return (
                    <tr key={o.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-zinc-900">
                        <span className="font-mono text-xs">{o.id}</span>
                        <span className="block text-[11px] text-zinc-400 font-normal">{o.date}</span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-zinc-800">
                        <span className="text-xs font-bold text-zinc-900 block">{o.name}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">{o.phone}</span>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-700">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-zinc-900 text-xs">{getOrderDeviceName(o)}</span>
                          {getOrderModelNumber(o) && (
                            <span className="text-[11px] text-zinc-500 font-mono">
                              · {getOrderModelNumber(o)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">IMEI: {o.imei || 'N/A'}</span>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-500 text-xs max-w-[180px] truncate">{o.problem}</td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusBadge(
                            o.status
                          )}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            o.status === 'Completed' || o.status === 'Delivered'
                              ? 'bg-emerald-500'
                              : o.status === 'In Progress'
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          }`} />
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                        <div className="font-bold text-zinc-900 text-xs">{curr}{o.cost.toFixed(2)}</div>
                        <div className={`text-[11px] font-semibold ${bal > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {bal > 0 ? `Due: ${curr}${bal.toFixed(2)}` : 'Paid'}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => onOpenReceipt(o.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs transition-colors cursor-pointer border border-zinc-200/80 active:scale-95"
                          title="Open and print customer receipt (or press Ctrl+P)"
                        >
                          <Receipt className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
