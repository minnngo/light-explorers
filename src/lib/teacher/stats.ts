// 교사용 "한눈에 보기" 통계. 화면과 따로 두어 테스트할 수 있게 한다.
// 점수나 상·중·하를 매기지 않고, 맞힌 수·답한 수 같은 근거 숫자만 센다.
import { MISSION_ORDER, MISSIONS } from '@/data/missions';
import type { FinalRecord, MisconceptionKey, MissionId, PartKind } from '@/lib/types';
import type { ClassSummary, GroupSummary } from './summarize';

export interface Rate {
  /** 맞힌(해낸) 수 */
  hit: number;
  /** 답한(셀 수 있는) 수 */
  of: number;
}

/** 마무리 기록 한 줄: 모둠으로 한 곳은 학생 한 명, 혼자 한 모둠은 모둠 하나 */
export interface Learner {
  key: string;
  group: string;
  name: string;
  final: Omit<FinalRecord, 'students'>;
  wrapupStep: number;
  finished: boolean;
}

export interface ClassStats {
  groups: number;
  learners: number;
  finishedLearners: number;
  /** 미션별 완료한 모둠 수 (of = 모둠 수) */
  missionDone: Record<MissionId, Rate>;
  /** 미션별 예상이 실제 결과와 같았던 모둠 (of = 예상을 정한 모둠) */
  predictionRight: Record<MissionId, Rate>;
  /** 미션별 ○표 비교를 맞힌 모둠 (of = 고른 모둠) */
  compareRight: Record<MissionId, Rate>;
  /** 마무리 오개념 문항별 맞힌 사람 (of = 답한 사람) */
  misconception: Record<MisconceptionKey, Rate>;
  /** 마무리 확인하기 문항별 맞힌 사람 */
  explain: Record<PartKind, Rate>;
  /** 마무리 적용하기 */
  check: Rate;
  /** 스스로 평가 분포 */
  selfEval: Record<'good' | 'needHelp' | 'needPractice' | 'none', number>;
  /** 힌트를 많이 본 모둠 (많은 순) */
  hintsByGroup: { group: string; hints: number; attempts: number }[];
}

const MIS_KEYS: MisconceptionKey[] = ['q1', 'q2', 'q3'];
const PARTS: PartKind[] = ['bulb', 'buzzer', 'motor'];
const rate = (): Rate => ({ hit: 0, of: 0 });

/** 마무리 기록을 사람 단위로 펼친다 */
export function learnersOf(groups: GroupSummary[]): Learner[] {
  return groups.flatMap((g): Learner[] => {
    if (g.students.length > 0) {
      return g.students.map((st, i) => ({
        key: `${g.groupId}:${i}`, group: g.groupName, name: st.name, final: st, wrapupStep: st.wrapupStep, finished: st.finished,
      }));
    }
    return [{ key: g.groupId, group: g.groupName, name: g.groupName, final: g.final, wrapupStep: g.wrapupStep, finished: g.finished }];
  });
}

export function classStats(summary: ClassSummary): ClassStats {
  const { groups } = summary;
  const learners = learnersOf(groups);
  const per = <T,>(keys: readonly string[], make: () => T) =>
    Object.fromEntries(keys.map((k) => [k, make()])) as Record<string, T>;

  const missionDone = per(MISSION_ORDER, rate) as Record<MissionId, Rate>;
  const predictionRight = per(MISSION_ORDER, rate) as Record<MissionId, Rate>;
  const compareRight = per(MISSION_ORDER, rate) as Record<MissionId, Rate>;
  for (const g of groups) {
    for (const id of MISSION_ORDER) {
      const m = g.missions[id];
      missionDone[id].of++;
      if (m.status === 'done') missionDone[id].hit++;
      if (m.prediction) {
        predictionRight[id].of++;
        if (m.prediction === MISSIONS[id].correctPrediction) predictionRight[id].hit++;
      }
      if (m.compare) {
        compareRight[id].of++;
        if (m.compare === MISSIONS[id].correctCompare) compareRight[id].hit++;
      }
    }
  }

  const misconception = per(MIS_KEYS, rate) as Record<MisconceptionKey, Rate>;
  const explain = per(PARTS, rate) as Record<PartKind, Rate>;
  const check = rate();
  const selfEval = { good: 0, needHelp: 0, needPractice: 0, none: 0 };
  for (const l of learners) {
    for (const k of MIS_KEYS) {
      const r = l.final.misconception[k];
      if (r) {
        misconception[k].of++;
        if (r === 'correct') misconception[k].hit++;
      }
    }
    for (const p of PARTS) {
      const v = l.final.explain[p];
      if (v) {
        explain[p].of++;
        if (v === 'more') explain[p].hit++; // 세 질문 모두 "전지 2개가 더 ~했어요"가 맞다
      }
    }
    if (l.final.check) {
      check.of++;
      if (l.final.check === 'brighter') check.hit++;
    }
    selfEval[l.final.selfEval ?? 'none']++;
  }

  const hintsByGroup = groups
    .map((g) => ({
      group: g.groupName,
      hints: MISSION_ORDER.reduce((n, id) => n + g.hintCount[id], 0),
      attempts: MISSION_ORDER.reduce((n, id) => n + g.attempts[id], 0),
    }))
    .sort((a, b) => b.hints - a.hints);

  return {
    groups: groups.length,
    learners: learners.length,
    finishedLearners: learners.filter((l) => l.finished).length,
    missionDone, predictionRight, compareRight, misconception, explain, check, selfEval, hintsByGroup,
  };
}
