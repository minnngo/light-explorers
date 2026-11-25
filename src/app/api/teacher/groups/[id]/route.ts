// DELETE /api/teacher/groups/:id  선생님이 만든 모둠 지우기 (그 모둠의 기록도 함께 지워진다)
import type { NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { checkTeacher } from '@/lib/teacher/pin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/teacher/groups/[id]'>) {
  const supabase = getServerSupabase();
  const denied = checkTeacher(request, supabase !== null);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return Response.json({ error: '잘못된 모둠 id' }, { status: 400 });
  // 선생님이 만든 모둠만 지운다
  const { error } = await supabase!.from('group_sessions').delete().eq('id', id).filter('state->>classGroup', 'eq', 'true');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
