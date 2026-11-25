// S1(입장), S2(도입 컷), S5(마무리 7단계)에서 "다음"으로 넘어갈 수 있는 조건.
import type { AppState, StudentFinal } from '@/lib/types';

export const INTRO_CUT_COUNT = 5;
export const WRAPUP_STEP_COUNT = 7;

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

/** S5: 단계별로 "다음"을 누를 수 있는 조건 */
/**
 * 마무리 다음 단계로 갈 수 있는지.
 * 오개념 점검·스스로 평가는 모둠으로 할 때 학생마다 따로 한다: students(지금 들어와 있는 학생 id)가 모두 답해야 한다.
 * 화면에서는 지금 들어와 있는 학생을 넘기고, reducer에서는 기록이 있는 학생을 본다.
 */
export function canAdvanceWrapup(state: AppState, students?: readonly string[]): boolean {
  const f = state.final;
  const ids = students ?? Object.keys(f.students ?? {});
  const each = (ok: (s: StudentFinal | undefined) => boolean) => ids.every((id) => ok(f.students?.[id]));
  switch (state.wrapupStep) {
    case 1: // 함께 생각을 나누기
      return f.groupThought.trim().length > 0;
    case 2: // 설명하기: 세 질문에 모두 답해야 정리가 나타난다
      return Object.values(f.explain).every((v) => v !== null);
    case 3: // 확인해요: 맞는 답을 골라야 넘어간다
      return f.check === 'brighter';
    case 4: // 오개념 점검
      if (ids.length > 0) return each((st) => !!st && Object.values(st.misconception).every((v) => v !== null));
      return Object.values(f.misconception).every((v) => v !== null);
    case 5: // 스스로 평가
      if (ids.length > 0) return each((st) => !!st && st.selfEval !== null);
      return f.selfEval !== null;
    default:
      return true;
  }
}
