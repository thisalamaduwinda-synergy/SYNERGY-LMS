import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, TrendingUp, Award, MoreVertical } from 'lucide-react';
import StatCard from './StatCard';
import api from '../services/api';

const Dashboard = () => {
  const [monthlyEnrollmentData, setMonthlyEnrollmentData] = useState([]);
  const [completionTrendData, setCompletionTrendData] = useState([]);

  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    total_students: 0,
    active_courses: 0,
    completion_rate: 0,
    passed_quizzes: 0
  });

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/v1/dashboard/stats');
      setStats({
        total_students: response.data.total_students,
        active_courses: response.data.active_courses,
        completion_rate: response.data.completion_rate,
        passed_quizzes: response.data.passed_quizzes,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPopularCourses = async () => {
    try {
      const response = await api.get('/api/v1/dashboard/popular-courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching popular courses:', error);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const response = await api.get('/api/v1/dashboard/monthly-enrollments');
      setMonthlyEnrollmentData(response.data.map((d) => ({ month: d.month, employees: d.students })));
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPopularCourses();
    fetchMonthlyData();
    const interval = setInterval(() => {
      fetchStats();
      fetchPopularCourses();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <p className="dashboard-subtitle">Welcome back, here's what's happening with your learning platform</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Employees"
          value={stats.total_students}
          change="+12% from last month"
          icon={Users}
        />
        <StatCard
          title="Active SOP Trainings"
          value={stats.active_courses}
          change="+3 new trainings"
          icon={BookOpen}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completion_rate}%`}
          change="+5.2% from last month"
          icon={TrendingUp}
        />
        <StatCard
          title="Qualified Personnel"
          value={stats.passed_quizzes}
          change="+18% from last month"
          icon={Award}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3 className="chart-title">Monthly Enrollments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyEnrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="employees" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Completion Rate Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Courses Table */}
      <div className="courses-section">
        <h3 className="section-title">Popular SOP Trainings</h3>
        <table className="courses-table">
          <thead>
            <tr>
              <th>Training Title</th>
              <th>Employees</th>
              <th>Completion</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="course-title">{course.title}</td>
                <td>{course.employees}</td>
                <td>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${course.completion}%` }}
                    ></div>
                  </div>
                  <span className="completion-text">{course.completion}%</span>
                </td>
                <td>
                  <span className={`status-badge status-${course.status.toLowerCase()}`}>
                    {course.status}
                  </span>
                </td>
                <td>
                  <button className="menu-btn">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
