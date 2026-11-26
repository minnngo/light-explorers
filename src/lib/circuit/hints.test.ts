import { describe, expect, it } from 'vitest';
import { boardComponents } from '@/data/boards';
import { hintFor } from './hints';
import { judge } from './judge';
import { planFixes } from './nextFix';

const W = (pairs: [string, string][]) => pairs.map(([from, to], i) => ({ id: `w${i}`, from, to }));
const oneBattery = W([['bat1.plus', 'load.a'], ['load.b', 'sw.a'], ['sw.b', 'bat1.minus']]);

describe('hintFor', () => {
  it('B 회로판에 전지 1개만 이어 작동하면 ONE_BATTERY 힌트', () => {
    const r = judge({ components: boardComponents('B', 'bulb'), wires: oneBattery, switchClosed: true });
    expect(r).toMatchObject({ reason: 'OK', level: 1 });
    expect(hintFor(r, true, 2)).toBe('ONE_BATTERY');
  });

  it('A 회로판은 전지 1개로 작동하면 힌트 없음', () => {
    const r = judge({ components: boardComponents('A', 'bulb'), wires: oneBattery, switchClosed: true });
    expect(hintFor(r, true, 1)).toBeNull();
  });

  it('전지 1개 회로에서 스위치만 열려 있으면 먼저 스위치 힌트', () => {
    const r = judge({ components: boardComponents('B', 'bulb'), wires: oneBattery, switchClosed: false });
    expect(hintFor(r, false, 2)).toBe('SWITCH_OPEN');
  });

  it('전지 1개 회로의 시범은 두 번째 전지까지 이어 끝까지 안내한다', () => {
    const plan = planFixes('B', 'bulb', { wires: oneBattery, switchClosed: true });
    expect(plan.length).toBeGreaterThan(0);
    let wires = [...oneBattery];
    plan.forEach((f, i) => {
      if (f.kind === 'remove') wires = wires.filter((w) => w.id !== f.wireId);
      if (f.kind === 'add') wires = [...wires, { id: `n${i}`, from: f.from, to: f.to }];
    });
    expect(judge({ components: boardComponents('B', 'bulb'), wires, switchClosed: true })).toMatchObject({ reason: 'OK', level: 2 });
  });
});
