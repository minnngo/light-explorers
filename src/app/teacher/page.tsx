'use client';

// 교사용 화면: 왼쪽 메뉴(한눈에 보기 / 모둠 진행 / 기록 / 모둠 관리 / 평가 기준)로 한 화면씩 본다.
// 판정(상·중·하)은 교사가 한다. 이 화면은 근거 자료와 지도서 평가 요소를 참고로만 보여 준다 (명세서 11-2).
import { Fragment, type ReactNode, useCallback, useEffect, useState } from 'react';
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
  // 색은 앞의 기호에만. 글자는 다른 답과 같은 모양 (보통 굵기, 진한 회색)
  const color = ok === null ? 'text-stone-400' : ok ? 'text-[#3f7d58]' : 'text-rose-600';
  return (
    <span className="inline-flex items-start gap-1.5 text-stone-800">
      {ok === null ? (
        <span className={`shrink-0 ${color}`}>{V.empty}</span>
      ) : (
        // 글꼴 기호(✓✗) 대신 가는 선 그림: 글자 크기에 맞추고 첫 줄 가운데에 오게
        <svg viewBox="0 0 24 24" className={`mt-[0.2em] size-[1.1em] shrink-0 ${color}`} fill="none" stroke="currentColor"
          strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={ok ? V.correct : V.wrong}>
          {ok ? <path d="M4.5 12.5l5 5L19.5 7" /> : <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />}
        </svg>
      )}
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

/**
 * 한눈에 보기: 꼭 필요한 세 가지만
 *  1) 미션별 완료한 모둠, 마무리를 마친 사람 (숫자 카드)  2) 미션별 예상 정답률  3) 마무리 퀴즈 정답률
 */
function Overview({ data }: { data: ClassSummary }) {
  const st = classStats(data);
  const missionRows = (rates: Record<MissionId, Rate>) =>
    MISSION_ORDER.map((id) => ({ label: S3.places[id], ...rates[id] }));
  const parts: PartKind[] = ['bulb', 'buzzer', 'motor'];
  return (
    <div className="flex flex-col gap-5">
      {/* 가로로 늘어선 숫자 카드 (미션마다 완료한 모둠, 마무리를 마친 사람) */}
      <section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {MISSION_ORDER.map((id) => (
            <StatTile key={id} label={T.chart.missionDoneRow(S3.places[id])} hit={st.missionDone[id].hit} of={st.missionDone[id].of} />
          ))}
          <StatTile label={T.chart.finishedRow} hit={st.finishedLearners} of={st.learners} />
        </div>
      </section>
      <Card title={T.chart.prediction}>
        <BarList wide rows={missionRows(st.predictionRight)} />
      </Card>
      <Card title={T.chart.quiz}>
        <BarList wide rows={[
          ...parts.map((p) => ({ label: T.chart.quizExplain(T.chart.explainShort[p]), title: S5.explain.questions[p].q, ...st.explain[p] })),
          { label: T.chart.quizCheck, title: `${S5.check.before}…${S5.check.after}`, ...st.check },
          ...S5.misconception.items.map((item, i) => ({
            label: T.chart.misconceptionShort[i], title: item.text, ...st.misconception[item.key],
          })),
        ]} />
      </Card>
    </div>
  );
}

/** 숫자 카드: "3/5"를 크게, 아래에 비율 막대를 얇게 */
function StatTile({ label, hit, of }: { label: string; hit: number; of: number }) {
  const pct = of ? Math.round((hit / of) * 100) : 0;
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-stone-800">{hit}<span className="text-xl text-stone-400">/{of}</span></span>
        <span className="text-sm tabular-nums text-stone-500">{pct}%</span>
      </p>
      <span className="h-1.5 overflow-hidden rounded-full bg-stone-100" aria-hidden>
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: BAR }} />
      </span>
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
          <li key={r.label} className={`grid items-center gap-3 text-sm ${wide ? 'grid-cols-[19rem_1fr_auto]' : 'grid-cols-[6.5rem_1fr_auto]'}`}
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
    <Card title={T.progressTitle}>
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className={TH}>{T.columns.group}</th>
              <th className={TH}>{T.columns.lastActive}</th>
              <th className={TH}>{T.columns.where}</th>
              <th className={TH} title={T.columnHelp.revived}>{T.columns.revived}</th>
              {MISSION_ORDER.map((id) => <th key={id} className={TH} title={T.columnHelp.hints}>{S3.places[id]} {T.columns.hints}</th>)}
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
      {rows.map((g) => <GroupRecord key={g.groupId} g={g} />)}
      <Pager {...pager} />
    </div>
  );
}

