'use client';

// 반짝마을 그림 (명세서 14장 A1 마을 배경, A2 장소 아이콘의 임시 그림). 도입(S2)과 마을 지도(S3)에서 같이 쓴다.
// 그림 파일이 생기면 이 컴포넌트 안의 도형만 <image>로 바꾸면 된다. 좌표는 data/world.ts.
import { memo, type PointerEvent as ReactPointerEvent, useRef } from 'react';
import { MISSION_ORDER } from '@/data/missions';
import { S3, WORLD as WORLD_TEXT } from '@/data/strings';
import { PLACES, ROAD, SPAWN, type Vec, WORLD } from '@/data/world';
import type { MissionId, MissionStatus } from '@/lib/types';

export type PlaceLook = 'dim' | 'on';

export interface VillageSceneProps {
  /** 장소마다 고장(dim) / 되살아남(on) */
  looks: Record<MissionId, PlaceLook>;
  /** 이 장소가 되살아나는 장면 (빛이 서서히 켜진다) */
  reviving?: MissionId | null;
  /** 마을 전체의 어두움 0~1 */
  darkness: number;
  /** 처음에는 밝았다가 어두워지는 장면 (도입 컷 1) */
  nightfall?: boolean;
  /** 차례로 깜빡이며 비추는 장소 (도입 컷 2) */
  highlight?: readonly MissionId[];
  /** 지도 표시 (S3): 잠김·도전 가능·완료 */
  markers?: Record<MissionId, MissionStatus>;
  /** 모든 곳이 되살아나 축제 등불이 켜짐 */
  festival?: boolean;
  onGroundClick?: (p: Vec) => void;
  onPlaceClick?: (id: MissionId) => void;
  className?: string;
}

const HOUSES: readonly (Vec & { color: string })[] = [
  { x: 190, y: 360, color: '#9f1239' },
  { x: 560, y: 520, color: '#b45309' },
  { x: 900, y: 460, color: '#7c3aed' },
  { x: 1090, y: 570, color: '#1d4ed8' },
  { x: 460, y: 190, color: '#0f766e' },
  { x: 150, y: 190, color: '#b45309' },
];
const TREES: readonly Vec[] = [{ x: 300, y: 250 }, { x: 760, y: 590 }, { x: 760, y: 160 }, { x: 1150, y: 300 }];
const LANTERN_COLORS = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#f472b6', '#fbbf24'];

