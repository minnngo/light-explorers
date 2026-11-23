// action 만들기. 시각(at)과 id처럼 매번 달라지는 값은 여기서만 만든다.
// reducer는 이 값을 받아 쓰기만 하므로 결정적으로 남는다 (3단계 실시간 동기화의 전제).
import type { BoardId, MissionId, TerminalId } from '@/lib/types';
import type { Action } from './reducer';

export const actions = {
  startExpedition: (groupName: string, safetyAgreed: boolean): Action => ({
    type: 'START_EXPEDITION',
    groupId: crypto.randomUUID(),
    groupName,
    safetyAgreed,
  }),
  openMission: (mission: MissionId): Action => ({ type: 'OPEN_MISSION', mission, at: Date.now() }),
  addWire: (board: BoardId, from: TerminalId, to: TerminalId): Action => ({
    type: 'ADD_WIRE',
    board,
    wire: { id: crypto.randomUUID(), from, to },
    at: Date.now(),
  }),
  removeWire: (board: BoardId, wireId: string): Action => ({ type: 'REMOVE_WIRE', board, wireId, at: Date.now() }),
  toggleSwitch: (board: BoardId): Action => ({ type: 'TOGGLE_SWITCH', board, at: Date.now() }),
  backToBuild: (): Action => ({ type: 'BACK_TO_BUILD', at: Date.now() }),
  completeMission: (): Action => ({ type: 'COMPLETE_MISSION', at: new Date().toISOString() }),
};
