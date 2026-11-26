import { describe, expect, it } from 'vitest';
import { byGroupName } from './classGroups';
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

  it('미션별 근거와 글을 쓴 칸 수를 모은다', () => {
    const s = createInitialState();
    const state: AppState = {
      ...s,
      groupId: 'g',
      missions: { ...s.missions, m1: { ...s.missions.m1, explanation: '전지가 2개라서 더 밝아요', hintCount: 2 } },
    };
    const [g] = summarize([{ state, updatedAt: '' }]).groups;
    expect(g.missions.m1).toMatchObject({ hintCount: 2, challenge: 'none', built: { A: false, B: false } });
    expect(g.wroteCount).toBe(1);
    expect(g.writableCount).toBe(3);
  });
});

describe('모둠 이름 순서', () => {
  it('숫자는 크기대로 (1모둠, 2모둠, … 10모둠)', () => {
    const names = ['4모둠', '10모둠', '1모둠', '3모둠', '2모둠'];
    expect([...names].sort(byGroupName((n) => n))).toEqual(['1모둠', '2모둠', '3모둠', '4모둠', '10모둠']);
  });
});

describe('예전 모양 학생 기록', () => {
  it('오개념·스스로 평가만 있던 학생 기록도 빈 칸을 채워서 읽는다', () => {
    const s = createInitialState();
    const old = {
      ...s, groupId: 'g', groupName: '1모둠',
      final: { ...s.final, students: { a: { name: '민지', misconception: { q1: 'correct', q2: null, q3: null }, selfEval: 'good' } } },
    } as unknown as AppState;
    const st = summarize([{ state: old, updatedAt: 'x' }]).groups[0].students[0];
    expect(st.name).toBe('민지');
    expect(st.misconception.q1).toBe('correct');
    expect(st.explain).toEqual({ bulb: null, buzzer: null, motor: null });
    expect(st.groupThought).toBe('');
  });
});
