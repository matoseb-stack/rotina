interface LogoProps {
  size?: number
  showText?: boolean
}

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M24 3 A21 21 0 1 1 7.5 11" fill="none" stroke="#2E5A3C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="7.5" cy="11" r="2.6" fill="#E9B949" />
      <path d="M13 34 C13 21 21 13 35 13 C35 26 27 34 13 34 Z" fill="#6FA36F" />
      <path
        d="M18 24.5 L22.5 29 L30 20"
        fill="none"
        stroke="#F4F1E8"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ size = 40, showText = true }: LogoProps) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      {showText && (
        <span className="logo-text">
          Rotina <span className="logo-accent">Inteligente</span>
        </span>
      )}
    </span>
  )
}
