'use client';

// 회로판 하나 (A 또는 B). 부품은 고정 자리, 학생은
//  - 단자를 누른 채 다른 단자까지 끌어서 전선 잇기 (또는 단자 두 개를 차례로 눌러 잇기)
//  - 전선을 눌러 지우기
//  - 스위치를 눌러 열고 닫기
// 만 할 수 있다. 판정은 부모가 judge()로 계산해 result로 넘겨준다.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  BOARD_VIEWBOX,
  boardLayout,
  type ComponentLayout,
  TERMINAL_HIT_RADIUS,
  TERMINAL_RADIUS,
} from '@/data/boards';
import { PART_NAMES } from '@/data/strings';
import type { BoardId, BoardState, JudgeResult, PartKind, TerminalId } from '@/lib/types';
import type { CoachMark } from '@/lib/tutorial/tutorial';
import { CHIME_OFFSET_MS, CHIME_PERIOD_MS, playChime, playLightOn } from '@/media/sound';

interface Props {
  boardId: BoardId;
  part: PartKind;
  board: BoardState;
  result: JudgeResult;
  editable: boolean;
  dark: boolean;
  muted: boolean;
  /** 버저가 작동하는 동안 계속 울릴지 (② 만들기·8-1 도전에서만. ③에서 이유를 쓰는 동안은 조용히) */
  keepRinging?: boolean;
  onAddWire: (from: TerminalId, to: TerminalId) => void;
  onRemoveWire: (wireId: string) => void;
  onToggleSwitch: () => void;
  /** 튜토리얼: 반짝이며 가리킬 것 */
  coach?: CoachMark;
  /** 모둠 함께하기: 같은 방 친구들의 커서와 끌고 있는 전선 */
  peers?: BoardPeer[];
  /** 모둠 함께하기: 내 포인터 위치(회로판 그림 좌표)와 끌고 있는 전선의 시작 단자. 회로판을 벗어나면 null */
  onPointerInfo?: (p: { x: number; y: number; from: TerminalId | null } | null) => void;
}

export interface BoardPeer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  from: TerminalId | null;
}

