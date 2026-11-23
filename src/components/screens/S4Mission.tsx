'use client';

import { useCallback, useState } from 'react';
import { REQUIRED_LEVEL } from '@/data/boards';
import { MISSIONS } from '@/data/missions';
import { COMMON, HINTS, MISSION_STRINGS } from '@/data/strings';
import { currentResults, revivedCount } from '@/lib/flow/missionFlow';
import { actions } from '@/lib/store/actions';
import { useStore } from '@/lib/store/StoreContext';
import type { BoardId, JudgeResult, MissionStep } from '@/lib/types';
import CircuitBoard from '../circuit/CircuitBoard';
import { useHint } from '../circuit/useHint';
import MissionWorksheet from '../mission/MissionWorksheet';

const STEPS: MissionStep[] = ['predict', 'build', 'compare', 'confirm'];

/** S4. 미션 화면 (3곳 공통 틀. 미션마다 다른 것은 data/missions.ts, data/strings.ts에서 온다) */
export default function S4Mission() {
  const { state, muted, setMuted } = useStore();
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
      </footer>
    </div>
  );
}

function BoardPanel({ boardId, result, dark }: { boardId: BoardId; result: JudgeResult; dark: boolean }) {
  const { state, dispatch, muted } = useStore();
  const id = state.currentMission!;
  const record = state.missions[id];
  const board = state.boards[boardId];
  const text = MISSION_STRINGS[id];
  const editable = record.step === 'build';

  const onHintShown = useCallback(() => dispatch({ type: 'HINT_SHOWN' }), [dispatch]);
  const hint = useHint(board, result, editable, onHintShown);

  let observation: string | null = null;
  if (record.step !== 'predict') {
    if (result.level > 0 && result.level === REQUIRED_LEVEL[boardId]) observation = text.observation[boardId];
    if (result.reason === 'BUZZER_REVERSED' && board.switchClosed) observation = text.observation.extra ?? null;
    if (result.motorDirection === 'ccw') observation = text.observation.extra ?? observation;
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* 1단계(한 기기): 모둠원이 두 회로를 나누어 만들도록 이름표를 단다 (명세서 7-1) */}
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-800">
          {boardId === 'A' ? COMMON.roleA : COMMON.roleB}
        </span>
        <h2 className="text-xl font-bold">{boardId === 'A' ? COMMON.boardA : COMMON.boardB}</h2>
      </div>
      <div className={editable ? '' : 'opacity-90'}>
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
