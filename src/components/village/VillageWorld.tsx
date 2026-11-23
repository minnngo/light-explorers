'use client';

// S3 마을 돌아다니기: 탐험대를 움직여 화살표를 따라가고, 장소에 도착하면 onArrive를 부른다.
// 조작: 방향키/WASD, 가고 싶은 곳 누르기(마우스·터치), 화면 조이스틱.
// 위치는 이 기기 화면에만 있다 (함께하기에서도 각자 돌아다니고, 미션을 열면 모두 함께 들어간다).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PLACES, SPAWN, type Vec } from '@/data/world';
import type { MissionId, MissionStatus } from '@/lib/types';
import {
  angleTo,
  cameraView,
  joystickDirection,
  keysToDirection,
  placeAt,
  startPosition,
  walk,
  walkToward,
  ZERO,
} from '@/lib/world/movement';
import { CompassArrow, DownArrow, Explorer, Fairy } from './Characters';
import VillageScene, { type PlaceLook } from './VillageScene';

/** 보기 방법: 가까이(탐험대를 따라가며 크게) / 지도(마을 전체를 한눈에) */
export type WorldView = 'near' | 'map';

/** 가까이 보기 배율, 그때 탐험대 크기와 걷는 빠르기 (지도 보기는 1배, 크기 1, 빠르기 340) */
const NEAR = { zoom: 5, scale: 0.22, speed: 90 } as const;
const MAP = { zoom: 1, scale: 1, speed: 340 } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D']);

interface Props {
  status: Record<MissionId, MissionStatus>;
  /** 화살표로 안내할 곳 (없으면 화살표 없음) */
  target: MissionId | null;
  /** 이야기 장면이나 발견 창이 떠 있으면 멈춘다 */
  paused: boolean;
  /** 되살아나는 장면 중인 장소 */
  reviving: MissionId | null;
  darkness: number;
  view: WorldView;
  /** 장소에 도착함 (또는 그 장소 안에서 Enter·장소 누르기) */
  onArrive: (id: MissionId) => void;
}

