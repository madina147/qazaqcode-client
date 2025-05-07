import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://34.34.73.209';

// Helper functions
export const getToken = () => {
  return localStorage.getItem('token');
};

export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in cross-origin requests
  timeout: 30000, // 30 second timeout
  maxContentLength: 100 * 1024 * 1024, // 100MB
  maxBodyLength: 100 * 1024 * 1024, // 100MB
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API request failed:', error.config?.url);
    return Promise.reject(error);
  }
);

// Authentication
export const login = (login, password) => {
  return api.post('/api/users/login', { login, password });
};

export const register = (userData) => {
  const endpoint = userData.role === 'teacher' 
    ? '/api/users/register/teacher' 
    : '/api/users/register/student';
  return api.post(endpoint, userData);
};

export const registerTeacher = (userData) => {
  return api.post('/api/users/register/teacher', userData);
};

export const registerStudent = (userData) => {
  return api.post('/api/users/register/student', userData);
};

export const forgotPassword = (login) => {
  return api.post('/api/users/forgot-password', { login });
};

// Chat Messages
export const getMessages = () => {
  return api.get('/api/messages');
};

export const sendMessage = (content) => {
  return api.post('/api/messages', { content });
};

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/api/messages/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// User Profile
export const getUserProfile = () => {
  return api.get('/api/users/profile');
};

export const updateUserProfile = (userData) => {
  return api.put('/api/users/profile', userData);
};

// Groups
export const getGroups = () => {
  return api.get('/api/groups');
};

export const getStudentGroups = () => {
  return api.get('/api/groups/student');
};

export const getTeacherGroups = () => {
  return api.get('/api/groups');
};

export const getGroupById = (id) => {
  if (!id || id === 'undefined') {
    return Promise.reject(new Error('Invalid group ID'));
  }
  return api.get(`/api/groups/${id}`);
};

export const createGroup = (groupData) => {
  return api.post('/api/groups', groupData);
};

export const updateGroup = (id, groupData) => {
  return api.put(`/api/groups/${id}`, groupData);
};

export const deleteGroup = (id) => {
  // Проверка валидности аргумента
  if (!id || id === 'undefined') {
    return Promise.reject(new Error('Invalid group ID'));
  }
  
  return api.delete(`/api/groups/${id}`)
    .catch(error => {
      console.error('Error in deleteGroup:', error);
      throw error;
    });
};

// Group Students
export const addStudentToGroup = (groupId, studentId) => {
  // Проверка валидности аргументов
  if (!groupId || !studentId) {
    return Promise.reject(new Error('Invalid group ID or student ID'));
  }
  
  return api.post(`/api/groups/${groupId}/students`, { studentId })
    .catch(error => {
      console.error('Error in addStudentToGroup:', error);
      throw error;
    });
};

export const removeStudentFromGroup = (groupId, studentId) => {
  // Проверка валидности аргументов
  if (!groupId || !studentId) {
    return Promise.reject(new Error('Invalid group ID or student ID'));
  }
  
  return api.delete(`/api/groups/${groupId}/students/${studentId}`)
    .catch(error => {
      console.error('Error in removeStudentFromGroup:', error);
      throw error;
    });
};

export const getAvailableStudents = () => {
  return api.get('/api/users/students/available');
};

