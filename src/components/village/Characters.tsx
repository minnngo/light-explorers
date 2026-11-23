// 마을 그림 속 인물 (SVG 도형). 탐험대와 빛 요정 반디.
// 모두 (0, 0)이 발밑(반디는 몸 가운데)인 <g>라서, 쓰는 곳에서 translate로 놓으면 된다.
// 팔다리·날개 움직임은 globals.css의 .walker / .fairy 애니메이션.

const SKIN = '#ffdcb8';
const HAIR = '#6b3f1d';
const OUTLINE = '#3b2a1a';

/** 탐험대: 노란 모자와 가방을 멘 아이. 오른쪽을 본다 (왼쪽은 바깥에서 scale(-1 1)) */
export function Explorer({ walking = false }: { walking?: boolean }) {
  return (
    <g className={walking ? 'walker walking' : 'walker'}>
      <g className="w-bob">
        {/* 뒤쪽 팔·다리 (조금 어둡게) */}
        <g className="limb leg-b">
          <rect x={-3} y={-4} width={9} height={20} rx={4} fill="#1e3a8a" stroke={OUTLINE} strokeWidth={1.5} />
          <ellipse cx={3} cy={17} rx={7} ry={4} fill="#4a2e17" />
        </g>
        <g className="limb arm-b">
          <rect x={-2} y={-30} width={8} height={20} rx={4} fill="#d97706" stroke={OUTLINE} strokeWidth={1.5} />
          <circle cx={2} cy={-10} r={4.5} fill={SKIN} stroke={OUTLINE} strokeWidth={1.2} />
        </g>

        {/* 가방 */}
        <rect x={-21} y={-30} width={13} height={22} rx={5} fill="#b45309" stroke={OUTLINE} strokeWidth={1.8} />
        <rect x={-19} y={-20} width={9} height={6} rx={2} fill="#92400e" />

        {/* 몸 */}
        <rect x={-13} y={-33} width={26} height={31} rx={10} fill="#f59e0b" stroke={OUTLINE} strokeWidth={2} />
        <line x1={-9} y1={-31} x2={-4} y2={-10} stroke="#92400e" strokeWidth={3} strokeLinecap="round" />

        {/* 앞쪽 다리 */}
        <g className="limb leg-a">
          <rect x={-7} y={-4} width={9} height={20} rx={4} fill="#2563eb" stroke={OUTLINE} strokeWidth={1.5} />
          <ellipse cx={-1} cy={17} rx={7} ry={4} fill="#5b3a1e" />
        </g>

        {/* 머리 */}
        <g>
          <circle cx={0} cy={-52} r={21} fill={SKIN} stroke={OUTLINE} strokeWidth={2} />
          {/* 머리카락 */}
          <path d="M -21 -52 Q -22 -74 0 -74 Q 18 -74 21 -58 Q 8 -64 -4 -62 Q -14 -60 -21 -52 Z" fill={HAIR} />
          {/* 탐험 모자 */}
          <path d="M -19 -62 Q -16 -82 2 -82 Q 20 -82 21 -63 Z" fill="#facc15" stroke={OUTLINE} strokeWidth={2} />
          <path d="M 12 -64 Q 26 -66 32 -61 Q 24 -58 12 -60 Z" fill="#eab308" stroke={OUTLINE} strokeWidth={1.8} />
          <circle cx={2} cy={-73} r={3.5} fill="#fff7c2" />
          {/* 눈·볼·입 */}
          <ellipse cx={5} cy={-50} rx={3} ry={4} fill="#1f1a17" />
          <ellipse cx={15} cy={-50} rx={3} ry={4} fill="#1f1a17" />
          <circle cx={6} cy={-51.5} r={1.2} fill="#fff" />
          <circle cx={16} cy={-51.5} r={1.2} fill="#fff" />
          <circle cx={-1} cy={-42} r={4} fill="#fb7185" opacity={0.45} />
          <circle cx={16} cy={-42} r={3.5} fill="#fb7185" opacity={0.45} />
          <path d="M 7 -41 Q 10 -37 13 -41" fill="none" stroke="#7c2d12" strokeWidth={2} strokeLinecap="round" />
        </g>

        {/* 앞쪽 팔 */}
        <g className="limb arm-a">
          <rect x={-4} y={-30} width={8} height={20} rx={4} fill="#fbbf24" stroke={OUTLINE} strokeWidth={1.5} />
          <circle cx={0} cy={-10} r={4.5} fill={SKIN} stroke={OUTLINE} strokeWidth={1.2} />
        </g>
      </g>
    </g>
  );
}

