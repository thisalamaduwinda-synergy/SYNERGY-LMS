import React, { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MyProfile = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });
  const [passwords, setPasswords] = useState({ current: '', new_pass: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const showMsg = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter(null), 3500);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put(`/api/v1/users/${user.id}`, {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        department: profile.department,
      });
      showMsg(setProfileMsg, 'success', 'Profile updated successfully.');
    } catch (err) {
      showMsg(setProfileMsg, 'error', err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.new_pass !== passwords.confirm) {
      showMsg(setPassMsg, 'error', 'New passwords do not match.');
      return;
    }
    if (passwords.new_pass.length < 6) {
      showMsg(setPassMsg, 'error', 'Password must be at least 6 characters.');
      return;
    }
    setSavingPass(true);
    try {
      await api.put(`/api/v1/users/${user.id}`, { password: passwords.new_pass });
      setPasswords({ current: '', new_pass: '', confirm: '' });
      showMsg(setPassMsg, 'success', 'Password changed successfully.');
    } catch (err) {
      showMsg(setPassMsg, 'error', err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div>
      <div className="up-page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and account settings</p>
      </div>

      {/* Avatar + name banner */}
      <div className="up-profile-banner">
        <div className="up-profile-avatar">
          {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <div className="up-profile-name">{user?.full_name || 'User'}</div>
          <div className="up-profile-role">{user?.role || 'employee'} &bull; {user?.department || 'General'}</div>
        </div>
      </div>

      {/* Personal info form */}
      <div className="up-card">
        <div className="up-card-header">
          <User size={17} />
          <h3>Personal Information</h3>
        </div>
        <div className="up-card-body">
          {profileMsg && <div className={`up-alert ${profileMsg.type}`}>{profileMsg.text}</div>}
          <form onSubmit={handleProfileSave} className="up-form">
            <div className="up-form-row">
              <div className="up-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="up-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="up-form-row">
              <div className="up-form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="e.g. +94 71 234 5678"
                />
              </div>
              <div className="up-form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  placeholder="e.g. Quality Assurance"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="up-btn up-btn-primary" disabled={savingProfile}>
                <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="up-card">
        <div className="up-card-header">
          <Lock size={17} />
          <h3>Change Password</h3>
        </div>
        <div className="up-card-body">
          {passMsg && <div className={`up-alert ${passMsg.type}`}>{passMsg.text}</div>}
          <form onSubmit={handlePasswordSave} className="up-form">
            <div className="up-form-row">
              <div className="up-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwords.new_pass}
                  onChange={(e) => setPasswords({ ...passwords, new_pass: e.target.value })}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              <div className="up-form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="up-btn up-btn-primary" disabled={savingPass}>
                <Lock size={15} /> {savingPass ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
