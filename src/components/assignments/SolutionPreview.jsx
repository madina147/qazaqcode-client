import React, { useState } from 'react';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import './AssignmentModules.scss';

/**
 * SolutionPreview component for previewing markdown solution as user types
 * 
 * @param {Object} props - Component props
 * @param {string} props.solution - Current solution text to preview
 * @returns {React.ReactElement} Solution preview component
 */
const SolutionPreview = ({ solution }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  
  return (
    <div className="qazaq-assignments preview-container">
      {!previewVisible ? (
        <div className="preview-toggle">
          <button 
            onClick={() => setPreviewVisible(true)}
            type="button"
          >
            Алдын ала қарау көрсету
          </button>
        </div>
      ) : (
        <div className="preview-content">
          <div className="preview-header">
            <h4>Алдын ала қарау</h4>
            <button 
              onClick={() => setPreviewVisible(false)}
              type="button"
            >
              Жасыру
            </button>
          </div>
          
          {!solution.trim() ? (
            <div className="empty-preview">
              <p>Шешімді енгізіңіз.</p>
            </div>
          ) : (
            <div className="preview-body">
              <MarkdownRenderer content={solution} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SolutionPreview; 