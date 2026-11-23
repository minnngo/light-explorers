// GET /api/teacher/summary  교사용 조별 진행 집계 (2단계)
// 헤더 x-teacher-pin 이 환경 변수 TEACHER_PIN 과 같아야 한다.
import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { summarize } from '@/lib/teacher/summarize';
import type { AppState } from '@/lib/types';

function pinMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const pin = process.env.TEACHER_PIN;
  const supabase = getServerSupabase();
  if (!pin || !supabase) return Response.json({ error: '교사용 화면이 설정되지 않았습니다.' }, { status: 503 });
  if (!pinMatches(request.headers.get('x-teacher-pin'), pin)) {
    return Response.json({ error: '비밀번호가 맞지 않습니다.' }, { status: 401 });
  }

  // 최근 12시간 안에 활동한 모둠만 (오늘 수업)
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('group_sessions')
    .select('state, updated_at')
    .gte('updated_at', since)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r) => ({ state: r.state as AppState, updatedAt: r.updated_at as string }));
  return Response.json(summarize(rows), { headers: { 'Cache-Control': 'no-store' } });
}
