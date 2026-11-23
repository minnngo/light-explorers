// 교사용 화면 집계 (명세서 11-2). 점수나 상·중·하를 매기지 않고, 교사가 판단할 근거만 모은다.
import { MISSION_ORDER } from '@/data/missions';
import { revivedCount } from '@/lib/flow/missionFlow';
import type { AppState, MisconceptionKey, MissionId, MissionStep, ScreenId } from '@/lib/types';

export interface GroupSummary {
  groupId: string;
  groupName: string;
  screen: ScreenId;
  currentMission: MissionId | null;
  currentStep: MissionStep | null;
  revived: number;
  hintCount: Record<MissionId, number>;
  attempts: Record<MissionId, number>;
  explanations: Record<MissionId, string>;
  groupThought: string;
  misconception: AppState['final']['misconception'];
  selfEval: AppState['final']['selfEval'];
  updatedAt: string;
}

export interface ClassSummary {
  groups: GroupSummary[];
  /** 오개념 문항별 틀린 모둠 수 */
  misconceptionWrong: Record<MisconceptionKey, number>;
  /** 많이 틀린 문항 (틀린 모둠이 많은 순) */
  mostMissed: MisconceptionKey[];
}

const perMission = <T,>(fn: (id: MissionId) => T) =>
  Object.fromEntries(MISSION_ORDER.map((id) => [id, fn(id)])) as Record<MissionId, T>;

export function summarize(rows: { state: AppState; updatedAt: string }[]): ClassSummary {
  const groups = rows.map(({ state, updatedAt }) => ({
    groupId: state.groupId ?? '',
    groupName: state.groupName,
    screen: state.currentScreen,
    currentMission: state.currentMission,
    currentStep: state.currentMission ? state.missions[state.currentMission].step : null,
    revived: revivedCount(state),
    hintCount: perMission((id) => state.missions[id].hintCount),
    attempts: perMission((id) => state.missions[id].attempts),
    explanations: perMission((id) => state.missions[id].explanation),
    groupThought: state.final.groupThought,
    misconception: state.final.misconception,
    selfEval: state.final.selfEval,
    updatedAt,
  }));

  const keys: MisconceptionKey[] = ['q1', 'q2', 'q3'];
  const misconceptionWrong = Object.fromEntries(
    keys.map((k) => [k, groups.filter((g) => g.misconception[k] === 'wrong').length]),
  ) as Record<MisconceptionKey, number>;
  const mostMissed = keys
    .filter((k) => misconceptionWrong[k] > 0)
    .sort((a, b) => misconceptionWrong[b] - misconceptionWrong[a]);

  return { groups, misconceptionWrong, mostMissed };
}
