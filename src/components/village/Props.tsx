// 마을의 물건 그림 (집, 나무, 가로등, 울타리, 종탑, 풍차, 무대, 표지판).
// 캐릭터와 같은 그림체: 굵은 테두리 없이 파스텔 색, 위는 밝고 아래는 그늘진 입체 느낌, 둥근 모서리.
// 모두 (0, 0)이 땅에 닿는 가운데라서, 쓰는 곳에서 translate·scale로 놓는다.
// 그라데이션은 <PropDefs />를 그 SVG의 <defs> 안에 한 번 넣어야 보인다 (같은 이름이 여러 번 있어도 내용이 같아 괜찮다).

export const ROOFS = {
  rose: ['#ffc4c0', '#e9867f'],
  sky: ['#c4e6f5', '#7fb8d6'],
  lilac: ['#ddd0fb', '#a48ee0'],
  peach: ['#ffd9b0', '#e8995a'],
  mint: ['#c6f0d9', '#79c79c'],
  pink: ['#ffd0e6', '#e58cb6'],
} as const;
export type RoofColor = keyof typeof ROOFS;

export function PropDefs() {
  return (
    <>
      <linearGradient id="p-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fffaf0" />
        <stop offset="100%" stopColor="#efdcbc" />
      </linearGradient>
      {Object.entries(ROOFS).map(([name, [light, dark]]) => (
        <linearGradient key={name} id={`p-roof-${name}`} x1="0.2" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      ))}
      <linearGradient id="p-wood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#e2ad7e" />
        <stop offset="100%" stopColor="#b07548" />
      </linearGradient>
      <radialGradient id="p-leaf" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#d2f3ae" />
        <stop offset="100%" stopColor="#74c266" />
      </radialGradient>
      <radialGradient id="p-leaf-dark" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#a9de8e" />
        <stop offset="100%" stopColor="#57a352" />
      </radialGradient>
      <radialGradient id="p-gold" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#fff6c4" />
        <stop offset="50%" stopColor="#f8d257" />
        <stop offset="100%" stopColor="#d99c25" />
      </radialGradient>
      <radialGradient id="p-gold-dim" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#efe0b0" />
        <stop offset="55%" stopColor="#c9a456" />
        <stop offset="100%" stopColor="#97742f" />
      </radialGradient>
      <linearGradient id="p-post" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#a5acc9" />
        <stop offset="100%" stopColor="#6b7395" />
      </linearGradient>
      <radialGradient id="p-lamp-off" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stopColor="#e3e6f0" />
        <stop offset="100%" stopColor="#9ea6c0" />
      </radialGradient>
      <radialGradient id="p-lamp-on" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ffe27a" />
      </radialGradient>
      <linearGradient id="p-cream" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fffdf7" />
        <stop offset="100%" stopColor="#e6d9c2" />
      </linearGradient>
      <linearGradient id="p-sail" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f6fcff" />
        <stop offset="100%" stopColor="#bfe1f3" />
      </linearGradient>
      <radialGradient id="p-glow">
        <stop offset="0%" stopColor="#fff7c2" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

const Shadow = ({ rx, ry = 6 }: { rx: number; ry?: number }) => (
  <ellipse cx={3} cy={1} rx={rx} ry={ry} fill="#1b2a1a" opacity={0.18} />
);

/** 둥근 세모 지붕 (밑변 너비 w, 높이 h, 아래 끝이 y=0) */
function roofPath(w: number, h: number): string {
  const x = w / 2;
  return `M ${-x} 0 Q ${-x - 3} -5 ${-x + 5} -9 L -5 ${-h + 3} Q 0 ${-h - 1} 5 ${-h + 3} L ${x - 5} -9 Q ${x + 3} -5 ${x} 0 Z`;
}

/** 집: 크림색 벽, 파스텔 지붕, 굴뚝, 둥근 문과 창. 불이 켜지면 창이 따뜻하게 빛난다 */
export function CuteHouse({ roof, lit }: { roof: RoofColor; lit: boolean }) {
  return (
    <g pointerEvents="none">
      <Shadow rx={40} ry={7} />
      <rect x={14} y={-70} width={11} height={22} rx={3} fill="url(#p-wood)" />
      <rect x={-30} y={-46} width={60} height={46} rx={8} fill="url(#p-wall)" />
      <g transform="translate(0 -40)">
        <path d={roofPath(80, 36)} fill={`url(#p-roof-${roof})`} />
        <path d="M -26 -10 L -6 -27" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.45} />
      </g>
      <path d="M -7 0 V -15 A 7 7 0 0 1 7 -15 V 0 Z" fill="url(#p-wood)" />
      <circle cx={3.5} cy={-8} r={1.3} fill="#fff1c8" />
      {[-24, 11].map((wx) => (
        <g key={wx}>
          {lit && <circle cx={wx + 6.5} cy={-25} r={16} fill="url(#p-glow)" opacity={0.7} />}
          <rect x={wx} y={-32} width={13} height={13} rx={4} fill={lit ? '#ffe9a6' : '#7a83a6'} />
          <path d={`M ${wx + 6.5} -31 V -20 M ${wx + 1} -25.5 H ${wx + 12}`} stroke="#ffffff" strokeWidth={1.3} opacity={0.55} />
        </g>
      ))}
    </g>
  );
}

/** 나무: 둥글게 겹친 잎과 둥근 줄기 */
export function CuteTree() {
  return (
    <g pointerEvents="none">
      <Shadow rx={24} />
      <rect x={-5} y={-28} width={10} height={28} rx={4} fill="url(#p-wood)" />
      <circle cx={-13} cy={-38} r={17} fill="url(#p-leaf-dark)" />
      <circle cx={13} cy={-38} r={17} fill="url(#p-leaf-dark)" />
      <circle cx={0} cy={-52} r={22} fill="url(#p-leaf)" />
      <ellipse cx={-7} cy={-61} rx={8} ry={5} fill="#ffffff" opacity={0.35} transform="rotate(-20 -7 -61)" />
    </g>
  );
}

/** 덤불 */
export function CuteBush() {
  return (
    <g pointerEvents="none">
      <Shadow rx={22} ry={5} />
      <circle cx={-10} cy={-9} r={11} fill="url(#p-leaf-dark)" />
      <circle cx={10} cy={-9} r={11} fill="url(#p-leaf-dark)" />
      <circle cx={0} cy={-16} r={13} fill="url(#p-leaf)" />
      <ellipse cx={-4} cy={-22} rx={4} ry={2.5} fill="#ffffff" opacity={0.35} />
    </g>
  );
}

/** 가로등 (높이 h). 켜지면 둥근 등이 환하게 빛난다 */
export function CuteLamp({ on, h = 60, className, delay }: { on: boolean; h?: number; className?: string; delay?: string }) {
  return (
    <g pointerEvents="none">
      <Shadow rx={10} ry={3.5} />
      {on && (
        <g className={className} style={{ animationDelay: delay }}>
          <ellipse cx={0} cy={2} rx={h * 0.8} ry={h * 0.22} fill="#ffe9a0" opacity={0.4} />
          <circle cx={0} cy={-h - 10} r={h * 0.8} fill="url(#p-glow)" />
        </g>
      )}
      <rect x={-6} y={-6} width={12} height={7} rx={3} fill="url(#p-post)" />
      <rect x={-3} y={-h} width={6} height={h} rx={3} fill="url(#p-post)" />
      <rect x={-10} y={-h - 19} width={20} height={18} rx={7} fill={on ? 'url(#p-lamp-on)' : 'url(#p-lamp-off)'}
        className={on ? className : undefined} style={{ animationDelay: delay }} />
      <path d={`M -13 ${-h - 17} Q 0 ${-h - 31} 13 ${-h - 17} Z`} fill="url(#p-post)" />
      <ellipse cx={-4} cy={-h - 14} rx={2.5} ry={4} fill="#ffffff" opacity={0.5} />
    </g>
  );
}

/** 울타리 (왼쪽 끝이 0) */
export function CuteFence({ width }: { width: number }) {
  const posts = Math.max(2, Math.round(width / 11));
  return (
    <g pointerEvents="none">
      <rect x={0} y={-11} width={width} height={4} rx={2} fill="#e9cfa3" />
      {Array.from({ length: posts }, (_, i) => (
        <rect key={i} x={(i * (width - 6)) / (posts - 1)} y={-17} width={6} height={17} rx={3} fill="#f7e6c6" />
      ))}
    </g>
  );
}

/** 종: 금빛 종과 추. 해결 전에는 빛이 바랜 색 */
export function CuteBell({ on }: { on: boolean }) {
  return (
    <g>
      <rect x={-3} y={-96} width={6} height={10} rx={2} fill="#8f6a4a" />
      <path d="M -21 -40 Q -21 -86 0 -88 Q 21 -86 21 -40 Q 26 -37 26 -33 L -26 -33 Q -26 -37 -21 -40 Z"
        fill={on ? 'url(#p-gold)' : 'url(#p-gold-dim)'} />
      <path d="M -11 -72 Q -9 -80 -2 -82" fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" opacity={0.6} />
      <circle cx={0} cy={-28} r={5.5} fill="url(#p-wood)" />
    </g>
  );
}

/** 종탑: 두 나무 기둥, 둥근 지붕, 가운데 매달린 종 (swing이면 흔들린다) */
export function CuteBellTower({ on, swing = false }: { on: boolean; swing?: boolean }) {
  return (
    <g pointerEvents="none">
      <Shadow rx={46} ry={7} />
      <rect x={-36} y={-104} width={11} height={104} rx={5} fill="url(#p-wood)" />
      <rect x={25} y={-104} width={11} height={104} rx={5} fill="url(#p-wood)" />
      <g transform="translate(0 -100)">
        <path d={roofPath(104, 34)} fill="url(#p-roof-peach)" />
        <path d="M -34 -10 L -8 -26" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.45} />
      </g>
      <rect x={-38} y={-104} width={76} height={9} rx={4.5} fill="url(#p-wood)" />
      <g className={swing ? 'bell-swing' : undefined}>
        <CuteBell on={on} />
      </g>
    </g>
  );
}

