import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  Users,
  MessageSquare,
  Wrench,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BellRing,
  AlertCircle,
  Download,
  Eye,
  Clock,
  X,
  Calendar,
  Receipt,
  ShoppingBag,
  Package,
} from 'lucide-react';
import { RepairOrder, ShopProfile } from '../types';
import { DueReminderModal } from './DueReminderModal';

interface CustomersTabProps {
  orders: RepairOrder[];
  profile: ShopProfile;
  onReminderSent?: (orderId: string, reminderMessage: string) => void;
  onOpenReceipt?: (orderId: string) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  orders,
  profile,
  onReminderSent,
  onOpenReceipt,
}) => {
  const curr = profile.currency || '₹';
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyDuesFilter, setOnlyDuesFilter] = useState(false);
  const deferredSearch = useDeferredValue(searchTerm);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [selectedDueOrder, setSelectedDueOrder] = useState<RepairOrder | null>(null);
  const [historyCustomerPhone, setHistoryCustomerPhone] = useState<string | null>(null);

  // Memoized customer aggregation with totalDue tracking
  const allCustomers = useMemo(() => {
    const customerMap: {
      [phone: string]: {
        name: string;
        phone: string;
        repairsCount: number;
        totalSpent: number;
        totalDue: number;
        latestDueOrder?: RepairOrder;
      };
    } = {};

    orders.forEach((o) => {
      const cleanPhone = o.phone || 'N/A';
      if (!customerMap[cleanPhone]) {
        customerMap[cleanPhone] = {
          name: o.name || 'Customer',
          phone: o.phone || '',
          repairsCount: 0,
          totalSpent: 0,
          totalDue: 0,
        };
      }
      customerMap[cleanPhone].repairsCount += 1;
      customerMap[cleanPhone].totalSpent += o.cost || 0;

      const due = Math.max(0, (o.cost || 0) - (o.deposit || 0));
      if (due > 0) {
        customerMap[cleanPhone].totalDue += due;
        if (!customerMap[cleanPhone].latestDueOrder || o.date >= customerMap[cleanPhone].latestDueOrder!.date) {
          customerMap[cleanPhone].latestDueOrder = o;
        }
      }
    });

    return Object.values(customerMap).sort((a, b) => {
      if (b.totalDue !== a.totalDue) return b.totalDue - a.totalDue;
      return b.totalSpent - a.totalSpent;
    });
  }, [orders]);

  const totalClientsWithDue = useMemo(() => {
    return allCustomers.filter((c) => c.totalDue > 0).length;
  }, [allCustomers]);

  const totalDueAmount = useMemo(() => {
    return allCustomers.reduce((acc, c) => acc + c.totalDue, 0);
  }, [allCustomers]);

  // Filtered by search and dues
  const filteredCustomers = useMemo(() => {
    let list = allCustomers;
    if (onlyDuesFilter) {
      list = list.filter((c) => c.totalDue > 0);
    }
    const q = deferredSearch.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [allCustomers, deferredSearch, onlyDuesFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / (pageSize === 0 ? (filteredCustomers.length || 1) : pageSize)));

  const paginatedCustomers = useMemo(() => {
    if (pageSize === 0) return filteredCustomers;
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const getWhatsAppUrl = (name: string, phone: string, repairs: number) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = `Hello ${name},
Greetings from *${(profile.shopName || 'Mobile Hospital').toUpperCase()}*! 📱
We appreciate your visits with us (${repairs} order(s)).
Please feel free to reach out if you need any warranty support, status update, or advice!
Thank you for trusting ${profile.shopName || 'Mobile Hospital'}!`;

    const encoded = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  };

  const handleExportCustomersCSV = () => {
    if (filteredCustomers.length === 0) return;
    const headers = ['Customer Name', 'Phone Number', 'Total Orders', 'Total Billed', 'Balance Due', 'Status'];
    const rows = filteredCustomers.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone.replace(/"/g, '""')}"`,
      c.repairsCount,
      c.totalSpent,
      c.totalDue,
      c.totalDue > 0 ? 'Pending Due' : 'All Cleared',
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MH_Customer_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const historyCustomerOrders = useMemo(() => {
    if (!historyCustomerPhone) return [];
    return orders.filter((o) => (o.phone || '') === historyCustomerPhone);
  }, [orders, historyCustomerPhone]);

  const selectedCustomerInfo = useMemo(() => {
    if (!historyCustomerPhone) return null;
    return allCustomers.find((c) => c.phone === historyCustomerPhone) || null;
  }, [allCustomers, historyCustomerPhone]);

  return (
    <div className="space-y-4">
      {/* Overview Banner if there are dues */}
      {totalClientsWithDue > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-950 block">
                {totalClientsWithDue} Client{totalClientsWithDue > 1 ? 's' : ''} with Outstanding Dues ({curr}{totalDueAmount.toFixed(2)})
              </span>
              <span className="text-[11px] text-amber-800">
                Send 1-click WhatsApp payment reminders with dynamic UPI QR codes directly from this list
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOnlyDuesFilter(!onlyDuesFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              onlyDuesFilter
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
            }`}
          >
            {onlyDuesFilter ? 'Show All Clients' : `Filter Pending Dues (${totalClientsWithDue})`}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-900" />
              <span>Customer Directory & History</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Client history, repair count, total spent, and due payment reminders
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-zinc-200 focus:outline-hidden focus:border-zinc-900 bg-zinc-50/50 text-zinc-900"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleExportCustomersCSV}
              disabled={filteredCustomers.length === 0}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download customer directory as CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export CSV</span>
            </button>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 shrink-0">
              {filteredCustomers.length} Clients
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="py-3 px-5">Customer Name</th>
                <th className="py-3 px-5">Phone Number</th>
                <th className="py-3 px-5">Repair Orders</th>
                <th className="py-3 px-5">Total Billed</th>
                <th className="py-3 px-5">Balance Due</th>
                <th className="py-3 px-5 text-center">Actions & Reminders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                    No customer records found.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => (
                  <tr key={c.phone || c.name} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-zinc-900">{c.name}</td>
                    <td className="py-3.5 px-5 text-zinc-500 font-mono text-xs tabular-nums">{c.phone || 'N/A'}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-800 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-xs">
                        <Wrench className="w-3 h-3 text-zinc-500" />
                        <span className="font-mono tabular-nums">{c.repairsCount}</span>
                        <span>Order{c.repairsCount !== 1 ? 's' : ''}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-zinc-900 text-xs tabular-nums">
                      {curr}{c.totalSpent.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5">
                      {c.totalDue > 0 ? (
                        <div>
                          <span className="font-mono font-bold text-rose-600 text-xs tabular-nums block">
                            {curr}{c.totalDue.toFixed(2)}
                          </span>
                          <span className="text-[11px] font-medium text-rose-600/90 block">
                            Pending balance
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                          Settled ✓
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Due Amount Reminder Button */}
                        {c.totalDue > 0 && c.latestDueOrder && (
                          <button
                            type="button"
                            onClick={() => setSelectedDueOrder(c.latestDueOrder!)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer active:scale-98"
                            title={`Send Customer Due Amount Reminder (${curr}${c.totalDue.toFixed(2)})`}
                          >
                            <BellRing className="w-3.5 h-3.5 text-amber-600" />
                            <span>Remind Due</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setHistoryCustomerPhone(c.phone)}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="View Complete Service History & Past Orders"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>History ({c.repairsCount})</span>
                        </button>

                        <a
                          href={getWhatsAppUrl(c.name, c.phone, c.repairsCount)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-zinc-300" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {filteredCustomers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-zinc-100 text-xs text-zinc-600">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong className="font-semibold text-zinc-900 font-mono">{pageSize === 0 ? 1 : Math.min(filteredCustomers.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
                <strong className="font-semibold text-zinc-900 font-mono">{pageSize === 0 ? filteredCustomers.length : Math.min(filteredCustomers.length, currentPage * pageSize)}</strong> of{' '}
                <strong className="font-semibold text-zinc-900 font-mono">{filteredCustomers.length}</strong> clients
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 font-medium">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-zinc-200 rounded-md px-2 py-0.5 text-xs font-semibold text-zinc-800 shadow-2xs cursor-pointer focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={0}>All</option>
                </select>
              </div>
            </div>

            {pageSize !== 0 && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-white border border-zinc-200 rounded-md text-zinc-800 shadow-2xs">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-700 transition-colors cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Due Amount Reminder Modal */}
      {selectedDueOrder && (
        <DueReminderModal
          isOpen={Boolean(selectedDueOrder)}
          onClose={() => setSelectedDueOrder(null)}
          order={selectedDueOrder}
          profile={profile}
          onReminderSent={onReminderSent}
        />
      )}

      {/* Customer Complete Service History & Timeline Modal */}
      {historyCustomerPhone && selectedCustomerInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 flex items-start justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                    <span>{selectedCustomerInfo.name}</span>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
                      {selectedCustomerInfo.phone}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Complete service history, advance bookings, counter purchases, and billing records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryCustomerPhone(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-zinc-100/70 border-b border-zinc-200 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Orders</span>
                <span className="font-bold text-zinc-900 font-mono text-sm">{historyCustomerOrders.length}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Spent</span>
                <span className="font-bold text-zinc-900 font-mono text-sm">{curr}{selectedCustomerInfo.totalSpent.toFixed(2)}</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${selectedCustomerInfo.totalDue > 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-white border-zinc-200/80 text-zinc-900'}`}>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Due Balance</span>
                <span className="font-bold font-mono text-sm">{curr}{selectedCustomerInfo.totalDue.toFixed(2)}</span>
              </div>
            </div>

            {/* Orders Timeline List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {historyCustomerOrders.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  No order history records found for this phone number.
                </div>
              ) : (
                historyCustomerOrders.map((o) => {
                  const total = o.totalAmount ?? o.cost ?? 0;
                  const adv = o.advancePaid ?? o.deposit ?? 0;
                  const due = Math.max(0, total - adv);
                  const isSale = o.orderType === 'sale' || o.id.startsWith('SL-');
                  const isAdvanceOrder = o.orderType === 'order' || o.id.startsWith('ORD-');

                  return (
                    <div
                      key={o.id}
                      className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-zinc-900">{o.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSale
                                ? 'bg-violet-100 text-violet-800'
                                : isAdvanceOrder
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isSale ? 'Counter Sale' : isAdvanceOrder ? 'Customer Order' : 'Service Repair'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.status === 'Completed' || o.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span>{o.date}</span>
                        </div>
                      </div>

                      <div className="text-xs text-zinc-800 font-medium">
                        <strong>Item / Device:</strong> {o.deviceName || o.model || 'Standard Device'}
                        {o.imei && o.imei !== 'N/A (Product Sale)' && (
                          <span className="text-zinc-500 font-mono text-[11px] ml-2">IMEI: {o.imei}</span>
                        )}
                      </div>

                      {o.problem && (
                        <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                          {o.problem}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 flex-wrap gap-2">
                        <div className="flex items-center gap-3 font-mono">
                          <span>Total: <strong>{curr}{total.toFixed(2)}</strong></span>
                          <span>Paid: <strong className="text-emerald-700">{curr}{adv.toFixed(2)}</strong></span>
                          {due > 0 && (
                            <span className="text-rose-600 font-bold">Due: {curr}{due.toFixed(2)}</span>
                          )}
                        </div>

                        {onOpenReceipt && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenReceipt(o.id);
                              setHistoryCustomerPhone(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>View Bill</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Found {historyCustomerOrders.length} records for {selectedCustomerInfo.name}
              </span>
              <button
                type="button"
                onClick={() => setHistoryCustomerPhone(null)}
                className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
