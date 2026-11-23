// 효과음 (명세서 14장 S1). 음원 파일 없이 Web Audio로 만든다. 파일이 생기면 교체해도 된다.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, volume: number, startOffset = 0, duration = 0.5) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration);
}

/** 안내 종(버저). 레벨 1은 작게 "딩…", 레벨 2는 크게 "딩동!" */
export function playChime(level: 1 | 2) {
  if (level === 1) {
    tone(880, 0.06);
  } else {
    tone(880, 0.35);
    tone(660, 0.35, 0.25);
  }
}

/** 불이 켜지는 소리. 밝을수록 높고 크게 */
export function playLightOn(level: 1 | 2) {
  tone(level === 2 ? 1320 : 990, level === 2 ? 0.15 : 0.05, 0, 0.18);
}

export function playSuccess() {
  tone(523, 0.2, 0, 0.25);
  tone(659, 0.2, 0.12, 0.25);
  tone(784, 0.25, 0.24, 0.4);
}
