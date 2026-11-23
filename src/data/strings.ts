// 학생 화면에 나오는 모든 문구 (명세서 12장: 문구는 한 파일에 모아 코드와 분리).
// 문구를 고칠 때는 이 파일만 고치면 된다.
// 주의: 미션 화면(S4) 문구에는 "직렬"이라는 말과 원리 정리를 쓰지 않는다. 용어는 S5 설명하기에서 처음 나온다.
import type { JudgeReason, MissionId, PartKind } from '@/lib/types';

// ───────────── 세계관 ─────────────
// 디지털 미션만의 이야기 (3차시 책 이야기와 잇지 않기로 함).
//  - 주인공: 학생 모둠 = "탐험대". 모둠 이름으로 불린다.
//  - 무대: 전지의 힘으로 불을 밝히는 "반짝마을". 오늘 밤은 일 년에 한 번 열리는 불빛 축제 날이다.
//  - 안내 인물: 마을의 불빛을 지키는 빛 요정 "반디". 탐험대에게 도움을 요청하고 안내한다.

/** 안내 인물 (말풍선 이름) */
export const CHARACTER = '빛 요정 반디';
export const VILLAGE = '반짝마을';

export const COMMON = {
  appTitle: '불빛 탐험대: 꺼진 마을을 밝혀라',
  next: '다음',
  revived: (n: number) => `되살아난 장소 ${n}/3`,
  stepLabels: ['① 예상', '② 만들기', '③ 비교·이유', '④ 확인'] as const,
  safetyFooter:
    '전기 부품을 만질 때는 절연 장갑을 끼고, 젖은 손으로 만지지 않아요. 진짜 콘센트 전기로는 절대 실험하지 않아요!',
  muteOn: '🔇 소리 켜기',
  muteOff: '🔊 소리 끄기',
  backToMap: '지도로 돌아가기',
  darkViewOn: '🌙 어둡게 보기',
  darkViewOff: '☀️ 밝게 보기',
  sameBulbs: '같은 전구 2개',
  roleA: 'A 회로 담당',
  roleB: 'B 회로 담당',
  boardA: 'A 회로 (전지 1개)',
  boardB: 'B 회로 (전지 2개)',
  wireHowTo: '단자를 눌러 다른 단자까지 끌면 전선이 이어져요. 단자 두 개를 차례로 눌러도 돼요. 전선을 누르면 지워져요.',
  myPrediction: '내 예상',
  actualResult: '실제 결과',
  showHelp: '도움말 보기',
  minChars: (now: number, min: number) => `${Math.min(now, min)}/${min}글자 이상`,
  loading: '불빛 탐험대를 준비하고 있어요…',
  optional: '(선택)',
  reviewing: '완료한 곳이에요. 결과를 다시 볼 수 있어요.',
};

/** 3단계: 여러 기기로 함께하기 */
export const ROOM = {
  togetherToggle: '여러 기기로 함께하기 (A 회로·B 회로를 기기마다 나누어 맡아요)',
  modeNew: '새 모둠으로 시작',
  modeJoin: '모둠 방에 들어가기',
  myName: '내 이름 (모둠 친구들에게 보여요)',
  myNamePlaceholder: '예) 민수',
  myRole: '내가 맡을 회로',
  roleName: { A: 'A 회로 (전지 1개)', B: 'B 회로 (전지 2개)' } as Record<'A' | 'B', string>,
  codeLabel: '방 코드 (먼저 시작한 친구 화면 위쪽에 있어요)',
  codePlaceholder: '예) K7P2',
  codeInvalid: '방 코드는 4글자예요.',
  join: '방에 들어가기',
  waiting: '모둠 화면을 불러오고 있어요…',
  notFound: '아직 방을 찾지 못했어요. 방 코드가 맞는지, 먼저 시작한 친구가 탐험을 시작했는지 확인해 보세요.',
  cancel: '그만두기',
  bar: (code: string) => `함께하기 방 코드 ${code}`,
  connecting: '연결하는 중…',
  offline: '연결이 끊겼어요. 다시 연결하는 중…',
  me: '(나)',
  nobody: '아직 없음',
  roleOwner: (role: 'A' | 'B', names: string) => `${role} 회로 담당: ${names}`,
  notMyBoard: (role: 'A' | 'B') => `${role} 회로 담당 기기에서 조작해요`,
  did: (name: string, what: string) => `${name}: ${what}`,
  actions: {
    ADD_WIRE: '전선을 이었어요',
    REMOVE_WIRE: '전선을 지웠어요',
    TOGGLE_SWITCH: '스위치를 눌렀어요',
    SET_PREDICTION: '예상을 정했어요',
    GO_COMPARE: '비교하러 갔어요',
    BACK_TO_BUILD: '다시 해 보기를 눌렀어요',
    SET_COMPARE: '○표를 골랐어요',
    CONFIRM: '확인하기를 눌렀어요',
    COMPLETE_MISSION: '지도로 돌아갔어요',
    OPEN_MISSION: '미션을 열었어요',
    START_CHALLENGE: '도전을 시작했어요',
    NEXT_INTRO_CUT: '다음으로 넘겼어요',
    NEXT_WRAPUP_STEP: '다음으로 넘겼어요',
  } as Partial<Record<string, string>>,
};

