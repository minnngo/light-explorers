import { describe, expect, it } from 'vitest';
import { boardComponents } from '@/data/boards';
import { coachFor, DEMO_TERMINALS, nextStep, stepDone } from './tutorial';

const base = { wires: 0, switchClosed: false };

describe('회로 만들기 튜토리얼', () => {
  it('전선을 이으면 → 지우면 → 스위치를 누르면 다음 단계로 넘어간다', () => {
    expect(stepDone('connect', base, { wires: 0, switchClosed: false })).toBe(false);
    expect(stepDone('connect', base, { wires: 1, switchClosed: false })).toBe(true);
    expect(stepDone('remove', { wires: 1, switchClosed: false }, { wires: 0, switchClosed: false })).toBe(true);
    expect(stepDone('switch', base, { wires: 0, switchClosed: true })).toBe(true);
    expect(stepDone('go', base, { wires: 5, switchClosed: true })).toBe(false);
  });

  it('단계 순서: 잇기 → 지우기 → 스위치 → 스스로 해 보기', () => {
    expect(nextStep('connect')).toBe('remove');
    expect(nextStep('switch')).toBe('go');
    expect(nextStep('go')).toBeNull();
  });

  it('시범으로 잇는 단자는 세 미션의 A·B 회로판에 모두 있다', () => {
    for (const part of ['bulb', 'buzzer', 'motor'] as const) {
      for (const board of ['A', 'B'] as const) {
        const terminals = boardComponents(board, part).flatMap((c) => c.terminals);
        expect(terminals).toEqual(expect.arrayContaining([...DEMO_TERMINALS]));
      }
    }
    expect(coachFor('connect')?.terminals).toEqual(DEMO_TERMINALS);
    expect(coachFor('switch')?.switch).toBe(true);
  });
});
