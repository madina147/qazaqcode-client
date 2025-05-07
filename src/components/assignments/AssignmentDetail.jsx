import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useAuth from '../../hooks/useAuth';
import { getAssignment, getMySubmission } from '../../services/api';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import './AssignmentModules.scss';

const AssignmentDetail = () => {
  const { groupId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get assignment details
        const assignmentResponse = await getAssignment(assignmentId, groupId);
        setAssignment(assignmentResponse.data);
        
        // If user is a student, check if they have a submission
        if (user.role === 'student') {
          try {
            const submissionResponse = await getMySubmission(assignmentId, groupId);
            setSubmission(submissionResponse.data);
          } catch (err) {
            // No submission yet, which is fine
            if (err.response?.status !== 404) {
              console.error('Error fetching submission:', err);
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError('Тапсырманы жүктеу кезінде қате пайда болды');
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, groupId, user.role]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('kk-KZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDeadlineClass = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    
    if (diffTime < 0) return 'overdue';
    if (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 2) return 'approaching';
    return '';
  };

  const getStatusText = (submission) => {
    if (!submission) return null;
    
    switch (submission.status) {
      case 'submitted':
        return 'Тапсырылды, бағаланбаған';
      case 'ai_evaluated':
        return `ИИ бағасы: ${submission.aiEvaluation.score}/100`;
      case 'teacher_evaluated':
        return `Бағаланды: ${submission.teacherEvaluation.score}/100`;
      case 'pending_teacher_review':
        return 'Оқытушының тексеруін күтуде';
      default:
        return 'Белгісіз күй';
    }
  };

  const getStatusBadgeClass = (status) => {
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
      <div className="assignment-container assignment-detail">
        <Link to={`/groups/${groupId}/assignments`} className="back-link">
          Тапсырмалар тізіміне оралу
        </Link>
        
        <div className="header">
          <h1>{assignment.title}</h1>
        </div>
        
        <div className="meta-info">
          <div className="meta-item">
            <div className={`status-badge ${getDeadlineClass(assignment.deadline)}`}>
              <span className="label">Мерзімі:</span> {formatDate(assignment.deadline)}
            </div>
          </div>
          
          {user.role === 'student' && submission && (
            <div className="meta-item">
              <div className={`status-badge ${getStatusBadgeClass(submission.status)}`}>
                {getStatusText(submission)}
              </div>
            </div>
          )}
        </div>
        
        <div className="description-section">
          <h2>Тапсырма сипаттамасы</h2>
          <MarkdownRenderer content={assignment.description} />
        </div>
        
        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="attachments-section">
            <h3>Қосымша файлдар</h3>
            <ul className="attachment-list">
              {assignment.attachments.map((attachment, idx) => (
                <li key={idx} className="attachment-item">
                  <a 
                    href={`${API_URL}/uploads/${attachment.filename}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="attachment-link"
                  >
                    {attachment.originalname}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {user.role === 'student' && (
          <div className="action-container">
            {submission ? (
              <>
                <div className="submission-section">
                  <h2>Сіздің шешіміңіз</h2>
                  <div className="solution-content">
                    <MarkdownRenderer content={submission.solution} />
                  </div>
                  
                  {submission.attachments && submission.attachments.length > 0 && (
                    <div className="attachments-section">
                      <h3>Жіберілген файлдар</h3>
                      <ul className="attachment-list">
                        {submission.attachments.map((file, idx) => (
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
                  
                  {submission.aiEvaluation && (
                    <div className={`evaluation-section ai-evaluation ${submission.status === 'pending_teacher_review' ? 'pending' : ''}`}>
                      <h3>ИИ бағалауы</h3>
                      <div className="score">Баға: {submission.aiEvaluation.score}/100</div>
                      <div className="feedback">
                        <MarkdownRenderer content={submission.aiEvaluation.feedback} />
                      </div>
                    </div>
                  )}
                  
                  {submission.teacherEvaluation && (
                    <div className="evaluation-section teacher-evaluation">
                      <h3>Мұғалім бағалауы</h3>
                      <div className="score">Баға: {submission.teacherEvaluation.score}/100</div>
                      <div className="feedback">
                        <MarkdownRenderer content={submission.teacherEvaluation.feedback || 'Пікір жоқ'} />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="action-buttons">
                  <button 
                    className="btn-primary"
                    onClick={() => navigate(`/groups/${groupId}/assignments/${assignmentId}/submit`)}
                  >
                    Шешімді қайта жіберу
                  </button>
                </div>
              </>
            ) : (
              <div className="action-buttons">
                <button 
                  className="btn-primary"
                  onClick={() => navigate(`/groups/${groupId}/assignments/${assignmentId}/submit`)}
                >
                  Шешім жіберу
                </button>
              </div>
            )}
          </div>
        )}
        
        {user.role === 'teacher' && (
          <div className="action-buttons">
            <Link 
              to={`/groups/${groupId}/assignments/${assignmentId}/edit`} 
              className="btn-secondary"
            >
              Тапсырманы өңдеу
            </Link>
            <Link 
              to={`/groups/${groupId}/assignments/${assignmentId}/submissions`} 
              className="btn-primary"
            >
              Барлық шешімдерді көру
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetail; 