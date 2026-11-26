import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/lib/store/reducer';
import type { AppState } from '@/lib/types';
import { classStats, learnersOf } from './stats';
import { summarize } from './summarize';

function solo(name: string, patch: (s: AppState) => void): AppState {
  const s = { ...createInitialState(), groupId: name, groupName: name };
  s.missions = structuredClone(s.missions);
  s.final = structuredClone(s.final);
  patch(s);
  return s;
}

describe('교사용 한눈에 보기 통계', () => {
  it('미션 완료·예상 적중·비교 정답을 모둠 단위로 센다', () => {
    const a = solo('1모둠', (s) => {
      s.missions.m1 = { ...s.missions.m1, status: 'done', prediction: 'a', compare: 'more' };
    });
    const b = solo('2모둠', (s) => {
      s.missions.m1 = { ...s.missions.m1, prediction: 'b', compare: 'less' };
    });
    const st = classStats(summarize([{ state: a, updatedAt: 'x' }, { state: b, updatedAt: 'y' }]));
    expect(st.groups).toBe(2);
    expect(st.missionDone.m1).toEqual({ hit: 1, of: 2 });
    expect(st.predictionRight.m1).toEqual({ hit: 1, of: 2 });
    expect(st.compareRight.m1).toEqual({ hit: 1, of: 2 });
    expect(st.predictionRight.m2).toEqual({ hit: 0, of: 0 });
  });

  it('마무리는 사람 단위: 모둠으로 한 곳은 학생마다, 혼자 한 모둠은 하나로 센다', () => {
    const empty = createInitialState().final;
    const room = solo('3모둠', (s) => {
      s.final.students = {
        x: { ...empty, name: '민지', wrapupStep: 5, finished: true, selfEval: 'good',
          misconception: { q1: 'correct', q2: 'wrong', q3: null }, explain: { bulb: 'more', buzzer: 'less', motor: null }, check: 'brighter' },
        y: { ...empty, name: '지아', wrapupStep: 2, finished: false },
      };
    });
    const alone = solo('민수', (s) => {
      s.final.misconception = { q1: 'wrong', q2: null, q3: null };
    });
    const summary = summarize([{ state: room, updatedAt: 'x' }, { state: alone, updatedAt: 'y' }]);
    expect(learnersOf(summary.groups).map((l) => l.name)).toEqual(['민지', '지아', '민수']);
    const st = classStats(summary);
    expect(st.learners).toBe(3);
    expect(st.finishedLearners).toBe(1);
    expect(st.misconception.q1).toEqual({ hit: 1, of: 2 });
    expect(st.misconception.q2).toEqual({ hit: 0, of: 1 });
    expect(st.explain.bulb).toEqual({ hit: 1, of: 1 });
    expect(st.explain.buzzer).toEqual({ hit: 0, of: 1 });
    expect(st.check).toEqual({ hit: 1, of: 1 });
    expect(st.selfEval).toEqual({ good: 1, needHelp: 0, needPractice: 0, none: 2 });
    // 고른 답 분포: 오개념은 맞음/틀림을 정답으로 거꾸로 O·X로 센다 (q1 정답 X: 맞음 1 → X, 틀림 1 → O)
    expect(st.misconceptionPick.q1).toEqual({ O: 1, X: 1 });
    expect(st.explainPick.buzzer).toEqual({ more: 0, less: 1, same: 0 });
    expect(st.checkPick).toEqual({ brighter: 1, darker: 0 });
  });
});
