// 서버(Route Handler)에서만 쓰는 Supabase 클라이언트. secret 키를 쓰므로 브라우저 코드에서 import하지 않는다.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

/** 환경 변수가 없으면 null (1단계 모드) */
export function getServerSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}
