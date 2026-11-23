// PUT /api/groups/:id  모둠 학습 기록 스냅샷 저장 (2단계)
import type { NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import type { AppState } from '@/lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 100_000;

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/groups/[id]'>) {
  const supabase = getServerSupabase();
  if (!supabase) return Response.json({ error: '서버 저장이 설정되지 않았습니다.' }, { status: 503 });

  const { id } = await ctx.params;
  if (!UUID.test(id)) return Response.json({ error: '잘못된 모둠 id' }, { status: 400 });

  const body = await request.text();
  if (body.length > MAX_BYTES) return Response.json({ error: '기록이 너무 큽니다.' }, { status: 413 });

  let state: AppState;
  try {
    state = JSON.parse(body) as AppState;
  } catch {
    return Response.json({ error: 'JSON 형식이 아닙니다.' }, { status: 400 });
  }
  if (state.groupId !== id || typeof state.groupName !== 'string') {
    return Response.json({ error: '모둠 정보가 맞지 않습니다.' }, { status: 400 });
  }

  const { error } = await supabase.from('group_sessions').upsert({
    id,
    group_name: state.groupName.slice(0, 40),
    room_code: typeof state.roomCode === 'string' ? state.roomCode.slice(0, 8) : null,
    state,
    updated_at: new Date().toISOString(),
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
