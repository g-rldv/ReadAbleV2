import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const DIFFICULTY_LEVELS = [
  { id: 1, label: 'Level 1: Foundational', desc: 'Single words, pictures, ages 5-7' },
  { id: 2, label: 'Level 2: Basic Sentences', desc: 'Simple sentences, 2-3 choices, ages 8-10' },
  { id: 3, label: 'Level 3: Paragraphs', desc: 'Multi-sentence, main ideas, ages 11-13' },
  { id: 4, label: 'Level 4: Complex Narratives', desc: 'Full stories, inference, ages 14+' },
];

const AUTISM_FOCUS_AREAS = [
  { id: 'literal', label: 'Literal Comprehension', icon: '📖' },
  { id: 'inference', label: 'Inferential Thinking', icon: '🧠' },
  { id: 'vocabulary', label: 'Vocabulary Recognition', icon: '📚' },
  { id: 'sequence', label: 'Sequence Understanding', icon: '🔢' },
  { id: 'emotion', label: 'Emotion/Social Skills', icon: '❤️' },
];

const QUESTION_CATEGORIES = [
  { id: 'literal', label: 'Literal (fact-based)' },
  { id: 'inference', label: 'Inferential (reasoning)' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'sequence', label: 'Sequence/Order' },
  { id: 'emotion', label: 'Emotion/Social' },
];

