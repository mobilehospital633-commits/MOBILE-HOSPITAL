import { RepairOrder } from '../types';

/**
 * Extracts and returns the clean commercial device name from an order.
 * Handles both separated 'deviceName' field and legacy combined 'model' strings.
 */
export function getOrderDeviceName(order: Partial<RepairOrder> | null | undefined): string {
  if (!order) return 'Unknown Device';
  if (order.deviceName && order.deviceName.trim()) {
    return order.deviceName.trim();
  }
  if (order.model && order.model.trim()) {
    // Check if model contains parenthesized model number e.g. "iPhone 13 Pro (A2638)"
    const match = order.model.match(/^(.*?)(?:\s*[\(\[]([^\)\]]+)[\)\]])?$/);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
    return order.model.trim();
  }
  return 'Unknown Device';
}

/**
 * Extracts and returns the specific hardware model number from an order.
 * Handles both separated 'modelNumber' field and legacy combined 'model' strings.
 */
export function getOrderModelNumber(order: Partial<RepairOrder> | null | undefined): string {
  if (!order) return '';
  if (order.modelNumber && order.modelNumber.trim()) {
    return order.modelNumber.trim();
  }
  if (order.model && order.model.trim()) {
    const match = order.model.match(/[\(\[]([^\)\]]+)[\)\]]/);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
  }
  return '';
}

/**
 * Formats a clean representation combining Device Name and Model Number.
 * e.g. "iPhone 13 Pro (A2638)" or "iPhone 13 Pro"
 */
export function formatDeviceDisplay(order: Partial<RepairOrder> | null | undefined): string {
  if (!order) return 'Unknown Device';
  const name = getOrderDeviceName(order);
  const modelNo = getOrderModelNumber(order);
  if (modelNo && !name.includes(modelNo)) {
    return `${name} (${modelNo})`;
  }
  return name;
}

/**
 * Common hardware model numbers reference mapping for fast auto-suggestion
 */
export const POPULAR_DEVICE_MODEL_MAP: Record<string, string[]> = {
  'iPhone 16 Pro Max': ['A3296', 'A3084', 'A3295'],
  'iPhone 16 Pro': ['A3293', 'A3083', 'A3292'],
  'iPhone 16 Plus': ['A3290', 'A3082'],
  'iPhone 16': ['A3287', 'A3081'],
  'iPhone 15 Pro Max': ['A3106', 'A2849', 'A3105'],
  'iPhone 15 Pro': ['A3102', 'A2848', 'A3101'],
  'iPhone 15 Plus': ['A3094', 'A2847'],
  'iPhone 15': ['A3090', 'A2846', 'A3089'],
  'iPhone 14 Pro Max': ['A2894', 'A2651', 'A2893'],
  'iPhone 14 Pro': ['A2890', 'A2650', 'A2889'],
  'iPhone 14 Plus': ['A2886', 'A2632'],
  'iPhone 14': ['A2882', 'A2649', 'A2881'],
  'iPhone 13 Pro Max': ['A2643', 'A2484', 'A2641'],
  'iPhone 13 Pro': ['A2638', 'A2483', 'A2636'],
  'iPhone 13': ['A2633', 'A2482', 'A2631'],
  'iPhone 13 mini': ['A2628', 'A2481'],
  'iPhone 12 Pro Max': ['A2411', 'A2342'],
  'iPhone 12 Pro': ['A2407', 'A2341'],
  'iPhone 12': ['A2403', 'A2172'],
  'iPhone 11 Pro Max': ['A2218', 'A2161'],
  'iPhone 11 Pro': ['A2215', 'A2160'],
  'iPhone 11': ['A2221', 'A2111'],
  'iPhone XR': ['A2105', 'A1984'],
  'iPhone X': ['A1865', 'A1901'],
  'Galaxy S24 Ultra': ['SM-S928B', 'SM-S928U', 'SM-S928B/DS'],
  'Galaxy S24+': ['SM-S926B', 'SM-S926U'],
  'Galaxy S24': ['SM-S921B', 'SM-S921U'],
  'Galaxy S23 Ultra': ['SM-S918B', 'SM-S918U', 'SM-S918B/DS'],
  'Galaxy S23+': ['SM-S916B', 'SM-S916U'],
  'Galaxy S23': ['SM-S911B', 'SM-S911U'],
  'Galaxy S22 Ultra': ['SM-S908B', 'SM-S908U'],
  'Galaxy S22+': ['SM-S906B', 'SM-S906U'],
  'Galaxy S22': ['SM-S901B', 'SM-S901U'],
  'Galaxy S21 Ultra': ['SM-G998B', 'SM-G998U'],
  'Galaxy Z Fold 6': ['SM-F956B', 'SM-F956U'],
  'Galaxy Z Flip 6': ['SM-F741B', 'SM-F741U'],
  'Galaxy A55 5G': ['SM-A556B', 'SM-A556E'],
  'Galaxy A54 5G': ['SM-A546B', 'SM-A546E'],
  'Galaxy A35 5G': ['SM-A356B'],
  'Galaxy A34 5G': ['SM-A346B'],
  'OnePlus 12': ['CPH2581', 'CPH2573'],
  'OnePlus 12R': ['CPH2585', 'CPH2609'],
  'OnePlus 11': ['CPH2449', 'CPH2447'],
  'OnePlus 11R': ['CPH2487'],
  'OnePlus 10 Pro': ['NE2213', 'NE2211'],
  'OnePlus Nord CE 3': ['CPH2569'],
  'Redmi Note 13 Pro+ 5G': ['23090RA98G'],
  'Redmi Note 13 Pro': ['23090RA98I', '2312DRA50G'],
  'Redmi Note 12 Pro': ['22101316C', '22101316I'],
  'Vivo V29 5G': ['V2250'],
  'Vivo V30 Pro': ['V2319'],
  'Vivo T2 Pro': ['V2312'],
  'Realme 12 Pro+': ['RMX3840'],
  'Realme 11 Pro': ['RMX3771'],
  'Pixel 8 Pro': ['GC3VE', 'G1MNW'],
  'Pixel 8': ['GKWS6', 'G9BQD'],
  'Pixel 7a': ['GWKK3', 'GHL1X'],
};

/**
 * Returns suggested model numbers for a given device name, if known
 */
export function getModelNumberSuggestions(deviceName: string): string[] {
  if (!deviceName) return [];
  const clean = deviceName.trim().toLowerCase();
  for (const [key, numbers] of Object.entries(POPULAR_DEVICE_MODEL_MAP)) {
    if (key.toLowerCase() === clean || clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
      return numbers;
    }
  }
  return [];
}
