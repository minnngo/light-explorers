'use client';

// 미션 화면 오른쪽 학습지 패널. 단계마다 다른 내용을 보여 준다.
// POE 규칙: ④ 확인하기 전에는 실제 결과 문장, 정답 표시, 정리 문구를 절대 그리지 않는다.
import { type Ref, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MISSIONS } from '@/data/missions';
import { CHALLENGE, CHARACTER, COMMON, MISSION_STRINGS, withoutMark } from '@/data/strings';
import { challengeStep } from '@/lib/flow/challenge';
import { canConfirm, canGoCompare, checklist, currentResults, MIN_EXPLANATION_LENGTH } from '@/lib/flow/missionFlow';
import { actions } from '@/lib/store/actions';
import { useStore } from '@/lib/store/StoreContext';
import type { CompareChoice, PredictionChoice } from '@/lib/types';
import { playSuccess } from '@/media/sound';
import { Button, Choice, TextArea } from '../ui';
import { FairyIcon } from '../village/Characters';
import MissionIntro from './MissionIntro';

export default function MissionWorksheet({ className = '', ref }: { className?: string; ref?: Ref<HTMLElement> }) {
  const { state } = useStore();
  const step = state.missions[state.currentMission!].step;
  return (
    <aside ref={ref} className={`flex scroll-mt-24 flex-col gap-4 rounded-2xl bg-white p-4 shadow ${className}`}>
      {step === 'predict' && <PredictPanel />}
      {step === 'build' && <BuildPanel />}
      {step === 'compare' && <ComparePanel />}
      {step === 'confirm' && <ConfirmPanel />}
    </aside>
  );
}

/** ① 예상하기: 선택지 3개 중 하나를 고르고 확정 (바꿀 수 없음) */
function PredictPanel() {
  const { state, dispatch } = useStore();
  const text = MISSION_STRINGS[state.currentMission!];
  const [picked, setPicked] = useState<PredictionChoice | null>(null);
  // 들어오면 반디의 이야기부터 듣고, 다 들으면 하이라이트가 문제로 넘어온다
  const [storyOpen, setStoryOpen] = useState(true);
  if (storyOpen) return <MissionIntro id={state.currentMission!} onDone={() => setStoryOpen(false)} />;
  return (
    <div className="modal-rise flex flex-col gap-4">
      <h2 className="text-xl font-bold leading-snug">{text.predictQuestion}</h2>
      <div className="flex flex-col gap-2">
        {(['a', 'b', 'c'] as const).map((k) => {
          const full = text.predictChoices[k];
          // "(가) 전지 2개를…" → 배지 "가" + 본문
          const m = /^\((.)\)\s*(.*)$/.exec(full);
          const selected = picked === k;
          return (
            <button key={k} type="button" aria-pressed={selected} aria-label={full} onClick={() => setPicked(k)}
              className={`flex items-baseline gap-2 rounded-2xl px-4 py-3 text-left outline-none transition ${
                selected ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-[#f6efdf] hover:bg-amber-50 hover:ring-2 hover:ring-amber-300'
              }`}>
              <span className={`w-5 shrink-0 font-bold ${selected ? 'text-amber-700' : 'text-stone-400'}`}>
                {m ? m[1] : k}
              </span>
              <span className={selected ? 'font-bold' : ''}>{m ? m[2] : full}</span>
            </button>
          );
        })}
      </div>
      <Button disabled={!picked} onClick={() => picked && dispatch({ type: 'SET_PREDICTION', choice: picked })}>
        {text.predictConfirm}
      </Button>
    </div>
  );
}

/** ② 회로 만들기: 체크리스트는 판정 결과로 자동 체크 */
function BuildPanel() {
  const { state, dispatch } = useStore();
  const text = MISSION_STRINGS[state.currentMission!];
  const checks = checklist(currentResults(state)!);
  return (
    <>
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold">{text.checklistTitle}</h3>
        <span className="text-sm font-semibold text-stone-500">{checks.filter(Boolean).length}/{checks.length}</span>
      </div>
      {/* 순서대로 하는 일: 번호를 세로 줄로 잇고, 지금 할 차례는 노랑, 마친 일은 초록 체크 */}
      <ol className="flex flex-col">
        {text.checklist.map((item, i) => {
          const done = checks[i];
          const current = !done && checks.slice(0, i).every(Boolean);
          const last = i === text.checklist.length - 1;
          return (
            <li key={i} className="flex gap-3" aria-current={current ? 'step' : undefined}>
              <div className="flex flex-col items-center">
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                  done ? 'bg-emerald-400 text-white' : current ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  {done ? (
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3.5}
                      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  ) : i + 1}
                </span>
                {!last && <span aria-hidden className={`my-1 w-0.5 flex-1 rounded-full ${done ? 'bg-emerald-300' : 'bg-stone-200'}`} />}
              </div>
              <p className={`pb-4 pt-0.5 leading-snug ${
                done ? 'text-stone-400 line-through decoration-stone-300' : current ? 'font-semibold text-stone-800' : 'text-stone-500'
              }`}>
                {item}
              </p>
            </li>
          );
        })}
      </ol>
      <HelpToggle text={text.checklistHelp} />
      <Button disabled={!canGoCompare(state)} className={canGoCompare(state) ? 'pulse-cta' : ''}
        onClick={() => dispatch({ type: 'GO_COMPARE' })}>
        {text.goCompare}
      </Button>
    </>
  );
}

