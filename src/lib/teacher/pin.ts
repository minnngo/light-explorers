// 교사용 API의 비밀번호 확인 (서버 전용). 헤더 x-teacher-pin 이 환경 변수 TEACHER_PIN 과 같아야 한다.
import { timingSafeEqual } from 'node:crypto';

export function pinMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** 비밀번호가 맞지 않거나 설정이 없으면 돌려줄 응답, 맞으면 null */
export function checkTeacher(request: Request, configured: boolean): Response | null {
  const pin = process.env.TEACHER_PIN;
  if (!pin || !configured) return Response.json({ error: '교사용 화면이 설정되지 않았습니다.' }, { status: 503 });
  if (!pinMatches(request.headers.get('x-teacher-pin'), pin)) {
    return Response.json({ error: '비밀번호가 맞지 않습니다.' }, { status: 401 });
  }
  return null;
}