/** 풍차: 크림색 탑, 둥근 빨간 모자, 파스텔 날개. spin이면 씽씽, twitch면 살짝 꿈틀하다 멈춘다 */
export function CuteWindmill({ on, motion = 'still' }: { on: boolean; motion?: 'spin' | 'twitch' | 'still' }) {
  const hub = -100;
  const fan = motion === 'spin' ? 'fan fan-fast' : motion === 'twitch' ? 'fan blade-twitch' : 'fan';
  return (
    <g pointerEvents="none">
      <Shadow rx={40} ry={7} />
      <path d="M -31 0 Q -33 0 -32 -6 L -18 -88 Q -17 -92 -13 -92 L 13 -92 Q 17 -92 18 -88 L 32 -6 Q 33 0 31 0 Z" fill="url(#p-cream)" />
      <path d="M -21 -92 Q -21 -120 0 -120 Q 21 -120 21 -92 Z" fill="url(#p-roof-rose)" />
      <path d="M -9 0 V -16 A 9 9 0 0 1 9 -16 V 0 Z" fill="url(#p-wood)" />
      {on && <circle cx={0} cy={-52} r={16} fill="url(#p-glow)" />}
      <circle cx={0} cy={-52} r={7.5} fill={on ? '#ffe9a6' : '#7a83a6'} />
      <g className={fan}>
        <circle cx={0} cy={hub} r={84} fill="none" />
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 0 ${hub})`}>
            <rect x={-2.5} y={hub - 80} width={5} height={72} rx={2.5} fill="url(#p-wood)" />
            <rect x={3} y={hub - 78} width={20} height={62} rx={6} fill="url(#p-sail)" />
            <path d={`M 4 ${hub - 58} h 18 M 4 ${hub - 38} h 18`} stroke="#ffffff" strokeWidth={2} opacity={0.8} />
          </g>
        ))}
        <circle cx={0} cy={hub} r={8} fill="url(#p-wood)" />
      </g>
    </g>
  );
}

const BULBS = ['#ffb3b3', '#ffe08a', '#a9e8c4', '#a9d4ff', '#ffc2e2'];

/** 축제 무대: 나무 무대와 전구 줄 (on이면 알록달록 빛난다) */
export function CuteStage({ on }: { on: boolean }) {
  return (
    <g pointerEvents="none">
      <Shadow rx={86} ry={7} />
      <rect x={-80} y={-30} width={160} height={30} rx={8} fill="url(#p-wood)" />
      <rect x={-86} y={-38} width={172} height={11} rx={5.5} fill="#e9b98a" />
      <rect x={-76} y={-126} width={10} height={92} rx={5} fill="url(#p-wood)" />
      <rect x={66} y={-126} width={10} height={92} rx={5} fill="url(#p-wood)" />
      <path d="M -71 -118 Q 0 -86 71 -118" fill="none" stroke="#9c8a7a" strokeWidth={2} />
      {[-48, -24, 0, 24, 48].map((x, i) => {
        const y = -118 + 32 * (1 - (x / 71) ** 2) * 0.95;
        return (
          <g key={x}>
            {on && <circle cx={x} cy={y + 5} r={16} fill="url(#p-glow)" />}
            <circle cx={x} cy={y + 5} r={6} fill={on ? BULBS[i] : '#a7a3b5'} />
          </g>
        );
      })}
    </g>
  );
}

/** 나무 표지판 */
export function CuteSign({ text }: { text: string }) {
  return (
    <g pointerEvents="none">
      <Shadow rx={16} ry={4} />
      <rect x={-4} y={-40} width={8} height={40} rx={4} fill="url(#p-wood)" />
      <rect x={-50} y={-70} width={100} height={36} rx={12} fill="#f8e6c4" />
      <rect x={-50} y={-70} width={100} height={8} rx={4} fill="#ffffff" opacity={0.35} />
      <text x={0} y={-45} textAnchor="middle" fontSize={20} fontWeight={800} fill="#9a6338">{text}</text>
    </g>
  );
}

/** 절연 장갑 (S1 안전 약속). 작게 보여도 한눈에 알아보게 단순한 둥근 고무장갑 */
export function GloveIcon({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="glove-rubber" gradientUnits="userSpaceOnUse" x1="10" y1="6" x2="50" y2="52">
          <stop offset="0%" stopColor="#9be39a" />
          <stop offset="100%" stopColor="#3fae5a" />
        </linearGradient>
      </defs>
      {/* 엄지 */}
      <rect x={6} y={26} width={13} height={22} rx={6.5} fill="url(#glove-rubber)" transform="rotate(-35 12.5 37)" />
      {/* 손가락 셋 */}
      <rect x={16} y={9} width={10} height={30} rx={5} fill="url(#glove-rubber)" />
      <rect x={27.5} y={5} width={10} height={30} rx={5} fill="url(#glove-rubber)" />
      <rect x={39} y={10} width={10} height={28} rx={5} fill="url(#glove-rubber)" />
      {/* 손바닥 */}
      <rect x={16} y={26} width={33} height={24} rx={11} fill="url(#glove-rubber)" />
      {/* 손목 띠 */}
      <rect x={18} y={47} width={29} height={12} rx={6} fill="#2e8a4a" />
      {/* 빛 하나 */}
      <rect x={19.5} y={13} width={3} height={10} rx={1.5} fill="#ffffff" opacity={0.6} />
    </svg>
  );
}
