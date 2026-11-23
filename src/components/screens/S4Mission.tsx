'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { REQUIRED_LEVEL } from '@/data/boards';
import { MISSIONS } from '@/data/missions';
import { COMMON, HINTS, MISSION_STRINGS, NOW, ROOM, TUTORIAL } from '@/data/strings';
import { canGoCompare, currentResults, type MissionFocus, missionFocus, revivedCount } from '@/lib/flow/missionFlow';
import { actions } from '@/lib/store/actions';
import { loadTutorialDone, saveTutorialDone } from '@/lib/store/persistence';
import { isEditable } from '@/lib/store/reducer';
import { canOperateBoard, useStore } from '@/lib/store/StoreContext';
import { type BoardSnapshot, type CoachMark, coachFor, nextStep, stepDone, type TutorialStep } from '@/lib/tutorial/tutorial';
import type { BoardId, BoardState, JudgeResult, MissionStep } from '@/lib/types';
import CircuitBoard from '../circuit/CircuitBoard';
import { ownerNames, useRecentNote } from '../RoomBar';
import { useHint } from '../circuit/useHint';
import MissionWorksheet from '../mission/MissionWorksheet';

const STEPS: MissionStep[] = ['predict', 'build', 'compare', 'confirm'];

/** S4. 미션 화면 (3곳 공통 틀. 미션마다 다른 것은 data/missions.ts, data/strings.ts에서 온다) */
export default function S4Mission() {
  const { state, dispatch, muted, setMuted, room } = useStore();
  const id = state.currentMission!;
  const config = MISSIONS[id];
  const text = MISSION_STRINGS[id];
  const record = state.missions[id];
  const results = currentResults(state)!;
  const [dark, setDark] = useState(false);

  // 회로 만들기 튜토리얼: 이 기기에서 처음 ② 만들기에 들어오면 자동으로, 이후에는 "다시 보기"로
  const building = record.step === 'build' && record.status !== 'done';
  const tutorialBoard: BoardId = room?.me.role ?? 'A';
  const tutorial = useTutorial(building, state.boards[tutorialBoard]);

  // 지금 할 일이 있는 곳만 밝게, 나머지는 어둡게 (튜토리얼 중에는 회로판)
  const focus: MissionFocus | null = tutorial.step
    ? { area: 'boards', task: 'build', dim: 'soft' }
    : missionFocus(record, canGoCompare(state));
  const boardsLook = areaLook(focus, 'boards');
  const worksheetLook = areaLook(focus, 'worksheet');

  // 할 일이 바뀌면 밝아진 곳이 화면에 보이도록 스크롤 (태블릿에서는 학습지가 회로판 아래에 있다)
  const worksheetRef = useRef<HTMLElement>(null);
  const focusArea = focus?.area ?? null;
  const focusTask = focus?.task ?? null;
  useEffect(() => {
    if (!focusArea) return;
    const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (focusArea === 'boards') window.scrollTo({ top: 0, behavior: smooth });
    else worksheetRef.current?.scrollIntoView({ behavior: smooth, block: 'nearest' });
  }, [focusArea, focusTask]);

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
        {building && !tutorial.step && (
          <button type="button" className="min-h-11 rounded-xl border-2 border-amber-400 bg-white px-3 font-bold"
            onClick={tutorial.restart}>
            {TUTORIAL.replay}
          </button>
        )}
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

      {focus && !tutorial.step && (
        <p role="status" key={focus.task}
          className="pop-in sticky top-2 z-20 mx-4 mt-3 flex items-center gap-3 rounded-2xl bg-amber-500 px-4 py-2 text-lg font-bold text-white shadow-lg">
          <span className="shrink-0 rounded-full bg-white px-3 py-0.5 text-base text-amber-700">👉 {NOW.label}</span>
          {NOW.tasks[focus.task]}
        </p>
      )}

      {tutorial.step && (
        <TutorialCard step={tutorial.step} board={tutorialBoard} onNext={tutorial.next} onSkip={tutorial.finish} />
      )}

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_400px]">
        {(['A', 'B'] as const).map((b) => (
          <BoardPanel key={b} boardId={b} result={results[b]} dark={dark} look={boardsLook}
            coach={tutorial.step && b === tutorialBoard ? coachFor(tutorial.step) : undefined}
            hintsPaused={tutorial.step !== null} />
        ))}
        <MissionWorksheet ref={worksheetRef} className={`lg:col-span-2 xl:col-span-1 ${worksheetLook}`} />
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

