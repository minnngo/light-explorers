import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Action, createInitialState, reducer } from '@/lib/store/reducer';
import type { AppState } from '@/lib/types';
import {
  createRoomSync,
  generateRoomCode,
  HEARTBEAT_MS,
  type Member,
  normalizeRoomCode,
  type RoomMessage,
  type RoomSync,
  type RoomTransport,
  SYNC_REQUEST_INTERVAL_MS,
} from './roomSync';

/** 메모리 안의 방: 보낸 메시지를 자기 자신을 뺀 모든 기기에 전한다 (Supabase broadcast self:false와 같다) */
function createBus() {
  const devices: { id: string; deliver: (m: RoomMessage) => void; online: boolean }[] = [];
  return {
    transport(id: string): RoomTransport & { connect: () => void; setOnline: (on: boolean) => void } {
      let onMessage: (m: RoomMessage) => void = () => {};
      let onStatus: (c: boolean) => void = () => {};
      const entry = { id, deliver: (m: RoomMessage) => onMessage(m), online: false };
      devices.push(entry);
      return {
        send: (msg) => {
          if (!entry.online) return;
          for (const d of devices) if (d !== entry && d.online) d.deliver(structuredClone(msg));
        },
        onMessage: (fn) => (onMessage = fn),
        onMembers: () => {},
        onStatus: (fn) => (onStatus = fn),
        close: () => (entry.online = false),
        connect: () => {
          entry.online = true;
          onStatus(true);
        },
        setOnline: (on) => {
          entry.online = on;
          onStatus(on);
        },
      };
    },
  };
}

function device(bus: ReturnType<typeof createBus>, me: Member, host: boolean, initial: AppState, clock: { t: number }) {
  let state = initial;
  const transport = bus.transport(me.id);
  const remote: { action: Action; by: Member }[] = [];
  let waiting: boolean | null = null;
  const sync: RoomSync = createRoomSync({
    transport,
    room: { code: 'ABCD', me, host },
    getState: () => state,
    apply: (a) => (state = reducer(state, a)),
    onRemoteAction: (action, by) => remote.push({ action, by }),
    onWaiting: (w) => (waiting = w),
    now: () => clock.t,
  });
  return {
    get state() {
      return state;
    },
    get waiting() {
      return waiting;
    },
    remote,
    transport,
    /** 내 기기에서 조작: 내 reducer에 넣고 방에 보낸다 */
    act(a: Action) {
      state = reducer(state, a);
      sync.broadcast(a);
    },
    sync,
  };
}

const minsu: Member = { id: 'd1', name: '민수' };
const jia: Member = { id: 'd2', name: '지아' };

function startedState(): AppState {
  return reducer(createInitialState(), {
    type: 'START_EXPEDITION',
    groupId: 'g1',
    groupName: '반짝반짝 탐험대',
    safetyAgreed: true,
    roomCode: 'ABCD',
  });
}

