// 학생 화면에 나오는 모든 문구 (명세서 12장: 문구는 한 파일에 모아 코드와 분리).
// 문구를 고칠 때는 이 파일만 고치면 된다.
// 주의: 미션 화면(S4) 문구에는 "직렬"이라는 말과 원리 정리를 쓰지 않는다. 용어는 S5 확인하기에서 처음 나온다.
import type { ExplorerLook, JudgeReason, MissionId, PartKind } from '@/lib/types';

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
  revived: (n: number) => `미션 ${n}/3 완료`,
  stepLabels: ['예상', '만들기', '비교·이유', '확인'] as const,
  safetyFooter:
    '전기 부품을 만질 때는 절연 장갑을 끼고, 젖은 손으로 만지지 않아요. 진짜 콘센트 전기로는 절대 실험하지 않아요!',
  muteOn: '소리 켜기',
  muteOff: '소리 끄기',
  backToMap: '지도로 돌아가기',
  mapShort: '지도',
  missionTitle: (n: number, title: string) => `미션 ${n}. ${title}`,
  prev: '이전',
  darkViewOn: '어둡게 보기',
  darkViewOff: '밝게 보기',
  boardA: 'A 회로 (전지 1개)',
  boardB: 'B 회로 (전지 2개)',
  myPrediction: '내 예상',
  actualResult: '실제 결과',
  help: '도움말',
  furtherLearning: '더 알아보기 (심화)',
  seeResult: '결과 보기',
  compareRight: '맞혔어요!',
  compareWrong: (word: string) => `정답은 '${word}'예요`,
  modelReason: '모범 답안',
  minChars: (now: number, min: number) => `${Math.min(now, min)}/${min}글자 이상`,
  loading: '불빛 탐험대를 준비하고 있어요…',
  optional: '(선택)',
};

/** 3단계: 여러 기기로 함께하기 */
export const ROOM = {
  modeSolo: '혼자 하기',
  modeGroup: '모둠으로 하기',
  pickGroup: '우리 모둠을 골라요',
  loadingGroups: '모둠 목록을 불러오는 중…',
  noGroups: '선생님이 아직 모둠을 만들지 않았어요. 잠시 뒤 다시 불러와 보세요.',
  groupsFailed: '모둠 목록을 불러오지 못했어요. 다시 불러와 보세요.',
  reloadGroups: '다시 불러오기',
  myName: '내 이름을 써 주세요.',
  myNamePlaceholder: '예) 민수',
  enterGroup: '모둠에 들어가기',
  waiting: '모둠 화면을 불러오고 있어요…',
  notFound: '아직 모둠 화면을 받지 못했어요. 인터넷 연결을 확인하거나 그만두고 다시 들어와 보세요.',
  cancel: '그만두기',
  connecting: '연결하는 중…',
  offline: '연결이 끊겼어요. 다시 연결하는 중…',
  me: '(나)',
  membersLabel: '지금 함께하는 모둠원',
  did: (name: string, what: string) => `${name}: ${what}`,
  boardActions: { ADD_WIRE: '전선을 이었어요', REMOVE_WIRE: '전선을 지웠어요', TOGGLE_SWITCH: '스위치를 눌렀어요' },
  writing: (name: string) => `${name} 쓰는 중…`,
  agreeNeed: (same: number, all: number) => `모둠원 모두 같은 답을 골라야 정할 수 있어요 (${same}/${all}명)`,
  gatherNeed: (here: number, all: number) => `모둠원이 모두 모이면 시작할 수 있어요 (${here}/${all}명)`,
  callAll: '모두 부르기',
  called: '친구들을 불렀어요',
  calling: (name: string, place: string) => `${name} 친구가 ${place}에서 기다려요`,
  goTogether: '함께 가기',
  waitTutorial: '친구들이 회로 연결 방법을 익히고 있어요',
  waitTutorialCount: (done: number, all: number) => `${done}/${all}명 끝냈어요. 모두 끝나면 함께 회로를 만들어요.`,
  practiceBoard: '연습용 회로판 (나만 보여요)',
  notHere: '오는 중',
};