export default function VillageWorld({ status, target, paused, reviving, darkness, view, onArrive }: Props) {
  const start = useMemo(() => startPosition(status, SPAWN), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [pos, setPos] = useState<Vec>(start);
  const [moving, setMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const posRef = useRef(start);
  const keys = useRef(new Set<string>());
  const joy = useRef<Vec>(ZERO);
  const goal = useRef<Vec | null>(null);
  const inside = useRef<MissionId | null>(placeAt(start)); // 처음 서 있는 곳에서는 바로 알리지 않는다
  const pausedRef = useRef(paused);
  const onArriveRef = useRef(onArrive);
  const viewRef = useRef(view);
  const [zoom, setZoom] = useState<number>(view === 'near' ? NEAR.zoom : MAP.zoom);
  const zoomRef = useRef(zoom);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    pausedRef.current = paused;
    onArriveRef.current = onArrive;
    if (paused) {
      keys.current.clear();
      goal.current = null;
    }
  }, [paused, onArrive]);

  // 움직임: 매 화면마다 조금씩
  useEffect(() => {
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // 보기를 바꾸면 부드럽게 가까워지거나 멀어진다
      const goalZoom = viewRef.current === 'near' ? NEAR.zoom : MAP.zoom;
      if (zoomRef.current !== goalZoom) {
        const z = zoomRef.current + (goalZoom - zoomRef.current) * Math.min(1, dt * 6);
        zoomRef.current = Math.abs(z - goalZoom) < 0.005 ? goalZoom : z;
        setZoom(zoomRef.current);
      }
      const t = (zoomRef.current - MAP.zoom) / (NEAR.zoom - MAP.zoom);
      const speed = lerp(MAP.speed, NEAR.speed, t);
      if (!pausedRef.current) {
        const keyDir = keysToDirection(keys.current);
        const dir = keyDir !== ZERO ? keyDir : joy.current;
        let next = posRef.current;
        if (dir !== ZERO) {
          goal.current = null; // 직접 움직이면 누른 곳으로 가기는 멈춘다
          next = walk(next, dir, dt, speed);
        } else if (goal.current) {
          const r = walkToward(next, goal.current, dt, speed);
          next = r.pos;
          if (r.arrived) goal.current = null;
        }
        if (next !== posRef.current) {
          const dx = next.x - posRef.current.x;
          if (Math.abs(dx) > 0.01) setFacingLeft(dx < 0);
          posRef.current = next;
          setPos(next);
          setMoving(true);
        } else {
          setMoving(false);
        }
        const here = placeAt(next);
        if (here !== inside.current) {
          inside.current = here;
          if (here) onArriveRef.current(here);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 키보드
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (pausedRef.current || isTyping(e)) return;
      if (MOVE_KEYS.has(e.key)) {
        e.preventDefault();
        keys.current.add(e.key);
      } else if ((e.key === 'Enter' || e.key === ' ') && inside.current) {
        e.preventDefault();
        onArriveRef.current(inside.current);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    const clear = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);

  const onGroundClick = useCallback((p: Vec) => {
    if (!pausedRef.current) goal.current = p;
  }, []);
  const onPlaceClick = useCallback((id: MissionId) => {
    if (pausedRef.current) return;
    if (inside.current === id) onArriveRef.current(id); // 이미 와 있으면 바로
    else goal.current = PLACES[id];
  }, []);

  const looks = useMemo(
    () => ({
      m1: lookOf(status.m1),
      m2: lookOf(status.m2),
      m3: lookOf(status.m3),
    }),
    [status.m1, status.m2, status.m3],
  );
  const markers = useMemo(() => ({ ...status }), [status]);

  const nearTarget = target ? Math.hypot(pos.x - PLACES[target].x, pos.y - PLACES[target].y) < 100 : true;
  // 나침반: 길과 상관없이 늘 다음 미션 장소 쪽을 곧장 가리킨다
  const pointer = target ? angleTo(pos, PLACES[target]) : 0;
  const showCompass = !!target && !nearTarget && !paused;

  // 카메라: 가까이 보기에서는 탐험대를 가운데 두고 크게, 탐험대는 마을보다 훨씬 작게
  const t = (zoom - MAP.zoom) / (NEAR.zoom - MAP.zoom);
  const cam = cameraView(pos, zoom);
  const viewBox = `${cam.x} ${cam.y} ${cam.width} ${cam.height}`;
  const size = lerp(MAP.scale, NEAR.scale, t);
  // 마을 그림은 다시 그리지 않고 보는 곳(viewBox)만 바꾼다 (매 화면 다시 그리면 태블릿에서 느려진다)
  useLayoutEffect(() => {
    boxRef.current?.querySelector('svg[data-village]')?.setAttribute('viewBox', viewBox);
  }, [viewBox]);

  return (
    <div ref={boxRef} className="relative overflow-hidden rounded-3xl">
      <VillageScene
        near={view === 'near'}
        looks={looks}
        reviving={reviving}
        darkness={darkness}
        markers={markers}
        onGroundClick={onGroundClick}
        onPlaceClick={onPlaceClick}
      />

      {/* 탐험대·화살표는 위에 겹친 그림 (누르기는 아래 지도로 통과) */}
      <svg viewBox={viewBox} className="pointer-events-none absolute inset-0 h-full w-full">
        {target && !paused && (
          <DownArrow x={PLACES[target].x} y={PLACES[target].y - lerp(130, 100, t)} scale={lerp(1, 0.3, t)} />
        )}

        {/* 탐험대와 뒤따라 나는 반디 */}
        <g transform={`translate(${pos.x} ${pos.y}) scale(${size})`}>
          {/* 내 발밑의 빛 고리: 마을 동물들과 구별 */}
          <ellipse cx={0} cy={0} rx={36} ry={10} fill="#fde047" opacity={0.22} />
          <ellipse cx={0} cy={0} rx={36} ry={10} fill="none" stroke="#fde047" strokeWidth={3} opacity={0.8} />

          <g transform={`translate(${facingLeft ? 46 : -46} -74)`}>
            <g className="bob" style={{ animationDuration: '1.6s' }}>
              <Fairy />
            </g>
          </g>
          <g transform={facingLeft ? 'scale(-1 1)' : undefined}>
            <Explorer walking={moving} />
          </g>
          {showCompass && <CompassArrow angle={pointer} />}
        </g>
      </svg>

      {!paused && <Joystick onChange={(v) => (joy.current = v)} />}
    </div>
  );
}

function lookOf(s: MissionStatus): PlaceLook {
  return s === 'done' ? 'on' : 'dim';
}

function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

/** 화면 조이스틱 (태블릿용. 마우스로 끌어도 된다) */
function Joystick({ onChange }: { onChange: (v: Vec) => void }) {
  const RADIUS = 52;
  const [knob, setKnob] = useState<Vec>(ZERO);
  const center = useRef<Vec | null>(null);

  const move = (e: React.PointerEvent) => {
    if (!center.current) return;
    const dx = e.clientX - center.current.x;
    const dy = e.clientY - center.current.y;
    const len = Math.hypot(dx, dy);
    const k = len > RADIUS ? RADIUS / len : 1;
    setKnob({ x: dx * k, y: dy * k });
    onChange(joystickDirection(dx, dy, RADIUS));
  };
  const end = () => {
    center.current = null;
    setKnob(ZERO);
    onChange(ZERO);
  };

  return (
    <div
      role="application"
      aria-label="조이스틱: 끌어서 움직이기"
      className="absolute bottom-4 right-4 flex size-32 touch-none items-center justify-center rounded-full border-4 border-white/70 bg-slate-900/40"
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className="size-14 rounded-full border-4 border-amber-300 bg-amber-400 shadow-lg"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}
