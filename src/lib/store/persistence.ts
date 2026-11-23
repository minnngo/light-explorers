// 1단계: 브라우저(localStorage)에 학습 기록을 보관한다. 새로고침해도 이어서 할 수 있다.
// 2단계: remoteSave.ts가 같은 스냅샷을 서버(Supabase)로 보낸다.
import type { AppState } from '@/lib/types';

const KEY = 'light-explorers:state:v1';

export function loadLocal(): AppState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    // 형식이 바뀐 옛 데이터는 버린다
    return parsed && typeof parsed.currentScreen === 'string' && parsed.missions?.m1 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLocal(state: AppState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 사생활 보호 모드 등에서 저장이 막혀도 앱은 계속 동작한다
  }
}

export function clearLocal(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}
