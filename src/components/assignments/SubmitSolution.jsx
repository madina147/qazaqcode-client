import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getAssignment, submitSolution, getMySubmission } from '../../services/api';
import SolutionPreview from './SolutionPreview';
import './AssignmentModules.scss';

const SubmitSolution = () => {
  const { groupId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [formData, setFormData] = useState({
    solution: '',
    attachments: []
  });
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get assignment details
        try {
          const assignmentResponse = await getAssignment(assignmentId, groupId);
          setAssignment(assignmentResponse.data);
        } catch (err) {
          console.error('Error fetching assignment:', err);
          // Try alternative method if available
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setError('Тапсырманы жүктеу кезінде қате пайда болды. Қайта байланысу...');
            return; // This will trigger the useEffect again due to retryCount change
          } else {
            throw new Error('Тапсырманы жүктеу мүмкін болмады');
          }
        }
        
        // Check if user already has a submission
        try {
          const submissionResponse = await getMySubmission(assignmentId, groupId);
          setExistingSubmission(submissionResponse.data);
          
          // Pre-fill form with existing solution
          setFormData(prev => ({
            ...prev,
            solution: submissionResponse.data.solution || ''
          }));
        } catch (err) {
          // No submission yet, which is fine
          if (err.response?.status !== 404) {
            console.error('Error fetching submission:', err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Тапсырманы жүктеу кезінде қате пайда болды');
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, retryCount]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      attachments: newAttachments
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.solution.trim() && formData.attachments.length === 0) {
      setError('Шешімді енгізіңіз немесе файл жүктеңіз');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Attempt to submit solution with retries
      let retryAttempt = 0;
      let success = false;

      while (retryAttempt < 3 && !success) {
        try {
          await submitSolution(assignmentId, formData, groupId);
          success = true;
        } catch (err) {
          console.error(`Submission attempt ${retryAttempt + 1} failed:`, err);
          retryAttempt++;
          
          if (retryAttempt < 3) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryAttempt)));
          } else {
            throw err; // Re-throw after all retries fail
          }
        }
      }
      
      // If successful, redirect to assignment page
      if (success) {
        navigate(`/groups/${groupId}/assignments/${assignmentId}`);
      }
    } catch (err) {
      console.error('Error submitting solution after retries:', err);
      
      // Provide more detailed error message based on the type of error
      if (err.response) {
        // Server responded with an error
        setError(err.response.data?.message || 
                `Сервер қатесі: ${err.response.status} - Шешімді жіберу кезінде қате пайда болды`);
      } else if (err.request) {
        // No response received
        setError('Серверге байланысу мүмкін болмады. Интернет байланысын тексеріңіз.');
      } else {
        // Other errors
        setError(err.message || 'Шешімді жіберу кезінде қате пайда болды');
      }
      
      setSubmitting(false);
    }
  };

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

  if (loading) {
    return <div className="qazaq-assignments loading">Жүктелуде...</div>;
  }

  if (error && !assignment) {
    return <div className="qazaq-assignments error-message">{error}</div>;
  }

  if (!assignment) {
    return <div className="qazaq-assignments error-message">Тапсырма табылмады</div>;
  }

  // Check if deadline has passed
  const isDeadlinePassed = new Date(assignment.deadline) < new Date();

  return (
    <div className="qazaq-assignments">
      <div className="assignment-container solution-submit">
        <Link to={`/groups/${groupId}/assignments/${assignmentId}`} className="back-link">
          Тапсырмаға оралу
        </Link>
        
        <div className="header">
          <h1>Шешім жіберу</h1>
          <h2 className="assignment-title">{assignment.title}</h2>
        </div>
        
        <div className="deadline-info">
          <div className="deadline-date">
            <span className="label">Мерзімі:</span> {formatDate(assignment.deadline)}
          </div>
          {isDeadlinePassed && (
            <div className="deadline-warning">
              Тапсыру мерзімі өтіп кетті, бірақ шешім жіберуге болады
            </div>
          )}
        </div>
        
        {existingSubmission && (
          <div className="existing-submission">
            <p>Сіз бұл тапсырманы {formatDate(existingSubmission.submittedAt)} кезінде тапсырдыңыз.</p>
            <p>Жаңа шешімді жіберсеңіз, алдыңғы шешім ауыстырылады.</p>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="solution-form">
          <div className="form-group">
            <label htmlFor="solution">Шешіміңіз</label>
            <div className="markdown-guide">
              <h4>Код форматтау көмекші:</h4>
              <p style={{color: 'black'}}>Кодты дұрыс форматтау үшін, төмендегі мысалдарды қолданыңыз:</p>
              <div className="code-guide">
                <h5>Python кодын форматтау:</h5>
                <pre>```python<br/>def hello_world():<br/>    print("Hello, world!")<br/>    return True<br/>```</pre>
                
                {/* <h5>JavaScript кодын форматтау:</h5>
                <pre>```javascript<br/>function helloWorld() {"{"}
    console.log("Hello, world!");
    return true;
{"}"}<br/>```</pre> */}
                
                <h5>Басқа форматтау опциялары:</h5>
                <ul>
                  <li><strong>Жирный текст</strong>: **жирный текст**</li>
                  <li><em>Курсив</em>: *курсив*</li>
                  <li>Тізім: - элемент 1, - элемент 2</li>
                </ul>
              </div>
            </div>
            <textarea
              id="solution"
              name="solution"
              value={formData.solution}
              onChange={handleChange}
              placeholder="Шешіміңізді енгізіңіз. Код блоктарын форматтау үшін ```python  ``` тегін қолданыңыз."
              rows={15}
              className="solution-textarea"
            />
          </div>
          
          <SolutionPreview solution={formData.solution} />
          
          <div className="form-group">
            <label htmlFor="attachments">Файлдар жүктеу</label>
            <div className="file-input-container">
              <input
                type="file"
                id="attachments"
                onChange={handleFileChange}
                multiple
                className="file-input"
              />
              
              {formData.attachments.length > 0 && (
                <div className="selected-files">
                  <h4>Таңдалған файлдар:</h4>
                  <ul className="file-list">
                    {formData.attachments.map((file, idx) => (
                      <li key={idx} className="file-item">
                        {file.name}
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="remove-button"
                        >
                          ✖
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/groups/${groupId}/assignments/${assignmentId}`)}
              className="btn-secondary"
              disabled={submitting}
            >
              Бас тарту
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Жіберілуде...' : 'Шешімді жіберу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitSolution; 