import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import StudentRegister from './components/auth/StudentRegister';
import TeacherRegister from './components/auth/TeacherRegister';
import ForgotPassword from './components/auth/ForgotPassword';
import StudentDashboard from './components/dashboard/StudentDashboard';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import './App.scss';

// Protected route component
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to={`/dashboard/${user.role}`} />;
  }
  
  return children;
};

// App wrapper to use auth context
const AppWithAuth = () => {
  return (
    <>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/student" element={<StudentRegister />} />
          <Route path="/register/teacher" element={<TeacherRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route 
            path="/dashboard/student" 
            element={
              <ProtectedRoute roleRequired="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard/teacher" 
            element={
              <ProtectedRoute roleRequired="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Add other routes here */}
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </Router>
  );
}

export default App;