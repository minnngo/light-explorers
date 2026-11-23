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
export function DownArrow({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="bob">
        <path d="M -12 -30 L 12 -30 L 12 -6 L 26 -6 L 0 20 L -26 -6 L -12 -6 Z" fill="#fbbf24" stroke="#78350f"
          strokeWidth={3} strokeLinejoin="round" />
      </g>
    </g>
  );
}

/** 움직이는 방법 안내 옆의 조이스틱 그림 (탐험대와 같은 굵은 갈색 테두리) */
export function JoystickIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x={4} y={19} width={24} height={9} rx={4.5} fill="#f59e0b" stroke={OUTLINE} strokeWidth={2} />
      <rect x={14.5} y={10} width={3} height={11} rx={1.5} fill={OUTLINE} />
      <circle cx={16} cy={9} r={5.5} fill="#fbbf24" stroke={OUTLINE} strokeWidth={2} />
      <circle cx={14.3} cy={7.3} r={1.6} fill="#fff7c2" />
      <circle cx={23} cy={23.5} r={1.8} fill="#2563eb" />
    </svg>
  );
}

/** 나침반 바늘이 도는 원 (원 가운데가 탐험대 몸 가운데) */
const COMPASS = { cy: -30, r: 88 }; // 반디(몸 가운데에서 약 50, 빛 30)보다 바깥

/** 나침반 바늘: 탐험대 둘레에서 가야 할 쪽을 가리키며 그쪽으로 톡톡 튀어 나간다 */
export function CompassArrow({ angle }: { angle: number }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * COMPASS.r;
  const y = COMPASS.cy + Math.sin(rad) * COMPASS.r;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <g className="compass-nudge">
        <path d="M 18 0 L -9 -16 L -2 0 L -9 16 Z" fill="#fbbf24" stroke="#78350f" strokeWidth={2.5} strokeLinejoin="round" />
      </g>
    </g>
  );
}

export type Mood = 'worried' | 'happy' | 'calm';

export interface VillagerLook {
  shirt: string;
  pants?: string;
  hair?: string;
  /** 머리 모양: 짧은 머리 / 긴 머리 / 할아버지(흰머리) */
  style?: 'short' | 'long' | 'old';
  /** 아이는 조금 작게 */
  child?: boolean;
}

/**
 * 마을 사람: 탐험대와 같은 그림체(굵은 갈색 테두리, 둥근 머리). (0, 0)이 발밑, 오른쪽을 본다.
 *  - worried: 처진 눈썹, 작은 입. 몸을 조금씩 흔든다
 *  - happy: 웃는 입, 두 팔을 들고 콩콩 뛴다
 */
