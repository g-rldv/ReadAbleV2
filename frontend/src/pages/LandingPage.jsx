// ============================================================
// LandingPage.jsx — ASD-Friendly Redesign
// Soft pastels · Clear hierarchy · Minimal cognitive load
// Designed for teachers, parents, and students with ASD
// ============================================================
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  BookOpen, BarChart2, Volume2, VolumeX, Heart, Star,
  ArrowRight, Check, X, Eye, EyeOff,
  Mail, Lock, User, ArrowLeft, ShieldCheck, RefreshCw,
  Users, Sparkles, FileText, GraduationCap, Home, Baby,
  Palette, Music, Clock, Shield, Type,
  Settings as SettingsIcon, Sun, Moon, Leaf,
} from 'lucide-react';
import api from '../utils/api';

// ── ASD-friendly pastel palette ────────────────────────────────
const C = {
  page:   '#F2F0FA',
  white:  '#FFFFFF',
  border: '#DDD8F2',
  shadowSm: '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',

  // Teacher — soft sage green
  teacher: {
    pageBg: '#EBF4EF', cardBg: '#F4FAF7',
    border: '#B8D8C4', accent: '#3A7A5C',
    accentLight: '#CCEADB', textDark: '#1A4A38',
    btnBg: '#3A7A5C', btnText: '#FFFFFF',
    iconBg: '#D0EDE0', iconColor: '#3A7A5C',
  },

  // Parent — warm apricot
  parent: {
    pageBg: '#FDF0E8', cardBg: '#FFFAF6',
    border: '#F0C8A8', accent: '#C06038',
    accentLight: '#FAE0C8', textDark: '#6A2810',
    btnBg: '#C06038', btnText: '#FFFFFF',
    iconBg: '#FAD8C0', iconColor: '#C06038',
  },

  // Student — cornflower blue
  student: {
    pageBg: '#EBF0FF', cardBg: '#F5F8FF',
    border: '#B8C8F0', accent: '#4058C0',
    accentLight: '#D0D8F8', textDark: '#1A2870',
    btnBg: '#4058C0', btnText: '#FFFFFF',
    iconBg: '#D0D8F8', iconColor: '#4058C0',
  },

  // Text
  textPrimary:   '#28264A',
  textSecondary: '#6A6898',
  textMuted:     '#9A98C0',

  // CTA
  primary:  '#5A50A0',
  primaryH: '#4A4090',
};

const THEME_OPTIONS = [
  { key: 'cotton', label: 'Light', Icon: Sun },
  { key: 'sky', label: 'Berry', Icon: Heart },
  { key: 'mint', label: 'Meadow', Icon: Leaf },
  { key: 'sunshine', label: 'Sunrise', Icon: Sun },
  { key: 'lavender', label: 'Purple', Icon: Sparkles },
  { key: 'peach', label: 'Mango', Icon: Music },
  { key: 'bubblegum', label: 'Bubblegum', Icon: Heart },
  { key: 'ocean', label: 'Aqua', Icon: Volume2 },
  { key: 'night', label: 'Night', Icon: Moon },
];

const TEXT_OPTIONS = [
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' },
  { key: 'xlarge', label: 'Extra Large' },
];

// ── Shared input component ─────────────────────────────────────
function AuthInput({ label, type = 'text', value, onChange, placeholder, name, icon: Icon, error }) {
  const [show, setShow] = useState(false);
  const isPwd = type === 'password';
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: C.textSecondary, letterSpacing: '0.02em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon size={14} style={{ color: C.textMuted }} />
          </div>
        )}
        <input
          name={name}
          type={isPwd ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: Icon ? '10px 36px 10px 36px' : '10px 12px',
            borderRadius: 12, border: `1.5px solid ${error ? '#F09090' : C.border}`,
            background: '#FAFAFE', color: C.textPrimary,
            fontSize: 14, fontFamily: 'Nunito, sans-serif',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = C.primary; }}
          onBlur={e => { e.target.style.borderColor = error ? '#F09090' : C.border; }}
        />
        {isPwd && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textMuted }}>
            {show ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: '#C04040', marginTop: 3 }}>{error}</p>}
    </div>
  );
}

// ── OTP 6-box input ────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[idx] = char;
    onChange(next.join(''));
    if (char && idx < 5) inputs.current[idx + 1]?.focus();
  };
  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) { const n = [...digits]; n[idx] = ''; onChange(n.join('')); }
      else if (idx > 0) { inputs.current[idx - 1]?.focus(); const n = [...digits]; n[idx - 1] = ''; onChange(n.join('')); }
    }
    if (e.key === 'ArrowLeft'  && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputs.current[idx + 1]?.focus();
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!p) return;
    onChange(p.padEnd(6, '').slice(0, 6));
    inputs.current[Math.min(p.length, 5)]?.focus();
  };
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0 16px' }}>
      {digits.map((d, i) => (
        <input key={i} ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handleChange(e, i)} onKeyDown={e => handleKey(e, i)}
          onPaste={i === 0 ? handlePaste : undefined}
          style={{
            width: 40, height: 48, textAlign: 'center', fontSize: 22, fontWeight: 700,
            borderRadius: 10, border: `1.5px solid ${d ? C.primary : C.border}`,
            background: d ? '#F0ECFF' : '#FAFAFE', color: C.textPrimary,
            fontFamily: 'Nunito, sans-serif', outline: 'none',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = C.primary; }}
          onBlur={e => { e.target.style.borderColor = d ? C.primary : C.border; }}
        />
      ))}
    </div>
  );
}

