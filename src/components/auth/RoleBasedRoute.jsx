import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';

/**
 * A component that restricts routes based on user roles.
 * If the user doesn't have the required role, they will be redirected to an appropriate dashboard.
 */
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, this component shouldn't be responsible for that check
  // That should be handled by the ProtectedRoute component
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check if user role is in the allowed roles
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'teacher') {
      return <Navigate to="/dashboard/teacher" replace />;
    } else if (user.role === 'student') {
      return <Navigate to="/dashboard/student" replace />;
    } else {
      // Fallback for unexpected roles
      return <Navigate to="/" replace />;
    }
  }

  // If user has correct role, render the content
  return children;
};

RoleBasedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default RoleBasedRoute; 