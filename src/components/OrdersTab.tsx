import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import {
  Search,
  Filter,
  Receipt,
  Trash2,
  Calendar,
  Clock,
  Wrench,
  Edit3,
  ExternalLink,
  ShoppingBag,
  Package,
  ShieldCheck,
  Tag,
  Check,
  X,
  MessageSquare,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BellRing,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { RepairOrder, ShopProfile, UserRole } from '../types';
import { getOrderDeviceName, getOrderModelNumber } from '../utils/orderUtils';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { DueReminderModal } from './DueReminderModal';
import { LazyImage } from './LazyImage';

export type DirectoryOrderType = 'all' | 'repair' | 'order' | 'sale';

interface OrdersTabProps {
  orders: RepairOrder[];
  profile: ShopProfile;
  userRole?: UserRole;
  onUpdateStatus: (orderId: string, newStatus: RepairOrder['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  onSelectOrderForReceipt?: (order: RepairOrder) => void;
  onOpenReceipt?: (orderId: string) => void;
  onSelectOrderForEdit?: (order: RepairOrder) => void;
  onEditOrder?: (orderId: string) => void;
  onClearBalance?: (orderId: string) => void;
  initialOrderTypeFilter?: DirectoryOrderType;
  onOrderTypeFilterChange?: (filter: DirectoryOrderType) => void;
  onSaveProfile?: (profile: ShopProfile) => void;
  onReminderSent?: (orderId: string, reminderMessage: string) => void;
}

// Helper to strictly & reliably resolve the order category:
// - 'order' => Customer Order
// - 'sale'  => Customer Sales
// - 'repair'=> Service Repair
export const resolveOrderCategory = (o: RepairOrder): 'repair' | 'order' | 'sale' => {
  // If explicitly marked as 'order', or ID starts with 'ORD-', or description specifies customer order booking
  if (
    o.orderType === 'order' ||
    o.id?.startsWith('ORD-') ||
    (o.problem?.startsWith('Customer Order:') && o.orderType !== 'repair')
  ) {
    return 'order';
  }
  // If explicitly marked as 'sale' or ID starts with 'SL-' or IMEI specifies product sale
  if (o.orderType === 'sale' || o.id?.startsWith('SL-')) {
    return 'sale';
  }
  // Default to repair job
  return 'repair';
};

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  profile,
  userRole = 'owner',
  onUpdateStatus,
  onDeleteOrder,
  onSelectOrderForReceipt,
  onOpenReceipt,
  onSelectOrderForEdit,
  onEditOrder,
  onClearBalance,
  initialOrderTypeFilter = 'all',
  onOrderTypeFilterChange,
  onSaveProfile,
  onReminderSent,
}) => {
  const curr = profile.currency || '₹';
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<RepairOrder | null>(null);
  const [dueReminderOrder, setDueReminderOrder] = useState<RepairOrder | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState<DirectoryOrderType>(initialOrderTypeFilter);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sync when prop changes
  useEffect(() => {
    if (initialOrderTypeFilter && initialOrderTypeFilter !== orderTypeFilter) {
      setOrderTypeFilter(initialOrderTypeFilter);
    }
  }, [initialOrderTypeFilter]);

  const handleSelectOrderType = (type: DirectoryOrderType) => {
    setOrderTypeFilter(type);
    onOrderTypeFilterChange?.(type);
  };

  const handleTriggerReceipt = (order: RepairOrder) => {
    if (onOpenReceipt) {
      onOpenReceipt(order.id);
    }
    if (onSelectOrderForReceipt) {
      onSelectOrderForReceipt(order);
    }
  };

  const handleTriggerEdit = (order: RepairOrder) => {
    if (onEditOrder) {
      onEditOrder(order.id);
    }
    if (onSelectOrderForEdit) {
      onSelectOrderForEdit(order);
    }
  };

  const handleQuickWhatsApp = (order: RepairOrder) => {
    setWhatsAppModalOrder(order);
  };

  // Counts for the 4 distinct categories:
  // 1. All Orders
  // 2. Service Repair
  // 3. Customer Orders
  // 4. Customer Sales
  const repairOrdersCount = useMemo(() => {
    return orders.filter((o) => resolveOrderCategory(o) === 'repair').length;
  }, [orders]);

  const customerOrdersCount = useMemo(() => {
    return orders.filter((o) => resolveOrderCategory(o) === 'order').length;
  }, [orders]);

  const salesOrdersCount = useMemo(() => {
    return orders.filter((o) => resolveOrderCategory(o) === 'sale').length;
  }, [orders]);

  // Deferred search to eliminate typing latency on large datasets
  const deferredSearch = useDeferredValue(searchTerm);

  // Pagination State (snappy rendering with 20 items per page by default)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Filtered Orders (computed using deferred search term)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = deferredSearch.toLowerCase().trim();
      const devName = (o.deviceName || '').toLowerCase();
      const modelNum = (o.modelNumber || '').toLowerCase();
      const category = (o.productCategory || '').toLowerCase();

      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.model.toLowerCase().includes(q) ||
        devName.includes(q) ||
        modelNum.includes(q) ||
        category.includes(q) ||
        o.imei.toLowerCase().includes(q) ||
        o.problem.toLowerCase().includes(q);

      const resolvedCat = resolveOrderCategory(o);
      let matchesType = true;
      if (orderTypeFilter === 'repair') {
        matchesType = resolvedCat === 'repair';
      } else if (orderTypeFilter === 'order') {
        matchesType = resolvedCat === 'order';
      } else if (orderTypeFilter === 'sale') {
        matchesType = resolvedCat === 'sale';
      }

      let matchesStatus = true;
      if (statusFilter !== 'All') {
        matchesStatus = o.status === statusFilter;
      }

      let matchesDate = true;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

      const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      if (dateFilter === 'today') {
        matchesDate = o.date === todayStr;
      } else if (dateFilter === 'yesterday') {
        matchesDate = o.date === yesterdayStr;
      } else if (dateFilter === 'week') {
        matchesDate = o.date >= oneWeekAgoStr;
      } else if (dateFilter === 'month') {
        matchesDate = o.date >= startOfMonthStr;
      } else if (dateFilter === 'custom') {
        if (customStartDate && customEndDate) {
          matchesDate = o.date >= customStartDate && o.date <= customEndDate;
        } else if (customStartDate) {
          matchesDate = o.date >= customStartDate;
        } else if (customEndDate) {
          matchesDate = o.date <= customEndDate;
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [orders, deferredSearch, orderTypeFilter, statusFilter, dateFilter, customStartDate, customEndDate]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, orderTypeFilter, statusFilter, dateFilter, customStartDate, customEndDate]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / (pageSize === 0 ? (filteredOrders.length || 1) : pageSize)));

  const paginatedOrders = useMemo(() => {
    if (pageSize === 0) return filteredOrders;
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = [
      'Order ID',
      'Category',
      'Customer Name',
      'Phone',
      'Device / Item',
      'Model No',
      'IMEI / Serial',
      'Problem / Description',
      'Status',
      'Date',
      'Total Amount',
      'Advance Paid',
      'Due Balance',
      'Technician',
    ];
    const rows = filteredOrders.map((o) => {
      const cat = resolveOrderCategory(o);
      const catLabel = cat === 'sale' ? 'Counter Sale' : cat === 'order' ? 'Customer Order' : 'Service Repair';
      const total = o.totalAmount ?? o.cost ?? 0;
      const adv = o.advancePaid ?? o.deposit ?? 0;
      const due = Math.max(0, total - adv);
      const dev = getOrderDeviceName(o);
      const modelNum = getOrderModelNumber(o);

      return [
        `"${o.id}"`,
        `"${catLabel}"`,
        `"${(o.name || o.customerName || '').replace(/"/g, '""')}"`,
        `"${(o.phone || '').replace(/"/g, '""')}"`,
        `"${dev.replace(/"/g, '""')}"`,
        `"${modelNum.replace(/"/g, '""')}"`,
        `"${(o.imei || '').replace(/"/g, '""')}"`,
        `"${(o.problem || '').replace(/"/g, '""')}"`,
        `"${o.status}"`,
        `"${o.date}"`,
        total,
        adv,
        due,
        `"${(o.technician || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MH_Orders_Report_${orderTypeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Unified Command Center Header with Live Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                Customer Orders & Service Directory
              </h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                {orders.length} Entries
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Comprehensive ledger for service repairs, advance customer bookings, and counter sales
            </p>
          </div>
        </div>

        {/* Live Quick Counters */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-sans uppercase font-bold tracking-wider">Total Orders</span>
            <span className="font-bold text-zinc-900 tabular-nums">{orders.length}</span>
          </div>
          <div className="h-6 w-px bg-zinc-200" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-600 font-sans uppercase font-bold tracking-wider">Repairs</span>
            <span className="font-bold text-emerald-700 tabular-nums">{repairOrdersCount}</span>
          </div>
          <div className="h-6 w-px bg-zinc-200" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-600 font-sans uppercase font-bold tracking-wider">Orders</span>
            <span className="font-bold text-blue-700 tabular-nums">{customerOrdersCount}</span>
          </div>
          <div className="h-6 w-px bg-zinc-200" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-[10px] text-violet-600 font-sans uppercase font-bold tracking-wider">Sales</span>
            <span className="font-bold text-violet-700 tabular-nums">{salesOrdersCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Segmented Mode Selector + Status + Date Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs">
        {/* The 4 Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100/90 rounded-xl border border-zinc-200/80">
          <button
            type="button"
            onClick={() => handleSelectOrderType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              orderTypeFilter === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Entries</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold tabular-nums ${
                orderTypeFilter === 'all' ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectOrderType('repair')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              orderTypeFilter === 'repair'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Service Repair</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold tabular-nums ${
                orderTypeFilter === 'repair' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {repairOrdersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectOrderType('order')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              orderTypeFilter === 'order'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-800 hover:text-blue-950 hover:bg-blue-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Customer Orders</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold tabular-nums ${
                orderTypeFilter === 'order' ? 'bg-blue-700 text-blue-100' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {customerOrdersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectOrderType('sale')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              orderTypeFilter === 'sale'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-violet-800 hover:text-violet-950 hover:bg-violet-50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer Sales</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold tabular-nums ${
                orderTypeFilter === 'sale' ? 'bg-violet-700 text-violet-100' : 'bg-violet-100 text-violet-800'
              }`}
            >
              {salesOrdersCount}
            </span>
          </button>
        </div>

        {/* Secondary Filters: Status & Date */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span>Status:</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:border-zinc-900 focus:outline-hidden transition-colors bg-zinc-50 text-zinc-800 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 whitespace-nowrap flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Date:</span>
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:border-zinc-900 focus:outline-hidden transition-colors bg-zinc-50 text-zinc-800 cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download filtered orders report as CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Custom Date Bar */}
      <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Ticket ID, Customer Name, Phone, Device, Model, IMEI, Fault, or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white text-zinc-900 focus:outline-hidden transition-all font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
            <span className="font-semibold text-zinc-600">Custom Date Range:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-zinc-300 rounded-lg px-2.5 py-1 text-xs focus:border-zinc-900 focus:outline-hidden text-zinc-900 bg-white font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-zinc-300 rounded-lg px-2.5 py-1 text-xs focus:border-zinc-900 focus:outline-hidden text-zinc-900 bg-white font-mono"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-zinc-500 hover:text-zinc-900 underline ml-1 cursor-pointer font-medium"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Orders Directory: Desktop Table + Mobile Cards */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        {/* Desktop Table View (md and above) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="py-3 px-5">Type & Ticket</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Device / Product Details</th>
                <th className="py-3 px-5">Bill & Paid</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-center">Receipt & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-zinc-400 text-xs">
                    <p className="font-semibold text-zinc-500">No orders found</p>
                    <p className="mt-1">No orders match your filter criteria or search query.</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => {
                  const balance = Math.max(0, o.cost - o.deposit);
                  const devName = getOrderDeviceName(o);
                  const resolvedCat = resolveOrderCategory(o);
                  const isSale = resolvedCat === 'sale';
                  const isOrder = resolvedCat === 'order';
                  const isRepair = resolvedCat === 'repair';

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      {/* Type & Ticket */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-zinc-950 text-xs">{o.id}</span>
                          <span className="text-zinc-300">·</span>
                          {isSale ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700">
                              <ShoppingBag className="w-3 h-3 text-violet-600" />
                              <span>Counter Sale</span>
                            </span>
                          ) : isOrder ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                              <Package className="w-3 h-3 text-blue-600" />
                              <span>Customer Order</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <Wrench className="w-3 h-3 text-emerald-600" />
                              <span>Repair Job</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span>{o.date}</span>
                          </span>
                          {o.expectedDate && (
                            <span className="text-[10px] text-blue-600 font-mono font-medium flex items-center gap-1" title="Expected Delivery">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Exp: {o.expectedDate}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-5">
                        <strong className="text-zinc-900 font-semibold block">{o.name}</strong>
                        <span className="text-xs text-zinc-500 font-mono">{o.phone}</span>
                      </td>

                      {/* Item Details */}
                      <td className="py-3.5 px-5">
                        {isSale ? (
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {o.quantity && o.quantity > 1 && (
                                <span className="font-bold text-violet-700 text-xs bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">
                                  {o.quantity}x
                                </span>
                              )}
                              <strong className="text-zinc-950 font-bold text-xs">{devName}</strong>
                              {o.productCategory && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  {o.productCategory}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-zinc-500">
                              {o.warranty && o.warranty !== 'No Warranty' && (
                                <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
                                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                                  <span>{o.warranty}</span>
                                </span>
                              )}
                              {o.paymentMethod && (
                                <span className="text-zinc-600 font-medium">
                                  Mode: {o.paymentMethod}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : isOrder ? (
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {o.quantity && o.quantity > 1 && (
                                <span className="font-bold text-blue-700 text-xs bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  {o.quantity}x
                                </span>
                              )}
                              <strong className="text-zinc-950 font-bold text-xs">{devName}</strong>
                              {o.productCategory && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  {o.productCategory}
                                </span>
                              )}
                            </div>
                            {o.problem && (
                              <p className="text-[11px] text-zinc-600 line-clamp-1 mt-0.5">
                                {o.problem}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <strong className="text-zinc-950 font-bold text-xs">{devName}</strong>
                              {o.deviceBrand && o.deviceBrand !== 'Other' && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  {o.deviceBrand}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {o.imei && o.imei !== 'N/A' && (
                                <span className="text-xs text-zinc-500 font-mono font-medium">
                                  IMEI: {o.imei}
                                </span>
                              )}
                              {o.technician && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                                  <Wrench className="w-2.5 h-2.5 text-zinc-400" />
                                  <span>{o.technician}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-600 line-clamp-1 mt-0.5">
                              {o.problem}
                            </p>
                            {o.devicePhotos && o.devicePhotos.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {o.devicePhotos.map((photo, pIdx) => (
                                  <div key={pIdx} className="w-6 h-6 rounded border border-zinc-200 overflow-hidden bg-zinc-100 shrink-0">
                                    <LazyImage
                                      src={photo}
                                      alt="Device Photo"
                                      className="w-full h-full object-cover"
                                      showPlaceholder={false}
                                    />
                                  </div>
                                ))}
                                <span className="text-[10px] text-zinc-400 font-medium">
                                  {o.devicePhotos.length} photo{o.devicePhotos.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Financials */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-zinc-950 font-mono text-xs tabular-nums">
                          {curr}{o.cost.toFixed(2)}
                        </div>
                        <div className="text-xs text-emerald-700 font-semibold font-mono tabular-nums">
                          Paid: {curr}{o.deposit.toFixed(2)}
                        </div>
                        <div className={`text-[11px] font-bold font-mono mt-0.5 tabular-nums flex items-center gap-1.5 ${balance > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
                          <span>{balance > 0 ? `Due: ${curr}${balance.toFixed(2)}` : 'Cleared ✓'}</span>
                          {balance > 0 && onClearBalance && (
                            <button
                              type="button"
                              onClick={() => onClearBalance(o.id)}
                              className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded border border-rose-200 font-semibold cursor-pointer transition-colors"
                              title="Settle Outstanding Due Balance"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <select
                          value={o.status}
                          onChange={(e) =>
                            onUpdateStatus(o.id, e.target.value as RepairOrder['status'])
                          }
                          className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:border-zinc-900 focus:outline-hidden transition-colors bg-white font-semibold text-zinc-800 cursor-pointer shadow-2xs"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>

                      {/* Receipt & Actions */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Receipt */}
                          <button
                            type="button"
                            onClick={() => handleTriggerReceipt(o)}
                            title="Print / View Receipt"
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleQuickWhatsApp(o)}
                            title="Send WhatsApp Update"
                            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Due Amount Reminder if balance > 0 */}
                          {balance > 0 && (
                            <button
                              type="button"
                              onClick={() => setDueReminderOrder(o)}
                              title={`Send Customer Due Amount Reminder (${curr}${balance.toFixed(2)})`}
                              className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors cursor-pointer"
                            >
                              <BellRing className="w-3.5 h-3.5 text-amber-600" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleTriggerEdit(o)}
                            title="Edit Ticket / Details"
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete with Confirmation (Owner Only - Staff has no delete access) */}
                          {userRole !== 'staff' && (
                            confirmDeleteId === o.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteOrder(o.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  title="Confirm Delete"
                                  className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  title="Cancel"
                                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(o.id)}
                                title="Delete Order (Owner Only)"
                                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View (Phones & small screens) */}
        <div className="md:hidden divide-y divide-zinc-100">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              <p className="font-semibold text-zinc-500">No orders found</p>
              <p className="mt-1">No orders match your filter criteria or search query.</p>
            </div>
          ) : (
            paginatedOrders.map((o) => {
              const balance = Math.max(0, o.cost - o.deposit);
              const devName = getOrderDeviceName(o);
              const resolvedCat = resolveOrderCategory(o);
              const isSale = resolvedCat === 'sale';
              const isOrder = resolvedCat === 'order';

              return (
                <div key={o.id} className="p-4 space-y-3 hover:bg-zinc-50/60 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-zinc-950 text-xs">{o.id}</span>
                      {isSale ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                          Sale
                        </span>
                      ) : isOrder ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Order
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Repair
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">{o.date}</span>
                  </div>

                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h4 className="font-bold text-zinc-900 text-sm leading-tight">{o.name}</h4>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{o.phone}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="text-xs font-semibold text-zinc-800">{devName}</span>
                      </div>
                      {o.problem && (
                        <p className="text-[11px] text-zinc-600 line-clamp-2 mt-0.5">{o.problem}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-zinc-950 text-sm tabular-nums">
                        {curr}{o.cost.toFixed(2)}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-700 font-semibold tabular-nums">
                        Paid: {curr}{o.deposit.toFixed(2)}
                      </div>
                      <div className={`text-[11px] font-mono font-bold mt-0.5 tabular-nums ${balance > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
                        {balance > 0 ? `Due: ${curr}${balance.toFixed(2)}` : 'Cleared ✓'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                    <select
                      value={o.status}
                      onChange={(e) => onUpdateStatus(o.id, e.target.value as RepairOrder['status'])}
                      className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white font-semibold text-zinc-800 shadow-2xs"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Delivered">Delivered</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      {balance > 0 && onClearBalance && (
                        <button
                          type="button"
                          onClick={() => onClearBalance(o.id)}
                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer"
                        >
                          Settle
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTriggerReceipt(o)}
                        className="p-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                        title="Receipt"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWhatsApp(o)}
                        className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 cursor-pointer"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      {/* Customer Due Amount Reminder button */}
                      {balance > 0 && (
                        <button
                          type="button"
                          onClick={() => setDueReminderOrder(o)}
                          className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 cursor-pointer"
                          title={`Send Due Reminder (${curr}${balance.toFixed(2)})`}
                        >
                          <BellRing className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTriggerEdit(o)}
                        className="p-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Snappy Pagination Controls Toolbar */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-600">
            <div className="flex items-center gap-3 flex-wrap">
              <span>
                Showing <strong className="font-semibold text-zinc-900 font-mono">{pageSize === 0 ? 1 : Math.min(filteredOrders.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
                <strong className="font-semibold text-zinc-900 font-mono">{pageSize === 0 ? filteredOrders.length : Math.min(filteredOrders.length, currentPage * pageSize)}</strong> of{' '}
                <strong className="font-semibold text-zinc-900 font-mono">{filteredOrders.length}</strong> entries
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 font-medium">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs font-semibold text-zinc-800 shadow-2xs cursor-pointer focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={0}>All</option>
                </select>
              </div>
            </div>

            {pageSize !== 0 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-3 py-1 text-xs font-mono font-semibold bg-white border border-zinc-200 rounded-md text-zinc-800 shadow-2xs">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Cloud API & Image Modal */}
      {whatsAppModalOrder && (
        <WhatsAppShareModal
          isOpen={Boolean(whatsAppModalOrder)}
          onClose={() => setWhatsAppModalOrder(null)}
          order={whatsAppModalOrder}
          profile={profile}
          onSaveProfile={onSaveProfile}
        />
      )}

      {/* Customer Due Amount Reminder Modal */}
      {dueReminderOrder && (
        <DueReminderModal
          isOpen={Boolean(dueReminderOrder)}
          onClose={() => setDueReminderOrder(null)}
          order={dueReminderOrder}
          profile={profile}
          onReminderSent={onReminderSent}
        />
      )}
    </div>
  );
};
