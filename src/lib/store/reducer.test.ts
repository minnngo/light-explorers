import { describe, expect, it } from 'vitest';
import type { AppState, BoardId, Wire } from '@/lib/types';
import { type Action, createInitialState, reducer } from './reducer';

const play = (state: AppState, ...actions: Action[]) => actions.reduce(reducer, state);

let n = 0;
const wire = (board: BoardId, from: string, to: string): Action => ({
  type: 'ADD_WIRE',
  board,
  wire: { id: `w${n++}`, from, to } satisfies Wire,
  at: n,
});

const BUILD_BOTH: Action[] = [
  wire('A', 'bat1.plus', 'load.a'),
  wire('A', 'load.b', 'sw.a'),
  wire('A', 'sw.b', 'bat1.minus'),
  { type: 'TOGGLE_SWITCH', board: 'A', at: 10 },
  wire('B', 'bat1.plus', 'bat2.minus'),
  wire('B', 'bat2.plus', 'load.a'),
  wire('B', 'load.b', 'sw.a'),
  wire('B', 'sw.b', 'bat1.minus'),
  { type: 'TOGGLE_SWITCH', board: 'B', at: 11 },
];

function atMap(): AppState {
  return { ...createInitialState(), currentScreen: 'S3', groupId: 'g1', groupName: '반짝반짝 탐험대' };
}

describe('S1 → S2', () => {
  it('안전 약속에 동의하지 않으면 시작할 수 없다', () => {
    const s = reducer(createInitialState(), {
      type: 'START_EXPEDITION',
      groupId: 'g',
      groupName: '탐험대',
      safetyAgreed: false,
    });
    expect(s.currentScreen).toBe('S1');
  });
});

describe('미션 단계 진행 (명세서 7-2)', () => {
  it('잠긴 미션은 열 수 없다', () => {
    expect(reducer(atMap(), { type: 'OPEN_MISSION', mission: 'm2', at: 0 }).currentScreen).toBe('S3');
  });

  it('① 예상 단계에서는 회로판을 조작할 수 없다', () => {
    const s = play(atMap(), { type: 'OPEN_MISSION', mission: 'm1', at: 0 }, wire('A', 'bat1.plus', 'load.a'));
    expect(s.boards.A.wires).toHaveLength(0);
  });

  it('한 번 정한 예상은 바꿀 수 없다', () => {
    const s = play(
      atMap(),
      { type: 'OPEN_MISSION', mission: 'm1', at: 0 },
      { type: 'SET_PREDICTION', choice: 'b' },
      { type: 'SET_PREDICTION', choice: 'a' },
    );
    expect(s.missions.m1.prediction).toBe('b');
  });

  it('체크리스트가 다 채워지기 전에는 비교하러 갈 수 없다', () => {
    const s = play(
      atMap(),
      { type: 'OPEN_MISSION', mission: 'm1', at: 0 },
      { type: 'SET_PREDICTION', choice: 'a' },
      ...BUILD_BOTH.slice(0, 4), // A만 완성
      { type: 'GO_COMPARE' },
    );
    expect(s.missions.m1.step).toBe('build');
    expect(s.missions.m1.built).toEqual({ A: true, B: false });
  });

  it('이유를 10글자 이상 쓰기 전에는 확인하기로 넘어갈 수 없다 (POE 핵심 규칙)', () => {
    const s = play(
      atMap(),
      { type: 'OPEN_MISSION', mission: 'm1', at: 0 },
      { type: 'SET_PREDICTION', choice: 'a' },
      ...BUILD_BOTH,
      { type: 'GO_COMPARE' },
      { type: 'SET_COMPARE', choice: 'more' },
      { type: 'SET_EXPLANATION', text: '짧은 이유' },
      { type: 'CONFIRM' },
    );
    expect(s.missions.m1.step).toBe('compare');
  });

  it('미션 1 전체 흐름: 완료하면 미션 2가 열리고 지도로 돌아간다', () => {
    const s = play(
      atMap(),
      { type: 'OPEN_MISSION', mission: 'm1', at: 0 },
      { type: 'SET_PREDICTION', choice: 'a' },
      ...BUILD_BOTH,
      { type: 'GO_COMPARE' },
      { type: 'TOGGLE_SWITCH', board: 'A', at: 20 }, // ③에서는 회로판 조작이 막힌다
      { type: 'SET_COMPARE', choice: 'more' },
      { type: 'SET_EXPLANATION', text: '전지가 2개라서 전구가 더 밝았어요' },
      { type: 'CONFIRM' },
      { type: 'COMPLETE_MISSION', at: '2026-11-20T10:30:00' },
    );
    expect(s.boards.A.switchClosed).toBe(true);
    expect(s.currentScreen).toBe('S3');
    expect(s.missions.m1).toMatchObject({ status: 'done', built: { A: true, B: true }, attempts: 7 });
    expect(s.missions.m2.status).toBe('open');
    expect(s.missions.m3.status).toBe('locked');
  });

  it('세 미션을 끝내기 전에는 마무리로 갈 수 없다', () => {
    expect(reducer(atMap(), { type: 'GO_TO_WRAPUP' }).currentScreen).toBe('S3');
  });
});

