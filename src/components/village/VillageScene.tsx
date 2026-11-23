'use client';

// 반짝마을 그림 (명세서 14장 A1 마을 배경, A2 장소 아이콘의 임시 그림). 도입(S2)과 마을 지도(S3)에서 같이 쓴다.
// 그림 파일이 생기면 이 컴포넌트 안의 도형만 <image>로 바꾸면 된다. 좌표는 data/world.ts.
import { memo, type PointerEvent as ReactPointerEvent, useRef } from 'react';
import { MISSION_ORDER } from '@/data/missions';
import { S3, WORLD as WORLD_TEXT } from '@/data/strings';
import { PLACES, SPAWN, type Vec, WORLD } from '@/data/world';
import type { MissionId, MissionStatus } from '@/lib/types';
import {
  BRANCHES,
  DetailDefs,
  GroundDetails,
  House,
  PlaceVillagers,
  ROAD_PATH,
  RoadDetails,
  TownDetails,
  Tree,
} from './VillageDetails';
import { CuteBellTower, CuteLamp, CuteSign, CuteTree, CuteWindmill, PropDefs, type RoofColor } from './Props';

export type PlaceLook = 'dim' | 'on';

/**
 * 가까이 보기에서는 집·나무(NEAR_PROP)와 미션 장소(NEAR_PLACE)를 작게 그린다.
 * 그래야 크게 확대해도 장소가 한 화면에 들어오고, 장소와 장소 사이 길이 멀게 느껴진다.
 */
export const NEAR_PROP = 0.6;
export const NEAR_PLACE = 0.5;

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
  /** 가까이 보기: 큰 집·나무·마을 사람 같은 자세한 모습을 그린다 */
  near?: boolean;
  onGroundClick?: (p: Vec) => void;
  onPlaceClick?: (id: MissionId) => void;
  className?: string;
}

const HOUSES: readonly (Vec & { roof: RoofColor })[] = [
  { x: 190, y: 360, roof: 'rose' },
  { x: 560, y: 520, roof: 'peach' },
  { x: 900, y: 460, roof: 'lilac' },
  { x: 1090, y: 570, roof: 'sky' },
  { x: 460, y: 190, roof: 'mint' },
  { x: 150, y: 190, roof: 'peach' },
];
const TREES: readonly Vec[] = [{ x: 300, y: 250 }, { x: 760, y: 590 }, { x: 760, y: 160 }, { x: 1150, y: 300 }];
const LANTERN_COLORS = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#f472b6', '#fbbf24'];

function VillageScene(props: VillageSceneProps) {
  const { looks, reviving, darkness, nightfall, highlight, markers, festival, near, className = '' } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const litHouses = MISSION_ORDER.filter((id) => looks[id] === 'on').length * 3 + (festival ? 1 : 0);

  const onGround = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!props.onGroundClick || !svgRef.current) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svgRef.current.getScreenCTM()!.inverse());
    props.onGroundClick({ x: pt.x, y: pt.y });
  };

  return (
    <svg
      ref={svgRef}
      data-village=""
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
        {near && <DetailDefs />}
        <PropDefs />
      </defs>

      {/* 땅, 언덕, 길 */}
      <rect width={WORLD.width} height={WORLD.height} fill="#86ba6e" />
      <ellipse cx={PLACES.m3.x} cy={PLACES.m3.y + 30} rx={230} ry={140} fill="#9fcc80" />
      {near && <GroundDetails />}
      {near && (
        <>
          <path d={ROAD_PATH} stroke="#d9bf8f" strokeWidth={54} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {BRANCHES.map((d) => <path key={d} d={d} stroke="#d9bf8f" strokeWidth={42} strokeLinecap="round" />)}
        </>
      )}
      <path d={ROAD_PATH} stroke="#efdcb4" strokeWidth={46} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={BRANCHES[0]} stroke="#efdcb4" strokeWidth={34} strokeLinecap="round" />
      <path d={BRANCHES[1]} stroke="#efdcb4" strokeWidth={30} strokeLinecap="round" />
      <ellipse cx={PLACES.m2.x} cy={PLACES.m2.y + 25} rx={130} ry={78} fill="#f3e8cf" stroke="#e0cfa8" strokeWidth={4} />
      {near && <RoadDetails />}

      {near
        ? TREES.map((t, i) => <Tree key={i} {...t} size={NEAR_PROP} />)
        : TREES.map((t, i) => (
            <g key={i} transform={`translate(${t.x} ${t.y + 26})`}><CuteTree /></g>
          ))}
      {near && <TownDetails litHouses={litHouses} lampsOn={looks.m1 === 'on'} />}
      {HOUSES.map((h, i) => (
        <House key={i} {...h} lit={i < litHouses} size={near ? NEAR_PROP : 1} />
      ))}

      {/* 마을 입구 표지판 */}
      <g transform={`translate(${SPAWN.x + 120} ${SPAWN.y + 54}) scale(${near ? 0.45 : 1})`}>
        <CuteSign text={WORLD_TEXT.villageSign} />
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
            <Place look={revive ? 'on' : look} revive={revive} k={near ? NEAR_PLACE : 1} />
            {highlight?.includes(id) && (
              <circle cx={PLACES[id].x} cy={PLACES[id].y - 20} r={90} fill="none" stroke="#fde047" strokeWidth={6}
                className="pulse-ring" style={{ animationDelay: `${highlight.indexOf(id) * 0.9}s` }} />
            )}
            <PlaceLabel id={id} status={markers?.[id]} small={near} />
          </g>
        );
      })}

      {/* 마을 사람들은 밤에도 잘 보이게 어둠과 장소 그림 위에 */}
      {near && <PlaceVillagers looks={looks} />}
    </svg>
  );
}

