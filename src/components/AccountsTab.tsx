import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Edit2,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Receipt,
  CreditCard,
  Building2,
  Banknote,
  FileSpreadsheet,
} from 'lucide-react';
import { AccountTransaction, RepairOrder, ShopProfile, TransactionType } from '../types';

interface AccountsTabProps {
  transactions: AccountTransaction[];
  orders: RepairOrder[];
  profile: ShopProfile;
  onAddTransaction: (txn: AccountTransaction) => void;
  onUpdateTransaction: (txn: AccountTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBatchAddTransactions: (txns: AccountTransaction[]) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  transactions,
  orders,
  profile,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onBatchAddTransactions,
}) => {
  const curr = profile.currency || '₹';

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<AccountTransaction | null>(null);

  // Form State
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('Cash');
  const [formReferenceId, setFormReferenceId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Sync / Import Banner State
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const incomeCategories = [
    'Repair Service Payment',
    'Spare Parts Sales',
    'Accessories & Tempered Glass',
    'Software & Unlock Service',
    'Old Device Resale',
    'Other Income',
  ];

  const expenseCategories = [
    'Spare Parts & Inventory',
    'Shop Rent',
    'Technician Wages / Salary',
    'Electricity & Utilities',
    'Tools & Workshop Equipment',
    'Tea & Refreshments',
    'Courier & Shipping',
    'Marketing & Signs',
    'Other Expense',
  ];

  // Open modal for new transaction
  const handleOpenAdd = (type: TransactionType) => {
    setEditingTxn(null);
    setFormType(type);
    setFormCategory(type === 'income' ? incomeCategories[0] : expenseCategories[0]);
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('Cash');
    setFormReferenceId('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (txn: AccountTransaction) => {
    setEditingTxn(txn);
    setFormType(txn.type);
    setFormCategory(txn.category);
    setFormAmount(txn.amount.toString());
    setFormDate(txn.date);
    setFormPaymentMethod(txn.paymentMethod);
    setFormReferenceId(txn.referenceId || '');
    setFormNotes(txn.notes);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (!amountNum || amountNum <= 0) return;

    if (editingTxn) {
      const updated: AccountTransaction = {
        ...editingTxn,
        type: formType,
        category: formCategory.trim() || (formType === 'income' ? 'Other Income' : 'Other Expense'),
        amount: amountNum,
        date: formDate,
        paymentMethod: formPaymentMethod,
        referenceId: formReferenceId.trim() || undefined,
        notes: formNotes.trim(),
      };
      onUpdateTransaction(updated);
    } else {
      const newTxn: AccountTransaction = {
        id: `TXN-${Date.now().toString().slice(-4)}`,
        type: formType,
        category: formCategory.trim() || (formType === 'income' ? 'Other Income' : 'Other Expense'),
        amount: amountNum,
        date: formDate,
        paymentMethod: formPaymentMethod,
        referenceId: formReferenceId.trim() || undefined,
        notes: formNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddTransaction(newTxn);
    }

    setIsModalOpen(false);
  };

  // Check for Repair Orders that can be synced to Income
  const unrecordedRepairOrders = useMemo(() => {
    const recordedRefs = new Set(transactions.map((t) => t.referenceId).filter(Boolean));
    return orders.filter((o) => o.deposit > 0 && !recordedRefs.has(o.id));
  }, [orders, transactions]);

  const handleSyncRepairOrders = () => {
    if (unrecordedRepairOrders.length === 0) {
      setSyncNotice('All current repair orders with payments are already recorded in accounts.');
      setTimeout(() => setSyncNotice(null), 3000);
      return;
    }

    const newTxns: AccountTransaction[] = unrecordedRepairOrders.map((o, idx) => ({
      id: `TXN-ORD-${Date.now().toString().slice(-3)}${idx}`,
      type: 'income',
      category: 'Repair Service Payment',
      amount: o.deposit,
      date: o.date || new Date().toISOString().split('T')[0],
      paymentMethod: profile.includeBillingQr ? 'UPI' : 'Cash',
      referenceId: o.id,
      notes: `Repair payment for ${o.model} - ${o.name} (${o.problem})`,
      createdAt: new Date().toISOString(),
    }));

    onBatchAddTransactions(newTxns);
    setSyncNotice(`Successfully recorded ${newTxns.length} repair order income entries!`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // One week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    // First day of current month
    const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    return transactions.filter((t) => {
      // Type Filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Period Filter
      if (periodFilter === 'today' && t.date !== todayStr) return false;
      if (periodFilter === 'week' && t.date < oneWeekAgoStr) return false;
      if (periodFilter === 'month' && t.date < startOfMonthStr) return false;

      // Category Filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // Payment Method Filter
      if (paymentMethodFilter !== 'all' && t.paymentMethod !== paymentMethodFilter) return false;

      // Search Term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchNotes = (t.notes || '').toLowerCase().includes(query);
        const matchCat = (t.category || '').toLowerCase().includes(query);
        const matchRef = (t.referenceId || '').toLowerCase().includes(query);
        const matchMethod = (t.paymentMethod || '').toLowerCase().includes(query);
        const matchAmount = t.amount.toString().includes(query);
        if (!matchNotes && !matchCat && !matchRef && !matchMethod && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, periodFilter, categoryFilter, paymentMethodFilter, searchTerm]);

  // Aggregate Calculations for current period/filter
  const { totalIncome, totalExpense, netProfit, cashBalance, upiBalance, bankCardBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let cash = 0;
    let upi = 0;
    let bankCard = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
        if (t.paymentMethod === 'Cash') cash += t.amount;
        else if (t.paymentMethod === 'UPI') upi += t.amount;
        else bankCard += t.amount;
      } else {
        expense += t.amount;
        if (t.paymentMethod === 'Cash') cash -= t.amount;
        else if (t.paymentMethod === 'UPI') upi -= t.amount;
        else bankCard -= t.amount;
      }
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
      cashBalance: cash,
      upiBalance: upi,
      bankCardBalance: bankCard,
    };
  }, [filteredTransactions]);

  // Top expense category breakdown
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [filteredTransactions]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions available to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Reference', 'Notes'];
    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.type.toUpperCase()}"`,
      `"${t.category}"`,
      t.amount.toFixed(2),
      `"${t.paymentMethod}"`,
      `"${t.referenceId || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Income_Expense_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print
  const handlePrintStatement = () => {
    window.print();
  };

  // List of all unique categories present for the dropdown
  const allUsedCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-2xs">
                <Wallet className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                Income & Expense Accounts
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Track cash drawer, customer repair income, parts procurement, rent and operational expenses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unrecordedRepairOrders.length > 0 && (
              <button
                type="button"
                onClick={handleSyncRepairOrders}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sync unrecorded payments from Repair Orders"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                <span>Sync {unrecordedRepairOrders.length} Repair Orders</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrintStatement}
              className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAdd('income')}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Record Income</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAdd('expense')}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
            >
              <Minus className="w-3.5 h-3.5 text-rose-400" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* Sync / Action Notification */}
        {syncNotice && (
          <div className="mt-4 p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{syncNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncNotice(null)}
              className="text-zinc-400 hover:text-zinc-700 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* Total Income */}
          <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Total Income
              </span>
              <span className="w-6 h-6 rounded-md bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xl font-bold text-zinc-900 tracking-tight">
              {curr}{totalIncome.toFixed(2)}
            </p>
            <p className="text-[11px] text-zinc-500">
              From {filteredTransactions.filter((t) => t.type === 'income').length} receipt credits
            </p>
          </div>

          {/* Total Expenses */}
          <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Total Expenses
              </span>
              <span className="w-6 h-6 rounded-md bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xl font-bold text-zinc-900 tracking-tight">
              {curr}{totalExpense.toFixed(2)}
            </p>
            <p className="text-[11px] text-zinc-500">
              From {filteredTransactions.filter((t) => t.type === 'expense').length} debits logged
            </p>
          </div>

          {/* Net Profit / Balance */}
          <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Net Profit / Balance
              </span>
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                  netProfit >= 0
                    ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                    : 'bg-rose-100 border-rose-200 text-rose-700'
                }`}
              >
                {netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              </span>
            </div>
            <p
              className={`text-xl font-bold tracking-tight ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {netProfit >= 0 ? '+' : ''}{curr}{netProfit.toFixed(2)}
            </p>
            <p className="text-[11px] text-zinc-500">
              {totalIncome > 0
                ? `${Math.round((netProfit / totalIncome) * 100)}% Operating Margin`
                : 'No income logged'}
            </p>
          </div>

          {/* Mode Breakdown (Cash vs UPI) */}
          <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Account Split
              </span>
              <span className="w-6 h-6 rounded-md bg-zinc-200 flex items-center justify-center text-zinc-700">
                <Banknote className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-0.5">
              <span className="text-xs text-zinc-500">Cash Drawer:</span>
              <span className="text-xs font-semibold text-zinc-900 font-mono">{curr}{cashBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-zinc-500">UPI / Digital:</span>
              <span className="text-xs font-semibold text-zinc-900 font-mono">{curr}{(upiBalance + bankCardBalance).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Expense Category Mini-Breakdown */}
        {expenseBreakdown.length > 0 && (
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Top Expense Allocations
              </span>
              <span className="text-[11px] text-zinc-400">
                Total Expenses: {curr}{totalExpense.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {expenseBreakdown.map(([cat, amount]) => {
                const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                return (
                  <div key={cat} className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-zinc-700 truncate">{cat}</span>
                      <span className="font-semibold text-zinc-900 font-mono">{curr}{amount.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-800 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>Share</span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Ledger Table Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        {/* Filter controls toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/50 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Type selector tabs */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-2xs text-xs font-medium">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-zinc-900 text-white shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All Entries ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('income')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'income'
                    ? 'bg-zinc-900 text-white shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                <span>Income ({transactions.filter((t) => t.type === 'income').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('expense')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'expense'
                    ? 'bg-zinc-900 text-white shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <ArrowUpRight className="w-3 h-3 text-rose-400" />
                <span>Expenses ({transactions.filter((t) => t.type === 'expense').length})</span>
              </button>
            </div>

            {/* Period Quick Select */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-2xs text-xs font-medium">
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
                onClick={() => setPeriodFilter('month')}
                className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  periodFilter === 'month' ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                This Month
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
                onClick={() => setPeriodFilter('today')}
                className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  periodFilter === 'today' ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Today
              </button>
            </div>
          </div>

          {/* Secondary Search & Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search note, category, ref ID..."
                className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none bg-white transition-colors"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-800 bg-white focus:border-zinc-900 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="all">All Categories</option>
                {allUsedCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Dropdown */}
            <div>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-800 bg-white focus:border-zinc-900 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Type & Category</th>
                <th className="py-3 px-5">Description / Narration</th>
                <th className="py-3 px-5">Reference</th>
                <th className="py-3 px-5">Payment Mode</th>
                <th className="py-3 px-5 text-right">Amount</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                    <Wallet className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    No transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isIncome = t.type === 'income';
                  return (
                    <tr key={t.id} className="hover:bg-zinc-50/60 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-5 text-xs text-zinc-800 font-mono whitespace-nowrap">
                        {t.date}
                        <span className="block text-[10px] text-zinc-400">{t.id}</span>
                      </td>

                      {/* Type & Category */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="w-2.5 h-2.5" />
                            ) : (
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            )}
                          </span>
                          <span className="text-xs font-medium text-zinc-900">{t.category}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-5 text-xs text-zinc-600 max-w-[240px] truncate">
                        {t.notes || '—'}
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-5 text-xs text-zinc-500 font-mono">
                        {t.referenceId ? (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] text-zinc-700">
                            {t.referenceId}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-5 text-xs">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {t.paymentMethod}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-5 text-right font-mono font-semibold whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-700' : 'text-rose-700'}>
                          {isIncome ? '+' : '-'} {curr}
                          {t.amount.toFixed(2)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete this ${t.type} entry of ${curr}${t.amount}?`)) {
                                onDeleteTransaction(t.id);
                              }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Ledger Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500 gap-2">
          <span>
            Showing {filteredTransactions.length} of {transactions.length} total entries
          </span>
          <div className="flex items-center gap-4 font-mono">
            <span>
              Income: <strong className="text-emerald-700">{curr}{totalIncome.toFixed(2)}</strong>
            </span>
            <span>
              Expense: <strong className="text-rose-700">{curr}{totalExpense.toFixed(2)}</strong>
            </span>
            <span>
              Net: <strong className={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {netProfit >= 0 ? '+' : ''}{curr}{netProfit.toFixed(2)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200">
            {/* Modal Header */}
            <div className="p-4 px-5 bg-white border-b border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-white ${
                    formType === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {formType === 'income' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
                    {editingTxn ? 'Edit Transaction' : `Record ${formType === 'income' ? 'Income' : 'Expense'}`}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {formType === 'income' ? 'Cash receipt or bank/UPI credit' : 'Operational cost or vendor debit'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Transaction Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('income');
                      if (!incomeCategories.includes(formCategory)) {
                        setFormCategory(incomeCategories[0]);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      formType === 'income'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Income / Credit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('expense');
                      if (!expenseCategories.includes(formCategory)) {
                        setFormCategory(expenseCategories[0]);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      formType === 'expense'
                        ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    <span>Expense / Debit</span>
                  </button>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Amount ({curr}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors bg-white cursor-pointer"
                >
                  {(formType === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Custom">Other / Custom Category...</option>
                </select>

                {formCategory === 'Custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom category name"
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full mt-2 border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors"
                  />
                )}
              </div>

              {/* Payment Method & Reference ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Payment Method *
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors bg-white cursor-pointer"
                  >
                    <option value="Cash">Cash Drawer</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Card">Card / POS</option>
                    <option value="Bank Transfer">Bank Transfer / IMPS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Reference / Bill # (Optional)
                  </label>
                  <input
                    type="text"
                    value={formReferenceId}
                    onChange={(e) => setFormReferenceId(e.target.value)}
                    placeholder="e.g. T-1001, INV-402"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Quick Link to existing Repair Ticket if Income */}
              {formType === 'income' && orders.length > 0 && (
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                    Or select an existing Repair Job to autofill:
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedOrder = orders.find((o) => o.id === e.target.value);
                      if (selectedOrder) {
                        setFormReferenceId(selectedOrder.id);
                        setFormAmount(selectedOrder.deposit.toString());
                        setFormCategory('Repair Service Payment');
                        setFormNotes(`Payment for ${selectedOrder.model} - ${selectedOrder.name}`);
                      }
                    }}
                    defaultValue=""
                    className="w-full border border-zinc-200 rounded-lg p-1.5 text-xs text-zinc-600 bg-zinc-50 focus:border-zinc-900 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">-- Choose Repair Ticket to Link --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} - {o.name} ({o.model}) - {curr}{o.cost} (Paid: {curr}{o.deposit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes / Description */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Description / Narration
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Payment for iPhone display replacement or bought heat gun"
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingTxn ? 'Save Changes' : 'Record Transaction'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
