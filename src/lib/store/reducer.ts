// 앱 상태는 이 reducer로만 바꾼다.
//
// 규칙: reducer는 결정적이어야 한다. 시각(at), id 같은 값은 action에 담아서 보내고
// reducer 안에서 Date.now()나 Math.random()을 부르지 않는다.
// 그래야 3단계 실시간 동기화에서 같은 action을 모든 기기의 reducer에 넣었을 때 화면이 똑같아진다.
import { boardComponents, REQUIRED_LEVEL } from '@/data/boards';
import { MISSION_ORDER, MISSIONS, nextMission } from '@/data/missions';
import { S5 } from '@/data/strings';
import { canConfirm, canGoCompare, judgeBoard } from '@/lib/flow/missionFlow';
import { canAdvanceIntro, canAdvanceWrapup, INTRO_CUT_COUNT, WRAPUP_STEP_COUNT } from '@/lib/flow/screenFlow';
import type {
  AppState,
  BoardId,
  BoardState,
  CompareChoice,
  ExplainChoice,
  FinalRecord,
  IntroRecord,
  MisconceptionKey,
  MissionId,
  MissionRecord,
  OX,
  PartKind,
  PredictionChoice,
  ScreenId,
  StoryKey,
  Wire,
} from '@/lib/types';

export type Action =
  // S1
  | { type: 'START_EXPEDITION'; groupId: string; groupName: string; safetyAgreed: boolean; roomCode?: string | null }
  // S2
  | { type: 'ANSWER_RECALL'; correct: boolean }
  | { type: 'ANSWER_FAN_REASON'; value: NonNullable<IntroRecord['fanReason']> }
  | { type: 'ANSWER_FAN_PREDICT'; value: NonNullable<IntroRecord['fanPredict']> }
  | { type: 'NEXT_INTRO_CUT' }
  // S3
  | { type: 'OPEN_MISSION'; mission: MissionId; at: number }
  | { type: 'LEAVE_MISSION' }
  | { type: 'GO_TO_WRAPUP' }
  | { type: 'SEE_STORY'; key: StoryKey }
  // S4
  | { type: 'SET_PREDICTION'; choice: PredictionChoice }
  | { type: 'ADD_WIRE'; board: BoardId; wire: Wire; at: number }
  | { type: 'REMOVE_WIRE'; board: BoardId; wireId: string; at: number }
  | { type: 'TOGGLE_SWITCH'; board: BoardId; at: number }
  | { type: 'GO_COMPARE' }
  | { type: 'BACK_TO_BUILD'; at: number }
  | { type: 'SET_COMPARE'; choice: CompareChoice }
  | { type: 'SET_EXPLANATION'; text: string }
  | { type: 'CONFIRM' }
  | { type: 'COMPLETE_MISSION'; at: string }
  | { type: 'HINT_SHOWN' }
  | { type: 'START_CHALLENGE' }
  // S5
  | { type: 'UPDATE_FINAL'; patch: Partial<Pick<FinalRecord, 'groupThought' | 'revisitFan' | 'check' | 'selfEval' | 'toCharacter'>> }
  | { type: 'ANSWER_EXPLAIN'; part: PartKind; choice: ExplainChoice }
  | { type: 'ANSWER_MISCONCEPTION'; key: MisconceptionKey; choice: OX }
  | { type: 'NEXT_WRAPUP_STEP' }
  | { type: 'FINISH' }
  // 저장·동기화
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'RESET' };

const emptyBoard = (at: number): BoardState => ({ wires: [], switchClosed: false, lastChangedAt: at });

const emptyMission = (status: MissionRecord['status']): MissionRecord => ({
  status,
  step: 'predict',
  prediction: null,
  built: { A: false, B: false },
  compare: null,
  explanation: '',
  hintCount: 0,
  attempts: 0,
  completedAt: null,
  challenge: 'none',
});

