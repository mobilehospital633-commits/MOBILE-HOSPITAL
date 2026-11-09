import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  Scissors,
  QrCode,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CreditCard,
  CheckCircle,
  Image as ImageIcon,
  MessageSquare,
  Send,
  ExternalLink,
  Phone,
} from 'lucide-react';
import { RepairOrder, ShopProfile, PageStructureConfig, DEFAULT_PAGE_STRUCTURE } from '../types';
import { MHLogo } from './MHLogo';
import { MHRepairWatermark } from './MHRepairWatermark';
import { getOrderDeviceName } from '../utils/orderUtils';
import { PageStructurePanel } from './PageStructurePanel';
import { getBillingQrPayload, generateQrCodeDataUrl } from '../utils/qr';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { formatWhatsAppRecipientPhone } from '../utils/whatsappCloudApi';

interface ReceiptModalProps {
  order: RepairOrder | null;
  profile: ShopProfile;
  isOpen: boolean;
  onClose: () => void;
  onClearBalance?: (orderId: string) => void;
  onSaveProfile?: (profile: ShopProfile) => void;
  onNavigateToSettings?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  profile,
  isOpen,
  onClose,
  onClearBalance,
  onSaveProfile,
  onNavigateToSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState(order?.phone || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBillText, setCopiedBillText] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [receiptStyle, setReceiptStyle] = useState<'thermal' | 'invoice'>('thermal');
  const [showStructurePanel, setShowStructurePanel] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Keep recipient phone in sync when active order changes
  useEffect(() => {
    if (order?.phone) {
      setRecipientPhone(order.phone);
    }
  }, [order?.phone, order?.id]);

  const [structure, setStructure] = useState<PageStructureConfig>(() => {
    return profile.pageStructure || DEFAULT_PAGE_STRUCTURE;
  });

