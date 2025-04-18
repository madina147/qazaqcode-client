import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getAllTests, getGroupById, getTestResults } from '../../services/api';
import ModernTestCard from './ModernTestCard';
import './TestStyles.scss';

const TestList = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch group data
        const groupResponse = await getGroupById(groupId);
        setGroup(groupResponse.data);
        
        // Fetch tests data
        const testsResponse = await getAllTests(groupId);
        setTests(testsResponse.data);
        
        // Fetch results for each test
        for (const test of testsResponse.data) {
          try {
            const response = await getTestResults(groupId, test._id);
            setTestResults(prev => ({ ...prev, [test._id]: response.data }));
          } catch (err) {
            console.error(`Error fetching results for test ${test._id}:`, err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Деректерді жүктеу кезінде қате пайда болды');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [groupId]);

  const handleDeleteTest = (testId) => {
    setTests(prev => prev.filter(test => test._id !== testId));
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

  const getDeadlineClass = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0) return 'overdue';
    if (diffDays <= 2) return 'approaching';
    return '';
  };

  if (loading) {
    return (
      <div className="tests-loading-container">
        <div className="loader-wrapper">
          <div className="loading-spinner"></div>
          <div className="loading-text">Жүктелуде...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tests-error-container">
        <div className="error-content">
          <div className="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
            </svg>
          </div>
          <div className="error-message">{error}</div>
          <Link to={`/groups/${groupId}`} className="btn btn-primary">
            Топқа оралу
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="tests-page">
      {/* Back navigation bar */}
      <div className="navigation-bar">
        <div className="container">
          <Link to={`/groups/${groupId}`} className="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Топқа оралу</span>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Тесттер</h1>
            <p className="page-subtitle">Топ: <span>{group?.name}</span></p>
          </div>
          
          {user?.role === 'teacher' && (
            <Link to={`/groups/${groupId}/tests/create`} className="create-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Жаңа тест құру</span>
            </Link>
          )}
        </div>
        
        {tests.length > 0 ? (
          <div className="tests-container">
            <div className="test-count">{tests.length} тест</div>
            
            <div className="tests-grid">
              {tests.map(test => (
                <ModernTestCard 
                  key={test._id} 
                  test={test} 
                  groupId={groupId}
                  isTeacher={user?.role === 'teacher'}
                  testResults={testResults[test._id]}
                  onDelete={handleDeleteTest}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5v-7.5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h7.5"/>
                <path d="M16 2v4"/>
                <path d="M8 2v4"/>
                <path d="M3 10h18"/>
                <circle cx="18" cy="18" r="3"/>
                <path d="M18 15v1.5"/>
                <path d="M18 20v.5"/>
              </svg>
            </div>
            <h3>Бұл топта тесттер жоқ</h3>
            <p>Тесттер әлі құрылмаған немесе жойылған</p>
            {user?.role === 'teacher' && (
              <Link to={`/groups/${groupId}/tests/create`} className="create-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Тест құру</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestList; 