export function createInitialState(): AppState {
  return {
    groupId: null,
    groupName: '',
    roomCode: null,
    currentScreen: 'S1',
    introCut: 0,
    storySeen: [],
    intro: { recall: null, fanReason: null, fanPredict: null },
    currentMission: null,
    missions: { m1: emptyMission('open'), m2: emptyMission('locked'), m3: emptyMission('locked') },
    boards: { A: emptyBoard(0), B: emptyBoard(0) },
    wrapupStep: 0,
    final: {
      groupThought: '',
      explain: { bulb: null, buzzer: null, motor: null },
      revisitFan: '',
      check: null,
      misconception: { q1: null, q2: null, q3: null },
      selfEval: null,
      toCharacter: '',
    },
    finished: false,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // ───── S1 ─────
    case 'START_EXPEDITION': {
      if (state.currentScreen !== 'S1') return state;
      if (!action.safetyAgreed || action.groupName.trim().length === 0) return state;
      return {
        ...state,
        groupId: action.groupId,
        groupName: action.groupName.trim(),
        roomCode: action.roomCode ?? null,
        currentScreen: 'S2',
      };
    }

    // ───── S2 ─────
    case 'ANSWER_RECALL':
      // 첫 번째 답을 기록한다 (다시 골라도 기록은 바뀌지 않음)
      return state.intro.recall
        ? state
        : { ...state, intro: { ...state.intro, recall: action.correct ? 'correct' : 'wrong' } };
    case 'ANSWER_FAN_REASON':
      return { ...state, intro: { ...state.intro, fanReason: action.value } };
    case 'ANSWER_FAN_PREDICT':
      return { ...state, intro: { ...state.intro, fanPredict: action.value } };
    case 'NEXT_INTRO_CUT': {
      if (state.currentScreen !== 'S2' || !canAdvanceIntro(state)) return state;
      if (state.introCut >= INTRO_CUT_COUNT - 1) return goTo(state, 'S3');
      return { ...state, introCut: state.introCut + 1 };
    }

    // ───── S3 ─────
    case 'OPEN_MISSION': {
      const m = state.missions[action.mission];
      if (m.status === 'locked') return state;
      if (m.status === 'done') {
        // 완료한 미션은 다시 열어 결과만 볼 수 있다 (④ 확인 단계, 회로판 조작 불가)
        return {
          ...state,
          currentScreen: 'S4',
          currentMission: action.mission,
          boards: m.finalBoards ?? { A: emptyBoard(action.at), B: emptyBoard(action.at) },
        };
      }
      return {
        ...state,
        currentScreen: 'S4',
        currentMission: action.mission,
        boards: { A: emptyBoard(action.at), B: emptyBoard(action.at) },
      };
    }
    case 'SEE_STORY': {
      const seen = state.storySeen ?? [];
      return seen.includes(action.key) ? state : { ...state, storySeen: [...seen, action.key] };
    }
    case 'LEAVE_MISSION': {
      // "지도로 돌아가기"는 완료한 미션에서만 (명세서 7-1 하단)
      const id = state.currentMission;
      if (!id || state.missions[id].status !== 'done') return state;
      return { ...state, currentMission: null, currentScreen: 'S3' };
    }
    case 'GO_TO_WRAPUP':
      return MISSION_ORDER.every((id) => state.missions[id].status === 'done') ? goTo(state, 'S5') : state;

    // ───── S4 ─────
    case 'SET_PREDICTION':
      // 한 번 정한 예상은 바꿀 수 없다
      return updateMission(state, 'predict', (m) => ({ ...m, prediction: action.choice, step: 'build' }));

    case 'ADD_WIRE': {
      const { board, wire } = action;
      if (!isEditable(state, board) || !isValidWire(state, board, wire)) return state;
      return applyBoardChange(state, board, action.at, (b) => ({ ...b, wires: [...b.wires, wire] }), true);
    }
    case 'REMOVE_WIRE': {
      if (!isEditable(state, action.board)) return state;
      if (!state.boards[action.board].wires.some((w) => w.id === action.wireId)) return state;
      return applyBoardChange(
        state,
        action.board,
        action.at,
        (b) => ({ ...b, wires: b.wires.filter((w) => w.id !== action.wireId) }),
        true,
      );
    }
    case 'TOGGLE_SWITCH':
      if (!isEditable(state, action.board)) return state;
      return applyBoardChange(state, action.board, action.at, (b) => ({ ...b, switchClosed: !b.switchClosed }), false);

    case 'GO_COMPARE':
      if (!canGoCompare(state)) return state;
      return updateMission(state, 'build', (m) => ({ ...m, step: 'compare' }));
    case 'BACK_TO_BUILD':
      return updateMission(state, 'compare', (m) => ({ ...m, step: 'build' }));
    case 'SET_COMPARE':
      return updateMission(state, 'compare', (m) => ({ ...m, compare: action.choice }));
    case 'SET_EXPLANATION':
      return updateMission(state, 'compare', (m) => ({ ...m, explanation: action.text }));
    case 'CONFIRM':
      return updateMission(state, 'compare', (m) => (canConfirm(m) ? { ...m, step: 'confirm' } : m));

    case 'COMPLETE_MISSION': {
      const id = state.currentMission;
      if (!id || state.missions[id].step !== 'confirm' || state.missions[id].status === 'done') return state;
      const missions = {
        ...state.missions,
        [id]: { ...state.missions[id], status: 'done' as const, completedAt: action.at, finalBoards: state.boards },
      };
      const next = nextMission(id);
      if (next && missions[next].status === 'locked') missions[next] = { ...missions[next], status: 'open' };
      return { ...state, missions, currentMission: null, currentScreen: 'S3' };
    }
    case 'HINT_SHOWN': {
      const id = state.currentMission;
      if (!id) return state;
      const m = state.missions[id];
      return { ...state, missions: { ...state.missions, [id]: { ...m, hintCount: m.hintCount + 1 } } };
    }

    case 'START_CHALLENGE': {
      const id = state.currentMission;
      if (!id || !MISSIONS[id].hasChallenge) return state;
      const m = state.missions[id];
      if (m.step !== 'confirm' || m.status === 'done' || (m.challenge ?? 'none') !== 'none') return state;
      return { ...state, missions: { ...state.missions, [id]: { ...m, challenge: 'active' } } };
    }

    // ───── S5 ─────
    case 'UPDATE_FINAL':
      return { ...state, final: { ...state.final, ...action.patch } };
    case 'ANSWER_EXPLAIN':
      return { ...state, final: { ...state.final, explain: { ...state.final.explain, [action.part]: action.choice } } };
    case 'ANSWER_MISCONCEPTION': {
      // 고른 직후 정답과 해설을 보여 주므로, 처음 고른 답만 기록한다
      if (state.final.misconception[action.key] !== null) return state;
      const item = S5.misconception.items.find((i) => i.key === action.key)!;
      const result = item.answer === action.choice ? 'correct' : 'wrong';
      return {
        ...state,
        final: { ...state.final, misconception: { ...state.final.misconception, [action.key]: result } },
      };
    }
    case 'NEXT_WRAPUP_STEP':
      if (state.currentScreen !== 'S5' || !canAdvanceWrapup(state)) return state;
      return { ...state, wrapupStep: Math.min(state.wrapupStep + 1, WRAPUP_STEP_COUNT - 1) };
    case 'FINISH':
      return state.wrapupStep === WRAPUP_STEP_COUNT - 1 ? { ...state, finished: true } : state;

    case 'HYDRATE':
      return action.state;
    case 'RESET':
      return createInitialState();
  }
}

