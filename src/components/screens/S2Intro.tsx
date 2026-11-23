'use client';

import { useState } from 'react';
import { COMMON, S2 } from '@/data/strings';
import { canAdvanceIntro, INTRO_CUT_COUNT } from '@/lib/flow/screenFlow';
import { useStore } from '@/lib/store/StoreContext';
import type { IntroRecord } from '@/lib/types';
import { INTRO_CUT_ART } from '@/media/assets';
import { Button, Choice, Speech } from '../ui';

/** S2. 도입 장면 (컷 5장, 건너뛰기 없음) */
export default function S2Intro() {
  const { state, dispatch } = useStore();
  const cut = S2.cuts[state.introCut];
  const isLast = state.introCut === INTRO_CUT_COUNT - 1;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 p-6">
      <p className="text-right text-sm text-slate-500">
        {state.introCut + 1} / {INTRO_CUT_COUNT}
      </p>
      <div className="flex h-40 items-center justify-center rounded-3xl bg-indigo-950 text-7xl" aria-hidden>
        {INTRO_CUT_ART[state.introCut]}
      </div>
      <Speech speaker={cut.speaker}>{cut.text}</Speech>

      {state.introCut === 2 && <RecallQuestion />}
      {state.introCut === 3 && <FanQuestions />}

      <Button
        className="self-end text-xl"
        disabled={!canAdvanceIntro(state)}
        onClick={() => dispatch({ type: 'NEXT_INTRO_CUT' })}
      >
        {isLast ? S2.depart : COMMON.next}
      </Button>
    </main>
  );
}

/** 컷 3: 3차시 떠올리기. 복습이므로 고르면 바로 맞고 틀림을 알려 준다 */
function RecallQuestion() {
  const { dispatch } = useStore();
  const [picked, setPicked] = useState<'correct' | 'wrong' | null>(null);
  const q = S2.recall;
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow">
      <p>
        {q.before} ( <b>?</b> ) {q.after}
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
    <section className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow">
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
