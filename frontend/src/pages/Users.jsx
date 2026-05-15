import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Edit2, Trash2, UserCheck, UserX,
  Mail, Phone, Building2, ShieldCheck, X, Save, AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import '../styles/users.css';

const ROLES = ['employee', 'instructor', 'admin'];
const ROLE_TABS = ['All', 'Employee', 'Instructor', 'Admin'];
const DEPARTMENTS = ['Quality Control', 'Manufacturing', 'Laboratory', 'Compliance', 'Administration'];

const roleBadge = (role) => {
  if (role === 'admin') return 'badge-admin';
  if (role === 'instructor') return 'badge-instructor';
  return 'badge-employee';
};

const emptyForm = {
  full_name: '', email: '', username: '', password: '',
  phone: '', department: '', role: 'employee',
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ user, onConfirm, onCancel, deleting }) => (
  <div className="u-overlay" onClick={onCancel}>
    <div className="u-confirm-modal" onClick={(e) => e.stopPropagation()}>
      <div className="u-confirm-icon"><AlertTriangle size={32} /></div>
      <h3>Delete User</h3>
      <p>
        Are you sure you want to delete <strong>{user.full_name}</strong>?
        <br />This action cannot be undone.
      </p>
      <div className="u-confirm-actions">
        <button className="u-btn u-btn-ghost" onClick={onCancel} disabled={deleting}>Cancel</button>
        <button className="u-btn u-btn-danger" onClick={onConfirm} disabled={deleting}>
          <Trash2 size={15} /> {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
const UserFormModal = ({ mode, formData, onChange, onSave, onClose, saving, error }) => (
  <div className="u-overlay" onClick={onClose}>
    <div className="u-modal" onClick={(e) => e.stopPropagation()}>
      <div className="u-modal-header">
        <h2>{mode === 'add' ? 'Add New User' : 'Edit User'}</h2>
        <button className="u-modal-close" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="u-modal-body">
        {error && <div className="u-error-bar">{error}</div>}

        <div className="u-form-row">
          <div className="u-form-group">
            <label>Full Name *</label>
            <input type="text" value={formData.full_name} onChange={(e) => onChange('full_name', e.target.value)} placeholder="e.g. John Silva" />
          </div>
          <div className="u-form-group">
            <label>Email *</label>
            <input type="email" value={formData.email} onChange={(e) => onChange('email', e.target.value)} placeholder="john@company.com" />
          </div>
        </div>

        {mode === 'add' && (
          <div className="u-form-row">
            <div className="u-form-group">
              <label>Username *</label>
              <input type="text" value={formData.username} onChange={(e) => onChange('username', e.target.value)} placeholder="Unique username" />
            </div>
            <div className="u-form-group">
              <label>Password *</label>
              <input type="password" value={formData.password} onChange={(e) => onChange('password', e.target.value)} placeholder="Initial password" />
            </div>
          </div>
        )}

        <div className="u-form-row">
          <div className="u-form-group">
            <label>Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="+94 71 234 5678" />
          </div>
          <div className="u-form-group">
            <label>Department</label>
            <select value={formData.department} onChange={(e) => onChange('department', e.target.value)}>
              <option value="">— Select department —</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="u-form-group">
          <label>Role</label>
          <div className="u-role-selector">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                className={`u-role-opt ${formData.role === r ? 'active' : ''}`}
                onClick={() => onChange('role', r)}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="u-modal-footer">
        <button className="u-btn u-btn-ghost" onClick={onClose}>Cancel</button>
        <button className="u-btn u-btn-primary" onClick={onSave} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving...' : mode === 'add' ? 'Create User' : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All | Active | Inactive

  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [formData, setFormData] = useState(emptyForm);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const showMsg = (type, text) => { setActionMsg({ type, text }); setTimeout(() => setActionMsg(null), 3500); };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/users/');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
      const matchRole = roleTab === 'All' || u.role === roleTab.toLowerCase();
      const matchStatus = statusFilter === 'All' || (statusFilter === 'Active' ? u.is_active : !u.is_active);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleTab, statusFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admin: users.filter((u) => u.role === 'admin').length,
    employee: users.filter((u) => u.role === 'employee').length,
  }), [users]);

  const field = (key, val) => setFormData((f) => ({ ...f, [key]: val }));

  const openAdd = () => {
    setFormData(emptyForm);
    setFormError('');
    setModal('add');
  };

  const openEdit = (user) => {
    setEditTarget(user);
    setFormData({ full_name: user.full_name, email: user.email, username: user.username || '', password: '', phone: user.phone || '', department: user.department || '', role: user.role });
    setFormError('');
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'add') {
        if (!formData.full_name || !formData.email || !formData.username || !formData.password) {
          setFormError('Full name, email, username and password are required.');
          return;
        }
        await api.post('/api/v1/users/register', {
          full_name: formData.full_name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          department: formData.department || null,
          phone: formData.phone || null,
        });
        showMsg('success', `User "${formData.full_name}" created successfully.`);
      } else {
        await api.put(`/api/v1/users/${editTarget.id}`, {
          full_name: formData.full_name || null,
          email: formData.email || null,
          role: formData.role || null,
          department: formData.department || null,
          phone: formData.phone || null,
        });
        showMsg('success', `User "${formData.full_name}" updated.`);
      }
      await fetchUsers();
      setModal(null);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (user) => {
    setTogglingId(user.id);
    try {
      await api.patch(`/api/v1/users/${user.id}/${user.is_active ? 'deactivate' : 'activate'}`);
      await fetchUsers();
      showMsg('success', `${user.full_name} ${user.is_active ? 'deactivated' : 'activated'}.`);
    } catch {
      showMsg('error', 'Failed to update status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/v1/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      showMsg('success', `User "${deleteTarget.full_name}" deleted.`);
      setDeleteTarget(null);
    } catch {
      showMsg('error', 'Failed to delete user.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="u-page">
      {/* Header */}
      <div className="u-page-header">
        <div>
          <h1>User Management</h1>
          <p>Add, edit, activate/deactivate and delete system users</p>
        </div>
        <button className="u-btn u-btn-primary u-btn-lg" onClick={openAdd}>
          <Plus size={18} /> Add New User
        </button>
      </div>

      {/* Stats row */}
      <div className="u-stats-row">
        <div className="u-stat-card"><span className="u-stat-val">{stats.total}</span><span className="u-stat-lbl">Total Users</span></div>
        <div className="u-stat-card green"><span className="u-stat-val">{stats.active}</span><span className="u-stat-lbl">Active</span></div>
        <div className="u-stat-card blue"><span className="u-stat-val">{stats.employee}</span><span className="u-stat-lbl">Employees</span></div>
        <div className="u-stat-card purple"><span className="u-stat-val">{stats.admin}</span><span className="u-stat-lbl">Admins</span></div>
      </div>

      {/* Toast */}
      {actionMsg && <div className={`u-toast ${actionMsg.type}`}>{actionMsg.text}</div>}

      {/* Toolbar */}
      <div className="u-toolbar">
        <div className="u-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search name, email, username, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="u-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Role tabs */}
      <div className="u-role-tabs">
        {ROLE_TABS.map((t) => (
          <button key={t} className={roleTab === t ? 'active' : ''} onClick={() => setRoleTab(t)}>
            {t}
            <span className="u-tab-count">
              {t === 'All' ? users.length : users.filter((u) => u.role === t.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="u-loading">Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="u-empty">
          <ShieldCheck size={48} />
          <h3>No users found</h3>
          <p>Try adjusting the search or filters</p>
        </div>
      ) : (
        <div className="u-table-wrap">
          <table className="u-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="u-user-cell">
                      <div className="u-avatar">{user.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
                      <div>
                        <div className="u-user-name">{user.full_name}</div>
                        <div className="u-user-sub">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="u-contact-cell">
                      <span><Mail size={13} />{user.email}</span>
                      {user.phone && <span><Phone size={13} />{user.phone}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="u-dept-cell">
                      {user.department ? <><Building2 size={13} />{user.department}</> : <span className="u-muted">—</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`u-badge ${roleBadge(user.role)}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`u-badge ${user.is_active ? 'u-badge-active' : 'u-badge-inactive'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="u-muted" style={{ fontSize: 13 }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="u-actions">
                      <button
                        className="u-act-btn edit"
                        title="Edit user"
                        onClick={() => openEdit(user)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`u-act-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggle(user)}
                        disabled={togglingId === user.id}
                      >
                        {togglingId === user.id
                          ? '...'
                          : user.is_active
                            ? <UserX size={15} />
                            : <UserCheck size={15} />}
                      </button>
                      <button
                        className="u-act-btn delete"
                        title="Delete user"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="u-table-footer">
        Showing {filtered.length} of {users.length} users
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <UserFormModal
          mode={modal}
          formData={formData}
          onChange={field}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
          error={formError}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default Users;
