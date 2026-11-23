import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/lib/store/reducer';
import type { AppState } from '@/lib/types';
import { summarize } from './summarize';

function group(name: string, misconception: AppState['final']['misconception']): AppState {
  const s = createInitialState();
  return { ...s, groupId: name, groupName: name, final: { ...s.final, misconception } };
}

describe('summarize (교사용 집계)', () => {
  it('많이 틀린 오개념 문항을 틀린 모둠이 많은 순으로 모은다', () => {
    const summary = summarize([
      { state: group('가', { q1: 'wrong', q2: 'wrong', q3: 'correct' }), updatedAt: '' },
      { state: group('나', { q1: 'correct', q2: 'wrong', q3: 'correct' }), updatedAt: '' },
      { state: group('다', { q1: null, q2: null, q3: null }), updatedAt: '' },
    ]);
    expect(summary.misconceptionWrong).toEqual({ q1: 1, q2: 2, q3: 0 });
    expect(summary.mostMissed).toEqual(['q2', 'q1']);
    expect(summary.groups.map((g) => g.groupName)).toEqual(['가', '나', '다']);
  });
});
