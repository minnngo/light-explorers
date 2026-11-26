// 효과음 (명세서 14장 S1). 음원 파일 없이 Web Audio로 만든다. 파일이 생기면 교체해도 된다.

// 소리 장치는 페이지 전체에 하나만 둔다. 개발 중 코드가 바뀌어 이 파일을 다시 불러와도
// (화면 새로고침 없이 갈아 끼우기) 새 장치를 또 만들지 않도록 전역(globalThis)에 보관한다.
const g = globalThis as typeof globalThis & { __lightExplorersAudio?: AudioContext; __lightExplorersLimiter?: DynamicsCompressorNode };

export function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  g.__lightExplorersAudio ??= new AudioContext();
  const ctx = g.__lightExplorersAudio;
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** 큰 종소리가 찢어지지 않게 너무 큰 순간만 눌러 주는 장치 (종소리 전용, 하나만 만들어 쓴다) */
function limiter(ac: AudioContext): AudioNode {
  if (g.__lightExplorersLimiter?.context !== ac) {
    const c = ac.createDynamicsCompressor();
    c.threshold.value = -1;
    c.knee.value = 2;
    c.ratio.value = 20;
    c.attack.value = 0.002;
    c.release.value = 0.2;
    c.connect(ac.destination);
    g.__lightExplorersLimiter = c;
  }
  return g.__lightExplorersLimiter;
}

function tone(freq: number, volume: number, startOffset = 0, duration = 0.5, type: OscillatorType = 'sine', limited = false) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(limited ? limiter(ac) : ac.destination);
  osc.start(t);
  osc.stop(t + duration);
}

/**
 * 안내 종(버저). 두 소리의 세기 차이가 확실히 느껴지도록 크게 벌려 두었다.
 *  - 레벨 1 (전지 1개): 작은 "딩~"
 *  - 레벨 2 (전지 2개): 같은 "딩~"을 훨씬 크게 (높이·음색·길이는 같고 크기만 다르다. 찢어지지 않게 리미터가 맨 위만 눌러 준다)
 */
export function playChime(level: 1 | 2) {
  // 두 회로 모두 같은 종소리 "딩~" 한 번 (높이·음색이 같고 크기만 다르다). 전지 2개는 확연히 크게
  const loud = level === 2 ? 1.6 : 0.1;
  tone(880, loud, 0, 1.4, 'triangle', true); // 바탕음: 길게 울린다
  tone(1760, loud * 0.3, 0, 0.9, 'sine', true); // 맑은 배음
  tone(2640, loud * 0.1, 0, 0.5, 'sine', true); // 처음 칠 때의 쨍한 느낌
}

/** 작동하는 동안 종이 다시 울리는 간격. A와 B가 번갈아 울리도록 B는 반 박자 늦게 시작한다 */
export const CHIME_PERIOD_MS = 2000;
export const CHIME_OFFSET_MS: Record<'A' | 'B', number> = { A: 0, B: CHIME_PERIOD_MS / 2 };

/**
 * 날개 달린 전동기가 도는 소리: 모터의 "위잉" 소리 + 날개가 바람을 가르는 "휘휘" 소리.
 * 빠르게 돌수록(전지 2개) 더 높고 크게, 날개 소리도 더 잦게 난다. 화면의 날개 빠르기와 맞춘다
 * (날개 3장, 느림 2.4초·빠름 0.5초에 한 바퀴 → 날개가 지나가는 횟수 1.25번·6번/초).
 * 돌려준 함수를 부르면 부드럽게 멈춘다.
 */
export function startMotorSound(level: 1 | 2, once = false): () => void {
  const ac = audio();
  if (!ac) return () => {};
  const fast = level === 2;
  const t = ac.currentTime;
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(fast ? 0.5 : 0.16, t + 0.3); // 빨리 돌면 확연히 크게
  out.connect(ac.destination);

  // 모터 "위잉": 낮은 톱니파를 부드럽게 깎는다
  const hum = ac.createOscillator();
  hum.type = 'sawtooth';
  hum.frequency.value = fast ? 150 : 85;
  const humFilter = ac.createBiquadFilter();
  humFilter.type = 'lowpass';
  humFilter.frequency.value = fast ? 900 : 500;
  const humGain = ac.createGain();
  humGain.gain.value = 0.18;
  hum.connect(humFilter).connect(humGain).connect(out);

  // 날개 "휘휘": 바람 소리(잡음)를 날개가 지나가는 빠르기로 크게·작게
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuffer(ac);
  noise.loop = true;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = fast ? 1400 : 800;
  band.Q.value = 0.8;
  const whoosh = ac.createGain();
  whoosh.gain.value = 0.25;
  const lfo = ac.createOscillator();
  lfo.frequency.value = fast ? 6 : 1.25;
  const lfoDepth = ac.createGain();
  lfoDepth.gain.value = 0.22;
  lfo.connect(lfoDepth).connect(whoosh.gain);
  noise.connect(band).connect(whoosh).connect(out);

  const sources = [hum, noise, lfo];
  sources.forEach((n) => n.start(t));
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    const now = ac.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setTargetAtTime(0.0001, now, 0.12);
    sources.forEach((n) => n.stop(now + 0.6));
    setTimeout(() => out.disconnect(), 800);
  };
  // 계속 돌리지 않는 단계에서는 잠깐(1.5초)만 들려준다
  if (once) setTimeout(stop, 1500);
  return stop;
}

/** 바람 소리용 잡음 (2초 길이, 한 번 만들어 돌려 쓴다) */
let noiseCache: AudioBuffer | null = null;
function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noiseCache && noiseCache.sampleRate === ac.sampleRate) return noiseCache;
  const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseCache = buf;
  return buf;
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
