import { getColor } from '../../data/colors.js';

// Colour-accurate accessory renders.
//
// The counterpart to DeviceRender. Accessories were outline glyphs while phones
// had finish-tinted bodies, so half the catalogue looked like placeholder icons
// next to the other half's product shots. Same approach as phones: the body
// takes the actual finish, and detailing flips between light and dark so a white
// charger keeps its edges on ivory and a black one keeps its own.
//
// One square viewBox for every shape, so a grid of mixed accessories lines up
// rather than each one sitting at its own optical size.

export default function AccessoryRender({ icon, color, size = 72, className = '' }) {
  const finish = getColor(color);
  const gid = `acc-${icon}-${(color || 'none').replace(/[^a-z0-9-]/gi, '')}`;

  const body = finish.hex;
  const line = finish.dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.34)';
  const deep = finish.dark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.30)';
  const soft = finish.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)';

  // Shared props keep every shape visually consistent without repeating them.
  const S = { fill: `url(#${gid})`, stroke: line, strokeWidth: 1.2 };

  const shapes = {
    earbuds: (
      <>
        {/* case, lid seam, and one bud resting outside it */}
        <rect x="14" y="26" width="32" height="26" rx="7" {...S} />
        <path d="M14 36 H46" stroke={line} strokeWidth="1" fill="none" />
        <circle cx="30" cy="46" r="2.4" fill={soft} />
        <g>
          <ellipse cx="55" cy="27" rx="6.5" ry="7.5" {...S} />
          <rect x="52.5" y="32" width="5" height="14" rx="2.5" {...S} />
          <circle cx="55" cy="26" r="2.6" fill={deep} />
        </g>
      </>
    ),
    headphones: (
      <>
        {/* headband arc plus two ear cups */}
        <path d="M16 40 V32 a20 20 0 0 1 40 0 V40" fill="none" stroke={body} strokeWidth="6" strokeLinecap="round" />
        <path d="M16 40 V32 a20 20 0 0 1 40 0 V40" fill="none" stroke={line} strokeWidth="1.2" />
        <rect x="9" y="37" width="15" height="23" rx="7" {...S} />
        <rect x="48" y="37" width="15" height="23" rx="7" {...S} />
        <ellipse cx="16.5" cy="48.5" rx="4.5" ry="7" fill={deep} />
        <ellipse cx="55.5" cy="48.5" rx="4.5" ry="7" fill={deep} />
      </>
    ),
    speaker: (
      <>
        <rect x="22" y="12" width="28" height="48" rx="12" {...S} />
        <circle cx="36" cy="27" r="6.5" fill={deep} />
        <circle cx="36" cy="27" r="2.6" fill={soft} />
        <circle cx="36" cy="45" r="8.5" fill={deep} />
        <circle cx="36" cy="45" r="3.4" fill={soft} />
      </>
    ),
    chargepad: (
      <>
        {/* flat disc seen at a slight angle */}
        <ellipse cx="36" cy="40" rx="26" ry="17" {...S} />
        <ellipse cx="36" cy="37" rx="26" ry="17" {...S} />
        <ellipse cx="36" cy="37" rx="14" ry="9" fill="none" stroke={line} strokeWidth="1" />
        <path d="M38 30 L32 39 h5 l-1.5 7 L44 36 h-5 z" fill={deep} />
      </>
    ),
    dock: (
      <>
        {/* upright phone cradle, watch puck, bud pad */}
        <path d="M14 58 H58 a4 4 0 0 0 4-4 v-2 H10 v2 a4 4 0 0 0 4 4 z" {...S} />
        <rect x="20" y="16" width="20" height="34" rx="4" {...S} />
        <rect x="23" y="19" width="14" height="28" rx="2.5" fill={deep} />
        <rect x="44" y="30" width="16" height="6" rx="3" {...S} />
        <circle cx="52" cy="44" r="6" {...S} />
      </>
    ),
    powerbank: (
      <>
        <rect x="21" y="12" width="30" height="48" rx="7" {...S} />
        <rect x="27" y="19" width="18" height="4" rx="2" fill={deep} />
        {/* four charge pips */}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={28 + i * 4.6} y="50" width="3" height="3" rx="1.2" fill={soft} />
        ))}
        <path d="M39 28 L31 40 h5 l-1.5 8 L44 35 h-5 z" fill={deep} />
      </>
    ),
    wallcharger: (
      <>
        {/* plug block with two prongs and two ports */}
        <rect x="19" y="20" width="34" height="34" rx="8" {...S} />
        <rect x="27" y="12" width="4" height="9" rx="1.5" fill={line} />
        <rect x="41" y="12" width="4" height="9" rx="1.5" fill={line} />
        <rect x="27" y="45" width="8" height="4" rx="2" fill={deep} />
        <rect x="38" y="45" width="8" height="4" rx="2" fill={deep} />
      </>
    ),
    carcharger: (
      <>
        {/* cylindrical barrel that plugs into a car socket */}
        <path d="M27 14 h18 a4 4 0 0 1 4 4 v30 a10 10 0 0 1-10 10 h-6 a10 10 0 0 1-10-10 V18 a4 4 0 0 1 4-4 z" {...S} />
        <rect x="30" y="20" width="12" height="4" rx="2" fill={deep} />
        <rect x="30" y="28" width="12" height="4" rx="2" fill={deep} />
        <ellipse cx="36" cy="56" rx="7" ry="3" fill={soft} />
      </>
    ),
    keyboard: (
      <>
        <rect x="8" y="24" width="56" height="30" rx="5" {...S} />
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3, 4, 5, 6].map((col) => (
            <rect key={`${row}-${col}`} x={13 + col * 7} y={29 + row * 7} width="5" height="5" rx="1.4" fill={deep} />
          ))
        )}
        <rect x="24" y="50" width="24" height="0" rx="1" fill={deep} />
      </>
    ),
    stand: (
      <>
        {/* folded laptop/phone riser seen from the side */}
        <path d="M12 56 L34 20 l6 3 L20 58 z" {...S} />
        <path d="M60 56 L38 20 l-6 3 L52 58 z" {...S} />
        <rect x="16" y="54" width="40" height="5" rx="2.5" {...S} />
        <path d="M30 34 H42" stroke={line} strokeWidth="1.2" fill="none" />
      </>
    ),
    case: (
      <>
        {/* phone-shaped shell with a camera cutout */}
        <rect x="22" y="8" width="28" height="56" rx="8" {...S} />
        <rect x="26" y="12" width="20" height="48" rx="5" fill="none" stroke={line} strokeWidth="1" />
        <rect x="27" y="13" width="15" height="15" rx="5" fill={deep} />
        <circle cx="32" cy="18" r="2.4" fill={soft} />
        <circle cx="38" cy="18" r="2.4" fill={soft} />
        <circle cx="32" cy="24" r="2.4" fill={soft} />
      </>
    ),
    cable: (
      <>
        {/* braided cord with a connector at each end */}
        <path d="M20 16 C 48 24, 24 46, 52 56" fill="none" stroke={body} strokeWidth="6" strokeLinecap="round" />
        <path d="M20 16 C 48 24, 24 46, 52 56" fill="none" stroke={line} strokeWidth="1" />
        <rect x="13" y="10" width="12" height="9" rx="3" {...S} />
        <rect x="47" y="53" width="12" height="9" rx="3" {...S} />
      </>
    ),
    mount: (
      <>
        {/* magnetic disc on an arm and a vent clip */}
        <circle cx="30" cy="26" r="15" {...S} />
        <circle cx="30" cy="26" r="7" fill="none" stroke={line} strokeWidth="1.2" />
        <path d="M38 36 L50 48" stroke={body} strokeWidth="6" strokeLinecap="round" />
        <path d="M38 36 L50 48" stroke={line} strokeWidth="1" />
        <rect x="46" y="45" width="16" height="14" rx="4" {...S} />
      </>
    ),
    glass: (
      <>
        {/* a sheet lifting off a phone-shaped outline */}
        <rect x="18" y="12" width="28" height="50" rx="6" fill="none" stroke={line} strokeWidth="1.4" strokeDasharray="3 3" />
        <rect x="26" y="8" width="28" height="50" rx="6" {...S} opacity="0.85" />
        <path d="M30 12 L50 12 L30 34 z" fill={soft} />
      </>
    ),
    watch: (
      <>
        <rect x="24" y="24" width="24" height="24" rx="7" {...S} />
        <rect x="28" y="8" width="16" height="18" rx="5" {...S} />
        <rect x="28" y="46" width="16" height="18" rx="5" {...S} />
        <rect x="27" y="27" width="18" height="18" rx="5" fill={deep} />
        <path d="M36 32 V36 l3 3" stroke={soft} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    ),
    hub: (
      <>
        <circle cx="36" cy="38" r="18" {...S} />
        <circle cx="36" cy="38" r="7" fill={deep} />
        <circle cx="36" cy="38" r="2.6" fill={soft} />
        <circle cx="36" cy="12" r="3" fill={body} stroke={line} strokeWidth="1" />
        <circle cx="14" cy="54" r="3" fill={body} stroke={line} strokeWidth="1" />
        <circle cx="58" cy="54" r="3" fill={body} stroke={line} strokeWidth="1" />
        <path d="M36 20 V15" stroke={line} strokeWidth="1.2" />
        <path d="M23 47 L17 51" stroke={line} strokeWidth="1.2" />
        <path d="M49 47 L55 51" stroke={line} strokeWidth="1.2" />
      </>
    ),
    tracker: (
      <>
        <circle cx="36" cy="38" r="19" {...S} />
        <circle cx="36" cy="38" r="12" fill="none" stroke={line} strokeWidth="1" />
        <circle cx="36" cy="38" r="4" fill={deep} />
        {/* keyring loop */}
        <circle cx="36" cy="14" r="5" fill="none" stroke={line} strokeWidth="2.4" />
      </>
    ),
    plug: (
      <>
        <rect x="18" y="18" width="36" height="36" rx="10" {...S} />
        <circle cx="36" cy="36" r="9" fill="none" stroke={line} strokeWidth="1.4" />
        <path d="M36 30 V36" stroke={line} strokeWidth="2" strokeLinecap="round" />
        <circle cx="27" cy="27" r="2" fill={deep} />
      </>
    )
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      className={className}
      role="img"
      aria-label={finish.name.en}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={body} stopOpacity="1" />
          <stop offset="55%" stopColor={body} stopOpacity="0.93" />
          <stop offset="100%" stopColor={body} stopOpacity="0.76" />
        </linearGradient>
      </defs>
      {shapes[icon] || shapes.chargepad}
    </svg>
  );
}
