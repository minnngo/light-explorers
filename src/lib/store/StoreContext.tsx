'use client';

import { createContext, type Dispatch, useContext } from 'react';
import type { Member, Role, RoomInfo } from '@/lib/sync/roomSync';
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
  /** 새 모둠으로 방 만들기 (탐험 시작과 함께) */
  createRoom: (groupName: string, safetyAgreed: boolean, me: { name: string; role: Role }) => void;
  joinRoom: (code: string, me: { name: string; role: Role }) => void;
  leaveRoom: () => void;
  /** 이 기기의 기록을 지우고 처음부터 (다른 기기로 보내지 않음) */
  restart: () => void;
}

export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore는 StudentApp 안에서만 쓸 수 있습니다.');
  return value;
}

/** 이 회로판을 이 기기에서 조작해도 되는지. 한 기기로 하면 둘 다, 함께하기에서는 내가 맡은 회로판만 */
export function canOperateBoard(room: RoomInfo | null, board: BoardId): boolean {
  return room === null || room.me.role === board;
}
