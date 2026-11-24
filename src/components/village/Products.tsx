// S2 도입 컷 4의 전지 제품 그림. 밝은 바탕 위에서 한눈에 알아보게 큼직하고 단순하게, 마을 소품처럼 테두리 없이.
// 모두 viewBox 0 0 100 100, 바닥 가운데가 아래쪽.

/** 손 선풍기: 동그란 머리(흰 얼굴 + 날개 넷)와 손잡이. 컷 4는 예상 문항이라 돌리지 않는다 */
export function HandFan({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4fd1b5" />
          <stop offset="100%" stopColor="#1fa588" />
        </linearGradient>
      </defs>
      <ellipse cx={50} cy={97} rx={14} ry={2.5} fill="#000" opacity={0.12} />
      <rect x={42} y={58} width={16} height={38} rx={8} fill={`url(#${id}-body)`} />
      <circle cx={50} cy={74} r={4} fill="#ffffff" />
      <circle cx={50} cy={36} r={32} fill={`url(#${id}-body)`} />
      <circle cx={50} cy={36} r={25} fill="#ffffff" />
      {[45, 135, 225, 315].map((deg) => (
        <ellipse key={deg} cx={50} cy={22} rx={7.5} ry={12} fill="#7fe0c9" transform={`rotate(${deg} 50 36)`} />
      ))}
      <circle cx={50} cy={36} r={6} fill="#1fa588" />
    </svg>
  );
}

/** 손전등: 주황 몸통, 넓은 머리, 앞으로 퍼지는 빛 */
export function Flashlight({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc25c" />
          <stop offset="100%" stopColor="#f08a1c" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffe066" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#ffe066" stopOpacity={0} />
        </linearGradient>
      </defs>
      <ellipse cx={42} cy={88} rx={32} ry={3} fill="#000" opacity={0.12} />
      <g transform="rotate(-20 50 55)">
        <path d="M 66 44 L 100 30 L 100 80 L 66 66 Z" fill={`url(#${id}-beam)`} />
        <rect x={6} y={46} width={44} height={18} rx={9} fill={`url(#${id}-body)`} />
        <path d="M 46 44 L 62 36 Q 68 36 68 42 L 68 68 Q 68 74 62 74 L 46 66 Z" fill={`url(#${id}-body)`} />
        <ellipse cx={67} cy={55} rx={4} ry={17} fill="#fff4b3" />
        <rect x={22} y={42} width={12} height={6} rx={3} fill="#5b4a3a" />
      </g>
    </svg>
  );
}

/** 리모컨: 보라 몸통, 빨간 전원 버튼, 흰 버튼들 */
export function Remote({ id }: { id: string }) {
  const buttons = [
    [41, 48], [50, 48], [59, 48],
    [41, 59], [50, 59], [59, 59],
    [41, 70], [50, 70], [59, 70],
  ];
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9b8cff" />
          <stop offset="100%" stopColor="#6a55e0" />
        </linearGradient>
      </defs>
      <ellipse cx={50} cy={97} rx={18} ry={2.5} fill="#000" opacity={0.12} />
      <rect x={31} y={6} width={38} height={89} rx={14} fill={`url(#${id}-body)`} />
      <circle cx={50} cy={25} r={7} fill="#ff5c7a" />
      {buttons.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3.8} fill="#ffffff" />
      ))}
      <rect x={40} y={80} width={20} height={6} rx={3} fill="#ffffff" opacity={0.7} />
    </svg>
  );
}

/** 전지 (AA): 초록 몸통, 은빛 + 극, 흰 번개 */
export function Battery({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 44" className="h-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}-cell`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2f9a4c" />
          <stop offset="45%" stopColor="#5fcf72" />
          <stop offset="100%" stopColor="#2f9a4c" />
        </linearGradient>
      </defs>
      <rect x={8} y={1} width={8} height={5} rx={2} fill="#b8bfd6" />
      <rect x={3} y={5} width={18} height={38} rx={5} fill={`url(#${id}-cell)`} />
      <rect x={3} y={5} width={18} height={7} rx={3} fill="#d9deea" />
      <path d="M 13.5 16 L 8.5 26 L 12 26 L 10.5 34 L 15.5 23.5 L 12 23.5 Z" fill="#ffffff" />
    </svg>
  );
}