// Assignments
export const createAssignment = (groupId, assignmentData) => {
  const formData = new FormData();
  
  // Add assignment details to form data
  formData.append('title', assignmentData.title);
  formData.append('description', assignmentData.description);
  formData.append('deadline', assignmentData.deadline);
  
  // Add attachment files if any
  if (assignmentData.attachments && assignmentData.attachments.length > 0) {
    assignmentData.attachments.forEach((file, index) => {
      formData.append('attachments', file);
    });
  }
  
  return api.post(`/api/groups/${groupId}/assignments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getGroupAssignments = (groupId) => {
  console.log(`API call: getGroupAssignments for group ${groupId}`);
  
  // Проверка на валидный ID
  if (!groupId || groupId === 'undefined') {
    console.error('Invalid groupId provided to getGroupAssignments');
    return Promise.reject(new Error('Invalid group ID'));
  }
  
  // Проверка на валидный MongoDB ObjectId
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(groupId);
  if (!isValidObjectId) {
    console.error('Invalid ObjectId format in getGroupAssignments');
    return Promise.reject(new Error('Invalid group ID format'));
  }
  
  // Прямой запрос к публичному API без дополнительных обработок и перенаправлений
  console.log(`Making direct request to assignments-public endpoint for group ${groupId}`);
  
  return api.get(`/api/groups/${groupId}/assignments-public`, {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Client-Version': '1.0'
    }
  })
  .then(response => {
    console.log('Assignment public API response received:', {
      status: response.status,
      hasData: !!response.data,
      dataType: typeof response.data
    });
    
    // Проверяем, что в ответе есть assignments
    if (response.data && response.data.assignments && Array.isArray(response.data.assignments)) {
      console.log(`Found ${response.data.assignments.length} assignments`);
      return { data: response.data.assignments };
    }
    
    // Если нет assignments или они не массив, возвращаем пустой массив
    console.warn('Response does not contain assignments array');
    return { data: [] };
  })
  .catch(error => {
    console.error(`Error fetching assignments for group ${groupId}:`, error);
    
    if (error.response) {
      console.error('Server response error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: JSON.stringify(error.response.headers)
      });
    } else if (error.request) {
      console.error('No response received. Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      });
    }
    
    throw error;
  });
};

// Added API functions for submissions
export const getAssignment = (assignmentId, groupId = null) => {
  if (!assignmentId) {
    return Promise.reject(new Error('Invalid assignment ID'));
  }
  
  // Create a function that handles retries and endpoints
  const fetchWithRetry = async (retries = 2, delay = 1000) => {
    let lastError = null;
    
    // If we have a groupId, prioritize the direct group-specific endpoint
    if (groupId) {
      try {
        console.log(`Trying to fetch assignment ${assignmentId} directly from group ${groupId}`);
        return await api.get(`/api/groups/${groupId}/assignments/${assignmentId}`);
      } catch (groupSpecificError) {
        console.error(`Failed to fetch from specific group:`, groupSpecificError);
        lastError = groupSpecificError;
        // Fall through to next approach
      }
    }
    
    // Try the direct assignment endpoint as fallback
    try {
      console.log(`Fetching assignment ${assignmentId} via direct endpoint`);
      return await api.get(`/api/assignments/${assignmentId}`);
    } catch (directError) {
      console.error(`Direct assignment fetch failed:`, directError);
      lastError = directError;
    }
    
    // If we get here, all attempts failed for this round
    if (retries <= 0) {
      console.error(`All attempts to fetch assignment ${assignmentId} failed`);
      throw lastError || new Error('Failed to fetch assignment');
    }
    
    // Wait and retry
    console.log(`Retrying assignment fetch in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(retries - 1, delay * 2);
  };
  
  return fetchWithRetry();
};

