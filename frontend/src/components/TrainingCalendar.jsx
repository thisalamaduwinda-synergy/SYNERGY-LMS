import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin,
  Plus, Search, Users, Video, X, Save, Trash2, Edit2, AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import '../styles/training-calendar.css';
import '../styles/tc-modal.css';

const TYPE_FILTERS  = ['All', 'Compliance', 'SOP', 'Practical', 'Role Based', 'Quality'];
const DELIVERY_OPTS = ['Classroom', 'Virtual', 'Practical', 'Workshop'];
const STATUS_OPTS   = ['Draft', 'Confirmed', 'Pending', 'Cancelled'];
const PRIORITY_OPTS = ['Mandatory', 'Recommended', 'Role Based'];
const TYPE_OPTS     = ['Compliance', 'SOP', 'Practical', 'Role Based', 'Quality'];
const DEPARTMENTS = [
  'Accounts', 'Analytical Development', 'Development Quality Assurance', 'EHS',
  'Engineering', 'Finance', 'Formulation Development', 'HR & Admin', 'IT',
  'Microbiology', 'Packaging Development', 'Production',
  'Production Planning & Inventory Control', 'Purchase & Logistics',
  'Quality Assurance', 'Quality Control', 'Regulatory Affairs',
  'Sales & Marketing', 'Strategy Planning', 'Technology Transfer', 'Warehouse',
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const toKey  = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const cls    = (s) => (s||'').toLowerCase().replace(/\s+/g,'-');

const BLANK = {
  title:'', date: toKey(new Date()), time:'09:00 AM', duration:'2h',
  department:'Quality Assurance', trainer:'', location:'', delivery:'Classroom',
  capacity:30, status:'Draft', priority:'Mandatory', type:'Compliance',
  course_id:'', description:'',
};

// ── Session Form Modal ────────────────────────────────────────────────────────
const SessionModal = ({ mode, initial, courses, onSave, onClose, saving, error }) => {
  const [form, setForm] = useState(initial || BLANK);
  const f = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="tc-overlay" onClick={onClose}>
      <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tc-modal-header">
          <h2>{mode === 'add' ? 'Schedule Training Session' : 'Edit Session'}</h2>
          <button className="tc-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="tc-modal-body">
          {error && <div className="tc-error-bar">{error}</div>}

          <div className="tc-form-row">
            <div className="tc-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Session Title *</label>
              <input type="text" value={form.title} onChange={(e) => f('title', e.target.value)} placeholder="e.g. GMP Refresher Training" />
            </div>
          </div>

          <div className="tc-form-row">
            <div className="tc-form-group">
              <label>Date *</label>
              <input type="date" value={form.date} onChange={(e) => f('date', e.target.value)} />
            </div>
            <div className="tc-form-group">
              <label>Time</label>
              <input type="time" value={form.time?.slice(0,5)} onChange={(e) => {
                const [h, m] = e.target.value.split(':');
                const hr = parseInt(h);
                const ampm = hr >= 12 ? 'PM' : 'AM';
                const hr12 = hr % 12 || 12;
                f('time', `${String(hr12).padStart(2,'0')}:${m} ${ampm}`);
              }} />
            </div>
            <div className="tc-form-group">
              <label>Duration</label>
              <input type="text" value={form.duration} onChange={(e) => f('duration', e.target.value)} placeholder="e.g. 2h, 90m" />
            </div>
          </div>

          <div className="tc-form-row">
            <div className="tc-form-group">
              <label>Department</label>
              <select value={form.department} onChange={(e) => f('department', e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="tc-form-group">
              <label>Trainer / Facilitator</label>
              <input type="text" value={form.trainer} onChange={(e) => f('trainer', e.target.value)} placeholder="e.g. Dr. N. Perera" />
            </div>
          </div>

          <div className="tc-form-row">
            <div className="tc-form-group">
              <label>Location / Link</label>
              <input type="text" value={form.location} onChange={(e) => f('location', e.target.value)} placeholder="e.g. Training Room A or Teams link" />
            </div>
            <div className="tc-form-group">
              <label>Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => f('capacity', e.target.value)} />
            </div>
          </div>

          <div className="tc-form-row">
            <div className="tc-form-group">
              <label>Delivery Mode</label>
              <select value={form.delivery} onChange={(e) => f('delivery', e.target.value)}>
                {DELIVERY_OPTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="tc-form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => f('type', e.target.value)}>
                {TYPE_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="tc-form-row">
            <div className="tc-form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => f('priority', e.target.value)}>
                {PRIORITY_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="tc-form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => f('status', e.target.value)}>
                {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="tc-form-row">
            <div className="tc-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Link to Course (optional)</label>
              <select value={form.course_id} onChange={(e) => f('course_id', e.target.value)}>
                <option value="">— None —</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          <div className="tc-form-row">
            <div className="tc-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => f('description', e.target.value)} placeholder="Optional notes about this session..." />
            </div>
          </div>
        </div>

        <div className="tc-modal-footer">
          <button className="tc-btn tc-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="tc-btn tc-btn-primary" onClick={() => onSave(form)} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving...' : mode === 'add' ? 'Schedule Session' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm ────────────────────────────────────────────────────────────
const DeleteConfirm = ({ session, onConfirm, onCancel, deleting }) => (
  <div className="tc-overlay" onClick={onCancel}>
    <div className="tc-confirm" onClick={(e) => e.stopPropagation()}>
      <div className="tc-confirm-icon"><AlertTriangle size={28} /></div>
      <h3>Delete Session</h3>
      <p>Delete <strong>{session.title}</strong>? This cannot be undone.</p>
      <div className="tc-confirm-actions">
        <button className="tc-btn tc-btn-ghost" onClick={onCancel} disabled={deleting}>Cancel</button>
        <button className="tc-btn tc-btn-danger" onClick={onConfirm} disabled={deleting}>
          <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── TrainingCalendar ──────────────────────────────────────────────────────────
const TrainingCalendar = () => {
  const [sessions, setSessions]       = useState([]);
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm]   = useState('');
  const [selectedId, setSelectedId]   = useState(null);

  const [modal, setModal]             = useState(null); // null | 'add' | 'edit'
  const [editTarget, setEditTarget]   = useState(null);
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [toast, setToast]             = useState(null);

  const showToast = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3500); };

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/sessions/');
      setSessions(res.data);
      if (res.data.length > 0 && !selectedId) setSelectedId(res.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    api.get('/api/v1/courses/').then((r) => setCourses(r.data)).catch(() => {});
  }, [fetchSessions]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return sessions.filter((s) => {
      const matchType   = selectedType === 'All' || s.type === selectedType;
      const matchSearch = !q || s.title?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q) || s.trainer?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [sessions, searchTerm, selectedType]);

  const eventsByDate = useMemo(() =>
    filtered.reduce((acc, s) => { acc[s.date] = [...(acc[s.date] || []), s]; return acc; }, {}),
    [filtered]
  );

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    const first = new Date(y, m, 1);
    const start = new Date(y, m, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = toKey(d);
      return { date: d, key, isCurrent: d.getMonth() === m, events: eventsByDate[key] || [] };
    });
  }, [currentMonth, eventsByDate]);

  const selectedSession = useMemo(() => filtered.find((s) => s.id === selectedId) || filtered[0], [filtered, selectedId]);

  const stats = useMemo(() => {
    const thisMonth = filtered.filter((s) => {
      const d = new Date(`${s.date}T00:00:00`);
      return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    });
    return {
      thisMonth: thisMonth.length,
      mandatory: filtered.filter((s) => s.priority === 'Mandatory').length,
      confirmed: filtered.filter((s) => s.status === 'Confirmed').length,
      participants: filtered.reduce((t, s) => t + (s.attendees || 0), 0),
    };
  }, [filtered, currentMonth]);

  const handleSave = async (form) => {
    if (!form.title.trim() || !form.date) { setFormError('Title and date are required.'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = { ...form, capacity: Number(form.capacity) || 30, course_id: form.course_id || null };
      if (modal === 'add') {
        const res = await api.post('/api/v1/sessions/', payload);
        setSessions((prev) => [...prev, res.data]);
        setSelectedId(res.data.id);
        showToast('success', 'Session scheduled successfully.');
      } else {
        const res = await api.put(`/api/v1/sessions/${editTarget.id}`, payload);
        setSessions((prev) => prev.map((s) => s.id === editTarget.id ? res.data : s));
        showToast('success', 'Session updated.');
      }
      setModal(null);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save session.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/v1/sessions/${deleteTarget.id}`);
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setSelectedId(null);
      showToast('success', 'Session deleted.');
      setDeleteTarget(null);
    } catch {
      showToast('error', 'Failed to delete session.');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setFormError('');
    setModal('edit');
  };

  return (
    <div className="dashboard-content training-calendar-page">
      {/* Header */}
      <div className="dashboard-header calendar-header">
        <div>
          <h1 className="dashboard-title">Training Calendar</h1>
          <p className="dashboard-subtitle">Plan, track, and manage training sessions.</p>
        </div>
        <button className="calendar-primary-btn" type="button" onClick={() => { setFormError(''); setModal('add'); }}>
          <Plus size={18} /> Schedule Training
        </button>
      </div>

      {/* Toast */}
      {toast && <div className={`tc-toast ${toast.type}`}>{toast.text}</div>}

      {/* Stats */}
      <div className="calendar-summary-grid">
        <div className="calendar-summary-card"><span className="summary-label">This Month</span><strong>{stats.thisMonth}</strong><span>sessions</span></div>
        <div className="calendar-summary-card"><span className="summary-label">Mandatory</span><strong>{stats.mandatory}</strong><span>required</span></div>
        <div className="calendar-summary-card"><span className="summary-label">Confirmed</span><strong>{stats.confirmed}</strong><span>ready to run</span></div>
        <div className="calendar-summary-card"><span className="summary-label">Participants</span><strong>{stats.participants}</strong><span>enrolled</span></div>
      </div>

      {/* Toolbar */}
      <div className="calendar-toolbar">
        <div className="calendar-month-controls">
          <button type="button" className="icon-control" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft size={20} /></button>
          <div className="calendar-month-label"><CalendarDays size={20} />{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
          <button type="button" className="icon-control" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight size={20} /></button>
        </div>
        <div className="calendar-search">
          <Search size={18} />
          <input type="search" placeholder="Search session, department, trainer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="calendar-filter-row">
        {TYPE_FILTERS.map((f) => (
          <button key={f} type="button" className={`calendar-filter ${selectedType === f ? 'active' : ''}`} onClick={() => setSelectedType(f)}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading sessions...</div>
      ) : (
        <div className="calendar-layout">
          {/* Calendar grid */}
          <section className="calendar-panel">
            <div className="calendar-weekdays">{DAY_NAMES.map((d) => <span key={d}>{d}</span>)}</div>
            <div className="calendar-grid">
              {calendarDays.map((day) => (
                <div key={day.key} className={`calendar-day ${!day.isCurrent ? 'muted' : ''} ${day.events.length ? 'has-events' : ''}`}>
                  <span className="calendar-day-number">{day.date.getDate()}</span>
                  <div className="calendar-day-events">
                    {day.events.slice(0, 2).map((ev) => (
                      <button key={ev.id} type="button" className={`calendar-event-pill ${cls(ev.type)}`} onClick={() => setSelectedId(ev.id)} title={ev.title}>
                        {ev.time} {ev.title}
                      </button>
                    ))}
                    {day.events.length > 2 && <span className="calendar-more-count">+{day.events.length - 2} more</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Side panel */}
          <aside className="calendar-side-panel">
            <section className="calendar-detail-card">
              {selectedSession ? (
                <>
                  <div className="detail-card-header">
                    <span className={`training-type ${cls(selectedSession.type)}`}>{selectedSession.type}</span>
                    <span className={`training-status ${cls(selectedSession.status)}`}>{selectedSession.status}</span>
                  </div>
                  <h3>{selectedSession.title}</h3>
                  <div className="detail-meta-list">
                    <span><CalendarDays size={15} />{selectedSession.date}</span>
                    <span><Clock size={15} />{selectedSession.time} · {selectedSession.duration}</span>
                    <span>{selectedSession.delivery === 'Virtual' ? <Video size={15} /> : <MapPin size={15} />}{selectedSession.location || '—'}</span>
                    <span><Users size={15} />{selectedSession.attendees || 0}/{selectedSession.capacity} participants</span>
                  </div>
                  <div className="detail-divider" />
                  <div className="detail-field"><span>Department</span><strong>{selectedSession.department}</strong></div>
                  <div className="detail-field"><span>Trainer</span><strong>{selectedSession.trainer || '—'}</strong></div>
                  <div className="detail-field"><span>Priority</span><strong>{selectedSession.priority}</strong></div>
                  {selectedSession.description && <div className="detail-field"><span>Notes</span><strong style={{ fontWeight: 400 }}>{selectedSession.description}</strong></div>}
                  <div className="detail-actions">
                    <button className="tc-btn tc-btn-outline" onClick={() => openEdit(selectedSession)}><Edit2 size={14} /> Edit</button>
                    <button className="tc-btn tc-btn-danger-outline" onClick={() => setDeleteTarget(selectedSession)}><Trash2 size={14} /> Delete</button>
                  </div>
                </>
              ) : (
                <p className="empty-calendar-copy">{sessions.length === 0 ? 'No sessions yet. Click "Schedule Training" to add one.' : 'No sessions match your filter.'}</p>
              )}
            </section>

            <section className="upcoming-list">
              <h3>All Sessions</h3>
              {filtered.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94a3b8', padding: '8px 0' }}>No sessions found.</p>
              ) : (
                filtered.map((s) => (
                  <button type="button" key={s.id} className={`upcoming-item ${selectedSession?.id === s.id ? 'active' : ''}`} onClick={() => setSelectedId(s.id)}>
                    <span className="upcoming-date">
                      {MONTH_NAMES[new Date(`${s.date}T00:00:00`).getMonth()].slice(0, 3)}
                      <strong>{new Date(`${s.date}T00:00:00`).getDate()}</strong>
                    </span>
                    <span className="upcoming-content">
                      <strong>{s.title}</strong>
                      <small>{s.time} · {s.department}</small>
                    </span>
                    <span className={`tc-mini-badge ${cls(s.status)}`}>{s.status}</span>
                  </button>
                ))
              )}
            </section>
          </aside>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <SessionModal
          mode={modal}
          initial={modal === 'edit' ? { ...editTarget, time: editTarget.time } : BLANK}
          courses={courses}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
          error={formError}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirm session={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} deleting={deleting} />
      )}
    </div>
  );
};

export default TrainingCalendar;
