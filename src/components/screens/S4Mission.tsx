'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { REQUIRED_LEVEL } from '@/data/boards';
import { MISSION_ORDER, MISSIONS } from '@/data/missions';
import { COMMON, HINTS, MISSION_STRINGS, ROOM, TUTORIAL } from '@/data/strings';
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
  // 자동으로 뜨는 건 미션 1(가로등)을 처음 만들 때만. 미션 2·3에서는 "연결 방법 다시 보기"로 직접 연다
  const tutorial = useTutorial(building, id === MISSION_ORDER[0], state.boards[tutorialBoard]);

  // 지금 할 일이 있는 곳만 밝게, 나머지는 어둡게 (튜토리얼 중에는 회로판)
  const focus: MissionFocus | null = tutorial.step
    ? { area: 'boards', task: 'build', dim: 'soft' }
    : missionFocus(record, canGoCompare(state));
  // 어두운 덮개(스포트라이트)는 ② 만들기에서는 쓰지 않는다: 회로를 만들며 탐험 과제 ✅를 함께 봐야 하기 때문
  const spotlight = focus && record.step !== 'build' ? focus : null;
  const boardsLook = areaLook(spotlight, 'boards');
  const worksheetLook = areaLook(spotlight, 'worksheet');

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
        {/* 언제든 마을 지도로 나갈 수 있다. 하던 것은 그대로 남아 다시 들어오면 이어서 한다 */}
        <button type="button" className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-3 font-bold"
          onClick={() => dispatch({ type: 'LEAVE_MISSION' })}>
          🗺️ {COMMON.backToMap}
        </button>
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

      {tutorial.step && (
        <TutorialCard step={tutorial.step} board={tutorialBoard} onNext={tutorial.next} onSkip={tutorial.finish} />
      )}

      {/* 스포트라이트: 화면 전체를 어둡게 덮고, 지금 할 곳(z-40)만 그 위로 밝게 드러난다.
          누르기는 막지 않는다 (소리 끄기 등은 그대로 쓸 수 있게) */}
      {spotlight && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-30 bg-slate-950 transition-opacity duration-500"
          style={{ opacity: spotlight.dim === 'strong' ? 0.7 : 0.55 }} />
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
function useTutorial(building: boolean, autoStart: boolean, board: BoardState) {
  const snapshot: BoardSnapshot = { wires: board.wires.length, switchClosed: board.switchClosed };
  const fresh = (b: boolean): TutorialState => ({
    step: b && autoStart && !loadTutorialDone() ? 'connect' : null,
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
      className="pop-in sticky top-2 z-40 mx-4 mt-3 flex flex-wrap items-center gap-3 rounded-2xl border-4 border-amber-400 bg-amber-50 p-4 shadow-lg">
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
          <button type="button" className="min-h-11 rounded-2xl bg-amber-700 px-8 text-xl font-bold text-white outline-none" onClick={onSkip} autoFocus>
            {TUTORIAL.start}
          </button>
        )}
      </div>
    </section>
  );
}

/** 지금 할 곳은 어두운 덮개 위로 올려 밝게 보이게 한다 (덮개는 z-30) */
function areaLook(focus: MissionFocus | null, area: MissionFocus['area']): string {
  return focus?.area === area ? 'relative z-40 rounded-2xl bg-background p-2' : 'rounded-2xl p-2';
}
