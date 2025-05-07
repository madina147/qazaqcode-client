import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { createAssignment, getGroupById } from '../../services/api';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import './AssignmentModules.scss';

const CreateAssignment = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    attachments: []
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const response = await getGroupById(groupId);
        setGroup(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching group:', err);
        setError('Топты жүктеу кезінде қате пайда болды');
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

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
    
    // Валидация
    if (!formData.title.trim() || !formData.description.trim() || !formData.deadline) {
      setError('Барлық міндетті өрістерді толтырыңыз');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await createAssignment(groupId, formData);
      
      // Перенаправление на страницу заданий группы после успешного создания
      navigate(`/groups/${groupId}/assignments`);
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err.response?.data?.message || 'Тапсырма құру кезінде қате пайда болды');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="qazaq-assignments loading">Жүктелуде...</div>;
  }

  // Установка минимальной даты для дедлайна (сегодня)
  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="qazaq-assignments">
      <div className="assignment-container create-assignment">
        <Link to={`/groups/${groupId}/assignments`} className="back-link">
          Тапсырмалар тізіміне оралу
        </Link>
        
        <div className="header">
          <h1>Жаңа тапсырма құру</h1>
          <p className="group-info">Топ: {group?.name}</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="assignment-form">
          <div className="form-group">
            <label htmlFor="title">Тапсырма атауы*</label>
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
            <label htmlFor="description">Тапсырма сипаттамасы*</label>
            <div className="markdown-guide">
              <h4>Форматтау көмекші:</h4>
              <p style={{color: 'black'}}>Тапсырма сипаттамасын форматтау үшін, төмендегі мысалдарды қолданыңыз:</p>
              <div className="code-guide">
                <h5>Python кодын форматтау:</h5>
                <pre>```python<br/>def hello_world():<br/>    print("Hello, world!")<br/>    return True<br/>```</pre>
                
               
                
                <h5>Басқа форматтау опциялары:</h5>
                <ul style={{color: 'black', marginLeft: '20px', marginBottom: '20px'}}>
                  <li><strong>Жирный текст</strong>: **жирный текст**</li>
                  <li><em>Курсив</em>: *курсив*</li>
                  <li>Тізім: - элемент 1, - элемент 2</li>
                </ul>
              </div>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Тапсырманың толық сипаттамасын енгізіңіз. Код блоктарын форматтау үшін ```python  ``` тегін қолданыңыз."
              rows={8}
              required
            />
          </div>
          
          <div className="qazaq-assignments preview-container">
            <div className="preview-toggle">
              <button 
                type="button"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Алдын ала қарауды жасыру' : 'Алдын ала қарауды көрсету'}
              </button>
            </div>
            
            {showPreview && (
              <div className="preview-content">
                <div className="preview-header">
                  <h4>Сипаттама алдын ала қарау</h4>
                  <button 
                    type="button"
                    onClick={() => setShowPreview(false)}
                  >
                    Жасыру
                  </button>
                </div>
                <div className="preview-body">
                  {formData.description ? (
                    <MarkdownRenderer content={formData.description} />
                  ) : (
                    <div className="empty-preview">
                      <p>Сипаттама енгізіңіз.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="deadline">Тапсыру мерзімі*</label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={(e) => {
                handleChange({
                  target: {
                    name: 'deadline',
                    value: e.target.value
                  }
                });
              }}
              min={today}
              required
              step="60" // Force minutes only, no seconds
            />
          </div>
          <div className="form-group">
            <label htmlFor="attachments">Қосымша файлдар</label>
            <div className="file-input-container">
              <input
                type="file"
                id="attachments"
                onChange={handleFileChange}
                multiple
                className="file-input"
              />
              
              {formData.attachments.length > 0 && (
                <div className="selected-files">
                  <h4>Таңдалған файлдар:</h4>
                  <ul className="file-list">
                    {formData.attachments.map((file, idx) => (
                      <li key={idx} className="file-item">
                        {file.name}
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="remove-button"
                        >
                          ✖
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/groups/${groupId}/assignments`)}
              className="btn-secondary"
              disabled={submitting}
            >
              Бас тарту
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Құрылуда...' : 'Тапсырманы құру'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignment;