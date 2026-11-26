'use client';

// 교사용 화면: 왼쪽 메뉴(한눈에 보기 / 모둠 진행 / 기록 / 모둠 관리 / 평가 기준)로 한 화면씩 본다.
// 판정(상·중·하)은 교사가 한다. 이 화면은 근거 자료와 지도서 평가 요소를 참고로만 보여 준다 (명세서 11-2).
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { MISSION_ORDER, MISSIONS } from '@/data/missions';
import { COMMON, MISSION_STRINGS, S2, S3, S5, TEACHER } from '@/data/strings';
import { ConfirmDialog } from '@/components/ui';
import { FairyIcon } from '@/components/village/Characters';
import { WRAPUP_STEP_COUNT } from '@/lib/flow/screenFlow';
import { classStats, type Learner, learnersOf, type Rate } from '@/lib/teacher/stats';
import type { ClassSummary, GroupSummary } from '@/lib/teacher/summarize';
import type { MissionId, PartKind } from '@/lib/types';

const REFRESH_MS = 10_000;
const STEP_NAMES = { predict: '① 예상', build: '② 만들기', compare: '③ 비교·이유', confirm: '④ 확인' } as const;
const SCREEN_NAMES = { S1: '입장', S2: '도입', S3: '마을 지도', S4: '미션', S5: '마무리' } as const;
const L = TEACHER.labels;
const V = TEACHER.values;
const T = TEACHER;

type Section = keyof typeof TEACHER.nav;
const SECTIONS: Section[] = ['overview', 'progress', 'records', 'groups', 'rubric'];

export default function TeacherPage() {
  const [pin, setPin] = useState('');
  const [activePin, setActivePin] = useState<string | null>(null);
  const [data, setData] = useState<ClassSummary | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('overview');

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
        setLoadedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
    // 로그인: 흰 상자 가운데에 반디와 "불빛 탐험대 · 선생님용 화면", 비밀번호 칸
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="modal-rise flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-white px-8 py-10 shadow-xl">
          <div className="flex flex-col items-center gap-1 text-center">
            <FairyIcon className="bob size-16" />
            <p className="mt-1 text-sm font-bold text-amber-700">{T.loginApp}</p>
            <h1 className="text-2xl font-bold">{T.loginTitle}</h1>
          </div>
          <form className="flex w-full flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (pin) setActivePin(pin); }}>
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder={T.pinPlaceholder}
              aria-label={T.pinPlaceholder} autoFocus autoComplete="current-password" className={`${INPUT} min-h-12`} />
            {error && <ErrorText>{error}</ErrorText>}
            <button type="submit" disabled={!pin} className={`${PRIMARY} min-h-12 text-base`}>{T.enter}</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* 왼쪽 메뉴 (좁은 화면에서는 위쪽 가로 메뉴) */}
      <aside className="flex shrink-0 flex-col gap-1 border-stone-200 bg-white/80 p-3 md:sticky md:top-0 md:h-screen md:w-56 md:border-r md:p-4">
        <div className="mb-2 hidden flex-col gap-0.5 px-2 md:flex">
          <p className="text-lg font-bold">{TEACHER.title}</p>
          <p className="text-xs text-stone-500">{COMMON.appTitle}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible" aria-label={TEACHER.title}>
          {SECTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setSection(s)} aria-current={section === s ? 'page' : undefined}
              className={`flex min-h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 text-sm font-semibold outline-none transition ${
                section === s ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-stone-100'
              }`}>
              <NavIcon section={s} />
              {T.nav[s]}
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-1 px-2 pt-4 text-xs leading-relaxed text-stone-400 md:flex">
          {loadedAt && <p>{T.updatedAt(loadedAt)}</p>}
          <p>{T.refreshNote}</p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-8">
        <h1 className="text-2xl font-bold">{T.nav[section]}</h1>
        {error && <ErrorText>{error}</ErrorText>}
        {section === 'groups' && <GroupSetup pin={activePin} />}
        {section === 'rubric' && <Rubric />}
        {section !== 'groups' && section !== 'rubric' && (data === null ? null : data.groups.length === 0 ? (
          <Card title={T.noGroups}><Empty>{T.setupGuide}</Empty></Card>
        ) : (
          <>
            {section === 'overview' && <Overview data={data} />}
            {section === 'progress' && <Progress groups={data.groups} />}
            {section === 'records' && <Records groups={data.groups} />}
          </>
        ))}
      </main>
    </div>
  );
}

