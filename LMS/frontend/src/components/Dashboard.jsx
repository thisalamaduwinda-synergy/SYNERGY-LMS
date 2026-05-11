import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, TrendingUp, Award, MoreVertical } from 'lucide-react';
import StatCard from './StatCard';

const Dashboard = () => {
  // Sample data for Monthly Enrollments
  const monthlyEnrollmentData = [
    { month: 'Jan', students: 40 },
    { month: 'Feb', students: 50 },
    { month: 'Mar', students: 60 },
    { month: 'Apr', students: 55 },
    { month: 'May', students: 70 },
    { month: 'Jun', students: 90 },
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

  // Sample courses data
  const courses = [
    {
      id: 1,
      title: 'Pharmaceutical Quality Control',
      students: 156,
      completion: 87,
      status: 'Active',
    },
    {
      id: 2,
      title: 'Clinical Research Fundamentals',
      students: 203,
      completion: 92,
      status: 'Active',
    },
    {
      id: 3,
      title: 'Drug Development Process',
      students: 178,
      completion: 79,
      status: 'Active',
    },
    {
      id: 4,
      title: 'Regulatory Compliance',
      students: 134,
      completion: 95,
      status: 'Active',
    },
    {
      id: 5,
      title: 'Medical Terminology',
      students: 245,
      completion: 88,
      status: 'Active',
    },
  ];

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <p className="dashboard-subtitle">Welcome back, here's what's happening with your learning platform</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Students"
          value={1247}
          change="+12% from last month"
          icon={Users}
        />
        <StatCard
          title="Active Courses"
          value={38}
          change="+3 new courses"
          icon={BookOpen}
        />
        <StatCard
          title="Completion Rate"
          value={87.5}
          change="+5.2% from last month"
          icon={TrendingUp}
        />
        <StatCard
          title="Certifications"
          value={892}
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
              <Bar dataKey="students" fill="#3b82f6" radius={[8, 8, 0, 0]} />
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
        <h3 className="section-title">Popular Courses</h3>
        <table className="courses-table">
          <thead>
            <tr>
              <th>Course Title</th>
              <th>Students</th>
              <th>Completion</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="course-title">{course.title}</td>
                <td>{course.students}</td>
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
