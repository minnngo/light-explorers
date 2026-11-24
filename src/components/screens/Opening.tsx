'use client';

// 오프닝: 깜깜한 반짝마을 위로 반디가 날아오면 가로등과 창문이 하나씩 켜지고, 게임 이름이 떠오른다.
// 처음 접속했을 때와 "처음부터 다시 하기"를 했을 때 입장 화면(S1) 앞에 나온다.
import { useEffect, useState } from 'react';
import { OPENING } from '@/data/strings';
import { Fairy } from '../village/Characters';
import { CuteBellTower, CuteHouse, CuteLamp, CuteTree, CuteWindmill, PropDefs, type RoofColor } from '../village/Props';

const W = 1200;
const H = 700;
const GROUND = 600;

/** 마을이 다 밝아지고 시작 버튼이 나오기까지 (ms) */
const READY_MS = 3600;

const STARS = Array.from({ length: 46 }, (_, i) => {
  // 고정된 의사 난수: 그릴 때마다 같은 자리
  const x = (i * 263 + 71) % W;
  const y = (i * 137 + 29) % 380;
  return { x, y, r: i % 5 === 0 ? 2.4 : i % 2 ? 1.2 : 1.7, delay: (i * 0.29) % 2.4 };
});

const HOUSES: { x: number; roof: RoofColor; s: number; at: number }[] = [
  { x: 110, roof: 'rose', s: 1.25, at: 1.3 },
  { x: 255, roof: 'sky', s: 1.05, at: 1.6 },
  { x: 815, roof: 'mint', s: 1.15, at: 2.2 },
  { x: 960, roof: 'lilac', s: 1.35, at: 2.5 },
  { x: 1110, roof: 'peach', s: 1.1, at: 2.8 },
];
const LAMPS = [{ x: 360, at: 1.1 }, { x: 470, at: 1.45 }, { x: 730, at: 1.95 }, { x: 860, at: 2.35 }];
const FIREFLIES = Array.from({ length: 14 }, (_, i) => ({
  x: 80 + ((i * 89) % 1040),
  y: 380 + ((i * 53) % 200),
  delay: 1.2 + ((i * 0.37) % 2.6),
  dur: 3.5 + (i % 4),
}));

export default function Opening({ onDone }: { onDone: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setReady(true), reduced ? 0 : READY_MS);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, onDone]);

  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-[#0b1033]" aria-label={OPENING.title}>
      <VillagePanorama />

      {/* 제목과 시작 버튼 */}
      <div className="relative flex h-full flex-col items-center px-4 pt-[22vh] text-center">
        <h1 className="opening-title text-6xl font-black tracking-tight text-[#fff6d6] sm:text-7xl md:text-8xl"
          style={{ textShadow: '0 0 24px rgb(255 214 94 / 0.75), 0 4px 0 rgb(120 72 20 / 0.45)' }}>
          {OPENING.title}
        </h1>
        <p className="opening-sub mt-3 text-xl font-bold text-amber-100 md:text-2xl">{OPENING.subtitle}</p>
        <div className="mt-10 h-16">
          {ready && (
            <button type="button" onClick={onDone}
              className="modal-rise pulse-cta min-h-14 rounded-full bg-amber-500 px-10 text-xl font-black text-white shadow-lg outline-none transition hover:bg-amber-600">
              {OPENING.start}
            </button>
          )}
        </div>
      </div>
      {!ready && (
        <button type="button" onClick={onDone}
          className="absolute bottom-5 right-5 min-h-11 rounded-full px-4 text-sm font-bold text-white/50 outline-none hover:text-white/80">
          {OPENING.skip} ›
        </button>
      )}
    </main>
  );
}

/**
 * 반짝마을 밤 풍경 (화면 꽉 채움). 오프닝에서는 반디가 날아오며 불이 하나씩 켜지고,
 * 마무리(ending)에서는 처음부터 마을 전체가 환하고 축제 불빛 줄과 불꽃놀이가 더해진다.
 */
