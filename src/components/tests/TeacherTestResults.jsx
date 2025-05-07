import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaUser, FaCheck, FaTimes, FaClock, 
  FaCalendarAlt, FaFileAlt, FaChartBar, FaSearch, 
  FaSortAmountUp, FaSortAmountDown, FaEye, FaGraduationCap
} from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../../config.js';
import './TeacherTestResults.scss';

const TeacherTestResults = () => {
  const { groupId, testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [test, setTest] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortBy, setSortBy] = useState('score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [stats, setStats] = useState({
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    completionRate: 0,
    totalStudents: 0
  });

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        // Получаем данные теста
        const testResponse = await axios.get(`${API_URL}/api/groups/${groupId}/tests/${testId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (testResponse.data) {
          setTest(testResponse.data);
        }

        // Используем обычный endpoint results вместо results/all, так как API уже возвращает список студентов для учителя
        const resultsResponse = await axios.get(`${API_URL}/api/groups/${groupId}/tests/${testId}/results`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Ответ API на запрос результатов:', resultsResponse.data);

        if (resultsResponse.data && resultsResponse.data.students) {
          const students = resultsResponse.data.students;
          setStudentResults(students);
          
          // Автоматически выбираем первого студента, если есть результаты
          if (students.length > 0) {
            setSelectedStudent(students[0]);
          }
          
          // Рассчитываем статистику
          calculateStats(students);
        }
      } catch (err) {
        console.error('Error fetching test results:', err);
        setError(err.response?.data?.message || 'Не удалось загрузить результаты теста');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
  }, [groupId, testId, navigate]);

  // Рассчитываем статистику по результатам студентов
  const calculateStats = (results) => {
    if (!results || results.length === 0) {
      return;
    }

    const totalStudents = results.length;
    const scores = results.map(r => r.percentage || r.score || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalStudents;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const completed = results.length;
    const completionRate = (completed / totalStudents) * 100;

    setStats({
      averageScore: averageScore.toFixed(1),
      highestScore,
      lowestScore,
      completionRate: completionRate.toFixed(1),
      totalStudents
    });
  };

  // Сортировка результатов студентов
  const getSortedResults = () => {
    if (!studentResults) return [];

    let filteredResults = [...studentResults];
    
    // Применяем фильтр
    if (filterBy === 'completed') {
      filteredResults = filteredResults.filter(result => result.completed);
    } else if (filterBy === 'notCompleted') {
      filteredResults = filteredResults.filter(result => !result.completed);
    }
    
    // Применяем поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredResults = filteredResults.filter(result => 
        (result.student?.firstName?.toLowerCase() || '').includes(query) ||
        (result.student?.lastName?.toLowerCase() || '').includes(query)
      );
    }
    
    // Сортируем результаты
    return filteredResults.sort((a, b) => {
      let valueA, valueB;
      
      if (sortBy === 'name') {
        valueA = `${a.student?.lastName || ''} ${a.student?.firstName || ''}`.toLowerCase();
        valueB = `${b.student?.lastName || ''} ${b.student?.firstName || ''}`.toLowerCase();
      } else if (sortBy === 'score') {
        valueA = a.percentage || a.score || 0;
        valueB = b.percentage || b.score || 0;
      } else if (sortBy === 'time') {
        valueA = a.timeSpent || 0;
        valueB = b.timeSpent || 0;
      } else if (sortBy === 'date') {
        valueA = new Date(a.submittedAt || 0).getTime();
        valueB = new Date(b.submittedAt || 0).getTime();
      }
      
      // Определяем направление сортировки
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (valueA < valueB) return -1 * direction;
      if (valueA > valueB) return 1 * direction;
      return 0;
    });
  };

  // Переключение направления сортировки
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Получение класса для отображения оценки
  const getScoreClass = (percentage) => {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
  };

  // Проверка правильности ответа на вопрос
  const isAnswerCorrect = (question, studentAnswer) => {
    if (!question || !studentAnswer) return false;
    
    const questionId = question._id;
    const answer = studentAnswer.find(a => a.questionId === questionId);
    
    if (!answer) return false;
    
    // Проверяем, есть ли прямое указание о правильности
    if (answer.hasOwnProperty('correct')) {
      return answer.correct === true;
    }
    
    // Иначе проверяем выбранный вариант
    const selectedOption = question.options.find(opt => 
      opt._id === (answer.selectedOptionId || answer.optionId)
    );
    
    return selectedOption && selectedOption.isCorrect === true;
  };

  // Форматирование времени в минуты и секунды
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return '0 мин';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    
    if (minutes === 0) {
      return `${seconds} сек`;
    }
    
    return `${minutes} мин ${seconds} сек`;
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="teacher-results-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Тест нәтижелері жүктелуде...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-results-container">
        <div className="error-message">
          <div className="error-icon">
            <FaTimes />
          </div>
          <h3>Деректерді жүктеу кезінде қате</h3>
          <p>{error}</p>
          <Link to={`/groups/${groupId}/tests`} className="back-button">
            <FaArrowLeft /> Тесттер тізіміне оралу
          </Link>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="teacher-results-container">
        <div className="not-found-message">
          <h3>Тест табылмады</h3>
          <p>Сұралған тест жоқ немесе сізде оған қол жеткізу құқығы жоқ.</p>
          <Link to={`/groups/${groupId}/tests`} className="back-button">
            <FaArrowLeft /> Тесттер тізіміне оралу
          </Link>
        </div>
      </div>
    );
  }

  const sortedResults = getSortedResults();

  return (
    <div className="teacher-results-container">
      <div className="results-header">
        <Link to={`/groups/${groupId}/tests`} className="back-button">
          <FaArrowLeft /> Тесттер тізіміне
        </Link>
        <h1>{test.title || test.name}</h1>
        {test.description && <p className="test-description">{test.description}</p>}
      </div>

      <div className="test-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUser />
          </div>
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-label">Оқушылар</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaChartBar />
          </div>
          <div className="stat-value">{stats.averageScore}%</div>
          <div className="stat-label">Орташа балл</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaCheck />
          </div>
          <div className="stat-value">{stats.highestScore}%</div>
          <div className="stat-label">Ең жоғары нәтиже</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaFileAlt />
          </div>
          <div className="stat-value">{stats.completionRate}%</div>
          <div className="stat-label">Аяқталды</div>
        </div>
      </div>

      <div className="results-content">
        <div className="students-list">
          <div className="list-header">
            <h3>Оқушылардың нәтижелері</h3>
            <div className="filter-controls">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Оқушыны іздеу..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-options">
                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                  <option value="all">Барлығы</option>
                  <option value="completed">Аяқталған</option>
                  <option value="notCompleted">Аяқталмаған</option>
                </select>
              </div>
              <div className="sort-controls">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="name">Аты бойынша</option>
                  <option value="score">Балл бойынша</option>
                  <option value="time">Уақыт бойынша</option>
                  <option value="date">Күні бойынша</option>
                </select>
                <button className="sort-direction" onClick={toggleSortDirection}>
                  {sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                </button>
              </div>
            </div>
          </div>

          <div className="students-results-list">
            {sortedResults.length === 0 ? (
              <div className="no-results">
                <p>Көрсетілетін нәтижелер жоқ</p>
              </div>
            ) : (
              sortedResults.map((result) => {
                console.log(result);
                const studentName = `${result?.lastName || ''} ${result?.firstName || ''}`;
                const studentClass = result?.grade && result?.gradeLetter 
                  ? `${result.student.grade}-${result.student.gradeLetter}` 
                  : '';
                const score = result.percentage || result.score || 0;
                const scoreClass = getScoreClass(score);
                
                return (
                  <div 
                    key={result._id || result.studentId}
                    className={`student-result-item ${selectedStudent && selectedStudent._id === result._id ? 'selected' : ''} ${score >= 70 ? 'has-correct' : ''}`}
                    onClick={() => setSelectedStudent(result)}
                  >
                    <div className="student-name">{studentName}</div>
                    <div className="student-score">
                      <div className="score-text" data-percent={`${Math.round(score)}%`}>
                        Балл
                      </div>
                      <div className="score-progress">
                        <div 
                          className={`progress-bar ${scoreClass}`} 
                          style={{ width: `${Math.min(score, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="student-time">
                      <FaClock className="time-icon" /> {formatTime(result.timeSpent || 0)}
                      {result.submittedAt && (
                        <span className="submitted-date">
                          <FaCalendarAlt className="date-icon" /> {formatDate(result.submittedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="student-detail-result">
          {selectedStudent ? (
            <>
              <h3>
                Нәтиже: {selectedStudent.student?.lastName} {selectedStudent.student?.firstName}
              </h3>
              
              <div className="score-summary">
                <div className="score-card">
                  <div className="score-label">Жалпы нәтиже</div>
                  <div className={`score-value ${getScoreClass(selectedStudent.percentage || selectedStudent.score || 0)}`}>
                    {Math.round(selectedStudent.percentage || selectedStudent.score || 0)}%
                  </div>
                </div>
                
                <div className="score-card">
                  <div className="score-label">Балл</div>
                  <div className="score-value">
                    {selectedStudent.score || 0} / {selectedStudent.totalPoints || test.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0}
                  </div>
                </div>
                
                <div className="score-card">
                  <div className="score-label">Орындау уақыты</div>
                  <div className="score-value">
                    {formatTime(selectedStudent.timeSpent || 0)}
                  </div>
                </div>
                
                <div className="score-card">
                  <div className="score-label">Тапсыру күні</div>
                  <div className="score-value date">
                    {formatDate(selectedStudent.completedAt)}
                  </div>
                </div>
              </div>
              
              <div className="student-answers">
                <h4>Сұрақтарға жауаптар</h4>
                
                {test.questions && test.questions.map((question, index) => {
                  const isCorrect = isAnswerCorrect(question, selectedStudent.answers || []);
                  const studentAnswer = selectedStudent.answers?.find(a => a.questionId === question._id);
                  const selectedOption = studentAnswer ? 
                    question.options.find(opt => opt._id === (studentAnswer.selectedOptionId || studentAnswer.optionId)) : 
                    null;
                  
                  return (
                    <div key={question._id} className={`question-answer ${isCorrect ? 'correct' : 'incorrect'}`}>
                      <div className="question-header">
                        <div className="question-number">Сұрақ {index + 1}</div>
                        <div className={`question-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                          {isCorrect ? <FaCheck className="status-icon" /> : <FaTimes className="status-icon" />}
                          {isCorrect ? 'Дұрыс' : 'Қате'}
                        </div>
                      </div>
                      
                      <div className="question-content">
                        <div className="question-text">{question.text}</div>
                        
                        <div className="options-list">
                          {question.options.map(option => {
                            const isSelected = selectedOption && selectedOption._id === option._id;
                            const isCorrectOption = option.isCorrect === true;
                            
                            let optionClass = '';
                            if (isSelected && isCorrectOption) {
                              optionClass = 'correct-selected';
                            } else if (isSelected && !isCorrectOption) {
                              optionClass = 'incorrect-selected';
                            } else if (!isSelected && isCorrectOption) {
                              optionClass = 'correct-option';
                            }
                            
                            return (
                              <div key={option._id} className={`option-item ${optionClass}`}>
                                <div className="option-marker">
                                  {isSelected && <span className="selected-marker">✓</span>}
                                </div>
                                <div className="option-text">{option.text}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="no-student-selected">
              <FaEye className="select-icon" />
              <h3>Оқушыны таңдаңыз</h3>
              <p>Толық нәтижені көру үшін сол жақтағы тізімнен оқушыны таңдаңыз.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherTestResults; 