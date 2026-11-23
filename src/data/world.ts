// 반짝마을 지도 배치 (S2 도입 애니메이션과 S3 마을 돌아다니기에서 같이 쓴다).
// 좌표는 SVG viewBox(1200 x 700) 기준. 그림 파일이 생기면 위치만 맞춰 바꾸면 된다.
import type { MissionId } from '@/lib/types';

export interface Vec {
  x: number;
  y: number;
}

export const WORLD = { width: 1200, height: 700 } as const;

/** 탐험대가 걸어 다닐 수 있는 범위 */
export const BOUNDS = { minX: 50, maxX: 1150, minY: 110, maxY: 670 } as const;

/** 마을 입구 (처음 도착하는 곳) */
export const SPAWN: Vec = { x: 120, y: 630 };

/** 미션 장소의 중심 */
export const PLACES: Record<MissionId, Vec> = {
  m1: { x: 340, y: 430 }, // 가로등 거리
  m2: { x: 660, y: 330 }, // 광장의 안내 종
  m3: { x: 1020, y: 190 }, // 언덕의 풍차
};

/** 이만큼 가까이 가면 그 장소에 도착한 것으로 본다 */
export const ARRIVE_RADIUS = 75;

/** 마을 길 (입구 → 가로등 → 광장 → 언덕). 화살표 안내가 이 길을 따라간다 */
export const ROAD: readonly Vec[] = [
  { x: 120, y: 640 },
  { x: 230, y: 560 },
  { x: 330, y: 495 },
  { x: 470, y: 420 },
  { x: 650, y: 395 },
  { x: 800, y: 320 },
  { x: 920, y: 255 },
  { x: 1000, y: 250 },
];

/** 장소마다 길 위에서 가장 가까운 점 (ROAD의 번호) */
export const ROAD_STOP: Record<MissionId, number> = { m1: 2, m2: 4, m3: 7 };

/** 걷는 빠르기 (초당 viewBox 단위). 수업 시간을 아끼도록 지도 끝에서 끝까지 4초 안쪽 */
export const WALK_SPEED = 340;
