import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Services
export const registerStudent = (studentData) => {
  return api.post('/users/register/student', studentData);
};

export const registerTeacher = (teacherData) => {
  return api.post('/users/register/teacher', teacherData);
};

export const login = (credentials) => {
  return api.post('/users/login', credentials);
};

export const forgotPassword = (data) => {
  return api.post('/users/forgot-password', data);
};

export const getUserProfile = () => {
  return api.get('/users/profile');
};

export const updateUserProfile = (data) => {
  return api.put('/users/profile', data);
};

// Group Services
export const createGroup = (groupData) => {
  return api.post('/groups', groupData);
};

export const getTeacherGroups = () => {
  return api.get('/groups');
};

export const getStudentGroups = () => {
  return api.get('/groups/student');
};

export const getGroupDetails = (groupId) => {
  return api.get(`/groups/${groupId}`);
};

export const addStudentToGroup = (groupId, studentId) => {
  return api.post(`/groups/${groupId}/students`, { studentId });
};

export const removeStudentFromGroup = (groupId, studentId) => {
  return api.delete(`/groups/${groupId}/students/${studentId}`);
};

// Lesson Services
export const getLessons = () => {
  return api.get('/lessons');
};

export const getLessonById = (lessonId) => {
  return api.get(`/lessons/${lessonId}`);
};

export const completeLesson = (lessonId) => {
  return api.post(`/lessons/${lessonId}/complete`);
};

// Test Services
export const getTestByLessonId = (lessonId) => {
  return api.get(`/tests/lesson/${lessonId}`);
};

export const submitTest = (testId, answers) => {
  return api.post(`/tests/${testId}/submit`, { answers });
};

// Task Services
export const getTasksByTestId = (testId) => {
  return api.get(`/tasks/test/${testId}`);
};

export const getTaskById = (taskId) => {
  return api.get(`/tasks/${taskId}`);
};

export const submitSolution = (taskId, solution, timeSpent) => {
  return api.post(`/tasks/${taskId}/submit`, { solution, timeSpent });
};

// Message Services
export const getMessages = () => {
  return api.get('/messages');
};

export const sendMessage = (content) => {
  return api.post('/messages', { content });
};

export const blockMessage = (messageId) => {
  return api.put(`/messages/${messageId}/block`);
};

export default api;