/** 두 단자를 잇는 전선 곡선 (전선과 튜토리얼 시범이 같은 모양을 쓴다) */
const wirePath = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 50} ${b.x} ${b.y}`;

// 교과서처럼 전선은 빨강·검정 두 색만 쓴다. 전지의 + 단자에 닿은 전선은 빨강, 나머지는 검정.
// (버저 다리도 빨강 = +, 검정 = − 이라서 "빨간 선은 + 쪽에" 힌트와 맞는다)
// 어두운 바탕(꺼진 마을)에서는 검정이 묻히므로 진한 회색으로 조금 밝힌다
const WIRE_RED = '#dc2626';
const WIRE_BLACK = { light: '#1f2937', dark: '#6b7280' };

export default function CircuitBoard(props: Props) {
  const { boardId, part, board, result, editable, dark, muted, keepRinging = false } = props;
  const layout = boardLayout(boardId, part);
  const terminals = new Map(layout.flatMap((c) => c.terminals).map((t) => [t.id, t]));
  const batteryPlus = new Set(layout.filter((c) => c.component.type === 'battery').map((c) => c.component.terminals[0]));
  const svgRef = useRef<SVGSVGElement>(null);
  const [pending, setPending] = useState<TerminalId | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // 안내 종 소리 (소리 끄기면 글자와 물결만)
  useEffect(() => {
    // 불이 켜지는 소리 (명세서 14장 S1)
    if (part === 'bulb' && result.level > 0 && !muted) playLightOn(result.level as 1 | 2);
  }, [part, result.level, muted]);

  // 안내 종(버저): 작동하는 동안 계속 울린다. A와 B는 번갈아 울려서 소리 세기를 비교하기 쉽게 한다.
  // 계속 울리지 않는 단계에서는 소리가 바뀌는 순간 한 번만 울린다.
  useEffect(() => {
    if (part !== 'buzzer' || result.level === 0 || muted) return;
    const level = result.level as 1 | 2;
    if (!keepRinging) {
      playChime(level);
      return;
    }
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      playChime(level);
      interval = setInterval(() => playChime(level), CHIME_PERIOD_MS);
    }, CHIME_OFFSET_MS[boardId]);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [part, result.level, muted, keepRinging, boardId]);

  const toSvg = (e: { clientX: number; clientY: number }) => {
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
    return { x: pt.x, y: pt.y };
  };

  const onTerminalDown = (id: TerminalId, e: ReactPointerEvent) => {
    if (!editable) return;
    // 터치는 누른 요소에 포인터가 붙잡히므로 풀어 줘야 손을 뗀 위치의 단자를 찾을 수 있다
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (pending && pending !== id) {
      props.onAddWire(pending, id);
      setPending(null);
      return;
    }
    setPending(id);
    setCursor(toSvg(e));
    props.onPointerInfo?.({ ...toSvg(e), from: id });
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (cursor) setCursor(toSvg(e));
    props.onPointerInfo?.({ ...toSvg(e), from: pending });
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    if (!pending || !cursor) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.getAttribute('data-terminal');
    if (target && target !== pending) {
      props.onAddWire(pending, target);
      setPending(null);
    } else if (!target) {
      setPending(null); // 빈 곳에 놓으면 취소
    }
    // 같은 단자에서 손을 떼면 "선택" 상태로 남겨 두고, 다음에 누른 단자와 잇는다
    setCursor(null);
    props.onPointerInfo?.({ ...toSvg(e), from: target === pending ? pending : null });
  };

  const pendingPos = pending ? terminals.get(pending) : undefined;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${BOARD_VIEWBOX.width} ${BOARD_VIEWBOX.height}`}
      className="w-full touch-none select-none rounded-2xl"
      // 전선을 끄는 동안에는 회로판 어디서나 손가락 모양 커서
      style={{ background: dark ? '#111827' : '#f4ecd8', transition: 'background 0.4s', cursor: pending ? 'pointer' : undefined }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => props.onPointerInfo?.(null)}
      role="group"
      aria-label={`회로판 ${boardId}`}
      data-cursor-anchor={`board-${boardId}`}
    >
      {layout.map((c) => (
        <PartDrawing key={c.component.id} layout={c} result={result} dark={dark} switchClosed={board.switchClosed}
          onToggleSwitch={editable ? props.onToggleSwitch : undefined} />
      ))}

      {/* 집게 달린 전선 */}
      {board.wires.map((w) => {
        const a = terminals.get(w.from);
        const b = terminals.get(w.to);
        if (!a || !b) return null;
        const d = wirePath(a, b);
        const color = batteryPlus.has(w.from) || batteryPlus.has(w.to) ? WIRE_RED : dark ? WIRE_BLACK.dark : WIRE_BLACK.light;
        return (
          <g key={w.id}>
            {props.coach?.wires && (!props.coach.onlyWires
              || props.coach.onlyWires.some(([a, b]) => (w.from === a && w.to === b) || (w.from === b && w.to === a))) && (
              <path d={d} stroke="#fbbf24" strokeWidth={18} fill="none" strokeLinecap="round" className="coach-glow" pointerEvents="none" />
            )}
            <path d={d} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
            <path
              d={d}
              stroke="transparent"
              strokeWidth={22}
              fill="none"
              pointerEvents="stroke"
              style={{ cursor: editable ? 'pointer' : 'default' }}
              onClick={() => editable && props.onRemoveWire(w.id)}
            >
              <title>전선 (눌러서 지우기)</title>
            </path>
          </g>
        );
      })}

      {/* 끌고 있는 전선 */}
      {pendingPos && cursor && (
        <line x1={pendingPos.x} y1={pendingPos.y} x2={cursor.x} y2={cursor.y} stroke="#f59e0b"
          strokeWidth={5} strokeDasharray="8 6" pointerEvents="none" />
      )}

      {/* 단자 (금속 부분). 위에 그려야 전선보다 먼저 눌린다 */}
      {[...terminals.values()].map((t) => (
        <g key={t.id}>
          <circle cx={t.x} cy={t.y} r={TERMINAL_RADIUS} fill="#cbd5e1" stroke={pending === t.id ? '#f59e0b' : '#64748b'}
            strokeWidth={pending === t.id ? 6 : 3} pointerEvents="none" />
          <circle cx={t.x} cy={t.y} r={TERMINAL_RADIUS / 3} fill="#64748b" pointerEvents="none" />
          {t.sign && (
            <text x={t.x} y={t.y - TERMINAL_RADIUS - 8} textAnchor="middle" fontSize={30} fontWeight={900}
              fill={dark ? '#f8fafc' : '#0f172a'} pointerEvents="none">
              {t.sign}
            </text>
          )}
          <circle
            data-terminal={t.id}
            cx={t.x}
            cy={t.y}
            r={TERMINAL_HIT_RADIUS}
            fill="transparent"
            pointerEvents="all"
            style={{ cursor: editable ? 'pointer' : 'default' }}
            onPointerDown={(e) => onTerminalDown(t.id, e)}
          />
        </g>
      ))}

      {props.coach && <Coach coach={props.coach} layout={layout} terminals={terminals} />}

      {/* 친구가 끌고 있는 전선 (친구 색 점선). 친구 커서는 화면 전체에 겹친 LiveCursors가 그린다 */}
      {props.peers?.map((p) => {
        const from = p.from ? terminals.get(p.from) : undefined;
        return from ? (
          <line key={p.id} x1={from.x} y1={from.y} x2={p.x} y2={p.y} stroke={p.color} strokeWidth={5} strokeDasharray="8 6"
            strokeLinecap="round" opacity={0.85} pointerEvents="none" />
        ) : null;
      })}
    </svg>
  );
}

