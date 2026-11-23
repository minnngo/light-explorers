'use client';

import { useCallback, useState } from 'react';
import { REQUIRED_LEVEL } from '@/data/boards';
import { MISSIONS } from '@/data/missions';
import { COMMON, HINTS, MISSION_STRINGS, ROOM } from '@/data/strings';
import { currentResults, revivedCount } from '@/lib/flow/missionFlow';
import { actions } from '@/lib/store/actions';
import { isEditable } from '@/lib/store/reducer';
import { canOperateBoard, useStore } from '@/lib/store/StoreContext';
import type { BoardId, JudgeResult, MissionStep } from '@/lib/types';
import CircuitBoard from '../circuit/CircuitBoard';
import { ownerNames, useRecentNote } from '../RoomBar';
import { useHint } from '../circuit/useHint';
import MissionWorksheet from '../mission/MissionWorksheet';

const STEPS: MissionStep[] = ['predict', 'build', 'compare', 'confirm'];

/** S4. 미션 화면 (3곳 공통 틀. 미션마다 다른 것은 data/missions.ts, data/strings.ts에서 온다) */
export default function S4Mission() {
  const { state, dispatch, muted, setMuted } = useStore();
  const id = state.currentMission!;
  const config = MISSIONS[id];
  const text = MISSION_STRINGS[id];
  const record = state.missions[id];
  const results = currentResults(state)!;
  const [dark, setDark] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b-2 border-amber-200 bg-white px-4 py-2">
        <h1 className="text-2xl font-black">{text.title}</h1>
        <ol className="flex gap-1">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`rounded-full px-3 py-1 text-base ${
                s === record.step ? 'bg-amber-500 font-bold text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {COMMON.stepLabels[i]}
            </li>
          ))}
        </ol>
        <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 font-bold">{COMMON.revived(revivedCount(state))}</span>
        {config.showDarkView && (
          <button type="button" className="min-h-11 rounded-xl bg-indigo-900 px-4 font-bold text-white"
            onClick={() => setDark((d) => !d)}>
            {dark ? COMMON.darkViewOff : COMMON.darkViewOn}
          </button>
        )}
      </header>

      {record.status === 'done' && (
        <p className="mx-4 mt-2 self-start rounded-full bg-emerald-100 px-3 py-1 text-base font-bold text-emerald-800">
          ✔ {COMMON.reviewing}
        </p>
      )}
      {config.part === 'bulb' && (
        <p className="mx-4 mt-2 self-start rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold">💡💡 {COMMON.sameBulbs}</p>
      )}

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_400px]">
        {(['A', 'B'] as const).map((b) => (
          <BoardPanel key={b} boardId={b} result={results[b]} dark={dark} />
        ))}
        <MissionWorksheet className="lg:col-span-2 xl:col-span-1" />
      </main>

      <footer className="flex flex-wrap items-center gap-3 border-t-2 border-amber-200 bg-white px-4 py-2 text-base">
        <p className="flex-1">
          ⚠️ {COMMON.safetyFooter} <b>{text.safetyExtra}</b>
        </p>
        <button type="button" className="min-h-11 rounded-xl border-2 border-slate-300 px-3" onClick={() => setMuted(!muted)}>
          {muted ? COMMON.muteOn : COMMON.muteOff}
        </button>
        {record.status === 'done' && (
          <button type="button" className="min-h-11 rounded-xl border-2 border-amber-400 px-3 font-bold"
            onClick={() => dispatch({ type: 'LEAVE_MISSION' })}>
            {COMMON.backToMap}
          </button>
        )}
      </footer>
    </div>
  );
}

function BoardPanel({ boardId, result, dark }: { boardId: BoardId; result: JudgeResult; dark: boolean }) {
  const { state, dispatch, muted, room, members } = useStore();
  const id = state.currentMission!;
  const record = state.missions[id];
  const board = state.boards[boardId];
  const text = MISSION_STRINGS[id];
  // 3단계: 함께하기에서는 내가 맡은 회로판만 조작한다 (다른 회로판은 보기만)
  const mine = canOperateBoard(room, boardId);
  const editable = isEditable(state, boardId) && mine;
  const note = useRecentNote(boardId);

  // 힌트 횟수는 그 회로판을 맡은 기기에서만 센다 (같은 힌트를 두 기기가 두 번 세지 않게)
  const onHintShown = useCallback(() => {
    if (mine) dispatch({ type: 'HINT_SHOWN' });
  }, [dispatch, mine]);
  // 힌트는 ② 만들기에서만 (8-1 도전 중에는 일부러 같은 극끼리 잇기 때문에 힌트를 주지 않는다)
  const hint = useHint(board, result, record.step === 'build', onHintShown);

  let observation: string | null = null;
  if (record.step !== 'predict') {
    if (result.level > 0 && result.level === REQUIRED_LEVEL[boardId]) observation = text.observation[boardId];
    if (result.reason === 'BUZZER_REVERSED' && board.switchClosed) observation = text.observation.extra ?? null;
    if (result.motorDirection === 'ccw') observation = text.observation.extra ?? observation;
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* 1단계(한 기기): 모둠원이 두 회로를 나누어 만들도록 이름표를 단다 (명세서 7-1) */}
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-800">
          {room ? ROOM.roleOwner(boardId, ownerNames(members, boardId, room.me)) : boardId === 'A' ? COMMON.roleA : COMMON.roleB}
        </span>
        <h2 className="text-xl font-bold">{boardId === 'A' ? COMMON.boardA : COMMON.boardB}</h2>
        {room && !mine && isEditable(state, boardId) && (
          <span className="text-sm text-slate-500">· {ROOM.notMyBoard(boardId)}</span>
        )}
      </div>
      <div className={`relative ${editable ? '' : 'opacity-90'}`}>
          {note && (
            <p role="status" className="pop-in absolute left-2 top-2 z-10 rounded-full bg-sky-900 px-3 py-1 text-sm text-white">
              {ROOM.did(note.by.name, ROOM.actions[note.type] ?? '')}
            </p>
          )}
          <CircuitBoard
            boardId={boardId}
            part={MISSIONS[id].part}
            board={board}
            result={result}
            editable={editable}
            dark={dark}
            muted={muted}
            onAddWire={(from, to) => dispatch(actions.addWire(boardId, from, to))}
            onRemoveWire={(wireId) => dispatch(actions.removeWire(boardId, wireId))}
            onToggleSwitch={() => dispatch(actions.toggleSwitch(boardId))}
          />
      </div>
      <p className="min-h-7 text-center font-bold text-amber-800">{observation}</p>
      {/* 힌트는 회로판 아래 말풍선으로. 회로판 위에 덮으면 부품이 가려진다 */}
      {hint && (
        <p role="status" className="pop-in rounded-2xl border-2 border-amber-400 bg-white p-3 shadow">
          💬 {HINTS[hint]}
        </p>
      )}
    </section>
  );
}
