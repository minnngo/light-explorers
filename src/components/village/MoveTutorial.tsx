'use client';

// 처음 마을에 왔을 때 움직이는 방법을 한 단계씩 알려 준다 (방향키 → 조이스틱 → 눌러서 가기 → 화살표).
// 카드만 누를 수 있고 지도는 그대로 움직일 수 있어서, 읽으면서 바로 따라 해 볼 수 있다.
// 카드는 화면 가운데 서 있는 탐험대의 발밑에 뜬다 (조이스틱 단계는 조이스틱 위).
import { useState } from 'react';
import { WORLD } from '@/data/strings';
import { ProgressDots } from '../ui';

const T = WORLD.tutorial;

export default function MoveTutorial({ near, onDone }: { near: boolean; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === T.steps.length - 1;
  const { title, text } = T.steps[step];

  return (
    <>
      {/* 지금 단계가 가리키는 곳을 반짝이는 고리로 */}
      {step === 1 && (
        <span aria-hidden className="pointer-events-none absolute bottom-4 right-4 size-32 rounded-full ring-4 ring-amber-300 pulse-ring" />
      )}
      {step === 3 && near && (
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-[calc(50%-3.5rem)] size-40 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-amber-300 pulse-ring" />
      )}

      <div key={step} role="dialog" aria-label={title}
        className={`modal-rise absolute z-20 flex w-[min(22rem,calc(100%-2rem))] flex-col gap-3 rounded-3xl bg-white p-5 shadow-xl ${
          step === 1 ? 'bottom-40 right-4' : 'left-1/2 top-[calc(50%+3rem)] -translate-x-1/2'
        }`}>
        <div className="flex items-center gap-3">
          <StepArt step={step} />
          <div className="flex flex-col gap-0.5">
            <p className="text-lg font-bold">{title}</p>
            <p className="text-base leading-snug text-slate-600">{text}</p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          {!last ? (
            <button type="button" onClick={onDone}
              className="justify-self-start rounded-xl px-2 py-1 text-sm font-bold text-stone-400 outline-none hover:text-stone-600">
              {T.skip}
            </button>
          ) : <span aria-hidden />}
          <ProgressDots count={T.steps.length} index={step} />
          <button type="button" onClick={() => (last ? onDone() : setStep(step + 1))}
            className="min-h-10 justify-self-end rounded-2xl bg-amber-700 px-4 font-bold text-white outline-none transition hover:bg-amber-800">
            {last ? T.start : `${T.next} →`}
          </button>
        </div>
      </div>
    </>
  );
}

/** 단계마다 작은 그림: 방향키 / 조이스틱 / 누르기 / 화살표 */
function StepArt({ step }: { step: number }) {
  const box = 'flex size-16 shrink-0 items-center justify-center rounded-2xl bg-amber-50';
  if (step === 0) {
    const key = 'flex size-5 items-center justify-center rounded-md bg-white text-[10px] font-black text-amber-700 shadow-sm';
    return (
      <span className={box} aria-hidden>
        <span className="grid grid-cols-3 gap-0.5">
          <span />
          <span className={key}>▲</span>
          <span />
          <span className={key}>◀</span>
          <span className={key}>▼</span>
          <span className={key}>▶</span>
        </span>
      </span>
    );
  }
  if (step === 1) {
    return (
      <span className={box} aria-hidden>
        <span className="flex size-12 items-center justify-center rounded-full bg-slate-700/30">
          <span className="size-6 rounded-full bg-amber-400" />
        </span>
      </span>
    );
  }
  if (step === 2) {
    return (
      <span className={box} aria-hidden>
        <svg viewBox="0 0 40 40" className="size-12">
          <circle cx={20} cy={18} r={12} fill="none" stroke="#f59e0b" strokeWidth={2.5} opacity={0.5} />
          <circle cx={20} cy={18} r={5} fill="#f59e0b" />
          <path d="M 20 24 L 24 36 L 26.5 31 L 31 35 L 33 33 L 28.5 29 L 33.5 27 Z" fill="#7c5a3a" />
        </svg>
      </span>
    );
  }
  return (
    <span className={box} aria-hidden>
      <svg viewBox="0 0 40 40" className="size-12">
        <circle cx={14} cy={24} r={7} fill="#f6d9a8" />
        <path d="M 22 20 L 34 12 L 31 24 Z" fill="#f59e0b" />
      </svg>
    </span>
  );
}
