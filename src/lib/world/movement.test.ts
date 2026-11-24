import { describe, expect, it } from 'vitest';
import { BOUNDS, PLACES, ROAD, ROAD_STOP, SPAWN, WALK_SPEED } from '@/data/world';
import {
  cameraView,
  distance,
  guidePath,
  joystickDirection,
  keysToDirection,
  nextTarget,
  placeAt,
  startPosition,
  walk,
  walkToward,
} from './movement';

describe('마을 돌아다니기', () => {
  it('방향키와 WASD로 움직이고, 대각선도 같은 빠르기다', () => {
    expect(keysToDirection(new Set(['ArrowRight']))).toEqual({ x: 1, y: 0 });
    expect(keysToDirection(new Set(['w']))).toEqual({ x: 0, y: -1 });
    const diag = keysToDirection(new Set(['ArrowRight', 'ArrowDown']));
    expect(Math.hypot(diag.x, diag.y)).toBeCloseTo(1);
    expect(keysToDirection(new Set(['ArrowLeft', 'ArrowRight']))).toEqual({ x: 0, y: 0 });
  });

  it('조이스틱: 가운데 조금은 무시하고, 끝까지 끌어도 최고 빠르기를 넘지 않는다', () => {
    expect(joystickDirection(3, 2, 60)).toEqual({ x: 0, y: 0 });
    const far = joystickDirection(200, 0, 60);
    expect(far.x).toBeCloseTo(1);
  });

  it('지도 밖으로 나가지 않는다', () => {
    const p = walk({ x: BOUNDS.minX + 1, y: 300 }, { x: -1, y: 0 }, 1);
    expect(p.x).toBe(BOUNDS.minX);
  });

  it('누른 곳으로 걸어가 도착한다', () => {
    const target = { x: SPAWN.x + WALK_SPEED, y: SPAWN.y };
    const half = walkToward(SPAWN, target, 0.5);
    expect(half.arrived).toBe(false);
    expect(distance(half.pos, target)).toBeCloseTo(WALK_SPEED / 2);
    expect(walkToward(half.pos, target, 0.6)).toMatchObject({ arrived: true, pos: target });
  });

  it('장소 가까이 가면 그 장소에 도착한 것으로 본다', () => {
    expect(placeAt(PLACES.m2)).toBe('m2');
    expect(placeAt(SPAWN)).toBeNull();
  });

  it('화살표 안내 길은 지금 위치에서 시작해 목표 장소에서 끝나고, 목표에 점점 가까워진다', () => {
    const path = guidePath(SPAWN, 'm2');
    expect(path[0]).toEqual(SPAWN);
    expect(path.at(-1)).toEqual(PLACES.m2);
    for (let i = 2; i < path.length; i++) {
      expect(distance(path[i], PLACES.m2)).toBeLessThanOrEqual(distance(path[i - 1], PLACES.m2) + 1e-9);
    }
  });

  it('언덕에서 가로등으로 되돌아가는 길도 안내한다', () => {
    const path = guidePath(PLACES.m3, 'm1');
    expect(path.at(-1)).toEqual(PLACES.m1);
    expect(path).toContainEqual(ROAD[ROAD_STOP.m2]);
  });

  it('다음 목표는 열린 미션, 지도로 돌아오면 마지막으로 되살린 장소 앞에 선다', () => {
    const status = { m1: 'done', m2: 'open', m3: 'locked' } as const;
    expect(nextTarget(status)).toBe('m2');
    expect(nextTarget({ m1: 'done', m2: 'done', m3: 'done' })).toBeNull();
    expect(startPosition(status, SPAWN)).toEqual(ROAD[ROAD_STOP.m1 + 1]);
    expect(placeAt(startPosition(status, SPAWN))).toBeNull(); // 장소 이름표를 가리지 않게 장소 밖에 선다
    expect(placeAt(startPosition({ m1: 'done', m2: 'done', m3: 'done' }, SPAWN))).toBeNull();
    expect(startPosition({ m1: 'open', m2: 'locked', m3: 'locked' }, SPAWN)).toEqual(SPAWN);
  });
});

describe('가까이 보기 카메라', () => {
  it('탐험대를 화면 가운데에 둔다', () => {
    const v = cameraView({ x: 600, y: 350 }, 2);
    expect(v).toEqual({ x: 300, y: 175, width: 600, height: 350 });
  });

  it('지도 가장자리에서는 바깥이 보이지 않게 멈춘다', () => {
    expect(cameraView({ x: 0, y: 0 }, 2)).toMatchObject({ x: 0, y: 0 });
    expect(cameraView({ x: 1200, y: 700 }, 2)).toMatchObject({ x: 600, y: 350 });
  });

  it('지도 보기(1배)는 늘 지도 전체', () => {
    expect(cameraView({ x: 900, y: 100 }, 1)).toEqual({ x: 0, y: 0, width: 1200, height: 700 });
  });

  it('화면 비율에 맞춰 꽉 채운다 (세로로 긴 화면이면 좌우를 잘라 탐험대를 따라간다)', () => {
    const v = cameraView({ x: 100, y: 350 }, 1, 1);
    expect(v).toEqual({ x: 0, y: 0, width: 700, height: 700 });
    expect(cameraView({ x: 1200, y: 350 }, 1, 1).x).toBe(500);
    // 가로로 아주 긴 화면이면 위아래를 자른다
    expect(cameraView({ x: 600, y: 350 }, 1, 3)).toEqual({ x: 0, y: 150, width: 1200, height: 400 });
  });

  it('가까이 보기에서는 천천히 걸을 수 있다', () => {
    expect(walk({ x: 600, y: 400 }, { x: 1, y: 0 }, 1, 100).x).toBe(700);
  });
});
