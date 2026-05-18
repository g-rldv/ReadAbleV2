// ============================================================
// ParentSettings.jsx — Full settings page for parents
// Theme · Text Size · TTS (pitch + speed) · Delete Account
// Design-synced with LandingPage.jsx
// ============================================================
import { useState, useRef, useCallback } from 'react';
import {
  Palette, Type, Volume2, Trash2,
  Sun, Moon, Heart, Leaf, Music, Sparkles,
  Check, ChevronRight, AlertTriangle, X,
  Mic, Gauge, Play, Settings, Info,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

// ─── Design tokens (exact mirror of LandingPage) ─────────────
const C = {
  page: '#F2F0FA',
  white: '#FFFFFF',
  border: '#DDD8F2',
  shadowSm: '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',

  parent: {
    pageBg: '#FDF0E8', cardBg: '#FFFAF6',
    border: '#F0C8A8', accent: '#C06038',
    accentLight: '#FAE0C8', textDark: '#6A2810',
    iconBg: '#FAD8C0', iconColor: '#C06038',
  },
  teacher: {
    pageBg: '#EBF4EF', border: '#B8D8C4',
    accent: '#3A7A5C', accentLight: '#CCEADB',
    textDark: '#1A4A38', iconBg: '#D0EDE0',
  },
  student: {
    pageBg: '#EBF0FF', border: '#B8C8F0',
    accent: '#4058C0', accentLight: '#D0D8F8',
    textDark: '#1A2870', iconBg: '#D0D8F8',
  },
  danger: {
    pageBg: '#FEF0F0', border: '#F8C8C8',
    accent: '#C03030', accentLight: '#FDD',
    textDark: '#800000', iconBg: '#FDDADA',
  },

  textPrimary: '#28264A',
  textSecondary: '#6A6898',
  textMuted: '#9A98C0',
  primary: '#5A50A0',
  primaryH: '#4A4090',
};

// ─── Theme catalogue (mirrors LandingPage THEME_OPTIONS) ─────
const THEMES = [
  { key: 'cotton',    label: 'Light',      Icon: Sun,      swatch: ['#FAFAFA', '#E8E4FF'] },
  { key: 'sky',       label: 'Berry',      Icon: Heart,    swatch: ['#F0E8FF', '#C8B0F0'] },
  { key: 'mint',      label: 'Meadow',     Icon: Leaf,     swatch: ['#E8F8F0', '#A8D8C0'] },
  { key: 'sunshine',  label: 'Sunrise',    Icon: Sun,      swatch: ['#FFF8E0', '#FFD880'] },
  { key: 'lavender',  label: 'Purple',     Icon: Sparkles, swatch: ['#F0EAFF', '#C0A8F0'] },
  { key: 'peach',     label: 'Mango',      Icon: Music,    swatch: ['#FFF0E8', '#FFB880'] },
  { key: 'bubblegum', label: 'Bubblegum',  Icon: Heart,    swatch: ['#FFE8F4', '#FFB0D8'] },
  { key: 'ocean',     label: 'Aqua',       Icon: Volume2,  swatch: ['#E8F8FF', '#90D8F8'] },
  { key: 'night',     label: 'Night',      Icon: Moon,     swatch: ['#1A1830', '#3A3268'] },
];

const TEXT_SIZES = [
  { key: 'small',  label: 'Small',      size: 13 },
  { key: 'medium', label: 'Medium',     size: 15 },
  { key: 'large',  label: 'Large',      size: 18 },
  { key: 'xlarge', label: 'Extra Large', size: 22 },
];

// ─── Shared primitives ────────────────────────────────────────
function SectionLabel({ icon, text }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20,
      background: '#EDE8FF', border: '1px solid #C8C0F0', marginBottom: 10,
    }}>
      <span style={{ color: '#6050B0', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6050B0', textTransform: 'uppercase' }}>
        {text}
      </span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: '"Fredoka One", cursive',
      fontSize: 'clamp(19px, 2.5vw, 24px)',
      color: C.textPrimary, margin: '0 0 4px', lineHeight: 1.2,
    }}>
      {children}
    </h2>
  );
}

