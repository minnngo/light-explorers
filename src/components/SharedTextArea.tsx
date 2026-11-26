'use client';

// 모둠이 함께 쓰는 칸 (쓰는 중 잠금).
// 누군가 이 칸에 글자를 넣기 시작하면 다른 친구 화면에는 "민지 쓰는 중…"이 뜨고 그동안은 읽기만 된다.
// 쓰는 글자는 한 글자씩 모든 기기에 보이고, 칸을 벗어나거나 5초 동안 글자를 넣지 않으면 다른 친구가 이어 쓸 수 있다.
// 혼자 할 때는 보통 칸과 같다.
import { type InputHTMLAttributes, type TextareaHTMLAttributes, useCallback, useEffect, useRef } from 'react';
import { ROOM } from '@/data/strings';
import { editingOwner, memberColor } from '@/lib/sync/live';
import { useLive } from '@/lib/sync/LiveContext';
import type { Member } from '@/lib/sync/roomSync';
import { TextArea } from './ui';

/** 글자를 넣지 않은 채 이만큼 지나면 "쓰는 중"을 스스로 푼다 (칸에 커서만 남겨 두고 손을 떼도 친구가 이어 쓸 수 있게) */
const IDLE_RELEASE_MS = 5000;

/**
 * 쓰는 중 잠금: 이 칸을 지금 쓰고 있는 친구(내가 아니면)와, 칸에 달 쓰기·벗어나기.
 * - 잠금은 칸을 누를 때가 아니라 **실제로 글자를 넣기 시작할 때** 건다. 친구가 쓰는 중이라 잠긴 칸을
 *   눌러 보기만 해도 잠금을 가져가 버리면, 쓰던 친구가 갑자기 막히거나 친구가 다 쓰고 나가도
 *   (누르기만 한 내가 쓰는 사람으로 남아) 친구 화면이 계속 잠기기 때문이다.
 * - 칸을 벗어나거나, 글자를 넣지 않고 5초가 지나면 푼다 (태블릿은 다른 곳을 눌러도 칸을 벗어나지 않을 때가 있다).
 */
function useWritingLock(field: string, enabled: boolean) {
  const { peers, myId: liveId, publish, myEditing } = useLive();
  // 잠금을 쓰지 않는 칸(각자 쓰는 칸)은 혼자 할 때와 같다
  const myId = enabled ? liveId : null;
  const writer: Member | null = myId ? editingOwner(field, { id: myId, editing: myEditing }, peers) : null;

  const mineRef = useRef(false);
  useEffect(() => {
    mineRef.current = myEditing === field;
  }, [myEditing, field]);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const release = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = null;
    if (mineRef.current) publish({ editing: null });
  }, [publish]);
  // 쓰다가 다음 단계로 넘어가 칸이 사라지면 "쓰는 중"을 풀어 준다
  useEffect(() => release, [release]);

  return {
    writer,
    color: writer ? memberColor(writer.id) : undefined,
    /** 글자를 넣기 시작함: 아무도 안 쓰고 있으면 내가 쓰는 사람이 된다. 넣을 때마다 5초 타이머를 다시 잰다 */
    typing: () => {
      if (!myId || writer) return;
      if (!mineRef.current) {
        mineRef.current = true;
        publish({ editing: field });
      }
      if (idleRef.current) clearTimeout(idleRef.current);
      idleRef.current = setTimeout(release, IDLE_RELEASE_MS);
    },
    blur: release,
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

export default function SharedTextArea({ field, lock: useLock = true, readOnly, onChange, onCompositionStart, onBlur, ...props }:
  TextareaHTMLAttributes<HTMLTextAreaElement> & { field: string; lock?: boolean }) {
  const lock = useWritingLock(field, useLock);
  return (
    <div className="relative">
      <TextArea
        {...props}
        readOnly={readOnly || lock.writer !== null}
        aria-describedby={lock.writer ? `${field}-writer` : undefined}
        style={lock.writer ? { borderColor: lock.color, background: '#fbfaf7' } : undefined}
        // 한글은 조합이 시작될 때 먼저 잠근다 (글자가 완성되기 전에 친구가 끼어들지 않게)
        onCompositionStart={(e) => {
          lock.typing();
          onCompositionStart?.(e);
        }}
        onChange={(e) => {
          lock.typing();
          onChange?.(e);
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
export function SharedBlank({ field, lock: useLock = true, readOnly, onChange, onCompositionStart, onBlur, className = '', ...props }:
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
        onCompositionStart={(e) => {
          lock.typing();
          onCompositionStart?.(e);
        }}
        onChange={(e) => {
          lock.typing();
          onChange?.(e);
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
