import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMaterialById, getGroupById } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './MaterialsStyles.scss';

const MaterialProgress = () => {
  const { groupId, materialId } = useParams();
  const { user } = useAuth();
  const [material, setMaterial] = useState(null);
  const [group, setGroup] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Функция для создания объекта прогресса на основе данных материала и группы
  const buildProgressFromMaterial = (materialData, groupData) => {
    if (!materialData || !groupData) return null;
    
    // Получаем список всех студентов группы
    const allStudents = groupData.students || [];
    
    // Получаем список тех, кто уже просмотрел материал
    const viewedByArray = materialData.viewedBy || [];
    
    console.log("Material viewedBy:", viewedByArray);
    console.log("Group students:", allStudents);
    
    // Создаем массив студентов, просмотревших материал
    const viewedByStudents = viewedByArray.map(view => {
      // Если userId - это объект с данными пользователя
      if (view.userId && typeof view.userId === 'object') {
        return {
          _id: view.userId._id,
          firstName: view.userId.firstName || '',
          lastName: view.userId.lastName || '',
          email: view.userId.email || '',
          grade: view.userId.grade || '',
          gradeLetter: view.userId.gradeLetter || '',
          viewedAt: view.viewedAt
        };
      }
      
      // Если userId - это только ID, находим студента в списке всех студентов
      const viewedUserId = typeof view.userId === 'string' ? view.userId : String(view.userId);
      const studentInfo = allStudents.find(student => 
        student._id === viewedUserId || String(student._id) === viewedUserId
      );
      
      if (studentInfo) {
        return {
          _id: studentInfo._id,
          firstName: studentInfo.firstName || '',
          lastName: studentInfo.lastName || '',
          email: studentInfo.email || '',
          grade: studentInfo.grade || '',
          gradeLetter: studentInfo.gradeLetter || '',
          viewedAt: view.viewedAt
        };
      }
      
      // Возвращаем базовую информацию, если не нашли студента
      return {
        _id: viewedUserId,
        firstName: 'Неизвестный',
        lastName: 'Студент',
        viewedAt: view.viewedAt
      };
    });
    
    // Получаем массив ID студентов, просмотревших материал
    const viewedIds = viewedByStudents.map(student => 
      typeof student._id === 'string' ? student._id : String(student._id)
    );
    
    // Создаем массив студентов, не просмотревших материал
    const notViewedStudents = allStudents
      .filter(student => !viewedIds.includes(typeof student._id === 'string' ? student._id : String(student._id)))
      .map(student => ({
        _id: student._id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        grade: student.grade || '',
        gradeLetter: student.gradeLetter || ''
      }));
    
    // Формируем итоговый объект прогресса
    return {
      totalStudents: allStudents.length,
      viewedByCount: viewedByStudents.length,
      viewedByStudents,
      notViewedStudents
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Получаем данные о материале
        const materialRes = await getMaterialById(groupId, materialId);
        if (!materialRes || !materialRes.data) {
          console.error('Invalid material response:', materialRes);
          throw new Error('Материал туралы ақпарат алу мүмкін болмады');
        }
        setMaterial(materialRes.data);
        
        // Получаем информацию о группе для получения списка всех студентов
        try {
          const groupRes = await getGroupById(groupId);
          console.log('Group response:', groupRes);
          
          if (!groupRes || !groupRes.data) {
            throw new Error('Топ туралы ақпарат алу мүмкін болмады');
          }
          
          setGroup(groupRes.data);
          
          // Создаем объект прогресса на основе данных материала и группы
          const progressData = buildProgressFromMaterial(materialRes.data, groupRes.data);
          if (!progressData) {
            throw new Error('Прогресс деректерін құру мүмкін болмады');
          }
          
          console.log('Generated progress data:', progressData);
          setProgress(progressData);
        } catch (groupError) {
          console.error('Error fetching group:', groupError);
          throw new Error('Топ ақпаратын жүктеу кезінде қате: ' + groupError.message);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Материал прогресін жүктеу кезінде қате пайда болды');
      } finally {
        setLoading(false);
      }
    };

    if (groupId && materialId) {
      fetchData();
    }
  }, [groupId, materialId]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Ешқашан';
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('kk-KZ', options);
  };

  // If user is not a teacher, redirect
  if (user?.role !== 'teacher') {
    return (
      <div className="error-container">
        <p className="error-message">Бұл бетке тек оқытушылар кіре алады</p>
        <Link to={`/groups/${groupId}/materials`} className="back-link">
          Материалдар тізіміне оралу
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Прогрес жүктелуде...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <Link to={`/groups/${groupId}/materials`} className="back-link">
          Материалдар тізіміне оралу
        </Link>
      </div>
    );
  }

  if (!material || !progress) {
    return (
      <div className="error-container">
        <p className="error-message">Материал немесе прогрес туралы ақпарат табылмады</p>
        <Link to={`/groups/${groupId}/materials`} className="back-link">
          Материалдар тізіміне оралу
        </Link>
      </div>
    );
  }

  // Calculate overall progress percentage
  const viewedCount = progress.viewedByStudents?.length || 0;
  const totalStudents = progress.totalStudents || 1;
  const progressPercentage = Math.round((viewedCount / totalStudents) * 100);

  // Функция для генерации случайных задержек для анимации
  const getRandomDelay = () => {
    return Math.random() * 0.5;
  };

  return (
    <div className="material-progress-container">
      <div className="page-header">
        <h1 className="page-title">Материал прогресі: {material.title}</h1>
        <Link to={`/groups/${groupId}/materials/${materialId}`} className="back-button">
          <i className="fas fa-arrow-left"></i> Материалға оралу
        </Link>
      </div>

      <div className="progress-overview">
        <div className="progress-card">
          <h3>Жалпы прогрес</h3>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{backgroundColor: "#b2dfdb"}}>
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%`, backgroundColor: "#00796b" }}
              ></div>
            </div>
            <div className="progress-value"  style={{color: "#00796b"}}>{progressPercentage}%</div>
          </div>
          
          {/* Интерактивная визуализация прогресса */}
          <div className="modern-chart-container">
            <div className="chart-title">Материалды қарау статистикасы</div>
            
            {totalStudents > 0 ? (
              <div className="interactive-chart">
                <div className="chart-data">
                  <div className="chart-percentage" style={{color: "#00796b"}}>{progressPercentage}<span>%</span></div>
                  <div className="chart-label">студенттер қарады</div>
                </div>
                
                <div className="donut-chart-wrapper">
                  <div className="donut-chart" style={{ 
                    background: `conic-gradient(
                      #4caf50 0% ${progressPercentage}%, 
                      #ff9800 ${progressPercentage}% 100%
                    )`
                  }}>
                    <div className="chart-center"></div>
                  </div>
                </div>
                
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#4caf50' }}></div>
                    <div className="legend-text" >Оқыған: {viewedCount}</div>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#ff9800' }}></div>
                    <div className="legend-text">Оқымаған: {totalStudents - viewedCount}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data-message">Деректер жоқ</div>
            )}
            
            {/* Визуализация студентов */}
            <div className="students-visualization">
              <div className="students-grid">
                {progress.viewedByStudents && progress.viewedByStudents.map((student, index) => (
                  <div 
                    key={student._id} 
                    className="student-icon viewed" 
                    style={{ animationDelay: `${getRandomDelay()}s` }}
                    title={`${student.firstName} ${student.lastName} - Оқылды`}
                  >
                    <i className="fas fa-user-graduate"></i>
                  </div>
                ))}
                
                {progress.notViewedStudents && progress.notViewedStudents.map((student, index) => (
                  <div 
                    key={student._id} 
                    className="student-icon not-viewed"
                    style={{ animationDelay: `${getRandomDelay()}s` }}
                    title={`${student.firstName} ${student.lastName} - Оқылмаған`}
                  >
                    <i className="fas fa-user"></i>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="progress-stats">
            <div className="stat">
              <i className="fas fa-users" style={{color: "#00796b"}}></i>
              <span>Барлық оқушылар: {totalStudents}</span>
            </div>
            <div className="stat">
              <i className="fas fa-eye" style={{color: "#00796b"}}></i>
              <span>Оқыған оқушылар: {viewedCount}</span>
            </div>
            <div className="stat">
              <i className="fas fa-eye-slash" style={{color: "#00796b"}}></i>
              <span>Оқымаған оқушылар: {totalStudents - viewedCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="students-progress-section">
        <h2>Оқушылар бойынша прогрес</h2>
        
        {progress.viewedByStudents && progress.viewedByStudents.length > 0 ? (
          <>
            <h3>Оқыған оқушылар ({progress.viewedByStudents.length})</h3>
            <div className="students-progress-list viewed">
              {progress.viewedByStudents.map(student => (
                <div key={student._id} className="student-progress-card viewed">
                  <div className="student-info">
                    <h4>{student.firstName} {student.lastName}</h4>
                    <p className="student-grade">{student.grade}{student.gradeLetter} сынып</p>
                  </div>
                  <div className="viewed-info">
                    <div className="viewed-at">
                      <i className="far fa-clock"></i>
                      <span>Оқыған уақыты: {formatDate(student.viewedAt)}</span>
                    </div>
                    <div className="viewed-status">
                      <i className="fas fa-check-circle"></i>
                      <span>Оқылды</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Әлі ешқандай оқушы бұл материалды оқыған жоқ</p>
          </div>
        )}
        
        {progress.notViewedStudents && progress.notViewedStudents.length > 0 && (
          <>
            <h3>Оқымаған оқушылар ({progress.notViewedStudents.length})</h3>
            <div className="students-progress-list not-viewed">
              {progress.notViewedStudents.map(student => (
                <div key={student._id} className="student-progress-card not-viewed">
                  <div className="student-info">
                    <h4>{student.firstName} {student.lastName}</h4>
                    <p className="student-grade">{student.grade}{student.gradeLetter} сынып</p>
                  </div>
                  <div className="viewed-info">
                    <div className="viewed-status">
                      <i className="fas fa-times-circle"></i>
                      <span>Оқылмаған</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MaterialProgress; 