/** ③ 비교하기와 이유 쓰기: ○표 + 이유 10글자 이상이어야 확인하기 */
function ComparePanel() {
  const { state, dispatch } = useStore();
  const record = state.missions[state.currentMission!];
  const text = MISSION_STRINGS[state.currentMission!];
  const length = record.explanation.trim().length;
  // 채점: 확인하기를 누르면 이 화면에서 먼저 답을 맞춰 보고(고칠 수 없음), "다음"으로 ④ 확인에 간다
  const [graded, setGraded] = useState(false);
  const correct = MISSIONS[state.currentMission!].correctCompare;
  const right = record.compare === correct;
  return (
    <>
      <p className="font-bold">{text.compareGuide}</p>
      <p className="leading-relaxed">
        {text.compareBefore}
        {(['less', 'more'] as CompareChoice[]).map((k, i) => (
          <span key={k}>
            {i > 0 && ' / '}
            <Choice className={`mx-1 inline-block ${graded && k === correct ? '!ring-2 !ring-red-500' : ''}`}
              selected={record.compare === k} disabled={graded}
              onClick={() => dispatch({ type: 'SET_COMPARE', choice: k })}>
              {text.compareChoices[k]}
            </Choice>
          </span>
        ))}
        {text.compareAfter}
      </p>
      {/* 채점 결과는 문장 아래 작은 칩으로 (④ 확인의 "맞혔어요!"와 같은 모양, 틀리면 빨강) */}
      {graded && (
        <span className={`pop-in -mt-2 w-fit rounded-full px-3 py-1 text-sm font-bold ${
          right ? 'bg-[#e4efe7] text-[#4f7d62]' : 'bg-red-50 text-red-600'
        }`}>
          {right ? COMMON.compareRight : COMMON.compareWrong(text.compareChoices[correct])}
        </span>
      )}
      <label className="flex flex-col gap-2">
        <span className="font-bold">{text.reasonPrompt}</span>
        <TextArea
          value={record.explanation}
          placeholder={text.reasonPlaceholder}
          readOnly={graded}
          onChange={(e) => dispatch({ type: 'SET_EXPLANATION', text: e.target.value })}
        />
        {!graded && (
          <span className="text-right text-sm text-slate-500">
            {COMMON.minChars(length, MIN_EXPLANATION_LENGTH)}
          </span>
        )}
      </label>
      {graded ? (
        // 모범 답안 (빨간 글씨): 우리가 쓴 이유와 견주어 본다
        <div className="pop-in flex flex-col gap-1 rounded-xl bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-600">{COMMON.modelReason}</p>
          <p className="leading-relaxed text-stone-700">{text.modelReason}</p>
        </div>
      ) : (
        text.reasonHelp && <HelpToggle text={text.reasonHelp} />
      )}
      <div className="flex gap-2">
        {graded ? (
          <Button className="flex-1" onClick={() => dispatch({ type: 'CONFIRM' })}>
            {COMMON.next} →
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => dispatch(actions.backToBuild())}>
              {text.retry}
            </Button>
            <Button className="flex-1" disabled={!canConfirm(record)} onClick={() => setGraded(true)}>
              {text.confirmButton}
            </Button>
          </>
        )}
      </div>
    </>
  );
}

/** ④ 확인하기: 내 예상 / 실제 결과, 한 줄 정리, 장소가 되살아나는 연출 */
function ConfirmPanel() {
  const { state, dispatch, muted } = useStore();
  const id = state.currentMission!;
  const record = state.missions[id];
  const text = MISSION_STRINGS[id];
  const right = record.prediction === MISSIONS[id].correctPrediction;
  const reviewing = record.status === 'done';

  useEffect(() => {
    if (!muted && !reviewing) playSuccess();
  }, [muted, reviewing]);
  const [celebrate, setCelebrate] = useState(!reviewing && (record.challenge ?? 'none') === 'none');

  return (
    <>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
        <dt className="font-bold">{COMMON.myPrediction}</dt>
        <dd>
          {record.prediction ? withoutMark(text.predictChoices[record.prediction]) : '-'}
          {/* 맞혔으면 글자 바로 오른쪽에 작은 칩, 달랐으면 문장이 길어서 아래 줄에 둥근 상자로 */}
          {right ? (
            <span className="ml-2 inline-block rounded-full bg-[#e4efe7] px-2.5 py-0.5 align-middle text-sm font-bold text-[#4f7d62]">
              {text.predictionRight}
            </span>
          ) : (
            <span className="mt-1.5 block w-fit whitespace-pre-line rounded-xl bg-sky-50 px-3 py-1.5 text-sm font-semibold leading-snug text-sky-700">
              {text.predictionDifferent}
            </span>
          )}
        </dd>
        <dt className="font-bold">{COMMON.actualResult}</dt>
        <dd>{text.actualResult}</dd>
      </dl>
      {/* 도전 중에는 정리 문구를 숨겨 도전에만 집중하게 */}
      {record.challenge !== 'active' && (
        <p className="whitespace-pre-line rounded-xl bg-amber-50 p-3">{text.summary}</p>
      )}
      {/* 확인 화면이 나오기 전에 반디가 먼저 떠서 한마디 (다시 보기에서는 생략) */}
      {celebrate && <Celebration text={text.revival} onDone={() => setCelebrate(false)} />}
      {MISSIONS[id].hasChallenge && !reviewing && <ChallengeBox />}
      {reviewing ? (
        <Button onClick={() => dispatch({ type: 'LEAVE_MISSION' })}>{COMMON.backToMap}</Button>
      ) : (
        <Button onClick={() => dispatch(actions.completeMission())}>{COMMON.backToMap}</Button>
      )}
    </>
  );
}

