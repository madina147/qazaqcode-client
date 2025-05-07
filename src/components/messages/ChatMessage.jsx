import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css'; // Dark theme for code
import 'prismjs/components/prism-python'; // Python language support

const ChatMessage = ({ message }) => {
  const { user } = useAuth();
  const codeRef = useRef(null);
  
  // Check if the message is from the current user
  const isOwnMessage = message.sender._id === user._id;
  
  // Format timestamp to a readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('kk-KZ', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  };

  // Process message content to handle code blocks and formatting
  const processMessageContent = () => {
    if (!message.content) return '';
    
    // If it's a file attachment, handle differently
    if (message.fileUrl) {
      return (
        <div className="file-attachment">
          <a href={`https://34.34.73.209${message.fileUrl}`} target="_blank" rel="noopener noreferrer" className="file-link">
            <i className="file-icon">📄</i>
            <span className="file-name">{message.fileName || 'python-file.py'}</span>
          </a>
          <a href={message.fileUrl} download className="download-button">
            Жүктеу
          </a>
        </div>
      );
    }

    // Check if content contains code blocks (```python ... ```)
    if (message.content.includes('```python')) {
      const parts = message.content.split(/```python|```/);
      return parts.map((part, index) => {
        // Even indices are regular text, odd indices are code
        if (index % 2 === 0) {
          return <p key={index} className="message-text">{formatText(part)}</p>;
        } else {
          return (
            <pre key={index} className="code-block">
              <code ref={codeRef} className="language-python">{part.trim()}</code>
            </pre>
          );
        }
      });
    }
    
    // Handle inline code with single backticks
    if (message.content.includes('`')) {
      return formatText(message.content);
    }
    
    // Regular text
    return formatText(message.content);
  };
  
  // Format text for bold, italic, etc.
  const formatText = (text) => {
    if (!text) return '';
    
    // Handle question formatting
    let formattedText = text;
    if (text.startsWith('❓')) {
      formattedText = `<span class="question-format">${text}</span>`;
    }
    
    // Replace inline code with styled spans
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Replace **bold** with <strong>
    formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Replace *italic* with <em>
    formattedText = formattedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Return as HTML
    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };
  
  // Apply syntax highlighting after render
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [message.content]);
  
  return (
    <div className={`message ${isOwnMessage ? 'own-message' : ''} ${message.fileUrl ? 'file-message' : ''} ${message.messageType === 'question' ? 'question-message' : ''} ${message.isTemp ? 'temp-message' : ''}`}>
      <div className="message-header">
        <span className="sender-name">
          {message.sender.firstName} {message.sender.lastName}
        </span>
        <span className="sender-role">
          {message.sender.role === 'teacher' ? 'Оқытушы' : 'Оқушы'}
        </span>
        {message.messageType === 'question' && (
          <span className="message-type-badge">
            Сұрақ
          </span>
        )}
        {message.isTemp ? (
          <span className="message-pending">Жіберілуде...</span>
        ) : (
          <span className="message-time">{formatTimestamp(message.createdAt)}</span>
        )}
      </div>
      <div className="message-content">
        {processMessageContent()}
      </div>
    </div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    content: PropTypes.string,
    fileUrl: PropTypes.string,
    fileName: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    sender: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
};

export default ChatMessage; 