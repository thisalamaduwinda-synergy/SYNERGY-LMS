import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, TrendingUp, Award, MoreVertical } from 'lucide-react';
import StatCard from './StatCard';

const Dashboard = () => {
  // Sample data for Monthly Enrollments
  const monthlyEnrollmentData = [
    { month: 'Jan', employees: 40 },
    { month: 'Feb', employees: 50 },
    { month: 'Mar', employees: 60 },
    { month: 'Apr', employees: 55 },
    { month: 'May', employees: 70 },
    { month: 'Jun', employees: 90 },
  ];

  // Sample data for Completion Rate Trend
  const completionTrendData = [
    { month: 'Jan', rate: 75 },
    { month: 'Feb', rate: 78 },
    { month: 'Mar', rate: 80 },
    { month: 'Apr', rate: 79 },
    { month: 'May', rate: 82 },
    { month: 'Jun', rate: 85 },
  ];

  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    total_students: 1247,
    active_courses: 38,
    completion_rate: 87.5,
    passed_quizzes: 892
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/dashboard/stats`);
      setStats({
        total_students: response.data.total_students,
        active_courses: response.data.active_courses,
        completion_rate: response.data.completion_rate,
        passed_quizzes: response.data.passed_quizzes
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPopularCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/dashboard/popular-courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching popular courses:', error);
      // Fallback to sample data if API fails
      setCourses([
        {
          id: 1,
          title: 'Pharmaceutical Quality Control',
          employees: 156,
          completion: 87,
          status: 'Active',
        },
        {
          id: 2,
          title: 'Clinical Research Fundamentals',
          employees: 203,
          completion: 92,
          status: 'Active',
        },
        {
          id: 3,
          title: 'Drug Development Process',
          employees: 178,
          completion: 79,
          status: 'Active',
        },
        {
          id: 4,
          title: 'Regulatory Compliance',
          employees: 134,
          completion: 95,
          status: 'Active',
        },
        {
          id: 5,
          title: 'Medical Terminology',
          employees: 245,
          completion: 88,
          status: 'Active',
        },
      ]);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPopularCourses();
    const interval = setInterval(() => {
      fetchStats();
      fetchPopularCourses();
    }, 10000); // Poll every 10 seconds
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