export function VillagePanorama({ ending = false }: { ending?: boolean }) {
  return (
  <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden>
    <defs>
      <PropDefs />
      <linearGradient id="op-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#090d2c" />
        <stop offset="60%" stopColor="#262d6b" />
        <stop offset="100%" stopColor="#5b4a8f" />
      </linearGradient>
      <linearGradient id="op-dawn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b3f9a" stopOpacity={0} />
        <stop offset="100%" stopColor="#ffb98a" stopOpacity={0.45} />
      </linearGradient>
      <radialGradient id="op-moon-glow">
        <stop offset="0%" stopColor="#fff7d1" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#fff7d1" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="op-firefly">
        <stop offset="0%" stopColor="#fffbd1" />
        <stop offset="40%" stopColor="#ffe066" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#ffe066" stopOpacity={0} />
      </radialGradient>
    </defs>

    <rect width={W} height={H} fill="url(#op-sky)" />
    {/* 마을이 밝아지면 지평선이 따뜻하게 물든다 */}
    <rect width={W} height={H} fill="url(#op-dawn)" className={ending ? '' : 'revive-in'} style={{ animationDelay: '2.4s' }} />
    {ending && <Festival />}
    {STARS.map((s, i) => (
      <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" className="twinkle" style={{ animationDelay: `${s.delay}s` }} />
    ))}
    <circle cx={1010} cy={110} r={90} fill="url(#op-moon-glow)" />
    <path d="M 1000 70 A 42 42 0 1 0 1046 132 A 33 33 0 1 1 1000 70 Z" fill="#fef3c7" />

    {/* 먼 언덕 두 겹 */}
    <path d={`M 0 470 Q 200 380 420 440 Q 640 500 860 420 Q 1040 360 ${W} 430 L ${W} ${H} L 0 ${H} Z`} fill="#2d3a6b" />
    <path d={`M 0 530 Q 260 470 520 520 Q 800 570 ${W} 500 L ${W} ${H} L 0 ${H} Z`} fill="#3c5a5a" />

    {/* 언덕 위 풍차와 광장의 종 */}
    {!ending && (
      <g transform="translate(1040 452) scale(0.9)" className="revive-out" style={{ animationDelay: '3s' }}>
        <CuteWindmill on={false} motion="still" />
      </g>
    )}
    <g transform="translate(1040 452) scale(0.9)" className={ending ? '' : 'revive-in'} style={{ animationDelay: '3s' }}>
      <CuteWindmill on motion="spin" />
    </g>
    <g transform="translate(600 560) scale(0.8)">
      <CuteBellTower on={ending} swing={ending} />
    </g>

    {/* 땅과 길 */}
    <rect y={GROUND - 30} width={W} height={H - GROUND + 30} fill="#4f7a5a" />
    <path d={`M 0 ${GROUND + 10} Q ${W / 2} ${GROUND - 20} ${W} ${GROUND + 10} L ${W} ${GROUND + 50} Q ${W / 2} ${GROUND + 20} 0 ${GROUND + 50} Z`}
      fill="#c9ad86" opacity={0.85} />

    {[{ x: 40, s: 1.1 }, { x: 560, s: 0.8 }, { x: 680, s: 0.9 }, { x: 1180, s: 1 }].map((t) => (
      <g key={t.x} transform={`translate(${t.x} ${GROUND - 20}) scale(${t.s})`}>
        <CuteTree />
      </g>
    ))}

    {/* 집: 꺼진 집 위에 불 켜진 집이 차례로 겹쳐 나타난다 */}
    {HOUSES.map((h) => (
      <g key={h.x} transform={`translate(${h.x} ${GROUND}) scale(${h.s})`}>
        {!ending && <CuteHouse roof={h.roof} lit={false} />}
        <g className={ending ? '' : 'revive-in'} style={{ animationDelay: `${h.at}s` }}>
          <CuteHouse roof={h.roof} lit />
        </g>
      </g>
    ))}
    {LAMPS.map((l) => (
      <g key={l.x} transform={`translate(${l.x} ${GROUND + 14})`}>
        {!ending && <CuteLamp on={false} h={78} />}
        <CuteLamp on h={78} className={ending ? undefined : 'revive-in'} delay={`${l.at}s`} />
      </g>
    ))}

    {/* 처음엔 깜깜한 밤: 불이 하나씩 켜지며 어둠이 걷힌다 */}
    {!ending && <rect width={W} height={H} fill="#050a24" className="night-lift" />}

    {/* 날아다니는 반딧불 */}
    {FIREFLIES.map((f, i) => (
      <g key={i} className="firefly-drift" style={{ animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }}>
        <circle cx={f.x} cy={f.y} r={7} fill="url(#op-firefly)" />
      </g>
    ))}

    {/* 반디: 왼쪽 아래에서 마을을 가로질러 날아와 제목 옆에 머문다 */}
    <g className={ending ? undefined : 'opening-fly'} transform={ending ? 'translate(150 330)' : undefined}>
      <g className="bob">
        <g transform="scale(2.4)">
          <Fairy glowId={ending ? "ending-fairy" : "opening-fairy"} />
        </g>
      </g>
    </g>
  </svg>
  );
}