/** 8-1 선택 보충: B 회로의 전지를 같은 극끼리 이어 보는 도전 (지도서에 없는 활동) */
function ChallengeBox() {
  const { state, dispatch } = useStore();
  const record = state.missions[state.currentMission!];
  const challenge = record.challenge ?? 'none';
  if (challenge === 'none') {
    return (
      <Button variant="secondary" onClick={() => dispatch({ type: 'START_CHALLENGE' })}>
        {CHALLENGE.button}
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 p-4">
      <p className="font-bold">{CHALLENGE.prompt}</p>
      {challenge === 'active' && (() => {
        // 힌트는 하나씩 연다. 연 힌트 중 지금 할 단계는 노랑, 마친 단계는 초록 체크 (B 회로판 모습으로 저절로 넘어간다)
        const opened = record.challengeHints ?? 0;
        const now = challengeStep(state.boards.B, currentResults(state)!.B);
        return (
          <>
            {opened > 0 && (
              <ol className="flex flex-col gap-2">
                {CHALLENGE.steps.slice(0, opened).map((line, i) => (
                  <li key={i} className={`modal-rise flex items-start gap-2.5 text-base leading-snug ${
                    i === now ? 'font-semibold text-stone-800' : 'text-stone-400'
                  }`}>
                    <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i < now ? 'bg-emerald-400 text-white' : i === now ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-500'
                    }`}>
                      {i < now ? (
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3.5}
                          strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      ) : i + 1}
                    </span>
                    {line}
                  </li>
                ))}
              </ol>
            )}
            {opened < CHALLENGE.steps.length && (
              <button type="button" onClick={() => dispatch({ type: 'SHOW_CHALLENGE_HINT' })}
                className="flex items-center gap-1 self-start rounded-full px-1 text-sm font-semibold text-stone-500 outline-none hover:text-stone-800">
                {opened === 0 ? CHALLENGE.firstHint : CHALLENGE.nextHint}
                <span className="text-xs text-stone-400">({opened + 1}/{CHALLENGE.steps.length})</span>
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            )}
          </>
        );
      })()}
      {challenge === 'done' && <p className="pop-in font-bold text-sky-800">{CHALLENGE.done}</p>}
    </div>
  );
}

/** 접어 둔 도움말: "도움말 ⌄"을 누르면 아래에 한 줄이 펼쳐진다 */
function HelpToggle({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 self-start rounded-full px-1 text-sm font-semibold text-stone-500 outline-none hover:text-stone-800">
        {COMMON.help}
        <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none"
          stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <p className="modal-rise rounded-xl bg-stone-100/70 px-3 py-2 text-sm text-stone-600">{text}</p>}
    </div>
  );
}

/** 미션 성공: 화면이 살짝 어두워지고 반디와 말풍선만 떠서 축하한다. 버튼을 누르면 확인 화면으로 */
function Celebration({ text, onDone }: { text: string; onDone: () => void }) {
  // 떠 있는 동안에는 스포트라이트로 밝게 올라온 곳도 함께 어둡게 (globals.css의 data-celebrating)
  useEffect(() => {
    document.body.dataset.celebrating = '';
    return () => {
      delete document.body.dataset.celebrating;
    };
  }, []);
  return createPortal(
    <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" onClick={onDone}>
      <div className="flex items-end gap-1" role="dialog" aria-label={CHARACTER} onClick={(e) => e.stopPropagation()}>
        <div className="bandi-arrive shrink-0">
          <div className="bob">
            <FairyIcon className="size-28 drop-shadow-lg" />
          </div>
        </div>
        <div className="modal-rise relative mb-10 flex max-w-md flex-col gap-3 rounded-3xl bg-white px-6 py-5 shadow-2xl">
          <span aria-hidden className="absolute -left-2 bottom-7 size-5 rotate-45 rounded-sm bg-white" />
          <p className="relative text-sm font-bold text-amber-700">{CHARACTER}</p>
          <p className="relative whitespace-pre-line text-xl font-semibold leading-snug">{text}</p>
          <button type="button" onClick={onDone} autoFocus
            className="relative min-h-11 self-end rounded-2xl bg-amber-700 px-5 font-bold text-white outline-none transition hover:bg-amber-800">
            {COMMON.seeResult} →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
