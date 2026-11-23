// 명세서 9장 회로 판정. React·DOM과 무관한 순수 함수라서 단위 테스트로 검증한다.
//
// 모델
//  - 단자 = 노드. 전선으로 이어진 단자들은 union-find로 하나의 "그물(net)"이 된다.
//  - 부품(전지, 부품, 스위치) = 두 net을 잇는 변(edge).
//  - 부품(load)을 지나는 닫힌 고리를 모두 찾고, 고리 위 전지들의 방향 값 합계 S로 레벨을 정한다.
//      전지를 (−)로 들어가 (+)로 나오면 +1, 반대면 −1  (명세서 9-2의 4단계)
//      |S| = 레벨, S의 부호 = 부품을 지나는 전기의 방향(버저 극·전동기 회전 방향)
//
// 판정 우선순위: NO_WIRES → SHORT_CIRCUIT → 고리 분석(BROKEN / SWITCH_MISSING / SAME_POLE / BUZZER_REVERSED)
//              → SWITCH_OPEN → OK
// 스위치는 "닫혀 있다고 가정"하고 고리를 분석한 뒤 마지막에 실제 상태를 반영한다.
// 그래야 "연결은 맞는데 스위치만 열림"을 구분해서 정확한 힌트를 줄 수 있다.
import type { CircuitComponent, JudgeResult, Level, Wire } from '@/lib/types';

export interface JudgeInput {
  components: readonly CircuitComponent[];
  wires: readonly Wire[];
  switchClosed: boolean;
}

interface Edge {
  component: CircuitComponent;
  /** terminals[0]이 속한 net */
  u: number;
  /** terminals[1]이 속한 net */
  v: number;
}

interface Step {
  edge: Edge;
  /** true면 u → v (terminals[0]으로 들어가 terminals[1]로 나옴) */
  forward: boolean;
}

const NOT_WORKING = (reason: JudgeResult['reason'], wiredLevel: Level = 0): JudgeResult => ({
  level: 0,
  wiredLevel,
  reason,
  motorDirection: null,
  batteriesInLoop: 0,
});

export function judge({ components, wires, switchClosed }: JudgeInput): JudgeResult {
  if (wires.length === 0) return NOT_WORKING('NO_WIRES');

  const edges = buildEdges(components, wires);
  const load = edges.find((e) => isLoad(e.component));
  if (!load) throw new Error('회로판에 부품(전구/버저/전동기)이 없습니다.');

  if (hasShortCircuit(edges, load)) return NOT_WORKING('SHORT_CIRCUIT');

  // 부품을 a → b 로 지난 뒤, b 쪽 net에서 a 쪽 net으로 돌아오는 길 = 부품을 지나는 고리
  const others = edges.filter((e) => e !== load);
  const loops = findPaths(load.v, load.u, others).map((path) => ({
    emf: path.reduce((sum, s) => sum + emfOf(s), 0),
    hasSwitch: path.some((s) => s.edge.component.type === 'switch'),
    batteries: path.filter((s) => s.edge.component.type === 'battery').length,
  }));

  if (loops.length === 0) return NOT_WORKING('BROKEN');

  const withSwitch = loops.filter((l) => l.hasSwitch);
  if (withSwitch.length === 0) {
    return NOT_WORKING(loops.some((l) => l.emf !== 0) ? 'SWITCH_MISSING' : 'BROKEN');
  }

  const best = withSwitch.reduce((a, b) => (Math.abs(b.emf) > Math.abs(a.emf) ? b : a));
  if (best.emf === 0) return NOT_WORKING(best.batteries >= 2 ? 'SAME_POLE' : 'BROKEN');

  // emf > 0 이면 전기가 부품을 terminals[0] → terminals[1] 로 지난다.
  // 버저는 terminals[0]이 빨간 선이므로, 반대로 지나면 울리지 않는다.
  if (load.component.type === 'buzzer' && best.emf < 0) return NOT_WORKING('BUZZER_REVERSED');

  const wiredLevel = Math.min(Math.abs(best.emf), 2) as Level;
  if (!switchClosed) return NOT_WORKING('SWITCH_OPEN', wiredLevel);

  return {
    level: wiredLevel,
    wiredLevel,
    reason: 'OK',
    motorDirection: load.component.type === 'motor' ? (best.emf > 0 ? 'cw' : 'ccw') : null,
    batteriesInLoop: best.batteries,
  };
}

function isLoad(c: CircuitComponent) {
  return c.type === 'bulb' || c.type === 'buzzer' || c.type === 'motor';
}

/** 전지를 지날 때의 방향 값. terminals = [plus, minus] 이므로 forward(+로 들어가 −로 나옴)는 −1 */
function emfOf(step: Step): number {
  if (step.edge.component.type !== 'battery') return 0;
  return step.forward ? -1 : 1;
}

function buildEdges(components: readonly CircuitComponent[], wires: readonly Wire[]): Edge[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let root = x;
    while (parent.has(root) && parent.get(root) !== root) root = parent.get(root)!;
    parent.set(x, root);
    return root;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));

  for (const c of components) for (const t of c.terminals) parent.set(t, t);
  for (const w of wires) {
    if (!parent.has(w.from) || !parent.has(w.to)) continue; // 다른 회로판의 단자는 무시
    union(w.from, w.to);
  }

  const netIds = new Map<string, number>();
  const net = (t: string) => {
    const root = find(t);
    if (!netIds.has(root)) netIds.set(root, netIds.size);
    return netIds.get(root)!;
  };
  return components.map((c) => ({ component: c, u: net(c.terminals[0]), v: net(c.terminals[1]) }));
}

/** start net에서 end net까지, net을 두 번 지나지 않는 모든 길. start === end 이면 빈 길 하나 */
function findPaths(start: number, end: number, edges: readonly Edge[]): Step[][] {
  const result: Step[][] = [];
  const visited = new Set<number>([start]);
  const walk = (node: number, acc: Step[]) => {
    if (node === end) {
      result.push([...acc]);
      return;
    }
    for (const edge of edges) {
      if (edge.u === edge.v) continue;
      const forward = edge.u === node;
      if (!forward && edge.v !== node) continue;
      const next = forward ? edge.v : edge.u;
      if (visited.has(next)) continue;
      visited.add(next);
      acc.push({ edge, forward });
      walk(next, acc);
      acc.pop();
      visited.delete(next);
    }
  };
  walk(start, []);
  return result;
}

/**
 * 부품을 거치지 않고 전지가 힘을 쓰는 고리가 있으면 합선으로 본다.
 * (전지 양 끝을 전선 하나로 바로 잇기, 부품 양 끝을 전선으로 이어 부품을 건너뛰기 등)
 * 같은 방향으로 나란히 놓인 전지끼리의 고리는 방향 값 합이 0이라 합선이 아니다.
 */
function hasShortCircuit(edges: readonly Edge[], load: Edge): boolean {
  for (const battery of edges.filter((e) => e.component.type === 'battery')) {
    if (battery.u === battery.v) return true;
    const rest = edges.filter((e) => e !== battery && e !== load);
    for (const path of findPaths(battery.v, battery.u, rest)) {
      const emf = -1 + path.reduce((sum, s) => sum + emfOf(s), 0);
      if (emf !== 0) return true;
    }
  }
  return false;
}
