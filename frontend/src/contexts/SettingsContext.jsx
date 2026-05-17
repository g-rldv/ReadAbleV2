// ============================================================
// SettingsContext — theme, text size, TTS, background music
// Settings are server-authoritative when logged in.
// On login: server settings are fetched and applied immediately.
// On change: saved to server + localStorage simultaneously.
// On logout / no token: localStorage only.
// bgMusic engine is inlined — no external file dependency.
// ============================================================
import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const SettingsContext = createContext(null);

const DARK_THEMES = new Set(['night']);

export const DEFAULTS = {
  text_size:        'medium',
  theme:            'cotton',
  tts_enabled:      false,   // off by default — less jarring on first load
  tts_voice:        '',
  tts_rate:         0.9,
  tts_pitch:        1.0,
  bg_music_enabled: false,
  bg_music_theme:   'calm',
  bg_music_volume:  0.7,
  student_mode:     false,   // ASD-optimized student mode
};

function readLocal() {
  try {
    const s = localStorage.getItem('readable_settings');
    return s ? { ...DEFAULTS, ...JSON.parse(s) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

// ── Inline background music engine ──────────────────────────
// Fix: track every live oscillator node so stop() can kill them
// immediately — preventing stacking when toggled rapidly.
const _music = (() => {
  let ctx = null, gain = null, timer = null, playing = false, theme = 'calm';
  // Keep refs to all scheduled oscillators so we can stop them on demand
  const liveOscs = new Set();

  const N = {
    C3:174,D3:196,E3:220,F3:233,G3:261,A3:293,B3:329,
    C4:349,D4:392,E4:440,F4:466,G4:523,A4:587,B4:659,
    C5:698,D5:784,E5:880,R:0,
  };
  const THEMES = {
    calm:    { bpm:72,  wave:'sine',     vol:0.13, atk:0.04, rel:0.75,
               notes:[N.C4,N.E4,N.G4,N.E4, N.G3,N.B3,N.D4,N.B3,
                      N.A3,N.C4,N.E4,N.C4, N.F3,N.A3,N.C4,N.A3] },
    playful: { bpm:108, wave:'triangle', vol:0.10, atk:0.01, rel:0.55,
               notes:[N.C4,N.E4,N.G4,N.A4,N.G4,N.E4,N.C4,N.R,
                      N.E4,N.G4,N.A4,N.C5,N.A4,N.G4,N.E4,N.R] },
    focus:   { bpm:48,  wave:'sine',     vol:0.08, atk:0.12, rel:0.90,
               notes:[N.C3,N.G3,N.R,N.R, N.C3,N.E3,N.G3,N.R,
                      N.A3,N.R,N.E3,N.R,  N.F3,N.C4,N.R,N.R] },
    fantasy: { bpm:84,  wave:'sine',     vol:0.11, atk:0.03, rel:0.70,
               notes:[N.A3,N.C4,N.E4,N.G4,N.E4,N.C4,
                      N.E4,N.G4,N.A4,N.C5,N.A4,N.G4] },
  };

  function initCtx() {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.connect(ctx.destination);
    return ctx;
  }

  // Kill all live oscillator nodes immediately
  function killAllOscs() {
    liveOscs.forEach(osc => {
      try { osc.stop(0); } catch (_) {}
    });
    liveOscs.clear();
  }

  function scheduleLoop(startTime, t) {
    if (!playing || !ctx) return;
    const td = THEMES[t] || THEMES.calm;
    const len = 60 / td.bpm;
    let ts = startTime;
    for (const freq of td.notes) {
      if (freq > 0) {
        const osc = ctx.createOscillator(), env = ctx.createGain();
        osc.connect(env); env.connect(gain);
        osc.type = td.wave;
        osc.frequency.setValueAtTime(freq, ts);
        const end = ts + len * 0.97;
        env.gain.setValueAtTime(0, ts);
        env.gain.linearRampToValueAtTime(td.vol, ts + td.atk);
        env.gain.setValueAtTime(td.vol, ts + len * td.rel);
        env.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.start(ts);
        osc.stop(end + 0.05);
        liveOscs.add(osc);
        // Auto-remove from set when it finishes naturally
        osc.onended = () => liveOscs.delete(osc);
      }
      ts += len;
    }
    const loopLen = td.notes.length * len;
    timer = setTimeout(
      () => scheduleLoop(ctx.currentTime + 0.05, theme),
      Math.max(50, (startTime + loopLen - ctx.currentTime - 0.3) * 1000)
    );
  }

  return {
    start(t = 'calm') {
      // Always fully stop first — kills all scheduled oscillators
      this.stop();
      theme = t;
      const c = initCtx();
      if (!c) return false;
      if (c.state === 'suspended') c.resume().catch(() => {});
      playing = true;
      gain.gain.cancelScheduledValues(c.currentTime);
      gain.gain.setValueAtTime(0.001, c.currentTime);
      gain.gain.linearRampToValueAtTime(1, c.currentTime + 1.5);
      scheduleLoop(c.currentTime + 0.1, theme);
      return c.state !== 'suspended';
    },
    stop() {
      playing = false;
      clearTimeout(timer);
      // Kill every oscillator that was scheduled — this is the key fix
      killAllOscs();
      // Fade out master gain so the kill isn't a harsh click
      if (gain && ctx) {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value || 0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      }
    },
    setVolume(v) {
      if (gain && ctx) {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(Math.max(0.001, Math.min(1, v)), ctx.currentTime);
      }
    },
    isPlaying() { return playing; },
  };
})();

// ── Provider ──────────────────────────────────────────────────
export function SettingsProvider({ children }) {
  const { token } = useAuth();
  const [settings, setSettings] = useState(readLocal);
  const [voices,   setVoices]   = useState([]);
  const autoplayRef    = useRef(false);
  const serverLoadedRef = useRef(false);
  // Always-current ref — avoids stale closure in updateSettings
  const settingsRef     = useRef(settings);

  // ── Apply settings to DOM + state ─────────────────────────
  // Defined before any useEffect that calls it.
  const applySettings = useCallback((s) => {
    const merged = { ...DEFAULTS, ...s };
    settingsRef.current = merged;
    setSettings(merged);
    try { localStorage.setItem('readable_settings', JSON.stringify(merged)); } catch (_) {}
    const html = document.documentElement;
    html.setAttribute('data-theme', merged.theme);
    html.classList.remove('dark', 'high-contrast');
    if (DARK_THEMES.has(merged.theme))      html.classList.add('dark');
    if (merged.theme === 'high-contrast')   html.classList.add('dark', 'high-contrast');
    html.classList.remove('text-small', 'text-medium', 'text-large', 'text-xlarge');
    html.classList.add(`text-${merged.text_size}`);

    const FONT_SCALE = {
      small: 0.92,
      medium: 1,
      large: 1.12,
      xlarge: 1.25,
    };

    const scale = FONT_SCALE[merged.text_size] || 1;

    html.style.setProperty('--readable-font-scale', String(scale));
    html.style.fontSize = `${16 * scale}px`;

    // This makes inline pixel font sizes scale too, so it affects the whole system.
    document.body.style.zoom = String(scale);
    document.body.style.transformOrigin = 'top left';
  }, []);

  // ── Apply saved settings on first paint (before server responds) ─
  useEffect(() => {
    applySettings(readLocal());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Server is authoritative when logged in ─────────────────
  // Fetch on every login (token change null→value).
  // This ensures settings are always consistent across devices.
  useEffect(() => {
    if (!token) {
      serverLoadedRef.current = false;
      return;
    }
    api.get('/settings')
      .then(res => {
        if (res.data?.settings) {
          applySettings(res.data.settings);
          // Clear dirty flag — server just confirmed the canonical state
          localStorage.removeItem('readable_settings_dirty');
          serverLoadedRef.current = true;
        }
      })
      .catch(() => {}); // keep local settings on network error
  }, [token, applySettings]);

  // ── Browser TTS voices ─────────────────────────────────────
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() || []);
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  // ── Music lifecycle ────────────────────────────────────────
  useEffect(() => {
    if (!settings.bg_music_enabled) {
      _music.stop();
      autoplayRef.current = false;
      return;
    }
    const started = _music.start(settings.bg_music_theme);
    if (!started && !autoplayRef.current) {
      autoplayRef.current = true;
      const handler = () => {
        if (settings.bg_music_enabled && !_music.isPlaying())
          _music.start(settings.bg_music_theme);
        autoplayRef.current = false;
      };
      document.addEventListener('click', handler, { once: true });
    }
  }, [settings.bg_music_enabled, settings.bg_music_theme]);

  // ── Volume ─────────────────────────────────────────────────
  useEffect(() => {
    if (settings.bg_music_enabled)
      _music.setVolume(settings.bg_music_volume ?? 0.7);
  }, [settings.bg_music_volume, settings.bg_music_enabled]);

  // ── Update a setting ───────────────────────────────────────
  const updateSettings = useCallback(async (updates) => {
    // Read from ref, not closure — avoids stale theme/settings on sound toggle
    const next = { ...settingsRef.current, ...updates };
    applySettings(next);
    // Mark dirty so if user logs into a new device the change is preserved
    try { localStorage.setItem('readable_settings_dirty', 'true'); } catch (_) {}
    if (token) {
      try {
        await api.put('/settings', next);
        localStorage.removeItem('readable_settings_dirty');
      } catch (_) {}
    }
  }, [token, applySettings]); // settings accessed via settingsRef, no stale closure

  // ── TTS speak ──────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!settings.tts_enabled || !text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(String(text));
    if (settings.tts_voice) {
      const v = voices.find(v => v.name === settings.tts_voice);
      if (v) utter.voice = v;
    }
    utter.rate  = settings.tts_rate  ?? 0.9;
    utter.pitch = settings.tts_pitch ?? 1.0;
    window.speechSynthesis.speak(utter);
  }, [settings, voices]);

  const stopSpeaking = useCallback(() => window.speechSynthesis?.cancel(), []);

  // Speak selected text automatically when TTS is enabled.
useEffect(() => {
  if (!settings.tts_enabled || !window.speechSynthesis) return;

  let selectionTimer = null;
  let lastSpokenText = '';

  const speakSelection = () => {
    clearTimeout(selectionTimer);

    selectionTimer = setTimeout(() => {
      const selectedText = window.getSelection?.()?.toString()?.trim();

      if (!selectedText) return;
      if (selectedText.length > 180) return;
      if (selectedText === lastSpokenText) return;

      lastSpokenText = selectedText;
      speak(selectedText);
    }, 250);
  };

  const clearLastSelection = () => {
    const selectedText = window.getSelection?.()?.toString()?.trim();
    if (!selectedText) lastSpokenText = '';
  };

  document.addEventListener('mouseup', speakSelection);
  document.addEventListener('touchend', speakSelection);
  document.addEventListener('keyup', speakSelection);
  document.addEventListener('selectionchange', clearLastSelection);

  return () => {
    clearTimeout(selectionTimer);
    document.removeEventListener('mouseup', speakSelection);
    document.removeEventListener('touchend', speakSelection);
    document.removeEventListener('keyup', speakSelection);
    document.removeEventListener('selectionchange', clearLastSelection);
  };
}, [settings.tts_enabled, speak]);

  // ── Setters for individual settings (convenience) ──────────
  const setTextSize = useCallback((val) => updateSettings({ text_size: val }), [updateSettings]);
  const setTheme = useCallback((val) => updateSettings({ theme: val }), [updateSettings]);
  const setTtsEnabled = useCallback((val) => updateSettings({ tts_enabled: val }), [updateSettings]);
  const setTtsVoice = useCallback((val) => updateSettings({ tts_voice: val }), [updateSettings]);
  const setBgMusicEnabled = useCallback((val) => updateSettings({ bg_music_enabled: val }), [updateSettings]);
  const setBgMusicTheme = useCallback((val) => updateSettings({ bg_music_theme: val }), [updateSettings]);
  const setBgMusicVolume = useCallback((val) => updateSettings({ bg_music_volume: val }), [updateSettings]);
  const setStudentMode = useCallback((val) => updateSettings({ student_mode: val }), [updateSettings]);

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      speak,
      stopSpeaking,
      voices,
      // Convenience setters
      setTextSize,
      setTheme,
      setTtsEnabled,
      setTtsVoice,
      setBgMusicEnabled,
      setBgMusicTheme,
      setBgMusicVolume,
      setStudentMode,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