export const RESTART = {
  button: '처음부터 다시 하기 (다음 모둠)',
  short: '나가기',
  title: '처음 화면으로 돌아갈까요?',
  body: '이 기기에 있는 기록은 지워져요.\n선생님 화면에 저장된 기록은 그대로 남아요.',
  ok: '돌아가기',
  cancel: '계속하기',
};

/** 회로 만들기 튜토리얼 (처음 ② 만들기에 들어왔을 때) */
export const TUTORIAL = {
  title: '회로 만드는 방법',
  replay: '연결 방법 다시 보기',
  skip: '건너뛰기',
  next: '다음',
  start: '시작!',
  steps: {
    connect: {
      title: '전선 잇기',
      text: '반짝이는 전지의 + 단자를 누른 채 전구 쪽 단자까지 끌어 보세요. 단자 두 개를 차례로 눌러도 돼요.',
    },
    remove: {
      title: '전선 지우기',
      text: '전선이 이어졌어요! 잘못 이었을 때는 전선을 누르면 지워져요. 방금 이은 전선을 눌러 보세요.',
    },
    switch: {
      title: '스위치 누르기',
      text: '스위치는 처음에 열려 있어요. 스위치를 눌러 닫아 보세요. 한 번 더 누르면 다시 열려요.',
    },
    go: {
      title: '이제 스스로!',
      text: '탐험 과제를 보며 전지의 양 끝(+, −)과 부품, 스위치가 끊기지 않게 이어 보세요.',
    },
  } as Record<'connect' | 'remove' | 'switch' | 'go', { title: string; text: string }>,
};

/** 8-1 선택 보충 (지도서에 없는 활동. 미션 1 ④ 확인하기에서만) */
export const CHALLENGE = {
  button: '도전! 더 해 보기 (선택)',
  prompt: '도전! B 회로의 전지 두 개를 같은 극끼리 이어 보세요. 어떻게 되나요?',
  /** 하나씩 따라 하는 단계 (B 회로판 모습을 보고 저절로 다음 단계로 넘어간다) */
  steps: [
    '두 전지 사이를 잇는 전선을 눌러서 지워요.',
    '두 전지의 + 끝끼리 전선으로 이어요.',
    '전구와 스위치로 가는 전선이 두 전지의 − 끝에 하나씩 이어지게 고치고, 전구가 어떻게 되는지 봐요. (+ 끝에 붙은 전선은 지우고 − 끝에 다시 이어요)',
  ] as const,
  done: '전지를 늘리기만 해서는 안 되고, 서로 다른 극끼리 한 줄로 이어야 해요.',
  firstHint: '힌트 보기',
  nextHint: '다음 힌트 보기',
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
  // 혼자 하기: 내 이름 (반디가 이 이름으로 불러 준다. 모둠으로 할 때는 선생님이 만든 모둠 이름을 쓴다)
  nameGuide: '내 이름을 써 주세요.',
  namePlaceholder: '예) 민수',
  lookGuide: '내 캐릭터를 골라요',
  lookTitle: '함께 탐험할 내 캐릭터를 골라요',
  lookIntro: {
    puppy: '냄새로 길을 잘 찾아요',
    bunny: '귀가 밝아서 작은 소리도 잘 들어요',
    cat: '어두운 곳도 잘 봐요',
    bear: '힘이 세고 듬직해요',
    chick: '부지런하고 씩씩해요',
    dino: '큰 발로 쿵쿵 씩씩하게 걸어요',
  } as Record<ExplorerLook, string>,
  lookGo: '이 캐릭터로 출발!',
  lookBack: '뒤로',
  next: '다음',
  looks: { puppy: '강아지', bunny: '토끼', cat: '고양이', bear: '곰', chick: '병아리', dino: '공룡' } as Record<ExplorerLook, string>,
  safetyTitle: '안전 약속 (모두 체크해야 시작할 수 있어요)',
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
      text: '여기는 전지의 힘으로 불을 밝히는 반짝마을이에요. 오늘 밤은 일 년에 한 번 열리는 불빛 축제 날이에요.\n그런데 해가 지자 마을이 이상하게 어두워요.',
    },
    {
      speaker: CHARACTER,
      text: (group: string) =>
        `${group}, 와 줘서 고마워요! 저는 마을의 불빛을 지키는 빛 요정 반디예요. 큰일이에요. 가로등은 꺼져 있고, 광장의 안내 종은 울리지 않고, 언덕의 풍차는 멈춰 있어요. 이대로는 축제를 열 수 없어요.`,
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
    before: '전구에 불이 켜지려면 전지의 양 끝과 전구, 전선이',
    after: '연결되어 있어야 해요.',
    choices: { correct: '끊기지 않게', wrong: '끊기게' },
    feedbackCorrect: '맞아요! 끊기지 않고 이어져야 전기가 흘러요.',
    feedbackWrong: '다시 생각해 볼까요? 회로가 끊기면 불이 켜지지 않아요.',
  },
  fanReason: {
    question: '전기 제품마다 넣는 전지의 개수가 다른 까닭은 무엇일까요?',
    choices: {
      needAmount: '(가) 제품마다 필요한 전기의 양이 달라서',
      moreIsBetter: '(나) 전지가 많을수록 무조건 좋아서',
      unsure: '(다) 잘 모르겠어요',
    },
  },
  fanPredict: {
    question: '손 선풍기에 전지를 1개 넣을 때와 2개 넣을 때, 어느 쪽 바람이 더 셀까요?',
    choices: { one: '(가) 전지 1개를 넣을 때', two: '(나) 전지 2개를 넣을 때', same: '(다) 바람의 세기가 같아요' },
  },
  depart: '마을로 출발',
};

