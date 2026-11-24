// 8-1 도전 "같은 극끼리 이어 보기"를 초등학생이 따라 할 수 있게 단계로 나눈다.
// 단계는 B 회로판의 지금 모습에서 바로 계산한다 (따로 저장하지 않는다).
//   0. 두 전지 사이의 전선(+ ↔ −)을 지운다
//   1. 두 전지의 같은 극끼리(+ ↔ + 또는 − ↔ −) 전선으로 잇는다
//   2. 남은 끝이 전구·스위치로 이어지게 고쳐서 고리를 만든다 (판정이 SAME_POLE)
//   3. 스위치를 닫고 전구를 본다 → 도전 완료 (reducer가 challenge: 'done'으로 바꾼다)
import type { CoachMark } from '@/lib/tutorial/tutorial';
import type { BoardState, JudgeResult } from '@/lib/types';

export type ChallengeStep = 0 | 1 | 2 | 3;

/** 단계(힌트) 수 */
export const CHALLENGE_HINT_COUNT = 4;

const OPPOSITE: readonly [string, string][] = [['bat1.plus', 'bat2.minus'], ['bat1.minus', 'bat2.plus']];
const SAME: readonly [string, string][] = [['bat1.plus', 'bat2.plus'], ['bat1.minus', 'bat2.minus']];

const linked = (board: BoardState, [a, b]: readonly [string, string]) =>
  board.wires.some((w) => (w.from === a && w.to === b) || (w.from === b && w.to === a));

export function challengeStep(board: BoardState, result: JudgeResult): ChallengeStep {
  if (OPPOSITE.some((pair) => linked(board, pair))) return 0;
  if (!SAME.some((pair) => linked(board, pair))) return 1;
  if (result.reason !== 'SAME_POLE') return 2;
  return 3;
}

/** 단계마다 B 회로판 위에 보여 줄 시범: 지울 전선 반짝 / 이을 단자 / 누를 스위치 */
export function challengeCoach(step: ChallengeStep, board: BoardState): CoachMark | undefined {
  switch (step) {
    case 0:
      return { wires: true, onlyWires: OPPOSITE }; // 두 전지 사이 전선만 반짝
    case 1:
      return { terminals: ['bat1.plus', 'bat2.plus'] };
    case 2:
      return fixLoopCoach(board);
    case 3:
      return { switch: true };
  }
}

const OUTSIDE = ['load.a', 'load.b', 'sw.a', 'sw.b'] as const;
const isOutside = (t: string) => (OUTSIDE as readonly string[]).includes(t);

/**
 * 3단계 시범. 같은 극끼리 이은 쪽(예: + ↔ +)의 끝은 전구·스위치와 이어지면 안 되고, 반대쪽 끝(−)이 이어져야 한다.
 *  1) 같은 극 끝에서 전구·스위치로 가는 전선이 있으면 그 전선만 반짝 (지우기)
 *  2) 없으면 비어 있는 반대쪽 전지 끝 → 비어 있는 전구·스위치 단자를 잇는 커서 시범
 */
export function fixLoopCoach(board: BoardState): CoachMark | undefined {
  const joined = SAME.find((pair) => linked(board, pair));
  if (!joined) return undefined;
  const pole = joined[0].endsWith('plus') ? 'plus' : 'minus';
  const other = pole === 'plus' ? 'minus' : 'plus';
  const wrong = board.wires
    .filter((w) => (w.from.endsWith(pole) && w.from.startsWith('bat') && isOutside(w.to))
      || (w.to.endsWith(pole) && w.to.startsWith('bat') && isOutside(w.from)))
    .map((w) => [w.from, w.to] as const);
  if (wrong.length) return { wires: true, onlyWires: wrong };
  const used = new Set(board.wires.flatMap((w) => [w.from, w.to]));
  const freeBattery = [`bat1.${other}`, `bat2.${other}`].find((t) => !board.wires.some(
    (w) => (w.from === t && isOutside(w.to)) || (w.to === t && isOutside(w.from))));
  const freeOutside = OUTSIDE.find((t) => !used.has(t));
  return freeBattery && freeOutside ? { terminals: [freeBattery, freeOutside] } : undefined;
}

/** 회로판 시범은 그 단계의 힌트를 연 뒤에만 보여 준다 (정답을 먼저 보여 주지 않게) */
export function challengeBoardCoach(board: BoardState, result: JudgeResult, opened: number): CoachMark | undefined {
  const step = challengeStep(board, result);
  return step < opened ? challengeCoach(step, board) : undefined;
}
