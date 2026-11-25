'use client';

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { REQUIRED_LEVEL } from '@/data/boards';
import { MISSION_ORDER, MISSIONS } from '@/data/missions';
import { COMMON, HINTS, MISSION_STRINGS, ROOM, TUTORIAL } from '@/data/strings';
import { challengeBoardCoach } from '@/lib/flow/challenge';
import { canGoCompare, currentResults, type MissionFocus, missionFocus } from '@/lib/flow/missionFlow';
import { actions } from '@/lib/store/actions';
import { loadTutorialDone, saveTutorialDone } from '@/lib/store/persistence';
import { isEditable } from '@/lib/store/reducer';
import { useStore } from '@/lib/store/StoreContext';
import { isLeader } from '@/lib/sync/live';
import { useLive } from '@/lib/sync/LiveContext';
import { type BoardSnapshot, type CoachMark, coachFor, nextStep, stepDone, type TutorialStep } from '@/lib/tutorial/tutorial';
import type { BoardId, BoardState, JudgeResult, MissionStep } from '@/lib/types';
import CircuitBoard from '../circuit/CircuitBoard';
import { useRecentNote } from '../RoomBar';
import { useHint } from '../circuit/useHint';
import MissionIntro from '../mission/MissionIntro';
import MissionWorksheet from '../mission/MissionWorksheet';
import LiveCursors from '../LiveCursors';
import SoundToggle from '../SoundToggle';
import { CloseButton, ProgressDots } from '../ui';

const STEPS: MissionStep[] = ['predict', 'build', 'compare', 'confirm'];

/** 위쪽 줄의 버튼 모양 (지도 화면 버튼과 같은 알약) */
const PILL =
  'flex min-h-11 items-center gap-1.5 rounded-full bg-white/60 px-4 text-sm font-bold text-stone-700 shadow-sm outline-none backdrop-blur transition hover:bg-white/80';

