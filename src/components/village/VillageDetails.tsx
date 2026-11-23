// 반짝마을의 자세한 그림 (가까이 보기용). 지도 보기에서는 단순하게, 가까이 걸을 때는 마을이 살아 있게 보이도록
// 돌길, 풀과 꽃, 연못, 울타리, 꺼진 길가 등, 문제를 말해 주는 마을 사람들을 더 그린다.
// 위치는 모두 data/world.ts의 지도 좌표(1200 x 700). 무작위처럼 보이는 것도 늘 같은 자리에 그려지도록 고정된 씨앗을 쓴다.
import { MISSION_ORDER } from '@/data/missions';
import { PLACES, ROAD, type Vec, WORLD } from '@/data/world';
import type { MissionId } from '@/lib/types';
import { type Mood, Villager, type VillagerLook } from './Characters';
import { CuteBush, CuteFence, CuteHouse, CuteLamp, CuteTree, type RoofColor } from './Props';
import { NEAR_PROP, type PlaceLook } from './VillageScene';

/** 길 (본길 + 가로등·풍차로 가는 갈림길) */
export const ROAD_PATH = ROAD.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
export const BRANCHES = [
  `M ${ROAD[2].x} ${ROAD[2].y} L ${PLACES.m1.x} ${PLACES.m1.y + 20}`,
  `M ${ROAD[7].x} ${ROAD[7].y} L ${PLACES.m3.x} ${PLACES.m3.y + 40}`,
];
const ROAD_SEGMENTS: [Vec, Vec][] = [
  ...ROAD.slice(1).map((p, i): [Vec, Vec] => [ROAD[i], p]),
  [ROAD[2], { x: PLACES.m1.x, y: PLACES.m1.y + 20 }],
  [ROAD[7], { x: PLACES.m3.x, y: PLACES.m3.y + 40 }],
];