// ───── 공통 모양: 카드 제목 18px 굵게, 설명·표·기록은 14px, 라벨은 회색 ─────
const INPUT = 'min-h-10 rounded-xl border-2 border-stone-200 bg-white px-3 text-base focus:border-amber-400 focus:outline-none';
const PRIMARY = 'min-h-10 rounded-xl bg-amber-700 px-4 text-sm font-bold text-white outline-none transition hover:bg-amber-800 disabled:opacity-50';
const TH = 'whitespace-nowrap px-3 py-2 font-semibold first:pl-5 last:pr-5';
const TD = 'px-3 py-2.5 first:pl-5 last:pr-5';
/** 막대 그래프 색 (한 가지 색: 크기만 보여 준다) */
const BAR = '#d97706';

function Card({ title, note, tag, children, className = '' }: {
  title: string; note?: string; tag?: 'mission' | 'wrapup'; children: ReactNode; className?: string;
}) {
  return (
    <section className={`flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ${className}`}>
      <div className="flex flex-col gap-0.5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          {/* 어느 활동의 데이터인지: [미션] 모둠이 함께 한 것 / [마무리] 각자 한 것 */}
          {tag && (
            <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
              tag === 'mission' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
            }`}>
              {tag === 'mission' ? T.chart.tagMission : T.chart.tagWrapup}
            </span>
          )}
          {title}
        </h2>
        {note && <p className="text-sm text-stone-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-stone-400">{children}</p>;
}

function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold text-rose-600">{children}</p>;
}

/** 메뉴 아이콘 (선 하나 굵기로 단순하게) */
function NavIcon({ section }: { section: Section }) {
  const d = {
    overview: 'M4 19V10M10 19V5M16 19v-7M22 19H2',
    progress: 'M4 6h16M4 12h16M4 18h10',
    records: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
    groups: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M17 8a2.5 2.5 0 1 1 0 5M18 15c2 .4 3 1.9 3 4',
    rubric: 'M9 11l2 2 4-4M5 4h14v16H5z',
  }[section];
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/**
 * 맞음/틀림/아직: 상자 없이 ✓(초록)·✗(빨강)·-(회색)를 글자 앞에 (색만으로 알리지 않도록 기호를 함께).
 * children이 없으면 "맞음/틀림"을 쓴다
 */
function Mark({ ok, children }: { ok: boolean | null; children?: ReactNode }) {
  const color = ok === null ? 'text-stone-400' : ok ? 'text-[#3f7d58]' : 'text-rose-600';
  return (
    <span className={`inline-flex items-baseline gap-1 font-semibold ${color}`}>
      <span aria-label={ok === null ? '아직' : ok ? V.correct : V.wrong}>{ok === null ? V.empty : ok ? '✓' : '✗'}</span>
      {children ?? (ok === null ? null : <span>{ok ? V.correct : V.wrong}</span>)}
    </span>
  );
}

/** 페이지 나누기: 한 쪽에 size개씩 */
function usePages<T>(items: T[], size: number) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages - 1);
  return { rows: items.slice(current * size, current * size + size), page: current, pages, setPage };
}

function Pager({ page, pages, setPage }: { page: number; pages: number; setPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const btn = 'min-h-9 min-w-9 rounded-lg px-2 text-sm font-semibold outline-none transition disabled:opacity-30';
  return (
    <nav className="flex items-center justify-center gap-1 pt-1" aria-label="페이지">
      <button type="button" className={`${btn} text-stone-600 hover:bg-stone-100`} disabled={page === 0} onClick={() => setPage(page - 1)}>
        ‹ {T.prev}
      </button>
      {Array.from({ length: pages }, (_, i) => (
        <button key={i} type="button" aria-current={i === page ? 'page' : undefined} onClick={() => setPage(i)}
          className={`${btn} ${i === page ? 'bg-amber-100 text-amber-900' : 'text-stone-500 hover:bg-stone-100'}`}>
          {i + 1}
        </button>
      ))}
      <button type="button" className={`${btn} text-stone-600 hover:bg-stone-100`} disabled={page === pages - 1} onClick={() => setPage(page + 1)}>
        {T.next} ›
      </button>
    </nav>
  );
}

// ───── 한눈에 보기 ─────

function Overview({ data }: { data: ClassSummary }) {
  const st = classStats(data);
  const doneMissions = MISSION_ORDER.reduce((n, id) => n + st.missionDone[id].hit, 0);
  const missionRows = (rates: Record<MissionId, Rate>) =>
    MISSION_ORDER.map((id) => ({ label: S3.places[id], ...rates[id] }));
  const parts: PartKind[] = ['bulb', 'buzzer', 'motor'];
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={T.stat.groups} value={`${st.groups}`} />
        <StatTile label={T.stat.missions} value={`${doneMissions}/${st.groups * MISSION_ORDER.length}`} />
        <StatTile label={T.stat.learners} value={`${st.learners}`} />
        <StatTile label={T.stat.finished} value={`${st.finishedLearners}/${st.learners}`} />
      </div>
      <ChartGroup title={T.chart.groupMission}>
        <Card tag="mission" title={T.chart.missionDone}><BarList rows={missionRows(st.missionDone)} /></Card>
        <Card tag="mission" title={T.chart.prediction}><BarList rows={missionRows(st.predictionRight)} /></Card>
        <Card tag="mission" title={T.chart.compare}><BarList rows={missionRows(st.compareRight)} /></Card>
        <Card tag="mission" title={T.chart.hints}>
          <BarList count rows={st.hintsByGroup.slice(0, 6).map((h) => ({
            label: h.group, hit: h.hints, of: Math.max(1, st.hintsByGroup[0]?.hints ?? 1), text: T.chart.hintsOf(h.hints, h.attempts),
          }))} />
        </Card>
      </ChartGroup>
      <ChartGroup title={T.chart.groupWrapup}>
        <Card tag="wrapup" title={T.chart.explain}>
          <BarList rows={parts.map((p) => ({ label: T.chart.explainShort[p], title: S5.explain.questions[p].q, ...st.explain[p] }))} />
        </Card>
        <Card tag="wrapup" title={T.chart.selfEval}>
          <BarList count rows={[
            ...(['good', 'needHelp', 'needPractice'] as const).map((k) => ({ label: S5.selfEval.choices[k], hit: st.selfEval[k], of: st.learners })),
            { label: T.chart.noneYet, hit: st.selfEval.none, of: st.learners },
          ]} />
        </Card>
        <Card tag="wrapup" title={T.chart.misconception} className="lg:col-span-2">
          <BarList wide rows={S5.misconception.items.map((item, i) => ({
            label: T.chart.misconceptionShort[i], title: item.text, ...st.misconception[item.key],
          }))} />
        </Card>
      </ChartGroup>
    </div>
  );
}

/** 그래프 묶음: 미션(모둠이 함께 한 것) / 마무리(각자 한 것) */
function ChartGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-stone-600">{title}</h2>
      <div className="grid gap-5 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className="text-3xl font-bold tabular-nums text-stone-800">{value}</p>
    </div>
  );
}

/**
 * 가로 막대 목록 (한 가지 색). 비율이면 "3/5 (60%)", count면 개수만 글자로 함께 적는다.
 * 마우스를 올리면 문항 전체 내용과 숫자가 보인다
 */
function BarList({ rows, count = false, wide = false }: {
  rows: { label: string; title?: string; hit: number; of: number; text?: string }[]; count?: boolean;
  /** 이름이 긴 항목 (오개념 문항 등) */
  wide?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => {
        const pct = r.of ? (r.hit / r.of) * 100 : 0;
        const text = r.text ?? (count ? T.chart.count(r.hit) : T.chart.rateOf(r.hit, r.of));
        return (
          <li key={r.label} className={`grid items-center gap-3 text-sm ${wide ? 'grid-cols-[15rem_1fr_auto]' : 'grid-cols-[6.5rem_1fr_auto]'}`}
            title={`${r.title ?? r.label} — ${text}`}>
            <span className="truncate font-semibold text-stone-700">{r.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-stone-100">
              <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: BAR }} />
            </span>
            <span className="whitespace-nowrap tabular-nums text-stone-500">{text}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ───── 모둠 진행 ─────

/** 마지막으로 저장된 시각 (오늘 수업이라 시:분만) */
function timeOf(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function where(g: GroupSummary): string {
  return `${SCREEN_NAMES[g.screen]}${g.currentMission ? ` · ${S3.places[g.currentMission]} ${g.currentStep ? STEP_NAMES[g.currentStep] : ''}` : ''}${
    g.finished ? ` · ${L.finished}` : ''}`;
}

function Progress({ groups }: { groups: GroupSummary[] }) {
  const { rows, ...pager } = usePages(groups, 8);
  return (
    <Card title={T.progressTitle} note={T.orderNote}>
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className={TH}>{T.columns.group}</th>
              <th className={TH}>{T.columns.lastActive}</th>
              <th className={TH}>{T.columns.where}</th>
              <th className={TH}>{T.columns.revived}</th>
              {MISSION_ORDER.map((id) => <th key={id} className={TH}>{S3.places[id]} {T.columns.hints}</th>)}
              <th className={TH}>{T.columns.wrote}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.groupId} className="border-b border-stone-100 align-top last:border-0">
                <td className={`${TD} font-bold`}>{g.groupName}</td>
                <td className={`${TD} whitespace-nowrap tabular-nums text-stone-500`}>{timeOf(g.updatedAt)}</td>
                <td className={TD}>{where(g)}</td>
                <td className={TD}>{g.revived}/3</td>
                {MISSION_ORDER.map((id) => (
                  <td key={id} className={`${TD} tabular-nums ${g.hintCount[id] >= 3 ? 'font-bold text-rose-600' : ''}`}>
                    {g.hintCount[id]} / {g.attempts[id]}
                  </td>
                ))}
                <td className={`${TD} tabular-nums`}>{g.wroteCount}/{g.writableCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager {...pager} />
    </Card>
  );
}

// ───── 기록: 모둠 기록(도입·미션) / 개인 마무리 기록 ─────

function Records({ groups }: { groups: GroupSummary[] }) {
  const [tab, setTab] = useState<'group' | 'personal'>('group');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-fit gap-1 rounded-2xl bg-stone-100 p-1" role="tablist">
        {(['group', 'personal'] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`min-h-9 rounded-xl px-4 text-sm font-bold outline-none transition ${
              tab === k ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}>
            {T.recordTabs[k]}
          </button>
        ))}
      </div>
      {tab === 'group' ? <GroupRecords groups={groups} /> : <PersonalRecords learners={learnersOf(groups)} />}
    </div>
  );
}

