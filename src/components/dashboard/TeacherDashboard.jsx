import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getUserProfile, updateUserProfile, getTeacherGroups } from '../../services/api';
import './Dashboard.scss';

const TeacherDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    workplace: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileResponse, groupsResponse] = await Promise.all([
          getUserProfile(),
          getTeacherGroups()
        ]);
        
        setUserProfile(profileResponse.data);
        setGroups(groupsResponse.data);
        
        // Initialize form data
        setEditFormData({
          firstName: profileResponse.data.firstName,
          lastName: profileResponse.data.lastName,
          middleName: profileResponse.data.middleName || '',
          workplace: profileResponse.data.workplace,
          phoneNumber: profileResponse.data.phoneNumber,
        });
      } catch (err) {
        setError('Профиль деректерін жүктеу сәтсіз аяқталды');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset form data
      setEditFormData({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        middleName: userProfile.middleName || '',
        workplace: userProfile.workplace,
        phoneNumber: userProfile.phoneNumber,
      });
    }
    setIsEditing(!isEditing);
    setError('');
    setSuccessMessage('');
  };

  const handleInputChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    try {
      setLoading(true);
      const { data } = await updateUserProfile(editFormData);
      
      setUserProfile({
        ...userProfile,
        ...data,
      });
      
      setSuccessMessage('Профиль сәтті жаңартылды');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Профильді жаңарту сәтсіз аяқталды');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userProfile) {
    return <div className="dashboard-loading">Жүктелуде...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Менің профилім</h1>
        <button 
          className={`edit-button ${isEditing ? 'cancel' : ''}`}
          onClick={handleEditToggle}
        >
          {isEditing ? 'Бас тарту' : 'Өзгерту'}
        </button>
      </div>
      
      {error && <div className="dashboard-error">{error}</div>}
      {successMessage && <div className="dashboard-success">{successMessage}</div>}
      
      {userProfile && (
        <div className="dashboard-content">
          <div className="profile-section">
            <h2>Жеке ақпарат</h2>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="edit-form">
                <div className="form-group">
                  <label htmlFor="lastName">Тегі</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="firstName">Аты</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="middleName">Әкесінің аты</label>
                  <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={editFormData.middleName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="workplace">Жұмыс орны</label>
                  <input
                    type="text"
                    id="workplace"
                    name="workplace"
                    value={editFormData.workplace}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phoneNumber">Телефон нөмірі</label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={editFormData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Сақталуда...' : 'Сақтау'}
                </button>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">ФИО:</span>
                  <span className="info-value">
                    {userProfile.lastName} {userProfile.firstName} {userProfile.middleName || ''}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Жұмыс орны:</span>
                  <span className="info-value">{userProfile.workplace}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Телефон нөмірі:</span>
                  <span className="info-value">{userProfile.phoneNumber}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Логин:</span>
                  <span className="info-value">{userProfile.login}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="groups-section">
            <div className="section-header">
              <h2>Менің топтарым</h2>
              <Link to="/groups/create" className="create-button">
                Топ құру
              </Link>
            </div>
            
            {groups.length > 0 ? (
              <div className="groups-list">
                {groups.map((group) => (
                  <Link to={`/groups/${group._id}`} key={group._id} className="group-card">
                    <h3>{group.name}</h3>
                    <p className="group-description">{group.description}</p>
                    <p className="group-students">
                      Оқушылар: {group.students?.length || 0}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty-message">
                Сізде әзірше құрылған топтар жоқ. Оқушыларды қосу үшін жаңа топ құрыңыз.
              </p>
            )}
          </div>
          
          <div className="quick-links">
            <Link to="/ratings" className="quick-link-card quick-link-ratings">
              <h3>Оқушылардың рейтингі</h3>
              <p>Оқушылардың рейтингі мен үлгерімін қараңыз</p>
            </Link>
            <Link to="/lessons" className="quick-link-card quick-link-materials">
              <h3>Материалдар</h3>
              <p>Оқу материалдары мен тапсырмаларды қараңыз</p>
            </Link>
            <Link to="/chat" className="quick-link-card quick-link-chat">
              <h3>Чат</h3>
              <p>Оқушылармен және басқа мұғалімдермен сөйлесіңіз</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;