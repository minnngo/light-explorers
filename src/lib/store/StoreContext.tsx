'use client';

import { createContext, type Dispatch, useContext } from 'react';
import type { Member, RoomInfo } from '@/lib/sync/roomSync';
import type { AppState, BoardId } from '@/lib/types';
import type { Action } from './reducer';

/** 다른 기기에서 한 조작 (3단계). 이름과 함께 잠깐 보여 준다 */
export interface RemoteNote {
  by: Member;
  type: Action['type'];
  /** 회로판 조작이면 어느 회로판인지 */
  board: BoardId | null;
  at: number;
}

export interface StoreValue {
  state: AppState;
  dispatch: Dispatch<Action>;
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
  remoteNote: RemoteNote | null;
  /** 선생님이 만든 모둠에 들어가기 (서버에 저장된 모둠 상태로 시작하고, 같은 모둠 친구들과 실시간으로 맞춘다) */
  joinGroup: (group: ClassGroupInfo, me: { name: string }) => Promise<void>;
  leaveRoom: () => void;
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
