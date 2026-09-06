import React from 'react';
import {
  Smartphone,
  Clock,
  CheckCircle2,
  IndianRupee,
  ArrowRight,
  Receipt,
  QrCode,
  AlertCircle,
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Cloud,
  CloudUpload,
  Lock,
} from 'lucide-react';
import { AccountTransaction, RepairOrder, ShopProfile, TabType } from '../types';

interface DashboardTabProps {
  orders: RepairOrder[];
  transactions?: AccountTransaction[];
  profile: ShopProfile;
  onNavigate: (tab: TabType) => void;
  onOpenReceipt: (orderId: string) => void;
  onToggleHideTotalBilled?: () => void;
  onOpenCloudBackup?: () => void;
  onOpenDeviceLock?: (order?: RepairOrder) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  transactions = [],
  profile,
  onNavigate,
  onOpenReceipt,
  onToggleHideTotalBilled,
  onOpenCloudBackup,
  onOpenDeviceLock,
}) => {
  const curr = profile.currency || '₹';
  const totalJobs = orders.length;

  const inProgressJobs = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'In Progress'
  ).length;
  const completedJobs = orders.filter(
    (o) => o.status === 'Completed' || o.status === 'Delivered'
  ).length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.cost || 0), 0);
  const totalDue = orders.reduce(
    (sum, o) => sum + Math.max(0, (o.cost || 0) - (o.deposit || 0)),
    0
  );

  const lockedOrders = orders.filter((o) => o.isDeviceLocked);
  const totalLockedDue = lockedOrders.reduce((sum, o) => sum + Math.max(0, o.cost - o.deposit), 0);

  // Financial Accounts aggregation
  const accIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const accExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const accNetProfit = accIncome - accExpense;

  const recentOrders = orders.slice(0, 6);

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
      {/* Top Banner highlighting Customer Billing QR */}
      <div className="bg-zinc-900 rounded-xl p-5 sm:p-6 text-white border border-zinc-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300">
            <QrCode className="w-3.5 h-3.5 text-zinc-300" />
            <span>Customer Billing QR Enabled</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Customer Receipts with Dynamic Billing QR</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every customer receipt automatically features a billing QR code pre-filled with the remaining balance. Customers can scan directly to pay via UPI or banking apps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('new-order')}
            className="bg-white text-zinc-900 hover:bg-zinc-100 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs active:scale-98 cursor-pointer"
          >
            Create New Order
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border border-zinc-700 active:scale-98 cursor-pointer"
          >
            QR & Settings
          </button>
        </div>
      </div>

      {/* Locked Devices Payment Recovery Alert Banner */}
      {lockedOrders.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-950 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2 flex-wrap text-rose-950">
                <span>{lockedOrders.length} Mobile Device{lockedOrders.length > 1 ? 's' : ''} Locked for Unpaid Balance</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase tracking-wide">
                  Total Due: {curr}{totalLockedDue.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5">
                Devices are held under IMEI lock security codes until customers settle outstanding repair charges.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onOpenDeviceLock?.(lockedOrders[0])}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Manage IMEI Locks</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs transition-colors flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Jobs</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1 tracking-tight">{totalJobs}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs transition-colors flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">In Progress</p>
            <p className="text-2xl font-bold text-amber-700 mt-1 tracking-tight">{inProgressJobs}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs transition-colors flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Completed</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1 tracking-tight">{completedJobs}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs transition-colors flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Billed</p>
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
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200 uppercase tracking-wider">
                    Hidden
                  </span>
                </div>
                {onToggleHideTotalBilled ? (
                  <button
                    type="button"
                    onClick={onToggleHideTotalBilled}
                    className="text-[10px] text-zinc-400 hover:text-zinc-600 font-medium mt-0.5 cursor-pointer underline text-left block"
                  >
                    Click to show amount
                  </button>
                ) : (
                  <p className="text-[10px] text-zinc-400 mt-0.5">Hidden in settings</p>
                )}
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-zinc-900 mt-1 tracking-tight">
                  {curr}{totalRevenue.toFixed(2)}
                </p>
                {totalDue > 0 && (
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                    Due: {curr}{totalDue.toFixed(2)}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Income & Expense Account Snapshot */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">Income & Expense Account</h3>
              {profile.hideTotalBilled ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-500 border-zinc-200 font-mono">
                  •••••• Net Profit
                </span>
              ) : (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    accNetProfit >= 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {accNetProfit >= 0 ? '+' : ''}{curr}{accNetProfit.toFixed(2)} Net Profit
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {profile.hideTotalBilled
                ? 'Live Cashbook: Financial totals masked for counter privacy'
                : `Live Cashbook: Total Income ${curr}${accIncome.toFixed(2)} • Total Expenses ${curr}${accExpense.toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigate('accounts')}
            className="w-full md:w-auto bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
          >
            <span>Manage Accounts</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Cloud Data Protection Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs border border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>Google Drive Cloud Backup</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold border border-emerald-500/30">
                Free
              </span>
            </div>
            <div className="text-[11px] text-zinc-300 mt-0.5">
              Safely backup all {totalJobs} repair tickets, parts inventory & income accounts to your Google Drive.
            </div>
          </div>
        </div>
        {onOpenCloudBackup && (
          <button
            type="button"
            onClick={onOpenCloudBackup}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold transition-all flex items-center gap-1.5 self-end sm:self-auto cursor-pointer shrink-0 shadow-xs active:scale-98"
          >
            <CloudUpload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manage Cloud Backup</span>
          </button>
        )}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Recent Repair Orders</h2>
            <p className="text-xs text-zinc-500">Preview receipts with customer billing QR codes</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-medium text-zinc-900 hover:text-zinc-600 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
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
                  <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs">
                    No repair orders recorded yet. Click "Create New Order" to start.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const bal = Math.max(0, o.cost - o.deposit);
                  return (
                    <tr key={o.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-5 font-semibold text-zinc-900">
                        {o.id}
                        <span className="block text-[11px] text-zinc-400 font-normal">{o.date}</span>
                      </td>
                      <td className="py-3 px-5 font-medium text-zinc-800">
                        {o.name}
                        <span className="block text-[11px] text-zinc-400">{o.phone}</span>
                      </td>
                      <td className="py-3 px-5 text-zinc-700">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-zinc-800">{o.model}</span>
                          {o.isDeviceLocked && (
                            <button
                              type="button"
                              onClick={() => onOpenDeviceLock?.(o)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-600 text-white shadow-2xs hover:bg-rose-700 cursor-pointer"
                              title="Device locked for unpaid amount. Click to manage."
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>LOCKED</span>
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono block">IMEI: {o.imei}</span>
                      </td>
                      <td className="py-3 px-5 text-zinc-500 max-w-[180px] truncate">{o.problem}</td>
                      <td className="py-3 px-5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadge(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="font-semibold text-zinc-900">{curr}{o.cost.toFixed(2)}</div>
                        <div className={`text-[11px] font-medium ${bal > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {bal > 0 ? `Due: ${curr}${bal.toFixed(2)}` : 'Paid'}
                        </div>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <button
                          onClick={() => onOpenReceipt(o.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs transition-colors cursor-pointer border border-zinc-200"
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
