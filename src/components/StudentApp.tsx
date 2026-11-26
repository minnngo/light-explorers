'use client';

import { newId } from '@/lib/id';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { clearLocal, loadLocal, loadRoom, saveLocal, saveRoom } from '@/lib/store/persistence';
import { type Action, createInitialState, reducer } from '@/lib/store/reducer';
import { actions } from '@/lib/store/actions';
import { type BoardNote, StoreContext, type StoreValue } from '@/lib/store/StoreContext';
import { createSupabaseTransport } from '@/lib/sync/realtime';
import { scheduleRemoteSave } from '@/lib/sync/remoteSave';
import {
  EMPTY_PRESENCE, LIVE_KEEPALIVE_MS, LIVE_SEND_MS, LIVE_STALE_MS, type LiveMessage, type LivePeer, type LivePresence, memberColor,
} from '@/lib/sync/live';
import { LiveContext, type LiveValue } from '@/lib/sync/LiveContext';
import { allMissionsDone } from '@/lib/flow/missionFlow';
import { createRoomSync, type Member, type RoomInfo, type RoomSync } from '@/lib/sync/roomSync';
import { type AppState, EXPLORER_LOOKS, type ExplorerLook } from '@/lib/types';
import { setMusicLevel } from '@/media/music';
import { audio, playClick, setUiSoundMuted } from '@/media/sound';
import RoomBar from './RoomBar';
import ExitButton from './ExitButton';
import SoundToggle from './SoundToggle';
import S1Entry from './screens/S1Entry';
import S2Intro from './screens/S2Intro';
import S3Map from './screens/S3Map';
import S4Mission from './screens/S4Mission';
import S5Wrapup from './screens/S5Wrapup';

const MUTE_KEY = 'light-explorers:muted';
const LOOK_KEY = 'light-explorers:look:v1';
const WRAPUP_KEY = 'light-explorers:my-wrapup:v1';


