// 효과음 (명세서 14장 S1). 음원 파일 없이 Web Audio로 만든다. 파일이 생기면 교체해도 된다.

// 소리 장치는 페이지 전체에 하나만 둔다. 개발 중 코드가 바뀌어 이 파일을 다시 불러와도
// (화면 새로고침 없이 갈아 끼우기) 새 장치를 또 만들지 않도록 전역(globalThis)에 보관한다.
const g = globalThis as typeof globalThis & { __lightExplorersAudio?: AudioContext };

export function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  g.__lightExplorersAudio ??= new AudioContext();
  const ctx = g.__lightExplorersAudio;
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, volume: number, startOffset = 0, duration = 0.5, type: OscillatorType = 'sine') {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration);
}

/**
 * 안내 종(버저). 두 소리의 세기 차이가 확실히 느껴지도록 크게 벌려 두었다.
 *  - 레벨 1 (전지 1개): 작고 짧은 "딩…" (한 음, 아주 작게)
 *  - 레벨 2 (전지 2개): 크고 긴 "딩동!" (두 음 + 배음, 약 15배 크게)
 */
export function playChime(level: 1 | 2) {
  if (level === 1) {
    tone(880, 0.025, 0, 0.35);
  } else {
    tone(880, 0.4, 0, 1.1, 'triangle');
    tone(1760, 0.1, 0, 0.6);
    tone(660, 0.4, 0.35, 1.3, 'triangle');
    tone(1320, 0.1, 0.35, 0.7);
  }
}

/** 작동하는 동안 종이 다시 울리는 간격. A와 B가 번갈아 울리도록 B는 반 박자 늦게 시작한다 */
export const CHIME_PERIOD_MS = 2000;
export const CHIME_OFFSET_MS: Record<'A' | 'B', number> = { A: 0, B: CHIME_PERIOD_MS / 2 };

/** 불이 켜지는 소리. 밝을수록 높고 크게 */
export function playLightOn(level: 1 | 2) {
  tone(level === 2 ? 1320 : 990, level === 2 ? 0.15 : 0.05, 0, 0.18);
}

export function playSuccess() {
  tone(523, 0.2, 0, 0.25);
  tone(659, 0.2, 0.12, 0.25);
  tone(784, 0.25, 0.24, 0.4);
}

// ───── 화면 조작 효과음 (아주 작고 짧게) ─────

/** 소리 끄기를 누르면 화면 조작 효과음도 멈춘다 (StudentApp이 알려 준다) */
let uiMuted = false;
export function setUiSoundMuted(muted: boolean) {
  uiMuted = muted;
}

/** 짧은 음 하나. 높이가 살짝 미끄러지면 "톡" 하고 귀엽게 들린다 */
function blip(from: number, to: number, volume: number, startOffset = 0, duration = 0.09, type: OscillatorType = 'sine') {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** 버튼을 눌렀을 때: 작은 "톡" */
export function playClick() {
  if (uiMuted) return;
  // 낮고 짧은 "톡" 하나 (높은 소리는 귀에 거슬려서 뺐다)
  blip(420, 360, 0.09, 0, 0.06);
}

/** 창이 열릴 때: 올라가는 "띠링" */
export function playOpen() {
  if (uiMuted) return;
  tone(784, 0.065, 0, 0.25, 'triangle');
  tone(1175, 0.06, 0.08, 0.35, 'triangle');
}