export const RESTART = {
  button: '처음부터 다시 하기 (다음 모둠)',
  confirm: '이 기기의 기록을 지우고 처음 화면으로 돌아갈까요? (선생님 화면에 저장된 기록은 남아요)',
};

/** 회로 만들기 튜토리얼 (처음 ② 만들기에 들어왔을 때) */
export const TUTORIAL = {
  title: '🎓 회로 만드는 방법',
  replay: '🎓 연결 방법 다시 보기',
  skip: '건너뛰기',
  next: '다음',
  start: '시작!',
  where: (board: 'A' | 'B') => `👇 ${board} 회로판에서 해 보세요`,
  steps: {
    connect: {
      title: '1. 전선 잇기',
      text: '반짝이는 전지의 + 단자를 누른 채 전구 쪽 단자까지 끌어 보세요. 단자 두 개를 차례로 눌러도 돼요.',
    },
    remove: {
      title: '2. 전선 지우기',
      text: '전선이 이어졌어요! 잘못 이었을 때는 전선을 누르면 지워져요. 방금 이은 전선을 눌러 보세요.',
    },
    switch: {
      title: '3. 스위치 누르기',
      text: '스위치는 처음에 열려 있어요. 스위치를 눌러 닫아 보세요. 한 번 더 누르면 다시 열려요.',
    },
    go: {
      title: '4. 이제 스스로!',
      text: '탐험 과제를 보며 전지의 양 끝(+, −)과 부품, 스위치가 끊기지 않게 이어 보세요.',
    },
  } as Record<'connect' | 'remove' | 'switch' | 'go', { title: string; text: string }>,
};

/** 8-1 선택 보충 (지도서에 없는 활동. 미션 1 ④ 확인하기에서만) */
export const CHALLENGE = {
  button: '도전! 더 해 보기 (선택)',
  prompt: '도전! B 회로의 전지 두 개를 같은 극끼리 이어 보세요. 어떻게 되나요?',
  howTo: 'B 회로의 전선을 지우고 다시 이은 뒤 스위치를 닫아 보세요.',
  done: '전지를 늘리기만 해서는 안 되고, 서로 다른 극끼리 한 줄로 이어야 해요.',
};

export const PART_NAMES: Record<PartKind | 'battery' | 'switch', string> = {
  battery: '전지',
  switch: '스위치',
  bulb: '전구',
  buzzer: '버저',
  motor: '날개 달린 전동기',
};

export const S1 = {
  title: '불빛 탐험대 출동!',
  nameGuide: '우리 모둠 이름을 지어 주세요.',
  namePlaceholder: '예) 반짝반짝 탐험대',
  safetyTitle: '안전 약속(모두 체크해야 시작할 수 있어요):',
  safetyPromises: [
    '전기 부품을 만질 때는 절연 장갑을 끼고, 젖은 손으로 만지지 않아요.',
    '전구의 유리 부분은 깨지기 쉬우니 조심해서 다뤄요.',
    '전선의 집게에 손이 끼지 않게, 날개 달린 전동기에 손을 다치지 않게 조심해요.',
  ],
  start: '탐험 시작',
};