/** 빛 요정 반디: 빛나는 작은 요정. 날개를 팔랑인다. (0, 0)이 몸 가운데 */
export function Fairy({ glowId = 'fairy-glow' }: { glowId?: string }) {
  return (
    <g className="fairy">
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="#fff7c2" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={0} cy={0} r={30} fill={`url(#${glowId})`} />
      {/* 날개 */}
      <g className="wing wing-l">
        <ellipse cx={-11} cy={-6} rx={11} ry={7} fill="#e0f2fe" fillOpacity={0.85} stroke="#7dd3fc" strokeWidth={1.5} transform="rotate(-25 -11 -6)" />
        <ellipse cx={-9} cy={4} rx={7} ry={5} fill="#e0f2fe" fillOpacity={0.85} stroke="#7dd3fc" strokeWidth={1.5} transform="rotate(20 -9 4)" />
      </g>
      <g className="wing wing-r">
        <ellipse cx={11} cy={-6} rx={11} ry={7} fill="#e0f2fe" fillOpacity={0.85} stroke="#7dd3fc" strokeWidth={1.5} transform="rotate(25 11 -6)" />
        <ellipse cx={9} cy={4} rx={7} ry={5} fill="#e0f2fe" fillOpacity={0.85} stroke="#7dd3fc" strokeWidth={1.5} transform="rotate(-20 9 4)" />
      </g>
      {/* 옷 */}
      <path d="M -6 0 L 6 0 L 9 13 L -9 13 Z" fill="#34d399" stroke="#065f46" strokeWidth={1.5} strokeLinejoin="round" />
      {/* 머리 */}
      <circle cx={0} cy={-8} r={8} fill={SKIN} stroke={OUTLINE} strokeWidth={1.5} />
      <path d="M -8 -9 Q -7 -18 0 -18 Q 8 -18 8 -9 Q 3 -13 -2 -12 Q -6 -12 -8 -9 Z" fill="#fbbf24" />
      <circle cx={-2.5} cy={-7} r={1.3} fill="#1f1a17" />
      <circle cx={2.5} cy={-7} r={1.3} fill="#1f1a17" />
      <path d="M -2 -3.5 Q 0 -2 2 -3.5" fill="none" stroke="#7c2d12" strokeWidth={1.2} strokeLinecap="round" />
      {/* 더듬이 별빛 */}
      <line x1={0} y1={-18} x2={0} y2={-24} stroke="#ca8a04" strokeWidth={1.2} />
      <circle cx={0} cy={-25} r={2.8} fill="#fde047" />
    </g>
  );
}

/** 말풍선 옆 같은 HTML 자리에 쓰는 반디 그림 */
export function FairyIcon({ className = 'size-11' }: { className?: string }) {
  return (
    <svg viewBox="-30 -30 60 60" className={className} aria-hidden>
      <Fairy glowId="fairy-icon-glow" />
    </svg>
  );
}

/** 목적지를 가리키는 아래 화살표 */
export function DownArrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="bob">
        <path d="M -12 -30 L 12 -30 L 12 -6 L 26 -6 L 0 20 L -26 -6 L -12 -6 Z" fill="#fbbf24" stroke="#78350f"
          strokeWidth={3} strokeLinejoin="round" />
      </g>
    </g>
  );
}
