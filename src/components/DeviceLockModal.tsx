import React, { useState, useEffect } from 'react';
import {
  X,
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
  Cpu,
  Info,
} from 'lucide-react';
import { RepairOrder, ShopProfile } from '../types';
import { cleanImei, validateLuhn, decodeTac, formatImeiDisplay } from '../utils/imei';

interface DeviceLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RepairOrder | null;
  orders: RepairOrder[];
  profile: ShopProfile;
  onLockDevice: (orderId: string, reason: string, unlockCode: string, notes?: string) => void;
  onUnlockDevice: (orderId: string, collectPayment?: boolean) => void;
  onSelectOrder: (order: RepairOrder) => void;
  onAddNewOrderWithLock?: (newOrder: RepairOrder) => void;
}

export const DeviceLockModal: React.FC<DeviceLockModalProps> = ({
  isOpen,
  onClose,
  order,
  orders,
  profile,
  onLockDevice,
  onUnlockDevice,
  onSelectOrder,
  onAddNewOrderWithLock,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'controls' | 'simulator' | 'solutions' | 'slip'>('controls');
  const [imeiSearchQuery, setImeiSearchQuery] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [unlockCode, setUnlockCode] = useState('');
  const [lockNotes, setLockNotes] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [pinVerificationResult, setPinVerificationResult] = useState<'success' | 'failed' | 'bypass' | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const curr = profile.currency || '₹';
  const MASTER_BYPASS_PIN = '999000';

  // Generate 6-digit PIN
  const generateRandomPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  useEffect(() => {
    if (order) {
      const balance = Math.max(0, order.cost - order.deposit);
      setLockReason(order.lockedReason || `Outstanding unpaid repair balance of ${curr}${balance.toFixed(2)}`);
      setUnlockCode(order.unlockCode || generateRandomPin());
      setLockNotes(order.lockNotes || '');
      setInputPin('');
      setPinVerificationResult(null);
      setModalFeedback(null);
    } else if (orders.length > 0) {
      // Auto-select first order if none selected
      const target = orders.find((o) => o.isDeviceLocked) || orders.find((o) => o.cost > o.deposit) || orders[0];
      if (target) onSelectOrder(target);
    }
  }, [order, orders, curr, onSelectOrder]);

  if (!isOpen) return null;

  const currentOrder = order;
  const balance = currentOrder ? Math.max(0, currentOrder.cost - currentOrder.deposit) : 0;
  const isLocked = currentOrder?.isDeviceLocked ?? false;

  // Search orders by IMEI or Customer or ID
  const searchResults = imeiSearchQuery.trim()
    ? orders.filter(
        (o) =>
          o.imei.toLowerCase().includes(imeiSearchQuery.toLowerCase()) ||
          o.id.toLowerCase().includes(imeiSearchQuery.toLowerCase()) ||
          o.name.toLowerCase().includes(imeiSearchQuery.toLowerCase()) ||
          o.phone.includes(imeiSearchQuery.trim())
      )
    : [];

  const copyToClipboard = (text: string, onDone: () => void) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onDone).catch(() => {
        fallbackCopy(text, onDone);
      });
    } else {
      fallbackCopy(text, onDone);
    }
  };

  const fallbackCopy = (text: string, onDone: () => void) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      onDone();
    } catch {
      // ignore
    }
  };

  const handleApplyLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) {
      setModalFeedback({ type: 'error', message: 'No repair device is currently selected.' });
      return;
    }
    if (!unlockCode.trim()) {
      setModalFeedback({ type: 'error', message: 'Please provide or generate a 6-digit release PIN.' });
      return;
    }
    onLockDevice(currentOrder.id, lockReason, unlockCode.trim(), lockNotes.trim());
    setModalFeedback({ type: 'success', message: `Device ${currentOrder.model} (IMEI: ${currentOrder.imei}) marked as LOCKED.` });
  };

  const handleCopyUnlockCode = () => {
    if (!currentOrder?.unlockCode) return;
    copyToClipboard(currentOrder.unlockCode, () => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const getCustomerNoticeMessage = () => {
    if (!currentOrder) return '';
    return `🚨 *PAYMENT NOTICE & MOBILE DEVICE LOCK* 🚨\n\nDear ${currentOrder.name},\nYour device *${currentOrder.model}* (IMEI: *${currentOrder.imei}*) has been marked *LOCKED* by *${profile.shopName}* due to an outstanding unpaid repair balance of *${curr}${balance.toFixed(2)}*.\n\n💳 *To Restore Full Access:*\nPlease clear your pending balance at our workshop or via UPI: *${profile.upi || 'Shop Desk'}*.\nOnce payment is confirmed, your 6-digit device unlock code (*${currentOrder.unlockCode || unlockCode}*) will release your device.\n\n📞 Shop Support: ${profile.phone}\n📍 ${profile.address || ''}`;
  };

  const handleCopyNotice = () => {
    const text = getCustomerNoticeMessage();
    copyToClipboard(text, () => {
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    });
  };

  const handleSendWhatsApp = () => {
    if (!currentOrder) return;
    const cleanPhone = currentOrder.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(getCustomerNoticeMessage());
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleVerifySimulatorPin = () => {
    if (!currentOrder) return;
    const pin = inputPin.trim();
    if (pin === MASTER_BYPASS_PIN) {
      setPinVerificationResult('bypass');
    } else if (pin === (currentOrder.unlockCode || unlockCode)) {
      setPinVerificationResult('success');
    } else {
      setPinVerificationResult('failed');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-zinc-200 animate-fadeIn">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLocked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
              {isLocked ? <Lock className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight text-white">
                  IMEI Mobile Lock & Unlock Manager
                </h3>
                {isLocked ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider">
                    LOCKED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    UNLOCKED
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage device payment security hold for unpaid repair charges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-zinc-100 px-4 sm:px-6 pt-2 border-b border-zinc-200 flex items-center justify-between text-xs font-semibold gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setActiveSubTab('controls')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'controls'
                  ? 'bg-white text-zinc-900 border-t border-x border-zinc-200 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Lock Controls</span>
            </button>
            <button
              onClick={() => setActiveSubTab('simulator')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'simulator'
                  ? 'bg-white text-zinc-900 border-t border-x border-zinc-200 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>PIN Simulator</span>
            </button>
            <button
              onClick={() => setActiveSubTab('solutions')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'solutions'
                  ? 'bg-white text-zinc-900 border-t border-x border-zinc-200 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Hardware Guide</span>
            </button>
            <button
              onClick={() => setActiveSubTab('slip')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'slip'
                  ? 'bg-white text-zinc-900 border-t border-x border-zinc-200 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Hold Slip</span>
            </button>
          </div>

          {/* Quick IMEI search input - Always visible */}
          <div className="relative pb-1.5 w-full sm:w-44">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={imeiSearchQuery}
              onChange={(e) => setImeiSearchQuery(e.target.value)}
              placeholder="Search IMEI / ticket..."
              className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        {/* Search Results Dropdown when searching */}
        {imeiSearchQuery.trim() && searchResults.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 p-2 max-h-36 overflow-y-auto">
            <div className="text-[11px] font-bold text-amber-900 px-2 py-0.5">
              Select device to manage lock:
            </div>
            {searchResults.map((sr) => (
              <button
                key={sr.id}
                onClick={() => {
                  onSelectOrder(sr);
                  setImeiSearchQuery('');
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-amber-100 flex items-center justify-between text-xs text-zinc-800 transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-semibold">{sr.model}</span> (IMEI: <span className="font-mono">{sr.imei}</span>) - {sr.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-rose-700 font-bold">
                    Due: {curr}{Math.max(0, sr.cost - sr.deposit).toFixed(2)}
                  </span>
                  {sr.isDeviceLocked && (
                    <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">LOCKED</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Feedback Message */}
        {modalFeedback && (
          <div className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between ${
            modalFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' : 'bg-rose-50 text-rose-900 border-b border-rose-200'
          }`}>
            <span>{modalFeedback.message}</span>
            <button type="button" onClick={() => setModalFeedback(null)} className="cursor-pointer text-zinc-500">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {!currentOrder ? (
            <div className="text-center py-8 text-zinc-500 space-y-3">
              <Smartphone className="w-10 h-10 mx-auto text-zinc-300" />
              <p className="text-sm font-medium">Select a device from your repair tickets:</p>
              <div className="max-w-sm mx-auto">
                <select
                  onChange={(e) => {
                    const target = orders.find((o) => o.id === e.target.value);
                    if (target) onSelectOrder(target);
                  }}
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-300 rounded-lg"
                >
                  <option value="">-- Choose repair device --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.model} (IMEI: {o.imei}) - {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* Selected Device Banner */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-zinc-900">{currentOrder.model}</span>
                    <span className="text-xs font-mono bg-zinc-200/80 text-zinc-800 px-2 py-0.5 rounded font-bold">
                      IMEI: {currentOrder.imei}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Ticket: {currentOrder.id}</span>
                  </div>
                  <div className="text-xs text-zinc-600 flex items-center gap-3">
                    <span>Customer: <strong>{currentOrder.name}</strong></span>
                    <span>Phone: <strong>{currentOrder.phone}</strong></span>
                  </div>
                </div>

                {/* Financial status */}
                <div className="text-right sm:border-l sm:border-zinc-200 sm:pl-4">
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Outstanding Balance
                  </div>
                  <div className={`text-base font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {balance > 0 ? `${curr}${balance.toFixed(2)} DUE` : 'CLEARED (₹0.00)'}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Total: {curr}{currentOrder.cost.toFixed(2)} • Paid: {curr}{currentOrder.deposit.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* VIEW 1: CONTROLS */}
              {activeSubTab === 'controls' && (
                <div className="space-y-5">
                  {/* Current Status Card */}
                  {isLocked ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-rose-950 flex items-center gap-2">
                              <span>DEVICE IS CURRENTLY LOCKED</span>
                              <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                                ACTIVE
                              </span>
                            </div>
                            <p className="text-xs text-rose-800 mt-1">
                              <strong>Reason:</strong> {currentOrder.lockedReason || 'Unpaid repair balance'}
                            </p>
                            {currentOrder.lockedAt && (
                              <p className="text-[11px] text-rose-600 mt-0.5">
                                Locked on: {new Date(currentOrder.lockedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Unlock Code Box */}
                        <div className="bg-white border border-rose-200 rounded-lg p-2.5 text-center shrink-0 shadow-2xs">
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            Release PIN
                          </div>
                          <div className="text-lg font-mono font-black text-rose-700 tracking-wider my-0.5">
                            {currentOrder.unlockCode || '849201'}
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyUnlockCode}
                            className="text-[10px] text-zinc-600 hover:text-zinc-900 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          >
                            {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCode ? 'Copied' : 'Copy PIN'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Unlock Action Buttons */}
                      <div className="pt-2 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onUnlockDevice(currentOrder.id, true);
                              setModalFeedback({ type: 'success', message: 'Payment collected and device unlocked successfully!' });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-98"
                            title="Collect pending payment and immediately unlock device"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Collect {curr}{balance.toFixed(2)} & Unlock</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUnlockDevice(currentOrder.id, false);
                              setModalFeedback({ type: 'success', message: 'Device unlocked without modifying balance.' });
                            }}
                            className="bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-98"
                            title="Unlock device without modifying financial balance"
                          >
                            <Unlock className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Unlock Device Only</span>
                          </button>
                        </div>

                        {/* Customer notice buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSendWhatsApp}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Send device lock warning & payment link via WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp Notice</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyNotice}
                            className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copy SMS text"
                          >
                            {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedNotice ? 'Copied' : 'Copy SMS'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Lock Form when Device is UNLOCKED */
                    <form onSubmit={handleApplyLock} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-rose-600" />
                          <h4 className="font-bold text-sm text-zinc-900">Lock Mobile by IMEI</h4>
                        </div>
                        {balance > 0 ? (
                          <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                            Unpaid Balance: {curr}{balance.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                            Balance Paid in Full
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-600 leading-relaxed">
                        Locking device marks IMEI {currentOrder.imei} with an official release PIN and creates a formal payment recovery notice for the customer.
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                            Lock Reason *
                          </label>
                          <input
                            type="text"
                            required
                            value={lockReason}
                            onChange={(e) => setLockReason(e.target.value)}
                            placeholder="e.g. Unpaid repair balance"
                            className="w-full border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                              Release PIN (6 digits) *
                            </label>
                            <button
                              type="button"
                              onClick={() => setUnlockCode(generateRandomPin())}
                              className="text-[10px] text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Generate New</span>
                            </button>
                          </div>
                          <div className="relative">
                            <KeyRound className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              required
                              maxLength={8}
                              value={unlockCode}
                              onChange={(e) => setUnlockCode(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="e.g. 849201"
                              className="w-full pl-8 pr-2.5 py-2 text-xs font-mono font-bold text-zinc-900 border border-zinc-300 rounded-lg focus:border-zinc-900 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                          Internal Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={lockNotes}
                          onChange={(e) => setLockNotes(e.target.value)}
                          placeholder="e.g. Promised payment on Saturday"
                          className="w-full border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-zinc-400" />
                          <span>IMEI: <strong>{currentOrder.imei}</strong></span>
                        </div>
                        <button
                          type="submit"
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-98"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Confirm & Lock Device</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Customer Notice Preview */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Customer Payment & Lock Notification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyNotice}
                          className="text-[11px] text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-medium cursor-pointer"
                        >
                          {copiedNotice ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedNotice ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSendWhatsApp}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send WhatsApp</span>
                        </button>
                      </div>
                    </div>
                    <pre className="bg-white p-3 rounded-lg border border-zinc-200 text-[11px] font-mono text-zinc-700 whitespace-pre-wrap leading-relaxed">
                      {getCustomerNoticeMessage()}
                    </pre>
                  </div>
                </div>
              )}

              {/* VIEW 2: LOCK SCREEN SIMULATOR */}
              {activeSubTab === 'simulator' && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-[300px] bg-zinc-950 text-white rounded-[32px] p-4 shadow-2xl border-4 border-zinc-800 relative overflow-hidden flex flex-col items-center justify-between min-h-[500px]">
                      {/* Notch */}
                      <div className="w-24 h-4 bg-zinc-800 rounded-full mb-3 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700" />
                      </div>

                      {/* Header Warning */}
                      <div className="text-center space-y-2 my-auto w-full px-2">
                        <div className="w-14 h-14 mx-auto rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500 animate-pulse">
                          <Lock className="w-7 h-7" />
                        </div>
                        <h5 className="font-extrabold text-sm tracking-wide text-rose-400 uppercase">
                          Device Locked
                        </h5>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                          {profile.shopName || 'MOBILE HOSPITAL'}
                        </div>

                        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 my-2 space-y-1 text-left">
                          <div className="text-[10px] text-zinc-400">
                            IMEI: <span className="font-mono text-zinc-200 font-bold">{currentOrder.imei}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Model: <span className="text-zinc-200 font-semibold">{currentOrder.model}</span>
                          </div>
                          <div className="text-[11px] text-rose-400 font-bold pt-1 border-t border-zinc-800 flex justify-between">
                            <span>Balance Due:</span>
                            <span>{curr}{balance.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* PIN Entry Field */}
                        <div className="pt-2 space-y-2">
                          <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                            Enter 6-Digit PIN
                          </div>
                          <div className="flex items-center gap-1.5 justify-center">
                            <input
                              type="password"
                              maxLength={8}
                              value={inputPin}
                              onChange={(e) => {
                                setInputPin(e.target.value);
                                setPinVerificationResult(null);
                              }}
                              placeholder="• • • • • •"
                              className="bg-zinc-900 border border-zinc-700 text-center font-mono font-bold tracking-widest text-sm rounded-lg px-3 py-1.5 text-white w-32 focus:outline-none focus:border-rose-500"
                            />
                            <button
                              type="button"
                              onClick={handleVerifySimulatorPin}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                              Unlock
                            </button>
                          </div>

                          {pinVerificationResult === 'success' && (
                            <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 rounded p-1 flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>PIN Verified! Device Unlocked.</span>
                            </div>
                          )}
                          {pinVerificationResult === 'bypass' && (
                            <div className="text-[11px] text-amber-300 font-bold bg-amber-950/60 border border-amber-800 rounded p-1">
                              ★ Master Shop Bypass PIN Accepted!
                            </div>
                          )}
                          {pinVerificationResult === 'failed' && (
                            <div className="text-[11px] text-rose-400 font-bold bg-rose-950/60 border border-rose-800 rounded p-1">
                              Invalid PIN. Contact shop support.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Call Shop */}
                      <div className="w-full pt-3 border-t border-zinc-800/80 text-center space-y-1">
                        <div className="text-[10px] text-zinc-500">Contact Workshop:</div>
                        <div className="text-[11px] text-sky-400 font-semibold">{profile.phone}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: HARDWARE SOLUTIONS */}
              {activeSubTab === 'solutions' && (
                <div className="space-y-4 text-xs text-zinc-600">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-indigo-950 space-y-2">
                    <h5 className="font-bold flex items-center gap-1.5 text-indigo-900">
                      <Cpu className="w-4 h-4 text-indigo-700" />
                      <span>How Hardware Locking Works in the Mobile Industry</span>
                    </h5>
                    <p className="text-[11px] leading-relaxed">
                      Web applications cannot remotely freeze an unmanaged phone without an MDM profile or Knox agent installed. Commercial mobile financiers (PayJoy, Samsung Knox, LockIT) enforce hardware locks using 4 standard solutions:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
                      <strong className="text-zinc-900 block">1. Android DPC (afw#setup)</strong>
                      <span>Configured during phone setup. Overlays full-screen lock until customer clears payment.</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
                      <strong className="text-zinc-900 block">2. Samsung Knox Guard</strong>
                      <span>Cloud-linked by IMEI at the hardware TrustZone level. Survives hard resets and Odin flashes.</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
                      <strong className="text-zinc-900 block">3. CEIR / Sanchar Saathi Portal</strong>
                      <span>Official Indian government portal to block IMEI on all telecom networks (Airtel, Jio, Vi).</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
                      <strong className="text-zinc-900 block">4. Workshop Physical Lien Hold</strong>
                      <span>Repairer retains physical custody under Bailee's lien until service invoice is paid.</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900 text-zinc-200 p-3 rounded-lg text-[11px] space-y-1">
                    <div className="font-bold text-amber-300">Master Emergency Bypass PIN: {MASTER_BYPASS_PIN}</div>
                    <div>If a customer forgets their release code, enter {MASTER_BYPASS_PIN} to bypass the lock immediately.</div>
                  </div>
                </div>
              )}

              {/* VIEW 4: PRINTABLE LOCK NOTICE SLIP */}
              {activeSubTab === 'slip' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-600">
                      Printable Device Payment Recovery Slip:
                    </p>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </div>

                  <div className="max-w-sm mx-auto bg-white border-2 border-dashed border-rose-400 rounded-xl p-5 text-zinc-900 space-y-3 text-center shadow-xs">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Payment Recovery Notice</span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-base tracking-tight text-zinc-900">
                        {profile.shopName || 'MOBILE HOSPITAL'}
                      </h4>
                      <p className="text-[10px] text-zinc-500">{profile.address || 'Professional Mobile Repair Hub'}</p>
                    </div>

                    <div className="py-2 border-y border-zinc-200 text-left space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Ticket ID:</span>
                        <span className="font-mono font-bold">{currentOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Device Model:</span>
                        <span className="font-semibold">{currentOrder.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Device IMEI:</span>
                        <span className="font-mono font-bold text-rose-700">{currentOrder.imei}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Customer:</span>
                        <span className="font-medium">{currentOrder.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Contact:</span>
                        <span>{currentOrder.phone}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-zinc-100 font-bold text-sm text-rose-700">
                        <span>Balance Due:</span>
                        <span>{curr}{balance.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-rose-50 p-2 rounded-lg text-[10px] text-rose-900 leading-tight">
                      ⚠️ <strong>DEVICE LOCKED:</strong> Held under security lock due to pending repair balance.
                    </div>

                    {profile.upi && (
                      <div className="text-[11px] text-zinc-600 pt-1">
                        Pay via UPI: <strong className="font-mono text-zinc-900">{profile.upi}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs">
          <div className="text-zinc-500 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-zinc-400" />
            <span>Mobile Hospital IMEI Lock Protection</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
