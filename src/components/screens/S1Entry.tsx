'use client';

import { useEffect, useState } from 'react';
import { ROOM, S1 } from '@/data/strings';
import { canStart } from '@/lib/flow/screenFlow';
import { actions } from '@/lib/store/actions';
import { useStore } from '@/lib/store/StoreContext';
import { isRealtimeAvailable } from '@/lib/sync/realtime';
import { normalizeRoomCode, ROOM_CODE_LENGTH, type Role } from '@/lib/sync/roomSync';
import { GLOVE_ART } from '@/media/assets';
import { Button, Choice } from '../ui';

/** 방을 찾지 못했다고 알려 주기까지 기다리는 시간 */
const JOIN_TIMEOUT_MS = 10_000;

const input =
  'min-h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-xl focus:border-amber-400 focus:outline-none';

/** S1. 모둠 입장과 안전 약속. (3단계) 여러 기기로 함께하기: 새 방 만들기 / 방 코드로 들어가기 */
export default function S1Entry() {
  const { dispatch, room, waitingForRoom, createRoom, joinRoom } = useStore();
  const realtime = isRealtimeAvailable();
  const [mode, setMode] = useState<'new' | 'join'>('new');
  const [together, setTogether] = useState(false);
  const [name, setName] = useState('');
  const [myName, setMyName] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [code, setCode] = useState('');
  const [checks, setChecks] = useState([false, false, false]);

  if (room && waitingForRoom) return <JoinWaiting />;

  const safetyOk = checks.every(Boolean);
  const memberOk = myName.trim().length > 0 && role !== null;
  const roomCode = normalizeRoomCode(code);
  const ready =
    mode === 'join'
      ? safetyOk && memberOk && roomCode !== null
      : canStart(name, checks) && (!together || memberOk);

  const onStart = () => {
    if (!ready) return;
    if (mode === 'join') joinRoom(roomCode!, { name: myName.trim(), role: role! });
    else if (together) createRoom(name, safetyOk, { name: myName.trim(), role: role! });
    else dispatch(actions.startExpedition(name, safetyOk));
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-4xl font-black">{S1.title}</h1>

      {realtime && (
        <div className="grid grid-cols-2 gap-2" role="tablist">
          {(['new', 'join'] as const).map((m) => (
            <Choice key={m} mark={false} selected={mode === m} role="tab" aria-selected={mode === m}
              className="text-center" onClick={() => setMode(m)}>
              {m === 'new' ? ROOM.modeNew : ROOM.modeJoin}
            </Choice>
          ))}
        </div>
      )}

      {mode === 'new' ? (
        <label className="flex flex-col gap-2">
          <span className="text-lg font-bold">{S1.nameGuide}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={S1.namePlaceholder}
            maxLength={20} className={input} />
        </label>
      ) : (
        <label className="flex flex-col gap-2">
          <span className="text-lg font-bold">{ROOM.codeLabel}</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={ROOM.codePlaceholder}
            maxLength={ROOM_CODE_LENGTH + 2} autoCapitalize="characters" autoComplete="off"
            className={`${input} uppercase tracking-[0.3em]`} />
          {code.trim().length >= ROOM_CODE_LENGTH && !roomCode && (
            <span className="font-bold text-rose-700">{ROOM.codeInvalid}</span>
          )}
        </label>
      )}

      {realtime && mode === 'new' && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" className="size-7 accent-sky-600" checked={together}
            onChange={(e) => setTogether(e.target.checked)} />
          <span>{ROOM.togetherToggle}</span>
        </label>
      )}

      {realtime && (mode === 'join' || together) && (
        <section className="flex flex-col gap-3 rounded-2xl bg-sky-50 p-5">
          <label className="flex flex-col gap-2">
            <span className="font-bold">{ROOM.myName}</span>
            <input value={myName} onChange={(e) => setMyName(e.target.value)} placeholder={ROOM.myNamePlaceholder}
              maxLength={10} className={input} />
          </label>
          <div className="flex flex-col gap-2">
            <span className="font-bold">{ROOM.myRole}</span>
            <div className="grid grid-cols-2 gap-2">
              {(['A', 'B'] as const).map((r) => (
                <Choice key={r} selected={role === r} onClick={() => setRole(r)}>{ROOM.roleName[r]}</Choice>
              ))}
            </div>
          </div>
        </section>
      )}

      <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow">
        <legend className="flex items-center gap-2 px-1 font-bold">
          <span className="text-3xl" aria-hidden>{GLOVE_ART}</span>
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
        {mode === 'join' ? ROOM.join : S1.start}
      </Button>
    </main>
  );
}

/** 방 코드로 들어와 모둠 화면을 받는 중 */
function JoinWaiting() {
  const { room, leaveRoom } = useStore();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), JOIN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <main className="m-auto flex max-w-xl flex-col items-center gap-4 p-6 text-center">
      <p className="blink text-6xl" aria-hidden>🔗</p>
      <p className="text-2xl font-bold">{ROOM.waiting}</p>
      <p className="text-xl tracking-[0.3em]">{room?.code}</p>
      {slow && <p className="font-bold text-rose-700">{ROOM.notFound}</p>}
      <Button variant="secondary" onClick={leaveRoom}>{ROOM.cancel}</Button>
    </main>
  );
}