/** 튜토리얼 표시: 반짝이는 고리와 시범 커서. 누르기는 아래로 통과한다 */
function Coach({ coach, layout, terminals }: {
  coach: CoachMark;
  layout: ComponentLayout[];
  terminals: Map<string, { x: number; y: number }>;
}) {
  const ring = (x: number, y: number, r: number, key: string, delay = 0) => (
    <circle key={key} cx={x} cy={y} r={r} fill="none" stroke="#f59e0b" strokeWidth={6} className="pulse-ring"
      style={{ animationDelay: `${delay}s`, animationDuration: '1.6s' }} />
  );
  const [from, to] = coach.terminals?.map((t) => terminals.get(t)) ?? [];
  const sw = layout.find((c) => c.component.type === 'switch');
  return (
    <g pointerEvents="none">
      {from && to && (
        <>
          {ring(from.x, from.y, TERMINAL_RADIUS + 12, 'from')}
          {ring(to.x, to.y, TERMINAL_RADIUS + 12, 'to', 0.8)}
          <path d={wirePath(from, to)} stroke="#f59e0b" strokeWidth={5} strokeDasharray="10 10" fill="none" className="dash-flow" />
          <g>
            <animateMotion dur="2.4s" repeatCount="indefinite" path={wirePath(from, to)} keyPoints="0;0;1;1" keyTimes="0;0.2;0.8;1" calcMode="linear" />
            <CoachCursor />
          </g>
        </>
      )}
      {coach.pressWire && (() => {
        const a = terminals.get(coach.pressWire[0]);
        const b = terminals.get(coach.pressWire[1]);
        if (!a || !b) return null;
        // 전선 곡선(wirePath)의 한가운데: 두 끝의 가운데에서 25만큼 위
        return (
          <g transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 25})`}>
            <g className="bob">
              <CoachCursor press />
            </g>
          </g>
        );
      })()}
      {coach.switch && sw && (
        <>
          <g transform={`translate(${sw.center.x} ${sw.center.y})`}>
            <g className="bob">
              <CoachCursor press />
            </g>
          </g>
        </>
      )}
    </g>
  );
}

/** 시범 커서: 큼직한 흰 화살표 (끝이 원점). press면 끝에서 누르는 동그라미가 퍼진다 */
function CoachCursor({ press = false }: { press?: boolean }) {
  const arrow = 'M 0 0 L 0 38 L 10 29 L 17 45 L 24 42 L 17 27 L 30 27 Z';
  return (
    <g pointerEvents="none">
      {press && <circle r={14} fill="none" stroke="#ffffff" strokeWidth={4} className="pulse-ring" />}
      <path d={arrow} transform="translate(3 4)" fill="#000" opacity={0.18} />
      <path d={arrow} fill="#ffffff" stroke="#3b2f2a" strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
}

function PartDrawing({
  layout,
  result,
  dark,
  switchClosed,
  onToggleSwitch,
}: {
  layout: ComponentLayout;
  result: JudgeResult;
  dark: boolean;
  switchClosed: boolean;
  onToggleSwitch?: () => void;
}) {
  const { component, terminals, center } = layout;
  const ink = dark ? '#e2e8f0' : '#1e293b';
  const label = (text: string, x: number, y: number) => (
    <text x={x} y={y} textAnchor="middle" fontSize={18} fontWeight={700} fill={ink} pointerEvents="none">
      {text}
    </text>
  );

  switch (component.type) {
    case 'battery': {
      // 교과서 준비물 사진처럼: 파란 전지 끼우개에 끼운 원통형 전지(은백색 몸통, − 쪽은 주황 띠, + 쪽은 볼록한 꼭지).
      // 방향은 고정 (뒤집는 버튼 없음)
      const [plus, minus] = terminals;
      const plusRight = plus.x > minus.x;
      const left = Math.min(plus.x, minus.x) + TERMINAL_RADIUS;
      const width = Math.abs(plus.x - minus.x) - TERMINAL_RADIUS * 2;
      const cy = center.y;
      const bodyLeft = left + (plusRight ? 4 : 10);
      const bodyWidth = width - 14;
      const bandWidth = Math.round(bodyWidth * 0.3);
      const bandX = plusRight ? bodyLeft : bodyLeft + bodyWidth - bandWidth;
      const nubX = plusRight ? bodyLeft + bodyWidth : bodyLeft - 6;
      const id = component.id;
      return (
        <g pointerEvents="none">
          <defs>
            <linearGradient id={`cell-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="35%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id={`band-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c2410c" />
              <stop offset="35%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          {/* 파란 전지 끼우개 (양 끝은 금속 판) */}
          <rect x={left - 6} y={cy - 26} width={width + 12} height={52} rx={6} fill="#2563eb" stroke="#1e3a8a" strokeWidth={2} />
          <rect x={left - 2} y={cy - 20} width={4} height={40} rx={1} fill="#cbd5e1" />
          <rect x={left + width - 2} y={cy - 20} width={4} height={40} rx={1} fill="#cbd5e1" />
          {/* 전지 몸통, − 쪽 주황 띠, + 쪽 꼭지 */}
          <rect x={bodyLeft} y={cy - 17} width={bodyWidth} height={34} rx={5} fill={`url(#cell-${id})`} stroke="#64748b" strokeWidth={1} />
          <rect x={bandX} y={cy - 17} width={bandWidth} height={34} rx={5} fill={`url(#band-${id})`} />
          <rect x={nubX} y={cy - 7} width={6} height={14} rx={2} fill={`url(#cell-${id})`} stroke="#64748b" strokeWidth={1} />
          <text x={plusRight ? bandX + bandWidth + (bodyWidth - bandWidth) / 2 : bodyLeft + (bodyWidth - bandWidth) / 2} y={cy + 6}
            textAnchor="middle" fontSize={18} fontWeight={700} fill="#1e293b">
            {PART_NAMES.battery}
          </text>
        </g>
      );
    }
    case 'switch': {
      // 교과서 준비물 사진처럼: 노란 받침 위의 금속 손잡이(칼 스위치). 아래 경첩을 축으로
      // 닫히면 손잡이가 위 금속 집게에 끼워지고, 열리면 비스듬히 들린다. 양 끝에서 회색 전선이 단자로 나간다
      const [a, b] = terminals;
      const x = a.x;
      const baseTop = a.y + TERMINAL_RADIUS + 10;
      const baseBottom = b.y - TERMINAL_RADIUS - 10;
      const clipY = baseTop + 10;
      const hingeY = baseBottom - 12;
      const leadPath = (from: number, to: number) => `M ${x} ${from} L ${x} ${to}`;
      return (
        <g onClick={onToggleSwitch} style={{ cursor: onToggleSwitch ? 'pointer' : 'default' }}>
          <rect x={x - 34} y={a.y + TERMINAL_RADIUS} width={68} height={b.y - a.y - TERMINAL_RADIUS * 2} fill="transparent" pointerEvents="all" />
          {[leadPath(a.y, baseTop + 4), leadPath(baseBottom - 4, b.y)].map((d) => (
            <g key={d} pointerEvents="none">
              <path d={d} stroke={GRAY_LEAD.edge} strokeWidth={8} strokeLinecap="round" />
              <path d={d} stroke={GRAY_LEAD.fill} strokeWidth={4.5} strokeLinecap="round" />
            </g>
          ))}
          <defs>
            <linearGradient id="switch-base" x1="0" x2="1">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="45%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          {/* 받침 */}
          <rect x={x - 20} y={baseTop} width={40} height={baseBottom - baseTop} rx={6} fill="url(#switch-base)"
            stroke="#a16207" strokeWidth={1.5} pointerEvents="none" />
          {/* 위 금속 집게와 아래 경첩 */}
          <rect x={x - 9} y={clipY - 6} width={18} height={12} rx={2} fill="#94a3b8" stroke="#475569" strokeWidth={1.2} pointerEvents="none" />
          <rect x={x - 9} y={hingeY - 6} width={18} height={12} rx={2} fill="#94a3b8" stroke="#475569" strokeWidth={1.2} pointerEvents="none" />
          {/* 손잡이: 경첩을 축으로 돈다 */}
          <g pointerEvents="none"
            style={{ transform: `rotate(${switchClosed ? 0 : 38}deg)`, transformOrigin: `${x}px ${hingeY}px`, transition: 'transform 0.2s' }}>
            <line x1={x} y1={hingeY} x2={x} y2={clipY - 2} stroke="#475569" strokeWidth={7} strokeLinecap="round" />
            <line x1={x} y1={hingeY} x2={x} y2={clipY - 2} stroke="#e2e8f0" strokeWidth={3.5} strokeLinecap="round" />
            <rect x={x - 6} y={clipY - 20} width={12} height={16} rx={4} fill="#1f2937" stroke="#94a3b8" strokeWidth={1.2} />
          </g>
          <circle cx={x} cy={hingeY} r={3.5} fill="#475569" pointerEvents="none" />
          {label(`${PART_NAMES.switch} ${switchClosed ? '닫힘' : '열림'}`, x - 10, a.y - TERMINAL_RADIUS - 14)}
        </g>
      );
    }
    case 'bulb':
      return <Bulb layout={layout} level={result.level} label={label} />;
    case 'buzzer':
      return <Buzzer layout={layout} level={result.level} dark={dark} label={label} />;
    case 'motor':
      return <Motor layout={layout} result={result} ink={ink} dark={dark} label={label} />;
  }
}

