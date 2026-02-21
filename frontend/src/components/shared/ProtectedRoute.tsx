import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  requiredRole?: string;
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
