// 선생님이 모둠을 미리 만들기 (교사용 화면)
//  GET  /api/teacher/groups            오늘 만든 모둠 목록
//  POST /api/teacher/groups {names}    모둠 만들기 (이름마다 하나)
import type { NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { CLASS_WINDOW_MS, type ClassGroup, MAX_GROUPS, newClassGroupState, uniqueRoomCode } from '@/lib/teacher/classGroups';
import { checkTeacher } from '@/lib/teacher/pin';

async function listGroups(): Promise<ClassGroup[] | { error: string }> {
  const supabase = getServerSupabase()!;
  const since = new Date(Date.now() - CLASS_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from('group_sessions')
    .select('id, group_name, room_code, created_at')
    .filter('state->>classGroup', 'eq', 'true')
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(50);
  if (error) return { error: error.message };
  return (data ?? []).map((r) => ({ id: r.id as string, name: r.group_name as string, roomCode: r.room_code as string }));
}

export async function GET(request: NextRequest) {
  const denied = checkTeacher(request, getServerSupabase() !== null);
  if (denied) return denied;
  const groups = await listGroups();
  if ('error' in groups) return Response.json(groups, { status: 500 });
  return Response.json({ groups }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const denied = checkTeacher(request, getServerSupabase() !== null);
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { names?: unknown } | null;
  const names = Array.isArray(body?.names)
    ? body.names.filter((n): n is string => typeof n === 'string').map((n) => n.trim().slice(0, 20)).filter(Boolean)
    : [];
  if (names.length === 0) return Response.json({ error: '모둠 이름이 없습니다.' }, { status: 400 });

  const existing = await listGroups();
  if ('error' in existing) return Response.json(existing, { status: 500 });
  if (existing.length + names.length > MAX_GROUPS) {
    return Response.json({ error: `모둠은 ${MAX_GROUPS}개까지 만들 수 있어요.` }, { status: 400 });
  }

  const taken = new Set(existing.map((g) => g.roomCode));
  const now = new Date().toISOString();
  const rows = names.map((name) => {
    const id = crypto.randomUUID();
    const roomCode = uniqueRoomCode(taken);
    return { id, group_name: name, room_code: roomCode, state: newClassGroupState(id, name, roomCode), created_at: now, updated_at: now };
  });
  const { error } = await getServerSupabase()!.from('group_sessions').insert(rows);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const groups = await listGroups();
  if ('error' in groups) return Response.json(groups, { status: 500 });
  return Response.json({ groups }, { status: 201 });
}
