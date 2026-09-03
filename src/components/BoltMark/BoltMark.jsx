export default function BoltMark({ size = 24, glow = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      // The mark itself takes currentColor, so it follows the theme already. The
      // glow was a hardcoded neon halo, which on ivory reads as a green smudge
      // rather than light — it now comes from a token that dims for light mode.
      style={glow ? { filter: 'drop-shadow(0 0 6px var(--glow-hover))' } : undefined}
      aria-hidden="true"
    >
      <polygon points="12,1 6,12 11,12 12,23 18,12 13,12" fill="currentColor" />
    </svg>
  );
}
