import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById, submitTestAnswers } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './TestStyles.scss';

const TakeTest = () => {
  const { groupId, testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Тест деректерін алу
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const response = await getTestById(groupId, testId);
        setTest(response.data);
        
        // Таймерді инициализациялау
        setTimeLeft(response.data.timeLimit * 60); // минуттарды секундтарға айналдыру
        
        // Бос жауаптар объектісін инициализациялау
        const initialAnswers = {};
        response.data.questions.forEach((question, index) => {
          initialAnswers[question._id] = null;
        });
        setAnswers(initialAnswers);
        
        setLoading(false);
      } catch (err) {
        console.error('Тестті алу кезінде қате:', err);
        setError(err.response?.data?.message || 'Тестті жүктеу кезінде қате пайда болды');
        setLoading(false);
      }
    };
    
    fetchTest();
  }, [groupId, testId]);
  
  // Таймер логикасы
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || !test) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, test]);
  
  // Уақытты форматтау (ММ:СС)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Жауапты таңдау
  const handleAnswerSelect = (questionId, optionId) => {
    console.log(`Таңдалған жауап: сұрақ=${questionId}, вариант=${optionId}`);
    
    // Тестте сұрақты табу
    const question = test.questions.find(q => q._id === questionId);
    if (question) {
      // Таңдалған вариантты табу
      const option = question.options.find(o => o._id === optionId);
      console.log(`Таңдалған варианттың деректері:`, option);
      console.log(`Таңдалған вариант дұрыс:`, option?.isCorrect === true);
    }
    
    setAnswers({
      ...answers,
      [questionId]: optionId
    });
  };
  
  // Келесі сұраққа өту
  const goToNextQuestion = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };
  
  // Алдыңғы сұраққа өту
  const goToPrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };
  
  // Тесті тапсыру
  const handleSubmitTest = useCallback(async () => {
    try {
      setSubmitting(true);
      
      // Жауаптарды тапсыру үшін форматтау
      const formattedAnswers = Object.keys(answers)
        .filter(questionId => answers[questionId] !== null)
        .map(questionId => ({
          questionId,
          optionId: answers[questionId]
        }));
      
      // Жұмсалған уақытты есептеу (бастапқы уақыт шегі - қалған уақыт)
      const timeSpent = test.timeLimit * 60 - timeLeft;
      
      console.log('Тест жауаптарын тапсыру:', formattedAnswers);
      
      // Жауаптарды localStorage-те резервтік көшірме ретінде сақтау
      const backupData = {
        groupId,
        testId,
        answers: formattedAnswers,
        timeSpent,
        timestamp: Date.now()
      };
      localStorage.setItem(`test_backup_${testId}`, JSON.stringify(backupData));
      
      // Тікелей импортталған submitTestAnswers функциясын пайдалану
      const response = await submitTestAnswers(
        groupId, 
        testId, 
        formattedAnswers, 
        timeSpent
      );
      
      console.log('Тестті тапсыру сәтті, жауап:', response.data);
      
      // Сәтті жіберілгеннен кейін резервтік көшірмені тазалау
      localStorage.removeItem(`test_backup_${testId}`);
      
      // Нәтижелер бетіне өту
      navigate(`/groups/${groupId}/tests/${testId}/result`, { 
        state: { 
          score: response.data.score, 
          maxScore: response.data.totalPoints,
          timeSpent: response.data.timeSpent
        }
      });
    } catch (err) {
      console.error('Тесті тапсыру кезінде қате:', err);
      
      // Қатенің түріне байланысты егжей-тегжейлі хабарлама
      if (err.response) {
        setError(`Сервер қатесі: ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        setError('Желі қатесі: Интернет байланысыңызды тексеріп, қайталап көріңіз');
      } else {
        setError(err.message || 'Тестті тапсыру кезінде қате пайда болды');
      }
      
      // Пайдаланушыға қалпына келтіру нұсқауларын көрсету
      alert('Тест жауаптары жергілікті сақталды. Бұл бетте қалыңыз және Интернет байланысты тексеріп, түймені қайта басыңыз.');
      
      setSubmitting(false);
    }
  }, [groupId, testId, answers, navigate, timeLeft, test]);
  
  // Бетті тастамас бұрын растау
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Барлық сұрақтарға жауап берілгенін тексеру
  const isTestComplete = () => {
    if (!test) return false;
    
    for (const questionId in answers) {
      if (answers[questionId] === null) {
        return false;
      }
    }
    
    return true;
  };
  
  // Прогресс пайызын есептеу
  const calculateProgress = () => {
    if (!test) return 0;
    
    const answeredCount = Object.values(answers).filter(answer => answer !== null).length;
    return Math.round((answeredCount / test.questions.length) * 100);
  };
  
  if (loading) {
    return <div className="loading">Жүктелуде...</div>;
  }
  
  if (error) {
    return (
      <div className="test-error">
        <h2>Қате пайда болды</h2>
        <p>{error}</p>
        <button 
          className="btn" 
          onClick={() => navigate(`/groups/${groupId}/tests`)}
        >
          Тесттер тізіміне оралу
        </button>
      </div>
    );
  }
  
  if (!test) {
    return <div className="loading">Тест туралы ақпарат жүктелмеді...</div>;
  }
  
  const currentQuestionData = test.questions[currentQuestion];
  
  return (
    <div className="take-test-container">
      <div className="test-header">
        <h1>{test.title}</h1>
        <div className={`test-timer ${timeLeft < 60 ? 'time-running-out' : ''}`}>
          {formatTime(timeLeft)}
        </div>
      </div>
      
      <div className="test-progress">
        <div className="progress-info">
          <span>Сұрақ {currentQuestion + 1} / {test.questions.length}</span>
          <span>Жауап берілді: {Object.keys(answers).filter(key => answers[key] !== null).length} / {test.questions.length}</span>
        </div>
        
        <div className="progress-track">
          <div 
            className="progress-bar" 
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>
        
        <div className="question-indicators">
          {test.questions.map((question, index) => (
            <button 
              key={question._id}
              className={`question-indicator ${answers[question._id] !== null ? 'answered' : ''} ${currentQuestion === index ? 'current' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      
      <div className="test-content">
        <div className="question-container">
          <div className="question-text">
            <h3>
              <span className="question-number">{currentQuestion + 1}.</span> {currentQuestionData.text}
            </h3>
            <div className="question-points">{currentQuestionData.points} ұпай</div>
          </div>
          
          <div className="options-list">
            {currentQuestionData.options.map(option => (
              <div 
                key={option._id}
                className={`option-item ${answers[currentQuestionData._id] === option._id ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(currentQuestionData._id, option._id)}
              >
                <input 
                  type="radio" 
                  id={option._id} 
                  name={`question-${currentQuestionData._id}`} 
                  checked={answers[currentQuestionData._id] === option._id}
                  onChange={() => handleAnswerSelect(currentQuestionData._id, option._id)}
                />
                <div className="option-content">
                  <label htmlFor={option._id}>{option.text}</label>
                  {answers[currentQuestionData._id] === option._id && 
                    <span className="selected-indicator">✓</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="test-navigation">
          {currentQuestion > 0 ? (
            <button 
              className="btn-prev"
              onClick={goToPrevQuestion}
            >
              Алдыңғы сұрақ
            </button>
          ) : (
            <div></div>
          )}
          
          {currentQuestion < test.questions.length - 1 ? (
            <button 
              className="btn-next"
              onClick={goToNextQuestion}
            >
              Келесі сұрақ
            </button>
          ) : (
            <button 
              className="btn-submit"
              onClick={() => {
                if (window.confirm('Тестті аяқтауға сенімдісіз бе?')) {
                  handleSubmitTest();
                }
              }}
              disabled={submitting || !isTestComplete()}
            >
              {submitting ? 'Тапсырылуда...' : 'Тестті аяқтау'}
            </button>
          )}
        </div>
      </div>
      
      {!isTestComplete() && (
        <div className="test-warning">
          <p>Барлық сұрақтарға жауап бергеннен кейін тестті тапсыра аласыз.</p>
        </div>
      )}
    </div>
  );
};

export default TakeTest; 