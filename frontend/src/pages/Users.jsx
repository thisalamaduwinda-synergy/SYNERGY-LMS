import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Mail, Phone, MapPin, User, Shield, Calendar } from 'lucide-react';
import '../styles/users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // view, edit, add
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'student',
    status: 'active',
    joinDate: '',
  });

  // Sample data - replace with API call
  useEffect(() => {
    const sampleUsers = [
      {
        id: 1,
        name: 'Dr. Ahmed Hassan',
        email: 'ahmed.hassan@synergy.com',
        phone: '+1 (555) 123-4567',
        department: 'Pharmaceutical Sciences',
        role: 'instructor',
        status: 'active',
        joinDate: '2024-01-15',
        avatar: '👨‍🏫',
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@synergy.com',
        phone: '+1 (555) 234-5678',
        department: 'Quality Control',
        role: 'student',
        status: 'active',
        joinDate: '2024-02-20',
        avatar: '👩‍💼',
      },
      {
        id: 3,
        name: 'Michael Chen',
        email: 'michael.chen@synergy.com',
        phone: '+1 (555) 345-6789',
        department: 'Clinical Research',
        role: 'instructor',
        status: 'active',
        joinDate: '2024-01-10',
        avatar: '👨‍💼',
      },
      {
        id: 4,
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@synergy.com',
        phone: '+1 (555) 456-7890',
        department: 'Regulatory Affairs',
        role: 'student',
        status: 'inactive',
        joinDate: '2024-03-05',
        avatar: '👩‍💻',
      },
      {
        id: 5,
        name: 'James Wilson',
        email: 'james.wilson@synergy.com',
        phone: '+1 (555) 567-8901',
        department: 'Administration',
        role: 'admin',
        status: 'active',
        joinDate: '2023-12-01',
        avatar: '👨‍💼',
      },
      {
        id: 6,
        name: 'Lisa Park',
        email: 'lisa.park@synergy.com',
        phone: '+1 (555) 678-9012',
        department: 'Product Development',
        role: 'student',
        status: 'active',
        joinDate: '2024-02-28',
        avatar: '👩‍🔬',
      },
    ];
    setUsers(sampleUsers);
    setFilteredUsers(sampleUsers);
  }, []);

  // Handle search filter
  useEffect(() => {
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setFormData(user);
    setModalType('view');
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData(user);
    setModalType('edit');
    setShowModal(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      role: 'student',
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
    });
    setModalType('add');
    setShowModal(true);
  };

  const handleSaveUser = () => {
    if (modalType === 'edit') {
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...selectedUser, ...formData } : u)));
    } else if (modalType === 'add') {
      setUsers([...users, { ...formData, id: Math.max(...users.map((u) => u.id), 0) + 1, avatar: '👤' }]);
    }
    setShowModal(false);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter((u) => u.id !== userId));
      if (selectedUser?.id === userId) {
        setShowModal(false);
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-admin';
      case 'instructor':
        return 'badge-instructor';
      case 'student':
        return 'badge-student';
      default:
        return 'badge-default';
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'badge-active' : 'badge-inactive';
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h1 className="users-title">User Management</h1>
          <p className="users-subtitle">Manage all users and their roles</p>
        </div>
        <button className="btn-add-user" onClick={handleAddUser}>
          <Plus size={20} />
          Add New User
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
          <span className="stat">Active: {users.filter((u) => u.status === 'active').length}</span>
        </div>
      </div>

      <div className="users-grid">
        {filteredUsers.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-card-header">
              <div className="user-avatar">{user.avatar}</div>
              <div className="user-badges">
                <span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                <span className={`badge ${getStatusBadgeClass(user.status)}`}>{user.status}</span>
              </div>
            </div>

            <div className="user-card-body">
              <h3 className="user-name">{user.name}</h3>
              <div className="user-info">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <div className="user-info">
                <Phone size={16} />
                <span>{user.phone}</span>
              </div>
              <div className="user-info">
                <Shield size={16} />
                <span>{user.department}</span>
              </div>
              <div className="user-info">
                <Calendar size={16} />
                <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="user-card-actions">
              <button className="btn-action btn-view" onClick={() => handleViewUser(user)} title="View">
                <User size={18} />
              </button>
              <button className="btn-action btn-edit" onClick={() => handleEditUser(user)} title="Edit">
                <Edit size={18} />
              </button>
              <button className="btn-action btn-delete" onClick={() => handleDeleteUser(user.id)} title="Delete">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-results">
          <User size={48} />
          <h3>No users found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'view' && 'User Details'}
                {modalType === 'edit' && 'Edit User'}
                {modalType === 'add' && 'Add New User'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={modalType === 'view'}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={modalType === 'view'}
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={modalType === 'view'}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Join Date</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    disabled={modalType === 'view'}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={modalType === 'view'}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={modalType === 'view'}
                    className="form-input"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={modalType === 'view'}
                  className="form-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                {modalType === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalType !== 'view' && (
                <button className="btn-save" onClick={handleSaveUser}>
                  Save Changes
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
