import { getColor } from '../../data/colors.js';

// Colour-accurate device render.
//
// Product photography would mean shipping someone else's copyrighted media, so
// phones are drawn instead — but drawn *from the data*, not as one repeated
// icon. The body takes the actual finish (Cosmic Orange, Titanium Icyblue), and
// the camera layout follows the brand, so an iPhone reads as an iPhone next to a
// Galaxy.
//
// Deliberately the BACK of the phone: a front view is mostly black screen, which
// would defeat the whole point of showing a finish. Detailing flips between
// light and dark so a silver body keeps its edges on a dark page and a black one
// keeps its own.
//
// Vector rather than raster also protects the page-weight advantage — the entire
// catalogue's imagery costs a few KB rather than a few MB.

function CameraModule({ brand, x, y, tint, stroke, lens }) {
  // Apple: squircle module, three lenses in a triangle.
  if (brand === 'apple') {
    return (
      <g>
        <rect x={x} y={y} width="23" height="23" rx="7" fill={tint} stroke={stroke} strokeWidth="0.8" />
        <circle cx={x + 7} cy={y + 7} r="4" fill={lens} stroke={stroke} strokeWidth="0.7" />
        <circle cx={x + 16} cy={y + 7} r="4" fill={lens} stroke={stroke} strokeWidth="0.7" />
        <circle cx={x + 7} cy={y + 16} r="4" fill={lens} stroke={stroke} strokeWidth="0.7" />
        <circle cx={x + 16.5} cy={y + 16.5} r="1.6" fill={stroke} />
      </g>
    );
  }
  // Samsung: bare lenses straight on the body, no housing.
  if (brand === 'samsung') {
    return (
      <g>
        <circle cx={x + 6} cy={y + 4} r="3.6" fill={lens} stroke={stroke} strokeWidth="0.9" />
        <circle cx={x + 6} cy={y + 13} r="3.6" fill={lens} stroke={stroke} strokeWidth="0.9" />
        <circle cx={x + 6} cy={y + 21} r="3" fill={lens} stroke={stroke} strokeWidth="0.9" />
      </g>
    );
  }
  // Huawei, Honor, Oppo, Xiaomi, Tecno: circular island.
  return (
    <g>
      <circle cx={x + 11} cy={y + 11} r="12" fill={tint} stroke={stroke} strokeWidth="0.8" />
      <circle cx={x + 7} cy={y + 7.5} r="3.4" fill={lens} stroke={stroke} strokeWidth="0.7" />
      <circle cx={x + 15} cy={y + 11} r="3.4" fill={lens} stroke={stroke} strokeWidth="0.7" />
      <circle cx={x + 8.5} cy={y + 15.5} r="2.8" fill={lens} stroke={stroke} strokeWidth="0.7" />
    </g>
  );
}

export default function DeviceRender({
  color,
  brand = 'generic',
  wide = false,
  size = 120,
  className = ''
}) {
  const finish = getColor(color);
  const gid = `dv-${(color || 'none').replace(/[^a-z0-9-]/gi, '')}-${wide ? 'w' : 'n'}`;

  const stroke = finish.dark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.32)';
  const moduleTint = finish.dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
  const lens = finish.dark ? '#0A0A0B' : '#242428';

  // A foldable is simply a wider body — same drawing, different proportions.
  const bodyW = wide ? 48 : 32;
  const bodyX = (72 - bodyW) / 2;

  return (
    <svg
      width={size}
      height={(size * 116) / 72}
      viewBox="0 0 72 116"
      className={className}
      role="img"
      aria-label={finish.name.en}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={finish.hex} stopOpacity="1" />
          <stop offset="50%" stopColor={finish.hex} stopOpacity="0.92" />
          <stop offset="100%" stopColor={finish.hex} stopOpacity="0.74" />
        </linearGradient>
      </defs>

      <rect
        x={bodyX}
        y="5"
        width={bodyW}
        height="106"
        rx={wide ? 6 : 8}
        fill={`url(#${gid})`}
        stroke={stroke}
        strokeWidth="1.1"
      />

      {/* one soft sheen, so the body reads as a surface rather than a flat shape */}
      <rect
        x={bodyX + 3}
        y="46"
        width={wide ? 16 : 9}
        height="52"
        rx="5"
        fill="#FFFFFF"
        opacity="0.06"
      />

      {/* fold seam, foldables only */}
      {wide && <line x1="36" y1="8" x2="36" y2="108" stroke={stroke} strokeWidth="0.8" opacity="0.65" />}

      {/* x and y must be numbers, not JSX string attributes: the module offsets
          its lenses with y + 6, and "11" + 6 concatenates to "116". */}
      <CameraModule
        brand={brand}
        x={bodyX + 4}
        y={11}
        tint={moduleTint}
        stroke={stroke}
        lens={lens}
      />
    </svg>
  );
}
