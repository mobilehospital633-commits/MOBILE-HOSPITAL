import { toPng, toBlob } from 'html-to-image';

export interface WhatsAppCloudImagePayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'image';
  image: {
    link: string;
    caption?: string;
  };
}

/**
 * Sanitizes and cleans a Meta WhatsApp Access Token.
 * Strips surrounding quotes, "Bearer " prefix, and unwanted internal whitespace/linebreaks.
 */
export function cleanMetaAccessToken(token: string): string {
  if (!token) return '';
  let cleaned = token.trim();
  // Strip surrounding quotes
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '').trim();
  // Strip leading 'Bearer ' (case insensitive)
  cleaned = cleaned.replace(/^bearer\s+/i, '').trim();
  // Strip any internal spaces, newlines, carriage returns
  cleaned = cleaned.replace(/[\s\r\n]+/g, '');
  return cleaned;
}

/**
 * Sanitizes and cleans a Meta WhatsApp Phone Number ID.
 * Strips surrounding quotes and any non-digit characters.
 */
export function cleanMetaPhoneNumberId(id: string): string {
  if (!id) return '';
  let cleaned = id.trim();
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '').trim();
  // Keep only digits
  cleaned = cleaned.replace(/\D/g, '');
  return cleaned;
}

/**
 * Standardize recipient phone number for WhatsApp Cloud API.
 * WhatsApp requires international format digits only without '+' or leading zeros.
 * E.g., for 10-digit number '9876543210' -> prepends '91' by default if 10 digits, or keeps 11+ digits.
 */
export function formatWhatsAppRecipientPhone(phone: string, defaultCountryCode = '91'): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';

  // If 10 digits, prepend default country code (e.g. 91 for India or 880 for BD)
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  // If 11 digits starting with 0 (e.g. BD 017xxxxxxxx)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `880${digits.substring(1)}`;
  }

  return digits;
}

/**
 * Builds the exact Meta WhatsApp Business Cloud API JSON payload for image sending.
 */
export function buildWhatsAppImagePayload(
  recipientPhone: string,
  imageUrl: string,
  caption?: string
): WhatsAppCloudImagePayload {
  const cleanPhone = formatWhatsAppRecipientPhone(recipientPhone);
  const trimmedUrl = (imageUrl || '').trim();

  const payload: WhatsAppCloudImagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone || 'RECIPIENT_PHONE_NUMBER',
    type: 'image',
    image: {
      link: trimmedUrl || 'https://YOUR_IMAGE_URL_HERE.jpg',
    },
  };

  if (caption && caption.trim()) {
    payload.image.caption = caption.trim();
  }

  return payload;
}

/**
 * Directly sends the WhatsApp Cloud API payload via Meta Graph API v21.0
 */
