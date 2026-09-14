import { ThemeMode, ThemeAccent, ShopProfile } from '../types';

export interface SolarPhaseInfo {
  phase: 'morning' | 'day' | 'dusk' | 'night';
  mode: ThemeMode;
  label: string;
  desc: string;
  timeString: string;
}

export const PRESET_ACCENTS: {
  id: ThemeAccent;
  name: string;
  color: string;
  hoverColor: string;
  textColorDark: string;
}[] = [
  { id: 'slate', name: 'Classic Slate', color: '#18181b', hoverColor: '#27272a', textColorDark: '#f4f4f5' },
  { id: 'emerald', name: 'Emerald Tech', color: '#059669', hoverColor: '#047857', textColorDark: '#34d399' },
  { id: 'cobalt', name: 'Cobalt Blue', color: '#2563eb', hoverColor: '#1d4ed8', textColorDark: '#60a5fa' },
  { id: 'amber', name: 'Amber Gold', color: '#d97706', hoverColor: '#b45309', textColorDark: '#fbbf24' },
  { id: 'rose', name: 'Ruby Rose', color: '#e11d48', hoverColor: '#be123c', textColorDark: '#fb7185' },
  { id: 'violet', name: 'Electric Violet', color: '#7c3aed', hoverColor: '#6d28d9', textColorDark: '#c4b5fd' },
  { id: 'cyan', name: 'Cyber Cyan', color: '#0891b2', hoverColor: '#0e7490', textColorDark: '#67e8f9' },
  { id: 'orange', name: 'Flame Orange', color: '#ea580c', hoverColor: '#c2410c', textColorDark: '#fdba74' },
  { id: 'teal', name: 'Mint Teal', color: '#0d9488', hoverColor: '#0f766e', textColorDark: '#5eead4' },
  { id: 'fuchsia', name: 'Neon Fuchsia', color: '#c026d3', hoverColor: '#a21caf', textColorDark: '#f0abfc' },
  { id: 'indigo', name: 'Deep Indigo', color: '#4f46e5', hoverColor: '#4338ca', textColorDark: '#a5b4fc' },
  { id: 'lime', name: 'Laser Lime', color: '#65a30d', hoverColor: '#4d7c0f', textColorDark: '#bef264' },
];

/**
 * Calculates current Solar / Time-Adaptive phase based on local time
 */
export function getSolarPhaseInfo(date = new Date()): SolarPhaseInfo {
  const hour = date.getHours();
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (hour >= 6 && hour < 12) {
    return {
      phase: 'morning',
      mode: 'glacier',
      label: 'Morning Glacier',
      desc: 'Cool & focused daylight for morning workshop opening',
      timeString,
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      phase: 'day',
      mode: 'light',
      label: 'Daylight High-Contrast',
      desc: 'Maximum visibility under active bench illumination',
      timeString,
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      phase: 'dusk',
      mode: 'sepia',
      label: 'Golden Hour Warm Sand',
      desc: 'Eye-comfort warm tone reducing blue-light fatigue',
      timeString,
    };
  } else {
    return {
      phase: 'night',
      mode: 'midnight',
      label: 'Midnight Indigo',
      desc: 'Deep slate darkness protecting your eyes during late repair shifts',
      timeString,
    };
  }
}

/**
 * Convert Hex to RGBA string with alpha
 */
