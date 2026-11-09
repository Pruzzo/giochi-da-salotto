import { tone } from '/js/kit/audio.js';

export { isMuted, toggleMute, unlockAudio } from '/js/kit/audio.js';

export const sounds = {
  tick: () => tone(1500, 28, { gain: 0.035 }),
  letter: () => { tone(523, 130, { type: 'triangle', gain: 0.12 }); tone(784, 240, { type: 'triangle', gain: 0.12, at: 0.12 }); },
  hurry: () => tone(880, 70, { gain: 0.04 }),
  stop: () => { tone(330, 240, { type: 'sawtooth', gain: 0.06 }); tone(220, 380, { type: 'sawtooth', gain: 0.06, at: 0.22 }); },
  mark: () => tone(660, 60, { type: 'triangle', gain: 0.09 }),
};
