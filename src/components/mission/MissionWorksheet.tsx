'use client';

// 미션 화면 오른쪽 학습지 패널. 단계마다 다른 내용을 보여 준다.
// POE 규칙: ④ 확인하기 전에는 실제 결과 문장, 정답 표시, 정리 문구를 절대 그리지 않는다.
import { useEffect, useState } from 'react';
import { MISSIONS } from '@/data/missions';
import { CHARACTER, COMMON, MISSION_STRINGS } from '@/data/strings';
import { canConfirm, canGoCompare, checklist, currentResults, MIN_EXPLANATION_LENGTH } from '@/lib/flow/missionFlow';
import { actions } from '@/lib/store/actions';
import { useStore } from '@/lib/store/StoreContext';
import type { CompareChoice, PredictionChoice } from '@/lib/types';
import { PLACE_ICONS } from '@/media/assets';
import { playSuccess } from '@/media/sound';
import { Button, Choice, Speech, TextArea } from '../ui';

export default function MissionWorksheet({ className = '' }: { className?: string }) {
  const { state } = useStore();
  const step = state.missions[state.currentMission!].step;
  return (
    <aside className={`flex flex-col gap-4 rounded-2xl bg-white p-4 shadow ${className}`}>
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
  return (
    <>
      <Speech speaker={CHARACTER}>{text.intro}</Speech>
      <p className="font-bold">{text.predictQuestion}</p>
      {(['a', 'b', 'c'] as const).map((k) => (
        <Choice key={k} selected={picked === k} onClick={() => setPicked(k)}>
          {text.predictChoices[k]}
        </Choice>
      ))}
      <Button disabled={!picked} onClick={() => picked && dispatch({ type: 'SET_PREDICTION', choice: picked })}>
        {text.predictConfirm}
      </Button>
    </>
  );
}

/** ② 회로 만들기: 체크리스트는 판정 결과로 자동 체크 */
function BuildPanel() {
  const { state, dispatch } = useStore();
  const text = MISSION_STRINGS[state.currentMission!];
  const checks = checklist(currentResults(state)!);
  return (
    <>
      <h3 className="text-xl font-bold">{text.checklistTitle}</h3>
      <ul className="flex flex-col gap-2">
        {text.checklist.map((item, i) => (
          <li key={i} className={`flex gap-2 rounded-xl p-2 ${checks[i] ? 'bg-emerald-50' : ''}`}>
            <span aria-hidden className="text-xl">{checks[i] ? '✅' : '⬜'}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-base text-slate-600">{text.checklistHelp}</p>
      <p className="text-sm text-slate-500">{COMMON.wireHowTo}</p>
      <Button disabled={!canGoCompare(state)} onClick={() => dispatch({ type: 'GO_COMPARE' })}>
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
  const [showHelp, setShowHelp] = useState(false);
  const length = record.explanation.trim().length;
  return (
    <>
      <p className="font-bold">{text.compareGuide}</p>
      <p className="leading-relaxed">
        {text.compareBefore}
        {(['less', 'more'] as CompareChoice[]).map((k, i) => (
          <span key={k}>
            {i > 0 && ' / '}
            <Choice className="mx-1 inline-block" selected={record.compare === k}
              onClick={() => dispatch({ type: 'SET_COMPARE', choice: k })}>
              {text.compareChoices[k]}
            </Choice>
          </span>
        ))}
        {text.compareAfter}
      </p>
      <label className="flex flex-col gap-2">
        <span className="font-bold">{text.reasonPrompt}</span>
        <TextArea
          value={record.explanation}
          placeholder={text.reasonPlaceholder}
          onChange={(e) => dispatch({ type: 'SET_EXPLANATION', text: e.target.value })}
        />
        <span className="text-right text-sm text-slate-500">
          {COMMON.minChars(length, MIN_EXPLANATION_LENGTH)}
        </span>
      </label>
      {text.reasonHelp && (
        <button type="button" className="self-start text-base text-sky-700 underline" onClick={() => setShowHelp((v) => !v)}>
          {showHelp ? text.reasonHelp : COMMON.showHelp}
        </button>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => dispatch(actions.backToBuild())}>
          {text.retry}
        </Button>
        <Button className="flex-1" disabled={!canConfirm(record)} onClick={() => dispatch({ type: 'CONFIRM' })}>
          {text.confirmButton}
        </Button>
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

  useEffect(() => {
    if (!muted) playSuccess();
  }, [muted]);

  return (
    <>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
        <dt className="font-bold">{COMMON.myPrediction}</dt>
        <dd>{record.prediction ? text.predictChoices[record.prediction] : '-'}</dd>
        <dt className="font-bold">{COMMON.actualResult}</dt>
        <dd>{text.actualResult}</dd>
      </dl>
      <p className={`font-bold ${right ? 'text-emerald-700' : 'text-sky-700'}`}>
        {right ? text.predictionRight : text.predictionDifferent}
      </p>
      <p className="rounded-xl bg-amber-50 p-3">{text.summary}</p>
      <div className="pop-in flex flex-col items-center gap-2 rounded-2xl bg-indigo-950 p-4 text-white">
        <span className="text-6xl" aria-hidden>{PLACE_ICONS[id].on}</span>
        <Speech speaker={CHARACTER}>
          <span className="text-slate-900">{text.revival}</span>
        </Speech>
      </div>
      <Button onClick={() => dispatch(actions.completeMission())}>{COMMON.backToMap}</Button>
    </>
  );
}
