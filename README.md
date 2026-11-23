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
    sync/realtime.ts          3단계: 실시간 공동 조작 (뼈대)
    teacher/summarize.ts      교사용 집계
  data/
    strings.ts                학생 화면 문구 전부 (명세서 12장: 문구 분리)
    missions.ts               미션 3개 설정·내부 정답
    boards.ts                 회로판 A/B 부품 고정 위치·단자
  components/
    screens/S1~S5             화면
    circuit/CircuitBoard.tsx  SVG 회로판 (전선 잇기·지우기·스위치)
    mission/MissionWorksheet  학습지 패널 (단계별)
  media/                      이모지 임시 그림·효과음 (그림 파일로 교체할 곳)
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
| 3차시 떠올리기·오개념 점검 기록 | 처음 고른 답만 기록 | `reducer.ts` |
| 주인공 이름 | `CHARACTER = '주인공'` 임시 | `data/strings.ts` |

## 남은 일

- [ ] 그림(14장 A1~A6)을 `media/assets.ts`에서 이모지 → 그림 파일로 교체
- [ ] 8-1 선택 보충 "같은 극끼리 이어 보기" 도전 (넣을지 팀 결정)
- [ ] 교사용 화면: 지도서 평가 문장(상·중·하) 참고 표시, 모둠 설명 글 펼쳐 보기
- [ ] 3단계: 방 코드 입장 화면, presence로 A/B 담당 표시, `realtime.ts` 연결
- [ ] 태블릿 실기기에서 글자·버튼 크기와 S5 7분 안에 끝나는지 확인
