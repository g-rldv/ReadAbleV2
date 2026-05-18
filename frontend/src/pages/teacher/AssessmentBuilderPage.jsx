// ============================================================
// AssessmentBuilderPage.jsx — Redesigned to match TeacherDashboard
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Plus, Trash2, Edit2, Save, X, ArrowLeft,
  BookOpen, ClipboardList, BarChart2, Brain,
  Hash, Clock, CheckCircle2, Eye, EyeOff,
  FileText, AlertCircle,
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────
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
  textPrimary:   '#28264A',
  textSecondary: '#6A6898',
  textMuted:     '#9A98C0',
  primary:       '#5A50A0',
};

// ─── Static data ──────────────────────────────────────────────
const DIFFICULTY_LEVELS = [
  { id: 1, label: 'Level 1: Foundational', desc: 'Single words, pictures, ages 5–7' },
  { id: 2, label: 'Level 2: Basic Sentences', desc: 'Simple sentences, 2–3 choices, ages 8–10' },
  { id: 3, label: 'Level 3: Paragraphs', desc: 'Multi-sentence, main ideas, ages 11–13' },
  { id: 4, label: 'Level 4: Complex Narratives', desc: 'Full stories, inference, ages 14+' },
];

const AUTISM_FOCUS_AREAS = [
  { id: 'literal',    label: 'Literal Comprehension',  icon: BookOpen     },
  { id: 'inference',  label: 'Inferential Thinking',   icon: Brain        },
  { id: 'vocabulary', label: 'Vocabulary Recognition', icon: FileText     },
  { id: 'sequence',   label: 'Sequence Understanding', icon: Hash         },
  { id: 'emotion',    label: 'Emotion / Social Skills',icon: CheckCircle2 },
];

const QUESTION_CATEGORIES = [
  { id: 'literal',   label: 'Literal (fact-based)' },
  { id: 'inference', label: 'Inferential (reasoning)' },
  { id: 'vocabulary',label: 'Vocabulary' },
  { id: 'sequence',  label: 'Sequence / Order' },
  { id: 'emotion',   label: 'Emotion / Social' },
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

function StyledInput({ style: extra = {}, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputBase, borderColor: focus ? C.teacher.accent : C.border, ...extra }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  );
}

