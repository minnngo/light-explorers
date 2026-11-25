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

// 버저의 빨간/검은 선과 헷갈리지 않도록 전선 색에는 빨강·검정을 쓰지 않는다
const WIRE_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#ca8a04'];

export default function CircuitBoard(props: Props) {
  const { boardId, part, board, result, editable, dark, muted, keepRinging = false } = props;
  const layout = boardLayout(boardId, part);
  const terminals = new Map(layout.flatMap((c) => c.terminals).map((t) => [t.id, t]));
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
      {board.wires.map((w, i) => {
        const a = terminals.get(w.from);
        const b = terminals.get(w.to);
        if (!a || !b) return null;
        const d = wirePath(a, b);
        const color = WIRE_COLORS[i % WIRE_COLORS.length];
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
      // 전지 끼우개에 끼운 모습. 방향은 고정 (뒤집는 버튼 없음)
      const [plus, minus] = terminals;
      const left = Math.min(plus.x, minus.x) + TERMINAL_RADIUS;
      const width = Math.abs(plus.x - minus.x) - TERMINAL_RADIUS * 2;
      const nubX = plus.x > minus.x ? left + width - 6 : left - 2;
      return (
        <g pointerEvents="none">
          <rect x={left - 6} y={center.y - 26} width={width + 12} height={52} rx={8} fill="#475569" />
          <rect x={left} y={center.y - 18} width={width} height={36} rx={6} fill="#f59e0b" />
          <rect x={nubX} y={center.y - 8} width={8} height={16} fill="#fbbf24" />
          {label(PART_NAMES.battery, center.x, center.y + 6)}
        </g>
      );
    }
    case 'switch': {
      const [a, b] = terminals;
      const top = a.y + TERMINAL_RADIUS;
      const bottom = b.y - TERMINAL_RADIUS;
      return (
        <g onClick={onToggleSwitch} style={{ cursor: onToggleSwitch ? 'pointer' : 'default' }}>
          <rect x={a.x - 34} y={top} width={68} height={bottom - top} fill="transparent" pointerEvents="all" />
          <line x1={a.x} y1={top} x2={a.x} y2={top + 12} stroke={ink} strokeWidth={6} />
          <line x1={a.x} y1={bottom} x2={switchClosed ? a.x : a.x + 34} y2={switchClosed ? top + 12 : top + 24}
            stroke={switchClosed ? '#16a34a' : '#dc2626'} strokeWidth={8} strokeLinecap="round"
            style={{ transition: 'all 0.2s' }} />
          {label(`${PART_NAMES.switch} ${switchClosed ? '닫힘' : '열림'}`, a.x - 10, a.y - TERMINAL_RADIUS - 14)}
        </g>
      );
    }
    case 'bulb':
      return <Bulb layout={layout} level={result.level} label={label} />;
    case 'buzzer':
      return <Buzzer layout={layout} level={result.level} label={label} />;
    case 'motor':
      return <Motor layout={layout} result={result} ink={ink} label={label} />;
  }
}

type LabelFn = (text: string, x: number, y: number) => React.ReactNode;

/** 부품과 두 단자를 잇는 다리(끼우개 선) */
function Leads({ layout, colors }: { layout: ComponentLayout; colors: [string, string] }) {
  const { center, terminals } = layout;
  return (
    <>
      {terminals.map((t, i) => (
        <line key={t.id} x1={center.x + (i === 0 ? -14 : 14)} y1={center.y + 30} x2={t.x} y2={t.y}
          stroke={colors[i]} strokeWidth={5} pointerEvents="none" />
      ))}
    </>
  );
}

function Bulb({ layout, level, label }: { layout: ComponentLayout; level: number; label: LabelFn }) {
  const { center } = layout;
  // 밝기 3단계: 꺼짐(검은 전구) / 약함(흐릿한 연노랑) / 밝음(진한 노랑 + 빛줄기).
  // 아이들은 "더 노란 것 = 더 밝은 것"으로 읽으므로 밝을수록 노랑이 진하게 (흰빛으로 가면 덜 밝아 보인다)
  const fill = ['#374151', '#eee2b8', 'url(#bulb-bright)'][level];
  return (
    <g pointerEvents="none">
      <Leads layout={layout} colors={['#64748b', '#64748b']} />
      {level === 2 &&
        Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI) / 4;
          return (
            <line key={i} x1={center.x + Math.cos(angle) * 44} y1={center.y - 8 + Math.sin(angle) * 44}
              x2={center.x + Math.cos(angle) * 66} y2={center.y - 8 + Math.sin(angle) * 66}
              stroke="#facc15" strokeWidth={5} strokeLinecap="round" />
          );
        })}
      {level > 0 && <circle cx={center.x} cy={center.y - 8} r={level === 2 ? 62 : 42} fill="#fde047" opacity={level === 2 ? 0.5 : 0.12} />}
      {level === 2 && (
        <defs>
          <radialGradient id="bulb-bright" cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#fff6b0" />
            <stop offset="55%" stopColor="#ffd93b" />
            <stop offset="100%" stopColor="#ffc21a" />
          </radialGradient>
        </defs>
      )}
      <circle cx={center.x} cy={center.y - 8} r={34} fill={fill} stroke="#94a3b8" strokeWidth={3} />
      <rect x={center.x - 20} y={center.y + 22} width={40} height={16} rx={3} fill="#94a3b8" />
      {label(PART_NAMES.bulb, center.x, center.y + 92)}
    </g>
  );
}