export const S2 = {
  cuts: [
    {
      speaker: null,
      text: '여기는 전지의 힘으로 불을 밝히는 반짝마을이에요. 오늘 밤은 일 년에 한 번 열리는 불빛 축제 날이에요. 그런데 해가 지자 마을이 이상하게 어두워요.',
    },
    {
      speaker: CHARACTER,
      text: (group: string) =>
        `${group}, 와 줘서 고마워요! 저는 마을의 불빛을 지키는 빛 요정 반디예요. 큰일이에요. 가로등은 희미하게 깜빡이고, 광장의 안내 종은 소리가 겨우 들리고, 언덕의 풍차는 느릿느릿 돌고 있어요. 이대로는 축제를 열 수 없어요.`,
    },
    { speaker: CHARACTER, text: '마을을 고치기 전에 하나만 확인할게요. 전구에 불이 켜지려면 회로가 어떻게 이어져 있어야 할까요?' },
    {
      speaker: CHARACTER,
      text: '우리 마을 사람들이 쓰는 손 선풍기는 전지를 1개 넣는 것도 있고 2개 넣는 것도 있어요. 손전등과 리모컨은 전지가 2개 들어 있고요. 왜 제품마다 전지의 개수가 다를까요?',
    },
    {
      speaker: CHARACTER,
      text: (group: string) => `${group}, 전지의 개수를 달리해서 축제 전에 반짝마을을 다시 밝혀 줄래요?`,
    },
  ],
  recall: {
    before: '전구에 불이 켜지는 전기 회로는 전지의 양 끝과 전구, 전선이',
    after: '연결되어 있어요.',
    choices: { correct: '끊기지 않게', wrong: '끊기게' },
    feedbackCorrect: '맞아요! 끊기지 않고 이어져야 전기가 흘러요.',
    feedbackWrong: '다시 생각해 볼까요? 회로가 끊기면 불이 켜지지 않아요.',
  },
  fanReason: {
    question: '제품마다 전지의 개수가 다른 까닭은 무엇일까요?',
    choices: {
      needAmount: '(가) 제품마다 필요한 전기의 양이 달라서',
      moreIsBetter: '(나) 전지가 많을수록 무조건 좋아서',
      unsure: '(다) 잘 모르겠어요',
    },
  },
  fanPredict: {
    question: '전지 1개를 넣은 손 선풍기와 전지 2개를 넣은 손 선풍기 중 바람이 더 센 것은?',
    choices: { one: '(가) 전지 1개', two: '(나) 전지 2개', same: '(다) 차이가 없어요' },
  },
  depart: '마을로 출발',
};

export const S3 = {
  guide: '되살릴 곳을 골라 보세요.',
  locked: '앞의 미션을 먼저 해결해야 열려요!',
  firstBubble: '가로등부터 시작해 볼까요?',
  toWrapup: '마무리로 가기',
  places: { m1: '가로등', m2: '광장의 안내 종', m3: '언덕의 풍차' } as Record<MissionId, string>,
};

