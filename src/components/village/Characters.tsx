// 마을 그림 속 인물 (SVG 도형). 탐험대와 빛 요정 반디.
// 모두 (0, 0)이 발밑(반디는 몸 가운데)인 <g>라서, 쓰는 곳에서 translate로 놓으면 된다.
// 팔다리·날개 움직임은 globals.css의 .walker / .fairy 애니메이션.

import type React from 'react';


/** 두 색을 섞는다 (t=0이면 a, 1이면 b) */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${[16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, '0')).join('')}`;
}

/** 그라데이션 이름 (같은 색이면 같은 이름을 다시 써도 내용이 같아 괜찮다) */
const gid = (kind: string, hex: string) => `${kind}-${hex.replace('#', '')}`;

/**
 * 큰 눈 두 개 (몸 꼭대기에 올라앉은 동그란 흰자 + 작은 눈동자). 오른쪽을 본다.
 *  - worried: 눈꺼풀이 처지고, 눈동자는 아래로
 *  - happy: 눈동자가 커지고 반짝, 위를 본다
 */
function Eyes({ mood, lid }: { mood: Mood; lid: string }) {
  const eyes = [{ x: -8, y: -64 }, { x: 13, y: -62 }];
  const look = mood === 'worried' ? { dx: 3, dy: 3 } : mood === 'happy' ? { dx: 3, dy: -2 } : { dx: 4, dy: 1 };
  const r = mood === 'happy' ? 5.2 : 4.4;
  return (
    <g>
      {eyes.map((e, i) => (
        <g key={i}>
          <ellipse cx={e.x + 1} cy={e.y + 4} rx={12} ry={11} fill="#000" opacity={0.08} />
          <ellipse cx={e.x} cy={e.y} rx={12} ry={12.5} fill="url(#eye-white)" />
          <circle cx={e.x + look.dx} cy={e.y + look.dy} r={r} fill="#1b1b22" />
          <circle cx={e.x + look.dx + 1.6} cy={e.y + look.dy - 1.8} r={1.5} fill="#fff" />
          {mood === 'worried' && (
            // 바깥쪽이 처진 눈꺼풀: 흰자 윗부분을 덮는 둥근 덮개
            <path d={`M ${e.x - 12.2} ${e.y + (i ? -5 : 0)} A 12 12.5 0 0 1 ${e.x + 12.2} ${e.y + (i ? 0 : -5)} Z`} fill={lid} />
          )}
        </g>
      ))}
    </g>
  );
}

/** 몸 색 하나로 입체 느낌 그라데이션(밝은 위, 그늘진 아래)과 눈꺼풀 색을 만든다 */
function BlobDefs({ base }: { base: string }) {
  return (
    <defs>
      <radialGradient id={gid('body', base)} cx="38%" cy="30%" r="78%">
        <stop offset="0%" stopColor={mix(base, '#ffffff', 0.75)} />
        <stop offset="55%" stopColor={mix(base, '#ffffff', 0.45)} />
        <stop offset="100%" stopColor={mix(base, '#3b2a1a', 0.12)} />
      </radialGradient>
      <radialGradient id="eye-white" cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="80%" stopColor="#eceaf2" />
        <stop offset="100%" stopColor="#cfcbd9" />
      </radialGradient>
      <radialGradient id="foot-orange" cx="40%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#ffd27a" />
        <stop offset="100%" stopColor="#f0a23a" />
      </radialGradient>
    </defs>
  );
}

/** 몽글몽글 달걀 몸 (발밑이 0, 0): 큰 눈, 짧은 팔, 납작한 주황 발. 두 발은 걸을 때 번갈아 콩콩 */
function Blob({ base, mood = 'calm', children, back, top, mouthY = -40 }: {
  base: string;
  mood?: Mood;
  /** 입 높이 (주둥이가 있으면 그 아래). null이면 입을 그리지 않는다 (부리 등) */
  mouthY?: number | null;
  /** 몸 위에 얹을 장식 */
  children?: React.ReactNode;
  /** 몸 뒤에 그릴 것 (가방 등) */
  back?: React.ReactNode;
  /** 눈 위에 얹을 것 (모자 등) */
  top?: React.ReactNode;
}) {
  const body = `url(#${gid('body', base)})`;
  const lid = mix(base, '#ffffff', 0.3);
  const up = mood === 'happy';
  return (
    <g>
      <BlobDefs base={base} />
      <ellipse cx={1} cy={1} rx={28} ry={6} fill="#000" opacity={0.18} />
      <ellipse className="foot foot-b" cx={11} cy={-3} rx={11} ry={5.5} fill="url(#foot-orange)" />
      <g className="blob-body">
        {back}
        {/* 짧은 팔 (기뻐하면 위로) */}
        <ellipse cx={-30} cy={up ? -48 : -30} rx={5.5} ry={10} fill={body} transform={`rotate(${up ? 35 : 15} -30 ${up ? -48 : -30})`} />
        <ellipse cx={30} cy={up ? -48 : -30} rx={5.5} ry={10} fill={body} transform={`rotate(${up ? -35 : -15} 30 ${up ? -48 : -30})`} />
        {/* 아래가 통통한 달걀 */}
        <path d="M 0 -70 C 22 -70 32 -50 32 -30 C 32 -10 20 -4 0 -4 C -20 -4 -32 -10 -32 -30 C -32 -50 -22 -70 0 -70 Z" fill={body} />
        <ellipse cx={6} cy={-24} rx={6} ry={3.5} fill="#ff9fb4" opacity={0.25} />
        {children}
        <Eyes mood={mood} lid={lid} />
        {top}
        {mood === 'happy' && mouthY !== null && (
          <path d={`M 6 ${mouthY} q 4 5 8 0`} fill="none" stroke="#5b4a46" strokeWidth={2} strokeLinecap="round" />
        )}
        {mood === 'worried' && (
          <>
            {mouthY !== null && (
              <path d={`M 5 ${mouthY + 2} q 2.5 -2.5 5 0 q 2.5 2.5 5 0`} fill="none" stroke="#5b4a46" strokeWidth={1.8} strokeLinecap="round" />
            )}
            <path d="M 30 -58 q 4 6 0 8 q -4 -2 0 -8 z" fill="#bfe6ff" />
          </>
        )}
      </g>
      <ellipse className="foot foot-a" cx={-9} cy={-3} rx={11} ry={5.5} fill="url(#foot-orange)" />
    </g>
  );
}

