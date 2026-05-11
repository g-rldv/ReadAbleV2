// ============================================================
// soundEffects.js — plays item-specific audio, falls back to TTS
// Place this at: frontend/src/utils/soundEffects.js
//
// HOW IT WORKS:
//   1. Looks up the label in SOUND_MAP
//   2. If found → plays the audio file from /public/sounds/
//   3. If not found OR file fails → falls back to TTS via speak()
//
// TO ADD SOUNDS: drop .mp3 files into frontend/public/sounds/
// and add the matching entry to SOUND_MAP below.
// ============================================================

// ── Sound Map ─────────────────────────────────────────────────
// Keys must be LOWERCASE. Values are paths relative to /public/
const SOUND_MAP = {
  // ── Animals ───────────────────────────────────────────────
  elephant:    '/sounds/elephant.mp3',
  giraffe:     '/sounds/giraffe.mp3',
  lion:        '/sounds/lion.mp3',
  penguin:     '/sounds/penguin.mp3',
  butterfly:   '/sounds/butterfly.mp3',
  crocodile:   '/sounds/crocodile.mp3',
  dolphin:     '/sounds/dolphin.mp3',
  dog:         '/sounds/dog.mp3',
  cat:         '/sounds/cat.mp3',
  cow:         '/sounds/cow.mp3',
  frog:        '/sounds/frog.mp3',
  bee:         '/sounds/bee.mp3',
  tiger:       '/sounds/tiger.mp3',
  bear:        '/sounds/bear.mp3',
  shark:       '/sounds/shark.mp3',
  whale:       '/sounds/whale.mp3',

  // ── Emotions (TTS fallback is fine for these) ──────────────
  // Add entries here if you ever add audio for emotions

  // ── Weather / Nature ──────────────────────────────────────
  // thunder:  '/sounds/thunder.mp3',
  // rain:     '/sounds/rain.mp3',

  // ── Correct / Wrong feedback ───────────────────────────────
  correct:  '/sounds/correct.mp3',
  wrong:    '/sounds/wrong.mp3',
};

// ── Internal state ─────────────────────────────────────────────
let _current = null;   // currently playing Audio node

// ── Core play function ──────────────────────────────────────────
/**
 * Plays item sound. Falls back to TTS if no audio file found.
 *
 * @param {string}   label    - Item label, e.g. 'Elephant', 'Sky'
 * @param {function} speakFn  - speak() from useSettings()
 * @param {string}   [suffix] - Optional TTS suffix, e.g. 'and Blue'
 *                              Used when pairing: "Sky and Blue"
 */
export function playItemSound(label, speakFn, suffix = '') {
  if (!label) return;

  // Stop previous sound immediately
  if (_current) {
    try { _current.pause(); _current.currentTime = 0; } catch (_) {}
    _current = null;
  }

  const key = String(label).toLowerCase().trim();
  const src = SOUND_MAP[key];

  if (src) {
    const audio = new Audio(src);
    _current = audio;
    audio.play().catch(() => {
      // File missing or autoplay blocked → TTS fallback
      _current = null;
      _tts(label, suffix, speakFn);
    });
    audio.onended = () => { _current = null; };
  } else {
    // No entry in map → TTS fallback
    _tts(label, suffix, speakFn);
  }
}

/**
 * Plays a match-pair sound: "Sky and Blue"
 * Tries audio for the LEFT word first, then falls back to TTS for the pair.
 */
export function playMatchSound(left, right, speakFn) {
  playItemSound(left, speakFn, `and ${right}`);
}

// ── Internal TTS helper ─────────────────────────────────────────
function _tts(label, suffix, speakFn) {
  if (!speakFn) return;
  const text = suffix ? `${label} ${suffix}` : label;
  speakFn(text);
}