export default memo(VillageScene);

const STATUS_NAME: Record<MissionStatus, string> = { locked: '잠김', open: '도전 가능', done: '완료' };

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

/** 가로등 3개. 고장: 꺼짐 / 되살아남: 환한 빛. k는 그림 크기 */
function StreetLights({ look, revive, k }: { look: PlaceLook; revive: boolean; k: number }) {
  const { x, y } = PLACES.m1;
  const posts = [{ x: x - 70, y: y + 30 }, { x, y: y - 5 }, { x: x + 70, y: y + 30 }];
  return (
    <g pointerEvents="none">
      {posts.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) scale(${k})`}>
          <CuteLamp on={look === 'on'} h={56} className={revive ? 'revive-in' : undefined} delay={`${0.4 + i * 0.45}s`} />
        </g>
      ))}
    </g>
  );
}

/** 광장의 안내 종. 고장: 조용함 / 되살아남: 울려 퍼지는 물결 */
function BellTower({ look, revive, k }: { look: PlaceLook; revive: boolean; k: number }) {
  const { x, y } = PLACES.m2;
  const on = look === 'on';
  const bellY = y + 20 - 52 * k;
  return (
    <g pointerEvents="none">
      {on && <circle cx={x} cy={bellY} r={70 * k} fill="url(#glow)" className={revive ? 'revive-in' : ''} />}
      {on && [0, 1, 2].map((i) => (
        <circle key={i} cx={x} cy={bellY} r={(50 + i * 26) * k} fill="none" stroke="#ffd45e"
          strokeWidth={5 * k} className="sound-wave" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}
      <g transform={`translate(${x} ${y + 20}) scale(${0.8 * k})`}>
        <CuteBellTower on={on} />
      </g>
    </g>
  );
}

/** 언덕의 풍차. 고장: 멈춤 / 되살아남: 씽씽 */
function Windmill({ look, revive, k }: { look: PlaceLook; revive: boolean; k: number }) {
  const { x, y } = PLACES.m3;
  const on = look === 'on';
  return (
    <g pointerEvents="none">
      {on && <circle cx={x} cy={y + 40 - 78 * k} r={90 * k} fill="url(#glow)" className={revive ? 'revive-in' : ''} />}
      <g transform={`translate(${x} ${y + 40}) scale(${0.78 * k})`}>
        <CuteWindmill on={on} motion={on ? 'spin' : 'still'} />
      </g>
    </g>
  );
}

function PlaceLabel({ id, status, small }: { id: MissionId; status?: MissionStatus; small?: boolean }) {
  const { x, y } = PLACES[id];
  const mark = status === 'locked' ? '🔒 ' : status === 'done' ? '⭐ ' : '';
  return (
    <text x={x} y={y + (id === 'm2' ? (small ? 46 : 100) : small ? 52 : 70)} textAnchor="middle" fontSize={small ? 6.5 : 22}
      fontWeight={800} fill="#fff" stroke="#1e1b4b" strokeWidth={small ? 2 : 5} paintOrder="stroke" pointerEvents="none">
      {mark}{S3.places[id]}
    </text>
  );
}
