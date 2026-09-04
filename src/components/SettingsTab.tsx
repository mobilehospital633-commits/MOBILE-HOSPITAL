import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Download,
  Upload,
  Save,
  Trash2,
  QrCode,
  Store,
  Receipt,
  RotateCcw,
  CheckCircle,
  Eye,
  EyeOff,
  Palette,
} from 'lucide-react';
import { ShopProfile, ThemeMode, ThemeAccent } from '../types';
import { generateQrCodeDataUrl } from '../utils/qr';
import { MHLogo } from './MHLogo';
import { ThemeSelector } from './ThemeSelector';

interface SettingsTabProps {
  profile: ShopProfile;
  onSaveProfile: (profile: ShopProfile) => void;
  onClearOrders: () => void;
  onClearInventory: () => void;
  onClearTransactions?: () => void;
  onResetAllData: () => void;
  onImportProfile: (profile: ShopProfile) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profile,
  onSaveProfile,
  onClearOrders,
  onClearInventory,
  onClearTransactions,
  onResetAllData,
  onImportProfile,
}) => {
  const [subtab, setSubtab] = useState<'general' | 'tax' | 'system'>('tax');
  const [formData, setFormData] = useState<ShopProfile>(profile);
  const [previewQrUrl, setPreviewQrUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Update sample QR preview
  useEffect(() => {
    const upiId = formData.upi || 'shop@upi';
    const sampleUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      formData.upiPayeeName || formData.shopName || 'Shop'
    )}&am=1500.00&cu=INR&tn=Sample%20Repair%20Bill`;
    generateQrCodeDataUrl(sampleUri, { width: 140, margin: 1 }).then((url) => {
      setPreviewQrUrl(url);
    });
  }, [formData.upi, formData.upiPayeeName, formData.shopName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `mobile_hospital_profile_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.shopName) {
          onImportProfile(imported);
          alert('Profile settings imported successfully!');
        } else {
          alert('Invalid profile JSON configuration.');
        }
      } catch (err) {
        alert('Could not read JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-6 sm:p-7 space-y-6">
        
        {/* Header & Logo Live Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-100 pb-5 gap-4">
          <div className="flex items-center gap-3.5">
            <MHLogo
              customUrl={formData.logoUrl}
              size="lg"
              rounded="xl"
              theme="dark"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                  {formData.shopName || 'MOBILE HOSPITAL'}
                </h2>
                <span className="bg-zinc-100 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-200">
                  Official MH Branding
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Receipt Design, Customer Billing QR & Shop Profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export</span>
            </button>
            <label className="bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Subtabs */}
        <div className="flex border-b border-zinc-100 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubtab('general')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider ${
              subtab === 'general'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            General & Branding
          </button>
          <button
            type="button"
            onClick={() => setSubtab('tax')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
              subtab === 'tax'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Billing QR & Receipts</span>
          </button>
          <button
            type="button"
            onClick={() => setSubtab('system')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
              subtab === 'system'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & System</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SUBTAB 1: General & Branding */}
          {subtab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Store Identity & Customer Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Shop Brand Logo
                    </label>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '' })}
                        className="text-[11px] text-zinc-600 hover:text-zinc-900 font-semibold underline cursor-pointer"
                      >
                        Reset to Official MH Logo
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="shrink-0">
                      <MHLogo
                        customUrl={formData.logoUrl}
                        size="sm"
                        rounded="md"
                        theme="light"
                      />
                    </div>
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="Leave empty for Official MH Logo, or paste custom URL"
                      className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Default is the official high-resolution <strong>MH (Mobile Hospital)</strong> emblem.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@mobilehospital.com"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Shop Address (Printed on Receipts) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-semibold text-zinc-400">@</span>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="mobilehospital"
                      className="w-full pl-7 border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Website / Link
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="mobilehospital.com"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: Tax & Billing QR */}
          {subtab === 'tax' && (
            <div className="space-y-5">
              
              {/* Highlight Card for Customer Billing QR Feature */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center text-white">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-900">Customer Billing QR Code Integration</h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Automatically embed a customer payment QR code onto all printed, PDF, and digital receipts. Customers can scan directly with Google Pay, PhonePe, Paytm, or any UPI app to pay the exact balance due.
                  </p>
                  <div className="flex items-center gap-3 pt-1.5">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.includeBillingQr}
                        onChange={(e) =>
                          setFormData({ ...formData, includeBillingQr: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                    <span className="text-xs font-medium text-zinc-800">
                      {formData.includeBillingQr ? 'Enabled on Customer Receipts' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Sample Live QR Preview Box */}
                <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs text-center shrink-0 flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Live QR Preview
                  </span>
                  {previewQrUrl ? (
                    <img
                      src={previewQrUrl}
                      alt="Sample Billing QR"
                      className="w-24 h-24 object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-zinc-100 animate-pulse rounded" />
                  )}
                  <span className="text-[10px] font-mono text-zinc-600 mt-1 max-w-[120px] truncate">
                    {formData.upi || 'shop@upi'}
                  </span>
                </div>
              </div>

              {/* UPI & Payment Config */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    UPI ID / VPA (For Customer Billing QR) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.upi}
                    onChange={(e) => setFormData({ ...formData, upi: e.target.value })}
                    placeholder="e.g. mobilehospital@upi or 9876543210@paytm"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm font-mono text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    Used to generate direct-pay QR codes with exact order balance.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    UPI Payee Name (Shown in Customer Banking Apps)
                  </label>
                  <input
                    type="text"
                    value={formData.upiPayeeName || ''}
                    onChange={(e) => setFormData({ ...formData, upiPayeeName: e.target.value })}
                    placeholder="e.g. Mobile Hospital Repairs"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Tax Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.gst}
                    onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm font-mono text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Tax Label
                  </label>
                  <input
                    type="text"
                    value={formData.taxLabel}
                    onChange={(e) => setFormData({ ...formData, taxLabel: e.target.value })}
                    placeholder="e.g. GST / VAT"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="18"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="₹ or $"
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Tax Toggle */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-800">Print Tax Breakdown on Receipts</h4>
                  <p className="text-[11px] text-zinc-400">
                    Calculates subtotal excluding tax and displays tax line item on receipts.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showTaxOnReceipt}
                    onChange={(e) =>
                      setFormData({ ...formData, showTaxOnReceipt: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              {/* Terms */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Receipt Footer Warranty & Terms (Printed on all slips)
                </label>
                <textarea
                  rows={3}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* SUBTAB 3: Theme & System */}
          {subtab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Application Theme, Preferences & Storage Maintenance
              </h3>

              {/* Theme & Color Scheme Section */}
              <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-zinc-700" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Theme & Display Appearance
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                    Live Real-Time
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Switch between daytime crisp light mode and deep OLED dark mode for bench repairs, plus customize accent highlights. Changes take effect immediately and are saved to your profile.
                </p>
                <div className="pt-2">
                  <ThemeSelector
                    theme={formData.theme || 'light'}
                    accent={formData.themeAccent || 'slate'}
                    onChangeTheme={(newTheme) => {
                      const updated = { ...formData, theme: newTheme };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                    onChangeAccent={(newAccent) => {
                      const updated = { ...formData, themeAccent: newAccent };
                      setFormData(updated);
                      onSaveProfile(updated);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Default Initial Status
                  </label>
                  <select
                    value={formData.defaultStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultStatus: e.target.value as ShopProfile['defaultStatus'],
                      })
                    }
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm focus:border-zinc-900 focus:outline-none transition-colors bg-white cursor-pointer text-zinc-800"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Interface Density
                  </label>
                  <select
                    value={formData.density}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        density: e.target.value as ShopProfile['density'],
                      })
                    }
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm focus:border-zinc-900 focus:outline-none transition-colors bg-white cursor-pointer text-zinc-800"
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
              </div>

              {/* Dashboard & Counter Privacy */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-zinc-700" />
                      <span>Hide Total Billed (Counter Privacy Mode)</span>
                    </h4>
                    {formData.hideTotalBilled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    Masks the Total Billed and revenue figures with <span className="font-mono font-semibold text-zinc-700">••••••••</span> on the Dashboard to maintain privacy while customers or visitors stand near the counter. You can also toggle this instantly anytime using the eye icon on the Dashboard or top header bar.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!formData.hideTotalBilled}
                    onChange={(e) =>
                      setFormData({ ...formData, hideTotalBilled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              {/* Data Cleaning */}
              <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-semibold text-rose-900 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Data Reset & Purge Options</span>
                </h4>
                <p className="text-xs text-rose-700/80 leading-relaxed">
                  Permanently clear local data from your browser storage. Export a backup before proceeding.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete all repair orders? This cannot be undone.')) {
                        onClearOrders();
                      }
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs active:scale-98"
                  >
                    Clear Orders Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete all inventory records? This cannot be undone.')) {
                        onClearInventory();
                      }
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs active:scale-98"
                  >
                    Clear Inventory Only
                  </button>
                  {onClearTransactions && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete all income and expense account entries? This cannot be undone.')) {
                          onClearTransactions();
                        }
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs active:scale-98"
                    >
                      Clear Accounts Ledger Only
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset entire system to factory default values? All custom data will be cleared.')) {
                        onResetAllData();
                      }
                    }}
                    className="bg-rose-800 hover:bg-rose-900 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs active:scale-98"
                  >
                    Reset All Data to Default
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between border-t border-zinc-100 pt-5">
            <div>
              {saveSuccess && (
                <span className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Settings saved successfully!</span>
                </span>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
