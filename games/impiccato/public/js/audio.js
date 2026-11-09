import { tone } from '/js/kit/audio.js';

export const sounds = {
  tick: () => tone(1400, 26, { gain: 0.03 }),
  hurry: () => tone(880, 70, { gain: 0.04 }),
  stop: () => { tone(330, 240, { type: 'sawtooth', gain: 0.06 }); tone(220, 380, { type: 'sawtooth', gain: 0.06, at: 0.22 }); },
  miss: () => tone(160, 90, { type: 'square', gain: 0.03 }),
  hanged: () => { tone(260, 160, { type: 'sawtooth', gain: 0.05 }); tone(150, 320, { type: 'sawtooth', gain: 0.05, at: 0.15 }); },
  solved: () => { tone(659, 110, { type: 'triangle', gain: 0.1 }); tone(988, 200, { type: 'triangle', gain: 0.1, at: 0.1 }); },
  reveal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 160, { type: 'triangle', gain: 0.1, at: i * 0.11 })),
};
