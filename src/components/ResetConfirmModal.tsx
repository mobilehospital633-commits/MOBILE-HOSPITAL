import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
  Download,
  CheckCircle,
  X,
  ShieldAlert,
  Boxes,
  FileText,
  Lock,
} from 'lucide-react';

export type ResetType = 'data' | 'inventory' | 'factory';

interface ResetConfirmModalProps {
  isOpen: boolean;
  type: ResetType;
  onClose: () => void;
  onConfirm: (mode?: 'wipe' | 'default') => void;
  stats: {
    ordersCount: number;
    inventoryCount: number;
    transactionsCount: number;
  };
  onExportBackup?: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  type,
  onClose,
  onConfirm,
  stats,
  onExportBackup,
}) => {
  const [selectedMode, setSelectedMode] = useState<'wipe' | 'default'>('wipe');
  const [confirmInput, setConfirmInput] = useState('');
  const [isExported, setIsExported] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    if (onExportBackup) {
      onExportBackup();
      setIsExported(true);
      setTimeout(() => setIsExported(false), 3000);
    }
  };

  const handleExecuteConfirm = () => {
    if (type === 'factory') {
      if (confirmInput.trim().toUpperCase() !== 'RESET') {
        return;
      }
    }
    onConfirm(selectedMode);
    onClose();
  };

  const config = {
    data: {
      title: 'Data Reset (Repair Orders & Jobs)',
      subtitle: 'Reset customer repair tickets and active workshop jobs',
      icon: FileText,
      accentColor: 'rose',
      impactText: `${stats.ordersCount} repair ticket(s) and customer due records`,
      preserveText: 'Spare parts inventory catalog and shop settings will NOT be touched.',
      options: [
        {
          id: 'wipe',
          title: 'Wipe All Orders (Blank Slate)',
          desc: 'Permanently deletes all repair orders. Counter resets to 0 tickets.',
        },
        {
          id: 'default',
          title: 'Reset to Sample Demo Tickets',
          desc: 'Replaces current orders with 5 standard sample repair jobs.',
        },
      ],
    },
    inventory: {
      title: 'Inventory Reset (Parts & Accessories)',
      subtitle: 'Reset spare parts, screens, batteries, and accessories catalog',
      icon: Boxes,
      accentColor: 'amber',
      impactText: `${stats.inventoryCount} spare parts and stock quantities`,
      preserveText: 'Repair orders, customer dues, and shop settings will NOT be touched.',
      options: [
        {
          id: 'default',
          title: 'Reload Complete Master Parts Catalog (Recommended)',
          desc: 'Restores 70+ smartphone screens, tempered glass, batteries, and accessories.',
        },
        {
          id: 'wipe',
          title: 'Wipe All Inventory to 0 (Empty Shelves)',
          desc: 'Removes all parts from the catalog so you can enter your stock from scratch.',
        },
      ],
    },
    factory: {
      title: 'Full Factory Reset (Master Wipe)',
      subtitle: 'Complete wipe of all records and restoration to factory defaults',
      icon: ShieldAlert,
      accentColor: 'rose',
      impactText: `All ${stats.ordersCount} tickets, ${stats.inventoryCount} parts, ${stats.transactionsCount} cash entries, and custom settings`,
      preserveText: 'This will reset everything including Security PIN back to "1234".',
      options: [
        {
          id: 'default',
          title: 'Factory Default with Clean Demo Set',
          desc: 'Restores shop to initial factory settings, demo sample tickets, and full catalog.',
        },
        {
          id: 'wipe',
          title: 'Total Clean Wipe (Zero Everything)',
          desc: 'Leaves orders at 0, inventory at 0, transactions at 0, and restores default shop profile.',
        },
      ],
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-overlay-fade">
      <div className="bg-white rounded-2xl w-full max-w-md border border-zinc-200 shadow-2xl overflow-hidden animate-modal-enter">
        {/* Header */}
        <div
          className={`p-5 border-b flex items-start justify-between ${
            type === 'factory'
              ? 'bg-rose-50 border-rose-100 text-rose-950'
              : type === 'inventory'
              ? 'bg-amber-50 border-amber-100 text-amber-950'
              : 'bg-zinc-50 border-zinc-100 text-zinc-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                type === 'factory'
                  ? 'bg-rose-600 text-white'
                  : type === 'inventory'
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-900 text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">{config.title}</h3>
              <p className="text-xs opacity-75 mt-0.5">{config.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-black/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs text-zinc-700">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-semibold block">Data Impact Warning:</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                This operation will modify <strong>{config.impactText}</strong>. {config.preserveText}
              </p>
            </div>
          </div>

          {/* Backup recommendation */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <div>
              <span className="font-semibold text-zinc-900 block text-xs">Safety Recommendation</span>
              <span className="text-[11px] text-zinc-500">Download a backup JSON file before proceeding</span>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              {isExported ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Download Backup</span>
                </>
              )}
            </button>
          </div>

          {/* Reset Mode Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-900 block text-xs">Select Reset Mode:</label>
            <div className="space-y-2">
              {config.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedMode === opt.id
                      ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900/10'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="resetMode"
                    value={opt.id}
                    checked={selectedMode === opt.id}
                    onChange={() => setSelectedMode(opt.id as 'wipe' | 'default')}
                    className="mt-0.5 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                  <div>
                    <div className="font-semibold text-zinc-900 text-xs">{opt.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Special Verification for Factory Reset */}
          {type === 'factory' && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-rose-900">
                To confirm Factory Reset, please type <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-rose-800">RESET</span> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type RESET"
                className="w-full border border-rose-300 rounded-lg p-2.5 text-xs uppercase font-mono tracking-widest text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteConfirm}
            disabled={type === 'factory' && confirmInput.trim().toUpperCase() !== 'RESET'}
            className={`px-4 py-2 rounded-lg text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98 ${
              type === 'factory'
                ? confirmInput.trim().toUpperCase() === 'RESET'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-rose-300 cursor-not-allowed'
                : type === 'inventory'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {type === 'factory'
                ? 'Confirm Full Factory Reset'
                : type === 'inventory'
                ? 'Execute Inventory Reset'
                : 'Execute Data Reset'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