/** S4. 미션 화면 (3곳 공통 틀. 미션마다 다른 것은 data/missions.ts, data/strings.ts에서 온다) */
export default function S4Mission() {
  const { state, dispatch } = useStore();
  const id = state.currentMission!;
  const config = MISSIONS[id];
  const text = MISSION_STRINGS[id];
  const record = state.missions[id];
  const results = currentResults(state)!;
  const [dark, setDark] = useState(false);
  // 미션에 들어올 때마다(다시 하기 포함) 반디의 이야기부터. ✕나 건너뛰기로 언제든 닫을 수 있다
  const [storyOpen, setStoryOpen] = useState(true);

  // 회로 만들기 튜토리얼: 이 기기에서 처음 ② 만들기에 들어오면 자동으로, 이후에는 "다시 보기"로
  const building = record.step === 'build' && record.status !== 'done';
  // 튜토리얼은 A 회로판에서 (모둠 함께하기에서도 같은 회로판을 함께 보며 배운다)
  const tutorialBoard: BoardId = 'A';
  // 자동으로 뜨는 건 미션 1(가로등)을 처음 만들 때만. 미션 2·3에서는 "연결 방법 다시 보기"로 직접 연다
  const tutorial = useTutorial(building && !storyOpen, id === MISSION_ORDER[0], state.boards[tutorialBoard]);

  // 지금 할 일이 있는 곳만 밝게, 나머지는 어둡게 (튜토리얼 중에는 회로판)
  const focus: MissionFocus | null = tutorial.step
    ? { area: 'boards', task: 'build', dim: 'soft' }
    : missionFocus(record, canGoCompare(state));
  // 어두운 덮개(스포트라이트)는 ② 만들기에서는 쓰지 않는다: 회로를 만들며 탐험 과제 ✅를 함께 봐야 하기 때문
  const spotlight = focus && record.step !== 'build' ? focus : null;
  const boardsLook = areaLook(spotlight, 'boards');
  // 도전 중에는 회로판과 함께 학습지도 밝게 둔다 (그만하기·지도로 돌아가기를 누를 수 있게)
  const worksheetLook = spotlight?.task === 'challenge' ? RAISED : areaLook(spotlight, 'worksheet');

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
      <header data-cursor-anchor="header" className="flex flex-wrap items-center gap-3 border-b border-stone-200 bg-white/70 px-4 py-2 backdrop-blur">
        <h1 className="text-xl font-bold">{COMMON.missionTitle(MISSION_ORDER.indexOf(id) + 1, text.title)}</h1>
        <Stepper current={record.step} done={record.status === 'done'} />
        {/* 오른쪽 위: 연결 방법 다시 보기(만들기 단계) · 지도 · 어둡게 보기 · 소리 (모두 같은 알약 모양) */}
        <div className="ml-auto flex items-center gap-2">
          {building && !tutorial.step && (
            <button type="button" onClick={tutorial.restart}
              className="rounded-full px-2 py-1 text-sm font-semibold text-stone-500 underline underline-offset-2 outline-none hover:text-stone-800">
              {TUTORIAL.replay}
            </button>
          )}
          {/* 언제든 마을 지도로 나갈 수 있다. 하던 것은 그대로 남아 다시 들어오면 이어서 한다 */}
          <button type="button" className={PILL} onClick={() => dispatch({ type: 'LEAVE_MISSION' })}>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
            </svg>
            {COMMON.mapShort}
          </button>
          {config.showDarkView && (
            // 아이콘만: 누르면 어두워지고(남색), 한 번 더 누르면 밝아진다. 이름은 마우스를 올리면 보인다
            <button type="button" aria-pressed={dark} onClick={() => setDark((d) => !d)}
              aria-label={dark ? COMMON.darkViewOff : COMMON.darkViewOn} title={dark ? COMMON.darkViewOff : COMMON.darkViewOn}
              className={`${PILL} !size-11 justify-center !px-0 ${dark ? '!bg-indigo-950 !text-yellow-200' : ''}`}>
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
              </svg>
            </button>
          )}
          {/* 소리 버튼 자리. 위쪽 줄은 흐림 효과 때문에 이야기 창 아래에 깔리므로,
              버튼은 이 자리에 맞춰 화면 위에 따로 띄운다 (덮개가 있어도 눌린다) */}
          <span className="size-11 shrink-0" aria-hidden />
        </div>
      </header>
      <SoundToggle floatTop={9} />
      {/* 모둠 함께하기: 미션 화면 어디서든 친구 커서가 보인다 */}
      <LiveCursors screen={`S4-${id}`} />


      {/* 스포트라이트: 화면 전체를 어둡게 덮고, 지금 할 곳(z-40)만 그 위로 밝게 드러난다.
          튜토리얼 중에는 연습하는 회로판 하나만 밝게. 누르기는 막지 않는다 */}
      {(spotlight || tutorial.step) && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-30 bg-slate-950 transition-opacity duration-500"
          style={{ opacity: spotlight?.dim === 'strong' ? 0.7 : 0.55 }} />
      )}

      {storyOpen && <MissionIntro id={id} onDone={() => setStoryOpen(false)} />}

      <main data-cursor-anchor="mission" className="grid flex-1 gap-4 p-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_400px]">
        {(['A', 'B'] as const).map((b) => {
          const practising = tutorial.step !== null && b === tutorialBoard;
          return (
            <BoardPanel key={b} boardId={b} result={results[b]} dark={dark}
              look={
                tutorial.step
                  ? (practising ? `${RAISED} self-start pb-6` : 'rounded-2xl p-2')
                  : spotlight?.task === 'challenge'
                    ? (b === 'B' ? `${RAISED} self-start pb-6` : 'rounded-2xl p-2') // 도전은 B 회로만 다시 만진다
                    : boardsLook
              }
              coach={practising ? coachFor(tutorial.step!)
                : spotlight?.task === 'challenge' && b === 'B' ? challengeBoardCoach(state.boards.B, results.B, record.challengeHints ?? 0) : undefined}
              hintsPaused={tutorial.step !== null}
              // 튜토리얼 카드는 밝게 드러난 회로판 바로 옆(넓은 화면) 또는 아래(좁은 화면)에 뜬다
              card={practising ? (
                <TutorialCard step={tutorial.step!} onNext={tutorial.next} onSkip={tutorial.finish} />
              ) : undefined} />
          );
        })}
        <MissionWorksheet ref={worksheetRef} className={`lg:col-span-2 xl:col-span-1 ${worksheetLook}`} />
      </main>

      <footer className="flex items-start gap-2 border-t border-stone-200 bg-white/70 px-4 py-2 text-sm text-stone-600">
        <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-amber-600" fill="currentColor" aria-hidden>
          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3zm-1 6h2v6h-2V8zm0 8h2v2h-2v-2z" />
        </svg>
        <p>
          {COMMON.safetyFooter} <b className="font-semibold text-stone-700">{text.safetyExtra}</b>
        </p>
      </footer>
    </div>
  );
}