export function hexToRgba(hex: string, alpha = 0.15): string {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const r = parseInt(cleaned.substring(0, 2), 16) || 0;
  const g = parseInt(cleaned.substring(2, 4), 16) || 0;
  const b = parseInt(cleaned.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Determines if hex is light or dark to pick white vs dark text
 */
export function isLightColor(hex: string): boolean {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const r = parseInt(cleaned.substring(0, 2), 16) || 0;
  const g = parseInt(cleaned.substring(2, 4), 16) || 0;
  const b = parseInt(cleaned.substring(4, 6), 16) || 0;
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

/**
 * Adjust hex color brightness
 */
export function adjustBrightness(hex: string, percent: number): string {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Resolve effective accent colors
 */
export function resolveAccentColors(accent: ThemeAccent | string = 'slate', customHex?: string) {
  if (accent === 'custom' && customHex) {
    const isLight = isLightColor(customHex);
    return {
      color: customHex,
      hoverColor: adjustBrightness(customHex, isLight ? -25 : 20),
      lightBg: hexToRgba(customHex, 0.15),
      borderRgba: hexToRgba(customHex, 0.35),
      glowRgba: hexToRgba(customHex, 0.45),
      textColor: isLight ? '#09090b' : '#ffffff',
      textColorDark: isLight ? customHex : '#60a5fa',
    };
  }

  const preset = PRESET_ACCENTS.find((a) => a.id === accent) || PRESET_ACCENTS[0];
  const isLight = isLightColor(preset.color);

  return {
    color: preset.color,
    hoverColor: preset.hoverColor,
    lightBg: hexToRgba(preset.color, 0.15),
    borderRgba: hexToRgba(preset.color, 0.35),
    glowRgba: hexToRgba(preset.color, 0.4),
    textColor: isLight ? '#09090b' : '#ffffff',
    textColorDark: preset.textColorDark,
  };
}

/**
 * Apply full theme and accent styling dynamically to the document
 */
export function applyThemeModeAndAccent(
  profile: Partial<ShopProfile>,
  onSolarUpdate?: (info: SolarPhaseInfo) => void
) {
  const root = document.documentElement;
  const themeMode: ThemeMode = profile.theme || 'light';
  const accent: ThemeAccent = profile.themeAccent || 'slate';
  const customHex = profile.customAccentColor || '#2563eb';
  const enableGlow = profile.accentGlow !== false;

  const applyModeClass = (mode: ThemeMode) => {
    // Clear all theme mode classes
    root.classList.remove(
      'dark',
      'theme-midnight',
      'theme-forest',
      'theme-cyber',
      'theme-sepia',
      'theme-glacier',
      'theme-amethyst',
      'theme-sunset',
      'theme-oled'
    );

    switch (mode) {
      case 'dark':
        root.classList.add('dark');
        break;
      case 'midnight':
        root.classList.add('dark', 'theme-midnight');
        break;
      case 'forest':
        root.classList.add('dark', 'theme-forest');
        break;
      case 'cyber':
        root.classList.add('dark', 'theme-cyber');
        break;
      case 'amethyst':
        root.classList.add('dark', 'theme-amethyst');
        break;
      case 'sunset':
        root.classList.add('dark', 'theme-sunset');
        break;
      case 'oled':
        root.classList.add('dark', 'theme-oled');
        break;
      case 'glacier':
        root.classList.add('theme-glacier');
        break;
      case 'sepia':
        root.classList.add('theme-sepia');
        break;
      default:
        // standard daylight light mode
        break;
    }
    root.setAttribute('data-theme', mode);
  };

  if (themeMode === 'solar') {
    const solarInfo = getSolarPhaseInfo();
    applyModeClass(solarInfo.mode);
    root.setAttribute('data-solar-phase', solarInfo.phase);
    if (onSolarUpdate) onSolarUpdate(solarInfo);
  } else if (themeMode === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyModeClass(isDark ? 'dark' : 'light');
  } else {
    applyModeClass(themeMode);
  }

  // Apply accent colors via CSS variables
  const accentColors = resolveAccentColors(accent, customHex);
  root.style.setProperty('--theme-accent', accentColors.color);
  root.style.setProperty('--theme-accent-hover', accentColors.hoverColor);
  root.style.setProperty('--theme-accent-light', accentColors.lightBg);
  root.style.setProperty('--theme-accent-border', accentColors.borderRgba);
  root.style.setProperty('--theme-accent-glow', `0 0 16px ${accentColors.glowRgba}`);
  root.style.setProperty('--theme-accent-text', accentColors.textColor);
  root.style.setProperty('--theme-accent-text-dark', accentColors.textColorDark);

  root.setAttribute('data-accent', accent);
  root.setAttribute('data-accent-glow', enableGlow ? 'true' : 'false');
}
