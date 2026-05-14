import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Eye, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import '../styles/sop-repository.css';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const buildQuestion = (questionText, correctAnswer, options, order) => ({
  id: `${Date.now()}-${order}-${Math.random().toString(36).slice(2, 8)}`,
  question_text: questionText,
  question_type: 'multiple_choice',
  correct_answer: correctAnswer,
  points: 1,
  order,
  options: options.map((option, index) => ({
    option_text: option,
    is_correct: option === correctAnswer,
    order: index + 1,
  })),
});

const pickSentences = (text) =>
  text
    .replace(/\s+/g, ' ')
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);

const generateQuestionsFromSop = (sop, count = 5) => {
  const source = `${sop.title}. ${sop.description || ''}. ${sop.content || ''}`;
  const sentences = pickSentences(source);
  const fallbackTopics = [
    sop.title,
    sop.description || 'the SOP objective',
    'required compliance steps',
    'employee responsibilities',
    'documentation requirements',
  ];

  return Array.from({ length: count }, (_, index) => {
    const sentence = sentences[index % Math.max(sentences.length, 1)] || fallbackTopics[index % fallbackTopics.length];
    const keyPhrase = sentence.split(',')[0].replace(/^the\s+/i, '').trim();
    const correctAnswer = keyPhrase.length > 8 ? keyPhrase : fallbackTopics[index % fallbackTopics.length];
    const options = [
      correctAnswer,
      'Skip documentation until the end of the month',
      'Perform the task without approval',
      'Ignore deviations if production is on schedule',
    ];

    return buildQuestion(
      `According to "${sop.title}", which statement best matches the required procedure?`,
      correctAnswer,
      options,
      index + 1
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
      return questions.map((question, index) =>
        buildQuestion(
          question.question_text || question.question || `Uploaded question ${index + 1}`,
          question.correct_answer || question.answer || '',
          (question.options || []).map((option) => option.option_text || option),
          index + 1
        )
      );
    }
  } catch (error) {
    // Plain text formats are handled below.
  }

  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split('|').map((part) => part.trim()).filter(Boolean);
      const questionText = parts[0] || `Uploaded question ${index + 1}`;
      const correctAnswer = parts[1] || 'Correct answer';
      const options = parts.length > 2 ? parts.slice(1) : [correctAnswer, 'Option B', 'Option C', 'Option D'];
      return buildQuestion(questionText, correctAnswer, options, index + 1);
    });
};

