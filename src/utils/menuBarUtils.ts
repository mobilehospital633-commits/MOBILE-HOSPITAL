import type React from 'react';
import { ShopProfile, MenuBarColorPreset, MenuBarStyle } from '../types';

export interface MenuBarColorOption {
  id: MenuBarColorPreset;
  name: string;
  tagline: string;
  bgHex: string;
  headerBgHex: string;
  footerBgHex: string;
  borderHex: string;
  isLight: boolean;
  badge: string;
}

export interface MenuBarStyleOption {
  id: MenuBarStyle;
  name: string;
  tagline: string;
  desc: string;
  badge: string;
}

export const MENU_BAR_COLOR_OPTIONS: MenuBarColorOption[] = [
  {
    id: 'default',
    name: 'Deep Midnight',
    tagline: 'Classic Hardware Terminal',
    bgHex: '#0d0f17',
    headerBgHex: '#090a10',
    footerBgHex: '#07080d',
    borderHex: '#1e2230',
    isLight: false,
    badge: 'Classic',
  },
  {
    id: 'obsidian',
    name: 'Obsidian AMOLED',
    tagline: '100% Pure True Black',
    bgHex: '#000000',
    headerBgHex: '#050505',
    footerBgHex: '#020202',
    borderHex: '#18181b',
    isLight: false,
    badge: 'AMOLED',
  },
  {
    id: 'slate',
    name: 'Slate Titanium',
    tagline: 'Refined Industrial Charcoal',
    bgHex: '#0f172a',
    headerBgHex: '#0a0f1d',
    footerBgHex: '#070b14',
    borderHex: '#1e293b',
    isLight: false,
    badge: 'Titanium',
  },
  {
    id: 'navy',
    name: 'Royal Navy',
    tagline: 'Deep Maritime Midnight',
    bgHex: '#0b1329',
    headerBgHex: '#080d1c',
    footerBgHex: '#050914',
    borderHex: '#1e2c4f',
    isLight: false,
    badge: 'Deep Navy',
  },
  {
    id: 'sapphire',
    name: 'Cobalt Sapphire',
    tagline: 'High-Tech Precision Blue',
    bgHex: '#081a3a',
    headerBgHex: '#051126',
    footerBgHex: '#030b1a',
    borderHex: '#1d3566',
    isLight: false,
    badge: 'Tech Blue',
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    tagline: 'Cyber Diagnostic Forest',
    bgHex: '#041f17',
    headerBgHex: '#02140f',
    footerBgHex: '#010c09',
    borderHex: '#064e3b',
    isLight: false,
    badge: 'Cyber Green',
  },
  {
    id: 'violet',
    name: 'Amethyst Violet',
    tagline: 'Cyberpunk Electric Purple',
    bgHex: '#160b2c',
    headerBgHex: '#0f071f',
    footerBgHex: '#090414',
    borderHex: '#3b1d6e',
    isLight: false,
    badge: 'Electric',
  },
  {
    id: 'crimson',
    name: 'Ruby Crimson',
    tagline: 'Deep Velvet Luxury Wine',
    bgHex: '#22080c',
    headerBgHex: '#170508',
    footerBgHex: '#0e0305',
    borderHex: '#4c111a',
    isLight: false,
    badge: 'Crimson',
  },
  {
    id: 'sepia',
    name: 'Vintage Espresso',
    tagline: 'Warm Leather & Roasted Roast',
    bgHex: '#1b140e',
    headerBgHex: '#130e0a',
    footerBgHex: '#0c0906',
    borderHex: '#382b20',
    isLight: false,
    badge: 'Warm Sepia',
  },
  {
    id: 'cyber_cyan',
    name: 'Cyber Cyan',
    tagline: 'Electric Neon High-Tech Teal',
    bgHex: '#03222a',
    headerBgHex: '#02161b',
    footerBgHex: '#010d10',
    borderHex: '#084b5c',
    isLight: false,
    badge: 'Neon Cyan',
  },
  {
    id: 'amber_gold',
    name: 'Velvet Amber',
    tagline: 'Warm Bronze & Artisan Gold',
    bgHex: '#1e1305',
    headerBgHex: '#150d03',
    footerBgHex: '#0c0702',
    borderHex: '#4d330f',
    isLight: false,
    badge: 'Bronze Gold',
  },
  {
    id: 'rose_quartz',
    name: 'Royal Plum Rose',
    tagline: 'Velvet Midnight Burgundy Orchid',
    bgHex: '#240a1d',
    headerBgHex: '#190614',
    footerBgHex: '#10030c',
    borderHex: '#521441',
    isLight: false,
    badge: 'Plum Rose',
  },
  {
    id: 'forest_pine',
    name: 'Alpine Pine',
    tagline: 'Deep Evergreen Forest Reserve',
    bgHex: '#061a12',
    headerBgHex: '#04120c',
    footerBgHex: '#020a07',
    borderHex: '#0d3d2a',
    isLight: false,
    badge: 'Forest Pine',
  },
  {
    id: 'carbon_graphite',
    name: 'Stealth Carbon',
    tagline: 'Precision Carbon Fiber Weave',
    bgHex: '#121316',
    headerBgHex: '#0c0d0f',
    footerBgHex: '#08090a',
    borderHex: '#252830',
    isLight: false,
    badge: 'Carbon',
  },
  {
    id: 'midnight_indigo',
    name: 'Cosmic Indigo',
    tagline: 'Deep Twilight Astral Violet',
    bgHex: '#0e0c24',
    headerBgHex: '#090818',
    footerBgHex: '#050510',
    borderHex: '#26215e',
    isLight: false,
    badge: 'Cosmic Indigo',
  },
  {
    id: 'arctic_frost',
    name: 'Arctic Glacier',
    tagline: 'Frosted Crystal Clean Sky Light',
    bgHex: '#eef4ff',
    headerBgHex: '#e4edfc',
    footerBgHex: '#dae5f8',
    borderHex: '#c6d8f5',
    isLight: true,
    badge: 'Glacier Light',
  },
  {
    id: 'warm_cream',
    name: 'Cashmere Sand',
    tagline: 'Warm Studio Parchment & Oat',
    bgHex: '#f8f5ee',
    headerBgHex: '#efeade',
    footerBgHex: '#e5dfd0',
    borderHex: '#ded5c0',
    isLight: true,
    badge: 'Cashmere Light',
  },
  {
    id: 'light',
    name: 'Daylight Pearl',
    tagline: 'Clean Studio Crisp White',
    bgHex: '#ffffff',
    headerBgHex: '#f8fafc',
    footerBgHex: '#f1f5f9',
    borderHex: '#e2e8f0',
    isLight: true,
    badge: 'Studio Light',
  },
  {
    id: 'custom',
    name: 'Custom Swatch',
    tagline: 'Pick Any Brand Hex Color',
    bgHex: '#18181b',
    headerBgHex: '#121214',
    footerBgHex: '#0c0c0e',
    borderHex: '#27272a',
    isLight: false,
    badge: 'Custom Hex',
  },
];

