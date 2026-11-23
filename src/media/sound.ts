// 효과음 (명세서 14장 S1). 음원 파일 없이 Web Audio로 만든다. 파일이 생기면 교체해도 된다.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  ctx ??= new AudioContext();
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
