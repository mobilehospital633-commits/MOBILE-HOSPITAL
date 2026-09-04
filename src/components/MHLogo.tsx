import React, { useState } from 'react';
import mhLogoAsset from '../assets/images/mh_logo_icon_1788498446351.jpg';

interface MHLogoProps {
  customUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  theme?: 'dark' | 'light' | 'monochrome' | 'receipt';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showText?: boolean;
  className?: string;
  useVector?: boolean;
}

export const MHLogo: React.FC<MHLogoProps> = ({
  customUrl,
  size = 'md',
  theme = 'dark',
  rounded = 'lg',
  showText = false,
  className = '',
  useVector = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // Dimension mapping
  const sizeMap: Record<string, { container: string; icon: string; text: string; subtext: string }> = {
    xs: { container: 'w-6 h-6', icon: 'w-4 h-4', text: 'text-xs', subtext: 'text-[9px]' },
    sm: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-sm', subtext: 'text-[10px]' },
    md: { container: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-base', subtext: 'text-xs' },
    lg: { container: 'w-14 h-14', icon: 'w-8 h-8', text: 'text-lg', subtext: 'text-xs' },
    xl: { container: 'w-20 h-20', icon: 'w-12 h-12', text: 'text-2xl', subtext: 'text-sm' },
  };

  const isPresetSize = typeof size === 'string' && sizeMap[size];
  const sizeClass = isPresetSize ? sizeMap[size].container : 'w-10 h-10';

  const roundMap: Record<string, string> = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };
  const roundedClass = roundMap[rounded] || 'rounded-lg';

  // Active image source: priority given to custom URL (if not errored), otherwise generated official MH logo asset
  const targetSrc = customUrl && !imgError ? customUrl : mhLogoAsset;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative ${sizeClass} ${roundedClass} overflow-hidden flex items-center justify-center shrink-0 border transition-all ${
          theme === 'light'
            ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xs'
            : theme === 'receipt'
            ? 'bg-white border-zinc-800 text-zinc-950 print:border-zinc-900'
            : 'bg-zinc-950 border-zinc-800 text-white shadow-2xs'
        }`}
        style={typeof size === 'number' ? { width: size, height: size } : undefined}
      >
        {!useVector && targetSrc && !imgError ? (
          <img
            src={targetSrc}
            alt="MH Logo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          /* High-contrast precision vector fallback for MH Monogram */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full p-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background shape */}
            <rect
              width="100"
              height="100"
              rx={rounded === 'full' ? 50 : 20}
              className={
                theme === 'light'
                  ? 'fill-zinc-900'
                  : theme === 'receipt'
                  ? 'fill-zinc-900'
                  : 'fill-zinc-900'
              }
            />

            {/* Stylized Smartphone Frame with Plus Cross */}
            <rect
              x="22"
              y="15"
              width="56"
              height="70"
              rx="8"
              stroke="white"
              strokeWidth="4"
              strokeOpacity="0.4"
            />
            
            {/* Medical Cross Accent at Top-Right */}
            <rect x="68" y="16" width="12" height="4" rx="1.5" fill="#10b981" />
            <rect x="72" y="12" width="4" height="12" rx="1.5" fill="#10b981" />

            {/* Bold Interlocking 'MH' Letters */}
            <text
              x="50"
              y="59"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="34"
              letterSpacing="-1.5"
              fill="white"
            >
              MH
            </text>

            {/* Micro subtitle */}
            <text
              x="50"
              y="74"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              fontSize="8.5"
              letterSpacing="2"
              fill="white"
              fillOpacity="0.8"
            >
              HOSPITAL
            </text>
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight leading-none ${
                isPresetSize ? sizeMap[size].text : 'text-base'
              } ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}
            >
              MOBILE HOSPITAL
            </span>
            <span className="bg-emerald-500/20 text-emerald-600 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
              MH
            </span>
          </div>
          <span
            className={`font-medium tracking-wider uppercase leading-none mt-1 ${
              isPresetSize ? sizeMap[size].subtext : 'text-[10px]'
            } ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}
          >
            Repair & Billing
          </span>
        </div>
      )}
    </div>
  );
};