const SOPRepository = () => {
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

  const mockSops = [
    {
      id: 1,
      title: 'Quality Control Procedures',
      description: 'Standard Operating Procedures for Quality Control department',
      content: 'Quality control samples must be collected at each approved checkpoint. Analysts must document observations immediately, verify equipment calibration, and report any deviation before releasing a batch.',
      version: '2.1',
      file_url: '/files/qc_procedures_v2.1.pdf',
      created_by: 'Admin User',
      created_at: '2024-01-15',
      updated_at: '2024-05-10',
      courses_using: 3,
      questions: [],
    },
    {
      id: 2,
      title: 'Pharmaceutical Safety Protocols',
      description: 'Safety guidelines and protocols for all pharmaceutical operations',
      content: 'Employees must wear required personal protective equipment before entering controlled areas. Safety incidents must be reported to the supervisor and recorded in the incident log before the end of the shift.',
      version: '1.8',
      file_url: '/files/safety_protocols_v1.8.pdf',
      created_by: 'John Smith',
      created_at: '2024-02-20',
      updated_at: '2024-04-15',
      courses_using: 5,
      questions: [],
    },
    {
      id: 3,
      title: 'Laboratory Equipment Maintenance',
      description: 'Maintenance and care instructions for laboratory equipment',
      content: 'Laboratory equipment must be cleaned after each use and calibrated according to the maintenance schedule. Maintenance records must include the date, technician, result, and any corrective action.',
      version: '3.0',
      file_url: '/files/lab_equipment_v3.0.pdf',
      created_by: 'Dr. Jane Williams',
      created_at: '2024-03-10',
      updated_at: '2024-05-01',
      courses_using: 2,
      questions: [],
    },
    {
      id: 4,
      title: 'Data Management Standards',
      description: 'Standards for data collection, storage, and management',
      content: 'Training and production data must be entered into approved systems only. Records must be accurate, attributable, legible, contemporaneous, original, and complete.',
      version: '1.5',
      file_url: '/files/data_management_v1.5.pdf',
      created_by: 'Admin User',
      created_at: '2024-04-05',
      updated_at: '2024-05-08',
      courses_using: 4,
      questions: [],
    },
    {
      id: 5,
      title: 'Regulatory Compliance Guide',
      description: 'Compliance requirements and regulatory guidelines',
      content: 'Compliance teams must review applicable regulations before approving SOP changes. Employees must complete assigned SOP training and acknowledge understanding before performing regulated tasks.',
      version: '2.3',
      file_url: '/files/regulatory_compliance_v2.3.pdf',
      created_by: 'Compliance Team',
      created_at: '2024-01-20',
      updated_at: '2024-05-12',
      courses_using: 6,
      questions: [],
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setSops(mockSops);
      setFilteredSops(mockSops);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const syncSopQuestions = (sopId, questions) => {
    const update = (items) =>
      items.map((sop) =>
        sop.id === sopId ? { ...sop, questions: [...(sop.questions || []), ...questions] } : sop
      );
    setSops(update);
    setFilteredSops(update);
    setSelectedSop((current) =>
      current?.id === sopId ? { ...current, questions: [...(current.questions || []), ...questions] } : current
    );
  };

  const handleDownload = (sop) => {
    try {
      if (!sop.file_url) {
        showToast('File URL not available', 'error');
        return;
      }

      const link = document.createElement('a');
      link.href = sop.file_url;
      link.download = `${sop.title.replace(/\s+/g, '_')}_v${sop.version}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Downloaded ${sop.title}`, 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download SOP', 'error');
    }
  };

  const handleDelete = async (sop) => {
    if (!window.confirm(`Are you sure you want to delete "${sop.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(sop.id);
    try {
      const response = await fetch(`${API_BASE_URL}/sops/${sop.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete SOP');
      }

      setSops(sops.filter((s) => s.id !== sop.id));
      setFilteredSops(filteredSops.filter((s) => s.id !== sop.id));

      showToast(`"${sop.title}" deleted successfully`, 'success');

      if (showDetailModal && selectedSop?.id === sop.id) {
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete SOP. Please try again.', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewDetails = (sop) => {
    setSelectedSop(sop);
    setShowDetailModal(true);
  };

  const handleOpenQuestions = (sop) => {
    setSelectedSop(sop);
    setQuestionMode('generate');
    setQuestionPreview([]);
    setUploadedQuestionText('');
    setShowQuestionModal(true);
  };

  const handleGenerateQuestions = async () => {
    const localQuestions = generateQuestionsFromSop(selectedSop, Number(questionCount));
    setQuestionPreview(localQuestions);

    try {
      await fetch(`${API_BASE_URL}/sops/${selectedSop.id}/questions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_count: Number(questionCount) }),
      });
    } catch (error) {
      console.info('Backend question generation unavailable; using local generated questions.');
    }
  };

  const handleParseUploadedQuestions = () => {
    const parsedQuestions = parseUploadedQuestions(uploadedQuestionText);
    if (!parsedQuestions.length) {
      showToast('Add questions before importing', 'error');
      return;
    }
    setQuestionPreview(parsedQuestions);
  };

  const handleQuestionFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setUploadedQuestionText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const handleSaveQuestions = async () => {
    if (!questionPreview.length) {
      showToast('Generate or upload questions first', 'error');
      return;
    }

    syncSopQuestions(selectedSop.id, questionPreview);

    try {
      await fetch(`${API_BASE_URL}/sops/${selectedSop.id}/questions/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionPreview }),
      });
    } catch (error) {
      console.info('Backend question upload unavailable; saved questions in the current admin session.');
    }

    showToast(`${questionPreview.length} SOP questions saved`, 'success');
    setShowQuestionModal(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredSops(sops);
    } else {
      const filtered = sops.filter(
        (sop) =>
          sop.title.toLowerCase().includes(query.toLowerCase()) ||
          sop.description.toLowerCase().includes(query.toLowerCase()) ||
          sop.version.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSops(filtered);
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
          <p>Access and manage SOP documents, auto-generated questions, and uploaded question banks</p>
        </div>
        <button className="btn-upload" onClick={() => setShowUploadModal(true)}>
          <Plus size={20} />
          Upload New SOP
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
          <p>{searchQuery ? 'Try adjusting your search query' : 'No SOPs available yet'}</p>
        </div>
      ) : (
        <div className="sop-grid">
          {filteredSops.map((sop) => (
            <div key={sop.id} className="sop-card">
              <div className="sop-card-header">
                <div className="sop-icon">
                  <FileText size={32} />
                </div>
                <div className="sop-meta">
                  <span className="sop-version">v{sop.version}</span>
                  <span className="sop-courses">{sop.courses_using} courses</span>
                  <span className="sop-courses">{sop.questions?.length || 0} questions</span>
                </div>
              </div>

              <div className="sop-card-content">
                <h3 className="sop-title">{sop.title}</h3>
                <p className="sop-description">{sop.description}</p>

                <div className="sop-details">
                  <div className="detail-item">
                    <span className="detail-label">Created by:</span>
                    <span className="detail-value">{sop.created_by}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last updated:</span>
                    <span className="detail-value">{sop.updated_at}</span>
                  </div>
                </div>
              </div>

              <div className="sop-card-actions">
                <button className="btn-action btn-view" onClick={() => handleViewDetails(sop)} title="View Details" disabled={isDeleting === sop.id}>
                  <Eye size={18} />
                </button>
                <button className="btn-action btn-questions" onClick={() => handleOpenQuestions(sop)} title="Manage Questions" disabled={isDeleting === sop.id}>
                  <Plus size={18} />
                </button>
                <button className="btn-action btn-download" onClick={() => handleDownload(sop)} title="Download" disabled={isDeleting === sop.id}>
                  <Download size={18} />
                </button>
                <button className="btn-action btn-delete" onClick={() => handleDelete(sop)} title="Delete" disabled={isDeleting === sop.id}>
                  {isDeleting === sop.id ? <span className="spinner-small" /> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedSop && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSop.title}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>x</button>
            </div>

            <div className="modal-body">
              <div className="detail-group">
                <label>Description</label>
                <p>{selectedSop.description}</p>
              </div>
              <div className="detail-group">
                <label>Version</label>
                <p>v{selectedSop.version}</p>
              </div>
              <div className="detail-group">
                <label>Saved Questions</label>
                <p>{selectedSop.questions?.length || 0} questions</p>
              </div>
              <div className="detail-group">
                <label>Created by</label>
                <p>{selectedSop.created_by}</p>
              </div>
              <div className="detail-group">
                <label>Created Date</label>
                <p>{selectedSop.created_at}</p>
              </div>
              <div className="detail-group">
                <label>Last Updated</label>
                <p>{selectedSop.updated_at}</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-upload" onClick={() => handleOpenQuestions(selectedSop)}>
                <Plus size={18} />
                Manage Questions
              </button>
              <button className="btn-download" onClick={() => handleDownload(selectedSop)}>
                <Download size={18} />
                Download SOP
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuestionModal && selectedSop && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content question-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>SOP Questions</h2>
              <button className="modal-close" onClick={() => setShowQuestionModal(false)}>x</button>
            </div>

            <div className="modal-body">
              <div className="question-sop-summary">
                <span>{selectedSop.title}</span>
                <strong>{selectedSop.questions?.length || 0} saved</strong>
              </div>

              <div className="question-tabs">
                <button className={questionMode === 'generate' ? 'active' : ''} onClick={() => setQuestionMode('generate')}>
                  Auto Generate
                </button>
                <button className={questionMode === 'upload' ? 'active' : ''} onClick={() => setQuestionMode('upload')}>
                  Upload Questions
                </button>
              </div>

              {questionMode === 'generate' ? (
                <div className="question-panel">
                  <div className="detail-group">
                    <label>Number of Questions</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={questionCount}
                      onChange={(event) => setQuestionCount(event.target.value)}
                    />
                  </div>
                  <div className="detail-group">
                    <label>SOP Content Source</label>
                    <textarea rows="5" value={selectedSop.content || selectedSop.description} readOnly />
                  </div>
                  <button className="btn-upload question-primary" onClick={handleGenerateQuestions}>
                    Auto Generate Questions
                  </button>
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
                    <textarea
                      rows="7"
                      value={uploadedQuestionText}
                      onChange={(event) => setUploadedQuestionText(event.target.value)}
                      placeholder="Question text | Correct answer | Option B | Option C | Option D"
                    />
                  </div>
                  <button className="btn-upload question-primary" onClick={handleParseUploadedQuestions}>
                    Preview Uploaded Questions
                  </button>
                </div>
              )}

              <div className="question-preview">
                <div className="question-preview-header">
                  <h3>Preview</h3>
                  <span>{questionPreview.length} questions</span>
                </div>
                {questionPreview.length === 0 ? (
                  <p className="question-empty">Generated or uploaded questions will appear here.</p>
                ) : (
                  questionPreview.map((question, index) => (
                    <div className="question-item" key={question.id}>
                      <strong>{index + 1}. {question.question_text}</strong>
                      <span>Answer: {question.correct_answer}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-upload" onClick={handleSaveQuestions}>
                Save Questions
              </button>
              <button className="btn-close" onClick={() => setShowQuestionModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New SOP</h2>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>x</button>
            </div>

            <div className="modal-body">
              <div className="detail-group">
                <label>SOP Title *</label>
                <input type="text" placeholder="Enter SOP title" />
              </div>

              <div className="detail-group">
                <label>Description *</label>
                <textarea placeholder="Enter SOP description" rows="4"></textarea>
              </div>

              <div className="detail-group">
                <label>Version *</label>
                <input type="text" placeholder="e.g., 1.0" defaultValue="1.0" />
              </div>

              <div className="detail-group">
                <label>Upload File *</label>
                <div className="file-upload visible-file-upload">
                  <input type="file" accept=".pdf,.doc,.docx" />
                  <p>PDF, DOC, DOCX accepted</p>
                </div>
              </div>

              <div className="detail-group">
                <label>Associated Courses</label>
                <div className="checkbox-group">
                  <label><input type="checkbox" />Quality Control Training</label>
                  <label><input type="checkbox" />Safety Protocols</label>
                  <label><input type="checkbox" />Lab Equipment Training</label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-upload" onClick={() => setShowUploadModal(false)}>
                Upload SOP
              </button>
              <button className="btn-close" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOPRepository;