  const [customization, setCustomization] = useState(() => {
    try {
      const saved = localStorage.getItem('mh_receipt_customization_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      watermarkText1: 'MOBILE HOSPITAL',
      watermarkText2: 'Mobile repairing centre',
      watermarkText3: 'kalitala Duttapulia',
      watermarkStyle: 'stamp' as const,
      watermarkOpacity: 0.16,
      signatureType: 'typed' as const,
      authorizedSignerName: 'Mobile Hospital',
      signatureFontStyle: 'cursive' as const,
      showDateWithSign: true,
      customerSignType: 'manual' as const,
      customerSignerName: '',
    };
  });

  // Re-read customization when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('mh_receipt_customization_v3');
        if (saved) setCustomization(JSON.parse(saved));
      } catch {}
    }
  }, [isOpen, showWhatsAppModal]);

  // Keep structure in sync if profile updates
  useEffect(() => {
    if (profile.pageStructure) {
      setStructure(profile.pageStructure);
    }
  }, [profile.pageStructure, isOpen]);

  // Generate QR Code if enabled
  useEffect(() => {
    if (order && structure.showPaymentQr) {
      const payload = getBillingQrPayload(order, profile);
      generateQrCodeDataUrl(payload.text, { width: 140, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch(() => setQrCodeUrl(''));
    } else {
      setQrCodeUrl('');
    }
  }, [order, profile, structure.showPaymentQr]);

  const curr = profile.currency || '₹';
  const balance = order ? Math.max(0, order.cost - order.deposit) : 0;

  // Tax calculations
  const taxRate = profile.taxRate || 0;
  const hasTax = profile.showTaxOnReceipt && taxRate > 0;
  const subtotal = order ? (hasTax ? order.cost / (1 + taxRate / 100) : order.cost) : 0;
  const taxAmount = order ? (hasTax ? order.cost - subtotal : 0) : 0;

  if (!isOpen || !order) return null;

  const isProductSale = order.orderType === 'sale';
  const devName = getOrderDeviceName(order);

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print failed, attempting printable window fallback:', err);
      try {
        const printableElement = document.getElementById('printableReceipt');
        if (printableElement) {
          const printWindow = window.open('', '_blank', 'width=800,height=900');
          if (printWindow) {
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${profile.shopName || 'Mobile Hospital'} - Receipt ${order?.id || ''}</title>
                  <style>
                    body { font-family: monospace, sans-serif; padding: 15px; margin: 0; }
                    @media print { body { padding: 0; } }
                  </style>
                </head>
                <body>
                  ${printableElement.outerHTML}
                  <script>
                    window.onload = function() { window.print(); window.close(); }
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback print also failed:', fallbackErr);
      }
    }
  };

  const handleSaveStructureAsDefault = () => {
    const updatedProfile: ShopProfile = {
      ...profile,
      pageStructure: structure,
    };
    if (onSaveProfile) {
      onSaveProfile(updatedProfile);
    }
    try {
      localStorage.setItem('mh_profile', JSON.stringify(updatedProfile));
    } catch {
      // ignore
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetStructureDefaults = () => {
    setStructure(DEFAULT_PAGE_STRUCTURE);
  };

  const handleCopyTextBill = () => {
    let text = '';
    if (isProductSale) {
      text = `*${profile.shopName} - Retail Cash Memo*
Invoice #: ${order.id}
Date: ${order.date}
Customer: ${order.name} (${order.phone})
Item: ${order.quantity ? `${order.quantity}x ` : ''}${devName}
Warranty: ${order.warranty || 'No Warranty'}
Payment Mode: ${order.paymentMethod || 'Cash'}
---------------------------
Total: ${curr}${order.cost.toFixed(2)}
Paid: ${curr}${order.deposit.toFixed(2)}
Balance Due: ${curr}${balance.toFixed(2)}
Thank you for shopping at ${profile.shopName}!`;
    } else {
      const expectedLine = order.expectedDate ? `\nExpected Delivery: ${order.expectedDate}` : '';
      text = `*${profile.shopName} - Repair Job Card*
Ticket ID: ${order.id}
Date: ${order.date}${expectedLine}
Customer: ${order.name} (${order.phone})
Device: ${devName}
IMEI/SN: ${order.imei || 'N/A'}
Reported Issue: ${order.problem}
Status: ${order.status}
---------------------------
Total Cost: ${curr}${order.cost.toFixed(2)}
Deposit Paid: ${curr}${order.deposit.toFixed(2)}
Balance Due: ${curr}${balance.toFixed(2)}
Thank you for visiting ${profile.shopName}!`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp Link Construction and Phone Resolution
  const cleanPhone = formatWhatsAppRecipientPhone(recipientPhone || (order?.phone ?? ''), '91');

  const buildWhatsAppBillText = () => {
    if (!order) return '';
    const balanceText =
      balance > 0
        ? `⚠️ *Balance Due:* ${curr}${balance.toFixed(2)}`
        : `✅ *Payment Status:* PAID IN FULL`;

    const upiInfo =
      balance > 0 && profile.upi
        ? `\n💳 *Pay via UPI:* ${profile.upi} (${profile.upiPayeeName || profile.shopName})`
        : '';

    if (isProductSale) {
      return `🧾 *${profile.shopName.toUpperCase()} - RETAIL INVOICE*
━━━━━━━━━━━━━━━━━━━━
📌 *Invoice #:* ${order.id}
📅 *Date:* ${order.date}
👤 *Customer:* ${order.name}
📱 *Phone:* ${order.phone}
🛒 *Item:* ${order.quantity ? `${order.quantity}x ` : ''}${devName}
🛡️ *Warranty:* ${order.warranty || 'No Warranty'}
💳 *Payment Mode:* ${order.paymentMethod || 'Cash'}
━━━━━━━━━━━━━━━━━━━━
💰 *Total Amount:* ${curr}${order.cost.toFixed(2)}
💵 *Amount Paid:* ${curr}${order.deposit.toFixed(2)}
${balanceText}${upiInfo}
━━━━━━━━━━━━━━━━━━━━
📍 *Store:* ${profile.address || 'Mobile Repairing & Sales'}
📞 *Helpline:* ${profile.phone}
🙏 Thank you for purchasing from *${profile.shopName}*!`;
    }

    const expectedLine = order.expectedDate ? `\n⏳ *Est. Ready Date:* ${order.expectedDate}` : '';
    const imeiLine = order.imei ? `\n🔢 *IMEI / Serial:* ${order.imei}` : '';

    return `🔧 *${profile.shopName.toUpperCase()} - REPAIR JOB CARD*
━━━━━━━━━━━━━━━━━━━━
🔖 *Ticket ID:* ${order.id}
📅 *Date:* ${order.date}${expectedLine}
👤 *Customer:* ${order.name}
📱 *Phone:* ${order.phone}
📱 *Device:* ${devName}${imeiLine}
🛠️ *Reported Issue:* ${order.problem}
⚡ *Job Status:* *${order.status}*
━━━━━━━━━━━━━━━━━━━━
💰 *Estimated Total:* ${curr}${order.cost.toFixed(2)}
💵 *Advance Deposit:* ${curr}${order.deposit.toFixed(2)}
${balanceText}${upiInfo}
━━━━━━━━━━━━━━━━━━━━
⚠️ *Note:* Please present this Ticket ID (*${order.id}*) when collecting your device.
📍 *Workshop:* ${profile.address || 'Mobile Repairing & Sales Centre'}
📞 *Helpline:* ${profile.phone}
🙏 Thank you for choosing *${profile.shopName}*!`;
  };

  const whatsAppBillMessage = buildWhatsAppBillText();
  const directWhatsAppUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsAppBillMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsAppBillMessage)}`;

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directWhatsAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyBillMessage = () => {
    navigator.clipboard.writeText(whatsAppBillMessage);
    setCopiedBillText(true);
    setTimeout(() => setCopiedBillText(false), 2000);
  };

  // Dimensions & padding based on page structure adjustments
  const getContainerMaxWidth = () => {
    switch (structure.paperSize) {
      case '58mm':
        return 'w-[280px] max-w-[280px]';
      case '80mm':
        return 'w-[370px] max-w-[370px]';
      case 'a5':
        return 'w-[520px] max-w-[520px]';
      case 'a4':
        return 'w-full max-w-[760px]';
      default:
        return 'w-[370px] max-w-[370px]';
    }
  };

  const getPaddingClass = () => {
    switch (structure.margins) {
      case 'tight':
        return 'p-2.5 sm:p-3';
      case 'spacious':
        return 'p-6 sm:p-8';
      case 'normal':
      default:
        return 'p-4 sm:p-6';
    }
  };

  const getFontSizeClass = () => {
    switch (structure.fontScale) {
      case 'compact':
        return 'text-[10px] leading-tight';
      case 'large':
        return 'text-[13px] leading-normal';
      case 'normal':
      default:
        return 'text-xs leading-normal';
    }
  };

  const getHeaderAlignClass = () => {
    return structure.headerAlign === 'left' ? 'text-left items-start' : 'text-center items-center';
  };

  const modalOuterWidth = structure.paperSize === 'a4' ? 'max-w-4xl' : structure.paperSize === 'a5' ? 'max-w-2xl' : 'max-w-xl';

  return (
    <div
      id="receiptModal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-white w-full ${modalOuterWidth} rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto border border-zinc-200 transition-all duration-200`}>
        {/* Modal Top Toolbar (Not Printed) */}
        <div className="p-3 px-4 sm:px-5 bg-white border-b border-zinc-200 flex flex-wrap gap-2 justify-between items-center no-print">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setReceiptStyle('thermal')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  receiptStyle === 'thermal'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                POS Slip (Thermal)
              </button>
              <button
                type="button"
                onClick={() => setReceiptStyle('invoice')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  receiptStyle === 'invoice'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Tax Invoice
              </button>
            </div>

            {/* Page Structure Adjustment Option Button */}
            <button
              type="button"
              onClick={() => setShowStructurePanel(!showStructurePanel)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showStructurePanel
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border-zinc-200'
              }`}
              title="Adjust page paper size, margins, font scale & section visibility"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Page Structure</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${showStructurePanel ? 'bg-blue-800 text-white' : 'bg-white text-zinc-700 border border-zinc-200'}`}>
                {structure.paperSize}
              </span>
              {showStructurePanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Watermark & Signature Customization Button */}
            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs"
              title="Customize watermark stamp style, 3-line text, and signature typing"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Watermark & Sign</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase bg-white text-emerald-900 border border-emerald-200">
                {customization.watermarkStyle || 'stamp'}
              </span>
            </button>

            {isProductSale ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Product Sale
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Repair Ticket
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {balance > 0 && onClearBalance && (
              <button
                type="button"
                onClick={() => onClearBalance(order.id)}
                title="Mark this order balance as paid in full"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Clear Balance</span>
              </button>
            )}

            {/* Direct WhatsApp Link Button */}
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Send bill directly to ${cleanPhone || order.phone} via WhatsApp`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Bill</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            <button
              onClick={() => setShowWhatsAppModal(true)}
              title="Share Receipt as Image or via WhatsApp Cloud API"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Image Card</span>
            </button>

            <button
              onClick={handleCopyTextBill}
              title="Copy details as text"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Page Structure Adjustment Option Panel */}
        {showStructurePanel && (
          <div className="border-b border-zinc-200 bg-zinc-100/70 p-3 sm:p-4 max-h-[340px] overflow-y-auto no-print">
            <PageStructurePanel
              structure={structure}
              onChange={setStructure}
              onSaveAsDefault={handleSaveStructureAsDefault}
              onResetDefaults={handleResetStructureDefaults}
              isSaved={isSaved}
              compactMode={true}
              showAppLayoutOptions={false}
            />
          </div>
        )}

        {/* WhatsApp Customer Bill Dispatch Station (Not Printed) */}
        <div className="border-b border-zinc-200 bg-emerald-50/40 p-3 sm:px-4 sm:py-3 no-print space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-900">
                    WhatsApp Bill Dispatch
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    wa.me Direct Link
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Directly sends formatted bill, device status & payment info to customer's WhatsApp
                </p>
              </div>
            </div>

            {/* Phone Input & Quick Action Links */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-lg border border-zinc-300 bg-white overflow-hidden shadow-2xs focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                <span className="px-2 py-1.5 text-xs font-semibold text-zinc-600 bg-zinc-50 border-r border-zinc-200 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>+91</span>
                </span>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Customer Phone"
                  title="Edit customer WhatsApp phone number"
                  className="px-2.5 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none w-28 sm:w-32"
                />
              </div>

              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
                title={`Open WhatsApp to send bill to ${cleanPhone || order.phone}`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
                <ExternalLink className="w-3 h-3 opacity-90" />
              </a>

              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title="Copy direct wa.me link URL to clipboard"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTextPreview((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title="Toggle WhatsApp message text preview"
              >
                <span>{showTextPreview ? 'Hide Text' : 'Preview Message'}</span>
                {showTextPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Expandable WhatsApp Message Preview */}
          {showTextPreview && (
            <div className="p-3 rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-700 text-[11px] leading-relaxed relative animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400">MESSAGE PREVIEW (Recipient: +{cleanPhone || 'UNKNOWN'})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyBillMessage}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBillText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBillText ? 'Copied Text' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-200 bg-black/40 p-2.5 rounded-md border border-zinc-800">
                {whatsAppBillMessage}
              </pre>
            </div>
          )}
        </div>

        {/* Printable Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-zinc-100/60 flex-1 flex justify-center items-start">
          
          {/* THERMAL / POS SLIP STYLE */}
          {receiptStyle === 'thermal' ? (
            <div
              id="printableReceipt"
              data-paper-size={structure.paperSize}
              data-margin={structure.margins}
              data-font={structure.fontScale}
              data-thermal-sharpness={structure.thermalSharpness || 'ultra'}
              className={`relative overflow-hidden bg-white ${getContainerMaxWidth()} ${getPaddingClass()} ${getFontSizeClass()} shadow-md rounded-xl border border-zinc-200 font-mono text-zinc-800 transition-all ${
                structure.thermalMonoMode ? 'mono-thermal' : ''
              }`}
            >
              {/* Center Watermark Lite: Mobile Repair Shop Logo with 12 styles and custom text */}
              {structure.showWatermark !== false && (
                <MHRepairWatermark
                  size={structure.paperSize === '58mm' ? 'sm' : structure.paperSize === '80mm' ? 'md' : 'lg'}
                  style={(customization.watermarkStyle || structure.watermarkStyle || 'stamp') as any}
                  sublabel={customization.watermarkText1 || structure.watermarkText1 || profile.shopName || 'MOBILE HOSPITAL'}
                  label={customization.watermarkText2 || structure.watermarkText2 || 'Mobile repairing centre'}
                  bottomText={customization.watermarkText3 || structure.watermarkText3 || 'kalitala Duttapulia'}
                  className={structure.thermalMonoMode ? 'opacity-[0.04] print:opacity-[0.05]' : 'opacity-[0.065] print:opacity-[0.08]'}
                />
              )}

              {/* Receipt Header */}
              <div className={`relative z-10 pb-3 border-b border-dashed border-zinc-300 flex flex-col ${getHeaderAlignClass()}`}>
                {structure.showLogo && (
                  <MHLogo
                    customUrl={profile.logoUrl}
                    size="md"
                    rounded="lg"
                    theme="receipt"
                    className="mb-1.5"
                  />
                )}
                <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 leading-tight">
                  {profile.shopName}
                </h2>

                {structure.showShopDetails && (
                  <>
                    <p className="text-[11px] text-zinc-500 mt-0.5 max-w-[260px] leading-tight">
                      {profile.address || 'Smart Repair & Tech Services'}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Ph: {profile.phone}
                    </p>
                    {profile.email && (
                      <p className="text-[10px] text-zinc-400">{profile.email}</p>
                    )}
                  </>
                )}

                {structure.showTaxGst && profile.gst && (
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {profile.taxLabel || 'GSTIN'}: {profile.gst}
                  </p>
                )}

                <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
                  {isProductSale ? 'Retail Sale Cash Memo' : 'Repair Job Card & Billing Slip'}
                </div>
              </div>

              {/* Order Meta & Customer Details */}
              <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">{isProductSale ? 'Invoice #:' : 'Ticket #:'}</span>
                  <span className="font-bold text-zinc-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Date:</span>
                  <span className="text-zinc-700">{order.date}</span>
                </div>
                {!isProductSale && order.expectedDate && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Exp. Delivery:</span>
                    <span className="text-zinc-900 font-bold">{order.expectedDate}</span>
                  </div>
                )}
                {structure.showCustomerDetails && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Customer:</span>
                      <span className="font-bold text-zinc-800">{order.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Phone:</span>
                      <span className="text-zinc-700">{order.phone}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Item Details (Product vs Repair) */}
              {isProductSale ? (
                <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1.5 text-[11px]">
                  {structure.showItemDetails && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Item:</span>
                      <span className="font-bold text-zinc-900 text-right">{devName}</span>
                    </div>
                  )}
                  {order.deviceBrand && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Device Brand:</span>
                      <span className="font-semibold text-zinc-900">{order.deviceBrand}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Quantity:</span>
                    <span className="font-bold text-zinc-900">{order.quantity || 1} pcs</span>
                  </div>
                  {structure.showWarranty && order.warranty && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Warranty:</span>
                      <span className="font-bold text-emerald-800">{order.warranty}</span>
                    </div>
                  )}
                  {order.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Payment Mode:</span>
                      <span className="text-zinc-700">{order.paymentMethod}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                  {structure.showItemDetails && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Device Name:</span>
                      <span className="font-bold text-zinc-900 text-right">{devName}</span>
                    </div>
                  )}
                  {structure.showImei && order.imei && order.imei !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">IMEI/SN:</span>
                      <span className="text-zinc-700 font-mono">{order.imei}</span>
                    </div>
                  )}
                  {order.mdmLockType && order.mdmLockType !== 'clean' && (
                    <div className="flex justify-between text-purple-900 font-semibold">
                      <span className="text-zinc-400">MDM Status:</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">
                        {order.mdmLockType === 'knox' ? 'Knox Guard' : order.mdmFinanceProvider || order.mdmLockType.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {structure.showProblemDetails && order.problem && (
                    <div className="mt-1 pt-1 border-t border-dotted border-zinc-200">
                      <span className="text-zinc-400 uppercase text-[10px] font-semibold">Reported Fault:</span>
                      <p className="text-zinc-800 italic mt-0.5 bg-zinc-50 p-1.5 rounded text-[11px] leading-relaxed border border-zinc-100">
                        {order.problem}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Calculation */}
              <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1.5 text-[11px]">
                {structure.showTaxBreakdown && hasTax && (
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
                  <span>{isProductSale ? 'Total Bill:' : 'Est. Total Amount:'}</span>
                  <span>{curr}{order.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>{isProductSale ? 'Amount Paid:' : 'Advance Paid:'}</span>
                  <span className="text-emerald-700 font-medium">{curr}{order.deposit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-dotted border-zinc-300">
                  <span className="uppercase tracking-wider">Balance Due:</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${balance > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {curr}{balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status / Paid stamp indicator */}
              {structure.showStatusBadge && balance <= 0 && (
                <div className="my-2.5 py-1.5 px-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PAID IN FULL</span>
                </div>
              )}

              {/* UPI Payment QR Code Section */}
              {structure.showPaymentQr && qrCodeUrl && (
                <div className="py-2.5 border-b border-dashed border-zinc-300 flex flex-col items-center justify-center text-center">
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR"
                    loading="lazy"
                    decoding="async"
                    className="w-24 h-24 rounded border border-zinc-200 p-1 bg-white mb-1"
                  />
                  <span className="text-[10px] font-bold text-zinc-800">Scan to Pay via UPI</span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {balance > 0 ? `Amount: ${curr}${balance.toFixed(2)}` : 'Instant Counter Pay'}
                  </span>
                </div>
              )}

              {/* Footer Terms */}
              {structure.showTerms && profile.terms && (
                <div className="pt-2 text-[9px] text-center space-y-1.5 text-zinc-400">
                  <p className="leading-tight text-zinc-500 font-sans whitespace-pre-line">
                    {profile.terms}
                  </p>
                  <div className="pt-1 border-t border-dotted border-zinc-200 text-[10px] font-semibold text-zinc-700">
                    Thank you for visiting {profile.shopName}!
                  </div>
                </div>
              )}

              {/* Signatures */}
              {structure.showSignatures && (
                <div className="pt-3 border-t border-zinc-200 flex justify-between items-end text-[9px] text-zinc-500 font-sans mt-2">
                  <div className="text-center min-w-[90px]">
                    {(customization.signatureType || structure.signatureType || 'typed') === 'typed' ? (
                      <div className="mb-1 flex flex-col items-center">
                        {(customization.signatureFontStyle || structure.signatureFontStyle || 'cursive') === 'cursive' ? (
                          <div className="font-['Caveat',cursive] text-lg font-bold text-blue-900 select-none pb-0.5">
                            {customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}
                          </div>
                        ) : (customization.signatureFontStyle || structure.signatureFontStyle) === 'dancing' ? (
                          <div className="font-['Dancing_Script',cursive] text-base font-bold text-indigo-950 select-none pb-0.5">
                            {customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}
                          </div>
                        ) : (customization.signatureFontStyle || structure.signatureFontStyle) === 'alex_brush' ? (
                          <div className="font-['Alex_Brush',cursive] text-lg font-bold text-blue-950 select-none pb-0.5">
                            {customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}
                          </div>
                        ) : (customization.signatureFontStyle || structure.signatureFontStyle) === 'digital_stamp' ? (
                          <div className="inline-flex items-center gap-1 border border-emerald-600 bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider mb-0.5">
                            <span>✓ SIGNED:</span>
                            <span>{customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}</span>
                          </div>
                        ) : (
                          <div className="font-serif italic font-bold text-xs text-zinc-900 border-b border-zinc-900 pb-0.5 mb-0.5">
                            {customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}
                          </div>
                        )}
                        {customization.showDateWithSign && (
                          <div className="text-[7.5px] font-mono text-zinc-400">
                            Date: {order.date || new Date().toISOString().split('T')[0]}
                          </div>
                        )}
                      </div>
                    ) : null}
                    <div className="w-20 border-b border-zinc-300 mb-1 mx-auto" />
                    <span>Authorized Sign</span>
                  </div>

                  <div className="text-center min-w-[90px]">
                    {(customization.customerSignType || structure.customerSignType) === 'typed' ? (
                      <div className="mb-1 flex flex-col items-center">
                        <div className="font-['Dancing_Script',cursive] text-sm font-bold text-zinc-800 select-none pb-0.5">
                          {customization.customerSignerName || structure.customerSignerName || order.name || 'Customer'}
                        </div>
                        <div className="text-[7.5px] font-mono text-zinc-400">
                          Acknowledged
                        </div>
                      </div>
                    ) : null}
                    <div className="w-20 border-b border-zinc-300 mb-1 mx-auto" />
                    <span>Customer Sign</span>
                  </div>
                </div>
              )}

              {/* Tear Line Guideline */}
              {structure.tearLine && (
                <div className="mt-3 pt-2 border-t-2 border-dashed border-zinc-300 flex items-center justify-center gap-1 text-[9px] text-zinc-400">
                  <Scissors className="w-3 h-3 text-zinc-400" />
                  <span>TEAR HERE</span>
                </div>
              )}
            </div>
          ) : (
            /* TAX INVOICE / FULL SHEET STYLE */
            <div
              id="printableReceipt"
              data-paper-size={structure.paperSize}
              data-margin={structure.margins}
              data-font={structure.fontScale}
              data-thermal-sharpness={structure.thermalSharpness || 'ultra'}
              className={`relative overflow-hidden bg-white ${getContainerMaxWidth()} ${getPaddingClass()} ${getFontSizeClass()} shadow-md rounded-xl border border-zinc-200 text-zinc-800 transition-all ${
                structure.thermalMonoMode ? 'mono-thermal' : ''
              }`}
            >
              {/* Center Watermark: Mobile Repair Shop Logo with 12 styles and custom text */}
              {structure.showWatermark !== false && (
                <MHRepairWatermark
                  size={structure.paperSize === 'a4' ? 'xl' : structure.paperSize === 'a5' ? 'lg' : 'md'}
                  style={(customization.watermarkStyle || structure.watermarkStyle || 'stamp') as any}
                  sublabel={customization.watermarkText1 || structure.watermarkText1 || profile.shopName || 'MOBILE HOSPITAL'}
                  label={customization.watermarkText2 || structure.watermarkText2 || 'Mobile repairing centre'}
                  bottomText={customization.watermarkText3 || structure.watermarkText3 || 'kalitala Duttapulia'}
                  className={structure.thermalMonoMode ? 'opacity-[0.04] print:opacity-[0.05]' : 'opacity-[0.065] print:opacity-[0.08]'}
                />
              )}

              {/* Invoice Header */}
              <div className="relative z-10 flex justify-between items-start border-b border-zinc-200 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    {structure.showLogo && (
                      <MHLogo
                        customUrl={profile.logoUrl}
                        size="sm"
                        rounded="md"
                        theme="receipt"
                      />
                    )}
                    <div>
                      <h2 className="text-base font-bold uppercase text-zinc-900 tracking-tight">
                        {profile.shopName}
                      </h2>
                      {structure.showShopDetails && (
                        <p className="text-[10px] text-zinc-500 max-w-[220px] leading-tight mt-0.5">
                          {profile.address}
                        </p>
                      )}
                    </div>
                  </div>
                  {structure.showShopDetails && (
                    <div className="mt-2 text-[10px] text-zinc-500 space-y-0.5">
                      <p>Phone: {profile.phone}</p>
                      {profile.email && <p>Email: {profile.email}</p>}
                      {structure.showTaxGst && profile.gst && (
                        <p className="font-medium text-zinc-700">{profile.taxLabel || 'GSTIN'}: {profile.gst}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
                    {isProductSale ? 'RETAIL TAX INVOICE' : 'TAX INVOICE / SLIP'}
                  </span>
                  <div className="mt-2 text-[11px] font-mono">
                    <p className="font-bold text-zinc-900">{order.id}</p>
                    <p className="text-zinc-500">{order.date}</p>
                    {!isProductSale && order.expectedDate && (
                      <p className="text-blue-700 text-[10px] font-medium">Exp: {order.expectedDate}</p>
                    )}
                    {structure.showStatusBadge && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-[9px] rounded font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {order.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer & Item Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-zinc-200 bg-zinc-50/70 -mx-4 sm:-mx-6 px-4 sm:px-6">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Customer Details</span>
                  {structure.showCustomerDetails ? (
                    <>
                      <p className="font-semibold text-zinc-900 text-xs mt-0.5">{order.name}</p>
                      <p className="text-zinc-600 text-[11px] font-mono">{order.phone}</p>
                    </>
                  ) : (
                    <p className="text-zinc-500 text-xs mt-0.5">Standard Counter Customer</p>
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                    {isProductSale ? 'Product Description' : 'Device Information'}
                  </span>
                  {structure.showItemDetails && (
                    <p className="font-semibold text-zinc-900 text-xs mt-0.5">{devName}</p>
                  )}
                  {isProductSale ? (
                    <div className="text-[10px] text-zinc-600 mt-0.5 space-y-0.5">
                      {order.deviceBrand && <p>Brand: <span className="font-semibold text-zinc-800">{order.deviceBrand}</span></p>}
                      <p>Qty: {order.quantity || 1} pcs</p>
                      {structure.showWarranty && order.warranty && <p className="text-emerald-700 font-medium">Warranty: {order.warranty}</p>}
                    </div>
                  ) : (
                    <>
                      {structure.showImei && order.imei && order.imei !== 'N/A' && (
                        <p className="text-zinc-500 font-mono text-[10px] mt-0.5">IMEI: {order.imei}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Problem / Item Details */}
              {!isProductSale && structure.showProblemDetails && order.problem && (
                <div className="py-3 border-b border-zinc-200">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Job / Reported Defect</span>
                  <p className="text-xs text-zinc-700 mt-1 bg-zinc-50 p-2 rounded-lg border border-zinc-200/70">
                    {order.problem}
                  </p>
                </div>
              )}

              {/* Billing Calculation */}
              <div className="py-3 border-b border-zinc-200 space-y-1.5 font-mono text-[11px]">
                {structure.showTaxBreakdown && hasTax && (
                  <>
                    <div className="flex justify-between text-zinc-600">
                      <span>Subtotal (Excl. Tax)</span>
                      <span>{curr}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>{profile.taxLabel || 'Tax'} ({taxRate}%)</span>
                      <span>{curr}{taxAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-zinc-900 text-xs">
                  <span>Grand Total:</span>
                  <span>{curr}{order.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>{isProductSale ? 'Paid Amount:' : 'Advance Deposit:'}</span>
                  <span className="text-emerald-700 font-medium">{curr}{order.deposit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-zinc-200 text-zinc-900">
                  <span className="uppercase tracking-wider">Balance Due:</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${balance > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {curr}{balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment QR in Invoice */}
              {structure.showPaymentQr && qrCodeUrl && (
                <div className="py-3 border-b border-zinc-200 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-zinc-800 block">Instant Payment via UPI</span>
                    <span className="text-[11px] text-zinc-500">Scan this QR code with PhonePe, Google Pay, or Paytm</span>
                  </div>
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR"
                    loading="lazy"
                    decoding="async"
                    className="w-16 h-16 rounded border border-zinc-200 p-0.5 bg-white"
                  />
                </div>
              )}

              {/* Footer Terms */}
              {structure.showTerms && profile.terms && (
                <div className="pt-3 text-[10px] text-zinc-500 space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Terms & Conditions</span>
                  <p className="whitespace-pre-line leading-relaxed">{profile.terms}</p>
                </div>
              )}

              {/* Signatures */}
              {structure.showSignatures && (
                <div className="pt-6 border-t border-zinc-100 flex justify-between items-end text-[10px] text-zinc-500 mt-3">
                  <div className="text-center min-w-[120px]">
                    {(customization.signatureType || structure.signatureType || 'typed') === 'typed' ? (
                      <div className="mb-1 flex flex-col items-center">
                        {(customization.signatureFontStyle || structure.signatureFontStyle || 'cursive') === 'cursive' ? (
                          <div className="font-['Caveat',cursive] text-2xl font-bold text-blue-900 select-none pb-0.5">
                            {customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}
                          </div>
                        ) : (customization.signatureFontStyle || structure.signatureFontStyle) === 'dancing' ? (
                          <div className="font-['Dancing_Script',cursive] text-xl font-bold text-indigo-950 select-none pb-0.5">
                            {customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}
                          </div>
                        ) : (customization.signatureFontStyle || structure.signatureFontStyle) === 'alex_brush' ? (
                          <div className="font-['Alex_Brush',cursive] text-2xl font-bold text-blue-950 select-none pb-0.5">
                            {customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}
                          </div>
                        ) : (customization.signatureFontStyle || structure.signatureFontStyle) === 'digital_stamp' ? (
                          <div className="inline-flex items-center gap-1 border border-emerald-600 bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-1">
                            <span>✓ DIGITALLY SIGNED:</span>
                            <span>{customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}</span>
                          </div>
                        ) : (
                          <div className="font-serif italic font-bold text-sm text-zinc-900 border-b border-zinc-900 pb-0.5 mb-1">
                            {customization.authorizedSignerName || structure.authorizedSignerName || profile.shopName || 'Mobile Hospital'}
                          </div>
                        )}
                        {customization.showDateWithSign && (
                          <div className="text-[8px] font-mono text-zinc-400">
                            Date: {order.date || new Date().toISOString().split('T')[0]}
                          </div>
                        )}
                      </div>
                    ) : null}
                    <div className="w-28 border-b border-zinc-300 mb-1 mx-auto" />
                    <span>Authorized Signatory</span>
                  </div>

                  <div className="text-center min-w-[120px]">
                    {(customization.customerSignType || structure.customerSignType) === 'typed' ? (
                      <div className="mb-1 flex flex-col items-center">
                        <div className="font-['Dancing_Script',cursive] text-lg font-bold text-zinc-800 select-none pb-0.5">
                          {customization.customerSignerName || structure.customerSignerName || order.name || 'Customer'}
                        </div>
                        <div className="text-[8px] font-mono text-zinc-400">
                          Acknowledged
                        </div>
                      </div>
                    ) : null}
                    <div className="w-28 border-b border-zinc-300 mb-1 mx-auto" />
                    <span>Customer Signature</span>
                  </div>
                </div>
              )}

              {/* Tear Line */}
              {structure.tearLine && (
                <div className="mt-4 pt-2 border-t-2 border-dashed border-zinc-300 flex items-center justify-center gap-1 text-[9px] text-zinc-400">
                  <Scissors className="w-3 h-3 text-zinc-400" />
                  <span>TEAR HERE</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer (Not Printed) */}
        <div className="p-3 px-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <span>Ticket: <strong className="text-zinc-800">{order.id}</strong></span>
            <span>•</span>
            <span>Paper: <strong className="text-zinc-800 uppercase">{structure.paperSize}</strong></span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {balance > 0 && onClearBalance && (
              <button
                type="button"
                onClick={() => onClearBalance(order.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Paid</span>
              </button>
            )}

            {/* Direct WhatsApp Send Link */}
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center gap-1.5 transition-colors cursor-pointer active:scale-98 shadow-xs"
              title={`Send WhatsApp bill directly to ${cleanPhone || order.phone}`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Bill</span>
              <ExternalLink className="w-3 h-3 opacity-90" />
            </a>

            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-98 shadow-xs"
              title="Share slip image or send via WhatsApp Cloud API"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Image Slip</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTextBill}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-98"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Cloud API & Image Modal */}
      {order && (
        <WhatsAppShareModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          order={order}
          profile={profile}
          receiptElementId="printableReceipt"
          onNavigateToSettings={onNavigateToSettings}
          onSaveProfile={onSaveProfile}
        />
      )}
    </div>
  );
};