export const S3 = {
  locked: '앞의 미션을 먼저 해결해야 열려요!',
  firstBubble: '가로등부터 시작해 볼까요?',
  toWrapup: '마무리로 가기',
  places: { m1: '가로등', m2: '광장의 안내 종', m3: '언덕의 풍차' } as Record<MissionId, string>,
};

/** 반짝마을 돌아다니기 (S3)와 도입 애니메이션 (S2) */
export const WORLD = {
  villageSign: '반짝마을',
  festival: '불빛 축제',
  howToMove: '방향키나 조이스틱으로 움직이거나, 가고 싶은 곳을 눌러요.',
  help: '움직이는 방법',
  follow: '화살표를 따라가요',
  ok: '알겠어요!',
  /** 처음 마을에 왔을 때 움직이는 방법 튜토리얼 */
  tutorial: {
    steps: [
      { title: '방향키로 걸어요', text: '키보드의 방향키나 W·A·S·D를 누르면 탐험대가 걸어가요.' },
      { title: '조이스틱으로 걸어요', text: '오른쪽 아래 동그라미를 손가락으로 끌어도 움직여요.' },
      { title: '눌러서 가요', text: '가고 싶은 곳을 누르면 그곳까지 알아서 걸어가요.' },
      { title: '화살표를 따라가요', text: '탐험대 옆 화살표가 다음 미션 장소를 가리켜요. 따라가 보세요!' },
    ],
    next: '다음',
    start: '출발!',
    skip: '건너뛰기',
    replay: '튜토리얼 다시 보기',
  },
  startMission: '미션 시작!',
  close: '닫기',
  viewNear: '탐험',
  viewMap: '지도',
  problem: '문제 상황',
  todo: '우리가 할 일',
  review: '결과 확인하기',
  retry: '다시 하기',
  alreadyDone: '이미 성공한 미션이에요.',
  /** 마을 이야기 장면 (반디의 말) */
  stories: {
    arrive: (group: string) =>
      `${group}, 반짝마을에 온 것을 환영해요! 가로등부터 시작해 볼까요? 반짝이는 화살표를 따라가 보세요.`,
    'after-m1': '가로등 거리가 환해졌어요! 그런데 광장의 안내 종은 아직 울리지 않아요. 광장으로 가 볼까요?',
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
  /** 탐험 과제 아래 "도움말"을 누르면 펼쳐지는 한 줄 */
  checklistHelp: string | readonly string[];
  /** ④ 확인에서 펼쳐 보는 심화 내용 (선택) */
  furtherLearning?: string;
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
  /** ④ 확인에서 보여 주는 이유 모범 답안 (POE: 확인 전에는 절대 보여 주지 않는다) */
  modelReason: string;
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
  predictionDifferent: '예상과 달랐네요.\n괜찮아요, 관찰한 결과가 중요해요.',
};

export const MISSION_STRINGS: Record<MissionId, MissionStrings> = {
  m1: {
    ...SHARED,
    title: '가로등 밝히기',
    safetyExtra: '전구의 유리 부분은 깨지기 쉬우니 조심해요.',
    intro: '가로등이 너무 어두워서 밤길이 무서워요. 전지의 개수를 달리해서 가로등을 밝혀 볼 수 있을까요?',
    predictQuestion:
      '전지 2개를 서로 다른 극끼리 한 줄로 연결하면, 전지 1개일 때보다 전구의 밝기는 어떻게 될까요?',
    predictChoices: {
      a: '(가) 전지 2개일 때 더 밝을 것 같아요',
      b: '(나) 밝기가 같을 것 같아요',
      c: '(다) 전지 2개일 때 더 어두울 것 같아요',
    },
    checklist: [
      'A 회로: 전지 1개와 전구, 스위치를 집게 달린 전선으로 연결해 보세요.',
      'B 회로: 전지 2개를 서로 다른 극끼리 한 줄로 이은 뒤 전구, 스위치를 연결해 보세요.',
      '두 회로의 스위치를 모두 닫고 전구의 밝기를 비교해 보세요.',
    ],
    checklistHelp: '주변이 어두우면 밝기를 더 잘 볼 수 있어요.',
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
    summary: '이번에는 전구로 확인했어요.\n버저와 풍차에서도 같을까요?',
    revival: '와! 마을 거리가 환해졌어요. 고마워요, 탐험대!',
    modelReason: '전지 2개를 서로 다른 극끼리 한 줄로 연결하면 전지 1개일 때보다 전구에 전기 에너지가 더 많이 공급되기 때문에 전구가 더 밝아져요.',
  },
  m2: {
    ...SHARED,
    title: '광장의 안내 종 울리기',
    safetyExtra: '전선의 집게에 손이 끼지 않게 조심해요.',
    intro: '광장의 안내 종 소리가 너무 작아서 아무도 못 들어요. 방금 가로등에서 알아낸 것을 써 볼 수 있을까요?',
    predictQuestion:
      '전지 2개를 서로 다른 극끼리 한 줄로 연결하면, 전지 1개일 때보다 버저 소리는 어떻게 될까요?',
    predictChoices: {
      a: '(가) 전지 2개일 때 소리가 더 클 것 같아요',
      b: '(나) 소리 크기가 같을 것 같아요',
      c: '(다) 전지 2개일 때 소리가 더 작을 것 같아요',
    },
    checklist: [
      'A 회로: 전지 1개와 버저, 스위치를 연결해 보세요.',
      'B 회로: 전지 2개를 서로 다른 극끼리 한 줄로 이은 뒤 버저, 스위치를 연결해 보세요.',
      '두 회로의 스위치를 닫고 소리의 세기를 비교해 보세요.',
    ],
    checklistHelp: '버저의 빨간 선은 전지의 + 쪽에, 검은 선은 − 쪽에 이어요.',
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
    summary: '버저에서도 가로등과 같은 결과가 나왔어요.\n풍차에서도 확인해 볼까요?',
    revival: '종소리가 마을 끝까지 들려요! 이제 사람들이 모일 수 있겠어요.',
    modelReason: '전지 2개를 서로 다른 극끼리 한 줄로 연결하면 전지 1개일 때보다 버저에 전기 에너지가 더 많이 공급되기 때문에 소리가 더 커져요.',
  },
  m3: {
    ...SHARED,
    title: '언덕의 풍차 돌리기',
    safetyExtra: '날개 달린 전동기에 손을 다치지 않게 조심해요.',
    intro: '마지막으로 언덕 위 풍차가 거의 멈췄어요. 풍차가 힘차게 돌게 도와줄 수 있나요?',
    predictQuestion:
      '전지 2개를 서로 다른 극끼리 한 줄로 연결하면, 전지 1개일 때보다 날개 달린 전동기는 어떻게 돌까요?',
    predictChoices: {
      a: '(가) 전지 2개일 때 더 빠르게 돌 것 같아요',
      b: '(나) 빠르기가 같을 것 같아요',
      c: '(다) 전지 2개일 때 더 느리게 돌 것 같아요',
    },
    checklist: [
      'A 회로: 전지 1개와 날개 달린 전동기, 스위치를 연결해 보세요.',
      'B 회로: 전지 2개를 서로 다른 극끼리 한 줄로 이은 뒤 전동기, 스위치를 연결해 보세요.',
      '두 회로의 스위치를 닫고 날개가 도는 빠르기를 비교해 보세요.',
    ],
    checklistHelp: [
      '날개 달린 전동기에 손을 다치지 않게 조심해요.',
      '전동기에 이은 전지의 +와 −를 반대로 바꾸면 날개가 도는 방향이 바뀌어요. 빠르기를 비교할 때는 방향은 신경 쓰지 않아도 돼요.',
    ],
    furtherLearning:
      '전동기는 전기가 들어오는 방향에 따라 도는 방향이 정해져요. 전지의 + 쪽 전선과 − 쪽 전선을 서로 바꿔 이으면 전기가 반대로 흘러서 날개도 반대로 돌아요. 하지만 전지의 개수가 같으면 도는 빠르기는 같아요. 선풍기나 장난감 자동차가 앞뒤로 움직이는 것도 이 원리를 이용한 거예요.',
    observation: {
      A: 'A 회로(전지 1개): 풍차가 느리게 돌아요.',
      B: 'B 회로(전지 2개): 풍차가 빠르게 돌아요!',
    },
    compareBefore: `${COMPARE_BEFORE} 날개 달린 전동기가 더 (`,
    compareAfter: ') 돌아요.',
    compareChoices: { less: '느리게', more: '빠르게' },
    reasonPrompt: '왜 그랬을까요? 앞의 두 미션에서 본 것과 비교해서 모둠이 함께 이유를 써 보세요.',
    reasonPlaceholder: '예) 세 미션에서 공통으로 알게 된 것은…',
    actualResult: '전지 2개 회로의 풍차가 더 빠르게 돌아요',
    summary: '전구, 버저, 풍차 모두 확인했어요!\n마지막으로 마을에서 알게 된 것을 정리해 볼까요?',
    revival: '풍차가 씽씽 돌아가요! 마을이 완전히 되살아났어요.',
    modelReason: '전지 2개를 서로 다른 극끼리 한 줄로 연결하면 전지 1개일 때보다 전동기에 전기 에너지가 더 많이 공급되기 때문에 전동기가 더 빠르게 돌아요.',
  },
};

export const S5 = {
  stepTitles: [
    '1. 결과 모아 보기',
    '2. 확인하기',
    '3. 적용하기',
    '4. 오개념 점검',
    '5. 스스로 평가',
    '마치기',
  ],
  results: {
    headers: ['', '내 예상', '실제 결과'],
    rows: { m1: '전구 밝기', m2: '버저 소리', m3: '전동기 빠르기' } as Record<MissionId, string>,
  },
  explain: {
    questions: {
      bulb: {
        q: '전지 2개 회로의 전구는 전지 1개 회로의 전구보다 어땠나요?',
        choices: { more: '더 밝았어요', less: '더 어두웠어요', same: '밝기가 같았어요' },
      },
      buzzer: {
        q: '전지 2개 회로의 버저 소리는 전지 1개 회로의 버저 소리보다 어땠나요?',
        choices: { more: '더 컸어요', less: '더 작았어요', same: '크기가 같았어요' },
      },
      motor: {
        q: '전지 2개 회로의 날개 달린 전동기는 전지 1개 회로의 전동기보다 어떻게 돌았나요?',
        choices: { more: '더 빨리 돌았어요', less: '더 느리게 돌았어요', same: '빠르기가 같았어요' },
      },
    } as Record<PartKind, { q: string; choices: Record<'more' | 'less' | 'same', string> }>,
    summaries: [
      '전지 여러 개를 서로 다른 극끼리 한 줄로 연결하는 방법을 전지의 직렬연결이라고 해요.',
      '전지 2개를 직렬연결하면 전지 1개를 연결했을 때보다 전구는 더 밝고, 버저의 소리는 더 크고, 날개 달린 전동기는 더 빠르게 돌아요.',
      '전지 2개를 직렬연결하면 전지 1개를 연결할 때보다 전기 에너지가 더 많이 공급돼요.',
      '직렬연결한 전지의 개수를 늘릴수록 전구를 더 밝게 할 수 있고, 버저로 더 큰 소리를 내거나 전동기를 더 빠르게 돌릴 수 있어요.',
    ],
  },
  check: {
    before: '직렬연결한 전지를 2개에서 3개로 늘리면 전구의 밝기는 더 (',
    after: ').',
    choices: { brighter: '밝아집니다', darker: '어두워집니다' },
    answerIs: (answer: string) => `정답은 '${answer}'예요.`,
    explanation: '직렬연결한 전지의 개수를 늘릴수록 전기 에너지가 더 많이 공급돼서 전구가 더 밝아져요. 전지 1개보다 2개일 때 더 밝았던 것처럼, 3개면 2개일 때보다 더 밝아요.',
  },
  misconception: {
    guide: '○ 또는 ×를 골라 보세요.',
    right: '정답이에요.',
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
    text: '탐험대 덕분에 가로등도, 안내 종도, 풍차도 힘차게 움직여요.\n이제 반짝마을의 불빛 축제가 시작돼요!',
    button: '탐험 마치기',
    done: '수고했어요, 탐험대!',
  },
};

// ───────────── 교사용 화면 (학생에게는 보이지 않는다) ─────────────

/**
 * 명세서 11-2 지도서 평가 요소. 교사가 판단할 때 참고로만 보여 준다 (자동 판정하지 않는다).
 * criteria(상·중·하)는 명세서 11-2의 "보는 내용"으로 만든 임시 문장이다.
 * TODO: 지도서 4차시 평가 문장 그대로 바꿔 넣기 (팀 확인 필요)
 */
/** 마지막 글자에 받침이 있는지 (을/를 고르기). 한글이 아니면 숫자 읽기로 본다: 0·1·3·6·7·8은 받침 있음 */
function hasBatchim(word: string): boolean {
  const c = word.trim().slice(-1);
  const code = c.charCodeAt(0) - 0xac00;
  if (code >= 0 && code <= 11171) return code % 28 !== 0;
  return '013678'.includes(c);
}

export const TEACHER = {
  title: '교사용 화면',
  loginApp: '불빛 탐험대',
  loginTitle: '선생님용 화면',
  pinPlaceholder: '비밀번호',
  enter: '들어가기',
  refreshNote: '10초마다 새로 불러와요.',
  mostMissedTitle: '많이 틀린 오개념 문항',
  missedCount: (n: number) => `틀린 수 ${n}`,
  noMissed: '아직 틀린 문항이 없어요.',
  noGroups: '오늘(최근 12시간) 기록된 모둠이 없어요.',
  setupTitle: '모둠 만들기',
  setupGuide: '모둠을 만들어 두면 학생들이 "모둠으로 하기"에서 우리 모둠을 골라 함께 들어와요.',
  setupCount: '만들 모둠 수',
  setupCreate: '모둠 만들기',
  setupName: (n: number) => `${n}모둠`,
  setupEmpty: '아직 만든 모둠이 없어요.',
  setupDelete: (name: string) => `${name} 지우기`,
  setupDeleteTitle: (name: string) => `${name}${hasBatchim(name) ? '을' : '를'} 지울까요?`,
  setupDeleteBody: '이 모둠의 기록도 함께 지워지고,\n학생 화면의 모둠 목록에서도 사라져요.',
  setupDeleteOk: '지우기',
  setupDeleteCancel: '취소',
  columns: { group: '모둠', lastActive: '마지막 활동', where: '지금 위치', revived: '완료한 미션', hints: '힌트/시도', selfEval: '스스로 평가' },
  details: '자세히 보기',
  nav: { overview: '한눈에 보기', progress: '모둠 진행', records: '기록', groups: '모둠 관리', rubric: '평가 기준' },
  updatedAt: (time: string) => `${time}에 새로 불러옴`,
  lastActive: (time: string) => `마지막 활동 ${time}`,
  columnHelp: {
    revived: '미션을 완료한 장소 수 (가로등·안내 종·풍차)',
    hints: '힌트를 본 횟수 / 전선을 잇거나 지운 횟수',
  },
  /** 모둠 기록 미션 표의 왼쪽 줄 이름과 짧은 설명 */
  missionRows: {
    prediction: { label: '예상', help: '실험 전에 고른 답 (✓ = 실제 결과와 같음)' },
    built: { label: '회로 완성', help: 'A·B 회로를 바르게 이었는지' },
    compare: { label: '결과', help: '실험 뒤 ○표 한 말 (✓ = 맞음)' },
    hints: { label: '힌트 / 시도', help: '힌트 본 횟수 / 전선을 잇거나 지운 횟수' },
    challenge: { label: '도전 과제', help: '같은 극끼리 연결해 보기 (가로등만)' },
    explanation: { label: '모둠 이유', help: '결과가 그렇게 나온 까닭을 쓴 글' },
  },
  recordTabs: { group: '모둠 기록', personal: '개인 마무리 기록' },
  stat: {
    groups: '모둠',
    learners: '마무리 기록 (명)',
    finished: '탐험을 마친 사람',
    missions: '완료한 미션',
  },
  chart: {
    missionDoneRow: (place: string) => `${place} 완료`,
    finishedRow: '마무리 완료',
    quiz: '마무리 퀴즈 · 학생이 고른 답',
    quizExplain: (what: string) => `확인하기: ${what}`,
    quizCheck: '적용하기: 전지 3개로 늘리면',
    tagMission: '미션',
    groupMission: '미션 · 모둠',
    groupWrapup: '마무리 · 개인',
    tagWrapup: '마무리',
    missionDone: '미션별 완료한 모둠',
    prediction: '미션별 예상 · 모둠이 고른 답',
    compare: '○표 비교를 맞힌 모둠',
    misconception: '오개념 점검을 맞힌 사람',
    misconceptionShort: ['오개념 1: 연결만 하면 켜진다', '오개념 2: 전지가 많으면 무조건 밝다', '오개념 3: 직렬 2개면 버저가 더 크다'],
    explain: '확인하기를 맞힌 사람',
    explainShort: { bulb: '전구 밝기', buzzer: '버저 소리', motor: '전동기 빠르기' },
    selfEval: '스스로 평가',
    hints: '힌트를 많이 본 모둠',
    rateOf: (hit: number, of: number) => (of ? `${hit}/${of} (${Math.round((hit / of) * 100)}%)` : '아직 없음'),
    count: (n: number) => `${n}명`,
    hintsOf: (hints: number, attempts: number) => `힌트 ${hints} · 시도 ${attempts}`,
    noneYet: '아직 고르지 않음',
    /** 나눠진 막대 오른쪽: "정답 60% · 3/5명" */
    pickSummary: (hit: number, of: number, unit: string) =>
      (of ? `정답 ${Math.round((hit / of) * 100)}% · ${hit}/${of}${unit}` : '아직 없음'),
    pickCount: (n: number, unit: string) => `${n}${unit}`,
    unitGroup: '모둠',
    unitPerson: '명',
  },
  personalCols: { group: '모둠', name: '이름', progress: '진행', explain: '확인하기', check: '적용하기', mis: '오개념 점검', selfEval: '스스로 평가',
    checkSub: '전지 3개', misSub: (n: number) => `${n}번` },
  stepOf: (step: number, all: number) => `${step}/${all}단계`,
  page: (n: number, all: number) => `${n} / ${all}`,
  prev: '이전',
  next: '다음',
  reason: '이유',
  challengeShort: '도전',
  progressTitle: '모둠별 진행',
  recordsTitle: '모둠별 기록',
  rubricLook: '보는 내용',
  rubricEvidence: '근거',
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
      evidence: '미션의 모둠 설명, 확인하기 답, 적용하기 답, 오개념 점검 결과',
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
    answer: '고른 답',
    mission: '미션',
    recall: '불이 켜지는 회로',
    fanReason: '전지 개수가 다른 이유',
    fanPredict: '손 선풍기 바람 예상',
    prediction: '예상',
    built: '정상 연결',
    compare: '○표 비교',
    explanation: '모둠 이유',
    challenge: '도전(같은 극끼리)',
    wrapup: '마무리',
    explain: '확인하기 답',
    check: '적용하기',
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
    challenge: { none: '미도전', active: '도전 중', done: '도전 완료' },
    explain: { more: '더 ~했어요', less: '덜 ~했어요', same: '같았어요' },
    check: { brighter: '밝아집니다', darker: '어두워집니다' },
  },
};