function GroupRecords({ groups }: { groups: GroupSummary[] }) {
  const { rows, ...pager } = usePages(groups, 3);
  return (
    <div className="flex flex-col gap-4">
      <p className="-mb-1 text-sm text-stone-500">{T.orderNote}</p>
      {rows.map((g) => <GroupRecord key={g.groupId} g={g} />)}
      <Pager {...pager} />
    </div>
  );
}

/** 모둠 한 곳: 도입 답 세 개와 미션 세 개를 나란히. 맞았는지는 글자 앞 ✓·✗로 */
function GroupRecord({ g }: { g: GroupSummary }) {
  const intro = g.intro;
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-bold">{g.groupName}</h2>
        <span className="text-sm text-stone-500">{where(g)} · {T.columns.revived} {g.revived}/3 · {T.lastActive(timeOf(g.updatedAt))}</span>
      </header>
      {/* 도입: 질문(작은 회색)과 답(굵게)을 세 칸으로 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-amber-800">{L.intro}</h3>
        <dl className="grid gap-3 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-3">
          <IntroAnswer q={L.recall}>
            <Mark ok={intro.recall === null ? null : intro.recall === 'correct'}>
              {intro.recall ? <span className="text-stone-800">{S2.recall.choices[intro.recall]}</span> : undefined}
            </Mark>
          </IntroAnswer>
          <IntroAnswer q={L.fanReason}>{(intro.fanReason && S2.fanReason.choices[intro.fanReason]) || V.empty}</IntroAnswer>
          <IntroAnswer q={L.fanPredict}>{(intro.fanPredict && S2.fanPredict.choices[intro.fanPredict]) || V.empty}</IntroAnswer>
        </dl>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {MISSION_ORDER.map((id) => <MissionRecordCard key={id} id={id} g={g} />)}
      </div>
    </section>
  );
}

function IntroAnswer({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-stone-500">{q}</dt>
      <dd className="font-semibold leading-snug text-stone-800">{children}</dd>
    </div>
  );
}

function MissionRecordCard({ id, g }: { id: MissionId; g: GroupSummary }) {
  const m = g.missions[id];
  const s = MISSION_STRINGS[id];
  const status = m.status === 'done' ? '완료' : m.status === 'open' ? '진행 중' : '잠김';
  const statusColor = m.status === 'done' ? 'text-[#3f7d58]' : m.status === 'open' ? 'text-amber-700' : 'text-stone-400';
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-stone-200 p-4 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold">{S3.places[id]}</h3>
        <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
      </div>
      {/* 왼쪽 항목 이름, 오른쪽 답 (긴 글은 칸 안에서 줄바꿈) */}
      <dl className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-3 gap-y-2 leading-snug">
        <dt className="text-stone-500">{L.prediction}</dt>
        <dd className="break-keep">
          <Mark ok={m.prediction ? m.prediction === MISSIONS[id].correctPrediction : null}>
            {m.prediction ? <span className="font-normal text-stone-800">{s.predictChoices[m.prediction]}</span> : undefined}
          </Mark>
        </dd>
        <dt className="text-stone-500">{L.built}</dt>
        <dd className="flex gap-3">
          <Mark ok={m.built.A}><span className="text-stone-800">A</span></Mark>
          <Mark ok={m.built.B}><span className="text-stone-800">B</span></Mark>
        </dd>
        <dt className="text-stone-500">{L.compare}</dt>
        <dd>
          <Mark ok={m.compare ? m.compare === MISSIONS[id].correctCompare : null}>
            {m.compare ? <span className="text-stone-800">{s.compareChoices[m.compare]}</span> : undefined}
          </Mark>
        </dd>
        <dt className="text-stone-500">{T.columns.hints}</dt>
        <dd className={`tabular-nums ${m.hintCount >= 3 ? 'font-bold text-rose-600' : 'text-stone-800'}`}>{m.hintCount} / {m.attempts}</dd>
        {id === 'm1' && (
          <>
            <dt className="text-stone-500">{T.challengeShort}</dt>
            <dd className="text-stone-800">{V.challenge[m.challenge]}</dd>
          </>
        )}
      </dl>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-stone-500">{L.explanation}</span>
        <p className={`break-keep rounded-lg px-3 py-2 leading-relaxed ${m.explanation.trim() ? 'bg-amber-50 text-stone-800' : 'bg-stone-50 text-stone-400'}`}>
          {m.explanation.trim() || V.empty}
        </p>
      </div>
    </div>
  );
}

