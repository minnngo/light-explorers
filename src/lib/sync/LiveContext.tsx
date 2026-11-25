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
  /** 모두 동의 문제에서 내가 고른 답 (문제마다) */
  myVotes: Record<string, string>;
  /** 모두 동의 문제 하나에 내 답을 고른다 */
  vote: (field: string, value: string) => void;
  /** 화면 상태는 건드리지 않고 내 모습만 알린다 (effect 안에서 써도 된다) */
  announce: (patch: Partial<LivePresence>) => void;
}

const NOOP: LiveValue = {
  peers: [], myId: null, publish: () => {}, myEditing: null, myVotes: {}, vote: () => {}, announce: () => {},
};

export const LiveContext = createContext<LiveValue>(NOOP);

export function useLive(): LiveValue {
  return useContext(LiveContext);
}
