// 명세서 14장 그림 목록. 지금은 이모지로 임시 표시하고, 그림 파일이 준비되면 여기만 바꾼다.
// 예: place.m1.on: '/images/streetlight-on.png' 로 바꾸고 화면에서 <img>로 그리기
import type { MissionId } from '@/lib/types';

export const PLACE_ICONS: Record<MissionId, { off: string; on: string }> = {
  m1: { off: '🏮', on: '💡' }, // A2 가로등
  m2: { off: '🔕', on: '🔔' }, // A2 안내 종
  m3: { off: '🌫️', on: '🌬️' }, // A2 풍차
};

/** A4 도입 컷 5장 */
export const INTRO_CUT_ART = ['🏠💡', '🌃🏮🔔🌬️', '🔋💡🔌', '🌀🔦📺', '🗺️✨'];

export const CHARACTER_ART = '🧒'; // A3 이야기 인물
export const GLOVE_ART = '🧤'; // A5 절연 장갑 (S1에서만)
export const VILLAGE_ART = { dark: '🌑🏘️', bright: '🌕🏘️✨' }; // A1 마을 배경
