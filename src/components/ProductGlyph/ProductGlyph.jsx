const paths = {
  phone: (
    <>
      <rect x="15" y="4" width="18" height="40" rx="3.5" />
      <path d="M21 8 H27" />
      <rect x="19" y="13" width="10" height="7" rx="1.6" />
      <circle cx="24" cy="39" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  earbuds: (
    <>
      <rect x="8" y="14" width="32" height="20" rx="10" />
      <path d="M8 21 H40" />
      <circle cx="17" cy="27" r="3.2" fill="currentColor" stroke="none" />
      <circle cx="31" cy="27" r="3.2" fill="currentColor" stroke="none" />
    </>
  ),
  chargepad: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M26 14 L18 26 H24 L22 34 L32 21 H26 Z" fill="currentColor" stroke="none" />
    </>
  ),
  powerbank: (
    <>
      <rect x="14" y="8" width="20" height="32" rx="4" />
      <rect x="20" y="4" width="8" height="4" rx="1" />
      <path d="M26 16 L19 25 H24 L22 32 L30 22 H25 Z" fill="currentColor" stroke="none" />
    </>
  ),
  watch: (
    <>
      <rect x="14" y="14" width="20" height="20" rx="5" />
      <path d="M20 14 L20 8 H28 L28 14" />
      <path d="M20 34 L20 40 H28 L28 34" />
      <path d="M24 20 V24 L27 27" />
    </>
  ),
  keyboard: (
    <>
      <rect x="6" y="14" width="36" height="20" rx="3" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4, 5].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={11 + col * 5.4}
            y={18 + row * 4}
            width="3.4"
            height="2.4"
            rx="0.6"
            fill="currentColor"
            stroke="none"
          />
        ))
      )}
    </>
  ),
  speaker: (
    <>
      <rect x="14" y="6" width="20" height="36" rx="6" />
      <circle cx="24" cy="18" r="4" />
      <circle cx="24" cy="30" r="7" />
    </>
  ),
  stand: (
    <>
      <path d="M8 36 L24 12 L40 36" />
      <path d="M16 36 H32" />
      <path d="M20 28 H28" />
    </>
  ),
  hub: (
    <>
      <circle cx="24" cy="24" r="6" />
      <circle cx="24" cy="8" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="8" cy="32" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="40" cy="32" r="2.5" fill="currentColor" stroke="none" />
      <path d="M24 18 V11" />
      <path d="M19 27 L10 31" />
      <path d="M29 27 L38 31" />
    </>
  )
};

export default function ProductGlyph({ icon, size = 64, className = '' }) {
  // An unknown icon used to fall through to `chargepad` in silence, which is how
  // headphones, a case and a dock all shipped to the cart drawer drawn as a
  // charging pad — plausible enough that nothing looked broken. Failing loudly in
  // development turns that into something you notice the first time.
  if (import.meta.env?.DEV && icon && !paths[icon]) {
    console.warn(
      `[ProductGlyph] no glyph for "${icon}" — falling back to chargepad. ` +
        `Use ProductVisual for products; it renders accessories via AccessoryRender.`
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[icon] || paths.chargepad}
    </svg>
  );
}