function distToSegment(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
const distToRoad = (p: Vec) => Math.min(...ROAD_SEGMENTS.map(([a, b]) => distToSegment(p, a, b)));
const inPlaza = (p: Vec) => ((p.x - PLACES.m2.x) / 150) ** 2 + ((p.y - PLACES.m2.y - 25) / 95) ** 2 < 1;
const nearPlace = (p: Vec, r: number) => MISSION_ORDER.some((id) => Math.hypot(p.x - PLACES[id].x, p.y - PLACES[id].y) < r);

/** 늘 같은 순서로 나오는 수 (그림이 새로고침마다 바뀌지 않게) */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 집 (x, y는 집 가운데). 그림은 Props의 CuteHouse */
export function House({ x, y, roof, lit, size = 1 }: Vec & { roof: RoofColor; lit: boolean; size?: number }) {
  return (
    <g transform={`translate(${x} ${y + 24 * size}) scale(${size})`}>
      <CuteHouse roof={roof} lit={lit} />
    </g>
  );
}

/** 나무 (x, y는 잎 가운데쯤) */
export function Tree({ x, y, size = 1 }: Vec & { size?: number }) {
  return (
    <g transform={`translate(${x} ${y + 30 * size}) scale(${size})`}>
      <CuteTree />
    </g>
  );
}

/** 가까이 보기에서 더 그리는 집과 나무 */
const EXTRA_HOUSES: readonly (Vec & { roof: RoofColor })[] = [
  { x: 70, y: 450, roof: 'mint' },
  { x: 380, y: 620, roof: 'rose' },
  { x: 640, y: 620, roof: 'lilac' },
  { x: 700, y: 480, roof: 'peach' },
  { x: 1000, y: 420, roof: 'rose' },
  { x: 1140, y: 440, roof: 'mint' },
  { x: 600, y: 140, roof: 'sky' },
  { x: 330, y: 160, roof: 'lilac' },
  { x: 80, y: 290, roof: 'sky' },
  { x: 450, y: 525, roof: 'mint' },
];
const EXTRA_TREES: readonly Vec[] = [
  { x: 520, y: 620 }, { x: 250, y: 330 }, { x: 140, y: 470 }, { x: 830, y: 420 }, { x: 1080, y: 360 },
  { x: 680, y: 160 }, { x: 400, y: 260 }, { x: 40, y: 160 }, { x: 1170, y: 520 }, { x: 560, y: 360 },
];

const TUFTS: readonly Vec[] = (() => {
  const r = seeded(7);
  const out: Vec[] = [];
  while (out.length < 420) {
    const p = { x: 20 + r() * (WORLD.width - 40), y: 20 + r() * (WORLD.height - 40) };
    if (distToRoad(p) > 26 && !inPlaza(p)) out.push(p);
  }
  return out;
})();

/** 풀밭의 작은 돌멩이 */
const PEBBLES: readonly (Vec & { r: number })[] = (() => {
  const r = seeded(53);
  const out: (Vec & { r: number })[] = [];
  while (out.length < 120) {
    const p = { x: 20 + r() * (WORLD.width - 40), y: 20 + r() * (WORLD.height - 40), r: 1.5 + r() * 2 };
    if (distToRoad(p) > 26 && !inPlaza(p)) out.push(p);
  }
  return out;
})();

const FLOWER_COLORS = ['#f472b6', '#fde047', '#f8fafc', '#c084fc', '#fb7185'];
const FLOWERS: readonly (Vec & { c: string })[] = (() => {
  const r = seeded(31);
  const out: (Vec & { c: string })[] = [];
  while (out.length < 60 * 5) {
    const center = { x: 40 + r() * (WORLD.width - 80), y: 60 + r() * (WORLD.height - 100) };
    if (distToRoad(center) < 45 || inPlaza(center) || nearPlace(center, 90)) continue;
    const c = FLOWER_COLORS[out.length % FLOWER_COLORS.length];
    for (let i = 0; i < 5; i++) out.push({ x: center.x + (r() - 0.5) * 22, y: center.y + (r() - 0.5) * 12, c });
  }
  return out;
})();

/** 길가 등 (가로등 미션을 해결하면 함께 켜진다). 본길을 따라 일정한 간격으로, 양쪽을 번갈아 */
const ROAD_LAMPS: readonly Vec[] = (() => {
  const out: Vec[] = [];
  let carry = 60;
  let side = 1;
  ROAD.slice(1).forEach((b, i) => {
    const a = ROAD[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    for (let d = carry; d < len; d += 120) {
      const p = { x: a.x + ux * d - uy * 34 * side, y: a.y + uy * d + ux * 34 * side };
      side = -side;
      if (!nearPlace(p, 120) && !inPlaza(p)) out.push(p);
      carry = d + 120 - len;
    }
  });
  return out;
})();

const BUSHES: readonly Vec[] = [
  { x: 230, y: 380 }, { x: 120, y: 220 }, { x: 500, y: 215 }, { x: 600, y: 545 }, { x: 860, y: 480 },
  { x: 1050, y: 590 }, { x: 980, y: 445 }, { x: 420, y: 640 }, { x: 760, y: 200 },
];

/** 무늬 (돌길, 풀밭) */
export function DetailDefs() {
  return (
    <>
      <pattern id="cobble" width={22} height={14} patternUnits="userSpaceOnUse">
        <rect width={22} height={14} fill="#e3cfa6" />
        <rect x={1} y={1} width={9} height={5} rx={2} fill="#f4e6c7" />
        <rect x={12} y={1} width={9} height={5} rx={2} fill="#eddcb9" />
        <rect x={-4} y={8} width={9} height={5} rx={2} fill="#eddcb9" />
        <rect x={7} y={8} width={9} height={5} rx={2} fill="#f6eacf" />
        <rect x={18} y={8} width={9} height={5} rx={2} fill="#eddcb9" />
      </pattern>
      <pattern id="plaza-tiles" width={26} height={26} patternUnits="userSpaceOnUse">
        <rect width={26} height={26} fill="#e7dcc0" />
        <rect x={1} y={1} width={24} height={24} rx={3} fill="#f6eedb" stroke="#e3d5b4" strokeWidth={1} />
      </pattern>
    </>
  );
}

/** 땅 위의 작은 것들 (길보다 먼저 그린다) */
export function GroundDetails() {
  return (
    <g pointerEvents="none">
      {/* 풀 포기 */}
      {TUFTS.map((t, i) => (
        <path key={i} d={`M ${t.x - 2} ${t.y} l 1 -3.5 l 1 3.5 l 1 -4.5 l 1 4.5 l 1 -3 l 0.5 3`} fill="none" stroke="#6aa85a"
          strokeWidth={0.9} strokeLinejoin="round" />
      ))}
      {PEBBLES.map((p, i) => (
        <g key={`p${i}`}>
          <ellipse cx={p.x} cy={p.y} rx={p.r * 1.3} ry={p.r} fill="#c9cfc0" />
          <ellipse cx={p.x - p.r * 0.3} cy={p.y - p.r * 0.3} rx={p.r * 0.5} ry={p.r * 0.35} fill="#ffffff" opacity={0.5} />
        </g>
      ))}
      {/* 연못 */}
      <g>
        <ellipse cx={905} cy={612} rx={78} ry={36} fill="#c9b08a" />
        <ellipse cx={905} cy={608} rx={72} ry={31} fill="#8cc6e3" />
        <ellipse cx={890} cy={600} rx={40} ry={10} fill="#c4e6f5" opacity={0.6} />
        {[{ x: 940, y: 615 }, { x: 870, y: 622 }, { x: 925, y: 596 }].map((p, i) => (
          <path key={i} d={`M ${p.x} ${p.y} m -9 0 a 9 5 0 1 0 18 0 l -9 0 z`} fill="#4d8b3f" stroke="#2f5d27" strokeWidth={1} />
        ))}
        {[836, 846, 975].map((x) => (
          <path key={x} d={`M ${x} 612 q -2 -18 2 -26 M ${x + 4} 614 q 1 -14 5 -20`} stroke="#3f6b35" strokeWidth={2} fill="none" />
        ))}
      </g>
      {/* 덤불 */}
      {BUSHES.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y + 11}) scale(${NEAR_PROP})`}>
          <CuteBush />
        </g>
      ))}
      {/* 꽃 */}
      {FLOWERS.map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={f.y} r={2} fill={f.c} />
          <circle cx={f.x} cy={f.y} r={0.8} fill="#f59e0b" />
        </g>
      ))}
    </g>
  );
}

/** 돌길 (본길 위에 돌 무늬, 가장자리 돌) */
export function RoadDetails() {
  return (
    <g pointerEvents="none">
      <path d={ROAD_PATH} stroke="url(#cobble)" strokeWidth={38} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {BRANCHES.map((d) => (
        <path key={d} d={d} stroke="url(#cobble)" strokeWidth={26} strokeLinecap="round" />
      ))}
      <ellipse cx={PLACES.m2.x} cy={PLACES.m2.y + 25} rx={122} ry={70} fill="url(#plaza-tiles)" />
    </g>
  );
}

/** 집·나무·울타리·길가 등 (가까이 보기) */
export function TownDetails({ litHouses, lampsOn }: { litHouses: number; lampsOn: boolean }) {
  return (
    <g pointerEvents="none">
      {EXTRA_TREES.map((t, i) => <Tree key={i} {...t} size={NEAR_PROP} />)}
      {EXTRA_HOUSES.map((h, i) => (
        <g key={i}>
          <House {...h} lit={i < litHouses * 2} size={NEAR_PROP} />
          <g transform={`translate(${h.x - 30} ${h.y + 26}) scale(${NEAR_PROP})`}><CuteFence width={30} /></g>
          <g transform={`translate(${h.x + 12} ${h.y + 26}) scale(${NEAR_PROP})`}><CuteFence width={30} /></g>
        </g>
      ))}
      {ROAD_LAMPS.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) scale(${NEAR_PROP})`}>
          <CuteLamp on={lampsOn} h={34} />
        </g>
      ))}
    </g>
  );
}

