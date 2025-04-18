import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, registerTeacher, registerStudent } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      setUser(userData);
      // Если токен отсутствует, но есть информация о пользователе,
      // восстановим токен из пользовательских данных
      if (!localStorage.getItem('token') && userData.token) {
        localStorage.setItem('token', userData.token);
      }
    }
    setLoading(false);
  }, []);

  const login = async (login, password) => {
    try {
      setLoading(true);
      const { data } = await loginApi(login, password);
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      setUser(data);
      navigate(data.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to login'
      };
    } finally {
      setLoading(false);
    }
  };

  const registerStudentUser = async (userData) => {
    try {
      setLoading(true);
      const studentData = {...userData, role: 'student'};
      const { data } = await registerStudent(studentData);
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      setUser(data);
      navigate('/dashboard/student');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to register'
      };
    } finally {
      setLoading(false);
    }
  };

  const registerTeacherUser = async (userData) => {
    try {
      setLoading(true);
      const teacherData = {...userData, role: 'teacher'};
      const { data } = await registerTeacher(teacherData);
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      setUser(data);
      navigate('/dashboard/teacher');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to register'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        registerStudentUser,
        registerTeacherUser,
        isAuthenticated: !!user,
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;