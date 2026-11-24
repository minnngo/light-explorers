import { describe, expect, it } from 'vitest';
import { judge } from '@/lib/circuit/judge';
import { boardComponents } from '@/data/boards';
import type { BoardState, Wire } from '@/lib/types';
import { challengeStep, fixLoopCoach } from './challenge';

let n = 0;
const board = (pairs: [string, string][], switchClosed = false): BoardState => ({
  wires: pairs.map(([from, to]) => ({ id: `w${n++}`, from, to }) as Wire),
  switchClosed,
  lastChangedAt: 0,
});
const step = (b: BoardState) => challengeStep(b, judge({ components: boardComponents('B', 'bulb'), wires: b.wires, switchClosed: true }));

describe('도전 단계 (같은 극끼리 이어 보기)', () => {
  it('처음(서로 다른 극으로 이어진 회로)에서는 전지 사이 전선을 지우는 단계', () => {
    const b = board([['bat1.plus', 'bat2.minus'], ['bat2.plus', 'load.a'], ['load.b', 'sw.a'], ['sw.b', 'bat1.minus']], true);
    expect(step(b)).toBe(0);
  });

  it('지우고 나면 같은 극끼리 잇는 단계, 이으면 고리를 고치는 단계', () => {
    expect(step(board([['bat2.plus', 'load.a'], ['load.b', 'sw.a'], ['sw.b', 'bat1.minus']]))).toBe(1);
    expect(step(board([['bat1.plus', 'bat2.plus'], ['bat2.plus', 'load.a'], ['load.b', 'sw.a'], ['sw.b', 'bat1.minus']]))).toBe(2);
  });

  it('같은 극끼리 이어진 고리가 되면 스위치를 닫아 보는 단계', () => {
    const b = board([['bat1.plus', 'bat2.plus'], ['bat2.minus', 'load.a'], ['load.b', 'sw.a'], ['sw.b', 'bat1.minus']]);
    expect(step(b)).toBe(3);
  });

  it('3단계 시범: + 끝에 붙은 바깥 전선을 먼저 반짝이고, 지우면 빈 − 끝과 빈 단자를 잇게 보여 준다', () => {
    const withWrong = board([['bat1.plus', 'bat2.plus'], ['bat2.plus', 'sw.b'], ['bat1.minus', 'load.a'], ['load.b', 'sw.a']]);
    expect(fixLoopCoach(withWrong)).toEqual({ wires: true, onlyWires: [['bat2.plus', 'sw.b']] });
    const removed = board([['bat1.plus', 'bat2.plus'], ['bat1.minus', 'load.a'], ['load.b', 'sw.a']]);
    expect(fixLoopCoach(removed)).toEqual({ terminals: ['bat2.minus', 'sw.b'] });
  });
});
