import { describe, expect, it } from 'vitest';
import { boardComponents } from '@/data/boards';
import type { BoardId, PartKind, Wire } from '@/lib/types';
import { judge } from './judge';

let n = 0;
const w = (from: string, to: string): Wire => ({ id: `w${n++}`, from, to });

function run(board: BoardId, part: PartKind, wires: Wire[], switchClosed = true) {
  return judge({ components: boardComponents(board, part), wires, switchClosed });
}

// 정상 연결 예시
const A_OK = [w('bat1.plus', 'load.a'), w('load.b', 'sw.a'), w('sw.b', 'bat1.minus')];
const B_OK = [
  w('bat1.plus', 'bat2.minus'), // 서로 다른 극끼리 한 줄
  w('bat2.plus', 'load.a'),
  w('load.b', 'sw.a'),
  w('sw.b', 'bat1.minus'),
];

describe('judge: 명세서 9-1 판정 결과표', () => {
  it('전지 1개 + 부품 + 스위치가 닫힌 고리 → 레벨 1', () => {
    expect(run('A', 'bulb', A_OK)).toMatchObject({ level: 1, reason: 'OK', batteriesInLoop: 1 });
  });

  it('전지 2개를 서로 다른 극끼리 한 줄로 → 레벨 2', () => {
    expect(run('B', 'bulb', B_OK)).toMatchObject({ level: 2, reason: 'OK', batteriesInLoop: 2 });
  });

  it('전지 2개가 + 끼리 이어짐 → 레벨 0, SAME_POLE', () => {
    const wires = [
      w('bat1.plus', 'bat2.plus'),
      w('bat2.minus', 'load.a'),
      w('load.b', 'sw.a'),
      w('sw.b', 'bat1.minus'),
    ];
    expect(run('B', 'bulb', wires)).toMatchObject({ level: 0, reason: 'SAME_POLE' });
  });

  it('전지 2개가 − 끼리 이어짐 → 레벨 0, SAME_POLE', () => {
    const wires = [
      w('bat1.minus', 'bat2.minus'),
      w('bat2.plus', 'load.a'),
      w('load.b', 'sw.a'),
      w('sw.b', 'bat1.plus'),
    ];
    expect(run('B', 'bulb', wires)).toMatchObject({ level: 0, reason: 'SAME_POLE' });
  });

  it('고리가 끊김 → 레벨 0, BROKEN', () => {
    expect(run('A', 'bulb', A_OK.slice(0, 2))).toMatchObject({ level: 0, reason: 'BROKEN' });
  });

  it('연결은 맞지만 스위치가 열림 → 레벨 0, SWITCH_OPEN (wiredLevel은 유지)', () => {
    expect(run('B', 'bulb', B_OK, false)).toMatchObject({ level: 0, wiredLevel: 2, reason: 'SWITCH_OPEN' });
  });

  it('선이 하나도 없음 → NO_WIRES', () => {
    expect(run('A', 'bulb', [])).toMatchObject({ level: 0, reason: 'NO_WIRES' });
  });

  it('B 회로에서 전지 1개만 고리에 넣으면 → 레벨 1', () => {
    const wires = [w('bat1.plus', 'load.a'), w('load.b', 'sw.a'), w('sw.b', 'bat1.minus')];
    expect(run('B', 'bulb', wires)).toMatchObject({ level: 1, batteriesInLoop: 1 });
  });

  it('전선 방향(from/to)은 결과에 영향이 없다', () => {
    const flipped = A_OK.map((x) => w(x.to, x.from));
    expect(run('A', 'bulb', flipped).level).toBe(1);
  });
});

describe('judge: 버저와 전동기의 방향', () => {
  it('버저 빨간 선(+)이 전지 + 쪽 → 울림', () => {
    expect(run('B', 'buzzer', B_OK)).toMatchObject({ level: 2, reason: 'OK' });
  });

  it('버저를 반대로 이음 → 레벨 0, BUZZER_REVERSED', () => {
    const wires = [w('bat1.plus', 'load.b'), w('load.a', 'sw.a'), w('sw.b', 'bat1.minus')];
    expect(run('A', 'buzzer', wires)).toMatchObject({ level: 0, reason: 'BUZZER_REVERSED' });
  });

  it('전동기를 반대로 이음 → 레벨은 그대로, 도는 방향만 반대', () => {
    const forward = run('A', 'motor', A_OK);
    const reversed = run('A', 'motor', [
      w('bat1.plus', 'load.b'),
      w('load.a', 'sw.a'),
      w('sw.b', 'bat1.minus'),
    ]);
    expect(forward).toMatchObject({ level: 1, motorDirection: 'cw' });
    expect(reversed).toMatchObject({ level: 1, motorDirection: 'ccw' });
  });
});

describe('judge: 명세서에 없는 상황 (추가 규칙)', () => {
  it('전지 양 끝을 전선으로 바로 이음 → SHORT_CIRCUIT', () => {
    expect(run('A', 'bulb', [...A_OK, w('bat1.plus', 'bat1.minus')])).toMatchObject({
      level: 0,
      reason: 'SHORT_CIRCUIT',
    });
  });

  it('부품 양 끝을 전선으로 이어 건너뜀 → SHORT_CIRCUIT', () => {
    expect(run('A', 'bulb', [...A_OK, w('load.a', 'load.b')])).toMatchObject({ reason: 'SHORT_CIRCUIT' });
  });

  it('스위치를 빼고 고리를 만듦 → SWITCH_MISSING', () => {
    expect(run('A', 'bulb', [w('bat1.plus', 'load.a'), w('load.b', 'bat1.minus')])).toMatchObject({
      level: 0,
      reason: 'SWITCH_MISSING',
    });
  });

  it('전지 2개를 같은 방향으로 나란히(병렬) 이어도 합선은 아니다 → 레벨 1', () => {
    const wires = [
      w('bat1.plus', 'bat2.plus'),
      w('bat1.minus', 'bat2.minus'),
      w('bat1.plus', 'load.a'),
      w('load.b', 'sw.a'),
      w('sw.b', 'bat1.minus'),
    ];
    expect(run('B', 'bulb', wires)).toMatchObject({ level: 1, reason: 'OK' });
  });
});
