// 미션 화면(S4)의 단계 진행 규칙 (명세서 7-2).
// "이유를 쓰기 전에는 정답·원리를 보여 주지 않는다"는 POE 규칙은 여기 한 곳에서만 판단한다.
// reducer(실제 상태 변경)와 UI(버튼 활성화)가 모두 이 함수들을 쓴다.
import { boardComponents, REQUIRED_LEVEL } from '@/data/boards';
import { MISSION_ORDER, MISSIONS } from '@/data/missions';
import { judge } from '@/lib/circuit/judge';
import type { AppState, BoardId, BoardState, JudgeResult, MissionRecord, PartKind } from '@/lib/types';

/** 이유 입력 최소 글자 수 (명세서: 10글자는 임시 값) */
export const MIN_EXPLANATION_LENGTH = 10;

export function judgeBoard(part: PartKind, board: BoardId, state: BoardState): JudgeResult {
  return judge({
    components: boardComponents(board, part),
    wires: state.wires,
    switchClosed: state.switchClosed,
  });
}

export function currentResults(state: AppState): Record<BoardId, JudgeResult> | null {
  if (!state.currentMission) return null;
  const part = MISSIONS[state.currentMission].part;
  return { A: judgeBoard(part, 'A', state.boards.A), B: judgeBoard(part, 'B', state.boards.B) };
}

/**
 * 체크리스트 3칸. 학생이 누르는 것이 아니라 판정 결과로 자동 체크된다.
 *  1) A 회로 연결 완료  2) B 회로를 서로 다른 극끼리 연결 완료  3) 두 회로 모두 스위치를 닫고 작동 중
 */
export function checklist(results: Record<BoardId, JudgeResult>): readonly [boolean, boolean, boolean] {
  return [
    results.A.wiredLevel >= REQUIRED_LEVEL.A,
    results.B.wiredLevel >= REQUIRED_LEVEL.B,
    results.A.level >= 1 && results.B.level >= 1,
  ];
}

export function canGoCompare(state: AppState): boolean {
  const results = currentResults(state);
  return results !== null && checklist(results).every(Boolean);
}

/** ③ → ④: ○표를 고르고 이유를 충분히 썼을 때만 */
export function canConfirm(record: MissionRecord): boolean {
  return record.compare !== null && record.explanation.trim().length >= MIN_EXPLANATION_LENGTH;
}

export function revivedCount(state: AppState): number {
  return MISSION_ORDER.filter((id) => state.missions[id].status === 'done').length;
}

export function allMissionsDone(state: AppState): boolean {
  return revivedCount(state) === MISSION_ORDER.length;
}
