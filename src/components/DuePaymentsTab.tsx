import React, { useState, useMemo } from 'react';
import {
  Search,
  Receipt,
  MessageCircle,
  Phone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  DollarSign,
  Users,
  Filter,
  ArrowUpDown,
  Printer,
  CreditCard,
  Building2,
  Banknote,
  Smartphone,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { RepairOrder, ShopProfile } from '../types';
import { getOrderDeviceName, getOrderModelNumber } from '../utils/orderUtils';
import { generateQrCodeDataUrl, getBillingQrPayload } from '../utils/qr';

interface DuePaymentsTabProps {
  orders: RepairOrder[];
  profile: ShopProfile;
  onClearBalance: (orderId: string) => void;
  onCollectPayment: (
    orderId: string,
    amount: number,
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer',
    notes?: string
  ) => void;
  onOpenReceipt: (orderId: string) => void;
  onNavigateToOrders?: () => void;
}

export const DuePaymentsTab: React.FC<DuePaymentsTabProps> = ({
  orders,
  profile,
  onClearBalance,
  onCollectPayment,
  onOpenReceipt,
  onNavigateToOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'delivered'>('all');
  const [sortBy, setSortBy] = useState<'due-desc' | 'due-asc' | 'date-desc' | 'date-asc' | 'name'>('due-desc');

  // Modal states
  const [collectingOrder, setCollectingOrder] = useState<RepairOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('Cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // QR Modal
  const [qrModalOrder, setQrModalOrder] = useState<RepairOrder | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLabel, setQrLabel] = useState<string>('');

  // Copied alert
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const curr = profile.currency || '₹';

  // Extract all orders with outstanding balance
  const dueOrders = useMemo(() => {
    return orders.filter((o) => {
      const balance = (o.cost || 0) - (o.deposit || 0);
      return balance > 0;
    });
  }, [orders]);

  // Aggregate financial metrics
  const totalOutstandingDue = useMemo(() => {
    return dueOrders.reduce((acc, o) => acc + Math.max(0, o.cost - o.deposit), 0);
  }, [dueOrders]);

  const totalBilledForDueJobs = useMemo(() => {
    return dueOrders.reduce((acc, o) => acc + (o.cost || 0), 0);
  }, [dueOrders]);

  const totalAdvanceCollected = useMemo(() => {
    return dueOrders.reduce((acc, o) => acc + (o.deposit || 0), 0);
  }, [dueOrders]);

  const fullyPaidOrdersCount = useMemo(() => {
    return orders.filter((o) => Math.max(0, o.cost - o.deposit) <= 0).length;
  }, [orders]);

  // Filter and sort due orders
  const filteredDues = useMemo(() => {
    return dueOrders
      .filter((o) => {
        const q = searchTerm.toLowerCase().trim();
        const devName = (o.deviceName || '').toLowerCase();
        const modelNum = (o.modelNumber || '').toLowerCase();
        const matchesSearch =
          !q ||
          o.id.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.model.toLowerCase().includes(q) ||
          devName.includes(q) ||
          modelNum.includes(q) ||
          o.imei.toLowerCase().includes(q);

        let matchesStatus = true;
        if (statusFilter === 'pending') {
          matchesStatus = o.status === 'Pending' || o.status === 'In Progress';
        } else if (statusFilter === 'completed') {
          matchesStatus = o.status === 'Completed';
        } else if (statusFilter === 'delivered') {
          matchesStatus = o.status === 'Delivered';
        }

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const balA = a.cost - a.deposit;
        const balB = b.cost - b.deposit;
        if (sortBy === 'due-desc') return balB - balA;
        if (sortBy === 'due-asc') return balA - balB;
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [dueOrders, searchTerm, statusFilter, sortBy]);

  // Open Collect Payment Modal
  const handleOpenCollect = (order: RepairOrder) => {
    const due = Math.max(0, order.cost - order.deposit);
    setCollectingOrder(order);
    setPaymentAmount(due.toString());
    setPaymentMethod(profile.includeBillingQr ? 'UPI' : 'Cash');
    setPaymentNotes(`Settlement of due balance for ${order.id}`);
  };

  // Submit collected payment
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingOrder) return;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    onCollectPayment(collectingOrder.id, amountNum, paymentMethod, paymentNotes);
    setCollectingOrder(null);
  };

  // Open QR modal for quick scan
  const handleOpenQrModal = async (order: RepairOrder) => {
    setQrModalOrder(order);
    const { text, label } = getBillingQrPayload(order, profile);
    setQrLabel(label);
    const url = await generateQrCodeDataUrl(text, { width: 260 });
    setQrDataUrl(url);
  };

  // Generate polite WhatsApp Reminder
  const handleSendWhatsAppReminder = (order: RepairOrder) => {
    const balance = Math.max(0, order.cost - order.deposit);
    const shopName = profile.shopName || 'Mobile Hospital';
    const upiInfo = profile.upi ? `\n💳 Pay via UPI: ${profile.upi}` : '';
    const phoneClean = order.phone.replace(/[^0-9]/g, '');

    const devName = getOrderDeviceName(order);
    const modelNo = getOrderModelNumber(order);
    const deviceDisplay = modelNo ? `${devName} (Model: ${modelNo})` : devName;

    const message = `Hello ${order.name} Ji,\n\nThis is a polite reminder from *${shopName}* regarding your device repair:\n\n📱 *Device:* ${deviceDisplay}\n🔖 *Ticket ID:* ${order.id}\n💰 *Total Bill:* ${curr}${order.cost.toFixed(2)}\n✅ *Advance Paid:* ${curr}${order.deposit.toFixed(2)}\n⚠️ *Pending Balance Due:* ${curr}${balance.toFixed(2)}${upiInfo}\n\nPlease settle this balance at your earliest convenience. Thank you for choosing ${shopName}!`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phoneClean}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                  Customer Due Payments
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Track pending balances, send WhatsApp payment reminders, and record collections
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500" />
              <span>Print Due Sheet</span>
            </button>
            {onNavigateToOrders && (
              <button
                type="button"
                onClick={onNavigateToOrders}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View All Repairs</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-zinc-100">
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Total Outstanding Due
              </span>
              <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                {curr}
              </span>
            </div>
            <div className="text-2xl font-black text-rose-900 mt-2 tracking-tight">
              {curr}{totalOutstandingDue.toFixed(2)}
            </div>
            <p className="text-[11px] text-rose-700 font-medium mt-1">
              Across {dueOrders.length} customer repair {dueOrders.length === 1 ? 'ticket' : 'tickets'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Pending Customers
              </span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">
              {dueOrders.length}
            </div>
            <p className="text-[11px] text-zinc-500 font-medium mt-1">
              {dueOrders.length > 0
                ? `Avg ${curr}${(totalOutstandingDue / dueOrders.length).toFixed(0)} due / customer`
                : 'Zero outstanding dues'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Advance Collected
              </span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-2 tracking-tight">
              {curr}{totalAdvanceCollected.toFixed(2)}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Total billed: {curr}{totalBilledForDueJobs.toFixed(2)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Fully Cleared Jobs
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">
              {fullyPaidOrdersCount}
            </div>
            <p className="text-[11px] text-zinc-500 font-medium mt-1">
              100% payment received
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, ticket ID, model, or IMEI..."
            className="w-full pl-9 pr-3.5 py-2 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors placeholder:text-zinc-400 text-zinc-900"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All Dues ({dueOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              In Workshop
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Ready for Delivery
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('delivered')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'delivered'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Delivered (Credit)
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-zinc-900 focus:outline-none transition-colors bg-white text-zinc-800 cursor-pointer"
            >
              <option value="due-desc">Highest Due First</option>
              <option value="due-asc">Lowest Due First</option>
              <option value="date-desc">Newest Orders First</option>
              <option value="date-asc">Oldest Orders (Overdue)</option>
              <option value="name">Customer Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Due Payments List / Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        {filteredDues.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              {dueOrders.length === 0 ? 'No Pending Customer Dues!' : 'No Matching Records'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              {dueOrders.length === 0
                ? 'All customer repair jobs are fully paid. There are currently no outstanding balances in the system.'
                : 'No pending due payments match your current search query or filter selection.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="py-3 px-5">Customer Details</th>
                  <th className="py-3 px-5">Device & Ticket</th>
                  <th className="py-3 px-5">Repair Status</th>
                  <th className="py-3 px-5">Total Bill</th>
                  <th className="py-3 px-5">Advance Paid</th>
                  <th className="py-3 px-5">Balance Due</th>
                  <th className="py-3 px-5 text-center">Collect & Remind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredDues.map((order) => {
                  const balance = Math.max(0, order.cost - order.deposit);
                  const isDeliveredWithDue = order.status === 'Delivered';
                  const isReady = order.status === 'Completed';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50/70 transition-colors group"
                    >
                      {/* Customer info */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-zinc-900 text-sm">{order.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                          <span className="font-mono">{order.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(order.phone, order.id)}
                            className="text-[10px] text-zinc-400 hover:text-zinc-700 font-medium cursor-pointer"
                            title="Copy phone number"
                          >
                            {copiedId === order.id ? (
                              <span className="text-emerald-600 font-bold">Copied!</span>
                            ) : (
                              'Copy'
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Device & Ticket */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-zinc-800">{getOrderDeviceName(order)}</span>
                          {getOrderModelNumber(order) && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                              {getOrderModelNumber(order)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-400">
                          <span className="font-mono font-medium text-zinc-600">{order.id}</span>
                          <span>•</span>
                          <span>{order.date}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate max-w-[170px]">
                          IMEI: {order.imei || 'N/A'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                            order.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : order.status === 'Delivered'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {order.status}
                        </span>
                        {isDeliveredWithDue && (
                          <span className="block text-[10px] text-purple-700 font-bold mt-1">
                            Credit Handover
                          </span>
                        )}
                        {isReady && (
                          <span className="block text-[10px] text-emerald-700 font-bold mt-1">
                            Ready for Pickup
                          </span>
                        )}
                      </td>

                      {/* Total Cost */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-zinc-900">
                          {curr}{order.cost.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-zinc-400">Total charge</div>
                      </td>

                      {/* Advance Paid */}
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-emerald-700">
                          {curr}{order.deposit.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {order.deposit > 0 ? 'Received' : 'No advance'}
                        </div>
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-5">
                        <div className="text-sm font-black text-rose-600">
                          {curr}{balance.toFixed(2)}
                        </div>
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 mt-0.5 uppercase tracking-wide">
                          UNPAID
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Collect Payment Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenCollect(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer active:scale-98"
                            title="Collect balance payment and record in Accounts"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>

                          {/* WhatsApp Reminder Button */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppReminder(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Send payment reminder to customer on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Remind</span>
                          </button>

                          {/* Quick UPI QR scan button */}
                          <button
                            type="button"
                            onClick={() => handleOpenQrModal(order)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                            title="Display UPI payment QR code for this balance"
                          >
                            <QrCode className="w-4 h-4 text-zinc-700" />
                          </button>

                          {/* View Receipt */}
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(order.id)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                            title="View or Print customer receipt"
                          >
                            <Receipt className="w-4 h-4 text-zinc-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: COLLECT PAYMENT DIALOG */}
      {collectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    Collect Due Payment
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Ticket #{collectingOrder.id} • {collectingOrder.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCollectingOrder(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmPayment} className="p-5 space-y-4">
              {/* Order Info Card */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-zinc-900">{getOrderDeviceName(collectingOrder)}</span>
                    {getOrderModelNumber(collectingOrder) && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-200 text-zinc-700">
                        {getOrderModelNumber(collectingOrder)}
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-500 mt-0.5">Phone: {collectingOrder.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-500">Current Balance Due:</div>
                  <div className="text-base font-black text-rose-600">
                    {curr}{Math.max(0, collectingOrder.cost - collectingOrder.deposit).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Amount to collect */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Amount Received ({curr})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold text-sm">
                    {curr}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={Math.max(0, collectingOrder.cost - collectingOrder.deposit)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 text-base font-bold border border-zinc-300 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none text-zinc-900"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fullDue = Math.max(0, collectingOrder.cost - collectingOrder.deposit);
                      setPaymentAmount(fullDue.toString());
                    }}
                    className="px-2.5 py-1 text-xs rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition-colors cursor-pointer"
                  >
                    Full Balance ({curr}{Math.max(0, collectingOrder.cost - collectingOrder.deposit).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const fullDue = Math.max(0, collectingOrder.cost - collectingOrder.deposit);
                      setPaymentAmount((fullDue / 2).toFixed(2));
                    }}
                    className="px-2.5 py-1 text-xs rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition-colors cursor-pointer"
                  >
                    50% Partial
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Cash', 'UPI', 'Card', 'Bank Transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                        paymentMethod === m
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-2xs'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Receipt / Ledger Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via GPay / Handed cash over counter"
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setCollectingOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPI PAYMENT QR CODE */}
      {qrModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-sm w-full overflow-hidden text-center p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-zinc-900" />
                <h3 className="font-bold text-zinc-900 text-sm">Customer Payment QR</h3>
              </div>
              <button
                onClick={() => setQrModalOrder(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-xs font-bold text-zinc-800">{qrModalOrder.name}</p>
              <p className="text-[11px] text-zinc-500">
                Ticket #{qrModalOrder.id} • {getOrderDeviceName(qrModalOrder)}
                {getOrderModelNumber(qrModalOrder) ? ` (${getOrderModelNumber(qrModalOrder)})` : ''}
              </p>
              <div className="text-lg font-black text-rose-600 mt-1">
                Due: {curr}{Math.max(0, qrModalOrder.cost - qrModalOrder.deposit).toFixed(2)}
              </div>
            </div>

            {/* QR Image */}
            <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs inline-block">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="UPI Payment QR"
                  className="w-56 h-56 mx-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-zinc-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="text-[11px] text-zinc-500">
              {profile.upi ? (
                <span>
                  Scan with any UPI App (GPay, PhonePe, Paytm) to pay{' '}
                  <strong className="text-zinc-800">{profile.upi}</strong>
                </span>
              ) : (
                <span>Customer billing barcode ready for checkout scan</span>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleOpenCollect(qrModalOrder);
                  setQrModalOrder(null);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Received Payment
              </button>
              <button
                type="button"
                onClick={() => setQrModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
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