function BoardPanel({ boardId, result, dark, look, coach, hintsPaused }: {
  boardId: BoardId; result: JudgeResult; dark: boolean; look: string; coach?: CoachMark; hintsPaused: boolean;
}) {
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
  // 튜토리얼 중에는 힌트 말풍선이 겹치지 않게 멈춘다
  const hint = useHint(board, result, record.step === 'build' && !hintsPaused, onHintShown);

  let observation: string | null = null;
  if (record.step !== 'predict') {
    if (result.level > 0 && result.level === REQUIRED_LEVEL[boardId]) observation = text.observation[boardId];
    if (result.reason === 'BUZZER_REVERSED' && board.switchClosed) observation = text.observation.extra ?? null;
    if (result.motorDirection === 'ccw') observation = text.observation.extra ?? observation;
  }

  return (
    <section className={`flex flex-col gap-2 ${look}`}>
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
            keepRinging={record.status !== 'done' && (record.step === 'build' || record.challenge === 'active')}
            onAddWire={(from, to) => dispatch(actions.addWire(boardId, from, to))}
            onRemoveWire={(wireId) => dispatch(actions.removeWire(boardId, wireId))}
            onToggleSwitch={() => dispatch(actions.toggleSwitch(boardId))}
            coach={editable ? coach : undefined}
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

/**
 * 튜토리얼 진행. 학생이 회로판에서 실제로 해 보면(전선 잇기·지우기·스위치) 다음 단계로 넘어간다.
 * 본 적이 있는지는 기기마다 따로 기록한다 (함께하기에서도 각자 자기 회로판으로 배운다).
 */
function useTutorial(building: boolean, board: BoardState) {
  const snapshot: BoardSnapshot = { wires: board.wires.length, switchClosed: board.switchClosed };
  const fresh = (b: boolean): TutorialState => ({
    step: b && !loadTutorialDone() ? 'connect' : null,
    baseline: snapshot,
    building: b,
  });
  const [t, setT] = useState<TutorialState>(() => fresh(building));

  // 렌더링 중에 바로 맞춘다 (effect 대신):
  //  - ② 만들기에 들어오거나 나가면 처음부터 / 끝
  //  - 학생이 이 단계의 일을 해냈으면 다음 단계로
  let next = t;
  if (building !== t.building) next = fresh(building);
  else if (t.step && stepDone(t.step, t.baseline, snapshot)) next = { ...t, step: nextStep(t.step), baseline: snapshot };
  if (next !== t) setT(next);

  const go = (step: TutorialStep | null) => setT({ ...next, step, baseline: snapshot });
  return {
    step: next.step,
    next: () => next.step && go(nextStep(next.step)),
    finish: () => {
      saveTutorialDone();
      go(null);
    },
    restart: () => go('connect'),
  };
}

interface TutorialState {
  step: TutorialStep | null;
  /** 지금 단계를 시작할 때의 회로판 */
  baseline: BoardSnapshot;
  building: boolean;
}

function TutorialCard({ step, board, onNext, onSkip }: {
  step: TutorialStep; board: BoardId; onNext: () => void; onSkip: () => void;
}) {
  const t = TUTORIAL.steps[step];
  const last = step === 'go';
  return (
    <section role="dialog" aria-label={TUTORIAL.title}
      className="pop-in sticky top-2 z-20 mx-4 mt-3 flex flex-wrap items-center gap-3 rounded-2xl border-4 border-amber-400 bg-amber-50 p-4 shadow-lg">
      <div className="flex min-w-64 flex-1 flex-col gap-1">
        <p className="text-sm font-bold text-amber-800">{TUTORIAL.title}</p>
        <p className="text-xl font-black">{t.title}</p>
        <p>{t.text}</p>
        {!last && <p className="font-bold text-sky-800">{TUTORIAL.where(board)}</p>}
      </div>
      <div className="flex gap-2">
        {!last && <button type="button" className="min-h-11 px-3 text-base text-slate-500 underline" onClick={onSkip}>{TUTORIAL.skip}</button>}
        {step === 'remove' && (
          <button type="button" className="min-h-11 rounded-2xl border-2 border-amber-500 bg-white px-5 font-bold" onClick={onNext}>
            {TUTORIAL.next}
          </button>
        )}
        {last && (
          <button type="button" className="min-h-11 rounded-2xl bg-amber-700 px-8 text-xl font-bold text-white" onClick={onSkip} autoFocus>
            {TUTORIAL.start}
          </button>
        )}
      </div>
    </section>
  );
}

/** 할 일이 있는 곳: 노란 테두리 / 없는 곳: 어둡게 (아직 볼 것 없음: 진하게, 보면서 해야 함: 살짝) */
function areaLook(focus: MissionFocus | null, area: MissionFocus['area']): string {
  const base = 'rounded-2xl transition duration-500';
  if (!focus) return base;
  if (focus.area === area) return `${base} p-2 ring-4 ring-amber-400 bg-amber-50/40`;
  return `${base} p-2 ${focus.dim === 'strong' ? 'opacity-30 grayscale' : 'opacity-60'}`;
}
