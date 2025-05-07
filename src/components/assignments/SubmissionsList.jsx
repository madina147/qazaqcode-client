import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useAuth from '../../hooks/useAuth';
import { getAssignment, getAssignmentSubmissions, evaluateSubmission } from '../../services/api';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import './AssignmentModules.scss';

const SubmissionsList = () => {
  const { groupId, assignmentId } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [evaluation, setEvaluation] = useState({ score: 80, feedback: '' });
  const [evaluating, setEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState('solution'); // 'solution', 'ai', 'teacher'
  const [useAIScore, setUseAIScore] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://34.34.73.209';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get assignment details
        const assignmentResponse = await getAssignment(assignmentId);
        setAssignment(assignmentResponse.data);
        
        // Get submissions
        const submissionsResponse = await getAssignmentSubmissions(assignmentId);
        setSubmissions(submissionsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Деректерді жүктеу кезінде қате пайда болды');
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('kk-KZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusText = (submission) => {
    switch (submission.status) {
      case 'submitted':
        return 'Тапсырылды';
      case 'ai_evaluated':
        return 'ИИ бағаланған';
      case 'teacher_evaluated':
        return 'Мұғалім бағаланған';
      case 'pending_teacher_review':
        return 'Тексеруді күтуде';
      default:
        return 'Белгісіз';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'submitted':
        return 'submitted';
      case 'ai_evaluated':
        return 'ai-evaluated';
      case 'teacher_evaluated':
        return 'teacher-evaluated';
      case 'pending_teacher_review':
        return 'pending-review';
      default:
        return '';
    }
  };

  const handleSubmissionSelect = (submission) => {
    setSelectedSubmission(submission);
    setActiveTab('solution');
    
    // Pre-fill evaluation form with AI evaluation or default values
    if (submission.aiEvaluation && submission.aiEvaluation.score) {
      setEvaluation({
        score: submission.aiEvaluation.score,
        feedback: submission.aiEvaluation.feedback || ''
      });
      setUseAIScore(true);
    } else {
      setEvaluation({ score: 80, feedback: '' });
      setUseAIScore(false);
    }
  };

  const handleEvaluationChange = (e) => {
    const { name, value } = e.target;
    setEvaluation(prev => ({
      ...prev,
      [name]: name === 'score' ? parseInt(value, 10) : value
    }));
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;
    
    try {
      setEvaluating(true);
      
      const response = await evaluateSubmission(selectedSubmission._id, evaluation);
      
      // Update the submissions list with the new evaluation
      setSubmissions(prev => 
        prev.map(sub => 
          sub._id === selectedSubmission._id ? response.data : sub
        )
      );
      
      // Update the selected submission
      setSelectedSubmission(response.data);
      setEvaluating(false);
      
      // Set active tab to teacher evaluation after successful submission
      setActiveTab('teacher');
    } catch (err) {
      console.error('Error evaluating submission:', err);
      setError('Бағалау кезінде қате пайда болды');
      setEvaluating(false);
    }
  };

  const handleAIScoreToggle = () => {
    if (useAIScore && selectedSubmission?.aiEvaluation) {
      setEvaluation(prev => ({
        ...prev,
        score: selectedSubmission.aiEvaluation.score
      }));
    }
    setUseAIScore(!useAIScore);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getScoreColorClass = (score) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-low';
  };

  if (loading) {
    return <div className="qazaq-assignments loading">Жүктелуде...</div>;
  }

  if (error) {
    return <div className="qazaq-assignments error-message">{error}</div>;
  }

  if (!assignment) {
    return <div className="qazaq-assignments error-message">Тапсырма табылмады</div>;
  }

  return (
    <div className="qazaq-assignments">
      <div className="assignment-container submissions-list">
        <Link to={`/groups/${groupId}/assignments/${assignmentId}`} className="back-link">
          Тапсырмаға оралу
        </Link>
        
        <div className="header">
          <h1>Студенттер шешімдері</h1>
          <h2 className="assignment-title">{assignment.title}</h2>
        </div>
        
        {submissions.length === 0 ? (
          <div className="no-submissions">
            <p>Бұл тапсырма бойынша әлі шешімдер жоқ</p>
          </div>
        ) : (
          <div className="content-grid">
            <div className="table-section">
              <h3>Шешімдер тізімі</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Оқушы</th>
                      <th>Тапсыру уақыты</th>
                      <th>Күйі</th>
                      <th>ИИ бағасы</th>
                      <th>Мұғалім бағасы</th>
                      <th>Әрекеттер</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(submission => (
                      <tr 
                        key={submission._id}
                        className={submission._id === selectedSubmission?._id ? 'selected' : ''}
                        onClick={() => handleSubmissionSelect(submission)}
                      >
                        <td className="student-name-cell">
                          <div className="student-name">
                            {submission.student.lastName} {submission.student.firstName}
                          </div>
                          <div className="student-grade">
                            {submission.student.grade}{submission.student.gradeLetter} сынып
                          </div>
                        </td>
                        <td>{formatDate(submission.submittedAt)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(submission.status)}`}>
                            {getStatusText(submission)}
                          </span>
                        </td>
                        <td className="score-cell">
                          {submission.aiEvaluation ? (
                            <span className={`score ${getScoreColorClass(submission.aiEvaluation.score)}`}>
                              {submission.aiEvaluation.score}/100
                            </span>
                          ) : (
                            <span className="score-na">Жоқ</span>
                          )}
                        </td>
                        <td className="score-cell">
                          {submission.teacherEvaluation ? (
                            <span className={`score ${getScoreColorClass(submission.teacherEvaluation.score)}`}>
                              {submission.teacherEvaluation.score}/100
                            </span>
                          ) : (
                            <span className="score-na">Тексерілмеген</span>
                          )}
                        </td>
                        <td>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmissionSelect(submission);
                            }}
                            className="btn-view"
                          >
                            Қарау
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {selectedSubmission ? (
              <div className="detail-section">
                <div className="detail-tabs">
                  <button 
                    className={`tab-button ${activeTab === 'solution' ? 'active' : ''}`}
                    onClick={() => handleTabChange('solution')}
                  >
                    Шешім
                  </button>
                  
                  {selectedSubmission.aiEvaluation && (
                    <button 
                      className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
                      onClick={() => handleTabChange('ai')}
                    >
                      ИИ бағалауы
                    </button>
                  )}
                  
                  {selectedSubmission.teacherEvaluation && (
                    <button 
                      className={`tab-button ${activeTab === 'teacher' ? 'active' : ''}`}
                      onClick={() => handleTabChange('teacher')}
                    >
                      Мұғалім бағалауы
                    </button>
                  )}
                  
                  {!selectedSubmission.teacherEvaluation && (
                    <button 
                      className={`tab-button ${activeTab === 'evaluate' ? 'active' : ''}`}
                      onClick={() => handleTabChange('evaluate')}
                    >
                      Бағалау
                    </button>
                  )}
                </div>
                
                <div className="student-meta">
                  <div className="student-info">
                    <span className="label">Оқушы:</span>
                    <span className="student-name">{selectedSubmission.student.lastName} {selectedSubmission.student.firstName}</span>
                    <span className="student-grade">{selectedSubmission.student.grade}{selectedSubmission.student.gradeLetter} сынып</span>
                  </div>
                  <div className="submission-time">
                    <span className="label">Тапсыру уақыты:</span>
                    {formatDate(selectedSubmission.submittedAt)}
                  </div>
                </div>
                
                {activeTab === 'solution' && (
                  <div className="solution-container">
                    <h4>Оқушы шешімі:</h4>
                    <div className="solution-display">
                      <MarkdownRenderer content={selectedSubmission.solution} />
                    </div>
                    
                    {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                      <div className="attachments-section">
                        <h4>Жүктелген файлдар:</h4>
                        <ul className="attachment-list">
                          {selectedSubmission.attachments.map((file, idx) => (
                            <li key={idx} className="attachment-item">
                              <a 
                                href={`${API_URL}/uploads/${file.filename}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="attachment-link"
                              >
                                {file.originalname}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="evaluation-summary">
                      <div className="evaluation-status">
                        <div className="status-title">Статус:</div>
                        <div className={`status-value ${getStatusClass(selectedSubmission.status)}`}>
                          {getStatusText(selectedSubmission)}
                        </div>
                      </div>
                      
                      {selectedSubmission.aiEvaluation && (
                        <div className="score-display ai-score">
                          <div className="score-title">ИИ бағасы:</div>
                          <div className={`score-value ${getScoreColorClass(selectedSubmission.aiEvaluation.score)}`}>
                            {selectedSubmission.aiEvaluation.score}/100
                          </div>
                        </div>
                      )}
                      
                      {selectedSubmission.teacherEvaluation && (
                        <div className="score-display teacher-score">
                          <div className="score-title">Мұғалім бағасы:</div>
                          <div className={`score-value ${getScoreColorClass(selectedSubmission.teacherEvaluation.score)}`}>
                            {selectedSubmission.teacherEvaluation.score}/100
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTab === 'ai' && selectedSubmission.aiEvaluation && (
                  <div className="evaluation-container ai-evaluation-tab">
                    <div className="evaluation-header">
                      <h4>Жасанды интеллект бағалауы</h4>
                      <div className={`score ${getScoreColorClass(selectedSubmission.aiEvaluation.score)}`}>
                        <span className="score-label">Баға:</span>
                        <span className="score-value">{selectedSubmission.aiEvaluation.score}/100</span>
                      </div>
                    </div>
                    
                    <div className="evaluation-feedback">
                      <h5>ИИ пікірі:</h5>
                      <div className="feedback-content">
                        <MarkdownRenderer content={selectedSubmission.aiEvaluation.feedback} />
                      </div>
                    </div>
                    
                    {!selectedSubmission.teacherEvaluation && (
                      <div className="teacher-actions">
                        <button 
                          className="btn-primary"
                          onClick={() => {
                            handleTabChange('evaluate');
                          }}
                        >
                          Мұғалім бағасын қосу
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'teacher' && selectedSubmission.teacherEvaluation && (
                  <div className="evaluation-container teacher-evaluation-tab">
                    <div className="evaluation-header">
                      <h4>Мұғалім бағалауы</h4>
                      <div className={`score ${getScoreColorClass(selectedSubmission.teacherEvaluation.score)}`}>
                        <span className="score-label">Баға:</span>
                        <span className="score-value">{selectedSubmission.teacherEvaluation.score}/100</span>
                      </div>
                    </div>
                    
                    <div className="evaluation-feedback">
                      <h5>Мұғалім пікірі:</h5>
                      <div className="feedback-content">
                        <MarkdownRenderer content={selectedSubmission.teacherEvaluation.feedback || 'Пікір қалдырылмаған'} />
                      </div>
                    </div>
                    
                    {selectedSubmission.aiEvaluation && (
                      <div className="ai-comparison">
                        <div className="comparison-header">
                          <h5>ИИ бағасымен салыстыру:</h5>
                          <div className="comparison-score">
                            <span className="ai-score-value">ИИ: {selectedSubmission.aiEvaluation.score}/100</span>
                            <span className="difference">
                              {selectedSubmission.teacherEvaluation.score > selectedSubmission.aiEvaluation.score 
                                ? `+${selectedSubmission.teacherEvaluation.score - selectedSubmission.aiEvaluation.score}` 
                                : selectedSubmission.teacherEvaluation.score < selectedSubmission.aiEvaluation.score 
                                  ? `-${selectedSubmission.aiEvaluation.score - selectedSubmission.teacherEvaluation.score}`
                                  : '±0'}
                            </span>
                            <span className="teacher-score-value">Мұғалім: {selectedSubmission.teacherEvaluation.score}/100</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {(activeTab === 'evaluate' && !selectedSubmission.teacherEvaluation) && (
                  <form onSubmit={handleEvaluate} className="evaluation-form">
                    <div className="form-header">
                      <h4>Мұғалім бағалауы</h4>
                      
                      {selectedSubmission.aiEvaluation && (
                        <div className="ai-score-reference">
                          <span className="reference-label">ИИ бағасы: </span>
                          <span className={`reference-value ${getScoreColorClass(selectedSubmission.aiEvaluation.score)}`}>
                            {selectedSubmission.aiEvaluation.score}/100
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {selectedSubmission.aiEvaluation && (
                      <div className="ai-score-toggle">
                        <label className="toggle-container">
                          <input
                            type="checkbox"
                            checked={useAIScore}
                            onChange={handleAIScoreToggle}
                          />
                          <span className="toggle-text">ИИ бағасын қолдану</span>
                        </label>
                      </div>
                    )}
                    
                    <div className="form-group score-input">
                      <label htmlFor="score">Баға (0-100):</label>
                      <input
                        type="number"
                        id="score"
                        name="score"
                        min="0"
                        max="100"
                        value={evaluation.score}
                        onChange={handleEvaluationChange}
                        disabled={selectedSubmission.aiEvaluation && useAIScore}
                        required
                        className={getScoreColorClass(evaluation.score)}
                      />
                      <div className="score-indicator">
                        <div className="score-visual">
                          <div 
                            className={`score-fill ${getScoreColorClass(evaluation.score)}`} 
                            style={{width: `${evaluation.score}%`}}
                          ></div>
                        </div>
                        <div className="score-label">{evaluation.score}/100</div>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="feedback">Пікір:</label>
                      {selectedSubmission.aiEvaluation && (
                        <div className="ai-feedback-reference">
                          <div className="reference-header">
                            <span className="reference-title">ИИ пікірі:</span>
                            <button 
                              type="button" 
                              className="use-ai-feedback"
                              onClick={() => {
                                setEvaluation(prev => ({
                                  ...prev,
                                  feedback: selectedSubmission.aiEvaluation.feedback || ''
                                }));
                              }}
                            >
                              ИИ пікірін қолдану
                            </button>
                          </div>
                          <div className="reference-content">
                            <MarkdownRenderer content={selectedSubmission.aiEvaluation.feedback} />
                          </div>
                        </div>
                      )}
                      <textarea
                        id="feedback"
                        name="feedback"
                        value={evaluation.feedback}
                        onChange={handleEvaluationChange}
                        placeholder="Оқушыға пікір жазыңыз (міндетті емес)"
                        rows={6}
                      />
                    </div>
                    
                    <div className="form-actions">
                      {selectedSubmission.aiEvaluation && (
                        <button 
                          type="button" 
                          className="btn-secondary"
                          onClick={() => handleTabChange('ai')}
                        >
                          ИИ бағалауына оралу
                        </button>
                      )}
                      
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={evaluating}
                      >
                        {evaluating ? 'Бағалануда...' : 'Бағалауды растау'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="detail-section">
                <div className="no-submission-selected">
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>Шешімді таңдаңыз</p>
                    <p className="empty-hint">Оқушы шешімін қарау және бағалау үшін тізімнен шешімді басыңыз</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsList; 