function SoftButton({ children, onClick, color, outline, small, danger, disabled, style: extra = {} }) {
  const [hov, setHov] = useState(false);
  const col = danger ? C.danger.accent : (color || C.primary);
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: small ? '7px 16px' : '10px 22px',
    borderRadius: 12, fontSize: small ? 13 : 14, fontWeight: 700,
    fontFamily: 'Nunito, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
    border: `2px solid ${col}`, transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1, ...extra,
  };
  const filled  = { ...base, background: hov && !disabled ? `${col}DD` : col, color: '#FFF' };
  const outline_ = { ...base, background: hov && !disabled ? `${col}12` : 'transparent', color: col };
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={outline ? outline_ : filled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────
function Panel({ children, scheme = null, style: extra = {} }) {
  const bg    = scheme ? scheme.pageBg  : C.white;
  const bdr   = scheme ? scheme.border  : C.border;
  return (
    <div style={{
      background: bg, border: `1.5px solid ${bdr}`,
      borderRadius: 20, padding: '24px 26px',
      boxShadow: C.shadowSm, ...extra,
    }}>
      {children}
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────
function SliderRow({ label, hint, value, min, max, step, onChange, accent, formatValue }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: 0 }}>{label}</p>
          {hint && <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0' }}>{hint}</p>}
        </div>
        <div style={{
          padding: '4px 12px', borderRadius: 20,
          background: '#EDE8FF', border: '1px solid #C8C0F0',
          fontSize: 13, fontWeight: 800, color: C.primary,
          minWidth: 52, textAlign: 'center',
        }}>
          {formatValue ? formatValue(value) : value}
        </div>
      </div>
      <div style={{ position: 'relative', height: 6 }}>
        {/* Track background */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 6, background: '#E8E4F8',
        }} />
        {/* Filled track */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, borderRadius: 6,
          background: accent || C.primary,
          transition: 'width 0.05s',
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%',
            opacity: 0, cursor: 'pointer', height: 6,
          }}
        />
        {/* Thumb indicator */}
        <div style={{
          position: 'absolute', top: '50%',
          left: `${pct}%`, transform: 'translate(-50%, -50%)',
          width: 18, height: 18, borderRadius: '50%',
          background: '#FFFFFF',
          border: `2.5px solid ${accent || C.primary}`,
          boxShadow: '0 1px 6px rgba(80,60,160,0.18)',
          pointerEvents: 'none',
          transition: 'left 0.05s',
        }} />
      </div>
      {/* Min / Max labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>{formatValue ? formatValue(min) : min}</span>
        <span style={{ fontSize: 10, color: C.textMuted }}>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}

// ─── Preview bubble ───────────────────────────────────────────
function TTSPreviewBtn({ pitch, speed, disabled, onPlay }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onPlay}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderRadius: 12,
        border: `2px solid ${C.student.accent}`,
        background: hov && !disabled ? C.student.pageBg : C.white,
        color: C.student.accent, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 700,
        transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
      }}
    >
      <Play size={15} /> Preview voice
    </button>
  );
}

// ─── Delete confirmation overlay ──────────────────────────────
function DeleteConfirm({ onCancel, onConfirm, loading }) {
  const [typed, setTyped] = useState('');
  const PHRASE = 'delete my account';
  const ready = typed.toLowerCase().trim() === PHRASE;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onCancel()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(40,38,74,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 400,
        borderRadius: 20, background: C.white,
        boxShadow: '0 8px 40px rgba(60,50,120,0.18)',
        overflow: 'hidden',
        animation: 'modalPop 0.22s ease-out',
      }}>
        {/* Header stripe */}
        <div style={{
          background: C.danger.pageBg, padding: '20px 22px 16px',
          borderBottom: `1px solid ${C.danger.border}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: C.danger.iconBg, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={22} style={{ color: C.danger.accent }} />
          </div>
          <div>
            <p style={{
              fontFamily: '"Fredoka One", cursive',
              fontSize: 19, color: C.danger.textDark, margin: '0 0 3px',
            }}>Delete account?</p>
            <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>
              This is permanent. All your data — children, reports, and classrooms — will be erased.
            </p>
          </div>
        </div>

        <div style={{ padding: '20px 22px 22px' }}>
          {/* Warning checklist */}
          {[
            'All children profiles removed',
            'All class enrolments cancelled',
            'All progress reports deleted',
          ].map(w => (
            <div key={w} style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: C.danger.accentLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <X size={11} style={{ color: C.danger.accent }} />
              </div>
              <span style={{ fontSize: 13, color: C.textSecondary }}>{w}</span>
            </div>
          ))}

          {/* Confirmation input */}
          <div style={{ marginTop: 18 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 800,
              color: C.textSecondary, marginBottom: 6,
            }}>
              Type <strong style={{ color: C.textPrimary, fontStyle: 'italic' }}>"{PHRASE}"</strong> to confirm
            </label>
            <input
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={PHRASE}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px', borderRadius: 12,
                border: `1.5px solid ${ready ? C.danger.accent : C.border}`,
                background: ready ? C.danger.pageBg : '#FAFAFE',
                color: C.textPrimary, fontSize: 14,
                fontFamily: 'Nunito, sans-serif', outline: 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <SoftButton onClick={onCancel} outline color={C.primary} style={{ flex: 1 }}>
              Cancel
            </SoftButton>
            <SoftButton
              onClick={onConfirm} danger disabled={!ready || loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Deleting…' : <><Trash2 size={14} /> Delete</>}
            </SoftButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onDone }) {
  const color = type === 'success' ? C.teacher.accent : C.danger.accent;
  const bg    = type === 'success' ? C.teacher.pageBg : C.danger.pageBg;
  const bdr   = type === 'success' ? C.teacher.border : C.danger.border;

  useRef(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  });

  useState(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  });

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 14,
      background: bg, border: `1.5px solid ${bdr}`,
      boxShadow: C.shadowMd,
      fontFamily: 'Nunito, sans-serif', fontSize: 13,
      fontWeight: 700, color,
      animation: 'slideUp 0.25s ease-out',
    }}>
      {type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
      {msg}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function ParentSettings() {
  const { settings, setTheme, setTextSize, setTtsEnabled } = useSettings();
  const { user, logout } = useAuth();

  // TTS local state (saved to settings context / api on apply)
  const [ttsPitch, setTtsPitch] = useState(settings?.tts_pitch ?? 1.0);
  const [ttsSpeed, setTtsSpeed] = useState(settings?.tts_speed ?? 1.0);
  const [ttsChanged, setTtsChanged] = useState(false);
  const [ttsSaving, setTtsSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // ── TTS preview ───────────────────────────────────────────
  const previewTTS = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance('The quick brown fox jumps over the lazy dog.');
    utt.pitch = ttsPitch;
    utt.rate  = ttsSpeed;
    window.speechSynthesis.speak(utt);
  }, [ttsPitch, ttsSpeed]);

  // ── Save TTS ──────────────────────────────────────────────
  const saveTTS = async () => {
    setTtsSaving(true);
    try {
      await api.patch('/settings', { tts_pitch: ttsPitch, tts_speed: ttsSpeed });
      setTtsChanged(false);
      showToast('Voice settings saved.');
    } catch {
      showToast('Could not save voice settings.', 'error');
    } finally {
      setTtsSaving(false);
    }
  };

  // ── Delete account ────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/auth/account');
      logout?.();
    } catch {
      setDeleteLoading(false);
      setShowDelete(false);
      showToast('Could not delete account. Please try again.', 'error');
    }
  };

  return (
    <>
      {/* ── Global keyframes ─────────────────────────────── */}
      <style>{`
        @keyframes modalPop  { from { opacity:0; transform:scale(0.93) translateY(10px);} to { opacity:1; transform:none;} }
        @keyframes slideUp   { from { opacity:0; transform:translateY(14px);} to { opacity:1; transform:none;} }
        @keyframes spin      { to   { transform:rotate(360deg);} }
        input[type=range]    { -webkit-appearance:none; appearance:none; background:transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; }
      `}</style>

      <div style={{
        fontFamily: '"Nunito", sans-serif',
        color: C.textPrimary,
        maxWidth: 760,
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>

        {/* ── Page header ──────────────────────────────────── */}
        <div style={{
          borderRadius: 22,
          background: C.parent.pageBg,
          border: `1.5px solid ${C.parent.border}`,
          padding: '26px 28px',
          boxShadow: C.shadowSm,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: C.parent.iconBg, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={26} style={{ color: C.parent.accent }} />
          </div>
          <div>
            <SectionLabel icon={<Settings size={12} />} text="Preferences" />
            <SectionTitle>Settings</SectionTitle>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 0', lineHeight: 1.5 }}>
              Customise how ReadAble looks and sounds for your family.
            </p>
          </div>
        </div>

        {/* ══ THEME ════════════════════════════════════════════ */}
        <section>
          <SectionLabel icon={<Palette size={13} />} text="Appearance" />
          <SectionTitle>Choose a theme</SectionTitle>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 16px' }}>
            Applies across the whole app, including student mode.
          </p>

          <Panel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 10,
            }}>
              {THEMES.map(({ key, label, Icon, swatch }) => {
                const active = settings?.theme === key;
                const isNight = key === 'night';
                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    style={{
                      borderRadius: 16,
                      border: `2px solid ${active ? C.parent.accent : C.border}`,
                      background: active ? C.parent.pageBg : C.white,
                      cursor: 'pointer', padding: '14px 10px 12px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 8,
                      transition: 'all 0.15s',
                      boxShadow: active ? C.shadowMd : C.shadowSm,
                      transform: active ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    {/* Swatch preview */}
                    <div style={{
                      width: '100%', height: 36, borderRadius: 10, overflow: 'hidden',
                      display: 'flex', border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ flex: 1, background: swatch[0] }} />
                      <div style={{ flex: 1, background: swatch[1] }} />
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <Icon size={13} style={{ color: active ? C.parent.accent : C.textMuted }} />
                      <span style={{
                        fontSize: 12, fontWeight: 800,
                        color: active ? C.parent.accent : C.textPrimary,
                      }}>
                        {label}
                      </span>
                    </div>

                    {active && (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: C.parent.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={11} color="#FFF" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>
        </section>

        {/* ══ TEXT SIZE ════════════════════════════════════════ */}
        <section>
          <SectionLabel icon={<Type size={13} />} text="Readability" />
          <SectionTitle>Text size</SectionTitle>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 16px' }}>
            Larger text helps learners with ASD read more comfortably.
          </p>

          <Panel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
            }}>
              {TEXT_SIZES.map(({ key, label, size }) => {
                const active = settings?.text_size === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTextSize(key)}
                    style={{
                      borderRadius: 16, padding: '18px 12px',
                      border: `2px solid ${active ? C.student.accent : C.border}`,
                      background: active ? C.student.pageBg : C.white,
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 6,
                      boxShadow: active ? C.shadowMd : C.shadowSm,
                      transform: active ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <span style={{
                      fontSize: size, fontFamily: '"Fredoka One", cursive',
                      color: active ? C.student.accent : C.textPrimary,
                      lineHeight: 1,
                    }}>
                      Aa
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 800,
                      color: active ? C.student.accent : C.textSecondary,
                    }}>
                      {label}
                    </span>
                    {active && (
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: C.student.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={10} color="#FFF" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>
        </section>

        {/* ══ TTS ══════════════════════════════════════════════ */}
        <section>
          <SectionLabel icon={<Mic size={13} />} text="Read Aloud" />
          <SectionTitle>Voice settings</SectionTitle>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 16px' }}>
            Adjust how the read-aloud voice sounds during student reading sessions.
          </p>

          <Panel style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* TTS enabled toggle */}
            <button
              onClick={() => setTtsEnabled?.(!settings?.tts_enabled)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, padding: '16px 18px', borderRadius: 16,
                border: `2px solid ${settings?.tts_enabled ? C.teacher.accent : C.border}`,
                background: settings?.tts_enabled ? C.teacher.pageBg : '#FAFAFE',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: settings?.tts_enabled ? C.teacher.iconBg : '#EEE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Volume2 size={19} style={{ color: settings?.tts_enabled ? C.teacher.accent : C.textMuted }} />
                </div>
                <span>
                  <strong style={{ display: 'block', fontSize: 14, color: C.textPrimary }}>
                    Read-aloud enabled
                  </strong>
                  <span style={{ display: 'block', fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                    Text-to-speech during student sessions
                  </span>
                </span>
              </span>
              {/* Toggle pill */}
              <span style={{
                width: 48, height: 26, borderRadius: 20, flexShrink: 0,
                background: settings?.tts_enabled ? C.teacher.accent : '#C8C8DC',
                padding: 3, display: 'flex',
                justifyContent: settings?.tts_enabled ? 'flex-end' : 'flex-start',
                transition: 'all 0.2s',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#FFF',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }} />
              </span>
            </button>

            {/* Pitch */}
            <SliderRow
              label="Voice pitch"
              hint="Higher = lighter voice · Lower = deeper voice"
              value={ttsPitch}
              min={0.5} max={2.0} step={0.05}
              accent={C.student.accent}
              formatValue={v => `${v.toFixed(2)}×`}
              onChange={v => { setTtsPitch(v); setTtsChanged(true); }}
            />

            {/* Speed */}
            <SliderRow
              label="Reading speed"
              hint="Slower speed helps learners follow along"
              value={ttsSpeed}
              min={0.5} max={2.0} step={0.05}
              accent={C.parent.accent}
              formatValue={v => `${v.toFixed(2)}×`}
              onChange={v => { setTtsSpeed(v); setTtsChanged(true); }}
            />

            {/* Info note */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 12,
              background: '#EDE8FF', border: '1px solid #C8C0F0',
            }}>
              <Info size={14} style={{ color: C.primary, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: C.primary, margin: 0, lineHeight: 1.55 }}>
                ReadAble uses your device's built-in speech engine. Voice quality may vary by browser and operating system.
              </p>
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <TTSPreviewBtn
                pitch={ttsPitch} speed={ttsSpeed}
                disabled={!settings?.tts_enabled}
                onPlay={previewTTS}
              />
              {ttsChanged && (
                <SoftButton
                  onClick={saveTTS} disabled={ttsSaving}
                  color={C.teacher.accent}
                >
                  {ttsSaving ? 'Saving…' : <><Check size={14} /> Save voice settings</>}
                </SoftButton>
              )}
            </div>
          </Panel>
        </section>

        {/* ══ DANGER ZONE ══════════════════════════════════════ */}
        <section>
          <SectionLabel icon={<Trash2 size={13} />} text="Account" />
          <SectionTitle>Danger zone</SectionTitle>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 16px' }}>
            These actions cannot be undone.
          </p>

          <Panel scheme={C.danger}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: C.danger.iconBg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trash2 size={22} style={{ color: C.danger.accent }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.danger.textDark, margin: 0 }}>
                    Delete my account
                  </p>
                  <p style={{ fontSize: 12, color: C.textSecondary, margin: '3px 0 0', lineHeight: 1.5 }}>
                    Permanently removes your account, children, reports, and enrolments.
                  </p>
                </div>
              </div>
              <SoftButton
                onClick={() => setShowDelete(true)}
                danger
                outline
                style={{ flexShrink: 0 }}
              >
                <Trash2 size={14} /> Delete account
              </SoftButton>
            </div>
          </Panel>
        </section>

      </div>

      {/* ── Delete confirmation overlay ───────────────────── */}
      {showDelete && (
        <DeleteConfirm
          onCancel={() => setShowDelete(false)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </>
  );
}