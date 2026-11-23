'use client';

import dynamic from 'next/dynamic';
import { COMMON } from '@/data/strings';

// 학생 앱은 localStorage에서 기록을 불러오므로 브라우저에서만 그린다 (서버 렌더링과 어긋나지 않게).
const StudentApp = dynamic(() => import('./StudentApp'), {
  ssr: false,
  loading: () => <p className="m-auto text-xl">{COMMON.loading}</p>,
});

export default function StudentAppLoader() {
  return <StudentApp />;
}
