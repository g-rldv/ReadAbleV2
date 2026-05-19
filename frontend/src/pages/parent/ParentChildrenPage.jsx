// ============================================================
// ParentChildrenPage.jsx — Enhanced with Assessment Browsing
// Per-child progress stats, published assessment cards,
// difficulty badges, and ASD-learner-first design.
// Soft pastels · Lucide icons · Nunito + Fredoka One
// ============================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserPlus, Baby, Calendar, User, FileText,
  GraduationCap, ArrowRight, CheckCircle2, AlertTriangle,
  Loader2, ClipboardList, BookOpen, Brain, BarChart2,
  Star, Trophy, PlayCircle, ChevronDown, ChevronUp,
  Hash, Layers, Filter, Eye, Clock, Sparkles,
} from 'lucide-react';
import api from '../../utils/api';

// ─── Design tokens ─────────────────────────────────────────────
const C = {
  page:   'var(--bg-primary, #F2F0FA)',
  white:  'var(--bg-card, #FFFFFF)',
  border: 'var(--border-color, #DDD8F2)',
  shadowSm: 'var(--shadow, 0 1px 8px rgba(80,60,160,0.07))',
  shadowMd: '0 4px 24px rgba(80,60,160,0.12)',
  shadowLg: '0 8px 40px rgba(80,60,160,0.15)',

  parent: {
    pageBg:      '#FDF0E8',
    cardBg:      '#FFFAF6',
    border:      '#F0C8A8',
    accent:      '#C06038',
    accentLight: '#FAE0C8',
    textDark:    '#6A2810',
    iconBg:      '#FAD8C0',
  },
  teacher: {
    pageBg:      '#EBF4EF',
    border:      '#B8D8C4',
    accent:      '#3A7A5C',
    accentLight: '#CCEADB',
    textDark:    '#1A4A38',
    iconBg:      '#D0EDE0',
  },
  student: {
    pageBg:      '#EBF0FF',
    border:      '#B8C8F0',
    accent:      '#4058C0',
    accentLight: '#D0D8F8',
    textDark:    '#1A2870',
    iconBg:      '#D0D8F8',
  },
  purple: {
    pageBg:      '#F0EBFF',
    border:      '#C8B8F0',
    accent:      '#7050C0',
    accentLight: '#E8DEFF',
    textDark:    '#2A1070',
    iconBg:      '#DDD0FF',
  },
  danger: {
    pageBg:      '#FEF0F0',
    border:      '#F8C8C8',
    accent:      '#C03030',
    textDark:    '#800000',
    iconBg:      '#FDDADA',
  },
  textPrimary:   'var(--text-primary, #28264A)',
  textSecondary: 'var(--text-muted, #6A6898)',
  textMuted:     'var(--text-muted, #9A98C0)',
  primary:       'var(--accent, #5A50A0)',
};

// ─── Difficulty meta ─────────────────────────────────────────────
const DIFFICULTY_META = {
  1: { label: 'Foundational', short: 'L1', color: '#3A7A5C', bg: '#CCEADB', border: '#B8D8C4', ages: '5–7' },
  2: { label: 'Basic',        short: 'L2', color: '#4058C0', bg: '#D0D8F8', border: '#B8C8F0', ages: '8–10' },
  3: { label: 'Paragraphs',   short: 'L3', color: '#7050C0', bg: '#E8DEFF', border: '#C8B8F0', ages: '11–13' },
  4: { label: 'Complex',      short: 'L4', color: '#C06038', bg: '#FAE0C8', border: '#F0C8A8', ages: '14+' },
};

const FOCUS_AREA_META = {
  literal:    { label: 'Literal',    icon: BookOpen,    color: C.teacher.accent },
  inference:  { label: 'Inference',  icon: Brain,       color: C.purple.accent  },
  vocabulary: { label: 'Vocab',      icon: FileText,    color: C.student.accent },
  sequence:   { label: 'Sequence',   icon: Hash,        color: '#B06020'        },
  emotion:    { label: 'Emotion',    icon: Star,        color: '#C03070'        },
};

