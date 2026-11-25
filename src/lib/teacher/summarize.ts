// 교사용 화면 집계 (명세서 11-2). 점수나 상·중·하를 매기지 않고, 교사가 판단할 근거만 모은다.
import { MISSION_ORDER } from '@/data/missions';
import { revivedCount } from '@/lib/flow/missionFlow';
import { studentOf } from '@/lib/store/reducer';
import type { AppState, MisconceptionKey, MissionId, MissionRecord, MissionStep, ScreenId, StudentFinal } from '@/lib/types';

/** 미션 하나에서 교사가 볼 근거 (11-1 학습지 기록 항목) */
export interface MissionEvidence {
  status: MissionRecord['status'];
  prediction: MissionRecord['prediction'];
  built: MissionRecord['built'];
  compare: MissionRecord['compare'];
  explanation: string;
  hintCount: number;
  attempts: number;
  challenge: NonNullable<MissionRecord['challenge']>;
}

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
  missions: Record<MissionId, MissionEvidence>;
  intro: AppState['intro'];
  final: AppState['final'];
  groupThought: string;
  misconception: AppState['final']['misconception'];
  selfEval: AppState['final']['selfEval'];
  /** 모둠으로 한 곳: 학생별 오개념 점검·스스로 평가 (혼자 한 모둠은 빈 목록) */
  students: StudentFinal[];
  /** 가치·태도 근거: 모둠이 글을 쓴 칸 수 / 전체 칸 수 */
  wroteCount: number;
  /** 혼자 한 모둠의 마무리 단계 (모둠으로 한 곳은 학생마다 students에 있다) */
  wrapupStep: number;
  writableCount: number;
  finished: boolean;
  updatedAt: string;
}

export interface ClassSummary {
  groups: GroupSummary[];
  /** 오개념 문항별 틀린 수 (혼자 한 모둠은 모둠 하나, 모둠으로 한 곳은 학생 한 명씩 센다) */
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
    missions: perMission((id) => {
      const m = state.missions[id];
      return {
        status: m.status,
        prediction: m.prediction,
        built: m.built,
        compare: m.compare,
        explanation: m.explanation,
        hintCount: m.hintCount,
        attempts: m.attempts,
        challenge: m.challenge ?? 'none',
      };
    }),
    intro: state.intro,
    final: state.final,
    groupThought: state.final.groupThought,
    misconception: state.final.misconception,
    selfEval: state.final.selfEval,
    // 예전 모양 기록(오개념·스스로 평가만 있던 때)도 빈 칸을 채워서 읽는다
    students: Object.entries(state.final.students ?? {}).map(([id, st]) => studentOf(state.final, { id, name: st?.name ?? '' })),
    ...writing(state),
    finished: state.finished,
    wrapupStep: state.wrapupStep,
    updatedAt,
  }));

  const keys: MisconceptionKey[] = ['q1', 'q2', 'q3'];
  const misconceptionWrong = Object.fromEntries(
    keys.map((k) => [k, groups.reduce((n, g) => n + (g.students.length > 0
      ? g.students.filter((st) => st.misconception[k] === 'wrong').length
      : Number(g.misconception[k] === 'wrong')), 0)]),
  ) as Record<MisconceptionKey, number>;
  const mostMissed = keys
    .filter((k) => misconceptionWrong[k] > 0)
    .sort((a, b) => misconceptionWrong[b] - misconceptionWrong[a]);

  return { groups, misconceptionWrong, mostMissed };
}

/** 모둠이 쓴 글 칸: 미션 이유 3칸 + 함께 생각 나누기 1칸 (선택 입력칸은 세지 않는다) */
function writing(state: AppState): { wroteCount: number; writableCount: number } {
  const texts = [...MISSION_ORDER.map((id) => state.missions[id].explanation), state.final.groupThought];
  return { wroteCount: texts.filter((t) => t.trim().length > 0).length, writableCount: texts.length };
}
