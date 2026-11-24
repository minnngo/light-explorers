'use client';

// 처음 마을에 왔을 때 움직이는 방법을 한 단계씩 알려 준다 (방향키 → 조이스틱 → 눌러서 가기 → 화살표).
// 카드만 누를 수 있고 지도는 그대로 움직일 수 있어서, 읽으면서 바로 따라 해 볼 수 있다.
// 카드는 화면 가운데 서 있는 탐험대의 발밑에 뜬다 (조이스틱 단계는 조이스틱 위).
import { useState } from 'react';
import { WORLD } from '@/data/strings';
import { CloseButton, ProgressDots } from '../ui';

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
        <CloseButton onClick={onDone} className="!right-2 !top-2 !size-8 !shadow-none" />
        <div className="flex items-center gap-3 pr-6">
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
    // 작은 지도 한 조각: 길과 집, 누른 곳에 퍼지는 동그라미, 그곳을 누르는 마우스 커서
    return (
      <span className={box} aria-hidden>
        <svg viewBox="0 0 40 40" className="size-14">
          <rect x={1} y={1} width={38} height={38} rx={8} fill="#8cc47a" />
          <path d="M 1 31 Q 14 26 22 20 T 39 9" fill="none" stroke="#ead8b3" strokeWidth={5} strokeLinecap="round" />
          <rect x={6} y={9} width={10} height={8} rx={1.5} fill="#fff6e5" />
          <path d="M 4.5 10 L 11 4.5 L 17.5 10 Z" fill="#f28b8b" />
          <circle cx={26} cy={17} r={6.5} fill="none" stroke="#ffffff" strokeWidth={1.6} opacity={0.9} />
          <circle cx={26} cy={17} r={2.6} fill="#f59e0b" />
          <path d="M 27.5 18.5 L 27.5 33 L 31 29.5 L 33.6 35 L 36 34 L 33.4 28.5 L 38 28.5 Z"
            fill="#ffffff" stroke="#5b4a3a" strokeWidth={1.3} strokeLinejoin="round" />
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
