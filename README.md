# 불빛 탐험대: 꺼진 마을을 밝혀라

6학년 과학 「3. 전기의 이용」 4차시(전지의 개수에 따른 전기 회로의 특징 비교, [6과15-02]) 수업용 웹 시뮬레이터.
POE(예상 → 관찰 → 설명) 흐름으로 전지 1개 회로(A)와 전지 2개 직렬 회로(B)를 나란히 만들어 비교한다.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 판정 함수·단계 규칙 단위 테스트
npm run typecheck
npm run build
```

환경 변수가 없으면 **1단계 모드**(브라우저에만 저장)로 동작한다. 2·3단계는 `.env.example`을 `.env.local`로 복사해 채운다.

## 구조

```
src/
  app/
    page.tsx                  학생 화면 (S1~S5)
    teacher/page.tsx          교사용 화면 (2단계)
    api/groups/[id]/          학습 기록 저장 (2단계)
    api/teacher/summary/      교사용 집계 (2단계)
  lib/
    types.ts                  상태·기록 타입 (명세서 11장 데이터 틀)
    circuit/judge.ts          ★ 회로 판정 (명세서 9장). 순수 함수 + 테스트
    circuit/hints.ts          힌트 규칙 (명세서 7-3)
    flow/missionFlow.ts       미션 단계 진행·체크리스트·POE 규칙 (명세서 7-2)
    flow/screenFlow.ts        S1·S2·S5 "다음" 조건
    store/reducer.ts          ★ 모든 상태 변경은 여기서만 (결정적 reducer)
    store/actions.ts          시각·id가 들어가는 action 만들기
    sync/remoteSave.ts        2단계: 서버 저장
    sync/roomSync.ts          3단계: 여러 기기 동기화 규칙 (순수 로직 + 테스트)
    sync/realtime.ts          3단계: Supabase Realtime 통로 (broadcast + presence)
    teacher/summarize.ts      교사용 집계
    world/movement.ts         마을 돌아다니기 계산 (걷기·조이스틱·나침반 방향·가까이 보기 카메라, 테스트 있음)
  data/
    strings.ts                학생 화면 문구 전부 (명세서 12장: 문구 분리)
    missions.ts               미션 3개 설정·내부 정답
    boards.ts                 회로판 A/B 부품 고정 위치·단자
    world.ts                  반짝마을 지도 배치 (장소·길·걷는 빠르기)
  components/
    screens/S1~S5             화면
    RoomBar.tsx               3단계: 방 코드·회로 담당·다른 친구의 조작 표시
    village/VillageScene.tsx  반짝마을 그림 (도입·지도·마무리에서 같이 씀). near면 가까이 보기용 자세한 그림
    village/VillageDetails.tsx 가까이 보기에서 더 그리는 것 (돌길·풀·꽃·연못·길가 등·문제를 말하는 마을 동물)
    village/VillageWorld.tsx  S3 마을 돌아다니기 (키보드·누르기·조이스틱, 나침반, 가까이/지도 보기 카메라)
    village/SituationScene.tsx 미션 장소에 도착했을 때의 움직이는 상황 장면
    village/Characters.tsx    인물 그림: 탐험대(머리 전등 헬멧 강아지)·마을 동물·반디(반딧불이)·말풍선
    village/Props.tsx         물건 그림: 집·나무·가로등·울타리·종탑·풍차·무대·표지판 (캐릭터와 같은 그림체)
    village/IntroScene.tsx    S2 도입 컷 애니메이션
    circuit/CircuitBoard.tsx  SVG 회로판 (전선 잇기·지우기·스위치)
    mission/MissionWorksheet  학습지 패널 (단계별)
  media/                      남은 이모지 임시 그림(장갑·되살아남 연출·마무리)과 효과음
