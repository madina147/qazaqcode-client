import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const ChatInput = ({ onSendMessage, onSendFile }) => {
  const [message, setMessage] = useState('');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      await onSendMessage(message);
      // Хабарлама сәтті жіберілгеннен кейін енгізу өрісін тазалау
      setMessage('');
    } catch (error) {
      console.error('Хабарлама жіберу кезінде қате:', error);
    }
  };
  
  const insertFormatting = (formatType) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    let newText = message;
    
    switch (formatType) {
      case 'bold':
        newText = message.substring(0, start) + `**${selectedText || 'қалың мәтін'}**` + message.substring(end);
        break;
      case 'italic':
        newText = message.substring(0, start) + `*${selectedText || 'көлбеу мәтін'}*` + message.substring(end);
        break;
      case 'code':
        newText = message.substring(0, start) + `\`${selectedText || 'код'}\`` + message.substring(end);
        break;
      case 'codeblock':
        newText = message.substring(0, start) + `\n\`\`\`python\n${selectedText || '# Сіздің Python кодыңыз осында'}\n\`\`\`\n` + message.substring(end);
        break;
      case 'question':
        newText = message.substring(0, start) + `❓ ${selectedText || 'Сіздің сұрағыңыз осында'}` + message.substring(end);
        break;
      default:
        break;
    }
    
    setMessage(newText);
    setShowFormatMenu(false);
    
    // Пішімдеу енгізілгеннен кейін текст аймағына фокус қою
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = start + (newText.length - message.length);
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Python файлы екенін тексеру
    if (!file.name.endsWith('.py')) {
      alert('Тек Python файлдары (.py) рұқсат етілген');
      return;
    }
    
    // Файл өлшемін тексеру (макс 1MB)
    if (file.size > 1024 * 1024) {
      alert('Файл тым үлкен. Максималды өлшем: 1MB');
      return;
    }
    
    setIsUploading(true);
    
    // Ата компоненттің файл жүктеу өңдеушісін шақыру
    onSendFile(file)
      .finally(() => {
        setIsUploading(false);
        // Файл енгізуді қалпына келтіру
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
  };
  
  return (
    <div className="chat-input-container" style={{marginTop: '12px'}}>
      <div className="format-toolbar">
        <button 
          type="button" 
          className="format-toggle-button"
          onClick={() => setShowFormatMenu(!showFormatMenu)}
          aria-label="Пішімдеу опциялары"
        > 
          <span className="format-icon">A</span>
        </button>
        
        <input
          type="file"
          accept=".py"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="file-input"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="file-upload-button" disabled={isUploading}>
          {isUploading ? 'Жүктелуде...' : 'Файл тіркеу'}
        </label>
        
        {showFormatMenu && (
          <div className="format-menu">
            <button type="button" onClick={() => insertFormatting('bold')}>
              <strong>B</strong> Қалың
            </button>
            <button type="button" onClick={() => insertFormatting('italic')}>
              <em>I</em> Көлбеу
            </button>
            <button type="button" onClick={() => insertFormatting('code')}>
              <code>{`<>`}</code> Код
            </button>
            <button type="button" onClick={() => insertFormatting('codeblock')}>
              <code>{`{}`}</code> Код блогы
            </button>
            <button type="button" onClick={() => insertFormatting('question')}>
              <span className="question-icon">❓</span> Сұрақ
            </button>
          </div>
        )}
      </div>
      
      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Хабарламаңызды жазыңыз..."
          rows="3"
          onKeyDown={(e) => {
            // Ctrl+Enter немесе Command+Enter арқылы хабарлама жіберу
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              handleSubmit(e);
            }
          }}
        />
        <button 
          type="submit" 
          className="send-button" 
          disabled={!message.trim() || isUploading}
        >
          Жіберу
        </button>
      </form>
    </div>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onSendFile: PropTypes.func.isRequired
};

export default ChatInput; 