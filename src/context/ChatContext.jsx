import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import { getMessages } from '../services/api';
import { useAuth } from '../context/AuthContext';

// API URL for uploads
const API_URL = 'https://34.34.73.209/api';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = useAuth();
  const { user } = auth;
  const token = localStorage.getItem('token');

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    // Connect to the server
    const newSocket = io(import.meta.env.VITE_API_URL || 'https://34.34.73.209', {
      auth: {
        token
      }
    }); 

    // Socket event handlers 
    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError('Connection error. Please try again.');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    // Handle new messages from the server
    newSocket.on('newMessage', (message) => {
      setMessages((prevMessages) => {
        // Check if this message replaces a temporary message
        const hasTempMessage = prevMessages.some(msg => 
          msg.isTemp && msg.sender._id === message.sender._id && 
          msg.content === message.content);
          
        if (hasTempMessage) {
          // Replace the temporary message with the real one
          return prevMessages.map(msg => 
            (msg.isTemp && msg.sender._id === message.sender._id && 
             msg.content === message.content) ? message : msg
          );
        }
        
        // Otherwise add as a new message
        return [...prevMessages, message];
      });
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [token]);

  // Fetch messages from the server
  const refreshMessages = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://34.34.73.209'}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessageHandler = async (content) => {
    if (!socket || !user) return;
    
    try {
      // Create a temporary message object for immediate display
      const tempMessage = {
        _id: Date.now().toString(), // Temporary ID
        sender: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        content,
        createdAt: new Date().toISOString(),
        isTemp: true // Flag to identify temporary messages
      };
      
      // Add to local state immediately
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Emit message to server
      socket.emit('sendMessage', { content });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  // Send a file
  const sendFile = async (file) => {
    if (!socket || !token || !user) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Create a temporary message for immediate display
      const tempFileMessage = {
        _id: Date.now().toString(),
        sender: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        content: `Uploading file: ${file.name}...`,
        createdAt: new Date().toISOString(),
        isTemp: true
      };
      
      // Add to local state immediately
      setMessages(prevMessages => [...prevMessages, tempFileMessage]);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://34.34.73.209'}/api/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('File upload failed');
      }
      
      const data = await response.json();
      
      // Remove the temporary message
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== tempFileMessage._id)
      );
      
      // Notify socket about the new file message
      socket.emit('fileUploaded', { messageId: data._id });
      
      // We don't need to emit another message since the server already creates one
      // The uploadFile controller already creates a message record with file info
      // socket.emit('sendMessage', {
      //   content: `Shared file: ${file.name}`,
      //   fileUrl: data.fileUrl,
      //   type: 'file'
      // });
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    }
  };

  const value = {
    messages,
    loading,
    error,
    sendMessage: sendMessageHandler,
    sendFile,
    refreshMessages,
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext; 