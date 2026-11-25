// GET /api/groups  학생 입장 화면의 모둠 목록: 선생님이 오늘 만든 모둠 (이름과 방 코드만)
import { getServerSupabase } from '@/lib/supabase/server';
import { CLASS_WINDOW_MS } from '@/lib/teacher/classGroups';

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) return Response.json({ error: '서버 저장이 설정되지 않았습니다.' }, { status: 503 });
  const since = new Date(Date.now() - CLASS_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from('group_sessions')
    .select('id, group_name, room_code')
    .filter('state->>classGroup', 'eq', 'true')
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(50);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const groups = (data ?? []).map((r) => ({ id: r.id, name: r.group_name, roomCode: r.room_code }));
  return Response.json({ groups }, { headers: { 'Cache-Control': 'no-store' } });
}
