// 브라우저용 Supabase 클라이언트. publishable 키만 쓰며, 3단계 실시간 동기화(Realtime)에만 쓴다.
// DB 테이블은 RLS로 막혀 있어 이 클라이언트로는 읽고 쓸 수 없다 (supabase/schema.sql 참고).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

export function getBrowserSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}
