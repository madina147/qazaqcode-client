import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, registerStudent, registerTeacher } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (login, password) => {
    try {
      setLoading(true);
      const { data } = await loginApi({ login, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
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
      const { data } = await registerStudent(userData);
      localStorage.setItem('userInfo', JSON.stringify(data));
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
      const { data } = await registerTeacher(userData);
      localStorage.setItem('userInfo', JSON.stringify(data));
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

export default AuthContext;