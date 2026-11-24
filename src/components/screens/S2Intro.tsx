'use client';

import { useEffect, useState } from 'react';
import { COMMON, S2 } from '@/data/strings';
import { canAdvanceIntro, INTRO_CUT_COUNT } from '@/lib/flow/screenFlow';
import { useStore } from '@/lib/store/StoreContext';
import type { IntroRecord } from '@/lib/types';
import { Button, Choice, ProgressDots, Speech } from '../ui';
import IntroScene from '../village/IntroScene';

/** S2. 도입 장면 (컷 5장, 건너뛰기 없음) */
export default function S2Intro() {
  const { state, dispatch } = useStore();
  const cut = S2.cuts[state.introCut];
  // 주인공은 학생 모둠(탐험대). 컷 문구에 모둠 이름이 들어간다
  const text = typeof cut.text === 'function' ? cut.text(state.groupName) : cut.text;
  const isLast = state.introCut === INTRO_CUT_COUNT - 1;

  const canNext = canAdvanceIntro(state);
  const prev = () => dispatch({ type: 'PREV_INTRO_CUT' });
  const next = () => dispatch({ type: 'NEXT_INTRO_CUT' });

  // 키보드 ←·→ 로도 넘길 수 있다 (마지막 장면의 출발은 버튼으로만)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && state.introCut > 0) dispatch({ type: 'PREV_INTRO_CUT' });
      if (e.key === 'ArrowRight' && !isLast && canNext) dispatch({ type: 'NEXT_INTRO_CUT' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.introCut, isLast, canNext, dispatch]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 p-4">
      {/* 양옆의 꺾쇠로 앞뒤 장면을 넘긴다 (화면 세로 가운데에 고정) */}
      <div className="relative">
        <IntroScene cut={state.introCut} />
        {state.introCut > 0 && (
          <ArrowButton side="left" label={COMMON.prev} onClick={prev} />
        )}
        {!isLast && (
          <ArrowButton side="right" label={COMMON.next} onClick={next} disabled={!canNext} />
        )}
      </div>
      <Speech speaker={cut.speaker}>{text}</Speech>

      {state.introCut === 2 && <RecallQuestion />}
      {state.introCut === 3 && <FanQuestions />}

      <div className="flex flex-col items-center gap-4">
        <ProgressDots count={INTRO_CUT_COUNT} index={state.introCut} />
        {isLast && (
          <Button className="pulse-cta px-8 text-xl" onClick={next}>{S2.depart}</Button>
        )}
      </div>
    </main>
  );
}

/** 앞뒤로 넘기는 꺾쇠 버튼. 장면마다 내용 높이가 달라도 움직이지 않게 화면 세로 가운데에 고정한다.
 *  화면이 넓으면 본문 양옆 바깥, 좁으면 화면 가장자리 */
function ArrowButton({ side, label, onClick, disabled = false }: {
  side: 'left' | 'right';
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className={`fixed top-1/2 z-10 flex size-16 -translate-y-1/2 items-center justify-center rounded-full text-amber-700 outline-none transition hover:bg-white hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent ${
        side === 'left' ? 'left-1 lg:left-[calc(50%-24rem-5rem)]' : 'right-1 lg:right-[calc(50%-24rem-5rem)]'
      }`}>
      <svg viewBox="0 0 24 24" className="size-11" fill="none" stroke="currentColor" strokeWidth={3}
        strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={side === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

/** 컷 3: 불이 켜지는 회로의 조건 떠올리기. 복습이므로 고르면 바로 맞고 틀림을 알려 준다 */
function RecallQuestion() {
  const { state, dispatch } = useStore();
  // 이전으로 갔다가 돌아와도 고른 답이 보이게 (기록에는 처음 고른 답이 남아 있다)
  const [picked, setPicked] = useState<'correct' | 'wrong' | null>(state.intro.recall);
  const q = S2.recall;
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-5">
      <p>
        {q.before}{' '}
        <span className={`mx-1 inline-block min-w-28 rounded-lg bg-amber-100 px-4 py-0.5 text-center text-amber-700 ring-2 ring-amber-300 ${
          picked ? 'font-bold' : 'text-xl font-black'
        }`}>{picked ? q.choices[picked] : '?'}</span>{' '}
        {q.after}
      </p>
      <div className="flex gap-3">
        {(['correct', 'wrong'] as const).map((k) => (
          <Choice
            key={k}
            selected={picked === k}
            onClick={() => {
              setPicked(k);
              dispatch({ type: 'ANSWER_RECALL', correct: k === 'correct' });
            }}
          >
            {q.choices[k]}
          </Choice>
        ))}
      </div>
      {picked && (
        <p className={picked === 'correct' ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>
          {picked === 'correct' ? q.feedbackCorrect : q.feedbackWrong}
        </p>
      )}
    </section>
  );
}

/** 컷 4: 전지 제품 이야기. 예상 문항이라 정답을 알려 주지 않고 선택만 저장한다 */
function FanQuestions() {
  const { state, dispatch } = useStore();
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-white p-5">
      <div className="flex flex-col gap-2">
        <p className="font-bold">{S2.fanReason.question}</p>
        {(Object.keys(S2.fanReason.choices) as NonNullable<IntroRecord['fanReason']>[]).map((k) => (
          <Choice
            key={k}
            selected={state.intro.fanReason === k}
            onClick={() => dispatch({ type: 'ANSWER_FAN_REASON', value: k })}
          >
            {S2.fanReason.choices[k]}
          </Choice>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-bold">{S2.fanPredict.question}</p>
        {(Object.keys(S2.fanPredict.choices) as NonNullable<IntroRecord['fanPredict']>[]).map((k) => (
          <Choice
            key={k}
            selected={state.intro.fanPredict === k}
            onClick={() => dispatch({ type: 'ANSWER_FAN_PREDICT', value: k })}
          >
            {S2.fanPredict.choices[k]}
          </Choice>
        ))}
      </div>
    </section>
  );
}