/** 미션 장소에 도착했을 때의 상황 장면 (S3). 말풍선은 장면 속 마을 사람의 말 */
export const SITUATION: Record<MissionId, {
  alt: string;
  problem: string;
  todo: string;
  troubleLine: string;
  fixedLine: string;
}> = {
  m1: {
    alt: '가로등이 꺼져 깜깜한 거리에서 사람들이 길을 더듬어 걷고 있어요',
    problem: '가로등이 모두 꺼져서 밤길이 깜깜해요. 축제에 오는 사람들이 길을 잃고 있어요.',
    todo: '전지의 개수를 달리하면 전구의 밝기가 어떻게 달라지는지 알아보고, 가로등을 다시 밝혀요.',
    troubleLine: '앞이 안 보여요',
    fixedLine: '이제 환해요!',
  },
  m2: {
    alt: '광장의 안내 종을 쳐도 소리가 나지 않아 사람들이 고개를 갸웃해요',
    problem: '안내 종을 쳐도 소리가 들리지 않아요. 축제가 시작된다는 것을 아무도 알 수 없어요.',
    todo: '전지의 개수를 달리하면 버저 소리가 어떻게 달라지는지 알아보고, 종소리를 되살려요.',
    troubleLine: '소리가 안 들려요',
    fixedLine: '종소리가 울려요!',
  },
  m3: {
    alt: '언덕의 풍차가 멈춰 있고 축제 무대의 전등이 꺼져 있어요',
    problem: '풍차가 멈춰 있어요. 풍차가 돌아야 축제 무대에 불을 켤 힘이 모여요.',
    todo: '전지의 개수를 달리하면 전동기가 도는 빠르기가 어떻게 달라지는지 알아보고, 풍차를 다시 돌려요.',
    troubleLine: '꼼짝도 안 해요',
    fixedLine: '씽씽 돌아요!',
  },
};