/** 반짝마을 돌아다니기 (S3)와 도입 애니메이션 (S2) */
export const WORLD = {
  villageSign: '반짝마을',
  festival: '불빛 축제',
  howToMove: '방향키(또는 W A S D)나 조이스틱으로 움직여요. 가고 싶은 곳을 눌러도 돼요.',
  follow: '화살표를 따라가요',
  you: '우리 탐험대',
  ok: '알겠어요!',
  startMission: '미션 시작!',
  lookAround: '조금 더 둘러보기',
  review: '결과 다시 보기',
  alreadyDone: (place: string) => `${place}은(는) 이미 되살렸어요.`,
  /** 장소에 도착하면 발견하는 상황 */
  discover: {
    m1: '가로등 거리에 도착했어요. 가로등 불빛이 희미하게 깜빡여요. 밤길이 어두워서 축제에 오는 사람들이 길을 잃을 것 같아요.',
    m2: '광장에 도착했어요. 안내 종을 쳐 보아도 소리가 너무 작아요. 이래서는 축제가 시작된다는 것을 아무도 모를 거예요.',
    m3: '언덕에 도착했어요. 풍차가 아주 느릿느릿 돌고 있어요. 풍차가 힘차게 돌아야 축제 무대에 불을 켤 힘이 모여요.',
  } as Record<MissionId, string>,
  /** 마을 이야기 장면 (반디의 말) */
  stories: {
    arrive: (group: string) =>
      `${group}, 반짝마을에 온 것을 환영해요! 가로등부터 시작해 볼까요? 반짝이는 화살표를 따라가 보세요.`,
    'after-m1': '가로등 거리가 환해졌어요! 그런데 광장의 안내 종은 아직 소리가 작아요. 광장으로 가 볼까요?',
    'after-m2': '종소리가 마을 끝까지 울려 퍼져요! 이제 언덕 위 풍차만 남았어요. 언덕으로 올라가 볼까요?',
    'after-m3': '풍차가 씽씽 돌고 마을 전체에 불이 켜졌어요! 불빛 축제를 열 수 있게 됐어요. 이제 오늘 알게 된 것을 정리하러 가요.',
  },
};

/** 7-3 막혔을 때 힌트. 판정 결과(reason)와 1:1로 대응한다 */
export const HINTS: Record<Exclude<JudgeReason, 'OK'>, string> = {
  NO_WIRES: '부품의 끝(동그란 금속 단자)을 집게 달린 전선으로 이어 보세요.',
  SWITCH_OPEN: '스위치가 열려 있어요. 눌러서 닫아 보세요.',
  BROKEN: '전지의 양 끝(+, −)과 부품이 끊기지 않게 이어져야 해요. 끊어진 곳이 없는지 살펴보세요.',
  SAME_POLE: '전지 2개는 서로 다른 극끼리 이어야 해요. 한 전지의 + 와 다른 전지의 − 를 이어 보세요.',
  BUZZER_REVERSED:
    '버저가 울리지 않으면 버저 양 끝에 연결한 전선을 서로 바꾸어 이어 보세요. 빨간 선은 전지의 + 쪽에 이어요.',
  // 아래 두 개는 명세서에 없는 상황이라 추가한 문구 (팀 확인 필요)
  SWITCH_MISSING: '스위치도 고리 안에 함께 이어 보세요.',
  SHORT_CIRCUIT: '부품을 거치지 않고 전지의 양 끝이 바로 이어졌어요. 금속 부분끼리 닿게, 부품을 지나도록 이어 보세요.',
};

export interface MissionStrings {
  title: string;
  safetyExtra: string;
  intro: string;
  predictQuestion: string;
  predictChoices: Record<'a' | 'b' | 'c', string>;
  predictConfirm: string;
  checklistTitle: string;
  checklist: readonly [string, string, string];
  checklistHelp: string;
  goCompare: string;
  observation: { A: string; B: string; extra?: string };
  compareGuide: string;
  compareBefore: string;
  compareAfter: string;
  compareChoices: { less: string; more: string };
  reasonPrompt: string;
  reasonPlaceholder: string;
  reasonHelp?: string;
  retry: string;
  confirmButton: string;
  actualResult: string;
  predictionRight: string;
  predictionDifferent: string;
  summary: string;
  revival: string;
}

const COMPARE_BEFORE =
  '전지 1개를 연결한 전기 회로보다 전지 2개를 서로 다른 극끼리 한 줄로 연결한 전기 회로에서';

const SHARED = {
  predictConfirm: '이걸로 정했어요',
  checklistTitle: '탐험 과제',
  goCompare: '비교하러 가기',
  compareGuide: '두 회로를 비교해서 알맞은 말을 골라 보세요.',
  retry: '다시 해 보기',
  confirmButton: '확인하기',
  predictionRight: '맞혔어요!',
  predictionDifferent: '예상과 달랐네요. 괜찮아요, 관찰한 결과가 중요해요.',
};

