'use client';

// 화면 공통 작은 부품. 버튼은 손가락으로 누르기 쉽게 최소 높이 44px(min-h-11).
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FairyIcon } from '@/components/village/Characters';
import { playOpen } from '@/media/sound';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const base =
    'min-h-11 rounded-2xl px-5 py-2 font-bold transition outline-none disabled:cursor-not-allowed disabled:opacity-40';
  const look =
    variant === 'primary'
      ? 'border-2 border-amber-700 bg-amber-700 text-white hover:border-amber-800 hover:bg-amber-800'
      : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50';
  return <button type="button" className={`${base} ${look} ${className}`} {...props} />;
}

/** 고르는 버튼. 고르면 노란 바탕과 주황 테두리로 표시된다. mark를 주면 앞에 ○표도 붙는다 */
export function Choice({
  selected,
  mark = false,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; mark?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`min-h-11 rounded-xl px-4 py-2 text-left outline-none transition disabled:cursor-not-allowed ${
        selected ? 'bg-amber-100 font-bold ring-2 ring-amber-500' : 'bg-[#f6efdf] hover:bg-amber-50 hover:ring-2 hover:ring-amber-300'
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
      <div className={`flex-1 rounded-2xl px-4 py-3 ${speaker ? 'bg-white shadow' : 'bg-white italic'}`}>
        {speaker && <p className="text-sm font-bold text-amber-700">{speaker}</p>}
        <p className="whitespace-pre-line">{children}</p>
      </div>
    </div>
  );
}

/** 진행 점: 지금 칸이 길쭉해진다. 넘길 때 앞 칸은 줄고 다음 칸은 늘어나며 흘러가듯 옮겨 간다 */
export function ProgressDots({ count, index }: { count: number; index: number }) {
  return (
    <span className="flex items-center gap-1.5" role="img" aria-label={`${index + 1} / ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i}
          className={`h-2 rounded-full transition-[width,background-color] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            i === index ? 'w-6 bg-amber-500' : 'w-2 bg-stone-200'
          }`} />
      ))}
    </span>
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

/** 앱 스타일 확인 창 (브라우저 기본 확인창 대신). Esc나 바깥을 누르면 취소 */
export function ConfirmDialog({
  open,
  title,
  body,
  okLabel,
  cancelLabel,
  onOk,
  onCancel,
  danger = false,
}: {
  open: boolean;
  title: string;
  body: string;
  okLabel: string;
  cancelLabel: string;
  onOk: () => void;
  onCancel: () => void;
  /** 지우기처럼 되돌릴 수 없는 일: 확인 버튼을 빨갛게 */
  danger?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus(); // 실수로 Enter를 눌러도 기록이 지워지지 않게 취소에 먼저 둔다
    playOpen();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);
  if (!open) return null;
  // 화면 맨 바깥(body)에 그린다: 부모의 "누르기 통과"(pointer-events-none)나 쌓임 순서에 영향받지 않게
  return createPortal(
    <div className="modal-fade pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body"
        className="modal-rise flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-white px-6 pb-6 pt-7 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="text-xl font-black">{title}</h2>
        <p id="confirm-body" className="whitespace-pre-line text-base text-slate-600">{body}</p>
        <div className="mt-2 grid w-full grid-cols-2 gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel}
            className="min-h-11 rounded-2xl bg-stone-100 font-bold text-stone-700 outline-none transition hover:bg-stone-200">
            {cancelLabel}
          </button>
          <button type="button" onClick={onOk}
            className={`min-h-11 rounded-2xl font-bold text-white outline-none transition ${
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-700 hover:bg-amber-800'
            }`}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** 팝업 오른쪽 위의 ✕ (모든 떠 있는 창에서 언제든 닫을 수 있게) */
export function CloseButton({ onClick, label = '닫기', className = '' }: { onClick: () => void; label?: string; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={`absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-stone-500 shadow-sm outline-none transition hover:bg-white hover:text-stone-800 ${className}`}>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.4}
        strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
