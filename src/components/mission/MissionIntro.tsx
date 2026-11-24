'use client';

// 미션에 들어가면 먼저 보여 주는 이야기 장면.
// 위: 움직이는 상황 그림 / 아래: 반디가 날아와 한 줄씩 또박또박 말한다. 말풍선을 누르면 한 번에 다 보인다.
import { useEffect, useState } from 'react';
import { CHARACTER, MISSION_INTRO, MISSION_STRINGS } from '@/data/strings';
import type { MissionId } from '@/lib/types';
import { FairyIcon } from '../village/Characters';
import SituationScene from '../village/SituationScene';
import { ProgressDots } from '../ui';

const TYPE_MS = 45;

export default function MissionIntro({ id, onDone }: { id: MissionId; onDone: () => void }) {
  const story = MISSION_INTRO[id];
  const lines = [...story.lines, MISSION_STRINGS[id].intro];
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const last = index === lines.length - 1;

  const next = () => {
    if (last) return onDone();
    setIndex((i) => i + 1);
    setSkipped(false);
  };

  const prev = () => {
    setIndex((i) => Math.max(0, i - 1));
    setSkipped(true); // 다시 볼 때는 글자를 한 번에 보여 준다
  };

  return (
    <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div role="dialog" aria-modal="true" aria-label={MISSION_STRINGS[id].title}
        className="modal-rise flex max-h-full w-full max-w-3xl flex-col overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="relative">
          <SituationScene id={id} fixed={false} />
          <p className="absolute left-4 top-3 rounded-full bg-slate-950/45 px-3 py-1 text-sm font-bold text-white">
            {MISSION_STRINGS[id].title}
          </p>
        </div>

        <div className="flex items-end gap-2 px-5 pt-4">
          <div className="bandi-arrive shrink-0">
            <div className="bob">
              <FairyIcon className="size-24 drop-shadow-lg" />
            </div>
          </div>
          {/* 줄이 바뀔 때마다 말풍선이 살짝 튀어 오른다 (key) */}
          <button key={index} type="button" onClick={() => setSkipped(true)}
            className="modal-rise relative mb-6 min-h-24 flex-1 rounded-3xl bg-amber-50 px-5 py-3 text-left outline-none">
            <span aria-hidden className="absolute -left-2 bottom-5 size-5 rotate-45 rounded-sm bg-amber-50" />
            <span className="relative block text-sm font-bold text-amber-700">{CHARACTER}</span>
            <Typed text={lines[index]} skip={skipped} />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 pb-5 pt-2">
          {index > 0 ? (
            <button type="button" onClick={prev}
              className="min-h-11 justify-self-start rounded-2xl bg-amber-700 px-6 font-bold text-white outline-none transition hover:bg-amber-800">
              ← {story.prev}
            </button>
          ) : (
            <button type="button" onClick={onDone}
              className="min-h-11 justify-self-start rounded-2xl px-3 text-sm font-bold text-stone-400 outline-none hover:text-stone-600">
              {story.skip}
            </button>
          )}
          <ProgressDots count={lines.length} index={index} />
          <button type="button" onClick={next}
            className={`${last ? 'pulse-cta' : ''} min-h-11 justify-self-end rounded-2xl bg-amber-700 px-6 font-bold text-white outline-none transition hover:bg-amber-800`}>
            {last ? `${story.start} →` : `${story.next} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 글자가 한 자씩 나타난다. 화면 읽기 프로그램에는 처음부터 전체 문장을 준다 */
function Typed({ text, skip }: { text: string; skip: boolean }) {
  const [count, setCount] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? text.length : 0,
  );
  useEffect(() => {
    if (skip) return;
    const timer = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [text, skip]);
  const shown = skip ? text.length : count;
  return (
    <span className="relative block text-lg leading-snug">
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.slice(0, shown)}
        <span className="invisible">{text.slice(shown)}</span>
      </span>
    </span>
  );
}