/** 마을에 사는 동물들 */
export type Animal = 'puppy' | 'bunny' | 'bear' | 'cat' | 'chick' | 'pig' | 'frog' | 'fox';

const NOSE = '#4a3b3b';

/** 동물마다: 몸 색, 몸 뒤(귀·꼬리), 몸 앞(주둥이·부리·수염), 입 높이 */
function animalParts(animal: Animal): { base: string; back: React.ReactNode; front: React.ReactNode; mouthY: number | null } {
  switch (animal) {
    case 'puppy': {
      const ear = '#c98f5a';
      return {
        base: '#f3cf9b',
        back: <path d="M -30 -20 q -12 -6 -8 -18" fill="none" stroke="#e8b97f" strokeWidth={6} strokeLinecap="round" />,
        front: (
          <>
            <ellipse cx={-27} cy={-50} rx={8} ry={16} fill={ear} transform="rotate(18 -27 -50)" />
            <ellipse cx={28} cy={-50} rx={8} ry={16} fill={ear} transform="rotate(-18 28 -50)" />
            <ellipse cx={12} cy={-38} rx={10} ry={7} fill="#fff3e0" />
            <ellipse cx={18} cy={-41} rx={3.6} ry={2.7} fill={NOSE} />
          </>
        ),
        mouthY: -31,
      };
    }
    case 'bunny':
      return {
        base: '#f4d3e3',
        back: (
          <>
            {[{ x: -11, r: -12 }, { x: 10, r: 12 }].map((e) => (
              <g key={e.x} transform={`rotate(${e.r} ${e.x} -70)`}>
                <ellipse cx={e.x} cy={-88} rx={7.5} ry={21} fill="#f7e2ec" />
                <ellipse cx={e.x} cy={-86} rx={3.5} ry={14} fill="#ffb3cc" />
              </g>
            ))}
            <circle cx={-33} cy={-15} r={7} fill="#ffffff" />
          </>
        ),
        front: <path d="M 12 -43 l 6 0 l -3 3.5 z" fill="#ff8fab" />,
        mouthY: -36,
      };
    case 'bear':
      return {
        base: '#c9a07c',
        back: (
          <>
            <circle cx={-21} cy={-64} r={10} fill="#d6b18f" />
            <circle cx={-21} cy={-64} r={5} fill="#ecd0b4" />
            <circle cx={21} cy={-66} r={10} fill="#d6b18f" />
            <circle cx={21} cy={-66} r={5} fill="#ecd0b4" />
          </>
        ),
        front: (
          <>
            <ellipse cx={12} cy={-38} rx={10} ry={7} fill="#efd9bf" />
            <ellipse cx={18} cy={-41} rx={3.6} ry={2.7} fill={NOSE} />
          </>
        ),
        mouthY: -31,
      };
    case 'cat':
      return {
        base: '#c3c6d8',
        back: (
          <>
            <path d="M -26 -54 L -22 -82 L -6 -66 Z" fill="#d6d8e6" />
            <path d="M -22 -60 L -20 -74 L -12 -66 Z" fill="#ffc2d4" />
            <path d="M 6 -68 L 22 -84 L 26 -56 Z" fill="#d6d8e6" />
            <path d="M 12 -68 L 21 -76 L 22 -62 Z" fill="#ffc2d4" />
            <path d="M -30 -14 q -18 -4 -14 -26 q 2 -8 8 -6" fill="none" stroke="#b5b8cc" strokeWidth={6} strokeLinecap="round" />
          </>
        ),
        front: (
          <>
            <path d="M 12 -43 l 6 0 l -3 3.5 z" fill="#ff8fab" />
            <path d="M 22 -42 l 12 -3 M 22 -39 l 12 1 M 4 -42 l -10 -3 M 4 -39 l -10 1" stroke="#8f93a8" strokeWidth={1.2} strokeLinecap="round" />
          </>
        ),
        mouthY: -36,
      };
    case 'chick':
      return {
        base: '#ffe27a',
        back: <path d="M -2 -68 q -4 -12 2 -16 q 0 8 3 12 q 2 -10 8 -12 q -3 8 -5 16 z" fill="#ffd34d" />,
        front: <path d="M 9 -45 L 24 -40 L 9 -35 Z" fill="#ffa53d" />,
        mouthY: null,
      };
    case 'pig':
      return {
        base: '#ffc6d3',
        back: (
          <>
            <path d="M -26 -58 L -24 -76 L -10 -66 Z" fill="#ffb0c3" />
            <path d="M 10 -68 L 24 -78 L 26 -60 Z" fill="#ffb0c3" />
            <path d="M -31 -20 q -10 0 -8 -7 q 3 -5 6 0 q 2 6 -6 8" fill="none" stroke="#ff9fb4" strokeWidth={2.5} strokeLinecap="round" />
          </>
        ),
        front: (
          <>
            <ellipse cx={14} cy={-39} rx={9} ry={6.5} fill="#ff9fb4" />
            <ellipse cx={11} cy={-39} rx={1.6} ry={2.4} fill="#c2607a" />
            <ellipse cx={17} cy={-39} rx={1.6} ry={2.4} fill="#c2607a" />
          </>
        ),
        mouthY: -30,
      };
    case 'frog':
      return {
        base: '#a6dc8e',
        back: null,
        front: <ellipse cx={2} cy={-22} rx={19} ry={12} fill="#e2f5d6" opacity={0.85} />,
        mouthY: -40,
      };
    case 'fox':
      return {
        base: '#f6a96b',
        back: (
          <>
            <path d="M -28 -52 L -22 -84 L -6 -64 Z" fill="#f8b884" />
            <path d="M -26 -72 L -22 -84 L -16 -76 Z" fill="#5b4038" />
            <path d="M 6 -66 L 24 -86 L 28 -54 Z" fill="#f8b884" />
            <path d="M 18 -80 L 24 -86 L 25 -76 Z" fill="#5b4038" />
            <ellipse cx={-40} cy={-26} rx={10} ry={20} fill="#f8b884" transform="rotate(-35 -40 -26)" />
            <ellipse cx={-48} cy={-40} rx={6} ry={8} fill="#fff5ea" transform="rotate(-35 -48 -40)" />
          </>
        ),
        front: (
          <>
            <ellipse cx={12} cy={-35} rx={14} ry={9} fill="#fff5ea" />
            <ellipse cx={22} cy={-40} rx={3.4} ry={2.6} fill={NOSE} />
          </>
        ),
        mouthY: -29,
      };
  }
}