/** 개인 마무리 기록: 한 사람이 한 줄 */
function PersonalRecords({ learners }: { learners: Learner[] }) {
  const { rows, ...pager } = usePages(learners, 10);
  const C = T.personalCols;
  const parts: PartKind[] = ['bulb', 'buzzer', 'motor'];
  return (
    <Card title={T.recordTabs.personal} note={T.personalNote}>
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className={TH}>{C.group}</th>
              <th className={TH}>{C.name}</th>
              <th className={TH}>{C.progress}</th>
              <th className={TH}>{C.share}</th>
              <th className={TH}>{C.explain}</th>
              <th className={TH}>{C.check}</th>
              <th className={TH}>{C.mis}</th>
              <th className={TH}>{C.selfEval}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.key} className="border-b border-stone-100 align-top last:border-0">
                <td className={`${TD} whitespace-nowrap text-stone-500`}>{l.group}</td>
                <td className={`${TD} whitespace-nowrap font-bold`}>{l.name}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  {l.finished ? <Mark ok><span>{L.finished}</span></Mark> : T.stepOf(l.wrapupStep + 1, WRAPUP_STEP_COUNT)}
                </td>
                <td className={`${TD} min-w-40 max-w-60`}>
                  {l.final.shareBlanks?.some((b) => b.trim())
                    ? <span className="break-keep leading-relaxed text-stone-800">{l.final.shareBlanks.map((b) => b.trim() || V.empty).join(' / ')}</span>
                    : <span className="text-stone-400">{l.final.groupThought.trim() || V.empty}</span>}
                </td>
                <td className={TD}>
                  <span className="flex gap-3">
                    {parts.map((p, i) => {
                      const v = l.final.explain[p];
                      return <Mark key={p} ok={v === null ? null : v === 'more'}>{i + 1}</Mark>;
                    })}
                  </span>
                </td>
                <td className={TD}><Mark ok={l.final.check === null ? null : l.final.check === 'brighter'} /></td>
                <td className={TD}>
                  <span className="flex gap-3">
                    {(['q1', 'q2', 'q3'] as const).map((k, i) => {
                      const r = l.final.misconception[k];
                      return <Mark key={k} ok={r === null ? null : r === 'correct'}>{i + 1}</Mark>;
                    })}
                  </span>
                </td>
                <td className={`${TD} whitespace-nowrap`}>{l.final.selfEval ? S5.selfEval.choices[l.final.selfEval] : V.empty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager {...pager} />
    </Card>
  );
}