export function Villager({ look, mood = 'calm', bubble, flip = false }: {
  look: VillagerLook;
  mood?: Mood;
  /** 머리 위 말풍선 */
  bubble?: string;
  /** 왼쪽을 본다 (말풍선 글자는 뒤집지 않는다) */
  flip?: boolean;
}) {
  const { shirt, pants = '#475569', hair = HAIR, style = 'short', child = false } = look;
  const k = child ? 0.78 : 1;
  const happy = mood === 'happy';
  return (
    <g>
      <g transform={`scale(${flip ? -k : k} ${k})`}>
      <g className={happy ? 'villager-cheer' : mood === 'worried' ? 'villager-sway' : 'villager-idle'}>
        {/* 다리 */}
        <rect x={-8} y={-6} width={7} height={22} rx={3.5} fill={pants} stroke={OUTLINE} strokeWidth={1.5} />
        <rect x={1} y={-6} width={7} height={22} rx={3.5} fill={pants} stroke={OUTLINE} strokeWidth={1.5} />
        <ellipse cx={-4} cy={17} rx={6} ry={3.5} fill="#4a2e17" />
        <ellipse cx={5} cy={17} rx={6} ry={3.5} fill="#4a2e17" />
        {/* 팔 (기뻐하면 위로) */}
        {happy ? (
          <>
            <rect x={-19} y={-58} width={7} height={22} rx={3.5} fill={shirt} stroke={OUTLINE} strokeWidth={1.5} transform="rotate(-20 -15 -36)" />
            <rect x={12} y={-58} width={7} height={22} rx={3.5} fill={shirt} stroke={OUTLINE} strokeWidth={1.5} transform="rotate(20 15 -36)" />
          </>
        ) : (
          <>
            <rect x={-17} y={-32} width={7} height={22} rx={3.5} fill={shirt} stroke={OUTLINE} strokeWidth={1.5} />
            <rect x={10} y={-32} width={7} height={22} rx={3.5} fill={shirt} stroke={OUTLINE} strokeWidth={1.5} />
          </>
        )}
        {/* 몸 */}
        <rect x={-12} y={-35} width={24} height={31} rx={9} fill={shirt} stroke={OUTLINE} strokeWidth={2} />
        {/* 머리 */}
        {style === 'long' && <rect x={-19} y={-62} width={38} height={30} rx={12} fill={hair} />}
        <circle cx={0} cy={-52} r={18} fill={SKIN} stroke={OUTLINE} strokeWidth={2} />
        {style === 'old' ? (
          <path d="M -18 -54 Q -16 -70 0 -70 Q 16 -70 18 -54 Q 12 -62 0 -62 Q -12 -62 -18 -54 Z" fill="#e5e7eb" stroke={OUTLINE} strokeWidth={1.2} />
        ) : (
          <path d="M -18 -52 Q -19 -72 0 -72 Q 18 -72 18 -55 Q 8 -62 -2 -60 Q -12 -59 -18 -52 Z" fill={hair} />
        )}
        {/* 얼굴 */}
        {mood === 'worried' ? (
          <>
            <path d="M 0 -58 L 7 -56 M 11 -56 L 18 -58" stroke="#1f1a17" strokeWidth={1.6} strokeLinecap="round" />
            <circle cx={4} cy={-51} r={2.2} fill="#1f1a17" />
            <circle cx={14} cy={-51} r={2.2} fill="#1f1a17" />
            <ellipse cx={9} cy={-42} rx={2.4} ry={2} fill="#7c2d12" />
          </>
        ) : (
          <>
            <circle cx={4} cy={-51} r={2.3} fill="#1f1a17" />
            <circle cx={14} cy={-51} r={2.3} fill="#1f1a17" />
            <circle cx={1} cy={-44} r={3} fill="#fb7185" opacity={0.4} />
            <path d={happy ? 'M 5 -44 Q 9 -38 13 -44 Z' : 'M 6 -43 Q 9 -40 12 -43'} fill={happy ? '#7c2d12' : 'none'}
              stroke="#7c2d12" strokeWidth={1.6} strokeLinecap="round" />
          </>
        )}
        {style === 'old' && <path d="M 2 -46 Q 9 -43 16 -46" fill="none" stroke="#9ca3af" strokeWidth={2} />}
      </g>
      </g>
      {bubble && <SpeechBubble text={bubble} y={-80 * k - 6} size={16} />}
    </g>
  );
}

/** 사람 머리 위 말풍선 (짧은 말 한마디). (x, y)가 꼬리 끝 */
export function SpeechBubble({ text, y, x = 0, size = 14 }: { text: string; y: number; x?: number; size?: number }) {
  const w = Math.max(size * 2, text.length * size * 0.95 + size * 1.2);
  const h = size * 1.8;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="bubble-pop">
        <rect x={-w / 2} y={-h} width={w} height={h} rx={h / 2.4} fill="#fff" stroke={OUTLINE} strokeWidth={1.8} />
        <path d="M -5 -1 L 0 8 L 5 -1 Z" fill="#fff" stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />
        <rect x={-6} y={-3} width={12} height={4} fill="#fff" />
        <text x={0} y={-h / 2 + size * 0.36} textAnchor="middle" fontSize={size} fontWeight={800} fill="#1f1a17">{text}</text>
      </g>
    </g>
  );
}
