'use client';

// S3. 반짝마을 지도: 탐험대가 마을을 돌아다니며 화살표를 따라가 미션 장소를 발견한다.
//  - 처음 도착 / 미션을 마치고 돌아왔을 때: 반디의 이야기 장면 (되살아난 곳이 서서히 밝아진다)
//  - 보기 두 가지: 가까이 보기(기본, 탐험대를 따라가며 크게) / 지도 보기(마을 전체를 한눈에)
//  - 장소에 도착: 상황 장면(움직이는 그림) + 문제 상황·우리가 할 일 → "미션 시작!"
//  - 잠긴 곳: "앞의 미션을 먼저 해결해야 열려요!"
//  - 세 곳 모두 되살리면 "마무리로 가기"
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MISSION_ORDER } from '@/data/missions';
import { CHARACTER, COMMON, RESTART, ROOM, S3, SITUATION, WORLD } from '@/data/strings';
import { PLACES, type Vec } from '@/data/world';
import { allMissionsDone, revivedCount } from '@/lib/flow/missionFlow';
import { useStore } from '@/lib/store/StoreContext';
import { type LivePeer, memberColor, presentMembers } from '@/lib/sync/live';
import { useLive } from '@/lib/sync/LiveContext';
import type { Member } from '@/lib/sync/roomSync';
import type { MissionId, StoryKey } from '@/lib/types';
import { playOpen } from '@/media/sound';
import { nextTarget, placeAt } from '@/lib/world/movement';
import { Button, ConfirmDialog } from '../ui';
import { FairyIcon } from '../village/Characters';
import MoveTutorial from '../village/MoveTutorial';
import { LockMark } from '../village/Props';
import SoundToggle from '../SoundToggle';
import SituationScene from '../village/SituationScene';
import VillageWorld, { type MapPeer, type WorldView } from '../village/VillageWorld';

/** 함께하기 중에는 화면 맨 위에 방 코드 띠(RoomBar)가 있다 */
const ROOM_BAR_HEIGHT = 36;

/** 되살린 곳 수에 따른 마을의 어두움 */
export const darknessFor = (revived: number) => [0.6, 0.42, 0.25, 0.06][revived] ?? 0.06;

