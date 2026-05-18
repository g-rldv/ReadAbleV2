// ============================================================
// SettingsPage.jsx — Full settings page for parents
// Theme · Text Size · TTS (pitch + speed) · Delete Account
// Design-synced with Global Theme Variables
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import {
  Palette, Type, Volume2, Trash2, Headphones,
  Sun, Moon, Heart, Leaf, Music, Sparkles,
  Check, AlertTriangle, X, Mic, Play, Settings, Info,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

// ─── Design Tokens linked directly to Global CSS Variables ───
const C = {
  page: 'var(--bg-primary)',
  white: 'var(--bg-card)',
  border: 'var(--border-color)',
  shadowSm: 'var(--shadow)',
  shadowMd: '0 8px 32px rgba(0,0,0,0.15)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-muted)',
  textMuted: 'var(--text-muted)',
  primary: 'var(--accent)',
  primaryH: 'var(--accent)',

  // Semantic mappings that automatically adapt per theme
  parent: {
    pageBg: 'var(--bg-sidebar)', 
    cardBg: 'var(--bg-card)',
    border: 'var(--border-color)', 
    accent: 'var(--accent)',
    accentLight: 'var(--bg-primary)', 
    textDark: 'var(--text-primary)',
    iconBg: 'var(--bg-primary)', 
    iconColor: 'var(--accent)',
  },
  teacher: {
    pageBg: 'var(--bg-sidebar)', 
    border: 'var(--border-interactive)',
    accent: 'var(--accent)', 
    accentLight: 'var(--bg-primary)',
    textDark: 'var(--text-primary)', 
    iconBg: 'var(--bg-primary)',
  },
  student: {
    pageBg: 'var(--bg-sidebar)', 
    border: 'var(--border-interactive)',
    accent: 'var(--accent)', 
    accentLight: 'var(--bg-primary)',
    textDark: 'var(--text-primary)', 
    iconBg: 'var(--bg-primary)',
  },
  danger: {
    pageBg: 'rgba(232, 48, 96, 0.1)', 
    border: 'var(--border-focus)',
    accent: '#E83060', 
    accentLight: 'rgba(232, 48, 96, 0.15)',
    textDark: 'var(--text-primary)', 
    iconBg: 'rgba(232, 48, 96, 0.2)',
  }
};

// ─── Theme catalogue (mirrors LandingPage THEME_OPTIONS) ─────
const THEMES = [
  { key: 'cotton',    label: 'Light',      Icon: Sun,      swatch: ['#FFF8F2', '#FFFFFF'] },
  { key: 'sky',       label: 'Berry',      Icon: Heart,    swatch: ['#FFF0F4', '#FFF8FA'] },
  { key: 'mint',      label: 'Meadow',     Icon: Leaf,     swatch: ['#F2FAF2', '#F8FEF8'] },
  { key: 'sunshine',  label: 'Sunrise',    Icon: Sun,      swatch: ['#FFF8ED', '#FFFCF5'] },
  { key: 'lavender',  label: 'Purple',     Icon: Sparkles, swatch: ['#F6F2FF', '#FAF8FF'] },
  { key: 'peach',     label: 'Mango',      Icon: Music,    swatch: ['#FFF4EC', '#FFF9F5'] },
  { key: 'bubblegum', label: 'Bubblegum',  Icon: Heart,    swatch: ['#FFF0F8', '#FFF8FC'] },
  { key: 'ocean',     label: 'Aqua',       Icon: Volume2,  swatch: ['#EEF9FD', '#F5FCFF'] },
  { key: 'night',     label: 'Night',      Icon: Moon,     swatch: ['#0B0820', '#181334'] },
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
      background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', marginBottom: 10,
    }}>
      <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>
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
  const filled  = { ...base, background: hov && !disabled ? 'var(--border-focus)' : col, color: '#FFF' };
  const outline_ = { ...base, background: hov && !disabled ? 'rgba(128,128,128,0.12)' : 'transparent', color: col };
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