function useResendCooldown() {
  const [cd, setCd] = useState(0);
  const start = () => {
    setCd(60);
    const iv = setInterval(() => setCd(c => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; }), 1000);
  };
  return [cd, start];
}

// ── Forgot Password sub-view ───────────────────────────────────
function ForgotPasswordView({ onBack }) {
  const [step, setStep]     = useState('email');
  const [email, setEmail]   = useState('');
  const [otp, setOtp]       = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passErr, setPassErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCd, startResend] = useResendCooldown();

  const sendOTP = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try { await api.post('/auth/send-otp', { email: email.trim(), type: 'reset' }); } catch (_) {}
    finally { setLoading(false); setStep('otp'); startResend(); }
  };
  const verifyOTP = (e) => { e.preventDefault(); if (otp.length < 6) { setOtpErr('Please enter all 6 digits.'); return; } setOtpErr(''); setStep('newpass'); };
  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) { setPassErr('Password must be at least 6 characters.'); return; }
    if (newPass !== confirm) { setPassErr('Passwords do not match.'); return; }
    setPassErr(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), otp_code: otp, new_password: newPass });
      setStep('done');
    } catch (err) {
      const msg = err.message || '';
      if (/invalid|expired/i.test(msg)) { setOtpErr(msg); setStep('otp'); }
      else setPassErr(msg || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const backBtn = (
    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 14px', fontFamily: 'inherit' }}>
      <ArrowLeft size={13} /> Back to Sign In
    </button>
  );

  if (step === 'email') return (
    <div>
      {backBtn}
      <p style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, marginBottom: 4 }}>Forgot your password?</p>
      <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>Enter your email and we'll send a reset code.</p>
      <form onSubmit={sendOTP}>
        <AuthInput label="Email address" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={Mail} />
        <SoftButton type="submit" disabled={loading || !email.trim()} color={C.primary} style={{ width: '100%', marginTop: 4 }}>{loading ? 'Sending…' : 'Send Reset Code'}</SoftButton>
      </form>
    </div>
  );

  if (step === 'otp') return (
    <div>
      {backBtn}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <ShieldCheck size={18} style={{ color: C.primary }} />
        <p style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, margin: 0 }}>Check your email</p>
      </div>
      <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>6-digit code sent to <strong style={{ color: C.textPrimary }}>{email}</strong>.</p>
      <form onSubmit={verifyOTP}>
        <OTPInput value={otp} onChange={v => { setOtp(v); setOtpErr(''); }} />
        {otpErr && <p style={{ fontSize: 11, color: '#C04040', textAlign: 'center', marginTop: -8, marginBottom: 8 }}>{otpErr}</p>}
        <SoftButton type="submit" disabled={otp.length < 6} color={C.primary} style={{ width: '100%' }}>Verify Code</SoftButton>
      </form>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        {resendCd > 0 ? <span style={{ fontSize: 12, color: C.textMuted }}>Resend in {resendCd}s</span>
          : <button onClick={sendOTP} style={{ fontSize: 12, fontWeight: 700, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>↺ Resend code</button>}
      </div>
    </div>
  );

  if (step === 'newpass') return (
    <div>
      {backBtn}
      <p style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, marginBottom: 4 }}>New password</p>
      <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>Choose a new password for your account.</p>
      <form onSubmit={resetPassword}>
        <AuthInput label="New password" type="password" name="np" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="At least 6 characters" icon={Lock} />
        <AuthInput label="Confirm password" type="password" name="cp" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" icon={Lock} error={passErr} />
        <SoftButton type="submit" disabled={loading} color={C.primary} style={{ width: '100%', marginTop: 4 }}>{loading ? 'Resetting…' : 'Reset Password'}</SoftButton>
      </form>
    </div>
  );

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#D4F0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Check size={26} style={{ color: '#3A7A5C' }} />
      </div>
      <p style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, marginBottom: 6 }}>Password reset!</p>
      <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 18 }}>Your password has been updated. You can now sign in.</p>
      <SoftButton onClick={onBack} color={C.primary} style={{ width: '100%' }}>Back to Sign In</SoftButton>
    </div>
  );
}

