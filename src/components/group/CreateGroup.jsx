import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createGroup } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './GroupStyles.scss';

const CreateGroup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Убираем ошибку при изменении поля
    if (error) setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Топ атауын енгізіңіз');
      return;
    }
    
    if (!formData.grade) {
      setError('Сыныпты таңдаңыз');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Set subject to Python programming by default
      const groupData = {
        ...formData,
        subject: 'Python программалау'
      };
      
      // Call API to create group
      const response = await createGroup(groupData);
      
      // Navigate to the newly created group
      navigate(`/groups/${response.data._id}`);
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.response?.data?.message || 'Топты құру кезінде қате пайда болды');
      setLoading(false);
    }
  };
  
  const grades = Array.from({ length: 11 }, (_, i) => i + 1);
  
  return (
    <div className="create-group-container">
      <div className="create-group-header">
        <h1>Жаңа топ құру</h1>
        <p className="subtitle">Жаңа топ құру арқылы оқушыларды ұйымдастырып, тапсырмалар мен тесттер беріңіз</p>
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      <div className="card form-card">
        <form className="create-group-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Топ атауы <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Мысалы: Python 9А-сынып"
              required
              className={error && !formData.name.trim() ? 'error-input' : ''}
            />
            <p className="field-help-text">Оқушылар мен пән атауын қамтитын атау берген жөн</p>
          </div>
          
          <div className="form-group">
            <label>Пән</label>
            <div className="static-field">
              <span className="subject-icon">💻</span> Python программалау
            </div>
            <p className="field-help-text">Қазіргі уақытта тек Python программалау пәні қолжетімді</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="grade">Сынып <span className="required">*</span></label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              className={error && !formData.grade ? 'error-input' : ''}
            >
              <option value="">-- Таңдаңыз --</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <p className="field-help-text">Оқушылардың сыныбын таңдаңыз</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Сипаттама</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Топ туралы қосымша ақпарат"
              rows={4}
            />
            <p className="field-help-text">Ата-аналар мен оқушылар үшін пайдалы ақпарат қосыңыз</p>
          </div>
          
          
          <div className="form-actions">
            <Link to="/dashboard/teacher" className="btn btn-secondary">
              <span className="btn-icon">←</span> Бас тарту
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Жасалуда...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">✓</span>
                  <span>Топты құру</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup; 