export const MENU_BAR_STYLE_OPTIONS: MenuBarStyleOption[] = [
  {
    id: 'solid',
    name: 'Solid Surface',
    tagline: 'Clean & Ultra-Sharp',
    desc: 'Classic opaque high-contrast finish with clean architectural borders and distraction-free clarity.',
    badge: 'Pure Solid',
  },
  {
    id: 'glass',
    name: 'Glassmorphism',
    tagline: 'Frosted Translucent Blur',
    desc: 'Modern frosted acrylic glass with real-time backdrop blur, gentle light refraction, and subtle depth.',
    badge: 'Aero Glass',
  },
  {
    id: 'gradient',
    name: 'Tactile Gradient',
    tagline: 'Vertical Depth Sheen',
    desc: 'Smooth vertical lighting gradient offering rich console-grade depth and premium hardware feel.',
    badge: 'Gradient',
  },
  {
    id: 'accent_border',
    name: 'Accent Glow Edge',
    tagline: 'Neon Boundary Illumination',
    desc: 'Illuminates the menu boundary edge with your active theme accent color and ambient glow.',
    badge: 'Neon Edge',
  },
  {
    id: 'floating',
    name: 'Floating Pill Card',
    tagline: 'Floating Elevated Canvas',
    desc: 'Detached floating navigation island with smooth rounded corners, floating elevation, and soft shadow.',
    badge: 'Floating',
  },
  {
    id: 'minimal',
    name: 'Minimal Frameless',
    tagline: 'Ultra-Sleek Borderless Flow',
    desc: 'Borderless seamless transition with zero harsh divider lines and whisper-quiet hover styling.',
    badge: 'Frameless',
  },
  {
    id: 'neumorphic',
    name: 'Tactile Neumorphic',
    tagline: 'Dual-Depth Workshop Console',
    desc: 'Hardware-grade embossed console feel with soft multi-directional shadows and tactile instrument depth.',
    badge: 'Tactile',
  },
  {
    id: 'glow',
    name: 'Cyber Aura Glow',
    tagline: 'Radiant Accent Halo Ambient',
    desc: 'Vibrant neon aura and soft halo lighting that dynamically radiates using your chosen theme accent.',
    badge: 'Aura Glow',
  },
];

