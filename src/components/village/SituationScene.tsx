'use client';

// 미션 장소에 도착하면 보여 주는 상황 장면 (움직이는 그림).
// 해결 전: 가로등은 꺼져 길이 깜깜하고 / 종을 쳐도 소리가 안 나고 / 풍차는 꼼짝도 안 한다. 마을 사람들이 곤란해한다.
// 해결 뒤: 같은 장면이 밝아지고 마을 사람들이 기뻐한다 (다시 들렀을 때).
import type { ReactNode } from 'react';
import type { MissionId } from '@/lib/types';
import { SITUATION } from '@/data/strings';
import { SpeechBubble, Villager } from './Characters';

const W = 640;
const H = 300;
const OUTLINE = '#3b2a1a';

export default function SituationScene({ id, fixed }: { id: MissionId; fixed: boolean }) {
  const Scene = id === 'm1' ? StreetScene : id === 'm2' ? BellScene : WindmillScene;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={SITUATION[id].alt}>
      <defs>
        <linearGradient id="sit-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fixed ? '#1e3a8a' : '#0b1033'} />
          <stop offset="100%" stopColor={fixed ? '#6d5bd0' : '#27306b'} />
        </linearGradient>
        <radialGradient id="sit-glow">
          <stop offset="0%" stopColor="#fff7c2" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
        <pattern id="sit-cobble" width={26} height={14} patternUnits="userSpaceOnUse">
          <rect width={26} height={14} fill="#b9a27a" />
          <rect x={1} y={1} width={11} height={5} rx={2} fill="#cbb48a" />
          <rect x={14} y={1} width={11} height={5} rx={2} fill="#c4ad83" />
          <rect x={-5} y={8} width={11} height={5} rx={2} fill="#c4ad83" />
          <rect x={8} y={8} width={11} height={5} rx={2} fill="#cfb98f" />
          <rect x={21} y={8} width={11} height={5} rx={2} fill="#c4ad83" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#sit-sky)" />
      <Stars />
      <path d="M 566 28 A 26 26 0 1 0 592 70 A 20 20 0 1 1 566 28 Z" fill="#fef9c3" />
      <Scene fixed={fixed} />
    </svg>
  );
}

const STAR_POINTS = [
  [40, 30], [120, 60], [210, 22], [300, 48], [380, 18], [460, 70], [620, 110], [30, 110], [250, 90], [500, 30],
];

function Stars() {
  return (
    <g>
      {STAR_POINTS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.3} fill="#fff" className="twinkle"
          style={{ animationDelay: `${(i * 0.37) % 2.4}s` }} />
      ))}
    </g>
  );
}

/** 해결 전 장면을 덮는 밤의 어둠 */
function Night({ children }: { children?: ReactNode }) {
  return (
    <>
      <rect width={W} height={H} fill="#050816" opacity={0.45} />
      {children}
    </>
  );
}

function BackHouses({ lit }: { lit: boolean }) {
  const houses = [
    { x: 40, w: 90, h: 70, roof: '#7f1d1d' },
    { x: 150, w: 70, h: 90, roof: '#1e3a8a' },
    { x: 430, w: 80, h: 75, roof: '#365314' },
    { x: 530, w: 100, h: 60, roof: '#6b21a8' },
  ];
  return (
    <g>
      {houses.map((h) => (
        <g key={h.x}>
          <rect x={h.x} y={200 - h.h} width={h.w} height={h.h} fill="#cdbf9f" stroke={OUTLINE} strokeWidth={2} />
          <polygon points={`${h.x - 8},${200 - h.h} ${h.x + h.w / 2},${170 - h.h} ${h.x + h.w + 8},${200 - h.h}`} fill={h.roof}
            stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />
          <rect x={h.x + h.w / 2 - 9} y={200 - h.h + 18} width={18} height={18} fill={lit ? '#fde68a' : '#334155'} stroke={OUTLINE}
            strokeWidth={1.5} />
        </g>
      ))}
    </g>
  );
}

