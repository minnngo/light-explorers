'use client';

// S3. 반짝마을 지도: 탐험대가 마을을 돌아다니며 화살표를 따라가 미션 장소를 발견한다.
//  - 처음 도착 / 미션을 마치고 돌아왔을 때: 반디의 이야기 장면 (되살아난 곳이 서서히 밝아진다)
//  - 장소에 도착: 상황 발견 창 → "미션 시작!"
//  - 잠긴 곳: "앞의 미션을 먼저 해결해야 열려요!"
//  - 세 곳 모두 되살리면 "마무리로 가기"
import { useEffect, useMemo, useRef, useState } from 'react';
import { MISSION_ORDER } from '@/data/missions';
import { CHARACTER, COMMON, S3, WORLD } from '@/data/strings';
import { allMissionsDone, revivedCount } from '@/lib/flow/missionFlow';
import { actions } from '@/lib/store/actions';
import { useStore } from '@/lib/store/StoreContext';
import type { MissionId, StoryKey } from '@/lib/types';
import { WORLD as WORLD_SIZE } from '@/data/world';
import { nextTarget } from '@/lib/world/movement';
import { Button, Speech } from '../ui';
import VillageWorld from '../village/VillageWorld';

/**
 * 지도는 제목·안내를 놓고 남은 공간에 꽉 차게(비율 유지) 맞춘다.
 * 남은 공간의 크기를 직접 재서 폭 = min(남은 폭, 남은 높이 × 1200/700).
 */
function useFitWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 관찰을 시작하면 처음 한 번 바로 알려 주고, 이후 크기가 바뀔 때마다 다시 잰다
    const observer = new ResizeObserver(() =>
      setWidth(Math.min(el.clientWidth, (el.clientHeight * WORLD_SIZE.width) / WORLD_SIZE.height)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
/** 함께하기 중에는 화면 맨 위에 방 코드 띠(RoomBar)가 있다 */
const ROOM_BAR_HEIGHT = 36;

/** 되살린 곳 수에 따른 마을의 어두움 */
export const darknessFor = (revived: number) => [0.6, 0.42, 0.25, 0.06][revived] ?? 0.06;

export default function S3Map() {
  const { state, dispatch, room } = useStore();
  const [fitRef, fitWidth] = useFitWidth();
  const revived = revivedCount(state);
  const done = allMissionsDone(state);
  const [s1, s2, s3] = [state.missions.m1.status, state.missions.m2.status, state.missions.m3.status];
  const status = useMemo(() => ({ m1: s1, m2: s2, m3: s3 }), [s1, s2, s3]);
  const story = pendingStory(state.storySeen ?? [], status);
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

  const [arrived, setArrived] = useState<MissionId | null>(null);
  const [lockedMessage, setLockedMessage] = useState(false);
  const onArrive = (id: MissionId) => {
    const locked = status[id] === 'locked';
    setLockedMessage(locked);
    if (!locked) setArrived(id);
  };

  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 px-4 py-3"
      style={{ height: room ? `calc(100dvh - ${ROOM_BAR_HEIGHT}px)` : '100dvh' }}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-bold">🧭 {state.groupName}</p>
        <h1 className="text-2xl font-black">{S3.guide}</h1>
        <p className="rounded-full bg-amber-100 px-4 py-1 font-bold">{COMMON.revived(revived)}</p>
      </header>

      {/* 지도는 남은 공간에 꽉 차게, 가로·세로 중 좁은 쪽에 맞춘다 (위 제목·아래 안내까지 한 화면에) */}
      <div ref={fitRef} className="min-h-0 w-full flex-1">
        <div className="relative mx-auto" style={{ width: fitWidth ?? '100%', visibility: fitWidth ? 'visible' : 'hidden' }}>
        <VillageWorld
          status={status}
          target={story ? null : nextTarget(status)}
          paused={story !== null || arrived !== null}
          reviving={reviving}
          darkness={darkness}
          onArrive={onArrive}
        />

        {story && (
          <StoryPanel storyKey={story} groupName={state.groupName} showWrapup={story === 'after-m3'}
            onDone={() => dispatch({ type: 'SEE_STORY', key: story })}
            onWrapup={() => {
              dispatch({ type: 'SEE_STORY', key: story });
              dispatch({ type: 'GO_TO_WRAPUP' });
            }} />
        )}

        {!story && arrived && (
          <DiscoverPanel
            id={arrived}
            done={state.missions[arrived].status === 'done'}
            onStart={() => dispatch(actions.openMission(arrived))}
            onClose={() => setArrived(null)}
          />
        )}

        {!story && !arrived && lockedMessage && (
          <p role="status" className="pop-in absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl bg-white px-4 py-2 text-lg font-bold text-rose-700 shadow-lg">
            🔒 {S3.locked}
          </p>
        )}
      </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-slate-600">🕹️ {WORLD.howToMove}</p>
        {done && !story && (
          <Button className="px-10 text-2xl" onClick={() => dispatch({ type: 'GO_TO_WRAPUP' })}>
            {S3.toWrapup}
          </Button>
        )}
      </footer>
    </main>
  );
}

/** 아직 안 본 이야기 장면: 처음 도착 → 미션을 마친 순서대로 */
export function pendingStory(seen: readonly StoryKey[], status: Record<MissionId, string>): StoryKey | null {
  if (!seen.includes('arrive')) return 'arrive';
  const id = MISSION_ORDER.find((m) => status[m] === 'done' && !seen.includes(`after-${m}`));
  return id ? `after-${id}` : null;
}

const overlay = 'pop-in absolute inset-x-4 bottom-4 flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-xl md:inset-x-auto md:right-4 md:w-[30rem]';

function StoryPanel({ storyKey, groupName, showWrapup, onDone, onWrapup }: {
  storyKey: StoryKey; groupName: string; showWrapup: boolean; onDone: () => void; onWrapup: () => void;
}) {
  const line = WORLD.stories[storyKey];
  const text = typeof line === 'function' ? line(groupName) : line;
  return (
    <div className={overlay} role="dialog" aria-label={CHARACTER}>
      <Speech speaker={CHARACTER}>{text}</Speech>
      {storyKey === 'arrive' && <p className="text-base text-slate-600">🕹️ {WORLD.howToMove}</p>}
      {showWrapup ? (
        <Button className="text-xl" onClick={onWrapup}>{S3.toWrapup}</Button>
      ) : (
        <Button className="text-xl" onClick={onDone} autoFocus>{WORLD.ok}</Button>
      )}
    </div>
  );
}

function DiscoverPanel({ id, done, onStart, onClose }: { id: MissionId; done: boolean; onStart: () => void; onClose: () => void }) {
  return (
    <div className={overlay} role="dialog" aria-label={S3.places[id]}>
      <h2 className="text-xl font-black">📍 {S3.places[id]}</h2>
      <p>{done ? WORLD.alreadyDone(S3.places[id]) : WORLD.discover[id]}</p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose}>{WORLD.lookAround}</Button>
        <Button className="flex-1 text-xl" onClick={onStart} autoFocus>
          {done ? WORLD.review : WORLD.startMission}
        </Button>
      </div>
    </div>
  );
}
