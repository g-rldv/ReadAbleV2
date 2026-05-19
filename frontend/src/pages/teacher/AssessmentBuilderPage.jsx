// ============================================================
// AssessmentBuilderPage.jsx — Full creation flow with state
// management, validation guardrails, and payload assembly.
// Soft pastels · Lucide icons · Nunito + Fredoka One
// ============================================================
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Plus, Trash2, Edit2, Save, X, ArrowLeft,
  BookOpen, ClipboardList, BarChart2, Brain,
  Hash, Clock, CheckCircle2, Eye, EyeOff,
  FileText, AlertCircle, AlertTriangle,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────
const C = {
  page:  '#F2F0FA',
  white: '#FFFFFF',
  border:'#DDD8F2',
  shadowSm: '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',
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
  parent: {
    pageBg:      '#FDF0E8',
    border:      '#F0C8A8',
    accent:      '#C06038',
    accentLight: '#FAE0C8',
    textDark:    '#6A2810',
    iconBg:      '#FAD8C0',
  },
  warn: {
    bg:     '#FFFBEB',
    border: '#F9D878',
    text:   '#92600A',
    icon:   '#D4A017',
  },
  textPrimary:   '#28264A',
  textSecondary: '#6A6898',
  textMuted:     '#9A98C0',
  primary:       '#5A50A0',
};

// ─── Difficulty config ─────────────────────────────────────────
// Each level carries rules the QuestionForm uses to adapt itself.
const DIFFICULTY_LEVELS = [
  {
    id: 1,
    label: 'Level 1: Foundational',
    desc: 'Single words, pictures, ages 5–7',
    maxOptions: 2,          // ← choice limit for students
    allowedTypes: ['multiple_choice', 'yes_no', 'picture_choice'],
    hint: 'Max 2 answer choices to avoid choice-paralysis',
  },
  {
    id: 2,
    label: 'Level 2: Basic Sentences',
    desc: 'Simple sentences, 2–3 choices, ages 8–10',
    maxOptions: 3,
    allowedTypes: ['multiple_choice', 'yes_no', 'picture_choice'],
    hint: 'Max 3 answer choices recommended',
  },
  {
    id: 3,
    label: 'Level 3: Paragraphs',
    desc: 'Multi-sentence, main ideas, ages 11–13',
    maxOptions: 5,
    allowedTypes: ['multiple_choice', 'yes_no', 'short_answer', 'picture_choice'],
    hint: 'Up to 5 choices and short-answer questions supported',
  },
  {
    id: 4,
    label: 'Level 4: Complex Narratives',
    desc: 'Full stories, inference, ages 14+',
    maxOptions: 6,
    allowedTypes: ['multiple_choice', 'yes_no', 'short_answer', 'picture_choice'],
    hint: 'Full question variety available',
  },
];

const AUTISM_FOCUS_AREAS = [
  { id: 'literal',    label: 'Literal Comprehension',  icon: BookOpen     },
  { id: 'inference',  label: 'Inferential Thinking',   icon: Brain        },
  { id: 'vocabulary', label: 'Vocabulary Recognition', icon: FileText     },
  { id: 'sequence',   label: 'Sequence Understanding', icon: Hash         },
  { id: 'emotion',    label: 'Emotion / Social Skills',icon: CheckCircle2 },
];

const QUESTION_CATEGORIES = [
  { id: 'literal',    label: 'Literal (fact-based)' },
  { id: 'inference',  label: 'Inferential (reasoning)' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'sequence',   label: 'Sequence / Order' },
  { id: 'emotion',    label: 'Emotion / Social' },
];

const ALL_QUESTION_TYPE_LABELS = {
  multiple_choice: 'Multiple Choice',
  yes_no:          'Yes / No',
  picture_choice:  'Picture Choice',
  short_answer:    'Short Answer',
};

// ─── Helpers ───────────────────────────────────────────────────
/** Generate a temporary local ID for items not yet persisted. */
const tmpId = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/** Deep-clone a plain JS value. */
const clone = (v) => JSON.parse(JSON.stringify(v));

// ─── Shared primitives ─────────────────────────────────────────
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

function SectionTitle({ children, style = {} }) {
  return (
    <h2 style={{
      fontFamily: '"Fredoka One", cursive',
      fontSize: 'clamp(18px, 2.5vw, 22px)',
      color: C.textPrimary, margin: '0 0 4px', lineHeight: 1.2, ...style,
    }}>
      {children}
    </h2>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 800,
      color: C.textSecondary, marginBottom: 6,
      fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {children}{required && <span style={{ color: C.parent.accent, marginLeft: 3 }}>*</span>}
    </label>
  );
}

