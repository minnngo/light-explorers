'use client';

// 캐릭터 고르기 (게임 아바타 고르기처럼): 밤하늘 무대 가운데 조명 위에 캐릭터 한 마리를 크게 보여 주고
// 꺾쇠·←/→·아래 점으로 하나씩 넘겨 본다. 캐릭터마다 다른 귀여운 움직임을 한다 (globals.css의 look-*).
import { useEffect, useState } from 'react';
import { S1 } from '@/data/strings';
import { useStore } from '@/lib/store/StoreContext';
import { EXPLORER_LOOKS, type ExplorerLook } from '@/lib/types';
import { Explorer } from '../village/Characters';

export default function LookSelect({ onBack, onGo, busy = false }: { onBack: () => void; onGo: () => void; busy?: boolean }) {
  const { look, setLook } = useStore();
  const index = EXPLORER_LOOKS.indexOf(look);
  // 어느 쪽에서 들어오는지 (넘기는 방향대로 스르륵)
  const [from, setFrom] = useState<'left' | 'right'>('right');
  const go = (step: 1 | -1) => {
    setFrom(step === 1 ? 'right' : 'left');
    setLook(EXPLORER_LOOKS[(index + step + EXPLORER_LOOKS.length) % EXPLORER_LOOKS.length]);
  };
  const pick = (k: ExplorerLook) => {
    setFrom(EXPLORER_LOOKS.indexOf(k) > index ? 'right' : 'left');
    setLook(k);
  };

  // 키보드 ←/→로 넘기고 Enter로 출발
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Enter' && !busy) onGo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden bg-[#141c44] px-4 py-8 text-white">
      {/* 밤하늘 별 */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        {STARS.map(([x, y, r], i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="#fff" opacity={0.5 + (i % 3) * 0.15} className="twinkle"
            style={{ animationDelay: `${(i % 5) * 0.6}s` }} />
        ))}
      </svg>

      <button type="button" onClick={onBack}
        className="absolute left-4 top-4 flex min-h-11 items-center gap-1 rounded-full bg-white/15 px-4 text-sm font-bold outline-none backdrop-blur transition hover:bg-white/25">
        ‹ {S1.lookBack}
      </button>

      <h1 className="relative text-center text-2xl font-bold text-[#fff6d6] md:text-3xl">{S1.lookTitle}</h1>

      <div className="relative flex w-full max-w-3xl items-center justify-center gap-2">
        <Arrow side="left" onClick={() => go(-1)} />

        {/* 무대: 조명 원 위에 캐릭터 */}
        <div className="relative flex h-[22rem] w-[22rem] max-w-[70vw] items-end justify-center">
          <div aria-hidden className="absolute bottom-2 h-16 w-64 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,226,140,0.55),rgba(255,226,140,0))]" />
          <div aria-hidden className="absolute bottom-6 h-72 w-56 bg-[linear-gradient(to_top,rgba(255,236,170,0.22),rgba(255,236,170,0))] [clip-path:polygon(30%_0,70%_0,100%_100%,0_100%)]" />
          <div key={look} className={`relative ${from === 'right' ? 'look-in-right' : 'look-in-left'}`}>
            <svg viewBox="-70 -132 140 142" className="h-[19rem] w-[19rem] max-w-[68vw] drop-shadow-xl" role="img" aria-label={S1.looks[look]}>
              <ellipse cx={0} cy={0} rx={40} ry={8} fill="#000" opacity={0.25} />
              <g className={`look-move look-${look}`}>
                {/* 걷기는 빼고(캐릭터별 움직임과 겹치면 어색하다) 숨 쉬듯 살짝 + 캐릭터별 움직임만 */}
                <Explorer look={look} />
              </g>
            </svg>
          </div>
        </div>

        <Arrow side="right" onClick={() => go(1)} />
      </div>

      <div key={`t-${look}`} className="modal-rise relative flex flex-col items-center gap-1 text-center">
        <p className="text-3xl font-bold text-[#ffe9a8]">{S1.looks[look]}</p>
        <p className="text-base text-white/75">{S1.lookIntro[look]}</p>
      </div>

      {/* 아래 점: 몇 번째인지, 눌러서 바로 가기 */}
      <div className="relative flex items-center gap-2" role="tablist" aria-label={S1.lookGuide}>
        {EXPLORER_LOOKS.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={k === look} aria-label={S1.looks[k]} onClick={() => pick(k)}
            className={`h-2.5 rounded-full outline-none transition-all ${k === look ? 'w-7 bg-amber-300' : 'w-2.5 bg-white/30 hover:bg-white/60'}`} />
        ))}
      </div>

      <button type="button" onClick={onGo} disabled={busy}
        className="pulse-cta relative mt-2 min-h-14 rounded-full bg-amber-500 px-10 text-xl font-bold text-white shadow-lg outline-none transition hover:bg-amber-600 disabled:opacity-60">
        {S1.lookGo}
      </button>
    </main>
  );
}

/** 양옆 꺾쇠 (도입 화면 꺾쇠와 같은 모양, 밤하늘에 맞게 흰색) */
function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={side === 'left' ? '이전 캐릭터' : '다음 캐릭터'}
      className="flex size-14 shrink-0 items-center justify-center rounded-full text-white/80 outline-none transition hover:bg-white/15 hover:text-white">
      <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={side === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

/** 별 자리 (x%, y%, 반지름) */
const STARS: [number, number, number][] = [
  [8, 12, 1.6], [18, 30, 1.1], [27, 8, 1.3], [40, 18, 1], [55, 10, 1.5], [68, 24, 1.1], [80, 9, 1.4], [91, 20, 1.2],
  [6, 52, 1.1], [14, 74, 1.4], [30, 88, 1], [72, 86, 1.2], [86, 66, 1.5], [94, 44, 1], [60, 92, 1.1], [45, 80, 0.9],
];