describe('roomSync (3단계 실시간 공동 조작)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('방 코드로 들어온 기기는 이미 탐험 중인 기기의 상태를 받아 시작한다', () => {
    const bus = createBus();
    const clock = { t: 0 };
    const host = device(bus, minsu, true, startedState(), clock);
    host.transport.connect();
    const guest = device(bus, jia, false, createInitialState(), clock);
    expect(guest.waiting).toBe(true);

    guest.transport.connect();
    expect(guest.waiting).toBe(false);
    expect(guest.state.groupName).toBe('반짝반짝 탐험대');
    expect(guest.state.currentScreen).toBe('S2');
  });

  it('호스트가 아직 연결되지 않았으면 받을 때까지 다시 요청한다', () => {
    const bus = createBus();
    const clock = { t: 0 };
    const host = device(bus, minsu, true, startedState(), clock);
    const guest = device(bus, jia, false, createInitialState(), clock);
    guest.transport.connect();
    expect(guest.waiting).toBe(true);

    host.transport.connect();
    vi.advanceTimersByTime(SYNC_REQUEST_INTERVAL_MS);
    expect(guest.waiting).toBe(false);
    expect(guest.state.groupId).toBe('g1');
  });

  it('한 기기의 조작이 다른 기기에도 똑같이 반영되고, 누가 했는지 함께 온다', () => {
    const bus = createBus();
    const clock = { t: 0 };
    const host = device(bus, minsu, true, startedState(), clock);
    host.transport.connect();
    const guest = device(bus, jia, false, createInitialState(), clock);
    guest.transport.connect();

    host.act({ type: 'ANSWER_RECALL', correct: true });
    guest.act({ type: 'NEXT_INTRO_CUT' });
    expect(guest.state).toEqual(host.state);
    expect(host.remote.at(-1)).toMatchObject({ by: { name: '지아' }, action: { type: 'NEXT_INTRO_CUT' } });
  });

  it('연결이 끊겨 놓친 조작은 호스트의 heartbeat로 다시 맞춰진다', () => {
    const bus = createBus();
    const clock = { t: 0 };
    const host = device(bus, minsu, true, startedState(), clock);
    host.transport.connect();
    const guest = device(bus, jia, false, createInitialState(), clock);
    guest.transport.connect();

    guest.transport.setOnline(false);
    host.act({ type: 'NEXT_INTRO_CUT' });
    expect(guest.state.introCut).toBe(0);

    guest.transport.setOnline(true);
    clock.t = HEARTBEAT_MS;
    vi.advanceTimersByTime(HEARTBEAT_MS);
    expect(guest.state).toEqual(host.state);
  });

  it('방금 내가 조작했다면 heartbeat가 내 상태를 덮지 않는다', () => {
    const bus = createBus();
    const clock = { t: 0 };
    const host = device(bus, minsu, true, startedState(), clock);
    host.transport.connect();
    const guest = device(bus, jia, false, createInitialState(), clock);
    guest.transport.connect();

    host.transport.setOnline(false); // 호스트가 guest의 조작을 못 받음
    clock.t = HEARTBEAT_MS - 1000;
    guest.act({ type: 'NEXT_INTRO_CUT' });
    host.transport.setOnline(true);
    clock.t = HEARTBEAT_MS;
    vi.advanceTimersByTime(HEARTBEAT_MS);
    expect(guest.state.introCut).toBe(1);
  });

  it('이미 탐험 중이던 기기가 새로고침하면 기다리지 않고, 연결되면 놓친 것을 따라잡는다', () => {
    const bus = createBus();
    const clock = { t: 0 };
    const host = device(bus, minsu, true, startedState(), clock);
    host.transport.connect();
    host.act({ type: 'NEXT_INTRO_CUT' });

    const guest = device(bus, jia, false, startedState(), clock); // 새로고침: 로컬에 예전 상태가 있음
    expect(guest.waiting).toBe(false);
    expect(guest.state.introCut).toBe(0);
    clock.t = 10_000;
    guest.transport.connect();
    expect(guest.state).toEqual(host.state);
  });

  it('처음부터 다시 하기(RESET)는 다른 기기로 보내지 않는다', () => {
    const bus = createBus();
    const clock = { t: 0 };
    const host = device(bus, minsu, true, startedState(), clock);
    host.transport.connect();
    const guest = device(bus, jia, false, createInitialState(), clock);
    guest.transport.connect();

    guest.act({ type: 'RESET' });
    expect(host.state.groupId).toBe('g1');
  });
});

describe('방 코드', () => {
  it('헷갈리는 글자 없이 4글자로 만든다', () => {
    let i = 0;
    const code = generateRoomCode(() => i++);
    expect(code).toBe('ABCD');
    expect(normalizeRoomCode(' abcd ')).toBe('ABCD');
    expect(normalizeRoomCode('AB0D')).toBeNull(); // 숫자 0은 쓰지 않는다
    expect(normalizeRoomCode('ABC')).toBeNull();
  });
});
