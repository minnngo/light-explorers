'use client';

// 화면 공통 작은 부품. 버튼은 손가락으로 누르기 쉽게 최소 높이 44px(min-h-11).
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { FairyIcon } from '@/components/village/Characters';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const base =
    'min-h-11 rounded-2xl px-5 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-40';
  const look =
    variant === 'primary'
      ? 'bg-amber-700 text-white shadow hover:bg-amber-800'
      : 'border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
  return <button type="button" className={`${base} ${look} ${className}`} {...props} />;
}

/** 고르는 버튼. 고르면 앞에 ○표가 붙는다 (지도서의 ○표 형식). ○/× 문항처럼 표시가 겹치면 mark={false} */
export function Choice({
  selected,
  mark = true,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; mark?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`min-h-11 rounded-xl border-2 px-4 py-2 text-left transition disabled:cursor-not-allowed ${
        selected ? 'border-amber-500 bg-amber-100 font-bold' : 'border-slate-200 bg-white hover:border-amber-300'
      } ${className}`}
      {...props}
    >
      {selected && mark ? '○ ' : ''}
      {children}
    </button>
  );
}

/** 이야기 인물의 말풍선. speaker가 null이면 해설 */
export function Speech({ speaker, children }: { speaker: string | null; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {speaker && <FairyIcon className="size-12 shrink-0" />}
      <div className={`rounded-2xl px-4 py-3 ${speaker ? 'bg-white shadow' : 'bg-slate-100 italic'}`}>
        {speaker && <p className="text-sm font-bold text-amber-700">{speaker}</p>}
        <p>{children}</p>
      </div>
    </div>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 focus:border-amber-400 focus:outline-none"
      {...props}
    />
  );
}
