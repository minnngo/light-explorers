import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  // 링크 미리보기 그림(opengraph-image.png)의 전체 주소를 만들 때 쓰는 기본 주소
  metadataBase: new URL('https://light-explorers.vercel.app'),
  title: '불빛 탐험대',
  description: '꺼진 반짝마을을 전지로 다시 밝혀요! 6학년 과학 · 전지의 개수에 따른 전기 회로 탐험 게임',
  openGraph: {
    title: '불빛 탐험대: 꺼진 마을을 밝혀라',
    description: '꺼진 반짝마을을 전지로 다시 밝혀요! 6학년 과학 · 전지의 개수에 따른 전기 회로 탐험 게임',
    siteName: '불빛 탐험대',
    locale: 'ko_KR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
