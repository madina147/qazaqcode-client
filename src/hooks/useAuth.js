import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    console.error('useAuth hook called outside of AuthProvider');
    return { user: null, loading: false, isAuthenticated: false };
  }
  
  console.log('Auth context:', {
    isAuthenticated: !!context.user,
    role: context.user?.role,
    userId: context.user?._id
  });
  
  return context;
};

export default useAuth;