function VillageScene(props: VillageSceneProps) {
  const { looks, reviving, darkness, nightfall, highlight, markers, festival, className = '' } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const roadPath = ROAD.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const litHouses = MISSION_ORDER.filter((id) => looks[id] === 'on').length * 3 + (festival ? 1 : 0);

  const onGround = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!props.onGroundClick || !svgRef.current) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svgRef.current.getScreenCTM()!.inverse());
    props.onGroundClick({ x: pt.x, y: pt.y });
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
      className={`block h-auto w-full select-none ${className}`}
      onPointerDown={onGround}
      role="img"
      aria-label={`${WORLD_TEXT.villageSign} 지도`}
    >
      <defs>
        <radialGradient id="glow">
          <stop offset="0%" stopColor="#fff7c2" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 땅, 언덕, 길 */}
      <rect width={WORLD.width} height={WORLD.height} fill="#6f9a52" />
      <ellipse cx={PLACES.m3.x} cy={PLACES.m3.y + 30} rx={230} ry={140} fill="#86b15f" />
      <path d={roadPath} stroke="#d8c294" strokeWidth={46} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${ROAD[2].x} ${ROAD[2].y} L ${PLACES.m1.x} ${PLACES.m1.y + 20}`} stroke="#d8c294" strokeWidth={34} strokeLinecap="round" />
      <path d={`M ${ROAD[7].x} ${ROAD[7].y} L ${PLACES.m3.x} ${PLACES.m3.y + 40}`} stroke="#d8c294" strokeWidth={30} strokeLinecap="round" />
      <ellipse cx={PLACES.m2.x} cy={PLACES.m2.y + 25} rx={130} ry={78} fill="#e7dcc0" stroke="#c9b68a" strokeWidth={4} />

      {TREES.map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={t.y} r={26} fill="#4f7f3f" />
        </g>
      ))}
      {HOUSES.map((h, i) => (
        <House key={i} {...h} lit={i < litHouses} />
      ))}

      {/* 마을 입구 표지판 */}
      <g pointerEvents="none">
        <rect x={SPAWN.x + 116} y={SPAWN.y + 10} width={8} height={44} fill="#78350f" />
        <rect x={SPAWN.x + 72} y={SPAWN.y - 20} width={96} height={34} rx={6} fill="#fef3c7" stroke="#78350f" strokeWidth={3} />
        <text x={SPAWN.x + 120} y={SPAWN.y + 4} textAnchor="middle" fontSize={20} fontWeight={800} fill="#78350f">
          {WORLD_TEXT.villageSign}
        </text>
      </g>

      {/* 밤의 어두움. 되살린 곳이 늘수록 옅어진다 */}
      <rect
        width={WORLD.width}
        height={WORLD.height}
        fill="#0b1033"
        className={nightfall ? 'nightfall' : ''}
        style={{ opacity: darkness, transition: 'opacity 1.6s ease' }}
        pointerEvents="none"
      />

      {/* 축제 등불 줄 (광장 위). 마무리 화면에서만 보인다 */}
      {festival && <Lanterns on />}

      {/* 미션 장소 */}
      {MISSION_ORDER.map((id) => {
        const look = looks[id];
        const revive = reviving === id;
        const Place = id === 'm1' ? StreetLights : id === 'm2' ? BellTower : Windmill;
        const clickable = !!props.onPlaceClick;
        return (
          <g
            key={id}
            role={clickable ? 'button' : undefined}
            aria-label={clickable && markers ? `${S3.places[id]} (${STATUS_NAME[markers[id]]})` : undefined}
            style={{ cursor: clickable ? 'pointer' : undefined }}
            onPointerDown={(e) => {
              if (!clickable) return;
              e.stopPropagation();
              props.onPlaceClick!(id);
            }}
          >
            {/* 누르기 쉬운 넓은 영역 */}
            <circle cx={PLACES[id].x} cy={PLACES[id].y} r={80} fill="transparent" />
            <Place look={revive ? 'on' : look} revive={revive} />
            {highlight?.includes(id) && (
              <circle cx={PLACES[id].x} cy={PLACES[id].y - 20} r={90} fill="none" stroke="#fde047" strokeWidth={6}
                className="pulse-ring" style={{ animationDelay: `${highlight.indexOf(id) * 0.9}s` }} />
            )}
            <PlaceLabel id={id} status={markers?.[id]} />
          </g>
        );
      })}
    </svg>
  );
}

export default memo(VillageScene);

const STATUS_NAME: Record<MissionStatus, string> = { locked: '잠김', open: '도전 가능', done: '완료' };

function House({ x, y, color, lit }: Vec & { color: string; lit: boolean }) {
  return (
    <g pointerEvents="none">
      <rect x={x - 32} y={y - 22} width={64} height={46} fill="#f5ead3" stroke="#7c6a4a" strokeWidth={2} />
      <polygon points={`${x - 40},${y - 20} ${x},${y - 52} ${x + 40},${y - 20}`} fill={color} />
      <rect x={x - 20} y={y - 10} width={14} height={14} fill={lit ? '#fde68a' : '#475569'} />
      <rect x={x + 6} y={y - 10} width={14} height={14} fill={lit ? '#fde68a' : '#475569'} />
      {lit && <circle cx={x} cy={y} r={46} fill="url(#glow)" opacity={0.35} />}
    </g>
  );
}

function Lanterns({ on }: { on: boolean }) {
  const { x, y } = PLACES.m2;
  const pts = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    return { x: x - 150 + 300 * t, y: y - 110 + Math.sin(t * Math.PI) * 30 };
  });
  return (
    <g pointerEvents="none">
      <path d={`M ${x - 160} ${y - 115} Q ${x} ${y - 50} ${x + 160} ${y - 115}`} stroke="#57534e" strokeWidth={2} fill="none" />
      {pts.map((p, i) => (
        <g key={i}>
          {on && <circle cx={p.x} cy={p.y} r={22} fill="url(#glow)" />}
          <circle cx={p.x} cy={p.y} r={9} fill={on ? LANTERN_COLORS[i] : '#57534e'} />
        </g>
      ))}
      <text x={x} y={y - 128} textAnchor="middle" fontSize={20} fontWeight={800} fill={on ? '#fde68a' : '#a8a29e'}
        stroke="#1c1917" strokeWidth={4} paintOrder="stroke">
        {WORLD_TEXT.festival}
      </text>
    </g>
  );
}

/** 가로등 3개. 고장: 꺼짐 / 되살아남: 환한 빛 */
function StreetLights({ look, revive }: { look: PlaceLook; revive: boolean }) {
  const { x, y } = PLACES.m1;
  const posts = [{ x: x - 70, y: y + 30 }, { x, y: y - 5 }, { x: x + 70, y: y + 30 }];
  return (
    <g pointerEvents="none">
      {posts.map((p, i) => (
        <g key={i}>
          {look === 'on' && (
            <g className={revive ? 'revive-in' : ''} style={{ animationDelay: `${0.4 + i * 0.45}s` }}>
              <ellipse cx={p.x} cy={p.y + 8} rx={50} ry={18} fill="#fde68a" opacity={0.45} />
              <circle cx={p.x} cy={p.y - 66} r={56} fill="url(#glow)" />
            </g>
          )}
          <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 60} stroke="#334155" strokeWidth={6} />
          <circle cx={p.x} cy={p.y - 66} r={11}
            fill={look === 'on' ? '#fffbe0' : '#64748b'}
            className={look === 'on' && revive ? 'revive-in' : ''}
            style={{ animationDelay: `${0.4 + i * 0.45}s` }} />
        </g>
      ))}
    </g>
  );
}

/** 광장의 안내 종. 고장: 조용함 / 되살아남: 울려 퍼지는 물결 */
function BellTower({ look, revive }: { look: PlaceLook; revive: boolean }) {
  const { x, y } = PLACES.m2;
  const on = look === 'on';
  return (
    <g pointerEvents="none">
      {on && <circle cx={x} cy={y - 30} r={70} fill="url(#glow)" className={revive ? 'revive-in' : ''} />}
      {on && [0, 1, 2].map((i) => (
        <circle key={i} cx={x} cy={y - 34} r={50 + i * 26} fill="none" stroke="#fbbf24"
          strokeWidth={5} className="sound-wave" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}
      <rect x={x - 22} y={y - 50} width={44} height={70} fill="#a16207" stroke="#713f12" strokeWidth={3} />
      <polygon points={`${x - 32},${y - 50} ${x},${y - 84} ${x + 32},${y - 50}`} fill="#713f12" />
      {/* 종 */}
      <path d={`M ${x - 14} ${y - 8} Q ${x - 14} ${y - 38} ${x} ${y - 40} Q ${x + 14} ${y - 38} ${x + 14} ${y - 8} L ${x + 17} ${y - 3} L ${x - 17} ${y - 3} Z`}
        fill={on ? '#fcd34d' : '#ca8a04'} stroke="#713f12" strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={4} fill="#713f12" />
    </g>
  );
}

/** 언덕의 풍차. 고장: 멈춤 / 되살아남: 씽씽 */
function Windmill({ look, revive }: { look: PlaceLook; revive: boolean }) {
  const { x, y } = PLACES.m3;
  const on = look === 'on';
  const hub = { x, y: y - 40 };
  return (
    <g pointerEvents="none">
      {on && <circle cx={hub.x} cy={hub.y} r={90} fill="url(#glow)" className={revive ? 'revive-in' : ''} />}
      <polygon points={`${x - 26},${y + 40} ${x + 26},${y + 40} ${x + 14},${y - 40} ${x - 14},${y - 40}`} fill="#f5f5f4" stroke="#78716c" strokeWidth={3} />
      <rect x={x - 8} y={y + 16} width={16} height={24} fill="#78350f" />
      <g className={on ? 'fan fan-fast' : 'fan'}>
        <circle cx={hub.x} cy={hub.y} r={72} fill="none" />
        {[0, 90, 180, 270].map((deg) => (
          <rect key={deg} x={hub.x - 9} y={hub.y - 70} width={18} height={62} rx={3} fill="#e0f2fe" stroke="#0369a1" strokeWidth={2}
            transform={`rotate(${deg} ${hub.x} ${hub.y})`} />
        ))}
        <circle cx={hub.x} cy={hub.y} r={8} fill="#1e293b" />
      </g>
    </g>
  );
}

function PlaceLabel({ id, status }: { id: MissionId; status?: MissionStatus }) {
  const { x, y } = PLACES[id];
  const mark = status === 'locked' ? '🔒 ' : status === 'done' ? '⭐ ' : '';
  return (
    <text x={x} y={y + (id === 'm2' ? 100 : 70)} textAnchor="middle" fontSize={22} fontWeight={800} fill="#fff"
      stroke="#1e1b4b" strokeWidth={5} paintOrder="stroke" pointerEvents="none">
      {mark}{S3.places[id]}
    </text>
  );
}
