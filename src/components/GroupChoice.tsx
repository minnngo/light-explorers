'use client';

// 모두 동의: 모둠으로 할 때 고르는 문제는 각자 고르고, 지금 들어와 있는 모둠원이 모두 같은 답을 골라야 정해진다.
// 혼자 할 때는 고르면 바로 정해진다. 선택지 옆에는 그 답을 고른 친구가 색 동그라미로 보인다.
import { useEffect, useRef } from 'react';
import { ROOM } from '@/data/strings';
import { useStore } from '@/lib/store/StoreContext';
import { memberColor, tallyVotes, type VoteTally } from '@/lib/sync/live';
import { useLive } from '@/lib/sync/LiveContext';

export interface GroupChoice<T extends string> {
  /** 내가 고른 답 (선택지에 내 표시) */
  mine: T | null;
  pick: (v: T) => void;
  /** 모둠으로 할 때만: 누가 무엇을 골랐는지 */
  tally: VoteTally | null;
  /** 모둠이 정한 답 (모두 같은 답을 골랐을 때). 혼자 할 때는 정해 둔 답 */
  agreed: T | null;
}

/**
 * @param field 문제 이름 (모둠원 기기끼리 같은 문제를 알아보는 이름)
 * @param committed 지금 기록된 답
 * @param commit 답을 기록한다. 모둠으로 할 때는 모두 같은 답을 고른 순간 저절로 (auto=false면 부르는 쪽이 직접)
 */
export function useGroupChoice<T extends string>(
  field: string, committed: T | null, commit: (v: T) => void, { auto = true }: { auto?: boolean } = {},
): GroupChoice<T> {
  const { room, members } = useStore();
  const { peers, myVotes, vote } = useLive();
  const mine = room ? ((myVotes[field] as T | undefined) ?? null) : committed;
  const tally = room ? tallyVotes(field, room.me, mine, peers, members) : null;
  const agreed = room ? ((tally!.agreed as T | null) ?? null) : committed;

  // 모두 같은 답을 고르면 기록한다 (모든 기기가 같은 답을 기록하므로 여러 번 와도 결과는 같다)
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });
  useEffect(() => {
    if (room && auto && agreed !== null && agreed !== committed) commitRef.current(agreed);
  }, [room, auto, agreed, committed]);

  return {
    mine,
    pick: (v) => (room ? vote(field, v) : commit(v)),
    tally,
    agreed,
  };
}

/**
 * 이 문제들이 지금 모두 같은 답인지 (혼자 할 때는 늘 true).
 * 한 번 정해진 뒤에 누가 답을 바꾸면 다시 모두 같아질 때까지 다음으로 넘어갈 수 없다.
 */
export function useAllAgreed(fields: readonly string[]): boolean {
  const { room, members } = useStore();
  const { peers, myVotes } = useLive();
  if (!room) return true;
  return fields.every((f) => tallyVotes(f, room.me, myVotes[f] ?? null, peers, members).agreed !== null);
}

/** 선택지 옆: 이 답을 고른 모둠원 (색 동그라미에 이름 첫 글자, 이름은 마우스를 올리면) */
export function VoterDots({ tally, value }: { tally: VoteTally | null; value: string }) {
  if (!tally || tally.votes.length < 2) return null;
  const voters = tally.votes.filter((v) => v.value === value);
  if (voters.length === 0) return null;
  return (
    <span className="ml-auto flex shrink-0 -space-x-1 self-center pl-2">
      {voters.map((v) => (
        <span key={v.member.id} title={v.member.name}
          className="pop-in flex size-6 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white"
          style={{ background: memberColor(v.member.id) }}>
          {v.member.name.slice(0, 1)}
        </span>
      ))}
    </span>
  );
}

/**
 * 문제 아래 안내: 아직 모두 같은 답이 아닐 때만 ("모둠원 모두 같은 답을 골라야 정할 수 있어요 (1/2명)").
 * 모두 동의를 처음 만나는 도입에서만 쓴다 (미션·마무리에서는 친구 색 동그라미만으로 충분하다).
 */
export function AgreeNote({ tally, className = '' }: { tally: VoteTally | null; className?: string }) {
  if (!tally || tally.votes.length < 2 || tally.agreed) return null;
  return (
    <p role="status" className={`text-sm font-semibold text-stone-500 ${className}`}>
      {ROOM.agreeNeed(tally.same, tally.votes.length)}
    </p>
  );
}
