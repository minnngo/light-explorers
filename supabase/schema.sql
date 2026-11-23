-- 불빛 탐험대 DB 스키마 (2단계: 저장 + 교사용 화면)
-- Supabase 대시보드 → SQL Editor에 붙여 넣고 실행한다.
--
-- 설계: 모둠의 학습 기록 전체(AppState)를 스냅샷 하나(jsonb)로 저장한다.
--  - 앱의 상태 구조(src/lib/types.ts)와 DB가 1:1이라 따로 맞출 필요가 없다.
--  - 교사용 집계는 서버(src/lib/teacher/summarize.ts)에서 스냅샷을 읽어 계산한다.
--  - 한 반(6~8모둠) 규모에서는 이 방식으로 충분하다. 반이 많아지면 그때 컬럼을 나눈다.

create table if not exists public.group_sessions (
  id           uuid primary key,                 -- AppState.groupId (탐험 시작 시 생성)
  group_name   text not null,
  room_code    text,                             -- 3단계(실시간 공동 조작)에서 사용
  state        jsonb not null,                   -- AppState 전체
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists group_sessions_updated_at_idx on public.group_sessions (updated_at desc);

-- 보안: 브라우저(publishable 키)는 이 테이블에 직접 접근하지 못하게 막는다.
-- 읽기·쓰기는 모두 Next.js 서버(Route Handler)가 secret 키로 한다.
-- RLS를 켜고 정책을 하나도 만들지 않으면 publishable 키로는 아무것도 할 수 없다.
alter table public.group_sessions enable row level security;
