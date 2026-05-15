import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  BookOpen, CheckCircle, ClipboardList, Clock, FileText,
  Filter, Plus, Search, Users, X, Trash2, Edit2, Save,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/sop-trainings.css';
import '../styles/question-modal.css';

const statusFilters = ['All', 'Active', 'Draft', 'Review'];
const departments = [
  'All Departments', 'Accounts', 'Analytical Development', 'Development Quality Assurance',
  'EHS', 'Engineering', 'Finance', 'Formulation Development', 'HR & Admin', 'IT',
  'Microbiology', 'Packaging Development', 'Production',
  'Production Planning & Inventory Control', 'Purchase & Logistics',
  'Quality Assurance', 'Quality Control', 'Regulatory Affairs',
  'Sales & Marketing', 'Strategy Planning', 'Technology Transfer', 'Warehouse',
];

const getStatusClass = (s) => (s || 'active').toLowerCase().replace(/\s+/g, '-');
const formatDuration = (h) => !h ? 'N/A' : h >= 1 ? `${h}h` : `${Math.round(h * 60)}m`;

// ── Blank question form ───────────────────────────────────────────────────────
const BLANK_Q = { question_text: '', options: ['', '', '', ''], correct: '', points: 1 };

const QuestionForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(() =>
    initial
      ? {
          question_text: initial.question_text || '',
          options: initial.options?.length
            ? initial.options.map((o) => o.option_text)
            : ['', '', '', ''],
          correct: initial.correct_answer || '',
          points: initial.points || 1,
        }
      : { ...BLANK_Q }
  );

  const setOpt = (i, val) => {
    const opts = [...form.options];
    opts[i] = val;
    const correct = form.correct === form.options[i] ? val : form.correct;
    setForm((f) => ({ ...f, options: opts, correct }));
  };

  const valid = form.question_text.trim() && form.options.filter((o) => o.trim()).length >= 2 && form.correct;

  const handleSave = () => {
    const opts = form.options.map((o, i) => ({ option_text: o, is_correct: o === form.correct, order: i + 1 })).filter((o) => o.option_text.trim());
    onSave({
      question_text: form.question_text.trim(),
      question_type: 'multiple_choice',
      correct_answer: form.correct,
      points: Number(form.points) || 1,
      order: 0,
      options: opts,
    });
  };

  return (
    <div className="qm-form">
      <div className="qm-form-field">
        <label>Question Text *</label>
        <textarea
          rows={2}
          placeholder="Enter the question..."
          value={form.question_text}
          onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
        />
      </div>
      <div className="qm-options-grid">
        {form.options.map((opt, i) => (
          <label key={i} className={`qm-option-row ${form.correct === opt && opt ? 'qm-correct' : ''}`}>
            <input
              type="radio"
              name="correct-opt"
              checked={!!(form.correct && form.correct === opt && opt)}
              onChange={() => opt.trim() && setForm((f) => ({ ...f, correct: opt }))}
            />
            <input
              type="text"
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              value={opt}
              onChange={(e) => setOpt(i, e.target.value)}
            />
            {form.correct === opt && opt && <span className="qm-correct-tag">Correct</span>}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          Points:
          <input
            type="number"
            min="1"
            value={form.points}
            onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
            style={{ width: 60, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
          />
        </label>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="qm-btn qm-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="qm-btn qm-btn-primary" onClick={handleSave} disabled={!valid || saving}>
            {saving ? 'Saving...' : <><Save size={14} /> Save Question</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Manage Questions Modal ────────────────────────────────────────────────────
const ManageQuestionsModal = ({ course, onClose, onSaved }) => {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizForm, setQuizForm] = useState({ title: `${course.title} Quiz`, passing_score: course.passing_score || 70, description: '', max_attempts: 3 });
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [addingQ, setAddingQ] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingQ, setSavingQ] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editQuizMode, setEditQuizMode] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/quizzes/course/${course.id}`);
      if (res.data.length > 0) {
        const q = res.data[0];
        setQuiz(q);
        setQuizForm({ title: q.title, passing_score: q.passing_score, description: q.description || '', max_attempts: q.max_attempts || 3 });
        const qres = await api.get(`/api/v1/quizzes/${q.id}/questions`);
        setQuestions(qres.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  const handleCreateQuiz = async () => {
    setCreatingQuiz(true);
    try {
      const res = await api.post('/api/v1/quizzes/', {
        title: quizForm.title || `${course.title} Quiz`,
        course_id: course.id,
        passing_score: Number(quizForm.passing_score) || 70,
        description: quizForm.description || '',
        max_attempts: Number(quizForm.max_attempts) || 3,
      });
      setQuiz(res.data);
      setQuestions([]);
      showMsg('success', 'Quiz created successfully.');
      onSaved();
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Failed to create quiz.');
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleSaveQuiz = async () => {
    setSavingQuiz(true);
    try {
      const res = await api.put(`/api/v1/quizzes/${quiz.id}`, {
        title: quizForm.title,
        course_id: course.id,
        passing_score: Number(quizForm.passing_score),
        description: quizForm.description || '',
        max_attempts: Number(quizForm.max_attempts) || 3,
      });
      setQuiz(res.data);
      setEditQuizMode(false);
      showMsg('success', 'Quiz settings updated.');
      onSaved();
    } catch (err) {
      showMsg('error', 'Failed to update quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!window.confirm('Delete this quiz and ALL its questions? This cannot be undone.')) return;
    try {
      await api.delete(`/api/v1/quizzes/${quiz.id}`);
      setQuiz(null);
      setQuestions([]);
      showMsg('success', 'Quiz deleted.');
      onSaved();
    } catch {
      showMsg('error', 'Failed to delete quiz.');
    }
  };

  const handleAddQuestion = async (payload) => {
    setSavingQ(true);
    try {
      const res = await api.post(`/api/v1/quizzes/${quiz.id}/question`, { ...payload, order: questions.length + 1 });
      setQuestions((qs) => [...qs, res.data]);
      setAddingQ(false);
      showMsg('success', 'Question added.');
      onSaved();
    } catch {
      showMsg('error', 'Failed to add question.');
    } finally {
      setSavingQ(false);
    }
  };

  const handleUpdateQuestion = async (questionId, payload) => {
    setSavingQ(true);
    try {
      const res = await api.put(`/api/v1/quizzes/question/${questionId}`, payload);
      setQuestions((qs) => qs.map((q) => (q.id === questionId ? res.data : q)));
      setEditingId(null);
      showMsg('success', 'Question updated.');
      onSaved();
    } catch {
      showMsg('error', 'Failed to update question.');
    } finally {
      setSavingQ(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    setDeletingId(questionId);
    try {
      await api.delete(`/api/v1/quizzes/question/${questionId}`);
      setQuestions((qs) => qs.filter((q) => q.id !== questionId));
      showMsg('success', 'Question deleted.');
      onSaved();
    } catch {
      showMsg('error', 'Failed to delete question.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qm-header">
          <div>
            <h2>Manage Questions</h2>
            <p>{course.title}</p>
          </div>
          <button className="qm-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="qm-body">
          {msg && <div className={`qm-alert ${msg.type}`}>{msg.text}</div>}

          {loading ? (
            <div className="qm-loading">Loading quiz...</div>
          ) : !quiz ? (
            /* No quiz yet — create one */
            <div className="qm-create-quiz">
              <div className="qm-empty-icon"><ClipboardList size={40} /></div>
              <h3>No quiz assigned to this training</h3>
              <p>Create a quiz to start adding questions.</p>
              <div className="qm-form" style={{ maxWidth: 460, margin: '0 auto' }}>
                <div className="qm-form-field">
                  <label>Quiz Title</label>
                  <input type="text" value={quizForm.title} onChange={(e) => setQuizForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="qm-form-field">
                    <label>Passing Score (%)</label>
                    <input type="number" min="0" max="100" value={quizForm.passing_score} onChange={(e) => setQuizForm((f) => ({ ...f, passing_score: e.target.value }))} />
                  </div>
                  <div className="qm-form-field">
                    <label>Max Attempts</label>
                    <input type="number" min="1" value={quizForm.max_attempts} onChange={(e) => setQuizForm((f) => ({ ...f, max_attempts: e.target.value }))} />
                  </div>
                </div>
                <button className="qm-btn qm-btn-primary" style={{ width: '100%' }} onClick={handleCreateQuiz} disabled={creatingQuiz}>
                  {creatingQuiz ? 'Creating...' : <><Plus size={15} /> Create Quiz</>}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Quiz settings bar */}
              <div className="qm-quiz-settings">
                {editQuizMode ? (
                  <div className="qm-form" style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, alignItems: 'end' }}>
                      <div className="qm-form-field" style={{ margin: 0 }}>
                        <label>Quiz Title</label>
                        <input type="text" value={quizForm.title} onChange={(e) => setQuizForm((f) => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div className="qm-form-field" style={{ margin: 0, width: 120 }}>
                        <label>Pass Score (%)</label>
                        <input type="number" min="0" max="100" value={quizForm.passing_score} onChange={(e) => setQuizForm((f) => ({ ...f, passing_score: e.target.value }))} />
                      </div>
                      <div className="qm-form-field" style={{ margin: 0, width: 100 }}>
                        <label>Max Attempts</label>
                        <input type="number" min="1" value={quizForm.max_attempts} onChange={(e) => setQuizForm((f) => ({ ...f, max_attempts: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 6, paddingBottom: 1 }}>
                        <button className="qm-btn qm-btn-ghost" onClick={() => setEditQuizMode(false)}>Cancel</button>
                        <button className="qm-btn qm-btn-primary" onClick={handleSaveQuiz} disabled={savingQuiz}>{savingQuiz ? 'Saving...' : 'Save'}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="qm-quiz-info">
                      <span className="qm-quiz-title">{quiz.title}</span>
                      <span className="qm-quiz-badge">Pass: {quiz.passing_score}%</span>
                      <span className="qm-quiz-badge">{questions.length} questions</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="qm-btn qm-btn-ghost" onClick={() => setEditQuizMode(true)}><Edit2 size={14} /> Edit Quiz</button>
                      <button className="qm-btn qm-btn-danger" onClick={handleDeleteQuiz}><Trash2 size={14} /></button>
                    </div>
                  </>
                )}
              </div>

              {/* Question list */}
              <div className="qm-question-list">
                {questions.length === 0 && !addingQ && (
                  <div className="qm-empty-questions">
                    <AlertCircle size={28} />
                    <p>No questions yet. Add your first question below.</p>
                  </div>
                )}

                {questions.map((q, idx) => (
                  <div key={q.id} className="qm-question-card">
                    {editingId === q.id ? (
                      <QuestionForm
                        initial={q}
                        saving={savingQ}
                        onSave={(payload) => handleUpdateQuestion(q.id, { ...payload, order: idx + 1 })}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                        <div className="qm-q-header">
                          <span className="qm-q-num">Q{idx + 1}</span>
                          <span className="qm-q-text">{q.question_text}</span>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button className="qm-icon-btn" title="Edit" onClick={() => { setEditingId(q.id); setAddingQ(false); }}><Edit2 size={14} /></button>
                            <button className="qm-icon-btn danger" title="Delete" disabled={deletingId === q.id} onClick={() => handleDeleteQuestion(q.id)}>
                              {deletingId === q.id ? '...' : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                        <div className="qm-options-list">
                          {(q.options || []).map((opt, oi) => (
                            <span
                              key={oi}
                              className={`qm-opt-chip ${opt.option_text === q.correct_answer ? 'correct' : ''}`}
                            >
                              {String.fromCharCode(65 + oi)}. {opt.option_text}
                              {opt.option_text === q.correct_answer && <CheckCircle size={12} />}
                            </span>
                          ))}
                        </div>
                        <div className="qm-q-meta">
                          <span>{q.points || 1} pt{(q.points || 1) !== 1 ? 's' : ''}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Add question form */}
                {addingQ && (
                  <div className="qm-question-card">
                    <div className="qm-q-header" style={{ marginBottom: 12 }}>
                      <span className="qm-q-num">New</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>New Question</span>
                    </div>
                    <QuestionForm saving={savingQ} onSave={handleAddQuestion} onCancel={() => setAddingQ(false)} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {quiz && !addingQ && (
          <div className="qm-footer">
            <button className="qm-btn qm-btn-primary" onClick={() => { setAddingQ(true); setEditingId(null); }}>
              <Plus size={15} /> Add Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Assign Employees Modal ────────────────────────────────────────────────────
const AssignEmployeesModal = ({ course, onClose, onSaved }) => {
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const load = useCallback(async () => {
    try {
      const [uRes, eRes] = await Promise.all([
        api.get('/api/v1/users/'),
        api.get(`/api/v1/enrollments/course/${course.id}`),
      ]);
      setUsers(uRes.data.filter((u) => u.role !== 'admin'));
      setEnrollments(eRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => { load(); }, [load]);

  const enrolledMap = useMemo(() => {
    const m = {};
    enrollments.forEach((e) => { m[e.user_id] = e; });
    return m;
  }, [enrollments]);

  const filtered = useMemo(() =>
    users.filter((u) => {
      const q = search.toLowerCase();
      return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
    }),
    [users, search]
  );

  const handleToggle = async (user) => {
    setToggling(user.id);
    try {
      if (enrolledMap[user.id]) {
        await api.delete(`/api/v1/enrollments/${enrolledMap[user.id].id}`);
        showMsg('success', `${user.full_name} removed from training.`);
      } else {
        await api.post('/api/v1/enrollments/', { user_id: user.id, course_id: course.id });
        showMsg('success', `${user.full_name} enrolled in training.`);
      }
      const eRes = await api.get(`/api/v1/enrollments/course/${course.id}`);
      setEnrollments(eRes.data);
      onSaved();
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Action failed.');
    } finally {
      setToggling(null);
    }
  };

  const enrolledCount = enrollments.length;

  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qm-header">
          <div>
            <h2>Assign Employees</h2>
            <p>{course.title} &bull; {enrolledCount} enrolled</p>
          </div>
          <button className="qm-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="qm-body">
          {msg && <div className={`qm-alert ${msg.type}`}>{msg.text}</div>}

          <div className="qm-search">
            <Search size={15} />
            <input
              type="search"
              placeholder="Search by name, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="qm-loading">Loading employees...</div>
          ) : filtered.length === 0 ? (
            <div className="qm-empty-questions"><Users size={28} /><p>No employees found.</p></div>
          ) : (
            <div className="qm-employee-list">
              {filtered.map((u) => {
                const isEnrolled = !!enrolledMap[u.id];
                const enrollment = enrolledMap[u.id];
                return (
                  <div key={u.id} className={`qm-employee-row ${isEnrolled ? 'enrolled' : ''}`}>
                    <div className="qm-emp-avatar">{u.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>
                    <div className="qm-emp-info">
                      <span className="qm-emp-name">{u.full_name}</span>
                      <span className="qm-emp-meta">{u.email} &bull; {u.department || 'General'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isEnrolled && (
                        <span className={`qm-enroll-badge ${enrollment?.status === 'completed' ? 'completed' : 'enrolled'}`}>
                          {enrollment?.status === 'completed' ? 'Completed' : 'Enrolled'}
                        </span>
                      )}
                      <button
                        className={`qm-btn ${isEnrolled ? 'qm-btn-ghost' : 'qm-btn-primary'}`}
                        onClick={() => handleToggle(u)}
                        disabled={toggling === u.id}
                        style={{ minWidth: 90 }}
                      >
                        {toggling === u.id ? '...' : isEnrolled ? 'Remove' : 'Enroll'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── SOPTrainings main component ───────────────────────────────────────────────
const SOPTrainings = () => {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainingId, setSelectedTrainingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '', sop_code: '', department: 'QA',
    duration_hours: '', passing_score: 80, due_date: '',
    priority: 'Mandatory', training_status: 'Draft',
  });

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/courses/');
      setTrainings(res.data);
      if (res.data.length > 0 && !selectedTrainingId) {
        setSelectedTrainingId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrainings(); }, []);

  const filteredTrainings = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return trainings.filter((t) => {
      const matchStatus = selectedStatus === 'All' || (t.training_status || 'Active') === selectedStatus;
      const matchDept = selectedDepartment === 'All Departments' || t.department === selectedDepartment;
      const matchSearch = !s || t.title?.toLowerCase().includes(s) || t.sop_code?.toLowerCase().includes(s) || t.owner?.toLowerCase().includes(s);
      return matchStatus && matchDept && matchSearch;
    });
  }, [searchTerm, selectedDepartment, selectedStatus, trainings]);

  const selectedTraining = useMemo(
    () => filteredTrainings.find((t) => t.id === selectedTrainingId) || filteredTrainings[0],
    [filteredTrainings, selectedTrainingId]
  );

  const totals = useMemo(() => {
    const enrolled = trainings.reduce((s, t) => s + (t.enrolled || 0), 0);
    const completed = trainings.reduce((s, t) => s + (t.completed || 0), 0);
    const active = trainings.filter((t) => (t.training_status || 'Active') === 'Active').length;
    const questions = trainings.reduce((s, t) => s + (t.questions || 0), 0);
    return { enrolled, completed, active, questions, completionRate: enrolled ? Math.round((completed / enrolled) * 100) : 0 };
  }, [trainings]);

  const updateForm = (key, val) => setFormData((f) => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      await api.post('/api/v1/courses/', {
        title: formData.title.trim(),
        sop_code: formData.sop_code.trim() || null,
        department: formData.department,
        duration_hours: formData.duration_hours ? Number(formData.duration_hours) : null,
        passing_score: Number(formData.passing_score) || 70,
        due_date: formData.due_date || null,
        priority: formData.priority,
        training_status: formData.training_status,
        owner: user?.full_name || 'Admin',
        version: '1.0',
      });
      await fetchTrainings();
      setShowCreateModal(false);
      setFormData({ title: '', sop_code: '', department: 'QA', duration_hours: '', passing_score: 80, due_date: '', priority: 'Mandatory', training_status: 'Draft' });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-content sop-trainings-page">
      <div className="dashboard-header sop-training-header">
        <div>
          <h1 className="dashboard-title">SOP Trainings</h1>
          <p className="dashboard-subtitle">Create, assign, and monitor SOP training programs.</p>
        </div>
        <button className="training-primary-btn" type="button" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Create Training
        </button>
      </div>

      <div className="training-summary-grid">
        <div className="training-summary-card">
          <span className="summary-icon active"><BookOpen size={20} /></span>
          <div><strong>{totals.active}</strong><span>active trainings</span></div>
        </div>
        <div className="training-summary-card">
          <span className="summary-icon assigned"><Users size={20} /></span>
          <div><strong>{totals.enrolled}</strong><span>employees assigned</span></div>
        </div>
        <div className="training-summary-card">
          <span className="summary-icon completed"><CheckCircle size={20} /></span>
          <div><strong>{totals.completionRate}%</strong><span>completion rate</span></div>
        </div>
        <div className="training-summary-card">
          <span className="summary-icon questions"><ClipboardList size={20} /></span>
          <div><strong>{totals.questions}</strong><span>quiz questions</span></div>
        </div>
      </div>

      <div className="training-toolbar">
        <div className="training-search">
          <Search size={18} />
          <input type="search" placeholder="Search training title, SOP code, or owner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="training-filter-select">
          <Filter size={18} />
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="training-status-tabs">
        {statusFilters.map((s) => (
          <button key={s} type="button" className={selectedStatus === s ? 'active' : ''} onClick={() => setSelectedStatus(s)}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading trainings...</div>
      ) : (
        <div className="training-layout">
          <section className="training-list">
            {filteredTrainings.map((t) => {
              const pct = t.enrolled ? Math.round((t.completed / t.enrolled) * 100) : 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`training-row ${selectedTraining?.id === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTrainingId(t.id)}
                >
                  <span className="training-file-icon"><FileText size={22} /></span>
                  <span className="training-row-main">
                    <span className="training-row-title">{t.title}</span>
                    <span className="training-row-meta">{t.sop_code || 'No Code'} / v{t.version || '1.0'} / {t.department || 'General'}</span>
                  </span>
                  <span className={`training-status-badge ${getStatusClass(t.training_status)}`}>{t.training_status || 'Active'}</span>
                  <span className="training-progress-cell">
                    <span>{pct}%</span>
                    <span className="training-progress-track"><span style={{ width: `${pct}%` }} /></span>
                  </span>
                </button>
              );
            })}
            {!filteredTrainings.length && (
              <div className="training-empty">
                <FileText size={36} />
                <strong>No SOP trainings found</strong>
                <span>Adjust the filters or create a new training.</span>
              </div>
            )}
          </section>

          <aside className="training-detail-panel">
            {selectedTraining ? (
              <>
                <div className="training-detail-header">
                  <span className={`training-status-badge ${getStatusClass(selectedTraining.training_status)}`}>
                    {selectedTraining.training_status || 'Active'}
                  </span>
                  <span className="training-priority">{selectedTraining.priority || 'Mandatory'}</span>
                </div>
                <h2>{selectedTraining.title}</h2>
                <p>{selectedTraining.sop_code || 'No Code'} / version {selectedTraining.version || '1.0'}</p>
                <div className="training-detail-grid">
                  <div><span>Department</span><strong>{selectedTraining.department || 'General'}</strong></div>
                  <div><span>Owner</span><strong>{selectedTraining.owner || 'N/A'}</strong></div>
                  <div><span>Duration</span><strong>{formatDuration(selectedTraining.duration_hours)}</strong></div>
                  <div><span>Due Date</span><strong>{selectedTraining.due_date || 'Not scheduled'}</strong></div>
                </div>
                <div className="training-readiness">
                  <div className="readiness-row"><span><Users size={16} />Assigned</span><strong>{selectedTraining.enrolled}</strong></div>
                  <div className="readiness-row"><span><CheckCircle size={16} />Completed</span><strong>{selectedTraining.completed}</strong></div>
                  <div className="readiness-row"><span><ClipboardList size={16} />Questions</span><strong>{selectedTraining.questions}</strong></div>
                  <div className="readiness-row"><span><Clock size={16} />Passing Score</span><strong>{selectedTraining.passing_score}%</strong></div>
                </div>
                <div className="training-action-row">
                  <button type="button" onClick={() => setShowAssignModal(true)}>
                    <Users size={15} /> Assign Employees
                  </button>
                  <button type="button" onClick={() => setShowQuestionsModal(true)}>
                    <ClipboardList size={15} /> Manage Questions
                  </button>
                </div>
              </>
            ) : (
              <div className="training-empty compact"><FileText size={32} /><strong>Select a training</strong></div>
            )}
          </aside>
        </div>
      )}

      {/* Create Training Modal */}
      {showCreateModal && (
        <div className="training-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="training-modal" onClick={(e) => e.stopPropagation()}>
            <div className="training-modal-header">
              <h2>Create SOP Training</h2>
              <button type="button" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="training-modal-body">
              <label>Training Title *<input type="text" value={formData.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="e.g., Warehouse Cleaning SOP" /></label>
              <label>SOP Code<input type="text" value={formData.sop_code} onChange={(e) => updateForm('sop_code', e.target.value)} placeholder="e.g., SOP-WH-001" /></label>
              <label>Department
                <select value={formData.department} onChange={(e) => updateForm('department', e.target.value)}>
                  {departments.slice(1).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <div className="training-modal-grid">
                <label>Duration (hours)<input type="number" min="0" step="0.5" value={formData.duration_hours} onChange={(e) => updateForm('duration_hours', e.target.value)} placeholder="2" /></label>
                <label>Passing Score (%)<input type="number" min="0" max="100" value={formData.passing_score} onChange={(e) => updateForm('passing_score', e.target.value)} /></label>
              </div>
              <div className="training-modal-grid">
                <label>Status
                  <select value={formData.training_status} onChange={(e) => updateForm('training_status', e.target.value)}>
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Review">Review</option>
                  </select>
                </label>
                <label>Priority
                  <select value={formData.priority} onChange={(e) => updateForm('priority', e.target.value)}>
                    <option value="Mandatory">Mandatory</option>
                    <option value="Recommended">Recommended</option>
                    <option value="Role Based">Role Based</option>
                  </select>
                </label>
              </div>
              <label>Due Date<input type="date" value={formData.due_date} onChange={(e) => updateForm('due_date', e.target.value)} /></label>
            </div>
            <div className="training-modal-footer">
              <button type="button" className="training-secondary-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="button" className="training-primary-btn" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Training'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Questions Modal */}
      {showQuestionsModal && selectedTraining && (
        <ManageQuestionsModal
          course={selectedTraining}
          onClose={() => setShowQuestionsModal(false)}
          onSaved={fetchTrainings}
        />
      )}

      {/* Assign Employees Modal */}
      {showAssignModal && selectedTraining && (
        <AssignEmployeesModal
          course={selectedTraining}
          onClose={() => setShowAssignModal(false)}
          onSaved={fetchTrainings}
        />
      )}
    </div>
  );
};

export default SOPTrainings;