export default function StudentApp() {
  const [state, rawDispatch] = useReducer(reducer, undefined, () => loadLocal() ?? createInitialState());
  // 소리 끄기는 이 기기에 기억해 둔다
  const [muted, setMutedState] = useState(() => {
    try {
      return window.localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    try {
      window.localStorage.setItem(MUTE_KEY, next ? '1' : '0');
    } catch {}
  }, []);

  // 내가 고른 탐험대 캐릭터: 이 기기에 기억한다
  const [look, setLookState] = useState<ExplorerLook>(() => {
    try {
      const saved = window.localStorage.getItem(LOOK_KEY) as ExplorerLook | null;
      return saved && EXPLORER_LOOKS.includes(saved) ? saved : 'puppy';
    } catch {
      return 'puppy';
    }
  });
  const lookRef = useRef(look);
  useEffect(() => {
    lookRef.current = look;
  }, [look]);
  const setLook = useCallback((next: ExplorerLook) => {
    setLookState(next);
    try {
      window.localStorage.setItem(LOOK_KEY, next);
    } catch {}
  }, []);

  // ───── 3단계: 여러 기기로 함께하기 ─────
  const [room, setRoom] = useState<RoomInfo | null>(() => loadRoom());
  const [members, setMembers] = useState<Member[]>([]);
  const [connection, setConnection] = useState<StoreValue['connection']>('connecting');
  const [waitingForRoom, setWaitingForRoom] = useState(false);
  const syncRef = useRef<RoomSync | null>(null);
  const [boardNote, setBoardNote] = useState<BoardNote | null>(null);
  // 실시간 존재감 (커서·끄는 전선·쓰는 중): 친구들 모습과, 내 모습을 보내는 통로
  const [peerMap, setPeerMap] = useState<Record<string, LivePeer>>({});
  const [myEditing, setMyEditing] = useState<string | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const liveRef = useRef<{
    send: ((m: LiveMessage) => void) | null; me: Member | null; mine: LivePresence; lastSent: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ send: null, me: null, mine: EMPTY_PRESENCE, lastSent: 0, timer: null });
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
      // 친구가 회로판을 조작하면 그 회로판 위에 잠깐 알린다
      onRemoteAction: (action, by) => {
        if (action.type === 'ADD_WIRE' || action.type === 'REMOVE_WIRE' || action.type === 'TOGGLE_SWITCH') {
          setBoardNote({ by, board: action.board, what: action.type, at: Date.now() });
        }
      },
      onMembers: setMembers,
      // 한 번도 연결된 적 없으면 "연결하는 중", 연결됐다가 끊기면 "끊김"
      onStatus: (online) => setConnection((prev) => (online ? 'online' : prev === 'connecting' ? 'connecting' : 'offline')),
      onWaiting: setWaitingForRoom,
    });
    syncRef.current = sync;

    // 실시간 존재감: 친구 모습을 받고, 내 모습은 가끔 다시 알린다(늦게 들어온 친구를 위해). 오래 소식 없는 친구는 지운다
    const live = liveRef.current;
    live.send = transport.sendLive;
    live.me = room.me;
    transport.onLive((msg) => {
      if (msg.by.id === room.me.id) return;
      const peer: LivePeer = {
        board: msg.board, editing: msg.editing, map: msg.map, votes: msg.votes ?? {}, pointer: msg.pointer ?? null, tutoring: msg.tutoring ?? false, call: msg.call ?? null,
        member: msg.by, color: memberColor(msg.by.id), at: Date.now(),
      };
      setPeerMap((prev) => ({ ...prev, [msg.by.id]: peer }));
    });
    const keepalive = setInterval(() => {
      transport.sendLive({ ...live.mine, by: room.me, at: Date.now() });
      const cutoff = Date.now() - LIVE_STALE_MS;
      setPeerMap((prev) => {
        const stale = Object.values(prev).filter((p) => p.at < cutoff);
        if (stale.length === 0) return prev;
        const next = { ...prev };
        for (const p of stale) delete next[p.member.id];
        return next;
      });
    }, LIVE_KEEPALIVE_MS);

    return () => {
      clearInterval(keepalive);
      if (live.timer) clearTimeout(live.timer);
      live.timer = null;
      live.send = null;
      live.me = null;
      setPeerMap({});
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

  const joinGroup = useCallback<StoreValue['joinGroup']>(async (group, me) => {
    // 서버에 저장된 모둠 상태로 시작한다. 못 받으면 이 기기 기록을 비우고 친구 기기에서 상태를 받는다
    const res = await fetch(`/api/groups/${group.id}`, { cache: 'no-store' }).catch(() => null);
    const saved = res?.ok ? ((await res.json().catch(() => null)) as AppState | null) : null;
    rawDispatch(saved && saved.groupId === group.id ? { type: 'HYDRATE', state: saved } : { type: 'RESET' });
    setRoom({ code: group.roomCode, host: false, me: { id: newId(), name: me.name, look: lookRef.current } });
  }, []);

  const leaveRoom = useCallback(() => setRoom(null), []);

  // 모둠으로 할 때 마무리로 들어간 기기: 이 기기에만 기억한다 (모둠 id:기기 id)
  const wrapupKey = room && state.groupId ? `${state.groupId}:${room.me.id}` : null;
  const [myWrapups, setMyWrapups] = useState<string[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem(WRAPUP_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  });
  const inMyWrapup = wrapupKey !== null && myWrapups.includes(wrapupKey);
  const goWrapup = useCallback(() => {
    if (!wrapupKey) {
      dispatch({ type: 'GO_TO_WRAPUP' });
      return;
    }
    setMyWrapups((list) => {
      const next = list.includes(wrapupKey) ? list : [...list, wrapupKey];
      try {
        window.localStorage.setItem(WRAPUP_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [wrapupKey, dispatch]);

  // 미션은 모둠이 같이 들어가고 같이 나온다 (한 명이 누르면 모두)
  const enterMission = useCallback<StoreValue['enterMission']>((id, retry = false) => {
    dispatch(retry ? actions.retryMission(id) : actions.openMission(id));
  }, [dispatch]);
  const leaveMission = useCallback<StoreValue['leaveMission']>((complete = false) => {
    dispatch(complete ? actions.completeMission() : { type: 'LEAVE_MISSION' });
  }, [dispatch]);

  /** 내 모습을 친구들에게 보낸다 (너무 자주 보내지 않게 모아서). 화면 상태는 건드리지 않는다 */
  const sendLive = useCallback((patch: Partial<LivePresence>) => {
    const live = liveRef.current;
    live.mine = { ...live.mine, ...patch };
    const flush = () => {
      live.timer = null;
      live.lastSent = Date.now();
      if (live.send && live.me) live.send({ ...live.mine, by: live.me, at: live.lastSent });
    };
    const wait = LIVE_SEND_MS - (Date.now() - live.lastSent);
    if (wait <= 0) flush();
    else live.timer ??= setTimeout(flush, wait);
  }, []);
  const publish = useCallback<LiveValue['publish']>((patch) => {
    if ('editing' in patch) setMyEditing(patch.editing ?? null);
    if (patch.votes) setMyVotes(patch.votes);
    sendLive(patch);
  }, [sendLive]);

  // 모둠이 바뀌거나, 미션에 들어가고 나올 때(다시 하기 포함)는 지난번에 고른 답(모두 동의 표)을 지운다.
  // 남겨 두면 새 판에서 지난 답끼리 "모두 같은 답"이 되어 저절로 정해져 버린다
  const voteScope = `${room?.code ?? ''}|${room?.me.id ?? ''}|${state.currentScreen}|${state.currentMission ?? ''}`;
  const [seenVoteScope, setSeenVoteScope] = useState(voteScope);
  if (seenVoteScope !== voteScope) {
    setSeenVoteScope(voteScope);
    setMyVotes({});
  }
  useEffect(() => {
    sendLive({ votes: {} });
  }, [voteScope, sendLive]);

  const vote = useCallback<LiveValue['vote']>((field, value) => {
    publish({ votes: { ...liveRef.current.mine.votes, [field]: value } });
  }, [publish]);

  // 방을 나간 친구(presence에서 사라짐)는 바로 지운다
  const peers = useMemo(() => {
    const list = Object.values(peerMap);
    return members.length === 0 ? list : list.filter((p) => members.some((m) => m.id === p.member.id));
  }, [peerMap, members]);
  const liveValue = useMemo<LiveValue>(
    () => ({ peers, myId: room?.me.id ?? null, publish, myEditing, myVotes, vote, announce: sendLive }),
    [peers, room, publish, myEditing, myVotes, vote, sendLive],
  );

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
      look,
      setLook,
      muted,
      setMuted,
      room,
      members,
      connection,
      waitingForRoom: joining,
      boardNote,
      joinGroup,
      goWrapup,
      enterMission,
      leaveMission,
      leaveRoom,
      restart,
    }),
    [state, dispatch, look, setLook, muted, setMuted, room, members, connection, joining, boardNote, joinGroup, goWrapup, enterMission, leaveMission, leaveRoom, restart],
  );

  // 모둠으로 할 때: 마무리로 들어간 기기는 모둠 화면이 지도여도 마무리를 보여 준다
  const screen = joining ? 'S1'
    : inMyWrapup && state.currentScreen === 'S3' && allMissionsDone(state) ? 'S5'
      : state.currentScreen;

  // ───── 배경 음악과 효과음 ─────
  // 들어오자마자 음악을 틀어 본다. 브라우저가 자동 재생을 막으면(대부분 기본값) 첫 누름 뒤에 시작한다
  const [audioReady, setAudioReady] = useState(false);
  useEffect(() => {
    const ac = audio();
    if (ac) {
      void ac.resume().then(() => {
        if (ac.state === 'running') setAudioReady(true);
      });
    }
    const unlock = () => setAudioReady(true);
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  // 학생 화면을 탭 여러 개로 열어도 음악은 한 곳에서만: 보이는 탭 중 마지막으로 보거나 누른 탭이 연주한다
  const [musicOwner, setMusicOwner] = useState(true);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const id = newId();
    const channel = new BroadcastChannel('light-explorers:music');
    const claim = () => {
      if (document.visibilityState !== 'visible') return;
      setMusicOwner(true);
      channel.postMessage(id);
    };
    channel.onmessage = (e) => {
      if (e.data !== id) setMusicOwner(false);
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? claim() : setMusicOwner(false));
    claim();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', claim);
    window.addEventListener('pointerdown', claim);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', claim);
      window.removeEventListener('pointerdown', claim);
      channel.close();
    };
  }, []);
  // 회로를 만드는 미션 화면(S4)에서는 음악을 끈다: 버저 종소리·전동기 소리·불 켜지는 소리를 잘 듣고 비교하도록
  const musicLevel = muted || !audioReady || !musicOwner || screen === 'S4' ? 0 : 1;
  useEffect(() => {
    setMusicLevel(musicLevel);
  }, [musicLevel]);
  useEffect(() => () => setMusicLevel(0), []);
  // 버튼을 누르면 작은 "톡"
  useEffect(() => {
    setUiSoundMuted(muted);
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest('button, [role="button"]');
      if (el && !(el as HTMLButtonElement).disabled) playClick();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [muted]);

  return (
    <StoreContext value={store}>
      <LiveContext value={liveValue}>
      {/* 모둠 줄: 마무리는 각자 하는 활동이라 보이지 않는다 */}
      {room && screen !== 'S5' && <RoomBar />}
      {screen === 'S1' && <S1Entry />}
      {screen === 'S2' && <S2Intro />}
      {screen === 'S3' && <S3Map />}
      {screen === 'S4' && <S4Mission />}
      {screen === 'S5' && <S5Wrapup />}
      {/* 마을 지도는 위쪽 줄에, 미션 화면은 아래쪽 줄에 소리 버튼이 따로 있다 */}
      {screen !== 'S3' && screen !== 'S4' && <SoundToggle underBar={room !== null && screen !== 'S5'} />}
      {/* 나가기: 지도·미션은 위쪽 줄에 있고, 도입·마무리는 왼쪽 위에 떠 있다 */}
      {(screen === 'S2' || screen === 'S5') && <ExitButton floating underBar={room !== null && screen !== 'S5'} />}
      </LiveContext>
    </StoreContext>
  );
}
