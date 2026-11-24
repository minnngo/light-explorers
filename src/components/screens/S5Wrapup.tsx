'use client';

import { useCallback, useState } from 'react';
import { MISSION_ORDER } from '@/data/missions';
import { CHARACTER, COMMON, MISSION_STRINGS, RESTART, S2, S5, withoutMark } from '@/data/strings';
import { canAdvanceWrapup, WRAPUP_STEP_COUNT } from '@/lib/flow/screenFlow';
import { useStore } from '@/lib/store/StoreContext';
import type { FinalRecord, OX, PartKind } from '@/lib/types';
import { VILLAGE_ART } from '@/media/assets';
import { Button, Choice, ConfirmDialog, Speech, TextArea } from '../ui';
import VillageScene from '../village/VillageScene';

const ALL_ON = { m1: 'on', m2: 'on', m3: 'on' } as const;

/** S5. 마무리 7단계 (지도서 마무리 7분). 한 화면에 한 단계씩 */
export default function S5Wrapup() {
  const { state, dispatch, restart } = useStore();
  const [confirmRestart, setConfirmRestart] = useState(false);
  const closeRestart = useCallback(() => setConfirmRestart(false), []);

  if (state.finished) {
    return (
      <main className="m-auto flex flex-col items-center gap-4 p-6 text-center">
        <span className="text-8xl" aria-hidden>{VILLAGE_ART.bright}</span>
        <p className="text-3xl font-black">{S5.finish.done}</p>
        {/* 같은 기기를 다음 모둠이 쓸 수 있게 (선생님용, 눈에 덜 띄게) */}
        <button type="button" className="mt-10 min-h-11 text-base text-slate-400 underline"
          onClick={() => setConfirmRestart(true)}>
          {RESTART.button}
        </button>
        <ConfirmDialog open={confirmRestart} title={RESTART.title} body={RESTART.body} okLabel={RESTART.ok}
        cancelLabel={RESTART.cancel} onOk={restart} onCancel={closeRestart} />
      </main>
    );
  }

  const step = state.wrapupStep;
  const isLast = step === WRAPUP_STEP_COUNT - 1;
  const panels = [<ResultsStep key={0} />, <ShareStep key={1} />, <ExplainStep key={2} />, <CheckStep key={3} />,
    <MisconceptionStep key={4} />, <SelfEvalStep key={5} />, <FinishStep key={6} />];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{S5.stepTitles[step]}</h1>
        <span className="text-slate-500">{step + 1} / {WRAPUP_STEP_COUNT}</span>
      </header>
      {panels[step]}
      <Button
        className="self-end text-xl"
        disabled={!canAdvanceWrapup(state)}
        onClick={() => dispatch({ type: isLast ? 'FINISH' : 'NEXT_WRAPUP_STEP' })}
      >
        {isLast ? S5.finish.button : COMMON.next}
      </Button>
    </main>
  );
}

const card = 'flex flex-col gap-3 rounded-2xl bg-white p-5 shadow';

/** 1. 결과 모아 보기: 미션별 내 예상 / 실제 결과 자동 채움 */
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

/** 2. 함께 생각을 나누기 */
function ShareStep() {
  const { state, dispatch } = useStore();
  return (
    <section className={card}>
      <p className="font-bold">{S5.share.guide}</p>
      <p className="rounded-xl bg-slate-50 p-3 text-slate-600">{S5.share.frame}</p>
      <TextArea value={state.final.groupThought}
        onChange={(e) => dispatch({ type: 'UPDATE_FINAL', patch: { groupThought: e.target.value } })} />
    </section>
  );
}

