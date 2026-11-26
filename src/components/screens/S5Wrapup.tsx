'use client';

import { type ReactNode, useCallback, useState } from 'react';
import { MISSION_ORDER } from '@/data/missions';
import { CHARACTER, COMMON, MISSION_STRINGS, RESTART, S5, withoutMark } from '@/data/strings';
import { canAdvanceWrapupRecord, WRAPUP_STEP_COUNT } from '@/lib/flow/screenFlow';
import { type Action, wrapupOf } from '@/lib/store/reducer';
import { useStore } from '@/lib/store/StoreContext';
import type { FinalRecord, OX, PartKind } from '@/lib/types';
import { Button, Choice, ConfirmDialog, Speech } from '../ui';
import { VillagePanorama } from './Opening';

/**
 * 마무리는 각자 한다. 모둠으로 할 때는 내 기록(학생별)에, 혼자 할 때는 모둠 기록에 남긴다.
 * f: 내 마무리 기록, send: 마무리 동작을 "나"의 것으로 보낸다
 */
function useMyWrapup() {
  const { state, dispatch, room } = useStore();
  const by = room ? { id: room.me.id, name: room.me.name } : undefined;
  const f = wrapupOf(state, by);
  const send = (action: WrapupAction) => dispatch({ ...action, ...(by ? { by } : {}) } as Action);
  return { f, send };
}

type WrapupAction = Extract<Action, { by?: unknown }> extends infer A ? A extends Action ? Omit<A, 'by'> : never : never;