// ─── Shared primitives ──────────────────────────────────────────
function SectionLabel({ icon, text }) {
  return (
    <div className="cp-section-label">
      <span style={{ display: 'flex' }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="cp-section-title">{children}</h2>;
}

function SoftButton({ children, type = 'button', onClick, to, disabled, color, outline, className = '', style = {} }) {
  const [hov, setHov] = useState(false);
  const col = color || C.primary;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    minHeight: 40, padding: '0 18px', borderRadius: 12,
    border: `2px solid ${col}`, fontFamily: 'Nunito, sans-serif',
    fontSize: 13, fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1, transition: 'all 0.15s',
    textDecoration: 'none', ...style,
  };
  const filled   = { ...base, background: hov && !disabled ? `${col}DD` : col, color: '#FFFFFF' };
  const outlined = { ...base, background: hov && !disabled ? `${col}12` : 'transparent', color: col };
  const s = outline ? outlined : filled;

  if (to) return (
    <Link to={to} className={className} style={s}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </Link>
  );
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={className} style={s}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

function Field({ icon: Icon, children }) {
  return (
    <div className="cp-field-wrap">
      {Icon && <Icon size={16} style={{ color: C.textMuted, position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />}
      {children}
    </div>
  );
}

function inputStyle(hasIcon = true) {
  return {
    width: '100%', minHeight: 44, boxSizing: 'border-box',
    borderRadius: 12, border: `1.5px solid ${C.border}`,
    background: C.white, color: C.textPrimary,
    padding: hasIcon ? '10px 14px 10px 40px' : '10px 14px',
    fontFamily: 'Nunito, sans-serif', fontSize: 14, outline: 'none',
  };
}

function FlashMessage({ flash }) {
  if (!flash) return null;
  const ok = flash.type === 'success';
  const scheme = ok ? C.teacher : C.danger;
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px', borderRadius: 14,
      background: scheme.pageBg, border: `1.5px solid ${scheme.border}`,
      color: scheme.textDark, fontSize: 13, fontWeight: 800, marginBottom: 18,
    }}>
      <Icon size={17} style={{ color: scheme.accent, flexShrink: 0 }} />
      {flash.msg}
    </div>
  );
}

// ─── Difficulty badge ─────────────────────────────────────────────
function DifficultyBadge({ level, showLabel = false }) {
  const m = DIFFICULTY_META[level] || DIFFICULTY_META[1];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: showLabel ? '3px 10px' : '2px 8px',
      borderRadius: 8, fontSize: showLabel ? 11 : 10,
      fontWeight: 800, background: m.bg,
      border: `1.5px solid ${m.border}`, color: m.color,
      letterSpacing: '0.02em',
    }}>
      <BarChart2 size={10} />
      {showLabel ? m.label : m.short}
      {showLabel && <span style={{ opacity: 0.7, fontWeight: 600 }}>· ages {m.ages}</span>}
    </span>
  );
}

// ─── Focus area chip ──────────────────────────────────────────────
function FocusChip({ areaId }) {
  const m = FOCUS_AREA_META[areaId];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 8,
      background: `${m.color}14`, border: `1px solid ${m.color}30`,
      color: m.color, fontSize: 10, fontWeight: 800,
    }}>
      <Icon size={9} />
      {m.label}
    </span>
  );
}

// ─── Progress ring ────────────────────────────────────────────────
function ProgressRing({ pct, size = 42, stroke = 4, color }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={`${color}22`} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 10, fontWeight: 800, fill: color, fontFamily: 'Nunito, sans-serif' }}>
        {pct}%
      </text>
    </svg>
  );
}

