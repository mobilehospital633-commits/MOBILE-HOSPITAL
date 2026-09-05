import React, { useState } from 'react';
import {
  Search,
  Receipt,
  Edit3,
  Trash2,
  CheckCircle2,
  QrCode,
  Filter,
  Wrench,
  Lock,
  Unlock,
  ShieldAlert,
} from 'lucide-react';
import { RepairOrder, ShopProfile, StolenDeviceRecord } from '../types';
import { cleanImei } from '../utils/imei';

interface OrdersTabProps {
  orders: RepairOrder[];
  profile: ShopProfile;
  onUpdateStatus: (orderId: string, newStatus: RepairOrder['status']) => void;
  onClearBalance: (orderId: string) => void;
  onEditOrder: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onOpenReceipt: (orderId: string) => void;
  onOpenDeviceLock: (order: RepairOrder) => void;
  stolenRegistry?: StolenDeviceRecord[];
  onOpenStolenFinder?: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  profile,
  onUpdateStatus,
  onClearBalance,
  onEditOrder,
  onDeleteOrder,
  onOpenReceipt,
  onOpenDeviceLock,
  stolenRegistry = [],
  onOpenStolenFinder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const curr = profile.currency || '₹';
  const lockedCount = orders.filter((o) => o.isDeviceLocked).length;

  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      o.id.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.model.toLowerCase().includes(q) ||
      o.imei.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter === 'Locked') {
      matchesStatus = !!o.isDeviceLocked;
    } else if (statusFilter !== 'All') {
      matchesStatus = o.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Ticket ID, Customer, Phone, Device Model, or IMEI..."
            className="w-full pl-9 pr-3.5 py-2 text-sm border border-zinc-200 rounded-lg focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors placeholder:text-zinc-400 text-zinc-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Quick Stolen Radar button */}
          {onOpenStolenFinder && (
            <button
              type="button"
              onClick={onOpenStolenFinder}
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Open Stolen Phone Finder & IMEI Radar"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Stolen Finder</span>
            </button>
          )}

          {/* Quick IMEI Lock Manager Tool Button */}
          <button
            type="button"
            onClick={() => {
              // Open modal with first locked order or first order with unpaid balance or first order
              const target = orders.find((o) => o.isDeviceLocked) || orders.find((o) => o.cost > o.deposit) || orders[0];
              if (target) onOpenDeviceLock(target);
            }}
            className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Open IMEI Device Lock & Payment Recovery Manager"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>IMEI Lock Tool</span>
            {lockedCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {lockedCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:border-zinc-900 focus:outline-none transition-colors bg-white text-zinc-800 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
              <option value="Locked">🔒 Locked Devices ({lockedCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="py-3 px-5">Job Ticket</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Device & IMEI</th>
                <th className="py-3 px-5">Cost & Deposit</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-center">Receipt & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 text-xs">
                    No repair orders match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const balance = Math.max(0, o.cost - o.deposit);
                  const isLocked = !!o.isDeviceLocked;
                  const cleanOImei = cleanImei(o.imei);
                  const stolenAlert = stolenRegistry.find((r) => {
                    const p1 = cleanImei(r.imei);
                    const p2 = cleanImei(r.imei2 || '');
                    return cleanOImei && ((p1 && p1 === cleanOImei) || (p2 && p2 === cleanOImei));
                  });

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-zinc-50/60 transition-colors ${
                        stolenAlert ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Ticket */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-900">{o.id}</span>
                          {stolenAlert && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                              STOLEN!
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 font-normal">{o.date}</span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-5">
                        <strong className="text-zinc-800 font-medium">{o.name}</strong>
                        <span className="block text-xs text-zinc-400">{o.phone}</span>
                      </td>

                      {/* Device & IMEI */}
                      <td className="py-3.5 px-5">
                        <strong className="text-zinc-800 font-medium">{o.model}</strong>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-xs text-zinc-500 font-mono font-medium">
                            IMEI: {o.imei}
                          </span>
                          {stolenAlert && (
                            <button
                              type="button"
                              onClick={() => onOpenStolenFinder?.()}
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-600 hover:bg-rose-700 text-white shadow-2xs animate-pulse transition-colors cursor-pointer"
                              title={`STOLEN IMEI MATCH! FIR #${stolenAlert.policeFirNumber} (${stolenAlert.policeStation}). Owner: ${stolenAlert.ownerName}. Click to open Stolen Phone Finder.`}
                            >
                              <ShieldAlert className="w-2.5 h-2.5" />
                              <span>STOLEN MATCH</span>
                            </button>
                          )}
                          {isLocked ? (
                            <button
                              type="button"
                              onClick={() => onOpenDeviceLock(o)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-600 text-white shadow-2xs hover:bg-rose-700 transition-colors cursor-pointer"
                              title={`Device locked for unpaid balance of ${curr}${balance.toFixed(2)}. Click to view or unlock.`}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>LOCKED</span>
                            </button>
                          ) : balance > 0 ? (
                            <span className="text-[10px] text-zinc-400 font-normal">
                              (Unlocked)
                            </span>
                          ) : null}
                        </div>
                        {o.technician && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium mt-0.5">
                            <Wrench className="w-2.5 h-2.5 text-zinc-400" />
                            <span>{o.technician}</span>
                          </span>
                        )}
                      </td>

                      {/* Financials */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-zinc-900">
                          {curr}{o.cost.toFixed(2)}
                        </div>
                        <div className="text-xs text-emerald-700 font-medium">
                          Dep: {curr}{o.deposit.toFixed(2)}
                        </div>
                        <div className={`text-[11px] font-medium mt-0.5 ${balance > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
                          {balance > 0 ? `Due: ${curr}${balance.toFixed(2)}` : 'Cleared'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <select
                          value={o.status}
                          onChange={(e) =>
                            onUpdateStatus(o.id, e.target.value as RepairOrder['status'])
                          }
                          className="text-xs border border-zinc-200 rounded-md px-2 py-1 focus:border-zinc-900 focus:outline-none transition-colors bg-white font-medium text-zinc-800 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Device Lock / Unlock button */}
                          {isLocked ? (
                            <button
                              type="button"
                              onClick={() => onOpenDeviceLock(o)}
                              title="Device is locked! Click to unlock or collect payment"
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs active:scale-98"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Unlock</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenDeviceLock(o)}
                              title={balance > 0 ? `Lock mobile using IMEI for unpaid balance (${curr}${balance.toFixed(2)})` : 'Manage device lock status via IMEI'}
                              className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
                                balance > 0
                                  ? 'text-rose-700 border-rose-200 bg-rose-50/50 hover:bg-rose-100'
                                  : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-800'
                              }`}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>{balance > 0 ? 'Lock Mobile' : 'Lock'}</span>
                            </button>
                          )}

                          {balance > 0 && (
                            <button
                              onClick={() => onClearBalance(o.id)}
                              title="Mark balance paid"
                              className="text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-zinc-200"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                              <span className="hidden xl:inline">Clear Due</span>
                            </button>
                          )}

                          <button
                            onClick={() => onOpenReceipt(o.id)}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Open Customer Receipt with Billing QR"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>

                          <button
                            onClick={() => onEditOrder(o.id)}
                            className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                            title="Edit Order Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteOrder(o.id)}
                            className="text-zinc-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                            title="Delete Order"
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
      </div>
    </div>
  );
};