export default function AssessmentBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Form state
  const [assessment, setAssessment] = useState({
    title: '',
    description: '',
    story_theme: '',
    difficulty_level: 1,
    autism_focus_areas: [],
    recommended_age_min: '',
    recommended_age_max: '',
  });

  const [pages, setPages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editingPage, setEditingPage] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showPageForm, setShowPageForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load existing assessment if editing
  useEffect(() => {
    if (id) {
      loadAssessment();
    }
  }, [id]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/assessments/${id}`);
      const { assessment: data, pages: pagesData, questions: questionsData } = response.data;
      setAssessment({
        ...data,
        autism_focus_areas: data.autism_focus_areas || [],
      });
      setPages(pagesData || []);
      setQuestions(questionsData || []);
    } catch (err) {
      setError('Failed to load assessment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentChange = (field, value) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  };

  const toggleFocusArea = (areaId) => {
    setAssessment(prev => ({
      ...prev,
      autism_focus_areas: prev.autism_focus_areas.includes(areaId)
        ? prev.autism_focus_areas.filter(a => a !== areaId)
        : [...prev.autism_focus_areas, areaId]
    }));
  };

  const saveAssessment = async () => {
    try {
      setLoading(true);
      if (id) {
        await api.put(`/api/assessments/${id}`, assessment);
      } else {
        const response = await api.post('/api/assessments', assessment);
        navigate(`/teacher/assessment-builder/${response.data.assessment.id}`);
      }
      setError('');
    } catch (err) {
      setError('Failed to save assessment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const savePage = async (pageData) => {
    try {
      if (editingPage?.id) {
        await api.put(`/api/assessments/${id}/pages/${editingPage.id}`, pageData);
        setPages(pages.map(p => p.id === editingPage.id ? { ...p, ...pageData } : p));
      } else {
        const response = await api.post(`/api/assessments/${id}/pages`, pageData);
        setPages([...pages, response.data.page]);
      }
      setEditingPage(null);
      setShowPageForm(false);
    } catch (err) {
      console.error('Failed to save page:', err);
    }
  };

  const deletePage = async (pageId) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await api.delete(`/api/assessments/${id}/pages/${pageId}`);
      setPages(pages.filter(p => p.id !== pageId));
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  };

  const saveQuestion = async (questionData) => {
    try {
      if (editingQuestion?.id) {
        await api.put(`/api/assessments/${id}/questions/${editingQuestion.id}`, questionData);
        setQuestions(questions.map(q => q.id === editingQuestion.id ? { ...q, ...questionData } : q));
      } else {
        const response = await api.post(`/api/assessments/${id}/questions`, questionData);
        setQuestions([...questions, response.data.question]);
      }
      setEditingQuestion(null);
      setShowQuestionForm(false);
    } catch (err) {
      console.error('Failed to save question:', err);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/api/assessments/${id}/questions/${questionId}`);
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assessment Builder</h1>
        <p className="text-slate-600">Design custom reading comprehension assessments for children with ASD</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Assessment Meta Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Assessment Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={assessment.title}
              onChange={e => handleAssessmentChange('title', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., The Hungry Caterpillar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              value={assessment.description}
              onChange={e => handleAssessmentChange('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="What is this assessment about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Story Theme *</label>
            <input
              type="text"
              value={assessment.story_theme}
              onChange={e => handleAssessmentChange('story_theme', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Animals, Space, Daily Routines"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Min Age</label>
              <input
                type="number"
                value={assessment.recommended_age_min}
                onChange={e => handleAssessmentChange('recommended_age_min', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Age</label>
              <input
                type="number"
                value={assessment.recommended_age_max}
                onChange={e => handleAssessmentChange('recommended_age_max', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="10"
              />
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium mb-3">Difficulty Level</label>
            <div className="grid grid-cols-1 gap-2">
              {DIFFICULTY_LEVELS.map(level => (
                <label key={level.id} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                  <input
                    type="radio"
                    name="difficulty"
                    value={level.id}
                    checked={assessment.difficulty_level === level.id}
                    onChange={e => handleAssessmentChange('difficulty_level', parseInt(e.target.value))}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-slate-600">{level.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ASD Focus Areas */}
          <div>
            <label className="block text-sm font-medium mb-3">ASD Learning Focus Areas</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AUTISM_FOCUS_AREAS.map(area => (
                <label key={area.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-purple-50">
                  <input
                    type="checkbox"
                    checked={assessment.autism_focus_areas.includes(area.id)}
                    onChange={() => toggleFocusArea(area.id)}
                    className="mr-3"
                  />
                  <span>
                    <span className="mr-2">{area.icon}</span>
                    {area.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={saveAssessment}
            disabled={loading || !assessment.title || !assessment.description || !assessment.story_theme}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Assessment' : 'Create Assessment'}
          </button>
        </div>
      </div>

      {id && (
        <>
          {/* Pages Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Story Pages ({pages.length})</h2>
              <button
                onClick={() => {
                  setEditingPage(null);
                  setShowPageForm(!showPageForm);
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus size={18} /> Add Page
              </button>
            </div>

            {showPageForm && (
              <PageForm
                page={editingPage}
                onSave={savePage}
                onCancel={() => {
                  setShowPageForm(false);
                  setEditingPage(null);
                }}
              />
            )}

            <div className="space-y-2">
              {pages.map(page => (
                <div key={page.id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">Page {page.page_number}</div>
                    <div className="text-sm text-slate-600">{page.page_text?.substring(0, 60)}...</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPage(page);
                        setShowPageForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deletePage(page.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setShowQuestionForm(!showQuestionForm);
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus size={18} /> Add Question
              </button>
            </div>

            {showQuestionForm && (
              <QuestionForm
                question={editingQuestion}
                onSave={saveQuestion}
                onCancel={() => {
                  setShowQuestionForm(false);
                  setEditingQuestion(null);
                }}
              />
            )}

            <div className="space-y-2">
              {questions.map(question => (
                <div key={question.id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{question.question_text?.substring(0, 60)}</div>
                    <div className="text-sm text-slate-600">
                      Type: {question.question_type} | Category: {question.question_category || 'literal'} | Points: {question.points}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(question);
                        setShowQuestionForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Page Form Component
function PageForm({ page, onSave, onCancel }) {
  const [data, setData] = useState(page || {
    page_number: 1,
    page_text: '',
    image_url: '',
    image_description: '',
    audio_hint: '',
  });

  return (
    <div className="bg-slate-50 p-4 rounded-lg mb-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Page Number</label>
            <input
              type="number"
              value={data.page_number}
              onChange={e => setData({ ...data, page_number: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="text"
              value={data.image_url || ''}
              onChange={e => setData({ ...data, image_url: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="https://..."
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Page Text</label>
          <textarea
            value={data.page_text}
            onChange={e => setData({ ...data, page_text: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Image Description (for accessibility)</label>
          <input
            type="text"
            value={data.image_description || ''}
            onChange={e => setData({ ...data, image_description: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Audio Hint (optional)</label>
          <input
            type="text"
            value={data.audio_hint || ''}
            onChange={e => setData({ ...data, audio_hint: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(data)}
            className="flex-1 bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
          >
            <Save size={16} /> Save Page
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-400 text-white py-1 rounded text-sm hover:bg-slate-500 flex items-center justify-center gap-1"
          >
            <X size={16} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Question Form Component
function QuestionForm({ question, onSave, onCancel }) {
  const [data, setData] = useState(question || {
    question_text: '',
    question_type: 'multiple_choice',
    question_category: 'literal',
    points: 1,
    difficulty_score: 5,
    time_estimate: 60,
    options: [],
    correct_answer: '',
    image_url: '',
  });

  const handleOptionChange = (index, value) => {
    const newOptions = [...(data.options || [])];
    newOptions[index] = value;
    setData({ ...data, options: newOptions });
  };

  return (
    <div className="bg-slate-50 p-4 rounded-lg mb-4">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Question Text *</label>
          <textarea
            value={data.question_text}
            onChange={e => setData({ ...data, question_text: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            rows="2"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={data.question_type}
              onChange={e => setData({ ...data, question_type: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="yes_no">Yes/No</option>
              <option value="picture_choice">Picture Choice</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={data.question_category}
              onChange={e => setData({ ...data, question_category: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              {QUESTION_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Points</label>
            <input
              type="number"
              value={data.points}
              onChange={e => setData({ ...data, points: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty Score (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={data.difficulty_score}
              onChange={e => setData({ ...data, difficulty_score: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time Estimate (seconds)</label>
            <input
              type="number"
              value={data.time_estimate}
              onChange={e => setData({ ...data, time_estimate: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>

        {['multiple_choice', 'picture_choice'].includes(data.question_type) && (
          <div>
            <label className="block text-sm font-medium mb-1">Options</label>
            {(data.options || []).map((option, idx) => (
              <input
                key={idx}
                type="text"
                value={option}
                onChange={e => handleOptionChange(idx, e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm mb-1"
                placeholder={`Option ${idx + 1}`}
              />
            ))}
            <button
              onClick={() => setData({ ...data, options: [...(data.options || []), ''] })}
              className="text-blue-600 text-sm hover:underline"
            >
              + Add Option
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Correct Answer *</label>
          <input
            type="text"
            value={data.correct_answer}
            onChange={e => setData({ ...data, correct_answer: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="Enter correct answer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
          <input
            type="text"
            value={data.image_url || ''}
            onChange={e => setData({ ...data, image_url: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onSave(data)}
            className="flex-1 bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
          >
            <Save size={16} /> Save Question
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-400 text-white py-1 rounded text-sm hover:bg-slate-500 flex items-center justify-center gap-1"
          >
            <X size={16} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
