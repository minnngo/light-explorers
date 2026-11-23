// 3단계: Supabase Realtime(broadcast + presence)으로 RoomTransport를 만든다.
// 동기화 규칙은 roomSync.ts에 있고, 이 파일은 "메시지를 주고받는 통로"만 맡는다.
// DB 테이블을 쓰지 않으므로 publishable 키만 있으면 된다 (supabase/schema.sql의 RLS와 무관).
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import type { Member, RoomInfo, RoomMessage, RoomTransport } from './roomSync';

/** 환경 변수가 있어야 "여러 기기로 함께하기"를 보여 준다 */
export function isRealtimeAvailable(): boolean {
  return getBrowserSupabase() !== null;
}

export function createSupabaseTransport(room: RoomInfo): RoomTransport | null {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;

  const messageHandlers: ((m: RoomMessage) => void)[] = [];
  const memberHandlers: ((m: Member[]) => void)[] = [];
  const statusHandlers: ((c: boolean) => void)[] = [];

  const channel = supabase.channel(`light-explorers:room:${room.code}`, {
    config: { broadcast: { self: false }, presence: { key: room.me.id, enabled: true } },
  });

  channel
    .on('broadcast', { event: 'msg' }, ({ payload }) => {
      for (const h of messageHandlers) h(payload as RoomMessage);
    })
    .on('presence', { event: 'sync' }, () => {
      const members = Object.values(channel.presenceState<Member>())
        .flat()
        .map(({ id, name, role }) => ({ id, name, role }));
      for (const h of memberHandlers) h(members);
    })
    .subscribe((status) => {
      const connected = status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED;
      if (connected) void channel.track(room.me);
      for (const h of statusHandlers) h(connected);
    });

  return {
    send: (msg) => {
      void channel.send({ type: 'broadcast', event: 'msg', payload: msg });
    },
    onMessage: (fn) => messageHandlers.push(fn),
    onMembers: (fn) => memberHandlers.push(fn),
    onStatus: (fn) => statusHandlers.push(fn),
    close: () => {
      void supabase.removeChannel(channel);
    },
  };
}