const GARLAND_COLORS = ['#ff8fa3', '#ffd45e', '#7fe0c9', '#8fc8ff', '#c9a6ff'];
const FIREWORKS = [
  { x: 230, y: 150, color: '#ffd45e', delay: 0 },
  { x: 960, y: 120, color: '#ff8fa3', delay: 0.8 },
  { x: 600, y: 90, color: '#8fc8ff', delay: 1.6 },
  { x: 420, y: 230, color: '#c9a6ff', delay: 2.3 },
  { x: 800, y: 250, color: '#7fe0c9', delay: 3.0 },
];

/** 마무리 축제: 하늘의 불꽃놀이와 마을 위 축제 불빛 줄 */
function Festival() {
  const garland = 'M 60 330 Q 330 410 600 340 Q 870 270 1140 350';
  return (
    <g>
      {FIREWORKS.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y})`}>
          <g className="firework" style={{ animationDelay: `${f.delay}s` }}>
            {Array.from({ length: 12 }, (_, k) => {
              const a = (k * Math.PI) / 6;
              return (
                <line key={k} x1={Math.cos(a) * 10} y1={Math.sin(a) * 10} x2={Math.cos(a) * 46} y2={Math.sin(a) * 46}
                  stroke={f.color} strokeWidth={4} strokeLinecap="round" />
              );
            })}
            <circle r={6} fill="#fffbe0" />
          </g>
        </g>
      ))}
      <path d={garland} fill="none" stroke="#3b3355" strokeWidth={2} opacity={0.6} />
      {Array.from({ length: 15 }, (_, i) => {
        const t = (i + 0.5) / 15;
        // 곡선을 대략 따라가도록 x는 고르게, y는 두 구간 2차 곡선으로
        const x = 60 + t * 1080;
        const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        const [p0, p1, p2] = t < 0.5 ? [330, 410, 340] : [340, 270, 350];
        const y = (1 - u) * (1 - u) * p0 + 2 * (1 - u) * u * p1 + u * u * p2;
        return (
          <g key={i} className="twinkle" style={{ animationDelay: `${(i * 0.23) % 2}s` }}>
            <circle cx={x} cy={y + 9} r={14} fill={GARLAND_COLORS[i % GARLAND_COLORS.length]} opacity={0.35} />
            <circle cx={x} cy={y + 9} r={7} fill={GARLAND_COLORS[i % GARLAND_COLORS.length]} />
          </g>
        );
      })}
    </g>
  );
}
