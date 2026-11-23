'use client';

// 교사용 화면 (2단계 뼈대): 조별 진행, 도움 횟수, 많이 틀린 오개념 문항.
// 판정(상·중·하)은 교사가 한다. 이 화면은 근거 자료만 보여 준다 (명세서 11-2).
import { useEffect, useState } from 'react';
import { MISSION_ORDER } from '@/data/missions';
import { COMMON, S3, S5 } from '@/data/strings';
import type { ClassSummary } from '@/lib/teacher/summarize';

const REFRESH_MS = 10_000;
const STEP_NAMES = { predict: '① 예상', build: '② 만들기', compare: '③ 비교·이유', confirm: '④ 확인' } as const;

export default function TeacherPage() {
  const [pin, setPin] = useState('');
  const [activePin, setActivePin] = useState<string | null>(null);
  const [data, setData] = useState<ClassSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activePin) return;
    let cancelled = false;
    const load = async () => {
      const res = await fetch('/api/teacher/summary', { headers: { 'x-teacher-pin': activePin } });
      const body = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (res.ok) {
        setData(body as ClassSummary);
        setError(null);
      } else {
        setError((body as { error?: string }).error ?? `오류 ${res.status}`);
      }
    };
    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activePin]);

  if (!activePin) {
    return (
      <main className="m-auto flex flex-col gap-3 p-6">
        <h1 className="text-2xl font-black">교사용 화면</h1>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="교사 비밀번호"
          className="min-h-11 rounded-xl border-2 px-3" />
        <button type="button" className="min-h-11 rounded-xl bg-amber-500 font-bold text-white" onClick={() => setActivePin(pin)}>
          들어가기
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-black">교사용 화면 · {COMMON.appTitle}</h1>
      {error && <p className="font-bold text-rose-700">{error}</p>}
      {data && (
        <>
          <section className="rounded-2xl bg-white p-4 shadow">
            <h2 className="font-bold">많이 틀린 오개념 문항</h2>
            {data.mostMissed.length === 0 ? (
              <p className="text-slate-500">아직 틀린 문항이 없어요.</p>
            ) : (
              <ul>
                {data.mostMissed.map((k) => (
                  <li key={k}>
                    {S5.misconception.items.find((i) => i.key === k)?.text} — <b>{data.misconceptionWrong[k]}모둠</b>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <table className="w-full rounded-2xl bg-white text-base shadow">
            <thead className="bg-amber-100 text-left">
              <tr>
                <th className="p-2">모둠</th>
                <th className="p-2">지금 위치</th>
                <th className="p-2">되살린 곳</th>
                {MISSION_ORDER.map((id) => (
                  <th key={id} className="p-2">{S3.places[id]} 힌트/시도</th>
                ))}
                <th className="p-2">스스로 평가</th>
              </tr>
            </thead>
            <tbody>
              {data.groups.map((g) => (
                <tr key={g.groupId} className="border-t align-top">
                  <td className="p-2 font-bold">{g.groupName}</td>
                  <td className="p-2">
                    {g.screen}
                    {g.currentMission && ` · ${S3.places[g.currentMission]} ${g.currentStep ? STEP_NAMES[g.currentStep] : ''}`}
                  </td>
                  <td className="p-2">{g.revived}/3</td>
                  {MISSION_ORDER.map((id) => (
                    <td key={id} className="p-2">{g.hintCount[id]} / {g.attempts[id]}</td>
                  ))}
                  <td className="p-2">{g.selfEval ? S5.selfEval.choices[g.selfEval] : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* TODO: 지도서 평가 문장(상·중·하 기준)을 참고 문구로 표시, 모둠 설명 글 펼쳐 보기 */}
        </>
      )}
    </main>
  );
}
