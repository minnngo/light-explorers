// 명세서 14장 그림 목록. 지금은 이모지로 임시 표시하고, 그림 파일이 준비되면 여기만 바꾼다.
// 예: place.m1.on: '/images/streetlight-on.png' 로 바꾸고 화면에서 <img>로 그리기
import type { MissionId } from '@/lib/types';

/** A1 마을 배경·A4 도입 컷: components/village/VillageScene.tsx, IntroScene.tsx 에 도형으로 그려 두었다 */

// A3 안내 인물(빛 요정 반디)과 탐험대: components/village/Characters.tsx 에 도형으로 그려 두었다
export const GLOVE_ART = '🧤'; // A5 절연 장갑 (S1에서만)
export const VILLAGE_ART = { dark: '🌑🏘️', bright: '🌕🏘️✨' }; // A1 마을 배경

/** 되살아남 연출 (명세서 8장). 차례로 하나씩 나타난다 */
export const REVIVAL_ART: Record<MissionId, string[]> = {
  m1: ['💡', '💡', '💡', '💡', '💡'], // 가로등 불이 하나씩 차례로 켜진다
  m2: ['🔔', '🧑', '👩', '👴', '👧'], // 안내 종이 울리고 사람들이 광장으로 모인다
  m3: ['🌬️', '🏠', '🏡', '🏘️', '✨'], // 풍차가 돌며 마을 전체에 불이 켜진다
};