export async function sendWhatsAppCloudImageMessage(
  phoneNumberId: string,
  accessToken: string,
  payload: WhatsAppCloudImagePayload
): Promise<{ success: boolean; data?: any; error?: string; diagnostic?: string }> {
  const cleanId = cleanMetaPhoneNumberId(phoneNumberId);
  const cleanToken = cleanMetaAccessToken(accessToken);

  if (!cleanId) {
    return {
      success: false,
      error: 'WhatsApp Phone Number ID is missing or invalid. Please configure it.',
      diagnostic: 'Phone Number ID should contain only digits (e.g. 100609349925184) from Meta App Dashboard.',
    };
  }
  if (!cleanToken) {
    return {
      success: false,
      error: 'Meta WhatsApp Access Token is missing. Please configure it.',
      diagnostic: 'Access Token usually starts with "EAA..." and should not include the word "Bearer" or quotes.',
    };
  }
  if (!payload.to || payload.to === 'RECIPIENT_PHONE_NUMBER') {
    return {
      success: false,
      error: 'Valid recipient phone number is required.',
      diagnostic: 'Recipient number must be formatted with country code (e.g. 919876543210).',
    };
  }
  if (!payload.image.link || payload.image.link.includes('YOUR_IMAGE_URL_HERE')) {
    return {
      success: false,
      error: 'Valid image URL is required.',
      diagnostic: 'Meta Cloud API requires a publicly accessible HTTPS image link.',
    };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${cleanId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok) {
      const errCode = resData?.error?.code;
      const rawMsg =
        resData?.error?.message ||
        resData?.error?.error_user_msg ||
        `Cloud API Error (${response.status}): ${response.statusText}`;

      let diagnostic = '';
      if (
        errCode === 190 ||
        rawMsg.toLowerCase().includes('access token') ||
        rawMsg.toLowerCase().includes('oauthexception') ||
        rawMsg.toLowerCase().includes('cannot parse')
      ) {
        diagnostic =
          'The Meta Access Token is invalid, expired, or malformed. Temporary tokens expire after 24 hours. Paste a fresh token from Meta Developer Dashboard (starts with EAA...).';
      } else if (errCode === 100) {
        diagnostic =
          'Invalid parameters. Ensure recipient number includes country code without symbols, and image URL is a valid public link.';
      } else if (errCode === 131030 || errCode === 131047) {
        diagnostic =
          'Customer service window or test number constraint. When using a Meta sandbox test number, you must add the recipient number in Meta Developers test recipients or initiate conversation from customer first.';
      } else if (errCode === 131026) {
        diagnostic = 'Message undeliverable. Verify the recipient phone number is active on WhatsApp.';
      }

      return { success: false, error: rawMsg, data: resData, diagnostic };
    }

    return { success: true, data: resData };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error occurred while calling Meta WhatsApp Cloud API.',
      diagnostic: 'Check your internet connection or browser network blockers for graph.facebook.com.',
    };
  }
}

/**
 * Capture receipt DOM element as ultra-sharp high resolution image Data URL (PNG).
 * Default pixelRatio is 3 (300+ DPI Retina quality) with crisp geometric text precision.
 */
export async function captureReceiptToDataUrl(
  elementId: string,
  pixelRatio = 3
): Promise<string | null> {
  let el = document.getElementById(elementId);
  if (!el) {
    el = document.getElementById('whatsappModalBillSlip') || document.getElementById('printableReceipt');
  }
  if (!el) {
    console.warn(`Element with id "${elementId}" not found for receipt capture.`);
    return null;
  }

  try {
    // Ensure all web fonts are fully loaded before capturing
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    return await toPng(el, {
      pixelRatio: Math.max(2, Math.min(4, pixelRatio)),
      quality: 1.0,
      cacheBust: true,
      backgroundColor: '#ffffff',
      style: {
        transform: 'scale(1)',
        textRendering: 'geometricPrecision',
        webkitFontSmoothing: 'antialiased',
      } as unknown as Partial<CSSStyleDeclaration>,
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
    });
  } catch (err) {
    console.error('Failed to capture receipt as image:', err);
    return null;
  }
}

/**
 * Capture receipt and trigger PNG file download with crystal-clear text and details
 */
export async function downloadReceiptImage(
  elementId: string,
  filename = 'receipt.png',
  pixelRatio = 3
): Promise<boolean> {
  const dataUrl = await captureReceiptToDataUrl(elementId, pixelRatio);
  if (!dataUrl) return false;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

/**
 * Copy receipt image to clipboard as PNG blob with ultra-sharp text and details
 */
export async function copyReceiptImageToClipboard(
  elementId: string,
  pixelRatio = 3
): Promise<boolean> {
  let el = document.getElementById(elementId);
  if (!el) {
    el = document.getElementById('whatsappModalBillSlip') || document.getElementById('printableReceipt');
  }
  if (!el) {
    console.warn(`Element with id "${elementId}" not found for receipt clipboard copy.`);
    return false;
  }

  try {
    // Ensure all web fonts are loaded
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const blob = await toBlob(el, {
      pixelRatio: Math.max(2, Math.min(4, pixelRatio)),
      quality: 1.0,
      cacheBust: true,
      backgroundColor: '#ffffff',
      style: {
        transform: 'scale(1)',
        textRendering: 'geometricPrecision',
        webkitFontSmoothing: 'antialiased',
      } as unknown as Partial<CSSStyleDeclaration>,
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
    });

    if (!blob) return false;

    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}
