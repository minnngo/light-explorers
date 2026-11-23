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
import { playChime, playLightOn } from '@/media/sound';

interface Props {
  boardId: BoardId;
  part: PartKind;
  board: BoardState;
  result: JudgeResult;
  editable: boolean;
  dark: boolean;
  muted: boolean;
  onAddWire: (from: TerminalId, to: TerminalId) => void;
  onRemoveWire: (wireId: string) => void;
  onToggleSwitch: () => void;
}

// 버저의 빨간/검은 선과 헷갈리지 않도록 전선 색에는 빨강·검정을 쓰지 않는다
const WIRE_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#ca8a04'];

export default function CircuitBoard(props: Props) {
  const { boardId, part, board, result, editable, dark, muted } = props;
  const layout = boardLayout(boardId, part);
  const terminals = new Map(layout.flatMap((c) => c.terminals).map((t) => [t.id, t]));
  const svgRef = useRef<SVGSVGElement>(null);
  const [pending, setPending] = useState<TerminalId | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // 안내 종 소리 (소리 끄기면 글자와 물결만)
  useEffect(() => {
    if (part === 'buzzer' && result.level > 0 && !muted) playChime(result.level as 1 | 2);
    // 불이 켜지는 소리 (명세서 14장 S1)
    if (part === 'bulb' && result.level > 0 && !muted) playLightOn(result.level as 1 | 2);
  }, [part, result.level, muted]);

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
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (cursor) setCursor(toSvg(e));
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
  };

  const pendingPos = pending ? terminals.get(pending) : undefined;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${BOARD_VIEWBOX.width} ${BOARD_VIEWBOX.height}`}
      className="w-full touch-none select-none rounded-2xl"
      style={{ background: dark ? '#111827' : '#f4ecd8', transition: 'background 0.4s' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="group"
      aria-label={`회로판 ${boardId}`}
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
        const d = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 50} ${b.x} ${b.y}`;
        const color = WIRE_COLORS[i % WIRE_COLORS.length];
        return (
          <g key={w.id}>
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
            style={{ cursor: editable ? 'crosshair' : 'default' }}
            onPointerDown={(e) => onTerminalDown(t.id, e)}
          />
        </g>
      ))}
    </svg>
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
  // 밝기 3단계: 꺼짐(검은 전구) / 약함(희미한 노란빛) / 밝음(환한 빛과 빛줄기)
  const fill = ['#374151', '#fde68a', '#fffbe0'][level];
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
      {level > 0 && <circle cx={center.x} cy={center.y - 8} r={level === 2 ? 58 : 44} fill="#fde047" opacity={level === 2 ? 0.45 : 0.2} />}
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
      {result.motorDirection && (
        <text x={center.x + 78} y={center.y - 10} textAnchor="middle" fontSize={16} fontWeight={700} fill={ink}>
          도는 방향 {result.motorDirection === 'cw' ? '↻' : '↺'}
        </text>
      )}
      {label(PART_NAMES.motor, center.x, center.y + 92)}
    </g>
  );
}
