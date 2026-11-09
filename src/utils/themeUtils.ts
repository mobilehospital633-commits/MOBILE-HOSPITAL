import { ThemeMode, ThemeAccent, BackgroundStyle, ShopProfile, StylePreset } from '../types';

export interface SolarPhaseInfo {
  phase: 'morning' | 'day' | 'dusk' | 'night';
  mode: ThemeMode;
  label: string;
  desc: string;
  timeString: string;
}

export interface BackgroundStyleOption {
  id: BackgroundStyle;
  name: string;
  tagline: string;
  desc: string;
  badge: string;
  patternType: 'grid' | 'glow' | 'dots' | 'blueprint' | 'mesh' | 'clean';
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cyberpunk-stealth',
    name: 'Cyberpunk Stealth Pro',
    tagline: 'Midnight Dark • Electric Violet • Tech Mesh',
    desc: 'Deep stealth studio canvas with high-contrast electric violet accents and hardware mesh lattice.',
    theme: 'dark',
    accent: 'violet',
    backgroundStyle: 'mesh',
    accentGlow: true,
    badge: 'Cyber Dark',
    previewBg: 'linear-gradient(135deg, #09090b 0%, #1e1035 100%)',
    accentHex: '#7c3aed',
  },
  {
    id: 'executive-titanium',
    name: 'Executive Minimal Studio',
    tagline: 'Daylight White • Classic Slate • Satin Canvas',
    desc: 'Ultra-clean Swiss minimalist workspace with distraction-free monochrome contrast.',
    theme: 'light',
    accent: 'slate',
    backgroundStyle: 'clean',
    accentGlow: false,
    badge: 'Clean Minimal',
    previewBg: 'linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)',
    accentHex: '#18181b',
  },
  {
    id: 'esd-workbench',
    name: 'ESD Precision Workbench',
    tagline: 'Daylight White • Cobalt Blue • ESD Grid',
    desc: 'Classic mobile repair engineering bench with grounding coordinate grid and cobalt highlights.',
    theme: 'light',
    accent: 'cobalt',
    backgroundStyle: 'workbench',
    accentGlow: true,
    badge: 'ESD Grid',
    previewBg: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)',
    accentHex: '#2563eb',
  },
  {
    id: 'obsidian-neon',
    name: 'Obsidian AMOLED Neon',
    tagline: 'Pure OLED Black • Cyber Cyan • Studio Glow',
    desc: '100% true pitch black canvas with glowing cyber cyan bloom for maximum OLED battery savings.',
    theme: 'oled',
    accent: 'cyan',
    backgroundStyle: 'glow',
    accentGlow: true,
    badge: 'AMOLED Black',
    previewBg: 'linear-gradient(135deg, #000000 0%, #083344 100%)',
    accentHex: '#0891b2',
  },
  {
    id: 'matrix-terminal',
    name: 'Matrix Cyber Diagnostic',
    tagline: 'Cyber Forest • Emerald Tech • Dot Matrix',
    desc: 'High-contrast hardware diagnostic console with matrix green accents and precision dot matrix.',
    theme: 'forest',
    accent: 'emerald',
    backgroundStyle: 'dots',
    accentGlow: true,
    badge: 'Matrix Tech',
    previewBg: 'linear-gradient(135deg, #04120e 0%, #064e3b 100%)',
    accentHex: '#059669',
  },
  {
    id: 'schematic-cad',
    name: 'Schematic CAD Blueprint',
    tagline: 'Arctic Glacier • Cobalt Blue • CAD Dual Grid',
    desc: 'Dual-grid motherboard schematic layout on cool frost slate with technical blueprint grid.',
    theme: 'glacier',
    accent: 'cobalt',
    backgroundStyle: 'blueprint',
    accentGlow: true,
    badge: 'CAD Blueprint',
    previewBg: 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)',
    accentHex: '#2563eb',
  },
  {
    id: 'vintage-craft',
    name: 'Warm Parchment Craft',
    tagline: 'Warm Sand • Amber Gold • ESD Workbench',
    desc: 'Eye-soothing parchment sepia with warm amber bronze tone for comfortable long repair sessions.',
    theme: 'sepia',
    accent: 'amber',
    backgroundStyle: 'workbench',
    accentGlow: false,
    badge: 'Warm Sepia',
    previewBg: 'linear-gradient(135deg, #fbf7ee 0%, #fef3c7 100%)',
    accentHex: '#d97706',
  },
  {
    id: 'sunset-bloom',
    name: 'Sunset Amber Glow',
    tagline: 'Warm Sand • Flame Orange • Ambient Glow',
    desc: 'Warm evening lighting bloom with fiery orange accents casting soft workshop ambient light.',
    theme: 'sepia',
    accent: 'orange',
    backgroundStyle: 'glow',
    accentGlow: true,
    badge: 'Sunset Glow',
    previewBg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    accentHex: '#ea580c',
  },
];

