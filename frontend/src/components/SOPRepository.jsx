import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Eye, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/sop-repository.css';

const buildQuestion = (questionText, correctAnswer, options, order) => ({
  id: `${Date.now()}-${order}-${Math.random().toString(36).slice(2, 8)}`,
  question_text: questionText,
  question_type: 'multiple_choice',
  correct_answer: correctAnswer,
  points: 1,
  order,
  options: options.map((opt, i) => ({ option_text: opt, is_correct: opt === correctAnswer, order: i + 1 })),
});

const pickSentences = (text) =>
  text.replace(/\s+/g, ' ').split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 30);

const generateQuestionsFromSop = (sop, count = 5) => {
  const source = `${sop.title}. ${sop.description || ''}. ${sop.content || ''}`;
  const sentences = pickSentences(source);
  const fallback = [sop.title, sop.description || 'the SOP objective', 'compliance steps', 'employee responsibilities', 'documentation requirements'];
  return Array.from({ length: count }, (_, i) => {
    const sentence = sentences[i % Math.max(sentences.length, 1)] || fallback[i % fallback.length];
    const keyPhrase = sentence.split(',')[0].replace(/^the\s+/i, '').trim();
    const correct = keyPhrase.length > 8 ? keyPhrase : fallback[i % fallback.length];
    return buildQuestion(
      `According to "${sop.title}", which statement best matches the required procedure?`,
      correct,
      [correct, 'Skip documentation until end of month', 'Perform task without approval', 'Ignore deviations if production is on schedule'],
      i + 1
    );
  });
};

const parseUploadedQuestions = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    const questions = Array.isArray(parsed) ? parsed : parsed.questions;
    if (Array.isArray(questions)) {
      return questions.map((q, i) =>
        buildQuestion(
          q.question_text || q.question || `Uploaded question ${i + 1}`,
          q.correct_answer || q.answer || '',
          (q.options || []).map((o) => o.option_text || o),
          i + 1
        )
      );
    }
  } catch { /* fall through to line parsing */ }
  return trimmed.split('\n').map((line, i) => {
    const parts = line.trim().split('|').map((p) => p.trim()).filter(Boolean);
    const qText = parts[0] || `Question ${i + 1}`;
    const correct = parts[1] || 'Correct answer';
    const opts = parts.length > 2 ? parts.slice(1) : [correct, 'Option B', 'Option C', 'Option D'];
    return buildQuestion(qText, correct, opts, i + 1);
  }).filter((q) => q.question_text);
};

