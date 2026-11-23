'use client';

// 미션 장소에 도착하면 보여 주는 상황 장면 (움직이는 그림).
// 해결 전: 가로등은 꺼져 길이 깜깜하고 / 종을 쳐도 소리가 안 나고 / 풍차는 꼼짝도 안 한다. 마을 사람들이 곤란해한다.
// 해결 뒤: 같은 장면이 밝아지고 마을 사람들이 기뻐한다 (다시 들렀을 때).
import type { ReactNode } from 'react';
import type { MissionId } from '@/lib/types';
import { SITUATION } from '@/data/strings';
import { SpeechBubble, Villager } from './Characters';
import { CuteBellTower, CuteHouse, CuteLamp, CuteStage, CuteWindmill, PropDefs, type RoofColor } from './Props';

const W = 640;
const H = 300;

export default function SituationScene({ id, fixed }: { id: MissionId; fixed: boolean }) {
  const Scene = id === 'm1' ? StreetScene : id === 'm2' ? BellScene : WindmillScene;
  return (
    // 창이 좁아도 그림이 눌리지 않게 (shrink-0) 늘 좌우를 꽉 채운 온전한 그림
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full shrink-0" role="img" aria-label={SITUATION[id].alt}>
      <defs>
        <linearGradient id="sit-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fixed ? '#1e3a8a' : '#0b1033'} />
          <stop offset="100%" stopColor={fixed ? '#6d5bd0' : '#27306b'} />
        </linearGradient>
        <radialGradient id="sit-glow">
          <stop offset="0%" stopColor="#fff7c2" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
        <PropDefs />
        <pattern id="sit-cobble" width={26} height={14} patternUnits="userSpaceOnUse">
          <rect width={26} height={14} fill="#dcc59c" />
          <rect x={1} y={1} width={11} height={5} rx={2} fill="#f1e2c2" />
          <rect x={14} y={1} width={11} height={5} rx={2} fill="#ead8b3" />
          <rect x={-5} y={8} width={11} height={5} rx={2} fill="#ead8b3" />
          <rect x={8} y={8} width={11} height={5} rx={2} fill="#f4e7ca" />
          <rect x={21} y={8} width={11} height={5} rx={2} fill="#ead8b3" />
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

const BACK_HOUSES: { x: number; roof: RoofColor; size: number }[] = [
  { x: 70, roof: 'rose', size: 1.25 },
  { x: 195, roof: 'sky', size: 1.45 },
  { x: 455, roof: 'mint', size: 1.3 },
  { x: 575, roof: 'lilac', size: 1.15 },
];

function BackHouses({ lit }: { lit: boolean }) {
  return (
    <g>
      {BACK_HOUSES.map((h) => (
        <g key={h.x} transform={`translate(${h.x} 204) scale(${h.size})`}>
          <CuteHouse roof={h.roof} lit={lit} />
        </g>
      ))}
    </g>
  );
}

function Question({ x, y, delay }: { x: number; y: number; delay?: string }) {
  return (
    <text x={x} y={y} fontSize={26} fontWeight={900} fill="#ffe27a" stroke="#9a7a4a" strokeWidth={2.5} paintOrder="stroke"
      className="question-pop" style={{ animationDelay: delay }}>?</text>
  );
}

/** 가로등 거리: 꺼진 가로등, 더듬거리며 걷는 아이, 촛불을 든 할아버지 곰 */
function StreetScene({ fixed }: { fixed: boolean }) {
  const lamps = [130, 320, 510];
  return (
    <g>
      <BackHouses lit={fixed} />
      <rect y={200} width={W} height={100} fill="#7fb069" />
      <rect y={226} width={W} height={50} fill="url(#sit-cobble)" />
      {lamps.map((x, i) => (
        <g key={x} transform={`translate(${x} 242)`}>
          <CuteLamp on={fixed} h={120} className="revive-in" delay={`${i * 0.3}s`} />
        </g>
      ))}
      {!fixed && (
        <Night>
          {/* 촛불 하나로 버티는 할아버지 곰 */}
          <g transform="translate(560 262) scale(0.9)">
            <circle cx={-34} cy={-48} r={34} fill="url(#sit-glow)" opacity={0.7} />
            <Villager look={{ animal: 'bear', old: true }} mood="worried" flip />
            <rect x={-38} y={-42} width={7} height={16} rx={1.5} fill="#fff7e0" />
            <path d="M -34.5 -43 q -4 -6 0 -12 q 4 6 0 12 z" fill="#ffd166" className="candle-flicker" />
          </g>
        </Night>
      )}
      {/* 길을 지나가는 아이: 어두우면 더듬더듬, 밝으면 신나게 */}
      <g className="walk-across">
        <g transform="translate(0 262) scale(0.9)">
          <Villager look={{ animal: 'chick', child: true }} mood={fixed ? 'happy' : 'worried'} walking />
          {!fixed && <Question x={4} y={-82} />}
        </g>
      </g>
      <SpeechBubble x={560} y={160} text={fixed ? SITUATION.m1.fixedLine : SITUATION.m1.troubleLine} size={17} />
    </g>
  );
}

/** 광장의 안내 종: 종이 흔들려도 소리가 나지 않는다 */
function BellScene({ fixed }: { fixed: boolean }) {
  const cx = 320;
  return (
    <g>
      <BackHouses lit={fixed} />
      <rect y={200} width={W} height={100} fill="url(#sit-cobble)" />
      {/* 소리: 해결 전에는 아주 희미하게 퍼지다 사라지고, 해결 뒤에는 크게 울려 퍼진다 */}
      {fixed
        ? [0, 1, 2].map((i) => (
            <circle key={i} cx={cx} cy={150} r={70 + i * 34} fill="none" stroke="#ffd45e" strokeWidth={6} className="sound-wave"
              style={{ animationDelay: `${i * 0.35}s` }} />
          ))
        : <circle cx={cx} cy={150} r={46} fill="none" stroke="#b8bfd6" strokeWidth={2} strokeDasharray="4 6" className="faint-wave" />}
      <g transform={`translate(${cx} 250) scale(1.45)`}>
        <CuteBellTower on={fixed} swing />
      </g>
      {/* 종 옆에서 곤란해하는 여우 */}
      <g transform="translate(450 268)">
        <Villager look={{ animal: 'fox' }} mood={fixed ? 'happy' : 'worried'} flip />
      </g>
      {/* 귀를 기울이는 동물들 */}
      {([{ x: 120, child: true, animal: 'frog' }, { x: 190, child: false, animal: 'bunny' }] as const).map((p, i) => (
        <g key={p.x} transform={`translate(${p.x} 272)`}>
          <Villager look={{ animal: p.animal, child: p.child }} mood={fixed ? 'happy' : 'worried'} />
          {!fixed && <Question x={8} y={p.animal === 'bunny' ? -118 : -86} delay={`${i * 0.6}s`} />}
        </g>
      ))}
      {!fixed && <Night />}
      <SpeechBubble x={155} y={140} text={fixed ? SITUATION.m2.fixedLine : SITUATION.m2.troubleLine} size={17} />
    </g>
  );
}

/** 언덕의 풍차: 날개가 멈춰 축제 무대에 불을 켤 수 없다 */
function WindmillScene({ fixed }: { fixed: boolean }) {
  return (
    <g>
      <path d={`M 0 220 Q 180 150 360 190 Q 520 220 ${W} 200 L ${W} ${H} L 0 ${H} Z`} fill="#8cc47a" />
      <path d={`M 0 250 Q 200 210 ${W} 245 L ${W} ${H} L 0 ${H} Z`} fill="#74b064" />
      <g transform="translate(190 272) scale(1.25)">
        <CuteWindmill on={fixed} motion={fixed ? 'spin' : 'twitch'} />
      </g>
      {/* 축제 무대: 풍차가 돌아야 불이 켜진다 */}
      <g transform="translate(515 250)">
        <CuteStage on={fixed} />
      </g>
      {/* 풍차 앞의 농부 돼지 */}
      <g transform="translate(370 262)">
        <Villager look={{ animal: 'pig' }} mood={fixed ? 'happy' : 'worried'} flip />
      </g>
      {!fixed && <Night />}
      <SpeechBubble x={370} y={170} text={fixed ? SITUATION.m3.fixedLine : SITUATION.m3.troubleLine} size={17} />
    </g>
  );
}
