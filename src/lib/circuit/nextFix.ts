// 두 번째 힌트(직접 보여 주기): 지금 회로판에서 "다음에 할 한 가지"를 찾는다.
// 바르게 작동하는 고리 회로(정답 모양)를 모두 만들어 두고, 지금 전선과 가장 적게 다른 정답을 골라
// 1) 필요 없는 전선 지우기 → 2) 모자란 전선 잇기 → 3) 스위치 닫기 순서로 하나만 알려 준다.
import { boardComponents, REQUIRED_LEVEL } from '@/data/boards';
import type { BoardId, BoardState, CircuitComponent, PartKind, TerminalId } from '@/lib/types';
import { judge } from './judge';

export type Fix =
  | { kind: 'remove'; wireId: string; from: TerminalId; to: TerminalId }
  | { kind: 'add'; from: TerminalId; to: TerminalId }
  | { kind: 'switch' };

type Edge = readonly [TerminalId, TerminalId];
const keyOf = (a: TerminalId, b: TerminalId) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [x, ...rest]));
}

/** 부품을 한 줄로 이어 한 바퀴 도는 고리. 부품마다 어느 단자로 들어가고 나오는지(방향)도 정한다 */
function loopEdges(order: CircuitComponent[], flips: boolean[]): Edge[] {
  const ends = order.map((c, i) => (flips[i] ? [c.terminals[1], c.terminals[0]] : [c.terminals[0], c.terminals[1]]));
  return ends.map((e, i) => [e[1], ends[(i + 1) % ends.length][0]] as const);
}

const cache = new Map<string, Edge[][]>();

/** 이 회로판에서 바르게 작동하는 정답 전선 모양들 (앞에 있을수록 "전지 → 부품 → 스위치" 순서에 가깝다) */
export function solutions(board: BoardId, part: PartKind): Edge[][] {
  const id = `${board}:${part}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const components = boardComponents(board, part);
  const [first, ...others] = components;
  const seen = new Set<string>();
  const found: Edge[][] = [];
  for (const rest of permutations(others)) {
    const order = [first, ...rest];
    for (let mask = 0; mask < 1 << order.length; mask++) {
      const edges = loopEdges(order, order.map((_, i) => ((mask >> i) & 1) === 1));
      const sig = edges.map(([a, b]) => keyOf(a, b)).sort().join(',');
      if (seen.has(sig)) continue;
      seen.add(sig);
      const r = judge({ components, wires: edges.map(([from, to], i) => ({ id: `s${i}`, from, to })), switchClosed: true });
      if (r.reason === 'OK' && r.level === REQUIRED_LEVEL[board]) found.push(edges);
    }
  }
  cache.set(id, found);
  return found;
}

/** 지금 회로판에서 다음에 할 한 가지. 이미 바르게 작동하면 null */
export function nextFix(board: BoardId, part: PartKind, state: Pick<BoardState, 'wires' | 'switchClosed'>): Fix | null {
  let best: { extras: BoardState['wires']; missing: Edge[]; cost: number } | null = null;
  for (const target of solutions(board, part)) {
    const want = new Map(target.map((e) => [keyOf(e[0], e[1]), e]));
    const used = new Set<string>();
    const extras = state.wires.filter((w) => {
      const k = keyOf(w.from, w.to);
      if (want.has(k) && !used.has(k)) {
        used.add(k);
        return false;
      }
      return true; // 정답에 없는 전선이거나, 같은 두 단자를 또 이은 전선
    });
    const missing = [...want].filter(([k]) => !used.has(k)).map(([, e]) => e);
    const cost = extras.length + missing.length + (state.switchClosed ? 0 : 1);
    if (!best || cost < best.cost) best = { extras, missing, cost };
  }
  if (!best) return null;
  if (best.extras.length > 0) {
    const w = best.extras[0];
    return { kind: 'remove', wireId: w.id, from: w.from, to: w.to };
  }
  if (best.missing.length > 0) {
    const [from, to] = best.missing[0];
    return { kind: 'add', from, to };
  }
  return state.switchClosed ? null : { kind: 'switch' };
}

/** 지금부터 작동할 때까지 할 일 전체 (nextFix를 차례로 따라 한 순서). 이미 작동하면 빈 배열 */
export function planFixes(board: BoardId, part: PartKind, state: Pick<BoardState, 'wires' | 'switchClosed'>): Fix[] {
  const plan: Fix[] = [];
  let now = { wires: [...state.wires], switchClosed: state.switchClosed };
  for (let i = 0; i < 12; i++) {
    const fix = nextFix(board, part, now);
    if (!fix) break;
    plan.push(fix);
    if (fix.kind === 'remove') now = { ...now, wires: now.wires.filter((w) => w.id !== fix.wireId) };
    if (fix.kind === 'add') now = { ...now, wires: [...now.wires, { id: `plan${i}`, from: fix.from, to: fix.to }] };
    if (fix.kind === 'switch') now = { ...now, switchClosed: true };
  }
  return plan;
}
