import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
  Send,
  Printer,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Phone,
  Search,
  KeyRound,
  FileText,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  WifiOff,
  Cpu,
  ShieldCheck,
  PlusCircle,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { RepairOrder, ShopProfile } from '../types';
import { cleanImei, validateLuhn, decodeTac, formatImeiDisplay } from '../utils/imei';

interface DeviceLockTabProps {
  orders: RepairOrder[];
  profile: ShopProfile;
  onLockDevice: (orderId: string, reason: string, unlockCode: string, notes?: string) => void;
  onUnlockDevice: (orderId: string, collectPayment?: boolean) => void;
  onAddNewOrderWithLock?: (newOrder: RepairOrder) => void;
  onOpenReceipt?: (orderId: string) => void;
}

export const DeviceLockTab: React.FC<DeviceLockTabProps> = ({
  orders,
  profile,
  onLockDevice,
  onUnlockDevice,
  onAddNewOrderWithLock,
  onOpenReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'locked-list' | 'quick-lock' | 'simulator' | 'solutions' | 'slips'>('locked-list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(() => {
    return orders.find((o) => o.isDeviceLocked) || orders.find((o) => o.cost > o.deposit) || orders[0] || null;
  });

  // Quick Lock Form States
  const [targetType, setTargetType] = useState<'existing' | 'custom'>('existing');
  const [customImei, setCustomImei] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customBalance, setCustomBalance] = useState('');
  const [customReason, setCustomReason] = useState('Unpaid repair service balance');
  const [customUnlockPin, setCustomUnlockPin] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [customNotes, setCustomNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Simulator PIN Verification
  const [simPin, setSimPin] = useState('');
  const [simResult, setSimResult] = useState<'success' | 'failed' | 'bypass' | null>(null);

  // Clipboard feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const curr = profile.currency || '₹';
  const MASTER_BYPASS_PIN = '999000'; // Standard workshop master bypass code

  const lockedOrders = orders.filter((o) => o.isDeviceLocked);
  const totalLockedAmount = lockedOrders.reduce((sum, o) => sum + Math.max(0, o.cost - o.deposit), 0);

  // Safe clipboard helper with fallback for iframe environments
  const copyToClipboard = (text: string, key: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2200);
      }).catch(() => {
        fallbackCopy(text, key);
      });
    } else {
      fallbackCopy(text, key);
    }
  };

  const fallbackCopy = (text: string, key: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // ignore
    }
  };

  // Generate Customer Notice Text
  const getNoticeText = (order: RepairOrder) => {
    const balance = Math.max(0, order.cost - order.deposit);
    return `🚨 *MOBILE DEVICE LOCK NOTICE* 🚨\n\nDear ${order.name},\nYour smartphone *${order.model}* (IMEI: *${order.imei}*) has been placed under an authorized workshop lock hold by *${profile.shopName}*.\n\n📌 *Reason:* ${order.lockedReason || 'Unpaid repair balance'}\n💰 *Balance Due:* ${curr}${balance.toFixed(2)}\n\n💳 *Payment & Unlock Steps:*\n1. Clear your outstanding amount via UPI (*${profile.upi || 'Shop Desk'}*) or at our counter.\n2. Once paid, your release PIN (*${order.unlockCode || 'Provided upon payment'}*) will instantly restore full device access.\n\n📞 Shop Support: ${profile.phone}\n📍 ${profile.address || ''}`;
  };

  const handleSendWhatsApp = (order: RepairOrder) => {
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(getNoticeText(order));
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleApplyQuickLock = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);

    if (targetType === 'existing') {
      if (!selectedOrder) {
        setActionFeedback({ type: 'error', message: 'Please select an existing repair order to lock.' });
        return;
      }
      if (!customUnlockPin.trim()) {
        setActionFeedback({ type: 'error', message: 'Please enter or generate a 6-digit release PIN.' });
        return;
      }
      onLockDevice(selectedOrder.id, customReason, customUnlockPin.trim(), customNotes.trim());
      setActionFeedback({ type: 'success', message: `Device ${selectedOrder.model} (IMEI: ${selectedOrder.imei}) successfully marked as LOCKED.` });
      setActiveTab('locked-list');
    } else {
      // Custom Direct IMEI
      const clean = cleanImei(customImei);
      if (clean.length < 8) {
        setActionFeedback({ type: 'error', message: 'Please provide a valid IMEI or serial number (at least 8 digits).' });
        return;
      }
      if (!customName.trim()) {
        setActionFeedback({ type: 'error', message: 'Please provide the customer name.' });
        return;
      }
      if (!customPhone.trim()) {
        setActionFeedback({ type: 'error', message: 'Please provide the customer phone number.' });
        return;
      }

      const parsedCost = parseFloat(customBalance) || 0;
      const newTicketId = `LK-${Date.now().toString().slice(-4)}`;
      const tac = decodeTac(clean);
      const computedModel = customModel.trim() || `${tac.brand} ${tac.modelFamily}`;

      const newOrder: RepairOrder = {
        id: newTicketId,
        name: customName.trim(),
        phone: customPhone.trim(),
        model: computedModel,
        imei: clean,
        problem: `Device Locked: ${customReason.trim()}`,
        cost: parsedCost,
        deposit: 0,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        isDeviceLocked: true,
        lockedReason: customReason.trim(),
        unlockCode: customUnlockPin.trim(),
        lockedAt: new Date().toISOString(),
        lockNotes: customNotes.trim(),
      };

      if (onAddNewOrderWithLock) {
        onAddNewOrderWithLock(newOrder);
      } else {
        onLockDevice(newOrder.id, customReason, customUnlockPin.trim(), customNotes.trim());
      }

      setSelectedOrder(newOrder);
      setActionFeedback({ type: 'success', message: `New lock ticket ${newTicketId} registered for IMEI ${clean}.` });
      setActiveTab('locked-list');

      // Reset fields
      setCustomImei('');
      setCustomName('');
      setCustomPhone('');
      setCustomModel('');
      setCustomBalance('');
      setCustomUnlockPin(Math.floor(100000 + Math.random() * 900000).toString());
    }
  };

  const handleSimUnlock = () => {
    if (!selectedOrder) return;
    const pin = simPin.trim();
    if (pin === MASTER_BYPASS_PIN) {
      setSimResult('bypass');
    } else if (pin === (selectedOrder.unlockCode || '')) {
      setSimResult('success');
    } else {
      setSimResult('failed');
    }
  };

  const filteredLocked = lockedOrders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.imei.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      o.model.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 text-white p-5 sm:p-6 rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                IMEI Mobile Lock & Security Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                {lockedOrders.length} Held
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Manage unpaid repair device holds, generate 6-digit release PINs, send customer payment notices, and execute real-world hardware locking protocols.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('quick-lock');
              setTargetType('custom');
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lock New IMEI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solutions')}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span>Hardware Solutions Guide</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Active Device Holds</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{lockedOrders.length} Phones</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Secured under IMEI hold</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Unpaid Balance Held</div>
          <div className="text-2xl font-black text-zinc-900 mt-1">{curr}{totalLockedAmount.toFixed(2)}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Protected against default</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Workshop Master Bypass</div>
          <div className="text-2xl font-mono font-black text-amber-600 mt-1">{MASTER_BYPASS_PIN}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Emergency shop release code</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Lock Protection Protocol</div>
          <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Knox / DPC / In-Shop Lien</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Dual PIN & SMS Recovery active</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border border-zinc-200 rounded-xl p-1.5 shadow-2xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('locked-list')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'locked-list'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Active Holds ({lockedOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quick-lock')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'quick-lock'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Lock Any IMEI Tool</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Customer Screen Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('solutions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'solutions'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Hardware Lock Solutions & SOP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('slips')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'slips'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Hold Slips & Release Slips</span>
          </button>
        </div>

        {/* Quick Search */}
        {activeTab === 'locked-list' && (
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locked IMEI / customer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-fadeIn ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-zinc-500 hover:text-zinc-900 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW 1: ACTIVE LOCKED HANDSETS */}
      {activeTab === 'locked-list' && (
        <div className="space-y-4">
          {filteredLocked.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-800">No Mobile Devices Currently Locked</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                All workshop devices have either cleared repair payments or have not been flagged for security hold.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick-lock')}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Apply New IMEI Lock
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLocked.map((order) => {
                const balance = Math.max(0, order.cost - order.deposit);
                const isSelected = selectedOrder?.id === order.id;

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-xl border p-5 transition-all shadow-2xs space-y-4 ${
                      isSelected ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {/* Header: Model & IMEI */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-zinc-900">{order.model}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 uppercase tracking-wide">
                            LOCKED
                          </span>
                        </div>
                        <div className="text-xs font-mono font-bold text-zinc-600">
                          IMEI: {formatImeiDisplay(order.imei)}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Ticket: #{order.id} • Date: {order.date}
                        </div>
                      </div>

                      {/* Release PIN Box */}
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-center shrink-0">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Release PIN</div>
                        <div className="text-base font-mono font-black text-rose-700 tracking-widest my-0.5">
                          {order.unlockCode || '849201'}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.unlockCode || '849201', `pin-${order.id}`)}
                          className="text-[10px] text-zinc-600 hover:text-zinc-900 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        >
                          {copiedKey === `pin-${order.id}` ? (
                            <span className="text-emerald-600 font-bold">✓ Copied</span>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy PIN</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Customer & Reason */}
                    <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex justify-between text-zinc-700">
                        <span>Customer:</span>
                        <span className="font-bold">{order.name} ({order.phone})</span>
                      </div>
                      <div className="flex justify-between text-rose-900">
                        <span>Reason:</span>
                        <span className="font-medium">{order.lockedReason || 'Unpaid repair balance'}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-rose-200/60 font-bold text-rose-700">
                        <span>Pending Payment:</span>
                        <span>{curr}{balance.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onUnlockDevice(order.id, true);
                            setActionFeedback({ type: 'success', message: `Device ${order.model} cleared and unlocked.` });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer active:scale-98"
                          title="Collect balance payment into accounts and unlock device"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Collect & Unlock</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onUnlockDevice(order.id, false);
                            setActionFeedback({ type: 'success', message: `Device ${order.model} unlocked without financial modification.` });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Unlock device only"
                        >
                          <Unlock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Unlock Only</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(order)}
                          className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs transition-colors cursor-pointer"
                          title="Send lock notice via WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(getNoticeText(order), `notice-${order.id}`)}
                          className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 text-xs transition-colors cursor-pointer"
                          title="Copy notice SMS text"
                        >
                          {copiedKey === `notice-${order.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setActiveTab('simulator');
                          }}
                          className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Open Interactive Lock Simulator"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>Simulate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LOCK ANY IMEI TOOL */}
      {activeTab === 'quick-lock' && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-7 shadow-2xs space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Apply IMEI Device Security Lock</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Select an existing repair ticket to lock, or lock ANY 15-digit IMEI directly by entering the customer and handset credentials.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTargetType('existing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                targetType === 'existing'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Lock from Existing Repair Tickets
            </button>
            <button
              type="button"
              onClick={() => setTargetType('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                targetType === 'custom'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Lock Custom IMEI (Standalone Handset)
            </button>
          </div>

          <form onSubmit={handleApplyQuickLock} className="space-y-4">
            {targetType === 'existing' ? (
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Select Repair Device to Lock *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {orders.map((o) => {
                    const balance = Math.max(0, o.cost - o.deposit);
                    const isSelected = selectedOrder?.id === o.id;

                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{o.model}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            #{o.id}
                          </span>
                        </div>
                        <div className={`text-[11px] font-mono mt-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          IMEI: {o.imei}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-700/40 text-[11px]">
                          <span className={isSelected ? 'text-zinc-300' : 'text-zinc-500'}>{o.name}</span>
                          <span className={`font-bold ${balance > 0 ? (isSelected ? 'text-rose-300' : 'text-rose-600') : (isSelected ? 'text-emerald-300' : 'text-emerald-600')}`}>
                            {balance > 0 ? `${curr}${balance.toFixed(2)} Due` : 'Paid'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom IMEI Direct Entry */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>15-Digit IMEI *</span>
                    {cleanImei(customImei).length === 15 && (
                      <span className={`text-[10px] font-mono font-bold ${validateLuhn(customImei) ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {validateLuhn(customImei) ? '✓ Valid IMEI' : '⚠ Luhn Checksum'}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={customImei}
                    onChange={(e) => {
                      setCustomImei(e.target.value);
                      const clean = cleanImei(e.target.value);
                      if (clean.length >= 8 && !customModel) {
                        const tac = decodeTac(clean);
                        if (tac.brand !== 'Generic GSM Device') {
                          setCustomModel(`${tac.brand} ${tac.modelFamily}`);
                        }
                      }
                    }}
                    placeholder="Enter 15-digit IMEI or Serial"
                    className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 font-mono focus:border-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Phone Model (e.g. Samsung S23) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g. iPhone 14 / Galaxy S23"
                    className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Outstanding Due Amount ({curr})
                  </label>
                  <input
                    type="number"
                    value={customBalance}
                    onChange={(e) => setCustomBalance(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 font-mono font-bold focus:border-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Customer full name"
                    className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Customer Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Lock Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Reason for Locking Handset *
                </label>
                <input
                  type="text"
                  required
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="e.g. Outstanding unpaid repair balance"
                  className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    6-Digit Release Unlock PIN *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomUnlockPin(Math.floor(100000 + Math.random() * 900000).toString())}
                    className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={customUnlockPin}
                  onChange={(e) => setCustomUnlockPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 748291"
                  className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs font-mono font-bold text-rose-700 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Workshop Internal Notes (Optional)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Customer promised cash payment on Saturday"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                Release PIN will be recorded and sent to customer via SMS/WhatsApp.
              </div>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm & Apply IMEI Lock</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: INTERACTIVE SCREEN SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-zinc-800" />
                <span>Device Screen Lock Simulator & PIN Verifier</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Simulates the customer's lock screen display and tests unlock release codes.
              </p>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">Testing Device:</span>
              <select
                value={selectedOrder?.id || ''}
                onChange={(e) => {
                  const target = orders.find((o) => o.id === e.target.value) || null;
                  setSelectedOrder(target);
                  setSimPin('');
                  setSimResult(null);
                }}
                className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-1.5 font-medium"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.model} (IMEI: {o.imei}) {o.isDeviceLocked ? '[LOCKED]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-4">
            {/* Phone Screen Mockup */}
            <div className="w-[310px] bg-zinc-950 text-white rounded-[40px] p-5 shadow-2xl border-4 border-zinc-800 relative overflow-hidden flex flex-col justify-between min-h-[550px]">
              {/* Top Speaker / Dynamic Island */}
              <div className="w-28 h-4 bg-zinc-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-700" />
              </div>

              {/* Lock Warning Container */}
              <div className="text-center space-y-2.5 my-auto">
                <div className="w-14 h-14 mx-auto rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500 animate-pulse">
                  <Lock className="w-7 h-7" />
                </div>
                <h5 className="font-black text-base tracking-wide text-rose-400 uppercase">
                  Device Payment Lock
                </h5>
                <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
                  {profile.shopName || 'MOBILE HOSPITAL'}
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-left space-y-1 my-2">
                  <div className="text-[10px] text-zinc-400">
                    IMEI: <span className="font-mono text-zinc-200 font-bold">{selectedOrder?.imei || '356892091234567'}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Handset: <span className="text-zinc-200 font-semibold">{selectedOrder?.model || 'Smartphone'}</span>
                  </div>
                  <div className="text-[11px] text-rose-400 font-bold pt-1.5 border-t border-zinc-800 flex justify-between">
                    <span>Balance Due:</span>
                    <span>{curr}{selectedOrder ? Math.max(0, selectedOrder.cost - selectedOrder.deposit).toFixed(2) : '0.00'}</span>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 leading-snug">
                  Please clear your pending service bill to receive your instant release PIN.
                </p>

                {/* PIN Input */}
                <div className="pt-2 space-y-2">
                  <input
                    type="password"
                    maxLength={8}
                    value={simPin}
                    onChange={(e) => {
                      setSimPin(e.target.value);
                      setSimResult(null);
                    }}
                    placeholder="Enter Unlock PIN"
                    className="w-40 mx-auto text-center font-mono font-bold tracking-widest text-sm bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                  />
                  <div>
                    <button
                      type="button"
                      onClick={handleSimUnlock}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer active:scale-98"
                    >
                      Verify PIN & Unlock
                    </button>
                  </div>

                  {simResult === 'success' && (
                    <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 rounded p-1.5 flex items-center justify-center gap-1 animate-fadeIn">
                      <Check className="w-3.5 h-3.5" />
                      <span>PIN Verified! Device Unlocked.</span>
                    </div>
                  )}
                  {simResult === 'bypass' && (
                    <div className="text-[11px] text-amber-300 font-bold bg-amber-950/80 border border-amber-800 rounded p-1.5 animate-fadeIn">
                      ★ Master Workshop Bypass Accepted. Unlocked!
                    </div>
                  )}
                  {simResult === 'failed' && (
                    <div className="text-[11px] text-rose-400 font-bold bg-rose-950/80 border border-rose-800 rounded p-1.5 animate-fadeIn">
                      Invalid Unlock PIN. Call Workshop Support.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Support Link */}
              <div className="w-full pt-3 border-t border-zinc-800 text-center space-y-1">
                <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Workshop Assistance:</div>
                <div className="text-[11px] font-bold text-sky-400">{profile.phone}</div>
              </div>
            </div>

            {/* Simulator Controls & Cheat Sheet */}
            <div className="max-w-md space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Test Credentials for Selected Handset
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-zinc-200">
                    <span className="text-zinc-500 font-medium">Customer 6-Digit PIN:</span>
                    <span className="font-mono font-bold text-rose-700 text-sm">
                      {selectedOrder?.unlockCode || '849201'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-zinc-200">
                    <span className="text-zinc-500 font-medium">Master Workshop Bypass PIN:</span>
                    <span className="font-mono font-bold text-amber-600 text-sm">{MASTER_BYPASS_PIN}</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Type either the customer's 6-digit release code or the master workshop emergency code ({MASTER_BYPASS_PIN}) into the phone simulator above to test unlocking.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-950 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Workshop Security Tip</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  Never share the Master Bypass PIN ({MASTER_BYPASS_PIN}) with customers. It is strictly reserved for technicians in case of emergency system recovery or forgotten codes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: HARDWARE SOLUTIONS & REAL-WORLD SOP */}
      {activeTab === 'solutions' && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-2xs space-y-8">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <span>Real-World Mobile Locking: Technical Solutions & SOP</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-3xl leading-relaxed">
              Understand how commercial mobile finance companies (PayJoy, Samsung Knox, DPC) and professional repair workshops enforce hardware locks and payment recovery.
            </p>
          </div>

          {/* Solutions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Method 1: MDM & Android DPC */}
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">Android Enterprise DPC Provisioning</h4>
                  <div className="text-[10px] text-zinc-500">Method used by PayJoy, LockIT, EMI Finance Apps</div>
                </div>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                During factory setup, typing <code className="bg-zinc-200 px-1.5 py-0.5 rounded font-mono text-zinc-800">afw#setup</code> or scanning an MDM QR code enrolls the device as an Android Enterprise Managed Device.
              </p>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside">
                <li>Locks the screen to a persistent kiosk overlay if payment overdue.</li>
                <li>Disables USB debugging and prevents factory reset (FRP hold).</li>
                <li>Automatically releases when customer enters the 6-digit release PIN.</li>
              </ul>
            </div>

            {/* Method 2: Samsung Knox Guard */}
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">Samsung Knox Guard Portal</h4>
                  <div className="text-[10px] text-zinc-500">Official Samsung Hardware-level Security</div>
                </div>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Samsung Knox Guard allows certified repairers & financiers to link the phone's 15-digit IMEI to the Samsung Cloud console.
              </p>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside">
                <li>Operates at the TrustZone hardware processor level.</li>
                <li>Remotely pushes full-screen lock with shop contact & UPI payment QR.</li>
                <li>Cannot be wiped even by flashing stock Odin firmware.</li>
              </ul>
            </div>

            {/* Method 3: CEIR / Sanchar Saathi IMEI Blacklist */}
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">CEIR / Sanchar Saathi Network Blacklist</h4>
                  <div className="text-[10px] text-zinc-500">Department of Telecommunications (DoT / GSMA)</div>
                </div>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                If a repaired device is stolen or customer commits theft/fraud, the 15-digit IMEI can be reported to the national CEIR portal (Sanchar Saathi).
              </p>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside">
                <li>Blocks SIM card registration across Airtel, Jio, Vi, and BSNL.</li>
                <li>Renders cellular calling, SMS, and mobile data permanently inactive.</li>
                <li>Triggers immediate police alert if new SIM is inserted.</li>
              </ul>
            </div>

            {/* Method 4: Standard Workshop Bailee Lien */}
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">Workshop Physical Retention Lien</h4>
                  <div className="text-[10px] text-zinc-500">Standard Legal Procedure for Unpaid Repairs</div>
                </div>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Under standard commercial law (Bailee's Lien for repair services), the repairer retains legal possession of the handset until repair costs are settled.
              </p>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside">
                <li>Affix the official <strong>Payment Recovery Notice Slip</strong> to the handset packaging.</li>
                <li>Device stays held in workshop security safe under IMEI lock ticket.</li>
                <li>Handset is handed over only once payment is verified and cleared.</li>
              </ul>
            </div>
          </div>

          {/* Quick Troubleshooting Steps */}
          <div className="bg-zinc-900 text-white rounded-xl p-5 space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2 text-zinc-100">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Technician Troubleshooting: "Why Is Physical Phone Not Locking?"</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
              <div>
                <strong className="text-white block mb-1">1. Web vs Hardware Boundary</strong>
                Web apps cannot remotely freeze an unmanaged phone without an MDM profile or Knox agent pre-installed. Physical possession or MDM is required.
              </div>
              <div>
                <strong className="text-white block mb-1">2. Forgot Release PIN?</strong>
                Use the Master Workshop Bypass Code <span className="font-mono text-amber-300 font-bold">{MASTER_BYPASS_PIN}</span> to clear the lock instantly.
              </div>
              <div>
                <strong className="text-white block mb-1">3. Customer Settled Bill?</strong>
                Click <strong>"Collect & Unlock"</strong> to clear the lock and register the revenue directly into your Income & Expense accounts ledger.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: PRINTABLE SLIPS */}
      {activeTab === 'slips' && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-800" />
                <span>Printable Device Hold Slip & Handover Certificate</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Attach this slip to customer device box or hand over as formal legal notice.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>

          {/* Printable Container */}
          <div className="max-w-md mx-auto bg-white border-2 border-dashed border-rose-400 rounded-2xl p-6 text-zinc-900 space-y-4 shadow-sm">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                <Lock className="w-3 h-3 text-rose-600" />
                <span>Security Hold • Unpaid Balance Notice</span>
              </div>
              <h4 className="text-lg font-black tracking-tight text-zinc-900 pt-1">
                {profile.shopName || 'MOBILE HOSPITAL'}
              </h4>
              <p className="text-[10px] text-zinc-500">{profile.address || 'Professional Mobile Repair Centre'}</p>
            </div>

            <div className="py-2 border-y border-zinc-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Ticket ID:</span>
                <span className="font-mono font-bold">{selectedOrder?.id || 'T-1001'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Handset Model:</span>
                <span className="font-bold">{selectedOrder?.model || 'Smartphone'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Device IMEI:</span>
                <span className="font-mono font-bold text-rose-700">{selectedOrder?.imei || '356892091234567'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-semibold">{selectedOrder?.name || 'Customer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Contact:</span>
                <span>{selectedOrder?.phone || '+91 98765 43210'}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-zinc-100 font-bold text-sm text-rose-700">
                <span>Outstanding Due:</span>
                <span>{curr}{selectedOrder ? Math.max(0, selectedOrder.cost - selectedOrder.deposit).toFixed(2) : '1500.00'}</span>
              </div>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl text-[10px] text-rose-900 leading-relaxed">
              ⚠️ <strong>SECURITY HOLD NOTICE:</strong> This device has been placed under legal repairer's hold until the outstanding repair bill is cleared. Handset will be released upon presenting payment receipt.
            </div>

            {profile.upi && (
              <div className="text-center text-xs text-zinc-700 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                Pay instantly via UPI: <strong className="font-mono text-zinc-900">{profile.upi}</strong>
              </div>
            )}

            <div className="text-[10px] text-zinc-400 text-center pt-1 border-t border-zinc-100">
              Workshop Contact: {profile.phone} • {profile.email}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
