'use client';

// S2 도입 컷마다의 장면 (명세서 14장 A4 도입 컷 그림의 임시 애니메이션).
//  컷 1: 축제 날 저녁, 해가 지며 마을이 어두워진다
//  컷 2: 반디가 날아오고, 고장 난 세 곳을 차례로 비춘다
//  컷 3: 불이 켜지는 회로 (끊기지 않고 이어진 고리)
//  컷 4: 전지가 1개·2개 들어가는 제품들
//  컷 5: 마을 입구에서 가로등으로 가는 길 안내
import { PLACES, SPAWN, WORLD } from '@/data/world';
import { angleTo } from '@/lib/world/movement';
import { CompassArrow, DownArrow, Explorer, Fairy } from './Characters';
import VillageScene from './VillageScene';

const ALL_DIM = { m1: 'dim', m2: 'dim', m3: 'dim' } as const;
const TROUBLE = ['m1', 'm2', 'm3'] as const;

export default function IntroScene({ cut }: { cut: number }) {
  if (cut === 2) return <CircuitCut />;
  if (cut === 3) return <ProductsCut />;

  return (
    <div className="relative overflow-hidden rounded-3xl" aria-hidden>
      <VillageScene
        key={cut} // 컷이 바뀌면 애니메이션을 처음부터
        looks={ALL_DIM}
        darkness={0.6}
        nightfall={cut === 0}
        highlight={cut === 1 ? TROUBLE : undefined}
      />
      <svg viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} className="pointer-events-none absolute inset-0 h-full w-full">
        {cut === 1 && (
          <g transform={`translate(${PLACES.m2.x + 190} ${PLACES.m2.y - 80})`}>
            <g className="fly-in">
              <g transform="scale(2.4)" className="bob" style={{ animationDuration: '1.6s' }}>
                <Fairy />
              </g>
            </g>
          </g>
        )}
        {cut === 4 && (
          <>
            <DownArrow x={PLACES.m1.x} y={PLACES.m1.y - 130} />
            <g transform={`translate(${SPAWN.x} ${SPAWN.y})`}>
              <g transform="translate(-46 -74)">
                <g className="bob" style={{ animationDuration: '1.6s' }}><Fairy /></g>
              </g>
              <Explorer />
              <CompassArrow angle={angleTo(SPAWN, PLACES.m1)} />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

/** 컷 3: 전지, 전구, 스위치가 끊기지 않고 이어진 고리. 전기가 흐르는 길을 따라 점이 움직이고 전구가 켜진다 */
function CircuitCut() {
  const loop = 'M 120 150 L 120 60 L 380 60 L 380 150 Z';
  return (
    <div className="flex h-40 items-center justify-center rounded-3xl bg-indigo-950" aria-hidden>
      <svg viewBox="0 0 500 200" className="h-full">
        <path d={loop} fill="none" stroke="#60a5fa" strokeWidth={6} />
        <path d={loop} fill="none" stroke="#fde047" strokeWidth={6} strokeDasharray="6 26" className="dash-flow" />
        <rect x={180} y={132} width={140} height={36} rx={8} fill="#f59e0b" />
        <text x={250} y={157} textAnchor="middle" fontSize={20} fontWeight={800} fill="#1e293b">전지</text>
        <text x={162} y={158} textAnchor="middle" fontSize={22} fontWeight={900} fill="#fff">−</text>
        <text x={338} y={158} textAnchor="middle" fontSize={22} fontWeight={900} fill="#fff">+</text>
        <circle cx={250} cy={60} r={40} fill="url(#introGlow)" className="revive-in" style={{ animationDelay: '0.8s' }} />
        <circle cx={250} cy={60} r={20} fill="#fde68a" stroke="#94a3b8" strokeWidth={3} />
        <defs>
          <radialGradient id="introGlow">
            <stop offset="0%" stopColor="#fff7c2" />
            <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

/** 컷 4: 전지가 1개 또는 2개 들어가는 제품 */
function ProductsCut() {
  const items = [
    { art: '🌀', label: '손 선풍기', batteries: '🔋' },
    { art: '🌀', label: '손 선풍기', batteries: '🔋🔋' },
    { art: '🔦', label: '손전등', batteries: '🔋🔋' },
    { art: '📺', label: '리모컨', batteries: '🔋🔋' },
  ];
  return (
    <div className="flex h-36 items-center justify-center gap-8 rounded-3xl bg-indigo-950 px-4 text-white" aria-hidden>
      {items.map((it, i) => (
        <div key={i} className="light-up" style={{ animationDelay: `${i * 0.3}s` }}>
          <div className="flex flex-col items-center gap-1">
          {/* 컷 4는 예상 문항이라 정답을 알려 주면 안 된다: 두 손 선풍기를 똑같이 그린다 (돌리지 않음) */}
          <span className="text-5xl">{it.art}</span>
          <span className="text-sm">{it.label}</span>
          <span className="text-2xl">{it.batteries}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
