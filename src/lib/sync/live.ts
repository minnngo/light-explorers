// 모둠 함께하기의 "실시간 존재감": 친구 커서, 끌고 있는 전선, 쓰는 중인 칸, 지도 위 위치.
// 저장하지 않고 게임 상태(reducer)에도 넣지 않는다. 자주(초당 15번쯤) 보내고, 받은 쪽은 화면에만 그린다.
import type { BoardId, MissionId, TerminalId } from '@/lib/types';
import type { Member } from './roomSync';

export interface LivePresence {
  /** 회로판 위 포인터. 좌표는 회로판 그림(viewBox) 기준이라 화면 크기가 달라도 같은 자리를 가리킨다 */
  board: { id: BoardId; x: number; y: number; from: TerminalId | null } | null;
  /** 지금 쓰고 있는 서술형 칸 (쓰는 중 잠금) */
  editing: string | null;
  /** 마을 지도 위 내 캐릭터 위치 */
  map: { x: number; y: number } | null;
  /** 모두 동의해야 정하는 문제에서 내가 고른 답 (예: 미션 예상) */
  vote: { field: string; value: string } | null;
  /** 미션 장소에서 모둠원을 부르는 중 ("모두 부르기") */
  call: { place: MissionId; at: number } | null;
}

export const EMPTY_PRESENCE: LivePresence = { board: null, editing: null, map: null, vote: null, call: null };

export interface LiveMessage extends LivePresence {
  by: Member;
  at: number;
}

export interface LiveTransport {
  sendLive: (msg: LiveMessage) => void;
  onLive: (fn: (msg: LiveMessage) => void) => void;
}

/** 친구 한 명의 지금 모습 */
export interface LivePeer extends LivePresence {
  member: Member;
  color: string;
  at: number;
}

/** 보내는 간격 (움직임이 많아도 이보다 자주 보내지 않는다) */
export const LIVE_SEND_MS = 66;
/** 움직이지 않아도 이 간격으로 한 번씩 알린다 (늦게 들어온 친구도 쓰는 중 잠금을 알 수 있게) */
export const LIVE_KEEPALIVE_MS = 3000;
/** 이 시간 동안 소식이 없으면 그 친구 표시를 지운다 */
export const LIVE_STALE_MS = 9000;

// 모둠원마다 다른 색 (회로판의 전선 색·경고 빨강과 겹치지 않게 고른 색)
const MEMBER_COLORS = ['#e11d74', '#0d9488', '#7c3aed', '#d97706', '#2563eb', '#65a30d', '#db2777', '#0369a1'];

/** 기기 id로 정해지는 색. 모든 기기에서 같은 친구는 같은 색으로 보인다 */
export function memberColor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return MEMBER_COLORS[h % MEMBER_COLORS.length];
}

/** 지금 들어와 있는 모둠원. 나를 맨 앞에, 내 기기는 presence가 오기 전에도 보이도록 직접 넣는다 */
export function presentMembers(members: Member[], me: Member): Member[] {
  return [me, ...members.filter((m) => m.id !== me.id)];
}

/** 모둠에서 한 번만 해야 하는 일(힌트 횟수 세기 등)을 맡는 기기: roomSync의 heartbeat를 보내는 기기와 같은 규칙 */
export function isLeader(room: { host: boolean; me: Member }, members: Member[]): boolean {
  return room.host || [...members.map((m) => m.id), room.me.id].sort()[0] === room.me.id;
}

export interface VoteTally {
  /** 모둠원마다 고른 답 (아직 안 골랐으면 null) */
  votes: { member: Member; value: string | null }[];
  /** 모두 같은 답을 골랐으면 그 답 */
  agreed: string | null;
  /** 가장 많이 고른 답을 고른 사람 수 */
  same: number;
}

/** 모두 동의: 지금 들어와 있는 모둠원이 모두 같은 답을 골랐는지 */
export function tallyVotes(field: string, me: Member, myValue: string | null, peers: LivePeer[], members: Member[]): VoteTally {
  const votes = presentMembers(members, me).map((member) => {
    if (member.id === me.id) return { member, value: myValue };
    const vote = peers.find((p) => p.member.id === member.id)?.vote;
    return { member, value: vote && vote.field === field ? vote.value : null };
  });
  const counts = new Map<string, number>();
  for (const v of votes) if (v.value !== null) counts.set(v.value, (counts.get(v.value) ?? 0) + 1);
  const same = Math.max(0, ...counts.values());
  const agreed = counts.size === 1 && same === votes.length ? [...counts.keys()][0] : null;
  return { votes, agreed, same };
}

/**
 * 이 칸을 쓰고 있는 친구 (내가 아닌). 두 사람이 동시에 누르면 id가 앞서는 사람이 쓴다.
 * 모든 기기가 같은 규칙으로 고르므로 누가 쓸지 서로 어긋나지 않는다.
 */
export function editingOwner(field: string, me: { id: string; editing: string | null }, peers: LivePeer[]): Member | null {
  const writers = peers.filter((p) => p.editing === field);
  if (writers.length === 0) return null;
  const first = [...writers].sort((a, b) => (a.member.id < b.member.id ? -1 : 1))[0];
  if (me.editing === field && me.id < first.member.id) return null;
  return first.member;
}
