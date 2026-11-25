'use client';

// 모둠 함께하기: 화면 어디서든 보이는 친구 커서 (이름표 달린 색 화살표).
// 기기마다 화면 크기가 달라서 화면 좌표 대신 "어느 영역(data-cursor-anchor) 안의 어느 요소, 그 요소의 몇 % 지점"을 주고받는다.
//  - 요소는 영역에서부터 몇 번째 자식을 따라 내려가는지(path)로 찾는다. 모든 기기가 같은 화면 구조를 그리므로 같은 요소가 나온다.
//  - 한 기기에만 떠 있는 것(힌트 말풍선 등) 때문에 길이 어긋나면 영역 기준 비율로 그린다.
// 회로판은 그림 비율이 같아서 회로판 자체를 기준으로 삼는다 (정확히 같은 곳을 가리킨다).
import { useEffect, useReducer } from 'react';
import { useStore } from '@/lib/store/StoreContext';
import { useLive } from '@/lib/sync/LiveContext';

/** 영역 표시가 없는 곳을 가리킬 때 쓰는 영역 (화면 전체) */
const PAGE = 'page';
/** 너무 깊이 들어가지 않는다 (글자 하나하나까지 따라갈 필요는 없다) */
const MAX_DEPTH = 14;

/** 영역에서 요소까지: 몇 번째 자식인지와 태그 이름 ("2:div/0:button"). 너무 깊으면 null */
function pathFrom(anchor: Element, target: Element): string | null {
  const steps: string[] = [];
  let node: Element | null = target;
  while (node && node !== anchor) {
    const parent: Element | null = node.parentElement;
    if (!parent) return null;
    steps.unshift(`${Array.prototype.indexOf.call(parent.children, node)}:${node.tagName.toLowerCase()}`);
    node = parent;
  }
  return node === anchor && steps.length <= MAX_DEPTH ? steps.join('/') : null;
}

/** 경로를 따라 요소를 찾는다. 중간에 태그가 다르면(한쪽에만 있는 것 때문에 어긋남) 거기서 멈춘다 */
function follow(anchor: Element, path: string): Element | null {
  let node: Element = anchor;
  for (const step of path.split('/')) {
    const [i, tag] = step.split(':');
    const next = node.children[Number(i)];
    if (!next || next.tagName.toLowerCase() !== tag) return null;
    node = next;
  }
  return node;
}

export default function LiveCursors({ screen }: { screen: string }) {
  const { room } = useStore();
  const { peers, publish } = useLive();

  // 내 커서 알리기
  useEffect(() => {
    if (!room) return;
    const onMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.('[data-cursor-anchor]');
      const ratio = (r: DOMRect) => ({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
      if (el && target) {
        const area = el.getBoundingClientRect();
        if (area.width > 0 && area.height > 0) {
          const a = ratio(area);
          // 회로판(svg) 안은 회로판 기준만으로 정확하다. 그 밖은 커서 아래 요소까지 더 들어간다
          const path = el.tagName.toLowerCase() === 'svg' || target === el ? null : pathFrom(el, target);
          const box = path ? target.getBoundingClientRect() : null;
          const f = box && box.width > 0 && box.height > 0 ? ratio(box) : null;
          publish({ pointer: {
            screen, anchor: el.getAttribute('data-cursor-anchor')!, ax: a.x, ay: a.y,
            ...(path && f ? { path, fx: f.x, fy: f.y } : {}),
          } });
          return;
        }
      }
      publish({ pointer: { screen, anchor: PAGE, ax: e.clientX / window.innerWidth, ay: e.clientY / window.innerHeight } });
    };
    const onLeave = () => publish({ pointer: null });
    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      publish({ pointer: null });
    };
  }, [room, screen, publish]);

  // 화면 크기가 바뀌거나 스크롤하면 친구 커서 자리를 다시 계산한다
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    window.addEventListener('resize', redraw);
    window.addEventListener('scroll', redraw, true);
    return () => {
      window.removeEventListener('resize', redraw);
      window.removeEventListener('scroll', redraw, true);
    };
  }, []);

  if (!room) return null;
  const shown = peers.flatMap((p) => {
    const ptr = p.pointer;
    if (!ptr || ptr.screen !== screen) return [];
    let x = ptr.ax * window.innerWidth;
    let y = ptr.ay * window.innerHeight;
    if (ptr.anchor !== PAGE) {
      const anchor = document.querySelector(`[data-cursor-anchor="${CSS.escape(ptr.anchor)}"]`);
      if (!anchor) return [];
      // 같은 요소를 찾으면 그 요소 안 비율로, 못 찾으면 영역 안 비율로
      const el = ptr.path && ptr.fx !== undefined && ptr.fy !== undefined ? follow(anchor, ptr.path) : null;
      const r = (el ?? anchor).getBoundingClientRect();
      x = r.left + (el ? ptr.fx! : ptr.ax) * r.width;
      y = r.top + (el ? ptr.fy! : ptr.ay) * r.height;
    }
    return [{ id: p.member.id, name: p.member.name, color: p.color, x, y }];
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {shown.map((c) => (
        <div key={c.id} className="absolute left-0 top-0"
          style={{ transform: `translate(${c.x}px, ${c.y}px)`, transition: 'transform 90ms linear' }}>
          <svg viewBox="0 0 16 22" className="h-6 w-[1.1rem] drop-shadow">
            <path d="M1 1 L1 19 L5.8 14.8 L9.3 21 L12.2 19.6 L8.8 13.4 L15 13.4 Z" fill={c.color} stroke="#fff" strokeWidth={1.6}
              strokeLinejoin="round" />
          </svg>
          <span className="absolute left-4 top-5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold text-white shadow-sm"
            style={{ background: c.color }}>
            {c.name}
          </span>
        </div>
      ))}
    </div>
  );
}
