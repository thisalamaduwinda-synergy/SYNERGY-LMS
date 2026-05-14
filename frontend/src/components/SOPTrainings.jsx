import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import '../styles/sop-trainings.css';

const trainingData = [
  {
    id: 1,
    title: 'Quality Control Procedures',
    sopCode: 'SOP-QA-021',
    version: '2.1',
    department: 'Quality Control',
    owner: 'Admin User',
    status: 'Active',
    priority: 'Mandatory',
    duration: '2h 30m',
    enrolled: 86,
    completed: 64,
    questions: 12,
    passingScore: 80,
    dueDate: '2026-05-30',
    lastUpdated: '2026-05-10',
  },
  {
    id: 2,
    title: 'Pharmaceutical Safety Protocols',
    sopCode: 'SOP-HSE-014',
    version: '1.8',
    department: 'Manufacturing',
    owner: 'John Smith',
    status: 'Active',
    priority: 'Mandatory',
    duration: '1h 45m',
    enrolled: 112,
    completed: 95,
    questions: 15,
    passingScore: 85,
    dueDate: '2026-05-24',
    lastUpdated: '2026-04-15',
  },
  {
    id: 3,
    title: 'Laboratory Equipment Maintenance',
    sopCode: 'SOP-LAB-033',
    version: '3.0',
    department: 'Laboratory',
    owner: 'Dr. Jane Williams',
    status: 'Draft',
    priority: 'Role Based',
    duration: '3h',
    enrolled: 34,
    completed: 12,
    questions: 8,
    passingScore: 75,
    dueDate: '2026-06-08',
    lastUpdated: '2026-05-01',
  },
  {
    id: 4,
    title: 'Data Management Standards',
    sopCode: 'SOP-DI-009',
    version: '1.5',
    department: 'All Departments',
    owner: 'Compliance Team',
    status: 'Review',
    priority: 'Mandatory',
    duration: '1h 20m',
    enrolled: 148,
    completed: 101,
    questions: 10,
    passingScore: 80,
    dueDate: '2026-06-12',
    lastUpdated: '2026-05-08',
  },
  {
    id: 5,
    title: 'Regulatory Compliance Guide',
    sopCode: 'SOP-REG-018',
    version: '2.3',
    department: 'Compliance',
    owner: 'Compliance Team',
    status: 'Active',
    priority: 'Recommended',
    duration: '2h',
    enrolled: 73,
    completed: 58,
    questions: 14,
    passingScore: 80,
    dueDate: '2026-06-20',
    lastUpdated: '2026-05-12',
  },
];

const statusFilters = ['All', 'Active', 'Draft', 'Review'];
const departments = ['All Departments', 'Quality Control', 'Manufacturing', 'Laboratory', 'Compliance'];

const getStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');

