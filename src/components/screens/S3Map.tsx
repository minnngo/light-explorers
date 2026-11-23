'use client';

import { useState } from 'react';
import { MISSION_ORDER } from '@/data/missions';
import { COMMON, S3 } from '@/data/strings';
import { allMissionsDone, revivedCount } from '@/lib/flow/missionFlow';
import { actions } from '@/lib/store/actions';
import { useStore } from '@/lib/store/StoreContext';
import type { MissionId } from '@/lib/types';
import { PLACE_ICONS, VILLAGE_ART } from '@/media/assets';
import { Button } from '../ui';

/** S3. 마을 지도: 미션 고르기와 진행 표시 */
export default function S3Map() {
  const { state, dispatch } = useStore();
  const [lockedMessage, setLockedMessage] = useState(false);
  const revived = revivedCount(state);
  const done = allMissionsDone(state);

  const onPick = (id: MissionId) => {
    const status = state.missions[id].status;
    if (status === 'locked') setLockedMessage(true);
    if (status === 'open') dispatch(actions.openMission(id));
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <p className="text-lg font-bold">🧭 {state.groupName}</p>
        <p className="rounded-full bg-amber-100 px-4 py-1 font-bold">{COMMON.revived(revived)}</p>
      </header>
      <h1 className="text-center text-3xl font-black">{S3.guide}</h1>

      <section
        className={`relative grid flex-1 grid-cols-3 items-end gap-6 rounded-3xl p-8 transition-colors ${
          done ? 'bg-sky-200' : 'bg-indigo-950'
        }`}
      >
        <span className="absolute left-6 top-4 text-5xl" aria-hidden>
          {done ? VILLAGE_ART.bright : VILLAGE_ART.dark}
        </span>
        {MISSION_ORDER.map((id) => {
          const status = state.missions[id].status;
          const showFirstBubble = id === 'm1' && revived === 0;
          return (
            <div key={id} className="relative flex flex-col items-center gap-2">
              {showFirstBubble && (
                <p className="absolute -top-14 whitespace-nowrap rounded-2xl bg-white px-3 py-2 text-base shadow">
                  {S3.firstBubble}
                </p>
              )}
              <button
                type="button"
                onClick={() => onPick(id)}
                aria-label={`${S3.places[id]} (${status === 'locked' ? '잠김' : status === 'done' ? '완료' : '도전 가능'})`}
                className={`flex size-36 flex-col items-center justify-center rounded-3xl text-6xl shadow-lg ${
                  status === 'locked'
                    ? 'bg-slate-400 grayscale'
                    : status === 'done'
                      ? 'bg-amber-200'
                      : 'blink bg-white ring-4 ring-amber-400'
                }`}
              >
                <span aria-hidden>{status === 'done' ? PLACE_ICONS[id].on : PLACE_ICONS[id].off}</span>
                {status === 'locked' && <span className="text-2xl">🔒</span>}
              </button>
              <p className={`text-lg font-bold ${done ? 'text-slate-800' : 'text-white'}`}>{S3.places[id]}</p>
            </div>
          );
        })}
      </section>

      {lockedMessage && <p className="text-center text-lg font-bold text-rose-700">{S3.locked}</p>}
      {done && (
        <Button className="self-center px-10 text-2xl" onClick={() => dispatch({ type: 'GO_TO_WRAPUP' })}>
          {S3.toWrapup}
        </Button>
      )}
    </main>
  );
}
