import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Check, Clock, AlertTriangle } from 'react-feather';
import './TestStyles.scss';

const TestCard = ({ test }) => {
  // Format the date
  const formattedDate = test.createdAt 
    ? format(new Date(test.createdAt), 'dd.MM.yyyy')
    : 'Күні көрсетілмеген';

  // Determine test status
  const getStatusInfo = () => {
    if (test.completed) {
      return {
        label: 'Аяқталған',
        icon: <Check size={16} />,
        className: 'status-completed'
      };
    } else if (test.started) {
      return {
        label: 'Басталған',
        icon: <Clock size={16} />,
        className: 'status-started'
      };
    } else {
      return {
        label: 'Жаңа',
        icon: <AlertTriangle size={16} />,
        className: 'status-new'
      };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="modern-test-card">
      <div className="test-header">
        <h3 className="test-title">{test.title}</h3>
        <span className={`test-status ${status.className}`}>
          {status.icon}
          <span>{status.label}</span>
        </span>
      </div>
      
      <div className="test-content">
        <div className="test-info">
          <div className="info-item">
            <span className="info-label">Сұрақтар:</span>
            <span className="info-value">{test.questionCount || 0}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Күні:</span>
            <span className="info-value">{formattedDate}</span>
          </div>
          {test.score !== undefined && (
            <div className="info-item">
              <span className="info-label">Нәтиже:</span>
              <span className="info-value score">{test.score}%</span>
            </div>
          )}
        </div>
        
        <p className="test-description">
          {test.description || 'Сипаттама жоқ'}
        </p>
      </div>
      
      <div className="test-actions">
        <Link 
          to={`/tests/${test._id}`} 
          className="btn btn-primary"
        >
          {test.completed ? 'Нәтижесін көру' : (test.started ? 'Жалғастыру' : 'Бастау')}
        </Link>
      </div>
    </div>
  );
};

export default TestCard; 