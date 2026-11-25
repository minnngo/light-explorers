// 선생님이 미리 만든 모둠 (서버 전용). 표를 새로 만들지 않고 group_sessions에 모둠 줄을 미리 넣어 둔다.
//  - state.classGroup = true 로 표시해 학생 입장 화면의 모둠 목록에 보인다.
//  - room_code 는 그 모둠의 실시간 채널 이름이 된다 (학생은 목록에서 고르기만 한다).
import { createInitialState, reducer } from '@/lib/store/reducer';
import { generateRoomCode } from '@/lib/sync/roomSync';
import type { AppState } from '@/lib/types';

/** 오늘 수업: 최근 12시간 안에 만든 모둠만 */
export const CLASS_WINDOW_MS = 12 * 60 * 60 * 1000;
export const MAX_GROUPS = 12;

export interface ClassGroup {
  id: string;
  name: string;
  roomCode: string;
}

/** 모둠 하나의 처음 상태: 탐험을 시작한 바로 그 상태(도입 화면)에서 학생들을 기다린다 */
export function newClassGroupState(id: string, name: string, roomCode: string): AppState {
  const started = reducer(createInitialState(), {
    type: 'START_EXPEDITION', groupId: id, groupName: name, safetyAgreed: true, roomCode,
  });
  return { ...started, classGroup: true };
}

/** 모둠 이름 순서: 숫자는 크기대로 (1모둠, 2모둠, … 10모둠). 한꺼번에 만들면 만든 시각이 같아서 이름으로 정렬한다 */
export function byGroupName<T>(name: (x: T) => string) {
  return (a: T, b: T) => name(a).localeCompare(name(b), 'ko', { numeric: true });
}

/** 이미 쓰는 코드와 겹치지 않는 방 코드 */
export function uniqueRoomCode(taken: Set<string>): string {
  for (;;) {
    const code = generateRoomCode();
    if (!taken.has(code)) {
      taken.add(code);
      return code;
    }
  }
}