/** 3. 설명하기: 세 질문에 먼저 답한 뒤 정리가 나타난다. "직렬연결" 용어는 여기서 처음 나온다 */
function ExplainStep() {
  const { state, dispatch } = useStore();
  const answered = Object.values(state.final.explain).every((v) => v !== null);
  const fan = state.intro.fanPredict;
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
                <Choice key={k} selected={state.final.explain[part] === k}
                  onClick={() => dispatch({ type: 'ANSWER_EXPLAIN', part, choice: k })}>
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
          {fan && (
            <>
              <p className="mt-2 font-bold">{S5.explain.revisit(S2.fanPredict.choices[fan])}</p>
              <TextArea value={state.final.revisitFan} placeholder={COMMON.optional}
                onChange={(e) => dispatch({ type: 'UPDATE_FINAL', patch: { revisitFan: e.target.value } })} />
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** 4. 확인해요 */
function CheckStep() {
  const { state, dispatch } = useStore();
  const check = state.final.check;
  return (
    <section className={card}>
      <p className="leading-relaxed">
        {S5.check.before}
        {(['brighter', 'darker'] as const).map((k, i) => (
          <span key={k}>
            {i > 0 && ' / '}
            <Choice className="mx-1 inline-block" selected={check === k}
              onClick={() => dispatch({ type: 'UPDATE_FINAL', patch: { check: k } })}>
              {S5.check.choices[k]}
            </Choice>
          </span>
        ))}
        {S5.check.after}
      </p>
      {check === 'darker' && <p className="font-bold text-rose-700">{S5.check.wrong}</p>}
      {check === 'brighter' && <p className="font-bold text-emerald-700">✔</p>}
    </section>
  );
}

/** 5. 오개념 점검: 고른 직후 정답과 해설. 점수는 보여 주지 않고 교사용 기록에만 남긴다 */
function MisconceptionStep() {
  const { state, dispatch } = useStore();
  return (
    <section className={card}>
      <p className="font-bold">{S5.misconception.guide}</p>
      {S5.misconception.items.map((item) => {
        const result = state.final.misconception[item.key];
        const chosen: OX | null = result === null ? null : result === 'correct' ? item.answer : item.answer === 'O' ? 'X' : 'O';
        return (
          <div key={item.key} className="flex flex-col gap-2 border-t pt-3">
            <p>{item.text}</p>
            <div className="flex gap-2">
              {(['O', 'X'] as const).map((k) => (
                <Choice key={k} mark={false} selected={chosen === k} disabled={result !== null} className="min-w-16 text-center text-xl"
                  onClick={() => dispatch({ type: 'ANSWER_MISCONCEPTION', key: item.key, choice: k })}>
                  {k === 'O' ? '○' : '×'}
                </Choice>
              ))}
            </div>
            {result && (
              <p className="rounded-xl bg-slate-50 p-3">
                <b>{S5.misconception.answerIs(item.answer === 'O' ? '○' : '×')}</b> {item.explanation}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** 6. 스스로 평가 */
function SelfEvalStep() {
  const { state, dispatch } = useStore();
  return (
    <section className={card}>
      <p className="font-bold">{S5.selfEval.question}</p>
      {(Object.keys(S5.selfEval.choices) as NonNullable<FinalRecord['selfEval']>[]).map((k) => (
        <Choice key={k} selected={state.final.selfEval === k}
          onClick={() => dispatch({ type: 'UPDATE_FINAL', patch: { selfEval: k } })}>
          {S5.selfEval.choices[k]}
        </Choice>
      ))}
    </section>
  );
}

/** 7. 마치기 */
function FinishStep() {
  const { state, dispatch } = useStore();
  return (
    <section className={`${card} items-center text-center`}>
      {/* 환하게 되살아난 마을 장면 */}
      <div className="pop-in w-full overflow-hidden rounded-2xl" aria-hidden>
        <VillageScene looks={ALL_ON} darkness={0.06} festival />
      </div>
      <p className="text-3xl font-black">{S5.finish.title}</p>
      <p>{S5.finish.text}</p>
      <label className="flex w-full flex-col gap-2 text-left">
        <span className="font-bold">{S5.finish.toCharacter}</span>
        <TextArea rows={2} value={state.final.toCharacter} placeholder={COMMON.optional}
          onChange={(e) => dispatch({ type: 'UPDATE_FINAL', patch: { toCharacter: e.target.value } })} />
      </label>
    </section>
  );
}
