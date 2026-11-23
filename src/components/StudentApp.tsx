'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { actions } from '@/lib/store/actions';
import { clearLocal, loadLocal, loadRoom, saveLocal, saveRoom } from '@/lib/store/persistence';
import { type Action, createInitialState, reducer } from '@/lib/store/reducer';
import { type RemoteNote, StoreContext, type StoreValue } from '@/lib/store/StoreContext';
import { createSupabaseTransport } from '@/lib/sync/realtime';
import { scheduleRemoteSave } from '@/lib/sync/remoteSave';
import { createRoomSync, generateRoomCode, type Member, type RoomInfo, type RoomSync } from '@/lib/sync/roomSync';
import RoomBar from './RoomBar';
import S1Entry from './screens/S1Entry';
import S2Intro from './screens/S2Intro';
import S3Map from './screens/S3Map';
import S4Mission from './screens/S4Mission';
import S5Wrapup from './screens/S5Wrapup';

const BOARD_ACTIONS: ReadonlySet<Action['type']> = new Set<Action['type']>(['ADD_WIRE', 'REMOVE_WIRE', 'TOGGLE_SWITCH']);

export default function StudentApp() {
  const [state, rawDispatch] = useReducer(reducer, undefined, () => loadLocal() ?? createInitialState());
  const [muted, setMuted] = useState(false);

  // ───── 3단계: 여러 기기로 함께하기 ─────
  const [room, setRoom] = useState<RoomInfo | null>(() => loadRoom());
  const [members, setMembers] = useState<Member[]>([]);
  const [connection, setConnection] = useState<StoreValue['connection']>('connecting');
  const [waitingForRoom, setWaitingForRoom] = useState(false);
  const [remoteNote, setRemoteNote] = useState<RemoteNote | null>(null);
  const syncRef = useRef<RoomSync | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    saveLocal(state); // 1단계: 브라우저에 보관
    scheduleRemoteSave(state); // 2단계: 서버에 저장 (환경 변수가 없으면 아무 일도 하지 않음)
  }, [state]);

  useEffect(() => {
    saveRoom(room);
    if (!room) return;
    const transport = createSupabaseTransport(room);
    if (!transport) return;
    const sync = createRoomSync({
      transport,
      room,
      getState: () => stateRef.current,
      apply: rawDispatch,
      onRemoteAction: (action, by) => {
        const board = BOARD_ACTIONS.has(action.type) && 'board' in action ? action.board : null;
        setRemoteNote({ by, type: action.type, board, at: Date.now() });
      },
      onMembers: setMembers,
      // 한 번도 연결된 적 없으면 "연결하는 중", 연결됐다가 끊기면 "끊김"
      onStatus: (online) => setConnection((prev) => (online ? 'online' : prev === 'connecting' ? 'connecting' : 'offline')),
      onWaiting: setWaitingForRoom,
    });
    syncRef.current = sync;
    return () => {
      sync.close();
      syncRef.current = null;
      setMembers([]);
      setConnection('connecting');
      setWaitingForRoom(false);
    };
  }, [room]);

  /** 내 기기에서 한 조작: 내 화면에 반영하고, 함께하기 중이면 같은 방 기기에도 보낸다 */
  const dispatch = useCallback((action: Action) => {
    rawDispatch(action);
    syncRef.current?.broadcast(action);
  }, []);

  const createRoom = useCallback<StoreValue['createRoom']>((groupName, safetyAgreed, me) => {
    const code = generateRoomCode();
    rawDispatch(actions.startExpedition(groupName, safetyAgreed, code));
    setRoom({ code, host: true, me: { id: crypto.randomUUID(), ...me } });
  }, []);

  const joinRoom = useCallback<StoreValue['joinRoom']>((code, me) => {
    rawDispatch({ type: 'RESET' }); // 이 기기에 남은 예전 기록 대신 방의 상태로 시작한다
    setRoom({ code, host: false, me: { id: crypto.randomUUID(), ...me } });
  }, []);

  const leaveRoom = useCallback(() => setRoom(null), []);

  const restart = useCallback(() => {
    setRoom(null);
    clearLocal();
    rawDispatch({ type: 'RESET' });
  }, []);

  // 방 코드로 들어와 아직 모둠 상태를 받지 못했으면 입장 화면(S1Entry의 대기 화면)에서 기다린다.
  // 동기화가 막 시작되기 전 한 순간에도 입장 양식이 보이지 않도록 groupId로도 판단한다.
  const joining = waitingForRoom || (room !== null && !room.host && state.groupId === null);

  const store = useMemo<StoreValue>(
    () => ({
      state,
      dispatch,
      muted,
      setMuted,
      room,
      members,
      connection,
      waitingForRoom: joining,
      remoteNote,
      createRoom,
      joinRoom,
      leaveRoom,
      restart,
    }),
    [state, dispatch, muted, room, members, connection, joining, remoteNote, createRoom, joinRoom, leaveRoom, restart],
  );

  const screen = joining ? 'S1' : state.currentScreen;

  return (
    <StoreContext value={store}>
      {room && <RoomBar />}
      {screen === 'S1' && <S1Entry />}
      {screen === 'S2' && <S2Intro />}
      {screen === 'S3' && <S3Map />}
      {screen === 'S4' && <S4Mission />}
      {screen === 'S5' && <S5Wrapup />}
    </StoreContext>
  );
}