type LabelFn = (text: string, x: number, y: number) => React.ReactNode;

/**
 * 부품에서 나온 피복 전선 두 가닥. 부품 아래(from)에서 나와 살짝 휘어 단자(금속 집게 자리)로 들어간다.
 * 겉은 진한 테두리, 속은 피복 색이라 "고무로 싼 전선"처럼 보인다
 */
function Leads({ layout, from, colors }: {
  layout: ComponentLayout;
  /** 부품에서 전선이 나오는 두 점 */
  from: [{ x: number; y: number }, { x: number; y: number }];
  colors: [{ fill: string; edge: string }, { fill: string; edge: string }];
}) {
  return (
    <>
      {layout.terminals.map((t, i) => {
        const s = from[i];
        const dir = t.x < s.x ? 1 : -1;
        const d = `M ${s.x} ${s.y} C ${s.x} ${s.y + 18} ${t.x + dir * 34} ${t.y} ${t.x} ${t.y}`;
        return (
          <g key={t.id} pointerEvents="none">
            <path d={d} stroke={colors[i].edge} strokeWidth={8} fill="none" strokeLinecap="round" />
            <path d={d} stroke={colors[i].fill} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
    </>
  );
}

/** 전구·스위치처럼 +, −가 정해지지 않은 부품의 회색 전선 */
const GRAY_LEAD = { fill: '#94a3b8', edge: '#475569' };
/** 버저·전동기에 달린 빨간 선·검은 선 (교과서 준비물 사진처럼) */
const RED_LEAD = { fill: '#dc2626', edge: '#7f1d1d' };
const blackLead = (dark: boolean) => ({ fill: dark ? '#4b5563' : '#1f2937', edge: dark ? '#9ca3af' : '#000000' });

function Bulb({ layout, level, label }: { layout: ComponentLayout; level: number; label: LabelFn }) {
  const { center } = layout;
  const cx = center.x;
  const gy = center.y - 14; // 유리알 가운데 (빛과 빛줄기의 중심)
  const neck = center.y + 10; // 유리알이 꼭지쇠로 들어가는 곳
  // 교과서 준비물 사진처럼: 꼬마전구(둥근 유리알 + 나사 꼭지쇠)를 금색 전구 끼우개에 끼운 모습.
  // 밝기 3단계: 꺼짐(맑은 유리 + 회색 필라멘트) / 약함(흐릿한 연노랑) / 밝음(진한 노랑 + 빛줄기).
  // 아이들은 "더 노란 것 = 더 밝은 것"으로 읽으므로 밝을수록 노랑이 진하게 (흰빛으로 가면 덜 밝아 보인다)
  const glass = ['#e2e8f0', '#eee2b8', 'url(#bulb-bright)'][level];
  const filament = ['#57534e', '#ea580c', '#c2410c'][level];
  const glassPath = `M ${cx - 11} ${neck} C ${cx - 30} ${neck - 14} ${cx - 30} ${gy - 30} ${cx} ${gy - 30} `
    + `C ${cx + 30} ${gy - 30} ${cx + 30} ${neck - 14} ${cx + 11} ${neck} Z`;
  return (
    <g pointerEvents="none">
      <Leads layout={layout} colors={[GRAY_LEAD, GRAY_LEAD]}
        from={[{ x: cx - 10, y: center.y + 36 }, { x: cx + 10, y: center.y + 36 }]} />
      {level === 2 &&
        Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI) / 4;
          return (
            <line key={i} x1={cx + Math.cos(angle) * 44} y1={gy + Math.sin(angle) * 44}
              x2={cx + Math.cos(angle) * 66} y2={gy + Math.sin(angle) * 66}
              stroke="#facc15" strokeWidth={5} strokeLinecap="round" />
          );
        })}
      {level > 0 && <circle cx={cx} cy={gy} r={level === 2 ? 62 : 42} fill="#fde047" opacity={level === 2 ? 0.5 : 0.12} />}
      <defs>
        {level === 2 && (
          <radialGradient id="bulb-bright" cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#fff6b0" />
            <stop offset="55%" stopColor="#ffd93b" />
            <stop offset="100%" stopColor="#ffc21a" />
          </radialGradient>
        )}
        <linearGradient id="bulb-brass" x1="0" x2="1">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="45%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      {/* 유리알 */}
      <path d={glassPath} fill={glass} fillOpacity={level === 0 ? 0.75 : 1} stroke="#94a3b8" strokeWidth={2.5} />
      {level === 0 && <ellipse cx={cx - 10} cy={gy - 14} rx={4} ry={8} fill="#ffffff" opacity={0.8} />}
      {/* 필라멘트: 두 지지선 끝을 잇는 꼬불꼬불한 선 */}
      <path d={`M ${cx - 6} ${neck} L ${cx - 8} ${gy} M ${cx + 6} ${neck} L ${cx + 8} ${gy}`} stroke="#78716c" strokeWidth={1.5} fill="none" />
      <path d={`M ${cx - 8} ${gy} q 2 -6 4 0 q 2 6 4 0 q 2 -6 4 0 q 2 6 4 0`} stroke={filament} strokeWidth={level > 0 ? 2.5 : 1.8} fill="none" />
      {/* 꼭지쇠(나사)와 전구 끼우개 */}
      <rect x={cx - 12} y={neck - 1} width={24} height={12} rx={2} fill="url(#bulb-brass)" />
      {[3, 7].map((dy) => (
        <line key={dy} x1={cx - 12} y1={neck + dy} x2={cx + 12} y2={neck + dy + 1.5} stroke="#92400e" strokeWidth={1.2} />
      ))}
      <rect x={cx - 17} y={neck + 10} width={34} height={16} rx={3} fill="url(#bulb-brass)" stroke="#92400e" strokeWidth={1.2} />
      {[15, 20].map((dy) => (
        <line key={dy} x1={cx - 17} y1={neck + dy} x2={cx + 17} y2={neck + dy} stroke="#92400e" strokeWidth={1} opacity={0.7} />
      ))}
      {label(PART_NAMES.bulb, cx, center.y + 92)}
    </g>
  );
}

function Buzzer({ layout, level, dark, label }: { layout: ComponentLayout; level: number; dark: boolean; label: LabelFn }) {
  const { center } = layout;
  const cx = center.x;
  const top = center.y - 4; // 윗면(타원) 중심
  const bottom = center.y + 12;
  return (
    <g pointerEvents="none">
      {/* 교과서 준비물 사진의 버저: 납작한 연회색 원판 + 윗면 가운데 소리 구멍, 아래로 빨간 선과 검은 선이 나온다.
          단자 옆에 + − 글자도 표시된다 */}
      <Leads layout={layout}
        colors={[RED_LEAD, blackLead(dark)]}
        from={[{ x: cx - 8, y: bottom + 4 }, { x: cx + 8, y: bottom + 4 }]} />
      {Array.from({ length: level }, (_, i) => (
        <circle key={i} className="sound-wave" cx={cx} cy={center.y - 6} r={52 + i * 18} fill="none"
          stroke="#f59e0b" strokeWidth={level === 2 ? 5 : 3} style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      <defs>
        <linearGradient id="buzzer-side" x1="0" x2="1">
          <stop offset="0%" stopColor="#a8a29e" />
          <stop offset="40%" stopColor="#e7e5e4" />
          <stop offset="100%" stopColor="#a8a29e" />
        </linearGradient>
      </defs>
      {/* 몸통 옆면 (납작한 원판) */}
      <path d={`M ${cx - 40} ${top} L ${cx - 40} ${bottom} A 40 12 0 0 0 ${cx + 40} ${bottom} L ${cx + 40} ${top} Z`}
        fill="url(#buzzer-side)" stroke="#78716c" strokeWidth={1.5} />
      {/* 윗면, 안쪽 둥근 홈, 소리 구멍 */}
      <ellipse cx={cx} cy={top} rx={40} ry={12} fill="#e7e5e4" stroke="#78716c" strokeWidth={1.5} />
      <ellipse cx={cx} cy={top} rx={20} ry={6} fill="none" stroke="#a8a29e" strokeWidth={1.5} />
      <ellipse cx={cx} cy={top} rx={5} ry={2} fill="#44403c" />
      {level > 0 && (
        <text x={cx + 74} y={center.y - 30} fontSize={level === 2 ? 26 : 18} fontWeight={800} fill="#b45309">
          {level === 2 ? '딩동!' : '딩…'}
        </text>
      )}
      {/* 이름은 원판 바로 위에 (아래에 두면 단자·전선과 멀어 어느 그림의 이름인지 헷갈린다) */}
      {label(PART_NAMES.buzzer, cx, top - 20)}
    </g>
  );
}

function Motor({ layout, result, ink, dark, label }: { layout: ComponentLayout; result: JudgeResult; ink: string; dark: boolean; label: LabelFn }) {
  const { center } = layout;
  const speed = result.level === 2 ? 'fan-fast' : result.level === 1 ? 'fan-slow' : '';
  const reverse = result.motorDirection === 'ccw' ? 'fan-ccw' : '';
  return (
    <g pointerEvents="none">
      <Leads layout={layout} colors={[RED_LEAD, blackLead(dark)]}
        from={[{ x: center.x - 10, y: center.y + 40 }, { x: center.x + 10, y: center.y + 40 }]} />
      {/* 은색 금속 통(전동기 몸통)과 아래쪽 갈색 뚜껑, 전선이 붙는 구리 단자 두 개. 날개는 그 앞에서 돈다 */}
      <defs>
        <linearGradient id="motor-can" x1="0" x2="1">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="40%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <rect x={center.x - 26} y={center.y - 4} width={52} height={34} rx={5} fill="url(#motor-can)" stroke="#475569" strokeWidth={1.5} />
      <rect x={center.x - 24} y={center.y + 28} width={48} height={8} rx={2} fill="#92400e" />
      <rect x={center.x - 13} y={center.y + 34} width={6} height={7} fill="#d97706" />
      <rect x={center.x + 7} y={center.y + 34} width={6} height={7} fill="#d97706" />
      <g className={`fan ${speed} ${reverse}`}>
        {/* 보이지 않는 원: 날개 묶음의 테두리 상자 중심을 축에 맞춰, 축을 중심으로 돌게 한다 */}
        <circle cx={center.x} cy={center.y - 4} r={62} fill="none" />
        {[0, 120, 240].map((deg) => (
          <ellipse key={deg} cx={center.x} cy={center.y - 34} rx={11} ry={30} fill="#4ade80" stroke="#15803d" strokeWidth={2}
            transform={`rotate(${deg} ${center.x} ${center.y - 4})`} />
        ))}
        <circle cx={center.x} cy={center.y - 4} r={8} fill="#0f172a" />
      </g>
      {/* 도는 방향: +와 −를 반대로 이으면 바뀐다 (설명은 미션 3 도움말·더 알아보기에) */}
      {result.motorDirection && (
        <text x={center.x + 78} y={center.y - 10} textAnchor="middle" fontSize={16} fontWeight={700} fill={ink}>
          도는 방향 {result.motorDirection === 'cw' ? '↻' : '↺'}
        </text>
      )}
      {label(PART_NAMES.motor, center.x, center.y + 92)}
    </g>
  );
}