export const MISSION_STRINGS: Record<MissionId, MissionStrings> = {
  m1: {
    ...SHARED,
    title: '가로등 밝히기',
    safetyExtra: '전구의 유리 부분은 깨지기 쉬우니 조심해요.',
    intro: '가로등이 너무 어두워서 밤길이 무서워요. 전지의 개수를 달리해서 가로등을 밝혀 볼 수 있을까요?',
    predictQuestion:
      '전지 1개를 연결한 회로와, 전지 2개를 서로 다른 극끼리 한 줄로 연결한 회로에서 전구의 밝기는 서로 어떻게 다를까요?',
    predictChoices: {
      a: '(가) 전지 2개를 연결한 회로의 전구가 더 밝을 것 같아요',
      b: '(나) 두 회로의 전구 밝기는 같을 것 같아요',
      c: '(다) 전지 1개를 연결한 회로의 전구가 더 밝을 것 같아요',
    },
    checklist: [
      'A 회로: 전지 1개와 전구, 스위치를 집게 달린 전선으로 연결해 보세요.',
      'B 회로: 전지 2개를 서로 다른 극끼리 한 줄로 이은 뒤 전구, 스위치를 연결해 보세요.',
      '두 회로의 스위치를 모두 닫고 전구의 밝기를 비교해 보세요.',
    ],
    checklistHelp: '(도움말) 주변이 어두우면 밝기를 더 잘 볼 수 있어요.',
    observation: {
      A: 'A 회로(전지 1개): 전구가 희미하게 켜졌어요.',
      B: 'B 회로(전지 2개): 전구가 훨씬 환하게 켜졌어요!',
    },
    compareBefore: `${COMPARE_BEFORE} 전구의 밝기가 더 (`,
    compareAfter: ').',
    compareChoices: { less: '어둡다', more: '밝다' },
    reasonPrompt: '왜 그랬을까요? 모둠이 함께 이유를 써 보세요.',
    reasonPlaceholder: '예) 전지가 2개일 때 전구가 더 ( ) 해요. 왜냐하면…',
    reasonHelp: '두 회로에서 다른 점이 무엇이었는지 떠올려 보세요.',
    actualResult: '전지 2개 회로의 전구가 더 밝아요',
    summary: '이번에는 전구로 확인했어요. 버저와 풍차에서도 같을까요?',
    revival: '와! 마을 거리가 환해졌어요. 고마워요, 탐험대!',
  },
  m2: {
    ...SHARED,
    title: '광장의 안내 종 울리기',
    safetyExtra: '전선의 집게에 손이 끼지 않게 조심해요.',
    intro: '광장의 안내 종 소리가 너무 작아서 아무도 못 들어요. 방금 가로등에서 알아낸 것을 써 볼 수 있을까요?',
    predictQuestion:
      '전지 1개를 연결한 회로와 전지 2개를 서로 다른 극끼리 한 줄로 연결한 회로에 버저를 각각 연결하면, 소리의 세기는 어떻게 다를까요?',
    predictChoices: {
      a: '(가) 전지 2개 회로의 소리가 더 클 것 같아요',
      b: '(나) 소리의 세기는 같을 것 같아요',
      c: '(다) 전지 2개 회로의 소리가 더 작을 것 같아요',
    },
    checklist: [
      'A 회로: 전지 1개와 버저, 스위치를 연결해 보세요.',
      'B 회로: 전지 2개를 서로 다른 극끼리 한 줄로 이은 뒤 버저, 스위치를 연결해 보세요.',
      '두 회로의 스위치를 닫고 소리의 세기를 비교해 보세요.',
    ],
    checklistHelp: '(도움말) 버저의 빨간 선은 전지의 + 쪽에, 검은 선은 − 쪽에 이어요.',
    observation: {
      A: 'A 회로(전지 1개): 안내 종이 작게 울려요.',
      B: 'B 회로(전지 2개): 안내 종이 더 크게 울려요!',
      extra: '종이 울리지 않아요. 힌트를 확인해 보세요.',
    },
    compareBefore: `${COMPARE_BEFORE} 버저의 소리가 더 (`,
    compareAfter: ').',
    compareChoices: { less: '작다', more: '크다' },
    reasonPrompt: '왜 그랬을까요? 가로등 미션과 비슷한 점이 있었나요? 모둠이 함께 이유를 써 보세요.',
    reasonPlaceholder: '예) 가로등 미션과 ( ) 점이 같았어요.',
    actualResult: '전지 2개 회로의 소리가 더 커요',
    summary: '버저에서도 가로등과 같은 결과가 나왔어요. 풍차에서도 확인해 볼까요?',
    revival: '종소리가 마을 끝까지 들려요! 이제 사람들이 모일 수 있겠어요.',
  },
  m3: {
    ...SHARED,
    title: '언덕의 풍차 돌리기',
    safetyExtra: '날개 달린 전동기에 손을 다치지 않게 조심해요.',
    intro: '마지막으로 언덕 위 풍차가 거의 멈췄어요. 풍차가 힘차게 돌게 도와줄 수 있나요?',
    predictQuestion:
      '전지 1개를 연결한 회로와 전지 2개를 서로 다른 극끼리 한 줄로 연결한 회로에 날개 달린 전동기를 각각 연결하면, 날개가 도는 빠르기는 어떻게 다를까요?',
    predictChoices: {
      a: '(가) 전지 2개 회로의 날개가 더 빠르게 돌 것 같아요',
      b: '(나) 도는 빠르기는 같을 것 같아요',
      c: '(다) 전지 2개 회로의 날개가 더 느리게 돌 것 같아요',
    },
    checklist: [
      'A 회로: 전지 1개와 날개 달린 전동기, 스위치를 연결해 보세요.',
      'B 회로: 전지 2개를 서로 다른 극끼리 한 줄로 이은 뒤 전동기, 스위치를 연결해 보세요.',
      '두 회로의 스위치를 닫고 날개가 도는 빠르기를 비교해 보세요.',
    ],
    checklistHelp: '(안전) 날개 달린 전동기에 손을 다치지 않게 조심해요.',
    observation: {
      A: 'A 회로(전지 1개): 풍차가 느리게 돌아요.',
      B: 'B 회로(전지 2개): 풍차가 빠르게 돌아요!',
      extra: '날개가 도는 방향이 바뀌었어요. 빠르기는 어떤가요?',
    },
    compareBefore: `${COMPARE_BEFORE} 날개 달린 전동기가 더 (`,
    compareAfter: ') 돌아요.',
    compareChoices: { less: '느리게', more: '빠르게' },
    reasonPrompt: '왜 그랬을까요? 앞의 두 미션에서 본 것과 비교해서 모둠이 함께 이유를 써 보세요.',
    reasonPlaceholder: '예) 세 미션에서 공통으로 알게 된 것은…',
    actualResult: '전지 2개 회로의 풍차가 더 빠르게 돌아요',
    summary: '전구, 버저, 풍차 모두 확인했어요! 마지막으로 마을에서 알게 된 것을 정리해 볼까요?',
    revival: '풍차가 씽씽 돌아가요! 마을이 완전히 되살아났어요.',
  },
};