/** 모둠 한 곳: 도입 표(질문 3칸)와 미션 표(항목 × 미션 3칸). 맞았는지는 글자 앞 ✓·✗로 */
function GroupRecord({ g }: { g: GroupSummary }) {
  const intro = g.intro;
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-bold">{g.groupName}</h2>
        <span className="text-sm text-stone-500">{T.lastActive(timeOf(g.updatedAt))}</span>
      </header>
      <RecordTable head={L.intro} cols={[
        // 열 이름은 짧게, 마우스를 올리면 실제 질문 전체
        <span key="r" title={`${S2.recall.before} ( ) ${S2.recall.after}`}>{L.recall}</span>,
        <span key="f" title={S2.fanReason.question}>{L.fanReason}</span>,
        <span key="p" title={S2.fanPredict.question}>{L.fanPredict}</span>,
      ]} rows={[{
        label: L.answer,
        tones: [intro.recall === null ? null : intro.recall === 'correct'],
        cells: [
          <Mark key="r" ok={intro.recall === null ? null : intro.recall === 'correct'}>
            {intro.recall ? S2.recall.choices[intro.recall] : undefined}
          </Mark>,
          (intro.fanReason && S2.fanReason.choices[intro.fanReason]) || <Blank />,
          (intro.fanPredict && S2.fanPredict.choices[intro.fanPredict]) || <Blank />,
        ],
      }]} />
      <MissionTable g={g} />
    </section>
  );
}

/** 맞음·틀림 칸 바탕색 */
function toneBg(tone: boolean | null | undefined) {
  return tone === true ? 'bg-emerald-50' : tone === false ? 'bg-rose-50' : '';
}

/** 표 칸이 비었을 때 */
function Blank() {
  return <span className="text-stone-400">{V.empty}</span>;
}

