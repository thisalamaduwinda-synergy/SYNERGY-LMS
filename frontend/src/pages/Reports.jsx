import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  BarChart2, Users, BookOpen, Award, TrendingUp, FileText,
  Download, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  RefreshCw, Building2, ClipboardList,
} from 'lucide-react';
import api from '../services/api';
import '../styles/reports.css';

// ── constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',      label: 'Overview',       icon: BarChart2 },
  { id: 'users',         label: 'User Report',     icon: Users },
  { id: 'courses',       label: 'Course Report',   icon: BookOpen },
  { id: 'quizzes',       label: 'Quiz Report',     icon: ClipboardList },
  { id: 'departments',   label: 'Departments',     icon: Building2 },
  { id: 'certificates',  label: 'Certificates',    icon: Award },
];

const CHART_COLORS = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

const PAGE_SIZE = 10;

// ── helpers ───────────────────────────────────────────────────────────────────

function progressClass(rate) {
  if (rate >= 70) return 'high';
  if (rate >= 40) return 'medium';
  return 'low';
}

function fmtDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return val;
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="rpt-loading">
    <div className="rpt-spinner" />
    <span>Loading data…</span>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpt-tooltip">
      <div className="rpt-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="rpt-tooltip-value" style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

function ProgressCell({ value }) {
  const cls = progressClass(value);
  return (
    <div className="rpt-progress">
      <div className="rpt-progress-bar">
        <div className={`rpt-progress-fill ${cls}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="rpt-progress-text">{value}%</span>
    </div>
  );
}

function SortTh({ label, field, sort, onSort }) {
  const active = sort.field === field;
  return (
    <th className={active ? 'sorted' : ''} onClick={() => onSort(field)}>
      {label}
      <span className="sort-icon">
        {active ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  );
}

function useSortSearch(data) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ field: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  const handleSort = useCallback((field) => {
    setSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  }, []);

  const handleSearch = useCallback((val) => {
    setQuery(val);
    setPage(1);
  }, []);

  return { query, setQuery: handleSearch, sort, handleSort, page, setPage };
}

function Paginator({ page, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="rpt-pagination">
      <span>
        Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </span>
      <div className="rpt-page-btns">
        <button className="rpt-page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
          return (
            <button key={p} className={`rpt-page-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p)}>
              {p}
            </button>
          );
        })}
        <button className="rpt-page-btn" disabled={page === pages} onClick={() => onPage(page + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── KPI Cards ─────────────────────────────────────────────────────────────────

function KpiCards({ data }) {
  const cards = [
    { label: 'Total Employees', value: data.total_users ?? 0, sub: `${data.active_users ?? 0} active`, icon: Users, color: 'blue' },
    { label: 'Total Courses', value: data.total_courses ?? 0, sub: `${data.active_courses ?? 0} active`, icon: BookOpen, color: 'green' },
    { label: 'Total Enrollments', value: data.total_enrollments ?? 0, sub: `${data.completed_enrollments ?? 0} completed`, icon: TrendingUp, color: 'purple' },
    { label: 'Completion Rate', value: `${data.completion_rate ?? 0}%`, sub: 'overall', icon: BarChart2, color: 'orange' },
    { label: 'Certificates Issued', value: data.total_certificates ?? 0, sub: 'all time', icon: Award, color: 'teal' },
    { label: 'Quiz Pass Rate', value: `${data.quiz_pass_rate ?? 0}%`, sub: `${data.total_quiz_attempts ?? 0} attempts`, icon: FileText, color: 'rose' },
  ];

  return (
    <div className="reports-kpi-grid">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div className="kpi-card" key={c.label}>
            <div className={`kpi-icon ${c.color}`}>
              <Icon size={22} />
            </div>
            <div className="kpi-body">
              <div className="kpi-label">{c.label}</div>
              <div className="kpi-value">{c.value}</div>
              <div className="kpi-sub">{c.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ overview }) {
  if (!overview) return <Spinner />;

  const enrollData = overview.monthly_enrollments ?? [];
  const completionData = overview.monthly_completions ?? [];

  const pieData = [
    { name: 'Completed', value: overview.completed_enrollments ?? 0 },
    { name: 'In Progress', value: Math.max(0, (overview.total_enrollments ?? 0) - (overview.completed_enrollments ?? 0)) },
  ];

  const quizPie = [
    { name: 'Passed', value: overview.passed_attempts ?? 0 },
    { name: 'Failed', value: Math.max(0, (overview.total_quiz_attempts ?? 0) - (overview.passed_attempts ?? 0)) },
  ];

  return (
    <div className="report-panel">
      <div className="report-charts-row">
        <div className="report-card">
          <div className="report-card-title">Monthly Enrollments</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={enrollData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Enrollments" fill="#1e40af" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <div className="report-card-title">Monthly Completions</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={completionData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Completions" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="report-charts-row">
        <div className="report-card">
          <div className="report-card-title">Enrollment Status Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <div className="report-card-title">Quiz Performance</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={quizPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ rows }) {
  const { query, setQuery, sort, handleSort, page, setPage } = useSortSearch(rows);

  if (!rows) return <Spinner />;

  const filtered = rows.filter(u =>
    [u.full_name, u.email, u.department, u.role].some(v =>
      (v || '').toLowerCase().includes(query.toLowerCase())
    )
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sort.field) return 0;
    const av = a[sort.field] ?? '';
    const bv = b[sort.field] ?? '';
    return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="report-card">
      <div className="report-table-toolbar">
        <h3>Employee Training Report ({filtered.length})</h3>
        <div className="report-search-box">
          <Search size={15} color="#9ca3af" />
          <input placeholder="Search employees…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {paged.length === 0 ? (
        <div className="rpt-empty">No employees found.</div>
      ) : (
        <>
          <div className="report-table-wrapper">
            <table className="rpt-table">
              <thead>
                <tr>
                  <SortTh label="Name" field="full_name" sort={sort} onSort={handleSort} />
                  <SortTh label="Department" field="department" sort={sort} onSort={handleSort} />
                  <SortTh label="Role" field="role" sort={sort} onSort={handleSort} />
                  <th>Status</th>
                  <SortTh label="Enrollments" field="enrollments" sort={sort} onSort={handleSort} />
                  <SortTh label="Completed" field="completed_courses" sort={sort} onSort={handleSort} />
                  <SortTh label="Completion %" field="completion_rate" sort={sort} onSort={handleSort} />
                  <SortTh label="Avg Score" field="avg_quiz_score" sort={sort} onSort={handleSort} />
                  <SortTh label="Certificates" field="certificates" sort={sort} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {paged.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{u.email}</div>
                    </td>
                    <td>{u.department || '—'}</td>
                    <td>
                      <span className={`rpt-badge ${u.role === 'admin' ? 'admin' : 'employee'}`}>
                        {u.role || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`rpt-badge ${u.is_active ? 'active' : 'inactive'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{u.enrollments}</td>
                    <td style={{ textAlign: 'center' }}>{u.completed_courses}</td>
                    <td><ProgressCell value={u.completion_rate} /></td>
                    <td style={{ textAlign: 'center' }}>{u.avg_quiz_score > 0 ? `${u.avg_quiz_score}%` : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{u.certificates}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator page={page} total={filtered.length} onPage={setPage} />
        </>
      )}
    </div>
  );
}

// ── Courses Tab ───────────────────────────────────────────────────────────────

function CoursesTab({ rows }) {
  const { query, setQuery, sort, handleSort, page, setPage } = useSortSearch(rows);

  if (!rows) return <Spinner />;

  const filtered = rows.filter(c =>
    [c.title, c.department].some(v => (v || '').toLowerCase().includes(query.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sort.field) return 0;
    const av = a[sort.field] ?? '';
    const bv = b[sort.field] ?? '';
    return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const topCourses = [...rows]
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 8)
    .map(c => ({ name: c.title?.length > 20 ? c.title.slice(0, 20) + '…' : c.title, enrollments: c.enrollments, completed: c.completed }));

  return (
    <div className="report-panel">
      {topCourses.length > 0 && (
        <div className="report-card">
          <div className="report-card-title">Top Courses by Enrollment</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCourses} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="enrollments" name="Enrolled" fill="#1e40af" radius={[0, 4, 4, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="report-card">
        <div className="report-table-toolbar">
          <h3>Course Performance ({filtered.length})</h3>
          <div className="report-search-box">
            <Search size={15} color="#9ca3af" />
            <input placeholder="Search courses…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="rpt-empty">No courses found.</div>
        ) : (
          <>
            <div className="report-table-wrapper">
              <table className="rpt-table">
                <thead>
                  <tr>
                    <SortTh label="Course Title" field="title" sort={sort} onSort={handleSort} />
                    <SortTh label="Department" field="department" sort={sort} onSort={handleSort} />
                    <th>Status</th>
                    <SortTh label="Enrolled" field="enrollments" sort={sort} onSort={handleSort} />
                    <SortTh label="Completed" field="completed" sort={sort} onSort={handleSort} />
                    <SortTh label="Completion %" field="completion_rate" sort={sort} onSort={handleSort} />
                    <SortTh label="Certificates" field="certificates_issued" sort={sort} onSort={handleSort} />
                    <SortTh label="Avg Score" field="avg_quiz_score" sort={sort} onSort={handleSort} />
                    <SortTh label="Quiz Pass %" field="quiz_pass_rate" sort={sort} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {paged.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: '#1f2937', maxWidth: 200 }}>{c.title}</td>
                      <td>{c.department || '—'}</td>
                      <td>
                        <span className={`rpt-badge ${c.is_active ? 'active' : 'inactive'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{c.enrollments}</td>
                      <td style={{ textAlign: 'center' }}>{c.completed}</td>
                      <td><ProgressCell value={c.completion_rate} /></td>
                      <td style={{ textAlign: 'center' }}>{c.certificates_issued}</td>
                      <td style={{ textAlign: 'center' }}>{c.avg_quiz_score > 0 ? `${c.avg_quiz_score}%` : '—'}</td>
                      <td><ProgressCell value={c.quiz_pass_rate} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginator page={page} total={filtered.length} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Quizzes Tab ───────────────────────────────────────────────────────────────

function QuizzesTab({ rows }) {
  const { query, setQuery, sort, handleSort, page, setPage } = useSortSearch(rows);

  if (!rows) return <Spinner />;

  const filtered = rows.filter(q =>
    [q.title, q.course_title].some(v => (v || '').toLowerCase().includes(query.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sort.field) return 0;
    const av = a[sort.field] ?? '';
    const bv = b[sort.field] ?? '';
    return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const chartData = [...rows]
    .filter(q => q.total_attempts > 0)
    .sort((a, b) => b.total_attempts - a.total_attempts)
    .slice(0, 8)
    .map(q => ({
      name: q.title?.length > 18 ? q.title.slice(0, 18) + '…' : q.title,
      passed: q.passed_attempts,
      failed: q.failed_attempts,
    }));

  return (
    <div className="report-panel">
      {chartData.length > 0 && (
        <div className="report-card">
          <div className="report-card-title">Quiz Attempt Outcomes</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="passed" name="Passed" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="report-card">
        <div className="report-table-toolbar">
          <h3>Quiz Performance ({filtered.length})</h3>
          <div className="report-search-box">
            <Search size={15} color="#9ca3af" />
            <input placeholder="Search quizzes…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="rpt-empty">No quizzes found.</div>
        ) : (
          <>
            <div className="report-table-wrapper">
              <table className="rpt-table">
                <thead>
                  <tr>
                    <SortTh label="Quiz Title" field="title" sort={sort} onSort={handleSort} />
                    <SortTh label="Course" field="course_title" sort={sort} onSort={handleSort} />
                    <SortTh label="Passing Score" field="passing_score" sort={sort} onSort={handleSort} />
                    <SortTh label="Attempts" field="total_attempts" sort={sort} onSort={handleSort} />
                    <SortTh label="Passed" field="passed_attempts" sort={sort} onSort={handleSort} />
                    <SortTh label="Failed" field="failed_attempts" sort={sort} onSort={handleSort} />
                    <SortTh label="Pass Rate" field="pass_rate" sort={sort} onSort={handleSort} />
                    <SortTh label="Avg Score" field="avg_score" sort={sort} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {paged.map(q => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600, color: '#1f2937' }}>{q.title}</td>
                      <td style={{ color: '#6b7280', fontSize: 13 }}>{q.course_title}</td>
                      <td style={{ textAlign: 'center' }}>{q.passing_score}%</td>
                      <td style={{ textAlign: 'center' }}>{q.total_attempts}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="rpt-badge passed">{q.passed_attempts}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="rpt-badge failed">{q.failed_attempts}</span>
                      </td>
                      <td><ProgressCell value={q.pass_rate} /></td>
                      <td style={{ textAlign: 'center' }}>{q.total_attempts > 0 ? `${q.avg_score}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginator page={page} total={filtered.length} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Departments Tab ───────────────────────────────────────────────────────────

function DepartmentsTab({ rows }) {
  const { query, setQuery, sort, handleSort, page, setPage } = useSortSearch(rows);

  if (!rows) return <Spinner />;

  const filtered = rows.filter(d =>
    (d.department || '').toLowerCase().includes(query.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sort.field) return 0;
    const av = a[sort.field] ?? '';
    const bv = b[sort.field] ?? '';
    return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const chartData = rows.slice(0, 8).map(d => ({
    dept: d.department.length > 14 ? d.department.slice(0, 14) + '…' : d.department,
    users: d.total_users,
    completions: d.completed_enrollments,
  }));

  return (
    <div className="report-panel">
      {chartData.length > 0 && (
        <div className="report-card">
          <div className="report-card-title">Employees & Completions by Department</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="users" name="Employees" fill="#1e40af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completions" name="Completions" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="report-card">
        <div className="report-table-toolbar">
          <h3>Department Breakdown ({filtered.length})</h3>
          <div className="report-search-box">
            <Search size={15} color="#9ca3af" />
            <input placeholder="Search departments…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="rpt-empty">No departments found.</div>
        ) : (
          <>
            <div className="report-table-wrapper">
              <table className="rpt-table">
                <thead>
                  <tr>
                    <SortTh label="Department" field="department" sort={sort} onSort={handleSort} />
                    <SortTh label="Total Employees" field="total_users" sort={sort} onSort={handleSort} />
                    <SortTh label="Active" field="active_users" sort={sort} onSort={handleSort} />
                    <SortTh label="Enrollments" field="total_enrollments" sort={sort} onSort={handleSort} />
                    <SortTh label="Completed" field="completed_enrollments" sort={sort} onSort={handleSort} />
                    <SortTh label="Completion %" field="completion_rate" sort={sort} onSort={handleSort} />
                    <SortTh label="Certificates" field="certificates" sort={sort} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {paged.map(d => (
                    <tr key={d.department}>
                      <td style={{ fontWeight: 600, color: '#1f2937' }}>{d.department}</td>
                      <td style={{ textAlign: 'center' }}>{d.total_users}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="rpt-badge active">{d.active_users}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{d.total_enrollments}</td>
                      <td style={{ textAlign: 'center' }}>{d.completed_enrollments}</td>
                      <td><ProgressCell value={d.completion_rate} /></td>
                      <td style={{ textAlign: 'center' }}>{d.certificates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginator page={page} total={filtered.length} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Certificates Tab ──────────────────────────────────────────────────────────

function CertificatesTab({ rows }) {
  const { query, setQuery, sort, handleSort, page, setPage } = useSortSearch(rows);

  if (!rows) return <Spinner />;

  const filtered = rows.filter(c =>
    [c.user_name, c.user_email, c.department, c.course_title, c.certificate_number].some(v =>
      (v || '').toLowerCase().includes(query.toLowerCase())
    )
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sort.field) return 0;
    const av = a[sort.field] ?? '';
    const bv = b[sort.field] ?? '';
    return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="report-card">
      <div className="report-table-toolbar">
        <h3>Issued Certificates ({filtered.length})</h3>
        <div className="report-search-box">
          <Search size={15} color="#9ca3af" />
          <input placeholder="Search certificates…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {paged.length === 0 ? (
        <div className="rpt-empty">No certificates found.</div>
      ) : (
        <>
          <div className="report-table-wrapper">
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>Certificate No.</th>
                  <SortTh label="Employee" field="user_name" sort={sort} onSort={handleSort} />
                  <SortTh label="Department" field="department" sort={sort} onSort={handleSort} />
                  <SortTh label="Course" field="course_title" sort={sort} onSort={handleSort} />
                  <SortTh label="Issued Date" field="issued_at" sort={sort} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {paged.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
                      {c.certificate_number || '—'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{c.user_name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{c.user_email}</div>
                    </td>
                    <td>{c.department || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{c.course_title || '—'}</td>
                    <td>{fmtDate(c.issued_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator page={page} total={filtered.length} onPage={setPage} />
        </>
      )}
    </div>
  );
}

// ── Export Dropdown ───────────────────────────────────────────────────────────

function ExportDropdown({ activeTab }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doExport = (endpoint, filename) => {
    setOpen(false);
    const token = localStorage.getItem('token');
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const url = `${base}/api/v1/reports/export/${endpoint}`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert('Export failed. Please try again.'));
  };

  const options = [
    { label: 'Export User Report (CSV)', fn: () => doExport('users', 'users_report.csv') },
    { label: 'Export Course Report (CSV)', fn: () => doExport('courses', 'courses_report.csv') },
    { label: 'Export Certificate Report (CSV)', fn: () => doExport('certificates', 'certificates_report.csv') },
  ];

  return (
    <div className="export-dropdown-wrapper" ref={ref}>
      <button className="export-btn" onClick={() => setOpen(o => !o)}>
        <Download size={16} />
        Export
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="export-menu">
          {options.map(o => (
            <button key={o.label} className="export-menu-item" onClick={o.fn}>
              <FileText size={15} />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState(null);
  const [courses, setCourses] = useState(null);
  const [quizzes, setQuizzes] = useState(null);
  const [departments, setDepartments] = useState(null);
  const [certificates, setCertificates] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, us, co, qu, dp, ce] = await Promise.all([
        api.get('/api/v1/reports/overview'),
        api.get('/api/v1/reports/users'),
        api.get('/api/v1/reports/courses'),
        api.get('/api/v1/reports/quizzes'),
        api.get('/api/v1/reports/departments'),
        api.get('/api/v1/reports/certificates'),
      ]);
      setOverview(ov.data);
      setUsers(us.data);
      setCourses(co.data);
      setQuizzes(qu.data);
      setDepartments(dp.data);
      setCertificates(ce.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="reports-content">
      {/* Header */}
      <div className="reports-header">
        <div className="reports-header-left">
          <h1>Reports &amp; Analytics</h1>
          <p>
            Comprehensive training analytics for Synergy Pharmaceuticals
            {lastRefresh && (
              <span style={{ marginLeft: 8, color: '#9ca3af' }}>
                · Last updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="reports-header-actions">
          <button
            className="export-btn"
            style={{ background: loading ? '#9ca3af' : undefined, cursor: loading ? 'not-allowed' : 'pointer' }}
            onClick={fetchAll}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'rpt-spin-icon' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <ExportDropdown activeTab={activeTab} />
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards data={overview ?? {}} />

      {/* Tabs */}
      <div className="reports-tabs">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`reports-tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview'     && <OverviewTab     overview={overview} />}
      {activeTab === 'users'        && <UsersTab        rows={users} />}
      {activeTab === 'courses'      && <CoursesTab      rows={courses} />}
      {activeTab === 'quizzes'      && <QuizzesTab      rows={quizzes} />}
      {activeTab === 'departments'  && <DepartmentsTab  rows={departments} />}
      {activeTab === 'certificates' && <CertificatesTab rows={certificates} />}
    </div>
  );
}
