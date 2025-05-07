import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaPlus, FaSpinner } from 'react-icons/fa';
import ModernTestCard from './ModernTestCard';
import { getTests } from '../../services/testService';
import { getTestResults } from '../../services/api';
import './TestStyles.scss';
import { useAuth } from '../../context/AuthContext';

const TestsList = () => {
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const [tests, setTests] = useState([]);
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isTeacher = currentUser?.role === 'teacher';

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const response = await getTests(groupId);
        setTests(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tests:', err);
        setError('Тесттерді жүктеу кезінде қате шықты');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchTests();
    }
  }, [groupId]);

  useEffect(() => {
    const fetchTestResults = async () => {
      if (!tests.length || isTeacher) return;
      
      const results = {};
      
      // Fetch results for each test
      for (const test of tests) {
        try {
          const response = await getTestResults(groupId, test._id);
          results[test._id] = response.data;
        } catch (err) {
          console.error(`Error fetching results for test ${test._id}:`, err);
        }
      }
      
      setTestResults(results);
    };
    
    fetchTestResults();
  }, [tests, groupId, isTeacher]);

  const handleDeleteSuccess = (deletedTestId) => {
    setTests(prevTests => prevTests.filter(test => test._id !== deletedTestId));
  };

  return (
    <div className="tests-list-container">
      <div className="tests-header">
        <h2 className="group-header">Тесттер</h2>
        {isTeacher && (
          <Link to={`/groups/${groupId}/tests/create`} className="create-button">
            <FaPlus className="icon" />
            Тест құру
          </Link>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Тесттер жүктелуде...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="text-button">
            Қайта жүктеу
          </button>
        </div>
      ) : tests.length > 0 ? (
        <div className="tests-grid">
          {tests.map(test => (
            <ModernTestCard
              key={test._id}
              test={test}
              groupId={groupId}
              isTeacher={isTeacher}
              onDelete={handleDeleteSuccess}
              testResults={testResults[test._id]}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-content">
            {isTeacher ? (
              <>
                <h3>Бұл топта тесттер жоқ</h3>
                <p>Оқушыларға арналған жаңа тест құрыңыз</p>
                <Link to={`/groups/${groupId}/tests/create`} className="create-button">
                  <FaPlus className="icon" />
                  Тест құру
                </Link>
              </>
            ) : (
              <>
                <h3>Бұл топта тесттер жоқ</h3>
                <p>Сіздің оқытушыңыз әлі тесттер қоспаған</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestsList; 