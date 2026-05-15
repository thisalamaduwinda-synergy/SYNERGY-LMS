import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, User, Shield, Calendar } from 'lucide-react';
import api from '../services/api';
import '../styles/users.css';

const ROLES = ['employee', 'admin', 'instructor'];

const getRoleBadgeClass = (role) => {
  if (role === 'admin') return 'badge-admin';
  if (role === 'instructor') return 'badge-instructor';
  return 'badge-student';
};

const getStatusBadgeClass = (isActive) => (isActive ? 'badge-active' : 'badge-inactive');

const emptyForm = {
  full_name: '',
  email: '',
  username: '',
  password: '',
  phone: '',
  department: '',
  role: 'employee',
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/users/');
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const q = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter((u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
      )
    );
  }, [searchTerm, users]);

  const openAdd = () => {
    setSelectedUser(null);
    setFormData(emptyForm);
    setError('');
    setModalType('add');
    setShowModal(true);
  };

  const openView = (user) => {
    setSelectedUser(user);
    setFormData({ ...user, password: '' });
    setError('');
    setModalType('view');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({ full_name: user.full_name, email: user.email, role: user.role, department: user.department || '', phone: user.phone || '' });
    setError('');
    setModalType('edit');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (modalType === 'add') {
        await api.post('/api/v1/users/register', {
          full_name: formData.full_name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          department: formData.department || null,
          phone: formData.phone || null,
        });
      } else if (modalType === 'edit') {
        await api.put(`/api/v1/users/${selectedUser.id}`, {
          full_name: formData.full_name || null,
          email: formData.email || null,
          role: formData.role || null,
          department: formData.department || null,
          phone: formData.phone || null,
        });
      }
      await fetchUsers();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const endpoint = user.is_active ? 'deactivate' : 'activate';
      await api.patch(`/api/v1/users/${user.id}/${endpoint}`);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/v1/users/${userId}`);
      await fetchUsers();
      if (selectedUser?.id === userId) setShowModal(false);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const field = (key, value) => setFormData((f) => ({ ...f, [key]: value }));

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h1 className="users-title">User Management</h1>
          <p className="users-subtitle">Manage all users and their roles</p>
        </div>
        <button className="btn-add-user" onClick={openAdd}>
          <Plus size={20} /> Add New User
        </button>
      </div>

      <div className="users-controls">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="users-stats">
          <span className="stat">Total: {users.length}</span>
          <span className="stat">Active: {users.filter((u) => u.is_active).length}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading users...</div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar" style={{ background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700' }}>
                  {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="user-badges">
                  <span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                  <span className={`badge ${getStatusBadgeClass(user.is_active)}`}>
                    {user.is_active ? 'active' : 'inactive'}
                  </span>
                </div>
              </div>

              <div className="user-card-body">
                <h3 className="user-name">{user.full_name}</h3>
                <div className="user-info"><User size={16} /><span>{user.username}</span></div>
                <div className="user-info"><Shield size={16} /><span>{user.email}</span></div>
                {user.department && <div className="user-info"><Shield size={16} /><span>{user.department}</span></div>}
                <div className="user-info">
                  <Calendar size={16} />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="user-card-actions">
                <button className="btn-action btn-view" onClick={() => openView(user)} title="View"><User size={18} /></button>
                <button className="btn-action btn-edit" onClick={() => openEdit(user)} title="Edit"><Edit size={18} /></button>
                <button
                  className={`btn-action ${user.is_active ? 'btn-delete' : 'btn-view'}`}
                  onClick={() => handleToggleActive(user)}
                  title={user.is_active ? 'Deactivate' : 'Activate'}
                  style={{ fontSize: '12px', width: 'auto', padding: '6px 10px' }}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn-action btn-delete" onClick={() => handleDelete(user.id)} title="Delete"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="no-results">
          <User size={48} />
          <h3>No users found</h3>
          <p>Try adjusting your search or add a new user</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'view' && 'User Details'}
                {modalType === 'edit' && 'Edit User'}
                {modalType === 'add' && 'Add New User'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={formData.full_name} onChange={(e) => field('full_name', e.target.value)} disabled={modalType === 'view'} className="form-input" />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.email} onChange={(e) => field('email', e.target.value)} disabled={modalType === 'view'} className="form-input" />
              </div>

              {modalType === 'add' && (
                <>
                  <div className="form-group">
                    <label>Username</label>
                    <input type="text" value={formData.username} onChange={(e) => field('username', e.target.value)} className="form-input" placeholder="Unique username" />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={formData.password} onChange={(e) => field('password', e.target.value)} className="form-input" placeholder="Initial password" />
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={formData.phone || ''} onChange={(e) => field('phone', e.target.value)} disabled={modalType === 'view'} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" value={formData.department || ''} onChange={(e) => field('department', e.target.value)} disabled={modalType === 'view'} className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label>Role</label>
                <select value={formData.role} onChange={(e) => field('role', e.target.value)} disabled={modalType === 'view'} className="form-input">
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                {modalType === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalType !== 'view' && (
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
