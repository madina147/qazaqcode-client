import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { createTest, updateTest, getTestById } from '../../services/api';
import './TestStyles.scss';

const CreateTest = () => {
  const { groupId, testId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = location.pathname.includes('/edit');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 30, // in minutes
    deadline: ''
  });
  
  // Questions
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: '',
      points: 2,
      options: [
        { id: 1, text: '', isCorrect: false },
        { id: 2, text: '', isCorrect: false }
      ]
    }
  ]);
  
  // Load test for editing
  useEffect(() => {
    if (isEditing && testId) {
      const fetchTest = async () => {
        try {
          setLoading(true);
          const response = await getTestById(groupId, testId);
          const testData = response.data;
          
          setFormData({
            title: testData.title,
            description: testData.description,
            timeLimit: testData.timeLimit,
            deadline: new Date(testData.deadline).toISOString().slice(0, 16)
          });
          
          // Convert server questions format to component format
          const formattedQuestions = testData.questions.map((q, index) => ({
            id: q._id || index + 1,
            text: q.text,
            points: q.points,
            options: q.options.map((o, optIndex) => ({
              id: o._id || optIndex + 1,
              text: o.text,
              isCorrect: o.isCorrect
            }))
          }));
          
          setQuestions(formattedQuestions);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching test data:', err);
          setError(err.response?.data?.message || 'Тестті жүктеу кезінде қате пайда болды');
          setLoading(false);
        }
      };
      
      fetchTest();
    } else {
      // Set default deadline to 7 days in the future
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 7);
      
      setFormData(prev => ({
        ...prev,
        deadline: defaultDeadline.toISOString().slice(0, 16)
      }));
    }
  }, [isEditing, testId, groupId]);
  
  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Question handlers
  const handleQuestionChange = (questionId, field, value) => {
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, [field]: value } 
          : q
      )
    );
  };
  
  const handleOptionChange = (questionId, optionId, field, value) => {
    setQuestions(prev => 
      prev.map(q => {
        if (q.id === questionId) {
          const updatedOptions = q.options.map(opt => 
            opt.id === optionId 
              ? { ...opt, [field]: field === 'isCorrect' ? true : value } 
              : field === 'isCorrect' ? { ...opt, isCorrect: false } : opt
          );
          
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    );
  };
  
  const addQuestion = () => {
    const newId = Math.max(...questions.map(q => q.id), 0) + 1;
    
    setQuestions(prev => [
      ...prev, 
      {
        id: newId,
        text: '',
        points: 1,
        options: [
          { id: 1, text: '', isCorrect: false },
          { id: 2, text: '', isCorrect: false }
        ]
      }
    ]);
  };
  
  const removeQuestion = (questionId) => {
    if (questions.length <= 1) {
      setError('Тестте кемінде бір сұрақ болуы керек');
      return;
    }
    
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    setError(null);
  };
  
  const addOption = (questionId) => {
    setQuestions(prev => 
      prev.map(q => {
        if (q.id === questionId) {
          const newId = Math.max(...q.options.map(opt => opt.id), 0) + 1;
          
          return {
            ...q,
            options: [
              ...q.options,
              { id: newId, text: '', isCorrect: false }
            ]
          };
        }
        return q;
      })
    );
  };
  
  const removeOption = (questionId, optionId) => {
    setQuestions(prev => 
      prev.map(q => {
        if (q.id === questionId) {
          if (q.options.length <= 2) {
            setError('Әр сұрақта кемінде екі нұсқа болуы керек');
            return q;
          }
          
          // Check if removing the correct answer
          const isRemovingCorrect = q.options.find(opt => opt.id === optionId)?.isCorrect;
          let updatedOptions = q.options.filter(opt => opt.id !== optionId);
          
          // If removing the correct answer, set first option as correct
          if (isRemovingCorrect && updatedOptions.length > 0) {
            updatedOptions = updatedOptions.map((opt, index) => 
              index === 0 ? { ...opt, isCorrect: true } : opt
            );
          }
          
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    );
    
    setError(null);
  };
  
  // Validate before submission
  const validateForm = () => {
    // Check basic fields
    if (!formData.title.trim()) {
      setError('Тест атауын енгізіңіз');
      return false;
    }
    
    if (!formData.deadline) {
      setError('Тест мерзімін белгілеңіз');
      return false;
    }
    
    // Check questions
    for (const question of questions) {
      if (!question.text.trim()) {
        setError('Барлық сұрақтарды толтырыңыз');
        return false;
      }
      
      // Check answer options
      let hasCorrectAnswer = false;
      
      for (const option of question.options) {
        if (!option.text.trim()) {
          setError('Барлық жауап нұсқаларын толтырыңыз');
          return false;
        }
        
        if (option.isCorrect) {
          hasCorrectAnswer = true;
        }
      }
      
      if (!hasCorrectAnswer) {
        setError('Әр сұрақта кемінде бір дұрыс жауап болуы керек');
        return false;
      }
    }
    
    return true;
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data
      const testData = {
        ...formData,
        questions: questions.map(q => ({
          text: q.text,
          points: q.points,
          options: q.options.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect
          }))
        }))
      };
      
      // Save test to database
      if (isEditing) {
        await updateTest(groupId, testId, testData);
      } else {
        await createTest(groupId, testData);
      }
      
      setSuccess(true);
      
      // Redirect after successful creation/update
      setTimeout(() => {
        navigate(`/groups/${groupId}/tests`);
      }, 1500);
    } catch (err) {
      console.error('Error submitting test:', err);
      setError(err.response?.data?.message || 'Тестті сақтау кезінде қате пайда болды');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !formData.title) {
    return <div className="loading">Жүктелуде...</div>;
  }
  
  return (
    <div className="create-test-container">
      <h1>{isEditing ? 'Тестті өңдеу' : 'Жаңа тест құру'}</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Тест сәтті сақталды!</div>}
      
      <form className="test-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Тест атауы</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Мысалы: Python негіздері"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Сипаттама (міндетті емес)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Тест жайлы қосымша ақпарат"
          />
        </div>
        
        <div className="form-group">
          <div className="inline-controls">
            <div className="form-group">
              <label htmlFor="timeLimit">Уақыт шегі (минут)</label>
              <input
                type="number"
                id="timeLimit"
                name="timeLimit"
                min="1"
                max="180"
                value={formData.timeLimit}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="deadline">Мерзімі</label>
              <input
                type="datetime-local"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>
        
        <div className="questions-section">
          <h2>Сұрақтар</h2>
          
          <div className="question-cards">
            {questions.map((question, index) => (
              <div key={question.id} className="question-card">
                <div className="card-header">
                  <h3>
                    <span className="question-number">Сұрақ {index + 1}</span>
                  </h3>
                  <button 
                    type="button" 
                    className="remove-question" 
                    onClick={() => removeQuestion(question.id)}
                  >
                    ×
                  </button>
                </div>
                
                <div className="form-group">
                  <label htmlFor={`question-${question.id}`}>Сұрақ мәтіні</label>
                  <textarea
                    id={`question-${question.id}`}
                    value={question.text}
                    onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
                    placeholder="Сұрақты жазыңыз"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`points-${question.id}`}>Ұпайлар</label>
                  <input
                    type="number"
                    id={`points-${question.id}`}
                    min="1"
                    max="10"
                    value={question.points}
                    onChange={(e) => handleQuestionChange(question.id, 'points', parseInt(e.target.value))}
                    required
                  />
                </div>
                
                <div className="options-container">
                  <div className="options-header">
                    <h4>Жауап нұсқалары</h4>
                  </div>
                  
                  {question.options.map(option => (
                    <div key={option.id} className="option-row">
                      <input
                        type="text"
                        className="option-input"
                        value={option.text}
                        onChange={(e) => handleOptionChange(question.id, option.id, 'text', e.target.value)}
                        placeholder="Жауап нұсқасы"
                        required
                      />
                      
                      <label className="correct-option">
                        <input
                          type="radio"
                          name={`correct-option-${question.id}`}
                          checked={option.isCorrect}
                          onChange={() => handleOptionChange(question.id, option.id, 'isCorrect')}
                          required
                        />
                        <span>Дұрыс жауап</span>
                      </label>
                      
                      <button
                        type="button"
                        className="remove-option"
                        onClick={() => removeOption(question.id, option.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="add-option-btn"
                    onClick={() => addOption(question.id)}
                  >
                    + Жауап нұсқасын қосу
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            className="add-question-btn"
            onClick={addQuestion}
          >
            + Жаңа сұрақ қосу
          </button>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn"
            onClick={() => navigate(`/groups/${groupId}/tests`)}
            disabled={loading}
          >
            Бас тарту
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Сақталуда...' : isEditing ? 'Сақтау' : 'Тестті құру'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTest; 