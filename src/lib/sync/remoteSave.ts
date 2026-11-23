// 2단계: 학습 기록 스냅샷을 서버에 저장한다. 상태가 바뀔 때마다 부르지만 2초에 한 번만 보낸다.
import type { AppState } from '@/lib/types';

const ENABLED = process.env.NEXT_PUBLIC_REMOTE_SAVE === 'true';
const DEBOUNCE_MS = 2000;

let timer: ReturnType<typeof setTimeout> | null = null;

export function scheduleRemoteSave(state: AppState): void {
  if (!ENABLED || !state.groupId) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void fetch(`/api/groups/${state.groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
      keepalive: true,
    }).catch(() => {
      // 네트워크가 끊겨도 수업은 계속된다. 기록은 localStorage에 남아 있고 다음 변경 때 다시 보낸다.
    });
  }, DEBOUNCE_MS);
}
