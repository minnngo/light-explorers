'use client';

// 3단계: 모둠으로 할 때 화면 맨 위에 모둠 이름, 지금 들어와 있는 모둠원(커서와 같은 색), 다른 친구가 방금 한 조작을 보여 준다.
import { useEffect, useState } from 'react';
import { ROOM } from '@/data/strings';
import { type RemoteNote, useStore } from '@/lib/store/StoreContext';
import { memberColor, presentMembers } from '@/lib/sync/live';

/** 다른 기기의 조작을 보여 주는 시간 */
export const REMOTE_NOTE_MS = 3000;

export default function RoomBar() {
  const { state, room, members, connection } = useStore();
  const note = useRecentNote(null);
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
      {note && (
        <span role="status" className="pop-in ml-auto rounded-full bg-white px-3 text-sky-900">
          {ROOM.did(note.by.name, ROOM.actions[note.type] ?? '')}
        </span>
      )}
    </div>
  );
}

/**
 * 방금(3초 안) 다른 기기에서 한 조작. board를 주면 그 회로판 조작만, null이면 회로판이 아닌 조작만.
 */
export function useRecentNote(board: RemoteNote['board']): RemoteNote | null {
  const { remoteNote } = useStore();
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  const matches = remoteNote !== null && remoteNote.board === board && ROOM.actions[remoteNote.type] !== undefined;

  useEffect(() => {
    if (!matches) return;
    const timer = setTimeout(() => setExpiredAt(remoteNote.at), REMOTE_NOTE_MS);
    return () => clearTimeout(timer);
  }, [matches, remoteNote]);

  return matches && expiredAt !== remoteNote.at ? remoteNote : null;
}
