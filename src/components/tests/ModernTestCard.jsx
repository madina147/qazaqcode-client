import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaRegClock, FaEdit, FaTrashAlt, FaChartBar, FaPlay, FaEye, FaQuestion, FaCalendarAlt, FaTrophy, FaCheckCircle, FaExclamationCircle, FaHourglassHalf, FaRedo } from 'react-icons/fa';
import { deleteTest } from '../../services/api';
import './ModernTestCard.scss';

const ModernTestCard = ({ test, groupId, isTeacher, onDelete, testResults }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Деректерді тексеру үшін жөндеу логы
  useEffect(() => {
    console.log('Test results:', testResults?.studentResult);
  }, [ testResults]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Мерзім көрсетілмеген';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isTestAvailable = () => {
    if (!test.deadline) return true;
    const now = new Date();
    const deadline = new Date(test.deadline);
    return now <= deadline;
  };

  const getTimeLeftString = () => {
    if (!test.deadline) return 'Мерзімсіз';
    
    const now = new Date();
    const deadline = new Date(test.deadline);
    
    if (now > deadline) {
      return 'Мерзімі өтті';
    }
    
    const diffTime = Math.abs(deadline - now);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeLeftString = '';
    if (diffDays > 0) {
      timeLeftString += `${diffDays} ${diffDays === 1 ? 'күн' : 'күн'}`;
    }
    if (diffHours > 0) {
      timeLeftString += `${timeLeftString ? ' ' : ''}${diffHours} сағат`;
    }
    if (diffDays === 0 && diffHours === 0 && diffMinutes > 0) {
      timeLeftString += `${diffMinutes} минут`;
    }
    if (!timeLeftString) {
      timeLeftString = 'бір минуттан аз';
    }
    
    return timeLeftString;
  };

  // testResults деректері негізінде пайдаланушы тестті өткенін тексереміз
  const isTestCompleted = () => {
    if (test.isCompleted) return true; // Егер бар болса, бар қасиетті пайдаланамыз
    
    if (testResults) {
      // Ағымдағы пайдаланушы үшін нәтижелер бар-жоғын тексереміз
      return !!testResults?.studentResult?.userResult || !!testResults?.studentResult?.score || !!testResults?.studentResult?.percentage;
    }
    
    return false;
  };
  console.log("estResults?.studentResult?.score", testResults?.studentResult?.score)
  // testResults-тен тест нәтижелерін аламыз
  const getTestScore = () => {
  
    if (testResults) {
      if (testResults?.studentResult?.userResult) return testResults?.studentResult?.score;
      if (testResults?.studentResult?.score) return testResults?.studentResult?.score;
    }
    
    return 0;
  };

  const getStatusClass = () => {
    if (isTestCompleted()) {
      return 'status-completed';
    }
    return isTestAvailable() ? 'status-available' : 'status-expired';
  };

  const getStatusText = () => {
    if (isTestCompleted()) {
      return 'Тест өтілді';
    }
    return isTestAvailable() ? 'Қолжетімді' : 'Мерзімі өтті';
  };
  
  const getStatusIcon = () => {
    if (isTestCompleted()) {
      return <FaCheckCircle className="status-icon" />;
    }
    return isTestAvailable() 
      ? <FaHourglassHalf className="status-icon" /> 
      : <FaExclamationCircle className="status-icon" />;
  };

  const handleDelete = async () => {
    if (window.confirm('Бұл тестті жоюға сенімдісіз бе?')) {
      try {
        setIsDeleting(true);
        setDeleteError(null);
        await deleteTest(groupId, test._id);
        if (onDelete) {
          onDelete(test._id);
        }
      } catch (error) {
        setDeleteError('Тестті жою мүмкін болмады. Қайталап көріңіз.');
        console.error('Тестті жою кезінде қате:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // undefined көрсетпеу үшін мәндерді тексерумен аламыз
  const duration = test.duration || test.timeLimit || 0;
  const questionsCount = test.questionsCount || test.questionCount || (test.questions ? test.questions.length : 0);
  const totalPoints = testResults?.studentResult?.totalPoints || test.maxPoints || 0;
  const score = getTestScore();
  const completed = isTestCompleted();

  return (
    <div 
      className={`test-card modern-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-content">
        <div className={`test-status ${getStatusClass()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        
        {deleteError && (
          <div className="delete-error">
            <FaExclamationCircle className="error-icon" />
            {deleteError}
          </div>
        )}
        
        <div className="test-header">
          <h3 className="test-name">{test.name || test.title}</h3>
          {test.description && (
            <div className="test-description">
              <p>{test.description}</p>
            </div>
          )}
        </div>
        
        <div className="test-meta">
          <div className="meta-item">
            <FaRegClock className="meta-icon" />
            <span className="meta-value">{duration} мин</span>
          </div>
          <div className="meta-item">
            <FaQuestion className="meta-icon" />
            <span className="meta-value">{questionsCount} сұрақ</span>
          </div>
          <div className="meta-item">
            <FaTrophy className="meta-icon" />
            <span className="meta-value">{totalPoints} ұпай</span>
          </div>
        </div>
        
        <div className="test-deadline">
          <div className="deadline-info">
            <FaCalendarAlt className="meta-icon" />
            <span className={`time-left ${!isTestAvailable() ? 'expired' : ''}`}>
              {getTimeLeftString()}
            </span>
          </div>
          <div className="deadline-date">
            {test.deadline ? `Дейін: ${formatDate(test.deadline)}` : 'Тапсыру мерзімі жоқ'}
          </div>
        </div>
        
        {completed && score != null && (
          <div className="test-score">
            <div className="score-label">Сіздің нәтижеңіз:</div>
            <div className="score-value">
              {score} / {totalPoints} 
              {totalPoints > 0 && (
                <span className="score-percent">
                  {Math.round((score / totalPoints) * 100)}%
                </span>
              )}
            </div>
            <div className="score-bar">
              <div 
                className="score-progress" 
                style={{
                  width: `${totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0}%`,
                  backgroundColor: score / totalPoints >= 0.7 
                    ? '#38a169' 
                    : score / totalPoints >= 0.4 
                      ? '#dd6b20' 
                      : '#e53e3e'
                }}
              />
            </div>
          </div>
        )}
        
        <div className="test-actions">
          {isTeacher ? (
            <div className="teacher-actions">
              <Link to={`/groups/${groupId}/tests/${test._id}/edit`} className="action-button secondary">
                <FaEdit className="icon" /> <span className="btn-text">Өңдеу</span>
              </Link>
              <Link to={`/groups/${groupId}/tests/${test._id}/results`} className="action-button secondary">
                <FaChartBar className="icon" /> <span className="btn-text">Нәтиже</span>
              </Link>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting} 
                className="action-button danger"
              >
                <FaTrashAlt className="icon" /> <span className="btn-text">{isDeleting ? 'Жою...' : 'Жою'}</span>
              </button>
            </div>
          ) : (
            <div className="student-actions">
              {completed ? (
                <div className="student-actions-row">
                  <Link to={`/groups/${groupId}/tests/${test._id}/result`} className="action-button secondary">
                    <FaEye className="icon" /> <span className="btn-text">Менің нәтижем</span>
                  </Link>
                  {isTestAvailable() && (
                    <Link to={`/groups/${groupId}/tests/${test._id}/take`} className="action-button primary">
                      <FaRedo className="icon" /> <span className="btn-text">Қайта өту</span>
                    </Link>
                  )}
                </div>
              ) : isTestAvailable() ? (
                <Link to={`/groups/${groupId}/tests/${test._id}/take`} className="action-button primary full-width">
                  <FaPlay className="icon" /> <span className="btn-text">Тестті бастау</span>
                </Link>
              ) : (
                <div className="expired-message">
                  <FaExclamationCircle className="icon" /> Тестті тапсыру мерзімі өтіп кетті
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernTestCard; 