/** 기록 표: 왼쪽 항목 이름 열 + 같은 너비의 칸들. 긴 글은 칸 안에서 줄바꿈 */
function RecordTable({ head, cols, rows }: {
  head: string; cols: ReactNode[];
  /** tones: 칸 바탕색 (true 맞음 = 연한 초록, false 틀림 = 연한 빨강, null·없음 = 흰색) */
  rows: { label: string; help?: string; cells: ReactNode[]; tones?: (boolean | null)[] }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200">
      <table className="w-full min-w-[44rem] table-fixed text-sm">
        <colgroup>
          <col className="w-32" />
          {cols.map((_, i) => <col key={i} />)}
        </colgroup>
        <thead className="bg-stone-50 text-left">
          <tr>
            <th className="px-4 py-2.5 font-bold text-amber-800">{head}</th>
            {cols.map((c, i) => <th key={i} className="border-l border-stone-200 px-4 py-2.5 font-semibold text-stone-700">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-stone-200 align-top">
              {/* 설명은 화면에 쓰지 않고 마우스를 올리면 보이게 */}
              <th scope="row" title={r.help} className="px-4 py-2.5 text-left font-semibold text-stone-700">{r.label}</th>
              {r.cells.map((c, i) => (
                <td key={i} className={`border-l border-stone-200 px-4 py-2.5 leading-snug text-stone-800 [overflow-wrap:anywhere] ${toneBg(r.tones?.[i])}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 미션 표: 줄은 항목(예상·정상 연결·○표 비교·힌트/시도·도전·모둠 이유), 칸은 미션 세 개 */
function MissionTable({ g }: { g: GroupSummary }) {
  const each = (f: (id: MissionId) => ReactNode) => MISSION_ORDER.map((id) => <Fragment key={id}>{f(id)}</Fragment>);
  const cols = MISSION_ORDER.map((id) => {
    const st = g.missions[id].status;
    const status = st === 'done' ? '완료' : st === 'open' ? '진행 중' : '잠김';
    const color = st === 'done' ? 'text-[#3f7d58]' : st === 'open' ? 'text-amber-700' : 'text-stone-400';
    return (
      <span key={id} className="flex items-baseline justify-between gap-2">
        {S3.places[id]}<span className={`text-xs font-bold ${color}`}>{status}</span>
      </span>
    );
  });
  const R = T.missionRows;
  const rows = [
    { ...R.prediction, tones: MISSION_ORDER.map((id) => {
      const p = g.missions[id].prediction;
      return p ? p === MISSIONS[id].correctPrediction : null;
    }), cells: each((id) => {
      const m = g.missions[id];
      return <Mark ok={m.prediction ? m.prediction === MISSIONS[id].correctPrediction : null}>
        {m.prediction ? MISSION_STRINGS[id].predictChoices[m.prediction] : undefined}
      </Mark>;
    }) },
    // 회로 완성: 둘 다 이었으면 초록, 미션을 마쳤는데 못 이은 게 있으면 빨강 (진행 중·잠김은 흰색)
    { ...R.built, tones: MISSION_ORDER.map((id) => {
      const m = g.missions[id];
      return m.built.A && m.built.B ? true : m.status === 'done' ? false : null;
    }), cells: each((id) => (
      <span className="flex gap-4"><Mark ok={g.missions[id].built.A}>A</Mark><Mark ok={g.missions[id].built.B}>B</Mark></span>
    )) },
    { ...R.compare, tones: MISSION_ORDER.map((id) => {
      const c = g.missions[id].compare;
      return c ? c === MISSIONS[id].correctCompare : null;
    }), cells: each((id) => {
      const m = g.missions[id];
      return <Mark ok={m.compare ? m.compare === MISSIONS[id].correctCompare : null}>
        {m.compare ? MISSION_STRINGS[id].compareChoices[m.compare] : undefined}
      </Mark>;
    }) },
    // 힌트 3번 이상은 빨간 숫자로 (도움이 필요했던 모둠)
    { ...R.hints, cells: each((id) => {
      const m = g.missions[id];
      return <span className={`tabular-nums ${m.hintCount >= 3 ? 'text-rose-600' : ''}`}>{m.hintCount} / {m.attempts}</span>;
    }) },
    { ...R.challenge, cells: each((id) => (id === 'm1' ? V.challenge[g.missions[id].challenge] : <Blank />)) },
    { ...R.explanation, cells: each((id) => {
      const t = g.missions[id].explanation.trim();
      return t ? <span className="whitespace-pre-wrap">{t}</span> : <Blank />;
    }) },
  ];
  return <RecordTable head={L.mission} cols={cols} rows={rows} />;
}

/** 개인 마무리 기록: 한 사람이 한 줄 */
function PersonalRecords({ learners }: { learners: Learner[] }) {
  const { rows, ...pager } = usePages(learners, 10);
  const C = T.personalCols;
  const parts: PartKind[] = ['bulb', 'buzzer', 'motor'];
  return (
    <Card title={T.recordTabs.personal}>
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className={TH}>{C.group}</th>
              <th className={TH}>{C.name}</th>
              <th className={TH}>{C.progress}</th>
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
                  {l.finished ? <Mark ok><span>{L.finished}</span></Mark> : T.stepOf(Math.min(l.wrapupStep + 1, WRAPUP_STEP_COUNT - 1), WRAPUP_STEP_COUNT - 1)}
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
