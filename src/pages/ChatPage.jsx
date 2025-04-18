import { useEffect, useRef, useState } from 'react';
import ChatMessage from '../components/messages/ChatMessage';
import ChatInput from '../components/messages/ChatInput';
import { useChat } from '../context/ChatContext';
import '../styles/ChatPage.scss';
import '../styles/EnhancedChat.scss';

const ChatPage = () => {
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    sendFile,
    refreshMessages 
  } = useChat();
  const messagesEndRef = useRef(null);
  const [showTips, setShowTips] = useState(false);

  // Fetch messages on component mount
  useEffect(() => {
    refreshMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleTips = () => {
    setShowTips(!showTips);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Чат</h1>
        <div className="chat-subtitle">Python үйрену ортақ чаты</div>
        <button 
          className="tips-toggle-button" 
          onClick={toggleTips}
          aria-expanded={showTips}
        >
          {showTips ? "Кеңестерді жасыру" : "Кеңестерді көрсету"}
        </button>
      </div>
      
      {error && <div className="chat-error">{error}</div>}
      
      <div className="chat-messages-container">
        {showTips && (
          <div className="python-learning-tips collapsed">
            <h2>Жылдам кеңестер</h2>
            <div className="tip-grid">
              <div className="tip">
                <h3>Код форматтау</h3>
                <p>```python</p>
              </div>
              <div className="tip">
                <h3>Сұрақтар қою</h3>
                <p>❓ Сіздің сұрағыңыз</p>
              </div>
              <div className="tip">
                <h3>Файлдармен бөлісу</h3>
                <p>📄 .py</p>
              </div>
            </div>
          </div>
        )}
        
        <div className={`chat-messages ${!showTips ? 'expanded' : ''}`}>
          {loading && messages.length === 0 ? (
            <div className="chat-loading">Жүктелуде...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">Хабарламалар жоқ</div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message._id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <ChatInput onSendMessage={sendMessage} onSendFile={sendFile}/>
    </div>
  );
};

export default ChatPage; 