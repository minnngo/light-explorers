'use client';

// 모둠이 함께 쓰는 서술형 칸 (쓰는 중 잠금).
// 누군가 이 칸을 누르면 다른 친구 화면에는 "민지 쓰는 중…"이 뜨고 그동안은 읽기만 된다.
// 쓰는 글자는 지금처럼 한 글자씩 모든 기기에 보이고, 다 쓰고 칸을 벗어나면 다른 친구가 이어 쓸 수 있다.
// 혼자 할 때는 보통 칸과 같다.
import { type TextareaHTMLAttributes, useEffect, useRef } from 'react';
import { ROOM } from '@/data/strings';
import { editingOwner, memberColor } from '@/lib/sync/live';
import { useLive } from '@/lib/sync/LiveContext';
import { TextArea } from './ui';

export default function SharedTextArea({ field, readOnly, onFocus, onBlur, ...props }:
  TextareaHTMLAttributes<HTMLTextAreaElement> & { field: string }) {
  const { peers, myId, publish, myEditing } = useLive();
  const writer = myId ? editingOwner(field, { id: myId, editing: myEditing }, peers) : null;
  const color = writer ? memberColor(writer.id) : undefined;

  // 쓰다가 다음 단계로 넘어가 칸이 사라지면 "쓰는 중"을 풀어 준다
  const mineRef = useRef(false);
  useEffect(() => {
    mineRef.current = myEditing === field;
  }, [myEditing, field]);
  useEffect(() => () => {
    if (mineRef.current) publish({ editing: null });
  }, [publish]);

  return (
    <div className="relative">
      <TextArea
        {...props}
        readOnly={readOnly || writer !== null}
        aria-describedby={writer ? `${field}-writer` : undefined}
        style={writer ? { borderColor: color, background: '#fbfaf7' } : undefined}
        onFocus={(e) => {
          if (myId) publish({ editing: field });
          onFocus?.(e);
        }}
        onBlur={(e) => {
          if (myId && myEditing === field) publish({ editing: null });
          onBlur?.(e);
        }}
      />
      {writer && (
        <span id={`${field}-writer`} role="status"
          className="pop-in absolute -top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-bold text-white shadow-sm"
          style={{ background: color }}>
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 20h4L19 9l-4-4L4 16z" />
          </svg>
          {ROOM.writing(writer.name)}
        </span>
      )}
    </div>
  );
}
