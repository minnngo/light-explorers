'use client';

import { useEffect, useState } from 'react';
import { ROOM, S1 } from '@/data/strings';
import { canStart } from '@/lib/flow/screenFlow';
import { actions } from '@/lib/store/actions';
import { type ClassGroupInfo, useStore } from '@/lib/store/StoreContext';
import { isRealtimeAvailable } from '@/lib/sync/realtime';
import { Button, Choice } from '../ui';
import { FairyIcon } from '../village/Characters';
import { GloveIcon } from '../village/Props';
import Opening from './Opening';

/** 모둠 화면을 받지 못했다고 알려 주기까지 기다리는 시간 */
const JOIN_TIMEOUT_MS = 10_000;

const input =
  'min-h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-xl focus:border-amber-400 focus:outline-none';

/**
 * S1. 입장과 안전 약속.
 *  - 혼자 하기: 모둠 이름을 쓰고 시작 (한 기기)
 *  - 모둠으로 하기: 선생님이 미리 만든 모둠 목록에서 우리 모둠을 골라 들어간다. 같은 모둠 친구들과 실시간으로 함께한다
 */
export default function S1Entry() {
  const { dispatch, room, waitingForRoom, joinGroup } = useStore();
  const realtime = isRealtimeAvailable();
  const [mode, setMode] = useState<'solo' | 'group'>('solo');
  const [name, setName] = useState('');
  const [myName, setMyName] = useState('');
  const [group, setGroup] = useState<ClassGroupInfo | null>(null);
  const [joining, setJoining] = useState(false);
  const [checks, setChecks] = useState([false, false, false]);
  // 처음 접속했을 때와 처음부터 다시 할 때는 오프닝부터 (방에 들어가는 중이면 건너뛴다)
  const [opening, setOpening] = useState(() => room === null);

  if (opening) return <Opening onDone={() => setOpening(false)} />;
  if (room && waitingForRoom) return <JoinWaiting />;

  const safetyOk = checks.every(Boolean);
  const ready = mode === 'group'
    ? safetyOk && group !== null && myName.trim().length > 0 && !joining
    : canStart(name, checks);

  const onStart = () => {
    if (!ready) return;
    if (mode === 'group') {
      setJoining(true);
      void joinGroup(group!, { name: myName.trim() }).finally(() => setJoining(false));
    } else {
      dispatch(actions.startExpedition(name, safetyOk));
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-4xl font-black">{S1.title}</h1>

      {realtime && (
        <div className="grid grid-cols-2 gap-2" role="tablist">
          {(['solo', 'group'] as const).map((m) => (
            <Choice key={m} mark={false} selected={mode === m} role="tab" aria-selected={mode === m}
              className="text-center" onClick={() => setMode(m)}>
              {m === 'solo' ? ROOM.modeSolo : ROOM.modeGroup}
            </Choice>
          ))}
        </div>
      )}

      {mode === 'solo' ? (
        <label className="flex flex-col gap-2">
          <span className="text-lg font-bold">{S1.nameGuide}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={S1.namePlaceholder}
            maxLength={10} className={input} />
        </label>
      ) : (
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-5">
          <GroupPicker selected={group} onSelect={setGroup} />
          <label className="flex flex-col gap-2">
            <span className="font-bold">{ROOM.myName}</span>
            <input value={myName} onChange={(e) => setMyName(e.target.value)} placeholder={ROOM.myNamePlaceholder}
              maxLength={10} className={input} />
          </label>
        </section>
      )}

      <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow">
        <legend className="flex items-center gap-2 px-1 font-bold">
          <GloveIcon className="size-10" />
          {S1.safetyTitle}
        </legend>
        {S1.safetyPromises.map((text, i) => (
          <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-7 accent-amber-500"
              checked={checks[i]}
              onChange={(e) => setChecks((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
            />
            <span>{text}</span>
          </label>
        ))}
      </fieldset>

      <Button disabled={!ready} className="self-center px-10 text-2xl" onClick={onStart}>
        {mode === 'group' ? ROOM.enterGroup : S1.start}
      </Button>
    </main>
  );
}

/** 선생님이 오늘 만든 모둠 목록 */
function GroupPicker({ selected, onSelect }: { selected: ClassGroupInfo | null; onSelect: (g: ClassGroupInfo) => void }) {
  const [groups, setGroups] = useState<ClassGroupInfo[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void fetch('/api/groups', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { groups: ClassGroupInfo[] }) => {
        if (cancelled) return;
        setGroups(body.groups);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-bold">{ROOM.pickGroup}</span>
        <button type="button" onClick={() => setReload((n) => n + 1)}
          className="rounded-full px-2 py-1 text-sm font-semibold text-stone-500 underline underline-offset-2 outline-none hover:text-stone-800">
          {ROOM.reloadGroups}
        </button>
      </div>
      {failed ? (
        <p className="font-semibold text-rose-700">{ROOM.groupsFailed}</p>
      ) : groups === null ? (
        <p className="text-stone-500">{ROOM.loadingGroups}</p>
      ) : groups.length === 0 ? (
        <p className="text-stone-500">{ROOM.noGroups}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {groups.map((g) => (
            <Choice key={g.id} mark={false} selected={selected?.id === g.id} className="text-center"
              onClick={() => onSelect(g)}>
              {g.name}
            </Choice>
          ))}
        </div>
      )}
    </div>
  );
}

/** 모둠에 들어와 모둠 화면을 받는 중 (서버 상태를 못 받았을 때 친구 기기에서 받는다) */
function JoinWaiting() {
  const { leaveRoom } = useStore();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), JOIN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <main className="m-auto flex max-w-xl flex-col items-center gap-4 p-6 text-center">
      <FairyIcon className="bob size-24" />
      <p className="text-2xl font-bold">{ROOM.waiting}</p>
      {slow && <p className="font-bold text-rose-700">{ROOM.notFound}</p>}
      <Button variant="secondary" onClick={leaveRoom}>{ROOM.cancel}</Button>
    </main>
  );
}