export const submitSolution = (assignmentId, solutionData, groupId = null) => {
  const formData = new FormData();
  
  // Add solution text
  formData.append('solution', solutionData.solution);
  
  // Add attachment files if any
  if (solutionData.attachments && solutionData.attachments.length > 0) {
    solutionData.attachments.forEach((file) => {
      formData.append('attachments', file);
    });
  }
  
  // Use group-specific endpoint if groupId is provided
  const endpoint = groupId 
    ? `/api/groups/${groupId}/assignments/${assignmentId}/submit`
    : `/api/assignments/${assignmentId}/submit`;
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getMySubmission = (assignmentId, groupId = null) => {
  if (groupId) {
    return api.get(`/api/groups/${groupId}/assignments/${assignmentId}/my-submission`);
  }
  return api.get(`/api/assignments/${assignmentId}/my-submission`);
};

export const getAssignmentSubmissions = (assignmentId) => {
  return api.get(`/api/assignments/${assignmentId}/submissions`);
};

export const evaluateSubmission = (submissionId, evaluationData) => {
  return api.put(`/api/assignments/submissions/${submissionId}/evaluate`, evaluationData);
};

// Tests
export const createTest = async (groupId, testData) => {
  try {
    const response = await api.post(`/api/groups/${groupId}/tests`, testData);
    return response;
  } catch (error) {
    console.error('Error creating test:', error);
    throw error;
  }
};

export const getTestById = async (groupId, testId) => {
  try {
    const response = await api.get(`/api/groups/${groupId}/tests/${testId}`);
    return response;
  } catch (error) {
    console.error('Error fetching test:', error);
    throw error;
  }
};

export const updateTest = async (groupId, testId, testData) => {
  try {
    const response = await api.put(`/api/groups/${groupId}/tests/${testId}`, testData);
    return response;
  } catch (error) {
    console.error('Error updating test:', error);
    throw error;
  }
};

export const getAllTests = async (groupId) => {
  if (!groupId || groupId === 'undefined') {
    return Promise.reject(new Error('Invalid group ID'));
  }
  try {
    const response = await api.get(`/api/groups/${groupId}/tests`);
    return response;
  } catch (error) {
    console.error('Error fetching tests:', error);
    throw error;
  }
};

export const deleteTest = async (groupId, testId) => {
  try {
    const response = await api.delete(`/api/groups/${groupId}/tests/${testId}`);
    return response;
  } catch (error) {
    console.error('Error deleting test:', error);
    throw error;
  }
};

export const submitTestAnswers = async (groupId, testId, answers, timeSpent) => {
  console.log('Отправка результатов теста:', {
    groupId,
    testId,
    answersCount: answers.length,
    timeSpent
  });
  
  // Настройки для повторных попыток
  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;
  
  // Функция для форматирования ответов
  // Убеждаемся, что ID вопросов и ответов - строки и все поля присутствуют
  const formatAnswers = (answersArray) => {
    return answersArray.map(answer => ({
      questionId: String(answer.questionId),
      optionId: String(answer.optionId)
    }));
  };
  
  // Функция для создания запроса
  const makeRequest = async () => {
    try {
      // Форматируем ответы для повышения надежности
      const formattedAnswers = formatAnswers(answers);
      
      // Добавляем опции для повышения надежности запроса
      const response = await api.post(`/api/groups/${groupId}/tests/${testId}/submit`, 
        { answers: formattedAnswers, timeSpent }, 
        { 
          // Увеличиваем таймаут для больших тестов
          timeout: 30000,
          // Отключаем кэширование для этого запроса
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Ответ сервера на отправку теста:', response.data);
      return response;
    } catch (error) {
      lastError = error;
      console.error(`Попытка ${retryCount + 1}/${maxRetries} не удалась:`, error);
      
      // Подробное логирование ошибки для диагностики
      if (error.response) {
        console.error('Ответ сервера с ошибкой:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        // Ошибка сети - нет ответа от сервера
        console.error('Нет ответа от сервера:', {
          requestUrl: error.request.responseURL,
          requestMethod: error.config?.method
        });
      }
      
      // Увеличиваем счетчик попыток
      retryCount++;
      
      // Если достигли максимального числа попыток, пробуем использовать fetch API
      if (retryCount >= maxRetries) {
        console.log('Попытка использования fetch API для финальной отправки...');
        try {
          // Форматируем ответы здесь снова, чтобы избежать ссылки на переменную из другой области видимости
          const answersForFetch = formatAnswers(answers);
          
          const fetchResponse = await fetch(`${API_URL}/api/groups/${groupId}/tests/${testId}/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            body: JSON.stringify({ answers: answersForFetch, timeSpent }),
            credentials: 'include'
          });
          
          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            console.log('Успешная отправка через fetch API:', data);
            return { data };
          } else {
            console.error('Fetch API вернул ошибку:', fetchResponse.status);
            const errorText = await fetchResponse.text();
            console.error('Текст ошибки:', errorText);
            throw new Error(`Ошибка отправки: ${fetchResponse.status} ${errorText}`);
          }
        } catch (fetchError) {
          console.error('Ошибка при использовании fetch API:', fetchError);
          throw fetchError;
        }
      }
      
      // Если не достигли максимума попыток, пауза перед следующей попыткой
      const delay = Math.pow(2, retryCount) * 1000; // Экспоненциальная задержка
      console.log(`Ожидание ${delay}мс перед следующей попыткой...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Пробуем снова
      return makeRequest();
    }
  };
  
  return makeRequest();
};

export const getTestResults = async (groupId, testId) => {
  try {
    const response = await api.get(`/api/groups/${groupId}/tests/${testId}/results`);
    return response;
  } catch (error) {
    console.error('Error fetching test results:', error);
    throw error;
  }
};

// Materials
export const getAllMaterials = async (groupId) => {
  if (!groupId || groupId === 'undefined') {
    return Promise.reject(new Error('Invalid group ID'));
  }
  try {
    const response = await api.get(`/api/groups/${groupId}/materials`);
    return response;
  } catch (error) {
    console.error('Error fetching materials:', error);
    throw error;
  }
};

export const getMaterialById = async (groupId, materialId) => {
  try {
    const response = await api.get(`/api/groups/${groupId}/materials/${materialId}`);
    return response;
  } catch (error) {
    console.error('Error fetching material:', error);
    throw error;
  }
};

export const createMaterial = async (groupId, materialData) => {
  try {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('title', materialData.title || '');
    formData.append('content', materialData.content || '');
    
    // Serialize code blocks to JSON string
    if (materialData.codeBlocks && materialData.codeBlocks.length > 0) {
      formData.append('codeBlocks', JSON.stringify(materialData.codeBlocks));
    }
    
    // Add video URL if exists
    if (materialData.videoUrl) {
      formData.append('videoUrl', materialData.videoUrl);
    }
    
    // Add video file if exists - Multer expects the raw File object
    if (materialData.videoFile) {
      formData.append('videoFile', materialData.videoFile);
    }
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000, // 3 minute timeout
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    };
    
    const response = await api.post(`/api/groups/${groupId}/materials`, formData, config);
    return response;
  } catch (error) {
    console.error('Error creating material:', error);
    throw error;
  }
};

export const updateMaterial = async (groupId, materialId, materialData) => {
  try {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('title', materialData.title || '');
    formData.append('content', materialData.content || '');
    
    // Serialize code blocks to JSON string
    if (materialData.codeBlocks && materialData.codeBlocks.length > 0) {
      formData.append('codeBlocks', JSON.stringify(materialData.codeBlocks));
    }
    
    // Add video URL if exists
    if (materialData.videoUrl) {
      formData.append('videoUrl', materialData.videoUrl);
    }
    
    // Add video file if exists - Multer expects the raw File object
    if (materialData.videoFile) {
      formData.append('videoFile', materialData.videoFile);
    }
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000, // 3 minute timeout
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    };
    
    const response = await api.put(`/api/groups/${groupId}/materials/${materialId}`, formData, config);
    return response;
  } catch (error) {
    console.error('Error updating material:', error);
    throw error;
  }
};

export const deleteMaterial = async (groupId, materialId) => {
  try {
    const response = await api.delete(`/api/groups/${groupId}/materials/${materialId}`);
    return response;
  } catch (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
};

export const markMaterialAsViewed = async (groupId, materialId) => {
  try {
    const response = await api.post(`/api/groups/${groupId}/materials/${materialId}/view`);
    return response;
  } catch (error) {
    console.error('Error marking material as viewed:', error);
    throw error;
  }
};

export const getMaterialProgress = async (groupId, materialId) => {
  try {
    console.log(`Fetching progress for material: ${materialId} in group: ${groupId}`);
    const response = await api.get(`/api/groups/${groupId}/materials/${materialId}/progress`);
    console.log('Progress API response:', response);
    return response;
  } catch (error) {
    console.error('Error getting material progress:', error);
    console.error('Error details:', error.response ? {
      status: error.response.status,
      data: error.response.data
    } : 'No response data');
    throw error;
  }
};

export const getAllMaterialsProgress = async (groupId) => {
  try {
    const response = await api.get(`/api/groups/${groupId}/materials/progress`);
    return response;
  } catch (error) {
    console.error('Error getting all materials progress:', error);
    throw error;
  }
};

// Export default api for other custom requests
export default api;