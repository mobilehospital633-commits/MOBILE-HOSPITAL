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
} from 'lucide-react';
import { RepairOrder, ShopProfile } from '../types';
import { getOrderDeviceName, getOrderModelNumber } from '../utils/orderUtils';

interface OrdersTabProps {
  orders: RepairOrder[];
  profile: ShopProfile;
  onUpdateStatus: (orderId: string, newStatus: RepairOrder['status']) => void;
  onClearBalance: (orderId: string) => void;
  onEditOrder: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onOpenReceipt: (orderId: string) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  profile,
  onUpdateStatus,
  onClearBalance,
  onEditOrder,
  onDeleteOrder,
  onOpenReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const curr = profile.currency || '₹';

  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const devName = (o.deviceName || '').toLowerCase();
    const modelNum = (o.modelNumber || '').toLowerCase();
    const matchesSearch =
      o.id.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.model.toLowerCase().includes(q) ||
      devName.includes(q) ||
      modelNum.includes(q) ||
      o.imei.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter !== 'All') {
      matchesStatus = o.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                Customer Repair Orders
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                {orders.length} Active Jobs
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Device diagnostic, technician workbench repairs, IMEI tracking & status updates
            </p>
          </div>
        </div>
      </div>

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
                <th className="py-3 px-5">Device Name & Model No.</th>
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
                  const devName = getOrderDeviceName(o);
                  const modelNo = getOrderModelNumber(o);

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-zinc-50/60 transition-colors"
                    >
                      {/* Ticket */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-900">{o.id}</span>
                        </div>
                        <span className="text-xs text-zinc-400 font-normal">{o.date}</span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-5">
                        <strong className="text-zinc-800 font-medium">{o.name}</strong>
                        <span className="block text-xs text-zinc-400">{o.phone}</span>
                      </td>

                      {/* Device & Model Number */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-zinc-900 font-semibold">{devName}</strong>
                          {modelNo && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200" title="Device Model Number">
                              {modelNo}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="text-xs text-zinc-500 font-mono font-medium">
                            IMEI: {o.imei || 'N/A'}
                          </span>
                          {o.technician && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                              <Wrench className="w-2.5 h-2.5 text-zinc-400" />
                              <span>{o.technician}</span>
                            </span>
                          )}
                        </div>
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

