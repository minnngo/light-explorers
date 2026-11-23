'use client';

import { useEffect, useState } from 'react';
import { HINT_DELAY_MS, type HintKey, hintFor } from '@/lib/circuit/hints';
import type { BoardState, JudgeResult } from '@/lib/types';

/**
 * 연결을 바꾸지 않고 5초가 지나면 힌트를 보여 준다. 힌트가 나올 때 onShown을 한 번 부른다(hintCount 기록).
 * 회로가 바뀌면(lastChangedAt이 바뀌면) 힌트는 사라지고 타이머가 다시 시작된다.
 */
export function useHint(
  board: BoardState,
  result: JudgeResult,
  active: boolean,
  onShown: () => void,
): HintKey | null {
  const candidate = active ? hintFor(result, board.switchClosed) : null;
  const [shownAt, setShownAt] = useState<number | null>(null);

  useEffect(() => {
    if (!candidate || shownAt === board.lastChangedAt) return;
    const wait = Math.max(0, HINT_DELAY_MS - (Date.now() - board.lastChangedAt));
    const timer = setTimeout(() => {
      setShownAt(board.lastChangedAt);
      onShown();
    }, wait);
    return () => clearTimeout(timer);
  }, [candidate, shownAt, board.lastChangedAt, onShown]);

  return candidate && shownAt === board.lastChangedAt ? candidate : null;
}
