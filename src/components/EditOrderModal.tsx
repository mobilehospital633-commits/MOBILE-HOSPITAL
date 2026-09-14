import React, { useEffect, useState } from 'react';
import { X, Edit3, Save, Smartphone, Hash, Plus, Tag, Check } from 'lucide-react';
import { RepairOrder } from '../types';
import { getAllModels } from '../brandModels';
import { getOrderDeviceName, getOrderModelNumber, getModelNumberSuggestions } from '../utils/orderUtils';

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

interface EditOrderModalProps {
  order: RepairOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: RepairOrder) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [imei, setImei] = useState('');
  const [problem, setProblem] = useState('');
  const [cost, setCost] = useState('');
  const [deposit, setDeposit] = useState('');
  const [status, setStatus] = useState<RepairOrder['status']>('Pending');

  // Custom added problem options state
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
    setProblem((prev) => (prev.trim() ? `${prev.trim()}, ${trimmed}` : trimmed));
    setNewCustomProblemText('');
    setShowAddCustomProblem(false);
  };

  const handleToggleProblemChip = (prob: string) => {
    setProblem((prev) => {
      if (!prev.trim()) return prob;
      if (prev.includes(prob)) {
        const parts = prev.split(',').map((s) => s.trim()).filter((s) => s !== prob && s.length > 0);
        return parts.join(', ');
      } else {
        return `${prev.trim()}, ${prob}`;
      }
    });
  };

  useEffect(() => {
    if (order) {
      setName(order.name);
      setPhone(order.phone);
      setDeviceName(getOrderDeviceName(order));
      setModelNumber(getOrderModelNumber(order));
      setImei(order.imei === 'N/A' ? '' : order.imei);
      setProblem(order.problem);
      setCost(order.cost.toString());
      setDeposit(order.deposit.toString());
      setStatus(order.status);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDeviceName = deviceName.trim();
    const cleanModelNumber = modelNumber.trim();
    const combinedModel = cleanModelNumber
      ? `${cleanDeviceName} (${cleanModelNumber})`
      : cleanDeviceName;

    const updated: RepairOrder = {
      ...order,
      name: name.trim(),
      phone: phone.replace(/[^0-9]/g, ''),
      deviceName: cleanDeviceName,
      modelNumber: cleanModelNumber,
      model: combinedModel,
      imei: imei.trim() || 'N/A',
      problem: problem.trim(),
      cost: parseFloat(cost) || 0,
      deposit: parseFloat(deposit) || 0,
      status: status,
    };
    onSave(updated);
    onClose();
  };

  const modelSuggestions = getModelNumberSuggestions(deviceName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200">
        <div className="p-4 px-5 bg-white border-b border-zinc-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-zinc-900" />
            <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
              Edit Repair Order ({order.id})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
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
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          {/* Separate Device Name and Device Model Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                <span>Device Name / Brand *</span>
              </label>
              <input
                type="text"
                list="edit-models-datalist"
                required
                placeholder="e.g. iPhone 14 Pro"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors bg-white"
              />
              <datalist id="edit-models-datalist">
                {getAllModels().map((m) => (
                  <option key={`${m.brand}-${m.model}`} value={m.model} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                <span>Device Model Number</span>
                <span className="text-[10px] text-zinc-400 font-normal lowercase">(hardware code)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. A2890, SM-S911B"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors bg-white font-mono"
              />
              {modelSuggestions.length > 0 && !modelNumber && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-400">Suggest:</span>
                  {modelSuggestions.slice(0, 3).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setModelNumber(num)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/70 hover:bg-zinc-300 text-zinc-700 font-mono transition-colors cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                IMEI / Serial Number
              </label>
              <input
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                placeholder="15-digit IMEI or hardware serial number"
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Reported Fault / Problem *
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
              <div className="mb-2.5 p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add Custom Repair Problem / Service</span>
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
                    placeholder="e.g. SIM Card Reader, Volume Flex, Face ID..."
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
              </div>
            )}

            <textarea
              rows={2}
              required
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
            />

            {/* Quick Problem Chips */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-zinc-400 font-medium">Quick Options:</span>
              {DEFAULT_REPAIR_PROBLEMS.map((prob) => {
                const isSelected = problem.includes(prob);
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
                  >
                    {prob}
                  </button>
                );
              })}

              {customProblems.map((cProb) => {
                const isSelected = problem.includes(cProb);
                return (
                  <button
                    key={cProb}
                    type="button"
                    onClick={() => handleToggleProblemChip(cProb)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 font-medium'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <span className="text-[9px] opacity-75">★</span>
                    <span>{cProb}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Estimated Cost *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Advance Deposit
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RepairOrder['status'])}
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm focus:border-zinc-900 focus:outline-none transition-colors bg-white cursor-pointer text-zinc-800"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
