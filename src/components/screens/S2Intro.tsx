'use client';

import { useState } from 'react';
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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 p-4">
      <IntroScene cut={state.introCut} />
      <Speech speaker={cut.speaker}>{text}</Speech>

      {state.introCut === 2 && <RecallQuestion />}
      {state.introCut === 3 && <FanQuestions />}

      {/* 진행 점과 다음 버튼을 한 줄에 (미션 이야기 장면과 같은 모양) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {state.introCut > 0 ? (
          <button type="button" onClick={() => dispatch({ type: 'PREV_INTRO_CUT' })}
            className="min-h-11 justify-self-start rounded-2xl bg-amber-700 px-6 font-bold text-white outline-none transition hover:bg-amber-800">
            ← {COMMON.prev}
          </button>
        ) : (
          <span aria-hidden />
        )}
        <ProgressDots count={INTRO_CUT_COUNT} index={state.introCut} />
        <Button
          className="justify-self-end px-6"
          disabled={!canAdvanceIntro(state)}
          onClick={() => dispatch({ type: 'NEXT_INTRO_CUT' })}
        >
          {isLast ? S2.depart : `${COMMON.next} →`}
        </Button>
      </div>
    </main>
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
        <span className="mx-0.5 inline-block rounded-lg bg-amber-100 px-3 font-bold text-amber-700">?</span>{' '}
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
