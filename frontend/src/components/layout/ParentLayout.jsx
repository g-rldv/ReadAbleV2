// ============================================================
// ParentLayout.jsx — Redesigned to match LandingPage style
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// ============================================================
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen, Home, Users, FileText,
  GraduationCap, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

// ─── Design tokens (exact mirror of LandingPage) ─────────────
const C = {
  page:      '#F2F0FA',
  white:     '#FFFFFF',
  border:    '#DDD8F2',
  shadowSm:  '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd:  '0 4px 24px rgba(80,60,160,0.10)',
  parent: {
    pageBg:      '#FDF0E8',
    border:      '#F0C8A8',
    accent:      '#C06038',
    accentLight: '#FAE0C8',
    textDark:    '#6A2810',
    iconBg:      '#FAD8C0',
  },
  textPrimary:   '#28264A',
  textSecondary: '#6A6898',
  textMuted:     '#9A98C0',
  primary:       '#5A50A0',
};

// ─── Nav link definitions (icon + route) ─────────────────────
const NAV_LINKS = [
  { to: '/parent/dashboard',      label: 'Home',      Icon: Home          },
  { to: '/parent/children',       label: 'Children',  Icon: Users         },
  { to: '/parent/reports',        label: 'Reports',   Icon: FileText      },
  { to: '/parent/join-classroom', label: 'Classroom', Icon: GraduationCap },
  { to: '/parent/settings',       label: 'Settings',  Icon: Settings      },
];

// ─── Desktop NavLink pill ─────────────────────────────────────
function DesktopLink({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display:        'inline-flex',
        alignItems:     'center',
        gap:            6,
        padding:        '7px 13px',
        borderRadius:   12,
        fontSize:       13,
        fontWeight:     700,
        fontFamily:     'Nunito, sans-serif',
        textDecoration: 'none',
        transition:     'all 0.15s',
        background:     isActive ? C.parent.accentLight : 'transparent',
        color:          isActive ? C.parent.accent      : C.textSecondary,
        border:         isActive
          ? `1.5px solid ${C.parent.border}`
          : '1.5px solid transparent',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} style={{ color: isActive ? C.parent.accent : C.textMuted }} />
          {label}
        </>
      )}
    </NavLink>
  );
}

// ─── Mobile NavLink row ───────────────────────────────────────
function MobileLink({ to, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        display:        'flex',
        alignItems:     'center',
        gap:            12,
        padding:        '13px 18px',
        borderRadius:   14,
        fontSize:       14,
        fontWeight:     700,
        fontFamily:     'Nunito, sans-serif',
        textDecoration: 'none',
        transition:     'all 0.15s',
        background:     isActive ? C.parent.accentLight : 'transparent',
        color:          isActive ? C.parent.accent      : C.textSecondary,
        border:         isActive
          ? `1.5px solid ${C.parent.border}`
          : '1.5px solid transparent',
      })}
    >
      {({ isActive }) => (
        <>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: isActive ? C.parent.iconBg : '#F0EDF8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={17} style={{ color: isActive ? C.parent.accent : C.textMuted }} />
          </div>
          {label}
        </>
      )}
    </NavLink>
  );
}

// ─── Icon button ──────────────────────────────────────────────
function IconBtn({ onClick, children, title, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        border:      `1.5px solid ${hov ? (danger ? '#F8C8C8' : C.border) : C.border}`,
        background:  hov ? (danger ? '#FEF0F0' : C.page) : C.white,
        color:       hov ? (danger ? '#C03030' : C.primary) : C.textMuted,
        cursor:      'pointer',
        display:     'flex', alignItems: 'center', justifyContent: 'center',
        transition:  'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

// ─── Main layout ──────────────────────────────────────────────
export default function ParentLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // User initials avatar
  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      <div style={{
        minHeight:   '100vh',
        background:  `var(--bg-primary, ${C.page})`,
        fontFamily:  '"Nunito", sans-serif',
        color:       C.textPrimary,
      }}>

        {/* ══ Header ══════════════════════════════════════════ */}
        <header style={{
          position:     'sticky', top: 0, zIndex: 100,
          background:   C.white,
          borderBottom: `1px solid ${C.border}`,
          boxShadow:    C.shadowSm,
        }}>
          <div style={{
            maxWidth:       1100,
            margin:         '0 auto',
            padding:        '0 24px',
            height:         62,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            16,
          }}>

            {/* ── Logo ──────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: C.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen size={18} color="#FFFFFF" />
                </div>
                <span style={{
                  fontFamily: '"Fredoka One", cursive',
                  fontSize: 22, color: C.textPrimary, whiteSpace: 'nowrap',
                }}>
                  ReadAble
                </span>
              </div>

              {/* Divider */}
              <div style={{
                width: 1, height: 22, background: C.border, flexShrink: 0,
                display: 'none',
              }}
                className="desk-divider"
              />

              {/* ── Desktop nav ─────────────────────────────── */}
              <nav style={{
                display: 'none', alignItems: 'center', gap: 2,
              }}
                className="desktop-nav"
              >
                {NAV_LINKS.map(link => (
                  <DesktopLink key={link.to} {...link} />
                ))}
              </nav>
            </div>

            {/* ── Right side ────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

              {/* User pill — desktop only */}
              <div style={{
                display: 'none', alignItems: 'center', gap: 8,
                padding: '5px 12px 5px 6px',
                borderRadius: 20,
                border: `1px solid ${C.border}`,
                background: C.page,
              }}
                className="user-pill"
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: C.parent.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: C.parent.accent,
                  fontFamily: '"Fredoka One", cursive',
                }}>
                  {initials}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: C.textSecondary,
                  whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user?.first_name} {user?.last_name}
                </span>
              </div>

              {/* Logout */}
              <IconBtn onClick={handleLogout} title="Log out" danger>
                <LogOut size={17} />
              </IconBtn>

              {/* Mobile hamburger */}
              <IconBtn
                onClick={() => setMobileOpen(o => !o)}
                title={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </IconBtn>
            </div>
          </div>

          {/* ── Mobile drawer ───────────────────────────────── */}
          {mobileOpen && (
            <div style={{
              borderTop:  `1px solid ${C.border}`,
              background: C.white,
              padding:    '14px 20px 20px',
              animation:  'slideDown 0.2s ease-out',
            }}>
              {/* User row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 14,
                background: C.parent.pageBg,
                border: `1.5px solid ${C.parent.border}`,
                marginBottom: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11,
                  background: C.parent.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: C.parent.accent,
                  fontFamily: '"Fredoka One", cursive', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: 0 }}>
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>Parent account</p>
                </div>
              </div>

              {/* Nav links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {NAV_LINKS.map(link => (
                  <MobileLink
                    key={link.to}
                    {...link}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', marginTop: 10, padding: '13px 18px',
                  borderRadius: 14, border: '1.5px solid #F8C8C8',
                  background: '#FEF0F0', color: '#C03030',
                  cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                  fontSize: 14, fontWeight: 700,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: '#FDDADA', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LogOut size={17} style={{ color: '#C03030' }} />
                </div>
                Log out
              </button>
            </div>
          )}
        </header>

        {/* ══ Page content ════════════════════════════════════ */}
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          <Outlet />
        </main>

        {/* ── Responsive overrides ─────────────────────────── */}
        <style>{`
          @media (min-width: 768px) {
            .desktop-nav   { display: flex !important; }
            .desk-divider  { display: block !important; }
            .user-pill     { display: flex !important; }
          }
        `}</style>
      </div>
    </>
  );
}