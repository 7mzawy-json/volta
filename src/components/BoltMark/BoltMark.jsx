export default function BoltMark({ size = 24, glow = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={glow ? { filter: 'drop-shadow(0 0 6px rgba(57,255,20,0.65))' } : undefined}
      aria-hidden="true"
    >
      <polygon points="12,1 6,12 11,12 12,23 18,12 13,12" fill="currentColor" />
    </svg>
  );
}
