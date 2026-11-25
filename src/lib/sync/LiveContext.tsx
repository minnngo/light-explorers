'use client';

// 친구 커서·끄는 전선·쓰는 중 표시를 화면에 나눠 주는 곳. 자주 바뀌므로 게임 상태(StoreContext)와 따로 둔다
// (커서가 움직일 때마다 화면 전체가 다시 그려지지 않게).
import { createContext, useContext } from 'react';
import type { LivePeer, LivePresence } from './live';

export interface LiveValue {
  /** 같은 방 친구들 (나는 빼고). 혼자 하면 빈 목록 */
  peers: LivePeer[];
  /** 내 기기 id (혼자 하면 null) */
  myId: string | null;
  /** 내 모습 중 바뀐 부분만 알린다 */
  publish: (patch: Partial<LivePresence>) => void;
  /** 지금 내가 쓰고 있는 칸 */
  myEditing: string | null;
}

const NOOP: LiveValue = { peers: [], myId: null, publish: () => {}, myEditing: null };

export const LiveContext = createContext<LiveValue>(NOOP);

export function useLive(): LiveValue {
  return useContext(LiveContext);
}
