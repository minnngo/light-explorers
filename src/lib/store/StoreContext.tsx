'use client';

import { createContext, type Dispatch, useContext } from 'react';
import type { Member, RoomInfo } from '@/lib/sync/roomSync';
import type { AppState, BoardId, ExplorerLook, MissionId } from '@/lib/types';
import type { Action } from './reducer';

/** 친구가 회로판에서 방금 한 조작 (모둠 함께하기). 그 회로판 위에 이름과 함께 잠깐 보여 준다 */
export interface BoardNote {
  by: Member;
  board: BoardId;
  what: 'ADD_WIRE' | 'REMOVE_WIRE' | 'TOGGLE_SWITCH';
  at: number;
}

export interface StoreValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  /** 내가 고른 탐험대 캐릭터 (기기에 기억한다) */
  look: ExplorerLook;
  setLook: (look: ExplorerLook) => void;
  /** 소리 끄기는 기기마다 따로 정하는 설정이라 동기화하지 않는다 */
  muted: boolean;
  setMuted: (muted: boolean) => void;
  /** 3단계: 여러 기기로 함께하기. 한 기기로 하면 null */
  room: RoomInfo | null;
  members: Member[];
  /** 처음 연결하는 중 / 연결됨 / 연결됐다가 끊김 */
  connection: 'connecting' | 'online' | 'offline';
  /** 방 코드로 들어와 첫 상태를 기다리는 중 */
  waitingForRoom: boolean;
  boardNote: BoardNote | null;
  /** 선생님이 만든 모둠에 들어가기 (서버에 저장된 모둠 상태로 시작하고, 같은 모둠 친구들과 실시간으로 맞춘다) */
  joinGroup: (group: ClassGroupInfo, me: { name: string }) => Promise<void>;
  leaveRoom: () => void;
  /**
   * 마무리로 가기. 마무리는 각자 하는 활동이라, 모둠으로 할 때는 누른 기기만 마무리 화면으로 간다
   * (모둠의 화면 기록은 지도에 그대로 둔다). 혼자 할 때는 화면을 마무리로 바꾼다.
   */
  goWrapup: () => void;
  /** 미션 들어가기 (retry: 완료한 미션을 처음부터). 모둠으로 할 때는 한 명이 누르면 모두 같이 들어간다 */
  enterMission: (id: MissionId, retry?: boolean) => void;
  /** 미션에서 지도로 나가기 (complete: 확인까지 마치고 "지도로 돌아가기"). 모둠으로 할 때는 모두 같이 나온다 */
  leaveMission: (complete?: boolean) => void;
  /** 이 기기의 기록을 지우고 처음부터 (다른 기기로 보내지 않음) */
  restart: () => void;
}

/** 학생 입장 화면의 모둠 목록 한 줄 */
export interface ClassGroupInfo {
  id: string;
  name: string;
  roomCode: string;
}

export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore는 StudentApp 안에서만 쓸 수 있습니다.');
  return value;
}