const SOPTrainings = () => {
  const [trainings, setTrainings] = useState(trainingData);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainingId, setSelectedTrainingId] = useState(trainingData[0].id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    sopCode: '',
    department: 'Quality Control',
    duration: '',
    passingScore: 80,
    dueDate: '',
  });

  const filteredTrainings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return trainings.filter((training) => {
      const matchesStatus = selectedStatus === 'All' || training.status === selectedStatus;
      const matchesDepartment =
        selectedDepartment === 'All Departments' || training.department === selectedDepartment;
      const matchesSearch =
        !search ||
        training.title.toLowerCase().includes(search) ||
        training.sopCode.toLowerCase().includes(search) ||
        training.owner.toLowerCase().includes(search);

      return matchesStatus && matchesDepartment && matchesSearch;
    });
  }, [searchTerm, selectedDepartment, selectedStatus, trainings]);

  const selectedTraining = useMemo(() => {
    return filteredTrainings.find((training) => training.id === selectedTrainingId) || filteredTrainings[0];
  }, [filteredTrainings, selectedTrainingId]);

  const totals = useMemo(() => {
    const enrolled = trainings.reduce((sum, training) => sum + training.enrolled, 0);
    const completed = trainings.reduce((sum, training) => sum + training.completed, 0);
    const active = trainings.filter((training) => training.status === 'Active').length;
    const questions = trainings.reduce((sum, training) => sum + training.questions, 0);

    return {
      enrolled,
      completed,
      active,
      questions,
      completionRate: Math.round((completed / enrolled) * 100),
    };
  }, [trainings]);

  const updateFormValue = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleCreateTraining = () => {
    if (!formData.title.trim() || !formData.sopCode.trim()) {
      return;
    }

    const newTraining = {
      id: Date.now(),
      title: formData.title.trim(),
      sopCode: formData.sopCode.trim(),
      version: '1.0',
      department: formData.department,
      owner: 'Admin User',
      status: 'Draft',
      priority: 'Mandatory',
      duration: formData.duration || '1h',
      enrolled: 0,
      completed: 0,
      questions: 0,
      passingScore: Number(formData.passingScore) || 80,
      dueDate: formData.dueDate || 'Not scheduled',
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    setTrainings((current) => [newTraining, ...current]);
    setSelectedTrainingId(newTraining.id);
    setShowCreateModal(false);
    setFormData({
      title: '',
      sopCode: '',
      department: 'Quality Control',
      duration: '',
      passingScore: 80,
      dueDate: '',
    });
  };

  return (
    <div className="dashboard-content sop-trainings-page">
      <div className="dashboard-header sop-training-header">
        <div>
          <h1 className="dashboard-title">SOP Trainings</h1>
          <p className="dashboard-subtitle">
            Create, assign, and monitor SOP training programs with question readiness and completion tracking.
          </p>
        </div>
        <button className="training-primary-btn" type="button" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Create Training
        </button>
      </div>

      <div className="training-summary-grid">
        <div className="training-summary-card">
          <span className="summary-icon active">
            <BookOpen size={20} />
          </span>
          <div>
            <strong>{totals.active}</strong>
            <span>active trainings</span>
          </div>
        </div>
        <div className="training-summary-card">
          <span className="summary-icon assigned">
            <Users size={20} />
          </span>
          <div>
            <strong>{totals.enrolled}</strong>
            <span>employees assigned</span>
          </div>
        </div>
        <div className="training-summary-card">
          <span className="summary-icon completed">
            <CheckCircle size={20} />
          </span>
          <div>
            <strong>{totals.completionRate}%</strong>
            <span>completion rate</span>
          </div>
        </div>
        <div className="training-summary-card">
          <span className="summary-icon questions">
            <ClipboardList size={20} />
          </span>
          <div>
            <strong>{totals.questions}</strong>
            <span>quiz questions</span>
          </div>
        </div>
      </div>

      <div className="training-toolbar">
        <div className="training-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search SOP title, code, or owner"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="training-filter-select">
          <Filter size={18} />
          <select value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)}>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="training-status-tabs">
        {statusFilters.map((status) => (
          <button
            key={status}
            type="button"
            className={selectedStatus === status ? 'active' : ''}
            onClick={() => setSelectedStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="training-layout">
        <section className="training-list" aria-label="SOP training list">
          {filteredTrainings.map((training) => {
            const completionPercent = training.enrolled
              ? Math.round((training.completed / training.enrolled) * 100)
              : 0;

            return (
              <button
                key={training.id}
                type="button"
                className={`training-row ${selectedTraining?.id === training.id ? 'active' : ''}`}
                onClick={() => setSelectedTrainingId(training.id)}
              >
                <span className="training-file-icon">
                  <FileText size={22} />
                </span>
                <span className="training-row-main">
                  <span className="training-row-title">{training.title}</span>
                  <span className="training-row-meta">
                    {training.sopCode} / v{training.version} / {training.department}
                  </span>
                </span>
                <span className={`training-status-badge ${getStatusClass(training.status)}`}>
                  {training.status}
                </span>
                <span className="training-progress-cell">
                  <span>{completionPercent}%</span>
                  <span className="training-progress-track">
                    <span style={{ width: `${completionPercent}%` }} />
                  </span>
                </span>
              </button>
            );
          })}

          {!filteredTrainings.length && (
            <div className="training-empty">
              <FileText size={36} />
              <strong>No SOP trainings found</strong>
              <span>Adjust the filters or create a new SOP training.</span>
            </div>
          )}
        </section>

        <aside className="training-detail-panel">
          {selectedTraining ? (
            <>
              <div className="training-detail-header">
                <span className={`training-status-badge ${getStatusClass(selectedTraining.status)}`}>
                  {selectedTraining.status}
                </span>
                <span className="training-priority">{selectedTraining.priority}</span>
              </div>

              <h2>{selectedTraining.title}</h2>
              <p>{selectedTraining.sopCode} / version {selectedTraining.version}</p>

              <div className="training-detail-grid">
                <div>
                  <span>Department</span>
                  <strong>{selectedTraining.department}</strong>
                </div>
                <div>
                  <span>Owner</span>
                  <strong>{selectedTraining.owner}</strong>
                </div>
                <div>
                  <span>Duration</span>
                  <strong>{selectedTraining.duration}</strong>
                </div>
                <div>
                  <span>Due Date</span>
                  <strong>{selectedTraining.dueDate}</strong>
                </div>
              </div>

              <div className="training-readiness">
                <div className="readiness-row">
                  <span>
                    <Users size={16} />
                    Assigned
                  </span>
                  <strong>{selectedTraining.enrolled}</strong>
                </div>
                <div className="readiness-row">
                  <span>
                    <CheckCircle size={16} />
                    Completed
                  </span>
                  <strong>{selectedTraining.completed}</strong>
                </div>
                <div className="readiness-row">
                  <span>
                    <ClipboardList size={16} />
                    Questions
                  </span>
                  <strong>{selectedTraining.questions}</strong>
                </div>
                <div className="readiness-row">
                  <span>
                    <Clock size={16} />
                    Passing Score
                  </span>
                  <strong>{selectedTraining.passingScore}%</strong>
                </div>
              </div>

              <div className="training-action-row">
                <button type="button">Assign Employees</button>
                <button type="button">Manage Questions</button>
              </div>
            </>
          ) : (
            <div className="training-empty compact">
              <FileText size={32} />
              <strong>Select a training</strong>
            </div>
          )}
        </aside>
      </div>

      {showCreateModal && (
        <div className="training-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="training-modal" onClick={(event) => event.stopPropagation()}>
            <div className="training-modal-header">
              <h2>Create SOP Training</h2>
              <button type="button" onClick={() => setShowCreateModal(false)}>
                x
              </button>
            </div>
            <div className="training-modal-body">
              <label>
                SOP Training Title
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => updateFormValue('title', event.target.value)}
                  placeholder="e.g., Warehouse Cleaning SOP"
                />
              </label>
              <label>
                SOP Code
                <input
                  type="text"
                  value={formData.sopCode}
                  onChange={(event) => updateFormValue('sopCode', event.target.value)}
                  placeholder="e.g., SOP-WH-001"
                />
              </label>
              <label>
                Department
                <select
                  value={formData.department}
                  onChange={(event) => updateFormValue('department', event.target.value)}
                >
                  {departments.slice(1).map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
              <div className="training-modal-grid">
                <label>
                  Duration
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(event) => updateFormValue('duration', event.target.value)}
                    placeholder="1h 30m"
                  />
                </label>
                <label>
                  Passing Score
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passingScore}
                    onChange={(event) => updateFormValue('passingScore', event.target.value)}
                  />
                </label>
              </div>
              <label>
                Due Date
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) => updateFormValue('dueDate', event.target.value)}
                />
              </label>
            </div>
            <div className="training-modal-footer">
              <button type="button" className="training-secondary-btn" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="button" className="training-primary-btn" onClick={handleCreateTraining}>
                Create Training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOPTrainings;
