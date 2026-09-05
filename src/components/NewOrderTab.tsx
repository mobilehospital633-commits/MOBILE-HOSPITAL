import React, { useState } from 'react';
import { PlusCircle, Receipt, QrCode, Sparkles, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { RepairOrder, ShopProfile, AppUser, StolenDeviceRecord } from '../types';
import { cleanImei, decodeTac, validateLuhn } from '../utils/imei';

interface NewOrderTabProps {
  profile: ShopProfile;
  onOrderCreated: (order: RepairOrder) => void;
  currentUser?: AppUser | null;
  users?: AppUser[];
  stolenRegistry?: StolenDeviceRecord[];
}

export const NewOrderTab: React.FC<NewOrderTabProps> = ({
  profile,
  onOrderCreated,
  currentUser,
  users = [],
  stolenRegistry = [],
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [problem, setProblem] = useState('');
  const [cost, setCost] = useState('');
  const [deposit, setDeposit] = useState('0.00');
  const [status, setStatus] = useState<RepairOrder['status']>(profile.defaultStatus || 'Pending');
  const [technician, setTechnician] = useState(currentUser?.name || '');

  const curr = profile.currency || '₹';

  const cleanCurrentImei = cleanImei(imei);
  const stolenMatch = stolenRegistry.find((r) => {
    const p1 = cleanImei(r.imei);
    const p2 = cleanImei(r.imei2 || '');
    return cleanCurrentImei && ((p1 && p1 === cleanCurrentImei) || (p2 && p2 === cleanCurrentImei));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !model.trim() || !problem.trim() || !cost) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const numCost = parseFloat(cost) || 0;
    const numDeposit = parseFloat(deposit) || 0;

    const newOrder: RepairOrder = {
      id: 'T-' + Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      phone: cleanPhone,
      model: model.trim(),
      imei: imei.trim() || 'N/A',
      problem: problem.trim(),
      cost: numCost,
      deposit: numDeposit,
      status: status,
      date: new Date().toISOString().split('T')[0],
      technician: technician.trim() || currentUser?.name || 'Workshop Bench',
      createdBy: currentUser?.name || 'Staff',
    };

    onOrderCreated(newOrder);

    // Reset form
    setName('');
    setPhone('');
    setModel('');
    setImei('');
    setProblem('');
    setCost('');
    setDeposit('0.00');
  };

  const calculatedBalance = Math.max(0, (parseFloat(cost) || 0) - (parseFloat(deposit) || 0));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-6 sm:p-7">
        
        {/* Header */}
        <div className="border-b border-zinc-100 pb-4 mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-zinc-900" />
              <span>Create New Repair Order</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Generates an official job slip with dynamic Customer Billing QR code
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium">
            <QrCode className="w-3.5 h-3.5 text-zinc-600" />
            <span>Billing QR Enabled</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 919876543210"
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Device Brand & Model *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. iPhone 14 Pro Max / OnePlus 11"
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center justify-between">
                <span>IMEI / Serial Number (Optional)</span>
                {cleanImei(imei).length === 15 && (
                  <span className={`text-[10px] font-mono font-bold ${validateLuhn(imei) ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {validateLuhn(imei) ? '✓ Valid IMEI' : '⚠ Luhn Checksum'}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={imei}
                onChange={(e) => {
                  setImei(e.target.value);
                  const cleaned = cleanImei(e.target.value);
                  if (cleaned.length >= 8 && !model.trim()) {
                    const tac = decodeTac(cleaned);
                    if (tac.brand !== 'Generic GSM Device') {
                      setModel(`${tac.brand} ${tac.modelFamily}`);
                    }
                  }
                }}
                placeholder="15-digit IMEI or Serial Number"
                className={`w-full border rounded-lg p-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors ${
                  stolenMatch
                    ? 'border-rose-500 bg-rose-50/30 ring-2 ring-rose-500/20'
                    : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10'
                }`}
              />

              {/* Stolen IMEI Match Alert */}
              {stolenMatch && (
                <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-950 text-xs animate-fadeIn space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>CRITICAL POLICE ALERT: REPORTED STOLEN DEVICE</span>
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed">
                    This IMEI is registered as stolen under <strong>FIR #{stolenMatch.policeFirNumber}</strong> ({stolenMatch.policeStation}).
                    Registered Owner: <strong>{stolenMatch.ownerName}</strong> ({stolenMatch.ownerPhone}).
                  </p>
                  <div className="text-[10px] text-rose-800 font-semibold pt-0.5">
                    ⚠ Warning: Do not accept or flash this device without police intimation.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Reported Fault / Problem *
            </label>
            <textarea
              rows={3}
              required
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Describe screen cracks, battery drain, speaker issue, water damage, etc."
              className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Estimated Cost ({curr}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm font-semibold text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Advance Deposit ({curr})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="0.00"
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm font-semibold text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RepairOrder['status'])}
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Assigned Tech
              </label>
              {users.length > 0 ? (
                <select
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors bg-white"
                >
                  <option value="">-- Select Staff --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="Technician Name"
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              )}
            </div>
          </div>

          {/* Quick Billing QR Notice preview */}
          {parseFloat(cost) > 0 && (
            <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500">Calculated Balance Due:</span>
                <p className="text-base font-bold text-zinc-900">
                  {curr}{calculatedBalance.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-zinc-700 font-medium flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-zinc-900" />
                  <span>Billing QR will embed {curr}{calculatedBalance.toFixed(2)}</span>
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-zinc-100 pt-5">
            <button
              type="reset"
              onClick={() => {
                setName('');
                setPhone('');
                setModel('');
                setImei('');
                setProblem('');
                setCost('');
                setDeposit('0.00');
              }}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Save & View Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