// ── Shared soft button ─────────────────────────────────────────
function SoftButton({ children, onClick, type = 'button', disabled, color, outline, style: extraStyle = {}, small }) {
  const [hov, setHov] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: small ? '7px 16px' : '11px 22px',
    borderRadius: 12, fontSize: small ? 13 : 14, fontWeight: 700,
    fontFamily: 'Nunito, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
    border: `2px solid ${color || C.primary}`,
    transition: 'all 0.15s', opacity: disabled ? 0.55 : 1,
    ...extraStyle,
  };
  const filled = { background: hov && !disabled ? (color + 'DD') : color, color: '#FFFFFF', ...base };
  const outlineStyle = { background: hov && !disabled ? color + '10' : 'transparent', color: color || C.primary, ...base };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={outline ? outlineStyle : filled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

// ── Sign In Modal ──────────────────────────────────────────────
function SignInModal({ onClose, onSwitchToRegister }) {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user?.role === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard', { replace: true });
    } catch (err) {
      const msg = err.message || '';
      if (/invalid|password/i.test(msg)) setError('Incorrect email or password.');
      else setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <Overlay onClose={!loading ? onClose : null}>
      <ModalCard onClose={!loading ? onClose : null}>
        {loading ? (
          <LoadingView color={C.primary} tip="Signing you in…" />
        ) : showForgot ? (
          <ForgotPasswordView onBack={() => setShowForgot(false)} />
        ) : (
          <>
            <ModalHeader title="Welcome back!" subtitle="Sign in to continue" />
            <form onSubmit={submit}>
              <AuthInput label="Email" type="email" name="email" value={form.email} onChange={handle} placeholder="you@example.com" icon={Mail} />
              <AuthInput label="Password" type="password" name="password" value={form.password} onChange={handle} placeholder="Your password" icon={Lock} />
              <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 14 }}>
                <button type="button" onClick={() => setShowForgot(true)}
                  style={{ fontSize: 12, fontWeight: 700, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Forgot password?
                </button>
              </div>
              {error && <ErrorBox msg={error} />}
              <SoftButton type="submit" disabled={loading} color={C.primary} style={{ width: '100%' }}>Sign In</SoftButton>
            </form>
            <ModalFooter>
              No account?{' '}
              <TextLink onClick={onSwitchToRegister}>Create one free</TextLink>
            </ModalFooter>
          </>
        )}
      </ModalCard>
    </Overlay>
  );
}

