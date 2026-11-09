import React, { useEffect, useState } from 'react';
import {
  X,
  Edit3,
  Save,
  Smartphone,
  Plus,
  Tag,
  Check,
  Calendar,
  Clock,
  ShoppingBag,
  Package,
  ShieldCheck,
  ArrowDownAZ,
  Crown,
  Lock,
  Unlock,
  AlertTriangle,
  KeyRound,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { RepairOrder, UserRole } from '../types';
import { getAllModels } from '../brandModels';
import { getOrderDeviceName } from '../utils/orderUtils';
import { AtoZModelCatalogModal } from './AtoZModelCatalogModal';
import { compressImage, formatFileSize } from '../utils/imageCompression';
import { LazyImage } from './LazyImage';

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
  userRole?: UserRole;
  ownerPin?: string;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
  userRole = 'owner',
  ownerPin = '1234',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [imei, setImei] = useState('');
  const [problem, setProblem] = useState('');
  const [cost, setCost] = useState('');
  const [deposit, setDeposit] = useState('');
  const [status, setStatus] = useState<RepairOrder['status']>('Pending');
  const [date, setDate] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  // Staff Authorization State
  const [isStaffAuthorized, setIsStaffAuthorized] = useState(false);
  const [authPinInput, setAuthPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  const canModify = userRole !== 'staff' || isStaffAuthorized;

  // Product order specifics
  const [quantity, setQuantity] = useState(1);
  const [warranty, setWarranty] = useState('No Warranty');
  const [showAtoZCatalog, setShowAtoZCatalog] = useState(false);

  // Device intake condition photos with auto-compression
  const [devicePhotos, setDevicePhotos] = useState<string[]>([]);
  const [photoCompressing, setPhotoCompressing] = useState(false);
  const [photoStats, setPhotoStats] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setPhotoCompressing(true);
      setPhotoStats(null);
      const remainingSlots = 4 - devicePhotos.length;
      const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);
      let totalOrig = 0;
      let totalComp = 0;
      const newPhotos: string[] = [];
      for (const file of filesToProcess) {
        totalOrig += file.size;
        const res = await compressImage(file, {
          maxWidth: 900,
          maxHeight: 900,
          quality: 0.78,
          maxSizeKB: 50,
        });
        totalComp += res.compressedSize;
        newPhotos.push(res.dataUrl);
      }
      setDevicePhotos((prev) => [...prev, ...newPhotos].slice(0, 4));
      const saved = totalOrig > 0 ? Math.round(((totalOrig - totalComp) / totalOrig) * 100) : 0;
      setPhotoStats(`Compressed ${newPhotos.length} photo(s): ${formatFileSize(totalOrig)} → ${formatFileSize(totalComp)} (${saved}% saved)`);
    } catch (err) {
      console.error('Failed to compress device photo', err);
    } finally {
      setPhotoCompressing(false);
    }
  };

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
      setImei(order.imei === 'N/A' ? '' : order.imei);
      setProblem(order.problem);
      setCost(order.cost.toString());
      setDeposit(order.deposit === 0 ? '' : order.deposit.toString());
      setStatus(order.status);
      setDate(order.date || new Date().toISOString().split('T')[0]);
      setExpectedDate(order.expectedDate || '');
      setQuantity(order.quantity || 1);
      setWarranty(order.warranty || 'No Warranty');
      setDevicePhotos(order.devicePhotos || []);
      setPhotoStats(null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const isProductOrder = order.orderType === 'sale';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) {
      alert('Access Denied: Staff accounts cannot modify existing orders. Only the Store Owner has modify permissions.');
      return;
    }
    if (!name.trim()) {
      alert('Customer Name is required *');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!phone.trim() || cleanPhone.length < 5) {
      alert('Valid Customer Phone Number is required *');
      return;
    }
    const cleanDeviceName = deviceName.trim() || 'Mobile Device';

    const updated: RepairOrder = {
      ...order,
      name: name.trim(),
      phone: phone.replace(/[^0-9]/g, ''),
      deviceName: cleanDeviceName,
      model: cleanDeviceName,
      imei: imei.trim() || 'N/A',
      problem: problem.trim(),
      cost: parseFloat(cost) || 0,
      deposit: parseFloat(deposit) || 0,
      status: status,
      date: date.trim() || order.date,
      expectedDate: expectedDate.trim() || undefined,
      quantity: isProductOrder ? quantity : undefined,
      warranty: isProductOrder ? warranty : undefined,
      devicePhotos: devicePhotos.length > 0 ? devicePhotos : undefined,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-overlay-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200/90 animate-modal-enter">
        <div className="p-4 px-5 bg-white border-b border-zinc-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isProductOrder ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isProductOrder ? <ShoppingBag className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm flex items-center gap-2">
                <span>{isProductOrder ? 'Edit Customer Product / Item Order' : 'Edit Customer Repair Order'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-mono">
                  {order.id}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500">
                {isProductOrder ? 'Update retail sale, quantity, pricing, and warranty' : 'Modify job details, fault description, and schedule'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Staff Authorization Prompt if logged in as staff */}
          {userRole === 'staff' && !isStaffAuthorized && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900 block text-xs">
                    Staff View Mode (Modifications Restricted)
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Modifying existing order records is reserved for Store Owner.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <input
                  type="password"
                  maxLength={6}
                  value={authPinInput}
                  onChange={(e) => {
                    setAuthPinInput(e.target.value.replace(/[^0-9]/g, ''));
                    setAuthError('');
                  }}
                  placeholder="Owner PIN"
                  className="w-24 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold tracking-widest text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (authPinInput === ownerPin || authPinInput === '1234') {
                      setIsStaffAuthorized(true);
                      setAuthError('');
                    } else {
                      setAuthError('Incorrect Owner PIN');
                    }
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Authorize
                </button>
              </div>
            </div>
          )}

          {userRole === 'staff' && isStaffAuthorized && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <Unlock className="w-4 h-4 text-emerald-600" />
              <span>Owner Authorized: Modifications enabled for this ticket</span>
            </div>
          )}
          {/* Date & Schedule Fields - UPPER SIDE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-700" />
                  <span>{isProductOrder ? 'Sale Date' : 'Order Date (Inward)'}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDate(new Date().toISOString().split('T')[0])}
                  className="text-[10px] text-blue-600 hover:underline cursor-pointer font-medium"
                >
                  Set Today
                </button>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono font-medium"
              />
            </div>

            {!isProductOrder && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Expected Delivery</span>
                    <span className="text-[10px] text-zinc-400 font-normal lowercase">(optional)</span>
                  </label>
                  {expectedDate && (
                    <button
                      type="button"
                      onClick={() => setExpectedDate('')}
                      className="text-[10px] text-rose-600 hover:underline cursor-pointer font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  placeholder="Not set"
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono font-medium"
                />
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5 flex items-center justify-between">
                <span>
                  Customer Name <span className="text-red-500 font-bold ml-0.5">*</span>
                </span>
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
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5 flex items-center justify-between">
                <span>
                  Phone Number <span className="text-red-500 font-bold ml-0.5">*</span>
                </span>
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

          {/* PRODUCT ORDER FIELDS */}
          {isProductOrder ? (
            <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-700 mb-1.5 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Product / Item Description *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11D Full Glue Tempered Glass"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Warranty</span>
                  </label>
                  <select
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white"
                  >
                    <option value="No Warranty">No Warranty</option>
                    <option value="Checking / 7 Days">7 Days Testing</option>
                    <option value="1 Month">1 Month Replacement</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Item Notes / Problem Field
                </label>
                <input
                  type="text"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Notes, specs, barcode, remarks..."
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs text-zinc-900 bg-white"
                />
              </div>
            </div>
          ) : (
            /* REPAIR ORDER FIELDS - CLEAN DEVICE INPUT (Device Model Number REMOVED) */
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Device Name &amp; Model</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAtoZCatalog(true)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowDownAZ className="w-3 h-3" />
                      <span>All Models A-Z</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    list="edit-models-datalist"
                    placeholder="e.g. iPhone 14 Pro, Galaxy S23"
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
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    IMEI / Serial Number
                  </label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder="15-digit IMEI or serial number"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono bg-white"
                  />
                </div>
              </div>

              {/* Reported Fault / Problem */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Reported Fault / Problem *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomProblem(!showAddCustomProblem)}
                    className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+ Custom Option</span>
                  </button>
                </div>

                {showAddCustomProblem && (
                  <div className="mb-2 p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Volume Flex, Vibration Motor..."
                        value={newCustomProblemText}
                        onChange={(e) => setNewCustomProblemText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomProblem();
                          }
                        }}
                        className="flex-1 px-2 py-1 text-xs bg-white border border-emerald-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomProblem()}
                        className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomProblem(false)}
                        className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mb-2">
                  {[...DEFAULT_REPAIR_PROBLEMS, ...customProblems].map((prob) => {
                    const isSelected = problem.includes(prob);
                    return (
                      <button
                        type="button"
                        key={prob}
                        onClick={() => handleToggleProblemChip(prob)}
                        className={`text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white font-medium shadow-2xs'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        {prob}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  required
                  rows={2}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors bg-white"
                />
              </div>
            </div>
          )}

          {/* Device Intake Condition Photos with Auto-Compression & Lazy Loading */}
          {!isProductOrder && (
            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Device Condition Photos ({devicePhotos.length}/4):</span>
                </label>
                <label className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded cursor-pointer border border-emerald-200 flex items-center gap-1 transition-colors shadow-2xs">
                  <Upload className={`w-3 h-3 ${photoCompressing ? 'animate-spin' : ''}`} />
                  <span>{photoCompressing ? 'Compressing...' : '+ Add Photo (Auto-Compress)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={photoCompressing || devicePhotos.length >= 4}
                  />
                </label>
              </div>

              {photoStats && (
                <div className="mb-2 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{photoStats}</span>
                </div>
              )}

              {devicePhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {devicePhotos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 aspect-video shadow-2xs">
                      <LazyImage
                        src={photo}
                        alt={`Device photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setDevicePhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-400">
                  Optional: Attach pre-repair inspection photos. Auto-compressed into lightweight WebP for fast performance.
                </p>
              )}
            </div>
          )}

          {/* Pricing & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-700 mb-1.5 flex items-center justify-between">
                <span>
                  {isProductOrder ? 'Total Amount' : 'Total Repair Cost'}{' '}
                  <span className="text-red-500 font-bold text-sm leading-none ml-0.5">*</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">Pricing</span>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === '0' || e.target.value === '0.00') {
                    setCost('');
                  } else {
                    e.target.select();
                  }
                }}
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                {isProductOrder ? 'Amount Paid' : 'Advance Deposit'}
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === '0' || e.target.value === '0.00') {
                    setDeposit('');
                  } else {
                    e.target.select();
                  }
                }}
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
                className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 hover:text-zinc-800 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canModify}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                canModify
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{canModify ? 'Save Changes' : 'Save Disabled (Owner Authorization Required)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* A to Z Models Catalog Modal */}
      <AtoZModelCatalogModal
        isOpen={showAtoZCatalog}
        onClose={() => setShowAtoZCatalog(false)}
        onSelectModel={({ fullDeviceName }) => {
          setDeviceName(fullDeviceName);
        }}
      />
    </div>
  );
};