/** S5. 마무리 7단계 (지도서 마무리 7분). 한 화면에 한 단계씩. 모둠으로 할 때도 각자 자기 속도로 한다 */
export default function S5Wrapup() {
  const { restart } = useStore();
  const { f, send } = useMyWrapup();
  const [confirmRestart, setConfirmRestart] = useState(false);
  const closeRestart = useCallback(() => setConfirmRestart(false), []);

  if (f.finished) {
    return (
      <Ending title={S5.finish.done}>
        {/* 같은 기기를 다음 모둠이 쓸 수 있게 (선생님용, 눈에 덜 띄게) */}
        <button type="button" className="min-h-11 text-base text-white/60 underline outline-none hover:text-white"
          onClick={() => setConfirmRestart(true)}>
          {RESTART.button}
        </button>
        <ConfirmDialog open={confirmRestart} title={RESTART.title} body={RESTART.body} okLabel={RESTART.ok}
          cancelLabel={RESTART.cancel} onOk={restart} onCancel={closeRestart} />
      </Ending>
    );
  }

  const step = f.wrapupStep;
  const isLast = step === WRAPUP_STEP_COUNT - 1;
  const panels = [<ResultsStep key={0} />, <ExplainStep key={1} />, <CheckStep key={2} />,
    <MisconceptionStep key={3} />, <SelfEvalStep key={4} />];

  // 마지막 마치기 (번호 없음): 오프닝처럼 화면을 가득 채운 축제 장면
  if (isLast) {
    return (
      <Ending title={S5.finish.title} text={S5.finish.text}>
        <button type="button" onClick={() => send({ type: 'FINISH' })}
          className="modal-rise pulse-cta min-h-14 rounded-full bg-amber-500 px-10 text-xl font-black text-white shadow-lg outline-none transition hover:bg-amber-600">
          {S5.finish.button}
        </button>
      </Ending>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{S5.stepTitles[step]}</h1>
        <span className="text-slate-500">{step + 1} / {WRAPUP_STEP_COUNT - 1}</span>
      </header>
      {panels[step]}
      <Button className="self-end text-xl" disabled={!canAdvanceWrapupRecord(f, step)}
        onClick={() => send({ type: 'NEXT_WRAPUP_STEP' })}>
        {COMMON.next}
      </Button>
    </main>
  );
}

const card = 'flex flex-col gap-3 rounded-2xl bg-white p-5 shadow';

/** 1. 결과 모아 보기: 미션별 우리 예상 / 실제 결과 자동 채움 (미션은 모둠이 함께 했다) */
function ResultsStep() {
  const { state } = useStore();
  return (
    <table className="w-full overflow-hidden rounded-2xl bg-white shadow">
      <thead className="bg-amber-100">
        <tr>{S5.results.headers.map((h) => <th key={h} className="p-3 text-left">{h}</th>)}</tr>
      </thead>
      <tbody>
        {MISSION_ORDER.map((id) => {
          const p = state.missions[id].prediction;
          return (
            <tr key={id} className="border-t">
              <th className="p-3 text-left">{S5.results.rows[id]}</th>
              <td className="p-3">{p ? withoutMark(MISSION_STRINGS[id].predictChoices[p]) : '-'}</td>
              <td className="p-3">{MISSION_STRINGS[id].actualResult}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** 2. 확인하기: 세 질문에 먼저 답한 뒤 정리가 나타난다. "직렬연결" 용어는 여기서 처음 나온다 */
function ExplainStep() {
  const { f, send } = useMyWrapup();
  const answered = Object.values(f.explain).every((v) => v !== null);
  return (
    <section className={card}>
      <Speech speaker={CHARACTER}>{S5.explain.opener}</Speech>
      {(Object.keys(S5.explain.questions) as PartKind[]).map((part) => {
        const q = S5.explain.questions[part];
        return (
          <div key={part} className="flex flex-col gap-2">
            <p className="font-bold">{q.q}</p>
            <div className="flex flex-wrap gap-2">
              {(['more', 'less', 'same'] as const).map((k) => (
                <Choice key={k} selected={f.explain[part] === k}
                  onClick={() => send({ type: 'ANSWER_EXPLAIN', part, choice: k })}>
                  {q.choices[k]}
                </Choice>
              ))}
            </div>
          </div>
        );
      })}
      {answered && (
        <div className="pop-in flex flex-col gap-2 rounded-xl bg-amber-50 p-4">
          {S5.explain.summaries.map((s, i) => <p key={i}>✔ {s}</p>)}
        </div>
      )}
    </section>
  );
}

/** 3. 적용하기 */
function CheckStep() {
  const { f, send } = useMyWrapup();
  const check = f.check;
  return (
    <section className={card}>
      <p className="leading-relaxed">
        {S5.check.before}
        {(['brighter', 'darker'] as const).map((k, i) => (
          <span key={k}>
            {i > 0 && ' / '}
            <Choice className="mx-1 inline-block" selected={check === k} disabled={check !== null}
              onClick={() => send({ type: 'UPDATE_FINAL', patch: { check: k } })}>
              {S5.check.choices[k]}
            </Choice>
          </span>
        ))}
        {S5.check.after}
      </p>
      {/* 한 번 고르면 바로 결과: 맞았으면 초록 "정답이에요.", 틀렸으면 빨강 "정답은 '밝아집니다'예요." (5. 오개념 점검과 같은 모양) */}
      {check && (
        <p className="pop-in rounded-xl bg-slate-50 p-3">
          <b className={check === 'brighter' ? 'text-emerald-700' : 'text-rose-600'}>
            {check === 'brighter' ? S5.misconception.right : S5.check.answerIs(S5.check.choices.brighter)}
          </b>{' '}
          {S5.check.explanation}
        </p>
      )}
    </section>
  );
}

/** 고른 답: 기록에는 맞음/틀림만 있으므로 정답에서 거꾸로 찾는다 */
const choiceOf = (result: 'correct' | 'wrong' | null, answer: OX): OX | null =>
  result === null ? null : result === 'correct' ? answer : answer === 'O' ? 'X' : 'O';

/** ○·× 그림 (글꼴마다 ○·× 크기와 높이가 달라서 같은 크기 그림으로) */
function OXMark({ k, className = 'size-6' }: { k: OX; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.6}
      strokeLinecap="round" aria-hidden>
      {k === 'O' ? <circle cx={12} cy={12} r={7.5} /> : <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />}
    </svg>
  );
}

/** 4. 오개념 점검: 고른 직후 정답과 해설. 점수는 보여 주지 않고 교사용 기록에만 남긴다 */
function MisconceptionStep() {
  const { f, send } = useMyWrapup();
  return (
    <section className={card}>
      <p className="font-bold">{S5.misconception.guide}</p>
      {S5.misconception.items.map((item) => {
        const result = f.misconception[item.key];
        const chosen = choiceOf(result, item.answer);
        return (
          <div key={item.key} className="flex flex-col gap-2 border-t border-stone-200 pt-3">
            <p>{item.text}</p>
            <div className="flex items-center gap-2">
              {(['O', 'X'] as const).map((k) => (
                <Choice key={k} mark={false} selected={chosen === k} disabled={result !== null}
                  aria-label={k === 'O' ? '○' : '×'} className="flex w-16 items-center justify-center"
                  onClick={() => send({ type: 'ANSWER_MISCONCEPTION', key: item.key, choice: k })}>
                  <OXMark k={k} />
                </Choice>
              ))}
            </div>
            {result && (
              <p className="pop-in rounded-xl bg-slate-50 p-3">
                {/* 맞았으면 초록 "정답이에요.", 틀렸으면 빨강 "정답은 ×예요." */}
                <b className={result === 'correct' ? 'text-emerald-700' : 'text-rose-600'}>
                  {result === 'correct' ? S5.misconception.right : S5.misconception.answerIs(item.answer === 'O' ? '○' : '×')}
                </b>{' '}
                {item.explanation}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** 5. 스스로 평가 */
function SelfEvalStep() {
  const { f, send } = useMyWrapup();
  return (
    <section className={card}>
      <p className="font-bold">{S5.selfEval.question}</p>
      {(Object.keys(S5.selfEval.choices) as NonNullable<FinalRecord['selfEval']>[]).map((k) => (
        <Choice key={k} selected={f.selfEval === k} onClick={() => send({ type: 'ANSWER_SELF_EVAL', choice: k })}>
          {S5.selfEval.choices[k]}
        </Choice>
      ))}
    </section>
  );
}


/** 마무리 장면: 환하게 되살아난 반짝마을 풍경 위에 제목과 버튼 (오프닝과 같은 그림) */
function Ending({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-[#0b1033]" aria-label={title}>
      <VillagePanorama ending />
      <div className="relative flex h-full flex-col items-center px-4 pt-[18vh] text-center">
        <h1 className="opening-title text-5xl font-black tracking-tight text-[#fff6d6] md:text-7xl"
          style={{ animationDelay: '0.3s', textShadow: '0 0 24px rgb(255 214 94 / 0.75), 0 4px 0 rgb(120 72 20 / 0.45)' }}>
          {title}
        </h1>
        {text && (
          <p className="opening-sub mt-4 max-w-3xl whitespace-pre-line text-lg font-bold text-amber-100 md:text-xl" style={{ animationDelay: '1s' }}>
            {text}
          </p>
        )}
        <div className="mt-10 flex flex-col items-center gap-3">{children}</div>
      </div>
    </main>
  );
}
