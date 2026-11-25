// 3단계: 여러 기기가 한 모둠 화면을 함께 조작하는 동기화 규칙. 통신 방법(Supabase)과 분리한 순수 로직이라 테스트할 수 있다.
//
// 방식
//  1) 모든 기기가 같은 reducer를 돌린다. 내 기기에서 dispatch한 action을 같은 방의 다른 기기에 보내고,
//     받은 기기는 그 action을 그대로 자기 reducer에 넣는다. reducer가 결정적(시각·id를 action에 담음)이라 화면이 같아진다.
//  2) 늦게 들어온 기기(방 코드로 들어온 기기)는 "지금 상태를 보내 주세요(sync-request)"를 보내고,
//     이미 탐험 중인 기기가 상태 전체(sync-state)를 보내 주면 그것으로 시작한다(HYDRATE).
//  3) 연결이 잠깐 끊겨 action을 놓친 기기를 위해, 한 기기가 주기적으로 상태 전체를 보낸다(heartbeat).
//     보내는 기기: 방을 만든 기기(host). 선생님이 만든 모둠처럼 host가 없으면 지금 들어와 있는 기기 중 id가 가장 앞선 기기.
//     받은 기기는 최근에 스스로 조작하지 않았을 때만 그 상태로 맞춘다 (방금 보낸 내 조작이 덮이지 않게).
import type { Action } from '@/lib/store/reducer';
import type { AppState } from '@/lib/types';

export interface Member {
  /** 기기 id (기기마다 한 번 만들어 보관) */
  id: string;
  name: string;
}

export interface RoomInfo {
  code: string;
  me: Member;
  /** 방을 만든 기기 (선생님이 만든 모둠에서는 모두 false) */
  host: boolean;
}

export type RoomMessage =
  | { kind: 'action'; action: Action; by: Member }
  | { kind: 'sync-request'; from: string }
  | { kind: 'sync-state'; state: AppState; from: string; to: string | null };

export interface RoomTransport {
  send: (msg: RoomMessage) => void;
  onMessage: (fn: (msg: RoomMessage) => void) => void;
  onMembers: (fn: (members: Member[]) => void) => void;
  onStatus: (fn: (connected: boolean) => void) => void;
  close: () => void;
}

/** 다른 기기와 나누지 않는 action. 저장된 상태 덮어쓰기·처음부터 다시 하기는 기기마다 따로 한다 */
const LOCAL_ONLY: ReadonlySet<Action['type']> = new Set<Action['type']>(['HYDRATE', 'RESET']);

export const SYNC_REQUEST_INTERVAL_MS = 2000;
export const HEARTBEAT_MS = 15_000;
/** 내가 조작한 지 이 시간이 지나지 않았으면 heartbeat로 덮어쓰지 않는다 */
export const LOCAL_QUIET_MS = 3000;

export interface RoomSyncOptions {
  transport: RoomTransport;
  room: RoomInfo;
  getState: () => AppState;
  /** 내 reducer에 넣기 (보내지 않음) */
  apply: (action: Action) => void;
  onRemoteAction?: (action: Action, by: Member) => void;
  onMembers?: (members: Member[]) => void;
  onStatus?: (connected: boolean) => void;
  /** 방 코드로 들어온 기기가 첫 상태를 받기 전까지 true */
  onWaiting?: (waiting: boolean) => void;
  now?: () => number;
}

export interface RoomSync {
  /** 내 기기에서 한 action을 다른 기기에 보낸다 (내 reducer에는 호출한 쪽이 직접 넣는다) */
  broadcast: (action: Action) => void;
  close: () => void;
}

export function createRoomSync(opts: RoomSyncOptions): RoomSync {
  const { transport, room, getState, apply } = opts;
  const now = opts.now ?? Date.now;
  // 방 코드로 막 들어온 기기만 기다린다. 이미 탐험 중이던 기기(새로고침)는 화면을 그대로 두고 따라잡기만 한다
  let waiting = !room.host && getState().groupId === null;
  let lastLocalAt = -Infinity;
  let requestTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let memberIds: string[] = [];
  /** 상태를 맞춰 주는 기기인지 */
  const leading = () => room.host || [...memberIds, room.me.id].sort()[0] === room.me.id;

  const hasExpedition = () => getState().groupId !== null;
  const sendState = (to: string | null) => {
    if (hasExpedition()) transport.send({ kind: 'sync-state', state: getState(), from: room.me.id, to });
  };
  const requestState = () => transport.send({ kind: 'sync-request', from: room.me.id });

  const stopRequesting = () => {
    if (requestTimer) clearInterval(requestTimer);
    requestTimer = null;
  };

  opts.onWaiting?.(waiting);

  transport.onMessage((msg) => {
    switch (msg.kind) {
      case 'action':
        if (waiting) return; // 첫 상태를 받기 전의 action은 받은 상태에 이미 들어 있다
        apply(msg.action);
        opts.onRemoteAction?.(msg.action, msg.by);
        return;
      case 'sync-request':
        if (msg.from !== room.me.id && !waiting) sendState(msg.from);
        return;
      case 'sync-state': {
        if (msg.from === room.me.id) return;
        if (msg.to !== null && msg.to !== room.me.id) return;
        if (waiting) {
          apply({ type: 'HYDRATE', state: msg.state });
          waiting = false;
          stopRequesting();
          opts.onWaiting?.(false);
          return;
        }
        // heartbeat·따라잡기: 최근에 내가 조작하지 않았고, 상태가 다를 때만 맞춘다
        if (now() - lastLocalAt >= LOCAL_QUIET_MS && !sameState(getState(), msg.state)) {
          apply({ type: 'HYDRATE', state: msg.state });
        }
        return;
      }
    }
  });

  transport.onMembers((members) => {
    memberIds = members.map((m) => m.id);
    opts.onMembers?.(members);
  });

  transport.onStatus((connected) => {
    opts.onStatus?.(connected);
    if (!connected) return;
    if (waiting) {
      requestState();
      stopRequesting();
      requestTimer = setInterval(requestState, SYNC_REQUEST_INTERVAL_MS);
    } else if (!room.host) {
      requestState(); // 새로고침·재연결: 놓친 것을 따라잡는다
    } else {
      sendState(null); // 다시 연결되면 바로 한 번 맞춘다
    }
  });

  heartbeatTimer = setInterval(() => {
    if (!waiting && leading()) sendState(null);
  }, HEARTBEAT_MS);

  return {
    broadcast: (action) => {
      if (LOCAL_ONLY.has(action.type) || waiting) return;
      lastLocalAt = now();
      transport.send({ kind: 'action', action, by: room.me });
    },
    close: () => {
      stopRequesting();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      transport.close();
    },
  };
}

function sameState(a: AppState, b: AppState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ───────────── 방 코드 ─────────────

/** 헷갈리는 글자(0/O, 1/I/L)는 뺐다 */
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 4;

export function generateRoomCode(random: (n: number) => number = cryptoRandom): string {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => CODE_CHARS[random(CODE_CHARS.length)]).join('');
}

/** 학생이 입력한 방 코드를 정리한다. 형식이 맞지 않으면 null */
export function normalizeRoomCode(input: string): string | null {
  const code = input.trim().toUpperCase().replace(/\s+/g, '');
  if (code.length !== ROOM_CODE_LENGTH) return null;
  return [...code].every((c) => CODE_CHARS.includes(c)) ? code : null;
}

function cryptoRandom(n: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % n;
}
