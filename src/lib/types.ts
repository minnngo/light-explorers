// 앱 전체에서 쓰는 타입. 명세서 11장의 저장 데이터 틀을 그대로 옮겼다.

export type ScreenId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
export type MissionId = 'm1' | 'm2' | 'm3';
export type BoardId = 'A' | 'B';

/** 미션마다 바뀌는 부품. 전구(가로등) / 버저(안내 종) / 날개 달린 전동기(풍차) */
export type PartKind = 'bulb' | 'buzzer' | 'motor';
export type ComponentType = 'battery' | 'switch' | PartKind;

export type MissionStatus = 'locked' | 'open' | 'done';
/** 미션 안의 4단계: ① 예상 → ② 만들기 → ③ 비교·이유 → ④ 확인 */
export type MissionStep = 'predict' | 'build' | 'compare' | 'confirm';

/** 예상 선택지 (가)(나)(다) */
export type PredictionChoice = 'a' | 'b' | 'c';
/** ③ 비교하기 ○표: 어둡다/밝다, 작다/크다, 느리게/빠르게 → less/more 로 통일 */
export type CompareChoice = 'less' | 'more';
/** S5 설명하기 답 */
export type ExplainChoice = 'more' | 'less' | 'same';

export type Level = 0 | 1 | 2;

// ───────────── 회로 ─────────────

/** "부품id.단자이름" 형식. 예: bat1.plus, load.a, sw.b */
export type TerminalId = string;

/**
 * 단자 2개짜리 부품. terminals[0] → terminals[1] 방향을 "정방향"으로 본다.
 * - 전지: [plus, minus]
 * - 버저: [a = 빨간 선(+), b = 검은 선(−)]
 * - 전구, 전동기, 스위치: [a, b]
 */
export interface CircuitComponent {
  id: string;
  type: ComponentType;
  terminals: readonly [TerminalId, TerminalId];
}

export interface Wire {
  id: string;
  from: TerminalId;
  to: TerminalId;
}

export interface BoardState {
  wires: Wire[];
  switchClosed: boolean;
  /** 마지막으로 연결이나 스위치가 바뀐 시각(ms). 힌트 타이머 기준 */
  lastChangedAt: number;
}

export type JudgeReason =
  | 'OK'
  | 'NO_WIRES' // 연결된 선이 하나도 없다
  | 'BROKEN' // 고리가 끊김
  | 'SWITCH_OPEN' // 연결은 맞지만 스위치가 열림
  | 'SWITCH_MISSING' // 스위치를 빼고 고리를 만듦 (명세에 없음, 추가)
  | 'SAME_POLE' // 전지 2개가 같은 극끼리 이어짐
  | 'BUZZER_REVERSED' // 버저 빨간 선이 − 쪽에 이어짐
  | 'SHORT_CIRCUIT'; // 부품을 거치지 않고 전지 양 끝이 이어짐 (명세에 없음, 추가)

export interface JudgeResult {
  /** 지금 실제 작동 레벨 (스위치 상태 반영) */
  level: Level;
  /** 스위치를 닫았다면 나왔을 레벨. 체크리스트 1·2번 판정에 쓴다 */
  wiredLevel: Level;
  reason: JudgeReason;
  /** 전동기 날개가 도는 방향. 작동하지 않으면 null */
  motorDirection: 'cw' | 'ccw' | null;
  /** 작동하는 고리 안에 들어간 전지 수 */
  batteriesInLoop: number;
}

// ───────────── 학습 기록 (명세서 11장) ─────────────

export interface IntroRecord {
  recall: 'correct' | 'wrong' | null;
  fanReason: 'needAmount' | 'moreIsBetter' | 'unsure' | null;
  fanPredict: 'one' | 'two' | 'same' | null;
}

export interface MissionRecord {
  status: MissionStatus;
  step: MissionStep;
  prediction: PredictionChoice | null;
  /** 두 회로를 한 번이라도 정상 연결했는지 (한 번 true가 되면 유지) */
  built: Record<BoardId, boolean>;
  compare: CompareChoice | null;
  explanation: string;
  hintCount: number;
  /** 전선을 잇거나 지운 횟수 */
  attempts: number;
  completedAt: string | null;
}

export type OX = 'O' | 'X';
export type MisconceptionKey = 'q1' | 'q2' | 'q3';

export interface FinalRecord {
  groupThought: string;
  explain: Record<PartKind, ExplainChoice | null>;
  revisitFan: string;
  check: 'brighter' | 'darker' | null;
  /** 오개념 점검 결과. 점수로 보여 주지 않고 교사용 기록에만 쓴다 */
  misconception: Record<MisconceptionKey, 'correct' | 'wrong' | null>;
  selfEval: 'good' | 'needHelp' | 'needPractice' | null;
  toCharacter: string;
}

export interface AppState {
  /** 저장·동기화용 모둠 id (탐험 시작 시 생성) */
  groupId: string | null;
  groupName: string;
  currentScreen: ScreenId;
  introCut: number;
  intro: IntroRecord;
  currentMission: MissionId | null;
  missions: Record<MissionId, MissionRecord>;
  /** 지금 열린 미션의 회로판 A, B */
  boards: Record<BoardId, BoardState>;
  wrapupStep: number;
  final: FinalRecord;
  finished: boolean;
}
