import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTeacherGroups, deleteGroup } from '../../services/api';
import '../dashboard/Dashboard.scss';

const GroupsList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const { data } = await getTeacherGroups();
        // Сортируем группы, чтобы новые были сверху
        const sortedGroups = data.sort((a, b) => {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        setGroups(sortedGroups);
      } catch (err) {
        setError('Топтар тізімін жүктеу кезінде қате пайда болды');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Бұл топты шынымен жойғыңыз келе ме?')) {
      try {
        await deleteGroup(groupId);
        setGroups(groups.filter(g => g._id !== groupId));
        setSuccessMessage('Топ сәтті жойылды');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Топты жою кезінде қате пайда болды');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Жүктелуде...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Барлық топтар</h1>
        <Link to="/dashboard/teacher" className="edit-button">
          Артқа қайту
        </Link>
      </div>
      
      {error && <div className="dashboard-error">{error}</div>}
      {successMessage && <div className="dashboard-success">{successMessage}</div>}
      
      <div className="dashboard-content">
        <div className="groups-section" style={{ gridColumn: 'span 12' }}>
          <div className="section-header">
            <h2>Менің топтарым ({groups.length})</h2>
            <Link to="/groups/create" className="create-button">
              Топ құру
            </Link>
          </div>
          
          {groups.length > 0 ? (
            <div className="groups-list">
              {groups.map((group) => (
                <div key={group._id} className="group-card-container">
                  <Link to={`/groups/${group._id}`} className="group-card">
                    <h3>{group.name}</h3>
                    <p className="group-description">{group.description}</p>
                    <p className="group-students">
                      Оқушылар: {group.students?.length || 0}
                    </p>
                  </Link>
                  <button 
                    onClick={() => handleDeleteGroup(group._id)}
                    className="delete-group-button"
                    title="Топты жою"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">
              Сізде әзірше құрылған топтар жоқ. Оқушыларды қосу үшін жаңа топ құрыңыз.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsList; 