/** 장소마다 문제를 말해 주는 마을 사람 (해결하면 기뻐한다). 크기는 가까이 보기의 탐험대와 같다 (VillageWorld의 NEAR.scale) */
const PEOPLE: Record<MissionId, readonly (Vec & { look: VillagerLook; flip?: boolean; lines: [string, string] })[]> = {
  m1: [
    { x: 282, y: 520, look: { animal: 'chick', child: true }, lines: ['깜깜해요!', '환해졌다!'] },
    { x: 410, y: 500, look: { animal: 'bear', old: true }, flip: true, lines: ['길이 안 보여요', '이제 잘 보여요'] },
  ],
  m2: [
    { x: 730, y: 372, look: { animal: 'bunny' }, flip: true, lines: ['종이 안 울려요', '종소리다!'] },
    { x: 585, y: 392, look: { animal: 'cat', child: true }, lines: ['축제 언제 해요?', '축제가 시작돼요!'] },
  ],
  m3: [
    { x: 945, y: 268, look: { animal: 'pig' }, lines: ['풍차가 멈췄어요', '잘 돌아요!'] },
  ],
};

export function PlaceVillagers({ looks }: { looks: Record<MissionId, PlaceLook> }) {
  return (
    <g pointerEvents="none" aria-hidden>
      {MISSION_ORDER.flatMap((id) =>
        PEOPLE[id].map((p, i) => {
          const fixed = looks[id] === 'on';
          const mood: Mood = fixed ? 'happy' : 'worried';
          return (
            <g key={`${id}-${i}`} transform={`translate(${p.x} ${p.y}) scale(0.22)`}>
              <Villager look={p.look} mood={mood} flip={p.flip} bubble={p.lines[fixed ? 1 : 0]} />
            </g>
          );
        }),
      )}
    </g>
  );
}