function BoardPanel({ boardId, result, dark, look, coach, hintsPaused, card }: {
  boardId: BoardId; result: JudgeResult; dark: boolean; look: string; coach?: CoachMark; hintsPaused: boolean; card?: ReactNode;
}) {
  const { state, dispatch, muted, room, members } = useStore();
  const { peers, publish } = useLive();
  const id = state.currentMission!;
  const record = state.missions[id];
  const board = state.boards[boardId];
  const text = MISSION_STRINGS[id];
  // 모둠 함께하기에서도 누구나 두 회로판을 함께 조작한다
  const editable = isEditable(state, boardId);
  const note = useRecentNote(boardId);
  // 이 회로판 위에 있는 친구 커서
  const boardPeers = peers.flatMap((p) => (p.board?.id === boardId
    ? [{ id: p.member.id, name: p.member.name, color: p.color, x: p.board.x, y: p.board.y, from: p.board.from }]
    : []));

  // 힌트 횟수는 모둠에서 한 기기만 센다 (같은 힌트를 여러 기기가 여러 번 세지 않게)
  const countsHints = room === null || isLeader(room, members);
  const onHintShown = useCallback(() => {
    if (countsHints) dispatch({ type: 'HINT_SHOWN' });
  }, [dispatch, countsHints]);
  // 힌트는 ② 만들기에서만 (8-1 도전 중에는 일부러 같은 극끼리 잇기 때문에 힌트를 주지 않는다)
  // 튜토리얼 중에는 힌트 말풍선이 겹치지 않게 멈춘다
  const hint = useHint(board, result, record.step === 'build' && !hintsPaused, onHintShown);

  let observation: string | null = null;
  if (record.step !== 'predict') {
    if (result.level > 0 && result.level === REQUIRED_LEVEL[boardId]) observation = text.observation[boardId];
    if (result.reason === 'BUZZER_REVERSED' && board.switchClosed) observation = text.observation.extra ?? null;
    // 전동기가 반대로 도는 것은 이 차시의 관심(빠르기)이 아니라서 따로 알리지 않는다
  }

  return (
    <section className={`relative flex flex-col gap-2 ${look}`}>
      {card && (
        <div className={`absolute z-50 w-[min(24rem,calc(100vw-2rem))] max-lg:left-2 max-lg:top-full max-lg:mt-2 lg:top-24 ${
          boardId === 'A' ? 'lg:left-full lg:ml-4' : 'lg:right-full lg:mr-4'
        }`}>
          {card}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {/* 1단계(한 기기): 모둠원이 두 회로를 나누어 만들도록 이름표를 단다 (명세서 7-1) */}
        <h2 className="text-lg font-bold">{boardId === 'A' ? COMMON.boardA : COMMON.boardB}</h2>
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
            peers={room ? boardPeers : undefined}
            onPointerInfo={room ? (p) => publish({ board: p && { id: boardId, ...p } }) : undefined}
          />
      </div>
      <p className="min-h-7 text-center font-semibold text-amber-800">{observation}</p>
      {/* 힌트는 회로판 아래 말풍선으로. 회로판 위에 덮으면 부품이 가려진다 */}
      {hint && (
        <p role="status" className="pop-in rounded-2xl border-l-4 border-amber-400 bg-white px-4 py-3 shadow-sm">
          {HINTS[hint]}
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

/** 회로 만드는 방법: 한 단계씩 떠 있는 카드 (마을 움직이기 튜토리얼과 같은 모양). 회로판에서 직접 해 보면 다음으로 넘어간다 */
function TutorialCard({ step, onNext, onSkip }: {
  step: TutorialStep; onNext: () => void; onSkip: () => void;
}) {
  const t = TUTORIAL.steps[step];
  const index = TUTORIAL_ORDER.indexOf(step);
  const last = step === 'go';
  return (
    <section key={step} role="dialog" aria-label={TUTORIAL.title}
      className="modal-rise relative flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-xl">
      <CloseButton onClick={onSkip} className="!right-2 !top-2 !size-8 !shadow-none" />
      <div className="flex items-center gap-3 pr-6">
        <TutorialArt step={step} />
        <div className="flex flex-col gap-0.5">
          <p className="text-lg font-bold">{t.title}</p>
          <p className="text-base leading-snug text-slate-600">{t.text}</p>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        {!last ? (
          <button type="button" onClick={onSkip}
            className="justify-self-start rounded-xl px-2 py-1 text-sm font-bold text-stone-400 outline-none hover:text-stone-600">
            {TUTORIAL.skip}
          </button>
        ) : <span aria-hidden />}
        <ProgressDots count={TUTORIAL_ORDER.length} index={index} />
        {/* 잇기·스위치는 회로판에서 직접 해 보면 저절로 넘어간다. 지우기는 건너뛸 수 있게 "다음" */}
        {step === 'remove' || last ? (
          <button type="button" onClick={last ? onSkip : onNext} autoFocus={last}
            className="min-h-10 justify-self-end rounded-2xl bg-amber-700 px-4 font-bold text-white outline-none transition hover:bg-amber-800">
            {last ? TUTORIAL.start : `${TUTORIAL.next} →`}
          </button>
        ) : <span aria-hidden />}
      </div>
    </section>
  );
}

const TUTORIAL_ORDER: TutorialStep[] = ['connect', 'remove', 'switch', 'go'];

/** 단계마다 작은 그림: 단자 잇기 / 전선 지우기 / 스위치 닫기 / 완성 */
function TutorialArt({ step }: { step: TutorialStep }) {
  return (
    <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-amber-50" aria-hidden>
      <svg viewBox="0 0 40 40" className="size-12">
        {step === 'connect' && (
          <>
            <path d="M 10 30 L 30 12" stroke="#f59e0b" strokeWidth={2.6} strokeDasharray="3 3" strokeLinecap="round" />
            <circle cx={10} cy={30} r={5} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
            <circle cx={30} cy={12} r={5} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
            <circle cx={10} cy={30} r={1.8} fill="#475569" />
            <circle cx={30} cy={12} r={1.8} fill="#475569" />
          </>
        )}
        {step === 'remove' && (
          <>
            <path d="M 8 28 L 32 12" stroke="#3b82f6" strokeWidth={3} strokeLinecap="round" />
            <circle cx={20} cy={20} r={8} fill="#fff" stroke="#f87171" strokeWidth={2} />
            <path d="M 17 17 L 23 23 M 23 17 L 17 23" stroke="#ef4444" strokeWidth={2.4} strokeLinecap="round" />
          </>
        )}
        {step === 'switch' && (
          <>
            <path d="M 9 28 L 31 28" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="2 3" />
            <path d="M 9 28 L 28 14" stroke="#dc2626" strokeWidth={3} strokeLinecap="round" />
            <circle cx={9} cy={28} r={4} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
            <circle cx={31} cy={28} r={4} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
            <path d="M 27 9 A 10 10 0 0 1 33 20" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
            <path d="M 33 20 L 30.5 17.5 M 33 20 L 34.5 16.8" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
          </>
        )}
        {step === 'go' && (
          <>
            <circle cx={20} cy={20} r={13} fill="#34d399" />
            <path d="M 13.5 20.5 L 18 25 L 27 15.5" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
    </span>
  );
}

/** 예상 · 만들기 · 비교·이유 · 확인을 작은 칩으로: 마친 단계는 초록(체크), 지금 단계는 노랑, 남은 단계는 회색 */
function Stepper({ current, done }: { current: MissionStep; done: boolean }) {
  // 미션을 마쳤으면(다시 보기) 네 단계 모두 초록 체크
  const now = done ? STEPS.length : STEPS.indexOf(current);
  return (
    <ol className="ml-3 flex items-center gap-1.5" aria-label="미션 단계">
      {STEPS.map((s, i) => (
        <li key={s} aria-current={i === now ? 'step' : undefined}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
            i < now ? 'bg-[#e4efe7] text-[#5f8a70]' : i === now ? 'bg-[#f5ecd6] font-bold text-[#a27843]' : 'bg-stone-200/60 text-stone-400'
          }`}>
          {i < now && (
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3.5}
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
          {COMMON.stepLabels[i]}
        </li>
      ))}
    </ol>
  );
}

/** 어두운 덮개 위로 올라와 밝게 보이는 곳 */
const RAISED = 'spot-raised relative z-40 rounded-2xl bg-background p-2';

/** 지금 할 곳은 어두운 덮개 위로 올려 밝게 보이게 한다 (덮개는 z-30) */
function areaLook(focus: MissionFocus | null, area: MissionFocus['area']): string {
  return focus?.area === area ? RAISED : 'rounded-2xl p-2';
}