export const BACKGROUND_STYLE_OPTIONS: BackgroundStyleOption[] = [
  {
    id: 'workbench',
    name: 'Technical Workbench Grid',
    tagline: 'Precision ESD Mat Coordinates',
    desc: 'Engineering 24px micro-grid with coordinate intersections and subtle ambient workbench illumination.',
    badge: 'Workbench Grid',
    patternType: 'grid',
  },
  {
    id: 'glow',
    name: 'Ambient Studio Glow',
    tagline: 'Dynamic Accent Radial Spotlight',
    desc: 'Silky radial lighting bloom casting soft brand aura across the entire workstation surface.',
    badge: 'Studio Glow',
    patternType: 'glow',
  },
  {
    id: 'dots',
    name: 'Micro-Dot Matrix',
    tagline: '20px Precision Swiss Tech Dots',
    desc: 'Clean, architectural dotted matrix canvas providing subtle depth without visual clutter.',
    badge: 'Dot Matrix',
    patternType: 'dots',
  },
  {
    id: 'blueprint',
    name: 'Schematic Blueprint CAD',
    tagline: 'Engineering Dual-Grid Schematic',
    desc: 'Dual 10px minor and 50px major drafting grid inspired by mobile motherboard schematics.',
    badge: 'CAD Blueprint',
    patternType: 'blueprint',
  },
  {
    id: 'mesh',
    name: 'Circuit Tech Mesh',
    tagline: 'Geometric Hardware Lattice',
    desc: 'Sophisticated 45° angled hardware lattice texture reminiscent of precision micro-soldering gear.',
    badge: 'Tech Mesh',
    patternType: 'mesh',
  },
  {
    id: 'clean',
    name: 'Minimalist Satin Canvas',
    tagline: 'Ultra-Clean Studio Neutral',
    desc: 'Pure, distraction-free matte surface with zero pattern overlay for maximal simplicity.',
    badge: 'Minimal Canvas',
    patternType: 'clean',
  },
];

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
      mode: 'dark',
      label: 'Night Stealth Dark',
      desc: 'Deep midnight dark mode protecting your eyes from fatigue during late-night repair shifts',
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
      'theme-sepia',
      'theme-glacier',
      'theme-midnight',
      'theme-forest',
      'theme-cyber',
      'theme-amethyst',
      'theme-sunset',
      'theme-oled'
    );

    switch (mode) {
      case 'dark':
        root.classList.add('dark');
        break;
      case 'oled':
        root.classList.add('dark', 'theme-oled');
        break;
      case 'forest':
        root.classList.add('dark', 'theme-forest');
        break;
      case 'glacier':
        root.classList.add('theme-glacier');
        break;
      case 'sepia':
        root.classList.add('theme-sepia');
        break;
      case 'light':
      default:
        // Daylight White mode (clean crisp light)
        break;
    }
    root.setAttribute('data-theme', mode);
  };

  if (themeMode === 'solar') {
    const solarInfo = getSolarPhaseInfo();
    applyModeClass(solarInfo.mode);
    root.setAttribute('data-solar-phase', solarInfo.phase);
    if (onSolarUpdate) onSolarUpdate(solarInfo);
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

  // Apply Background Style
  const bgStyle: BackgroundStyle = profile.backgroundStyle || 'workbench';
  root.setAttribute('data-bg-style', bgStyle);
  root.classList.remove(
    'bg-style-workbench',
    'bg-style-glow',
    'bg-style-dots',
    'bg-style-blueprint',
    'bg-style-mesh',
    'bg-style-clean'
  );
  root.classList.add(`bg-style-${bgStyle}`);

  // Apply Visual Smoothness & Sharpness Modes
  const smoothness = profile.visualSmoothness || profile.screenConfig?.smoothness || 'ultra';
  const sharpness = profile.visualSharpness || profile.screenConfig?.sharpness || 'ultra';
  const thermalSharpness = profile.thermalSharpness || profile.pageStructure?.thermalSharpness || 'ultra';

  root.setAttribute('data-smoothness', smoothness);
  root.setAttribute('data-sharpness', sharpness);
  root.setAttribute('data-thermal-sharpness', thermalSharpness);
}

