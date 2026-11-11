/**
 * Inline SVG placeholders — never a photo, never a generated image:
 *  - PersonPictogram: neutral stick figure for the text-cue fallback;
 *  - BogyoFigure: the child-friendly stylised figure (sage green, big eyes) for
 *    "Közös 10 perc" units without reviewed media;
 *  - ConesDiagram: top-down drill set-up (wall, cones, path) when the step has no diagramUrl.
 */
export function PersonPictogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} role="img" aria-hidden focusable="false">
      <circle cx="60" cy="24" r="14" fill="#9CA3AF" />
      <rect x="48" y="42" width="24" height="52" rx="10" fill="#9CA3AF" />
      <rect x="24" y="46" width="22" height="10" rx="5" fill="#9CA3AF" transform="rotate(-25 35 51)" />
      <rect x="74" y="46" width="22" height="10" rx="5" fill="#9CA3AF" transform="rotate(25 85 51)" />
      <rect x="47" y="94" width="11" height="48" rx="5" fill="#9CA3AF" />
      <rect x="62" y="94" width="11" height="48" rx="5" fill="#9CA3AF" />
      <line x1="10" y1="150" x2="110" y2="150" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function BogyoFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} role="img" aria-hidden focusable="false">
      <ellipse cx="60" cy="150" rx="36" ry="5" fill="#E5E7EB" />
      <circle cx="60" cy="40" r="26" fill="#8FBC8F" />
      <circle cx="50" cy="36" r="6" fill="#fff" />
      <circle cx="70" cy="36" r="6" fill="#fff" />
      <circle cx="51" cy="37" r="3" fill="#1A1A1A" />
      <circle cx="71" cy="37" r="3" fill="#1A1A1A" />
      <path d="M50 50 Q60 58 70 50" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="40" y="66" width="40" height="46" rx="18" fill="#8FBC8F" />
      <rect x="16" y="70" width="26" height="11" rx="5.5" fill="#8FBC8F" transform="rotate(-30 29 75)" />
      <rect x="78" y="70" width="26" height="11" rx="5.5" fill="#8FBC8F" transform="rotate(30 91 75)" />
      <rect x="44" y="110" width="13" height="34" rx="6" fill="#8FBC8F" />
      <rect x="63" y="110" width="13" height="34" rx="6" fill="#8FBC8F" />
    </svg>
  )
}

export function ConesDiagram({ className, title }: { className?: string; title: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} role="img" aria-label={title} focusable="false">
      <rect x="4" y="4" width="232" height="152" rx="10" fill="#F9F7F2" stroke="#D1D5DB" />
      {/* wall */}
      <rect x="20" y="14" width="200" height="8" rx="2" fill="#9CA3AF" />
      {/* path */}
      <path d="M40 130 L120 60 L200 130" stroke="#2A9D8F" strokeWidth="3" strokeDasharray="8 6" fill="none" strokeLinecap="round" />
      {/* cones */}
      {[40, 120, 200].map((x) => (
        <g key={x}>
          <polygon points={`${x},${x === 120 ? 44 : 114} ${x - 9},${x === 120 ? 66 : 136} ${x + 9},${x === 120 ? 66 : 136}`} fill="#F28C28" />
          <rect x={x - 11} y={x === 120 ? 64 : 134} width="22" height="4" rx="1" fill="#D97A20" />
        </g>
      ))}
      {/* player */}
      <circle cx="120" cy="140" r="7" fill="#1A1A1A" />
    </svg>
  )
}
