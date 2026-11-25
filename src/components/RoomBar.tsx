'use client';

// 3단계: 모둠으로 할 때 화면 맨 위에 모둠 이름과 지금 들어와 있는 모둠원(커서와 같은 색)을 보여 준다.
import { ROOM } from '@/data/strings';
import { useStore } from '@/lib/store/StoreContext';
import { memberColor, presentMembers } from '@/lib/sync/live';

export default function RoomBar() {
  const { state, room, members, connection } = useStore();
  if (!room) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-sky-900 px-4 py-1 text-base text-white">
      <span className="font-bold">{state.groupName}</span>
      <ul className="flex flex-wrap items-center gap-1.5" aria-label={ROOM.membersLabel}>
        {presentMembers(members, room.me).map((m) => (
          <li key={m.id} className="flex items-center gap-1.5 rounded-full bg-white/15 py-0.5 pl-1.5 pr-2.5 text-sm font-semibold">
            <span className="size-3 rounded-full ring-2 ring-white/70" style={{ background: memberColor(m.id) }} aria-hidden />
            {m.id === room.me.id ? `${m.name}${ROOM.me}` : m.name}
          </li>
        ))}
      </ul>
      {connection === 'connecting' && <span className="text-sky-200">{ROOM.connecting}</span>}
      {connection === 'offline' && <span className="font-bold text-amber-300">{ROOM.offline}</span>}
    </div>
  );
}