// ─── Panel Wrapper ────────────────────────────────────────────
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

// ─── Slider Component ─────────────────────────────────────────
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
          background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)',
          fontSize: 13, fontWeight: 800, color: C.primary,
          minWidth: 52, textAlign: 'center',
        }}>
          {formatValue ? formatValue(value) : value}
        </div>
      </div>
      <div style={{ position: 'relative', height: 6 }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 6, background: 'var(--border-color)',
        }} />
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
        <div style={{
          position: 'absolute', top: '50%',
          left: `${pct}%`, transform: 'translate(-50%, -50%)',
          width: 18, height: 18, borderRadius: '50%',
          background: '#FFFFFF',
          border: `2.5px solid ${accent || C.primary}`,
          boxShadow: '0 1px 6px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          transition: 'left 0.05s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>{formatValue ? formatValue(min) : min}</span>
        <span style={{ fontSize: 10, color: C.textMuted }}>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}

// ─── Preview Bubble ───────────────────────────────────────────
function TTSPreviewBtn({ disabled, onPlay }) {
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
        border: `2px solid var(--border-interactive)`,
        background: hov && !disabled ? 'var(--bg-sidebar)' : 'var(--bg-card)',
        color: 'var(--text-primary)', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 700,
        transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
        width: '100%', flex: 1,
      }}
    >
      <Play size={15} /> Preview voice
    </button>
  );
}

