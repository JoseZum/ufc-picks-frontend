'use client';

import { getFlagCode } from '@/lib/countryCodeMapping';

interface FlagBadgeProps {
  country: string;
  countryCode?: string;
  className?: string;
  size?: 'S' | 'M' | 'L';
  showCountryName?: boolean;
}

const sizeMap = {
  'S': 's',
  'M': 'm',
  'L': 'l'
};

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
  const sizeDir = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={`/flags/${sizeDir}/${flagCode}.svg`}
        alt={country}
        style={{
          width: size === 'S' ? '20px' : size === 'M' ? '32px' : '48px',
          height: size === 'S' ? '20px' : size === 'M' ? '32px' : '48px',
          objectFit: 'contain'
        }}
        onError={(e) => {
          console.warn(`Flag not found: /flags/${sizeDir}/${flagCode}.svg`);
          e.currentTarget.style.display = 'none';
        }}
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
  const sizeDir = sizeMap[size];

  return (
    <img
      src={`/flags/${sizeDir}/${flagCode}.svg`}
      alt={country || code || 'Flag'}
      style={{
        width: size === 'S' ? '20px' : size === 'M' ? '32px' : '48px',
        height: size === 'S' ? '20px' : size === 'M' ? '32px' : '48px',
        objectFit: 'contain'
      }}
      onError={(e) => {
        console.warn(`Flag not found: /flags/${sizeDir}/${flagCode}.svg`);
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