const FINISH_M1: Action[] = [
  { type: 'OPEN_MISSION', mission: 'm1', at: 0 },
  { type: 'SET_PREDICTION', choice: 'a' },
  ...BUILD_BOTH,
  { type: 'GO_COMPARE' },
  { type: 'SET_COMPARE', choice: 'more' },
  { type: 'SET_EXPLANATION', text: '전지가 2개라서 전구가 더 밝았어요' },
  { type: 'CONFIRM' },
];

describe('완료한 미션 다시 보기 (명세서 7-1 하단 "지도로 돌아가기")', () => {
  it('완료한 미션을 다시 열면 완료할 때의 회로판이 보이고 조작은 막힌다', () => {
    const done = play(atMap(), ...FINISH_M1, { type: 'COMPLETE_MISSION', at: 't1' });
    const s = play(done, { type: 'OPEN_MISSION', mission: 'm1', at: 99 }, wire('A', 'bat1.plus', 'sw.a'));
    expect(s.currentScreen).toBe('S4');
    expect(s.boards.A.wires).toHaveLength(3);
    expect(play(s, { type: 'COMPLETE_MISSION', at: 't2' }).missions.m1.completedAt).toBe('t1');
    expect(play(s, { type: 'LEAVE_MISSION' }).currentScreen).toBe('S3');
  });

  it('진행 중인 미션에서는 지도로 돌아갈 수 없다', () => {
    const s = play(atMap(), { type: 'OPEN_MISSION', mission: 'm1', at: 0 }, { type: 'LEAVE_MISSION' });
    expect(s.currentScreen).toBe('S4');
  });
});

describe('8-1 선택 보충: 같은 극끼리 이어 보기', () => {
  it('④ 확인하기에서 도전을 시작하면 B 회로만 다시 만질 수 있고, 같은 극끼리 이어 불이 꺼지면 완료', () => {
    let s = play(atMap(), ...FINISH_M1, { type: 'START_CHALLENGE' });
    expect(s.missions.m1.challenge).toBe('active');
    const attempts = s.missions.m1.attempts;

    s = play(s, { type: 'TOGGLE_SWITCH', board: 'A', at: 30 });
    expect(s.boards.A.switchClosed).toBe(true); // A는 그대로

    const [first] = s.boards.B.wires; // bat1.plus - bat2.minus
    s = play(s, { type: 'REMOVE_WIRE', board: 'B', wireId: first.id, at: 31 });
    s = play(s, { type: 'REMOVE_WIRE', board: 'B', wireId: s.boards.B.wires[0].id, at: 32 }); // bat2.plus - load.a
    s = play(s, wire('B', 'bat1.plus', 'bat2.plus'), wire('B', 'bat2.minus', 'load.a'));
    expect(s.missions.m1.challenge).toBe('done');
    expect(s.missions.m1.attempts).toBe(attempts); // 도전 조작은 시도 횟수에 넣지 않는다
  });

  it('미션 2에는 도전이 없다', () => {
    const s = { ...atMap(), currentMission: 'm2' as const };
    s.missions = { ...s.missions, m2: { ...s.missions.m2, step: 'confirm' } };
    expect(reducer(s, { type: 'START_CHALLENGE' }).missions.m2.challenge).toBe('none');
  });
});

describe('S5 마무리', () => {
  it('오개념 점검은 처음 고른 답만 기록한다', () => {
    const s = play(
      { ...createInitialState(), currentScreen: 'S5', wrapupStep: 4 },
      { type: 'ANSWER_MISCONCEPTION', key: 'q1', choice: 'O' },
      { type: 'ANSWER_MISCONCEPTION', key: 'q1', choice: 'X' },
    );
    expect(s.final.misconception.q1).toBe('wrong');
  });

  it('확인해요에서 맞는 답을 고르기 전에는 다음으로 갈 수 없다', () => {
    const base = { ...createInitialState(), currentScreen: 'S5' as const, wrapupStep: 3 };
    expect(play(base, { type: 'UPDATE_FINAL', patch: { check: 'darker' } }, { type: 'NEXT_WRAPUP_STEP' }).wrapupStep).toBe(3);
    expect(play(base, { type: 'UPDATE_FINAL', patch: { check: 'brighter' } }, { type: 'NEXT_WRAPUP_STEP' }).wrapupStep).toBe(4);
  });
});