const inputBase = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', borderRadius: 10,
  border: `1.5px solid ${C.border}`,
  background: C.white, fontFamily: 'Nunito, sans-serif',
  fontSize: 13, color: C.textPrimary,
  outline: 'none', transition: 'border-color 0.15s',
};

function StyledInput({ style: extra = {}, focusColor, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputBase, borderColor: focus ? (focusColor || C.teacher.accent) : C.border, ...extra }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  );
}

function StyledTextarea({ style: extra = {}, focusColor, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      {...props}
      style={{ ...inputBase, resize: 'vertical', borderColor: focus ? (focusColor || C.teacher.accent) : C.border, ...extra }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  );
}

function StyledSelect({ style: extra = {}, focusColor, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <select
      {...props}
      style={{ ...inputBase, borderColor: focus ? (focusColor || C.teacher.accent) : C.border, ...extra }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  );
}

function SoftButton({ children, onClick, color, outline, small, disabled, type = 'button', style: extra = {} }) {
  const [hov, setHov] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: small ? '7px 14px' : '10px 20px',
    borderRadius: 11, fontSize: small ? 12 : 13, fontWeight: 700,
    fontFamily: 'Nunito, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
    border: `2px solid ${color || C.primary}`, transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1, ...extra,
  };
  const s = outline
    ? { ...base, background: hov && !disabled ? `${color}18` : 'transparent', color: color || C.primary }
    : { ...base, background: hov && !disabled ? `${color}DD` : (color || C.primary), color: '#FFFFFF' };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={s}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

function Card({ children, style: extra = {} }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`,
      borderRadius: 20, padding: '24px 24px 20px',
      boxShadow: C.shadowSm, ...extra,
    }}>
      {children}
    </div>
  );
}

/** Contextual hint strip that appears when a level has a rule in effect. */
function DifficultyHint({ text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 13px', borderRadius: 10,
      background: C.warn.bg, border: `1.5px solid ${C.warn.border}`,
      marginBottom: 10,
    }}>
      <AlertTriangle size={14} style={{ color: C.warn.icon, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: C.warn.text, fontFamily: 'Nunito, sans-serif' }}>
        {text}
      </span>
    </div>
  );
}

// ─── PageForm ──────────────────────────────────────────────────
// Receives an existing page (or null for new) and calls onSave/onCancel.
function PageForm({ page, onSave, onCancel }) {
  const [data, setData] = useState(() => page
    ? clone(page)
    : { page_number: 1, page_text: '', image_url: '', image_description: '', audio_hint: '' }
  );

  const [touched, setTouched] = useState({});
  const touch = (field) => setTouched(t => ({ ...t, [field]: true }));

  const isValid = data.page_text.trim().length > 0;

  return (
    <div style={{
      background: C.teacher.pageBg,
      border: `1.5px solid ${C.teacher.border}`,
      borderRadius: 16, padding: '20px', marginBottom: 16,
    }}>
      <p style={{ fontFamily: '"Fredoka One", cursive', fontSize: 16, color: C.teacher.textDark, margin: '0 0 14px' }}>
        {page ? 'Edit Page' : 'New Page'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div>
            <FieldLabel>Page Number</FieldLabel>
            <StyledInput type="number" min="1"
              value={data.page_number}
              onChange={e => setData(d => ({ ...d, page_number: parseInt(e.target.value) || 1 }))}
              focusColor={C.teacher.accent}
            />
          </div>
          <div>
            <FieldLabel>Image URL</FieldLabel>
            <StyledInput type="text" value={data.image_url || ''}
              onChange={e => setData(d => ({ ...d, image_url: e.target.value }))}
              placeholder="https://…" focusColor={C.teacher.accent}
            />
          </div>
        </div>

        <div>
          <FieldLabel required>Page Text</FieldLabel>
          <StyledTextarea rows={3} value={data.page_text}
            onChange={e => setData(d => ({ ...d, page_text: e.target.value }))}
            onBlur={() => touch('page_text')}
            placeholder="The story text that students will read…"
            focusColor={C.teacher.accent}
            style={touched.page_text && !data.page_text.trim() ? { borderColor: '#E05050' } : {}}
          />
          {touched.page_text && !data.page_text.trim() && (
            <p style={{ fontSize: 11, color: '#C03030', fontWeight: 700, margin: '4px 0 0', fontFamily: 'Nunito' }}>
              Page text is required.
            </p>
          )}
        </div>

        <div>
          <FieldLabel>Image Description (accessibility)</FieldLabel>
          <StyledInput type="text" value={data.image_description || ''}
            onChange={e => setData(d => ({ ...d, image_description: e.target.value }))}
            placeholder="Describe the image for screen readers"
            focusColor={C.teacher.accent}
          />
        </div>

        <div>
          <FieldLabel>Audio Hint (optional)</FieldLabel>
          <StyledInput type="text" value={data.audio_hint || ''}
            onChange={e => setData(d => ({ ...d, audio_hint: e.target.value }))}
            focusColor={C.teacher.accent}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <SoftButton color={C.teacher.accent} onClick={() => isValid && onSave(data)} disabled={!isValid}>
            <Save size={14} /> Save Page
          </SoftButton>
          <SoftButton color={C.textMuted} outline onClick={onCancel}>
            <X size={14} /> Cancel
          </SoftButton>
        </div>
      </div>
    </div>
  );
}

// ─── QuestionForm ──────────────────────────────────────────────
// Adapts to the current difficulty level:
// - Level 1: max 2 options, no short_answer
// - Level 2: max 3 options, no short_answer
// - Level 3–4: up to 5–6 options, short_answer allowed
// Validates that correct_answer exactly matches one option (for typed questions).
function QuestionForm({ question, difficultyLevel, onSave, onCancel }) {
  const levelConfig = useMemo(
    () => DIFFICULTY_LEVELS.find(l => l.id === difficultyLevel) || DIFFICULTY_LEVELS[0],
    [difficultyLevel]
  );

  const defaultOptions = () => {
    const count = Math.min(2, levelConfig.maxOptions);
    return Array(count).fill('');
  };

  const [data, setData] = useState(() => question
    ? clone(question)
    : {
        question_text: '',
        question_type: levelConfig.allowedTypes[0] || 'multiple_choice',
        question_category: 'literal',
        options: defaultOptions(),
        correct_answer: '',
        points: 1,
        time_estimate: 60,
        image_url: '',
      }
  );

  const [touched, setTouched] = useState({});
  const touch = (f) => setTouched(t => ({ ...t, [f]: true }));

  // Coerce type constraints if level switches dynamically under us
  useEffect(() => {
    if (!levelConfig.allowedTypes.includes(data.question_type)) {
      setData(d => ({ ...d, question_type: levelConfig.allowedTypes[0] }));
    }
  }, [levelConfig, data.question_type]);

  // Adjust options arrays sizing gracefully based on chosen parameters
  const isChoiceBased = data.question_type !== 'short_answer';

  const handleTypeChange = (newType) => {
    let opts = [...data.options];
    if (newType === 'yes_no') {
      opts = ['Yes', 'No'];
    } else if (newType === 'short_answer') {
      opts = [];
    } else if (opts.length === 0) {
      opts = Array(Math.min(2, levelConfig.maxOptions)).fill('');
    }
    setData(d => ({ ...d, question_type: newType, options: opts, correct_answer: '' }));
  };

  const setOptionValue = (index, value) => {
    const next = [...data.options];
    next[index] = value;
    setData(d => ({ ...d, options: next }));
  };

  const addOptionField = () => {
    if (data.options.length >= levelConfig.maxOptions) return;
    setData(d => ({ ...d, options: [...d.options, ''] }));
  };

  const removeOptionField = (index) => {
    if (data.options.length <= 2) return;
    const next = data.options.filter((_, i) => i !== index);
    setData(d => ({ ...d, options: next, correct_answer: '' }));
  };

  // Inline Validation checks
  const validText = data.question_text.trim().length > 0;
  const validAnswers = useMemo(() => {
    if (data.question_type === 'short_answer') return data.correct_answer.trim().length > 0;
    const activeOpts = data.options.map(o => o.trim()).filter(Boolean);
    if (data.question_type === 'yes_no') return ['yes', 'no'].includes(data.correct_answer.trim().toLowerCase());
    if (activeOpts.length < 2) return false;
    return activeOpts.includes(data.correct_answer.trim());
  }, [data]);

  const isValid = validText && validAnswers;

  return (
    <div style={{
      background: C.student.pageBg,
      border: `1.5px solid ${C.student.border}`,
      borderRadius: 16, padding: '20px', marginBottom: 16,
    }}>
      <p style={{ fontFamily: '"Fredoka One", cursive', fontSize: 16, color: C.student.textDark, margin: '0 0 14px' }}>
        {question ? 'Edit Question' : 'New Question'}
      </p>

      <DifficultyHint text={levelConfig.hint} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FieldLabel>Question Type</FieldLabel>
            <StyledSelect value={data.question_type} onChange={e => handleTypeChange(e.target.value)} focusColor={C.student.accent}>
              {levelConfig.allowedTypes.map(t => (
                <option key={t} value={t}>{ALL_QUESTION_TYPE_LABELS[t]}</option>
              ))}
            </StyledSelect>
          </div>
          <div>
            <FieldLabel>Comprehension Category</FieldLabel>
            <StyledSelect value={data.question_category} onChange={e => setData(d => ({ ...d, question_category: e.target.value }))} focusColor={C.student.accent}>
              {QUESTION_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </StyledSelect>
          </div>
        </div>

        <div>
          <FieldLabel required>Question Content</FieldLabel>
          <StyledInput type="text" value={data.question_text}
            onChange={e => setData(d => ({ ...d, question_text: e.target.value }))}
            onBlur={() => touch('question_text')}
            placeholder="e.g., What did the caterpillar eat on Sunday?"
            focusColor={C.student.accent}
            style={touched.question_text && !data.question_text.trim() ? { borderColor: '#E05050' } : {}}
          />
          {touched.question_text && !data.question_text.trim() && (
            <p style={{ fontSize: 11, color: '#C03030', fontWeight: 700, margin: '4px 0 0' }}>Question text is required.</p>
          )}
        </div>

        {isChoiceBased && data.question_type !== 'yes_no' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <FieldLabel required>Answer Choices</FieldLabel>
              {data.options.length < levelConfig.maxOptions && (
                <button type="button" onClick={addOptionField} style={{
                  background: 'none', border: 'none', color: C.student.accent,
                  fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3
                }}>
                  <Plus size={12} /> Add Choice
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.options.map((option, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, width: 65 }}>Choice {idx + 1}</span>
                  <StyledInput type="text" value={option}
                    onChange={e => setOptionValue(idx, e.target.value)}
                    placeholder={`Option alternative ${idx + 1}`}
                    focusColor={C.student.accent}
                  />
                  {data.options.length > 2 && (
                    <button type="button" onClick={() => removeOptionField(idx)} style={{
                      background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer'
                    }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <FieldLabel required>Canonical Target Correct Answer</FieldLabel>
          {data.question_type === 'yes_no' ? (
            <StyledSelect value={data.correct_answer} onChange={e => setData(d => ({ ...d, correct_answer: e.target.value }))} focusColor={C.student.accent}>
              <option value="">Select Target Match Option</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </StyledSelect>
          ) : isChoiceBased ? (
            <StyledSelect value={data.correct_answer} onChange={e => setData(d => ({ ...d, correct_answer: e.target.value }))} focusColor={C.student.accent}>
              <option value="">Select which alternative is explicitly correct</option>
              {data.options.map(o => o.trim()).filter(Boolean).map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </StyledSelect>
          ) : (
            <StyledInput type="text" value={data.correct_answer}
              onChange={e => setData(d => ({ ...d, correct_answer: e.target.value }))}
              placeholder="Exact grading string token fallback match matches"
              focusColor={C.student.accent}
            />
          )}
          {touch.correct_answer && !validAnswers && (
            <p style={{ fontSize: 11, color: '#C03030', fontWeight: 700, margin: '4px 0 0' }}>
              Target match must precisely intersect active choices lists.
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <FieldLabel>Points</FieldLabel>
            <StyledInput type="number" min="1" value={data.points}
              onChange={e => setData(d => ({ ...d, points: parseInt(e.target.value) || 1 }))}
              focusColor={C.student.accent}
            />
          </div>
          <div>
            <FieldLabel>Est. Time (sec)</FieldLabel>
            <StyledInput type="number" step="10" min="10" value={data.time_estimate}
              onChange={e => setData(d => ({ ...d, time_estimate: parseInt(e.target.value) || 60 }))}
              focusColor={C.student.accent}
            />
          </div>
          <div>
            <FieldLabel>Media URL</FieldLabel>
            <StyledInput type="text" value={data.image_url || ''}
              onChange={e => setData(d => ({ ...d, image_url: e.target.value }))}
              placeholder="Optional card image URL"
              focusColor={C.student.accent}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <SoftButton color={C.student.accent} onClick={() => isValid && onSave(data)} disabled={!isValid}>
            <Save size={14} /> Save Question
          </SoftButton>
          <SoftButton color={C.textMuted} outline onClick={onCancel}>
            <X size={14} /> Cancel
          </SoftButton>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Row Layout Elements ────────────────────────────────
function PageRow({ page, onEdit, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${C.border}`,
      background: '#FAFAF8', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: C.teacher.accentLight,
          color: C.teacher.textDark, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0,
        }}>
          #{page.page_number}
        </div>
        <p style={{ fontSize: 13, margin: 0, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {page.page_text}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onEdit(page)} style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: 4 }}>
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(page.id)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4 }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function QuestionRow({ question, onEdit, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${C.border}`,
      background: '#FAFAF8', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          padding: '4px 8px', borderRadius: 6, background: C.student.accentLight,
          color: C.student.textDark, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', flexShrink: 0,
        }}>
          {ALL_QUESTION_TYPE_LABELS[question.question_type] || question.question_type}
        </div>
        <p style={{ fontSize: 13, margin: 0, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {question.question_text}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginRight: 4 }}>{question.points || 1} pts</span>
        <button onClick={() => onEdit(question)} style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: 4 }}>
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(question.id)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4 }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── AssessmentSummaryBadge ─────────────────────────────────────
// Small stat pills shown in the save bar.
function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '7px 14px', borderRadius: 12,
      background: `${color}14`, border: `1.5px solid ${color}40`,
    }}>
      <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: '"Fredoka One", cursive' }}>
        {value}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function AssessmentBuilderPage() {
  const { id } = useParams();          // Present when editing; absent when creating
  const navigate = useNavigate();

  // ── Core metadata state ──────────────────────────────────────
  const [assessment, setAssessment] = useState({
    title: '',
    description: '',
    story_theme: '',
    difficulty_level: 1,
    autism_focus_areas: [],
    recommended_age_min: '',
    recommended_age_max: '',
    classroom_id: '',
    is_published: false,
  });

  // ── Local collections (pages & questions) ────────────────────
  // These live entirely in React state and are only pushed to the
  // backend via the assembled payload on save (for new assessments)
  // or via individual CRUD calls (for existing assessments).
  const [pages, setPages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  // ── Form-open / editing flags ────────────────────────────────
  const [editingPage, setEditingPage]         = useState(null);  // page obj | null
  const [editingQuestion, setEditingQuestion] = useState(null);  // question obj | null
  const [showPageForm, setShowPageForm]       = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // ── UI feedback ──────────────────────────────────────────────
  const [loading, setLoading]       = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError]           = useState('');

  // ── Seed classrooms on mount ─────────────────────────────────
  useEffect(() => {
    loadClassrooms();
    if (id) loadAssessment();
  }, [id]);

  const loadClassrooms = async () => {
    try {
      const res = await api.get('/classrooms');
      setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error('Failed to load classrooms', err);
    }
  };

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assessments/${id}`);
      const { assessment: data, pages: pData, questions: qData } = res.data;
      setAssessment({ ...data, autism_focus_areas: data.autism_focus_areas || [] });
      setPages(pData || []);
      setQuestions(qData || []);
    } catch {
      setError('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  // ── Metadata helpers ─────────────────────────────────────────
  const handleAssessmentChange = useCallback((field, value) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleFocusArea = useCallback((areaId) => {
    setAssessment(prev => ({
      ...prev,
      autism_focus_areas: prev.autism_focus_areas.includes(areaId)
        ? prev.autism_focus_areas.filter(a => a !== areaId)
        : [...prev.autism_focus_areas, areaId],
    }));
  }, []);

  // ── Derived validation ───────────────────────────────────────
  const canSave = useMemo(() =>
    assessment.title.trim() &&
    assessment.description.trim() &&
    assessment.story_theme.trim(),
  [assessment]);

  // ── Payload assembly ─────────────────────────────────────────
  // Builds the canonical JSON object sent on creation.
  const assemblePayload = useCallback((isPublished = false) => {
    const minAge = parseInt(assessment.recommended_age_min) || null;
    const maxAge = parseInt(assessment.recommended_age_max) || null;

    const cleanedPages = pages.map(({ id: _id, ...rest }) => ({
      page_number:       rest.page_number,
      page_text:         rest.page_text.trim(),
      image_url:         rest.image_url || '',
      image_description: (rest.image_description || '').trim(),
      audio_hint:        (rest.audio_hint || '').trim(),
    }));

    const cleanedQuestions = questions.map(({ id: _id, ...rest }) => ({
      question_text:     rest.question_text.trim(),
      question_type:     rest.question_type,
      question_category: rest.question_category || 'literal',
      options:           (rest.options || []).filter(o => o.trim()),
      correct_answer:    rest.correct_answer.trim(),
      points:            rest.points || 1,
      difficulty_score:  rest.difficulty_score || assessment.difficulty_level * 2,
      time_estimate:     rest.time_estimate || 60,
      image_url:         rest.image_url || '',
    }));

    return {
      title:               assessment.title.trim(),
      description:         assessment.description.trim(),
      story_theme:         assessment.story_theme.trim(),
      min_age:             minAge,
      max_age:             maxAge,
      difficulty_level:    assessment.difficulty_level,
      autism_focus_areas:  assessment.autism_focus_areas,
      classroom_id:        assessment.classroom_id || null,
      is_published:        isPublished,
      pages:               cleanedPages,
      questions:           cleanedQuestions,
    };
  }, [assessment, pages, questions]);

  // ── Save / Create assessment ─────────────────────────────────
  const saveAssessment = async (publishOnSave = false) => {
    try {
      setLoading(true);
      setError('');

      if (id) {
        // Existing: patch metadata only (pages/questions are saved individually)
        await api.put(`/assessments/${id}`, {
          ...assessment,
          is_published: publishOnSave ? !assessment.is_published : assessment.is_published,
        });
        if (publishOnSave) {
          setAssessment(prev => ({ ...prev, is_published: !prev.is_published }));
        }
      } else {
        // New: send the complete assembled payload in one request
        const payload = assemblePayload(publishOnSave);
        const res = await api.post('/assessments', payload);
        // Navigate to edit mode so teacher can continue refining
        navigate(`/teacher/assessments/${res.data.assessment.id}/edit`);
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Page CRUD (local state for new; API for existing) ─────────

  const handleSavePage = async (pageData) => {
    try {
      setError('');
      if (id) {
        // Existing assessment — persist immediately
        if (editingPage?.id && !String(editingPage.id).startsWith('tmp_')) {
          await api.put(`/assessments/${id}/pages/${editingPage.id}`, pageData);
          setPages(prev => prev.map(p => p.id === editingPage.id ? { ...p, ...pageData } : p));
        } else {
          const res = await api.post(`/assessments/${id}/pages`, pageData);
          setPages(prev => [...prev, res.data.page]);
        }
      } else {
        // New assessment — mutate local list only
        if (editingPage?.id) {
          setPages(prev => prev.map(p => p.id === editingPage.id ? { ...p, ...pageData } : p));
        } else {
          setPages(prev => [...prev, { ...pageData, id: tmpId() }]);
        }
      }
      setEditingPage(null);
      setShowPageForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save page');
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Delete this page? This cannot be undone.')) return;
    try {
      if (id && !String(pageId).startsWith('tmp_')) {
        await api.delete(`/assessments/${id}/pages/${pageId}`);
      }
      setPages(prev => prev.filter(p => p.id !== pageId));
    } catch (err) {
      setError('Failed to delete page');
    }
  };

  const handleEditPage = (page) => {
    setEditingPage(page);
    setShowPageForm(true);
    setShowQuestionForm(false);
    setEditingQuestion(null);
  };

  // ── Question CRUD ─────────────────────────────────────────────

  const handleSaveQuestion = async (questionData) => {
    try {
      setError('');
      if (id) {
        if (editingQuestion?.id && !String(editingQuestion.id).startsWith('tmp_')) {
          await api.put(`/assessments/${id}/questions/${editingQuestion.id}`, questionData);
          setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...questionData } : q));
        } else {
          const res = await api.post(`/assessments/${id}/questions`, questionData);
          setQuestions(prev => [...prev, res.data.question]);
        }
      } else {
        if (editingQuestion?.id) {
          setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...questionData } : q));
        } else {
          setQuestions(prev => [...prev, { ...questionData, id: tmpId() }]);
        }
      }
      setEditingQuestion(null);
      setShowQuestionForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    try {
      if (id && !String(questionId).startsWith('tmp_')) {
        await api.delete(`/assessments/${id}/questions/${questionId}`);
      }
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (err) {
      setError('Failed to delete question');
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
    setShowPageForm(false);
    setEditingPage(null);
  };

  // ── Publish toggle (existing assessments only) ────────────────
  const togglePublish = () => saveAssessment(true);

  // ── Loading skeleton ─────────────────────────────────────────
  if (loading && !assessment.title) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 0', gap: 14,
        fontFamily: 'Nunito, sans-serif',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid ${C.teacher.accentLight}`,
          borderTop: `3px solid ${C.teacher.accent}`,
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, margin: 0 }}>
          Loading assessment…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentLevelConfig = DIFFICULTY_LEVELS.find(l => l.id === assessment.difficulty_level) || DIFFICULTY_LEVELS[0];
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 860,
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{
        borderRadius: 22,
        background: C.teacher.pageBg,
        border: `1.5px solid ${C.teacher.border}`,
        padding: '24px 28px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
        boxShadow: C.shadowSm,
      }}>
        <div>
          <SectionLabel icon={<ClipboardList size={12} />} text="Assessment Builder" />
          <SectionTitle style={{ fontSize: 'clamp(18px,3vw,24px)' }}>
            {id ? 'Edit Assessment' : 'Create Assessment'}
          </SectionTitle>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 0', lineHeight: 1.5 }}>
            Design custom reading comprehension assessments for children with ASD
          </p>
        </div>
        <button
          onClick={() => navigate('/teacher/assessments')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            border: `1.5px solid ${C.teacher.border}`, background: C.white,
            color: C.textSecondary, fontFamily: 'Nunito, sans-serif',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.teacher.pageBg; e.currentTarget.style.color = C.teacher.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.textSecondary; }}
        >
          <ArrowLeft size={14} /> Back to Assessments
        </button>
      </div>

      {/* ── Error / Success banners ───────────────────────────── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: 12,
          background: '#FEF0F0', border: '1.5px solid #F8C8C8',
          color: '#C03030', fontSize: 13, fontWeight: 700,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </span>
          <button onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C03030' }}>
            <X size={14} />
          </button>
        </div>
      )}
      {saveSuccess && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderRadius: 12,
          background: C.teacher.accentLight, border: `1.5px solid ${C.teacher.border}`,
          color: C.teacher.textDark, fontSize: 13, fontWeight: 700,
        }}>
          <CheckCircle2 size={15} /> Assessment saved successfully
        </div>
      )}

      {/* ── Assessment details ────────────────────────────────── */}
      <Card>
        <SectionLabel icon={<BookOpen size={12} />} text="Assessment Details" />
        <SectionTitle style={{ marginBottom: 20 }}>Basic Information</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FieldLabel required>Title</FieldLabel>
            <StyledInput type="text" value={assessment.title}
              onChange={e => handleAssessmentChange('title', e.target.value)}
              placeholder="e.g., The Hungry Caterpillar" />
          </div>
          <div>
            <FieldLabel required>Description</FieldLabel>
            <StyledTextarea rows={3} value={assessment.description}
              onChange={e => handleAssessmentChange('description', e.target.value)}
              placeholder="What is this assessment about?" />
          </div>
          <div>
            <FieldLabel required>Story Theme</FieldLabel>
            <StyledInput type="text" value={assessment.story_theme}
              onChange={e => handleAssessmentChange('story_theme', e.target.value)}
              placeholder="e.g., Animals, Space, Daily Routines" />
          </div>
          <div>
            <FieldLabel>Assign to Classroom</FieldLabel>
            <StyledSelect value={assessment.classroom_id || ''}
              onChange={e => handleAssessmentChange('classroom_id', e.target.value)}>
              <option value="">No Classroom (Visible to all my students)</option>
              {classrooms.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </StyledSelect>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <FieldLabel>Min Age</FieldLabel>
              <StyledInput type="number" min="3" max="18"
                value={assessment.recommended_age_min}
                onChange={e => handleAssessmentChange('recommended_age_min', e.target.value)}
                placeholder="5" />
            </div>
            <div>
              <FieldLabel>Max Age</FieldLabel>
              <StyledInput type="number" min="3" max="18"
                value={assessment.recommended_age_max}
                onChange={e => handleAssessmentChange('recommended_age_max', e.target.value)}
                placeholder="10" />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Difficulty level ──────────────────────────────────── */}
      <Card>
        <SectionLabel icon={<BarChart2 size={12} />} text="Difficulty" />
        <SectionTitle style={{ marginBottom: 16 }}>Difficulty Level</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DIFFICULTY_LEVELS.map(level => {
            const active = assessment.difficulty_level === level.id;
            return (
              <label key={level.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                background: active ? C.teacher.accentLight : '#FAFAF8',
                border: `1.5px solid ${active ? C.teacher.border : C.border}`,
                transition: 'all 0.15s',
              }}>
                <input
                  type="radio" name="difficulty" value={level.id}
                  checked={active}
                  onChange={e => handleAssessmentChange('difficulty_level', parseInt(e.target.value))}
                  style={{ accentColor: C.teacher.accent, width: 16, height: 16, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: active ? C.teacher.textDark : C.textPrimary, margin: 0 }}>
                    {level.label}
                  </p>
                  <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 0' }}>{level.desc}</p>
                </div>
                {active && (
                  <span style={{
                    padding: '3px 9px', borderRadius: 10,
                    background: C.teacher.iconBg, color: C.teacher.accent,
                    fontSize: 10, fontWeight: 800,
                  }}>
                    Max {level.maxOptions} choices
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </Card>

      {/* ── ASD focus areas ───────────────────────────────────── */}
      <Card>
        <SectionLabel icon={<Brain size={12} />} text="Learning Focus" />
        <SectionTitle style={{ marginBottom: 16 }}>ASD Learning Focus Areas</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 8 }}>
          {AUTISM_FOCUS_AREAS.map(area => {
            const active = (assessment.autism_focus_areas || []).includes(area.id);
            const Icon = area.icon;
            return (
              <label key={area.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                background: active ? C.student.accentLight : '#FAFAF8',
                border: `1.5px solid ${active ? C.student.border : C.border}`,
                transition: 'all 0.15s',
              }}>
                <input
                  type="checkbox" checked={active}
                  onChange={() => toggleFocusArea(area.id)}
                  style={{ accentColor: C.student.accent, width: 15, height: 15, flexShrink: 0 }}
                />
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: active ? C.student.iconBg : '#EDE8FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} style={{ color: active ? C.student.accent : C.textMuted }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: active ? C.student.textDark : C.textSecondary }}>
                  {area.label}
                </span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* ── Save / Publish action bar ─────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
        padding: '18px 22px', borderRadius: 16,
        background: C.white, border: `1px solid ${C.border}`,
        boxShadow: C.shadowSm,
      }}>
        {/* Summary stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          <StatPill label="Pages" value={pages.length} color={C.teacher.accent} />
          <StatPill label="Questions" value={questions.length} color={C.student.accent} />
          <StatPill label="Points" value={totalPoints} color={C.primary} />
        </div>

        <div style={{ flex: '1 1 auto', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <SoftButton
            color={C.teacher.accent}
            onClick={() => saveAssessment(false)}
            disabled={loading || !canSave}
          >
            <Save size={15} />
            {loading ? 'Saving…' : id ? 'Save Changes' : 'Create Assessment'}
          </SoftButton>

          {id && (
            <SoftButton
              color={assessment.is_published ? C.parent.accent : C.teacher.accent}
              outline
              onClick={togglePublish}
              disabled={loading}
            >
              {assessment.is_published
                ? <><EyeOff size={14} /> Unpublish</>
                : <><Eye size={14} /> Publish</>}
            </SoftButton>
          )}
        </div>

        {id && (
          <p style={{ width: '100%', fontSize: 11, color: C.textMuted, fontWeight: 700, margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
            {assessment.is_published
              ? <><CheckCircle2 size={12} style={{ color: C.teacher.accent }} /> Published — visible to parents</>
              : <><Clock size={12} /> Draft — not yet visible to parents</>}
          </p>
        )}

        {/* Payload preview (dev convenience: hidden in prod) */}
        {process.env.NODE_ENV === 'development' && !id && (
          <details style={{ width: '100%', marginTop: 4 }}>
            <summary style={{ fontSize: 11, color: C.textMuted, cursor: 'pointer', fontWeight: 700 }}>
              Preview submission payload
            </summary>
            <pre style={{
              marginTop: 8, padding: 12, borderRadius: 10,
              background: '#F8F7FF', border: `1px solid ${C.border}`,
              fontSize: 10, color: C.textSecondary, overflowX: 'auto',
              fontFamily: 'monospace', maxHeight: 260,
            }}>
              {JSON.stringify(assemblePayload(), null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* ── Pages section ─────────────────────────────────────── */}
      <Card>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10, marginBottom: 16,
        }}>
          <div>
            <SectionLabel icon={<FileText size={12} />} text="Story Pages" />
            <SectionTitle>Story Pages ({pages.length})</SectionTitle>
          </div>
          <SoftButton color={C.teacher.accent} small
            onClick={() => {
              setEditingPage(null);
              setShowPageForm(s => !s);
              setShowQuestionForm(false);
              setEditingQuestion(null);
            }}>
            <Plus size={14} /> {showPageForm && !editingPage ? 'Cancel' : 'Add Page'}
          </SoftButton>
        </div>

        {showPageForm && (
          <PageForm
            page={editingPage}
            onSave={handleSavePage}
            onCancel={() => { setShowPageForm(false); setEditingPage(null); }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pages.length === 0 && !showPageForm && (
            <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', padding: '20px 0', fontWeight: 600 }}>
              No pages yet — add pages to build the story.
            </p>
          )}
          {[...pages]
            .sort((a, b) => a.page_number - b.page_number)
            .map(page => (
              <PageRow
                key={page.id}
                page={page}
                onEdit={handleEditPage}
                onDelete={handleDeletePage}
              />
            ))}
        </div>
      </Card>

      {/* ── Questions section ──────────────────────────────────── */}
      <Card>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10, marginBottom: 16,
        }}>
          <div>
            <SectionLabel icon={<ClipboardList size={12} />} text="Questions" />
            <SectionTitle>Questions ({questions.length})</SectionTitle>
            <p style={{ fontSize: 12, color: C.textSecondary, margin: '4px 0 0' }}>
              Adapts to <strong>{currentLevelConfig.label}</strong> — max {currentLevelConfig.maxOptions} choices per question
            </p>
          </div>
          <SoftButton color={C.student.accent} small
            onClick={() => {
              setEditingQuestion(null);
              setShowQuestionForm(s => !s);
              setShowPageForm(false);
              setEditingPage(null);
            }}>
            <Plus size={14} /> {showQuestionForm && !editingQuestion ? 'Cancel' : 'Add Question'}
          </SoftButton>
        </div>

        {showQuestionForm && (
          <QuestionForm
            question={editingQuestion}
            difficultyLevel={assessment.difficulty_level}
            onSave={handleSaveQuestion}
            onCancel={() => { setShowQuestionForm(false); setEditingQuestion(null); }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {questions.length === 0 && !showQuestionForm && (
            <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', padding: '20px 0', fontWeight: 600 }}>
              No questions yet — add questions for students to answer.
            </p>
          )}
          {questions.map(question => (
            <QuestionRow
              key={question.id}
              question={question}
              onEdit={handleEditQuestion}
              onDelete={handleDeleteQuestion}
            />
          ))}
        </div>
      </Card>

    </div>
  );
}