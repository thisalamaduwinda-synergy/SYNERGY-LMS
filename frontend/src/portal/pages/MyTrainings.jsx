import React, { useState, useEffect } from 'react';
import { FileText, BookOpen, Plus, X, ChevronRight, ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Quiz Modal ────────────────────────────────────────────────────────────────
const QuizModal = ({ quiz, courseId, onClose, onComplete }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/quizzes/${quiz.id}/questions`)
      .then((r) => setQuestions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [quiz.id]);

  const handleSelect = (questionId, optionText) => {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [questionId]: optionText }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length;
      const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
      const res = await api.post(`/api/v1/quizzes/${quiz.id}/submit?user_id=${user.id}&score=${score}`);
      setResult({ score, passed: res.data.passed, required: res.data.required_score, certificate: res.data.certificate });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const allAnswered = answered === questions.length && questions.length > 0;

  return (
    <div className="up-quiz-overlay" onClick={onClose}>
      <div className="up-quiz-modal" onClick={(e) => e.stopPropagation()}>
        <div className="up-quiz-header">
          <h2>{quiz.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div className="up-quiz-body">
          {loading && <div className="up-loading">Loading questions...</div>}

          {!loading && questions.length === 0 && (
            <div className="up-empty">
              <FileText size={36} />
              <h3>No questions available</h3>
              <p>This quiz has no questions yet</p>
            </div>
          )}

          {!loading && submitted && result && (
            <div className="up-result">
              <div className="up-result-icon">{result.passed ? '🎉' : '😔'}</div>
              <div className="up-result-score">{result.score}%</div>
              <div className="up-result-label">You scored {result.score}% (Required: {result.required}%)</div>
              <div className={`up-result-badge ${result.passed ? 'pass' : 'fail'}`}>
                {result.passed ? <><CheckCircle size={16} /> Passed</> : <><XCircle size={16} /> Failed</>}
              </div>
              {result.passed && result.certificate && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#15803d' }}>
                  Certificate issued: <strong>{result.certificate.certificate_number}</strong>
                </div>
              )}
            </div>
          )}

          {!loading && questions.length > 0 && !submitted && q && (
            <>
              {/* Progress steps */}
              <div className="up-progress-steps">
                {questions.map((_, i) => (
                  <div key={i} className={`up-step-dot ${i < current ? 'done' : i === current ? 'current' : ''}`} />
                ))}
              </div>

              <div className="up-question">
                <div className="up-question-num">Question {current + 1} of {questions.length}</div>
                <div className="up-question-text">{q.question_text}</div>
                <div className="up-options">
                  {(q.options || []).map((opt, i) => (
                    <div
                      key={i}
                      className={`up-option ${answers[q.id] === opt.option_text ? 'selected' : ''}`}
                      onClick={() => handleSelect(q.id, opt.option_text)}
                    >
                      <span style={{ width: 20, height: 20, border: '2px solid currentColor', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {answers[q.id] === opt.option_text && <span style={{ width: 10, height: 10, background: 'currentColor', borderRadius: '50%' }} />}
                      </span>
                      {opt.option_text}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="up-quiz-footer">
          {!submitted && questions.length > 0 && (
            <>
              <button className="up-btn up-btn-outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
                <ChevronLeft size={16} /> Back
              </button>
              <span style={{ color: '#64748b', fontSize: '13px' }}>{answered}/{questions.length} answered</span>
              {current < questions.length - 1 ? (
                <button className="up-btn up-btn-primary" onClick={() => setCurrent((c) => c + 1)} disabled={!answers[q?.id]}>
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button className="up-btn up-btn-success" onClick={handleSubmit} disabled={!allAnswered || submitting}>
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </>
          )}
          {submitted && (
            <button className="up-btn up-btn-primary" onClick={() => { onComplete(); onClose(); }} style={{ marginLeft: 'auto' }}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── MyTrainings ───────────────────────────────────────────────────────────────
const MyTrainings = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('enrolled'); // enrolled | browse
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [msg, setMsg] = useState(null);

  const fetchEnrollments = async () => {
    const res = await api.get(`/api/v1/enrollments/user/${user.id}`);
    setEnrollments(res.data);
  };

  const fetchAvailable = async () => {
    const res = await api.get('/api/v1/courses/');
    setAvailable(res.data);
  };

  useEffect(() => {
    Promise.all([fetchEnrollments(), fetchAvailable()])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const enrolledIds = new Set(enrollments.map((e) => e.course_id));

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api.post('/api/v1/enrollments/', { user_id: user.id, course_id: courseId });
      await fetchEnrollments();
      setMsg({ type: 'success', text: 'Enrolled successfully!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Enrollment failed' });
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setEnrolling(null);
    }
  };

  const handleStartQuiz = async (courseId) => {
    try {
      const res = await api.get(`/api/v1/quizzes/course/${courseId}`);
      if (res.data.length === 0) {
        setMsg({ type: 'error', text: 'No quiz available for this training yet.' });
        setTimeout(() => setMsg(null), 3000);
        return;
      }
      setActiveQuiz(res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="up-loading">Loading trainings...</div>;

  return (
    <div>
      <div className="up-page-header">
        <h1>My Trainings</h1>
        <p>View enrolled trainings, take quizzes and earn certificates</p>
      </div>

      {msg && <div className={`up-alert ${msg.type}`}>{msg.text}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button className={`up-btn ${view === 'enrolled' ? 'up-btn-primary' : 'up-btn-outline'}`} onClick={() => setView('enrolled')}>
          <BookOpen size={15} /> My Enrollments ({enrollments.length})
        </button>
        <button className={`up-btn ${view === 'browse' ? 'up-btn-primary' : 'up-btn-outline'}`} onClick={() => setView('browse')}>
          <Plus size={15} /> Browse Trainings
        </button>
      </div>

      {/* Enrolled view */}
      {view === 'enrolled' && (
        enrollments.length === 0 ? (
          <div className="up-empty">
            <BookOpen size={48} />
            <h3>No enrollments yet</h3>
            <p>Browse available trainings and enroll to get started</p>
          </div>
        ) : (
          <div className="up-training-list">
            {enrollments.map((e) => {
              const course = e.course || {};
              const isCompleted = e.status === 'completed';
              return (
                <div key={e.id} className="up-training-item">
                  <div className="up-training-icon"><FileText size={18} /></div>
                  <div className="up-training-info">
                    <div className="up-training-title">{course.title || 'Unknown Training'}</div>
                    <div className="up-training-meta">
                      {course.department || 'General'} &bull; v{course.version || '1.0'}
                      {course.due_date && ` &bull; Due: ${course.due_date}`}
                    </div>
                  </div>
                  <div className="up-training-progress">
                    <div className="up-progress-label">
                      <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
                      <span>{isCompleted ? '100%' : '0%'}</span>
                    </div>
                    <div className="up-progress-bar">
                      <div className={`up-progress-fill ${isCompleted ? 'green' : ''}`} style={{ width: isCompleted ? '100%' : '0%' }} />
                    </div>
                  </div>
                  <div className="up-training-actions">
                    <span className={`up-badge ${isCompleted ? 'completed' : 'enrolled'}`}>
                      {isCompleted ? 'Completed' : 'Enrolled'}
                    </span>
                    {!isCompleted && (
                      <button className="up-btn up-btn-primary" onClick={() => handleStartQuiz(e.course_id)}>
                        Take Quiz
                      </button>
                    )}
                    {isCompleted && (
                      <button className="up-btn up-btn-outline" onClick={() => handleStartQuiz(e.course_id)}>
                        Retry Quiz
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Browse view */}
      {view === 'browse' && (
        available.length === 0 ? (
          <div className="up-empty">
            <BookOpen size={48} />
            <h3>No trainings available</h3>
            <p>Check back later for new training programs</p>
          </div>
        ) : (
          <div className="up-courses-grid">
            {available.map((course) => {
              const isEnrolled = enrolledIds.has(course.id);
              return (
                <div key={course.id} className="up-course-card">
                  <div className="up-course-card-title">{course.title}</div>
                  <div className="up-course-card-meta">
                    <span>{course.department || 'General'}</span>
                    <span>v{course.version || '1.0'}</span>
                    {course.passing_score && <span>Pass: {course.passing_score}%</span>}
                    {course.due_date && <span>Due: {course.due_date}</span>}
                  </div>
                  {course.description && (
                    <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0', lineHeight: '1.5' }}>
                      {course.description.slice(0, 100)}{course.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span className={`up-badge ${course.training_status === 'Active' ? 'active' : 'draft'}`}>
                      {course.training_status || 'Active'}
                    </span>
                    {isEnrolled ? (
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Already enrolled</span>
                    ) : (
                      <button
                        className="up-btn up-btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling === course.id}
                      >
                        {enrolling === course.id ? 'Enrolling...' : 'Enroll'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onComplete={() => { fetchEnrollments(); setActiveQuiz(null); }}
        />
      )}
    </div>
  );
};

export default MyTrainings;