export default function S3Map() {
  const { state, room, members, restart, goWrapup, enterMission } = useStore();
  const { peers, publish } = useLive();
  const [confirmRestart, setConfirmRestart] = useState(false);
  // 처음 도착 인사를 들은 뒤 움직이는 방법 튜토리얼
  const [tutorial, setTutorial] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // 튜토리얼은 연습: 돌아다니기만 하고, 끝나면 처음 자리로 돌아와 진짜로 출발한다
  const [practiceRound, setPracticeRound] = useState(0);
  const endTutorial = () => {
    setTutorial(false);
    setPracticeRound((n) => n + 1);
  };
  const closeRestart = useCallback(() => setConfirmRestart(false), []);
  const revived = revivedCount(state);
  const done = allMissionsDone(state);
  const [s1, s2, s3] = [state.missions.m1.status, state.missions.m2.status, state.missions.m3.status];
  const status = useMemo(() => ({ m1: s1, m2: s2, m3: s3 }), [s1, s2, s3]);
  // 이야기 장면은 각자 읽고 각자 닫는다 (모둠으로 할 때는 이 기기에만 기록)
  const [seen, markSeen] = useSeenStories();
  const story = pendingStory(seen, status);
  // 마무리로 가기: 마무리는 각자 하는 활동이라 누른 사람만 넘어간다 (goWrapup이 혼자/모둠을 나눠 처리)
  const reviving = story && story !== 'arrive' ? (story.slice('after-'.length) as MissionId) : null;

  // 되살아나는 장면: 처음에는 이전 밝기, 조금 뒤 새 밝기로 서서히 밝아진다
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!reviving) return;
    const timer = setTimeout(() => setRevealed(true), 500);
    return () => {
      clearTimeout(timer);
      setRevealed(false);
    };
  }, [reviving]);
  const darkness = darknessFor(reviving && !revealed ? revived - 1 : revived);

  const [view, setView] = useState<WorldView>('near');
  const [arrived, setArrived] = useState<MissionId | null>(null);
  const [lockedMessage, setLockedMessage] = useState(false);
  const onArrive = (id: MissionId) => {
    const locked = status[id] === 'locked';
    setLockedMessage(locked);
    if (!locked) setArrived(id);
  };

  // ───── 모둠 함께하기: 친구 캐릭터, 모이기, 모두 부르기 ─────
  const onMove = useCallback((p: Vec) => {
    // 반올림하지 않는다: 친구 화면이 "도착"을 판단하는 좌표와 똑같아야 한다 (경계에서 "오는 중"으로 보이지 않게)
    publish({ map: { x: p.x, y: p.y } });
  }, [publish]);
  // 지도를 떠나면(미션에 들어가면) 내 캐릭터와 부르기를 거둔다
  useEffect(() => () => publish({ map: null, call: null }), [publish]);
  const others: MapPeer[] = peers.flatMap((p) => (p.map
    ? [{ id: p.member.id, name: p.member.name, color: p.color, x: p.map.x, y: p.map.y }]
    : []));
  const [myCall, setMyCall] = useState(false);
  const closeSituation = () => {
    setArrived(null);
    setMyCall(false);
    publish({ call: null });
  };
  // 함께 가기: 부른 친구가 있는 장소로 바로 간다
  const [jump, setJump] = useState<{ to: Vec; key: number } | null>(null);
  const [dismissedCall, setDismissedCall] = useState<number | null>(null);
  const caller = room && !arrived
    ? peers.find((p) => p.call && p.call.at !== dismissedCall && status[p.call.place] !== 'locked')
    : undefined;

  return (
    // 지도가 화면 전체를 채우고, 제목·버튼·안내는 그 위에 떠 있다
    <main className="relative w-full overflow-hidden bg-[#3f5a4c]"
      style={{ height: room ? `calc(100dvh - ${ROOM_BAR_HEIGHT}px)` : '100dvh' }}>
      <div className="absolute inset-0">
        <VillageWorld
          status={status}
          target={story ? null : nextTarget(status)}
          paused={story !== null || arrived !== null}
          reviving={reviving}
          darkness={darkness}
          view={view}
          onArrive={onArrive}
          practice={tutorial}
          resetKey={practiceRound}
          onMove={room ? onMove : undefined}
          others={room ? others : undefined}
          me={room ? { name: room.me.name, color: memberColor(room.me.id) } : undefined}
          jumpTo={jump}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-3">
        {/* 다른 모둠으로 바꾸거나 처음부터 다시 할 때 (이 기기의 기록만 지운다) */}
        <button type="button" onClick={() => setConfirmRestart(true)}
          className="pointer-events-auto flex min-h-11 items-center gap-1.5 justify-self-start rounded-full bg-white/60 px-4 text-sm font-bold text-stone-700 shadow-sm outline-none backdrop-blur transition hover:bg-white/80">
          {/* 나가기 아이콘: 문과 바깥쪽 화살표 */}
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
            <path d="M15 8l4 4-4 4M19 12H9" />
          </svg>
          {RESTART.short}
        </button>
        <h1 className="pointer-events-auto flex min-h-11 items-center gap-3 rounded-full bg-white/60 px-5 text-lg font-bold shadow-sm backdrop-blur">
          [{state.groupName}] {COMMON.revived(revived)}
          <span className="flex gap-0.5" aria-hidden>
            {MISSION_ORDER.map((id) => (
              // 끝이 둥근 별 (동글동글하게)
              <svg key={id} viewBox="2.5 2.5 19 19" className="size-8">
                <path d="M12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72 3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08L12 17.27z"
                  strokeWidth={0.6} strokeLinejoin="round"
                  className={status[id] === 'done' ? 'fill-amber-400 stroke-amber-500' : 'fill-white stroke-slate-300'} />
              </svg>
            ))}
          </span>
        </h1>
        <div className="pointer-events-auto flex items-center gap-2 justify-self-end">
          <ViewToggle view={view} onChange={setView} />
          <SoundToggle inline />
        </div>
      </header>
      <ConfirmDialog open={confirmRestart} title={RESTART.title} body={RESTART.body} okLabel={RESTART.ok}
        cancelLabel={RESTART.cancel} onOk={restart} onCancel={closeRestart} />

      {story && (
        <StoryPanel storyKey={story} groupName={state.groupName} showWrapup={story === 'after-m3'}
          onDone={() => {
            markSeen(story);
            if (story === 'arrive') setTutorial(true);
          }}
          onWrapup={() => {
            markSeen(story);
            goWrapup();
          }} />
      )}

      {!story && !arrived && tutorial && <MoveTutorial near={view === 'near'} onDone={endTutorial} />}

      {!story && arrived && (
        <SituationPanel
          id={arrived}
          done={state.missions[arrived].status === 'done'}
          onStart={() => enterMission(arrived)}
          onRetry={() => enterMission(arrived, true)}
          onClose={closeSituation}
          gather={room ? gatherAt(arrived, room.me, members, peers) : null}
          onCall={() => {
            setMyCall(true);
            publish({ call: { place: arrived, at: Date.now() } });
          }}
          calling={myCall}
        />
      )}

      {/* 친구가 미션 장소에서 부르면: 함께 가기 */}
      {!story && caller?.call && (
        // 지도의 다른 버튼들과 같은 반투명 알약 모양
        <div role="status"
          className="pop-in absolute left-1/2 top-20 z-30 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-white/75 py-2 pl-5 pr-2 text-lg font-bold text-stone-800 shadow-md backdrop-blur">
          {ROOM.calling(caller.member.name, S3.places[caller.call.place])}
          <button type="button" onClick={() => setJump({ to: PLACES[caller.call!.place], key: (jump?.key ?? 0) + 1 })}
            className="min-h-11 rounded-full bg-amber-500 px-5 text-lg font-bold text-white outline-none transition hover:bg-amber-600">
            {ROOM.goTogether}
          </button>
          <button type="button" aria-label={WORLD.close} onClick={() => setDismissedCall(caller.call!.at)}
            className="flex size-10 items-center justify-center rounded-full text-stone-500 outline-none transition hover:bg-white/70 hover:text-stone-800">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}

      {!story && !arrived && lockedMessage && (
        <p role="status" className="pop-in absolute left-1/2 top-20 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-white px-4 py-2 text-lg font-bold text-rose-700 shadow-lg">
          {/* 자물쇠 색은 마을 그림(PropDefs)의 그라데이션을 함께 쓴다 */}
          <svg viewBox="-13 -13 26 26" className="size-7" aria-hidden><LockMark size={24} halo="#ffffff" /></svg>
          {S3.locked}
        </p>
      )}

      {/* 아래쪽: 마무리로 가기 버튼과 움직이는 방법 (이야기·튜토리얼 중에는 숨긴다) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-3">
        {done && !story && (
          <Button className="pointer-events-auto px-10 text-2xl" onClick={goWrapup}>
            {S3.toWrapup}
          </Button>
        )}
      </div>

      {/* 왼쪽 아래 물음표: 누르면 움직이는 방법을 다시 알려 준다 (이야기·튜토리얼 중에는 숨긴다) */}
      {!story && !tutorial && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
          <button type="button" onClick={() => setHelpOpen((o) => !o)} aria-expanded={helpOpen} aria-label={WORLD.help}
            className="flex size-11 items-center justify-center rounded-full bg-white/60 text-xl font-black text-stone-700 shadow-sm outline-none backdrop-blur transition hover:bg-white/80">
            ?
          </button>
          {helpOpen && (
            <div role="status" className="modal-rise flex items-center gap-1 rounded-full bg-white/60 py-1.5 pl-4 pr-3 text-sm font-semibold text-stone-700 shadow-sm backdrop-blur">
              {WORLD.howToMove}
              <button type="button" onClick={() => { setHelpOpen(false); setTutorial(true); }}
                className="rounded-full px-1 py-1 text-sm font-semibold text-stone-600 underline underline-offset-2 outline-none transition hover:text-stone-800">
                {WORLD.tutorial.replay}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/**
 * 이미 본 이야기 장면. 혼자 할 때는 학습 기록(storySeen)에,
 * 모둠으로 할 때는 각자 읽고 닫도록 이 기기에만 기록한다 (한 명이 닫아도 친구 화면의 이야기는 그대로).
 */
function useSeenStories(): [StoryKey[], (key: StoryKey) => void] {
  const { state, dispatch, room } = useStore();
  const storageKey = room ? `light-explorers:story-seen:v1:${state.groupId}:${room.me.id}` : null;
  const [local, setLocal] = useState<StoryKey[]>(() => {
    if (!storageKey) return [];
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) ?? '[]') as StoryKey[];
    } catch {
      return [];
    }
  });
  if (!storageKey) return [state.storySeen ?? [], (key) => dispatch({ type: 'SEE_STORY', key })];
  // 예전에 모둠 기록에 남은 것(이 방식 전에 본 이야기)도 본 것으로 친다
  const seen = [...(state.storySeen ?? []), ...local];
  return [seen, (key) => {
    const next = local.includes(key) ? local : [...local, key];
    setLocal(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }];
}

/** 아직 안 본 이야기 장면: 처음 도착 → 미션을 마친 순서대로 */
export function pendingStory(seen: readonly StoryKey[], status: Record<MissionId, string>): StoryKey | null {
  if (!seen.includes('arrive')) return 'arrive';
  const id = MISSION_ORDER.find((m) => status[m] === 'done' && !seen.includes(`after-${m}`));
  return id ? `after-${id}` : null;
}

/** 반디의 이야기: 상자 없이 반디와 말풍선만 지도 위에 떠 있다 */
function StoryPanel({ storyKey, groupName, showWrapup, onDone, onWrapup }: {
  storyKey: StoryKey; groupName: string; showWrapup: boolean; onDone: () => void; onWrapup: () => void;
}) {
  const line = WORLD.stories[storyKey];
  const text = typeof line === 'function' ? line(groupName) : line;
  return (
    <div className="pop-in pointer-events-none absolute inset-x-4 bottom-6 z-20 flex items-end justify-start gap-1"
      role="dialog" aria-label={CHARACTER}>
      <div className="bob shrink-0">
        <FairyIcon className="size-24 drop-shadow-lg" />
      </div>
      <div className="pointer-events-auto relative mb-8 flex max-w-xl flex-col gap-3 rounded-3xl bg-white px-6 py-4 shadow-xl">
        <span aria-hidden className="absolute -left-2 bottom-6 size-5 rotate-45 rounded-sm bg-white" />
        <div className="relative">
          <p className="text-sm font-bold text-amber-700">{CHARACTER}</p>
          <p className="text-lg leading-snug">{text}</p>
        </div>
        <div className="relative flex justify-end">
          {showWrapup ? (
            <Button onClick={onWrapup}>{S3.toWrapup}</Button>
          ) : (
            <Button onClick={onDone} autoFocus>{WORLD.ok}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 탐험(가까이) / 지도(전체). 고른 쪽을 가리키는 흰 칸이 옆으로 스르륵 미끄러진다 */
function ViewToggle({ view, onChange }: { view: WorldView; onChange: (v: WorldView) => void }) {
  const options: [WorldView, string][] = [['near', WORLD.viewNear], ['map', WORLD.viewMap]];
  return (
    <div className="relative grid grid-cols-2 justify-self-end rounded-full bg-white/45 p-1 shadow-sm backdrop-blur" role="group" aria-label="보기">
      <span aria-hidden
        className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white/85 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] ${
          view === 'map' ? 'translate-x-full' : 'translate-x-0'
        }`} />
      {options.map(([v, label]) => (
        <button key={v} type="button" aria-pressed={view === v} onClick={() => onChange(v)}
          className="relative min-h-9 rounded-full px-4 text-sm font-bold text-stone-700 outline-none">
          {label}
        </button>
      ))}
    </div>
  );
}

interface SituationProps {
  id: MissionId;
  done: boolean;
  onStart: () => void;
  onRetry: () => void;
  onClose: () => void;
  /** 모둠 함께하기: 누가 이 장소에 와 있는지. 모두 모여야 시작할 수 있다 */
  gather: Gather | null;
  onCall: () => void;
  calling: boolean;
}

interface Gather {
  members: { member: Member; color: string; here: boolean }[];
  ready: boolean;
}

/** 지금 들어와 있는 모둠원 중 이 장소에 와 있는 사람 (나는 이 창이 떠 있으니 와 있다) */
function gatherAt(id: MissionId, me: Member, members: Member[], peers: LivePeer[]): Gather {
  const list = presentMembers(members, me).map((member) => {
    const peer = peers.find((p) => p.member.id === member.id);
    const here = member.id === me.id || (peer?.map ? placeAt(peer.map) === id : false);
    return { member, color: memberColor(member.id), here };
  });
  return { members: list, ready: list.every((m) => m.here) };
}

/** 미션 장소에 도착: 움직이는 상황 장면과 문제 상황·우리가 할 일 */
function SituationPanel({ id, done, onStart, onRetry, onClose, gather, onCall, calling }: SituationProps) {
  const text = SITUATION[id];
  const blocked = gather !== null && !gather.ready;
  useEffect(() => playOpen(), []); // 장소에 도착하면 "띠링"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="pop-in relative flex max-h-full w-full max-w-2xl flex-col overflow-auto rounded-3xl bg-white shadow-2xl"
        role="dialog" aria-label={S3.places[id]}>
        <button type="button" onClick={onClose} aria-label={WORLD.close}
          className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/90 text-xl text-slate-600 shadow hover:bg-white hover:text-slate-900">
          ✕
        </button>
        <SituationScene id={id} fixed={done} />
        <div className="flex flex-col gap-3 p-4">
          <h2 className="text-xl font-black">{S3.places[id]}</h2>
          {done ? (
            <p className="text-base">{WORLD.alreadyDone}</p>
          ) : (
            <dl className="grid gap-2 text-base">
              <div className="rounded-2xl bg-rose-50 px-4 py-2">
                <dt className="text-sm font-bold text-rose-700">{WORLD.problem}</dt>
                <dd>{text.problem}</dd>
              </div>
              <div className="rounded-2xl bg-amber-50 px-4 py-2">
                <dt className="text-sm font-bold text-amber-800">{WORLD.todo}</dt>
                <dd>{text.todo}</dd>
              </div>
            </dl>
          )}
          {/* 모둠 함께하기: 모두 모여야 함께 들어간다 */}
          {gather && gather.members.length > 1 && (
            <div className="flex flex-col gap-2 rounded-2xl bg-stone-50 px-4 py-3">
              <ul className="flex flex-wrap gap-2">
                {gather.members.map(({ member, color, here }) => (
                  <li key={member.id} className={`flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-sm font-bold transition ${
                    here ? 'bg-white text-stone-700 shadow-sm' : 'text-stone-400'
                  }`}>
                    <span className={`flex size-5 items-center justify-center rounded-full text-[0.65rem] text-white ${here ? '' : 'opacity-40'}`}
                      style={{ background: color }} aria-hidden>
                      {here ? '✓' : ''}
                    </span>
                    {member.name}
                    {!here && <span className="font-semibold">· {ROOM.notHere}</span>}
                  </li>
                ))}
              </ul>
              {/* 아직 다 모이지 않았을 때만: 몇 명 모였는지와 모두 부르기 */}
              {!gather.ready && (
                <div className="flex items-center justify-between gap-2">
                  <p role="status" className="text-sm font-semibold text-stone-500">
                    {ROOM.gatherNeed(gather.members.filter((m) => m.here).length, gather.members.length)}
                  </p>
                  <button type="button" onClick={onCall} disabled={calling}
                    className="min-h-9 shrink-0 rounded-full border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-800 outline-none transition hover:bg-amber-100 disabled:border-transparent disabled:bg-transparent disabled:text-stone-400">
                    {calling ? ROOM.called : ROOM.callAll}
                  </button>
                </div>
              )}
            </div>
          )}
          {done ? (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" disabled={blocked} onClick={onRetry}>{WORLD.retry}</Button>
              <Button className="flex-1" disabled={blocked} onClick={onStart} autoFocus>{WORLD.review}</Button>
            </div>
          ) : (
            <Button disabled={blocked} onClick={onStart} autoFocus>{WORLD.startMission}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
