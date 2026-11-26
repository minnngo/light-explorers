'use client';

import { useCallback, useEffect, useState } from 'react';
import { HINT_DELAY_MS, type HintKey, hintFor } from '@/lib/circuit/hints';
import type { BoardState, JudgeResult } from '@/lib/types';

/**
 * 막혔을 때 두 단계 힌트.
 * - 연결을 바꾸지 않고 5초가 지나면 "힌트 보기" 버튼을 띄운다(ready). 누르면 글 힌트가 펼쳐진다(hint).
 * - 글 힌트를 펼친 뒤 5초가 지나도 회로를 고치지 못했으면 "시범 보기"를 띄운다(demoReady).
 *   누르면 회로판 위 시범이 나온다 (시범은 회로가 작동할 때까지 S4Mission이 끝까지 이어 간다).
 * 힌트를 펼칠 때마다 onShown을 부른다(hintCount 기록).
 * 회로가 바뀌면(lastChangedAt이 바뀌면) 버튼과 힌트는 사라지고 타이머가 다시 시작된다.
 */
export function useHint(
  board: BoardState,
  result: JudgeResult,
  active: boolean,
  onShown: () => void,
): { ready: boolean; hint: HintKey | null; demoReady: boolean; reveal: () => void; revealDemo: () => void } {
  const candidate = active ? hintFor(result, board.switchClosed) : null;
  const [readyAt, setReadyAt] = useState<number | null>(null);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [demoAt, setDemoAt] = useState<number | null>(null);
  /** 글 힌트를 펼친 시각 (시범 보기 타이머 기준) */
  const [openedTime, setOpenedTime] = useState(0);
  const [demoReadyAt, setDemoReadyAt] = useState<number | null>(null);

  useEffect(() => {
    if (!candidate || readyAt === board.lastChangedAt) return;
    const wait = Math.max(0, HINT_DELAY_MS - (Date.now() - board.lastChangedAt));
    const timer = setTimeout(() => setReadyAt(board.lastChangedAt), wait);
    return () => clearTimeout(timer);
  }, [candidate, readyAt, board.lastChangedAt]);

  const ready = candidate !== null && readyAt === board.lastChangedAt;
  const opened = ready && openedAt === board.lastChangedAt;

  // 글 힌트를 펼친 채 5초가 지나도 회로가 그대로(아직 못 고침)면 "시범 보기"를 띄운다
  useEffect(() => {
    if (!opened || demoReadyAt === board.lastChangedAt) return;
    const wait = Math.max(0, HINT_DELAY_MS - (Date.now() - openedTime));
    const timer = setTimeout(() => setDemoReadyAt(board.lastChangedAt), wait);
    return () => clearTimeout(timer);
  }, [opened, demoReadyAt, openedTime, board.lastChangedAt]);
  const demoReady = opened && demoReadyAt === board.lastChangedAt;
  const reveal = useCallback(() => {
    if (openedAt === board.lastChangedAt) return;
    setOpenedAt(board.lastChangedAt);
    setOpenedTime(Date.now());
    onShown();
  }, [openedAt, board.lastChangedAt, onShown]);
  const revealDemo = useCallback(() => {
    if (demoAt === board.lastChangedAt) return;
    setDemoAt(board.lastChangedAt);
    onShown();
  }, [demoAt, board.lastChangedAt, onShown]);

  return { ready, hint: opened ? candidate : null, demoReady, reveal, revealDemo };
}