// ─── Assessment card (browsing panel) ────────────────────────────
function AssessmentCard({ assessment, childId, childAttempts, onStartAssessment }) {
  const [hov, setHov] = useState(false);

  // Find the most recent attempt by this child for this assessment
  const attempt = useMemo(() =>
    (childAttempts || []).find(a => a.assessment_id === assessment.id),
  [childAttempts, assessment.id]);

  const isCompleted = attempt?.status === 'completed';
  const isInProgress = attempt?.status === 'in_progress';
  const scorePercent = isCompleted && assessment.total_points > 0
    ? Math.round((attempt.score / assessment.total_points) * 100)
    : null;

  const focusAreas = assessment.autism_focus_areas || [];

  return (
    <div
      className="cp-assessment-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        borderColor: hov ? C.student.border : C.border,
        background: hov ? C.student.pageBg : C.white,
      }}
    >
      {/* Status stripe */}
      <div style={{
        height: 4, borderRadius: '12px 12px 0 0', marginBottom: 16,
        background: isCompleted ? C.teacher.accent : isInProgress ? C.student.accent : C.border,
        transition: 'background 0.2s',
      }} />

      <div style={{ padding: '0 18px 18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: isCompleted ? C.teacher.iconBg : C.student.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isCompleted
              ? <Trophy size={18} style={{ color: C.teacher.accent }} />
              : <BookOpen size={18} style={{ color: C.student.accent }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 14, fontWeight: 900, color: C.textPrimary,
              margin: '0 0 4px', lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {assessment.title}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
              <DifficultyBadge level={assessment.difficulty_level} />
              {assessment.story_theme && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: C.textMuted,
                  background: '#F0EFFA', border: `1px solid ${C.border}`,
                  padding: '2px 7px', borderRadius: 8,
                }}>
                  {assessment.story_theme}
                </span>
              )}
            </div>
          </div>

          {/* Score ring (if completed) */}
          {isCompleted && scorePercent !== null && (
            <ProgressRing pct={scorePercent} color={C.teacher.accent} />
          )}
        </div>

        {/* Description */}
        {assessment.description && (
          <p style={{
            fontSize: 12, color: C.textSecondary, lineHeight: 1.5,
            margin: '0 0 10px', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {assessment.description}
          </p>
        )}

        {/* Focus area chips */}
        {focusAreas.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {focusAreas.slice(0, 4).map(a => <FocusChip key={a} areaId={a} />)}
            {focusAreas.length > 4 && (
              <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, alignSelf: 'center' }}>
                +{focusAreas.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 10,
          background: isCompleted ? C.teacher.pageBg : '#F8F7FF',
          border: `1px solid ${isCompleted ? C.teacher.border : C.border}`,
          marginBottom: 14,
        }}>
          {assessment.page_count != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.textSecondary }}>
              <FileText size={11} style={{ color: C.textMuted }} /> {assessment.page_count} {assessment.page_count === 1 ? 'page' : 'pages'}
            </span>
          )}
          {assessment.question_count != null && (
            <>
              <span style={{ color: C.border, fontSize: 10 }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.textSecondary }}>
                <ClipboardList size={11} style={{ color: C.textMuted }} /> {assessment.question_count} {assessment.question_count === 1 ? 'question' : 'questions'}
              </span>
            </>
          )}
          {assessment.total_points != null && (
            <>
              <span style={{ color: C.border, fontSize: 10 }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.textSecondary }}>
                <Star size={11} style={{ color: C.textMuted }} /> {assessment.total_points} pts
              </span>
            </>
          )}
          {isCompleted && attempt?.completed_at && (
            <>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.teacher.accent }}>
                <CheckCircle2 size={11} /> Done
              </span>
            </>
          )}
          {isInProgress && (
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.student.accent, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> In progress
            </span>
          )}
        </div>

        {/* Age suitability note */}
        {(assessment.recommended_age_min || assessment.recommended_age_max) && (
          <p style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={10} />
            Recommended ages {assessment.recommended_age_min}–{assessment.recommended_age_max}
          </p>
        )}

        {/* Action button */}
        <SoftButton
          color={isCompleted ? C.teacher.accent : C.student.accent}
          outline={isCompleted}
          onClick={() => onStartAssessment(assessment, childId)}
          style={{ width: '100%' }}
        >
          {isCompleted
            ? <><Eye size={14} /> Review Results</>
            : isInProgress
            ? <><PlayCircle size={14} /> Continue</>
            : <><PlayCircle size={14} /> Start Assessment</>}
        </SoftButton>
      </div>
    </div>
  );
}

