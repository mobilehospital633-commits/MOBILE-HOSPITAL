import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Download,
  Copy,
  QrCode,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';
import { RepairOrder, ShopProfile } from '../types';
import { generateQrCodeDataUrl, getBillingQrPayload } from '../utils/qr';
import { MHLogo } from './MHLogo';

interface ReceiptModalProps {
  order: RepairOrder | null;
  profile: ShopProfile;
  isOpen: boolean;
  onClose: () => void;
  onClearBalance: (orderId: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  profile,
  isOpen,
  onClose,
  onClearBalance,
}) => {
  const [receiptStyle, setReceiptStyle] = useState<'thermal' | 'invoice'>('thermal');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const balance = order ? Math.max(0, order.cost - order.deposit) : 0;
  const curr = profile.currency || '₹';

  // Tax calculations
  const taxRate = profile.taxRate || 0;
  const hasTax = profile.showTaxOnReceipt && taxRate > 0;
  const subtotal = order ? (hasTax ? order.cost / (1 + taxRate / 100) : order.cost) : 0;
  const taxAmount = order ? (hasTax ? order.cost - subtotal : 0) : 0;

  useEffect(() => {
    if (!order) return;
    const { text } = getBillingQrPayload(order, profile);
    generateQrCodeDataUrl(text, { width: 220, margin: 1 }).then((url) => {
      setQrDataUrl(url);
    });
  }, [order, profile]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTextBill = () => {
    const text = `*${profile.shopName} - Repair Bill*
Ticket ID: ${order.id}
Date: ${order.date}
Customer: ${order.name} (${order.phone})
Device: ${order.model}
IMEI/SN: ${order.imei || 'N/A'}
Reported Issue: ${order.problem}
Status: ${order.status}
---------------------------
Total Cost: ${curr}${order.cost.toFixed(2)}
Deposit Paid: ${curr}${order.deposit.toFixed(2)}
Balance Due: ${curr}${balance.toFixed(2)}
${profile.upi ? `Pay via UPI: ${profile.upi}` : ''}
Thank you for visiting ${profile.shopName}!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const balanceText = balance > 0 ? `\n*Balance Due: ${curr}${balance.toFixed(2)}*` : `\n*Status: PAID IN FULL*`;
    const upiNote = profile.upi && balance > 0 ? `\n💳 *Pay online via UPI:* ${profile.upi}` : '';

    const text = `🏥 *${profile.shopName.toUpperCase()} REPAIR RECEIPT* 🏥
──────────────────────
Ticket ID: *${order.id}*
Date: ${order.date}
Customer: ${order.name}
Device: *${order.model}*
Issue: ${order.problem}
Status: *${order.status}*
──────────────────────
Est. Total: ${curr}${order.cost.toFixed(2)}
Deposit Paid: ${curr}${order.deposit.toFixed(2)}${balanceText}${upiNote}
──────────────────────
Please present this ticket ID during pickup.
Thank you for choosing ${profile.shopName}!`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div
      id="receiptModal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[94vh] my-auto border border-zinc-200">
        
        {/* Header bar */}
        <div className="px-5 py-3.5 bg-white border-b border-zinc-200 text-zinc-900 flex justify-between items-center no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center text-white text-xs font-semibold shadow-2xs">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 tracking-tight leading-tight">Customer Repair Receipt</h3>
              <p className="text-[11px] text-zinc-500">Includes live customer billing QR code</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Style Switcher */}
            <div className="bg-zinc-100 p-0.5 rounded-lg flex text-xs border border-zinc-200/70">
              <button
                type="button"
                onClick={() => setReceiptStyle('thermal')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  receiptStyle === 'thermal'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
                title="80mm Thermal Receipt Format"
              >
                Thermal Slip
              </button>
              <button
                type="button"
                onClick={() => setReceiptStyle('invoice')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  receiptStyle === 'invoice'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
                title="Detailed Tax Invoice Format"
              >
                Tax Invoice
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-zinc-50 flex-1 flex justify-center items-start">
          
          {/* THERMAL STYLE */}
          {receiptStyle === 'thermal' ? (
            <div
              id="printableReceipt"
              className="bg-white w-full max-w-[370px] shadow-2xs rounded-xl p-5 sm:p-6 border border-zinc-200 font-mono text-xs text-zinc-800"
            >
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-zinc-300 flex flex-col items-center">
                <MHLogo
                  customUrl={profile.logoUrl}
                  size="md"
                  rounded="lg"
                  theme="receipt"
                  className="mb-1.5"
                />
                <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 leading-tight">
                  {profile.shopName}
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5 max-w-[260px] leading-tight">
                  {profile.address || 'Smart Repair & Tech Services'}
                </p>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Ph: {profile.phone}
                </p>
                {profile.email && (
                  <p className="text-[10px] text-zinc-400">{profile.email}</p>
                )}
                {profile.gst && (
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {profile.taxLabel || 'GSTIN'}: {profile.gst}
                  </p>
                )}
                <div className="mt-2 inline-block px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-medium text-zinc-700 uppercase tracking-wider">
                  Repair Job Card & Billing Slip
                </div>
              </div>

              {/* Order Meta */}
              <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Ticket #:</span>
                  <span className="font-bold text-zinc-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Date:</span>
                  <span className="text-zinc-700">{order.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Customer:</span>
                  <span className="font-bold text-zinc-800">{order.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Phone:</span>
                  <span className="text-zinc-700">{order.phone}</span>
                </div>
              </div>

              {/* Device & Fault */}
              <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Device:</span>
                  <span className="font-bold text-zinc-900 text-right">{order.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">IMEI/SN:</span>
                  <span className="text-zinc-700">{order.imei || 'N/A'}</span>
                </div>
                <div className="mt-1 pt-1 border-t border-dotted border-zinc-200">
                  <span className="text-zinc-400 uppercase text-[10px] font-semibold">Reported Fault:</span>
                  <p className="text-zinc-800 italic mt-0.5 bg-zinc-50 p-1.5 rounded text-[11px] leading-relaxed border border-zinc-100">
                    {order.problem}
                  </p>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1.5 text-[11px]">
                {hasTax && (
                  <>
                    <div className="flex justify-between text-zinc-600">
                      <span>Subtotal (Excl. Tax):</span>
                      <span>{curr}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>{profile.taxLabel || 'Tax'} ({taxRate}%):</span>
                      <span>{curr}{taxAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-xs font-bold text-zinc-900 pt-0.5">
                  <span>Est. Total Amount:</span>
                  <span>{curr}{order.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Advance Paid:</span>
                  <span className="text-emerald-700 font-medium">{curr}{order.deposit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-dotted border-zinc-300">
                  <span className="uppercase tracking-wider">Balance Due:</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${balance > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {curr}{balance.toFixed(2)}
                  </span>
                </div>

                {/* Device Payment Lock Status Banner */}
                {order.isDeviceLocked && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[10px] space-y-0.5">
                    <div className="font-extrabold flex items-center gap-1 text-rose-700">
                      <Lock className="w-3 h-3 text-rose-600" />
                      <span>DEVICE PAYMENT HOLD: LOCKED</span>
                    </div>
                    <p className="leading-tight text-rose-800">
                      Device (IMEI: {order.imei}) is locked for unpaid repair balance. Release code will be provided upon clearance.
                    </p>
                  </div>
                )}
                {!order.isDeviceLocked && order.unlockCode && (
                  <div className="mt-2 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>DEVICE UNLOCKED • Release PIN: {order.unlockCode}</span>
                  </div>
                )}
              </div>

              {/* CUSTOMER BILLING QR SECTION */}
              {profile.includeBillingQr && (
                <div className="my-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase mb-1.5">
                    <QrCode className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Customer Billing QR Code</span>
                  </div>

                  {qrDataUrl ? (
                    <div className="bg-white p-2 rounded-lg border border-zinc-200 shadow-2xs">
                      <img
                        src={qrDataUrl}
                        alt="Customer Billing QR"
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-zinc-200 animate-pulse rounded-lg" />
                  )}

                  {balance > 0 ? (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-[11px] font-semibold text-zinc-900">
                        Scan with any UPI / Banking App
                      </p>
                      <p className="text-[10px] text-zinc-500 font-sans">
                        Pay balance: <strong className="text-rose-600 font-mono">{curr}{balance.toFixed(2)}</strong>
                      </p>
                      {profile.upi && (
                        <p className="text-[9px] text-zinc-700 font-mono truncate max-w-[240px]">
                          UPI: {profile.upi}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PAID IN FULL - Digital Verified</span>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Terms */}
              <div className="pt-2 text-[9px] text-center space-y-1.5 text-zinc-400">
                <p className="leading-tight text-zinc-500 font-sans whitespace-pre-line">
                  {profile.terms}
                </p>
                <div className="pt-1 border-t border-dotted border-zinc-200 text-[10px] font-semibold text-zinc-700">
                  Thank you for visiting {profile.shopName}!
                </div>
              </div>
            </div>
          ) : (
            /* TAX INVOICE STYLE */
            <div
              id="printableReceipt"
              className="bg-white w-full max-w-[440px] shadow-2xs rounded-xl p-6 border border-zinc-200 text-xs text-zinc-800"
            >
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <MHLogo
                      customUrl={profile.logoUrl}
                      size="sm"
                      rounded="md"
                      theme="receipt"
                    />
                    <div>
                      <h2 className="text-base font-bold uppercase text-zinc-900 tracking-tight">
                        {profile.shopName}
                      </h2>
                      <p className="text-[10px] text-zinc-500 max-w-[200px] leading-tight">
                        {profile.address}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500 space-y-0.5">
                    <p>Phone: {profile.phone}</p>
                    {profile.email && <p>Email: {profile.email}</p>}
                    {profile.gst && <p className="font-medium text-zinc-700">{profile.taxLabel || 'GSTIN'}: {profile.gst}</p>}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-medium text-zinc-800 uppercase tracking-wider">
                    TAX INVOICE / SLIP
                  </span>
                  <div className="mt-2 text-[11px] font-mono">
                    <p className="font-bold text-zinc-900">{order.id}</p>
                    <p className="text-zinc-500">{order.date}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] rounded font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Device Box */}
              <div className="grid grid-cols-2 gap-3 py-3 border-b border-zinc-200 bg-zinc-50/70 -mx-6 px-6">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Customer Details</span>
                  <p className="font-semibold text-zinc-900 text-xs mt-0.5">{order.name}</p>
                  <p className="text-zinc-600 text-[11px] font-mono">{order.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Device Information</span>
                  <p className="font-semibold text-zinc-900 text-xs mt-0.5">{order.model}</p>
                  <p className="text-zinc-500 font-mono text-[10px]">IMEI: {order.imei || 'N/A'}</p>
                </div>
              </div>

              {/* Problem Description */}
              <div className="py-3 border-b border-zinc-200">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Job / Reported Defect</span>
                <p className="text-xs text-zinc-700 mt-1 bg-zinc-50 p-2 rounded-lg border border-zinc-200/70">
                  {order.problem}
                </p>
              </div>

              {/* Billing Calculation */}
              <div className="py-3 border-b border-zinc-200 space-y-1.5 font-mono text-[11px]">
                {hasTax && (
                  <>
                    <div className="flex justify-between text-zinc-600">
                      <span>Service & Parts Subtotal</span>
                      <span>{curr}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>{profile.taxLabel || 'Tax'} ({taxRate}%)</span>
                      <span>{curr}{taxAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-xs text-zinc-900 pt-1">
                  <span>Gross Total</span>
                  <span>{curr}{order.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Advance Received</span>
                  <span>- {curr}{order.deposit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-zinc-900 pt-2 border-t border-zinc-200">
                  <span className="text-rose-700">Net Balance Due</span>
                  <span className="text-rose-700">{curr}{balance.toFixed(2)}</span>
                </div>

                {/* Device Lock Warning on Tax Invoice */}
                {order.isDeviceLocked && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <span className="font-bold text-rose-800 uppercase tracking-wide text-[11px] block">
                          Security Notice: Device Locked (IMEI: {order.imei})
                        </span>
                        <span className="text-[10px] text-rose-700">
                          Hardware/Software hold active until repair balance is cleared. Release PIN provided upon payment.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {!order.isDeviceLocked && order.unlockCode && (
                  <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold">
                      Device Unlocked & Cleared • Release Code: <strong className="font-mono">{order.unlockCode}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* CUSTOMER BILLING QR CARD */}
              {profile.includeBillingQr && (
                <div className="my-4 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-zinc-900 font-semibold text-xs mb-1">
                      <QrCode className="w-4 h-4 text-zinc-900" />
                      <span>Instant Billing QR</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-snug">
                      Scan with any UPI app (GPay, PhonePe, Paytm) to instantly settle this bill.
                    </p>
                    <div className="mt-2 text-xs font-mono font-bold text-zinc-900">
                      Amount: <span className="text-rose-600">{curr}{balance.toFixed(2)}</span>
                    </div>
                    {profile.upi && (
                      <p className="text-[10px] font-mono text-zinc-700 truncate mt-0.5">
                        UPI: {profile.upi}
                      </p>
                    )}
                  </div>

                  <div className="bg-white p-1.5 rounded-lg border border-zinc-200 shadow-2xs shrink-0">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Customer Billing QR"
                        className="w-24 h-24 object-contain"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-zinc-200 animate-pulse rounded-lg" />
                    )}
                  </div>
                </div>
              )}

              {/* Signatures & Terms */}
              <div className="pt-2 text-[9px] text-zinc-500 space-y-3">
                <p className="whitespace-pre-line leading-relaxed">
                  {profile.terms}
                </p>
                <div className="flex justify-between pt-4 border-t border-zinc-200 text-zinc-600">
                  <div className="text-center">
                    <div className="h-8 border-b border-zinc-300 w-24"></div>
                    <span className="text-[9px]">Customer Signature</span>
                  </div>
                  <div className="text-center">
                    <div className="h-8 border-b border-zinc-300 w-24"></div>
                    <span className="text-[9px]">Authorized Stamp</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="p-3.5 border-t border-zinc-200 bg-white no-print space-y-2">
          {balance > 0 && (
            <button
              onClick={() => onClearBalance(order.id)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2 rounded-lg font-medium text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mark Balance as Fully Paid ({curr}{balance.toFixed(2)})</span>
            </button>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handlePrint}
              className="bg-zinc-900 hover:bg-zinc-800 text-white py-2 px-3 rounded-lg font-medium text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-300" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-lg font-medium text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-300" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyTextBill}
              className="bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 py-2 px-3 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={onClose}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2 px-3 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Close</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
