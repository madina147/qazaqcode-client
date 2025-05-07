import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import { getGroupAssignments, getGroupById } from '../../services/api';
import './AssignmentModules.scss';

// Аварийная функция для получения заданий напрямую
const fetchAssignmentsDirectly = async (groupId) => {
  console.log('Emergency direct API call for assignments');
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await axios.get(`${API_URL}/api/groups/${groupId}/assignments-public`);
    
    if (response.data && response.data.assignments) {
      return response.data.assignments;
    }
    return [];
  } catch (error) {
    console.error('Emergency direct fetch failed:', error);
    throw error;
  }
};

// Аварийная функция для получения данных о группе напрямую
const fetchGroupDirectly = async (groupId) => {
  console.log('Emergency direct API call for group info');
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await axios.get(`${API_URL}/api/groups/${groupId}`);
    
    if (response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Emergency direct group fetch failed:', error);
    return null; // Return null instead of throwing to prevent breaking assignments display
  }
};

const AssignmentList = () => {
  const params = useParams();
  const groupId = params.groupId || params.id;
  
  console.log('URL params:', params);
  console.log('Using groupId:', groupId);
  
  const { user } = useAuth();
  console.log('Current user:', user);
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(true);

  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(groupId);
  console.log('Is valid ObjectId:', isValidObjectId, groupId);

  // Separate useEffect for group data
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId || !isValidObjectId) {
        setGroupLoading(false);
        return;
      }
      
      try {
        console.log(`Fetching group data for ID: ${groupId}`);
        setGroupLoading(true);
        
        // First try the regular API
        try {
          const groupResponse = await getGroupById(groupId);
          if (groupResponse && groupResponse.data) {
            console.log('Group data loaded successfully:', groupResponse.data.name);
            setGroup(groupResponse.data);
            setGroupLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Regular group API failed, trying direct fetch');
        }
        
        // If regular API fails, try direct fetch
        const directGroupData = await fetchGroupDirectly(groupId);
        if (directGroupData) {
          console.log('Direct group fetch successful');
          setGroup(directGroupData);
        } else {
          console.warn('Failed to load group data');
        }
        
      } catch (err) {
        console.error('Error fetching group data:', err);
      } finally {
        setGroupLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId, isValidObjectId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!groupId || !isValidObjectId) {
        setError('Invalid group ID');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Сначала пробуем загрузить через обычный API
        console.log(`Fetching assignments for group: ${groupId}`);
        const assignmentsResponse = await getGroupAssignments(groupId);
        
        if (assignmentsResponse.data && assignmentsResponse.data.length >= 0) {
          console.log('Assignments loaded successfully:', assignmentsResponse.data.length);
          setAssignments(assignmentsResponse.data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Regular API failed, trying emergency fetch:', err);
        
        // Если API не сработал, пробуем прямой запрос
        try {
          const directAssignments = await fetchAssignmentsDirectly(groupId);
          console.log('Direct assignments fetch successful:', directAssignments.length);
          setAssignments(directAssignments);
          setLoading(false);
          return;
        } catch (directError) {
          console.error('All assignment fetching methods failed');
          setError('Тапсырмаларды жүктеу мүмкін болмады. Кейінірек қайталап көріңіз.');
        }
      }
      
      setLoading(false);
    };

    fetchData();
  }, [groupId, isValidObjectId]);

  // Enhanced date formatting function with relative time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const formattedDate = new Intl.DateTimeFormat('kk-KZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
    
    // Add relative time indication
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let relativeText = '';
    if (diffTime < 0) {
      relativeText = ' (Мерзімі өтіп кетті)';
    } else if (diffDays === 0) {
      relativeText = ' (Бүгін)';
    } else if (diffDays === 1) {
      relativeText = ' (Ертең)';
    } else if (diffDays <= 3) {
      relativeText = ` (${diffDays} күн қалды)`;
    }
    
    return { formattedDate, relativeText };
  };

  const getDeadlineClass = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0) return 'overdue';
    if (diffDays <= 2) return 'approaching';
    return '';
  };

  // Helper function to get group name safely
  const getGroupName = () => {
    if (groupLoading) {
      return <span className="loading-indicator" title="Топ аты жүктелуде"></span>;
    }
    
    if (group && group.name) {
      return group.name;
    }
    
    // Extract from URL path as fallback
    const urlParts = window.location.pathname.split('/');
    const groupIndex = urlParts.findIndex(part => part === 'groups');
    if (groupIndex !== -1 && urlParts[groupIndex + 1]) {
      // Try to find cached group name in localStorage
      const cachedGroups = localStorage.getItem('qazaqcode_groups');
      if (cachedGroups) {
        try {
          const groups = JSON.parse(cachedGroups);
          const foundGroup = groups.find(g => g.id === urlParts[groupIndex + 1] || g._id === urlParts[groupIndex + 1]);
          if (foundGroup && foundGroup.name) {
            return foundGroup.name;
          }
        } catch (e) {
          console.error('Error parsing cached groups', e);
        }
      }
    }
    
    return 'Топ';
  };

  if (loading) {
    return <div className="qazaq-assignments loading">Жүктелуде...</div>;
  }

  if (error) {
    return <div className="qazaq-assignments error-message">{error}</div>;
  }

  return (
    <div className="qazaq-assignments">
      <div className="assignment-container assignments-list-container">
        <Link to={`/groups/${groupId}`} className="back-link">
          Топқа оралу
        </Link>
        
        <div className="header">
          <h1>Тапсырмалар</h1>
          
          {user?.role === 'teacher' && (
            <Link to={`/groups/${groupId}/assignments/create`} className="create-button">
              Жаңа тапсырма құру
            </Link>
          )}
        </div>
        
        <p className="group-info">Топ: {getGroupName()}</p>
        
        {assignments.length > 0 ? (
          <div className="assignments-grid">
            {assignments.map(assignment => {
              const { formattedDate, relativeText } = formatDate(assignment.deadline);
              return (
                <div key={assignment._id} className="assignment-card">
                  <div className="card-body">
                    <h2 className="card-title">
                      <Link to={`/groups/${groupId}/assignments/${assignment._id}`}>
                        {assignment.title}
                      </Link>
                    </h2>
                    
                    <div className="card-meta">
                      <span className={`deadline ${getDeadlineClass(assignment.deadline)}`}>
                        {formattedDate}
                        <span className="relative-time">{relativeText}</span>
                      </span>
                    </div>
                    
                    <div className="card-description">
                      {assignment.description.replace(/```[\s\S]*?```/g, '[Код блогы]').length > 150 
                        ? `${assignment.description.replace(/```[\s\S]*?```/g, '[Код блогы]').substring(0, 150)}...` 
                        : assignment.description.replace(/```[\s\S]*?```/g, '[Код блогы]')}
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    {user?.role === 'student' && (
                      <div className="action-buttons">
                        <Link to={`/groups/${groupId}/assignments/${assignment._id}`} className="action-button">
                          Толық қарау
                        </Link>
                        <Link to={`/groups/${groupId}/assignments/${assignment._id}/submit`} className="action-button primary">
                          Тапсыру
                        </Link>
                      </div>
                    )}
                    
                    {user?.role === 'teacher' && (
                      <div className="action-buttons">
                        <Link to={`/groups/${groupId}/assignments/${assignment._id}`} className="action-button">
                          Толық қарау
                        </Link>
                        <Link to={`/groups/${groupId}/assignments/${assignment._id}/submissions`} className="action-button">
                          Шешімдер
                        </Link>
                        <Link to={`/groups/${groupId}/assignments/${assignment._id}/edit`} className="action-button">
                          Өңдеу
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-assignments">
            <p>Бұл топта тапсырмалар жоқ</p>
            {user?.role === 'teacher' && (
              <Link to={`/groups/${groupId}/assignments/create`} className="create-button">
                Тапсырма құру
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentList; 