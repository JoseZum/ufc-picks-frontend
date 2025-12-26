interface FlagBadgeProps {
  country: string
  countryCode: string
  className?: string
}

export function FlagBadge({ country, countryCode, className = "" }: FlagBadgeProps) {
  // Convert country code to flag emoji
  const getFlagEmoji = (code: string) => {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-lg">{getFlagEmoji(countryCode)}</span>
      <span className="text-sm text-muted-foreground">{country}</span>
    </div>
  )
}