export const S5 = {
  stepTitles: [
    '1. 결과 모아 보기',
    '2. 함께 생각을 나누기',
    '3. 설명하기',
    '4. 확인해요',
    '5. 오개념 점검',
    '6. 스스로 평가',
    '7. 마치기',
  ],
  results: {
    headers: ['', '내 예상', '실제 결과'],
    rows: { m1: '전구 밝기', m2: '버저 소리', m3: '전동기 빠르기' } as Record<MissionId, string>,
  },
  share: {
    guide: '함께 생각을 나누어 봐요. 전지의 개수에 따른 전기 회로의 특징은 무엇인가요?',
    frame:
      '전지 1개를 연결한 회로보다 전지 2개를 서로 다른 극끼리 한 줄로 연결한 회로에서 전구는 ( ), 버저는 ( ), 날개 달린 전동기는 ( ).',
  },
  explain: {
    opener: '그동안 알아낸 것을 정리해 볼까요?',
    questions: {
      bulb: {
        q: '① 전지 1개 회로와 전지 2개 회로에 전구를 각각 연결했을 때 밝기는 어떻게 달랐나요?',
        choices: { more: '더 밝았어요', less: '더 어두웠어요', same: '같았어요' },
      },
      buzzer: {
        q: '② 버저를 각각 연결했을 때 소리는 어땠나요?',
        choices: { more: '더 컸어요', less: '더 작았어요', same: '같았어요' },
      },
      motor: {
        q: '③ 날개 달린 전동기를 각각 연결했을 때 도는 빠르기는 어땠나요?',
        choices: { more: '더 빨랐어요', less: '더 느렸어요', same: '같았어요' },
      },
    } as Record<PartKind, { q: string; choices: Record<'more' | 'less' | 'same', string> }>,
    summaries: [
      '전지 여러 개를 서로 다른 극끼리 한 줄로 연결하는 방법을 전지의 직렬연결이라고 해요.',
      '전지 2개를 직렬연결하면 전지 1개를 연결했을 때보다 전구는 더 밝고, 버저의 소리는 더 크고, 날개 달린 전동기는 더 빠르게 돌아요.',
      '전지 2개를 직렬연결하면 전지 1개를 연결할 때보다 전기 에너지가 더 많이 공급돼요.',
      '직렬연결한 전지의 개수를 늘릴수록 전구를 더 밝게 할 수 있고, 버저로 더 큰 소리를 내거나 전동기를 더 빠르게 돌릴 수 있어요.',
    ],
    revisit: (choice: string) =>
      `처음에 손 선풍기는 "${choice}"라고 예상했어요. 지금 생각은 어떤가요?`,
  },
  check: {
    before: '전지 1개를 연결한 전기 회로보다 전지 2개를 직렬연결한 전기 회로에서 전구의 밝기가 더 (',
    after: ').',
    choices: { brighter: '밝습니다', darker: '어둡습니다' },
    wrong: '다시 한번 생각해 봐요. 미션 1의 결과를 떠올려 보세요.',
  },
  misconception: {
    guide: '○ 또는 ×를 골라 보세요.',
    answerIs: (mark: string) => `정답은 ${mark}예요.`,
    items: [
      {
        key: 'q1',
        text: '① 전선이 연결되어 있기만 하면 전구에 불이 켜져요.',
        answer: 'X',
        explanation: '스위치가 열리거나 전선이 끊기면 전기가 흐르지 않아 불이 켜지지 않아요.',
      },
      {
        key: 'q2',
        text: '② 전지의 개수가 늘어나면 전구는 무조건 더 밝아져요.',
        answer: 'X',
        explanation:
          '오늘은 전지를 서로 다른 극끼리 한 줄로 연결한 직렬연결에서 밝아지는 것을 살펴봤어요. 연결하는 방법이 맞지 않으면 달라질 수 있어요.',
      },
      {
        key: 'q3',
        text: '③ 전지 2개를 직렬연결한 회로의 버저는 전지 1개일 때보다 소리가 더 커요.',
        answer: 'O',
        explanation: '맞아요. 전지 2개를 직렬연결하면 버저 소리가 더 커져요.',
      },
    ] as const,
  },
  selfEval: {
    question: '전지 개수에 따른 전구의 밝기를 비교하고, 전지 개수에 따른 전기 회로의 특징을 설명할 수 있나요?',
    choices: { good: '잘할 수 있어요', needHelp: '조금 도움이 필요해요', needPractice: '더 연습이 필요해요' },
  },
  finish: {
    title: '마을이 환하게 되살아났어요!',
    text: '탐험대 덕분에 가로등도, 안내 종도, 풍차도 힘차게 움직여요. 이제 반짝마을의 불빛 축제가 시작돼요!',
    toCharacter: `${CHARACTER}에게 알려 주고 싶은 것을 한 줄로 써 보세요.`,
    button: '탐험 마치기',
    done: '수고했어요, 탐험대! (끝)',
  },
};

