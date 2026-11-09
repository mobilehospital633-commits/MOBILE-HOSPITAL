import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Printer,
  Smartphone,
  Phone,
  QrCode,
  AlertCircle,
  Sparkles,
  Clock,
  Send,
  CreditCard,
  Edit3,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  BellRing,
  Share2,
} from 'lucide-react';
import { RepairOrder, ShopProfile } from '../types';
import { getOrderDeviceName, getOrderModelNumber } from '../utils/orderUtils';
import { generateQrCodeDataUrl, getBillingQrPayload } from '../utils/qr';

export type ReminderTone = 'friendly' | 'pickup' | 'formal' | 'urgent';

interface DueReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RepairOrder | null;
  profile: ShopProfile;
  onReminderSent?: (orderId: string, reminderMessage: string) => void;
}

export const DueReminderModal: React.FC<DueReminderModalProps> = ({
  isOpen,
  onClose,
  order,
  profile,
  onReminderSent,
}) => {
  const [selectedTone, setSelectedTone] = useState<ReminderTone>('friendly');
  const [includeUpiLink, setIncludeUpiLink] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [showQrPreview, setShowQrPreview] = useState(false);

  const curr = profile.currency || '₹';
  const shopName = profile.shopName || 'Mobile Hospital';
  const shopPhone = profile.phone || '';
  const upiId = profile.upi || '';

  const balance = order ? Math.max(0, (order.cost || 0) - (order.deposit || 0)) : 0;
  const devName = order ? getOrderDeviceName(order) : '';
  const cleanPhone = order ? order.phone.replace(/[^0-9]/g, '') : '';

  // Generate dynamic UPI QR Code for the specific due balance
  useEffect(() => {
    if (order && balance > 0 && isOpen) {
      const upiPayee = profile.upiPayeeName || shopName;
      let qrText = '';
      if (upiId) {
        qrText = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiPayee)}&am=${balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Due for ${order.id}`)}`;
      } else {
        const payload = getBillingQrPayload(order, profile);
        qrText = payload.text;
      }
      generateQrCodeDataUrl(qrText, { width: 220, margin: 1 })
        .then((url) => setQrUrl(url))
        .catch(() => setQrUrl(''));
    }
  }, [order, balance, upiId, profile, shopName, isOpen]);

  // Construct message based on selected template
  const defaultMessage = useMemo(() => {
    if (!order) return '';

    const custName = order.name || 'Customer';
    const ticketId = order.id;
    const totalCostStr = `${curr}${order.cost.toFixed(2)}`;
    const depositStr = `${curr}${order.deposit.toFixed(2)}`;
    const dueStr = `${curr}${balance.toFixed(2)}`;

    let upiSection = '';
    if (includeUpiLink && upiId) {
      upiSection = `\n\n📲 *Quick UPI Payment Link / ID:*\nUPI ID: \`${upiId}\`\n(Pay via PhonePe / GPay / Paytm)`;
    }

    const shopContactSection = shopPhone
      ? `\n📞 *Contact / Support:* ${shopPhone}`
      : '';

    switch (selectedTone) {
      case 'friendly':
        return `Hello *${custName}*, Greetings from *${shopName}*! 📱\n\nThis is a gentle reminder regarding your device *${devName}* (Ticket: *${ticketId}*).\n\n🧾 *Billing Summary:*\n• Total Amount: ${totalCostStr}\n• Advance Paid: ${depositStr}\n• *Pending Due Balance: ${dueStr}*\n\nKindly arrange to clear the pending balance at your earliest convenience.${upiSection}${shopContactSection}\n\nThank you for choosing *${shopName}*! 🙏`;

      case 'pickup':
        return `Dear *${custName}*, Great news! 🎉\n\nYour device *${devName}* (Ticket: *${ticketId}*) is repaired, tested & *ready for pickup* at *${shopName}*! 🛠️\n\n💰 *Payment Breakdown:*\n• Total Bill: ${totalCostStr}\n• Advance Received: ${depositStr}\n• *Outstanding Balance Due: ${dueStr}*\n\nPlease settle this pending amount during device pickup or pay online.${upiSection}${shopContactSection}\n\nWorkshop Address: ${profile.address || 'Visit us today!'}\nThank you!`;

      case 'formal':
        return `*OFFICIAL PAYMENT REMINDER - ${shopName.toUpperCase()}*\n\nDear *${custName}*,\n\nPlease refer to your repair order *#${ticketId}* for device *${devName}* dated *${order.date}*.\n\n📊 *Statement of Account:*\n- Total Invoiced: ${totalCostStr}\n- Paid to Date: ${depositStr}\n- *Current Balance Due: ${dueStr}*\n\nWe request you to kindly clear the outstanding dues promptly.${upiSection}${shopContactSection}\n\nWarm regards,\n*Accounts Dept | ${shopName}*`;

      case 'urgent':
        return `⚠️ *URGENT PAYMENT NOTICE - ${shopName.toUpperCase()}*\n\nAttention: *${custName}*\nTicket Ref: *#${ticketId}* (${devName})\n\nThis is an urgent reminder that an outstanding balance of *${dueStr}* remains pending against your repair ticket.\n\n⚠️ *Pending Due Amount:* *${dueStr}*\n(Total: ${totalCostStr} | Paid: ${depositStr})\n\nPlease settle this overdue balance immediately to prevent holding or service restriction.${upiSection}${shopContactSection}\n\nKindly contact us immediately if you have already paid.`;

      default:
        return '';
    }
  }, [order, balance, curr, devName, shopName, shopPhone, upiId, includeUpiLink, selectedTone, profile.address]);

  // Synchronize custom text when tone changes (unless user actively editing)
  useEffect(() => {
    if (!isEditing) {
      setCustomText(defaultMessage);
    }
  }, [defaultMessage, isEditing]);

  if (!isOpen || !order) return null;

  const activeMessage = isEditing ? customText : defaultMessage;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const recordReminder = () => {
    if (onReminderSent && order) {
      onReminderSent(order.id, activeMessage);
    }
  };

  const handleSendWhatsApp = () => {
    recordReminder();
    const encoded = encodeURIComponent(activeMessage);
    const targetPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
    window.open(`https://wa.me/${targetPhone}?text=${encoded}`, '_blank');
  };

  const handleSendSMS = () => {
    recordReminder();
    const encoded = encodeURIComponent(activeMessage);
    window.location.href = `sms:${cleanPhone}?body=${encoded}`;
  };

  const handlePrintSlip = () => {
    recordReminder();
    const printArea = document.getElementById('due-slip-printable-area');
    if (!printArea) return;

    const printWin = window.open('', '_blank', 'width=450,height=600');
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`
      <html>
        <head>
          <title>Due Payment Notice - ${order.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: 12px; margin: 0; padding: 16px; color: #111; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 12px; }
            .title { font-size: 16px; font-weight: bold; }
            .sub { font-size: 10px; color: #555; }
            .due-box { border: 2px solid #e11d48; background: #fff1f2; padding: 8px; text-align: center; margin: 12px 0; border-radius: 4px; }
            .due-amount { font-size: 20px; font-weight: 900; color: #be123c; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .footer { text-align: center; font-size: 10px; color: #666; margin-top: 16px; border-top: 1px dashed #999; padding-top: 8px; }
            @media print { @page { margin: 4mm; size: auto; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${shopName.toUpperCase()}</div>
            <div class="sub">${profile.address || ''} | Tel: ${shopPhone}</div>
            <div style="font-weight:bold; margin-top:4px;">OUTSTANDING DUE PAYMENT SLIP</div>
          </div>
          <div class="row"><span>Ticket No:</span><strong>#${order.id}</strong></div>
          <div class="row"><span>Customer:</span><strong>${order.name}</strong></div>
          <div class="row"><span>Phone:</span><strong>${order.phone}</strong></div>
          <div class="row"><span>Device:</span><strong>${devName}</strong></div>
          <div class="row"><span>Date:</span><strong>${order.date}</strong></div>
          <hr style="border:none; border-top:1px dashed #ccc; margin:8px 0;" />
          <div class="row"><span>Total Bill:</span><strong>${curr}${order.cost.toFixed(2)}</strong></div>
          <div class="row"><span>Advance Paid:</span><strong>${curr}${order.deposit.toFixed(2)}</strong></div>
          <div class="due-box">
            <div style="font-size:11px; font-weight:bold; color:#9f1239;">PENDING DUE BALANCE</div>
            <div class="due-amount">${curr}${balance.toFixed(2)}</div>
            <div style="font-size:10px; color:#475569; margin-top:3px;">Please clear during device pickup</div>
          </div>
          ${upiId ? `<div style="text-align:center; font-size:11px; margin-top:8px;"><strong>UPI ID:</strong> ${upiId}</div>` : ''}
          <div class="footer">
            Thank you for your business! Please present this slip for collection.
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-overlay-fade">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 animate-modal-enter">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-zinc-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Customer Due Amount Reminder
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Due: {curr}{balance.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Send instant WhatsApp / SMS payment notice to <strong className="text-zinc-200">{order.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Due Info Banner */}
          <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50/50 p-4 rounded-xl border border-rose-200/80 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-md">
                    #{order.id}
                  </span>
                  <strong className="text-sm text-zinc-950 font-bold">{order.name}</strong>
                  <span className="text-xs text-zinc-500 font-mono">({order.phone})</span>
                </div>
                <div className="text-xs text-zinc-600 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-zinc-800">{devName}</span>
                  {order.imei && order.imei !== 'N/A' && (
                    <span className="text-zinc-400 font-mono text-[11px]">• IMEI: {order.imei}</span>
                  )}
                  <span className="text-zinc-400">• Status: <span className="font-medium text-zinc-700">{order.status}</span></span>
                </div>
              </div>

              {/* Outstanding Amount Metric */}
              <div className="text-right sm:border-l sm:border-rose-200 sm:pl-4 sm:ml-2">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                  Pending Due Balance
                </span>
                <span className="text-2xl font-black text-rose-600 font-mono tracking-tight tabular-nums">
                  {curr}{balance.toFixed(2)}
                </span>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Total: {curr}{order.cost.toFixed(2)} | Advance: {curr}{order.deposit.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Previous Reminders Log status */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-rose-200/60 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-600">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  {order.reminderCount && order.reminderCount > 0 ? (
                    <span>
                      Reminded <strong>{order.reminderCount} time{order.reminderCount > 1 ? 's' : ''}</strong>
                      {order.lastReminderSent && (
                        <span className="text-zinc-400 ml-1">
                          (Last: {new Date(order.lastReminderSent).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-zinc-500 italic">No reminder sent yet for this ticket</span>
                  )}
                </span>
              </div>

              {order.phone && (
                <a
                  href={`tel:${order.phone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 hover:underline"
                >
                  <Phone className="w-3 h-3 text-zinc-500" />
                  <span>Call Customer</span>
                </a>
              )}
            </div>
          </div>

          {/* Tone Selector Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Choose Reminder Tone & Template</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (isEditing) setCustomText(defaultMessage);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditing ? 'Revert to Template' : 'Edit Text'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTone('friendly');
                  setIsEditing(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedTone === 'friendly' && !isEditing
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500/40'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-white text-zinc-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>🌟 Friendly</span>
                  {selectedTone === 'friendly' && !isEditing && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">Polite & courteous greeting</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTone('pickup');
                  setIsEditing(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedTone === 'pickup' && !isEditing
                    ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-bold shadow-xs ring-1 ring-blue-500/40'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-white text-zinc-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>🚀 Ready Pickup</span>
                  {selectedTone === 'pickup' && !isEditing && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">Ready for pickup & collect</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTone('formal');
                  setIsEditing(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedTone === 'formal' && !isEditing
                    ? 'border-zinc-800 bg-zinc-100 text-zinc-950 font-bold shadow-xs ring-1 ring-zinc-800/40'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-white text-zinc-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>📋 Formal</span>
                  {selectedTone === 'formal' && !isEditing && <Check className="w-3.5 h-3.5 text-zinc-800" />}
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">Official statement notice</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTone('urgent');
                  setIsEditing(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedTone === 'urgent' && !isEditing
                    ? 'border-rose-500 bg-rose-50/80 text-rose-950 font-bold shadow-xs ring-1 ring-rose-500/40'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-white text-zinc-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>⚠️ Urgent</span>
                  {selectedTone === 'urgent' && !isEditing && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">Important overdue warning</p>
              </button>
            </div>
          </div>

          {/* Include UPI Link Toggle & Preview */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-semibold text-zinc-800">Include UPI Payment Details</span>
                {upiId ? (
                  <span className="text-[11px] text-zinc-500 block">UPI ID: <strong className="font-mono text-zinc-700">{upiId}</strong></span>
                ) : (
                  <span className="text-[11px] text-amber-600 block">(Configure shop UPI in Settings)</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {qrUrl && (
                <button
                  type="button"
                  onClick={() => setShowQrPreview(!showQrPreview)}
                  className="px-2 py-1 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 cursor-pointer flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{showQrPreview ? 'Hide QR' : 'Show Due QR'}</span>
                </button>
              )}
              <input
                type="checkbox"
                id="includeUpiToggle"
                checked={includeUpiLink}
                onChange={(e) => setIncludeUpiLink(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Quick QR Code Display if toggled */}
          {showQrPreview && qrUrl && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center flex flex-col items-center justify-center animate-in fade-in duration-150">
              <div className="bg-white p-2.5 rounded-xl shadow-xs border border-emerald-200">
                <img src={qrUrl} alt="Due Payment QR" className="w-40 h-40 object-contain mx-auto" />
              </div>
              <span className="text-xs font-bold text-emerald-900 mt-2">
                Scan to Pay Pending Due: {curr}{balance.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-700 font-mono mt-0.5">
                Exact ticket amount encoded for instant settlement
              </span>
            </div>
          )}

          {/* Message Preview / Editor Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                {isEditing ? 'Customize Reminder Message' : 'WhatsApp & SMS Message Preview'}
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={9}
                className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none bg-white text-zinc-900 shadow-inner"
                placeholder="Type custom due reminder message..."
              />
            ) : (
              <div className="p-3.5 bg-zinc-900 text-zinc-100 rounded-xl text-xs font-sans whitespace-pre-wrap leading-relaxed border border-zinc-800 shadow-inner max-h-56 overflow-y-auto selection:bg-emerald-500/30">
                {activeMessage}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Direct Actions */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintSlip}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Print mini 80mm due balance notice slip"
            >
              <Printer className="w-4 h-4 text-zinc-600" />
              <span>Print Due Slip</span>
            </button>

            <button
              type="button"
              onClick={handleSendSMS}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Send via native SMS"
            >
              <Smartphone className="w-4 h-4 text-zinc-600" />
              <span>Send SMS</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send WhatsApp Reminder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
