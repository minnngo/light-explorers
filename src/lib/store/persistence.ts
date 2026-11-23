// 1단계: 브라우저(localStorage)에 학습 기록을 보관한다. 새로고침해도 이어서 할 수 있다.
// 2단계: remoteSave.ts가 같은 스냅샷을 서버(Supabase)로 보낸다.
import type { RoomInfo } from '@/lib/sync/roomSync';
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
    window.localStorage.removeItem(TUTORIAL_KEY); // 다음 모둠은 튜토리얼을 다시 본다
  } catch {}
}

// ───────────── 회로 만들기 튜토리얼을 이 기기에서 이미 봤는지 ─────────────
const TUTORIAL_KEY = 'light-explorers:tutorial-done:v1';

export function loadTutorialDone(): boolean {
  try {
    return window.localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveTutorialDone(): void {
  try {
    window.localStorage.setItem(TUTORIAL_KEY, '1');
  } catch {}
}

// ───────────── 3단계: 이 기기의 방 정보 (새로고침해도 같은 방에 다시 들어가도록) ─────────────
const ROOM_KEY = 'light-explorers:room:v1';

export function loadRoom(): RoomInfo | null {
  try {
    const raw = window.localStorage.getItem(ROOM_KEY);
    const room = raw ? (JSON.parse(raw) as RoomInfo) : null;
    return room && typeof room.code === 'string' && room.me?.id ? room : null;
  } catch {
    return null;
  }
}

export function saveRoom(room: RoomInfo | null): void {
  try {
    if (room) window.localStorage.setItem(ROOM_KEY, JSON.stringify(room));
    else window.localStorage.removeItem(ROOM_KEY);
  } catch {}
}
