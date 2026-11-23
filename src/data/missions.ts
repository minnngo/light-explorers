// 미션 3개의 "로직" 설정. 화면 문구는 strings.ts에 있다.
// 정답 정보는 내부용이며 ④ 확인하기 전에는 화면에 쓰지 않는다.
import type { CompareChoice, MissionId, PartKind, PredictionChoice } from '@/lib/types';

export interface MissionConfig {
  id: MissionId;
  part: PartKind;
  /** (내부용) 예상 정답 */
  correctPrediction: PredictionChoice;
  /** (내부용) ○표 비교 정답 */
  correctCompare: CompareChoice;
  /** "어둡게 보기" 버튼은 미션 1에서만 보인다 */
  showDarkView: boolean;
  /** 8-1 선택 보충 "같은 극끼리 이어 보기" 도전 (지도서에 없는 활동이라 선택). 미션 1만 */
  hasChallenge: boolean;
}

/** 미션은 이 순서로만 열린다 (지도서 탐구 순서) */
export const MISSION_ORDER: readonly MissionId[] = ['m1', 'm2', 'm3'];

export const MISSIONS: Record<MissionId, MissionConfig> = {
  m1: { id: 'm1', part: 'bulb', correctPrediction: 'a', correctCompare: 'more', showDarkView: true, hasChallenge: true },
  m2: { id: 'm2', part: 'buzzer', correctPrediction: 'a', correctCompare: 'more', showDarkView: false, hasChallenge: false },
  m3: { id: 'm3', part: 'motor', correctPrediction: 'a', correctCompare: 'more', showDarkView: false, hasChallenge: false },
};

export function nextMission(id: MissionId): MissionId | null {
  const i = MISSION_ORDER.indexOf(id);
  return MISSION_ORDER[i + 1] ?? null;
}
