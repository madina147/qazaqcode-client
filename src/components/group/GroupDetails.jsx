import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGroupById, updateGroup, getAvailableStudents, addStudentToGroup, removeStudentFromGroup } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './GroupStyles.scss';

const GroupDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [addStudentError, setAddStudentError] = useState('');

  // Проверка на валидный MongoDB ObjectId
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  useEffect(() => {
    if (!isValidObjectId) {
      setError('Неверный идентификатор группы');
      setLoading(false);
      return;
    }
    
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const { data } = await getGroupById(id);
      setGroup(data);
      
      // Only fetch available students if user is a teacher
      if (user?.role === 'teacher') {
        const response = await getAvailableStudents(id);
        setAvailableStudents(response.data);
      }
    } catch (err) {
      console.error('Error fetching group:', err);
      setError('Топты жүктеу кезінде қате пайда болды');
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async () => {
    if (!selectedStudent) {
      setAddStudentError('Оқушыны таңдаңыз');
      return;
    }

    try {
      // Используем функцию API вместо прямого вызова axios
      const response = await addStudentToGroup(id, selectedStudent);
      
      // Обновляем группу после успешного добавления
      setGroup(response.data);
      
      // Обновляем список доступных студентов
      setAvailableStudents(prev => prev.filter(s => s._id !== selectedStudent));
      
      // Сбрасываем форму
      setShowAddStudent(false);
      setSelectedStudent('');
      setAddStudentError('');
    } catch (err) {
      console.error('Error adding student:', err);
      if (err.response && err.response.data && err.response.data.message === 'Student already in group') {
        setAddStudentError('Бұл оқушы топта бар');
      } else {
        setAddStudentError('Оқушыны қосу кезінде қате пайда болды');
      }
    }
  };

  const removeStudent = async (studentId) => {
    if (!studentId) {
      alert('Жарамсыз Оқушы идентификаторы');
      return;
    }

    try {
      // Используем API функцию для удаления студента
      const response = await removeStudentFromGroup(id, studentId);
      
      // Обновляем группу после успешного удаления
      setGroup(response.data);
      
      // Обновление списка доступных студентов
      const removedStudent = group.students.find(s => s._id === studentId);
      if (removedStudent) {
        setAvailableStudents(prev => [...prev, removedStudent]);
      }
    } catch (err) {
      console.error('Error removing student:', err);
      // Обрабатываем разные типы ошибок и показываем понятные сообщения
      if (err.response && err.response.data) {
        const errorMessage = err.response.data.message;
        if (errorMessage === 'Invalid student ID' || errorMessage === 'Invalid student ID format') {
          alert('Жарамсыз оқушы идентификаторы');
        } else if (errorMessage === 'Student not in group') {
          alert('Бұл оқушы топта емес');
        } else if (errorMessage === 'Student not found') {
          alert('Оқушы табылмады');
        } else {
          alert('Оқушыны жою кезінде қате пайда болды: ' + errorMessage);
        }
      } else {
        alert('Оқушыны жою кезінде қате пайда болды');
      }
    }
  };

  const createAssignment = () => {
    navigate(`/groups/${id}/assignments/create`);
  };

  const createTest = () => {
    navigate(`/groups/${id}/tests/create`);
  };

  if (loading) {
    return <div className="loading">Жүктелуде...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <div className="back-link">
          <Link to={user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'}>
            Бақылау тақтасына оралу
          </Link>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="error-container">
        <div className="error">Топ табылмады</div>
        <div className="back-link">
          <Link to={user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'}>
            Бақылау тақтасына оралу
          </Link>
        </div>
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="group-details-container">
      <Link to={user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'} className="back-link">
        <span className="icon">←</span> Бақылау тақтасына оралу
      </Link>
      
      <div className="group-header">
        <h1 className="modern-heading">{group.name}</h1>
        <div className="group-meta">
          <div className="meta-item">
            <span className="meta-icon">👨‍🏫</span> 
            <span>Мұғалім: {group.teacher.firstName} {group.teacher.lastName}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">👥</span> 
            <span>Оқушылар саны: {group.students.length}</span>
          </div>
        </div>
        {group.description && (
          <div className="group-description">
            <p>{group.description}</p>
          </div>
        )}
      </div>

      <div className="group-content">
        {isTeacher && (
          <div className="teacher-actions">
            
            
            {showAddStudent ? (
              <div className="add-student-form">
                <h3>Оқушыны қосу</h3>
                {addStudentError && <div className="form-error">{addStudentError}</div>}
                
                <div className="form-group">
                  <label htmlFor="student">Оқушыны таңдаңыз:</label>
                  <select 
                    id="student" 
                    value={selectedStudent} 
                    onChange={(e) => setSelectedStudent(e.target.value)}
                  >
                    <option value="">Таңдаңыз...</option>
                    {availableStudents.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.firstName} {student.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-actions">
                  <button className="action-button primary" onClick={addStudent}>
                    <span className="icon">✓&nbsp;</span>
                    <span>Қосу</span>
                  </button>
                  <button className="action-button secondary" onClick={() => setShowAddStudent(false)}>
                    <span className="icon">✕&nbsp;</span>
                    <span>Бас тарту</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="teacher-buttons">
                <button className="action-button primary" style={{margin:'0.5rem 0.5rem 0.5rem 0'}} onClick={() => setShowAddStudent(true)}>
                  <span className="icon">👤&nbsp;</span>
                  <span>Оқушы қосу</span>
                </button>
                <button className="action-button secondary" onClick={createAssignment}>
                  <span className="icon">📝&nbsp;</span>
                  <span>Тапсырма құру</span>
                </button>
                <button className="action-button secondary" onClick={createTest}>
                  <span className="icon">📋&nbsp;</span>
                  <span>Тест құру</span>
                </button>
                <button className="action-button secondary" onClick={() => navigate(`/groups/${id}/materials/create`)}>
                  <span className="icon">📚&nbsp;</span>
                  <span>Материал жасау</span>
                </button>
              </div>
            )}
            <h4>Оқытушы әрекеттері</h4>
          </div>
        )}

        <div className="resources-section">
          <h2 className="section-title">
            <span className="section-icon">📚</span>
            Ресурстар
          </h2>
          <div className="resources-container">
            <div className="resource-card">
              <div className="resource-icon">📝</div>
              <div className="resource-content">
                <Link to={`/groups/${id}/assignments`} className="resource-link">
                  <h3>Тапсырмалар</h3>
                  <p>Барлық топ тапсырмаларына қол жеткізіңіз</p>
                </Link>
              </div>
            </div>

            <div className="resource-card">
              <div className="resource-icon">📊</div>
              <div className="resource-content">
                <Link to={`/groups/${id}/tests`} className="resource-link">
                  <h3>Тесттер</h3>
                  <p>Тесттер тізімін қараңыз</p>
                </Link>
              </div>
            </div>

            <div className="resource-card">
              <div className="resource-icon">📚</div>
              <div className="resource-content">
                <Link to={`/groups/${id}/materials`} className="resource-link">
                  <h3>Материалдар</h3>
                  <p>Оқу материалдарына қол жеткізіңіз</p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="students-section">
          <h2>Оқушылар тізімі</h2>
          {group.students.length > 0 ? (
            <div className="students-list">
              {group.students.map(student => (
                <div key={student._id} className="student-card">
                  <div className="student-info">
                    <h3>{student.firstName} {student.lastName}</h3>
                    <p><span className="meta-icon">🏫</span> Сынып: {student.grade}{student.gradeLetter}</p>
                    <p><span className="meta-icon">🏆</span> Ұпайлар: {student.points || 0}</p>
                  </div>
                  {isTeacher && (
                    <div className="student-actions">
                      <button className="action-button secondary" onClick={() => navigate(`/students/${student._id}/rate`)}>
                        <span className="icon">✓&nbsp;</span>
                        <span>Бағалау</span>
                      </button>
                      <button className="action-button danger" onClick={() => removeStudent(student._id)}>
                        <span className="icon">✕&nbsp;</span>
                        <span>Жою</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>Бұл топта оқушылар жоқ</p>
          )}
        </div>
      </div>
    </div>
  );
};


export default GroupDetails; 