// ─── Text Confirmation Modal ──────────────────────────────────
function TextSizeConfirm({ currentSize, nextSize, onCancel, onConfirm }) {
  const current = TEXT_SIZES.find(s => s.key === currentSize)?.label || 'Current';
  const next = TEXT_SIZES.find(s => s.key === nextSize)?.label || 'Selected';
  return (
    <div
      onClick={e => e.target === e.currentTarget && onCancel()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifycontent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 380,
        borderRadius: 20, background: 'var(--bg-card)',
        border: '1.5px solid var(--border-color)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        padding: 22,
        margin: 'auto',
        animation: 'modalPop 0.22s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'var(--bg-sidebar)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Type size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p style={{
              fontFamily: '"Fredoka One", cursive',
              fontSize: 19, color: 'var(--text-primary)', margin: '0 0 4px',
            }}>
              Apply text size?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
              This will change text size across the whole system from <strong>{current}</strong> to <strong>{next}</strong>.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <SoftButton onClick={onCancel} outline color="var(--text-primary)" style={{ flex: 1 }}>
            Cancel
          </SoftButton>
          <SoftButton onClick={onConfirm} color="var(--accent)" style={{ flex: 1 }}>
            <Check size={14} /> Apply
          </SoftButton>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Overlay ──────────────────────────────
function DeleteConfirm({ onCancel, onConfirm, loading }) {
  const [typed, setTyped] = useState('');
  const PHRASE = 'delete my account';
  const ready = typed.toLowerCase().trim() === PHRASE;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onCancel()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 400,
        borderRadius: 20, background: 'var(--bg-card)',
        border: '1.5px solid var(--border-focus)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        animation: 'modalPop 0.22s ease-out',
      }}>
        <div style={{
          background: 'rgba(232, 48, 96, 0.12)', padding: '20px 22px 16px',
          borderBottom: `1.5px solid var(--border-focus)`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'rgba(232, 48, 96, 0.2)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={22} style={{ color: '#E83060' }} />
          </div>
          <div>
            <p style={{
              fontFamily: '"Fredoka One", cursive',
              fontSize: 19, color: 'var(--text-primary)', margin: '0 0 3px',
            }}>Delete account?</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              This is permanent. All your data — children, reports, and classrooms — will be erased.
            </p>
          </div>
        </div>

        <div style={{ padding: '20px 22px 22px' }}>
          {[
            'All children profiles removed',
            'All class enrolments cancelled',
            'All progress reports deleted',
          ].map(w => (
            <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: 'rgba(232, 48, 96, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <X size={11} style={{ color: '#E83060' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{w}</span>
            </div>
          ))}

          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
              Type <strong style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>"{PHRASE}"</strong> to confirm
            </label>
            <input
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={PHRASE}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px', borderRadius: 12,
                border: '2px solid var(--border-color)',
                background: 'var(--bg-sidebar)',
                color: 'var(--text-primary)', fontSize: 14,
                fontFamily: 'Nunito, sans-serif', outline: 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <SoftButton onClick={onCancel} outline color="var(--text-primary)" style={{ flex: 1 }}>
              Cancel
            </SoftButton>
            <SoftButton onClick={onConfirm} danger disabled={!ready || loading} style={{ flex: 1 }}>
              {loading ? 'Deleting…' : <><Trash2 size={14} /> Delete</>}
            </SoftButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Component ──────────────────────────────────────────
function Toast({ msg, type = 'success', onDone }) {
  const isSuccess = type === 'success';
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 14,
      background: isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(232, 48, 96, 0.15)',
      border: `1.5px solid ${isSuccess ? 'var(--border-interactive)' : 'var(--border-focus)'}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      fontFamily: 'Nunito, sans-serif', fontSize: 13,
      fontWeight: 700, color: 'var(--text-primary)',
      animation: 'slideUp 0.25s ease-out',
    }}>
      {isSuccess ? <Check size={15} style={{color: 'green'}} /> : <AlertTriangle size={15} style={{color: '#E83060'}} />}
      {msg}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ParentSettings() {
  const {
    settings,
    setTheme,
    setTextSize,
    setTtsEnabled,
    setTtsVoice,
    updateSettings,
    voices = [],
  } = useSettings();
  const { logout } = useAuth();

  const [ttsPitch, setTtsPitch] = useState(settings?.tts_pitch ?? 1.0);
  const [ttsSpeed, setTtsSpeed] = useState(settings?.tts_rate ?? 0.9);
  const [ttsChanged, setTtsChanged] = useState(false);
  const [ttsSaving, setTtsSaving] = useState(false);

  const [pendingTextSize, setPendingTextSize] = useState(settings?.text_size ?? 'medium');
  const [originalTextSize, setOriginalTextSize] = useState(settings?.text_size ?? 'medium');
  const [showTextConfirm, setShowTextConfirm] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(settings?.tts_voice ?? '');

  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  useEffect(() => {
    if (!showTextConfirm) {
      setPendingTextSize(settings?.text_size ?? 'medium');
      setOriginalTextSize(settings?.text_size ?? 'medium');
    }
  }, [settings?.text_size, showTextConfirm]);

  useEffect(() => {
    setSelectedVoice(settings?.tts_voice ?? '');
    setTtsPitch(settings?.tts_pitch ?? 1.0);
    setTtsSpeed(settings?.tts_rate ?? 0.9);
  }, [settings?.tts_voice, settings?.tts_pitch, settings?.tts_rate]);

  const previewTextSize = (nextSize) => {
    if (!showTextConfirm) {
      setOriginalTextSize(settings?.text_size ?? 'medium');
    }
    setPendingTextSize(nextSize);
    setShowTextConfirm(true);
    const html = document.documentElement;
    html.classList.remove('text-small', 'text-medium', 'text-large', 'text-xlarge');
    html.classList.add(`text-${nextSize}`);
    const FONT_SCALE = { small: 0.92, medium: 1, large: 1.12, xlarge: 1.25 };
    const scale = FONT_SCALE[nextSize] || 1;
    html.style.setProperty('--readable-font-scale', String(scale));
    html.style.fontSize = `${16 * scale}px`;
  };

  const revertTextSizePreview = () => {
    const oldSize = originalTextSize || settings?.text_size || 'medium';
    const html = document.documentElement;
    html.classList.remove('text-small', 'text-medium', 'text-large', 'text-xlarge');
    html.classList.add(`text-${oldSize}`);
    const FONT_SCALE = { small: 0.92, medium: 1, large: 1.12, xlarge: 1.25 };
    const scale = FONT_SCALE[oldSize] || 1;
    html.style.setProperty('--readable-font-scale', String(scale));
    html.style.fontSize = `${16 * scale}px`;
    setPendingTextSize(oldSize);
    setShowTextConfirm(false);
  };

  const previewTTS = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance('The quick brown fox jumps over the lazy dog.');
    ut.pitch = ttsPitch;
    ut.rate  = ttsSpeed;
    if (selectedVoice) {
      const foundVoice = window.speechSynthesis.getVoices().find(v => v.name === selectedVoice);
      if (foundVoice) ut.voice = foundVoice;
    }
    window.speechSynthesis.speak(ut);
  }, [ttsPitch, ttsSpeed, selectedVoice]);

  const saveTTS = async () => {
    setTtsSaving(true);
    try {
      await updateSettings({ tts_pitch: ttsPitch, tts_rate: ttsSpeed, tts_voice: selectedVoice });
      setTtsChanged(false);
      showToast('Voice settings saved.');
    } catch {
      showToast('Could not save voice settings.', 'error');
    } bits {
      setTtsSaving(false);
    }
  };

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
      <style>{`
        @keyframes modalPop  { from { opacity:0; transform:scale(0.93) translateY(10px);} to { opacity:1; transform:none;} }
        @keyframes slideUp   { from { opacity:0; transform:translateY(14px);} to { opacity:1; transform:none;} }
        input[type=range]    { -webkit-appearance:none; appearance:none; background:transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; }
        @media (max-width: 560px) {
          .settings-page { max-width: 100% !important; gap: 24px !important; padding: 0 4px !important; }
          .settings-header { padding: 20px 18px !important; border-radius: 18px !important; align-items: flex-start !important; }
          .voice-model-grid { grid-template-columns: 1fr !important; }
          .tts-actions { display: grid !important; grid-template-columns: 1fr !important; }
          .danger-zone-row { display: grid !important; grid-template-columns: 1fr !important; gap: 14px !important; }
          .danger-zone-icon { display: none !important; }
        }
      `}</style>

      <div className="settings-page" style={{
        fontFamily: '"Nunito", sans-serif',
        color: C.textPrimary,
        maxWidth: 760,
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>

        {/* Header */}
        <div className="settings-header" style={{
          borderRadius: 22,
          background: C.parent.pageBg,
          border: `1.5px solid ${C.parent.border}`,
          padding: '26px 28px',
          boxShadow: C.shadowSm,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'var(--bg-card)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <Settings size={26} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <SectionLabel icon={<Settings size={12} />} text="Preferences" />
            <SectionTitle>Settings</SectionTitle>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 0', lineHeight: 1.5 }}>
              Customise how ReadAble looks and sounds for your family.
            </p>
          </div>
        </div>

        {/* Themes Selector */}
        <section>
          <SectionLabel icon={<Palette size={13} />} text="Appearance" />
          <SectionTitle>Choose a theme</SectionTitle>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 16px' }}>
            Applies across the whole app, including student mode.
          </p>
          <Panel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {THEMES.map(({ key, label, Icon, swatch }) => {
                const active = settings?.theme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    style={{
                      borderRadius: 16,
                      border: `2px solid ${active ? 'var(--border-focus)' : 'var(--border-color)'}`,
                      background: active ? 'var(--bg-sidebar)' : 'var(--bg-card)',
                      cursor: 'pointer', padding: '14px 10px 12px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 8,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: '100%', height: 36, borderRadius: 10, overflow: 'hidden', display: 'flex', border: '1px solid var(--border-color)' }}>
                      <div style={{ flex: 1, background: swatch[0] }} />
                      <div style={{ flex: 1, background: swatch[1] }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon size={13} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{label}</span>
                    </div>
                    {active && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} color="#FFF" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>
        </section>

        {/* Text Sizing Section */}
        <section>
          <SectionLabel icon={<Type size={13} />} text="Readability" />
          <SectionTitle>Text size</SectionTitle>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 16px' }}>
            Larger text helps learners with ASD read more comfortably.
          </p>
          <Panel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {TEXT_SIZES.map(({ key, label, size }) => {
                const active = pendingTextSize === key;
                return (
                  <button
                    key={key}
                    onClick={() => previewTextSize(key)}
                    style={{
                      borderRadius: 16, padding: '18px 12px',
                      border: `2px solid ${active ? 'var(--border-focus)' : 'var(--border-color)'}`,
                      background: active ? 'var(--bg-sidebar)' : 'var(--bg-card)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ fontSize: size, fontFamily: '"Fredoka One", cursive', color: 'var(--text-primary)', lineHeight: 1 }}>Aa</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </section>

        {/* Voice Speech Engine (TTS) */}
        <section>
          <SectionLabel icon={<Mic size={13} />} text="Read Aloud" />
          <SectionTitle>Voice settings</SectionTitle>
          <Panel style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <button
              onClick={() => setTtsEnabled?.(!settings?.tts_enabled)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, padding: '16px 18px', borderRadius: 16,
                border: `2px solid ${settings?.tts_enabled ? 'var(--border-focus)' : 'var(--border-color)'}`,
                background: 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Volume2 size={19} style={{ color: 'var(--accent)' }} />
                </div>
                <span>
                  <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)' }}>Read-aloud enabled</strong>
                </span>
              </span>
              <span style={{
                width: 48, height: 26, borderRadius: 20,
                background: settings?.tts_enabled ? 'var(--accent)' : 'var(--border-color)',
                padding: 3, display: 'flex', justifyContent: settings?.tts_enabled ? 'flex-end' : 'flex-start',
              }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#FFF' }} />
              </span>
            </button>

            <SliderRow
              label="Voice pitch"
              value={ttsPitch} min={0.5} max={2.0} step={0.05}
              accent="var(--accent)" formatValue={v => `${v.toFixed(2)}×`}
              onChange={v => { setTtsPitch(v); setTtsChanged(true); }}
            />

            <SliderRow
              label="Reading speed"
              value={ttsSpeed} min={0.5} max={2.0} step={0.05}
              accent="var(--accent)" formatValue={v => `${v.toFixed(2)}×`}
              onChange={v => { setTtsSpeed(v); setTtsChanged(true); }}
            />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}>
              <Info size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0 }}>
                ReadAble uses your device's built-in speech engine. Quality updates adapt natively to your operating system settings.
              </p>
            </div>

            <div className="tts-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <TTSPreviewBtn disabled={!settings?.tts_enabled} onPlay={previewTTS} />
              {ttsChanged && (
                <SoftButton onClick={saveTTS} disabled={ttsSaving} color="var(--accent)">
                  {ttsSaving ? 'Saving…' : 'Save voice settings'}
                </SoftButton>
              )}
            </div>
          </Panel>
        </section>

        {/* Danger Zone Account Action */}
        <section>
          <SectionLabel icon={<Trash2 size={13} />} text="Account" />
          <SectionTitle>Danger zone</SectionTitle>
          <Panel scheme={C.danger}>
            <div className="danger-zone-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="danger-zone-icon" style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(232, 48, 96, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={22} style={{ color: '#E83060' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Delete my account</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Permanently removes your family profile structure.</p>
                </div>
              </div>
              <SoftButton onClick={() => setShowDelete(true)} danger outline>Delete account</SoftButton>
            </div>
          </Panel>
        </section>
      </div>

      {showTextConfirm && (
        <TextSizeConfirm currentSize={originalTextSize} nextSize={pendingTextSize} onCancel={revertTextSizePreview} onConfirm={() => { setTextSize(pendingTextSize); setShowTextConfirm(false); showToast('Text size applied.'); }} />
      )}

      {showDelete && (
        <DeleteConfirm onCancel={() => setShowDelete(false)} onConfirm={handleDelete} loading={deleteLoading} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}