function Buzzer({ layout, level, label }: { layout: ComponentLayout; level: number; label: LabelFn }) {
  const { center } = layout;
  return (
    <g pointerEvents="none">
      {/* 빨간 선(+)과 검은 선(−). 색깔만으로 구분하지 않도록 단자 옆에 + − 글자도 표시된다 */}
      <Leads layout={layout} colors={['#dc2626', '#111827']} />
      {Array.from({ length: level }, (_, i) => (
        <circle key={i} className="sound-wave" cx={center.x} cy={center.y - 6} r={44 + i * 18} fill="none"
          stroke="#f59e0b" strokeWidth={level === 2 ? 5 : 3} style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      <text x={center.x} y={center.y + 16} textAnchor="middle" fontSize={level === 2 ? 64 : 52}>🔔</text>
      {level > 0 && (
        <text x={center.x + 70} y={center.y - 30} fontSize={level === 2 ? 26 : 18} fontWeight={800} fill="#b45309">
          {level === 2 ? '딩동!' : '딩…'}
        </text>
      )}
      {label(PART_NAMES.buzzer, center.x, center.y + 92)}
    </g>
  );
}

function Motor({ layout, result, ink, label }: { layout: ComponentLayout; result: JudgeResult; ink: string; label: LabelFn }) {
  const { center } = layout;
  const speed = result.level === 2 ? 'fan-fast' : result.level === 1 ? 'fan-slow' : '';
  const reverse = result.motorDirection === 'ccw' ? 'fan-ccw' : '';
  return (
    <g pointerEvents="none">
      <Leads layout={layout} colors={['#64748b', '#64748b']} />
      <rect x={center.x - 22} y={center.y + 8} width={44} height={30} rx={6} fill="#64748b" />
      <g className={`fan ${speed} ${reverse}`}>
        {/* 보이지 않는 원: 날개 묶음의 테두리 상자 중심을 축에 맞춰, 축을 중심으로 돌게 한다 */}
        <circle cx={center.x} cy={center.y - 4} r={62} fill="none" />
        {[0, 120, 240].map((deg) => (
          <ellipse key={deg} cx={center.x} cy={center.y - 34} rx={11} ry={30} fill="#38bdf8" stroke="#0369a1" strokeWidth={2}
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
