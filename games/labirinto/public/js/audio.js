import { tone } from '/js/kit/audio.js';

export const sounds = {
  go: () => [392, 523, 659].forEach((f, i) => tone(f, 140, { type: 'triangle', gain: 0.08, at: i * 0.12 })),
  step: () => tone(300 + Math.random() * 120, 45, { type: 'triangle', gain: 0.06 }),
  wall: () => { tone(110, 110, { type: 'square', gain: 0.05 }); tone(82, 140, { type: 'square', gain: 0.04, at: 0.05 }); },
  bomb: () => {
    tone(160, 380, { type: 'sawtooth', gain: 0.09 });
    tone(70, 600, { type: 'sawtooth', gain: 0.09, at: 0.08 });
    tone(45, 700, { type: 'square', gain: 0.06, at: 0.16 });
  },
  exit: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 170, { type: 'triangle', gain: 0.1, at: i * 0.11 })),
  end: () => { tone(330, 240, { type: 'sawtooth', gain: 0.06 }); tone(220, 380, { type: 'sawtooth', gain: 0.06, at: 0.22 }); },
};