// ─── Child card (enhanced with assessment stats) ──────────────────
function ChildCard({ child, assessments, childAttempts, onSelectChild, isSelected }) {
  const [hov, setHov] = useState(false);
  const initials = `${child.first_name?.[0] || ''}${child.last_name?.[0] || ''}`.toUpperCase();

  const completedCount = useMemo(() =>
    (childAttempts || []).filter(a => a.status === 'completed').length,
  [childAttempts]);

  const inProgressCount = useMemo(() =>
    (childAttempts || []).filter(a => a.status === 'in_progress').length,
  [childAttempts]);

  const availableCount = (assessments || []).length;

  return (
    <div
      className="cp-child-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: isSelected ? C.shadowLg : hov ? C.shadowMd : C.shadowSm,
        background: isSelected ? C.parent.cardBg : hov ? C.parent.cardBg : C.white,
        borderColor: isSelected ? C.parent.border : hov ? C.parent.border : C.border,
        outline: isSelected ? `2px solid ${C.parent.accent}` : 'none',
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: C.parent.iconBg, color: C.parent.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Fredoka One", cursive', fontSize: 17,
        }}>
          {initials || <Baby size={20} style={{ color: C.parent.accent }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 900, color: C.textPrimary, margin: '0 0 3px', lineHeight: 1.2 }}>
            {child.first_name} {child.last_name}
          </p>
          {child.teacher_first_name ? (
            <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textSecondary, margin: 0 }}>
              <GraduationCap size={12} /> {child.teacher_first_name} {child.teacher_last_name}
            </p>
          ) : (
            <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMuted, margin: 0 }}>
              <ClipboardList size={12} /> Not linked to a classroom
            </p>
          )}
        </div>
      </div>

      {/* Assessment progress stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12,
      }}>
        {[
          { label: 'Available', value: availableCount, color: C.student.accent, bg: C.student.pageBg, border: C.student.border },
          { label: 'Done',      value: completedCount,  color: C.teacher.accent, bg: C.teacher.pageBg, border: C.teacher.border },
          { label: 'Active',    value: inProgressCount, color: C.parent.accent,  bg: C.parent.pageBg,  border: C.parent.border  },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '7px 4px', borderRadius: 10, textAlign: 'center',
            background: stat.bg, border: `1px solid ${stat.border}`,
          }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: stat.color, margin: '0 0 1px', fontFamily: '"Fredoka One", cursive' }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 9, fontWeight: 800, color: stat.color, margin: 0, textTransform: 'uppercase', opacity: 0.8 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <SoftButton
          onClick={() => onSelectChild(child.id)}
          color={C.parent.accent}
          outline={!isSelected}
          style={{ flex: 1, fontSize: 12 }}
        >
          <BookOpen size={13} />
          {isSelected ? 'Viewing' : 'Browse Assessments'}
          {isSelected ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </SoftButton>
        <SoftButton to={`/parent/children/${child.id}`} color={C.student.accent} outline style={{ minWidth: 40, padding: '0 10px' }}>
          <ArrowRight size={13} />
        </SoftButton>
      </div>
    </div>
  );
}

// ─── Assessment browser panel ─────────────────────────────────────
function AssessmentBrowser({ child, assessments, childAttempts, onStartAssessment, loadingAssessments }) {
  const [filter, setFilter] = useState('all');   // 'all' | 'new' | 'completed' | 'in_progress'
  const [diffFilter, setDiffFilter] = useState(0); // 0 = any

  const filtered = useMemo(() => {
    let list = assessments || [];

    if (diffFilter > 0) list = list.filter(a => a.difficulty_level === diffFilter);

    if (filter === 'new') {
      list = list.filter(a =>
        !(childAttempts || []).some(at => at.assessment_id === a.id));
    } else if (filter === 'completed') {
      list = list.filter(a =>
        (childAttempts || []).some(at => at.assessment_id === a.id && at.status === 'completed'));
    } else if (filter === 'in_progress') {
      list = list.filter(a =>
        (childAttempts || []).some(at => at.assessment_id === a.id && at.status === 'in_progress'));
    }

    return list;
  }, [assessments, childAttempts, filter, diffFilter]);

  const tabs = [
    { id: 'all',         label: 'All',         count: (assessments || []).length },
    { id: 'new',         label: 'Not started',
      count: (assessments || []).filter(a => !(childAttempts || []).some(at => at.assessment_id === a.id)).length },
    { id: 'in_progress', label: 'In progress',
      count: (childAttempts || []).filter(at => at.status === 'in_progress').length },
    { id: 'completed',   label: 'Completed',
      count: (childAttempts || []).filter(at => at.status === 'completed').length },
  ];

  if (loadingAssessments) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '48px 0', color: C.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 700,
    }}>
      <Loader2 size={20} className="cp-spin" /> Loading assessments for {child.first_name}…
    </div>
  );

  return (
    <div>
      {/* Browser header */}
      <div style={{
        padding: '20px 24px 0',
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: C.parent.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Fredoka One", cursive', fontSize: 14, color: C.parent.accent,
          }}>
            {child.first_name?.[0]}{child.last_name?.[0]}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 900, color: C.textPrimary, margin: 0 }}>
              Assessments for {child.first_name}
            </p>
            <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>
              Select an assessment to start a reading session
            </p>
          </div>

          {/* Difficulty filter */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={12} style={{ color: C.textMuted }} />
            <select
              value={diffFilter}
              onChange={e => setDiffFilter(parseInt(e.target.value))}
              style={{
                padding: '5px 10px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${C.border}`, background: C.white,
                color: C.textPrimary, fontFamily: 'Nunito, sans-serif', cursor: 'pointer',
              }}>
              <option value={0}>All levels</option>
              {[1, 2, 3, 4].map(l => (
                <option key={l} value={l}>{DIFFICULTY_META[l].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              style={{
                padding: '8px 14px', borderRadius: '10px 10px 0 0',
                border: `1.5px solid ${filter === tab.id ? C.border : 'transparent'}`,
                borderBottom: filter === tab.id ? `1.5px solid ${C.white}` : 'transparent',
                background: filter === tab.id ? C.white : 'transparent',
                color: filter === tab.id ? C.textPrimary : C.textMuted,
                fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap', position: 'relative', bottom: -1,
              }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 900,
                  background: filter === tab.id ? C.student.accentLight : C.border,
                  color: filter === tab.id ? C.student.accent : C.textMuted,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Assessment grid */}
      <div style={{ padding: '20px 24px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 20px',
            color: C.textMuted, fontFamily: 'Nunito, sans-serif',
          }}>
            <Sparkles size={28} style={{ color: C.border, marginBottom: 10 }} />
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
              {filter === 'all'
                ? 'No published assessments available yet.'
                : `No ${tabs.find(t => t.id === filter)?.label.toLowerCase()} assessments.`}
            </p>
          </div>
        ) : (
          <div className="cp-assessment-grid">
            {filtered.map(a => (
              <AssessmentCard
                key={a.id}
                assessment={a}
                childId={child.id}
                childAttempts={childAttempts}
                onStartAssessment={onStartAssessment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Child panel ──────────────────────────────────────────────
function AddChildPanel({ firstName, setFirstName, lastName, setLastName, dob, setDob, gender, setGender, asdNotes, setAsdNotes, adding, onSubmit, classrooms, selectedClassroom, setSelectedClassroom }) {
  return (
    <section className="cp-add-panel">
      <div className="cp-add-header">
        <div style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: C.parent.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UserPlus size={22} style={{ color: C.parent.accent }} />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 900, color: C.textPrimary, margin: '0 0 3px' }}>Add a child</p>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>
            Create a child profile so teachers can link them to classrooms and reports.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="cp-form-grid-2">
          <Field icon={User}>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" style={inputStyle()} />
          </Field>
          <Field icon={User}>
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" style={inputStyle()} />
          </Field>
        </div>
        <div className="cp-form-grid-2">
          <Field icon={Calendar}>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle()} />
          </Field>
          <Field icon={Users}>
            <select value={gender} onChange={e => setGender(e.target.value)} style={inputStyle()}>
              <option value="">Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
        </div>
        <div className="cp-field-wrap textarea">
          <FileText size={16} style={{ color: C.textMuted, position: 'absolute', left: 13, top: 14 }} />
          <textarea value={asdNotes} onChange={e => setAsdNotes(e.target.value)}
            placeholder="Notes, support needs, reading preferences, or classroom context"
            style={{ ...inputStyle(), minHeight: 92, resize: 'vertical', paddingTop: 12 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
          {classrooms?.length > 0 && (
            <select value={selectedClassroom || ''} onChange={e => setSelectedClassroom(e.target.value || null)}
              style={{ height: 40, borderRadius: 12, border: `1.5px solid ${C.border}`, padding: '0 12px', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}>
              <option value="">Link to classroom (optional)</option>
              {classrooms.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.name} — {cl.code}</option>
              ))}
            </select>
          )}
          <SoftButton type="submit" disabled={adding || !firstName.trim()} color={C.parent.accent}>
            {adding ? <Loader2 size={16} className="cp-spin" /> : <UserPlus size={16} />}
            {adding ? 'Adding…' : 'Add Child'}
          </SoftButton>
        </div>
      </form>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function ParentChildrenPage() {
  const [children, setChildren]                   = useState([]);
  const [classrooms, setClassrooms]               = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [loadError, setLoadError]                 = useState(null);

  // Add-child form
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [dob,       setDob]       = useState('');
  const [gender,    setGender]    = useState('');
  const [asdNotes,  setAsdNotes]  = useState('');
  const [adding,    setAdding]    = useState(false);
  const [flash,     setFlash]     = useState(null);

  // Assessment browsing state
  // selectedChildId → string | null
  const [selectedChildId, setSelectedChildId]         = useState(null);
  // assessments: assessment[] (published, visible to this parent's children)
  const [assessments, setAssessments]                 = useState([]);
  const [loadingAssessments, setLoadingAssessments]   = useState(false);
  // childAttempts: { [childId]: attempt[] }
  const [childAttemptsMap, setChildAttemptsMap]       = useState({});

  // ── Load children + classrooms ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/parent/children');
        setChildren(res.data.children || []);
        try {
          const cm = await api.get('/classrooms/my');
          const my = (cm.data.classrooms || []).filter(c => c.status === 'approved');
          setClassrooms(my);
          if (my.length === 1) setSelectedClassroom(my[0].id);
        } catch { /* non-fatal */ }
      } catch (err) {
        setLoadError(err.response?.data?.error || err.message || 'Failed to load children');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Load published assessments once children are present ────
  useEffect(() => {
    if (children.length === 0) return;
    (async () => {
      setLoadingAssessments(true);
      try {
        // Fetch published assessments visible to this parent's students
        const res = await api.get('/assessments', { params: { published: true } });
        setAssessments(res.data.assessments || []);
      } catch (err) {
        console.warn('Failed to load assessments', err);
      } finally {
        setLoadingAssessments(false);
      }
    })();
  }, [children.length]);

  // ── Load attempts for a specific child when they're selected ─
  const loadChildAttempts = useCallback(async (childId) => {
    if (childAttemptsMap[childId]) return;   // already loaded
    try {
      const res = await api.get(`/parent/children/${childId}/attempts`);
      setChildAttemptsMap(prev => ({ ...prev, [childId]: res.data.attempts || [] }));
    } catch (err) {
      console.warn('Failed to load attempts for child', childId, err);
      setChildAttemptsMap(prev => ({ ...prev, [childId]: [] }));
    }
  }, [childAttemptsMap]);

  // ── Child selection toggle ───────────────────────────────────
  const handleSelectChild = useCallback((childId) => {
    setSelectedChildId(prev => {
      const next = prev === childId ? null : childId;
      if (next) loadChildAttempts(next);
      return next;
    });
  }, [loadChildAttempts]);

  // ── Add child ────────────────────────────────────────────────
  const addChild = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    setAdding(true);
    try {
      const res = await api.post('/parent/children', {
        first_name:    firstName.trim(),
        last_name:     lastName.trim(),
        date_of_birth: dob || null,
        gender:        gender || null,
        asd_notes:     asdNotes.trim() || null,
        classroom_id:  selectedClassroom || null,
      });
      setChildren(prev => [res.data.child, ...prev]);
      setFirstName(''); setLastName(''); setDob(''); setGender(''); setAsdNotes('');
      setFlash({ type: 'success', msg: 'Child profile added successfully.' });
      setTimeout(() => setFlash(null), 3000);
    } catch (err) {
      setFlash({ type: 'error', msg: err.response?.data?.error || 'Failed to add child.' });
    } finally {
      setAdding(false);
    }
  };

  // ── Start / review assessment ────────────────────────────────
  const handleStartAssessment = useCallback((assessment, childId) => {
    // Navigate to the assessment player route — adjust to your router structure
    window.location.href = `/parent/children/${childId}/assessments/${assessment.id}`;
  }, []);

  const selectedChild = children.find(c => c.id === selectedChildId);

  // ── Loading / error states ───────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, color: C.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 800,
    }}>
      <Loader2 size={24} className="cp-spin" /> Loading children…
    </div>
  );

  if (loadError) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: 18,
      background: C.danger.pageBg, border: `1.5px solid ${C.danger.border}`,
      color: C.danger.textDark, borderRadius: 18, fontFamily: 'Nunito, sans-serif', fontWeight: 800,
    }}>
      <AlertTriangle size={20} /> Error: {loadError}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes cpSpin { to { transform: rotate(360deg); } }
        .cp-spin { animation: cpSpin 0.8s linear infinite; }

        .cp-page {
          font-family: "Nunito", sans-serif;
          color: ${C.textPrimary};
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Hero ------------------------------------------------- */
        .cp-hero {
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

        .cp-section-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          background: rgba(144, 96, 240, 0.14);
          border: 1px solid rgba(144, 96, 240, 0.32);
          color: ${C.primary};
          margin-bottom: 8px;
        }

        .cp-section-label span:last-child {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .cp-section-title {
          font-family: "Fredoka One", cursive;
          font-size: clamp(22px, 3vw, 28px);
          color: ${C.textPrimary};
          margin: 0 0 4px;
          line-height: 1.15;
        }

        /* Add panel -------------------------------------------- */
        .cp-add-panel {
          background: ${C.white};
          border: 1.5px solid ${C.border};
          border-radius: 22px;
          padding: 24px 26px;
          box-shadow: ${C.shadowSm};
        }

        .cp-add-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 18px;
        }

        .cp-field-wrap {
          position: relative;
          min-width: 0;
        }

        .cp-form-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        /* Children grid ---------------------------------------- */
        .cp-children-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 0;
        }

        /* Child card ------------------------------------------- */
        .cp-child-card {
          border: 2px solid ${C.border};
          border-radius: 20px;
          padding: 18px;
          transition: all 0.18s;
          cursor: default;
        }

        /* Assessment browser panel ------------------------------ */
        .cp-browser-panel {
          background: ${C.white};
          border: 1.5px solid ${C.border};
          border-radius: 22px;
          box-shadow: ${C.shadowSm};
          overflow: hidden;
          animation: cpFadeIn 0.2s ease;
        }

        @keyframes cpFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Assessment grid --------------------------------------- */
        .cp-assessment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
        }

        /* Assessment card --------------------------------------- */
        .cp-assessment-card {
          border: 2px solid ${C.border};
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.18s;
          display: flex;
          flex-direction: column;
        }

        /* Count pill ------------------------------------------- */
        .cp-count-pill {
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

        /* Empty state ------------------------------------------ */
        .cp-empty {
          background: ${C.white};
          border: 1.5px solid ${C.border};
          border-radius: 22px;
          padding: 36px 24px;
          text-align: center;
          box-shadow: ${C.shadowSm};
        }

        /* ── Mobile -------------------------------------------- */
        @media (max-width: 700px) {
          .cp-hero { padding: 22px 20px; border-radius: 18px; flex-direction: column; align-items: flex-start; }
          .cp-form-grid-2 { grid-template-columns: 1fr; }
          .cp-children-grid { grid-template-columns: 1fr; }
          .cp-assessment-grid { grid-template-columns: 1fr; }
          .cp-add-panel { padding: 20px; border-radius: 18px; }
        }

        @media (max-width: 420px) {
          .cp-add-header { gap: 11px; }
        }
      `}</style>

      <div className="cp-page">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="cp-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: C.parent.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={26} style={{ color: C.parent.accent }} />
            </div>
            <div>
              <SectionLabel icon={<Baby size={11} />} text="ReadAble · Parent" />
              <SectionTitle>Your Children</SectionTitle>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.55 }}>
                Browse child profiles, track reading progress, and start assessment sessions.
              </p>
            </div>
          </div>
          {assessments.length > 0 && (
            <div style={{
              flexShrink: 0, padding: '10px 16px', borderRadius: 14,
              background: C.student.pageBg, border: `1.5px solid ${C.student.border}`,
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: C.student.accent, margin: 0, fontFamily: '"Fredoka One", cursive' }}>
                {assessments.length}
              </p>
              <p style={{ fontSize: 10, fontWeight: 800, color: C.student.textDark, margin: 0, textTransform: 'uppercase' }}>
                Published
              </p>
              <p style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, margin: 0 }}>
                assessments
              </p>
            </div>
          )}
        </section>

        <FlashMessage flash={flash} />

        {/* ── Add child ────────────────────────────────────── */}
        <AddChildPanel
          firstName={firstName} setFirstName={setFirstName}
          lastName={lastName}   setLastName={setLastName}
          dob={dob}             setDob={setDob}
          gender={gender}       setGender={setGender}
          asdNotes={asdNotes}   setAsdNotes={setAsdNotes}
          adding={adding}       onSubmit={addChild}
          classrooms={classrooms}
          selectedClassroom={selectedClassroom}
          setSelectedClassroom={setSelectedClassroom}
        />

        {/* ── Children + Assessment Browser ────────────────── */}
        <section>
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 16, marginBottom: 16, flexWrap: 'wrap',
          }}>
            <div>
              <SectionLabel icon={<Users size={11} />} text="Profiles" />
              <SectionTitle>Registered children</SectionTitle>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>
                Select a child to browse and start reading assessments.
              </p>
            </div>
            <span className="cp-count-pill">
              <Users size={13} />
              {children.length} {children.length === 1 ? 'child' : 'children'}
            </span>
          </div>

          {children.length === 0 ? (
            <div className="cp-empty">
              <div style={{
                width: 50, height: 50, borderRadius: 16, margin: '0 auto 14px',
                background: C.student.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Baby size={24} style={{ color: C.student.accent }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 900, color: C.textPrimary, margin: '0 0 6px' }}>No children yet</p>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6, maxWidth: 380, marginInline: 'auto' }}>
                Add your first child profile above to start connecting with teachers and reading sessions.
              </p>
            </div>
          ) : (
            <>
              {/* Child cards grid */}
              <div className="cp-children-grid" style={{ marginBottom: selectedChildId ? 16 : 0 }}>
                {children.map(child => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    assessments={assessments}
                    childAttempts={childAttemptsMap[child.id]}
                    onSelectChild={handleSelectChild}
                    isSelected={selectedChildId === child.id}
                  />
                ))}
              </div>

              {/* Assessment browser — slides in beneath the grid */}
              {selectedChild && (
                <div className="cp-browser-panel">
                  <AssessmentBrowser
                    child={selectedChild}
                    assessments={assessments}
                    childAttempts={childAttemptsMap[selectedChildId] || []}
                    onStartAssessment={handleStartAssessment}
                    loadingAssessments={loadingAssessments || !(childAttemptsMap[selectedChildId])}
                  />
                </div>
              )}
            </>
          )}
        </section>

      </div>
    </>
  );
}