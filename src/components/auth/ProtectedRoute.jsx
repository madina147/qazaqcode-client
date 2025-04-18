import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';

/**
 * A component that protects routes from unauthenticated users.
 * If the user is not authenticated, they will be redirected to the login page.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // If still loading auth state, return null or a loading indicator
  if (loading) {
    return <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>;
  }

  // If not authenticated, redirect to login with the return url
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If authenticated, render the protected content
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute; 