// ───────────── 도우미 ─────────────

function goTo(state: AppState, screen: ScreenId): AppState {
  return { ...state, currentScreen: screen };
}

/** 지금 미션이 expectedStep일 때만 바꾼다 */
function updateMission(
  state: AppState,
  expectedStep: MissionRecord['step'],
  fn: (m: MissionRecord) => MissionRecord,
): AppState {
  const id = state.currentMission;
  if (!id || state.missions[id].step !== expectedStep) return state;
  return { ...state, missions: { ...state.missions, [id]: fn(state.missions[id]) } };
}

/** 회로판은 ② 만들기 단계에서만 조작할 수 있다. 8-1 도전 중에는 B 회로만 다시 만질 수 있다 */
export function isEditable(state: AppState, board: BoardId): boolean {
  const id = state.currentMission;
  if (id === null) return false;
  const m = state.missions[id];
  if (m.status === 'done') return false;
  if (m.step === 'build') return true;
  return m.step === 'confirm' && m.challenge === 'active' && board === 'B';
}

function isValidWire(state: AppState, board: BoardId, wire: Wire): boolean {
  if (wire.from === wire.to) return false;
  const part = MISSIONS[state.currentMission!].part;
  const terminals = new Set(boardComponents(board, part).flatMap((c) => c.terminals));
  if (!terminals.has(wire.from) || !terminals.has(wire.to)) return false;
  const samePair = (w: Wire) =>
    (w.from === wire.from && w.to === wire.to) || (w.from === wire.to && w.to === wire.from);
  return !state.boards[board].wires.some(samePair) && !state.boards[board].wires.some((w) => w.id === wire.id);
}

/** 회로판을 바꾸고, 시도 횟수와 "정상 연결한 적 있음(built)" 기록을 함께 갱신한다 */
function applyBoardChange(
  state: AppState,
  board: BoardId,
  at: number,
  fn: (b: BoardState) => BoardState,
  countsAsAttempt: boolean,
): AppState {
  const id = state.currentMission!;
  const nextBoard = { ...fn(state.boards[board]), lastChangedAt: at };
  const result = judgeBoard(MISSIONS[id].part, board, nextBoard);
  const m = state.missions[id];
  let mission: MissionRecord;
  if (m.step === 'build') {
    mission = {
      ...m,
      attempts: m.attempts + (countsAsAttempt ? 1 : 0),
      built: { ...m.built, [board]: m.built[board] || result.wiredLevel >= REQUIRED_LEVEL[board] },
    };
  } else {
    // 8-1 도전: 같은 극끼리 이은 채 스위치를 닫아 전구가 꺼진 것을 보면 도전 완료
    const sawSamePole = result.reason === 'SAME_POLE' && nextBoard.switchClosed;
    mission = sawSamePole ? { ...m, challenge: 'done' } : m;
  }
  return {
    ...state,
    boards: { ...state.boards, [board]: nextBoard },
    missions: { ...state.missions, [id]: mission },
  };
}
