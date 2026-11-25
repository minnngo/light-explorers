'use client';

// 교사용 화면 (2단계): 조별 진행, 도움 횟수, 많이 틀린 오개념 문항, 모둠별 근거 자료.
// 판정(상·중·하)은 교사가 한다. 이 화면은 근거 자료와 지도서 평가 요소를 참고로만 보여 준다 (명세서 11-2).
import { useEffect, useState } from 'react';
import { MISSION_ORDER } from '@/data/missions';
import { COMMON, MISSION_STRINGS, S2, S3, S5, TEACHER } from '@/data/strings';
import type { ClassSummary, GroupSummary } from '@/lib/teacher/summarize';
import type { PartKind } from '@/lib/types';

const REFRESH_MS = 10_000;
const STEP_NAMES = { predict: '① 예상', build: '② 만들기', compare: '③ 비교·이유', confirm: '④ 확인' } as const;
const SCREEN_NAMES = { S1: '입장', S2: '도입', S3: '마을 지도', S4: '미션', S5: '마무리' } as const;
const L = TEACHER.labels;
const V = TEACHER.values;

export default function TeacherPage() {
  const [pin, setPin] = useState('');
  const [activePin, setActivePin] = useState<string | null>(null);
  const [data, setData] = useState<ClassSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activePin) return;
    let cancelled = false;
    const load = async () => {
      const res = await fetch('/api/teacher/summary', { headers: { 'x-teacher-pin': activePin } }).catch(() => null);
      if (cancelled) return;
      if (!res) {
        setError('서버에 연결할 수 없어요.');
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (res.ok) {
        setData(body as ClassSummary);
        setError(null);
      } else {
        setError((body as { error?: string }).error ?? `오류 ${res.status}`);
        if (res.status === 401) setActivePin(null);
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
      <main className="m-auto flex w-full max-w-sm flex-col gap-4 p-6">
        <h1 className="text-2xl font-black">{TEACHER.title}</h1>
        {error && <ErrorText>{error}</ErrorText>}
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); setActivePin(pin); }}>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder={TEACHER.pinPlaceholder}
            className={INPUT} />
          <button type="submit" className={PRIMARY}>{TEACHER.enter}</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black">{TEACHER.title} · {COMMON.appTitle}</h1>
        <p className="text-sm text-stone-500">{TEACHER.refreshNote}</p>
      </header>
      {error && <ErrorText>{error}</ErrorText>}
      <GroupSetup pin={activePin} />
      {data && (
        <>
          <Card title={TEACHER.mostMissedTitle}>
            {data.mostMissed.length === 0 ? (
              <Empty>{TEACHER.noMissed}</Empty>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.mostMissed.map((k) => (
                  <li key={k} className="flex items-center justify-between gap-3 text-sm">
                    <span>{S5.misconception.items.find((i) => i.key === k)?.text}</span>
                    <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-0.5 font-bold text-rose-600">
                      {TEACHER.missedCount(data.misconceptionWrong[k])}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={TEACHER.progressTitle}>
            {data.groups.length === 0 ? (
              <Empty>{TEACHER.noGroups}</Empty>
            ) : (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y border-stone-200 bg-stone-50 text-left text-stone-500">
                    <tr>
                      <th className={TH}>{TEACHER.columns.group}</th>
                      <th className={TH}>{TEACHER.columns.where}</th>
                      <th className={TH}>{TEACHER.columns.revived}</th>
                      {MISSION_ORDER.map((id) => (
                        <th key={id} className={TH}>{S3.places[id]} {TEACHER.columns.hints}</th>
                      ))}
                      <th className={TH}>{TEACHER.columns.wrote}</th>
                      <th className={TH}>{TEACHER.columns.selfEval}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.map((g) => (
                      <tr key={g.groupId} className="border-b border-stone-100 align-top last:border-0">
                        <td className={`${TD} font-bold`}>{g.groupName}</td>
                        <td className={TD}>
                          {SCREEN_NAMES[g.screen]}
                          {g.currentMission && ` · ${S3.places[g.currentMission]} ${g.currentStep ? STEP_NAMES[g.currentStep] : ''}`}
                          {g.finished && ` · ${L.finished}`}
                        </td>
                        <td className={TD}>{g.revived}/3</td>
                        {MISSION_ORDER.map((id) => (
                          <td key={id} className={`${TD} ${g.hintCount[id] >= 3 ? 'font-bold text-rose-600' : ''}`}>
                            {g.hintCount[id]} / {g.attempts[id]}
                          </td>
                        ))}
                        <td className={TD}>{g.wroteCount}/{g.writableCount}</td>
                        <td className={`${TD} whitespace-pre-line`}>
                          {g.students.length > 0
                            ? g.students.map((st) => `${st.name} ${st.selfEval ? S5.selfEval.choices[st.selfEval] : V.empty}`).join('\n')
                            : g.selfEval ? S5.selfEval.choices[g.selfEval] : V.empty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {data.groups.length > 0 && (
            <Card title={TEACHER.recordsTitle}>
              <div className="-mx-5 flex flex-col">
                {data.groups.map((g) => <GroupDetails key={g.groupId} g={g} />)}
              </div>
            </Card>
          )}
        </>
      )}
      <Rubric />
    </main>
  );
}

// ───── 교사용 화면 공통 모양: 카드 제목 18px 굵게, 설명·표·기록은 14px, 라벨은 회색 ─────
const INPUT = 'min-h-10 rounded-xl border-2 border-stone-200 bg-white px-3 text-base focus:border-amber-400 focus:outline-none';
const PRIMARY = 'min-h-10 rounded-xl bg-amber-700 px-4 text-sm font-bold text-white outline-none transition hover:bg-amber-800 disabled:opacity-50';
const TH = 'whitespace-nowrap px-5 py-2 font-semibold';
const TD = 'px-5 py-2.5';

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-bold">{title}</h2>
        {note && <p className="text-sm text-stone-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-stone-400">{children}</p>;
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold text-rose-600">{children}</p>;
}

/** 모둠 하나의 학습지 기록 전체 (11-1). 평가 요소별 근거를 펼쳐 본다 */
function GroupDetails({ g }: { g: GroupSummary }) {
  const text = (t: string) => (t.trim() ? t : V.empty);
  const yn = (b: boolean) => (b ? V.yes : V.no);
  return (
    <details className="group border-t border-stone-100 px-5 py-3">
      <summary className="flex cursor-pointer items-center gap-2 text-base font-bold marker:content-none">
        <span className="text-stone-400 transition group-open:rotate-90" aria-hidden>›</span>
        {g.groupName}
        <span className="text-sm font-normal text-stone-400">{TEACHER.details}</span>
      </summary>
      <div className="mt-3 grid gap-4 pl-4 lg:grid-cols-2">
        <Dl rows={[
          [L.recall, g.intro.recall ? V[g.intro.recall] : V.empty],
          [L.fanReason, g.intro.fanReason ? S2.fanReason.choices[g.intro.fanReason] : V.empty],
          [L.fanPredict, g.intro.fanPredict ? S2.fanPredict.choices[g.intro.fanPredict] : V.empty],
        ]} title={L.intro} />

        {MISSION_ORDER.map((id) => {
          const m = g.missions[id];
          const s = MISSION_STRINGS[id];
          return (
            <Dl key={id} title={`${S3.places[id]} (${s.title})`} rows={[
              [L.prediction, m.prediction ? s.predictChoices[m.prediction] : V.empty],
              [L.built, `A ${yn(m.built.A)} · B ${yn(m.built.B)}`],
              [L.compare, m.compare ? s.compareChoices[m.compare] : V.empty],
              [L.explanation, text(m.explanation)],
              [TEACHER.columns.hints, `${m.hintCount} / ${m.attempts}`],
              ...(id === 'm1' ? [[L.challenge, V.challenge[m.challenge]] as [string, string]] : []),
            ]} />
          );
        })}

        <Dl title={S5.stepTitles.slice(1).join(' · ')} rows={[
          [L.groupThought, text(g.final.groupThought)],
          [L.explain, (Object.keys(g.final.explain) as PartKind[])
            .map((p) => {
              const v = g.final.explain[p];
              return `${S5.explain.questions[p].q.slice(0, 1)} ${v ? S5.explain.questions[p].choices[v] : V.empty}`;
            })
            .join(' · ')],
          [L.revisitFan, text(g.final.revisitFan)],
          [L.check, g.final.check ? V.check[g.final.check] : V.empty],
          ...(g.students.length > 0
            // 모둠으로 한 곳: 학생마다 한 줄씩
            ? [
              [L.misconception, g.students.map((st) => `${st.name}: ${oxLine(st.misconception)}`).join('\n')],
              [TEACHER.columns.selfEval, g.students
                .map((st) => `${st.name}: ${st.selfEval ? S5.selfEval.choices[st.selfEval] : V.empty}`).join('\n')],
            ] as [string, string][]
            : [
              [L.misconception, oxLine(g.final.misconception)],
              [TEACHER.columns.selfEval, g.final.selfEval ? S5.selfEval.choices[g.final.selfEval] : V.empty],
            ] as [string, string][]),
          [L.toCharacter, text(g.final.toCharacter)],
        ]} />
      </div>
    </details>
  );
}

/** 오개념 점검 세 문항: "1번 맞음 · 2번 틀림 · 3번 -" */
function oxLine(m: Record<'q1' | 'q2' | 'q3', 'correct' | 'wrong' | null>): string {
  return (['q1', 'q2', 'q3'] as const).map((k, i) => `${i + 1}번 ${m[k] ? V[m[k]!] : V.empty}`).join(' · ');
}

function Dl({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-bold text-amber-800">{title}</h3>
      <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-stone-500">{k}</dt>
            <dd className="whitespace-pre-wrap text-stone-800">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** 지도서 평가 요소와 상·중·하 기준. 참고 문구로만 보여 준다 */
function Rubric() {
  return (
    <details className="group rounded-2xl bg-white p-5 shadow-sm">
      <summary className="flex cursor-pointer items-center gap-2 text-lg font-bold marker:content-none">
        <span className="text-stone-400 transition group-open:rotate-90" aria-hidden>›</span>
        {TEACHER.rubricTitle}
      </summary>
      <div className="mt-3 flex flex-col text-sm">
        {TEACHER.rubric.map((r) => (
          <div key={r.element} className="flex flex-col gap-1 border-t border-stone-100 py-3 last:pb-0">
            <p className="font-bold">{r.element}</p>
            <p><span className="text-stone-500">{TEACHER.rubricLook}</span> {r.look}</p>
            <p><span className="text-stone-500">{TEACHER.rubricEvidence}</span> {r.evidence}</p>
            <ul className="ml-4 list-disc">
              {(['상', '중', '하'] as const).map((lv) => (
                <li key={lv}><b>{lv}</b> {r.criteria[lv]}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

interface ClassGroupRow {
  id: string;
  name: string;
  roomCode: string;
}

/** 모둠 미리 만들기: 학생은 입장 화면의 "모둠으로 하기"에서 이 모둠을 골라 들어온다 */
function GroupSetup({ pin }: { pin: string }) {
  const [groups, setGroups] = useState<ClassGroupRow[] | null>(null);
  const [count, setCount] = useState(6);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const call = async (method: 'GET' | 'POST' | 'DELETE', path = '/api/teacher/groups', body?: unknown) => {
    const res = await fetch(path, {
      method,
      headers: { 'x-teacher-pin': pin, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    }).catch(() => null);
    if (!res) throw new Error('서버에 연결할 수 없어요.');
    if (res.status === 204) return null;
    const json = (await res.json().catch(() => ({}))) as { groups?: ClassGroupRow[]; error?: string };
    if (!res.ok) throw new Error(json.error ?? `오류 ${res.status}`);
    return json.groups ?? null;
  };

  useEffect(() => {
    let cancelled = false;
    call('GET')
      .then((g) => !cancelled && setGroups(g ?? []))
      .catch((e: Error) => !cancelled && setMessage(e.message));
    return () => {
      cancelled = true;
    };
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    setBusy(true);
    setMessage(null);
    // 이미 있는 모둠 다음 번호부터 (1모둠~6모둠이 있으면 7모둠부터)
    const numbers = (groups ?? []).map((g) => Number.parseInt(g.name, 10)).filter((n) => Number.isFinite(n));
    const start = Math.max(0, ...numbers) + 1;
    const names = Array.from({ length: count }, (_, i) => TEACHER.setupName(start + i));
    try {
      setGroups(await call('POST', undefined, { names }));
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  };

  const remove = async (g: ClassGroupRow) => {
    if (!window.confirm(TEACHER.setupDeleteConfirm(g.name))) return;
    setBusy(true);
    setMessage(null);
    try {
      await call('DELETE', `/api/teacher/groups/${g.id}`);
      setGroups((list) => (list ?? []).filter((x) => x.id !== g.id));
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <Card title={TEACHER.setupTitle} note={TEACHER.setupGuide}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-600">
          {TEACHER.setupCount}
          <input type="number" min={1} max={12} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            className={`${INPUT} w-20`} />
        </label>
        <button type="button" disabled={busy} onClick={() => void create()} className={PRIMARY}>
          {TEACHER.setupCreate}
        </button>
      </div>
      {message && <ErrorText>{message}</ErrorText>}
      {groups && (groups.length === 0 ? (
        <Empty>{TEACHER.setupEmpty}</Empty>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <li key={g.id} className="flex items-center gap-1 rounded-full bg-stone-100 py-1 pl-3 pr-1 text-sm font-semibold">
              {g.name}
              <button type="button" disabled={busy} aria-label={TEACHER.setupDelete(g.name)} onClick={() => void remove(g)}
                className="flex size-7 items-center justify-center rounded-full text-stone-400 outline-none hover:bg-white hover:text-rose-600">
                ✕
              </button>
            </li>
          ))}
        </ul>
      ))}
    </Card>
  );
}
