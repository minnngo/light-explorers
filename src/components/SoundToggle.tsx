'use client';

// 작은 소리 버튼 (배경 음악·효과음 함께 끄고 켜기). 보통은 화면 오른쪽 위에 떠 있고,
// 마을 지도에서는 위쪽 줄의 보기 전환 옆에 놓인다 (inline). 미션 화면은 위쪽 줄 자리에 맞춰 떠 있어서
// 이야기 창·축하 장면이 덮여 있어도 언제든 누를 수 있다.
import { COMMON } from '@/data/strings';
import { useStore } from '@/lib/store/StoreContext';

/** 함께하기 방의 위쪽 줄 높이만큼 내려서 띄운다 */
const ROOM_BAR_HEIGHT = 36;

/** floatTop: 떠 있을 때 위에서 얼마나 내릴지 (미션 화면은 위쪽 줄 안에 맞춰 8) */
export default function SoundToggle({ inline = false, floatTop = 16, underBar }: {
  inline?: boolean;
  floatTop?: number;
  /** 위쪽 모둠 줄 아래로 내릴지 (기본: 모둠으로 할 때) */
  underBar?: boolean;
}) {
  const { muted, setMuted, room } = useStore();
  const belowBar = underBar ?? room !== null;
  const label = muted ? COMMON.muteOn : COMMON.muteOff;
  return (
    <button type="button" onClick={() => setMuted(!muted)} aria-label={label} aria-pressed={muted} title={label}
      style={inline ? undefined : { top: (belowBar ? ROOM_BAR_HEIGHT : 0) + floatTop }}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-white/60 text-stone-700 shadow-sm outline-none backdrop-blur transition hover:bg-white/80 ${
        inline ? '' : 'fixed right-4 z-[55]'
      }`}>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.2}
        strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 10v4h3.5L12 18V6L7.5 10z" fill="currentColor" />
        {muted ? (
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        ) : (
          <>
            <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
            <path d="M18 7a7 7 0 0 1 0 10" />
          </>
        )}
      </svg>
    </button>
  );
}
