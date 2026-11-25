'use client';

// 모둠이 함께 쓰는 칸 (쓰는 중 잠금).
// 누군가 이 칸을 누르면 다른 친구 화면에는 "민지 쓰는 중…"이 뜨고 그동안은 읽기만 된다.
// 쓰는 글자는 한 글자씩 모든 기기에 보이고, 다 쓰고 칸을 벗어나면 다른 친구가 이어 쓸 수 있다.
// 혼자 할 때는 보통 칸과 같다.
import { type InputHTMLAttributes, type TextareaHTMLAttributes, useEffect, useRef } from 'react';
import { ROOM } from '@/data/strings';
import { editingOwner, memberColor } from '@/lib/sync/live';
import { useLive } from '@/lib/sync/LiveContext';
import type { Member } from '@/lib/sync/roomSync';
import { TextArea } from './ui';

/** 쓰는 중 잠금: 이 칸을 지금 쓰고 있는 친구(내가 아니면)와, 칸에 달 누르기·벗어나기 */
function useWritingLock(field: string, enabled: boolean) {
  const { peers, myId: liveId, publish, myEditing } = useLive();
  // 잠금을 쓰지 않는 칸(각자 쓰는 칸)은 혼자 할 때와 같다
  const myId = enabled ? liveId : null;
  const writer: Member | null = myId ? editingOwner(field, { id: myId, editing: myEditing }, peers) : null;

  // 쓰다가 다음 단계로 넘어가 칸이 사라지면 "쓰는 중"을 풀어 준다
  const mineRef = useRef(false);
  useEffect(() => {
    mineRef.current = myEditing === field;
  }, [myEditing, field]);
  useEffect(() => () => {
    if (mineRef.current) publish({ editing: null });
  }, [publish]);

  return {
    writer,
    color: writer ? memberColor(writer.id) : undefined,
    focus: () => myId && publish({ editing: field }),
    blur: () => myId && myEditing === field && publish({ editing: null }),
  };
}

/** "민지 쓰는 중…" 표시 (칸 위에 친구 색으로) */
function WriterBadge({ id, name, color, className = '' }: { id: string; name: string; color?: string; className?: string }) {
  return (
    <span id={id} role="status"
      className={`pop-in pointer-events-none absolute z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-bold text-white shadow-sm ${className}`}
      style={{ background: color }}>
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}
        strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 20h4L19 9l-4-4L4 16z" />
      </svg>
      {ROOM.writing(name)}
    </span>
  );
}

export default function SharedTextArea({ field, lock: useLock = true, readOnly, onFocus, onBlur, ...props }:
  TextareaHTMLAttributes<HTMLTextAreaElement> & { field: string; lock?: boolean }) {
  const lock = useWritingLock(field, useLock);
  return (
    <div className="relative">
      <TextArea
        {...props}
        readOnly={readOnly || lock.writer !== null}
        aria-describedby={lock.writer ? `${field}-writer` : undefined}
        style={lock.writer ? { borderColor: lock.color, background: '#fbfaf7' } : undefined}
        onFocus={(e) => {
          lock.focus();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          lock.blur();
          onBlur?.(e);
        }}
      />
      {lock.writer && (
        <WriterBadge id={`${field}-writer`} name={lock.writer.name} color={lock.color} className="-top-3 right-3" />
      )}
    </div>
  );
}

/** 문장 속 빈칸에 바로 쓰는 한 줄 칸 (쓰는 중 잠금 포함) */
export function SharedBlank({ field, lock: useLock = true, readOnly, onFocus, onBlur, className = '', ...props }:
  InputHTMLAttributes<HTMLInputElement> & { field: string; lock?: boolean }) {
  const lock = useWritingLock(field, useLock);
  return (
    <span className="relative mx-1 inline-block align-middle">
      <input
        {...props}
        readOnly={readOnly || lock.writer !== null}
        aria-describedby={lock.writer ? `${field}-writer` : undefined}
        style={lock.writer ? { borderColor: lock.color, background: '#fbfaf7' } : undefined}
        className={`h-9 w-36 rounded-lg border-2 border-amber-300 bg-amber-50 px-2 text-center font-bold text-amber-900 focus:border-amber-500 focus:bg-white focus:outline-none ${className}`}
        onFocus={(e) => {
          lock.focus();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          lock.blur();
          onBlur?.(e);
        }}
      />
      {lock.writer && (
        <WriterBadge id={`${field}-writer`} name={lock.writer.name} color={lock.color} className="left-1/2 top-full mt-1 -translate-x-1/2" />
      )}
    </span>
  );
}
