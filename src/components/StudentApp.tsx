'use client';

import { useEffect, useMemo, useReducer, useState } from 'react';
import { loadLocal, saveLocal } from '@/lib/store/persistence';
import { createInitialState, reducer } from '@/lib/store/reducer';
import { StoreContext } from '@/lib/store/StoreContext';
import { scheduleRemoteSave } from '@/lib/sync/remoteSave';
import S1Entry from './screens/S1Entry';
import S2Intro from './screens/S2Intro';
import S3Map from './screens/S3Map';
import S4Mission from './screens/S4Mission';
import S5Wrapup from './screens/S5Wrapup';

export default function StudentApp() {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadLocal() ?? createInitialState());
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    saveLocal(state); // 1단계: 브라우저에 보관
    scheduleRemoteSave(state); // 2단계: 서버에 저장 (환경 변수가 없으면 아무 일도 하지 않음)
  }, [state]);

  const store = useMemo(() => ({ state, dispatch, muted, setMuted }), [state, muted]);

  return (
    <StoreContext value={store}>
      {state.currentScreen === 'S1' && <S1Entry />}
      {state.currentScreen === 'S2' && <S2Intro />}
      {state.currentScreen === 'S3' && <S3Map />}
      {state.currentScreen === 'S4' && <S4Mission />}
      {state.currentScreen === 'S5' && <S5Wrapup />}
    </StoreContext>
  );
}
