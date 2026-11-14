import { tone } from '/js/kit/audio.js';

export const sounds = {
  hello: () => { tone(784, 90, { type: 'triangle', gain: 0.07 }); tone(1047, 140, { type: 'triangle', gain: 0.07, at: 0.09 }); },
  beat: () => tone(660, 120, { type: 'square', gain: 0.04 }),
  right: () => tone(988, 90, { type: 'triangle', gain: 0.08 }),
  wrong: () => { tone(220, 160, { type: 'sawtooth', gain: 0.05 }); tone(180, 200, { type: 'sawtooth', gain: 0.05, at: 0.12 }); },
  finish: () => { tone(659, 110, { type: 'triangle', gain: 0.1 }); tone(988, 200, { type: 'triangle', gain: 0.1, at: 0.1 }); },
  reveal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 160, { type: 'triangle', gain: 0.1, at: i * 0.11 })),
};
