import QRCode from 'qrcode';
import { RepairOrder, ShopProfile } from '../types';

export function getBillingQrPayload(order: RepairOrder, profile: ShopProfile): { text: string; label: string } {
  const balance = Math.max(0, order.cost - order.deposit);
  const upiId = (profile.upi || '').trim();
  const shopName = (profile.upiPayeeName || profile.shopName || 'Mobile Hospital').trim();

  if (profile.qrType === 'upi' && upiId) {
    // Standard UPI string
    const amParam = balance > 0 ? `&am=${balance.toFixed(2)}` : '';
    const note = encodeURIComponent(`Bill for ${order.id} - ${order.model}`);
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}${amParam}&cu=INR&tn=${note}`;
    return {
      text: upiUri,
      label: balance > 0 ? `UPI Pay: ${profile.currency || '₹'}${balance.toFixed(2)}` : `UPI: ${upiId}`,
    };
  }

  if (profile.qrType === 'custom_url' && profile.customQrUrl) {
    const url = profile.customQrUrl.replace('{id}', order.id).replace('{amount}', balance.toFixed(2));
    return {
      text: url,
      label: 'Scan for Digital Bill / Portal',
    };
  }

  // Digital Invoice data string
  const invoiceData = `VERIFIED BILL\nTicket: ${order.id}\nCustomer: ${order.name}\nDevice: ${order.model}\nDate: ${order.date}\nTotal: ${profile.currency || '₹'}${order.cost.toFixed(2)}\nDeposit: ${profile.currency || '₹'}${order.deposit.toFixed(2)}\nDue: ${profile.currency || '₹'}${balance.toFixed(2)}\nShop: ${profile.shopName}`;
  return {
    text: invoiceData,
    label: `Bill Ref: ${order.id}`,
  };
}

export async function generateQrCodeDataUrl(text: string, options: { width?: number; margin?: number; darkColor?: string } = {}): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options.width || 220,
      margin: options.margin ?? 1,
      color: {
        dark: options.darkColor || '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('QR code generation failed', err);
    return '';
  }
}