export function getLuminance(hex: string): boolean {
  try {
    const clean = hex.replace('#', '');
    if (clean.length !== 6 && clean.length !== 3) return false;
    const fullHex = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  } catch {
    return false;
  }
}

export function adjustHexBrightness(hex: string, percent: number): string {
  try {
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    let num = parseInt(clean, 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00ff) + percent;
    let b = (num & 0x0000ff) + percent;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
  } catch {
    return hex;
  }
}

export interface ResolvedMenuBarStyle {
  bgClass: string;
  isLight: boolean;
  bgHex: string;
  headerBgHex: string;
  footerBgHex: string;
  borderHex: string;
  sidebarClasses: string;
  sidebarInlineStyle: React.CSSProperties;
  headerBarClasses: string;
  headerInlineStyle: React.CSSProperties;
  headerTitleClass: string;
  headerSubtleButtonClass: string;
  brandHeaderStyle: React.CSSProperties;
  footerStyle: React.CSSProperties;
  textColorClass: string;
  textMutedClass: string;
  navActiveBg: string;
  navActiveText: string;
  navHoverBg: string;
  navHoverText: string;
}

export function resolveMenuBarStyle(
  profile: Partial<ShopProfile>,
  themeAccentHex: string = '#2563eb'
): ResolvedMenuBarStyle {
  const colorPreset: MenuBarColorPreset = profile.menuBarColor || 'default';
  const customColor = profile.menuBarCustomColor || '#0d0f17';
  const stylePreset: MenuBarStyle = profile.menuBarStyle || 'solid';
  const headerSync = profile.menuBarHeaderSync !== false;

  const presetOption = MENU_BAR_COLOR_OPTIONS.find((c) => c.id === colorPreset) || MENU_BAR_COLOR_OPTIONS[0];

  let bgHex = presetOption.bgHex;
  let headerBgHex = presetOption.headerBgHex;
  let footerBgHex = presetOption.footerBgHex;
  let borderHex = presetOption.borderHex;
  let isLight = presetOption.isLight;

  if (colorPreset === 'custom') {
    bgHex = customColor;
    isLight = getLuminance(customColor);
    headerBgHex = isLight ? adjustHexBrightness(customColor, -10) : adjustHexBrightness(customColor, -16);
    footerBgHex = isLight ? adjustHexBrightness(customColor, -15) : adjustHexBrightness(customColor, -22);
    borderHex = isLight ? adjustHexBrightness(customColor, -25) : adjustHexBrightness(customColor, 20);
  }

  // Base text classes based on contrast
  const textColorClass = isLight ? 'text-zinc-900' : 'text-zinc-100';
  const textMutedClass = isLight ? 'text-zinc-500' : 'text-zinc-400';
  const navActiveBg = isLight ? 'bg-zinc-900 text-white shadow-xs' : 'bg-white/10 text-white font-semibold shadow-xs border border-white/15';
  const navActiveText = 'text-white';
  const navHoverBg = isLight ? 'hover:bg-zinc-100 hover:text-zinc-900' : 'hover:bg-white/5 hover:text-white';
  const navHoverText = isLight ? 'text-zinc-700' : 'text-zinc-300';

  const sidebarInlineStyle: React.CSSProperties = {
    backgroundColor: bgHex,
    borderColor: stylePreset === 'accent_border' ? themeAccentHex : borderHex,
  };

  let sidebarClasses = 'transition-all duration-300 select-none';

  let brandHeaderStyle: React.CSSProperties = {
    backgroundColor: headerBgHex,
    borderColor: borderHex,
  };

  let footerStyle: React.CSSProperties = {
    backgroundColor: footerBgHex,
    borderColor: borderHex,
  };

  // Top header bar styling
  let headerInlineStyle: React.CSSProperties = {};
  let headerBarClasses = 'sticky top-0 z-10 px-4 sm:px-8 py-3 flex justify-between items-center transition-all duration-300 border-b shadow-2xs';
  let headerTitleClass = 'text-base sm:text-lg font-semibold tracking-tight';
  let headerSubtleButtonClass = 'border transition-colors cursor-pointer shadow-2xs';

  if (headerSync) {
    headerInlineStyle = {
      backgroundColor: bgHex,
      borderColor: stylePreset === 'accent_border' ? themeAccentHex : borderHex,
    };
    if (isLight) {
      headerTitleClass += ' text-zinc-900';
      headerSubtleButtonClass += ' bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200';
    } else {
      headerTitleClass += ' text-white';
      headerSubtleButtonClass += ' bg-white/10 hover:bg-white/15 text-white border-white/15';
    }
  } else {
    // Neutral standard header
    headerBarClasses += ' bg-white/90 backdrop-blur-xs border-zinc-200';
    headerTitleClass += ' text-zinc-900';
    headerSubtleButtonClass += ' bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200';
  }

  if (stylePreset === 'glass') {
    sidebarClasses += ' backdrop-blur-md';
    sidebarInlineStyle.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.88)' : `${bgHex}ee`;
    if (headerSync) {
      headerInlineStyle.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.88)' : `${bgHex}ee`;
      headerInlineStyle.backdropFilter = 'blur(12px)';
    }
  } else if (stylePreset === 'gradient') {
    const bottomTone = isLight ? adjustHexBrightness(bgHex, -8) : adjustHexBrightness(bgHex, -14);
    sidebarInlineStyle.background = `linear-gradient(180deg, ${bgHex} 0%, ${bottomTone} 100%)`;
    if (headerSync) {
      headerInlineStyle.background = `linear-gradient(90deg, ${bgHex} 0%, ${bottomTone} 100%)`;
    }
  } else if (stylePreset === 'accent_border') {
    sidebarInlineStyle.boxShadow = `inset -2px 0 12px ${themeAccentHex}22`;
    if (headerSync) {
      headerInlineStyle.boxShadow = `0 2px 12px ${themeAccentHex}22`;
    }
  } else if (stylePreset === 'floating') {
    sidebarClasses += ' m-2 sm:m-3 rounded-2xl shadow-xl border overflow-hidden';
  } else if (stylePreset === 'minimal') {
    sidebarClasses += ' border-r-0 shadow-none';
    sidebarInlineStyle.borderRightColor = 'transparent';
    if (headerSync) {
      headerBarClasses = headerBarClasses.replace('border-b', 'border-b-0 shadow-none');
      headerInlineStyle.borderBottomColor = 'transparent';
    }
  } else if (stylePreset === 'neumorphic') {
    sidebarClasses += ' shadow-md';
    sidebarInlineStyle.boxShadow = isLight
      ? 'inset 1px 1px 2px rgba(255, 255, 255, 0.8), inset -1px -1px 3px rgba(0, 0, 0, 0.05), 3px 0 12px rgba(0, 0, 0, 0.06)'
      : 'inset 1px 1px 2px rgba(255, 255, 255, 0.06), inset -1px -1px 3px rgba(0, 0, 0, 0.5), 4px 0 16px rgba(0, 0, 0, 0.4)';
    if (headerSync) {
      headerInlineStyle.boxShadow = isLight
        ? 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 3px 10px rgba(0, 0, 0, 0.05)'
        : 'inset 0 1px 2px rgba(255, 255, 255, 0.05), 0 4px 14px rgba(0, 0, 0, 0.35)';
    }
  } else if (stylePreset === 'glow') {
    sidebarInlineStyle.boxShadow = `0 0 24px ${themeAccentHex}35, inset -1px 0 0 ${themeAccentHex}66`;
    if (headerSync) {
      headerInlineStyle.boxShadow = `0 4px 22px ${themeAccentHex}35, inset 0 -1px 0 ${themeAccentHex}66`;
    }
  }

  return {
    bgClass: isLight ? 'bg-white' : 'bg-zinc-950',
    isLight,
    bgHex,
    headerBgHex,
    footerBgHex,
    borderHex,
    sidebarClasses,
    sidebarInlineStyle,
    headerBarClasses,
    headerInlineStyle,
    headerTitleClass,
    headerSubtleButtonClass,
    brandHeaderStyle,
    footerStyle,
    textColorClass,
    textMutedClass,
    navActiveBg,
    navActiveText,
    navHoverBg,
    navHoverText,
  };
}
