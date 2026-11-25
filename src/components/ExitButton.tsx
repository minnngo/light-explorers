'use client';

// "나가기": 어느 게임 화면에서든 처음 화면으로 돌아갈 수 있다 (확인 창을 거친다).
// 지도·미션에서는 위쪽 줄 안에, 도입·마무리에서는 화면 왼쪽 위에 떠 있다(floating).
import { useCallback, useState } from 'react';
import { RESTART } from '@/data/strings';
import { useStore } from '@/lib/store/StoreContext';
import { ConfirmDialog } from './ui';

/** 함께하기 중에는 화면 맨 위에 모둠 줄(RoomBar)이 있다 */
const ROOM_BAR_HEIGHT = 36;

export default function ExitButton({ floating = false, underBar = false, className = '' }: {
  floating?: boolean;
  /** 떠 있을 때 위쪽 모둠 줄 아래로 내릴지 */
  underBar?: boolean;
  className?: string;
}) {
  const { restart } = useStore();
  const [confirm, setConfirm] = useState(false);
  const close = useCallback(() => setConfirm(false), []);
  return (
    <>
      <button type="button" onClick={() => setConfirm(true)}
        style={floating ? { top: (underBar ? ROOM_BAR_HEIGHT : 0) + 16 } : undefined}
        className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-white/60 px-4 text-sm font-bold text-stone-700 shadow-sm outline-none backdrop-blur transition hover:bg-white/80 ${
          floating ? 'fixed left-4 z-[55]' : ''
        } ${className}`}>
        {/* 나가기 아이콘: 문과 바깥쪽 화살표 */}
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2}
          strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
          <path d="M15 8l4 4-4 4M19 12H9" />
        </svg>
        {RESTART.short}
      </button>
      <ConfirmDialog open={confirm} title={RESTART.title} body={RESTART.body} okLabel={RESTART.ok}
        cancelLabel={RESTART.cancel} onOk={restart} onCancel={close} />
    </>
  );
}
