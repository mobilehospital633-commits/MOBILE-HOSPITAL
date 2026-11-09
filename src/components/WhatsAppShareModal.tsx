import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  ClipboardCheck,
  Image as ImageIcon,
  Phone,
  Eye,
  EyeOff,
  Sliders,
  Palette,
  Shield,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  PenTool,
  Award,
  Stamp,
  FileCheck2,
  ZoomIn,
  SlidersHorizontal,
} from 'lucide-react';
import { RepairOrder, ShopProfile } from '../types';
import {
  downloadReceiptImage,
  copyReceiptImageToClipboard,
  formatWhatsAppRecipientPhone,
} from '../utils/whatsappCloudApi';
import { getBillingQrPayload, generateQrCodeDataUrl } from '../utils/qr';
import { MHLogo } from './MHLogo';
import {
  MHRepairWatermark,
  WatermarkStyle,
  WATERMARK_STYLES,
} from './MHRepairWatermark';

export type ReceiptCopyStyle = 'modern' | 'thermal' | 'executive' | 'minimal';
export type { WatermarkStyle };
export type AccentColor = 'emerald' | 'blue' | 'slate' | 'amber' | 'rose';
export type SignatureFontStyle = 'cursive' | 'dancing' | 'alex_brush' | 'digital_stamp' | 'formal';

interface ReceiptCustomization {
  style: ReceiptCopyStyle;
  accent: AccentColor;
  showWatermark: boolean;
  watermarkText1: string; // Shop Name e.g. "MOBILE HOSPITAL"
  watermarkText2: string; // Business/Service e.g. "Mobile repairing centre"
  watermarkText3: string; // Location e.g. "kalitala Duttapulia"
  watermarkStyle: WatermarkStyle;
  watermarkOpacity: number; // e.g. 0.08, 0.14, 0.22
  showLogo: boolean;
  showAddress: boolean;
  showWarranty: boolean;
  showTerms: boolean;
  showSignatures: boolean;
  showStatusBadge: boolean;
  // Signature typing features
  signatureType: 'typed' | 'manual';
  authorizedSignerName: string;
  signatureFontStyle: SignatureFontStyle;
  showDateWithSign: boolean;
  customerSignType: 'typed' | 'manual';
  customerSignerName: string;
}

const DEFAULT_CUSTOMIZATION: ReceiptCustomization = {
  style: 'modern',
  accent: 'blue',
  showWatermark: true,
  watermarkText1: 'MOBILE HOSPITAL',
  watermarkText2: 'Mobile repairing centre',
  watermarkText3: 'kalitala Duttapulia',
  watermarkStyle: 'stamp',
  watermarkOpacity: 0.18,
  showLogo: true,
  showAddress: true,
  showWarranty: true,
  showTerms: true,
  showSignatures: true,
  showStatusBadge: true,
  signatureType: 'typed',
  authorizedSignerName: 'Mobile Hospital',
  signatureFontStyle: 'cursive',
  showDateWithSign: true,
  customerSignType: 'manual',
  customerSignerName: '',
};

