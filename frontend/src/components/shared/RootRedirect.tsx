import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function RootRedirect() {
  const { isAuthenticated } = useAuthStore();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}
