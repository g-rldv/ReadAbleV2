// ============================================================
// ParentChildrenPage.jsx
// Soft pastel redesign synced with LandingPage, ParentDashboard,
// and SettingsPage. Lucide icons, responsive layout, no emojis.
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Baby,
  Calendar,
  User,
  FileText,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ClipboardList,
  Heart,
} from 'lucide-react';
import api from '../../utils/api';

const C = {
  page: 'var(--bg-primary, #F2F0FA)',
  white: 'var(--bg-card, #FFFFFF)',
  border: 'var(--border-color, #DDD8F2)',
  shadowSm: 'var(--shadow, 0 1px 8px rgba(80,60,160,0.07))',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',

  parent: {
    pageBg: '#FDF0E8',
    cardBg: '#FFFAF6',
    border: '#F0C8A8',
    accent: '#C06038',
    accentLight: '#FAE0C8',
    textDark: '#6A2810',
    iconBg: '#FAD8C0',
  },

  teacher: {
    pageBg: '#EBF4EF',
    border: '#B8D8C4',
    accent: '#3A7A5C',
    accentLight: '#CCEADB',
    textDark: '#1A4A38',
    iconBg: '#D0EDE0',
  },

  student: {
    pageBg: '#EBF0FF',
    border: '#B8C8F0',
    accent: '#4058C0',
    accentLight: '#D0D8F8',
    textDark: '#1A2870',
    iconBg: '#D0D8F8',
  },

  danger: {
    pageBg: '#FEF0F0',
    border: '#F8C8C8',
    accent: '#C03030',
    textDark: '#800000',
    iconBg: '#FDDADA',
  },

  textPrimary: 'var(--text-primary, #28264A)',
  textSecondary: 'var(--text-muted, #6A6898)',
  textMuted: 'var(--text-muted, #9A98C0)',
  primary: 'var(--accent, #5A50A0)',
};

function SectionTitle({ children }) {
  return <h2 className="children-section-title">{children}</h2>;
}

