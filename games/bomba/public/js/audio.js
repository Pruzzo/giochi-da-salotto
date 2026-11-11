import { tone } from '/js/kit/audio.js';

export const sounds = {
  go: () => [392, 523, 659].forEach((f, i) => tone(f, 120, { type: 'triangle', gain: 0.08, at: i * 0.1 })),
  error: () => { tone(140, 260, { type: 'sawtooth', gain: 0.09 }); tone(110, 320, { type: 'sawtooth', gain: 0.08, at: 0.12 }); },
  solved: () => { tone(784, 90, { type: 'triangle', gain: 0.1 }); tone(1175, 180, { type: 'triangle', gain: 0.1, at: 0.09 }); },
  defused: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 180, { type: 'triangle', gain: 0.1, at: i * 0.1 })),
  boom: () => {
    // Un botto: tante note basse e sporche una sull'altra, che scendono.
    [180, 150, 120, 95, 75, 60, 48].forEach((f, i) => tone(f, 500 + i * 60, { type: 'sawtooth', gain: 0.12, at: i * 0.04 }));
    [233, 197, 171].forEach((f, i) => tone(f, 300, { type: 'square', gain: 0.05, at: i * 0.03 }));
  },
};
