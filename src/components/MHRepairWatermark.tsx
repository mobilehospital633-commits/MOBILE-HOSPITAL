import React from 'react';

export type WatermarkStyle =
  | 'stamp'
  | 'diagonal'
  | 'rubber_box'
  | 'workshop_shield'
  | 'oval_seal'
  | 'bold_center'
  | 'hex_badge'
  | 'hospital_cross'
  | 'star_rosette'
  | 'vintage_stamp'
  | 'banner_ribbon'
  | 'minimal_clean';

export interface WatermarkStyleOption {
  id: WatermarkStyle;
  label: string;
  desc: string;
}

export const WATERMARK_STYLES: WatermarkStyleOption[] = [
  { id: 'stamp', label: 'Official Circular Seal', desc: 'Dual-ring concentric security seal with stars' },
  { id: 'hex_badge', label: 'Hexagonal Tech Seal', desc: 'Precision double-line hex badge with bolt accents' },
  { id: 'hospital_cross', label: 'Mobile Hospital Crest', desc: 'Medical cross emblem with laurel repair wreath' },
  { id: 'diagonal', label: 'Diagonal Security Banner', desc: 'Rotated dashed stamp with verified label' },
  { id: 'rubber_box', label: 'Rubber Ink Stamp Box', desc: 'Official workshop boxed rubber stamp' },
  { id: 'workshop_shield', label: 'Workshop Shield Crest', desc: 'Certified security heraldry shield badge' },
  { id: 'oval_seal', label: 'Classic Oval Notary', desc: 'Traditional notary elliptical arched seal' },
  { id: 'star_rosette', label: '8-Point Star Rosette', desc: 'Scalloped starburst guarantee medallion' },
  { id: 'vintage_stamp', label: 'Vintage Postal Stamp', desc: 'Weathered postal dispatch mark with date box' },
  { id: 'banner_ribbon', label: 'Royal Ribbon & Seal', desc: 'Ornate centered banner with star scrollwork' },
  { id: 'minimal_clean', label: 'Modern Minimalist Frame', desc: 'Sleek geometric thin-line corner brackets' },
  { id: 'bold_center', label: 'Bold Centered Typography', desc: 'Clean 3-tier high-contrast typographic mark' },
];

export interface MHRepairWatermarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  opacityClass?: string;
  className?: string;
  style?: WatermarkStyle;
  label?: string; // Text 2: e.g. "Mobile repairing centre"
  sublabel?: string; // Text 1: e.g. "MOBILE HOSPITAL"
  bottomText?: string; // Text 3: e.g. "kalitala Duttapulia"
  showTools?: boolean;
  color?: string;
}