/** 가로등 거리: 꺼진 가로등, 더듬거리며 걷는 사람, 촛불을 든 할아버지 */
function StreetScene({ fixed }: { fixed: boolean }) {
  const lamps = [130, 320, 510];
  return (
    <g>
      <BackHouses lit={fixed} />
      <rect y={200} width={W} height={100} fill="#4a6b3a" />
      <rect y={225} width={W} height={50} fill="url(#sit-cobble)" stroke="#8a7350" strokeWidth={2} />
      {lamps.map((x, i) => (
        <g key={x}>
          {fixed && (
            <g className="revive-in" style={{ animationDelay: `${i * 0.3}s` }}>
              <ellipse cx={x} cy={250} rx={70} ry={18} fill="#fde68a" opacity={0.45} />
              <circle cx={x} cy={110} r={70} fill="url(#sit-glow)" />
            </g>
          )}
          <rect x={x - 4} y={110} width={8} height={130} fill="#334155" stroke="#1e293b" strokeWidth={1.5} />
          <rect x={x - 14} y={92} width={28} height={22} rx={5} fill={fixed ? '#fffbe0' : '#64748b'} stroke="#1e293b" strokeWidth={2} />
          <rect x={x - 17} y={86} width={34} height={8} rx={3} fill="#1e293b" />
        </g>
      ))}
      {!fixed && (
        <Night>
          {/* 촛불 하나로 버티는 할아버지 */}
          <g transform="translate(560 262) scale(0.9)">
            <circle cx={-26} cy={-60} r={34} fill="url(#sit-glow)" opacity={0.7} />
            <Villager look={{ shirt: '#a3e635', style: 'old' }} mood="worried" flip />
            <rect x={-30} y={-46} width={7} height={16} fill="#fef3c7" stroke={OUTLINE} strokeWidth={1} />
            <path d="M -26.5 -47 q -4 -6 0 -12 q 4 6 0 12 z" fill="#fbbf24" className="candle-flicker" />
          </g>
        </Night>
      )}
      {/* 길을 지나가는 아이: 어두우면 더듬더듬, 밝으면 신나게 */}
      <g className="walk-across">
        <g transform="translate(0 262) scale(0.9)">
          <Villager look={{ shirt: '#60a5fa', child: true }} mood={fixed ? 'happy' : 'worried'} />
          {!fixed && (
            <text x={4} y={-82} fontSize={26} fontWeight={900} fill="#fde68a" stroke={OUTLINE} strokeWidth={3} paintOrder="stroke"
              className="question-pop">?</text>
          )}
        </g>
      </g>
      <SpeechBubble x={560} y={160} text={fixed ? SITUATION.m1.fixedLine : SITUATION.m1.troubleLine} size={17} />
    </g>
  );
}

