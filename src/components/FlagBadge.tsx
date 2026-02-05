'use client';

import Flag from 'react-flagpack';
import { getFlagCode } from '@/lib/countryCodeMapping';
import 'react-flagpack/dist/style.css';

interface FlagBadgeProps {
  country: string;
  countryCode?: string;
  className?: string;
  size?: 's' | 'm' | 'l';
  showCountryName?: boolean;
}

export function FlagBadge({
  country,
  countryCode,
  className = "",
  size = 'm',
  showCountryName = true
}: FlagBadgeProps) {
  // Use provided countryCode or derive from country name
  const flagCode = countryCode ? getFlagCode(countryCode) : getFlagCode(country);

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
  size = 'm'
}: {
  country?: string;
  countryCode?: string;
  size?: 's' | 'm' | 'l';
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
