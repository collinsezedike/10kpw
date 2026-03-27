import { useAuth } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router';

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (!isSignedIn) return <Navigate to="/auth" replace />;

  return <Outlet />;
}