export const MHRepairWatermark: React.FC<MHRepairWatermarkProps> = ({
  size = 'md',
  opacityClass = 'opacity-[0.065] print:opacity-[0.085]',
  className = '',
  style = 'stamp',
  sublabel = 'MOBILE HOSPITAL',
  label = 'Mobile repairing centre',
  bottomText = 'kalitala Duttapulia',
  showTools = true,
  color,
}) => {
  const t1 = (sublabel || 'MOBILE HOSPITAL').trim().toUpperCase();
  const t2 = (label || 'Mobile repairing centre').trim();
  const t3 = (bottomText || 'kalitala Duttapulia').trim();

  // Dimension classes based on size preset
  const sizeClasses: Record<string, string> = {
    sm: 'w-48 h-48 max-w-[200px] max-h-[200px]',
    md: 'w-64 h-64 sm:w-72 sm:h-72 max-w-[290px] max-h-[290px]',
    lg: 'w-80 h-80 sm:w-96 sm:h-96 max-w-[400px] max-h-[400px]',
    xl: 'w-96 h-96 sm:w-[460px] sm:h-[460px] max-w-[500px]',
    full: 'w-full h-full max-w-[420px] max-h-[420px]',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      aria-hidden="true"
      className={`receipt-watermark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 flex items-center justify-center ${opacityClass} ${className}`}
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        color: color || undefined,
      }}
    >
      <div className={`relative ${selectedSize} flex items-center justify-center text-zinc-900`}>
        {/* STYLE 1: Circular Seal */}
        {style === 'stamp' && (
          <svg viewBox="0 0 320 320" className="w-full h-full" fill="none">
            <circle cx="160" cy="160" r="150" stroke="currentColor" strokeWidth="4" />
            <circle cx="160" cy="160" r="141" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 3" />
            <circle cx="160" cy="160" r="133" stroke="currentColor" strokeWidth="2" />
            <circle cx="160" cy="160" r="98" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="160" cy="160" r="92" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />

            <defs>
              <path id="wmCircTopPath" d="M 40 160 A 120 120 0 0 1 280 160" fill="none" />
              <path id="wmCircBotPath" d="M 280 160 A 120 120 0 0 1 40 160" fill="none" />
            </defs>

            <text fill="currentColor" fontSize="13.5" fontWeight="900" letterSpacing="3.5">
              <textPath href="#wmCircTopPath" startOffset="50%" textAnchor="middle">
                ★ {t1} ★
              </textPath>
            </text>

            <text fill="currentColor" fontSize="11" fontWeight="800" letterSpacing="2.5">
              <textPath href="#wmCircBotPath" startOffset="50%" textAnchor="middle">
                ★ {t3.toUpperCase()} ★
              </textPath>
            </text>

            {/* Central Phone/Tool Monogram */}
            <rect x="132" y="112" width="56" height="96" rx="9" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <line x1="150" y1="120" x2="170" y2="120" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="160" cy="196" r="3" fill="currentColor" />

            {/* MH Monogram */}
            <text x="160" y="160" textAnchor="middle" fontWeight="900" fontSize="32" fill="currentColor" letterSpacing="-1">
              MH
            </text>

            {/* Centre Label Banner */}
            <g transform="translate(48, 172)">
              <rect x="0" y="0" width="224" height="24" rx="4" stroke="currentColor" strokeWidth="2" fill="white" fillOpacity="0.85" />
              <text x="112" y="15.5" textAnchor="middle" fontWeight="900" fontSize="9.5" letterSpacing="1.2" fill="currentColor">
                {t2.toUpperCase()}
              </text>
            </g>
          </svg>
        )}

        {/* STYLE 2: Hexagonal Tech Seal */}
        {style === 'hex_badge' && (
          <svg viewBox="0 0 300 300" className="w-full h-full" fill="none">
            {/* Outer Hexagon */}
            <polygon
              points="150,15 270,82 270,218 150,285 30,218 30,82"
              stroke="currentColor"
              strokeWidth="4"
            />
            {/* Inner Dashed Hexagon */}
            <polygon
              points="150,28 256,88 256,212 150,272 44,212 44,88"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            {/* Bolt rivets */}
            <circle cx="150" cy="22" r="3.5" fill="currentColor" />
            <circle cx="262" cy="85" r="3.5" fill="currentColor" />
            <circle cx="262" cy="215" r="3.5" fill="currentColor" />
            <circle cx="150" cy="278" r="3.5" fill="currentColor" />
            <circle cx="38" cy="215" r="3.5" fill="currentColor" />
            <circle cx="38" cy="85" r="3.5" fill="currentColor" />

            {/* Inner Content */}
            <text x="150" y="76" textAnchor="middle" fontWeight="900" fontSize="10" letterSpacing="3" fill="currentColor">
              ★ CERTIFIED TECH REPAIR ★
            </text>
            <text x="150" y="125" textAnchor="middle" fontWeight="900" fontSize="22" letterSpacing="1" fill="currentColor">
              {t1}
            </text>
            <line x1="70" y1="142" x2="230" y2="142" stroke="currentColor" strokeWidth="2" />
            <text x="150" y="165" textAnchor="middle" fontWeight="800" fontSize="12" letterSpacing="1" fill="currentColor">
              {t2}
            </text>
            <text x="150" y="186" textAnchor="middle" fontWeight="700" fontSize="10" letterSpacing="2" fill="currentColor">
              📍 {t3.toUpperCase()}
            </text>
            <text x="150" y="240" textAnchor="middle" fontWeight="900" fontSize="9" letterSpacing="2" fill="currentColor">
              GENUINE HARDWARE & SOFTWARE
            </text>
          </svg>
        )}

        {/* STYLE 3: Mobile Hospital Medical Cross Crest */}
        {style === 'hospital_cross' && (
          <svg viewBox="0 0 320 320" className="w-full h-full" fill="none">
            <circle cx="160" cy="160" r="148" stroke="currentColor" strokeWidth="4" />
            <circle cx="160" cy="160" r="138" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" />
            <circle cx="160" cy="160" r="92" stroke="currentColor" strokeWidth="2" />

            {/* Medical / Hospital Cross */}
            <g transform="translate(160, 160)">
              <rect x="-14" y="-45" width="28" height="90" rx="4" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2.5" />
              <rect x="-45" y="-14" width="90" height="28" rx="4" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2.5" />
            </g>

            {/* Top curved Shop Name */}
            <defs>
              <path id="hospTopArc" d="M 40 160 A 120 120 0 0 1 280 160" fill="none" />
              <path id="hospBotArc" d="M 280 160 A 120 120 0 0 1 40 160" fill="none" />
            </defs>

            <text fill="currentColor" fontSize="14" fontWeight="900" letterSpacing="3.5">
              <textPath href="#hospTopArc" startOffset="50%" textAnchor="middle">
                ✚ {t1} ✚
              </textPath>
            </text>

            <text fill="currentColor" fontSize="11" fontWeight="800" letterSpacing="2">
              <textPath href="#hospBotArc" startOffset="50%" textAnchor="middle">
                ★ {t3.toUpperCase()} ★
              </textPath>
            </text>

            {/* Center Box */}
            <g transform="translate(60, 145)">
              <rect x="0" y="0" width="200" height="30" rx="6" fill="white" fillOpacity="0.9" stroke="currentColor" strokeWidth="2.5" />
              <text x="100" y="19" textAnchor="middle" fontWeight="900" fontSize="11" letterSpacing="1.2" fill="currentColor">
                {t2.toUpperCase()}
              </text>
            </g>
          </svg>
        )}

        {/* STYLE 4: Diagonal Security Banner */}
        {style === 'diagonal' && (
          <div className="transform -rotate-25 text-center px-4 max-w-[390px]">
            <div className="border-4 border-dashed rounded-2xl px-5 py-2.5 whitespace-normal break-words leading-tight bg-white/40 border-current">
              <div className="text-xl sm:text-2xl font-black tracking-widest uppercase">
                {t1}
              </div>
              <div className="text-[11px] font-extrabold tracking-wider uppercase mt-0.5 opacity-90">
                {t2}
              </div>
              <div className="text-[9px] font-bold tracking-widest uppercase mt-0.5 opacity-80">
                📍 {t3}
              </div>
            </div>
            <div className="text-[9px] font-black tracking-[0.25em] uppercase mt-1 opacity-90">
              ★ VERIFIED REPAIR SLIP ★
            </div>
          </div>
        )}

        {/* STYLE 5: Rubber Ink Stamp Box */}
        {style === 'rubber_box' && (
          <div className="transform -rotate-6 text-center max-w-[360px] p-1">
            <div className="border-4 border-solid rounded-xl p-3 border-current shadow-xs">
              <div className="border border-dashed border-current p-2.5 rounded-lg">
                <div className="text-[10px] font-black tracking-widest uppercase">
                  ★ OFFICIAL WORKSHOP SEAL ★
                </div>
                <div className="text-xl font-black tracking-wider uppercase my-1">
                  {t1}
                </div>
                <div className="text-[11px] font-extrabold tracking-wide uppercase opacity-90">
                  {t2}
                </div>
                <div className="border-t border-current pt-1 mt-1 text-[9px] font-bold tracking-widest uppercase opacity-85">
                  {t3}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STYLE 6: Workshop Shield Crest */}
        {style === 'workshop_shield' && (
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg viewBox="0 0 200 240" className="w-full h-full" fill="none">
              <path
                d="M100 10 L180 35 L180 120 C180 180 100 225 100 225 C100 225 20 180 20 120 L20 35 Z"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                d="M100 22 L168 44 L168 116 C168 168 100 208 100 208 C100 208 32 168 32 116 L32 44 Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center pt-2">
              <span className="text-[9px] font-black tracking-widest uppercase opacity-75">
                CERTIFIED SERVICE
              </span>
              <span className="font-black text-base tracking-tight uppercase leading-tight my-0.5">
                {t1}
              </span>
              <span className="text-[10px] font-extrabold tracking-wider uppercase opacity-90">
                {t2}
              </span>
              <div className="w-16 border-b border-current my-1" />
              <span className="text-[8px] font-bold tracking-widest uppercase opacity-80">
                {t3}
              </span>
            </div>
          </div>
        )}

        {/* STYLE 7: Classic Oval Notary Seal */}
        {style === 'oval_seal' && (
          <div className="relative w-80 h-56 flex items-center justify-center">
            <svg viewBox="0 0 320 220" className="w-full h-full" fill="none">
              <ellipse cx="160" cy="110" rx="150" ry="98" stroke="currentColor" strokeWidth="4" />
              <ellipse cx="160" cy="110" rx="140" ry="88" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" />
              <ellipse cx="160" cy="110" rx="105" ry="60" stroke="currentColor" strokeWidth="2" />
              <defs>
                <path id="ovalTopArc" d="M 30 110 A 130 78 0 0 1 290 110" fill="none" />
                <path id="ovalBotArc" d="M 290 110 A 130 78 0 0 1 30 110" fill="none" />
              </defs>
              <text fill="currentColor" fontSize="12" fontWeight="900" letterSpacing="3">
                <textPath href="#ovalTopArc" startOffset="50%" textAnchor="middle">
                  ★ {t1} ★
                </textPath>
              </text>
              <text fill="currentColor" fontSize="10" fontWeight="800" letterSpacing="2">
                <textPath href="#ovalBotArc" startOffset="50%" textAnchor="middle">
                  ★ {t3.toUpperCase()} ★
                </textPath>
              </text>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <span className="font-black text-sm tracking-wider uppercase leading-tight">
                {t2}
              </span>
              <span className="text-[8px] font-bold tracking-widest uppercase opacity-75 mt-0.5">
                AUTHENTIC REPAIR & SALES
              </span>
            </div>
          </div>
        )}

        {/* STYLE 8: 8-Point Star Rosette & Medallion */}
        {style === 'star_rosette' && (
          <svg viewBox="0 0 300 300" className="w-full h-full" fill="none">
            {/* Scalloped outer star points */}
            <circle cx="150" cy="150" r="142" stroke="currentColor" strokeWidth="3" />
            <circle cx="150" cy="150" r="134" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
            <circle cx="150" cy="150" r="110" stroke="currentColor" strokeWidth="2.5" />
            
            {/* Starburst rays */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="150"
                y1="16"
                x2="150"
                y2="38"
                stroke="currentColor"
                strokeWidth="2"
                transform={`rotate(${deg} 150 150)`}
              />
            ))}

            <text x="150" y="82" textAnchor="middle" fontWeight="900" fontSize="9.5" letterSpacing="2.5" fill="currentColor">
              ★ OFFICIAL QUALITY GUARANTEE ★
            </text>
            <text x="150" y="128" textAnchor="middle" fontWeight="900" fontSize="21" letterSpacing="1" fill="currentColor">
              {t1}
            </text>
            <line x1="65" y1="144" x2="235" y2="144" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" />
            <text x="150" y="168" textAnchor="middle" fontWeight="800" fontSize="12" letterSpacing="1.2" fill="currentColor">
              {t2}
            </text>
            <text x="150" y="190" textAnchor="middle" fontWeight="800" fontSize="10" letterSpacing="1.8" fill="currentColor">
              {t3.toUpperCase()}
            </text>
            <text x="150" y="235" textAnchor="middle" fontWeight="900" fontSize="8.5" letterSpacing="2" fill="currentColor">
              ★ CERTIFIED TECHNICIAN SERVICE ★
            </text>
          </svg>
        )}

        {/* STYLE 9: Vintage Postal Dispatch Stamp */}
        {style === 'vintage_stamp' && (
          <div className="transform -rotate-8 text-center max-w-[370px]">
            <div className="border-4 border-dashed rounded-lg p-3.5 border-current bg-white/50 shadow-xs">
              <div className="border-2 border-solid border-current p-2.5 rounded">
                <div className="flex justify-between items-center text-[8.5px] font-black tracking-widest uppercase border-b border-current pb-1 mb-1">
                  <span>POSTAL DISPATCH</span>
                  <span>KALITALA • DUTTAPULIA</span>
                </div>
                <div className="text-xl font-black tracking-widest uppercase my-1">
                  {t1}
                </div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider">
                  {t2}
                </div>
                <div className="flex justify-between items-center text-[8.5px] font-bold border-t border-current pt-1 mt-1 tracking-wider">
                  <span>LOC: {t3}</span>
                  <span>VERIFIED SLIP</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STYLE 10: Royal Ribbon & Medallion */}
        {style === 'banner_ribbon' && (
          <svg viewBox="0 0 320 280" className="w-full h-full" fill="none">
            <circle cx="160" cy="140" r="120" stroke="currentColor" strokeWidth="3" />
            <circle cx="160" cy="140" r="112" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
            <circle cx="160" cy="140" r="92" stroke="currentColor" strokeWidth="2" />

            <text x="160" y="68" textAnchor="middle" fontWeight="900" fontSize="10" letterSpacing="3" fill="currentColor">
              ★ OFFICIAL CERTIFICATION ★
            </text>
            <text x="160" y="112" textAnchor="middle" fontWeight="900" fontSize="20" letterSpacing="1" fill="currentColor">
              {t1}
            </text>

            {/* Folded Ribbon across center */}
            <g transform="translate(10, 126)">
              {/* Ribbon tails */}
              <polygon points="10,0 35,14 10,28 25,14" fill="currentColor" fillOpacity="0.4" />
              <polygon points="310,0 285,14 310,28 295,14" fill="currentColor" fillOpacity="0.4" />
              {/* Main ribbon rectangle */}
              <rect x="25" y="0" width="250" height="28" rx="4" fill="white" fillOpacity="0.9" stroke="currentColor" strokeWidth="2" />
              <text x="150" y="18" textAnchor="middle" fontWeight="900" fontSize="10.5" letterSpacing="1.4" fill="currentColor">
                {t2.toUpperCase()}
              </text>
            </g>

            <text x="160" y="182" textAnchor="middle" fontWeight="800" fontSize="11" letterSpacing="1.5" fill="currentColor">
              📍 {t3.toUpperCase()}
            </text>
            <text x="160" y="218" textAnchor="middle" fontWeight="900" fontSize="9" letterSpacing="2" fill="currentColor">
              REPAIR • SALES • ACCESSORIES
            </text>
          </svg>
        )}

        {/* STYLE 11: Modern Minimalist Security Frame */}
        {style === 'minimal_clean' && (
          <div className="relative p-5 border border-current rounded-xl max-w-[360px] text-center">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current" />

            <div className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase opacity-75 mb-1">
              [ SECURE DIGITAL RECORD ]
            </div>
            <div className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              {t1}
            </div>
            <div className="w-20 border-b border-current mx-auto my-1.5" />
            <div className="text-xs font-bold uppercase tracking-wider opacity-90">
              {t2}
            </div>
            <div className="text-[9.5px] font-medium tracking-wide uppercase opacity-80 mt-0.5">
              {t3}
            </div>
          </div>
        )}

        {/* STYLE 12: Bold Centered Typography */}
        {style === 'bold_center' && (
          <div className="text-center px-6 max-w-[380px]">
            <div className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-none break-words">
              {t1}
            </div>
            <div className="w-32 border-b-2 border-current mx-auto my-2 opacity-70" />
            <div className="text-xs font-black tracking-widest uppercase opacity-90">
              {t2}
            </div>
            <div className="text-[10px] font-bold tracking-[0.25em] uppercase opacity-80 mt-1">
              {t3}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