function StyledTextarea({ style: extra = {}, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      {...props}
      style={{ ...inputBase, resize: 'vertical', borderColor: focus ? C.teacher.accent : C.border, ...extra }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  );
}

function StyledSelect({ style: extra = {}, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <select
      {...props}
      style={{ ...inputBase, borderColor: focus ? C.teacher.accent : C.border, ...extra }}
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
    ? { ...base, background: hov && !disabled ? `${color}12` : 'transparent', color: color || C.primary }
    : { ...base, background: hov && !disabled ? `${color}DD` : (color || C.primary), color: '#FFFFFF' };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={s}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────
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

// ─── Page form ────────────────────────────────────────────────
function PageForm({ page, onSave, onCancel }) {
  const [data, setData] = useState(page || {
    page_number: 1, page_text: '', image_url: '',
    image_description: '', audio_hint: '',
  });

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
            <StyledInput type="number"
              value={data.page_number}
              onChange={e => setData({ ...data, page_number: parseInt(e.target.value) })} />
          </div>
          <div>
            <FieldLabel>Image URL</FieldLabel>
            <StyledInput type="text" value={data.image_url || ''}
              onChange={e => setData({ ...data, image_url: e.target.value })}
              placeholder="https://…" />
          </div>
        </div>
        <div>
          <FieldLabel required>Page Text</FieldLabel>
          <StyledTextarea rows={3} value={data.page_text}
            onChange={e => setData({ ...data, page_text: e.target.value })}
            placeholder="The story text that students will read…" />
        </div>
        <div>
          <FieldLabel>Image Description (accessibility)</FieldLabel>
          <StyledInput type="text" value={data.image_description || ''}
            onChange={e => setData({ ...data, image_description: e.target.value })}
            placeholder="Describe the image for screen readers" />
        </div>
        <div>
          <FieldLabel>Audio Hint (optional)</FieldLabel>
          <StyledInput type="text" value={data.audio_hint || ''}
            onChange={e => setData({ ...data, audio_hint: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <SoftButton color={C.teacher.accent} onClick={() => onSave(data)} disabled={!data.page_text}>
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

// ─── Question form ────────────────────────────────────────────
function QuestionForm({ question, onSave, onCancel }) {
  const [data, setData] = useState(question || {
    question_text: '', question_type: 'multiple_choice',
    question_category: 'literal', points: 1,
    difficulty_score: 5, time_estimate: 60,
    options: ['', '', ''], correct_answer: '', image_url: '',
  });

  const handleOptionChange = (index, value) => {
    const newOptions = [...(data.options || [])];
    newOptions[index] = value;
    setData({ ...data, options: newOptions });
  };
  const addOption = () => setData({ ...data, options: [...(data.options || []), ''] });
  const removeOption = (index) => setData({ ...data, options: (data.options || []).filter((_, i) => i !== index) });

  return (
    <div style={{
      background: C.student.pageBg,
      border: `1.5px solid ${C.student.border}`,
      borderRadius: 16, padding: '20px', marginBottom: 16,
    }}>
      <p style={{ fontFamily: '"Fredoka One", cursive', fontSize: 16, color: C.student.textDark, margin: '0 0 14px' }}>
        {question ? 'Edit Question' : 'New Question'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <FieldLabel required>Question Text</FieldLabel>
          <StyledTextarea rows={2} value={data.question_text}
            onChange={e => setData({ ...data, question_text: e.target.value })}
            placeholder="What is the question?" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
          <div>
            <FieldLabel>Type</FieldLabel>
            <StyledSelect value={data.question_type}
              onChange={e => setData({ ...data, question_type: e.target.value })}>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="yes_no">Yes / No</option>
              <option value="picture_choice">Picture Choice</option>
              <option value="short_answer">Short Answer</option>
            </StyledSelect>
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <StyledSelect value={data.question_category}
              onChange={e => setData({ ...data, question_category: e.target.value })}>
              {QUESTION_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </StyledSelect>
          </div>
          <div>
            <FieldLabel>Points</FieldLabel>
            <StyledInput type="number" min="1" value={data.points}
              onChange={e => setData({ ...data, points: parseInt(e.target.value) || 1 })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FieldLabel>Difficulty (1–10)</FieldLabel>
            <StyledInput type="number" min="1" max="10" value={data.difficulty_score}
              onChange={e => setData({ ...data, difficulty_score: parseInt(e.target.value) || 5 })} />
          </div>
          <div>
            <FieldLabel>Time Estimate (sec)</FieldLabel>
            <StyledInput type="number" min="10" value={data.time_estimate}
              onChange={e => setData({ ...data, time_estimate: parseInt(e.target.value) || 60 })} />
          </div>
        </div>

        {['multiple_choice', 'picture_choice'].includes(data.question_type) && (
          <div>
            <FieldLabel>Answer Options</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(data.options || []).map((option, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 6 }}>
                  <StyledInput type="text" value={option}
                    onChange={e => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`} />
                  <button onClick={() => removeOption(idx)} title="Remove option"
                    style={{
                      width: 34, height: 34, flexShrink: 0, borderRadius: 9,
                      border: `1.5px solid #F8C8C8`, background: '#FEF0F0',
                      color: '#C03030', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button onClick={addOption}
                style={{
                  alignSelf: 'flex-start', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                  fontSize: 12, fontWeight: 700, color: C.student.accent,
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
                }}>
                <Plus size={13} /> Add option
              </button>
            </div>
          </div>
        )}

        <div>
          <FieldLabel required>
            Correct Answer
            {data.question_type === 'yes_no' && ' (Yes or No)'}
            {['multiple_choice', 'picture_choice'].includes(data.question_type) && ' (must match an option exactly)'}
          </FieldLabel>
          <StyledInput type="text" value={data.correct_answer}
            onChange={e => setData({ ...data, correct_answer: e.target.value })}
            placeholder={data.question_type === 'yes_no' ? 'Yes or No' : 'Enter the correct answer'} />
        </div>

        <div>
          <FieldLabel>Image URL (optional)</FieldLabel>
          <StyledInput type="text" value={data.image_url || ''}
            onChange={e => setData({ ...data, image_url: e.target.value })}
            placeholder="https://…" />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <SoftButton color={C.student.accent}
            onClick={() => onSave(data)}
            disabled={!data.question_text || !data.correct_answer}>
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

// ─── Page row ─────────────────────────────────────────────────
function PageRow({ page, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 12,
        background: hov ? C.teacher.pageBg : '#FAFAF8',
        border: `1.5px solid ${hov ? C.teacher.border : C.border}`,
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: C.teacher.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Fredoka One", cursive', fontSize: 14, color: C.teacher.accent,
      }}>
        {page.page_number}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, margin: 0 }}>
          Page {page.page_number}
        </p>
        <p style={{
          fontSize: 12, color: C.textSecondary, margin: '2px 0 0',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {page.page_text?.substring(0, 90)}{page.page_text?.length > 90 ? '…' : ''}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onEdit(page)} title="Edit"
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: `1.5px solid ${C.student.border}`, background: C.student.iconBg,
            color: C.student.accent, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(page.id)} title="Delete"
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1.5px solid #F8C8C8', background: '#FEF0F0',
            color: '#C03030', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Question row ─────────────────────────────────────────────
function QuestionRow({ question, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 12,
        background: hov ? C.student.pageBg : '#FAFAF8',
        border: `1.5px solid ${hov ? C.student.border : C.border}`,
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: C.student.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ClipboardList size={16} style={{ color: C.student.accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 800, color: C.textPrimary, margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {question.question_text?.substring(0, 70)}{question.question_text?.length > 70 ? '…' : ''}
        </p>
        <p style={{ fontSize: 11, color: C.textSecondary, margin: '2px 0 0' }}>
          {question.question_type} · {question.question_category || 'literal'} · {question.points} pt{question.points !== 1 ? 's' : ''}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onEdit(question)} title="Edit"
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: `1.5px solid ${C.student.border}`, background: C.student.iconBg,
            color: C.student.accent, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(question.id)} title="Delete"
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1.5px solid #F8C8C8', background: '#FEF0F0',
            color: '#C03030', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function AssessmentBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState({
    title: '', description: '', story_theme: '',
    difficulty_level: 1, autism_focus_areas: [],
    recommended_age_min: '', recommended_age_max: '',
  });
  const [pages, setPages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editingPage, setEditingPage] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showPageForm, setShowPageForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (id) loadAssessment(); }, [id]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assessments/${id}`);
      const { assessment: data, pages: pagesData, questions: questionsData } = response.data;
      setAssessment({ ...data, autism_focus_areas: data.autism_focus_areas || [] });
      setPages(pagesData || []);
      setQuestions(questionsData || []);
    } catch (err) {
      setError('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentChange = (field, value) =>
    setAssessment(prev => ({ ...prev, [field]: value }));

  const toggleFocusArea = (areaId) =>
    setAssessment(prev => ({
      ...prev,
      autism_focus_areas: prev.autism_focus_areas.includes(areaId)
        ? prev.autism_focus_areas.filter(a => a !== areaId)
        : [...prev.autism_focus_areas, areaId],
    }));

  const saveAssessment = async () => {
    try {
      setLoading(true); setError('');
      if (id) {
        await api.put(`/assessments/${id}`, assessment);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        const response = await api.post('/assessments', assessment);
        navigate(`/teacher/assessments/${response.data.assessment.id}/edit`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  const savePage = async (pageData) => {
    try {
      if (editingPage?.id) {
        await api.put(`/assessments/${id}/pages/${editingPage.id}`, pageData);
        setPages(pages.map(p => p.id === editingPage.id ? { ...p, ...pageData } : p));
      } else {
        const response = await api.post(`/assessments/${id}/pages`, pageData);
        setPages([...pages, response.data.page]);
      }
      setEditingPage(null); setShowPageForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save page');
    }
  };

  const deletePage = async (pageId) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await api.delete(`/assessments/${id}/pages/${pageId}`);
      setPages(pages.filter(p => p.id !== pageId));
    } catch (err) { console.error(err); }
  };

  const saveQuestion = async (questionData) => {
    try {
      if (editingQuestion?.id) {
        await api.put(`/assessments/${id}/questions/${editingQuestion.id}`, questionData);
        setQuestions(questions.map(q => q.id === editingQuestion.id ? { ...q, ...questionData } : q));
      } else {
        const response = await api.post(`/assessments/${id}/questions`, questionData);
        setQuestions([...questions, response.data.question]);
      }
      setEditingQuestion(null); setShowQuestionForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save question');
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/assessments/${id}/questions/${questionId}`);
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) { console.error(err); }
  };

  const togglePublish = async () => {
    try {
      const response = await api.put(`/assessments/${id}/publish`);
      setAssessment(prev => ({ ...prev, is_published: response.data.assessment.is_published }));
    } catch (err) {
      setError('Failed to toggle publish status');
    }
  };

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

  const canSave = assessment.title && assessment.description && assessment.story_theme;

  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 860,
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Page header ─────────────────────────────────────── */}
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
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.teacher.pageBg; e.currentTarget.style.color = C.teacher.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.textSecondary; }}
        >
          <ArrowLeft size={14} /> Back to Assessments
        </button>
      </div>

      {/* ── Error / success banners ──────────────────────────── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifycontent: 'space-between',
          padding: '12px 16px', borderRadius: 12,
          background: '#FEF0F0', border: '1.5px solid #F8C8C8',
          color: '#C03030', fontSize: 13, fontWeight: 700,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C03030' }}>
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

      {/* ── Assessment details card ──────────────────────────── */}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <FieldLabel>Min Age</FieldLabel>
              <StyledInput type="number" value={assessment.recommended_age_min}
                onChange={e => handleAssessmentChange('recommended_age_min', e.target.value)}
                placeholder="5" />
            </div>
            <div>
              <FieldLabel>Max Age</FieldLabel>
              <StyledInput type="number" value={assessment.recommended_age_max}
                onChange={e => handleAssessmentChange('recommended_age_max', e.target.value)}
                placeholder="10" />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Difficulty level card ────────────────────────────── */}
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
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: active ? C.teacher.textDark : C.textPrimary, margin: 0 }}>
                    {level.label}
                  </p>
                  <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 0' }}>{level.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* ── ASD focus areas card ─────────────────────────────── */}
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
                  type="checkbox"
                  checked={active}
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

      {/* ── Save / Publish actions ───────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
        padding: '18px 22px', borderRadius: 16,
        background: C.white, border: `1px solid ${C.border}`,
        boxShadow: C.shadowSm,
      }}>
        <SoftButton
          color={C.teacher.accent}
          onClick={saveAssessment}
          disabled={loading || !canSave}
          style={{ flex: '1 1 auto' }}
        >
          <Save size={15} />
          {loading ? 'Saving…' : id ? 'Save Changes' : 'Create Assessment'}
        </SoftButton>

        {id && (
          <SoftButton
            color={assessment.is_published ? C.parent.accent : C.teacher.accent}
            outline
            onClick={togglePublish}
          >
            {assessment.is_published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
          </SoftButton>
        )}

        {id && (
          <p style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            {assessment.is_published
              ? <><CheckCircle2 size={12} style={{ color: C.teacher.accent }} /> Published — visible to parents</>
              : <><Clock size={12} /> Draft — not yet visible to parents</>}
          </p>
        )}
      </div>

      {/* ── Pages section ────────────────────────────────────── */}
      {id && (
        <Card>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10, marginBottom: 16,
          }}>
            <div>
              <SectionLabel icon={<FileText size={12} />} text="Story Pages" />
              <SectionTitle>Story Pages ({pages.length})</SectionTitle>
            </div>
            <SoftButton color={C.teacher.accent} small onClick={() => { setEditingPage(null); setShowPageForm(s => !s); }}>
              <Plus size={14} /> Add Page
            </SoftButton>
          </div>

          {showPageForm && (
            <PageForm
              page={editingPage}
              onSave={savePage}
              onCancel={() => { setShowPageForm(false); setEditingPage(null); }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pages.length === 0 && !showPageForm && (
              <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', padding: '20px 0', fontWeight: 600 }}>
                No pages yet. Add pages to build the story.
              </p>
            )}
            {pages.map(page => (
              <PageRow key={page.id} page={page}
                onEdit={p => { setEditingPage(p); setShowPageForm(true); }}
                onDelete={deletePage} />
            ))}
          </div>
        </Card>
      )}

      {/* ── Questions section ─────────────────────────────────── */}
      {id && (
        <Card>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10, marginBottom: 16,
          }}>
            <div>
              <SectionLabel icon={<ClipboardList size={12} />} text="Questions" />
              <SectionTitle>Questions ({questions.length})</SectionTitle>
            </div>
            <SoftButton color={C.student.accent} small onClick={() => { setEditingQuestion(null); setShowQuestionForm(s => !s); }}>
              <Plus size={14} /> Add Question
            </SoftButton>
          </div>

          {showQuestionForm && (
            <QuestionForm
              question={editingQuestion}
              onSave={saveQuestion}
              onCancel={() => { setShowQuestionForm(false); setEditingQuestion(null); }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questions.length === 0 && !showQuestionForm && (
              <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', padding: '20px 0', fontWeight: 600 }}>
                No questions yet. Add questions for students to answer.
              </p>
            )}
            {questions.map(question => (
              <QuestionRow key={question.id} question={question}
                onEdit={q => { setEditingQuestion(q); setShowQuestionForm(true); }}
                onDelete={deleteQuestion} />
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}