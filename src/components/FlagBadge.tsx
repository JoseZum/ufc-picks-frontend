'use client';

import Flag from 'react-flagpack';
import { getFlagCode } from '@/lib/countryCodeMapping';
import 'react-flagpack/dist/style.css';

interface FlagBadgeProps {
  country: string;
  countryCode?: string;
  className?: string;
  size?: 'S' | 'M' | 'L';
  showCountryName?: boolean;
}

export function FlagBadge({
  country,
  countryCode,
  className = "",
  size = 'M',
  showCountryName = true
}: FlagBadgeProps) {
  // Use provided countryCode or derive from country name
  const finalCode = countryCode || country;
  const flagCode = getFlagCode(finalCode);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Flag
        code={flagCode}
        size={size}
        hasBorder={false}
        hasDropShadow={false}
        gradient="real-linear"
      />
      {showCountryName && (
        <span className="text-sm text-muted-foreground">{country}</span>
      )}
    </div>
  );
}

// Standalone flag component for use without country name
export function CountryFlag({
  country,
  countryCode,
  size = 'M'
}: {
  country?: string;
  countryCode?: string;
  size?: 'S' | 'M' | 'L';
}) {
  const code = countryCode || country;
  const flagCode = getFlagCode(code);

  return (
    <Flag
      code={flagCode}
      size={size}
      hasBorder={false}
      hasDropShadow={false}
      gradient="real-linear"
    />
  );
}
