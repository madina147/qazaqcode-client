import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './AssignmentStyles.scss';

const AssignmentList = () => {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Здесь будут API запросы для получения информации о группе и заданиях
        // Имитация данных
        setGroup({ 
          _id: groupId, 
          name: 'Математика 9-сынып' 
        });
        
        setAssignments([
          {
            _id: 'assignment1',
            title: 'Квадрат теңдеулер',
            description: 'Квадрат теңдеулерді шешуге арналған есептер жинағы. Барлық есептерді дәптерге шығарып, фотосын жүктеңіз.',
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            maxPoints: 20,
            isSubmitted: false
          },
          {
            _id: 'assignment2',
            title: 'Функциялар графигі',
            description: 'Функциялардың графиктерін салып, олардың қасиеттерін анықтаңыз.',
            deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            maxPoints: 15,
            isSubmitted: true,
            grade: 14
          }
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Деректерді жүктеу кезінде қате пайда болды');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

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
    return <div className="loading">Жүктелуде...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="assignments-container">
      <Link to={`/groups/${groupId}`} className="back-link">
        ← Топқа оралу
      </Link>
      
      <h1>Тапсырмалар</h1>
      <p className="group-info">Топ: {group?.name}</p>
      
      {user?.role === 'teacher' && (
        <div className="teacher-actions">
          <Link to={`/groups/${groupId}/assignment/create`} className="btn btn-primary">
            Жаңа тапсырма құру
          </Link>
        </div>
      )}
      
      {assignments.length > 0 ? (
        <div className="assignments-list">
          {assignments.map(assignment => (
            <div key={assignment._id} className="assignment-card">
              <h3>{assignment.title}</h3>
              
              <div className="assignment-meta">
                <span className={`deadline ${getDeadlineClass(assignment.deadline)}`}>
                  Мерзімі: {formatDate(assignment.deadline)}
                </span>
                <span className="points">
                  {assignment.maxPoints} ұпай
                </span>
              </div>
              
              <div className="assignment-description">
                {assignment.description}
              </div>
              
              <div className="assignment-actions">
                {user?.role === 'student' && (
                  assignment.isSubmitted ? (
                    <div className="assignment-status">
                      {assignment.grade !== undefined ? 
                        `Бағаланды: ${assignment.grade}/${assignment.maxPoints}` : 
                        'Тапсырылды, бағаланбаған'
                      }
                    </div>
                  ) : (
                    <Link to={`/groups/${groupId}/assignments/${assignment._id}/submit`} className="btn">
                      Тапсыру
                    </Link>
                  )
                )}
                
                <Link to={`/groups/${groupId}/assignments/${assignment._id}`} className="btn">
                  Толығырақ
                </Link>
                
                {user?.role === 'teacher' && (
                  <Link to={`/groups/${groupId}/assignments/${assignment._id}/edit`} className="btn">
                    Өңдеу
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-assignments">
          <p>Бұл топта тапсырмалар жоқ</p>
          {user?.role === 'teacher' && (
            <Link to={`/groups/${groupId}/assignment/create`} className="btn btn-primary">
              Тапсырма құру
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentList; 