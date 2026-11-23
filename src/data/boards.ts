// 회로판 A(전지 1개), B(전지 2개)의 부품 고정 위치와 단자 정의.
// 명세서 10장 "1단계 단순화": 부품은 고정 자리, 학생은 단자끼리 전선만 잇는다.
import type { BoardId, CircuitComponent, PartKind, TerminalId } from '@/lib/types';

export const BOARD_VIEWBOX = { width: 480, height: 340 } as const;
/** 단자 그림 반지름 */
export const TERMINAL_RADIUS = 20;
/** 단자를 누를 수 있는 영역 반지름. 회로판이 작게 그려져도 지름 44px 이상이 되도록 넉넉히 잡는다 */
export const TERMINAL_HIT_RADIUS = 30;

export interface TerminalLayout {
  id: TerminalId;
  x: number;
  y: number;
  /** 단자 옆에 쓰는 글자. 색깔만으로 극을 구분하지 않기 위해 항상 표시 */
  sign: '+' | '−' | null;
}

export interface ComponentLayout {
  component: CircuitComponent;
  terminals: readonly [TerminalLayout, TerminalLayout];
  center: { x: number; y: number };
}

/** 회로판마다 반드시 이 정도 레벨이 나와야 "정상 연결"로 본다 */
export const REQUIRED_LEVEL: Record<BoardId, 1 | 2> = { A: 1, B: 2 };

function battery(id: string, minusX: number, plusX: number, y: number): ComponentLayout {
  const plus = `${id}.plus`;
  const minus = `${id}.minus`;
  return {
    component: { id, type: 'battery', terminals: [plus, minus] },
    terminals: [
      { id: plus, x: plusX, y, sign: '+' },
      { id: minus, x: minusX, y, sign: '−' },
    ],
    center: { x: (minusX + plusX) / 2, y },
  };
}

function load(part: PartKind): ComponentLayout {
  const a = 'load.a';
  const b = 'load.b';
  // 버저는 빨간 선(a)이 +, 검은 선(b)이 − (명세서 10장 접근성 규칙: 글자도 같이 단다)
  const signs: [TerminalLayout['sign'], TerminalLayout['sign']] =
    part === 'buzzer' ? ['+', '−'] : [null, null];
  return {
    component: { id: 'load', type: part, terminals: [a, b] },
    terminals: [
      { id: a, x: 170, y: 130, sign: signs[0] },
      { id: b, x: 310, y: 130, sign: signs[1] },
    ],
    center: { x: 240, y: 75 },
  };
}

function switchAt(x: number): ComponentLayout {
  return {
    component: { id: 'sw', type: 'switch', terminals: ['sw.a', 'sw.b'] },
    terminals: [
      { id: 'sw.a', x, y: 120, sign: null },
      { id: 'sw.b', x, y: 260, sign: null },
    ],
    center: { x, y: 190 },
  };
}

export function boardLayout(board: BoardId, part: PartKind): ComponentLayout[] {
  if (board === 'A') {
    return [battery('bat1', 80, 240, 290), load(part), switchAt(420)];
  }
  // B: 전지 끼우개 2개. 학생이 직접 서로 다른 극끼리 한 줄로 이어야 한다.
  return [battery('bat1', 40, 150, 290), battery('bat2', 210, 320, 290), load(part), switchAt(430)];
}

export function boardComponents(board: BoardId, part: PartKind): CircuitComponent[] {
  return boardLayout(board, part).map((l) => l.component);
}