supabase/schema.sql           2단계 DB 스키마
```

### 핵심 설계

- **판정은 순수 함수.** `judge()`는 화면과 무관하게 부품·전선·스위치만 받아 레벨과 이유(reason)를 돌려준다. reason은 힌트 문구와 1:1로 대응한다.
- **상태 변경은 reducer 하나로.** 단계 진행 조건(예: 이유 10글자 전에는 확인하기 불가)은 reducer와 UI가 같은 함수(`missionFlow.ts`)를 쓴다.
- **reducer는 결정적.** 시각·id는 action에 담아 보낸다. 3단계에서 같은 action을 모든 기기에 broadcast하면 화면이 같아진다.

## 명세서에 없어서 정한 것 (팀 확인 필요)

| 상황 | 정한 동작 | 위치 |
|---|---|---|
| "스위치가 열려 있어요" 힌트는 "스위치를 닫고 5초" 조건과 모순 | 연결이 맞고 스위치만 열린 채 5초가 지나면 표시 | `circuit/hints.ts` |
| 전지 양 끝을 바로 잇거나 부품을 건너뛰는 선 (합선) | 레벨 0 + 합선 힌트 | `judge.ts` `SHORT_CIRCUIT` |
| 스위치를 빼고 고리를 만듦 | 레벨 0 + "스위치도 고리 안에" 힌트 | `judge.ts` `SWITCH_MISSING` |
| B 회로에 전지 1개만 넣고 고리 | 레벨 1 (체크리스트 2번은 레벨 2일 때만 체크) | `missionFlow.ts` |
| S5 확인해요 | 맞는 답을 골라야 다음으로 | `screenFlow.ts` |
| 회로 조건 떠올리기·오개념 점검 기록 | 처음 고른 답만 기록 | `reducer.ts` |
| S3 마을 지도 | 버튼 대신 탐험대를 움직여 돌아다닌다. 방향키/WASD, 가고 싶은 곳 누르기, 화면 조이스틱. 탐험대 둘레의 나침반 화살표가 길과 상관없이 늘 다음 미션 장소를 가리킨다. 미션을 마치고 돌아오면 그곳이 되살아나는 장면과 반디의 다음 안내가 나온다. 되살린 곳이 늘수록 마을이 밝아진다. 성공 전에는 가로등이 꺼져 있고, 종은 울리지 않고, 풍차는 멈춰 있다 | `S3Map.tsx`, `village/` |
| S3 보기 두 가지 | 오른쪽 위 버튼 이름은 "탐험 / 지도". **탐험**(가까이 보기, 기본): 탐험대를 따라가며 5배로 크게, 건물·장소는 작게 그려 장소 사이 길이 멀게 느껴진다. 돌길·풀·꽃·연못·길가 등과, 장소마다 문제를 말하는 마을 동물(말풍선)이 보인다. **지도**: 마을 전체를 한눈에, 자세한 것은 빼고 단순하게. 오른쪽 위에서 바꾸면 흰 칸이 옆으로 미끄러진다 | `VillageWorld.tsx` `NEAR`, `VillageScene.tsx` `NEAR_PROP`·`NEAR_PLACE` |
| 미션 장소에 도착 | 화면 전체에 상황 장면(움직이는 그림)과 "문제 상황"·"우리가 할 일"을 보여 준 뒤 "미션 시작!". 닫기는 ✕. 이미 성공한 곳은 밝아진 장면과 "다시 하기 / 결과 확인하기" | `S3Map.tsx` `SituationPanel`, `SituationScene.tsx`, `data/strings.ts` `SITUATION` |
| 완료한 미션 다시 하기 | ① 예상하기부터 빈 회로판으로 새로 한다. 하는 동안 그 장소는 꺼진 모습으로 돌아가고, 이미 열린 다음 미션은 그대로. 기록은 새로 한 것으로 바뀐다 (이전 기록은 남지 않음) | `reducer.ts` `RETRY_MISSION` |
| S3 제목 | "[모둠 이름] 미션 n/3 완료"와 별 세 개 | `S3Map.tsx` |
| 함께하기에서 마을 돌아다니기 | 탐험대 위치는 기기마다 따로 (동기화하지 않음). 이야기 장면 넘기기와 미션 열기는 모든 기기가 함께 | `VillageWorld.tsx` |
| 세계관 | 3차시 책 이야기와 잇지 않는다. 주인공은 학생 모둠(탐험대, 모둠 이름으로 부름), 무대는 불빛 축제 날의 "반짝마을", 안내 인물은 빛 요정 "반디"(꼬리가 빛나는 반딧불이). 마을 사람은 여러 동물 | `data/strings.ts` 맨 위, `village/Characters.tsx` |
| 8-1 선택 보충 "같은 극끼리 이어 보기" | 미션 1 ④ 확인하기에 "도전!" 버튼(선택). B 회로만 다시 만질 수 있고, 같은 극끼리 이어 스위치를 닫으면 확인 문구. 힌트·시도 횟수에는 넣지 않음 | `MissionWorksheet.tsx`, `reducer.ts` |
| 지도로 돌아가기 | 명세서는 "완료한 미션에서만"이지만, 팀 요청으로 미션 화면 맨 위 "🗺️ 지도로 돌아가기"를 언제든 누를 수 있게 함. 하던 미션은 예상·회로판·이유가 남아 다시 들어오면 이어서 한다. 완료한 곳은 "결과 확인하기"로 보기만 하거나 "다시 하기"로 새로 한다 | `reducer.ts` `LEAVE_MISSION`, `OPEN_MISSION` |
| 회로 만들기 튜토리얼 | 미션 1의 ② 만들기에 처음 들어갈 때만 자동으로. 미션 2·3은 "연결 방법 다시 보기"로 직접 연다. 기기마다 한 번 | `S4Mission.tsx` `useTutorial` |
| 할 곳만 밝히기 | ①·③·④에서 화면 전체를 어둡게 덮고 학습지만 밝게. ② 만들기에서는 덮지 않는다 (탐험 과제를 함께 봐야 해서) | `S4Mission.tsx`, `missionFlow.ts` `missionFocus` |
| 교사용 평가 기준(상·중·하) | 명세서 11-2로 만든 **임시 문장**. 지도서 문장으로 바꿔야 함 | `data/strings.ts` `TEACHER.rubric` |
| 같은 기기를 다음 모둠이 쓸 때 | "수고했어요" 화면 아래 작은 "처음부터 다시 하기" (확인 창) | `S5Wrapup.tsx` |

## 3단계: 여러 기기로 함께하기

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 있으면 S1에 "여러 기기로 함께하기"가 나타난다. (DB 테이블은 쓰지 않는다. Realtime의 broadcast·presence만 쓴다.)

1. 한 친구가 "새 모둠으로 시작"에서 *여러 기기로 함께하기*를 켜고 이름·맡을 회로를 고른 뒤 시작한다. 화면 맨 위에 **방 코드**(4글자)가 나온다.
2. 다른 친구는 "모둠 방에 들어가기"에서 방 코드·이름·맡을 회로를 넣는다. 먼저 시작한 기기의 화면 상태를 받아 같은 화면에서 이어 한다.
3. 회로판은 **내가 맡은 회로만** 조작할 수 있다. 다른 친구가 한 조작은 이름과 함께 3초 동안 보인다. 학습지(예상·○표·이유)는 누구나 조작한다.
4. 연결이 잠깐 끊겨도 방을 만든 기기가 15초마다 전체 상태를 보내 다시 맞춘다. 새로고침하면 같은 방에 다시 들어간다.

## 남은 일

- [ ] 남은 이모지 그림(S1 절연 장갑, 미션 ④ 되살아남 연출, S5 마무리 마을)을 `village/` 그림체로 바꾸기. 마을·인물·장소는 SVG로 그려 두었다
- [ ] 교사용 평가 기준(상·중·하)을 지도서 문장으로 교체
- [ ] 3단계를 실제 Supabase 프로젝트와 태블릿 2대로 시연해 보기
- [ ] 태블릿 실기기에서 글자·버튼 크기와 S5 7분 안에 끝나는지 확인
- [ ] 태블릿에서 가까이 보기 움직임이 부드러운지 확인 (그림이 많아 느리면 `VillageDetails.tsx`의 풀·꽃·돌 개수를 줄인다)
