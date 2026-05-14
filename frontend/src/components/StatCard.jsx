import React from 'react';

const StatCard = ({ title, value, change, changeType = 'positive', icon: Icon }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className="stat-card-icon">
          <Icon size={22} />
        </div>
      </div>
      <div className="stat-card-value">{value.toLocaleString()}</div>
      <div className={`stat-card-change ${changeType === 'positive' ? '' : 'negative'}`}>
        {change}
      </div>
    </div>
  );
};

export default StatCard;
