'use client';

// 3단계: 함께하기 중일 때 화면 맨 위에 방 코드, 회로 담당, 다른 친구가 방금 한 조작을 보여 준다.
import { useEffect, useState } from 'react';
import { ROOM } from '@/data/strings';
import { type RemoteNote, useStore } from '@/lib/store/StoreContext';
import type { Member, Role } from '@/lib/sync/roomSync';

/** 다른 기기의 조작을 보여 주는 시간 */
export const REMOTE_NOTE_MS = 3000;

export default function RoomBar() {
  const { room, members, connection } = useStore();
  const note = useRecentNote(null);
  if (!room) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-sky-900 px-4 py-1 text-base text-white">
      <span className="font-bold tracking-wide">🔗 {ROOM.bar(room.code)}</span>
      {(['A', 'B'] as const).map((role) => (
        <span key={role}>{ROOM.roleOwner(role, ownerNames(members, role, room.me))}</span>
      ))}
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

/** 담당자 이름. 내 기기는 presence가 오기 전에도 보이도록 직접 넣는다 */
export function ownerNames(members: Member[], role: Role, me: Member): string {
  const list = members.some((m) => m.id === me.id) ? members : [...members, me];
  const names = list.filter((m) => m.role === role).map((m) => (m.id === me.id ? `${m.name}${ROOM.me}` : m.name));
  return names.length ? names.join(', ') : ROOM.nobody;
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
