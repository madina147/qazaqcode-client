import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getAllMaterials, getAllMaterialsProgress, getGroupById, deleteMaterial } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './MaterialsStyles.scss';

const MaterialsList = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [group, setGroup] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isTeacher = user?.role === 'teacher';

  const fetchMaterials = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Получаем информацию о группе
      try {
        const groupRes = await getGroupById(groupId);
        if (groupRes && groupRes.data) {
          setGroup(groupRes.data);
          console.log('Group data:', groupRes.data);
        }
      } catch (groupErr) {
        console.error('Error fetching group data:', groupErr);
        // Не показываем основную ошибку для проблем с группой
      }
      
      // Получаем материалы
      const response = await getAllMaterials(groupId);
      
      if (response && response.data) {
        console.log('Materials fetched successfully:', response.data);
        setMaterials(response.data);

        // If user is a teacher, fetch progress data
        if (isTeacher) {
          try {
            const progressRes = await getAllMaterialsProgress(groupId);
            if (progressRes && progressRes.data) {
              setProgress(progressRes.data);
            }
          } catch (progressErr) {
            console.error('Error fetching progress data:', progressErr);
            // Don't set main error for progress issues
          }
        }
      } else {
        console.error('Invalid response format:', response);
        setError('Қате жауап форматы');
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Материалдарды жүктеу кезінде қате пайда болды');
    } finally {
      setLoading(false);
    }
  }, [groupId, isTeacher]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Calculates the percentage of students who have viewed the material
  const calculateProgress = (material) => {
    try {
      // Проверяем, есть ли материал и поле viewedBy
      if (!material || !material.viewedBy) return 0;
      
      // Получаем количество просмотревших студентов
      const viewedCount = Array.isArray(material.viewedBy) ? material.viewedBy.length : 0;
      
      // Получаем общее количество студентов в группе
      let totalStudents = 0;
      
      // Используем данные из API прогресса если они есть
      if (progress && progress[material._id] && progress[material._id].totalStudents) {
        totalStudents = progress[material._id].totalStudents;
      } 
      // Иначе используем данные группы, если они есть
      else if (group && Array.isArray(group.students)) {
        totalStudents = group.students.length;
      } 
      // Если ничего нет, то хотя бы не делим на ноль
      else {
        totalStudents = Math.max(viewedCount, 1);
      }
      
      if (totalStudents === 0) return 0;
      
      // Вычисляем процент
      return Math.round((viewedCount / totalStudents) * 100);
    } catch (err) {
      console.error('Error calculating progress for material:', material?._id, err);
      return 0;
    }
  };

  // Check if a material is marked as viewed by the current user
  const isViewedByUser = (material) => {
    if (!user || !material || !material.viewedBy) return false;
    
    // Handle different possible structures of viewedBy
    if (Array.isArray(material.viewedBy)) {
      return material.viewedBy.some(view => {
        if (typeof view === 'object' && view !== null) {
          return view.userId === user._id || view.userId?._id === user._id;
        }
        return view === user._id;
      });
    }
    
    return false;
  };

  const handleCreateMaterial = () => {
    navigate(`/groups/${groupId}/materials/create`);
  };

  const handleRetry = () => {
    fetchMaterials();
  };

  const handleDeleteMaterial = async (materialId, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!confirm("Материалды шынымен жойғыңыз келе ме?")) {
      return;
    }
    
    try {
      setDeleting(true);
      await deleteMaterial(groupId, materialId);
      // Обновляем список материалов после удаления
      setMaterials(prev => prev.filter(m => m._id !== materialId));
    } catch (err) {
      console.error("Error deleting material:", err);
      alert("Материалды жою кезінде қате пайда болды");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Материалдар жүктелуде...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={handleRetry} className="retry-button">
          <i className="fas fa-sync-alt"></i> Қайталап көру
        </button>
      </div>
    );
  }

  return (
    <div className="materials-list-container">
      {/* {isTeacher && (
        <div className="teacher-actions teacher-actions-top">
          <button className="create-material-button" onClick={handleCreateMaterial}>
            <i className="fas fa-plus-circle"></i> Жаңа материал құру
          </button>
        </div>
      )} */}
      
      <div className="page-header">
        <h1 className="page-title">Оқу материалдары</h1>
        <Link to={`/groups/${groupId}`} className="back-button">
          <i className="fas fa-arrow-left"></i> Топқа оралу
        </Link>
      </div>

      {!materials || materials.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-book empty-icon"></i>
          <h2>Материалдар табылмады</h2>
          <p>Бұл топта әлі оқу материалдары жоқ.</p>
          {isTeacher && (
            <button onClick={handleCreateMaterial} className="create-first-material">
              Бірінші материал құру
            </button>
          )}
        </div>
      ) : (
        <div className="materials-grid">
          {materials.map((material) => (
            <div key={material._id} className="material-card">
              {isTeacher && (
                <button 
                  className="delete-material-button" 
                  onClick={(e) => handleDeleteMaterial(material._id, e)}
                  disabled={deleting}
                  title="Материалды жою"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
              <Link to={`/groups/${groupId}/materials/${material._id}`} className="material-link">
                <h3 className="material-title" style={{color: '#00796b'}}>{material.title || 'Атаусыз материал'}</h3>
                <div className="material-preview">
                  {material.content ? `${material.content.substring(0, 150)}...` : 'Мазмұн жоқ'}
                </div>
                
                <div className="material-meta">
                  <div className="created-at">
                    <i className="far fa-calendar-alt"></i>
                    {material.createdAt ? new Date(material.createdAt).toLocaleDateString('kk-KZ') : 'Белгісіз күн'}
                  </div>
                  
                  {isTeacher && (
                    <div className="progress-indicator">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${calculateProgress(material)}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {calculateProgress(material)}% оқыды
                      </span>
                    </div>
                  )}
                  
                  {!isTeacher && isViewedByUser(material) && (
                    <div className="viewed-badge">
                      <i className="fas fa-check-circle"></i> Оқылған
                    </div>
                  )}
                </div>
              </Link>
              
              {isTeacher && (
                <div className="material-actions">
                  <Link to={`/groups/${groupId}/materials/${material._id}/edit`} className="edit-button" style={{color: 'white'}}>
                    <i className="fas fa-edit"></i> Өңдеу
                  </Link>
                  <Link to={`/groups/${groupId}/materials/${material._id}/progress`} className="progress-button">
                    <i className="fas fa-chart-line"></i> Прогресс
                  </Link>
                </div>
              )}
              
              {!isTeacher && (
                <div className="material-actions">
                  <Link to={`/groups/${groupId}/materials/${material._id}`} className="view-button">
                    <i className="fas fa-book-open"></i> Оқу
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialsList; 