const STORAGE_KEY = 'mh_receipt_customization_v3';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RepairOrder;
  profile: ShopProfile;
  receiptElementId?: string;
  onNavigateToSettings?: () => void;
  onSaveProfile?: (profile: ShopProfile) => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  order,
  profile,
}) => {
  const [phone, setPhone] = useState('');
  const [copiedImage, setCopiedImage] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [copiedImageToast, setCopiedImageToast] = useState(false);
  const [showSlipPreview, setShowSlipPreview] = useState(true);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [countryCode, setCountryCode] = useState('91');
  const [sharpnessLevel, setSharpnessLevel] = useState<3 | 4>(3); // 3 = Ultra HD, 4 = Extreme Crystal
  const [highContrastText, setHighContrastText] = useState<boolean>(true); // Pure black high-legibility text
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Customization state with persistent localStorage
  const [customization, setCustomization] = useState<ReceiptCustomization>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_CUSTOMIZATION;
  });

  const curr = profile.currency || '₹';
  const balance = Math.max(0, order.cost - order.deposit);
  const isSale = order.orderType === 'sale';
  const devName = order.deviceName || order.model || 'Device / Item';
  const shopDisplayName = (profile.shopName || 'MOBILE HOSPITAL').trim();

  // Watermark text parts
  const wm1 = (customization.watermarkText1 || shopDisplayName || 'MOBILE HOSPITAL').trim();
  const wm2 = (customization.watermarkText2 || 'Mobile repairing centre').trim();
  const wm3 = (customization.watermarkText3 || 'kalitala Duttapulia').trim();

  // Save customization changes to localStorage
  const updateCustomization = (patch: Partial<ReceiptCustomization>) => {
    setCustomization((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleResetCustomization = () => {
    const reset: ReceiptCustomization = {
      ...DEFAULT_CUSTOMIZATION,
      watermarkText1: shopDisplayName || 'MOBILE HOSPITAL',
      authorizedSignerName: shopDisplayName || 'Mobile Hospital',
    };
    setCustomization(reset);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    } catch {}
  };

  const handleApplyPresetTexts = () => {
    updateCustomization({
      watermarkText1: 'MOBILE HOSPITAL',
      watermarkText2: 'Mobile repairing centre',
      watermarkText3: 'kalitala Duttapulia',
      authorizedSignerName: 'Mobile Hospital',
    });
  };

  // Build standard message for WhatsApp chat
  const buildStandardMessage = () => {
    return [
      `*${shopDisplayName.toUpperCase()}*`,
      profile.address ? `📍 ${profile.address}` : '',
      profile.phone ? `📞 Contact: ${profile.phone}` : '',
      `--------------------------------`,
      `📄 *${isSale ? 'SALES INVOICE' : 'REPAIR JOB CARD'}*`,
      `🧾 *Bill / Order #:* ${order.id}`,
      `📅 *Date:* ${order.date || new Date().toISOString().split('T')[0]}`,
      `👤 *Customer:* ${order.name || 'Customer'}`,
      order.phone ? `📱 *Phone:* ${order.phone}` : '',
      `--------------------------------`,
      isSale
        ? `🛍️ *Items / Sales Details:*`
        : `🔧 *Device & Service Details:*`,
      `• *Device / Item:* ${devName}`,
      order.imei ? `• *IMEI / Serial:* ${order.imei}` : '',
      (order as any).issues && (order as any).issues.length > 0
        ? `• *Problems / Services:* ${(order as any).issues.join(', ')}`
        : order.problem
        ? `• *Problem:* ${order.problem}`
        : '',
      order.warranty ? `• *Warranty:* ${order.warranty}` : '',
      `--------------------------------`,
      `💰 *Total Amount:* ${curr}${order.cost.toFixed(2)}`,
      `💵 *Advance / Paid:* ${curr}${order.deposit.toFixed(2)}`,
      `💳 *Balance Due:* *${curr}${balance.toFixed(2)}*`,
      `📌 *Status:* ${order.status || 'Received'}`,
      order.expectedDate || (order as any).deliveryDate ? `⏰ *Est. Delivery:* ${order.expectedDate || (order as any).deliveryDate}` : '',
      `--------------------------------`,
      order.notes ? `📝 *Note:* ${order.notes}\n--------------------------------` : '',
      `Thank you for choosing ${shopDisplayName}! 🙏`,
      `Please keep this digital receipt for reference and warranty.`,
    ]
      .filter((line) => line !== '')
      .join('\n');
  };

  // Initialize values when modal opens or order changes
  useEffect(() => {
    if (isOpen && order) {
      const formatted = formatWhatsAppRecipientPhone(order.phone, countryCode);
      setPhone(formatted);
      setCopiedImage(false);
      setCopiedImageToast(false);
    }
  }, [isOpen, order]);

  // Generate Payment QR for the bill slip with 360px high-res resolution
  useEffect(() => {
    if (order && (profile.includeBillingQr !== false || profile.upi)) {
      const payload = getBillingQrPayload(order, profile);
      generateQrCodeDataUrl(payload.text, { width: 360, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch(() => setQrCodeUrl(''));
    } else {
      setQrCodeUrl('');
    }
  }, [order, profile]);

  // Clean phone input and keep digits only
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    setPhone(digits);
  };

  // Open Standard WhatsApp via wa.me with prefilled message
  const handleOpenWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Please enter a valid recipient phone number with country code.');
      return;
    }
    const message = buildStandardMessage();
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Copy Slip Image to Clipboard with selected Ultra-HD sharpness
  const handleCopySlipImage = async () => {
    setCopiedImage(false);
    const ok = await copyReceiptImageToClipboard('whatsappModalBillSlip', sharpnessLevel);
    if (ok) {
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 3000);
    } else {
      alert('Could not copy image to clipboard. You can click "Download PNG" instead.');
    }
  };

  // 1-Click: Copy Slip Image to Clipboard AND Open WhatsApp Chat
  const handleCopyImageAndOpenWhatsApp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Please enter a valid recipient phone number with country code.');
      return;
    }

    setCopiedImageToast(true);
    await copyReceiptImageToClipboard('whatsappModalBillSlip', sharpnessLevel);

    // Open WhatsApp Chat with recipient and clean greeting
    const encoded = encodeURIComponent(
      `Hello ${order.name || order.customerName || 'Customer'},\nHere is your digital bill receipt from ${shopDisplayName}:\n\n` +
      buildStandardMessage()
    );
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Download Slip as Image with selected Ultra-HD sharpness
  const handleDownloadSlipImage = async () => {
    setDownloadingImage(true);
    const filename = `${shopDisplayName.replace(/\s+/g, '_')}_${isSale ? 'Invoice' : 'Bill'}_${order.id}.png`;
    try {
      await downloadReceiptImage('whatsappModalBillSlip', filename, sharpnessLevel);
    } finally {
      setDownloadingImage(false);
    }
  };

  // Theme accent color maps
  const accentClasses = {
    emerald: {
      badge: 'bg-emerald-600 text-white',
      badgeLight: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      border: 'border-emerald-600',
      headerBg: 'from-emerald-600 via-emerald-700 to-teal-800',
      text: 'text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      watermarkColor: '#059669',
    },
    blue: {
      badge: 'bg-blue-600 text-white',
      badgeLight: 'bg-blue-50 text-blue-800 border-blue-200',
      border: 'border-blue-600',
      headerBg: 'from-blue-600 via-blue-700 to-indigo-800',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      watermarkColor: '#2563eb',
    },
    slate: {
      badge: 'bg-zinc-800 text-white',
      badgeLight: 'bg-zinc-100 text-zinc-800 border-zinc-300',
      border: 'border-zinc-800',
      headerBg: 'from-zinc-800 via-zinc-900 to-black',
      text: 'text-zinc-800',
      button: 'bg-zinc-900 hover:bg-zinc-800 text-white',
      watermarkColor: '#18181b',
    },
    amber: {
      badge: 'bg-amber-600 text-white',
      badgeLight: 'bg-amber-50 text-amber-800 border-amber-200',
      border: 'border-amber-600',
      headerBg: 'from-amber-600 via-amber-700 to-orange-800',
      text: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      watermarkColor: '#d97706',
    },
    rose: {
      badge: 'bg-rose-600 text-white',
      badgeLight: 'bg-rose-50 text-rose-800 border-rose-200',
      border: 'border-rose-600',
      headerBg: 'from-rose-600 via-rose-700 to-red-800',
      text: 'text-rose-700',
      button: 'bg-rose-600 hover:bg-rose-700 text-white',
      watermarkColor: '#e11d48',
    },
  }[customization.accent];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-overlay-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] border border-zinc-200 animate-modal-enter my-auto">
        
        {/* Header */}
        <div className={`px-5 py-3.5 bg-gradient-to-r ${accentClasses.headerBg} text-white flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">Share Receipt on WhatsApp</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {customization.style.toUpperCase()} SLIP
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                {isSale ? 'Sales Invoice' : 'Repair Job Card'}: <strong className="text-white">#{order.id}</strong> • {order.name || order.customerName || 'Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast / Prompt Banner when Image Copied */}
        {copiedImageToast && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2.5 flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 shrink-0 text-emerald-200" />
              <span>
                <strong>Bill Slip Image Copied!</strong> In WhatsApp, just press <strong>Ctrl + V</strong> (Paste) to send the image slip to your customer.
              </span>
            </div>
            <button
              onClick={() => setCopiedImageToast(false)}
              className="text-white hover:text-emerald-100 font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Recipient Phone Configuration Card */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Customer WhatsApp Number</span>
              </label>
              <span className="text-[11px] text-zinc-500">
                Target: <strong className="font-mono text-zinc-800">+{phone || '...'}</strong>
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative w-28 shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    setCountryCode(newCode);
                    const rawDigits = (order.phone || '').replace(/\D/g, '');
                    if (rawDigits.length === 10) {
                      setPhone(`${newCode}${rawDigits}`);
                    }
                  }}
                  className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="91">🇮🇳 +91 (IN)</option>
                  <option value="880">🇧🇩 +880 (BD)</option>
                  <option value="971">🇦🇪 +971 (UAE)</option>
                  <option value="966">🇸🇦 +966 (KSA)</option>
                  <option value="1">🇺🇸 +1 (US/CA)</option>
                  <option value="44">🇬🇧 +44 (UK)</option>
                  <option value="977">🇳🇵 +977 (NP)</option>
                  <option value="94">🇱🇰 +94 (LK)</option>
                </select>
              </div>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Slip Toolbar & Customization Header */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-zinc-800">
                  Digital Bill Slip Card
                </span>
                <span className={`text-[10px] ${accentClasses.badge} font-bold px-2 py-0.5 rounded-full capitalize`}>
                  {customization.style} Style
                </span>
                {customization.showWatermark && (
                  <span className="text-[10px] bg-zinc-200 text-zinc-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    Watermark ON
                  </span>
                )}
                {customization.signatureType === 'typed' && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <PenTool className="w-3 h-3 text-blue-600" />
                    Typed Sign ON
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Customize Receipt Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowCustomizePanel(!showCustomizePanel)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    showCustomizePanel
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white hover:bg-zinc-200/80 text-zinc-700 border-zinc-300'
                  }`}
                  title="Customize watermark text, stamps, signature typing, and layout"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Customize Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSlipPreview(!showSlipPreview)}
                  className="text-xs text-zinc-600 hover:text-zinc-900 font-medium px-2 py-1 rounded hover:bg-zinc-200/60 flex items-center gap-1 cursor-pointer"
                >
                  {showSlipPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSlipPreview ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            {/* EXPANDED CUSTOMIZATION PANEL */}
            {showCustomizePanel && (
              <div className="p-4 bg-zinc-50 border-b border-zinc-200 space-y-4 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    <span>Receipt Design, Watermark & Signature Studio</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCustomization}
                    className="text-[11px] text-zinc-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                {/* 1. Receipt Copy Style Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                    1. Receipt Copy Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'modern', label: 'Modern Card', desc: 'Sleek & Rounded' },
                      { id: 'thermal', label: 'Thermal POS', desc: 'Classic 80mm docket' },
                      { id: 'executive', label: 'Executive Border', desc: 'Framed certificate' },
                      { id: 'minimal', label: 'Minimal Tech', desc: 'Clean high contrast' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateCustomization({ style: s.id as ReceiptCopyStyle })}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          customization.style === s.id
                            ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                        }`}
                      >
                        <div className="font-bold text-xs text-zinc-900 flex items-center justify-between">
                          <span>{s.label}</span>
                          {customization.style === s.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Color Accent Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                    2. Color Accent
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-600' },
                      { id: 'blue', label: 'Cobalt Blue', bg: 'bg-blue-600' },
                      { id: 'slate', label: 'Dark Slate', bg: 'bg-zinc-800' },
                      { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-600' },
                      { id: 'rose', label: 'Crimson Rose', bg: 'bg-rose-600' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updateCustomization({ accent: c.id as AccentColor })}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                          customization.accent === c.id
                            ? 'bg-white border-zinc-800 shadow-2xs ring-1 ring-zinc-800'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shrink-0`} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Watermark Center Customization with Multiple Styles & Texts */}
                <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">Center Watermark Security Stamp</span>
                        <span className="text-[10px] text-zinc-500">Shop Name, Repairing Centre & Location</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyPresetTexts}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                        title="Set Mobile Hospital, Mobile repairing centre, kalitala Duttapulia"
                      >
                        ★ Quick Fill Preset
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customization.showWatermark}
                          onChange={(e) => updateCustomization({ showWatermark: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>

                  {customization.showWatermark && (
                    <div className="space-y-3 pt-2 border-t border-zinc-100">
                      
                      {/* Watermark 3-Line Text Inputs with Preset Shortcut */}
                      <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1 pb-1 border-b border-zinc-200/80">
                          <span className="text-[10px] font-bold text-zinc-700 uppercase">
                            3-Line Watermark Stamp Text
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateCustomization({
                                watermarkText1: 'MOBILE HOSPITAL',
                                watermarkText2: 'Mobile repairing centre',
                                watermarkText3: 'kalitala Duttapulia',
                                authorizedSignerName: 'Mobile Hospital',
                              });
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded border border-emerald-300 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Set: MOBILE HOSPITAL • Mobile repairing centre • kalitala Duttapulia"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-700" />
                            <span>Apply Default Shop Stamp Text</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[9.5px] font-bold text-zinc-600 uppercase mb-0.5">
                              Line 1: Shop Name
                            </label>
                            <input
                              type="text"
                              value={customization.watermarkText1}
                              onChange={(e) => updateCustomization({ watermarkText1: e.target.value })}
                              placeholder="MOBILE HOSPITAL"
                              className="w-full text-xs font-bold px-2 py-1.5 rounded border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                            />
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-bold text-zinc-600 uppercase mb-0.5">
                              Line 2: Business / Centre
                            </label>
                            <input
                              type="text"
                              value={customization.watermarkText2}
                              onChange={(e) => updateCustomization({ watermarkText2: e.target.value })}
                              placeholder="Mobile repairing centre"
                              className="w-full text-xs font-semibold px-2 py-1.5 rounded border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-bold text-zinc-600 uppercase mb-0.5">
                              Line 3: Location / Area
                            </label>
                            <input
                              type="text"
                              value={customization.watermarkText3}
                              onChange={(e) => updateCustomization({ watermarkText3: e.target.value })}
                              placeholder="kalitala Duttapulia"
                              className="w-full text-xs font-semibold px-2 py-1.5 rounded border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Watermark Stamp Style Choices - All 12 Styles */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                            Watermark Stamp Style ({WATERMARK_STYLES.length} Stamp Designs)
                          </label>
                          <span className="text-[10px] text-emerald-800 font-bold capitalize">
                            Current: {WATERMARK_STYLES.find(s => s.id === customization.watermarkStyle)?.label || customization.watermarkStyle}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                          {WATERMARK_STYLES.map((ws) => (
                            <button
                              key={ws.id}
                              type="button"
                              onClick={() => updateCustomization({ watermarkStyle: ws.id })}
                              className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                                customization.watermarkStyle === ws.id
                                  ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600 shadow-2xs font-bold'
                                  : 'bg-zinc-50/70 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                              }`}
                            >
                              <div className="text-[11px] font-bold flex items-center justify-between">
                                <span className="truncate">{ws.label}</span>
                                {customization.watermarkStyle === ws.id && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-500 mt-0.5 line-clamp-1">{ws.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Watermark Visibility Opacity */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase">
                          Watermark Visibility:
                        </span>
                        <div className="flex gap-1.5">
                          {[
                            { label: 'Subtle', val: 0.10 },
                            { label: 'Normal', val: 0.16 },
                            { label: 'Strong', val: 0.24 },
                            { label: 'Vivid', val: 0.32 },
                          ].map((op) => (
                            <button
                              key={op.label}
                              type="button"
                              onClick={() => updateCustomization({ watermarkOpacity: op.val })}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                                Math.abs(customization.watermarkOpacity - op.val) < 0.03
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                              }`}
                            >
                              {op.label}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* 4. Signature Typing & Settings */}
                <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">Signature Typing & Digital Seal</span>
                        <span className="text-[10px] text-zinc-500">Type your authorized signature name in handwriting</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.showSignatures}
                        onChange={(e) => updateCustomization({ showSignatures: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {customization.showSignatures && (
                    <div className="space-y-3 pt-2 border-t border-zinc-100">
                      
                      {/* Signing Mode Toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCustomization({ signatureType: 'typed' })}
                          className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            customization.signatureType === 'typed'
                              ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-2xs'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          <PenTool className="w-3.5 h-3.5 text-blue-600" />
                          <span>Type Signature Name (Digital)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateCustomization({ signatureType: 'manual' })}
                          className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            customization.signatureType === 'manual'
                              ? 'bg-zinc-800 border-zinc-800 text-white shadow-2xs'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          <span>Manual Blank Line (Pen Sign)</span>
                        </button>
                      </div>

                      {customization.signatureType === 'typed' && (
                        <div className="space-y-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                          
                          {/* Authorized Signatory Input */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">
                                Type Authorized Signatory Name:
                              </label>
                              <input
                                type="text"
                                value={customization.authorizedSignerName}
                                onChange={(e) => updateCustomization({ authorizedSignerName: e.target.value })}
                                placeholder="e.g. Mobile Hospital or Debashis"
                                className="w-full text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {['Mobile Hospital', 'Authorized Signatory', shopDisplayName].filter((v, i, a) => v && a.indexOf(v) === i).map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => updateCustomization({ authorizedSignerName: preset })}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-200 cursor-pointer transition-colors"
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">
                                Signature Script Style:
                              </label>
                              <select
                                value={customization.signatureFontStyle}
                                onChange={(e) => updateCustomization({ signatureFontStyle: e.target.value as SignatureFontStyle })}
                                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="cursive">Caveat Cursive (Flowing Ink Pen)</option>
                                <option value="dancing">Dancing Script (Artistic Calligraphy)</option>
                                <option value="alex_brush">Alex Brush (Royal Script Signature)</option>
                                <option value="digital_stamp">Official Verified Badge Stamp</option>
                                <option value="formal">Formal Executive Underline</option>
                              </select>
                            </div>
                          </div>

                          {/* Live Signature Preview Box */}
                          <div className="p-2.5 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">
                              Signature Preview:
                            </span>
                            <div className="text-right">
                              {customization.signatureFontStyle === 'cursive' ? (
                                <div className="font-['Caveat',cursive] text-2xl font-bold text-blue-900 tracking-wide transform -rotate-3 select-none">
                                  {customization.authorizedSignerName || 'Mobile Hospital'}
                                </div>
                              ) : customization.signatureFontStyle === 'dancing' ? (
                                <div className="font-['Dancing_Script',cursive] text-xl font-bold text-blue-900 select-none">
                                  {customization.authorizedSignerName || 'Mobile Hospital'}
                                </div>
                              ) : customization.signatureFontStyle === 'alex_brush' ? (
                                <div className="font-['Alex_Brush',cursive] text-2xl font-bold text-blue-900 select-none">
                                  {customization.authorizedSignerName || 'Mobile Hospital'}
                                </div>
                              ) : customization.signatureFontStyle === 'digital_stamp' ? (
                                <div className="inline-flex items-center gap-1 border border-emerald-600 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                  <span>✓ DIGITALLY SIGNED:</span>
                                  <span>{customization.authorizedSignerName || 'Mobile Hospital'}</span>
                                </div>
                              ) : (
                                <div className="font-serif italic font-bold text-sm text-zinc-900 border-b border-zinc-900 pb-0.5">
                                  {customization.authorizedSignerName || 'Mobile Hospital'}
                                </div>
                              )}
                              <div className="text-[9px] text-zinc-500 mt-0.5">
                                Date: {order.date || new Date().toISOString().split('T')[0]}
                              </div>
                            </div>
                          </div>

                          {/* Customer Sign Type */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-zinc-700 font-semibold">
                              Customer Signature Mode:
                            </span>
                            <div className="flex gap-2">
                              <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name="custSign"
                                  checked={customization.customerSignType === 'manual'}
                                  onChange={() => updateCustomization({ customerSignType: 'manual' })}
                                  className="text-blue-600"
                                />
                                <span>Manual Blank Line</span>
                              </label>
                              <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name="custSign"
                                  checked={customization.customerSignType === 'typed'}
                                  onChange={() => updateCustomization({ customerSignType: 'typed' })}
                                  className="text-blue-600"
                                />
                                <span>Auto-Typed Customer Name</span>
                              </label>
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  )}
                </div>

                {/* 5. Content Elements Toggles */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                    5. Visible Content Elements
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'showLogo', label: 'Shop Logo' },
                      { key: 'showAddress', label: 'Address & Contact' },
                      { key: 'showWarranty', label: 'Warranty Terms' },
                      { key: 'showTerms', label: 'Terms & Conditions' },
                      { key: 'showStatusBadge', label: 'Payment Badge' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-zinc-200 cursor-pointer hover:bg-zinc-50"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(customization[item.key as keyof ReceiptCustomization])}
                          onChange={(e) => updateCustomization({ [item.key]: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                        <span className="text-[11px] font-semibold text-zinc-800">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Slip Action Bar & Clarity Controls */}
            <div className="p-2.5 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xs text-emerald-950 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Image Sharpness:</span>
                </div>

                {/* Resolution & Sharpness Mode Chips */}
                <div className="inline-flex rounded-lg border border-emerald-200 bg-white p-0.5 text-[11px] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSharpnessLevel(3)}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      sharpnessLevel === 3
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Ultra-HD 3x Resolution (300 DPI - standard high-clarity export)"
                  >
                    3x Ultra HD
                  </button>
                  <button
                    type="button"
                    onClick={() => setSharpnessLevel(4)}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      sharpnessLevel === 4
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Extreme Crystal 4x Resolution (400 DPI - maximum sharpness for tiny text)"
                  >
                    4x Crystal HD
                  </button>
                </div>

                {/* High Contrast Legibility Toggle */}
                <button
                  type="button"
                  onClick={() => setHighContrastText(!highContrastText)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    highContrastText
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                      : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                  }`}
                  title="Make text deep black and high-contrast for maximum legibility"
                >
                  <ZoomIn className="w-3 h-3 text-emerald-400" />
                  <span>High Contrast Text</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyImageAndOpenWhatsApp}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
                  title="Copy image and launch WhatsApp chat"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Copy Slip & Open</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySlipImage}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Copy image to clipboard"
                >
                  {copiedImage ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSlipImage}
                  disabled={downloadingImage}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Download PNG to device"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{downloadingImage ? 'Saving...' : 'Download PNG'}</span>
                </button>
              </div>
            </div>

            {/* RENDERED BILL SLIP CARD WITH CUSTOMIZATIONS & CENTER WATERMARK */}
            {showSlipPreview && (
              <div className="p-3 sm:p-5 bg-zinc-200/60 flex justify-center overflow-x-auto">
                <div
                  id="whatsappModalBillSlip"
                  className={`w-full max-w-[420px] bg-white text-zinc-950 p-5 rounded-2xl shadow-md text-xs relative overflow-hidden transition-all ${
                    highContrastText ? 'contrast-105' : ''
                  } ${
                    customization.style === 'thermal'
                      ? 'font-mono border-2 border-dashed border-zinc-500 bg-white text-black'
                      : customization.style === 'executive'
                      ? 'font-serif border-4 border-double border-zinc-800 bg-white text-zinc-950'
                      : customization.style === 'minimal'
                      ? 'font-sans border border-zinc-400 bg-white text-zinc-950'
                      : 'font-sans border border-zinc-300 bg-white text-zinc-950'
                  }`}
                  style={{
                    minWidth: '320px',
                    textRendering: 'geometricPrecision',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                  }}
                >
                  
                  {/* ====================================================
                      CENTER SHOP NAME WATERMARK WITH 12 EXPANDED STYLES
                  ==================================================== */}
                  {customization.showWatermark && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                      style={{ opacity: customization.watermarkOpacity }}
                    >
                      <MHRepairWatermark
                        size="full"
                        style={customization.watermarkStyle}
                        sublabel={wm1}
                        label={wm2}
                        bottomText={wm3}
                        color={accentClasses.watermarkColor}
                        opacityClass="opacity-100"
                        className="w-full h-full"
                      />
                    </div>
                  )}

                  {/* ====================================================
                      TOP DECORATIVE ACCENT BAR (Modern Style)
                  ==================================================== */}
                  {customization.style === 'modern' && (
                    <div className={`h-1.5 w-full bg-gradient-to-r ${accentClasses.headerBg} -mt-5 -mx-5 mb-4 rounded-t-2xl`} style={{ width: 'calc(100% + 2.5rem)' }} />
                  )}

                  {/* ====================================================
                      SHOP HEADER
                  ==================================================== */}
                  <div className="relative z-10 text-center pb-3 mb-3 border-b border-zinc-200">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {customization.showLogo && (
                        <div className={`w-8 h-8 rounded-xl ${accentClasses.badge} flex items-center justify-center shadow-xs shrink-0`}>
                          <MHLogo className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <h4 className={`font-black text-base tracking-tight uppercase ${accentClasses.text}`}>
                        {shopDisplayName}
                      </h4>
                    </div>

                    {profile.tagline && (
                      <p className={`text-[10px] font-semibold ${highContrastText ? 'text-zinc-800' : 'text-zinc-500'}`}>{profile.tagline}</p>
                    )}
                    {customization.showAddress && profile.address && (
                      <p className={`text-[10px] mt-0.5 leading-snug font-medium ${highContrastText ? 'text-zinc-950' : 'text-zinc-700'}`}>{profile.address}</p>
                    )}
                    {customization.showAddress && (profile.phone || profile.email) && (
                      <p className={`text-[10px] font-bold mt-0.5 ${highContrastText ? 'text-black' : 'text-zinc-800'}`}>
                        {profile.phone && `📞 ${profile.phone}`} {profile.email && `• ✉️ ${profile.email}`}
                      </p>
                    )}
                  </div>

                  {/* ====================================================
                      INVOICE / JOB CARD NUMBER & DATE BAR
                  ==================================================== */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] mb-3">
                    <span className={`font-black px-2.5 py-0.5 rounded-lg border ${
                      customization.style === 'thermal'
                        ? 'border-black text-black bg-zinc-100 font-mono'
                        : `${accentClasses.badgeLight} font-sans`
                    }`}>
                      {isSale ? 'SALES INVOICE' : 'JOB CARD'}: #{order.id}
                    </span>
                    <span className={`font-bold ${highContrastText ? 'text-black' : 'text-zinc-700'}`}>
                      📅 {order.date || new Date().toISOString().split('T')[0]}
                    </span>
                  </div>

                  {/* ====================================================
                      CUSTOMER & DEVICE INFORMATION
                  ==================================================== */}
                  <div className={`relative z-10 p-3 rounded-xl mb-3 space-y-1.5 text-[11px] border ${
                    customization.style === 'thermal'
                      ? 'bg-transparent border-dashed border-zinc-500 font-mono'
                      : 'bg-zinc-50/95 border-zinc-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`font-bold ${highContrastText ? 'text-zinc-800' : 'text-zinc-600'}`}>Customer Name:</span>
                      <strong className="text-black font-black text-xs">{order.name || order.customerName || 'Customer'}</strong>
                    </div>

                    {order.phone && (
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${highContrastText ? 'text-zinc-800' : 'text-zinc-600'}`}>Mobile Contact:</span>
                        <span className="text-black font-mono font-black">{order.phone}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className={`font-bold ${highContrastText ? 'text-zinc-800' : 'text-zinc-600'}`}>Device / Model:</span>
                      <strong className="text-black font-black">{devName}</strong>
                    </div>

                    {order.imei && (
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${highContrastText ? 'text-zinc-800' : 'text-zinc-600'}`}>IMEI / Serial:</span>
                        <span className="text-black font-mono font-black tracking-wider text-[10.5px]">{order.imei}</span>
                      </div>
                    )}

                    {customization.showWarranty && order.warranty && (
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-200">
                        <span className={`font-bold ${highContrastText ? 'text-zinc-800' : 'text-zinc-600'}`}>Warranty Given:</span>
                        <span className="text-emerald-900 font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          🛡️ {order.warranty}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ====================================================
                      REPORTED ISSUE / SERVICES
                  ==================================================== */}
                  {order.issues && order.issues.length > 0 ? (
                    <div className="relative z-10 mb-3 text-[11px]">
                      <div className="font-black text-black mb-1 flex items-center gap-1">
                        <span>Repairs & Services:</span>
                      </div>
                      <div className="bg-zinc-50/95 p-2 rounded-lg border border-zinc-300 space-y-1">
                        {order.issues.map((iss, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-black font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            <span>{iss}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : order.problem ? (
                    <div className="relative z-10 mb-3 text-[11px]">
                      <div className="font-black text-black mb-0.5">Reported Issue:</div>
                      <p className="text-black font-semibold bg-zinc-50/95 p-2 rounded-lg border border-zinc-300 leading-snug">
                        {order.problem}
                      </p>
                    </div>
                  ) : null}

                  {/* ====================================================
                      FINANCIAL SUMMARY TABLE
                  ==================================================== */}
                  <div className={`relative z-10 p-3 rounded-xl mb-3 space-y-1.5 border ${
                    customization.style === 'thermal'
                      ? 'border-dashed border-zinc-500 bg-transparent'
                      : 'border-zinc-300 bg-white shadow-2xs'
                  }`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-800">Total Amount:</span>
                      <span className="font-black text-black text-sm">
                        {curr}{order.cost.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-800">Advance / Paid:</span>
                      <span className="font-black text-emerald-800 text-sm">
                        {curr}{order.deposit.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                      <div>
                        <span className="font-black text-sm text-black block">Balance Due:</span>
                        {customization.showStatusBadge && (
                          <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            balance <= 0
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                              : 'bg-rose-100 text-rose-950 border-rose-400'
                          }`}>
                            {balance <= 0 ? '✓ PAID IN FULL' : '⚠ BALANCE DUE'}
                          </span>
                        )}
                      </div>

                      <span className={`font-black text-base ${balance > 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                        {curr}{balance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* ====================================================
                      UPI PAYMENT QR CODE (Crisp & Scannable)
                  ==================================================== */}
                  {qrCodeUrl && (
                    <div className="relative z-10 my-2.5 p-2.5 border border-dashed border-zinc-400 rounded-xl bg-zinc-50/90 flex flex-col items-center justify-center text-center">
                      <img
                        src={qrCodeUrl}
                        alt="Payment QR"
                        loading="eager"
                        decoding="sync"
                        style={{ imageRendering: 'pixelated' }}
                        className="w-20 h-20 rounded border border-zinc-300 p-0.5 bg-white mb-1 shadow-2xs"
                      />
                      <span className="text-[10px] font-black text-black">Scan to Pay via UPI</span>
                      <span className="text-[9px] text-zinc-800 font-mono font-bold">
                        {balance > 0 ? `Due: ${curr}${balance.toFixed(2)}` : 'Instant Counter Pay'}
                      </span>
                    </div>
                  )}

                  {/* ====================================================
                      TERMS & CONDITIONS
                  ==================================================== */}
                  {customization.showTerms && profile.terms && (
                    <div className="relative z-10 pt-1 text-[9.5px] text-center text-zinc-700 font-medium leading-tight whitespace-pre-line mb-2">
                      {profile.terms}
                    </div>
                  )}

                  <div className="relative z-10 pt-1 text-center text-[10.5px] font-extrabold text-black">
                    Thank you for choosing {shopDisplayName}!
                  </div>

                  {/* ====================================================
                      SIGNATURE LINES & TYPED SIGNATURE
                  ==================================================== */}
                  {customization.showSignatures && (
                    <div className="relative z-10 pt-3 border-t border-zinc-200 flex justify-between items-end text-[9px] text-zinc-500 font-sans mt-3">
                      
                      {/* Authorized Sign Column */}
                      <div className="text-center min-w-[110px]">
                        {customization.signatureType === 'typed' ? (
                          <div className="mb-1 flex flex-col items-center">
                            {customization.signatureFontStyle === 'cursive' ? (
                              <div
                                className="font-['Caveat',cursive] text-2xl font-bold tracking-wide transform -rotate-3 text-blue-900 select-none pb-0.5"
                                style={{ textShadow: '0 0 1px rgba(30,58,138,0.3)' }}
                              >
                                {customization.authorizedSignerName || 'Mobile Hospital'}
                              </div>
                            ) : customization.signatureFontStyle === 'dancing' ? (
                              <div
                                className="font-['Dancing_Script',cursive] text-xl font-bold tracking-normal transform -rotate-2 text-indigo-950 select-none pb-0.5"
                              >
                                {customization.authorizedSignerName || 'Mobile Hospital'}
                              </div>
                            ) : customization.signatureFontStyle === 'alex_brush' ? (
                              <div
                                className="font-['Alex_Brush',cursive] text-2xl font-bold tracking-wide transform -rotate-2 text-blue-950 select-none pb-0.5"
                              >
                                {customization.authorizedSignerName || 'Mobile Hospital'}
                              </div>
                            ) : customization.signatureFontStyle === 'digital_stamp' ? (
                              <div className="inline-flex items-center gap-1 border border-emerald-600 bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mb-1">
                                <span className="text-emerald-600">✓ SIGNED:</span>
                                <span>{customization.authorizedSignerName || 'Mobile Hospital'}</span>
                              </div>
                            ) : (
                              <div className="font-serif italic font-bold text-xs text-zinc-900 border-b border-zinc-900 pb-0.5 mb-1">
                                {customization.authorizedSignerName || 'Mobile Hospital'}
                              </div>
                            )}

                            {customization.showDateWithSign && (
                              <div className="text-[8px] font-mono text-zinc-400">
                                Date: {order.date || new Date().toISOString().split('T')[0]}
                              </div>
                            )}
                          </div>
                        ) : null}

                        <div className="w-24 border-b border-zinc-300 mb-1 mx-auto" />
                        <span className="font-bold text-zinc-700">Authorized Sign</span>
                      </div>

                      {/* Customer Sign Column */}
                      <div className="text-center min-w-[110px]">
                        {customization.customerSignType === 'typed' ? (
                          <div className="mb-1 flex flex-col items-center">
                            <div className="font-['Dancing_Script',cursive] text-lg font-bold text-zinc-800 select-none pb-0.5">
                              {customization.customerSignerName || order.name || order.customerName || 'Customer'}
                            </div>
                            <div className="text-[8px] font-mono text-zinc-400">
                              Acknowledged
                            </div>
                          </div>
                        ) : null}

                        <div className="w-24 border-b border-zinc-300 mb-1 mx-auto" />
                        <span className="font-bold text-zinc-700">Customer Sign</span>
                      </div>

                    </div>
                  )}

                  {/* Thermal Tear Edge Simulation */}
                  {customization.style === 'thermal' && (
                    <div className="text-center text-zinc-400 font-mono text-[9px] mt-2 select-none tracking-widest">
                      - - - - - - - - - - - - - - - - - - -
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
          <div className="text-xs text-zinc-500">
            <span>Customer: <strong className="font-mono text-zinc-800">+{phone || '...'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleCopyImageAndOpenWhatsApp}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Copy slip image and open chat"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>Copy Slip & Open</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className={`px-5 py-2 rounded-xl text-xs font-bold ${accentClasses.button} flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