/** 광장의 안내 종: 종을 아무리 쳐도 소리가 나지 않는다 */
function BellScene({ fixed }: { fixed: boolean }) {
  const cx = 320;
  return (
    <g>
      <BackHouses lit={fixed} />
      <rect y={200} width={W} height={100} fill="url(#sit-cobble)" />
      {/* 종탑 */}
      <rect x={cx - 70} y={70} width={12} height={170} fill="#92400e" stroke={OUTLINE} strokeWidth={2} />
      <rect x={cx + 58} y={70} width={12} height={170} fill="#92400e" stroke={OUTLINE} strokeWidth={2} />
      <polygon points={`${cx - 90},74 ${cx},28 ${cx + 90},74`} fill="#7c2d12" stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={cx - 66} y={72} width={132} height={10} fill="#78350f" stroke={OUTLINE} strokeWidth={2} />
      {/* 소리: 해결 전에는 아주 희미하게 퍼지다 사라지고, 해결 뒤에는 크게 울려 퍼진다 */}
      {fixed
        ? [0, 1, 2].map((i) => (
            <circle key={i} cx={cx} cy={130} r={70 + i * 34} fill="none" stroke="#fbbf24" strokeWidth={6} className="sound-wave"
              style={{ animationDelay: `${i * 0.35}s` }} />
          ))
        : <circle cx={cx} cy={130} r={46} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 6" className="faint-wave" />}
      <g className="bell-swing">
        <rect x={cx - 3} y={82} width={6} height={14} fill="#44403c" />
        <path d={`M ${cx - 36} 168 Q ${cx - 36} 98 ${cx} 94 Q ${cx + 36} 98 ${cx + 36} 168 L ${cx + 44} 178 L ${cx - 44} 178 Z`}
          fill={fixed ? '#fcd34d' : '#ca8a04'} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
        <path d={`M ${cx - 20} 120 Q ${cx - 18} 104 ${cx - 4} 100`} fill="none" stroke="#fef3c7" strokeWidth={4} strokeLinecap="round" />
        <circle cx={cx} cy={182} r={8} fill="#78350f" stroke={OUTLINE} strokeWidth={2} />
      </g>
      {/* 망치로 종을 치는 아저씨 */}
      <g transform="translate(450 268)">
        <Villager look={{ shirt: '#f97316', pants: '#1e3a8a' }} mood={fixed ? 'happy' : 'worried'} flip />
        <g className="hammer-hit">
          <rect x={-56} y={-50} width={44} height={6} rx={3} fill="#92400e" stroke={OUTLINE} strokeWidth={1.5} />
          <rect x={-66} y={-60} width={14} height={26} rx={3} fill="#78716c" stroke={OUTLINE} strokeWidth={1.5} />
        </g>
      </g>
      {/* 귀를 기울이는 사람들 */}
      {[{ x: 120, child: true, shirt: '#f472b6' }, { x: 190, child: false, shirt: '#34d399' }].map((p, i) => (
        <g key={p.x} transform={`translate(${p.x} 272)`}>
          <Villager look={{ shirt: p.shirt, child: p.child, style: i === 1 ? 'long' : 'short', hair: '#3b2a1a' }}
            mood={fixed ? 'happy' : 'worried'} />
          {!fixed && (
            <text x={8} y={-86} fontSize={26} fontWeight={900} fill="#fde68a" stroke={OUTLINE} strokeWidth={3} paintOrder="stroke"
              className="question-pop" style={{ animationDelay: `${i * 0.6}s` }}>?</text>
          )}
        </g>
      ))}
      {!fixed && <Night />}
      <SpeechBubble x={155} y={150} text={fixed ? SITUATION.m2.fixedLine : SITUATION.m2.troubleLine} size={17} />
    </g>
  );
}

/** 언덕의 풍차: 날개가 멈춰 축제 무대에 불을 켤 수 없다 */
function WindmillScene({ fixed }: { fixed: boolean }) {
  const hub = { x: 190, y: 110 };
  return (
    <g>
      <path d={`M 0 220 Q 180 150 360 190 Q 520 220 ${W} 200 L ${W} ${H} L 0 ${H} Z`} fill="#4a6b3a" />
      <path d={`M 0 250 Q 200 210 ${W} 245 L ${W} ${H} L 0 ${H} Z`} fill="#3f5d31" />
      {/* 풍차 몸통 */}
      <polygon points={`${hub.x - 46},${hub.y + 160} ${hub.x + 46},${hub.y + 160} ${hub.x + 26},${hub.y + 8} ${hub.x - 26},${hub.y + 8}`}
        fill="#f5f5f4" stroke="#57534e" strokeWidth={3} />
      <polygon points={`${hub.x - 32},${hub.y + 10} ${hub.x},${hub.y - 22} ${hub.x + 32},${hub.y + 10}`} fill="#9a3412"
        stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={hub.x - 12} y={hub.y + 122} width={24} height={38} rx={10} fill="#78350f" stroke={OUTLINE} strokeWidth={2} />
      <rect x={hub.x - 10} y={hub.y + 50} width={20} height={20} fill={fixed ? '#fde68a' : '#334155'} stroke={OUTLINE} strokeWidth={2} />
      {/* 날개: 해결 전에는 살짝 꿈틀하다 다시 멈춘다 */}
      <g className={fixed ? 'fan fan-fast' : 'fan blade-twitch'}>
        <circle cx={hub.x} cy={hub.y} r={104} fill="none" />
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg} ${hub.x} ${hub.y})`}>
            <rect x={hub.x - 4} y={hub.y - 100} width={8} height={92} fill="#78350f" />
            <rect x={hub.x + 2} y={hub.y - 98} width={24} height={80} fill="#e0f2fe" stroke="#0369a1" strokeWidth={2} />
            <path d={`M ${hub.x + 2} ${hub.y - 78} h 24 M ${hub.x + 2} ${hub.y - 58} h 24 M ${hub.x + 2} ${hub.y - 38} h 24`}
              stroke="#7dd3fc" strokeWidth={1.5} />
          </g>
        ))}
        <circle cx={hub.x} cy={hub.y} r={11} fill="#1e293b" />
      </g>
      {/* 축제 무대: 풍차가 돌아야 불이 켜진다 */}
      <g transform="translate(510 200)">
        <rect x={-80} y={18} width={160} height={30} fill="#92400e" stroke={OUTLINE} strokeWidth={2.5} />
        <rect x={-86} y={10} width={172} height={10} rx={3} fill="#b45309" stroke={OUTLINE} strokeWidth={2} />
        <path d="M -78 -60 Q 0 -30 78 -60" fill="none" stroke="#44403c" strokeWidth={2} />
        {[-60, -30, 0, 30, 60].map((x, i) => {
          const y = -60 + 30 * Math.sin(((x + 78) / 156) * Math.PI) * 0.95;
          return (
            <g key={x}>
              {fixed && <circle cx={x} cy={y + 4} r={16} fill="url(#sit-glow)" />}
              <circle cx={x} cy={y + 4} r={6} fill={fixed ? ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6'][i] : '#57534e'}
                stroke={OUTLINE} strokeWidth={1} />
            </g>
          );
        })}
        <rect x={-74} y={-80} width={10} height={98} fill="#78350f" />
        <rect x={64} y={-80} width={10} height={98} fill="#78350f" />
      </g>
      {/* 풍차 앞의 농부 아저씨 */}
      <g transform="translate(370 262)">
        <Villager look={{ shirt: '#34d399', pants: '#78350f' }} mood={fixed ? 'happy' : 'worried'} flip />
      </g>
      {!fixed && <Night />}
      <SpeechBubble x={370} y={170} text={fixed ? SITUATION.m3.fixedLine : SITUATION.m3.troubleLine} size={17} />
    </g>
  );
}
