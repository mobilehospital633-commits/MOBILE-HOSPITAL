import { RepairOrder, StolenDeviceRecord } from '../types';

/**
 * Clean IMEI string by stripping spaces, hyphens, and non-numeric characters
 */
export function cleanImei(raw: string): string {
  if (!raw) return '';
  return raw.replace(/[^0-9]/g, '').trim();
}

/**
 * Validates 15-digit IMEI using standard GSM Luhn algorithm
 */
export function validateLuhn(imei: string): boolean {
  const cleaned = cleanImei(imei);
  if (cleaned.length !== 15) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(cleaned[i], 10);
    // Double every second digit starting from index 1 (odd indices in 0-indexed 15-digit string)
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
}

/**
 * Formats a 15-digit IMEI for enhanced human readability:
 * e.g. 356892-09-123456-7
 */
export function formatImeiDisplay(imei: string): string {
  const cleaned = cleanImei(imei);
  if (cleaned.length < 15) return cleaned;
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 14)}-${cleaned.slice(14)}`;
}

export interface TacDecoded {
  tac: string;
  brand: string;
  modelFamily: string;
  marketRegion: string;
  reportingBody: string;
}

/**
 * Decodes the 8-digit Type Allocation Code (TAC) from the start of an IMEI
 */
export function decodeTac(imei: string): TacDecoded {
  const cleaned = cleanImei(imei);
  const tac = cleaned.slice(0, 8);

  if (cleaned.startsWith('359402') || cleaned.startsWith('356892') || cleaned.startsWith('352019') || cleaned.startsWith('354890')) {
    return {
      tac,
      brand: 'Apple',
      modelFamily: cleaned.startsWith('359402') ? 'iPhone 15 Pro Max' : cleaned.startsWith('356892') ? 'iPhone 13 / 14 Series' : 'iPhone iOS Device',
      marketRegion: 'Global / APAC / India A2849',
      reportingBody: 'BABT (British Approvals Board for Telecommunications)',
    };
  }

  if (cleaned.startsWith('984019') || cleaned.startsWith('982301') || cleaned.startsWith('357891')) {
    return {
      tac,
      brand: 'Samsung',
      modelFamily: cleaned.startsWith('984019') ? 'Galaxy S23 Ultra 5G' : 'Galaxy S-Series / Note Device',
      marketRegion: 'Global / India (SM-S918B)',
      reportingBody: 'TUV Rheinland / KTC',
    };
  }

  if (cleaned.startsWith('861234') || cleaned.startsWith('869012') || cleaned.startsWith('864521')) {
    return {
      tac,
      brand: 'OnePlus',
      modelFamily: 'OnePlus 11R / 12R Series',
      marketRegion: 'India / Asia Pacific (CPH2487)',
      reportingBody: 'TAF (Telecommunication Terminal Testing Authority)',
    };
  }

  if (cleaned.startsWith('86')) {
    return {
      tac,
      brand: 'BBK / Xiaomi / Oppo / Vivo',
      modelFamily: 'Android Smartphone',
      marketRegion: 'Asia / Global',
      reportingBody: 'TAF Telecommunications',
    };
  }

  if (cleaned.startsWith('35')) {
    return {
      tac,
      brand: 'Google / Apple / Motorola',
      modelFamily: 'LTE / 5G Mobile Terminal',
      marketRegion: 'International GSM',
      reportingBody: 'GSMA Global Allocations',
    };
  }

  return {
    tac: tac || 'N/A',
    brand: 'Generic GSM Device',
    modelFamily: 'Mobile Cellular Terminal',
    marketRegion: 'Standard GSM / LTE Band',
    reportingBody: 'GSMA International IMEI Registry',
  };
}

export type ImeiRiskLevel =
  | 'CRITICAL_STOLEN'
  | 'BLACKLISTED'
  | 'LOST'
  | 'IN_SHOP_MATCH'
  | 'CLEAN'
  | 'INVALID_FORMAT';

export interface ImeiAuditResult {
  cleanedImei: string;
  formattedImei: string;
  length: number;
  isValidLength: boolean;
  isLuhnValid: boolean;
  tacInfo: TacDecoded;
  isStolen: boolean;
  isBlacklisted: boolean;
  riskLevel: ImeiRiskLevel;
  stolenRecord: StolenDeviceRecord | null;
  matchedOrders: RepairOrder[];
  ceirStatus: 'Blacklisted (Stolen / Barred)' | 'Reported Stolen (Police FIR)' | 'Reported Lost' | 'Clean & Active' | 'Unknown';
  policeFirNumber?: string;
  policeStation?: string;
  ownerName?: string;
  ownerPhone?: string;
}

/**
 * Comprehensive Stolen Phone & Blacklist Check
 */
export function auditImei(
  rawImei: string,
  stolenRegistry: StolenDeviceRecord[],
  repairOrders: RepairOrder[] = []
): ImeiAuditResult {
  const cleaned = cleanImei(rawImei);
  const isValidLength = cleaned.length === 15;
  const isLuhnValid = isValidLength ? validateLuhn(cleaned) : false;
  const tacInfo = decodeTac(cleaned);

  // Match against Stolen/Lost database
  const matchedRecord = stolenRegistry.find((rec) => {
    const p1 = cleanImei(rec.imei);
    const p2 = cleanImei(rec.imei2 || '');
    return (p1 && p1 === cleaned) || (p2 && p2 === cleaned);
  }) || null;

  // Match against active/existing repair orders
  const matchedOrders = repairOrders.filter((o) => {
    const oImei = cleanImei(o.imei);
    return oImei && oImei === cleaned;
  });

  let riskLevel: ImeiRiskLevel = 'CLEAN';
  let ceirStatus: ImeiAuditResult['ceirStatus'] = 'Clean & Active';

  if (!cleaned || cleaned.length < 8) {
    riskLevel = 'INVALID_FORMAT';
    ceirStatus = 'Unknown';
  } else if (matchedRecord) {
    if (matchedRecord.status === 'stolen') {
      riskLevel = 'CRITICAL_STOLEN';
      ceirStatus = 'Reported Stolen (Police FIR)';
    } else if (matchedRecord.status === 'blacklisted') {
      riskLevel = 'BLACKLISTED';
      ceirStatus = 'Blacklisted (Stolen / Barred)';
    } else if (matchedRecord.status === 'lost') {
      riskLevel = 'LOST';
      ceirStatus = 'Reported Lost';
    } else if (matchedRecord.status === 'in_shop_match') {
      riskLevel = 'IN_SHOP_MATCH';
      ceirStatus = 'Reported Stolen (Police FIR)';
    }
  }

  // If in active repair bench and is stolen
  if (matchedRecord && matchedOrders.length > 0) {
    riskLevel = 'IN_SHOP_MATCH';
  }

  return {
    cleanedImei: cleaned,
    formattedImei: formatImeiDisplay(cleaned),
    length: cleaned.length,
    isValidLength,
    isLuhnValid,
    tacInfo,
    isStolen: riskLevel === 'CRITICAL_STOLEN' || riskLevel === 'IN_SHOP_MATCH',
    isBlacklisted: riskLevel === 'BLACKLISTED',
    riskLevel,
    stolenRecord: matchedRecord,
    matchedOrders,
    ceirStatus,
    policeFirNumber: matchedRecord?.policeFirNumber,
    policeStation: matchedRecord?.policeStation,
    ownerName: matchedRecord?.ownerName,
    ownerPhone: matchedRecord?.ownerPhone,
  };
}