function SoftButton({ children, type = 'button', onClick, to, disabled, color, outline, className = '', style = {} }) {
  const [hov, setHov] = useState(false);
  const col = color || C.primary;

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 44,
    padding: '0 18px',
    borderRadius: 12,
    border: `2px solid ${col}`,
    fontFamily: 'Nunito, sans-serif',
    fontSize: 14,
    fontWeight: 800,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'all 0.15s',
    textDecoration: 'none',
    ...style,
  };

  const filled = {
    ...base,
    background: hov && !disabled ? `${col}DD` : col,
    color: '#FFFFFF',
  };

  const outlined = {
    ...base,
    background: hov && !disabled ? `${col}12` : 'transparent',
    color: col,
  };

  const finalStyle = outline ? outlined : filled;

  if (to) {
    return (
      <Link
        to={to}
        className={className}
        style={finalStyle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={finalStyle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

function Field({ icon: Icon, children }) {
  return (
    <div className="children-field-wrap">
      {Icon && (
        <Icon size={16} style={{ color: C.textMuted, position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
      )}
      {children}
    </div>
  );
}

function inputStyle(hasIcon = true) {
  return {
    width: '100%',
    minHeight: 44,
    boxSizing: 'border-box',
    borderRadius: 12,
    border: `1.5px solid ${C.border}`,
    background: C.white,
    color: C.textPrimary,
    padding: hasIcon ? '10px 14px 10px 40px' : '10px 14px',
    fontFamily: 'Nunito, sans-serif',
    fontSize: 14,
    outline: 'none',
  };
}

function FlashMessage({ flash }) {
  if (!flash) return null;
  const ok = flash.type === 'success';
  const scheme = ok ? C.teacher : C.danger;
  const Icon = ok ? CheckCircle2 : AlertTriangle;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 14,
        background: scheme.pageBg,
        border: `1.5px solid ${scheme.border}`,
        color: scheme.textDark,
        fontSize: 13,
        fontWeight: 800,
        marginBottom: 18,
      }}
    >
      <Icon size={17} style={{ color: scheme.accent, flexShrink: 0 }} />
      {flash.msg}
    </div>
  );
}

function AddChildPanel({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  dob,
  setDob,
  gender,
  setGender,
  asdNotes,
  setAsdNotes,
  adding,
  onSubmit,
}) {
  return (
    <section className="children-add-panel">
      <div className="children-add-header">
        <div className="children-add-icon">
          <UserPlus size={22} style={{ color: C.parent.accent }} />
        </div>
        <div>
          <p className="children-card-title">Add a child</p>
          <p className="children-card-copy">
            Create a child profile so teachers can link them to classrooms and reports.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="children-form">
        <div className="children-form-grid two">
          <Field icon={User}>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First name"
              style={inputStyle()}
            />
          </Field>

          <Field icon={User}>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Last name"
              style={inputStyle()}
            />
          </Field>
        </div>

        <div className="children-form-grid two">
          <Field icon={Calendar}>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              style={inputStyle()}
            />
          </Field>

          <Field icon={Users}>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              style={inputStyle()}
            >
              <option value="">Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
        </div>

        <div className="children-field-wrap textarea">
          <FileText size={16} style={{ color: C.textMuted, position: 'absolute', left: 13, top: 14 }} />
          <textarea
            value={asdNotes}
            onChange={e => setAsdNotes(e.target.value)}
            placeholder="Notes, support needs, reading preferences, or classroom context"
            style={{
              ...inputStyle(),
              minHeight: 92,
              resize: 'vertical',
              paddingTop: 12,
            }}
          />
        </div>

        <div className="children-form-actions">
          <SoftButton type="submit" disabled={adding || !firstName.trim()} color={C.parent.accent} className="children-primary-action">
            {adding ? <Loader2 size={16} className="children-spin" /> : <UserPlus size={16} />}
            {adding ? 'Adding child...' : 'Add Child'}
          </SoftButton>
        </div>
      </form>
    </section>
  );
}

function ChildCard({ child }) {
  const [hov, setHov] = useState(false);
  const initials = `${child.first_name?.[0] || ''}${child.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div
      className="children-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        background: hov ? C.parent.cardBg : C.white,
        borderColor: hov ? C.parent.border : C.border,
      }}
    >
      <div className="children-avatar">
        {initials || <Baby size={22} style={{ color: C.parent.accent }} />}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <p className="children-name">
          {child.first_name} {child.last_name}
        </p>

        {child.teacher_first_name ? (
          <p className="children-meta">
            <GraduationCap size={13} />
            Teacher: {child.teacher_first_name} {child.teacher_last_name}
          </p>
        ) : (
          <p className="children-meta">
            <ClipboardList size={13} />
            Not linked to a classroom yet
          </p>
        )}

        {child.date_of_birth && (
          <p className="children-meta muted">
            <Calendar size={13} />
            {child.date_of_birth}
          </p>
        )}
      </div>

      <SoftButton
        to={`/parent/children/${child.id}`}
        color={C.student.accent}
        className="children-view-btn"
      >
        View Profile <ArrowRight size={14} />
      </SoftButton>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="children-empty">
      <div className="children-empty-icon">
        <Baby size={26} style={{ color: C.student.accent }} />
      </div>
      <p className="children-card-title">No children yet</p>
      <p className="children-card-copy">
        Add your first child profile above to start connecting with teachers and reading sessions.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="children-loading">
      <Loader2 size={24} className="children-spin" />
      <span>Loading children...</span>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="children-error">
      <AlertTriangle size={20} />
      <span>Error: {message}</span>
    </div>
  );
}

export default function ParentChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [asdNotes, setAsdNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await api.get('/parent/children');
        setChildren(res.data.children || []);
      } catch (err) {
        console.error('Failed to fetch children:', err);
        setLoadError(err.response?.data?.error || err.message || 'Failed to load children');
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const addChild = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    setAdding(true);
    try {
      const res = await api.post('/parent/children', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob || null,
        gender: gender || null,
        asd_notes: asdNotes.trim() || null,
      });

      setChildren(prev => [res.data.child, ...prev]);
      setFirstName('');
      setLastName('');
      setDob('');
      setGender('');
      setAsdNotes('');
      setFlash({ type: 'success', msg: 'Child profile added successfully.' });
      setTimeout(() => setFlash(null), 3000);
    } catch (err) {
      console.error('Failed to add child:', err);
      setFlash({ type: 'error', msg: err.response?.data?.error || 'Failed to add child.' });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <LoadingState />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <>
      <style>{`
        @keyframes childrenSpin {
          to { transform: rotate(360deg); }
        }

        .children-spin {
          animation: childrenSpin 0.8s linear infinite;
        }

        .children-page {
          font-family: "Nunito", sans-serif;
          color: ${C.textPrimary};
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .children-hero {
          border-radius: 22px;
          background: ${C.parent.pageBg};
          border: 1.5px solid ${C.parent.border};
          padding: 26px 28px;
          box-shadow: ${C.shadowSm};
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .children-hero-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }

        .children-hero-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: ${C.parent.iconBg};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .children-section-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          background: rgba(144, 96, 240, 0.16);
          border: 1px solid rgba(144, 96, 240, 0.35);
          color: ${C.primary};
          margin-bottom: 10px;
        }

        .children-section-label span:last-child {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .children-section-title {
          font-family: "Fredoka One", cursive;
          font-size: clamp(24px, 3vw, 30px);
          color: ${C.textPrimary};
          margin: 0 0 6px;
          line-height: 1.15;
        }

        .children-lead {
          font-size: 14px;
          line-height: 1.55;
          color: ${C.textSecondary};
          margin: 0;
          max-width: 560px;
        }

        .children-add-panel,
        .children-empty {
          background: ${C.white};
          border: 1.5px solid ${C.border};
          border-radius: 22px;
          padding: 24px 26px;
          box-shadow: ${C.shadowSm};
        }

        .children-add-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 18px;
        }

        .children-add-icon,
        .children-empty-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: ${C.parent.iconBg};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .children-card-title {
          font-size: 16px;
          font-weight: 900;
          color: ${C.textPrimary};
          margin: 0 0 4px;
        }

        .children-card-copy {
          font-size: 13px;
          line-height: 1.55;
          color: ${C.textSecondary};
          margin: 0;
        }

        .children-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .children-form-grid {
          display: grid;
          gap: 12px;
        }

        .children-form-grid.two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .children-field-wrap {
          position: relative;
          min-width: 0;
        }

        .children-form-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 4px;
        }

        .children-list-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 16px;
        }

        .children-count-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 20px;
          background: ${C.student.pageBg};
          border: 1px solid ${C.student.border};
          color: ${C.student.textDark};
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .children-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .children-card {
          border: 1.5px solid ${C.border};
          border-radius: 20px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.18s;
        }

        .children-avatar {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: ${C.parent.iconBg};
          color: ${C.parent.accent};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: "Fredoka One", cursive;
          font-size: 18px;
        }

        .children-name {
          font-size: 17px;
          font-weight: 900;
          color: ${C.textPrimary};
          margin: 0 0 6px;
          line-height: 1.2;
        }

        .children-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: ${C.textSecondary};
          margin: 3px 0 0;
          min-width: 0;
        }

        .children-meta.muted {
          color: ${C.textMuted};
        }

        .children-view-btn {
          flex-shrink: 0;
          white-space: nowrap;
        }

        .children-empty {
          text-align: center;
          padding: 34px 24px;
        }

        .children-empty-icon {
          margin: 0 auto 14px;
          background: ${C.student.iconBg};
        }

        .children-loading,
        .children-error {
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: ${C.textSecondary};
          font-family: "Nunito", sans-serif;
          font-weight: 800;
        }

        .children-error {
          background: ${C.danger.pageBg};
          border: 1.5px solid ${C.danger.border};
          color: ${C.danger.textDark};
          border-radius: 18px;
          padding: 18px;
          min-height: auto;
        }

        @media (max-width: 700px) {
          .children-page {
            gap: 24px;
          }

          .children-hero {
            padding: 22px 20px;
            border-radius: 18px;
            align-items: flex-start;
          }

          .children-hero-icon {
            width: 46px;
            height: 46px;
            border-radius: 14px;
          }

          .children-section-title {
            font-size: 25px;
          }

          .children-add-panel {
            padding: 20px;
            border-radius: 18px;
          }

          .children-form-grid.two {
            grid-template-columns: 1fr;
          }

          .children-form-actions,
          .children-primary-action {
            width: 100%;
          }

          .children-list-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .children-card {
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: start;
          }

          .children-view-btn {
            grid-column: 1 / -1;
            width: 100%;
            margin-top: 4px;
          }
        }

        @media (max-width: 420px) {
          .children-hero {
            padding: 20px 18px;
          }

          .children-hero-left {
            gap: 12px;
          }

          .children-hero-icon {
            display: none;
          }

          .children-add-header {
            gap: 12px;
          }

          .children-add-icon {
            width: 40px;
            height: 40px;
            border-radius: 13px;
          }

          .children-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="children-page">
        <section className="children-hero">
          <div className="children-hero-left">
            <div className="children-hero-icon">
              <Users size={26} style={{ color: C.parent.accent }} />
            </div>
            <div>
              <SectionLabel icon={<Heart size={12} />} text="Children" />
              <SectionTitle>Your Children</SectionTitle>
              <p className="children-lead">
                Browse child profiles, manage classroom links, and keep reading support organised.
              </p>
            </div>
          </div>
        </section>

        <FlashMessage flash={flash} />

        <AddChildPanel
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          dob={dob}
          setDob={setDob}
          gender={gender}
          setGender={setGender}
          asdNotes={asdNotes}
          setAsdNotes={setAsdNotes}
          adding={adding}
          onSubmit={addChild}
        />

        <section>
          <div className="children-list-header">
            <div>
              <SectionLabel icon={<Baby size={13} />} text="Profiles" />
              <SectionTitle>Registered children</SectionTitle>
              <p className="children-lead">
                Open a profile to review classroom access and student reading activity.
              </p>
            </div>
            <div className="children-count-pill">
              <Users size={14} />
              {children.length} {children.length === 1 ? 'child' : 'children'}
            </div>
          </div>

          {children.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="children-grid">
              {children.map(child => (
                <ChildCard key={child.id} child={child} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}