// ───────────── 교사용 화면 (학생에게는 보이지 않는다) ─────────────

/**
 * 명세서 11-2 지도서 평가 요소. 교사가 판단할 때 참고로만 보여 준다 (자동 판정하지 않는다).
 * criteria(상·중·하)는 명세서 11-2의 "보는 내용"으로 만든 임시 문장이다.
 * TODO: 지도서 4차시 평가 문장 그대로 바꿔 넣기 (팀 확인 필요)
 */
export const TEACHER = {
  title: '교사용 화면',
  pinPlaceholder: '교사 비밀번호',
  enter: '들어가기',
  refreshNote: '10초마다 새로 불러와요. 점수나 상·중·하는 자동으로 매기지 않아요. 판단은 선생님이 해요.',
  mostMissedTitle: '많이 틀린 오개념 문항',
  noMissed: '아직 틀린 문항이 없어요.',
  noGroups: '오늘(최근 12시간) 기록된 모둠이 없어요.',
  columns: { group: '모둠', where: '지금 위치', revived: '되살린 곳', hints: '힌트/시도', selfEval: '스스로 평가', wrote: '쓴 글' },
  details: '자세히 보기',
  rubricTitle: '지도서 평가 요소 (참고)',
  rubric: [
    {
      element: '전지 1개 회로와 전지 2개 직렬 회로에서 전구의 밝기 비교하기 (과정·기능)',
      look: '두 회로를 직접 구성하고 밝기를 비교했는가',
      evidence: '미션 1의 회로 만들기 결과(A, B 정상 연결), 시도 횟수, 도움 횟수, ○표 비교 결과',
      criteria: {
        상: '두 회로를 스스로 구성하고 밝기 차이를 정확히 비교한다.',
        중: '도움을 받아 두 회로를 구성하고 밝기를 비교한다.',
        하: '두 회로를 구성하거나 밝기를 비교하는 데 어려움이 있다.',
      },
    },
    {
      element: '전지의 개수에 따른 전구의 밝기 차이 말하기 (지식·이해)',
      look: '전지 개수에 따른 특징을 설명했는가 (전기 에너지의 공급과 관련지어 설명하면 높은 수준)',
      evidence: '미션의 모둠 설명, 함께 생각 나누기 문장, 설명하기 답, 확인해요 답, 오개념 점검 결과',
      criteria: {
        상: '전지 2개를 직렬연결하면 전기 에너지가 더 많이 공급되어 전구가 더 밝다고 설명한다.',
        중: '전지 2개를 직렬연결한 회로의 전구가 더 밝다고 말한다.',
        하: '전지 개수에 따른 밝기 차이를 말하는 데 어려움이 있다.',
      },
    },
    {
      element: '전지의 개수에 따른 회로의 특징을 비교하는 활동에 적극적으로 참여하기 (가치·태도)',
      look: '활동에 흥미를 느끼고 참여했는가',
      evidence: '완료한 미션 수, 입력한 글의 유무, 스스로 평가',
      criteria: {
        상: '모든 활동에 적극적으로 참여하고 모둠의 생각을 글로 나타낸다.',
        중: '대부분의 활동에 참여한다.',
        하: '활동 참여에 도움이 필요하다.',
      },
    },
  ],
  labels: {
    intro: '도입',
    recall: '회로 조건 떠올리기',
    fanReason: '전지 개수가 다른 까닭',
    fanPredict: '손 선풍기 예상',
    prediction: '예상',
    built: '정상 연결',
    compare: '○표 비교',
    explanation: '모둠 이유',
    challenge: '도전(같은 극끼리)',
    groupThought: '함께 생각 나누기',
    explain: '설명하기 답',
    revisitFan: '처음 예상 다시 보기',
    check: '확인해요',
    misconception: '오개념 점검',
    toCharacter: '이야기 인물에게',
    finished: '탐험 마침',
  },
  values: {
    correct: '맞음',
    wrong: '틀림',
    empty: '-',
    yes: '예',
    no: '아니요',
    challenge: { none: '안 함', active: '하는 중', done: '해 봄' },
    explain: { more: '더 ~했어요', less: '덜 ~했어요', same: '같았어요' },
    check: { brighter: '밝습니다', darker: '어둡습니다' },
  },
};
