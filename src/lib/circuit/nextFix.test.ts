import { describe, expect, it } from 'vitest';
import { judge } from './judge';
import { boardComponents } from '@/data/boards';
import { nextFix, planFixes, solutions } from './nextFix';
import type { BoardId, PartKind, Wire } from '@/lib/types';

const W = (pairs: [string, string][]): Wire[] => pairs.map(([from, to], i) => ({ id: `w${i}`, from, to }));

/** 힌트를 계속 따라 하면 결국 작동하는지 */
function follow(board: BoardId, part: PartKind, wires: Wire[], switchClosed: boolean) {
  let state = { wires: [...wires], switchClosed };
  for (let i = 0; i < 12; i++) {
    const fix = nextFix(board, part, state);
    if (!fix) break;
    if (fix.kind === 'remove') state = { ...state, wires: state.wires.filter((w) => w.id !== fix.wireId) };
    if (fix.kind === 'add') state = { ...state, wires: [...state.wires, { id: `n${i}`, from: fix.from, to: fix.to }] };
    if (fix.kind === 'switch') state = { ...state, switchClosed: true };
  }
  return judge({ components: boardComponents(board, part), wires: state.wires, switchClosed: state.switchClosed });
}

describe('nextFix (두 번째 힌트: 직접 보여 주기)', () => {
  it('정답 모양이 회로판마다 있다 (버저는 빨간 선이 + 쪽인 것만)', () => {
    for (const part of ['bulb', 'buzzer', 'motor'] as const) {
      expect(solutions('A', part).length).toBeGreaterThan(0);
      expect(solutions('B', part).length).toBeGreaterThan(0);
    }
    expect(solutions('A', 'buzzer').length).toBeLessThan(solutions('A', 'bulb').length);
  });

  it('아무것도 없으면 전선 잇기부터 보여 준다', () => {
    expect(nextFix('A', 'bulb', { wires: [], switchClosed: false })?.kind).toBe('add');
  });

  it('연결은 맞고 스위치만 열려 있으면 스위치를 누르라고 한다', () => {
    const wires = W([['bat1.plus', 'load.a'], ['load.b', 'sw.a'], ['sw.b', 'bat1.minus']]);
    expect(nextFix('A', 'bulb', { wires, switchClosed: false })).toEqual({ kind: 'switch' });
  });

  it('전지 2개를 같은 극끼리 이었으면 그 전선을 지우라고 한다', () => {
    const wires = W([['bat1.plus', 'bat2.plus'], ['bat2.minus', 'load.a'], ['load.b', 'sw.a'], ['sw.b', 'bat1.minus']]);
    const fix = nextFix('B', 'bulb', { wires, switchClosed: true });
    expect(fix?.kind).toBe('remove');
  });

  it('버저를 반대로 이었으면 지우고 바르게 잇게 해서 결국 울린다', () => {
    const wires = W([['bat1.plus', 'load.b'], ['load.a', 'sw.a'], ['sw.b', 'bat1.minus']]);
    expect(nextFix('A', 'buzzer', { wires, switchClosed: true })?.kind).toBe('remove');
    expect(follow('A', 'buzzer', wires, true)).toMatchObject({ reason: 'OK', level: 1 });
  });

  it('맞게 이은 전선은 지우지 않는다 (스위치를 다른 쪽에 둔 고리도 정답)', () => {
    const wires = W([['bat1.plus', 'sw.a'], ['sw.b', 'load.a']]);
    expect(nextFix('A', 'motor', { wires, switchClosed: true })).toEqual({ kind: 'add', from: expect.any(String), to: expect.any(String) });
  });

  it('어떤 상태에서 시작해도 힌트를 따라 하면 작동한다', () => {
    const starts: [BoardId, PartKind, [string, string][]][] = [
      ['A', 'bulb', [['bat1.plus', 'bat1.minus']]],
      ['B', 'motor', [['bat1.plus', 'load.a'], ['load.b', 'load.a']]],
      ['B', 'buzzer', []],
    ];
    for (const [b, p, pairs] of starts) {
      expect(follow(b, p, W(pairs), false)).toMatchObject({ reason: 'OK' });
    }
  });

  it('끝까지의 단계: 버저를 반대로 이었으면 지우기 → 잇기 → … 순서로, 마지막엔 작동한다', () => {
    const wires = W([['bat1.plus', 'load.b'], ['load.a', 'sw.a'], ['sw.b', 'bat1.minus']]);
    const plan = planFixes('A', 'buzzer', { wires, switchClosed: false });
    expect(plan[0].kind).toBe('remove');
    expect(plan.at(-1)?.kind).toBe('switch');
    expect(follow('A', 'buzzer', wires, false)).toMatchObject({ reason: 'OK' });
  });

  it('이미 작동하면 할 일이 없다', () => {
    const wires = W([['bat1.plus', 'load.a'], ['load.b', 'sw.a'], ['sw.b', 'bat1.minus']]);
    expect(planFixes('A', 'bulb', { wires, switchClosed: true })).toEqual([]);
  });
});
