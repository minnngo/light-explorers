// 마을 돌아다니기 계산 (순수 함수). 화면(VillageWorld)은 이 함수들로 위치를 바꾸고 그리기만 한다.
import { ARRIVE_RADIUS, BOUNDS, PLACES, ROAD, ROAD_STOP, type Vec, WALK_SPEED, WORLD } from '@/data/world';
import { MISSION_ORDER } from '@/data/missions';
import type { MissionId } from '@/lib/types';

export const ZERO: Vec = { x: 0, y: 0 };

const length = (v: Vec) => Math.hypot(v.x, v.y);
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

/** 길이가 1을 넘지 않게 */
export function clampLength(v: Vec, max = 1): Vec {
  const len = length(v);
  return len > max ? { x: (v.x / len) * max, y: (v.y / len) * max } : v;
}

export function clampToBounds(p: Vec): Vec {
  return {
    x: Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, p.x)),
    y: Math.min(BOUNDS.maxY, Math.max(BOUNDS.minY, p.y)),
  };
}

/** 눌린 키 → 방향 (방향키, WASD). 대각선도 같은 빠르기 */
export function keysToDirection(keys: ReadonlySet<string>): Vec {
  const has = (...names: string[]) => names.some((n) => keys.has(n));
  const x = (has('ArrowRight', 'd', 'D') ? 1 : 0) - (has('ArrowLeft', 'a', 'A') ? 1 : 0);
  const y = (has('ArrowDown', 's', 'S') ? 1 : 0) - (has('ArrowUp', 'w', 'W') ? 1 : 0);
  return x === 0 && y === 0 ? ZERO : clampLength({ x, y });
}

/** 조이스틱 손잡이를 중심에서 (dx, dy)만큼 끌었을 때의 방향. 가운데 조금은 무시(흔들림 방지) */
export function joystickDirection(dx: number, dy: number, radius: number, deadZone = 0.15): Vec {
  const v = clampLength({ x: dx / radius, y: dy / radius });
  return length(v) < deadZone ? ZERO : v;
}

/** 방향(길이 0~1)으로 dt초 걷기 */
export function walk(pos: Vec, dir: Vec, dt: number, speed = WALK_SPEED): Vec {
  const d = clampLength(dir);
  return clampToBounds({ x: pos.x + d.x * speed * dt, y: pos.y + d.y * speed * dt });
}

/** 목표 지점으로 dt초 걷기 (누른 곳으로 가기). 도착하면 arrived */
export function walkToward(pos: Vec, target: Vec, dt: number, speed = WALK_SPEED): { pos: Vec; arrived: boolean } {
  const goal = clampToBounds(target);
  const gap = distance(pos, goal);
  const stepLen = speed * dt;
  if (gap <= stepLen) return { pos: goal, arrived: true };
  return { pos: { x: pos.x + ((goal.x - pos.x) / gap) * stepLen, y: pos.y + ((goal.y - pos.y) / gap) * stepLen }, arrived: false };
}

/** 지금 서 있는 미션 장소 (도착 반경 안). 없으면 null */
export function placeAt(pos: Vec): MissionId | null {
  return MISSION_ORDER.find((id) => distance(pos, PLACES[id]) <= ARRIVE_RADIUS) ?? null;
}

function nearestRoadIndex(pos: Vec): number {
  let best = 0;
  ROAD.forEach((p, i) => {
    if (distance(pos, p) < distance(pos, ROAD[best])) best = i;
  });
  return best;
}

/** 화살표 안내 길: 지금 위치 → 가까운 길 → 길을 따라 → 목표 장소 */
export function guidePath(pos: Vec, target: MissionId): Vec[] {
  const from = nearestRoadIndex(pos);
  const to = ROAD_STOP[target];
  const step = from <= to ? 1 : -1;
  const points: Vec[] = [pos];
  for (let i = from; i !== to + step; i += step) points.push(ROAD[i]);
  points.push(PLACES[target]);
  // 이미 지나온 길 점(되돌아가는 점)은 뺀다: 목표에 더 가까워지는 점만 남긴다
  return points.filter((p, i) => i === 0 || i === points.length - 1 || distance(p, PLACES[target]) < distance(pos, PLACES[target]));
}

/** 다음에 가야 할 곳: 열린 미션. 모두 끝났으면 null */
export function nextTarget(status: Record<MissionId, 'locked' | 'open' | 'done'>): MissionId | null {
  return MISSION_ORDER.find((id) => status[id] === 'open') ?? null;
}

/**
 * 지도로 돌아왔을 때 탐험대가 서 있을 곳: 마지막으로 되살린 장소에서 길을 따라 한 칸 나온 곳
 * (장소 이름표를 가리지 않고, 다음 장소 쪽을 향한다). 처음이면 마을 입구.
 */
export function startPosition(status: Record<MissionId, 'locked' | 'open' | 'done'>, spawn: Vec): Vec {
  const lastDone = [...MISSION_ORDER].reverse().find((id) => status[id] === 'done');
  if (!lastDone) return spawn;
  const stop = ROAD_STOP[lastDone];
  return ROAD[stop + 1] ?? ROAD[stop - 1];
}

/** 화살표가 가리키는 각도(도). 오른쪽 0°, 아래 90° */
export function angleTo(from: Vec, to: Vec): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

/** 화면에 보이는 마을의 부분 (SVG viewBox) */
export interface View {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 카메라: zoom배로 가까이 볼 때 탐험대를 가운데 두는 viewBox.
 * 지도 바깥이 보이지 않게 가장자리에서는 멈춘다. zoom 1이면 지도 전체.
 */
export function cameraView(pos: Vec, zoom: number): View {
  const width = WORLD.width / zoom;
  const height = WORLD.height / zoom;
  const axis = (p: number, size: number, total: number) => Math.min(total - size, Math.max(0, p - size / 2));
  return { x: axis(pos.x, width, WORLD.width), y: axis(pos.y, height, WORLD.height), width, height };
}
