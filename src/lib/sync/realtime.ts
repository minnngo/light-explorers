// 3단계: 모둠원이 각자 기기로 A·B 회로를 나누어 맡고, 서로의 조작을 실시간으로 본다. (뼈대)
//
// 방식: 모든 기기가 같은 reducer를 돌린다.
//   1) 내 기기에서 action을 dispatch하면 → 그 action을 같은 방(room)의 다른 기기에 broadcast
//   2) 다른 기기는 받은 action을 그대로 자기 reducer에 dispatch
//   reducer가 결정적(시각·id를 action에 담음)이라 모든 기기 화면이 같아진다.
//   늦게 들어온 기기는 서버에 저장된 스냅샷(HYDRATE)으로 시작한다.
//
// 남은 일 (TODO)
//   - room_code로 같은 모둠 기기 묶기 (입장 화면에 방 코드 입력)
//   - presence로 "누가 어느 회로 담당인지" 표시, 조작한 사람 이름 띄우기
//   - 동시에 같은 단계 버튼을 누를 때의 충돌 처리 (reducer guard가 대부분 막아 줌)
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import type { Action } from '@/lib/store/reducer';

/** 다른 기기와 공유할 action. 소리 끄기·어둡게 보기 같은 개인 설정은 공유하지 않는다 */
const SYNCED: ReadonlySet<Action['type']> = new Set<Action['type']>([
  'ADD_WIRE',
  'REMOVE_WIRE',
  'TOGGLE_SWITCH',
  'SET_PREDICTION',
  'GO_COMPARE',
  'BACK_TO_BUILD',
  'SET_COMPARE',
  'SET_EXPLANATION',
  'CONFIRM',
  'COMPLETE_MISSION',
  'OPEN_MISSION',
]);

export interface RemoteAction {
  action: Action;
  by: { name: string; role: 'A' | 'B' };
}

export interface RoomSync {
  send: (action: Action) => void;
  close: () => void;
}

export function joinRoom(
  roomCode: string,
  me: RemoteAction['by'],
  onRemote: (msg: RemoteAction) => void,
): RoomSync | null {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;

  const channel: RealtimeChannel = supabase.channel(`room:${roomCode}`, {
    config: { broadcast: { self: false }, presence: { key: `${me.role}:${me.name}` } },
  });
  channel
    .on('broadcast', { event: 'action' }, ({ payload }) => onRemote(payload as RemoteAction))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') void channel.track(me);
    });

  return {
    send: (action) => {
      if (!SYNCED.has(action.type)) return;
      void channel.send({ type: 'broadcast', event: 'action', payload: { action, by: me } satisfies RemoteAction });
    },
    close: () => void supabase.removeChannel(channel),
  };
}
