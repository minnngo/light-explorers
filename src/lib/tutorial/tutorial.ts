// 회로 만들기 튜토리얼 (처음 ② 만들기에 들어왔을 때). 실제 회로판 위에서 따라 하며 배운다.
//  1) 전선 잇기 → 2) 전선 지우기 → 3) 스위치 누르기 → 4) 이제 스스로
// 학생이 실제로 해 보면 다음 단계로 넘어간다. 판단은 이 순수 함수로만 한다.

export const TUTORIAL_STEPS = ['connect', 'remove', 'switch', 'go'] as const;
export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

/** 단계를 시작할 때와 지금의 회로판 모습 */
export interface BoardSnapshot {
  wires: number;
  switchClosed: boolean;
}

/** 학생이 이 단계에서 할 일을 해냈는지 */
export function stepDone(step: TutorialStep, baseline: BoardSnapshot, now: BoardSnapshot): boolean {
  switch (step) {
    case 'connect':
      return now.wires > baseline.wires;
    case 'remove':
      return now.wires < baseline.wires;
    case 'switch':
      return now.switchClosed !== baseline.switchClosed;
    case 'go':
      return false; // 마지막 안내는 "시작!" 버튼으로 끝낸다
  }
}

export function nextStep(step: TutorialStep): TutorialStep | null {
  return TUTORIAL_STEPS[TUTORIAL_STEPS.indexOf(step) + 1] ?? null;
}

/** 회로판에서 반짝이며 가리킬 것 */
export interface CoachMark {
  /** 시범: 이 두 단자를 잇는 손가락 움직임 */
  terminals?: readonly [string, string];
  wires?: boolean;
  /** wires일 때 이 단자 쌍을 잇는 전선만 반짝이게 (없으면 전선 전부) */
  onlyWires?: readonly (readonly [string, string])[];
  switch?: boolean;
  /** 시범: 이 두 단자를 잇는 전선 가운데를 누르는 손가락 (전선 지우기) */
  pressWire?: readonly [string, string];
}

/** 전지의 + 단자와 부품의 한쪽 단자. A·B 회로판 모두에 있는 단자라 어느 회로판에서도 쓸 수 있다 */
export const DEMO_TERMINALS = ['bat1.plus', 'load.a'] as const;

export function coachFor(step: TutorialStep): CoachMark | undefined {
  switch (step) {
    case 'connect':
      return { terminals: DEMO_TERMINALS };
    case 'remove':
      return { wires: true };
    case 'switch':
      return { switch: true };
    case 'go':
      return undefined;
  }
}