/** 동그란 안경 (할아버지·할머니) */
function Glasses() {
  return (
    <g fill="none" stroke="#8a6f4e" strokeWidth={1.8}>
      <circle cx={-8} cy={-64} r={13.5} />
      <circle cx={13} cy={-62} r={13.5} />
      <path d="M 5.5 -64 q 0 -3 -0.5 -1" />
    </g>
  );
}

/** 탐험대 헬멧: 앞쪽에 불이 켜진 머리 전등 (불빛 탐험대 표시). 앞으로 빛이 뻗는다 */
function LampHelmet() {
  return (
    <g>
      <path d="M 22 -86 L 70 -104 L 70 -66 Z" fill="#fff3a8" opacity={0.28} />
      <path d="M -21 -73 Q -19 -97 2 -97 Q 23 -97 25 -73 Z" fill="#ffd45e" />
      <path d="M -12 -90 Q -4 -95 6 -94" fill="none" stroke="#fff6cc" strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={2} cy={-73} rx={27} ry={4.5} fill="#f2b632" />
      <circle cx={18} cy={-86} r={11} fill="#fff7c2" opacity={0.55} />
      <circle cx={18} cy={-86} r={5.5} fill="#fffde8" stroke="#e0a526" strokeWidth={1.5} />
    </g>
  );
}

