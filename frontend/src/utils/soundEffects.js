// ============================================================
// soundEffects.js — plays item-specific audio AND TTS together
// Place this at: frontend/src/utils/soundEffects.js
//
// HOW IT WORKS:
//   1. Stops any currently playing audio immediately
//   2. Looks up the label in SOUND_MAP
//   3. If found → plays the audio file (max 5 seconds) AND TTS simultaneously
//   4. If not found → plays TTS only
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
  dog:         '/sounds/dog.wav',
  cat:         '/sounds/cat.mp3',
  cow:         '/sounds/cow.mp3',
  frog:        '/sounds/frog.mp3',
  bee:         '/sounds/bee.mp3',
  tiger:       '/sounds/tiger.mp3',
  bear:        '/sounds/bear.mp3',
  shark:       '/sounds/shark.mp3',
  whale:       '/sounds/whale.mp3',
  // ── Weather / Nature ──────────────────────────────────────
  thunder:     '/sounds/thunder.mp3',
  rain:        '/sounds/rain.mp3',
  river: '/sounds/wave.mp3',
  ocean: '/sounds/wave.mp3',
  lake: '/sounds/wave.mp3',
  // ── Correct / Wrong feedback ───────────────────────────────
  correct:     '/sounds/correct.mp3',
  wrong:       '/sounds/wrong.mp3',
};

// ── Internal state ─────────────────────────────────────────────
const MAX_DURATION_MS = 5000; // 5 second cap

let _current     = null;  // currently playing Audio node
let _stopTimer   = null;  // timeout that enforces the 5s cap

// ── Stop whatever is currently playing ─────────────────────────
function _stopCurrent() {
  // Clear the 5s cap timer
  if (_stopTimer !== null) {
    clearTimeout(_stopTimer);
    _stopTimer = null;
  }
  // Stop and reset the audio node
  if (_current) {
    try {
      _current.pause();
      _current.currentTime = 0;
    } catch (_) {}
    _current = null;
  }
}

// ── Core play function ──────────────────────────────────────────
/**
 * Plays item sound AND TTS at the same time.
 * If no audio file is mapped, plays TTS only.
 * Audio is capped at MAX_DURATION_MS (5 s).
 * Clicking a new item immediately stops the previous audio.
 *
 * @param {string}   label    - Item label, e.g. 'Elephant', 'Sky'
 * @param {function} speakFn  - speak() from useSettings()
 * @param {string}   [suffix] - Optional TTS suffix, e.g. 'and Blue'
 */
export function playItemSound(label, speakFn, suffix = '') {
  if (!label) return;

  // Always stop previous audio first
  _stopCurrent();

  const key = String(label).toLowerCase().trim();
  const src = SOUND_MAP[key];

  // Always play TTS (simultaneous with audio if available)
  if (speakFn) {
    const ttsText = suffix ? `${label} ${suffix}` : label;
    speakFn(ttsText);
  }

  // Play audio file if mapped
  if (src) {
    const audio = new Audio(src);
    _current = audio;

    // Enforce 5-second cap
    _stopTimer = setTimeout(() => {
      if (_current === audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (_) {}
        _current  = null;
        _stopTimer = null;
      }
    }, MAX_DURATION_MS);

    audio.play().catch(() => {
      // Autoplay blocked or file missing — TTS already started, just clean up
      if (_current === audio) {
        clearTimeout(_stopTimer);
        _stopTimer = null;
        _current   = null;
      }
    });

    audio.onended = () => {
      if (_current === audio) {
        clearTimeout(_stopTimer);
        _stopTimer = null;
        _current   = null;
      }
    };
  }
}

/**
 * Plays a match-pair sound: speaks "Sky and Blue" while playing audio for 'Sky'.
 */
export function playMatchSound(left, right, speakFn) {
  playItemSound(left, speakFn, `and ${right}`);
}
