// 명세서 7-3: 막혔을 때 힌트를 언제, 어떤 것을 보여 줄지.
import type { JudgeReason, JudgeResult } from '@/lib/types';

/** 연결을 바꾸지 않은 채 이만큼 지나면 힌트를 보여 준다 */
export const HINT_DELAY_MS = 5000;

export type HintKey = Exclude<JudgeReason, 'OK'>;

/**
 * 지금 회로 상태에서 (시간이 충분히 지났다면) 보여 줄 힌트. 없으면 null.
 *
 * 명세서는 "스위치를 5초 이상 닫아 두었을 때" 힌트를 보여 주라고 하지만,
 * 그러면 "스위치가 열려 있어요" 힌트는 절대 나올 수 없다.
 * 그래서 SWITCH_OPEN(연결은 맞고 스위치만 열림)은 스위치가 열린 채 5초가 지나면 보여 준다.
 */
export function hintFor(result: JudgeResult, switchClosed: boolean): HintKey | null {
  if (result.reason === 'OK') return null;
  if (result.reason === 'SWITCH_OPEN') return 'SWITCH_OPEN';
  if (!switchClosed) return null;
  return result.reason;
}
