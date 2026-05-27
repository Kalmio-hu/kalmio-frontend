/**
 * Apple logo — monochrome glyph that follows Apple's "Sign in with Apple"
 * button guidelines. Per Apple HIG the logo is solid black on a white button
 * (which matches our ProviderButton background), no padding, no extra effects.
 *
 * Source path is Apple's published glyph (single closed shape) — keeping it
 * inline avoids shipping a PNG and lets it inherit `currentColor` when needed
 * (e.g. dark-mode variants in the future).
 */
export function AppleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#000"
        d="M14.94 13.84c-.27.61-.59 1.18-.96 1.7-.51.71-.93 1.2-1.25 1.47-.5.45-1.03.68-1.6.69-.41 0-.9-.12-1.48-.35-.58-.23-1.11-.35-1.59-.35-.5 0-1.05.12-1.65.35-.6.23-1.08.35-1.45.36-.55.02-1.09-.21-1.62-.7-.35-.3-.79-.81-1.32-1.54C1.34 14.69.86 13.79.46 12.78A12.06 12.06 0 0 1 0 8.74c0-1.55.34-2.89 1.01-4.01.53-.91 1.23-1.62 2.11-2.15A5.78 5.78 0 0 1 5.97 1.7c.45 0 1.04.14 1.79.41.74.27 1.22.41 1.43.41.16 0 .69-.16 1.6-.49.85-.3 1.57-.43 2.16-.38 1.6.13 2.8.76 3.6 1.9-1.43.87-2.14 2.08-2.13 3.65.01 1.22.46 2.23 1.33 3.03.4.37.84.66 1.34.86-.11.31-.22.61-.34.9ZM12.23.36c0 .98-.36 1.9-1.08 2.74-.86 1-1.9 1.58-3.04 1.49a3.04 3.04 0 0 1-.02-.37c0-.94.41-1.94 1.14-2.76.36-.41.83-.76 1.4-1.04C11.18.15 11.72 0 12.22 0c.01.12.02.24.02.36Z"
      />
    </svg>
  )
}
