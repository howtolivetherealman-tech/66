import React from 'react';
import { DEFAULT_BANNER_LOGO_URL, DEFAULT_BRAND_CONFIG, type BrandConfig } from '../utils/newsLogic';

let activeBrandConfig: BrandConfig = DEFAULT_BRAND_CONFIG;

export function setActiveBrandConfigStore(config: BrandConfig): void {
  if (config) {
    activeBrandConfig = config;
  }
}

export function getActiveBrandConfigStore(): BrandConfig {
  return activeBrandConfig;
}

interface EdiNijamLogoProps {
  size?: number;
  className?: string;
  logoUrl?: string;
}

export const EdiNijamLogo: React.FC<EdiNijamLogoProps> = ({
  size = 56,
  className = '',
  logoUrl,
}) => {
  const effectiveLogoUrl =
    logoUrl !== undefined
      ? logoUrl
      : activeBrandConfig.useCustomLogo
        ? activeBrandConfig.logoUrl
        : '';

  if (effectiveLogoUrl && effectiveLogoUrl.trim().length > 0) {
    return (
      <img
        src={effectiveLogoUrl}
        alt="నేటిభారతం చానెల్ - NETI BHARATAM లోగో"
        style={{ height: size, width: 'auto', maxWidth: size * 3.2 }}
        className={`shrink-0 select-none rounded-lg object-contain bg-[#2B2B2B] border border-amber-400/50 p-0.5 ${className}`}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      className={`shrink-0 select-none ${className}`}
      role="img"
      aria-label="నేటిభారతం చానెల్ - NETI BHARATAM - ఒక దేశం ఒకే చట్టం లోగో"
    >
      <defs>
        <linearGradient id="enGoldBevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF3B0" />
          <stop offset="28%" stopColor="#E6B84C" />
          <stop offset="55%" stopColor="#A8741A" />
          <stop offset="80%" stopColor="#F5D061" />
          <stop offset="100%" stopColor="#8A5A10" />
        </linearGradient>
        <linearGradient id="enGoldText" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF7C2" />
          <stop offset="50%" stopColor="#E5B84B" />
          <stop offset="100%" stopColor="#9E6B14" />
        </linearGradient>
        <radialGradient id="enNavyRing" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#142F5A" />
          <stop offset="75%" stopColor="#0A1B38" />
          <stop offset="100%" stopColor="#061126" />
        </radialGradient>
        <clipPath id="enInnerGlobe">
          <circle cx="120" cy="120" r="76" />
        </clipPath>
        <path id="enTopTextArc" d="M 33,120 A 87,87 0 1,1 207,120" fill="none" />
        <path id="enBottomTextArc" d="M 28,124 A 92,92 0 0,0 212,124" fill="none" />
      </defs>

      <circle cx="120" cy="120" r="116" fill="url(#enGoldBevel)" />
      <circle
        cx="120"
        cy="120"
        r="110"
        fill="url(#enNavyRing)"
        stroke="url(#enGoldBevel)"
        strokeWidth="3.5"
      />

      <g clipPath="url(#enInnerGlobe)">
        <rect x="40" y="40" width="160" height="160" fill="#0B2246" />
        <path d="M 40,44 L 200,44 L 200,96 L 40,106 Z" fill="#FF8C1A" opacity="0.92" />
        <path d="M 40,104 L 200,94 L 200,134 L 40,140 Z" fill="#FFFFFF" opacity="0.96" />
        <path d="M 40,138 L 200,132 L 200,175 L 40,175 Z" fill="#138808" opacity="0.92" />
        <circle cx="136" cy="82" r="16" fill="#FFD54F" />
        <rect x="40" y="138" width="160" height="62" fill="#071630" opacity="0.96" />
        <line x1="52" y1="138" x2="188" y2="138" stroke="url(#enGoldBevel)" strokeWidth="1.8" />
      </g>

      <circle
        cx="120"
        cy="120"
        r="76"
        fill="none"
        stroke="url(#enGoldBevel)"
        strokeWidth="3.5"
      />

      <text
        x="120"
        y="160"
        textAnchor="middle"
        fill="url(#enGoldText)"
        fontFamily="'Noto Sans Telugu', sans-serif"
        fontWeight="800"
        fontSize="19"
      >
        నేటిభారతం
      </text>
      <text
        x="120"
        y="178"
        textAnchor="middle"
        fill="#F6D365"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="800"
        fontSize="10"
        letterSpacing="1.2"
      >
        NETI BHARATAM
      </text>
    </svg>
  );
};

interface NetiBharatamBannerLogoProps {
  bannerUrl?: string;
  className?: string;
}

export const NetiBharatamBannerLogo: React.FC<NetiBharatamBannerLogoProps> = ({
  bannerUrl,
  className = '',
}) => {
  const src =
    bannerUrl ||
    activeBrandConfig.bannerLogoUrl ||
    DEFAULT_BANNER_LOGO_URL;

  return (
    <div
      data-testid="neti-bharatam-official-banner"
      className={`w-full overflow-hidden rounded-xl border border-amber-500/40 bg-[#2E2D2D] shadow-sm ${className}`}
    >
      <img
        src={src}
        alt="ఏది నిజం - నేటి భారతం అధికారిక బ్యానర్ లోగో (జ్ఞానాన్ని పెంచే విద్య ఉపాధి చూపే విద్య · నిజాన్ని నిర్భయంగా చెప్పడమే మా లక్ష్యం)"
        data-testid="neti-bharatam-banner-img"
        className="w-full h-auto max-h-44 object-contain mx-auto block"
      />
    </div>
  );
};
