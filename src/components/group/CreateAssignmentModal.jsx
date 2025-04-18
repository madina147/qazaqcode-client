import { useState } from 'react';
import { useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './GroupStyles.scss';

const CreateAssignmentModal = ({ onClose, onSubmit, groupId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    attachments: []
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };
  
  const removeAttachment = (index) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      attachments: newAttachments
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Тапсырма атауын енгізіңіз');
      return;
    }
    
    if (!formData.deadline) {
      setError('Тапсырма мерзімін белгілеңіз');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Pass the form data to parent component for API call
      await onSubmit(formData);
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError('Тапсырманы құру кезінде қате пайда болды');
      setLoading(false);
    }
  };
  
  // Установка минимальной даты для дедлайна (сегодня)
  const today = new Date().toISOString().slice(0, 16);
  
  return (
    <div className="modal-overlay">
      <div className="modal-content assignment-modal">
        <div className="modal-header">
          <h2>Тапсырма құру</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Тапсырма атауы</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Мысалы: Python тапсырмалары"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Сипаттама</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Тапсырманың толық сипаттамасын енгізіңіз"
                rows={4}
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
                min={today}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="attachments">Файлдар қосу (қосымша)</label>
              <input
                type="file"
                id="attachments"
                multiple
                onChange={handleFileChange}
                className="file-input"
              />
              
              {formData.attachments.length > 0 && (
                <div className="attachments-list">
                  <h4>Таңдалған файлдар:</h4>
                  <ul>
                    {formData.attachments.map((file, index) => (
                      <li key={index} className="attachment-item">
                        <span>{file.name}</span>
                        <button
                          type="button"
                          className="remove-attachment"
                          onClick={() => removeAttachment(index)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn" onClick={onClose} disabled={loading}>
                Бас тарту
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Жасалуда...' : 'Тапсырманы құру'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentModal; 