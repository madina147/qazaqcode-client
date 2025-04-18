import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './AssignmentStyles.scss';

const CreateAssignment = () => {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    maxPoints: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'maxPoints' ? parseInt(value, 10) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.title || !formData.description || !formData.deadline) {
      setError('Барлық міндетті өрістерді толтырыңыз');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Здесь будет API запрос для создания задания
      // Пример:
      // await createAssignment(groupId, formData);
      
      // После успешного создания задания
      navigate(`/groups/${groupId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Тапсырма құру кезінде қате пайда болды');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-assignment-container">
      <h1>Жаңа тапсырма құру</h1>
      <p className="group-info">Топ үшін: {groupId}</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="assignment-form">
        <div className="form-group">
          <label htmlFor="title">Тапсырма атауы</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Тапсырма атауын енгізіңіз"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Тапсырма сипаттамасы</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Тапсырманың толық сипаттамасын енгізіңіз"
            rows={6}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="deadline">Тапсыру мерзімі</label>
          <input
            type="datetime-local"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="maxPoints">Максималды ұпай саны</label>
          <input
            type="number"
            id="maxPoints"
            name="maxPoints"
            value={formData.maxPoints}
            onChange={handleChange}
            min={1}
            max={100}
            required
          />
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/groups/${groupId}`)}
            disabled={loading}
          >
            Бас тарту
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Құрылуда...' : 'Тапсырманы құру'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssignment; 