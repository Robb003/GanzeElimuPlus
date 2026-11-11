import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../Context/useAuth';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, loading, user } = useAuth();

  // Wait until the saved session has been checked
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking your session...</p>
      </div>
    );
  }

  // Redirect users who are not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Prevent users from accessing routes for other roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // Display the protected page
  return <Outlet />;
}
