import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config.js';

import './TestStyles.scss';

const TestResults = () => {
  const { groupId, testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loadingStyle, setLoadingStyle] = useState('loading-spin');
  const [studentResult, setStudentResult] = useState(null);

  // Циклическая смена стилей загрузки для визуального интереса
  useEffect(() => {
    if (loading) {
      const styles = ['loading-spin', 'loading-pulse', 'loading-bounce'];
      const intervalId = setInterval(() => {
        setLoadingStyle(prev => {
          const currentIndex = styles.indexOf(prev);
          return styles[(currentIndex + 1) % styles.length];
        });
      }, 2000);
      
      return () => clearInterval(intervalId);
    }
  }, [loading]);

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Log request details for debugging
        console.log(`Fetching results: ${API_URL}/api/groups/${groupId}/tests/${testId}/results`);
        
        const response = await axios.get(`${API_URL}/api/groups/${groupId}/tests/${testId}/results`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Response received:', response.data);
        
        // Сначала получим данные теста, чтобы гарантировать их наличие
        let testData = null;
        try {
          const testResponse = await axios.get(`${API_URL}/api/groups/${groupId}/tests/${testId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (testResponse.data) {
            // Проверяем, содержит ли ответ непосредственно тест или он вложен в свойство test
            testData = testResponse.data.test || testResponse.data;
            console.log('Test data received:', testData);
          }
        } catch (testErr) {
          console.error("Error fetching test details:", testErr);
        }
        
        // Обработка ответа с результатами
        if (response.data) {
          // Case 1: The response IS directly the studentResult object
          if (response.data.studentId && response.data.testId && response.data.answers) {
            console.log("Detected direct studentResult object format");
            
            // Set the student result data
            setStudentResult(response.data);
            
            // Transform answers to match expected format
            const transformedAnswers = response.data.answers.map(a => ({
              questionId: a.questionId,
              selectedOptionId: a.optionId || a.selectedOptionId
            }));
            setUserAnswers(transformedAnswers);
            
            // Используем ранее полученные данные теста
            if (testData) {
              setTest(testData);
            }
          }
          // Case 2: Response has test property
          else if (response.data.test) {
            console.log("Detected response with test property");
            setTest(response.data.test);
            // Ensure userAnswers is always an array
            setUserAnswers(Array.isArray(response.data.userAnswers) ? response.data.userAnswers : []);
            
            // Check if we got a message from the server
            if (response.data.message) {
              setMessage(response.data.message);
            }
          }
          // Case 3: Response has nested studentResult
          else if (response.data.studentResult) {
            console.log("Detected response with nested studentResult");
            // Handle the new response format
            setStudentResult(response.data.studentResult);
            
            // Check if studentResult contains a test property
            if (response.data.studentResult.test) {
              setTest(response.data.studentResult.test);
            } else if (testData) {
              // Используем ранее полученные данные теста
              setTest(testData);
            }
            
            setUserAnswers(Array.isArray(response.data.studentResult.answers) ? 
              response.data.studentResult.answers : []);
          } 
          // Case 4: Response has other structure but might contain test data
          else {
            console.log("Detected other response structure");
            // Проверяем, есть ли в ответе данные теста в другом формате
            if (response.data.questions || (response.data._id && response.data.title)) {
              setTest(response.data);
            } else if (testData) {
              // Используем ранее полученные данные теста
              setTest(testData);
            } else {
              setError('Тест нәтижелері табылмады');
            }
            
            // Проверяем, есть ли в ответе ответы пользователя
            if (Array.isArray(response.data.answers)) {
              setUserAnswers(response.data.answers);
            } else if (Array.isArray(response.data.userAnswers)) {
              setUserAnswers(response.data.userAnswers);
            }
          }
        } else {
          if (testData) {
            setTest(testData);
          } else {
            setError('Тест нәтижелері табылмады');
          }
        }
        
        // Проверка, получили ли мы данные теста
        if (!test && !testData) {
          console.error('Test data is missing after all attempts');
          setError('Тест деректері табылмады');
        }
      } catch (err) {
        console.error('Error fetching test results:', err);
        setError(err.response?.data?.message || 'Тест нәтижелерін жүктеу кезінде қате пайда болды');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
  }, [groupId, testId, navigate]);

  // Define isAnswerCorrect first so it can be used in calculateScore
  const isAnswerCorrect = useCallback((questionId) => {
    // First check if we have this answer in studentResult
    if (studentResult && studentResult.answers) {
      const answer = studentResult.answers.find(a => 
        a.questionId.toString() === questionId.toString()
      );
      
      if (answer) {
        // Directly use the 'correct' property if it exists
        if (answer.hasOwnProperty('correct')) {
          return answer.correct === true;
        }
      }
    }
    
    // Fall back to manual check by comparing selected option with isCorrect property
    if (!test || !userAnswers.length) return false;
    
    const question = test.questions.find(q => q._id.toString() === questionId.toString());
    const userAnswer = userAnswers.find(a => a.questionId.toString() === questionId.toString());
    
    if (!question || !userAnswer) return false;
    
    // Get the selected option ID, supporting both selectedOptionId and optionId formats
    const selectedOptionId = userAnswer.selectedOptionId || userAnswer.optionId;
    if (!selectedOptionId) return false;
    
    // Find the selected option
    const selectedOption = question.options.find(opt => 
      opt._id.toString() === selectedOptionId.toString()
    );
    
    // Return true only if the selected option exists and its isCorrect property is explicitly true
    return selectedOption && selectedOption.isCorrect === true;
  }, [test, userAnswers, studentResult]);

  const calculateScore = useCallback(() => {
    // If we have complete studentResult, use that directly
    if (studentResult) {
      // Make sure we have valid numbers
      const score = Number(studentResult.score) || 0;
      const totalPoints = Number(studentResult.totalPoints) || 0;
      
      // Calculate percentage 
      let percentage = studentResult.percentage;
      if (typeof percentage !== 'number') {
        percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      }
      
      return {
        correct: score,
        total: totalPoints,
        percentage: percentage
      };
    }
    
    // Use the manual calculation method if studentResult is not available
    if (!test || !test.questions || !userAnswers.length) return { correct: 0, total: 0, percentage: 0 };
    
    // Calculate total points and correct points
    let totalPoints = 0;
    let correctPoints = 0;
    
    test.questions.forEach(question => {
      const points = question.points || 1;
      totalPoints += points;
      
      if (isAnswerCorrect(question._id)) {
        correctPoints += points;
      }
    });
    
    const percentage = Math.round((correctPoints / totalPoints) * 100);
    
    return { 
      correct: correctPoints, 
      total: totalPoints, 
      percentage 
    };
  }, [test, userAnswers, studentResult, isAnswerCorrect]);

  const getScoreClass = (percentage) => {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
  };

  if (loading) {
    return (
      <>
        {/* <Header /> */}
        <div className="test-results-container">
          <div className={`loading ${loadingStyle}`}>
            <div className="loading-spinner"></div>
            <div className="loading-text">Нәтижелер жүктелуде...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* <Header /> */}
        <div className="test-results-container">
          <div className="error-message">
            <div className="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
              </svg>
            </div>
            <div className="error-text">{error}</div>
            <div className="action-buttons">
              <Link to={`/groups/${groupId}/tests`} className="back-link">
                Тесттер тізіміне оралу
              </Link>
              <Link to={`/groups/${groupId}/tests/${testId}/take`} className="retry-button">
                Тестті тапсыру
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!test) {
    console.log("Test data is missing:", { studentResult, userAnswers });
    return (
      <>
        {/* <Header /> */}
        <div className="test-results-container">
          <div className="test-not-found">
            <div className="empty-state-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4361ee" width="100" height="100">
                <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
              </svg>
            </div>
            <h3>Тест табылмады</h3>
            <p>Сұраған тест жоқ немесе қол жетімді емес.</p>
            <Link to={`/groups/${groupId}/tests`} className="btn">Тесттер тізіміне оралу</Link>
          </div>
        </div>
      </>
    );
  }

  // Display a message if we have test data but no results
  if (message && userAnswers.length === 0) {
    return (
      <>
        {/* <Header /> */}
        <div className="test-results-container">
          <div className="notification-message">
            <div className="notification-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4361ee" width="80" height="80">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"/>
              </svg>
            </div>
            <h3>{test.title}</h3>
            <p className="notification-text">{message}</p>
            <div className="action-buttons">
              <Link to={`/groups/${groupId}/tests`} className="back-link">
                Тесттер тізіміне оралу
              </Link>
              <Link to={`/groups/${groupId}/tests/${testId}/take`} className="retry-button">
                Тестті тапсыру
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // If we have studentResult but test data is still loading or unavailable
  if (studentResult && (!test || !test.questions)) {
    // Still display score summary without the questions
    const { correct, total, percentage } = calculateScore();
    const scoreClass = getScoreClass(percentage);
    
    return (
      <>
        {/* <Header /> */}
        <div className="test-results-container">
          <Link to={`/groups/${groupId}/tests`} className="back-link">Тесттер тізіміне оралу</Link>
          
          <h1 className="test-title">Тест нәтижелері</h1>
          
          <div className="test-score-summary">
            <div className="score-box">
              <div className={`score-value ${scoreClass}`} >
                {percentage.toFixed(2)}%
              </div>
              <div className="score-label">Жалпы нәтиже</div>
              <div className="progress-bar-wrapper">
                <div 
                  className={`progress-bar ${scoreClass}`} 
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="score-box">
              <div className={`score-value ${scoreClass}`} >
                {correct}
              </div>
              <div className="score-label">Дұрыс жауаптар</div>
              <div className="progress-bar-wrapper">
                <div 
                  className={`progress-bar ${scoreClass}`} 
                  style={{ width: `${Math.min((correct/total) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="score-box">
              <div className="score-value" >
                {total}
              </div>
              <div className="score-label">Барлық сұрақтар</div>
            </div>
          </div>

          <div className="retry-test-container">
            <Link to={`/groups/${groupId}/tests/${testId}/take`} className="retry-button">
              Тестті қайта тапсыру
            </Link>
          </div>
          
          <div className="test-questions-results">
            <h3>Сұрақтар мен жауаптар жүктелуде...</h3>
            <div className={`loading ${loadingStyle}`}>
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { correct, total, percentage } = calculateScore();
  const scoreClass = getScoreClass(percentage);

  return (
    <>
      {/* <Header /> */}
      <div className="test-results-container">
        <Link to={`/groups/${groupId}/tests`} className="back-link">Тесттер тізіміне оралу</Link>
        
        <h1 className="test-title">{test.title}</h1>
        <p className="test-description">{test.description}</p>
        
        <div className="test-score-summary">
          <div className="score-box">
            <div className={`score-value ${scoreClass}`} >
              {percentage.toFixed(2)}%
            </div>
            <div className="score-label">Жалпы нәтиже</div>
            <div className="progress-bar-wrapper">
              <div 
                className={`progress-bar ${scoreClass}`} 
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="score-box">
            <div className={`score-value ${scoreClass}`} >
              {correct}
            </div>
            <div className="score-label">Дұрыс жауаптар</div>
            <div className="progress-bar-wrapper">
              <div 
                className={`progress-bar ${scoreClass}`} 
                style={{ width: `${Math.min((correct/total) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="score-box">
            <div className="score-value" >
              {total}
            </div>
            <div className="score-label">Барлық сұрақтар</div>
          </div>
        </div>

        <div className="retry-test-container">
          <Link to={`/groups/${groupId}/tests/${testId}/take`} className="retry-button">
            Тестті қайта тапсыру
          </Link>
        </div>
        
        <div className="test-questions-results">
          <h3>Сұрақтар нәтижелері</h3>
          
          {test.questions && test.questions.map((question, index) => {
            const isCorrect = isAnswerCorrect(question._id);
            const userAnswer = userAnswers.find(
              answer => answer.questionId.toString() === question._id.toString()
            );
            
            const selectedOption = userAnswer
              ? question.options.find(
                  opt => opt._id.toString() === (userAnswer.selectedOptionId || userAnswer.optionId || '').toString()
                )
              : null;
              
            const correctOption = question.options.find(opt => opt.isCorrect === true);
            
            return (
              <div 
                key={question._id} 
                className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}
              >
                <div className="question-header">
                  <div className="question-number">Сұрақ {index + 1}</div>
                  <div className="question-points" data-tooltip="Бұл сұрақ үшін ұпай">
                    {question.points || 1} ұпай
                  </div>
                  <div className={`question-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? 'Дұрыс' : 'Қате'}
                  </div>
                </div>
                
                <div className="question-text">
                  {question.text}
                </div>
                
                <div className="question-options">
                  {question.options.map((option) => {
                    // Determine if this option was selected by the user
                    const isSelected = selectedOption && 
                      selectedOption._id.toString() === option._id.toString();
                    
                    // Determine if this is a correct option
                    const isCorrectOption = option.isCorrect === true;
                    
                    // Choose the appropriate style class based on selection and correctness
                    let optionClass = 'regular-option';
                    
                    if (isSelected) {
                      // If the question was answered correctly, always show the selected option as correct
                      if (isCorrect) {
                        optionClass = 'correct-selected';
                      } else if (isCorrectOption) {
                        // User selected a correct option but overall question might be incorrect
                        // (possibly multi-select question where another required option wasn't selected)
                        optionClass = 'correct-selected';
                      } else {
                        // User selected an incorrect option and the question is incorrect
                        optionClass = 'incorrect-selected';
                      }
                    } else if (isCorrectOption) {
                      // This is a correct option the user didn't select
                      optionClass = 'correct-option';
                    }
                    
                    return (
                      <div 
                        key={option._id} 
                        className={`option-result ${isSelected ? 'selected' : ''} ${optionClass}`}>
                        <div className="option-text">{option.text}</div>
                        
                        {/* Only show indicator for selected options */}
                        {isSelected && (
                          <div className="option-indicator">
                            {isCorrect || isCorrectOption ? (
                              // Show checkmark for correct selections or when entire question is correct
                              <span className="check-icon">✓</span>
                            ) : (
                              // Show cross only for incorrect selections in incorrect questions
                              <span className="cross-icon">✗</span>
                            )}
                          </div>
                        )}
                        
                        {/* Show hint for correct answers that weren't selected */}
                        {!isSelected && isCorrectOption && (
                          <div className="option-correct-hint">
                            Дұрыс жауап
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default TestResults; 