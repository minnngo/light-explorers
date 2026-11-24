// 배경 음악: 오르골처럼 작고 동글동글한 8마디 반복 곡. 음원 파일 없이 Web Audio로 그때그때 연주한다.
// 다장조 C - Am - F - G / C - Em - F - G, 느린 걸음 빠르기. 수업을 방해하지 않게 아주 작게 깐다.
import { audio } from './sound';

const BPM = 92;
const EIGHTH = 60 / BPM / 2;
const BAR = EIGHTH * 8;
const LOOKAHEAD_S = 0.25;
const TICK_MS = 100;
const VOLUME = 0.7;

/** 미디 번호 → 주파수 */
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// 마디마다 8분음표 8칸 (null은 쉼표)
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71;
const C5 = 72, D5 = 74, E5 = 76, G5 = 79, A5 = 81, C6 = 84;
const MELODY: (number | null)[][] = [
  [E5, null, G5, null, A5, G5, E5, null],
  [C5, null, E5, null, D5, C5, A4, null],
  [A4, null, C5, null, D5, null, C5, A4],
  [G4, null, B4, null, D5, null, null, null],
  [E5, null, G5, null, C6, null, G5, E5],
  [G5, null, E5, null, D5, null, B4, null],
  [C5, null, A4, null, C5, D5, E5, null],
  [D5, null, B4, null, C5, null, null, null],
];
// 마디마다 낮은 음 (1박·3박)
const BASS = [C4 - 12, A4 - 24, F4 - 12, G4 - 24, C4 - 12, E4 - 12, F4 - 12, G4 - 24];
// 화음 바탕 (아주 작게 길게)
const PAD: number[][] = [
  [C4, E4, G4], [A4 - 12, C4, E4], [F4 - 12, A4 - 12, C4], [G4 - 12, B4 - 12, D4],
  [C4, E4, G4], [E4 - 12, G4 - 12, B4 - 12], [F4 - 12, A4 - 12, C4], [G4 - 12, B4 - 12, D4],
];

let master: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let nextBarTime = 0;
let bar = 0;
let level = 1;

function note(ac: AudioContext, out: AudioNode, freq: number, t: number, volume: number, decay: number, type: OscillatorType) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + decay + 0.05);
}

function scheduleBar(ac: AudioContext, out: AudioNode, index: number, start: number) {
  MELODY[index].forEach((m, i) => {
    if (m === null) return;
    const t = start + i * EIGHTH;
    // 오르골: 세모파 + 한 옥타브 위 사인파를 살짝
    note(ac, out, hz(m), t, 0.05, 0.9, 'triangle');
    note(ac, out, hz(m + 12), t, 0.012, 0.5, 'sine');
  });
  note(ac, out, hz(BASS[index]), start, 0.045, BAR / 2, 'sine');
  note(ac, out, hz(BASS[index]), start + BAR / 2, 0.035, BAR / 2, 'sine');
  for (const p of PAD[index]) note(ac, out, hz(p), start, 0.008, BAR, 'sine');
}

function tick() {
  const ac = audio();
  if (!ac || !master) return;
  while (nextBarTime < ac.currentTime + LOOKAHEAD_S) {
    scheduleBar(ac, master, bar, nextBarTime);
    bar = (bar + 1) % MELODY.length;
    nextBarTime += BAR;
  }
}

/** 음악 크기 (0 = 끔, 1 = 보통). 바뀔 때는 부드럽게 줄이고 키운다 */
export function setMusicLevel(next: number) {
  level = next;
  const ac = audio();
  if (!ac) return;
  if (level <= 0) {
    stopMusic();
    return;
  }
  if (!master) {
    master = ac.createGain();
    master.gain.value = 0.0001;
    master.connect(ac.destination);
    bar = 0;
    nextBarTime = ac.currentTime + 0.1;
    tick();
    timer = setInterval(tick, TICK_MS);
  }
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setTargetAtTime(VOLUME * level, ac.currentTime, 0.6);
}

export function stopMusic() {
  const ac = audio();
  if (timer) clearInterval(timer);
  timer = null;
  if (master && ac) {
    const old = master;
    old.gain.cancelScheduledValues(ac.currentTime);
    old.gain.setTargetAtTime(0.0001, ac.currentTime, 0.3);
    setTimeout(() => old.disconnect(), 1500);
  }
  master = null;
}