// ── Register Modal ─────────────────────────────────────────────
function RegisterModal({ onClose, onSwitchToSignIn, initialRole = 'parent' }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState('form');
  const [form, setForm]     = useState({ username: '', email: '', password: '', confirm: '', first_name: '', last_name: '', role: initialRole });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otp, setOtp]       = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [resendCd, startResend] = useResendCooldown();

  const handle = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setErrors(er => ({ ...er, [e.target.name]: '', general: '' })); };

  const validate = () => {
    const e = {};
    if (form.username.trim().length < 3) e.username = 'At least 3 characters.';
    if (!form.email.includes('@')) e.email = 'Valid email required.';
    if (!form.first_name.trim()) e.first_name = 'Required.';
    if (!form.last_name.trim()) e.last_name = 'Required.';
    if (form.password.length < 6) e.password = 'At least 6 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: form.email.trim(), type: 'register' });
      setStep('otp'); startResend();
    } catch (err) {
      const raw = err.message || '';
      if (/already exists|taken/i.test(raw)) setErrors({ email: 'An account with that email already exists.' });
      else setErrors({ general: raw || 'Failed to send code. Please try again.' });
    } finally { setLoading(false); }
  };

  const resendOTP = async () => {
    setLoading(true);
    try { await api.post('/auth/send-otp', { email: form.email.trim(), type: 'register' }); startResend(); setOtpErr(''); }
    catch (_) {} finally { setLoading(false); }
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setOtpErr('Please enter all 6 digits.'); return; }
    setOtpErr(''); setLoading(true);
    try {
      await register({ username: form.username.trim(), email: form.email.trim(), password: form.password, first_name: form.first_name.trim(), last_name: form.last_name.trim(), role: form.role, otp_code: otp });
      navigate(form.role === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard', { replace: true });
    } catch (err) {
      const raw = err.message || '';
      if (/invalid|expired/i.test(raw)) setOtpErr(raw || 'Invalid or expired code.');
      else if (/username.*taken/i.test(raw)) setErrors({ username: 'That username is already taken.' });
      else if (/email.*taken/i.test(raw)) setErrors({ email: 'An account with that email already exists.' });
      else setOtpErr(raw || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const roleColor = form.role === 'teacher' ? C.teacher.accent : C.parent.accent;

  return (
    <Overlay onClose={!loading ? onClose : null}>
      <ModalCard onClose={!loading ? onClose : null}>
        {loading ? (
          <LoadingView color={roleColor} tip={step === 'otp' ? 'Creating your account…' : 'Sending verification code…'} />
        ) : step === 'form' ? (
          <>
            <ModalHeader title="Join ReadAble!" subtitle="Free account · takes 30 seconds" />

            {/* Role selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, padding: '6px', background: C.page, borderRadius: 14 }}>
              {['parent', 'teacher'].map(r => (
                <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 800,
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    background: form.role === r ? (r === 'teacher' ? C.teacher.accent : C.parent.accent) : 'transparent',
                    color: form.role === r ? '#FFFFFF' : C.textSecondary,
                  }}>
                  {r === 'teacher' ? '📚 Teacher' : '🏠 Parent'}
                </button>
              ))}
            </div>

            <form onSubmit={submitForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <AuthInput label="First name" name="first_name" value={form.first_name} onChange={handle} placeholder="Alex" icon={User} error={errors.first_name} />
                <AuthInput label="Last name" name="last_name" value={form.last_name} onChange={handle} placeholder="Smith" icon={User} error={errors.last_name} />
              </div>
              <AuthInput label="Username" name="username" value={form.username} onChange={handle} placeholder="ReadingPro" icon={User} error={errors.username} />
              <AuthInput label="Email" type="email" name="email" value={form.email} onChange={handle} placeholder="you@example.com" icon={Mail} error={errors.email} />
              <AuthInput label="Password" type="password" name="password" value={form.password} onChange={handle} placeholder="At least 6 characters" icon={Lock} error={errors.password} />
              <AuthInput label="Confirm password" type="password" name="confirm" value={form.confirm} onChange={handle} placeholder="Repeat password" icon={Lock} error={errors.confirm} />
              {errors.general && <ErrorBox msg={errors.general} />}
              <SoftButton type="submit" color={roleColor} style={{ width: '100%' }}>Send Verification Code →</SoftButton>
            </form>
            <ModalFooter>
              Already have an account?{' '}<TextLink onClick={onSwitchToSignIn}>Sign in</TextLink>
            </ModalFooter>
          </>
        ) : (
          <>
            <button onClick={() => { setStep('form'); setOtp(''); setOtpErr(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 14px', fontFamily: 'inherit' }}>
              <ArrowLeft size={13} /> Edit details
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <ShieldCheck size={18} style={{ color: roleColor }} />
              <p style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, margin: 0 }}>Verify your email</p>
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>
              We sent a code to <strong style={{ color: C.textPrimary }}>{form.email}</strong>
            </p>
            <form onSubmit={submitOTP}>
              <OTPInput value={otp} onChange={v => { setOtp(v); setOtpErr(''); }} />
              {otpErr && <p style={{ fontSize: 11, color: '#C04040', textAlign: 'center', marginTop: -8, marginBottom: 10 }}>{otpErr}</p>}
              <SoftButton type="submit" disabled={otp.length < 6} color={roleColor} style={{ width: '100%' }}>Start Learning! 🎉</SoftButton>
            </form>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              {resendCd > 0 ? <span style={{ fontSize: 12, color: C.textMuted }}>Resend in {resendCd}s</span>
                : <button onClick={resendOTP} style={{ fontSize: 12, fontWeight: 700, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>↺ Resend code</button>}
            </div>
          </>
        )}
      </ModalCard>
    </Overlay>
  );
}

// ── Modal helpers ──────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose?.()}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(40,38,74,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {children}
    </div>
  );
}
function ModalCard({ children, onClose }) {
  return (
    <div style={{ width: '100%', maxWidth: 380, borderRadius: 20, background: C.white, boxShadow: '0 8px 40px rgba(60,50,120,0.18)', overflow: 'hidden', animation: 'modalPop 0.22s ease-out' }}>
      <div style={{ position: 'relative', padding: '24px 24px 20px' }}>
        {onClose && (
          <button onClick={onClose}
            style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 8, border: 'none', background: C.page, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
            <X size={15} />
          </button>
        )}
        <div style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: 2 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
function ModalHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary, margin: '0 0 2px' }}>{title}</p>
      <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{subtitle}</p>
    </div>
  );
}
function ModalFooter({ children }) {
  return <p style={{ textAlign: 'center', fontSize: 12, color: C.textMuted, marginTop: 14 }}>{children}</p>;
}
function TextLink({ onClick, children }) {
  return <button onClick={onClick} style={{ fontSize: 12, fontWeight: 800, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{children}</button>;
}
function ErrorBox({ msg }) {
  return <div style={{ padding: '9px 12px', borderRadius: 10, background: '#FEF0F0', border: '1px solid #F8C8C8', color: '#A03030', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{msg}</div>;
}
function LoadingView({ color, tip }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0 24px', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${color}20`, borderTop: `3px solid ${color}`, animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, margin: 0 }}>{tip}</p>
    </div>
  );
}

function SettingsModal({ onClose }) {
  const {
    settings,
    setTheme,
    setTextSize,
    setBgMusicEnabled,
    setTtsEnabled,
  } = useSettings();

  const [tab, setTab] = useState('theme');

  const tabs = [
    { key: 'theme', label: 'Theme', Icon: Palette },
    { key: 'text', label: 'Text', Icon: Type },
    { key: 'music', label: 'Music', Icon: Music },
    { key: 'voice', label: 'Voice', Icon: Volume2 },
  ];

  return (
    <Overlay onClose={onClose}>
      <div style={{
        width: '100%', maxWidth: 448, borderRadius: 18,
        background: '#181334', border: '1px solid #4B3E72',
        boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden', color: '#EDE8FF', animation: 'modalPop 0.22s ease-out',
      }}>
        <div style={{ height: 62, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #3D3260' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#080613', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={14} color="#9FE7FF" />
            </div>
            <span style={{ fontFamily: '"Fredoka One", cursive', fontSize: 27 }}>ReadAble</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#A9A0C8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #3D3260' }}>
          {tabs.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  height: 56, border: 'none', background: 'transparent',
                  color: active ? '#65C7FF' : '#A9A0C8',
                  borderBottom: active ? '2px solid #65C7FF' : '2px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 800,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 22 }}>
          {tab === 'theme' && (
            <>
              <p style={{ margin: '0 0 14px', color: '#A9A0C8', fontSize: 12, fontWeight: 900 }}>CHOOSE A THEME</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {THEME_OPTIONS.map(({ key, label, Icon }) => {
                  const active = settings.theme === key;
                  return (
                    <button key={key} onClick={() => setTheme(key)}
                      style={{
                        minHeight: 70, borderRadius: 14,
                        border: `2px solid ${active ? '#58B9FF' : '#55476E'}`,
                        background: active ? '#1F2D5B' : '#0E0B21',
                        color: active ? '#7FD2FF' : '#C7B8F5',
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      <Icon size={18} />
                      <span style={{ fontSize: 12 }}>{label}</span>
                      {active && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'text' && (
            <>
              <p style={{ margin: '0 0 14px', color: '#A9A0C8', fontSize: 12, fontWeight: 900 }}>FONT SIZE</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {TEXT_OPTIONS.map(size => (
                  <button key={size.key} onClick={() => setTextSize(size.key)}
                    style={{
                      padding: '15px 12px', borderRadius: 14,
                      border: `2px solid ${settings.text_size === size.key ? '#58B9FF' : '#55476E'}`,
                      background: settings.text_size === size.key ? '#1F2D5B' : '#0E0B21',
                      color: '#C7B8F5', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 900,
                    }}>
                    {size.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'music' && (
            <SettingToggle
              title="Background Music"
              subtitle="Use the learner's device audio system."
              enabled={settings.bg_music_enabled}
              onClick={() => setBgMusicEnabled(!settings.bg_music_enabled)}
              Icon={Music}
            />
          )}

          {tab === 'voice' && (
            <SettingToggle
              title="TTS Feature"
              subtitle="Use the learner's system text-to-speech voice."
              enabled={settings.tts_enabled}
              onClick={() => setTtsEnabled(!settings.tts_enabled)}
              Icon={settings.tts_enabled ? Volume2 : VolumeX}
            />
          )}
        </div>

        <div style={{ padding: '14px 22px', textAlign: 'center', color: '#A9A0C8', fontSize: 12, borderTop: '1px solid #3D3260' }}>
          Settings apply to the whole system
        </div>
      </div>
    </Overlay>
  );
}


function SettingToggle({ title, subtitle, enabled, onClick, Icon }) {
  return (
    <button onClick={onClick}
      style={{
        width: '100%', minHeight: 92, borderRadius: 16,
        border: `2px solid ${enabled ? '#58B9FF' : '#55476E'}`,
        background: enabled ? '#1F2D5B' : '#0E0B21',
        color: '#EDE8FF', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 18,
      }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
        <Icon size={22} color={enabled ? '#7FD2FF' : '#A9A0C8'} />
        <span>
          <strong style={{ display: 'block', fontSize: 15 }}>{title}</strong>
          <span style={{ display: 'block', fontSize: 12, color: '#A9A0C8', marginTop: 3 }}>{subtitle}</span>
        </span>
      </span>
      <span style={{ width: 48, height: 26, borderRadius: 20, background: enabled ? '#58B9FF' : '#55476E', padding: 3, display: 'flex', justifyContent: enabled ? 'flex-end' : 'flex-start' }}>
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF' }} />
      </span>
    </button>
  );
}

// ── Page: Nav ──────────────────────────────────────────────────
function Nav({ onSignIn, onOpenSettings }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--bg-card, #FFFFFF)F0', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color, #DDD8F2)',
      padding: '0 24px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent, #5A50A0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={18} color="#FFFFFF" />
        </div>
        <span style={{ fontFamily: '"Fredoka One", cursive', fontSize: 22, color: 'var(--text-primary, #28264A)' }}>ReadAble</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          style={{
            width: 38, height: 38, borderRadius: 12,
            border: '1px solid var(--border-color, #DDD8F2)',
            background: 'var(--bg-primary, #F2F0FA)',
            color: 'var(--text-muted, #6A6898)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <SettingsIcon size={18} />
        </button>
        <SoftButton onClick={onSignIn} outline color={C.primary} small>Sign In</SoftButton>
      </div>
    </nav>
  );
}

// ── Page: Hero ─────────────────────────────────────────────────
function Hero({ onTeacher, onParent, onSignIn }) {
  return (
    <section style={{ padding: '56px 24px 0', maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>

      {/* Decorative soft blobs */}
      <div style={{ position: 'absolute', top: 20, left: '5%', width: 160, height: 160, borderRadius: '50%', background: '#C8C0F020', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 60, right: '8%', width: 100, height: 100, borderRadius: '50%', background: '#B8D8C820', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -20, left: '15%', width: 80, height: 80, borderRadius: '50%', background: '#F0C8A820', pointerEvents: 'none' }} />

      {/* Pill label */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: '#EDE8FF', border: '1px solid #C8C0F0', marginBottom: 18 }}>
        <Heart size={12} style={{ color: '#7060C0' }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: '#6050B0', letterSpacing: '0.03em' }}>Designed for learners with ASD</span>
      </div>

      {/* Headline */}
      <h1 style={{ fontFamily: '"Fredoka One", cursive', fontSize: 'clamp(34px, 6vw, 52px)', lineHeight: 1.1, color: C.textPrimary, margin: '0 0 14px', letterSpacing: '-0.01em' }}>
        Reading made gentle.
        <br />
        <span style={{ color: '#6050A8' }}>Progress made visible.</span>
      </h1>

      <p style={{ fontSize: 16, color: C.textSecondary, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 32px', fontWeight: 500 }}>
        A reading comprehension platform built for teachers, parents, and students with autism — calm, clear, and encouraging at every step.
      </p>

      {/* CTA row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
        <SoftButton onClick={onTeacher} color={C.teacher.accent}>
          <GraduationCap size={16} /> I'm a Teacher
        </SoftButton>
        <SoftButton onClick={onParent} color={C.parent.accent}>
          <Home size={16} /> I'm a Parent
        </SoftButton>
        <SoftButton onClick={onSignIn} outline color={C.primary}>
          Sign In
        </SoftButton>
      </div>
      <p style={{ fontSize: 12, color: C.textMuted }}>Free to join · No credit card needed</p>
    </section>
  );
}

// ── Audience card ──────────────────────────────────────────────
function AudienceCard({ emoji, title, subtitle, description, points, cta, scheme, onCta, isStudent }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? scheme.cardBg : C.white,
        border: `1.5px solid ${hov ? scheme.border : C.border}`,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}>

      {/* Card header band */}
      <div style={{ background: scheme.pageBg, borderBottom: `1px solid ${scheme.border}`, padding: '20px 22px 16px' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: scheme.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 10 }}>
          {emoji}
        </div>
        <p style={{ fontSize: 19, fontWeight: 800, color: scheme.textDark, margin: '0 0 2px', fontFamily: '"Fredoka One", cursive' }}>{title}</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: scheme.accent, margin: 0, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{subtitle}</p>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 22px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6, margin: 0 }}>{description}</p>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {points.map((pt, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C.textPrimary, lineHeight: 1.4 }}>
              <div style={{ width: 18, height: 18, borderRadius: 6, background: scheme.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Check size={11} style={{ color: scheme.accent }} />
              </div>
              {pt}
            </li>
          ))}
        </ul>

        {/* CTA button */}
        <div style={{ marginTop: 'auto', paddingTop: 6 }}>
          {isStudent ? (
            <div style={{ padding: '9px 14px', borderRadius: 12, background: scheme.pageBg, border: `1px solid ${scheme.border}`, fontSize: 12, color: scheme.textDark, fontWeight: 600, textAlign: 'center' }}>
              👆 Ask a parent or teacher to get started
            </div>
          ) : (
            <SoftButton onClick={onCta} color={scheme.btnBg} style={{ width: '100%' }}>
              {cta} <ArrowRight size={14} />
            </SoftButton>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page: Audience section ─────────────────────────────────────
function AudienceSection({ onTeacher, onParent }) {
  const roles = [
    {
      emoji: '📚', title: 'For Teachers', subtitle: 'Build & Track',
      description: 'Create tailored reading assessments for students with ASD. Monitor comprehension across your whole class with clear skill analytics.',
      points: ['Build custom story assessments at 4 difficulty levels', 'Track literal, inference, vocabulary & emotion skills', 'Generate and send progress reports to parents', 'Manage classrooms with simple 6-character join codes'],
      cta: 'Register as Teacher', scheme: C.teacher, onCta: onTeacher,
    },
    {
      emoji: '🏠', title: 'For Parents', subtitle: 'Support & Celebrate',
      description: 'Stay connected with your child\'s classroom, start reading sessions at home, and receive warm progress updates from their teacher.',
      points: ['Join your child\'s classroom with a simple code', 'Start reading sessions in a calm student-friendly mode', 'Receive and read teacher progress reports', 'Watch your child grow at their own pace'],
      cta: 'Register as Parent', scheme: C.parent, onCta: onParent,
    },
    {
      emoji: '🌟', title: 'For Students', subtitle: 'Read & Explore',
      description: 'Fun reading activities designed just for learners with ASD. Choose your own colour theme and have stories read aloud to you.',
      points: ['Read engaging stories at the right level for you', 'Hear every word read aloud in a friendly voice', 'Earn stars and unlock achievements as you learn', 'Pick from 9 calming colour themes'],
      cta: 'Start with Parent', scheme: C.student, isStudent: true,
    },
  ];

  return (
    <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionLabel icon={<Users size={13} />} text="Who is ReadAble for?" />
      <SectionTitle>A platform built for everyone in a child's learning journey</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 32 }}>
        {roles.map(role => <AudienceCard key={role.title} {...role} />)}
      </div>
    </section>
  );
}


// ── Page: ASD features ─────────────────────────────────────────
function FeaturesSection() {
  const features = [
    { icon: <Volume2 size={20} />, color: C.student, title: 'Read Aloud', desc: 'Every word can be spoken aloud in a calm, clear voice to support comprehension.' },
    { icon: <Palette size={20} />, color: C.parent, title: 'Nine Soft Themes', desc: 'Pastel colour themes designed to be calming and low-sensory for ASD learners.' },
    { icon: <BarChart2 size={20} />, color: C.teacher, title: 'Skill Tracking', desc: 'Detailed breakdowns of literal, inference, vocabulary, sequence and emotion skills.' },
    { icon: <Clock size={20} />, color: C.student, title: 'Go at Your Pace', desc: 'No time pressure. Pause anytime. Learning happens when the student is ready.' },
    { icon: <Star size={20} />, color: C.parent, title: 'Gentle Rewards', desc: 'Encouraging stars, XP and achievements that celebrate every step of progress.' },
    { icon: <Shield size={20} />, color: C.teacher, title: 'Safe & Secure', desc: 'Teacher-approved classrooms, parent-controlled sessions, no ads, no tracking.' },
  ];

  return (
    <section style={{ padding: '0 24px 64px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ borderRadius: 24, background: C.white, border: `1px solid ${C.border}`, padding: '40px 32px', boxShadow: C.shadowSm }}>
        <SectionLabel icon={<Heart size={13} />} text="Purpose-built for ASD" />
        <SectionTitle>Features that make learning feel safe</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 28 }}>
          {features.map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, background: f.color.pageBg, border: `1px solid ${f.color.border}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: f.color.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: f.color.accent }}>
                {f.icon}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: f.color.textDark, margin: '0 0 3px' }}>{f.title}</p>
                <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Page: How it works ─────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { num: '1', scheme: C.teacher, icon: '📚', who: 'Teacher', action: 'Creates a classroom & assessment', detail: 'Build a reading assessment with ASD-optimised questions and publish it to your classroom.' },
    { num: '2', scheme: C.parent, icon: '🏠', who: 'Parent', action: 'Joins classroom & starts a session', detail: 'Enter the classroom code, get approved, then launch a reading session with your child at home.' },
    { num: '3', scheme: C.student, icon: '🌟', who: 'Student', action: 'Reads, answers, earns stars', detail: 'The student reads the story at their own pace with read-aloud support and answers questions.' },
    { num: '4', scheme: C.teacher, icon: '📊', who: 'Teacher', action: 'Reviews and shares a report', detail: 'See detailed skill analytics and send a warm progress report directly to the parent.' },
  ];

  return (
    <section style={{ padding: '0 24px 64px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionLabel icon={<Sparkles size={13} />} text="Simple from the start" />
      <SectionTitle>How ReadAble works</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 28 }}>
        {steps.map(s => (
          <div key={s.num} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: '18px 20px', boxShadow: C.shadowSm }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: s.scheme.pageBg, border: `1px solid ${s.scheme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.scheme.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: s.scheme.accent, flexShrink: 0 }}>
                {s.num}
              </div>
            </div>
            <p style={{ fontSize: 11, fontWeight: 800, color: s.scheme.accent, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>{s.who}</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: '0 0 6px', lineHeight: 1.3 }}>{s.action}</p>
            <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>{s.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Page: Student preview strip ────────────────────────────────
function StudentPreviewStrip() {
  return (
    <section style={{ padding: '0 24px 64px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ borderRadius: 24, background: C.student.pageBg, border: `1.5px solid ${C.student.border}`, padding: '36px 36px 32px', display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: C.student.accentLight, marginBottom: 12 }}>
            <Baby size={12} style={{ color: C.student.accent }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: C.student.textDark, letterSpacing: '0.04em' }}>STUDENT MODE</span>
          </div>
          <h3 style={{ fontFamily: '"Fredoka One", cursive', fontSize: 26, color: C.student.textDark, margin: '0 0 10px', lineHeight: 1.2 }}>A calm space just for learning</h3>
          <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, margin: '0 0 18px' }}>
            When a parent starts a session, the app switches into a distraction-free student mode — large text, soft colours, and a friendly read-aloud voice.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Large text', 'Read aloud', 'No ads', 'Calm colours', 'Go at your pace'].map(tag => (
              <span key={tag} style={{ padding: '5px 12px', borderRadius: 20, background: C.student.accentLight, border: `1px solid ${C.student.border}`, fontSize: 12, fontWeight: 700, color: C.student.textDark }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Mini preview card */}
        <div style={{ flex: '1 1 260px', background: C.white, borderRadius: 18, border: `1.5px solid ${C.student.border}`, padding: 20, boxShadow: C.shadowMd }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.student.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.student.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} style={{ color: C.student.accent }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, margin: 0 }}>The Butterfly Story</p>
              <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>Level 3 · Nature & Growth</p>
            </div>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: C.textPrimary, margin: '0 0 14px', fontWeight: 500 }}>
            A tiny caterpillar crawls on a leaf. It eats and grows bigger every day…
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '9px 0', borderRadius: 12, background: C.student.pageBg, border: `1.5px solid ${C.student.border}`, fontSize: 22, textAlign: 'center' }}>🦋</div>
            <div style={{ flex: 1, padding: '9px 0', borderRadius: 12, background: C.student.pageBg, border: `1.5px solid ${C.student.border}`, fontSize: 22, textAlign: 'center' }}>🐛</div>
            <div style={{ flex: 1, padding: '9px 0', borderRadius: 12, background: C.student.pageBg, border: `1.5px solid ${C.student.border}`, fontSize: 22, textAlign: 'center' }}>🌿</div>
            <div style={{ flex: 1, padding: '9px 0', borderRadius: 12, background: C.student.pageBg, border: `1.5px solid ${C.student.border}`, fontSize: 22, textAlign: 'center' }}>🌸</div>
          </div>
          <p style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 8 }}>What does the caterpillar become?</p>
        </div>
      </div>
    </section>
  );
}

// ── Page: Footer CTA ───────────────────────────────────────────
function Footer({ onTeacher, onParent, onSignIn }) {
  return (
    <footer style={{ background: '#2A2848', padding: '56px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#5A50A0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} color="#FFFFFF" />
          </div>
          <span style={{ fontFamily: '"Fredoka One", cursive', fontSize: 26, color: '#FFFFFF' }}>ReadAble</span>
        </div>
        <h2 style={{ fontFamily: '"Fredoka One", cursive', fontSize: 28, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.2 }}>
          Ready to begin?
        </h2>
        <p style={{ fontSize: 14, color: '#A8A8C8', margin: '0 0 28px', lineHeight: 1.6 }}>
          Join teachers and parents already using ReadAble to support students with ASD.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <SoftButton onClick={onTeacher} color={C.teacher.accent}>
            <GraduationCap size={15} /> Register as Teacher
          </SoftButton>
          <SoftButton onClick={onParent} color={C.parent.accent}>
            <Home size={15} /> Register as Parent
          </SoftButton>
          <SoftButton onClick={onSignIn} outline color="#8080C0">
            Sign In
          </SoftButton>
        </div>
        <p style={{ fontSize: 11, color: '#6060A0', marginTop: 28 }}>
          Free · No ads · Designed with care for neurodiverse learners
        </p>
      </div>
    </footer>
  );
}

// ── Section label & title helpers ─────────────────────────────
function SectionLabel({ icon, text }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#EDE8FF', border: '1px solid #C8C0F0', marginBottom: 10 }}>
      <span style={{ color: '#6050B0', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6050B0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{text}</span>
    </div>
  );
}
function SectionTitle({ children }) {
  return <h2 style={{ fontFamily: '"Fredoka One", cursive', fontSize: 'clamp(22px, 3vw, 30px)', color: C.textPrimary, margin: 0, lineHeight: 1.2 }}>{children}</h2>;
}

// ── Keyframe injection ─────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @keyframes modalPop { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes spin { to { transform: rotate(360deg); } }
      * { box-sizing: border-box; }
      body { margin: 0; }
    `}</style>
  );
}

// ── Main LandingPage export ────────────────────────────────────
export default function LandingPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [modal, setModal] = useState(null); // null | 'signin' | 'teacher' | 'parent'

  useEffect(() => {
    if (user) {
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  return (
    <>
      <GlobalStyles />
      <div style={{
        fontFamily: '"Nunito", sans-serif',
        background: 'var(--bg-primary, #F2F0FA)',
        minHeight: '100vh',
        color: 'var(--text-primary, #28264A)',
      }}>

        {modal === 'settings' && (
          <SettingsModal onClose={() => setModal(null)} />
        )}

        <Nav
          onSignIn={() => setModal('signin')}
          onOpenSettings={() => setModal('settings')}
        />

        <Hero
          onTeacher={() => setModal('teacher')}
          onParent={() => setModal('parent')}
          onSignIn={() => setModal('signin')}
        />

        <AudienceSection
          onTeacher={() => setModal('teacher')}
          onParent={() => setModal('parent')}
        />

        <StudentPreviewStrip />

        <FeaturesSection />

        <HowItWorksSection />

        <Footer
          onTeacher={() => setModal('teacher')}
          onParent={() => setModal('parent')}
          onSignIn={() => setModal('signin')}
        />
      </div>

      {modal === 'signin' && (
        <SignInModal
          onClose={() => setModal(null)}
          onSwitchToRegister={() => setModal('parent')}
        />
      )}
      {(modal === 'teacher' || modal === 'parent') && (
        <RegisterModal
          initialRole={modal}
          onClose={() => setModal(null)}
          onSwitchToSignIn={() => setModal('signin')}
        />
      )}
    </>
  );
}
