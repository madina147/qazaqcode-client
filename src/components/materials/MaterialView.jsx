import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMaterialById, markMaterialAsViewed } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './MaterialsStyles.scss';

// For code syntax highlighting
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MaterialView = () => {
  const { groupId, materialId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher';

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setLoading(true);
        const response = await getMaterialById(groupId, materialId);
        
        if (response && response.data) {
          console.log('Material fetched successfully:', response.data);
          setMaterial(response.data);
          
          // Mark as viewed for students automatically when they open the material
          if (user?.role === 'student') {
            const isAlreadyViewed = checkIfAlreadyViewed(response.data);
            
            if (!isAlreadyViewed) {
              try {
                await markMaterialAsViewed(groupId, materialId);
                setMarked(true);
              } catch (markErr) {
                console.error('Error marking material as viewed:', markErr);
              }
            } else {
              // Already viewed, just update UI state
              setMarked(true);
            }
          }
        } else {
          console.error('Invalid response format:', response);
          setError('Қате жауап форматы');
        }
      } catch (err) {
        console.error('Error fetching material:', err);
        setError('Материалды жүктеу кезінде қате пайда болды');
      } finally {
        setLoading(false);
      }
    };

    if (groupId && materialId) {
      fetchMaterial();
    }
  }, [groupId, materialId, user]);

  // Check if the material is already viewed by the current user
  const checkIfAlreadyViewed = (material) => {
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

  // Format creation date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('kk-KZ', options);
  };

  // Handle edit material
  const handleEdit = () => {
    navigate(`/groups/${groupId}/materials/${materialId}/edit`);
  };

  // Handle view progress (for teachers)
  const handleViewProgress = () => {
    navigate(`/groups/${groupId}/materials/${materialId}/progress`);
  };

  // Parse YouTube video ID from URL
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Материал жүктелуде...</p>
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

  if (!material) {
    return (
      <div className="error-container">
        <p className="error-message">Материал табылмады</p>
        <Link to={`/groups/${groupId}/materials`} className="back-link">
          Материалдар тізіміне оралу
        </Link>
      </div>
    );
  }

  const youtubeEmbedUrl = getYoutubeEmbedUrl(material.videoUrl);

  return (
    <div className="material-view-container">
      {isTeacher && (
        <div className="teacher-actions teacher-actions-top">
          <button onClick={handleEdit} className="edit-button">
            <i className="fas fa-edit"></i> Өңдеу
          </button>
          <button onClick={handleViewProgress} className="progress-button">
            <i className="fas fa-chart-line"></i> Оқу прогресі
          </button>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">{material.title}</h1>
        <Link to={`/groups/${groupId}/materials`} className="back-button">
          <i className="fas fa-arrow-left"></i> Материалдар тізіміне оралу
        </Link>
      </div>

      {marked && !isTeacher && (
        <div className="viewed-notification">
          <i className="fas fa-check-circle"></i> Бұл материал оқылды деп белгіленді
        </div>
      )}

      <div className="material-meta">
        <div className="created-at">
          <i className="far fa-calendar-alt"></i> {formatDate(material.createdAt)}
        </div>
      </div>

      <div className="material-content">
        {material.content ? 
          material.content.split('\n').map((paragraph, index) => (
            <p style={{color: 'black'}} key={index}>{paragraph}</p>
          ))
          : 
          <p className="no-content">Материалда мазмұн жоқ</p>
        }
      </div>

      {material.codeBlocks && Array.isArray(material.codeBlocks) && material.codeBlocks.length > 0 && (
        <div className="code-blocks-section">
          <h2>Код үлгілері</h2>
          
          {material.codeBlocks.map((block, index) => (
            <div key={index} className="code-block">
              <div className="code-block-header">
                <span className="language-badge">{block.language || 'text'}</span>
                <button 
                  className="copy-button"
                  onClick={() => {
                    if (block.code) {
                      navigator.clipboard.writeText(block.code);
                      // You could add a toast notification here
                    }
                  }}
                >
                  <i className="far fa-copy"></i> Көшіру
                </button>
              </div>
              
              <SyntaxHighlighter 
                language={block.language || 'text'} 
                style={atomDark}
                showLineNumbers={true}
                wrapLines={true}
              >
                {block.code || '// No code provided'}
              </SyntaxHighlighter>
            </div>
          ))}
        </div>
      )}

      {(material.videoUrl || material.videoPath) && (
        <div className="video-section">
          <h2>Видео</h2>
          
          {youtubeEmbedUrl ? (
            <div className="video-container youtube">
              <iframe
                width="100%"
                height="480"
                src={youtubeEmbedUrl}
                title={material.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : material.videoPath ? (
            <div className="video-container">
              {videoError ? (
                <div className="video-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>Видеоны ойнату кезінде қате пайда болды</p>
                  <button 
                    className="retry-video-button"
                    onClick={() => {
                      setVideoError(false);
                      // Force reload of the video by updating the src
                      const video = document.querySelector('video');
                      if (video) {
                        video.load();
                      }
                    }}
                  >
                    <i className="fas fa-sync-alt"></i> Қайтадан ойнатып көру
                  </button>
                </div>
              ) : (
                <video
                  controls
                  preload="metadata"
                  width="100%"
                  src={`http://34.34.73.209${material.videoPath}?t=${new Date().getTime()}`} // Add timestamp to avoid caching issues
                  onError={() => setVideoError(true)}
                ></video>
              )}
            </div>
          ) : null}
        </div>
      )}

      <div className="material-footer">
        {!isTeacher && !marked && (
          <button 
            onClick={async () => {
              try {
                await markMaterialAsViewed(groupId, materialId);
                setMarked(true);
              } catch (err) {
                console.error('Error marking material as viewed:', err);
              }
            }}
            className="mark-as-viewed-button"
          >
            <i className="fas fa-check-circle"></i> Оқылды деп белгілеу
          </button>
        )}
      </div>
    </div>
  );
};

export default MaterialView; 