/**
 * 탐험대(나): 머리 전등 헬멧을 쓰고, 민트색 목도리와 가방을 멘 강아지. 오른쪽을 본다 (왼쪽은 바깥에서 scale(-1 1)).
 * 마을 동물들과 크기는 같고, 헬멧의 불빛으로 한눈에 구별된다.
 */
export function Explorer({ walking = false }: { walking?: boolean }) {
  const dog = animalParts('puppy');
  return (
    <g className={walking ? 'walker walking' : 'walker'}>
      <Blob base={dog.base} mouthY={dog.mouthY} top={<LampHelmet />}
        back={<>{dog.back}<rect x={-40} y={-46} width={15} height={24} rx={7} fill="#e9a86a" /></>}>
        {/* 목도리: 탐험대 표시 */}
        <path d="M -30 -30 Q 0 -22 30 -30 L 30 -23 Q 0 -15 -30 -23 Z" fill="#7fd8b4" />
        <path d="M -24 -25 l -6 14 l 8 -2 l 2 -11 z" fill="#5cc49b" />
        {dog.front}
      </Blob>
    </g>
  );
}

/**
 * 빛 요정 반디: 꼬리 불빛이 반짝이는 작은 반딧불이. 큰 눈, 별 더듬이, 팔랑이는 투명 날개.
 * (0, 0)이 몸 가운데, 오른쪽을 본다
 */
