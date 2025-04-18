import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createMaterial, getMaterialById, updateMaterial } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './MaterialsStyles.scss';

const CreateMaterial = () => {
  const { groupId, materialId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!materialId;
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    codeBlocks: [{ code: '', language: 'python' }],
    videoUrl: '',
    videoFile: null
  });
  
  // Preview states
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Fetch material data if in edit mode
  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setLoading(true);
        const { data } = await getMaterialById(groupId, materialId);
        
        setFormData({
          title: data.title || '',
          content: data.content || '',
          codeBlocks: data.codeBlocks && data.codeBlocks.length > 0 
            ? data.codeBlocks 
            : [{ code: '', language: 'python' }],
          videoUrl: data.videoUrl || '',
          videoFile: null
        });
        
        if (data.videoUrl) {
          setPreviewUrl(data.videoUrl);
        }
      } catch (err) {
        console.error('Error fetching material:', err);
        setError('Материалды жүктеу кезінде қате пайда болды');
      } finally {
        setLoading(false);
      }
    };
    
    if (isEditMode) {
      fetchMaterial();
    }
  }, [groupId, materialId, isEditMode]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle code block changes
  const handleCodeBlockChange = (index, field, value) => {
    setFormData(prev => {
      const newCodeBlocks = [...prev.codeBlocks];
      newCodeBlocks[index] = {
        ...newCodeBlocks[index],
        [field]: value
      };
      return {
        ...prev,
        codeBlocks: newCodeBlocks
      };
    });
  };
  
  // Add a new code block
  const addCodeBlock = () => {
    setFormData(prev => ({
      ...prev,
      codeBlocks: [...prev.codeBlocks, { code: '', language: 'python' }]
    }));
  };
  
  // Remove a code block
  const removeCodeBlock = (index) => {
    setFormData(prev => {
      const newCodeBlocks = prev.codeBlocks.filter((_, i) => i !== index);
      return {
        ...prev,
        codeBlocks: newCodeBlocks.length ? newCodeBlocks : [{ code: '', language: 'python' }]
      };
    });
  };
  
  // Handle video file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        videoFile: file
      }));
      
      // Create a preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      setError('Тақырып өрісі міндетті');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Мазмұн өрісі міндетті');
      return;
    }
    
    // Filter out empty code blocks
    const filteredCodeBlocks = formData.codeBlocks.filter(block => block.code.trim());
    
    try {
      setSubmitting(true);
      setError('');
      
      const materialToSubmit = {
        ...formData,
        codeBlocks: filteredCodeBlocks
      };
      
      if (isEditMode) {
        await updateMaterial(groupId, materialId, materialToSubmit);
      } else {
        await createMaterial(groupId, materialToSubmit);
      }
      
      // Redirect back to materials list
      navigate(`/groups/${groupId}/materials`);
    } catch (err) {
      console.error('Error submitting material:', err);
      setError('Материалды сақтау кезінде қате пайда болды');
    } finally {
      setSubmitting(false);
    }
  };
  
  // If not a teacher, don't allow access
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
        <p>Материал жүктелуде...</p>
      </div>
    );
  }
  
  return (
    <div className="create-material-container">
      <div className="page-header">
        <h1 className="page-title">
          {isEditMode ? 'Материалды өңдеу' : 'Жаңа материал құру'}
        </h1>
        <Link to={`/groups/${groupId}/materials`} className="back-button">
          <i className="fas fa-arrow-left"></i> Материалдар тізіміне оралу
        </Link>
      </div>
      
      {error && (
        <div className="error-message form-error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="material-form">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="title">Тақырып аты</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Мысалы: Python тілінде айнымалылар"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Мазмұны</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Материалдың мазмұнын енгізіңіз..."
              rows="10"
              required
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Код блоктары</h3>
          <p className="section-description">
            Материалға қатысты код үлгілерін қосыңыз
          </p>
          
          {formData.codeBlocks.map((block, index) => (
            <div key={index} className="code-block-entry">
              <div className="code-block-header">
                <div className="language-selector">
                  <label htmlFor={`language-${index}`}>Тіл:</label>
                  <select
                    id={`language-${index}`}
                    value={block.language}
                    onChange={(e) => handleCodeBlockChange(index, 'language', e.target.value)}
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                  </select>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeCodeBlock(index)}
                  className="remove-code-block"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <textarea
                className="code-input"
                value={block.code}
                onChange={(e) => handleCodeBlockChange(index, 'code', e.target.value)}
                placeholder="Код үлгісін енгізіңіз..."
                rows="6"
              ></textarea>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addCodeBlock}
            className="add-code-block"
          >
            <i className="fas fa-plus"></i> Код блогын қосу
          </button>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Видео</h3>
          <p className="section-description">
            Материалға видео қосыңыз (YouTube сілтемесі немесе видео файлы)
          </p>
          
          <div className="form-group">
            <label htmlFor="videoUrl">YouTube бейне сілтемесі</label>
            <input
              type="url"
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="Мысалы: https://www.youtube.com/watch?v=..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="videoFile">Немесе видео файлын жүктеңіз</label>
            <input
              type="file"
              id="videoFile"
              name="videoFile"
              onChange={handleFileChange}
              accept="video/*"
              className="file-input"
            />
            <div className="file-input-label">
              <i className="fas fa-upload"></i>
              <span>Видео файлын таңдаңыз</span>
            </div>
          </div>
          
          {previewUrl && (
            <div className="video-preview">
              <h4>Видео алдын-ала қарау</h4>
              {formData.videoUrl && formData.videoUrl.includes('youtube.com') ? (
                <iframe
                  width="100%"
                  height="315"
                  src={formData.videoUrl.replace('watch?v=', 'embed/')}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  controls
                  width="100%"
                  src={previewUrl}
                ></video>
              )}
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}/materials`)}
            className="cancel-button"
            disabled={submitting}
          >
            Бас тарту
          </button>
          
          <button
            type="submit"
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="button-spinner"></div>
                {isEditMode ? 'Сақталуда...' : 'Құрылуда...'}
              </>
            ) : (
              isEditMode ? 'Сақтау' : 'Құру'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMaterial; 