/** 지도서 평가 요소와 상·중·하 기준. 참고 문구로만 보여 준다 */
function Rubric() {
  return (
    <Card title={T.rubricTitle}>
      <div className="flex flex-col text-sm">
        {T.rubric.map((r) => (
          <div key={r.element} className="flex flex-col gap-1 border-t border-stone-100 py-3 first:border-0 first:pt-0 last:pb-0">
            <p className="font-bold">{r.element}</p>
            <p><span className="text-stone-500">{T.rubricLook}</span> {r.look}</p>
            <p><span className="text-stone-500">{T.rubricEvidence}</span> {r.evidence}</p>
            <ul className="ml-4 list-disc">
              {(['상', '중', '하'] as const).map((lv) => (
                <li key={lv}><b>{lv}</b> {r.criteria[lv]}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
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

  // 지우기 확인 창 (브라우저 기본 확인창 대신 앱 모양 창)
  const [confirming, setConfirming] = useState<ClassGroupRow | null>(null);
  const closeConfirm = useCallback(() => setConfirming(null), []);

  const remove = async (g: ClassGroupRow) => {
    setConfirming(null);
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
              <button type="button" disabled={busy} aria-label={TEACHER.setupDelete(g.name)} onClick={() => setConfirming(g)}
                className="flex size-7 items-center justify-center rounded-full text-stone-400 outline-none hover:bg-white hover:text-rose-600">
                ✕
              </button>
            </li>
          ))}
        </ul>
      ))}
      <ConfirmDialog open={confirming !== null} danger
        title={confirming ? TEACHER.setupDeleteTitle(confirming.name) : ''} body={TEACHER.setupDeleteBody}
        okLabel={TEACHER.setupDeleteOk} cancelLabel={TEACHER.setupDeleteCancel}
        onOk={() => confirming && void remove(confirming)} onCancel={closeConfirm} />
    </Card>
  );
}
