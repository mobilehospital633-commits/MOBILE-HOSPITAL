import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  PlusCircle,
  FileText,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Printer,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Info,
  MapPin,
  Calendar,
  Award,
  Smartphone,
  ShieldCheck,
  Radio,
  HelpCircle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { RepairOrder, ShopProfile, StolenDeviceRecord, StolenDeviceStatus } from '../types';
import { auditImei, cleanImei, formatImeiDisplay, validateLuhn, decodeTac, ImeiAuditResult } from '../utils/imei';

interface StolenPhoneFinderTabProps {
  profile: ShopProfile;
  orders: RepairOrder[];
  stolenRegistry: StolenDeviceRecord[];
  onAddStolenRecord: (record: StolenDeviceRecord) => void;
  onUpdateStolenRecord: (record: StolenDeviceRecord) => void;
  onDeleteStolenRecord: (recordId: string) => void;
  onOpenOrderReceipt?: (orderId: string) => void;
  onOpenDeviceLock?: (order: RepairOrder) => void;
}

export const StolenPhoneFinderTab: React.FC<StolenPhoneFinderTabProps> = ({
  profile,
  orders,
  stolenRegistry,
  onAddStolenRecord,
  onUpdateStolenRecord,
  onDeleteStolenRecord,
  onOpenOrderReceipt,
  onOpenDeviceLock,
}) => {
  const curr = profile.currency || '₹';

  // Search & Lookup state
  const [searchImei, setSearchImei] = useState('');
  const [auditResult, setAuditResult] = useState<ImeiAuditResult | null>(null);
  const [copiedImei, setCopiedImei] = useState<string | null>(null);

  // Table filter state
  const [registryFilter, setRegistryFilter] = useState<'all' | StolenDeviceStatus>('all');
  const [tableSearch, setTableSearch] = useState('');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StolenDeviceRecord | null>(null);
  const [policeSlipRecord, setPoliceSlipRecord] = useState<{
    stolen: StolenDeviceRecord;
    order?: RepairOrder;
  } | null>(null);

  // Cross check in-shop matches
  const inShopMatches = useMemo(() => {
    const matches: { order: RepairOrder; record: StolenDeviceRecord }[] = [];
    orders.forEach((order) => {
      const oImei = cleanImei(order.imei);
      if (!oImei) return;
      const rec = stolenRegistry.find((r) => {
        const p1 = cleanImei(r.imei);
        const p2 = cleanImei(r.imei2 || '');
        return (p1 && p1 === oImei) || (p2 && p2 === oImei);
      });
      if (rec) {
        matches.push({ order, record: rec });
      }
    });
    return matches;
  }, [orders, stolenRegistry]);

  // Execute IMEI search / audit
  const handlePerformAudit = (imeiToTest?: string) => {
    const target = imeiToTest !== undefined ? imeiToTest : searchImei;
    if (!target.trim()) {
      setAuditResult(null);
      return;
    }
    const res = auditImei(target, stolenRegistry, orders);
    setAuditResult(res);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedImei(id);
    setTimeout(() => setCopiedImei(null), 2000);
  };

  // WhatsApp Alert to Owner
  const handleSendWhatsApp = (rec: StolenDeviceRecord) => {
    const phone = rec.ownerPhone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `URGENT NOTICE FROM ${profile.shopName.toUpperCase()}:\n\n` +
      `Dear ${rec.ownerName},\n` +
      `Your reported ${rec.status.toUpperCase()} mobile device (${rec.brand} ${rec.model}, IMEI: ${rec.imei}) ` +
      `registered under Police FIR #${rec.policeFirNumber} has been verified and located at our repair center.\n\n` +
      `Workshop: ${profile.shopName}\n` +
      `Address: ${profile.address}\n` +
      `Phone: ${profile.phone}\n` +
      `Please contact us or the investigating officer at ${rec.policeStation} for recovery verification.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // Filtered Registry List
  const filteredRegistry = useMemo(() => {
    return stolenRegistry.filter((r) => {
      const matchesFilter = registryFilter === 'all' || r.status === registryFilter;
      const q = tableSearch.toLowerCase().trim();
      if (!q) return matchesFilter;

      const matchesQuery =
        r.imei.toLowerCase().includes(q) ||
        (r.imei2 && r.imei2.toLowerCase().includes(q)) ||
        r.model.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.ownerPhone.toLowerCase().includes(q) ||
        r.policeFirNumber.toLowerCase().includes(q) ||
        r.policeStation.toLowerCase().includes(q);

      return matchesFilter && matchesQuery;
    });
  }, [stolenRegistry, registryFilter, tableSearch]);

  // Export Registry as JSON
  const handleExportRegistry = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(stolenRegistry, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `stolen_imei_blacklist_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
              <span>Stolen Phone Finder & IMEI Verification</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wide">
              CEIR & FIR Radar
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time 15-digit IMEI verification, national police FIR lookup, and active workshop bench interception.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportRegistry}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Export Blacklist / Stolen Registry file"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Export Blacklist</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setIsRegisterModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Stolen Phone</span>
          </button>
        </div>
      </div>

      {/* Cross-Check In-Shop Interceptions Banner (Critical Alert) */}
      {inShopMatches.length > 0 && (
        <div className="bg-rose-500 text-white rounded-2xl p-5 shadow-lg border-2 border-rose-600 animate-fadeIn">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white text-rose-600 flex items-center justify-center shrink-0 shadow-md font-black text-xl">
                🚨
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-extrabold tracking-tight uppercase">
                    Critical Police Alert: {inShopMatches.length} Stolen Device{inShopMatches.length > 1 ? 's' : ''} Active on Repair Bench!
                  </span>
                  <span className="bg-rose-900/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-rose-400">
                    Immediate Hold Required
                  </span>
                </div>
                <p className="text-xs text-rose-100 mt-1 max-w-3xl leading-relaxed">
                  A mobile device registered as stolen with Police FIR has been detected in current repair job tickets.
                  Do not release or hand over the device to unauthorized persons. Please contact the investigating officer or notify the genuine owner.
                </p>

                {/* List of in-shop matches */}
                <div className="mt-3 space-y-2">
                  {inShopMatches.map(({ order, record }) => (
                    <div
                      key={order.id}
                      className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">
                          Repair Ticket #{order.id}: {order.model} (IMEI: {order.imei})
                        </span>
                        <span className="block text-rose-100 text-[11px] mt-0.5">
                          Owner: <strong>{record.ownerName}</strong> ({record.ownerPhone}) • FIR #{record.policeFirNumber} ({record.policeStation})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(record)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp Owner</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPoliceSlipRecord({ stolen: record, order })}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-rose-700 text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-rose-700" />
                          <span>Police Custody Slip</span>
                        </button>
                        {onOpenDeviceLock && (
                          <button
                            type="button"
                            onClick={() => onOpenDeviceLock(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Lock className="w-3 h-3 text-rose-400" />
                            <span>Lock Device</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Flagged Records
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-1 flex items-baseline justify-between">
            <span>{stolenRegistry.length}</span>
            <span className="text-xs font-normal text-zinc-500">Tracked IMEIs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs bg-rose-50/20">
          <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Active FIR Stolen</span>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1 flex items-baseline justify-between">
            <span>{stolenRegistry.filter((r) => r.status === 'stolen').length}</span>
            <span className="text-xs font-semibold text-rose-600">Police Cases</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" />
            <span>In-Shop Bench Matches</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 flex items-baseline justify-between">
            <span>{inShopMatches.length}</span>
            <span className="text-xs font-semibold text-amber-700">Workshop Alert</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Recovered & Cleared</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 flex items-baseline justify-between">
            <span>{stolenRegistry.filter((r) => r.status === 'recovered').length}</span>
            <span className="text-xs font-semibold text-emerald-700">Returned to Owner</span>
          </div>
        </div>
      </div>

      {/* Interactive IMEI Finder & Scanner Console */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-600" />
              <span>Instant IMEI Verification & Stolen Radar</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Enter any 15-digit IMEI to verify against FIR police complaints, lost registries, and shop tickets.
            </p>
          </div>

          {/* Preset Test Chips for convenient testing */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Quick Test:</span>
            <button
              type="button"
              onClick={() => {
                setSearchImei('861234567890123');
                handlePerformAudit('861234567890123');
              }}
              className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors cursor-pointer"
            >
              🚨 Stolen OnePlus (In Shop)
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchImei('359402104928371');
                handlePerformAudit('359402104928371');
              }}
              className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors cursor-pointer"
            >
              🚫 Blacklisted iPhone 15
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchImei('356892091234567');
                handlePerformAudit('356892091234567');
              }}
              className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
            >
              ✅ Clean iPhone 13
            </button>
          </div>
        </div>

        {/* Big Search Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePerformAudit();
          }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchImei}
                onChange={(e) => {
                  setSearchImei(e.target.value);
                  if (!e.target.value.trim()) setAuditResult(null);
                }}
                placeholder="Enter or scan 15-digit IMEI (e.g. 861234567890123 / 359402104928371)"
                maxLength={20}
                className="w-full pl-11 pr-24 py-3 border border-zinc-300 rounded-xl text-base font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 focus:outline-none transition-all shadow-2xs tracking-wider"
              />
              {searchImei && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchImei('');
                    setAuditResult(null);
                  }}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 shrink-0"
            >
              <Search className="w-4 h-4 text-rose-400" />
              <span>Verify IMEI Status</span>
            </button>
          </div>

          {/* Real-time input helper info */}
          {searchImei.trim() && (
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
              <div className="flex items-center gap-2">
                <span>Digits: <strong>{cleanImei(searchImei).length}/15</strong></span>
                <span>•</span>
                {cleanImei(searchImei).length === 15 ? (
                  <span className={`font-semibold ${validateLuhn(searchImei) ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {validateLuhn(searchImei) ? '✓ Valid GSM Luhn Checksum' : '⚠ Luhn Checksum Mismatch (Verify digits)'}
                  </span>
                ) : (
                  <span className="text-zinc-400">15 digits standard format required</span>
                )}
              </div>
              <div className="font-mono text-[11px] text-zinc-400">
                TAC Brand Hint: {decodeTac(searchImei).brand}
              </div>
            </div>
          )}
        </form>

        {/* AUDIT DIAGNOSTIC CARD RESULT */}
        {auditResult && (
          <div className="mt-5 animate-fadeIn">
            {/* STOLEN / BLACKLISTED / MATCHED REPORT */}
            {auditResult.stolenRecord ? (
              <div className="rounded-xl border-2 border-rose-500 bg-rose-50/50 p-5 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-rose-900 uppercase tracking-tight">
                          🚨 ALERT: MATCHED IN POLICE / STOLEN DATABASE
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-rose-600 text-white shadow-2xs">
                          {auditResult.stolenRecord.status.toUpperCase()}
                        </span>
                        {auditResult.riskLevel === 'IN_SHOP_MATCH' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-500 text-white shadow-2xs">
                            PHYSICALLY IN SHOP BENCH
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-rose-700 font-mono mt-0.5">
                        IMEI: <strong>{auditResult.formattedImei}</strong> (TAC: {auditResult.tacInfo.tac})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(auditResult.stolenRecord!)}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Alert Owner (WhatsApp)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoliceSlipRecord({
                        stolen: auditResult.stolenRecord!,
                        order: auditResult.matchedOrders[0],
                      })}
                      className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Police Custody Notice</span>
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                  {/* Police FIR Info */}
                  <div className="bg-white p-3.5 rounded-lg border border-rose-200">
                    <div className="font-bold text-rose-900 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>Police FIR & Case Registration</span>
                    </div>
                    <div className="space-y-1.5 text-zinc-700">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">FIR / Complaint Number:</span>
                        <span className="font-bold text-rose-700 font-mono text-sm">
                          {auditResult.stolenRecord.policeFirNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Police Station:</span>
                        <span className="font-semibold text-zinc-900">
                          {auditResult.stolenRecord.policeStation}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Incident Date & Location:</span>
                        <span>{auditResult.stolenRecord.incidentDate} • {auditResult.stolenRecord.incidentLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registered Device Specs */}
                  <div className="bg-white p-3.5 rounded-lg border border-rose-200">
                    <div className="font-bold text-rose-900 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                      <span>Device Identification</span>
                    </div>
                    <div className="space-y-1.5 text-zinc-700">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Make & Model:</span>
                        <span className="font-bold text-zinc-900 text-sm">
                          {auditResult.stolenRecord.brand} {auditResult.stolenRecord.model}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Color & Serial:</span>
                        <span>{auditResult.stolenRecord.color || 'N/A'} • {auditResult.stolenRecord.serialNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">TAC Hardware Profile:</span>
                        <span className="text-zinc-600">{auditResult.tacInfo.modelFamily} ({auditResult.tacInfo.marketRegion})</span>
                      </div>
                    </div>
                  </div>

                  {/* Genuine Owner Details */}
                  <div className="bg-white p-3.5 rounded-lg border border-rose-200">
                    <div className="font-bold text-rose-900 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-rose-600" />
                      <span>Genuine Owner Information</span>
                    </div>
                    <div className="space-y-1.5 text-zinc-700">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Owner Name:</span>
                        <span className="font-bold text-zinc-900 text-sm">
                          {auditResult.stolenRecord.ownerName}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Contact Phone:</span>
                        <a
                          href={`tel:${auditResult.stolenRecord.ownerPhone}`}
                          className="font-bold text-rose-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{auditResult.stolenRecord.ownerPhone}</span>
                        </a>
                      </div>
                      {auditResult.stolenRecord.rewardAmount ? (
                        <div className="pt-1">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] inline-flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-700" />
                            <span>Recovery Reward: {curr}{auditResult.stolenRecord.rewardAmount}</span>
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Special Workshop Guidance Notice */}
                <div className="mt-3.5 p-3 rounded-lg bg-rose-100/70 border border-rose-300 text-rose-950 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Standard Workshop Legal Protocol:</strong> Do not tamper with IMEI, perform software flashing, or release this device to customers without clearance from the investigating police station ({auditResult.stolenRecord.policeStation}). Generate the Police Custody Notice above.
                  </div>
                </div>
              </div>
            ) : (
              /* CLEAN IMEI RESULT */
              <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/50 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-emerald-950 uppercase tracking-tight">
                          ✓ IMEI VERIFIED CLEAN & UNFLAGGED
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-600 text-white shadow-2xs">
                          NO THEFT RECORD
                        </span>
                      </div>
                      <div className="text-xs text-emerald-800 font-mono mt-0.5">
                        IMEI: <strong>{auditResult.formattedImei}</strong> • Luhn GSM Check: <span className="font-bold text-emerald-700">PASSED</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-zinc-500 block">Hardware TAC Match:</span>
                    <span className="text-xs font-bold text-zinc-900">{auditResult.tacInfo.brand} ({auditResult.tacInfo.modelFamily})</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-emerald-900">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">CEIR Registry Status:</span>
                    <strong className="text-emerald-700">Clean & Whitelisted</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Shop Benchmark Orders:</span>
                    <strong>{auditResult.matchedOrders.length} previous job(s) recorded</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Safety Verification Time:</span>
                    <span>{new Date().toLocaleTimeString()} (Safe for Repair)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STOLEN & BLACKLISTED PHONES REGISTRY TABLE */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Stolen & Blacklisted Device Registry ({filteredRegistry.length})</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tracked loss reports, FIR records, and recovered handsets.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter pills */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 text-xs shadow-2xs">
              {(['all', 'stolen', 'blacklisted', 'lost', 'recovered'] as const).map((filterVal) => (
                <button
                  key={filterVal}
                  type="button"
                  onClick={() => setRegistryFilter(filterVal)}
                  className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-colors cursor-pointer ${
                    registryFilter === filterVal
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {filterVal}
                </button>
              ))}
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search IMEI, FIR, Owner..."
                className="pl-8 pr-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/70 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Device & 15-Digit IMEI</th>
                <th className="py-3 px-4">Police FIR & Station</th>
                <th className="py-3 px-4">Owner & Contact</th>
                <th className="py-3 px-4">Loss Location & Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredRegistry.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                    No stolen or blacklisted devices found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRegistry.map((rec) => {
                  const isInShop = inShopMatches.some((m) => m.record.id === rec.id);

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        isInShop ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Device & IMEI */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                          <span>{rec.brand} {rec.model}</span>
                          {isInShop && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                              In Shop!
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] font-semibold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                            {formatImeiDisplay(rec.imei)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(rec.imei, rec.id)}
                            className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                            title="Copy IMEI"
                          >
                            {copiedImei === rec.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {rec.imei2 && (
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            Slot 2: {formatImeiDisplay(rec.imei2)}
                          </div>
                        )}
                      </td>

                      {/* Police FIR */}
                      <td className="py-3 px-4 text-zinc-700">
                        <span className="font-bold text-rose-700 font-mono block">
                          {rec.policeFirNumber}
                        </span>
                        <span className="text-[11px] text-zinc-600 block mt-0.5">
                          {rec.policeStation}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-900 block">{rec.ownerName}</span>
                        <a
                          href={`tel:${rec.ownerPhone}`}
                          className="text-zinc-500 hover:text-rose-700 font-mono text-[11px] block mt-0.5"
                        >
                          {rec.ownerPhone}
                        </a>
                      </td>

                      {/* Location & Date */}
                      <td className="py-3 px-4 text-zinc-600">
                        <span className="block truncate max-w-[160px] font-medium text-zinc-800">
                          {rec.incidentLocation}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{rec.incidentDate}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            rec.status === 'stolen'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : rec.status === 'blacklisted'
                              ? 'bg-zinc-900 text-white'
                              : rec.status === 'lost'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {rec.status === 'stolen' && <ShieldAlert className="w-2.5 h-2.5" />}
                          {rec.status === 'recovered' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          <span>{rec.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp alert button */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(rec)}
                            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-700 transition-colors cursor-pointer"
                            title="WhatsApp Alert to Owner"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Police slip */}
                          <button
                            type="button"
                            onClick={() => setPoliceSlipRecord({
                              stolen: rec,
                              order: orders.find((o) => cleanImei(o.imei) === cleanImei(rec.imei)),
                            })}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-700 transition-colors cursor-pointer"
                            title="Print Police Handover Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Recovered */}
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStolenRecord({
                                ...rec,
                                status: rec.status === 'recovered' ? 'stolen' : 'recovered',
                              });
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              rec.status === 'recovered'
                                ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            title={rec.status === 'recovered' ? 'Mark Unrecovered' : 'Mark as Recovered'}
                          >
                            {rec.status === 'recovered' ? 'Reopen' : 'Recovered'}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecord(rec);
                              setIsRegisterModalOpen(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                            title="Edit Report"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove FIR #${rec.policeFirNumber} (IMEI: ${rec.imei}) from registry?`)) {
                                onDeleteStolenRecord(rec.id);
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Record"
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

      {/* REGISTER / EDIT STOLEN PHONE MODAL */}
      {isRegisterModalOpen && (
        <RegisterStolenModal
          isOpen={isRegisterModalOpen}
          initialRecord={editingRecord}
          onClose={() => {
            setIsRegisterModalOpen(false);
            setEditingRecord(null);
          }}
          onSave={(record) => {
            if (editingRecord) {
              onUpdateStolenRecord(record);
            } else {
              onAddStolenRecord(record);
            }
            setIsRegisterModalOpen(false);
            setEditingRecord(null);
          }}
        />
      )}

      {/* POLICE INTIMATION & HANDOVER FORM MODAL */}
      {policeSlipRecord && (
        <PoliceHandoverSlipModal
          isOpen={!!policeSlipRecord}
          stolen={policeSlipRecord.stolen}
          order={policeSlipRecord.order}
          profile={profile}
          onClose={() => setPoliceSlipRecord(null)}
        />
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODAL: REGISTER / EDIT STOLEN PHONE
// -------------------------------------------------------------
interface RegisterStolenModalProps {
  isOpen: boolean;
  initialRecord: StolenDeviceRecord | null;
  onClose: () => void;
  onSave: (record: StolenDeviceRecord) => void;
}

const RegisterStolenModal: React.FC<RegisterStolenModalProps> = ({
  isOpen,
  initialRecord,
  onClose,
  onSave,
}) => {
  const [imei, setImei] = useState(initialRecord?.imei || '');
  const [imei2, setImei2] = useState(initialRecord?.imei2 || '');
  const [brand, setBrand] = useState(initialRecord?.brand || '');
  const [model, setModel] = useState(initialRecord?.model || '');
  const [color, setColor] = useState(initialRecord?.color || '');
  const [serialNumber, setSerialNumber] = useState(initialRecord?.serialNumber || '');
  const [policeFirNumber, setPoliceFirNumber] = useState(initialRecord?.policeFirNumber || '');
  const [policeStation, setPoliceStation] = useState(initialRecord?.policeStation || '');
  const [incidentDate, setIncidentDate] = useState(initialRecord?.incidentDate || new Date().toISOString().split('T')[0]);
  const [incidentLocation, setIncidentLocation] = useState(initialRecord?.incidentLocation || '');
  const [ownerName, setOwnerName] = useState(initialRecord?.ownerName || '');
  const [ownerPhone, setOwnerPhone] = useState(initialRecord?.ownerPhone || '');
  const [alternateContact, setAlternateContact] = useState(initialRecord?.alternateContact || '');
  const [rewardAmount, setRewardAmount] = useState(initialRecord?.rewardAmount ? String(initialRecord.rewardAmount) : '');
  const [status, setStatus] = useState<StolenDeviceStatus>(initialRecord?.status || 'stolen');
  const [notes, setNotes] = useState(initialRecord?.notes || '');

  // Auto-detect brand/model from TAC when typing IMEI
  const handleImeiChange = (val: string) => {
    setImei(val);
    const cleaned = cleanImei(val);
    if (cleaned.length >= 8 && !brand) {
      const tac = decodeTac(cleaned);
      if (tac.brand !== 'Generic GSM Device') {
        setBrand(tac.brand);
        if (!model) setModel(tac.modelFamily);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrimary = cleanImei(imei);
    if (!cleanPrimary || cleanPrimary.length < 14) {
      alert('Please provide a valid 15-digit primary IMEI.');
      return;
    }
    if (!policeFirNumber.trim() || !policeStation.trim() || !ownerName.trim() || !ownerPhone.trim()) {
      alert('Please fill out all mandatory FIR and Owner details marked with *.');
      return;
    }

    const rec: StolenDeviceRecord = {
      id: initialRecord?.id || 'ST-' + Math.floor(100 + Math.random() * 900),
      imei: cleanPrimary,
      imei2: imei2 ? cleanImei(imei2) : undefined,
      brand: brand.trim() || 'Smartphone',
      model: model.trim() || 'Handset',
      color: color.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      policeFirNumber: policeFirNumber.trim(),
      policeStation: policeStation.trim(),
      reportingDate: initialRecord?.reportingDate || new Date().toISOString().split('T')[0],
      incidentDate: incidentDate || new Date().toISOString().split('T')[0],
      incidentLocation: incidentLocation.trim() || 'Unspecified location',
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      alternateContact: alternateContact.trim() || undefined,
      rewardAmount: rewardAmount ? parseFloat(rewardAmount) || 0 : undefined,
      status,
      reportedBy: initialRecord?.reportedBy || 'Workshop FIR Intimation Log',
      notes: notes.trim() || undefined,
    };

    onSave(rec);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden my-6">
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {initialRecord ? 'Edit Stolen / Blacklist Record' : 'Register Stolen or Lost Mobile'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Logged to workshop central IMEI blacklist radar & police database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Incident Classification Status *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'stolen', label: 'Reported Stolen', desc: 'Snatched / Theft' },
                { id: 'blacklisted', label: 'Blacklisted (CEIR)', desc: 'Carrier Barred' },
                { id: 'lost', label: 'Reported Lost', desc: 'Misplaced Device' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as StolenDeviceStatus)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    status === s.id
                      ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold shadow-2xs'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }`}
                >
                  <div className="text-xs">{s.label}</div>
                  <div className="text-[10px] text-zinc-400">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* IMEI Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Primary IMEI (15 Digits) *
              </label>
              <input
                type="text"
                required
                value={imei}
                onChange={(e) => handleImeiChange(e.target.value)}
                placeholder="e.g. 359402104928371"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Secondary IMEI (Dual SIM / eSIM)
              </label>
              <input
                type="text"
                value={imei2}
                onChange={(e) => setImei2(e.target.value)}
                placeholder="e.g. 359402104928372"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Device Model & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Brand *
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Apple / Samsung / OnePlus"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Model Name *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="iPhone 15 Pro Max / S23"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Black / Titanium"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="F2LLM9930192"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Police FIR Details */}
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Police FIR & Case Registration Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Police FIR / Complaint Number *
                </label>
                <input
                  type="text"
                  required
                  value={policeFirNumber}
                  onChange={(e) => setPoliceFirNumber(e.target.value)}
                  placeholder="e.g. FIR-2026/894-CZ"
                  className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-mono font-bold text-rose-800 focus:border-rose-900 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Police Station & Jurisdiction *
                </label>
                <input
                  type="text"
                  required
                  value={policeStation}
                  onChange={(e) => setPoliceStation(e.target.value)}
                  placeholder="e.g. Cyber Crime PS, Sector 17"
                  className="w-full border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:border-rose-900 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Incident Date
                </label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:border-rose-900 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Incident Location
                </label>
                <input
                  type="text"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  placeholder="e.g. Metro Station Gate 3"
                  className="w-full border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:border-rose-900 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Genuine Owner Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Owner Full Name *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Vikram Malhotra"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Primary Phone *
              </label>
              <input
                type="text"
                required
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+91 98200 44556"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Recovery Reward (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Investigation Notes / Identifying Marks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Minor dent on bottom left corner, clear silicon case, cracked rear glass..."
              className="w-full border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 text-xs font-semibold hover:bg-zinc-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
            >
              {initialRecord ? 'Save Changes' : 'Register Stolen Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MODAL: PRINTABLE POLICE INTIMATION & CUSTODY HANDOVER SLIP
// -------------------------------------------------------------
interface PoliceHandoverSlipModalProps {
  isOpen: boolean;
  stolen: StolenDeviceRecord;
  order?: RepairOrder;
  profile: ShopProfile;
  onClose: () => void;
}

const PoliceHandoverSlipModal: React.FC<PoliceHandoverSlipModalProps> = ({
  isOpen,
  stolen,
  order,
  profile,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-zinc-300 shadow-2xl w-full max-w-3xl overflow-hidden my-6">
        {/* Modal Toolbar (hidden on print) */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-bold">Police Intimation & Custody Handover Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 font-serif text-zinc-900 text-sm space-y-6 bg-white" id="police-intimation-slip">
          {/* Header */}
          <div className="text-center border-b-2 border-zinc-900 pb-4">
            <div className="text-xl font-bold tracking-wider uppercase font-sans text-zinc-950">
              {profile.shopName}
            </div>
            <div className="text-xs text-zinc-600 mt-0.5 font-sans">
              Authorized Mobile Hardware Repair, Flashing & Diagnostic Bench
            </div>
            <div className="text-[11px] text-zinc-500 font-sans mt-0.5">
              {profile.address} • Phone: {profile.phone} • Email: {profile.email}
              {profile.gst && ` • GSTIN: ${profile.gst}`}
            </div>
            <div className="mt-3 inline-block px-4 py-1 rounded bg-zinc-950 text-white text-xs font-sans font-bold uppercase tracking-widest">
              CONFIDENTIAL: POLICE INTIMATION & EVIDENCE CUSTODY FORM
            </div>
          </div>

          {/* Reference line */}
          <div className="flex justify-between items-start text-xs font-sans border-b border-zinc-200 pb-3">
            <div>
              <div><strong>To:</strong> The Station House Officer / Investigating Officer (I.O.)</div>
              <div className="text-zinc-700">{stolen.policeStation}</div>
            </div>
            <div className="text-right">
              <div><strong>Doc Ref:</strong> MH-POL/{stolen.id}/{new Date().getFullYear()}</div>
              <div><strong>Date of Handover:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* FIR Subject */}
          <div className="text-xs font-sans space-y-1">
            <p>
              <strong>Subject:</strong> Intimation regarding physical identification and custody of reported stolen mobile handset under <strong>FIR #{stolen.policeFirNumber}</strong>.
            </p>
            <p className="text-zinc-700 leading-relaxed">
              This is to formally notify the investigating agency that the mobile device described below has been intercepted and verified by our workshop bench during IMEI scan protocol.
            </p>
          </div>

          {/* Handset Specifications Box */}
          <div className="border border-zinc-900 rounded-lg p-4 font-sans text-xs space-y-2 bg-zinc-50">
            <div className="font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1 text-[11px]">
              1. Intercepted Handset Specifications
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-zinc-500 block text-[10px]">Primary IMEI:</span>
                <strong className="font-mono text-sm">{formatImeiDisplay(stolen.imei)}</strong>
              </div>
              {stolen.imei2 && (
                <div>
                  <span className="text-zinc-500 block text-[10px]">Secondary IMEI:</span>
                  <strong className="font-mono text-sm">{formatImeiDisplay(stolen.imei2)}</strong>
                </div>
              )}
              <div>
                <span className="text-zinc-500 block text-[10px]">Brand & Model:</span>
                <strong className="text-zinc-900">{stolen.brand} {stolen.model}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Color & Serial No:</span>
                <span>{stolen.color || 'Standard'} • {stolen.serialNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Theft & Complainant Record */}
          <div className="border border-zinc-300 rounded-lg p-4 font-sans text-xs space-y-2">
            <div className="font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 text-[11px]">
              2. Police FIR & Registered Owner Record
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-zinc-500 block text-[10px]">FIR / Crime Branch Diary:</span>
                <strong className="text-rose-800 font-mono">{stolen.policeFirNumber}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Police Station:</span>
                <span>{stolen.policeStation}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Registered Owner Name:</span>
                <strong>{stolen.ownerName}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Owner Registered Contact:</span>
                <span>{stolen.ownerPhone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-500 block text-[10px]">Incident Reported:</span>
                <span>{stolen.incidentDate} at {stolen.incidentLocation}</span>
              </div>
            </div>
          </div>

          {/* If presented in workshop by someone */}
          {order && (
            <div className="border border-amber-300 bg-amber-50/40 rounded-lg p-4 font-sans text-xs space-y-2">
              <div className="font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-1 text-[11px]">
                3. Individual Presenting Handset at Workshop Bench
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Presenter Name:</span>
                  <strong>{order.name}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Presenter Contact:</span>
                  <strong>{order.phone}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Workshop Ticket ID:</span>
                  <span className="font-mono">{order.id}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Claimed Defect:</span>
                  <span>{order.problem}</span>
                </div>
              </div>
            </div>
          )}

          {/* Legal Declaration */}
          <div className="text-[11px] font-sans text-zinc-600 leading-relaxed border-t border-zinc-200 pt-3">
            <strong>Declaration of Custody:</strong> We hereby declare that the physical device has been detained under secure lock at our repair facility pending lawful handover to the designated Police Officer or rightful owner upon valid production of identity and purchase invoice.
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 font-sans text-xs border-t border-zinc-900 mt-6">
            <div className="space-y-6">
              <div className="h-10 border-b border-dashed border-zinc-400"></div>
              <div>
                <strong>Workshop Bench Manager / Technician</strong>
                <div className="text-[10px] text-zinc-500">{profile.shopName} (Shop Stamp & Seal)</div>
              </div>
            </div>
            <div className="space-y-6 text-right">
              <div className="h-10 border-b border-dashed border-zinc-400"></div>
              <div>
                <strong>Receiving Police Officer / Investigating Officer</strong>
                <div className="text-[10px] text-zinc-500">Name, Rank, Badge No. & Station Seal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
