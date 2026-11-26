// 교사용 화면(/teacher)의 브라우저 탭 제목. 화면(page.tsx)은 'use client'라서 제목은 여기서 정한다
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '불빛 탐험대(교사용)',
};

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return children;
}
