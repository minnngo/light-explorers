// 명세서 14장 그림 목록. 지금은 이모지로 임시 표시하고, 그림 파일이 준비되면 여기만 바꾼다.
// 예: place.m1.on: '/images/streetlight-on.png' 로 바꾸고 화면에서 <img>로 그리기
/** A1 마을 배경·A4 도입 컷: components/village/VillageScene.tsx, IntroScene.tsx 에 도형으로 그려 두었다 */

// A3 안내 인물(빛 요정 반디)과 탐험대: components/village/Characters.tsx 에 도형으로 그려 두었다
// A5 절연 장갑: components/village/Props.tsx 의 GloveIcon
export const VILLAGE_ART = { dark: '🌑🏘️', bright: '🌕🏘️✨' }; // A1 마을 배경

// 되살아남 연출(명세서 8장): 미션을 마치고 마을 지도로 돌아가면 그곳이 밝아지는 장면으로 보여 준다 (VillageScene의 reviving)
