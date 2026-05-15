import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Award, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/api/v1/dashboard/user-stats/${user.id}`);
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetch();
  }, [user]);

  if (loading) return <div className="up-loading">Loading your dashboard...</div>;

  return (
    <div>
      <div className="up-page-header">
        <h1>Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
        <p>Here's a summary of your learning progress</p>
      </div>

      <div className="up-stats-grid">
        <div className="up-stat-card">
          <div className="up-stat-icon blue"><BookOpen size={20} /></div>
          <div>
            <div className="up-stat-value">{stats?.total_enrolled ?? 0}</div>
            <div className="up-stat-label">Enrolled Trainings</div>
          </div>
        </div>
        <div className="up-stat-card">
          <div className="up-stat-icon green"><CheckCircle size={20} /></div>
          <div>
            <div className="up-stat-value">{stats?.completed ?? 0}</div>
            <div className="up-stat-label">Completed</div>
          </div>
        </div>
        <div className="up-stat-card">
          <div className="up-stat-icon amber"><Award size={20} /></div>
          <div>
            <div className="up-stat-value">{stats?.certificates ?? 0}</div>
            <div className="up-stat-label">Certificates Earned</div>
          </div>
        </div>
        <div className="up-stat-card">
          <div className="up-stat-icon purple"><TrendingUp size={20} /></div>
          <div>
            <div className="up-stat-value">{stats?.avg_score ?? 0}%</div>
            <div className="up-stat-label">Avg. Quiz Score</div>
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="up-card">
        <div className="up-card-header">
          <h3>Overall Completion</h3>
          <span style={{ fontWeight: 700, color: '#2563eb' }}>{stats?.completion_rate ?? 0}%</span>
        </div>
        <div className="up-card-body">
          <div className="up-progress-bar" style={{ height: '10px', marginBottom: '8px' }}>
            <div className="up-progress-fill" style={{ width: `${stats?.completion_rate ?? 0}%` }} />
          </div>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            {stats?.completed} of {stats?.total_enrolled} trainings completed
          </p>
        </div>
      </div>

      {/* Recent trainings */}
      <div className="up-card">
        <div className="up-card-header">
          <h3>Recent Trainings</h3>
        </div>
        <div className="up-card-body">
          {!stats?.recent_courses?.length ? (
            <div className="up-empty">
              <FileText size={36} />
              <h3>No trainings yet</h3>
              <p>Go to My Trainings to enroll in courses</p>
            </div>
          ) : (
            <div className="up-training-list">
              {stats.recent_courses.map((c, i) => (
                <div key={i} className="up-training-item">
                  <div className="up-training-icon"><FileText size={18} /></div>
                  <div className="up-training-info">
                    <div className="up-training-title">{c.title}</div>
                    <div className="up-training-meta">{c.department || 'General'}</div>
                  </div>
                  <span className={`up-badge ${c.status === 'completed' ? 'completed' : 'enrolled'}`}>
                    {c.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