/** 미션에 들어가면 반디가 들려주는 이야기. 마지막 줄에는 미션 도입 문장(MISSION_STRINGS.intro)이 이어진다.
 *  POE 규칙: 결과(전지가 많으면 더 밝다 등)를 미리 말하지 않는다 */
export const MISSION_INTRO: Record<MissionId, { lines: readonly string[]; start: string; skip: string; next: string; prev: string }> = {
  m1: {
    lines: [
      '여기가 가로등 거리예요. 와, 정말 깜깜하죠?',
      '축제에 가던 병아리가 길을 잃었대요. 할아버지 곰은 촛불 하나로 겨우 버티고 있어요.',
      '가로등 안에는 전구와 전지가 들어 있어요.',
    ],
    start: '예상하러 가기',
    skip: '건너뛰기',
    next: '다음',
    prev: '이전',
  },
  m2: {
    lines: [
      '광장에 도착했어요! 저기 안내 종 보이죠?',
      '여우가 종을 아무리 흔들어도 소리가 하나도 안 들려요. 친구들이 고개를 갸웃하고 있어요.',
      '종 안에는 소리를 내는 버저가 숨어 있어요.',
    ],
    start: '예상하러 가기',
    skip: '건너뛰기',
    next: '다음',
    prev: '이전',
  },
  m3: {
    lines: [
      '언덕 위 풍차까지 왔어요. 그런데 날개가 꼼짝도 안 해요.',
      '풍차가 돌아야 축제 무대에 불이 켜져요. 농부 돼지가 발을 동동 구르고 있어요.',
      '풍차 안에는 날개를 돌리는 전동기가 들어 있어요.',
    ],
    start: '예상하러 가기',
    skip: '건너뛰기',
    next: '다음',
    prev: '이전',
  },
};

/** 처음 접속하거나 처음부터 다시 할 때 나오는 오프닝 */
export const OPENING = {
  title: '불빛 탐험대',
  subtitle: '꺼진 마을을 밝혀라',
  start: '시작하기',
  skip: '건너뛰기',
};

/** 선택지 앞의 "(가) " 표시를 뗀 본문. 고른 답을 다시 보여 줄 때 쓴다 (선생님 화면은 표시를 그대로 둔다) */
export const withoutMark = (choice: string) => choice.replace(/^\([^)]\)\s*/, '');
