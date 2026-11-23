'use client';

import { createContext, type Dispatch, useContext } from 'react';
import type { AppState } from '@/lib/types';
import type { Action } from './reducer';

export interface StoreValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  /** 소리 끄기는 기기마다 따로 정하는 설정이라 동기화하지 않는다 */
  muted: boolean;
  setMuted: (muted: boolean) => void;
}

export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore는 StudentApp 안에서만 쓸 수 있습니다.');
  return value;
}