export function Fairy({ glowId = 'fairy-glow' }: { glowId?: string }) {
  const headId = `${glowId}-head`;
  const tailId = `${glowId}-tail`;
  const eyeId = `${glowId}-eye`;
  return (
    <g className="fairy">
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="#fff7c2" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={headId} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#f3efff" />
          <stop offset="60%" stopColor="#c9bff0" />
          <stop offset="100%" stopColor="#9d92d1" />
        </radialGradient>
        <radialGradient id={tailId} cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fffff0" />
          <stop offset="55%" stopColor="#fff07a" />
          <stop offset="100%" stopColor="#f6c935" />
        </radialGradient>
        <radialGradient id={eyeId} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dcd8e6" />
        </radialGradient>
      </defs>
      {/* 꼬리 불빛 (반딧불이) */}
      <circle cx={-10} cy={7} r={22} fill={`url(#${glowId})`} className="twinkle" style={{ animationDuration: '1.8s' }} />
      {/* 날개 */}
      <g className="wing wing-l">
        <ellipse cx={-6} cy={-14} rx={9} ry={13} fill="#e6f6ff" fillOpacity={0.75} stroke="#b9dcf2" strokeWidth={0.8}
          transform="rotate(-35 -6 -14)" />
      </g>
      <g className="wing wing-r">
        <ellipse cx={4} cy={-15} rx={8} ry={12} fill="#efe6ff" fillOpacity={0.75} stroke="#cdbdf0" strokeWidth={0.8}
          transform="rotate(25 4 -15)" />
      </g>
      {/* 빛나는 꼬리 */}
      <ellipse cx={-10} cy={7} rx={8.5} ry={7.5} fill={`url(#${tailId})`} transform="rotate(-25 -10 7)" />
      {/* 몸통 */}
      <ellipse cx={-1} cy={2} rx={6.5} ry={6} fill="#b3a8e6" />
      {/* 작은 발 */}
      <path d="M -3 7 l -1 4 M 1 7 l 0 4 M 4 6 l 1.5 3.5" stroke="#8f84c4" strokeWidth={1.4} strokeLinecap="round" />
      {/* 더듬이 */}
      <path d="M 5 -12 q 0 -8 -4 -11 M 10 -11 q 3 -7 8 -8" fill="none" stroke="#8f84c4" strokeWidth={1.3} strokeLinecap="round" />
      <circle cx={1} cy={-23} r={2.3} fill="#ffe14d" />
      <circle cx={18} cy={-19} r={2.3} fill="#ffe14d" />
      {/* 머리 */}
      <circle cx={7} cy={-4} r={10} fill={`url(#${headId})`} />
      {[3.5, 11.5].map((x) => (
        <g key={x}>
          <circle cx={x} cy={-6} r={4.2} fill={`url(#${eyeId})`} />
          <circle cx={x + 1} cy={-5.6} r={1.8} fill="#1b1b22" />
          <circle cx={x + 1.6} cy={-6.4} r={0.6} fill="#fff" />
        </g>
      ))}
      <ellipse cx={1.5} cy={1} rx={2.2} ry={1.4} fill="#ffb4c6" opacity={0.85} />
      <ellipse cx={14} cy={1} rx={2.2} ry={1.4} fill="#ffb4c6" opacity={0.85} />
      <path d="M 6.5 0.5 q 1.5 1.8 3 0" fill="none" stroke="#5b4a46" strokeWidth={1} strokeLinecap="round" />
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
  animal: Animal;
  /** 할아버지·할머니: 동그란 안경 */
  old?: boolean;
  /** 아이는 조금 작게 */
  child?: boolean;
}

/**
 * 마을 사람: 여러 동물 (토끼, 곰, 고양이, 병아리, 돼지, 개구리, 여우). 탐험대와 같은 몽글몽글 몸. (0, 0)이 발밑, 오른쪽을 본다.
 *  - worried: 처진 눈꺼풀, 물결 입, 땀방울. 몸을 조금씩 흔든다
 *  - happy: 반짝이는 눈, 웃는 입, 두 팔을 들고 콩콩 뛴다
 */
export function Villager({ look, mood = 'calm', bubble, flip = false, walking = false }: {
  look: VillagerLook;
  /** 걷는 중: 발을 번갈아 콩콩, 몸은 뒤뚱 (탐험대와 같은 움직임) */
  walking?: boolean;
  mood?: Mood;
  /** 머리 위 말풍선 */
  bubble?: string;
  /** 왼쪽을 본다 (말풍선 글자는 뒤집지 않는다) */
  flip?: boolean;
}) {
  const { animal, old = false, child = false } = look;
  const k = child ? 0.78 : 1;
  const happy = mood === 'happy';
  const parts = animalParts(animal);
  return (
    <g>
      <g transform={`scale(${flip ? -k : k} ${k})`} className={walking ? 'walker walking' : undefined}>
        <g className={happy ? 'villager-cheer' : mood === 'worried' ? 'villager-sway' : 'villager-idle'}>
          <Blob base={parts.base} mood={mood} back={parts.back} mouthY={parts.mouthY}>
            {parts.front}
            {old && <Glasses />}
          </Blob>
        </g>
      </g>
      {bubble && <SpeechBubble text={bubble} y={-(animal === 'bunny' ? 112 : 96) * k} size={16} />}
    </g>
  );
}

/** 말풍선 모양: 아래쪽 가운데에 꼬리가 달린 둥근 네모. 꼬리 끝이 (0, 8) */
function bubblePath(w: number, h: number): string {
  const r = h / 2.4;
  const x0 = -w / 2;
  const x1 = w / 2;
  const tail = Math.min(7, w / 2 - r);
  return [
    `M ${x0 + r} ${-h}`,
    `H ${x1 - r}`,
    `A ${r} ${r} 0 0 1 ${x1} ${-h + r}`,
    `V ${-r}`,
    `A ${r} ${r} 0 0 1 ${x1 - r} 0`,
    `H ${tail}`,
    `Q 2 0 0 8`,
    `Q -2 0 ${-tail} 0`,
    `H ${x0 + r}`,
    `A ${r} ${r} 0 0 1 ${x0} ${-r}`,
    `V ${-h + r}`,
    `A ${r} ${r} 0 0 1 ${x0 + r} ${-h}`,
    'Z',
  ].join(' ');
}

/** 사람 머리 위 말풍선 (짧은 말 한마디). (x, y)가 꼬리 끝 */
export function SpeechBubble({ text, y, x = 0, size = 14 }: { text: string; y: number; x?: number; size?: number }) {
  const w = Math.max(size * 2, text.length * size * 0.95 + size * 1.2);
  const h = size * 1.8;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="bubble-pop">
        {/* 둥근 네모와 꼬리를 한 선으로 이어 그린다 (이음매가 보이지 않게) */}
        <path d={bubblePath(w, h)} fill="#fff" stroke="#8f86a3" strokeWidth={1.8} strokeLinejoin="round" />
        <text x={0} y={-h / 2 + size * 0.36} textAnchor="middle" fontSize={size} fontWeight={800} fill="#1f1a17">{text}</text>
      </g>
    </g>
  );
}
