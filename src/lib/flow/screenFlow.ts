// S1(입장), S2(도입 컷), S5(마무리 7단계)에서 "다음"으로 넘어갈 수 있는 조건.
import type { AppState, FinalRecord } from '@/lib/types';

export const INTRO_CUT_COUNT = 5;
/** 마무리 화면 수: 번호가 붙는 5단계 + 마지막 마치기(엔딩, 번호 없음) */
export const WRAPUP_STEP_COUNT = 6;

/** S1: 모둠 이름 1글자 이상 + 안전 약속 3칸 모두 체크 */
export function canStart(groupName: string, safetyChecks: readonly boolean[]): boolean {
  return groupName.trim().length > 0 && safetyChecks.length === 3 && safetyChecks.every(Boolean);
}

/** S2: 컷 3은 떠올리기 문항, 컷 4는 예상 문항 2개를 골라야 넘어간다 */
export function canAdvanceIntro(state: AppState): boolean {
  switch (state.introCut) {
    case 2:
      return state.intro.recall !== null;
    case 3:
      return state.intro.fanReason !== null && state.intro.fanPredict !== null;
    default:
      return true;
  }
}

/** S5: 단계별로 "다음"을 누를 수 있는 조건 (혼자 할 때는 모둠 기록, 모둠으로 할 때는 학생 한 명의 기록) */
export function canAdvanceWrapupRecord(f: Omit<FinalRecord, 'students'>, step: number): boolean {
  switch (step) {
    case 1: // 확인하기: 세 질문에 모두 답해야 정리가 나타난다
      return Object.values(f.explain).every((v) => v !== null);
    case 2: // 적용하기: 한 번 고르면 정답을 보여 주고 넘어갈 수 있다 (맞든 틀리든)
      return f.check !== null;
    case 3: // 오개념 점검
      return Object.values(f.misconception).every((v) => v !== null);
    case 4: // 스스로 평가
      return f.selfEval !== null;
    default:
      return true;
  }
}

/** 혼자 할 때의 마무리 다음 단계 조건 */
export function canAdvanceWrapup(state: AppState): boolean {
  return canAdvanceWrapupRecord(state.final, state.wrapupStep);
}
