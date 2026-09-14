import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Receipt,
  QrCode,
  Sparkles,
  Wrench,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Hash,
  Tag,
  X,
  Check,
} from 'lucide-react';
import { RepairOrder, ShopProfile, InventoryItem } from '../types';
import { cleanImei, decodeTac, validateLuhn } from '../utils/imei';
import { ALL_BRANDS, getAllModels, getModelsForBrand } from '../brandModels';
import { getModelNumberSuggestions } from '../utils/orderUtils';

interface NewOrderTabProps {
  profile: ShopProfile;
  inventory?: InventoryItem[];
  onOrderCreated: (order: RepairOrder) => void;
}

export const NewOrderTab: React.FC<NewOrderTabProps> = ({
  profile,
  inventory = [],
  onOrderCreated,
}) => {
  const curr = profile.currency || '₹';

  // -------------------------
  // REPAIR ORDER FORM STATE
  // -------------------------
  const [repairName, setRepairName] = useState('');
  const [repairPhone, setRepairPhone] = useState('');
  const [repairDeviceName, setRepairDeviceName] = useState('');
  const [repairModelNumber, setRepairModelNumber] = useState('');
  const [repairImei, setRepairImei] = useState('');
  const [repairProblem, setRepairProblem] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [repairDeposit, setRepairDeposit] = useState('0.00');
  const [repairStatus, setRepairStatus] = useState<RepairOrder['status']>(profile.defaultStatus || 'Pending');
  const [repairTechnician, setRepairTechnician] = useState('Main Bench');

  // Custom added options for repair problems / services
  const DEFAULT_REPAIR_PROBLEMS = [
    'Screen / Display Broken',
    'Battery Drain / Replacement',
    'Charging Port Issue',
    'Water Damage Diagnosis',
    'Touch Not Working',
    'Camera Lens Broken',
    'Speaker / Mic Fault',
    'Dead / Won\'t Turn On',
    'Back Glass Cracked',
    'Software / FRP Unlock',
  ];

  const [customProblems, setCustomProblems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mh_custom_repair_problems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAddCustomProblem, setShowAddCustomProblem] = useState(false);
  const [newCustomProblemText, setNewCustomProblemText] = useState('');

  const handleAddCustomProblem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCustomProblemText.trim();
    if (!trimmed) return;
    if (!customProblems.includes(trimmed) && !DEFAULT_REPAIR_PROBLEMS.includes(trimmed)) {
      const updated = [...customProblems, trimmed];
      setCustomProblems(updated);
      try {
        localStorage.setItem('mh_custom_repair_problems', JSON.stringify(updated));
      } catch {}
    }
    // Automatically apply to current problem description
    setRepairProblem((prev) => (prev.trim() ? `${prev.trim()}, ${trimmed}` : trimmed));
    setNewCustomProblemText('');
    setShowAddCustomProblem(false);
  };

  const handleRemoveCustomProblem = (probToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customProblems.filter((p) => p !== probToRemove);
    setCustomProblems(updated);
    try {
      localStorage.setItem('mh_custom_repair_problems', JSON.stringify(updated));
    } catch {}
  };

  const handleToggleProblemChip = (prob: string) => {
    setRepairProblem((prev) => {
      if (!prev.trim()) return prob;
      if (prev.includes(prob)) {
        const parts = prev.split(',').map((s) => s.trim()).filter((s) => s !== prob && s.length > 0);
        return parts.join(', ');
      } else {
        return `${prev.trim()}, ${prob}`;
      }
    });
  };

  const suggestedModelNumbers = useMemo(() => {
    return getModelNumberSuggestions(repairDeviceName);
  }, [repairDeviceName]);

  // -------------------------
  // REPAIR FORM SUBMIT
  // -------------------------
  const handleRepairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairName.trim() || !repairPhone.trim() || !repairDeviceName.trim() || !repairProblem.trim() || !repairCost) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    const cleanPhone = repairPhone.replace(/[^0-9]/g, '');
    const cleanDeviceName = repairDeviceName.trim();
    const cleanModelNumber = repairModelNumber.trim();
    const combinedModel = cleanModelNumber
      ? `${cleanDeviceName} (${cleanModelNumber})`
      : cleanDeviceName;
    const numCost = parseFloat(repairCost) || 0;
    const numDeposit = parseFloat(repairDeposit) || 0;

    const newOrder: RepairOrder = {
      id: 'T-' + Math.floor(1000 + Math.random() * 9000),
      name: repairName.trim(),
      phone: cleanPhone,
      deviceName: cleanDeviceName,
      modelNumber: cleanModelNumber,
      model: combinedModel,
      imei: repairImei.trim() || 'N/A',
      problem: repairProblem.trim(),
      cost: numCost,
      deposit: numDeposit,
      status: repairStatus,
      date: new Date().toISOString().split('T')[0],
      technician: repairTechnician.trim() || 'Workshop Bench',
      createdBy: 'Counter Terminal',
    };

    onOrderCreated(newOrder);

    // Reset form
    setRepairName('');
    setRepairPhone('');
    setRepairDeviceName('');
    setRepairModelNumber('');
    setRepairImei('');
    setRepairProblem('');
    setRepairCost('');
    setRepairDeposit('0.00');
  };

  const calculatedRepairBalance = Math.max(
    0,
    (parseFloat(repairCost) || 0) - (parseFloat(repairDeposit) || 0)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* CUSTOMER REPAIR ORDER FORM */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-6 sm:p-7 animate-in fade-in duration-150">
        <div className="border-b border-zinc-100 pb-4 mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
                <Wrench className="w-4 h-4 text-zinc-900" />
                <span>Create Customer Repair Order</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Generates an official device repair ticket with dynamic Customer Billing QR code
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              Repair Job
            </span>
          </div>

          <form onSubmit={handleRepairSubmit} className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900"
                    value={repairName}
                    onChange={(e) => setRepairName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900"
                    value={repairPhone}
                    onChange={(e) => setRepairPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Device Information */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Device Details
                </h3>
                <span className="text-[11px] text-zinc-500 font-medium">
                  Separate Name & Hardware Model Number
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Device Name */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Device Name / Brand</span>
                      <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">Commercial Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="new-order-device-names"
                    placeholder="e.g. iPhone 15 Pro, Galaxy S24 Ultra, OnePlus 12"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900"
                    value={repairDeviceName}
                    onChange={(e) => setRepairDeviceName(e.target.value)}
                  />
                  <datalist id="new-order-device-names">
                    {getAllModels().map((m) => (
                      <option key={`${m.brand}-${m.model}`} value={m.model}>
                        {m.brand}
                      </option>
                    ))}
                  </datalist>

                  {/* Quick popular model selection chips */}
                  {!repairDeviceName && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-400">Quick:</span>
                      {['iPhone 15 Pro', 'iPhone 14', 'Galaxy S24', 'OnePlus 12R', 'Redmi Note 13'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setRepairDeviceName(item)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Device Model Number */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Device Model Number</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium">
                      Hardware Code
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A3106, SM-S928B, CPH2581, 23090RA98I"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-mono"
                    value={repairModelNumber}
                    onChange={(e) => setRepairModelNumber(e.target.value)}
                  />

                  {/* Smart suggestions based on device name */}
                  {suggestedModelNumbers.length > 0 && !repairModelNumber && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-emerald-600 font-medium">Suggested:</span>
                      {suggestedModelNumbers.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setRepairModelNumber(code)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-mono transition-colors cursor-pointer"
                          title={`Click to set model number to ${code}`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  )}

                  {suggestedModelNumbers.length === 0 && (
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Check back glass, SIM tray, or Settings &gt; About Phone
                    </p>
                  )}
                </div>

                {/* 3. IMEI / Serial Number */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5 flex items-center justify-between">
                    <span>IMEI / Serial Number</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Optional (15 Digits)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="15-digit IMEI or Serial Number"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-mono"
                    value={repairImei}
                    onChange={(e) => setRepairImei(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Issue Description with Custom Added Options */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Fault / Problem Reported <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomProblem(!showAddCustomProblem)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Custom Added Option</span>
                </button>
              </div>

              {/* Inline Custom Problem Adder */}
              {showAddCustomProblem && (
                <div className="mb-2.5 p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Add Custom Repair Problem / Service Option</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomProblem(false)}
                      className="text-zinc-400 hover:text-zinc-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. SIM Card Reader Replacement, Volume Flex, Face ID..."
                      value={newCustomProblemText}
                      onChange={(e) => setNewCustomProblemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomProblem();
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-600 text-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomProblem}
                      disabled={!newCustomProblemText.trim()}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Option</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-700 mt-1">
                    Saves permanently to your workshop's quick options list and applies to this ticket.
                  </p>
                </div>
              )}

              <textarea
                required
                rows={2}
                placeholder="e.g. Broken display glass, battery drains quickly, speaker sound distorted..."
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900"
                value={repairProblem}
                onChange={(e) => setRepairProblem(e.target.value)}
              />

              {/* Quick Problem Chips & Custom Added Options */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-zinc-400 font-medium mr-0.5">Quick Options:</span>
                
                {/* Standard common issues */}
                {DEFAULT_REPAIR_PROBLEMS.map((prob) => {
                  const isSelected = repairProblem.includes(prob);
                  return (
                    <button
                      key={prob}
                      type="button"
                      onClick={() => handleToggleProblemChip(prob)}
                      className={`text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                      }`}
                      title={isSelected ? 'Click to remove from ticket' : 'Click to add to ticket'}
                    >
                      {prob}
                    </button>
                  );
                })}

                {/* User's Custom Added Options */}
                {customProblems.map((cProb) => {
                  const isSelected = repairProblem.includes(cProb);
                  return (
                    <div
                      key={cProb}
                      className={`inline-flex items-center text-[10px] rounded border transition-all ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 font-medium'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleProblemChip(cProb)}
                        className="px-2 py-0.5 cursor-pointer flex items-center gap-1"
                        title={isSelected ? 'Click to remove from ticket' : 'Click to add to ticket'}
                      >
                        <span className="text-[9px] opacity-75">★</span>
                        <span>{cProb}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCustomProblem(cProb, e)}
                        className="pr-1.5 pl-0.5 hover:opacity-75 cursor-pointer"
                        title="Delete custom option"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Direct quick button if not already expanded */}
                {!showAddCustomProblem && (
                  <button
                    type="button"
                    onClick={() => setShowAddCustomProblem(true)}
                    className="text-[10px] px-2 py-0.5 rounded border border-dashed border-zinc-300 hover:border-zinc-500 text-zinc-600 hover:text-zinc-900 bg-white cursor-pointer inline-flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+ Custom</span>
                  </button>
                )}
              </div>
            </div>

            {/* Financials & Status */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Pricing & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Total Estimated Cost ({curr}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-mono font-bold"
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Advance Deposit ({curr})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 font-mono"
                    value={repairDeposit}
                    onChange={(e) => setRepairDeposit(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Initial Status
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900"
                    value={repairStatus}
                    onChange={(e) => setRepairStatus(e.target.value as RepairOrder['status'])}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Balance Preview */}
            {parseFloat(repairCost) > 0 && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500">Calculated Balance Due:</span>
                  <p className="text-base font-bold text-zinc-900 font-mono">
                    {curr}{calculatedRepairBalance.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-700 font-medium flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Billing QR will embed {curr}{calculatedRepairBalance.toFixed(2)}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-zinc-100 pt-5">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Save & Generate Repair Ticket</span>
              </button>
            </div>
          </form>
        </div>
    </div>
  );
};