const SOPRepository = () => {
  const { user } = useAuth();
  const [sops, setSops] = useState([]);
  const [filteredSops, setFilteredSops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedSop, setSelectedSop] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [questionMode, setQuestionMode] = useState('generate');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionPreview, setQuestionPreview] = useState([]);
  const [uploadedQuestionText, setUploadedQuestionText] = useState('');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', version: '1.0', content: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [isSavingSop, setIsSavingSop] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSops = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/v1/sops/');
      setSops(res.data);
      setFilteredSops(res.data);
    } catch (err) {
      console.error('Failed to fetch SOPs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSops(); }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const q = query.toLowerCase();
    setFilteredSops(
      query.trim() === ''
        ? sops
        : sops.filter((s) =>
            s.title?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.version?.toLowerCase().includes(q)
          )
    );
  };

  const handleDelete = async (sop) => {
    if (!window.confirm(`Delete "${sop.title}"? This cannot be undone.`)) return;
    setIsDeleting(sop.id);
    try {
      await api.delete(`/api/v1/sops/${sop.id}`);
      await fetchSops();
      showToast(`"${sop.title}" deleted`, 'success');
      if (showDetailModal && selectedSop?.id === sop.id) setShowDetailModal(false);
    } catch {
      showToast('Failed to delete SOP', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = (sop) => {
    if (!sop.file_url) { showToast('No file attached to this SOP', 'error'); return; }
    const link = document.createElement('a');
    link.href = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${sop.file_url}`;
    link.download = `${sop.title.replace(/\s+/g, '_')}_v${sop.version}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded ${sop.title}`, 'success');
  };

  const handleUploadSop = async () => {
    if (!uploadForm.title.trim()) { showToast('Title is required', 'error'); return; }
    setIsSavingSop(true);
    try {
      const res = await api.post('/api/v1/sops/', {
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim() || null,
        version: uploadForm.version || '1.0',
        content: uploadForm.content.trim() || '',
        created_by: user?.full_name || 'Admin',
      });
      const sopId = res.data.id;

      if (uploadFile) {
        const fd = new FormData();
        fd.append('file', uploadFile);
        await api.post(`/api/v1/sops/${sopId}/upload-file`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      await fetchSops();
      showToast('SOP uploaded successfully', 'success');
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', version: '1.0', content: '' });
      setUploadFile(null);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to upload SOP', 'error');
    } finally {
      setIsSavingSop(false);
    }
  };

  const handleOpenQuestions = (sop) => {
    setSelectedSop(sop);
    setQuestionMode('generate');
    setQuestionPreview([]);
    setUploadedQuestionText('');
    setShowQuestionModal(true);
  };

  const handleGenerateQuestions = async () => {
    const local = generateQuestionsFromSop(selectedSop, Number(questionCount));
    setQuestionPreview(local);
    try {
      await api.post(`/api/v1/sops/${selectedSop.id}/questions/generate`, { question_count: Number(questionCount) });
    } catch { /* use local generated */ }
  };

  const handleParseUploadedQuestions = () => {
    const parsed = parseUploadedQuestions(uploadedQuestionText);
    if (!parsed.length) { showToast('Add questions before importing', 'error'); return; }
    setQuestionPreview(parsed);
  };

  const handleQuestionFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedQuestionText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const handleSaveQuestions = async () => {
    if (!questionPreview.length) { showToast('Generate or upload questions first', 'error'); return; }
    try {
      await api.post(`/api/v1/sops/${selectedSop.id}/questions/upload`, { questions: questionPreview });
      showToast(`${questionPreview.length} questions saved`, 'success');
      setShowQuestionModal(false);
    } catch {
      showToast('Failed to save questions', 'error');
    }
  };

  return (
    <div className="sop-repository-container">
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="sop-header">
        <div>
          <h1>SOP Repository</h1>
          <p>Manage SOP documents, auto-generated questions, and question banks</p>
        </div>
        <button className="btn-upload" onClick={() => setShowUploadModal(true)}>
          <Plus size={20} /> Upload New SOP
        </button>
      </div>

      <div className="sop-search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search SOPs by title, description, or version..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {isLoading ? (
        <div className="sop-loading">Loading SOPs...</div>
      ) : filteredSops.length === 0 ? (
        <div className="sop-empty">
          <FileText size={48} />
          <h3>No SOPs Found</h3>
          <p>{searchQuery ? 'Try adjusting your search query' : 'Upload your first SOP to get started'}</p>
        </div>
      ) : (
        <div className="sop-grid">
          {filteredSops.map((sop) => (
            <div key={sop.id} className="sop-card">
              <div className="sop-card-header">
                <div className="sop-icon"><FileText size={32} /></div>
                <div className="sop-meta">
                  <span className="sop-version">v{sop.version}</span>
                  <span className="sop-courses">{sop.course_ids?.length || 0} courses</span>
                </div>
              </div>
              <div className="sop-card-content">
                <h3 className="sop-title">{sop.title}</h3>
                <p className="sop-description">{sop.description || 'No description'}</p>
                <div className="sop-details">
                  <div className="detail-item">
                    <span className="detail-label">Created by:</span>
                    <span className="detail-value">{sop.created_by || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last updated:</span>
                    <span className="detail-value">
                      {sop.updated_at ? new Date(sop.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="sop-card-actions">
                <button className="btn-action btn-view" onClick={() => { setSelectedSop(sop); setShowDetailModal(true); }} title="View" disabled={isDeleting === sop.id}><Eye size={18} /></button>
                <button className="btn-action btn-questions" onClick={() => handleOpenQuestions(sop)} title="Questions" disabled={isDeleting === sop.id}><Plus size={18} /></button>
                <button className="btn-action btn-download" onClick={() => handleDownload(sop)} title="Download" disabled={isDeleting === sop.id}><Download size={18} /></button>
                <button className="btn-action btn-delete" onClick={() => handleDelete(sop)} title="Delete" disabled={isDeleting === sop.id}>
                  {isDeleting === sop.id ? <span className="spinner-small" /> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSop && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSop.title}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-group"><label>Description</label><p>{selectedSop.description || 'N/A'}</p></div>
              <div className="detail-group"><label>Version</label><p>v{selectedSop.version}</p></div>
              <div className="detail-group"><label>Content</label><p>{selectedSop.content || 'No content'}</p></div>
              <div className="detail-group"><label>Created by</label><p>{selectedSop.created_by || 'N/A'}</p></div>
              <div className="detail-group"><label>Created</label><p>{new Date(selectedSop.created_at).toLocaleDateString()}</p></div>
              <div className="detail-group"><label>File</label><p>{selectedSop.file_url ? 'Attached' : 'No file'}</p></div>
            </div>
            <div className="modal-footer">
              <button className="btn-upload" onClick={() => handleOpenQuestions(selectedSop)}><Plus size={18} /> Manage Questions</button>
              <button className="btn-download" onClick={() => handleDownload(selectedSop)}><Download size={18} /> Download SOP</button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && selectedSop && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content question-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>SOP Questions — {selectedSop.title}</h2>
              <button className="modal-close" onClick={() => setShowQuestionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="question-tabs">
                <button className={questionMode === 'generate' ? 'active' : ''} onClick={() => setQuestionMode('generate')}>Auto Generate</button>
                <button className={questionMode === 'upload' ? 'active' : ''} onClick={() => setQuestionMode('upload')}>Upload Questions</button>
              </div>
              {questionMode === 'generate' ? (
                <div className="question-panel">
                  <div className="detail-group">
                    <label>Number of Questions</label>
                    <input type="number" min="1" max="20" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
                  </div>
                  <div className="detail-group">
                    <label>SOP Content</label>
                    <textarea rows="4" value={selectedSop.content || selectedSop.description || ''} readOnly />
                  </div>
                  <button className="btn-upload question-primary" onClick={handleGenerateQuestions}>Auto Generate Questions</button>
                </div>
              ) : (
                <div className="question-panel">
                  <div className="detail-group">
                    <label>Upload File</label>
                    <div className="file-upload visible-file-upload">
                      <input type="file" accept=".json,.csv,.txt" onChange={handleQuestionFileChange} />
                      <p>JSON, CSV, TXT accepted</p>
                    </div>
                  </div>
                  <div className="detail-group">
                    <label>Paste Questions</label>
                    <textarea rows="6" value={uploadedQuestionText} onChange={(e) => setUploadedQuestionText(e.target.value)} placeholder="Question text | Correct answer | Option B | Option C | Option D" />
                  </div>
                  <button className="btn-upload question-primary" onClick={handleParseUploadedQuestions}>Preview Questions</button>
                </div>
              )}
              <div className="question-preview">
                <div className="question-preview-header">
                  <h3>Preview</h3><span>{questionPreview.length} questions</span>
                </div>
                {questionPreview.length === 0 ? (
                  <p className="question-empty">Generated or uploaded questions will appear here.</p>
                ) : (
                  questionPreview.map((q, i) => (
                    <div className="question-item" key={q.id}>
                      <strong>{i + 1}. {q.question_text}</strong>
                      <span>Answer: {q.correct_answer}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-upload" onClick={handleSaveQuestions}>Save Questions</button>
              <button className="btn-close" onClick={() => setShowQuestionModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload SOP Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New SOP</h2>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>SOP Title *</label>
                <input type="text" placeholder="Enter SOP title" value={uploadForm.title} onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="detail-group">
                <label>Description</label>
                <textarea placeholder="Enter SOP description" rows="3" value={uploadForm.description} onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="detail-group">
                <label>Content / Procedure Text</label>
                <textarea placeholder="Paste the SOP procedure text here (used for question generation)" rows="4" value={uploadForm.content} onChange={(e) => setUploadForm((f) => ({ ...f, content: e.target.value }))} />
              </div>
              <div className="detail-group">
                <label>Version</label>
                <input type="text" placeholder="e.g., 1.0" value={uploadForm.version} onChange={(e) => setUploadForm((f) => ({ ...f, version: e.target.value }))} />
              </div>
              <div className="detail-group">
                <label>Upload File (PDF, DOC)</label>
                <div className="file-upload visible-file-upload">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  <p>{uploadFile ? uploadFile.name : 'PDF, DOC, DOCX accepted'}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-upload" onClick={handleUploadSop} disabled={isSavingSop}>
                {isSavingSop ? 'Uploading...' : 'Upload SOP'}
              </button>
              <button className="btn-close" onClick={() => setShowUploadModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOPRepository;
